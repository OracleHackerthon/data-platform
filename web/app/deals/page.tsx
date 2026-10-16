"use client";

import Link from "next/link";
import { useRole } from "@/components/role/role-provider";
import { useApi } from "@/components/dashboard/use-api";
import { stageLabel, statusLabels } from "@/components/deals/deal-labels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { Deal } from "@/lib/types";

export default function DealsPage() {
  const { role, query, ready } = useRole();
  // 공장은 시드 과제 1 의 거래, 스타트업은 내 업체가 받은 요청 (PLAN B-0)
  const url = !ready ? null : role === "factory" ? "/api/deals?role=factory&taskId=1" : `/api/deals?${query}`;
  const { data, error, loading, reload } = useApi<Deal[]>(url);
  const factory = role === "factory";
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{factory ? "보낸 연락 요청" : "받은 연락 요청"}</h1>
      <p className="text-sm text-muted-foreground">{factory ? "순위표에서 연락을 요청한 업체입니다. 업체가 수락하면 실명과 연락처가 서로 공개되고 계약을 진행할 수 있습니다." : "공장이 내 제출 점수를 보고 연락을 요청했습니다. 수락하면 양쪽 실명과 연락처가 공개됩니다."}</p>
      <p className="text-sm text-muted-foreground">수락 전에는 양쪽 모두 상대의 실명을 볼 수 없습니다.</p>
    </div>
    {!ready || loading ? <div aria-busy="true" className="grid gap-4 sm:grid-cols-2"><span role="status" className="sr-only">거래를 불러오고 있습니다</span><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      : error || !data ? <Alert variant="destructive"><AlertTitle>거래를 불러오지 못했습니다</AlertTitle><AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription><Button variant="outline" onClick={reload}>다시 시도</Button></Alert>
      : !data.length ? <Empty><EmptyHeader><EmptyTitle>{factory ? "아직 연락을 요청한 업체가 없습니다" : "아직 받은 연락 요청이 없습니다"}</EmptyTitle><EmptyDescription>{factory ? "순위표에서 점수를 확인하고 마음에 드는 업체에 연락을 요청하세요." : "공개된 과제에 모델을 제출하면 공장이 점수를 보고 연락할 수 있습니다."}</EmptyDescription></EmptyHeader><EmptyContent>{factory ? <Button variant="outline" render={<Link href="/tasks/1/leaderboard" />}>순위표로 가기</Button> : <Button variant="outline" render={<Link href="/catalog" />}>카탈로그로 가기</Button>}</EmptyContent></Empty>
      : <div className="grid min-w-0 gap-4 lg:grid-cols-2">{data.map((deal) => <Card key={deal.id}>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">{factory ? deal.parties?.vendor.name ?? deal.vendorAlias : deal.parties?.factory.name ?? "익명 공장"}<Badge variant={deal.status === "requested" ? "outline" : "secondary"}>{statusLabels[deal.status]}</Badge></CardTitle>
          <CardDescription className="break-words">{deal.taskTitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
          <dl className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4">
            <div className="flex min-w-0 flex-col gap-2"><dt className="text-sm text-muted-foreground">거래 단계</dt><dd>{stageLabel(deal.stage)}</dd></div>
            <div className="flex min-w-0 flex-col gap-2"><dt className="text-sm text-muted-foreground">요청일</dt><dd className="tabular-nums">{new Date(deal.createdAt).toLocaleDateString("ko-KR")}</dd></div>
          </dl>
          <Button variant="outline" render={<Link href={`/deals/${deal.id}`} />}>{!factory && deal.status === "requested" ? "요청 확인하고 수락하기" : factory && deal.status === "accepted" ? "계약 작성하기" : "거래 보기"}</Button>
        </CardContent>
      </Card>)}</div>}
  </main>;
}
