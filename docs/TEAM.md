# TEAM (담당: 정민)

Codex 가 대화를 시작할 때 사용자가 누구인지 확인하고, 이 문서의 해당 절을 읽고 안내한다 (AGENTS.md "사용자에 대해").
팀원은 Codex 를 켜고 **"나 예원이야"** 처럼 이름만 말하면 된다.

## 공통: 처음 읽는 순서
1. `docs/PLAN.md`: A(제품: 문제, 사용자 흐름, 데모 시나리오, 디자인 방향)와 B(구현: 내 기능 체크리스트), 일정
2. `docs/API_CONTRACT.md`: 화면 ↔ API ↔ AI 가 주고받는 형태와 상태(초안 / 확정 / MOCK / 실제)
3. `docs/DECISIONS.md`: 이미 정한 것 (DB, 폰트, MOCK 위치, 패키지 등)
4. 아래 "내 절" 의 "참고할 코드"
- 읽지 않는 것: `docs/OCI_RUNBOOK.md`, `docs/MERGER_CHECKLIST.md` (정민 전용 배포·머지 절차)
- 저장소 전체를 훑지 않는다. 필요한 파일만 연다.

## 공통: 첫 보고 (3줄)
문서를 읽은 뒤 사용자에게 쉬운 말로 보고한다.
1. 우리가 만드는 것 (PLAN 한 줄 요약. PLAN 이 비어 있으면 "아직 기획 전입니다")
2. 내 기능의 상태 (계약 상태, 상대 API 가 MOCK 인지 실제인지)
3. 지금 할 첫 일 (아래 "단계별 할 일" 기준) 과, 기능이 정해져 있으면 `$start <기능>` 으로 시작하자는 제안

## 공통: 단계별 할 일
| 단계 | 알아보는 법 | 할 일 |
|---|---|---|
| 기획 전 | PLAN 의 "A. 제품" 이 비어 있음 | 코드 작업 없음. 로컬 실행 확인만 |
| 기획 끝, 계약 확정 | 계약 상태가 "확정" | API 담당은 `$mock`, 화면 담당은 화면 뼈대부터 |
| MOCK | 계약 상태가 "MOCK" | 화면 담당은 연결, API 담당은 실제 구현 |
| 기능 동결 (토 11:00 이후) | PLAN 체크포인트 | 버그 수정만 |

## 공통: 제출 시점
- 체크리스트 항목 하나가 화면에서 동작하면 바로 `$submit` 한다. 몇 시간씩 모아서 올리지 않는다 (1~2시간에 PR 1개 정도).
- 정민은 **매시 정각**에 몰아서 머지한다. 이번 정각에 넣으려면 **매시 50분까지** 제출한다.
- 머지 공지("$sync 해 주세요")가 오면 바로 `$sync` 한다.
- 예외: 1일차 13:30~14:30 의 계약·MOCK PR 은 올라오는 대로 머지된다. 2일차 11:00 이후는 버그 수정만 올리고, 올라오는 대로 머지된다.

## 공통: 정민을 부르기 전에 먼저 할 것
1. 오류 메시지 **전체**를 Codex 에게 그대로 붙여 넣고 "원인과 고칠 방법을 쉬운 말로" 라고 요청한다. PR 의 CI 가 빨간불이면 "$gh-fix-ci 내 PR CI 실패 원인 찾아줘" 라고 한다.
2. 빌드 오류면 `npm run build` 출력의 **첫 번째 오류**부터 고친다 (뒤의 오류는 대개 따라 생긴 것).
3. 위를 두 번 해도 안 되면 정민을 부른다. 아래는 바로 부른다: 충돌, 남의 폴더를 고쳐야 함, 계약을 바꿔야 함, 키·비밀번호가 필요함, 패키지를 추가해야 함.

## 공통: 승인 요청에 답하기
- 내 폴더 안 파일 수정, 빌드·린트, `git add`·`git commit` 은 "예".
- 패키지 설치는 거절하고 정민에게 확인한다.
- **삭제(`Remove-Item`, `rm`, `del`, `rmdir`)는 경로를 끝까지 읽는다.** 내 담당 폴더 안의 하위 폴더나 파일이면 "예(한 번)". 경로가 `telos-hackerthon` 으로 끝나거나(저장소 전체) 저장소 밖이면 **거절**.
- **"항상 허용(always)" 은 어떤 명령에도 누르지 않는다.** 10/15 리허설 때 이 버튼과 삭제 승인 때문에 저장소 폴더 전체가 지워졌다.
- 무슨 명령인지 모르겠으면 거절하고 "무슨 명령인지 쉽게 설명해줘" 라고 묻는다.

## 공통: 개발 서버
- 개발 서버(`npm run dev`, `uvicorn`)는 **사용자가 별도 터미널 창에서 직접 실행**하도록 안내한다. Codex 안에서 띄우면 보안 설정 때문에 DB·OpenAI 연결이 막힐 수 있다 `[미검증: 목요일 확인]`.
- Codex 는 명령어를 알려 주고, 사용자가 실행한 결과(브라우저 화면, 오류)를 보고 판단한다.

---

## 예원 (화면·발표)
- 수정할 수 있는 곳: `web/app/**/page.tsx`, `web/app/layout.tsx`, `web/app/globals.css`, `web/components/<기능>/`, `docs/DEMO_SCRIPT.md`
- 참고할 코드: `web/app/page.tsx` (샘플 화면: 버튼 → `/api/*` 호출 → 결과 표시), `web/components/ui/` 의 부품 목록
- 로컬 실행: web 만. `web/.env.local` 은 `AI_SERVICE_URL=http://localhost:8000` 한 줄이면 된다. DB·OpenAI 정보는 필요 없다 (MOCK 으로 개발).
- 주의
  - 화면은 `/api/*` 만 부른다. 상대 API 가 없으면 기다리지 말고 담당자에게 `$mock` 을 요청한다. 화면 안에 가짜 데이터를 넣지 않는다 (DECISIONS D4).
  - 화면 구성·색·상태 화면·발표용 마감 체크는 `ui-design` 스킬을 따른다. 시작 전에 PLAN A 의 "디자인 방향"(서비스명, 강조색)과 B 의 "화면 구성" 을 확인한다.
  - UI 부품은 `web/components/ui/` 것을 먼저 쓴다. 없는 부품은 정민에게 요청한다. 부품 사용 규칙은 `shadcn-ui` 스킬(Base UI 버전)을 따른다.
  - Next.js 사용법은 `web/AGENTS.md` 가 가리키는 설치된 버전의 공식 문서(`web/node_modules/next/dist/docs/`)를 따른다.
- 자주 쓰는 말
  - "API_CONTRACT 의 요약 응답 형태로 요약 화면 만들어줘. 부품은 components/ui 걸 써."
  - "요약 API 가 MOCK 상태야. /api/summary 를 호출해서 화면 연결해줘."
  - "결과가 비었거나 오류일 때 화면도 처리해줘."
  - "모바일 폭에서도 깨지지 않게 다듬어줘."
  - "PLAN 의 디자인 방향대로 강조색이랑 헤더 맞춰줘."
  - "ui-design 의 발표용 마감 체크대로 이 화면 점검해줘."

## 영진 (API·DB)
- 수정할 수 있는 곳: `web/app/api/`, `web/lib/db.ts`, `web/db/` (테이블 정의 `schema.sql`)
- 참고할 코드: `web/app/api/health/route.ts` (API 작성 형태), `web/lib/api.ts` (`ok`, `fail`), `web/lib/db.ts` (`query`), `web/app/api/db-check/route.ts` (DB 쿼리 예시)
- 로컬 실행: web. DB 접속 정보는 정민에게 직접 받아 `web/.env.local` 에만 넣는다 (`DB_USER`, `DB_PASSWORD`, `DB_CONNECT_STRING`). 채팅·커밋·스크린샷에 남기지 않는다.
  - 접속 확인: `npm run dev` 후 `http://localhost:3000/api/db-check` → `{"ok":true,"data":{"result":1}}`
  - 안 되면: 지금 네트워크의 공인 IP 가 DB 허용 목록(ACL)에 없을 가능성이 크다. 와이파이를 바꿨으면 특히 그렇다. 정민에게 IP 추가를 요청한다.
- 테이블 만들기: `web/db/schema.sql` 에 `CREATE TABLE` 을 적어 PR 로 올린다. 실제 실행은 정민이 한다 (실행 방법은 RUNBOOK 5-1).
- 주의
  - Oracle SQL 이다. PostgreSQL·MySQL 문법을 쓰지 않는다 (DECISIONS D1, AGENTS.md 연결 규칙).
  - DB 접근은 `web/lib/db.ts` 의 `query` 만 쓴다. 바인드 변수(`:name`)를 쓰고 문자열을 이어 붙여 SQL 을 만들지 않는다.
  - 계약이 확정되면 실제 구현 전에 `$mock` 부터 올린다. 화면 담당이 기다리고 있다.
  - 예비 머지는 **CI 가 모두 초록이고 `$review-pr` 판정이 "머지 가능" 일 때만** 한다. 그 외에는 정민을 기다린다.
  - 머지는 Codex 가 하지 않는다 (팀 규칙이 `gh pr merge` 를 막는다). 영진이 GitHub 웹의 PR 화면에서 직접 한다: CI 체크가 모두 초록인지 확인 → **Squash and merge** → 제목 확인 → **Confirm** → **Delete branch** → 팀 채팅에 "#<번호> 머지했습니다. $sync 해 주세요".
- 자주 쓰는 말
  - "$mock 요약 기능"
  - "PLAN 기준으로 필요한 테이블을 web/db/schema.sql 에 Oracle 문법으로 설계해줘. 만들기 전에 보여줘."
  - "API_CONTRACT 의 POST /api/summary 를 실제로 구현해줘. AI 는 callAi 로 부르고 결과는 DB 에 저장해."
  - "/api/summary 를 호출하는 curl 명령을 알려줘. 응답이 계약대로인지 같이 보자."

## 승연 (AI·EDA)
- 수정할 수 있는 곳: `ai/` 전체 (`main.py`, `llm.py`, `config.py`, `prompts/`), `research/`
- 참고할 코드: `ai/main.py` 의 `/example` (엔드포인트 형태), `ai/llm.py` 의 `ask`, `ai/prompts/example.md`
- 로컬 실행: ai. 개인 OpenAI API 키를 `ai/.env` 에만 넣는다 (사용 한도 설정 필수). 주최 측 키는 쓰지 않는다. 확인은 `http://localhost:8000/docs` 에서 직접 실행.
- 분석: `research/` 의 노트북에서 직접 한다. 서비스에 들어갈 로직만 `ai/` 로 옮긴다. 원본 데이터는 `research/data/raw/` (git 에 올라가지 않음).
- 주의
  - OpenAI 호출은 `ai/llm.py` 의 `ask` 만 쓴다. 프롬프트는 `ai/prompts/*.md` 파일로 둔다.
  - `ai` 는 DB 에 접근하지 않는다. 데이터를 DB 에 넣어야 하면 영진과 계약을 정한다.
  - 계약이 확정되면 `$mock` 으로 ai 쪽 가짜 응답부터 올린다.
- 자주 쓰는 말
  - "$mock 요약 기능"
  - "research 의 분석 결과를 바탕으로 ai/main.py 에 POST /summary 만들어줘. 프롬프트는 ai/prompts/summary.md 에 둬."
  - "응답 형식이 들쑥날쑥해. 프롬프트만 고쳐서 출력 형식을 고정해줘."

## 정민 (통합·배포)
Claude Code 를 쓴다. `CLAUDE.md` 와 `docs/MERGER_CHECKLIST.md` 를 따른다.
