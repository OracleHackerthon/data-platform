---
name: review-pr
description: 머지 담당(정민, 백업 영진)이 PR을 머지하기 전에 리뷰할 때 사용한다. "PR 리뷰", "review-pr 3", "3번 머지해도 돼?" 라고 하면 쓴다. 코드를 고치거나 머지하지 않고 판정과 보고서만 낸다.
---

# review-pr: 머지 전 리뷰

기준은 `docs/MERGER_CHECKLIST.md` 다. 이 스킬은 검사 순서와 보고 형식만 정한다. 기준이 바뀌면 체크리스트만 고친다.
이 파일은 `.claude/skills/review-pr/` 와 `.agents/skills/review-pr/` 에 똑같이 있다. 고칠 때는 둘 다 고친다 (CI 가 같은지 검사한다).

## 0. 시작 전
- PR 번호가 없으면 `gh pr list` 결과를 보여 주고 어느 PR 인지 묻는다.
- 이 세션에서 직접 만든 PR 이면 "새 세션에서 리뷰하는 편이 객관적입니다" 라고 알리고 계속할지 묻는다.
- `git status --porcelain` 결과가 비어 있지 않으면 멈춘다. 작업 중인 변경이 PR 브랜치에 섞인다.
- 하지 않는 것: 코드 수정, 커밋, push, 머지, PR 코멘트 작성, 서버 접속.

## 1. 정보 수집
```
gh pr view <번호> --json title,author,body,headRefName,mergeable,files
gh pr checks <번호>
gh pr diff <번호>
git fetch origin
gh pr checkout <번호>
```

## 2. 유형 판단 (여러 개일 수 있다)
| 바뀐 것 | 유형 |
|---|---|
| `web/`, `ai/` 의 코드 | 코드 |
| 제목이 `[MOCK]` 이거나 `MOCK` 주석이 추가됨 | MOCK |
| `AGENTS.md`, `.agents/`, `.claude/`, `.codex/`, `docs/`, `.github/`, `deploy/`, `Dockerfile` | 규칙·인프라 |
| `package.json`, `package-lock.json`, `requirements.txt` | 패키지 |

## 3. 검사
**모든 PR**: 체크리스트 1-1(CI), 1-2(PR 본문), 1-3(Files changed) 의 모든 항목. 충돌(`mergeable` 이 `CONFLICTING`)도 본다.

**비밀값**: `git diff origin/main...HEAD` 에서 `sk-` 로 시작하는 긴 문자열, 비어 있지 않은 `PASSWORD=`·`API_KEY=`, `BEGIN PRIVATE KEY`, `oraclecloud.com` 이 들어간 접속 문자열, 새로 추가된 `.env` 류 파일, 비밀값에 붙은 `NEXT_PUBLIC_`.

**코드**: 바뀐 쪽만 직접 실행해 본다.
- web: `cd web`, `node_modules` 가 없거나 `package-lock.json` 이 바뀌었으면 `npm ci`, 그다음 `npm run lint`, `npm run build`
- ai: `cd ai`, `python -c "import main"`
- 연결 규칙: 화면 파일에서 `localhost:8000`·`ai:8000` 직접 호출, `ai/llm.py` 밖의 `openai` import, `web/lib/db.ts` 밖의 `oracledb` 사용
- 계약: 바뀐 `/api/*` 경로와 요청·응답 필드를 `docs/API_CONTRACT.md` 와 한 줄씩 대조

**MOCK**: 응답 필드 이름·타입·구조가 계약과 정확히 같은가, `MOCK` 주석이 있는가, DB·AI·외부 호출이 없는가, API 담당자 경로인가.

**규칙·인프라**:
- 문서끼리 모순되는 지시가 없는가 (소유권, 스킬 절차, PR 본문 항목, 체크리스트)
- 명령어가 Windows PowerShell 과 Git Bash 양쪽에서 동작하는가 (`grep` 대신 `git grep` 을 쓰는지 등)
- `.claude/skills/review-pr/SKILL.md` 와 `.agents/skills/review-pr/SKILL.md` 가 같은가
- CI job 이름(`review-note`, `web`, `ai`, `docker`)이 바뀌지 않았는가. 바뀌면 Ruleset 필수 체크가 깨진다
- `deploy/` 변경이면 VM 의 `deploy/.env` 나 실행 절차에 영향이 있는가

**패키지**: 의도한 추가인가, lock 파일이 함께 바뀌었는가, 버전이 고정됐는가(`==`), 이미지 빌드 시간이 크게 늘지 않는가. 패키지를 지우거나 옮기는 PR 이면 `git grep -n "<패키지명>" -- web ai` 로 TS·CSS·설정 파일의 사용처를 직접 확인하고, `docs/DECISIONS.md` D3 와 맞는지 본다. 사용처를 확인하지 않은 채 "안 쓰이는 것 같다" 고 판단하지 않는다.

화면 동작처럼 직접 확인할 수 없는 것은 추측하지 말고 "사람이 직접 볼 것" 에 적는다.

## 4. 판정
걸린 항목마다 체크리스트 1-7 의 심각도(심각 / 보통 / 가벼움)를 붙인다.
- 심각이 하나라도 있으면: **머지 금지**
- 보통이 있으면: **수정 후 머지**
- 가벼움만 있거나 없으면: **머지 가능**

## 5. 보고 (이 형식 그대로)
```
PR #<번호> <제목> (<작성자>)
판정: 머지 가능 / 수정 후 머지 / 머지 금지
유형: 코드, MOCK, 규칙·인프라, 패키지 중 해당하는 것
CI: review-note 통과 | web 통과 | ai 통과 | docker 통과   (실패·진행 중이면 그대로 적는다)
직접 실행: web lint·build 통과 / ai import 통과 / 실행 안 함(이유)

걸린 항목:
- [심각|보통|가벼움] 파일:줄 — 무엇이 문제인가 — 작성자에게 보낼 한 줄
(없으면 "없음")

사람이 직접 볼 것:
- 화면 PR 이면: 확인할 주소와 클릭 순서
- 그 밖에 스킬이 확인하지 못한 것

정민이 판단할 것 (체크리스트 1-7 중 이 PR 에 해당하는 것만):
- 예: 새 환경변수 KEY_NAME 추가 → 배포 전에 VM deploy/.env 갱신 필요
- 예: #12 화면 PR 이 이 API 에 의존 → 이 PR 을 먼저 머지
```

## 6. 정리
`git switch main` 으로 돌아온다. 머지는 사람이 GitHub 웹에서 Squash and merge 로 한다 (Codex 는 `gh pr merge` 가 금지돼 있다). 사용자가 영진이고 판정이 "머지 가능" 이면 `docs/TEAM.md` 영진 절의 웹 머지 순서를 안내한다.
