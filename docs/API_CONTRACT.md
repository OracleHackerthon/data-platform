# API_CONTRACT

변경은 정민만 한다. 문서를 먼저 고치고, 그다음 코드를 고친다.

## 상태 흐름
| 상태 | 뜻 | 다음 할 일 |
|---|---|---|
| 초안 | 형태를 논의 중 | 정민이 담당자들과 맞춘 뒤 확정 |
| 확정 | 형태 고정. 코드 작성 가능 | API 담당자가 `$mock` 으로 가짜 응답 먼저 머지 |
| MOCK | 가짜 응답이 main 에 있음 | 화면 담당자가 연결 시작. API 담당자는 실제 구현 |
| 실제 | 실제 구현이 main 에 있음 | 끝 |

확정 이후 형태를 바꾸면 화면과 API 양쪽이 깨진다. 꼭 바꿔야 하면 정민이 변경 이력에 남기고 양쪽 담당자에게 알린다.

## 공통
- 응답 형식: `{ "ok": true, "data": ... }` 또는 `{ "ok": false, "error": "메시지" }`
- 경로
  - 화면 → web: `/api/<기능>` (Next.js, 영진)
  - web → ai: `http://ai:8000/<기능>` (FastAPI, 승연, 내부 전용)

## 템플릿 (복사해서 사용)
### <기능> — 상태: 초안 / 확정 / MOCK / 실제
- 화면 → web: `POST /api/<기능>` (담당: 영진)
  - 요청: `{ }`
  - 응답 data: `{ }`
  - 오류: 400 입력 누락 / 502 AI 실패
- web → ai: `POST /<기능>` (담당: 승연)
  - 요청: `{ }`
  - 응답 data: `{ }`

## 확정된 계약

### health — 상태: 확정
- `GET /api/health` → data: `{ "web": "up", "ai": "up" | "down" }`
- `GET /api/db-check` → data: `{ "result": 1 }`

## 기능 계약 (PLAN B-1~B-6) — 상태: 확정 (10/16 21시, 공유 타입 `web/lib/types.ts`)

### 이 절의 공통 규칙
- **역할 전달**: GET 은 쿼리 `?role=factory` 또는 `?role=startup&vendorId=<n>`, POST·PUT 은 본문에 `"role"`, `"vendorId"` 를 넣는다. 화면 상단 토글과 업체 Select(스타트업일 때만 보임)의 값을 그대로 보낸다.
- 역할이 맞지 않으면 403, 스타트업이 볼 수 없는 과제(미공개, 차단 업종)는 **404** (존재 자체를 숨긴다).
- 비율은 0~1 숫자(화면이 %로 바꾼다), 날짜는 ISO 문자열, ID 는 숫자.
- 업체는 수락 전까지 `alias`("업체 B")로만 나온다. 실명·연락처는 `parties` 에만 있고, 수락 전에는 `null` 이다.
- 원본 행(`RAW_ROWS`)은 어떤 응답에도 넣지 않는다. 원본에서 나가는 것은 집계값(지표, 분포 비율, 점수)뿐이다.
- 모든 API 는 `ACCESS_LOG` 에 한 줄 남긴다 (`action` 값은 B-5 표).
- 시드 ID (영진이 시드를 넣을 때 맞춘다): 데이터셋 `1`, 과제 `1`, 업체 A·B·C = `1`·`2`·`3`, 경쟁 업종 업체 D = `4`.

### B-1. 진단 — `POST /api/datasets/[id]/diagnose` (담당: 영진)
- 요청: `{ "role": "factory" }`
- 하는 일: SQL 로 지표 계산 + `DATASETS` 메타데이터 조회 → ai `/diagnose` 호출 → 지표·지수·리포트·과제 카드를 그 데이터셋의 `TASKS` 행에 저장 (다시 누르면 덮어씀)
- 응답 data:
```json
{
  "datasetId": 1, "taskId": 1,
  "metrics": {
    "rowCount": 1567, "columnCount": 40, "missingRate": 0.08, "collectedFrom": "2008-07-19", "collectedTo": "2008-10-17",
    "defectRate": 0.066, "outlierRate": 0.012,
    "meaningfulColumnCount": 31, "absoluteScaleRatio": 1.0, "consistencyRate": 0.91, "validRowCount": 1203
  },
  "valueIndex": { …아래 "가치평가지수 형태" },
  "report": "진단 리포트 문단",
  "taskCard": { "title": "공정 불량 예측", "problem": "…", "metric": "불량 검출률(recall)", "dataNeeded": "…" }
}
```
- `metrics` 위 7개는 화면 표시용, 아래 4개는 지수용 SQL 지표다. `meaningfulColumnCount` 는 결측 30% 이상 컬럼을 뺀 수, `validRowCount` 는 **모든 컬럼에** 결측이 없는 행 수 (논문 정의, 시드 데이터 기준 1), `consistencyRate` 는 결측이 아닌 셀 비율 (논문의 정합성율을 결측 셀로 근사), `absoluteScaleRatio` 는 숫자형 컬럼 중 비율·증감이 아닌 측정값 컬럼 비중 (시드 데이터는 1.0). 지표 정의·환산 구간은 PLAN B "가치평가지수"
- 오류: 403 역할 / 404 데이터셋 없음 / 502 AI 실패 (이때 `TASKS` 는 바꾸지 않는다. 화면은 "다시 시도" 를 보여 준다)

### 가치평가지수 형태 (`valueIndex`, 진단·과제 상세·카탈로그가 같이 쓴다)
```json
{
  "score": 642, "min": 300, "max": 1000,
  "areas": [
    { "key": "content", "label": "콘텐츠 적합성", "weight": 32, "score": 5.9 },
    { "key": "quality", "label": "품질·공급 신뢰성", "weight": 47, "score": 6.4 },
    { "key": "usability", "label": "기술적 사용성", "weight": 9, "score": 8.0 },
    { "key": "economy", "label": "경제성", "weight": 12, "score": null }
  ],
  "elements": [
    { "key": "physical_quality", "label": "물리적 품질", "area": "quality", "weight": 20, "adjustedWeight": 24.7, "score": 5.5, "source": "sql" }
  ],
  "suggestions": [
    { "element": "physical_quality", "label": "물리적 품질", "text": "결측 30% 이상인 센서 9개를 다시 수집하면…", "expectedGain": 111 }
  ]
}
```
- `score`: 지수 (정수). `areas[].score`, `elements[].score`: 10점 척도 (소수 1자리). 평가할 지표가 없으면 `null` (화면은 "평가 제외")
- `weight`: 논문 가중치. `adjustedWeight`: 빠진 요소를 제외하고 100으로 다시 맞춘 가중치 (지수 계산에 쓰는 값)
- `source`: `"sql" | "llm" | "meta"`. `suggestions` 는 점수가 낮은 요소부터 최대 3개. `expectedGain` 은 그 요소가 10점이 될 때 오르는 지수 (정수)
- `elements` 와 `suggestions` 는 공장에게만 준다. 카탈로그·스타트업에게는 `score`, `min`, `max`, `areas` 만 준다.

### B-1. 진단 — web → ai `POST /diagnose` (담당: 승연)
- 요청:
```json
{
  "metrics": { …위 metrics 와 같음 },
  "meta": { "createdOn": "2008-10-17", "supplyCycle": "일 1회", "deliveryMethod": "격리 환경 접속", "fileFormat": "csv", "creditGrade": "BB", "qualityCert": false, "aggregationCycle": "주기없음 (웨이퍼 단위 발생)" },
  "columns": [{ "name": "s_001", "type": "number" }]
}
```
- 응답 data: `{ "valueIndex": { …위 형태, elements·suggestions 포함 }, "report": "문단", "taskCard": { "title", "problem", "metric", "dataNeeded" } }`
- LLM 에는 컬럼 이름 목록과 집계 지표만 보낸다. 원본 값은 보내지 않는다.
- 지수 계산은 파이썬(`ai/value_index.py`)이 한다. LLM 은 판정 4개(정보범주수, 표준연계키 개수, 연속형컬럼명 표기명확성, 범주형컬럼값 기준명확성)와 문장(리포트, 과제 카드, 개선 제안)만 만든다. 프롬프트 `ai/prompts/diagnose.md`, 출력은 JSON 으로 고정한다.

### B-1. 공개 정책 — `PUT /api/tasks/[id]/policy` (담당: 영진)
- 요청: `{ "role": "factory", "synthLevel": "medium", "blockIndustry": "반도체 제조" | null }`
- 하는 일: 정책 저장 + `status` 를 `"published"` 로
- 응답 data: `{ "taskId": 1, "synthLevel": "medium", "blockIndustry": "반도체 제조", "status": "published" }`
- `synthLevel`: `"low" | "medium" | "high"`. 합성 데이터는 `medium` 만 준비하므로 화면은 low·high 를 비활성으로 둔다.
- `blockIndustry`: `VENDORS.industry` 값 중 하나. 업체 D 의 업종과 같은 값을 시드로 둔다.
- 오류: 400 값 오류 / 403 역할 / 409 진단 전(과제 카드 없음)

### B-2. 카탈로그 — `GET /api/tasks?role=startup&vendorId=` (담당: 영진)
- 응답 data: 공개됐고 이 업체의 업종이 차단되지 않은 과제 배열 (없으면 `[]`)
```json
[{ "id": 1, "title": "…", "problem": "…", "metric": "…", "dataNeeded": "…", "rowCount": 1567, "synthLevel": "medium",
   "valueIndex": { "score": 642, "min": 300, "max": 1000, "areas": [ … ] } }]
```

### B-1·B-2. 과제 상세 — `GET /api/tasks/[id]?role=&vendorId=` (담당: 영진)
- 공통 data: `{ "id", "title", "problem", "metric", "dataNeeded", "status": "draft" | "published", "synthLevel", "blockIndustry" }` (진단 전이면 title 등은 `null`)
- `role=factory` 일 때 추가 (공장 대시보드가 새로고침 후 이 값으로 다시 그린다):
  `{ "datasetId": 1, "metrics": { … } | null, "valueIndex": { …전체 } | null, "report": "…" | null }`
- `role=startup` 일 때 추가:
```json
{
  "valueIndex": { "score": 642, "min": 300, "max": 1000, "areas": [ … ] },
  "synthPreview": { "columns": ["s_001", "s_002", "…", "label"], "rows": [[3030.9, 2564.0, 0]] },
  "distributions": [{ "column": "s_001", "bins": [{ "label": "2900~3000", "rawShare": 0.31, "synthShare": 0.29 }] }],
  "mySubmission": { "accuracy": 0.96, "recall": 0.81, "fpr": 0.02, "createdAt": "…" } | null
}
```
  - `synthPreview.rows` 는 `SYNTH_ROWS` 10행. 센서 컬럼이 많으니 앞쪽 몇 개 + `label` 만 준다. `distributions` 는 컬럼 1~2개, 구간별 **비율**(원본 행 아님)
- 오류: 403 역할 / 404 (스타트업: 미공개·차단 과제 포함)

### B-3. 제출·채점 — `POST /api/tasks/[id]/submissions` (담당: 영진)
- 요청: `{ "role": "startup", "vendorId": 2 }`
- 하는 일: `PREDICTIONS`(이 업체·과제) 와 `RAW_ROWS` 라벨을 `row_id` 로 조인해 accuracy, recall, fpr 을 SQL 로 계산 → `SUBMISSIONS` 에 새 행
- 응답 data: `{ "submissionId": 7, "accuracy": 0.96, "recall": 0.81, "fpr": 0.02, "createdAt": "…" }`
- 다시 제출하면 새 행을 만들고, 순위표는 업체별 최신 제출을 쓴다.
- 오류: 400 이 업체의 예측값 없음 / 403 역할 / 404 볼 수 없는 과제

### B-3. 익명 순위표 — `GET /api/tasks/[id]/leaderboard?role=factory` (담당: 영진)
- 응답 data: 업체별 최신 제출, recall 내림차순(같으면 accuracy)
```json
[{
  "vendorId": 2, "alias": "업체 B", "accuracy": 0.96, "recall": 0.81, "fpr": 0.02, "submittedAt": "…",
  "badges": { "years": 5, "referencesCnt": 12, "maintenance": true, "certified": true },
  "deal": { "id": 3, "status": "requested" } | null
}]
```
- `deal` 은 "연락 요청" 버튼 상태용 (있으면 "요청 완료")
- 오류: 403 역할

### B-4. 연락 요청 — `POST /api/deals` (담당: 영진)
- 요청: `{ "role": "factory", "taskId": 1, "vendorId": 2 }`
- 응답 data: 아래 "거래 한 건" 형태 (`status: "requested"`)
- 오류: 403 역할 / 404 과제·업체 없음 / 409 이미 요청함

### B-4. 거래 목록 — `GET /api/deals?role=startup&vendorId=` 또는 `?role=factory&taskId=` (담당: 영진)
- 스타트업 "받은 요청" 과 공장 쪽 목록에 쓴다.
- 응답 data: "거래 한 건" 배열, 최신순 (없으면 `[]`)

### B-4. 수락 — `POST /api/deals/[id]/accept` (담당: 영진)
- 요청: `{ "role": "startup", "vendorId": 2 }`
- 응답 data: "거래 한 건" (`status: "accepted"`, `parties` 채워짐)
- 오류: 403 역할·다른 업체의 거래 / 409 `requested` 가 아님

### B-4. 계약 저장 — `PUT /api/deals/[id]/contract` (담당: 영진)
- 요청: `{ "role": "factory", "price": 12000000, "purpose": "…", "period": "…", "scope": "…", "delivery": "…" }` (`price` 는 원 단위 정수, 공장이 입력. 나머지는 화면 Select 의 문구를 그대로 저장)
  - `price` 가 권장 범위 밖이어도 저장한다 (최종 가격은 공장이 정한다). 화면은 범위 밖이면 안내만 한다.
  - 선택지 초안: purpose `PoC 검증` / `본 도입`, period `1개월` / `3개월` / `6개월`, scope `합성 데이터만` / `원본 일부(격리 환경)` / `원본 전체(격리 환경)`, delivery `격리 환경 접속` / `API 제공`
- 응답 data: "거래 한 건" (`status: "contracted"`, `stage: "payment_pending"`)
- 오류: 400 빈 값 / 403 역할 / 409 `accepted` 가 아님

### B-4. 거래 한 건 — `GET /api/deals/[id]?role=&vendorId=` (담당: 영진)
```json
{
  "id": 3, "taskId": 1, "taskTitle": "…", "vendorId": 2, "vendorAlias": "업체 B",
  "status": "requested" | "accepted" | "contracted",
  "stage": "contract" | "payment_pending" | "access_granted" | "settled",
  "contract": { "price", "purpose", "period", "scope", "delivery" } | null,
  "priceGuide": { "min": 5000000, "max": 20000000, "recommendedLow": 10830000, "recommendedHigh": 13830000, "valueIndex": 642 } | null,
  "parties": { "factory": { "name", "contact" }, "vendor": { "name", "contact" } } | null,
  "createdAt": "…"
}
```
- `parties` 는 `status` 가 `requested` 면 `null`
- `priceGuide` 는 공장에게만 준다 (스타트업이면 `null`). 단위는 원. 계산 (초안):
  - `min`, `max` 는 `DATASETS.price_min`, `price_max` 시드값
  - `p = (지수 − 300) / 700`, 권장 중심 `c = min + (max − min) × p`
  - `recommendedLow = c − (max − min) × 0.1`, `recommendedHigh = c + (max − min) × 0.1` (각각 `min`~`max` 안으로 자르고, 만 원 단위로 반올림)
  - 진단 전이라 지수가 없으면 `null`
- `stage` 는 계약 저장 시 `payment_pending` 까지만 바뀐다. 이후 단계는 화면 표시만 (MOCK, 결제 없음)
- 오류: 403 공장도 해당 업체도 아님 / 404

### B-5. 접근 기록 — `GET /api/access-log?role=factory` (담당: 영진)
- 응답 data: `{ "rawDownloadCount": 0, "items": [{ "id", "at", "role", "actor", "action", "target" }] }` (시각 오름차순)
- `actor`: `"공장"` 또는 업체 별칭(`"업체 B"`). `target`: `"task:1"`, `"deal:3"` 처럼
- `action` 값: `diagnose`, `publish`, `list_tasks`, `view_task`, `submit`, `view_leaderboard`, `request_contact`, `list_deals`, `accept`, `save_contract`, `view_deal`, `view_access_log`
- `rawDownloadCount` 는 `action = 'raw_download'` 개수 (원본 다운로드 API 가 없으므로 항상 0)
- 오류: 403 역할

### B-6. 데모 초기화 — `POST /api/demo/reset` (담당: 영진)
- 요청: 없음. 화면 버튼 없이 `curl` 또는 `/admin` 에서만 부른다.
- 하는 일: `SUBMISSIONS` 를 업체 A·C 시드만 남기고, `DEALS`·`ACCESS_LOG` 비움, `TASKS` 의 진단 결과·정책·상태를 시드(진단 전, `draft`)로
- 응답 data: `{ "reset": true }`

## 변경 이력
- 10/16 B-1~B-6 계약 초안 추가 (정민 확인 전)
- 10/16 데이터셋 SECOM 으로 변경, 품질 점수(`qualityScore`)를 가치평가지수(`valueIndex`)로 교체, 계약에 `price`·`priceGuide` 추가 (초안)
- 10/16 21시 B-1~B-6 계약 확정 (정민). 이후 변경은 이 이력에 남기고 `web/lib/types.ts` 를 같은 PR 에서 고친다
- 10/16 21시 샘플 `ai-example` 제거 (VM 배포본에서 OpenAI 연결 확인 후, DECISIONS D7)
- 10/16 22시 가치평가지수를 논문 그림 4·표 7 기준으로 확정: `validRowCount` 를 논문 정의(모든 컬럼)로, `meta.aggregationCycle` 추가(DB `datasets.aggregation_cycle`), LLM 판정에 표준연계키 개수 추가. 응답 형태(`valueIndex`)는 그대로
