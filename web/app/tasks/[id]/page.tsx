"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useRole } from "@/components/role/role-provider";
import { useApi } from "@/components/dashboard/use-api";
import { ValueChart } from "@/components/dashboard/value-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskDetailStartup } from "@/lib/types";

export default function TaskDetailPage() {
  return <Suspense fallback={<main className="mx-auto w-full max-w-6xl px-6 py-8"><p role="status">과제를 불러오고 있습니다…</p></main>}><TaskDetailContent /></Suspense>;
}

function TaskDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { role, query, ready } = useRole();
  const router = useRouter();
  const { data, error, loading, reload } = useApi<TaskDetailStartup>(ready && role === "startup" ? `/api/tasks/${encodeURIComponent(id)}?${query}` : null);
  useEffect(() => { if (ready && role === "factory") router.replace("/dashboard"); }, [ready, role, router]);
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <Link href="/catalog" className="text-sm underline underline-offset-4">카탈로그로 돌아가기</Link>
    {!ready || role !== "startup" || loading ? <div aria-busy="true" className="flex flex-col gap-4"><p role="status">과제를 불러오고 있습니다…</p><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
      : error || !data ? <Alert variant="destructive"><AlertTitle>과제를 확인할 수 없습니다</AlertTitle><AlertDescription>비공개이거나 접근이 제한된 과제일 수 있습니다. 선택한 업체와 연결 상태를 확인해 주세요.</AlertDescription><Button variant="outline" onClick={reload}>다시 시도</Button></Alert>
      : <>
        <section className="flex min-w-0 flex-col gap-2"><h1 className="break-words text-2xl font-semibold">{data.title}</h1><p className="break-words">{data.problem}</p><p className="text-sm text-muted-foreground">공장은 이 화면에서 업체의 실명과 연락처를 볼 수 없습니다.</p></section>
        <Alert><AlertTitle>원본은 보이지 않습니다</AlertTitle><AlertDescription>아래 표는 합성 데이터입니다. 분포 비교에는 원본 행 대신 구간별 비율만 사용합니다.</AlertDescription></Alert>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>과제 정보</CardTitle></CardHeader><CardContent><dl className="flex flex-col gap-8 break-words"><div><dt className="text-sm text-muted-foreground">평가 지표</dt><dd>{data.metric}</dd></div><div><dt className="text-sm text-muted-foreground">필요한 데이터</dt><dd>{data.dataNeeded}</dd></div><div><dt className="text-sm text-muted-foreground">가치평가지수</dt><dd className="tabular-nums">{data.valueIndex.score.toLocaleString("ko-KR")}점</dd></div></dl></CardContent></Card>
          <Card><CardHeader><CardTitle>영역별 평가</CardTitle><CardDescription>10점 척도의 데이터 가치 평가</CardDescription></CardHeader><CardContent><ValueChart value={data.valueIndex} /></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>합성 데이터 미리보기</CardTitle><CardDescription>중간 수준 · 최대 10행</CardDescription></CardHeader><CardContent className="min-w-0">
          {data.synthPreview.rows.length ? <Table><TableHeader><TableRow>{data.synthPreview.columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader><TableBody>{data.synthPreview.rows.map((row, index) => <TableRow key={index}>{row.map((cell, column) => <TableCell key={column} className="max-w-64 break-words tabular-nums whitespace-normal">{cell === null ? "값 없음" : typeof cell === "number" ? cell.toLocaleString("ko-KR", { maximumFractionDigits: 4 }) : cell}</TableCell>)}</TableRow>)}</TableBody></Table> : <Empty><EmptyHeader><EmptyTitle>합성 데이터가 없습니다</EmptyTitle><EmptyDescription>미리보기 데이터가 준비되면 여기에 표시됩니다.</EmptyDescription></EmptyHeader></Empty>}
        </CardContent></Card>
        <section aria-label="원본 대비 합성 데이터 분포" className="grid min-w-0 gap-4 lg:grid-cols-2">{data.distributions.map((distribution) => <Card key={distribution.column}>
          <CardHeader><CardTitle>{distribution.column} 분포 비교</CardTitle><CardDescription>가로축: 센서 값 구간 · 세로축: 데이터 비율(%)</CardDescription></CardHeader>
          <CardContent><ChartContainer className="h-64 w-full aspect-auto" config={{ rawShare: { label: "원본 분포", color: "var(--chart-2)" }, synthShare: { label: "합성 분포", color: "var(--chart-4)" } }}>
            <BarChart data={distribution.bins} accessibilityLayer><CartesianGrid vertical={false} /><XAxis dataKey="label" /><YAxis domain={[0, 1]} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} /><ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span>{name === "rawShare" ? "원본 분포" : "합성 분포"}: {(Number(value) * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%</span>} />} /><ChartLegend content={<ChartLegendContent />} /><Bar dataKey="rawShare" fill="var(--color-rawShare)" /><Bar dataKey="synthShare" fill="var(--color-synthShare)" /></BarChart>
          </ChartContainer></CardContent>
        </Card>)}</section>
      </>}
  </main>;
}
