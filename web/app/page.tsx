"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function Home() {
  const router = useRouter();
  const [company, setCompany] = useState("");

  function startDiagnosis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = company.trim();
    if (!name) return;
    router.push(`/dashboard?company=${encodeURIComponent(name)}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle><h1 className="text-2xl font-semibold">기업명을 입력하세요</h1></CardTitle>
          <CardDescription>우리 기업의 데이터 가치를 확인하는 첫 단계입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={startDiagnosis} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="company-name">기업명</FieldLabel>
              <Input id="company-name" name="company" autoComplete="organization" placeholder="기업명 입력" required maxLength={100} value={company} onChange={(event) => setCompany(event.target.value)} aria-describedby="company-help" />
              <FieldDescription id="company-help">입력한 기업명은 진단 화면에 표시됩니다.</FieldDescription>
            </Field>
            <Button type="submit" disabled={!company.trim()}>데이터 진단 시작</Button>
            <p className="text-sm text-muted-foreground">원본 데이터는 공장 밖으로 나가지 않습니다.</p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
