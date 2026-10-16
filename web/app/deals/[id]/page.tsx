"use client";

import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useRole } from "@/components/role/role-provider";
import { requestApi, useApi } from "@/components/dashboard/use-api";
import { ContractForm } from "@/components/deals/contract-form";
import type { Deal } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

const stages = [["contract", "계약"], ["payment_pending", "입금 대기"], ["access_granted", "접근 허용"], ["settled", "정산"]] as const;

export default function DealPage() {
  return <Suspense fallback={<main className="mx-auto w-full max-w-6xl px-6 py-8"><Skeleton className="h-64" /></main>}><DealContent /></Suspense>;
}

function DealContent() {
  const { id } = useParams<{ id: string }>();
  const { role, vendorId, query, ready } = useRole();
  const { data, loading, error, reload } = useApi<Deal>(ready ? `/api/deals/${encodeURIComponent(id)}?${query}` : null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [actionError, setActionError] = useState(false);
  async function accept() {
    if (!data || role !== "startup" || saving.current) return;
    saving.current = true; setBusy(true); setActionError(false);
    try {
      await requestApi<Deal>(`/api/deals/${data.id}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "startup", vendorId }) });
      reload(); toast.success("연락 요청을 수락했습니다");
    } catch { setActionError(true); }
    finally { saving.current = false; setBusy(false); }
  }
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <Link href="/deals" className="text-sm underline underline-offset-4">거래 목록으로 돌아가기</Link>
    {!ready || loading ? <div aria-busy="true"><p role="status">거래를 불러오고 있습니다…</p><Skeleton className="h-64" /></div>
      : error || !data ? <Alert variant="destructive"><AlertTitle>거래를 확인할 수 없습니다</AlertTitle><AlertDescription>접근할 수 없는 거래이거나 연결이 원활하지 않습니다.</AlertDescription><Button variant="outline" onClick={reload}>다시 시도</Button></Alert>
      : <>
        <section className="flex min-w-0 flex-col gap-2"><h1 className="text-2xl font-semibold">{data.vendorAlias} 거래 상세</h1><p className="break-words">{data.taskTitle}</p><p className="text-sm text-muted-foreground">수락 후 양쪽에 실명과 연락처가 공개됩니다. 권장 가격은 공장에만 표시됩니다.</p></section>
        <Card><CardHeader><CardTitle>거래 진행 상황</CardTitle><CardDescription>결제는 시연용 단계 표시이며 실제 입금·접근 허용·정산은 처리하지 않습니다.</CardDescription></CardHeader><CardContent><ol className="flex flex-wrap gap-4">{stages.map(([key, label]) => <li key={key} aria-current={data.stage === key ? "step" : undefined}><Badge variant={data.stage === key ? "default" : "outline"}>{label}{data.stage === key ? " · 현재 단계" : ""}</Badge></li>)}</ol></CardContent></Card>
        {data.status === "requested" ? <Card><CardHeader><CardTitle>연락 요청</CardTitle><CardDescription>{role === "startup" ? "수락하면 공장과 업체의 실명·연락처가 서로 공개됩니다." : "업체가 요청을 수락하면 양쪽 실명과 연락처를 확인할 수 있습니다."}</CardDescription></CardHeader><CardContent className="flex flex-col items-start gap-4">
          {actionError && <Alert variant="destructive"><AlertTitle>수락하지 못했습니다</AlertTitle><AlertDescription>현재 상태를 다시 확인한 뒤 시도해 주세요.</AlertDescription><Button variant="outline" disabled={busy} onClick={reload}>상태 다시 확인</Button></Alert>}
          {role === "startup" && <Button disabled={busy} onClick={accept}>{busy && <Spinner data-icon="inline-start" />}{busy ? "수락 중…" : "연락 요청 수락"}</Button>}
          {role === "factory" && <Button disabled>수락 후 계약할 수 있습니다</Button>}
        </CardContent></Card> : data.parties && <section aria-label="공개된 연락처" className="grid min-w-0 gap-4 lg:grid-cols-2">{([['factory', '공장'], ['vendor', '업체']] as const).map(([key, label]) => <Card key={key}><CardHeader><CardTitle>{label} 연락처</CardTitle></CardHeader><CardContent className="flex min-w-0 flex-col gap-2 break-words"><p>{data.parties![key].name}</p><p className="text-sm text-muted-foreground">{data.parties![key].contact}</p></CardContent></Card>)}</section>}
        {data.contract ? <Card><CardHeader><CardTitle>저장된 계약 조건</CardTitle></CardHeader><CardContent><dl className="grid gap-4 sm:grid-cols-2">{[["계약 가격", `${data.contract.price.toLocaleString("ko-KR")}원`], ["목적", data.contract.purpose], ["기간", data.contract.period], ["범위", data.contract.scope], ["전달 방식", data.contract.delivery]].map(([label, value]) => <div key={label} className="min-w-0 break-words"><dt className="text-sm text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}</dl></CardContent></Card> : role === "factory" && data.status === "accepted" ? <ContractForm key={`${data.id}:${query}`} deal={data} onSaved={() => reload()} /> : data.status === "accepted" && <Alert><AlertTitle>공장의 계약 작성을 기다리고 있습니다</AlertTitle><AlertDescription>공장이 계약을 저장한 후 거래 목록에서 다시 열어 확인하세요.</AlertDescription></Alert>}
      </>}
  </main>;
}
