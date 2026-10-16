import { query } from "@/lib/db";
import type { AccessAction } from "@/lib/types";
import type { RequestActor } from "./actor";

// PLAN B-0의 컬럼을 사용한다. 실제 DB 정의 확인 후 route에 연결한다.
// 기록 실패가 진단·제출·계약의 성공 응답을 실패로 바꾸지 않게 한다.
export async function logAccess(
  actor: RequestActor,
  action: AccessAction,
  target: string | null,
): Promise<void> {
  try {
    await query(
      `INSERT INTO access_log (at, role, actor, action, target)
       VALUES (SYSTIMESTAMP, :actorRole, :actorLabel, :action, :target)`,
      { actorRole: actor.role, actorLabel: actor.label, action, target },
    );
  } catch (error) {
    console.error("access log write failed", error);
  }
}
