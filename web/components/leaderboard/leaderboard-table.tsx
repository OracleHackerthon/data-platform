"use client";

import { useEffect, useRef, useState } from "react";
import { requestApi } from "@/components/dashboard/use-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Deal, LeaderboardRow } from "@/lib/types";

export function LeaderboardTable({ taskId, rows, update }: {
  taskId: string;
  rows: LeaderboardRow[];
  update: (rows: LeaderboardRow[]) => void;
}) {
  const [pendingVendor, setPendingVendor] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const percent = (value: number) => `${(value * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
  const mostReferences = Math.max(...rows.map((row) => row.badges.referencesCnt));

  async function requestContact(row: LeaderboardRow) {
    if (controllerRef.current || row.deal) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(65000)]);
    setPendingVendor(row.vendorId);
    setNotice("");
    setError(false);
    try {
      const deal = await requestApi<Deal>("/api/deals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "factory", taskId: Number(taskId), vendorId: row.vendorId }), signal,
      });
      if (controller.signal.aborted) return;
      update(rows.map((item) => item.vendorId === row.vendorId ? { ...item, deal: { id: deal.id, status: deal.status } } : item));
      setNotice(`${row.alias}에 연락을 요청했습니다.`);
    } catch {
      if (controller.signal.aborted) return;
      // 공통 requestApi는 HTTP 상태를 숨긴다. 409 또는 응답 유실 뒤에도
      // 순위표의 deal을 다시 확인해 중복 요청을 "이미 요청함"으로 복구한다.
      try {
        const latest = await requestApi<LeaderboardRow[]>(`/api/tasks/${encodeURIComponent(taskId)}/leaderboard?role=factory`, { signal });
        if (controller.signal.aborted) return;
        update(latest);
        if (latest.find((item) => item.vendorId === row.vendorId)?.deal) setNotice(`${row.alias}: 이미 요청함`);
        else setError(true);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    } finally {
      if (!controller.signal.aborted) setPendingVendor(null);
      controllerRef.current = null;
    }
  }

  return <div className="flex min-w-0 flex-col gap-4">
    <p role="status" className="text-sm text-muted-foreground">{pendingVendor !== null ? "연락을 요청하고 있습니다…" : notice}</p>
    {error && <Alert variant="destructive"><AlertTitle>연락 요청을 확인하지 못했습니다</AlertTitle><AlertDescription>연결 상태를 확인하고 다시 시도해 주세요. 이미 저장된 요청은 중복으로 만들어지지 않습니다.</AlertDescription></Alert>}
    <Table>
      <TableCaption>불량 검출률 내림차순, 같으면 정확도순입니다. 좁은 화면에서는 표를 좌우로 이동할 수 있습니다.</TableCaption>
      <TableHeader><TableRow>
        <TableHead>순위·업체</TableHead><TableHead>정확도</TableHead><TableHead>불량 검출률 ↑</TableHead><TableHead>오탐률 ↓</TableHead>
        <TableHead>업력</TableHead><TableHead>레퍼런스</TableHead><TableHead>유지보수</TableHead><TableHead>보안 인증</TableHead><TableHead>연락 요청</TableHead>
      </TableRow></TableHeader>
      <TableBody>{rows.map((row, index) => <TableRow key={row.vendorId} className={index === 0 ? "bg-muted/50" : undefined}>
        <TableCell><div className="flex items-center gap-2"><span className="font-medium">{index + 1}위 · {row.alias}</span>{index === 0 && <Badge>검출률 1위</Badge>}</div></TableCell>
        <TableCell className="tabular-nums">{percent(row.accuracy)}</TableCell>
        <TableCell className="font-semibold tabular-nums">{percent(row.recall)}</TableCell>
        <TableCell className="tabular-nums">{percent(row.fpr)}</TableCell>
        <TableCell><Badge variant="outline">{row.badges.years}년</Badge></TableCell>
        <TableCell><div className="flex items-center gap-2"><Badge variant={row.badges.referencesCnt === mostReferences ? "secondary" : "outline"}>{row.badges.referencesCnt}건</Badge>{row.badges.referencesCnt === mostReferences && <span className="text-sm text-muted-foreground">최다</span>}</div></TableCell>
        <TableCell><Badge variant="outline">{row.badges.maintenance ? "제공" : "미제공"}</Badge></TableCell>
        <TableCell><Badge variant="outline">{row.badges.certified ? "인증" : "미인증"}</Badge></TableCell>
        <TableCell><Button size="sm" variant="outline" aria-label={`${row.alias} ${row.deal ? "이미 요청함" : "연락 요청"}`}
          onClick={() => requestContact(row)} disabled={pendingVendor !== null || !!row.deal} aria-busy={pendingVendor === row.vendorId}>
          {pendingVendor === row.vendorId && <Spinner aria-hidden="true" />}{row.deal ? "이미 요청함" : pendingVendor === row.vendorId ? "요청 중…" : "연락 요청"}
        </Button></TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </div>;
}
