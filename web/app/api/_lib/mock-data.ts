// MOCK: 데모 데이터와 메모리 상태 - 실제 구현 전 임시 응답
// 단일 Node 프로세스용이다. 재시작 시 초기화되며 여러 서버 간 공유되지 않는다.
export const vendors = [
  { id: 1, alias: "업체 A", industry: "산업용 소프트웨어", name: "가상 분석 A", contact: "a@example.com", badges: { years: 7, referencesCnt: 15, maintenance: true, certified: true } },
  { id: 2, alias: "업체 B", industry: "제조 AI", name: "가상 분석 B", contact: "b@example.com", badges: { years: 5, referencesCnt: 12, maintenance: true, certified: true } },
  { id: 3, alias: "업체 C", industry: "로봇 소프트웨어", name: "가상 분석 C", contact: "c@example.com", badges: { years: 3, referencesCnt: 6, maintenance: true, certified: false } },
  { id: 4, alias: "업체 D", industry: "반도체 제조", name: "가상 분석 D", contact: "d@example.com", badges: { years: 4, referencesCnt: 8, maintenance: false, certified: false } },
];

export const metrics = {
  rowCount: 1567, columnCount: 40, missingRate: 0.08,
  collectedFrom: "2008-07-19", collectedTo: "2008-10-17",
  defectRate: 104 / 1567, outlierRate: 0.012,
  meaningfulColumnCount: 31, absoluteScaleRatio: 1,
  consistencyRate: 0.92, validRowCount: 1203,
};

const elementSeeds = [
  { key: "diversity", label: "다양성", area: "content", weight: 11, score: 7, source: "sql" },
  { key: "linkage", label: "연계성", area: "content", weight: 7, score: 6, source: "llm" },
  { key: "clarity", label: "명확성", area: "content", weight: 7, score: 3, source: "llm" },
  { key: "timeliness", label: "적시성", area: "content", weight: 7, score: 4, source: "meta" },
  { key: "physical_quality", label: "물리적 품질", area: "quality", weight: 20, score: 6, source: "sql" },
  { key: "row_sufficiency", label: "건수 충분성", area: "quality", weight: 9, score: 8, source: "sql" },
  { key: "supply_continuity", label: "공급 지속성", area: "quality", weight: 11, score: 6, source: "meta" },
  { key: "provider_reliability", label: "공급자 신뢰도", area: "quality", weight: 7, score: 5, source: "meta" },
  { key: "delivery_convenience", label: "수령 방식 편의성", area: "usability", weight: 5, score: 9, source: "meta" },
  { key: "format_openness", label: "확장자 개방성", area: "usability", weight: 4, score: 10, source: "meta" },
  { key: "restrictions", label: "제약성", area: "economy", weight: 6, score: null, source: "meta" },
  { key: "substitutability", label: "대체 가능성", area: "economy", weight: 6, score: null, source: "meta" },
] as const;

// 고정 Mock 점수의 표시값만 맞춘다. 실제 SQL·LLM 평가나 가치 산정은 하지 않는다.
const activeWeight = elementSeeds.reduce((sum, e) => sum + (e.score === null ? 0 : e.weight), 0);
const elements = elementSeeds.map((e) => ({ ...e, adjustedWeight: e.score === null ? 0 : Math.round(e.weight / activeWeight * 1000) / 10 }));
const areas = [
  { key: "content", label: "콘텐츠 적합성", weight: 32 },
  { key: "quality", label: "품질·공급 신뢰성", weight: 47 },
  { key: "usability", label: "기술적 사용성", weight: 9 },
  { key: "economy", label: "경제성", weight: 12 },
].map((area) => {
  const included = elements.filter((e) => e.area === area.key && e.score !== null);
  const weight = included.reduce((sum, e) => sum + e.weight, 0);
  return { ...area, score: weight ? Math.round(included.reduce((sum, e) => sum + (e.score ?? 0) * e.weight, 0) / weight * 10) / 10 : null };
});

export const valueIndex = {
  score: Math.round(elementSeeds.reduce((sum, e) => sum + (e.score ?? 0) * e.weight, 0) / activeWeight * 100),
  min: 300, max: 1000, areas, elements,
  suggestions: [
    { element: "clarity", label: "명확성", text: "익명 센서 컬럼에 측정 대상과 단위 설명을 보완해 주세요.", expectedGain: Math.round(7 * 7 / activeWeight * 100) },
    { element: "timeliness", label: "적시성", text: "최근 공정 데이터를 추가해 수집 시점의 차이를 줄여 주세요.", expectedGain: Math.round(6 * 7 / activeWeight * 100) },
    { element: "provider_reliability", label: "공급자 신뢰도", text: "품질 인증과 데이터 관리 절차를 추가해 주세요.", expectedGain: Math.round(5 * 7 / activeWeight * 100) },
  ],
};

export const taskCard = {
  title: "공정 불량 예측", problem: "센서 측정값으로 반도체 공정의 불량을 예측합니다.",
  metric: "불량 검출률(recall)", dataNeeded: "센서 측정값, 수집 시각, 정상·불량 라벨",
};
export const report = "[MOCK] 공정 센서 데이터의 활용 가능성을 보여 주는 예시 진단입니다. 일부 센서의 결측과 익명 컬럼 설명을 보완하고, 불량 비율이 낮으므로 정확도와 함께 불량 검출률을 비교해 주세요.";

export const synthPreview = {
  columns: ["s_001", "s_002", "label"],
  rows: [[3030.9, 2564, 0], [3012.4, 2541.2, 0], [2980.1, 2520.6, 0], [3055.7, 2580.1, 1], [3001.5, 2538.3, 0], [2992.8, 2550.4, 0], [3040.2, 2570.6, 0], [3020.6, 2547.8, 0], [2975.3, 2512.5, 1], [3018.9, 2556.7, 0]],
};
export const distributions = [{ column: "s_001", bins: [
  { label: "2900~3000", rawShare: 0.31, synthShare: 0.29 },
  { label: "3000~3100", rawShare: 0.52, synthShare: 0.55 },
  { label: "3100~3200", rawShare: 0.17, synthShare: 0.16 },
] }];

export type Role = "factory" | "startup";
export type Submission = { submissionId: number; vendorId: number; accuracy: number; recall: number; fpr: number; createdAt: string };
export type Deal = {
  id: number; taskId: number; vendorId: number;
  status: "requested" | "accepted" | "contracted";
  stage: "contract" | "payment_pending";
  contract: { price: number; purpose: string; period: string; scope: string; delivery: string } | null;
  createdAt: string;
};
type LogItem = { id: number; at: string; role: Role; actor: string; action: string; target: string };
type MockState = {
  diagnosed: boolean; status: "draft" | "published";
  synthLevel: "low" | "medium" | "high"; blockIndustry: string | null;
  submissions: Submission[]; deals: Deal[]; logs: LogItem[];
  nextSubmissionId: number; nextDealId: number; nextLogId: number;
};

function initialState(): MockState {
  return {
    diagnosed: false, status: "draft", synthLevel: "medium", blockIndustry: null,
    submissions: [
      { submissionId: 1, vendorId: 1, accuracy: 0.94, recall: 0.67, fpr: 0.04, createdAt: "2026-10-16T00:00:00.000Z" },
      { submissionId: 2, vendorId: 3, accuracy: 0.92, recall: 0.55, fpr: 0.06, createdAt: "2026-10-16T00:01:00.000Z" },
    ],
    deals: [], logs: [], nextSubmissionId: 3, nextDealId: 1, nextLogId: 1,
  };
}

// 라우트별 번들과 개발 중 재로딩에서 같은 상태를 사용한다.
const shared = globalThis as typeof globalThis & { manufacturingMockState?: MockState };
export function getState() {
  return shared.manufacturingMockState ??= initialState();
}
export function resetState() {
  shared.manufacturingMockState = initialState();
}
export function publicValueIndex() {
  const { score, min, max, areas } = valueIndex;
  return { score, min, max, areas };
}
export function logAction(role: Role, vendorId: number | undefined, action: string, target: string) {
  const state = getState();
  state.logs.push({ id: state.nextLogId++, at: new Date().toISOString(), role,
    actor: role === "factory" ? "공장" : vendors.find((v) => v.id === vendorId)!.alias,
    action, target });
}
export function canViewTask(vendorId: number) {
  const state = getState();
  const vendor = vendors.find((v) => v.id === vendorId);
  return !!vendor && state.status === "published" && vendor.industry !== state.blockIndustry;
}
export function latestSubmission(vendorId: number) {
  return getState().submissions.findLast((s) => s.vendorId === vendorId);
}
export function dealResponse(deal: Deal, role: Role) {
  const vendor = vendors.find((v) => v.id === deal.vendorId)!;
  const min = 5_000_000, max = 20_000_000;
  const center = min + (max - min) * (valueIndex.score - 300) / 700;
  const roundPrice = (amount: number) => Math.round(Math.min(max, Math.max(min, amount)) / 10_000) * 10_000;
  return {
    ...deal, taskTitle: taskCard.title, vendorAlias: vendor.alias,
    priceGuide: role === "factory" && getState().diagnosed ? {
      min, max, recommendedLow: roundPrice(center - (max - min) * 0.1),
      recommendedHigh: roundPrice(center + (max - min) * 0.1), valueIndex: valueIndex.score,
    } : null,
    parties: deal.status === "requested" ? null : {
      factory: { name: "가상 반도체 공장", contact: "factory@example.com" },
      vendor: { name: vendor.name, contact: vendor.contact },
    },
  };
}
