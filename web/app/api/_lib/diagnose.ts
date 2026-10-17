import { createHash } from "node:crypto";
import { query } from "@/lib/db";
import { callAi } from "@/lib/ai-client";
import type { AiDiagnoseRequest, AiDiagnoseResult, DiagnoseResult, Metrics } from "@/lib/types";
import { ApiError } from "./api-error";
import { dbBoolean, dbDateOnly, parseDbJson } from "./db-values";
import { sensorColumns } from "./tasks";
import { isRecord, isValueIndex, normalizeExcludedWeights, storedValueIndex } from "./value-index";

type SavedDiagnosis = { ID: number; TITLE: string | null; PROBLEM: string | null; METRIC: string | null;
  DATA_NEEDED: string | null; VALUE_DETAIL: string | null; REPORT: string | null };
const pending = new Map<string, Promise<DiagnoseResult>>();
// 진단 계산·프롬프트 기준이 달라지면 버전을 올려 이전 결과를 재사용하지 않는다.
const cacheVersion = 1;

async function diagnosisFingerprint(datasetId: number, columns: string[], request: AiDiagnoseRequest) {
  // 원본 값은 DB 안에서 해시한다. NULL 위치·센서 순서·라벨·시각도 비교에 포함한다.
  const hashes = await query<{ ROW_HASH: string }>(
    `SELECT RAWTOHEX(STANDARD_HASH(JSON_ARRAY(row_id, ts, label, ${columns.join(", ")}
       NULL ON NULL RETURNING VARCHAR2(4000)), 'SHA256')) AS row_hash
     FROM raw_rows WHERE dataset_id = :datasetId ORDER BY row_id`, { datasetId },
  );
  const hash = createHash("sha256").update(JSON.stringify({ version: cacheVersion, datasetId, request }));
  for (const row of hashes) hash.update(row.ROW_HASH);
  return hash.digest("hex");
}

function savedDiagnosis(task: SavedDiagnosis, fingerprint: string, datasetId: number, metrics: Metrics): DiagnoseResult | null {
  try {
    const detail = parseDbJson(task.VALUE_DETAIL);
    if (!isRecord(detail) || detail._diagnosisFingerprint !== fingerprint) return null;
    const result = checkedAiResult({ ok: true, data: { valueIndex: storedValueIndex(task.VALUE_DETAIL), report: task.REPORT,
      taskCard: { title: task.TITLE, problem: task.PROBLEM, metric: task.METRIC, dataNeeded: task.DATA_NEEDED } } });
    return { datasetId, taskId: task.ID, metrics, ...result };
  } catch {
    // 불완전하거나 이전 형식인 저장 결과는 새로 진단한다.
    return null;
  }
}

type DatasetRow = {
  ID: number; CREATED_ON: Date; SUPPLY_CYCLE: string; DELIVERY_METHOD: string;
  FILE_FORMAT: string; CREDIT_GRADE: string; QUALITY_CERT: number; AGGREGATION_CYCLE: string;
};

async function datasetMetrics(datasetId: number, columns: string[]): Promise<Metrics> {
  const counts = columns.map((c, i) => `COUNT(${c}) AS C${i}`).join(", ");
  const statistics = columns.flatMap((c, i) => [`AVG(${c}) AS M${i}`, `STDDEV_POP(${c}) AS D${i}`]).join(", ");
  const outliers = columns.map((c, i) => `CASE WHEN s.D${i} > 0 AND ABS(r.${c} - s.M${i}) > 3 * s.D${i} THEN 1 ELSE 0 END`).join(" + ");
  const rows = await query<Record<string, number | Date | null>>(
    `WITH stats AS (SELECT ${statistics} FROM raw_rows WHERE dataset_id = :datasetId)
     SELECT COUNT(*) AS row_count, ${counts}, AVG(label) AS defect_rate,
       MIN(ts) AS collected_from, MAX(ts) AS collected_to,
       COUNT(CASE WHEN ${columns.map((c) => `${c} IS NOT NULL`).join(" AND ")} THEN 1 END) AS valid_count,
       SUM(${outliers}) AS outlier_count
     FROM raw_rows r CROSS JOIN stats s WHERE r.dataset_id = :datasetId`, { datasetId },
  );
  const row = rows[0];
  const count = Number(row.ROW_COUNT);
  if (!count) throw new ApiError(409, "적재된 원본 데이터가 없습니다");
  const present = columns.reduce((sum, _, i) => sum + Number(row[`C${i}`]), 0);
  const consistencyRate = present / (count * columns.length);
  const collectedFrom = dbDateOnly(row.COLLECTED_FROM), collectedTo = dbDateOnly(row.COLLECTED_TO);
  if (!collectedFrom || !collectedTo) throw new ApiError(500, "원본 수집 시각을 확인해 주세요");
  return { rowCount: count, columnCount: columns.length, missingRate: 1 - consistencyRate,
    collectedFrom, collectedTo, defectRate: Number(row.DEFECT_RATE),
    outlierRate: present ? Number(row.OUTLIER_COUNT) / present : 0,
    meaningfulColumnCount: columns.filter((_, i) => Number(row[`C${i}`]) / count > 0.7).length,
    absoluteScaleRatio: 1, consistencyRate, validRowCount: Number(row.VALID_COUNT) };
}

function checkedAiResult(value: unknown): AiDiagnoseResult {
  const bad = () => new ApiError(502, "AI 진단 응답 형식이 올바르지 않습니다");
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data)) throw bad();
  const data = value.data;
  const index = normalizeExcludedWeights(data.valueIndex);
  if (!isValueIndex(index) || typeof data.report !== "string" || !data.report.trim() || !isRecord(data.taskCard)) throw bad();
  const card = data.taskCard;
  for (const [key, limit] of [["title", 200], ["problem", 2000], ["metric", 200], ["dataNeeded", 2000]] as const) {
    const text = card[key];
    if (typeof text !== "string" || !text.trim() || [...text].length > limit) throw bad();
  }
  return { valueIndex: index, report: data.report, taskCard: {
    title: card.title as string, problem: card.problem as string,
    metric: card.metric as string, dataNeeded: card.dataNeeded as string,
  } };
}

export async function diagnose(datasetId: number): Promise<DiagnoseResult> {
  const datasets = await query<DatasetRow>(
    `SELECT id, created_on, supply_cycle, delivery_method, file_format, credit_grade, quality_cert, aggregation_cycle
     FROM datasets WHERE id = :datasetId`, { datasetId },
  );
  if (!datasets.length) throw new ApiError(404, "데이터셋을 찾을 수 없습니다");
  const dataset = datasets[0], columns = await sensorColumns("RAW_ROWS");
  const metrics = await datasetMetrics(datasetId, columns);
  const request: AiDiagnoseRequest = { metrics,
    meta: { createdOn: dbDateOnly(dataset.CREATED_ON)!, supplyCycle: dataset.SUPPLY_CYCLE,
      deliveryMethod: dataset.DELIVERY_METHOD, fileFormat: dataset.FILE_FORMAT,
      creditGrade: dataset.CREDIT_GRADE, qualityCert: dbBoolean(dataset.QUALITY_CERT), aggregationCycle: dataset.AGGREGATION_CYCLE },
    columns: [...columns.map((c) => ({ name: c.toLowerCase(), type: "number" as const })), { name: "ts", type: "date" }, { name: "label", type: "number" }] };
  const fingerprint = await diagnosisFingerprint(datasetId, columns, request);
  const tasks = await query<SavedDiagnosis>(
    `SELECT id, title, problem, metric, data_needed, value_detail, report FROM tasks WHERE dataset_id = :datasetId`, { datasetId },
  );
  if (tasks.length !== 1) throw new ApiError(500, "데이터셋의 과제 연결을 확인해 주세요");
  const saved = savedDiagnosis(tasks[0], fingerprint, datasetId, metrics);
  if (saved) return saved;
  const existing = pending.get(fingerprint);
  if (existing) return existing;
  const work = generateDiagnosis(datasetId, tasks[0].ID, metrics, request, fingerprint);
  pending.set(fingerprint, work);
  try { return await work; }
  finally { if (pending.get(fingerprint) === work) pending.delete(fingerprint); }
}

async function generateDiagnosis(datasetId: number, taskId: number, metrics: Metrics,
  request: AiDiagnoseRequest, fingerprint: string): Promise<DiagnoseResult> {
  let result: AiDiagnoseResult;
  try {
    result = checkedAiResult(await callAi<unknown>("/diagnose", request));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "AI 진단 서비스에 연결할 수 없습니다. 다시 시도해 주세요");
  }
  // 검증된 AI 응답을 받은 뒤 한 문장으로 저장한다. 실패 응답은 기존 상태를 바꾸지 않는다.
  await query(
    `UPDATE tasks SET title = :title, problem = :problem, metric = :metric, data_needed = :dataNeeded,
     value_index = :valueIndex, value_detail = :detail, metrics = :metrics, report = :report WHERE id = :taskId`,
    { taskId, ...result.taskCard, valueIndex: result.valueIndex.score,
      detail: JSON.stringify({ ...result.valueIndex, _diagnosisFingerprint: fingerprint }), metrics: JSON.stringify(metrics), report: result.report },
  );
  return { datasetId, taskId, metrics, ...result };
}
