import { query } from "@/lib/db";
import type { LeaderboardRow, Submission, DealStatus } from "@/lib/types";
import { ApiError } from "./api-error";
import { dbBoolean, dbDateTime } from "./db-values";

export async function submit(taskId: number, vendorId: number): Promise<Submission> {
  const counts = await query<{ RAW_COUNT: number; PREDICTION_COUNT: number; POSITIVES: number }>(
    `SELECT (SELECT COUNT(*) FROM raw_rows r JOIN tasks t ON t.dataset_id = r.dataset_id WHERE t.id = :taskId) AS raw_count,
       (SELECT COUNT(*) FROM predictions WHERE task_id = :taskId AND vendor_id = :vendorId) AS prediction_count,
       (SELECT COUNT(CASE WHEN r.label = 1 THEN 1 END) FROM raw_rows r JOIN tasks t ON t.dataset_id = r.dataset_id WHERE t.id = :taskId) AS positives
     FROM dual`, { taskId, vendorId },
  );
  const count = counts[0];
  if (!count.PREDICTION_COUNT || count.PREDICTION_COUNT !== count.RAW_COUNT) throw new ApiError(400, "이 업체의 전체 예측값이 준비되지 않았습니다");
  if (!count.POSITIVES || count.POSITIVES === count.RAW_COUNT) throw new ApiError(400, "정상·불량 라벨이 모두 있어야 채점할 수 있습니다");
  const identities = await query<{ SEQUENCE_NAME: string }>(
    "SELECT sequence_name FROM user_tab_identity_cols WHERE table_name = 'SUBMISSIONS' AND column_name = 'ID'",
  );
  const sequence = identities[0]?.SEQUENCE_NAME;
  if (!sequence || !/^ISEQ\$\$_\d+$/.test(sequence)) throw new ApiError(500, "제출 ID 시퀀스를 확인할 수 없습니다");
  // INSERT SELECT 자체에서 채점한다. 삽입 ID와 조회 결과는 같은 DB 연결에서 반환한다.
  const rows = await query<{ ID: number; ACCURACY: number; RECALL: number; FPR: number; CREATED_AT: Date }>(
    `DECLARE v_id NUMBER; v_rows SYS_REFCURSOR;
     BEGIN
       INSERT INTO submissions (task_id, vendor_id, accuracy, recall, fpr)
       SELECT :taskId, :vendorId,
         AVG(CASE WHEN p.predicted = r.label THEN 1 ELSE 0 END),
         SUM(CASE WHEN r.label = 1 AND p.predicted = 1 THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN r.label = 1 THEN 1 ELSE 0 END), 0),
         SUM(CASE WHEN r.label = 0 AND p.predicted = 1 THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN r.label = 0 THEN 1 ELSE 0 END), 0)
       FROM predictions p JOIN tasks t ON t.id = p.task_id
       JOIN raw_rows r ON r.dataset_id = t.dataset_id AND r.row_id = p.row_id
       WHERE p.task_id = :taskId AND p.vendor_id = :vendorId
       HAVING COUNT(*) = (SELECT COUNT(*) FROM raw_rows rr JOIN tasks tt ON tt.dataset_id = rr.dataset_id WHERE tt.id = :taskId)
         AND COUNT(*) > 0;
       IF SQL%ROWCOUNT <> 1 THEN RAISE_APPLICATION_ERROR(-20001, 'Incomplete predictions'); END IF;
       SELECT "${sequence}".CURRVAL INTO v_id FROM dual;
       OPEN v_rows FOR SELECT id, accuracy, recall, fpr, FROM_TZ(created_at, DBTIMEZONE) AS created_at FROM submissions WHERE id = v_id;
       DBMS_SQL.RETURN_RESULT(v_rows);
     END;`, { taskId, vendorId },
  );
  const row = rows[0];
  if (!row) throw new ApiError(500, "제출 결과를 확인할 수 없습니다");
  return { submissionId: row.ID, accuracy: row.ACCURACY, recall: row.RECALL, fpr: row.FPR, createdAt: dbDateTime(row.CREATED_AT)! };
}

export async function leaderboard(taskId: number): Promise<LeaderboardRow[]> {
  const rows = await query<{
    VENDOR_ID: number; ALIAS: string; ACCURACY: number; RECALL: number; FPR: number; CREATED_AT: Date;
    YEARS: number; REFERENCES_CNT: number; MAINTENANCE: number; CERTIFIED: number;
    DEAL_ID: number | null; DEAL_STATUS: DealStatus;
  }>(
    `WITH ranked AS (SELECT s.*, ROW_NUMBER() OVER (PARTITION BY vendor_id ORDER BY created_at DESC, id DESC) AS rn
       FROM submissions s WHERE task_id = :taskId)
     SELECT s.vendor_id, v.alias, s.accuracy, s.recall, s.fpr, FROM_TZ(s.created_at, DBTIMEZONE) AS created_at,
       v.years, v.references_cnt, v.maintenance, v.certified, d.id AS deal_id, d.status AS deal_status
     FROM ranked s JOIN vendors v ON v.id = s.vendor_id
     LEFT JOIN deals d ON d.task_id = s.task_id AND d.vendor_id = s.vendor_id
     WHERE s.rn = 1 ORDER BY s.recall DESC, s.accuracy DESC, s.vendor_id`, { taskId },
  );
  return rows.map((r) => ({ vendorId: r.VENDOR_ID, alias: r.ALIAS, accuracy: r.ACCURACY, recall: r.RECALL, fpr: r.FPR,
    submittedAt: dbDateTime(r.CREATED_AT)!, badges: { years: r.YEARS, referencesCnt: r.REFERENCES_CNT, maintenance: dbBoolean(r.MAINTENANCE), certified: dbBoolean(r.CERTIFIED) },
    deal: r.DEAL_ID === null ? null : { id: r.DEAL_ID, status: r.DEAL_STATUS } }));
}
