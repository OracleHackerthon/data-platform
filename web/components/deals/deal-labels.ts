import type { DealStage, DealStatus } from "@/lib/types";

export const statusLabels: Record<DealStatus, string> = {
  requested: "연락 요청됨",
  accepted: "수락됨",
  contracted: "계약 완료",
};

// 계약 저장 시 payment_pending 까지만 실제로 바뀐다. 이후 단계는 표시만 한다 (계약 B-4, 결제 없음).
export const stages: { key: DealStage; label: string }[] = [
  { key: "contract", label: "계약 협의" },
  { key: "payment_pending", label: "입금 대기" },
  { key: "access_granted", label: "격리 환경 접근 허용" },
  { key: "settled", label: "정산 완료" },
];

export const stageLabel = (stage: DealStage) => stages.find((item) => item.key === stage)?.label ?? stage;

export const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

// 계약 폼 선택지 (API_CONTRACT B-4 계약 저장의 선택지 초안 문구 그대로 저장한다)
export const contractOptions = {
  purpose: ["PoC 검증", "본 도입"],
  period: ["1개월", "3개월", "6개월"],
  scope: ["합성 데이터만", "원본 일부(격리 환경)", "원본 전체(격리 환경)"],
  delivery: ["격리 환경 접속", "API 제공"],
} as const;
