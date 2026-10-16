"use client";

import Link from "next/link";
import { useRole } from "@/components/role/role-provider";
import { useApi } from "@/components/dashboard/use-api";
import type { Deal } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels = { requested: "수락 대기", accepted: "수락 완료", contracted: "계약 완료" };

export default function DealsPage() {
  const { role, query, ready } = useRole();
  const { data, loading, error, reload } = useApi<Deal[]>(ready ? `/api/deals?${query}${role === "factory" ? "&taskId=1" : ""}` : null);
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <section className="flex flex-col gap-2"><h1 className="text-2xl font-semibold">{role === "startup" ? "받은 연락 요청" : "거래 목록"}</h1><p className="text-sm text-muted-foreground">연락 요청부터 계약까지 진행 상황을 확인하세요. 수락 후에만 양쪽 실명과 연락처가 공개됩니다.</p></section>
    {!ready || loading ? <div aria-busy="true" className="grid gap-4 lg:grid-cols-2"><p role="status" className="sr-only">거래를 불러오고 있습니다.</p><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      : error ? <Alert variant="destructive"><AlertTitle>거래를 불러오지 못했습니다</AlertTitle><AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription><Button variant="outline" onClick={reload}>다시 시도</Button></Alert>
      : !data?.length ? <Empty><EmptyHeader><EmptyTitle>아직 거래가 없습니다</EmptyTitle><EmptyDescription>{role === "factory" ? "순위표에서 업체에 연락을 요청하면 여기에 표시됩니다." : "공장이 연락을 요청하면 여기에 표시됩니다."}</EmptyDescription></EmptyHeader></Empty>
      : <div className="grid min-w-0 gap-4 lg:grid-cols-2">{data.map((deal) => <Card key={deal.id}>
        <CardHeader><div className="flex flex-wrap items-center justify-between gap-4"><CardTitle className="min-w-0 break-words">{deal.vendorAlias}</CardTitle><Badge variant="outline">{statusLabels[deal.status]}</Badge></div><CardDescription className="break-words">{deal.taskTitle}</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4"><p className="text-sm text-muted-foreground">{deal.status === "requested" ? "수락 전에는 실명과 연락처가 공개되지 않습니다." : deal.status === "accepted" ? "연락처가 공개되었습니다. 공장이 계약 조건을 저장할 수 있습니다." : "계약이 저장되었습니다. 거래 상세에서 조건을 확인하세요."}</p><Button variant="outline" render={<Link href={`/deals/${deal.id}`} />}>거래 상세 보기</Button></CardContent>
      </Card>)}</div>}
  </main>;
}
