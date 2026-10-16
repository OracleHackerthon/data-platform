"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/components/role/role-provider";
import { useApi } from "@/components/dashboard/use-api";
import { AccessLogView } from "@/components/access-log/access-log-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AccessLog } from "@/lib/types";

export default function AccessLogPage() {
  const { role, ready } = useRole();
  const router = useRouter();
  const { data, error, loading, reload } = useApi<AccessLog>(ready && role === "factory" ? "/api/access-log?role=factory" : null);
  useEffect(() => { if (ready && role === "startup") router.replace("/catalog"); }, [ready, role, router]);
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <div className="flex flex-col gap-2"><h1 className="text-2xl font-semibold">접근 기록</h1><p className="text-sm text-muted-foreground">이 데이터에 누가 언제 무엇을 했는지 모두 남습니다.</p><p className="text-sm text-muted-foreground">이 화면은 공장만 볼 수 있습니다.</p></div>
    {!ready || role !== "factory" || loading ? <div aria-busy="true" className="flex flex-col gap-4"><span role="status" className="sr-only">접근 기록을 불러오고 있습니다</span><Skeleton className="h-32" /><Skeleton className="h-64" /></div>
      : error || !data ? <Alert variant="destructive"><AlertTitle>접근 기록을 불러오지 못했습니다</AlertTitle><AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription><Button variant="outline" onClick={reload}>다시 시도</Button></Alert>
      : <AccessLogView log={data} />}
  </main>;
}
