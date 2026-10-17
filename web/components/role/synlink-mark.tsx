// 양쪽 기업의 경계 안에 원본을 두고, 가운데 합성 데이터로 연결한다.
export function SynLinkMark() {
  return <svg viewBox="0 0 64 40" fill="none" className="h-8 w-12 shrink-0" aria-hidden="true" focusable="false">
    <rect x="2" y="6" width="21" height="28" rx="7" stroke="currentColor" strokeWidth="2" />
    <rect x="41" y="6" width="21" height="28" rx="7" stroke="currentColor" strokeWidth="2" />
    <path d="M9 14h7M9 20h5M48 20h5M48 26h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 20h7m12 0h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="m32 14 6 6-6 6-6-6 6-6Z" fill="currentColor" />
    <path d="m32 5 2 2-2 2-2-2 2-2Zm0 26 2 2-2 2-2-2 2-2Z" fill="currentColor" opacity=".45" />
  </svg>;
}
