# DECISIONS (담당: 정민)

이미 내린 결정과 이유. 구조·설정·패키지·배포를 바꾸자는 제안을 하기 전에 여기와 맞는지 먼저 확인한다.
결정을 바꿀 때는 정민의 승인을 받고, 같은 PR 에서 이 문서를 고친다.
검증 상태(무엇이 실제로 확인됐는지)는 `docs/OCI_RUNBOOK.md` 의 `[검증됨]` / `[미검증]` 표시를 본다.

## D1. DB 는 Oracle Autonomous Database(23ai), 지갑 없는 TLS 접속
- 이유: Oracle 주최 대회, Always Free 등급, 10/14 리허설에서 이 방식으로 접속 확인.
- 지킬 것: Oracle SQL 문법. 드라이버는 `oracledb`(Thin). 접속은 `web/lib/db.ts` 하나뿐.
- 되돌리면: PostgreSQL·MySQL 이나 지갑(mTLS) 방식으로 바꾸면 검증된 경로가 사라진다.
- 앱(VM)과 영진 노트북은 **APP 사용자**로 접속한다. ADMIN 비밀번호는 정민만 갖는다 (RUNBOOK 5-1).
- 로컬에서 DB 에 접속하는 사람은 영진뿐이다. 대회 당일 대회장 공인 IP 를 ACL 에 추가한다. 다른 팀원은 MOCK 으로 개발한다.
- 테이블 정의는 `web/db/schema.sql` (영진). 실행은 정민이 Database Actions 에서 한다. 마이그레이션 도구는 쓰지 않는다 (28시간 대회에 비해 준비 비용이 크다).

## D2. 시스템 폰트를 쓴다. `next/font/google` 을 쓰지 않는다
- 이유: 빌드 때 외부에서 폰트를 받는다. 대회장 네트워크나 VM 에서 실패할 수 있다.
- 주의: `npx shadcn add` / `init` 은 `app/layout.tsx` 에 Geist 폰트를 다시 넣을 수 있다. 실행 후 `layout.tsx` 변경을 확인하고 되돌린다.

## D3. 패키지 사실관계
- `cn` 패키지는 쓰인다. `web/lib/utils.ts` 가 `export { cn } from "cn"` 으로 다시 내보내고, `web/components/ui/*` 가 `from "cn"` 으로 직접 가져온다. 지우면 빌드가 실패한다.
- `shadcn` 패키지는 쓰인다. `web/app/globals.css` 가 `@import "shadcn/tailwind.css"` 를 한다.
- `web/Dockerfile` 은 `npm ci` 로 devDependencies 까지 모두 설치하고, 실행 이미지에는 Next.js standalone 결과만 담는다. 그래서 dependencies ↔ devDependencies 이동은 이미지 크기와 빌드 시간에 거의 영향이 없다.
- `recharts` 는 `web/components/ui/chart.tsx` 가 쓴다 (데이터 시각화용, 10/14 추가).
- 패키지를 지우거나 옮기자고 하기 전에 `git grep -n "<패키지명>" -- web ai` 로 TS·CSS·설정 파일까지 사용처를 확인한다.

## D4. MOCK 은 화면이 아니라 API 쪽에 둔다
- 이유: 실제 구현으로 바꿀 때 같은 경로만 고치면 되고 화면 코드는 그대로다.
- 절차: `mock` 스킬, `docs/API_CONTRACT.md` 상태 흐름(초안 → 확정 → MOCK → 실제).
- 되돌리면: 화면에 가짜 데이터를 넣으면 나중에 화면과 API 를 두 번 고친다.

## D5. 배포는 정민이 VM 에서 `deploy/deploy.sh` 로 직접 한다
- CI 자동 배포는 두지 않는다. 의도한 시점에만 배포한다 (심사 중 끊김 방지).
- `deploy.sh` 는 ai, web 이미지를 하나씩 빌드한다. 작은 VM 에서 동시에 빌드하면 멈춘다 (10/14 메모리 500MB VM 에서 확인).
- VM 의 저장소는 clone 전용이다. push·태그는 정민 PC 에서 한다.
- 에이전트는 요청 없이 배포, SSH, OCI 리소스 변경을 하지 않는다.

## D6. main 은 PR 로만 바뀐다. Squash and merge
- GitHub Ruleset 이 main 을 보호하고, CI 잡 `review-note`, `web`, `ai`, `docker` 를 필수로 요구한다.
- CI 잡 이름을 바꾸면 필수 체크가 영원히 대기 상태가 되어 머지가 막힌다. 바꿔야 하면 Ruleset 도 같이 고친다.
- `repo-check` 는 두 review-pr 스킬 파일이 같은지 본다 (필수 아님).

## D7. 샘플의 수명
| 샘플 | 파일 | 언제까지 |
|---|---|---|
| `health` | `web/app/api/health/`, `ai/main.py` 의 `/health` | 끝까지 유지 (배포 확인용) |
| `db-check` | `web/app/api/db-check/` | 끝까지 유지 (DB 확인용) |
| `ai-example` | `web/app/page.tsx`(샘플 화면), `web/app/api/ai-example/`, `ai/main.py` 의 `/example`·`ExampleIn`, `ai/prompts/example.md`, `API_CONTRACT.md` 의 샘플 항목 | 대회 당일 OpenAI 연결을 확인할 때까지. 확인 직후 정민이 한 PR 로 제거 (`MERGER_CHECKLIST.md` 3-1) |
- `ai-example` 은 당일 OpenAI 키를 확인하는 유일한 수단이다. 그 전에 지우지 않는다.
- 여러 사람 경로에 걸쳐 있어 팀원이 지울 수 없다. 정민이 지운다.

## D8. 대회 저장소는 이 템플릿에서 당일 새로 만든다
- 템플릿은 **main 브랜치의 파일만** 복사한다. 다른 브랜치, 열린 PR, Ruleset, 저장소 설정은 넘어가지 않는다.
- 그래서 "당일 쓸 변경" 은 미리 PR 로 만들어 두지 말고 main 에 머지해 두거나, 문서에 절차로 적는다.
- 당일 절차: 저장소 생성 → Ruleset 재설정 → `CLAUDE.md` 의 현재 단계 갱신 → PLAN·계약 반영.

## D9. 일정
- 1일차 10:00~13:00 기획 회의, 13:30~14:30 설계(MOCK, 첫 배포), 2일차 11:00 기능 동결, 14:30 제출. 자세한 체크포인트는 `docs/PLAN.md`.
- 대회 전(~10/16 09:00)에는 기능 코드를 만들지 않는다. 스타터, 문서, 절차만 다듬는다.

## D10. 스택 버전과 AI 가 자주 틀리는 점
버전은 `web/package.json`, `ai/requirements.txt` 가 기준이다. AI 는 학습 시점의 옛 방식으로 코드를 만들기 쉬우니 아래를 따른다.
- **shadcn/ui 는 Base UI 버전**이다. `web/components/ui/*` 는 `@base-ui/react` 를 쓴다. Radix 버전 예시(`@radix-ui/*` import, `asChild`)를 그대로 쓰지 말고, 기존 `components/ui` 파일의 사용법을 따른다.
- **Tailwind CSS v4** 다. `tailwind.config.js` 가 없다. 색·테마는 `web/app/globals.css` 에 있다. 설정 파일을 새로 만들지 않는다.
- **Next.js 16 (App Router)**. lint 는 `npm run lint` (= `eslint`). `next lint` 는 쓰지 않는다. 동적 라우트의 `params` 는 Promise 라서 `await` 한다. 요청 시점에 실행해야 하는 API 는 기존 예시처럼 `await connection()` 을 둔다.
- **OpenAI SDK** 는 `ai/llm.py` 의 `ask` 안에서만 쓴다. 다른 곳에서 SDK 호출 방식을 새로 만들지 않는다.
- 빌드 오류가 나면 오류 메시지와 이 절을 함께 보고 고친다. 패키지 버전을 올리거나 내려서 해결하지 않는다 (정민 승인 필요).

## D11. 외부 스킬은 저장소에 복사해 고정한다
각자 PC 에 설치하지 않고, 확인한 버전을 `.agents/skills/` 에 복사해 팀 전체가 같은 것을 쓴다 (템플릿을 따라 대회 저장소에도 들어간다). 외부 스킬은 남의 코드처럼 SKILL.md 와 스크립트를 읽고 넣는다.
| 스킬 | 출처 (확인한 커밋) | 바꾼 것 |
|---|---|---|
| `gh-fix-ci` | openai/skills `skills/.curated/gh-fix-ci` (49f948f) | 끝에 "우리 팀 규칙" 절 추가 (담당 경로만 수정, submit 으로 제출). 스크립트는 `gh`, `git` 만 실행함을 확인 |
| `shadcn-ui` | shadcn-ui/ui `skills/shadcn/rules/` (30a58d4), MIT | 규칙 문서만 복사. SKILL.md 는 새로 작성: Base UI 기준, `npx shadcn` 실행 금지, 없는 부품은 정민에게 요청 |
| Next.js 안내 | Next.js 16.4 가 제공하는 `web/AGENTS.md` 블록 | 위에 한국어 안내 두 줄 추가. 블록은 `next dev` 가 관리하므로 고치지 않는다 |
- shadcn 공식 스킬 전체는 넣지 않았다. 팀원 Codex 가 `npx shadcn add` 로 공통 파일(`components/ui`, `package.json`)을 바꾸고 Geist 폰트를 되돌릴 수 있어서다.
- Vercel `react-best-practices`(성능 최적화 규칙)와 obra/superpowers 묶음(TDD·worktree 강제)은 해커톤 흐름과 맞지 않아 넣지 않았다.
- 디자인 스킬은 스킬 폴더가 아닌 **보관함 `docs/design-library/`** 에 둔다 (10/15). Codex 가 설명만 보고 스스로 불러오지 않게 하고, `ui-design` 7절 연결표가 정한 때에만 읽는다. 채택: jakubkrehel/skills (4c66b1f) 의 `break`, `state-machine`, `better-*` 7개, `interface-review` / MengTo/Skills (83a47fe) 의 `no-ai-design-slop`, `audit-ai-design-slop`. 모두 MIT, 실행 스크립트 없음, `agents/openai.yaml` 만 지움.
- 넣지 않은 것: emilkowalski/skills (대부분 애니메이션, `break-ui` 는 API 쪽 데이터를 바꿔 D4·담당 경로와 충돌), elayadesign 두 스킬 (폰트 교체·외부 이미지·유리 효과 내비를 강제해 D2 와 충돌), ConardLi/garden-skills (중국어, 단독 HTML·영상용), MengTo 나머지 (게임·일러스트 등 무관).

## D12. 삭제는 금지하지 않고 매번 묻는다. 강제는 rules, 최종 판단은 사람
- 10/15 리허설: Windows Codex(0.162.1)에 "이 폴더 삭제해줘" → `Remove-Item -Recurse -Force` 를 승인("항상 허용")해 저장소 폴더 내용이 전부 지워졌다. AGENTS.md 의 "삭제 금지" 지침은 사용자 요청에 밀렸고, rules 는 bash 의 `rm -r` 만 막고 있었다.
- 배운 것: **AGENTS.md 는 강제 장치가 아니다.** 강제는 `.codex/rules`, 마지막은 사람의 승인이다.
- Codex 가 테스트 폴더를 스스로 지울 수 있어야 해서 삭제를 forbidden 이 아닌 **prompt** 로 둔다 (`Remove-Item`, `rm`, `del`, `rd`, `rmdir`, `erase`, `ri`, `cmd /c rd|rmdir|del`).
- prompt 는 개인 설정의 "항상 허용"(allow)보다 엄격하므로 매번 다시 묻는다 (codex 0.162.1 `execpolicy check` 로 확인: 개인 allow + 팀 prompt → prompt).
- 규칙은 명령의 앞부분만 비교하므로 "재귀 삭제만 금지" 같은 규칙은 만들 수 없다 (`-Recurse` 가 경로 뒤에 온다).
- 남는 위험: 사람이 경로를 읽지 않고 승인하는 것. 그래서 50분 제출 규칙으로 잃을 수 있는 양을 1시간 이내로 줄인다.

## D13. 우선순위는 서비스 기획력과 결과물 완성도. 문서보다 스킬
- 평가에서 우리가 가장 중요하게 보는 축은 **서비스 기획력**(누구의 어떤 문제를 어떻게 정의했나)과 **결과물 완성도**(데모가 매끄럽게 보이나)다. 클라우드·AI 는 이를 받쳐 주는 수단이다. `docs/PLAN.md` 의 평가표 가중치가 이것을 따른다.
- 기획과 구현을 문서 하나 안에서 나눈다: PLAN 의 A(제품)·B(구현). PRODUCT_SPEC, ARCHITECTURE, DESIGN_SYSTEM 같은 문서를 따로 만들지 않는다 (문서끼리 어긋나는 위험, 에이전트가 읽을 순서가 헷갈림).
- 상황별 노하우는 스킬로 둔다: `/plan`(정민, 회의 메모 → PLAN·계약 초안, 구현 등급 표), `ui-design`(예원, 테마·화면 뼈대·상태 화면·발표용 마감 체크).
- 항상 지킬 짧은 규칙만 AGENTS.md 에 둔다 (예: 부분 수정만, 테마 변수만).
