---
name: submit
description: 작업을 검사하고 PR로 제출할 때 사용한다. 사용자가 "제출", "submit", "PR 올려줘" 라고 하면 쓴다. 검사 하나라도 실패하면 제출하지 않는다.
---

# submit: 검사 후 PR 제출

순서대로 하고, 실패하면 그 자리에서 멈춰 쉬운 말로 원인과 다음 할 일을 알린다.

## 1. 위치 확인
- 현재 브랜치가 `feat/` 로 시작하는지 확인한다. main 이면 멈춘다.

## 2. 자체 리뷰 (필수)
`git fetch origin` 후 `git diff origin/main...HEAD` 와 커밋 안 된 변경(`git diff`, `git status`)을 모두 검토해 아래를 확인한다.
- 바뀐 파일이 모두 사용자 담당 경로 안인가 (AGENTS.md 소유권 표)
- 키, 비밀번호, 접속 문자열이 코드에 있는가 / `.env` 파일이 포함됐는가 / 비밀값에 `NEXT_PUBLIC_` 이 붙었는가
- `docs/API_CONTRACT.md` 의 요청·응답 형태와 다른가
- 연결 규칙 위반: 브라우저가 ai 를 직접 호출, OpenAI 를 `ai/llm.py` 밖에서 호출, DB 를 `web/lib/db.ts` 밖에서 접근
- `package.json`, `requirements.txt` 변경 (있으면 정민 승인 여부를 사용자에게 묻는다)
- 남은 `MOCK` 주석: `git grep -n --untracked "MOCK" -- web/app web/lib ai` 결과를 PR 본문 "남은 MOCK" 에 적는다 (없으면 "없음")
- 명백한 버그: 처리하지 않은 오류, 남은 console.log·print 디버그 출력, 쓰지 않는 코드

문제가 있으면 고칠 수 있는 것은 고치고 사용자에게 알린다. 담당 밖 파일이나 계약 문제는 고치지 말고 멈춘다.

## 3. 빌드 검사
- `web/` 이 바뀌었으면: `cd web && npm run lint && npm run build`
- `ai/` 가 바뀌었으면: `cd ai && python -c "import main"`
- 실패하면 고쳐서 다시 돌린다. 두 번 고쳐도 실패하면 멈추고 정민을 부르라고 말한다.

## 4. 커밋과 push
- 사용자 담당 경로만 `git add <경로>` 한다. `git add .` 는 쓰지 않는다.
- `git commit -m "feat: <한 줄 요약>"`
- `git push -u origin <브랜치>` (옵션을 더 붙이지 않는다. `--force` 류 금지)

## 5. PR
`gh pr create --title "<한 줄 요약>" --body "<본문>"`. 본문 형식:

```
## 바뀐 것
(사용자가 이해할 말로 2~3줄)

## 확인 방법
(화면 주소와 눌러볼 것)

## 자체 리뷰
- 담당 경로만 변경: 예/아니오
- 비밀값 없음: 예/아니오
- 계약 일치: 예/아니오
- 고친 것: (없으면 "없음")
- 남은 MOCK: (파일 목록, 없으면 "없음")
```

## 6. 보고
PR 주소, 바뀐 것 요약, "정민의 머지 공지가 오면 sync 를 실행하세요" 를 알린다.
