"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "./role-provider";
import { SynLinkMark } from "./synlink-mark";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

// API_CONTRACT.md 공통 규칙: 업체 A~D의 시드 ID는 1~4. 실명은 수락 전에 표시하지 않는다.
const vendors = { 1: "업체 A", 2: "업체 B", 3: "업체 C", 4: "업체 D (반도체 제조)" };

export function RoleToggle() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">역할 메뉴를 불러오고 있습니다…</p>}><RoleControls /></Suspense>;
}

function RoleControls() {
  const { role, vendorId, setRole, setVendorId, ready } = useRole();
  const router = useRouter();
  const path = usePathname();
  const links = role === "factory"
    ? [["/dashboard", "대시보드"], ["/dashboard/register", "과제 등록"], ["/tasks/1/leaderboard", "순위표"], ["/deals", "거래"], ["/access-log", "접근 기록"]]
    : [["/catalog", "카탈로그"], ["/deals", "거래"]];
  function changeRole(next: Role) {
    setRole(next);
    router.push(next === "factory" ? "/dashboard" : "/catalog");
  }
  return <div className="flex w-full flex-col gap-8">
    <div className="flex flex-col items-center gap-4 text-center">
      <Link href="/" aria-label="SynLink 홈" title="합성 데이터로 검증의 병목을 풀고 기업을 연결합니다" className="flex items-center gap-2 border-y-2 border-primary py-2 text-2xl font-semibold text-primary"><SynLinkMark />SynLink</Link>
      <p className="text-sm text-muted-foreground">원본은 공장에게, 검증은 데이터 위에서.</p>
    </div>
    {path !== "/" && <div className="flex flex-wrap items-center justify-between gap-4">
      <nav aria-label="주 메뉴" className="flex flex-wrap items-center gap-2">
        {links.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={cn("rounded-lg px-4 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", path === href ? "bg-secondary text-primary" : "text-muted-foreground")}>{label}</Link>)}
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">현재 역할</span>
        <div role="group" aria-label="역할 전환" className="flex gap-2">
          <Button disabled={!ready} aria-pressed={role === "factory"} variant={role === "factory" ? "default" : "outline"} onClick={() => changeRole("factory")}>공장</Button>
          <Button disabled={!ready} aria-pressed={role === "startup"} variant={role === "startup" ? "default" : "outline"} onClick={() => changeRole("startup")}>스타트업</Button>
        </div>
        {role === "startup" && <Select value={vendorId} items={vendors} onValueChange={(value) => { if (value !== null) setVendorId(value); }}>
          <SelectTrigger aria-label="업체 선택"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>{Object.entries(vendors).map(([id, label]) => <SelectItem key={id} value={Number(id)}>{label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>}
      </div>
    </div>}
  </div>;
}
