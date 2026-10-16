"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRole } from "@/components/role/role-provider";
import { requestApi, useApi } from "@/components/dashboard/use-api";
import type { PolicyResult, TaskDetailFactory } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export default function RegisterTaskPage() {
  const { role, ready } = useRole();
  const router = useRouter();
  const { data, loading, error, reload, update } = useApi<TaskDetailFactory>(ready && role === "factory" ? "/api/tasks/1?role=factory" : null);
  const [industry, setIndustry] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [actionError, setActionError] = useState(false);
  useEffect(() => { if (ready && role === "startup") router.replace("/catalog"); }, [ready, role, router]);

  async function save() {
    if (!data?.title || saving.current) return;
    saving.current = true;
    setBusy(true);
    setActionError(false);
    try {
      const selected = industry ?? data.blockIndustry ?? "none";
      const result = await requestApi<PolicyResult>("/api/tasks/1/policy", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "factory", synthLevel: "medium", blockIndustry: selected === "none" ? null : selected }) });
      update({ ...data, status: result.status, synthLevel: result.synthLevel, blockIndustry: result.blockIndustry });
      toast.success("과제가 등록되어 공개되었습니다");
    } catch { setActionError(true); }
    finally { saving.current = false; setBusy(false); }
  }

  if (!ready || role !== "factory" || loading) return <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8" aria-busy="true"><p role="status">과제를 불러오고 있습니다…</p><Skeleton className="h-64" /></main>;
  if (error || !data) return <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8"><Alert variant="destructive"><AlertTitle>과제를 불러오지 못했습니다</AlertTitle><AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription></Alert><Button variant="outline" onClick={reload}>다시 시도</Button></main>;

  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <Link href="/dashboard" className="text-sm underline underline-offset-4">데이터 진단으로 돌아가기</Link>
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">과제 등록</h1>
      <p className="text-sm text-muted-foreground">추천 과제를 확인하고 등록서를 작성하세요. 원본은 공장 밖으로 나가지 않습니다.</p>
      <p className="text-sm text-muted-foreground">상대 업체에는 익명 과제와 합성 데이터만 공개됩니다.</p>
    </section>
    {!data.title ? <Alert><AlertTitle>먼저 데이터 진단을 완료해 주세요</AlertTitle><AlertDescription>진단 화면에서 과제가 만들어진 뒤 등록할 수 있습니다.</AlertDescription></Alert> : <>
      <Card>
        <CardHeader><CardTitle><h2 className="text-[13pt] font-bold">추천 과제</h2></CardTitle><CardDescription>데이터 진단 결과를 바탕으로 추천된 과제입니다. 아래 등록서에서 공개 범위를 정하세요.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="flex flex-col gap-4 break-words">
            <div><dt className="text-sm text-muted-foreground">과제명</dt><dd>{data.title}</dd></div>
            <div><dt className="text-sm text-muted-foreground">해결할 문제</dt><dd>{data.problem}</dd></div>
            <div><dt className="text-sm text-muted-foreground">평가 지표</dt><dd>{data.metric}</dd></div>
            <div><dt className="text-sm text-muted-foreground">필요한 데이터</dt><dd>{data.dataNeeded}</dd></div>
          </dl>
          <Badge variant="outline">{data.status === "published" ? "공개됨" : "등록 전"}</Badge>
        </CardContent>
      </Card>
      {actionError && <Alert variant="destructive"><AlertTitle>과제를 등록하지 못했습니다</AlertTitle><AlertDescription>선택한 정책은 유지됩니다. 다시 시도해 주세요.</AlertDescription><Button variant="outline" disabled={busy} onClick={save}>다시 시도</Button></Alert>}
        <Card>
          <CardHeader>
            <CardTitle><h2 className="text-[13pt] font-bold">과제 등록서</h2></CardTitle>
            <CardDescription>추천 과제를 등록할 때 적용할 합성 데이터 수준과 차단 업종을 작성하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <FieldGroup>
            <Field>
              <FieldLabel htmlFor="synth-level">합성 데이터 수준</FieldLabel>
              <Select value="medium" disabled={busy} items={{ low: "낮음 (준비 중)", medium: "중간", high: "높음 (준비 중)" }}>
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
              <Select value={industry ?? data.blockIndustry ?? "none"} disabled={busy} onValueChange={(value) => { if (value !== null) setIndustry(value); }} items={{ "반도체 제조": "반도체 제조", none: "차단하지 않음" }}>
                <SelectTrigger id="block-industry" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectGroup>
                  <SelectItem value="반도체 제조">반도체 제조</SelectItem>
                  <SelectItem value="none">차단하지 않음</SelectItem>
                </SelectGroup></SelectContent>
              </Select>
            </Field>
            </FieldGroup>
            <p id="publish-help" className="text-sm text-muted-foreground">등록하면 차단 업종을 제외한 업체가 추천 과제와 합성 데이터를 볼 수 있습니다.</p>
            <Button type="submit" disabled={!data.title || busy} aria-describedby="publish-help">{busy && <Spinner data-icon="inline-start" />}{busy ? "저장 중…" : data.status === "published" ? "등록 정보 저장" : "과제 등록 및 공개"}</Button>
            </form>
          </CardContent>
        </Card>
      {data.status === "published" && <Alert><AlertTitle>과제가 등록되었습니다</AlertTitle><AlertDescription>공개 정책에 따라 스타트업 카탈로그에 표시됩니다. 상단에서 스타트업으로 전환해 확인할 수 있습니다.</AlertDescription></Alert>}
    </>}
  </main>;
}

