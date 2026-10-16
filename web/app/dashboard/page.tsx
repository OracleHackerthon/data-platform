import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const metrics = ["결측률", "데이터 행 수", "수집 기간", "불량 비율", "이상값 비율"];
const areas = ["콘텐츠 적합성", "품질·공급 신뢰성", "기술적 사용성", "경제성"];

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" aria-labelledby="dashboard-title">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 id="dashboard-title" className="text-2xl font-semibold">내 데이터 진단</h1>
          <p className="text-sm text-muted-foreground">데이터의 가치를 확인하고, AI 업체에게 공개할 범위를 정하세요.</p>
          <p className="text-sm text-muted-foreground">상대 업체는 과제를 공개한 뒤 익명 과제와 합성 데이터만 볼 수 있습니다.</p>
        </div>
        <Badge variant="outline">진단 전</Badge>
      </section>

      <Alert>
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>원본은 공장 밖으로 나가지 않습니다</AlertTitle>
        <AlertDescription>진단에는 집계 지표를 사용하며, 원본 데이터는 업체에 공개되지 않습니다.</AlertDescription>
      </Alert>

      <section className="flex flex-col gap-4" aria-labelledby="diagnosis-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="diagnosis-title" className="text-lg font-semibold">데이터 가치와 품질</h2>
            <p id="diagnosis-help" className="text-sm text-muted-foreground">진단 기능을 준비 중입니다. 연결이 완료되면 진단을 시작할 수 있습니다.</p>
          </div>
          <Button disabled aria-describedby="diagnosis-help">진단하기</Button>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>가치평가지수</CardTitle>
              <CardDescription>4개 영역을 종합한 데이터 가치 평가</CardDescription>
            </CardHeader>
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>아직 진단 결과가 없습니다</EmptyTitle>
                  <EmptyDescription>진단이 완료되면 지수와 개선할 요소를 확인할 수 있습니다.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>영역별 평가</CardTitle>
              <CardDescription>진단 후 4개 영역의 레이더 차트가 표시됩니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-4">
                {areas.map((area) => (
                  <div key={area} className="flex items-center justify-between gap-4 border-b pb-2">
                    <dt>{area}</dt>
                    <dd className="shrink-0 text-sm text-muted-foreground">평가 전</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => (
            <Card key={metric}>
              <CardHeader><dt className="text-sm text-muted-foreground">{metric}</dt></CardHeader>
              <CardContent><dd aria-label="진단 전" className="tabular-nums">—</dd></CardContent>
            </Card>
          ))}
        </dl>
      </section>

      <section className="grid min-w-0 gap-8 lg:grid-cols-2" aria-label="진단 결과 상세">
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold">개선 제안</h2>
          <p className="text-sm text-muted-foreground">진단 후 점수가 낮은 요소부터, 보완할 내용과 기대 상승 점수를 안내합니다.</p>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold">AI 진단 리포트</h2>
          <p className="text-sm text-muted-foreground">진단 후 데이터의 강점과 한계를 정리한 리포트가 표시됩니다.</p>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label="과제와 공개 정책">
        <Card>
          <CardHeader>
            <CardTitle>공개할 과제</CardTitle>
            <CardDescription>진단 결과를 바탕으로 업체에게 보여 줄 과제가 작성됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>진단 후 과제가 준비됩니다</EmptyTitle>
                <EmptyDescription>해결할 문제, 평가 지표, 필요한 데이터를 확인한 뒤 공개하세요.</EmptyDescription>
              </EmptyHeader>
            </Empty>
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
              <Select defaultValue="medium" items={{ low: "낮음 (준비 중)", medium: "중간", high: "높음 (준비 중)" }}>
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
              <Select defaultValue="semiconductor" items={{ semiconductor: "반도체 제조", none: "차단하지 않음" }}>
                <SelectTrigger id="block-industry" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectGroup>
                  <SelectItem value="semiconductor">반도체 제조</SelectItem>
                  <SelectItem value="none">차단하지 않음</SelectItem>
                </SelectGroup></SelectContent>
              </Select>
            </Field>
            <p id="publish-help" className="text-sm text-muted-foreground">진단을 완료한 뒤 과제를 공개할 수 있습니다. 현재 선택은 저장되지 않습니다.</p>
            <Button disabled aria-describedby="publish-help">과제 공개</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
