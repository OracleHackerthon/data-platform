// Autonomous DB 연결 확인용 (목요일 리허설). 연결되면 { ok: true, data: { result: 1 } }
import { connection } from "next/server";
import { ok, fail } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    const rows = await query<{ RESULT: number }>("select 1 as result from dual");
    return ok({ result: rows[0]?.RESULT ?? null });
  } catch (e) {
    console.error("db-check failed", e);
    return fail("DB 연결 실패 (서버 로그 확인)", 500);
  }
}
