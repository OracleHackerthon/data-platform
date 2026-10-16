---
name: sync
description: main 의 최신 변경을 내 작업에 반영할 때 사용한다. 사용자가 "최신화", "sync", "pull 받아줘" 라고 하거나 머지 공지를 받았을 때 쓴다.
---

# sync: main 최신화

0. **이미 머지된 브랜치인지 먼저 본다.** 현재 브랜치가 main 이 아니면 `gh pr list --head <현재 브랜치> --state merged --json number,headRefOid` 를 실행한다. 결과가 비어 있으면 1로 간다.
   - 머지된 PR 이 있으면 merge 하지 않는다. Squash 머지라 main 에 같은 내용이 다른 커밋으로 들어가 있어, merge 하면 그 PR 이 고친 파일마다 충돌이 난다 (10/16 승연 `feat/diagnose`).
   - `git fetch origin pull/<번호>/head` 를 한 뒤 `git merge-base --is-ancestor HEAD <headRefOid>` 를 실행한다. 이 명령이 성공(종료 코드 0)하면 내 커밋이 모두 머지된 PR 에 들어 있다는 뜻이다 (다른 사람이 PR 에 커밋을 얹었으면 내 HEAD 가 `headRefOid` 보다 뒤일 수 있다).
   - `git status --porcelain` 이 비어 있고 위 명령이 성공하면 (머지 뒤 새 작업 없음): `git switch main` → `git pull --ff-only` 로 끝내고, "이 브랜치는 #<번호> 로 이미 머지됐습니다. 다음 작업은 `start` 로 새 브랜치를 만들어 주세요" 라고 알린다.
   - 그 밖의 경우 (커밋 안 된 변경이 있거나, 머지 뒤 커밋이 더 있음): 아무것도 하지 않고 `git log --oneline origin/main..HEAD` 결과를 보여 주며 "머지된 브랜치에 새 작업이 있습니다. 정민을 불러 주세요." 라고 말한 뒤 멈춘다.
1. `git status` 로 커밋 안 된 변경이 있는지 본다. 있으면 사용자 담당 경로만 `git add` 해서 `git commit -m "wip: 진행 중 저장"` 한다.
2. `git fetch origin`
3. 현재 브랜치가 main 이면 `git pull --ff-only` 로 끝낸다.
4. feat 브랜치면 `git merge origin/main`.
5. **충돌이 나면 직접 해결하지 않는다.** `git merge --abort` 로 되돌리고, 충돌한 파일 목록을 보여 주며 "충돌이 났습니다. 정민을 불러 주세요." 라고 말한 뒤 멈춘다.
6. 성공하면 `web/` 에서 `npm install` 이 필요한지(package.json 변경 여부) 확인해 알려 주고, 무엇이 새로 들어왔는지 2~3줄로 보고한다.
