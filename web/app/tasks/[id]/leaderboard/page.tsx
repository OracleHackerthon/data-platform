"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRole } from "@/components/role/role-provider";
import { useApi } from "@/components/dashboard/use-api";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaderboardRow } from "@/lib/types";

export default function LeaderboardPage() {
  return <Suspense fallback={<main className="mx-auto w-full max-w-6xl px-6 py-8"><p role="status">순위표를 불러오고 있습니다…</p></main>}><LeaderboardContent /></Suspense>;
}

function LeaderboardContent() {
  const { id } = useParams<{ id: string }>();
  const { role, query, ready } = useRole();
  const router = useRouter();
  const { data, error, loading, reload, update } = useApi<LeaderboardRow[]>(ready && role === "factory" ? `/api/tasks/${encodeURIComponent(id)}/leaderboard?${query}` : null);
  useEffect(() => { if (ready && role === "startup") router.replace("/catalog"); }, [ready, role, router]);
  const best = data?.[0];
  const experienced = data?.reduce<LeaderboardRow | undefined>((current, row) => !current || row.badges.referencesCnt > current.badges.referencesCnt ? row : current, undefined);
  const percent = (value: number) => `${(value * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;

  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <Link href="/dashboard" className="text-sm underline underline-offset-4">대시보드로 돌아가기</Link>
    <div className="flex flex-col gap-2"><h1 className="text-2xl font-semibold">익명 업체 순위표</h1>
      <p className="text-sm text-muted-foreground">레퍼런스가 많은 업체가 내 공정 데이터에서도 1위인 것은 아닙니다. 실제 채점 점수로 고르세요.</p>
      <p className="text-sm text-muted-foreground">업체는 별칭으로 표시되며, 연락 요청을 수락하기 전까지 실명과 연락처는 공개되지 않습니다.</p>
    </div>
    {!ready || role !== "factory" || loading ? <div aria-busy="true" className="flex flex-col gap-4"><p role="status">순위표를 불러오고 있습니다…</p><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
      : error ? <Alert variant="destructive"><AlertTitle>순위표를 불러오지 못했습니다</AlertTitle><AlertDescription>과제와 연결 상태를 확인하고 다시 시도해 주세요.</AlertDescription><Button onClick={reload} variant="outline">다시 시도</Button></Alert>
      : !data?.length ? <Empty><EmptyHeader><EmptyTitle>아직 제출된 모델이 없습니다</EmptyTitle><EmptyDescription>스타트업이 모델을 제출하면 이곳에서 점수와 배지를 비교할 수 있습니다.</EmptyDescription></EmptyHeader><Button variant="outline" onClick={reload}>새로고침</Button></Empty>
      : <>
        <Card><CardHeader><CardTitle>내 데이터로 비교한 결과</CardTitle><CardDescription>업체별 가장 최근 제출만 표시합니다.</CardDescription></CardHeader>
          <CardContent><dl className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">불량 검출률 1위</dt><dd className="font-semibold tabular-nums">{best!.alias} · {percent(best!.recall)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">레퍼런스 최다</dt><dd className="font-semibold tabular-nums">{experienced!.alias} · {experienced!.badges.referencesCnt}건</dd></div>
          </dl></CardContent>
        </Card>
        <Card><CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-col gap-2"><CardTitle>업체 성능·검증 배지</CardTitle><CardDescription>불량 검출률은 높을수록, 오탐률은 낮을수록 좋습니다.</CardDescription></div><Button variant="outline" onClick={reload}>새로고침</Button></CardHeader>
          <CardContent className="min-w-0"><LeaderboardTable key={id} taskId={id} rows={data} update={update} /></CardContent>
        </Card>
      </>}
  </main>;
}
