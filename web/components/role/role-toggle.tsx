"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useRole } from "./role-provider";
import { SynLinkMark } from "./synlink-mark";
import { cn } from "@/lib/utils";
import styles from "./interactions.module.css";

export function RoleToggle() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">역할 메뉴를 불러오고 있습니다…</p>}><RoleControls /></Suspense>;
}

function RoleControls() {
  // 역할은 첫 화면에서 고른다. 바꾸려면 SynLink 를 눌러 첫 화면으로 돌아간다 (스타트업은 기본 업체 B).
  const { role } = useRole();
  const path = usePathname();
  const links = role === "factory"
    ? [["/dashboard", "대시보드"], ["/dashboard/register", "과제 등록"], ["/tasks/1/leaderboard", "순위표"], ["/deals", "거래"], ["/access-log", "접근 기록"]]
    : [["/catalog", "카탈로그"], ["/deals", "거래"]];
  return <div className="flex w-full flex-col gap-8">
    <div className="flex flex-col items-center gap-4 text-center">
      <Link href="/" aria-label="SynLink 홈" title="합성 데이터로 검증의 병목을 풀고 기업을 연결합니다" className="flex items-center gap-2 border-y-2 border-primary py-2 text-2xl font-semibold text-primary"><SynLinkMark />SynLink</Link>
    </div>
    {path !== "/" && <div className="flex flex-wrap items-center gap-4">
      <nav aria-label="주 메뉴" className="flex flex-wrap items-center gap-2">
        {links.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={cn("rounded-lg px-4 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", styles.menu, path === href ? "bg-secondary text-primary" : "text-muted-foreground")}>{label}</Link>)}
      </nav>
    </div>}
  </div>;
}
