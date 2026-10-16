import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";


// 빌드 시 외부 폰트 다운로드를 피하려고 시스템 폰트를 쓴다
export const metadata: Metadata = {
  title: "TELOS Starter",
  description: "Oracle TELOS Challenge 2026",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={cn("h-full antialiased", "font-sans")}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
