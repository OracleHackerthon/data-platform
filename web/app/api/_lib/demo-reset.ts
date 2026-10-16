import { query } from "@/lib/db";

export async function resetDemo(): Promise<{ reset: true }> {
  // 기존 DB에서 확인한 A·C 최초 제출을 보존한다. 시드 플래그나 새 테이블은 만들지 않는다.
  // 각 문장은 재실행해도 같은 상태가 되며, 중간 실패 후 다시 호출해 복구할 수 있다.
  await query(`DELETE FROM submissions WHERE id NOT IN (
    SELECT MIN(id) FROM submissions WHERE vendor_id IN (1, 3) GROUP BY task_id, vendor_id
  )`);
  await query("DELETE FROM deals");
  await query(`UPDATE tasks SET title = NULL, problem = NULL, metric = NULL, data_needed = NULL,
    value_index = NULL, value_detail = NULL, metrics = NULL, report = NULL,
    synth_level = 'medium', block_industry = NULL, status = 'draft'`);
  await query("DELETE FROM access_log");
  return { reset: true };
}
