// API 요청·응답 형태 (docs/API_CONTRACT.md 를 그대로 옮긴 것). 화면과 API 가 같이 쓴다.
// 원본은 API_CONTRACT.md 다. 계약이 바뀌면 같은 PR 에서 이 파일도 고친다 (담당: 정민).

// ---------- 공통 ----------
export type Role = "factory" | "startup";

// GET 은 쿼리, POST·PUT 은 본문에 싣는다. vendorId 는 스타트업일 때만.
export type Actor = { role: Role; vendorId?: number };

// ---------- 진단 (B-1) ----------
export type Metrics = {
  // 화면 표시용
  rowCount: number;
  columnCount: number;
  missingRate: number; // 0~1
  collectedFrom: string; // ISO 날짜
  collectedTo: string;
  defectRate: number;
  outlierRate: number;
  // 가치평가지수용 SQL 지표
  meaningfulColumnCount: number;
  absoluteScaleRatio: number;
  consistencyRate: number;
  validRowCount: number;
};

export type ValueArea = {
  key: "content" | "quality" | "usability" | "economy";
  label: string;
  weight: number; // 논문 가중치
  score: number | null; // 10점 척도, null 이면 "평가 제외"
};

export type ValueElement = {
  key: string;
  label: string;
  area: ValueArea["key"];
  weight: number;
  adjustedWeight: number; // 빠진 요소를 제외하고 100으로 다시 맞춘 값
  score: number | null;
  source: "sql" | "llm" | "meta";
};

export type ValueSuggestion = {
  element: string;
  label: string;
  text: string;
  expectedGain: number;
};

// 카탈로그·스타트업이 받는 형태
export type ValueIndexSummary = {
  score: number;
  min: number;
  max: number;
  areas: ValueArea[];
};

// 공장이 받는 형태 (요소·개선 제안 포함)
export type ValueIndex = ValueIndexSummary & {
  elements: ValueElement[];
  suggestions: ValueSuggestion[];
};

export type TaskCard = {
  title: string;
  problem: string;
  metric: string;
  dataNeeded: string;
};

export type DiagnoseRequest = { role: "factory" };

export type DiagnoseResult = {
  datasetId: number;
  taskId: number;
  metrics: Metrics;
  valueIndex: ValueIndex;
  report: string;
  taskCard: TaskCard;
};

// web → ai POST /diagnose
export type AiDiagnoseRequest = {
  metrics: Metrics;
  meta: {
    createdOn: string;
    supplyCycle: string;
    deliveryMethod: string;
    fileFormat: string;
    creditGrade: string;
    qualityCert: boolean;
    aggregationCycle: string; // 논문 지표 "집계주기 규칙성"
  };
  columns: { name: string; type: "number" | "string" | "date" }[];
};

export type AiDiagnoseResult = {
  valueIndex: ValueIndex;
  report: string;
  taskCard: TaskCard;
};

// ---------- 공개 정책 (B-1) ----------
export type SynthLevel = "low" | "medium" | "high";
export type TaskStatus = "draft" | "published";

export type PolicyRequest = {
  role: "factory";
  synthLevel: SynthLevel;
  blockIndustry: string | null;
};

export type PolicyResult = {
  taskId: number;
  synthLevel: SynthLevel;
  blockIndustry: string | null;
  status: TaskStatus;
};

// ---------- 카탈로그·과제 상세 (B-2) ----------
export type TaskSummary = TaskCard & {
  id: number;
  rowCount: number;
  synthLevel: SynthLevel;
  valueIndex: ValueIndexSummary;
};

type TaskBase = {
  id: number;
  // 진단 전이면 null
  title: string | null;
  problem: string | null;
  metric: string | null;
  dataNeeded: string | null;
  status: TaskStatus;
  synthLevel: SynthLevel;
  blockIndustry: string | null;
};

export type ScoreSet = {
  accuracy: number;
  recall: number;
  fpr: number;
};

export type TaskDetailFactory = TaskBase & {
  datasetId: number;
  metrics: Metrics | null;
  valueIndex: ValueIndex | null;
  report: string | null;
};

export type TaskDetailStartup = TaskBase & {
  valueIndex: ValueIndexSummary;
  synthPreview: { columns: string[]; rows: (number | string | null)[][] };
  distributions: {
    column: string;
    bins: { label: string; rawShare: number; synthShare: number }[];
  }[];
  mySubmission: (ScoreSet & { createdAt: string }) | null;
};

// ---------- 제출·순위표 (B-3) ----------
export type SubmissionRequest = { role: "startup"; vendorId: number };

export type Submission = ScoreSet & {
  submissionId: number;
  createdAt: string;
};

export type DealStatus = "requested" | "accepted" | "contracted";
export type DealStage = "contract" | "payment_pending" | "access_granted" | "settled";

export type LeaderboardRow = ScoreSet & {
  vendorId: number;
  alias: string;
  submittedAt: string;
  badges: {
    years: number;
    referencesCnt: number;
    maintenance: boolean;
    certified: boolean;
  };
  deal: { id: number; status: DealStatus } | null;
};

// ---------- 거래 (B-4) ----------
export type DealRequest = { role: "factory"; taskId: number; vendorId: number };
export type AcceptRequest = { role: "startup"; vendorId: number };

export type ContractTerms = {
  price: number; // 원
  purpose: string;
  period: string;
  scope: string;
  delivery: string;
};

export type ContractRequest = { role: "factory" } & ContractTerms;

export type PriceGuide = {
  min: number;
  max: number;
  recommendedLow: number;
  recommendedHigh: number;
  valueIndex: number;
};

export type Party = { name: string; contact: string };

export type Deal = {
  id: number;
  taskId: number;
  taskTitle: string;
  vendorId: number;
  vendorAlias: string;
  status: DealStatus;
  stage: DealStage;
  contract: ContractTerms | null;
  priceGuide: PriceGuide | null; // 공장에게만
  parties: { factory: Party; vendor: Party } | null; // 수락 전이면 null
  createdAt: string;
};

// ---------- 접근 기록 (B-5) ----------
export type AccessAction =
  | "diagnose"
  | "publish"
  | "list_tasks"
  | "view_task"
  | "submit"
  | "view_leaderboard"
  | "request_contact"
  | "list_deals"
  | "accept"
  | "save_contract"
  | "view_deal"
  | "view_access_log"
  | "raw_download";

export type AccessLogItem = {
  id: number;
  at: string;
  role: Role;
  actor: string; // "공장" 또는 업체 별칭
  action: AccessAction;
  target: string | null; // "task:1", "deal:3"
};

export type AccessLog = {
  rawDownloadCount: number;
  items: AccessLogItem[];
};

// ---------- 데모 초기화 (B-6) ----------
export type ResetResult = { reset: true };
