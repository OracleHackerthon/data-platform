import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";


// 빌드 시 외부 폰트 다운로드를 피하려고 시스템 폰트를 쓴다
export const metadata: Metadata = {
  title: "제조 데이터 검증·거래",
  description: "공장 원본 데이터를 내보내지 않고 AI 업체의 성능을 비교하는 플랫폼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={cn("h-full antialiased", "font-sans")}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link href="/dashboard" className="font-semibold focus-visible:outline-2 focus-visible:outline-ring">제조 데이터 검증·거래</Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">대시보드</Link>
              <Badge variant="secondary">현재 역할: 공장</Badge>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
