import { query } from "@/lib/db";
import type { TaskDetailFactory, TaskDetailStartup, TaskSummary, Metrics, SynthLevel, TaskStatus } from "@/lib/types";
import type { RequestActor } from "./actor";
import { ApiError } from "./api-error";
import { parseDbJson, dbDateTime } from "./db-values";
import { storedValueIndex, summaryValueIndex } from "./value-index";

export type TaskRow = {
  ID: number; DATASET_ID: number; TITLE: string | null; PROBLEM: string | null;
  METRIC: string | null; DATA_NEEDED: string | null; VALUE_INDEX: number | null;
  VALUE_DETAIL: string | null; METRICS: string | null; REPORT: string | null;
  SYNTH_LEVEL: SynthLevel; BLOCK_INDUSTRY: string | null; STATUS: TaskStatus;
};

// 센서 식별자는 사용자 입력이 아닌 Oracle 사전에서만 가져온다.
export async function sensorColumns(table: "RAW_ROWS" | "SYNTH_ROWS"): Promise<string[]> {
  const rows = await query<{ COLUMN_NAME: string }>(
    `SELECT column_name FROM user_tab_columns
     WHERE table_name = :tableName AND data_type = 'NUMBER' ORDER BY column_id`,
    { tableName: table },
  );
  const columns = rows.map((r) => r.COLUMN_NAME).filter((c) => /^S_\d+$/.test(c));
  if (!columns.length) throw new ApiError(500, "센서 컬럼을 확인할 수 없습니다");
  return columns;
}

export async function loadTask(id: number, actor: RequestActor): Promise<TaskRow> {
  const rows = await query<TaskRow>(
    `SELECT t.* FROM tasks t WHERE t.id = :id
     AND (:isFactory = 1 OR (t.status = 'published' AND EXISTS (
       SELECT 1 FROM vendors v WHERE v.id = :vendorId
       AND (t.block_industry IS NULL OR v.industry <> t.block_industry))))`,
    { id, isFactory: actor.role === "factory" ? 1 : 0, vendorId: actor.vendorId ?? null },
  );
  if (!rows.length) throw new ApiError(404, "과제를 찾을 수 없습니다");
  return rows[0];
}

export async function listTasks(actor: RequestActor): Promise<TaskSummary[]> {
  const rows = await query<TaskRow & { ROW_COUNT: number }>(
    `SELECT t.*, (SELECT COUNT(*) FROM raw_rows r WHERE r.dataset_id = t.dataset_id) AS row_count
     FROM tasks t JOIN vendors v ON v.id = :vendorId WHERE t.status = 'published'
     AND (t.block_industry IS NULL OR t.block_industry <> v.industry) ORDER BY t.id DESC`,
    { vendorId: actor.vendorId! },
  );
  return rows.map((t) => ({ id: t.ID, title: t.TITLE!, problem: t.PROBLEM!, metric: t.METRIC!,
    dataNeeded: t.DATA_NEEDED!, rowCount: t.ROW_COUNT, synthLevel: t.SYNTH_LEVEL,
    valueIndex: summaryValueIndex(storedValueIndex(t.VALUE_DETAIL)) }));
}

async function distributions(datasetId: number, columns: string[]): Promise<TaskDetailStartup["distributions"]> {
  return Promise.all(columns.slice(0, 2).map(async (column) => {
    const rows = await query<{ BUCKET: number; LOW_VALUE: number; HIGH_VALUE: number; RAW_COUNT: number; SYNTH_COUNT: number; RAW_TOTAL: number; SYNTH_TOTAL: number }>(
      `WITH values_union AS (
         SELECT ${column} AS value, 0 AS kind FROM raw_rows WHERE dataset_id = :datasetId AND ${column} IS NOT NULL
         UNION ALL SELECT ${column}, 1 FROM synth_rows WHERE dataset_id = :datasetId AND ${column} IS NOT NULL
       ), limits AS (SELECT MIN(value) AS lo, MAX(value) AS hi FROM values_union),
       buckets AS (SELECT kind, lo, hi,
         CASE WHEN lo = hi THEN 1 ELSE LEAST(5, WIDTH_BUCKET(value, lo, hi, 5)) END AS bucket
         FROM values_union CROSS JOIN limits)
       SELECT bucket, MIN(lo) AS low_value, MAX(hi) AS high_value,
         SUM(CASE WHEN kind = 0 THEN 1 ELSE 0 END) AS raw_count,
         SUM(CASE WHEN kind = 1 THEN 1 ELSE 0 END) AS synth_count,
         SUM(SUM(CASE WHEN kind = 0 THEN 1 ELSE 0 END)) OVER () AS raw_total,
         SUM(SUM(CASE WHEN kind = 1 THEN 1 ELSE 0 END)) OVER () AS synth_total
       FROM buckets GROUP BY bucket ORDER BY bucket`, { datasetId },
    );
    return { column: column.toLowerCase(), bins: rows.map((r) => {
      const step = (r.HIGH_VALUE - r.LOW_VALUE) / 5;
      const low = r.LOW_VALUE + step * (r.BUCKET - 1), high = r.LOW_VALUE + step * r.BUCKET;
      return { label: `${low.toFixed(2)}~${high.toFixed(2)}`, rawShare: r.RAW_TOTAL ? r.RAW_COUNT / r.RAW_TOTAL : 0, synthShare: r.SYNTH_TOTAL ? r.SYNTH_COUNT / r.SYNTH_TOTAL : 0 };
    }) };
  }));
}

export async function taskDetail(task: TaskRow, actor: RequestActor): Promise<TaskDetailFactory | TaskDetailStartup> {
  const common = { id: task.ID, title: task.TITLE, problem: task.PROBLEM, metric: task.METRIC,
    dataNeeded: task.DATA_NEEDED, status: task.STATUS, synthLevel: task.SYNTH_LEVEL, blockIndustry: task.BLOCK_INDUSTRY };
  if (actor.role === "factory") return { ...common, datasetId: task.DATASET_ID,
    metrics: parseDbJson(task.METRICS) as Metrics | null,
    valueIndex: task.VALUE_DETAIL === null ? null : storedValueIndex(task.VALUE_DETAIL), report: task.REPORT };

  const columns = (await sensorColumns("SYNTH_ROWS")).slice(0, 3);
  const preview = await query<Record<string, number | null>>(
    `SELECT ${columns.join(", ")}, label FROM synth_rows WHERE dataset_id = :datasetId ORDER BY row_id FETCH FIRST 10 ROWS ONLY`,
    { datasetId: task.DATASET_ID },
  );
  const submissions = await query<{ ACCURACY: number; RECALL: number; FPR: number; CREATED_AT: Date }>(
    `SELECT accuracy, recall, fpr, FROM_TZ(created_at, DBTIMEZONE) AS created_at FROM submissions WHERE task_id = :taskId AND vendor_id = :vendorId
     ORDER BY created_at DESC, id DESC FETCH FIRST 1 ROW ONLY`, { taskId: task.ID, vendorId: actor.vendorId },
  );
  const sub = submissions[0];
  return { ...common, valueIndex: summaryValueIndex(storedValueIndex(task.VALUE_DETAIL)),
    synthPreview: { columns: [...columns.map((c) => c.toLowerCase()), "label"], rows: preview.map((r) => [...columns.map((c) => r[c]), r.LABEL]) },
    distributions: await distributions(task.DATASET_ID, columns),
    mySubmission: sub ? { accuracy: sub.ACCURACY, recall: sub.RECALL, fpr: sub.FPR, createdAt: dbDateTime(sub.CREATED_AT)! } : null };
}
