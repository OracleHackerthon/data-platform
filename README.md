# TELOS Starter

Oracle TELOS Challenge 2026 팀 스타터. 사람용 안내서입니다 (에이전트 규칙은 `AGENTS.md`).

```
브라우저 → web (Next.js: 화면 + /api) → ai (FastAPI: AI 처리) → OpenAI
                      └→ Autonomous DB
```

| 사람 | 역할 | 주로 만지는 곳 | 쓰는 스킬 |
|---|---|---|---|
| 예원 | 화면·완성도·발표 | `web/app/**/page.tsx`, `layout.tsx`, `globals.css`, `web/components/<기능>/`, `docs/DEMO_SCRIPT.md` | `$start` `$submit` `$sync` `$gh-fix-ci`, 화면 작업 때 자동: `ui-design` `shadcn-ui` |
| 영진 | API·DB (예비 머지) | `web/app/api/`, `web/lib/db.ts`, `web/db/` | `$start` `$mock` `$submit` `$sync` `$review-pr` `$gh-fix-ci` |
| 승연 | AI·데이터 분석 | `ai/`, `research/` | `$start` `$mock` `$submit` `$sync` `$gh-fix-ci` |
| 정민 | 인프라·배포·통합(머지) | `deploy/`, `.github/`, 공통 파일, `docs/` | Claude Code: `/plan` `/review-pr` |

스킬은 Codex 에서 `$이름`, Claude Code 에서 `/이름` 으로 부릅니다. "자동" 은 부르지 않아도 화면 작업이면 Codex 가 알아서 따릅니다 (안 따르면 "ui-design 스킬대로 해줘").

## 1. 설치 체크리스트 (PowerShell, 목요일 저녁까지)

```powershell
winget install GitHub.cli
winget install Python.Python.3.12
```
설치 후 **PowerShell을 새로 열고** 확인:
```powershell
node -v          # v20.9 이상
git --version
gh --version
python --version
```

GitHub와 저장소:
```powershell
gh auth login                                   # 브라우저 인증
git config --global user.name "예원"          # 본인 이름을 한글로: 예원 / 영진 / 승연 (Codex가 이걸로 누구인지 안다)
git config --global user.email "깃허브 이메일"
gh repo clone OracleHackerthon/<저장소>
```
- `OracleHackerthon` 조직 초대 메일을 먼저 수락하세요.

AI 코딩 도구:
- 예원·영진: `npm install -g @openai/codex` → `codex login` (개인 ChatGPT 계정)
- 승연: Codex + 개인 OpenAI API 키 (사용 한도를 꼭 설정)
- `~/.codex/AGENTS.md` (개인 전역 규칙)가 있다면 대회 기간에는 비워 두세요. 팀 규칙과 섞입니다.
- **주최 측 OpenAI 키는 서비스 코드에만** 씁니다. Codex에 넣지 않습니다.

## 2. 로컬 실행

**web (예원·영진)**
```powershell
cd web
npm install
Copy-Item ..\.env.example .env.local    # AI_SERVICE_URL=http://localhost:8000
npm run dev                             # http://localhost:3000
```

**ai (승연만. 개인 API 키 사용. 예원·영진은 MOCK 으로 개발하므로 띄우지 않아도 됩니다)**
```powershell
cd ai
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env          # OPENAI_API_KEY 채우기
uvicorn main:app --reload --port 8000
```
- `Activate.ps1` 실행이 막히면: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

연결 확인: http://localhost:3000 에서 문장을 보내 요약이 오면 성공. `http://localhost:3000/api/health` 에서 `"ai":"up"` 확인.

## 3. 작업 흐름 (Codex에게 말로 시킵니다)

저장소 폴더에서 `codex` 를 실행합니다. 처음에 이 폴더를 신뢰(trust)할지 물으면 **예**를 고릅니다. 그래야 팀 규칙(`.codex/rules`)이 적용됩니다.

첫 마디는 **"나 예원이야"** 처럼 이름만 말하면 됩니다. Codex가 `docs/TEAM.md` 를 읽고 지금 할 일을 알려 줍니다.
개발 서버(`npm run dev`, `uvicorn`)는 Codex 안이 아니라 **별도 PowerShell 창**에서 직접 실행하세요.

| 할 일 | Codex에게 |
|---|---|
| 작업 시작 | `$start 요약 기능` |
| 기능 만들기 | `PLAN.md 의 요약 기능 체크리스트 1번 해줘` |
| 화면 확인 | `로컬에서 띄우고 확인할 주소 알려줘` |
| 가짜 API 먼저 만들기 (API 담당) | `$mock 요약 기능` |
| 제출 | `$submit` |
| CI 빨간불 원인 찾기 | `$gh-fix-ci 내 PR CI 실패 원인 찾아줘` |
| 머지 공지 후 | `$sync` |
| 디자인 맞추기 (화면 담당) | `PLAN 의 디자인 방향대로 강조색이랑 헤더 맞춰줘` |
| 발표 전 화면 점검 (화면 담당) | `ui-design 의 발표용 마감 체크대로 이 화면 점검해줘` |
| PR 검사 (영진, 예비 머지 때) | `$review-pr <번호>` |

- Codex가 승인을 물으면: 내 폴더 안 파일 수정, `git commit`, 빌드 명령은 승인. **패키지 설치, 다른 폴더 수정은 거절하고 정민에게** 알립니다.
- **삭제 승인은 경로를 끝까지 읽고**, 내 폴더 안의 하위 항목일 때만 "예(한 번)". 저장소 폴더 전체(`...\telos-hackerthon`)나 저장소 밖이면 거절. **"항상 허용"은 절대 누르지 않습니다.**
- "정민을 불러 주세요" 가 나오면 그대로 정민에게 연락합니다 (충돌, 같은 오류 반복 등).
- 머지는 정민이 정해진 시각에 합니다. CI가 초록불이고 PR에 자체 리뷰가 있어야 머지됩니다.
- 키를 실수로 push했다면 지우는 걸로는 안 됩니다. **즉시 알리고 키를 재발급**합니다.

## 4. 문서
- `docs/PLAN.md` A. 제품(문제, 사용자 흐름, 데모 시나리오, 디자인 방향) / B. 구현(기능별 체크리스트), 일정
- `docs/API_CONTRACT.md` 화면↔API↔AI 주고받는 형태
- `docs/TEAM.md` 팀원별 할 일 (Codex 가 "나 예원이야" 를 들으면 읽는 파일)
- `docs/DECISIONS.md` 이미 정한 것과 이유 (AI 가 되돌리자고 하면 여기와 비교)
- `docs/OCI_RUNBOOK.md` 배포·장애 대응
- `docs/DEMO_SCRIPT.md` 발표·시연
- `docs/MERGER_CHECKLIST.md` 정민: 머지·CI·배포·제출 점검표

## 5. 정민
머지, CI, 배포, 제출 때 확인할 것은 `docs/MERGER_CHECKLIST.md` 를 따릅니다.
PR 리뷰는 Claude Code 에서 `/review-pr <번호>` (영진 백업은 Codex 에서 `$review-pr <번호>`).
기획 회의 정리는 Claude Code 에서 `/plan` (회의 메모 → `docs/PLAN.md` 초안, 계약 초안).
