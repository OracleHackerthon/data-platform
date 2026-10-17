"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Factory, ShieldCheck, Sparkles } from "lucide-react";
import { useRole } from "@/components/role/role-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Role } from "@/lib/types";

export default function Home() {
  const { setRole, ready } = useRole();
  const router = useRouter();

  function enter(role: Role) {
    setRole(role);
    router.push(role === "factory" ? "/dashboard" : "/catalog");
  }

  return <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8 sm:py-16">
    <section className="flex flex-col gap-4 text-center">
      <h1 className="text-2xl font-semibold sm:text-3xl">SynLink, 어떤 역할로 시작하시겠어요?</h1>
      <p className="text-muted-foreground">제조 데이터를 가진 기업과 AI 기술을 가진 스타트업을 연결합니다.<br className="hidden sm:block" />역할을 선택하고 데이터 검증부터 거래까지 시작하세요.</p>
    </section>
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader className="gap-4"><Factory className="size-8 text-primary" aria-hidden="true" /><CardTitle>제조 기업</CardTitle><CardDescription>우리 공장의 데이터로 가장 잘 맞는 AI 업체를 찾고 싶어요.</CardDescription></CardHeader>
        <CardContent className="flex flex-1 flex-col gap-8">
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground"><li>데이터 가치 진단과 공개 정책 설정</li><li>익명 순위표에서 업체 성능 비교</li><li>선택한 업체와 연락하고 계약</li></ul>
          <Button size="lg" className="mt-auto w-full" disabled={!ready} onClick={() => enter("factory")}>제조 기업으로 시작<ArrowRight data-icon="inline-end" /></Button>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader className="gap-4"><Sparkles className="size-8 text-primary" aria-hidden="true" /><CardTitle>스타트업</CardTitle><CardDescription>제조 데이터로 AI 성능을 검증하고 새로운 협업 기회를 찾고 싶어요.</CardDescription></CardHeader>
        <CardContent className="flex flex-1 flex-col gap-8">
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground"><li>공개된 제조 과제와 합성 데이터 확인</li><li>모델 제출과 성능 평가</li><li>연락 요청 확인과 거래 진행</li></ul>
          <Button size="lg" variant="outline" className="mt-auto w-full" disabled={!ready} onClick={() => enter("startup")}>스타트업으로 시작<ArrowRight data-icon="inline-end" /></Button>
        </CardContent>
      </Card>
    </div>
    <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0" aria-hidden="true" />원본 데이터는 공장 밖으로 나가지 않습니다.</p>
    <p className="text-center text-sm text-muted-foreground">입장 후 상단 메뉴에서 역할을 바꿀 수 있습니다.</p>
  </main>;
}
