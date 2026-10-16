# AGENTS.md

해커톤 프로젝트(Oracle TELOS Challenge 2026). 무엇을 만드는지는 `docs/PLAN.md`.

## 구조와 명령어
- `web/` Next.js(App Router, TypeScript, npm): 화면 + API
  - `cd web` → `npm run dev` / 완료 확인 `npm run build` (타입 검사 포함) + `npm run lint`
- `ai/` FastAPI(Python, pip): AI 처리 전용 내부 서비스
  - `cd ai` → `uvicorn main:app --reload --port 8000`
- `research/` EDA 노트북. 배포되지 않는다.
- `deploy/` docker compose, Caddy, 배포 스크립트

## 소유권 (자기 경로 밖은 수정하지 않는다)
| 경로 | 담당 |
|---|---|
| `web/app/` 의 화면(`page.tsx`), `web/app/layout.tsx`, `web/app/globals.css`, `web/components/<기능>/` | 예원 |
| `web/app/api/`, `web/lib/db.ts`, `web/db/` | 영진 |
| `ai/`, `research/` | 승연 |
| `web/lib/api.ts`, `web/lib/ai-client.ts`, `web/components/ui/`, `web/package.json`, `ai/requirements.txt`, `docs/`, `AGENTS.md` | 정민 |
| `deploy/`, `Dockerfile`, `.github/`, `.codex/`, `.agents/`, `.claude/`, `CLAUDE.md`, `web/AGENTS.md`, `web/CLAUDE.md` | 정민 |

남의 경로를 바꿔야 하면 작업을 멈추고, 무엇이 필요한지 사용자에게 알린다.

## 작업 전에 읽을 것
- 팀원과의 첫 대화: `docs/TEAM.md` (읽는 순서, 사람별 할 일)
- 기능 구현: `docs/PLAN.md` 의 해당 기능 체크리스트
- web↔ai, 화면↔API 연결: `docs/API_CONTRACT.md` (적힌 형태를 그대로 따른다)
- 배포: `docs/OCI_RUNBOOK.md` (정민 전용)
- 구조·설정·패키지·배포를 바꾸거나 바꾸자고 제안하기 전: `docs/DECISIONS.md` (이미 내린 결정과 이유)

## 연결 규칙
- 브라우저는 `web` 의 `/api/*` 만 호출한다. `ai` 를 직접 부르지 않는다.
- `web` 에서 `ai` 호출은 `web/lib/ai-client.ts` 의 `callAi` 만 쓴다.
- OpenAI 호출은 `ai/llm.py` 의 `ask` 만 쓴다. 프롬프트는 `ai/prompts/*.md` 에 둔다.
- DB 접근은 `web/lib/db.ts` 만 한다. `ai` 는 DB에 접근하지 않는다.
- DB는 Oracle Autonomous Database(23ai)다. PostgreSQL·MySQL 문법이 아니라 Oracle SQL 을 쓴다 (`GENERATED ALWAYS AS IDENTITY`, `VARCHAR2`, `FETCH FIRST n ROWS ONLY`, 바인드는 `:name`).
- 모든 응답 형식: `{ ok: boolean, data?, error? }`
- 계약(요청/응답 형태)을 바꿔야 하면 코드를 고치지 말고 사용자에게 알린다.

## 금지
- 키·비밀번호·DB 접속 정보를 코드나 커밋에 넣지 않는다. 값은 `.env` 류 파일에만, 키 이름은 `.env.example` 에.
- 비밀값에 `NEXT_PUBLIC_` 접두사를 쓰지 않는다 (브라우저에 노출된다).
- 정민 승인 없이 패키지를 추가하지 않는다.
- 요청받지 않은 배포, OCI 리소스 생성·삭제를 하지 않는다.
- main 에 직접 커밋·푸시하지 않는다.

## 사용자에 대해
- 대화를 시작하면 사용자가 누구인지 확인한다. `git config user.name` 이 예원·영진·승연·정민 중 하나면 그 사람으로 보고, 아니면 "누구세요? (예원, 영진, 승연)" 라고 묻는다.
- 누구인지 알면 `docs/TEAM.md` 의 공통 절과 그 사람 절을 읽고, 정해진 순서대로 문서를 읽은 뒤 3줄로 보고한다. 저장소 전체를 훑지 않는다.
- 팀원은 코드와 git을 직접 다루지 않는다. git, 빌드, PR은 네가 실행하고 결과를 쉬운 말로 보고한다.
- 작업 시작은 `start`, 제출은 `submit`, 최신화는 `sync`, 가짜 API 는 `mock`, 화면 구성·디자인은 `ui-design`, 화면 부품은 `shadcn-ui`, CI 실패 원인 찾기는 `gh-fix-ci` 스킬을 따른다.
- 충돌 해결, 강제 push, reset, rebase, 머지, 서버 접속은 하지 않는다. 필요하면 멈추고 "정민을 불러 주세요" 라고 말한다.
- 파일·폴더 삭제는 사용자 담당 폴더 안의 하위 항목(예: 테스트 폴더, 잘못 만든 파일)만 한다. 실행 전에 "web/app/test 폴더를 지웁니다" 처럼 지울 경로를 쉬운 말로 먼저 알린다.
- **저장소 폴더 자체, 저장소 밖, 다른 사람 담당 경로는 사용자가 직접 요청해도 지우지 않는다.** 그런 요청이면 거절하고 정민을 부르라고 말한다.
- 머지는 사람이 GitHub 웹에서 한다. 영진이 예비 머지를 하려 하면 `$review-pr` 로 판정만 내고, `docs/TEAM.md` 영진 절의 웹 머지 순서를 안내한다.
- 같은 오류를 두 번 고쳐도 해결되지 않으면 멈추고 정민을 부르라고 말한다.

## 작업 방식
- 브랜치 `feat/<기능>`, PR은 `submit` 스킬로 작게. 체크리스트 항목 하나가 동작하면 제출을 제안한다 (머지는 매시 정각, 50분까지 제출한 것이 대상).
- 계약이 확정되면 API 담당자는 실제 구현 전에 `mock` 스킬로 가짜 응답을 먼저 PR 로 올린다. 가짜 응답에는 `MOCK` 주석을 단다.
- 화면은 상대 API가 없어도 기다리지 않는다. mock 이 없으면 담당자에게 mock 을 요청한다.
- 테스트 코드는 요청받았을 때만 작성한다.
- 완료 기준: (web) `npm run build`, `npm run lint` 통과 / (ai) 서버가 뜨고 해당 엔드포인트 응답 확인 / 화면에서 직접 동작 확인.
- PR 본문에 바뀐 파일과 확인 방법을 한두 줄로 적는다.
- UI는 `web/components/ui/` 의 shadcn 컴포넌트를 먼저 쓴다. 없는 컴포넌트는 정민에게 요청한다. 색은 `globals.css` 의 테마 변수(의미 토큰)만 쓰고 색 값을 직접 쓰지 않는다.
- 화면 파일(`web/app/**/page.tsx`, `layout.tsx`, `globals.css`, `web/components/<기능>/`)을 만들거나 고칠 때는 사용자가 말하지 않아도 `ui-design` 스킬을 따른다. 외부 디자인 스킬 보관함(`docs/design-library/`)은 그 스킬의 7절 연결표가 정한 때에만 읽는다.
- **부분 수정만 한다.** 파일을 통째로 다시 쓰지 말고 요청된 부분만 고친다. 요청받지 않은 리팩터링, 이름 변경, 파일 이동·삭제, 포맷 일괄 변경을 하지 않는다.
- 기능의 방향은 `docs/PLAN.md` 의 A(제품), 만들 내용은 B(구현)의 자기 기능 체크리스트를 따른다.

## 이 파일의 관리
- 같은 실수가 두 번 나오면 정민이 규칙 한 줄을 추가한다.
- 규칙이 바뀌면 같은 PR에서 이 파일을 고친다.
- 결정을 바꾸면 같은 PR에서 `docs/DECISIONS.md` 를 고친다.
