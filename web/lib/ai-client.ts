// AI 서비스(FastAPI) 호출 공통 함수. 서버 코드(route.ts)에서만 사용한다.
// 브라우저에서 AI 서비스를 직접 부르지 않는다.

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function callAi<T>(path: string, body?: unknown, timeoutMs = 60_000): Promise<T> {
  const res = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`AI service ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
