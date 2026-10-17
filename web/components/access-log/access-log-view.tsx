import type { AccessAction, AccessLog } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const actionLabels: Record<AccessAction, string> = {
  diagnose: "데이터 진단",
  publish: "과제 공개",
  list_tasks: "카탈로그 조회",
  view_task: "과제 상세 조회",
  submit: "모델 제출·채점",
  view_leaderboard: "순위표 조회",
  request_contact: "연락 요청",
  list_deals: "거래 목록 조회",
  accept: "연락 수락",
  save_contract: "계약 저장",
  advance_stage: "거래 단계 진행",
  view_deal: "거래 조회",
  view_access_log: "접근 기록 조회",
  raw_download: "원본 다운로드",
};

const targetLabels: Record<string, string> = { dataset: "데이터셋", task: "과제", deal: "거래", tasks: "과제 목록", deals: "거래 목록" };

function targetLabel(target: string | null) {
  if (!target) return "-";
  const [kind, id] = target.split(":");
  return id ? `${targetLabels[kind] ?? kind} #${id}` : targetLabels[kind] ?? target;
}

export function AccessLogView({ log }: { log: AccessLog }) {
  return <div className="flex min-w-0 flex-col gap-8">
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>원본 다운로드</CardTitle><CardDescription>공장 원본 데이터가 밖으로 나간 횟수</CardDescription></CardHeader>
        <CardContent><p className="text-4xl font-semibold tabular-nums">{log.rawDownloadCount.toLocaleString("ko-KR")}건</p><p className="mt-2 text-sm text-muted-foreground">업체는 합성 데이터와 채점 점수만 받았습니다. 원본 행을 돌려주는 API 는 없습니다.</p></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>기록된 행동</CardTitle><CardDescription>진단부터 계약까지 모든 요청</CardDescription></CardHeader>
        <CardContent><p className="text-4xl font-semibold tabular-nums">{log.items.length.toLocaleString("ko-KR")}건</p></CardContent>
      </Card>
    </div>
    {log.items.length ? <Card className="min-w-0">
      <CardHeader><CardTitle>접근 기록</CardTitle><CardDescription>누가, 언제, 무엇을 했는지 순서대로 보여 줍니다.</CardDescription></CardHeader>
      <CardContent className="min-w-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>시각</TableHead><TableHead>주체</TableHead><TableHead>행동</TableHead><TableHead>대상</TableHead></TableRow></TableHeader>
          <TableBody>{log.items.map((item) => <TableRow key={item.id}>
            <TableCell className="tabular-nums whitespace-nowrap">{new Date(item.at).toLocaleString("ko-KR", { hour12: false })}</TableCell>
            <TableCell><span className="flex items-center gap-2 whitespace-nowrap">{item.actor}<Badge variant="outline">{item.role === "factory" ? "공장" : "스타트업"}</Badge></span></TableCell>
            <TableCell className="whitespace-nowrap">{item.action === "raw_download" ? <Badge variant="destructive">{actionLabels[item.action]}</Badge> : actionLabels[item.action] ?? item.action}</TableCell>
            <TableCell className="whitespace-nowrap">{targetLabel(item.target)}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card> : <Empty><EmptyHeader><EmptyTitle>아직 기록이 없습니다</EmptyTitle><EmptyDescription>진단, 과제 공개, 제출 같은 행동이 생기면 여기에 순서대로 남습니다.</EmptyDescription></EmptyHeader></Empty>}
  </div>;
}
