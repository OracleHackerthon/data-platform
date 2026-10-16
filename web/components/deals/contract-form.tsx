"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { requestApi } from "@/components/dashboard/use-api";
import type { ContractTerms, Deal } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

// docs/API_CONTRACT.md B-4의 계약 선택지.
const choices = [
  { key: "purpose", label: "목적", values: ["PoC 검증", "본 도입"] },
  { key: "period", label: "기간", values: ["1개월", "3개월", "6개월"] },
  { key: "scope", label: "범위", values: ["합성 데이터만", "원본 일부(격리 환경)", "원본 전체(격리 환경)"] },
  { key: "delivery", label: "전달 방식", values: ["격리 환경 접속", "API 제공"] },
] as const;

export function ContractForm({ deal, onSaved }: { deal: Deal; onSaved: () => void }) {
  const [price, setPrice] = useState("");
  const [terms, setTerms] = useState<Omit<ContractTerms, "price">>({ purpose: "", period: "", scope: "", delivery: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const saving = useRef(false);
  const amount = Number(price);
  const valid = price.trim() !== "" && Number.isSafeInteger(amount) && amount >= 0 && Object.values(terms).every(Boolean);
  const guide = deal.priceGuide;
  const outside = guide && valid && (amount < guide.recommendedLow || amount > guide.recommendedHigh);
  async function save() {
    if (!valid || saving.current) return;
    saving.current = true; setBusy(true); setError(false);
    try {
      await requestApi<Deal>(`/api/deals/${deal.id}/contract`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "factory", price: amount, ...terms }) });
      toast.success("계약을 저장했습니다"); onSaved();
    } catch { setError(true); }
    finally { saving.current = false; setBusy(false); }
  }
  return <Card><CardHeader><CardTitle>계약 조건 작성</CardTitle><CardDescription>최종 가격과 이용 조건을 정하세요. 저장하면 입금 대기 단계로 이동합니다.</CardDescription></CardHeader><CardContent>
    <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      {guide ? <div className="flex flex-col gap-2 rounded-lg bg-muted p-4"><p className="text-sm text-muted-foreground">권장 가격 범위 · 가치평가지수 {guide.valueIndex.toLocaleString("ko-KR")}점 기준</p><p className="tabular-nums">{guide.recommendedLow.toLocaleString("ko-KR")}원 ~ {guide.recommendedHigh.toLocaleString("ko-KR")}원</p><p className="text-sm text-muted-foreground">권장 범위는 참고용이며 최종 가격은 공장이 정합니다.</p></div> : <p className="text-sm text-muted-foreground">진단 결과가 없어 권장 가격을 표시할 수 없습니다. 계약 가격은 직접 정할 수 있습니다.</p>}
      <FieldGroup>
        <Field><FieldLabel htmlFor="contract-price">계약 가격 (원)</FieldLabel><Input id="contract-price" type="number" min="0" step="1" required disabled={busy} value={price} onChange={(event) => setPrice(event.target.value)} aria-describedby="contract-price-help" /><FieldDescription id="contract-price-help">원 단위 정수로 입력하세요.{outside ? " 권장 범위 밖의 가격입니다. 이 가격으로도 저장할 수 있습니다." : ""}</FieldDescription></Field>
        <div className="grid gap-4 sm:grid-cols-2">{choices.map(({ key, label, values }) => <Field key={key}><FieldLabel htmlFor={`contract-${key}`}>{label}</FieldLabel><Select value={terms[key] || null} disabled={busy} onValueChange={(value) => { if (value !== null) setTerms((previous) => ({ ...previous, [key]: value })); }} items={Object.fromEntries(values.map((value) => [value, value]))}><SelectTrigger id={`contract-${key}`} className="w-full"><SelectValue placeholder="선택해 주세요" /></SelectTrigger><SelectContent><SelectGroup>{values.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>)}</div>
      </FieldGroup>
      {error && <Alert variant="destructive"><AlertTitle>계약을 저장하지 못했습니다</AlertTitle><AlertDescription>입력한 조건은 유지됩니다. 잠시 후 다시 저장해 주세요.</AlertDescription></Alert>}
      <Button type="submit" disabled={!valid || busy}>{busy && <Spinner data-icon="inline-start" />}{busy ? "저장 중…" : "계약 저장"}</Button>
    </form>
  </CardContent></Card>;
}
