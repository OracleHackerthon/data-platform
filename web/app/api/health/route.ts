// 상태 확인: web 과 AI 서비스가 모두 살아 있는지 확인한다
import { connection } from "next/server";
import { ok } from "@/lib/api";
import { callAi } from "@/lib/ai-client";

export async function GET() {
  await connection(); // 빌드 시 정적 생성되지 않도록 요청 시점에 실행
  let ai = "down";
  try {
    await callAi<{ ok: boolean }>("/health", undefined, 5_000);
    ai = "up";
  } catch {
    ai = "down";
  }
  return ok({ web: "up", ai });
}
