"use client";

import { useRouter } from "next/navigation";
import { useRole } from "@/components/role/role-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/lib/types";

// 첫 화면에서 역할을 고른다. 역할은 탭마다 저장되므로 창 두 개로 공장·스타트업을 함께 시연할 수 있다.
const choices: { role: Role; href: string; title: string; description: string; steps: string[]; action: string }[] = [
  { role: "factory", href: "/dashboard", title: "공장", description: "원본 데이터는 공장 안에 두고, 가치를 진단해 과제로 공개합니다.",
    steps: ["데이터 가치 진단과 개선 제안", "공개 정책을 정해 과제 공개", "익명 순위표에서 업체 비교·연락", "거래 진행과 접근 기록 확인"], action: "공장으로 시작" },
  { role: "startup", href: "/catalog", title: "스타트업", description: "원본을 받지 않고, 합성 데이터와 채점으로 모델 성능을 증명합니다.",
    steps: ["익명 과제 카탈로그 탐색", "합성 데이터로 적합성 확인", "모델 제출과 채점 결과 확인", "연락 요청 수락과 계약"], action: "스타트업으로 시작" },
];

export default function Home() {
  const { setRole, ready } = useRole();
  const router = useRouter();
  function start(role: Role, href: string) {
    setRole(role);
    router.push(href);
  }
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
    <div className="flex flex-col gap-2"><h1 className="text-2xl font-semibold">어떤 역할로 시작할까요?</h1><p className="text-sm text-muted-foreground">창을 두 개 열어 한쪽은 공장, 한쪽은 스타트업으로 시작하면 거래 흐름을 함께 볼 수 있습니다.</p></div>
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">{choices.map((choice) => <Card key={choice.role}>
      <CardHeader><CardTitle>{choice.title}</CardTitle><CardDescription>{choice.description}</CardDescription></CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        <ol className="flex list-decimal flex-col gap-2 rounded-lg bg-muted p-4 pl-8 text-sm">{choice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <Button disabled={!ready} onClick={() => start(choice.role, choice.href)}>{choice.action}</Button>
      </CardContent>
    </Card>)}</div>
  </main>;
}
