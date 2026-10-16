"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ValueIndexSummary } from "@/lib/types";

export function ValueChart({ value }: { value: ValueIndexSummary }) {
  return <div className="flex min-w-0 flex-col gap-4">
    <ChartContainer className="mx-auto h-64 w-full max-w-md aspect-auto" config={{ score: { label: "영역 점수", color: "var(--chart-2)" } }}>
      <RadarChart data={value.areas} outerRadius="60%" accessibilityLayer>
        <PolarGrid />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 10]} tickCount={3} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Radar name="영역 점수" dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.2} />
      </RadarChart>
    </ChartContainer>
    <p className="text-sm text-muted-foreground">영역 점수 · 10점 만점. 평가 제외 영역은 점수가 표시되지 않습니다.</p>
    <dl className="grid gap-2 sm:grid-cols-2">
      {value.areas.map((area) => <div key={area.key} className="flex justify-between gap-2"><dt>{area.label}</dt><dd className="shrink-0 tabular-nums">{area.score === null ? "평가 제외" : `${area.score.toLocaleString("ko-KR")}점`}</dd></div>)}
    </dl>
  </div>;
}
