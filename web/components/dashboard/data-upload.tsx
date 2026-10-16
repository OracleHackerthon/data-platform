"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function DataUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section aria-labelledby="upload-title">
      <Card>
        <CardHeader>
          <CardTitle><h2 id="upload-title" className="text-lg font-semibold">데이터 업로드</h2></CardTitle>
          <CardDescription>가장 먼저 진단할 데이터 파일을 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-dashed bg-muted/50 p-6">
            <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="diagnosis-file">진단할 데이터 파일</FieldLabel>
                <Input ref={inputRef} id="diagnosis-file" type="file" aria-describedby="upload-help" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                <FieldDescription id="upload-help">현재 파일 선택만 가능합니다. 업로드 기능이 연결되기 전에는 파일이 서버로 전송되지 않습니다.</FieldDescription>
              </Field>
            </FieldGroup>
          </div>
          <div aria-live="polite" role="status">
            {file ? (
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="break-all font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{file.size.toLocaleString("ko-KR")}바이트 · 선택됨</p>
                </div>
                <Button type="button" variant="outline" onClick={clearFile}>선택 취소</Button>
              </div>
            ) : <p className="text-sm text-muted-foreground">아직 선택한 파일이 없습니다.</p>}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
