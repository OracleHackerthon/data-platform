// 연결 확인용 샘플: 브라우저 → 이 API → AI 서비스 /example → OpenAI
// 대회 당일 실제 기능으로 교체한다.
import { ok, fail } from "@/lib/api";
import { callAi } from "@/lib/ai-client";

export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim()) return fail("text 가 비어 있습니다", 400);

  try {
    const result = await callAi<{ ok: boolean; data?: { answer: string }; error?: string }>(
      "/example",
      { text },
    );
    if (!result.ok || !result.data) return fail(result.error ?? "AI 처리 실패", 502);
    return ok(result.data);
  } catch {
    return fail("AI 서비스에 연결할 수 없습니다", 502);
  }
}
