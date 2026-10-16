"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/role/role-provider";
import { useApi } from "@/components/dashboard/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskSummary } from "@/lib/types";

export default function CatalogPage() {
  const { role, query, ready } = useRole();
  const router = useRouter();
  const { data, error, loading, reload } = useApi<TaskSummary[]>(ready && role === "startup" ? `/api/tasks?${query}` : null);
  useEffect(() => { if (ready && role === "factory") router.replace("/dashboard"); }, [ready, role, router]);
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <div className="flex flex-col gap-2"><h1 className="text-2xl font-semibold">익명 과제 카탈로그</h1><p className="text-sm text-muted-foreground">공장 원본을 받지 않고, 공개된 과제와 합성 데이터로 적합성을 확인하세요.</p><p className="text-sm text-muted-foreground">이 화면에는 공장의 실명과 원본 데이터가 표시되지 않습니다.</p></div>
    {!ready || role !== "startup" || loading ? <div aria-busy="true" className="grid gap-4 sm:grid-cols-2"><span role="status" className="sr-only">과제를 불러오고 있습니다</span><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      : error ? <Alert variant="destructive"><AlertTitle>과제를 불러오지 못했습니다</AlertTitle><AlertDescription>연결을 확인하고 다시 시도해 주세요.</AlertDescription><Button onClick={reload} variant="outline">다시 시도</Button></Alert>
      : !data?.length ? <Empty><EmptyHeader><EmptyTitle>현재 볼 수 있는 과제가 없습니다</EmptyTitle><EmptyDescription>아직 공개된 과제가 없거나, 선택한 업체의 업종이 공개 정책에 의해 차단되어 있습니다. 상단에서 다른 업체를 선택할 수 있습니다.</EmptyDescription></EmptyHeader></Empty>
      : <div className="grid min-w-0 gap-4 lg:grid-cols-2">{data.map((task) => <Card key={task.id}>
        <CardHeader><CardTitle>{task.title}</CardTitle><CardDescription className="break-words">{task.problem}</CardDescription></CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
          <p className="tabular-nums">가치평가지수 <strong>{task.valueIndex.score.toLocaleString("ko-KR")}점</strong> · {task.rowCount.toLocaleString("ko-KR")}행</p>
          <dl className="flex flex-col gap-2">{task.valueIndex.areas.map((area) => <div key={area.key} className="flex justify-between gap-2"><dt>{area.label}</dt><dd className="shrink-0 tabular-nums">{area.score === null ? "평가 제외" : `${area.score.toLocaleString("ko-KR")}점`}</dd></div>)}</dl>
          <Link href={`/tasks/${task.id}`} className="text-sm font-medium underline underline-offset-4">과제와 합성 데이터 보기</Link>
        </CardContent>
      </Card>)}</div>}
  </main>;
}
