"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRole } from "@/components/role/role-provider";
import { requestApi, useApi } from "@/components/dashboard/use-api";
import { ValueChart } from "@/components/dashboard/value-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { DiagnoseResult, PolicyResult, TaskDetailFactory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const metrics = ["결측률", "데이터 행 수", "수집 기간", "불량 비율", "이상값 비율"];
export default function DashboardPage() {
  const { role, ready } = useRole();
  const router = useRouter();
  const { data, loading, error, reload, update } = useApi<TaskDetailFactory>(ready && role === "factory" ? "/api/tasks/1?role=factory" : null);
  const [busy, setBusy] = useState<"diagnose" | "policy" | null>(null);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState<"diagnose" | "policy" | null>(null);
  const [industry, setIndustry] = useState<string | undefined>();
  useEffect(() => { if (ready && role === "startup") router.replace("/catalog"); }, [ready, role, router]);

  async function run(action: "diagnose" | "policy") {
    if (!data || busyRef.current) return;
    busyRef.current = true;
    setBusy(action);
    setActionError(null);
    try {
      if (action === "diagnose") {
        const result = await requestApi<DiagnoseResult>("/api/datasets/1/diagnose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "factory" }) });
        update({ ...data, ...result.taskCard, datasetId: result.datasetId, metrics: result.metrics, valueIndex: result.valueIndex, report: result.report });
        toast.success("데이터 진단이 완료되었습니다");
      } else {
        const selected = industry ?? data.blockIndustry ?? "none";
        const result = await requestApi<PolicyResult>("/api/tasks/1/policy", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "factory", synthLevel: "medium", blockIndustry: selected === "none" ? null : selected }) });
        update({ ...data, status: result.status, synthLevel: result.synthLevel, blockIndustry: result.blockIndustry });
        toast.success("공개 정책을 저장하고 과제를 공개했습니다");
      }
    } catch { setActionError(action); }
    finally { busyRef.current = false; setBusy(null); }
  }
  if (!ready || role !== "factory" || loading) return <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8" aria-busy="true"><p role="status">데이터를 불러오고 있습니다…</p><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></main>;
  if (error || !data) return <main className="mx-auto w-full max-w-6xl px-6 py-8"><Alert variant="destructive"><AlertTitle>데이터를 불러오지 못했습니다</AlertTitle><AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription></Alert><Button variant="outline" onClick={reload} className="mt-4">다시 시도</Button></main>;
  const values = data.metrics ? [
    `${(data.metrics.missingRate * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`,
    `${data.metrics.rowCount.toLocaleString("ko-KR")}행`,
    `${data.metrics.collectedFrom.slice(0, 10)} ~ ${data.metrics.collectedTo.slice(0, 10)}`,
    `${(data.metrics.defectRate * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`,
    `${(data.metrics.outlierRate * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`,
  ] : [];
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" aria-labelledby="dashboard-title">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 id="dashboard-title" className="text-2xl font-semibold">한빛반도체(가상) 데이터 진단</h1>
          <p className="text-sm text-muted-foreground">데이터의 가치를 확인하고, AI 업체에게 공개할 범위를 정하세요.</p>
          <p className="text-sm text-muted-foreground">상대 업체는 과제를 공개한 뒤 익명 과제와 합성 데이터만 볼 수 있습니다.</p>
        </div>
        <Badge variant="outline">{data.status === "published" ? "공개됨" : data.valueIndex ? "진단 완료" : "진단 전"}</Badge>
      </section>

      <Card>
        <CardHeader><CardTitle>이미 연결된 데이터셋</CardTitle><CardDescription>웨이퍼 공정 센서 데이터 (2008년 3분기)</CardDescription></CardHeader>
        <CardContent><p className="font-semibold tabular-nums">1,567행</p><p className="text-sm text-muted-foreground">미리 적재된 데이터로 진단합니다. 원본 파일을 업로드할 필요가 없습니다.</p></CardContent>
      </Card>

      <Alert>
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>원본은 공장 밖으로 나가지 않습니다</AlertTitle>
        <AlertDescription>진단에는 집계 지표를 사용하며, 원본 데이터는 업체에 공개되지 않습니다.</AlertDescription>
      </Alert>

      <section className="flex flex-col gap-4" aria-labelledby="diagnosis-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="diagnosis-title" className="text-lg font-semibold">데이터 가치와 품질</h2>
            <p id="diagnosis-help" className="text-sm text-muted-foreground">진단하면 가치평가지수와 개선 제안을 확인할 수 있습니다.</p>
          </div>
          <Button disabled={busy !== null} aria-describedby="diagnosis-help" onClick={() => run("diagnose")}>{busy === "diagnose" && <Spinner data-icon="inline-start" />}{busy === "diagnose" ? "진단 중…" : data.valueIndex ? "다시 진단" : "진단하기"}</Button>
        </div>
        {actionError && <Alert variant="destructive"><AlertTitle>{actionError === "diagnose" ? "진단을 완료하지 못했습니다" : "공개 정책을 저장하지 못했습니다"}</AlertTitle><AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription><Button variant="outline" disabled={busy !== null} onClick={() => run(actionError)}>다시 시도</Button></Alert>}
        {busy === "diagnose" ? <div role="status" aria-busy="true" className="flex flex-col gap-4"><p>데이터를 진단하고 있습니다. 잠시 기다려 주세요.</p><Skeleton className="h-64 w-full" /><Skeleton className="h-32 w-full" /></div> : <>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>가치평가지수</CardTitle>
              <CardDescription>4개 영역을 종합한 데이터 가치 평가</CardDescription>
            </CardHeader>
            <CardContent>
              {data.valueIndex ? <div className="flex flex-col gap-4"><p className="text-3xl font-semibold tabular-nums">{data.valueIndex.score.toLocaleString("ko-KR")}점</p><p className="text-sm text-muted-foreground">평가 범위 {data.valueIndex.min.toLocaleString("ko-KR")}~{data.valueIndex.max.toLocaleString("ko-KR")}점</p></div> : <Empty>
                <EmptyHeader>
                  <EmptyTitle>아직 진단 결과가 없습니다</EmptyTitle>
                  <EmptyDescription>진단이 완료되면 지수와 개선할 요소를 확인할 수 있습니다.</EmptyDescription>
                </EmptyHeader>
              </Empty>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>영역별 평가</CardTitle>
              <CardDescription>4개 영역의 점수를 비교합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.valueIndex ? <ValueChart value={data.valueIndex} /> : <Empty><EmptyHeader><EmptyTitle>아직 영역별 평가가 없습니다</EmptyTitle><EmptyDescription>진단하기를 눌러 평가를 시작하세요.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric, index) => (
            <Card key={metric}>
              <CardHeader><dt className="text-sm text-muted-foreground">{metric}</dt></CardHeader>
              <CardContent><dd className="tabular-nums">{values[index] ?? "진단 전"}</dd></CardContent>
            </Card>
          ))}
        </dl>
        </>}
      </section>

      <section className="grid min-w-0 gap-8 lg:grid-cols-2" aria-label="진단 결과 상세">
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold">개선 제안</h2>
          {data.valueIndex ? data.valueIndex.suggestions.length ? data.valueIndex.suggestions.map((suggestion) => <Card key={suggestion.element}><CardHeader><CardTitle>{suggestion.label}</CardTitle><CardDescription>기대 상승 +{suggestion.expectedGain.toLocaleString("ko-KR")}점</CardDescription></CardHeader><CardContent className="break-words">{suggestion.text}</CardContent></Card>) : <p className="text-sm text-muted-foreground">제안된 개선 사항이 없습니다.</p> : <p className="text-sm text-muted-foreground">진단 후 보완할 내용과 기대 상승 점수를 안내합니다.</p>}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold">AI 진단 리포트</h2>
          {data.report ? <><p className="line-clamp-3 break-words whitespace-pre-wrap">{data.report}</p><Dialog><DialogTrigger render={<Button variant="outline" />}>리포트 전체 보기</DialogTrigger><DialogContent><DialogHeader><DialogTitle>AI 진단 리포트</DialogTitle></DialogHeader><p className="max-h-96 overflow-y-auto break-words whitespace-pre-wrap">{data.report}</p></DialogContent></Dialog></> : <p className="text-sm text-muted-foreground">진단 후 데이터의 강점과 한계를 정리한 리포트가 표시됩니다.</p>}
        </div>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label="과제와 공개 정책">
        <Card>
          <CardHeader>
            <CardTitle>공개할 과제</CardTitle>
            <CardDescription>진단 결과를 바탕으로 업체에게 보여 줄 과제가 작성됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.title ? <dl className="flex flex-col gap-4 break-words"><div><dt className="text-sm text-muted-foreground">과제명</dt><dd>{data.title}</dd></div><div><dt className="text-sm text-muted-foreground">해결할 문제</dt><dd>{data.problem}</dd></div><div><dt className="text-sm text-muted-foreground">평가 지표</dt><dd>{data.metric}</dd></div><div><dt className="text-sm text-muted-foreground">필요한 데이터</dt><dd>{data.dataNeeded}</dd></div></dl> : <Empty>
              <EmptyHeader>
                <EmptyTitle>진단 후 과제가 준비됩니다</EmptyTitle>
                <EmptyDescription>해결할 문제, 평가 지표, 필요한 데이터를 확인한 뒤 공개하세요.</EmptyDescription>
              </EmptyHeader>
            </Empty>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>공개 정책</CardTitle>
            <CardDescription>과제를 공개하기 전에 합성 데이터 수준과 차단 업종을 정하세요.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="synth-level">합성 데이터 수준</FieldLabel>
              <Select value="medium" disabled={busy !== null} items={{ low: "낮음 (준비 중)", medium: "중간", high: "높음 (준비 중)" }}>
                <SelectTrigger id="synth-level" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectGroup>
                  <SelectItem value="low" disabled>낮음 (준비 중)</SelectItem>
                  <SelectItem value="medium">중간</SelectItem>
                  <SelectItem value="high" disabled>높음 (준비 중)</SelectItem>
                </SelectGroup></SelectContent>
              </Select>
              <FieldDescription>현재 중간 수준의 합성 데이터를 제공합니다.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="block-industry">경쟁 업종 차단</FieldLabel>
              <Select value={industry ?? data.blockIndustry ?? "none"} disabled={busy !== null} onValueChange={(value) => { if (value !== null) setIndustry(value); }} items={{ "반도체 제조": "반도체 제조", none: "차단하지 않음" }}>
                <SelectTrigger id="block-industry" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectGroup>
                  <SelectItem value="반도체 제조">반도체 제조</SelectItem>
                  <SelectItem value="none">차단하지 않음</SelectItem>
                </SelectGroup></SelectContent>
              </Select>
            </Field>
            <p id="publish-help" className="text-sm text-muted-foreground">{data.title ? "저장하면 차단 업종을 제외한 업체가 과제를 볼 수 있습니다." : "진단을 완료한 뒤 과제를 공개할 수 있습니다."}</p>
            <Button disabled={!data.title || busy !== null} aria-describedby="publish-help" onClick={() => run("policy")}>{busy === "policy" && <Spinner data-icon="inline-start" />}{busy === "policy" ? "저장 중…" : data.status === "published" ? "공개 정책 저장" : "과제 공개"}</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
