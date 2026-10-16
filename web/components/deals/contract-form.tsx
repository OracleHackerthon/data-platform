"use client";

import { useState } from "react";
import { contractOptions, won } from "@/components/deals/deal-labels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { ContractTerms, PriceGuide } from "@/lib/types";

type Choice = keyof typeof contractOptions;
const choiceLabels: Record<Choice, string> = { purpose: "사용 목적", period: "사용 기간", scope: "데이터 범위", delivery: "제공 방식" };

export function ContractForm({ guide, busy, onSubmit }: { guide: PriceGuide | null; busy: boolean; onSubmit: (terms: ContractTerms) => void }) {
  const initial = guide ? Math.round((guide.recommendedLow + guide.recommendedHigh) / 2 / 10000) * 10000 : 0;
  const [price, setPrice] = useState(initial ? String(initial) : "");
  const [choices, setChoices] = useState<Record<Choice, string>>({ purpose: "PoC 검증", period: "3개월", scope: "원본 일부(격리 환경)", delivery: "격리 환경 접속" });
  const amount = Number(price.replace(/[^0-9]/g, ""));
  const outside = guide && amount > 0 && (amount < guide.recommendedLow || amount > guide.recommendedHigh);

  return <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); if (amount > 0) onSubmit({ price: amount, ...choices }); }}>
    {guide && <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
      <p className="text-sm text-muted-foreground">권장 가격 범위 (가치평가지수 {guide.valueIndex.toLocaleString("ko-KR")}점 기준)</p>
      <p className="text-xl font-semibold tabular-nums">{won(guide.recommendedLow)} ~ {won(guide.recommendedHigh)}</p>
      <p className="text-sm text-muted-foreground">이 데이터셋의 기준 범위 {won(guide.min)} ~ {won(guide.max)} 안에서, 지수가 높을수록 위쪽을 권장합니다. 지수는 참고 지표이며 최종 가격은 공장이 정합니다.</p>
    </div>}
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="contract-price">계약 금액 (원)</FieldLabel>
        <Input id="contract-price" inputMode="numeric" value={amount ? amount.toLocaleString("ko-KR") : price} disabled={busy} onChange={(event) => setPrice(event.target.value.replace(/[^0-9]/g, ""))} aria-invalid={amount <= 0 || undefined} />
        <FieldDescription>{outside ? "권장 범위 밖입니다. 그대로 저장할 수 있습니다." : "권장 범위 중간값으로 채워 두었습니다."}</FieldDescription>
      </Field>
      {(Object.keys(contractOptions) as Choice[]).map((key) => <Field key={key}>
        <FieldLabel htmlFor={`contract-${key}`}>{choiceLabels[key]}</FieldLabel>
        <Select value={choices[key]} disabled={busy} onValueChange={(value) => { if (value !== null) setChoices({ ...choices, [key]: value as string }); }} items={Object.fromEntries(contractOptions[key].map((option) => [option, option]))}>
          <SelectTrigger id={`contract-${key}`} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>{contractOptions[key].map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </Field>)}
    </FieldGroup>
    {outside && <Alert><AlertTitle>권장 범위 밖의 금액입니다</AlertTitle><AlertDescription>권장 범위는 {won(guide.recommendedLow)} ~ {won(guide.recommendedHigh)} 입니다. 최종 가격은 공장이 정하므로 그대로 저장할 수 있습니다.</AlertDescription></Alert>}
    <Button type="submit" disabled={busy || amount <= 0}>{busy && <Spinner data-icon="inline-start" />}{busy ? "저장 중…" : "계약 저장"}</Button>
  </form>;
}
