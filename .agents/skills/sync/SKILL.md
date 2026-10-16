---
name: sync
description: main 의 최신 변경을 내 작업에 반영할 때 사용한다. 사용자가 "최신화", "sync", "pull 받아줘" 라고 하거나 머지 공지를 받았을 때 쓴다.
---

# sync: main 최신화

1. `git status` 로 커밋 안 된 변경이 있는지 본다. 있으면 사용자 담당 경로만 `git add` 해서 `git commit -m "wip: 진행 중 저장"` 한다.
2. `git fetch origin`
3. 현재 브랜치가 main 이면 `git pull --ff-only` 로 끝낸다.
4. feat 브랜치면 `git merge origin/main`.
5. **충돌이 나면 직접 해결하지 않는다.** `git merge --abort` 로 되돌리고, 충돌한 파일 목록을 보여 주며 "충돌이 났습니다. 정민을 불러 주세요." 라고 말한 뒤 멈춘다.
6. 성공하면 `web/` 에서 `npm install` 이 필요한지(package.json 변경 여부) 확인해 알려 주고, 무엇이 새로 들어왔는지 2~3줄로 보고한다.
