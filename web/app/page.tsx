"use client";
// 연결 확인용 샘플 화면. 대회 당일 실제 화면으로 교체한다.
import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setOut("");
    try {
      const res = await fetch("/api/ai-example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      setOut(json.ok ? json.data.answer : `오류: ${json.error}`);
    } catch {
      setOut("오류: 서버에 연결할 수 없습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">TELOS Starter</h1>
      <p className="text-sm text-zinc-500">브라우저 → Next.js API → FastAPI → OpenAI 연결 확인</p>
      <textarea
        className="min-h-32 rounded-md border p-3"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="아무 문장이나 입력"
      />
      <button
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        onClick={run}
        disabled={loading || !text.trim()}
      >
        {loading ? "처리 중..." : "보내기"}
      </button>
      {out && <pre className="whitespace-pre-wrap rounded-md bg-zinc-100 p-3 dark:bg-zinc-900">{out}</pre>}
    </main>
  );
}
