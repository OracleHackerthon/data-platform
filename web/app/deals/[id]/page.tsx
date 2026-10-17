"use client";

import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useRole } from "@/components/role/role-provider";
import { requestApi, useApi } from "@/components/dashboard/use-api";
import { ContractForm } from "@/components/deals/contract-form";
import { stageLabel, stages, statusLabels, won } from "@/components/deals/deal-labels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { ContractTerms, Deal, DealStage } from "@/lib/types";

// 10/17 시연용 거래 단계 설명과 공장의 다음 단계 버튼 (결제 없음, POST /api/deals/[id]/advance)
const stageNotes: Record<DealStage, string> = {
  contract: "",
  payment_pending: "업체의 입금을 확인하면 격리 환경 접근을 허용합니다.",
  access_granted: "업체는 공장 데이터를 우리 격리 환경 안에서만 쓰고, 원본은 내려받을 수 없습니다.",
  settled: "정산이 끝났습니다. 접근 기록에서 원본 다운로드가 0건인지 확인할 수 있습니다.",
};
const nextAction: Partial<Record<DealStage, string>> = { payment_pending: "입금 확인, 격리 환경 접근 허용", access_granted: "사용 종료, 정산 완료" };

export default function DealPage() {
  return <Suspense fallback={<main className="mx-auto w-full max-w-6xl px-6 py-8"><p role="status">거래를 불러오고 있습니다…</p></main>}><DealContent /></Suspense>;
}

function DealContent() {
  const { id } = useParams<{ id: string }>();
  const { role, vendorId, query, ready } = useRole();
  const { data, error, loading, reload, update } = useApi<Deal>(ready ? `/api/deals/${encodeURIComponent(id)}?${query}` : null);
  const [busy, setBusy] = useState<"accept" | "contract" | "advance" | null>(null);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const factory = role === "factory";

  async function act(kind: "accept" | "contract" | "advance", terms?: ContractTerms) {
    if (!data || busyRef.current) return;
    busyRef.current = true;
    setBusy(kind);
    setActionError(null);
    try {
      const result = kind === "accept"
        ? await requestApi<Deal>(`/api/deals/${data.id}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "startup", vendorId }) })
        : kind === "advance" ? await requestApi<Deal>(`/api/deals/${data.id}/advance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "factory" }) })
        : await requestApi<Deal>(`/api/deals/${data.id}/contract`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "factory", ...terms }) });
      // 스타트업 응답에는 priceGuide 가 없으므로 공장 쪽 값은 유지한다
      update({ ...result, priceGuide: result.priceGuide ?? data.priceGuide });
      toast.success(kind === "accept" ? "연락 요청을 수락했습니다. 양쪽 실명이 공개되었습니다" : kind === "advance" ? `${stageLabel(result.stage)} 단계로 넘어갔습니다` : "계약을 저장했습니다. 입금 대기 단계로 넘어갑니다");
    } catch { setActionError(kind === "accept" ? "수락하지 못했습니다" : kind === "advance" ? "다음 단계로 넘기지 못했습니다" : "계약을 저장하지 못했습니다"); }
    finally { busyRef.current = false; setBusy(null); }
  }

  if (!ready || loading) return <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8" aria-busy="true"><p role="status">거래를 불러오고 있습니다…</p><Skeleton className="h-32" /><Skeleton className="h-64" /></main>;
  if (error || !data) return <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8"><Link href="/deals" className="text-sm underline underline-offset-4">거래 목록으로 돌아가기</Link><Alert variant="destructive"><AlertTitle>거래를 확인할 수 없습니다</AlertTitle><AlertDescription>다른 업체의 거래이거나 없는 거래일 수 있습니다. 첫 화면에서 고른 역할과 오른쪽 위의 업체를 확인해 주세요.</AlertDescription><Button variant="outline" onClick={reload}>다시 시도</Button></Alert></main>;

  const current = stages.findIndex((stage) => stage.key === data.stage);
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <Link href="/deals" className="text-sm underline underline-offset-4">거래 목록으로 돌아가기</Link>
    <section className="flex flex-col gap-2">
      <h1 className="flex flex-wrap items-center gap-2 break-words text-2xl font-semibold">{data.taskTitle}<Badge variant={data.status === "requested" ? "outline" : "secondary"}>{statusLabels[data.status]}</Badge></h1>
      <p className="text-sm text-muted-foreground">{factory ? `${data.parties?.vendor.name ?? data.vendorAlias} 와의 거래입니다.` : "공장이 내 제출 점수를 보고 연락을 요청했습니다."}</p>
    </section>

    <ol aria-label="거래 단계" className="grid gap-2 sm:grid-cols-4">{stages.map((stage, index) => <li key={stage.key} aria-current={index === current ? "step" : undefined} className={index <= current ? "rounded-lg bg-secondary p-4 text-secondary-foreground" : "rounded-lg border p-4 text-muted-foreground"}>
      <span className="text-sm tabular-nums">{index + 1}단계</span><p className="font-medium">{stage.label}</p>
    </li>)}</ol>
    {data.status === "contracted" && <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">{stageNotes[data.stage]} 시연에서는 실제 결제가 오가지 않습니다.</p>
      {factory && nextAction[data.stage] && <Button disabled={busy !== null} onClick={() => act("advance")}>{busy === "advance" && <Spinner data-icon="inline-start" />}{busy === "advance" ? "처리 중…" : nextAction[data.stage]}</Button>}
    </div>}

    {actionError && <Alert variant="destructive"><AlertTitle>{actionError}</AlertTitle><AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription><Button variant="outline" onClick={reload}>거래 다시 불러오기</Button></Alert>}

    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>거래 당사자</CardTitle><CardDescription>{data.parties ? "수락으로 양쪽 실명과 연락처가 공개되었습니다." : "업체가 수락하기 전에는 양쪽 모두 상대의 실명을 볼 수 없습니다."}</CardDescription></CardHeader>
        <CardContent>
          {data.parties ? <dl className="flex flex-col gap-4 break-words">
            <div><dt className="text-sm text-muted-foreground">공장</dt><dd className="font-medium">{data.parties.factory.name}</dd><dd className="text-sm">{data.parties.factory.contact}</dd></div>
            <div><dt className="text-sm text-muted-foreground">업체 ({data.vendorAlias})</dt><dd className="font-medium">{data.parties.vendor.name}</dd><dd className="text-sm">{data.parties.vendor.contact}</dd></div>
          </dl> : <dl className="flex flex-col gap-4">
            <div><dt className="text-sm text-muted-foreground">공장</dt><dd>{factory ? "내 공장" : "비공개 (수락 후 공개)"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">업체</dt><dd>{factory ? `${data.vendorAlias} (실명 비공개)` : `${data.vendorAlias} (내 업체)`}</dd></div>
          </dl>}
          {!factory && data.status === "requested" && <Button className="mt-4 w-full" disabled={busy !== null} onClick={() => act("accept")}>{busy === "accept" && <Spinner data-icon="inline-start" />}{busy === "accept" ? "수락 중…" : "연락 요청 수락"}</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>계약</CardTitle><CardDescription>{data.contract ? "저장된 계약 조건입니다." : factory ? "업체가 수락하면 계약 조건과 금액을 정할 수 있습니다." : "수락하면 공장이 계약 조건을 작성합니다."}</CardDescription></CardHeader>
        <CardContent>
          {data.contract ? <dl className="grid grid-cols-2 gap-4 break-words">
            <div className="col-span-2"><dt className="text-sm text-muted-foreground">계약 금액</dt><dd className="text-xl font-semibold tabular-nums">{won(data.contract.price)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">사용 목적</dt><dd>{data.contract.purpose}</dd></div>
            <div><dt className="text-sm text-muted-foreground">사용 기간</dt><dd>{data.contract.period}</dd></div>
            <div><dt className="text-sm text-muted-foreground">데이터 범위</dt><dd>{data.contract.scope}</dd></div>
            <div><dt className="text-sm text-muted-foreground">제공 방식</dt><dd>{data.contract.delivery}</dd></div>
          </dl>
            : factory && data.status === "accepted" ? <ContractForm guide={data.priceGuide} busy={busy !== null} onSubmit={(terms) => act("contract", terms)} />
            : <p className="text-sm text-muted-foreground">{factory ? "업체의 수락을 기다리고 있습니다." : "아직 계약 조건이 없습니다."}</p>}
        </CardContent>
      </Card>
    </div>
  </main>;
}
