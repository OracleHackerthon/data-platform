---
name: deploy-oci
description: OCI VM에 현재 main 을 배포하고 상태를 확인할 때 사용한다. 사용자가 배포를 명시적으로 요청한 경우에만 쓴다.
---

# deploy-oci

1. 배포 전 확인: 현재 브랜치가 main 이고, 로컬에서 `cd web && npm run build` 가 통과했는지 사용자에게 확인한다.
2. `docs/OCI_RUNBOOK.md` 의 "접속" 명령으로 VM에 SSH 접속한다. 접속 정보(IP, 키 경로)는 사용자에게 묻는다.
3. VM에서 `cd ~/<저장소> && ./deploy/deploy.sh` 를 실행한다.
4. 출력 마지막에 "배포 완료"가 있으면 커밋 해시를 사용자에게 알린다.
5. 실패하면 RUNBOOK 의 "장애 체크리스트"를 순서대로 실행하고 결과를 보고한다. 스스로 설정을 바꾸지 않는다.
6. 성공하면 VM이 아니라 로컬 저장소에서 `git fetch origin && git tag ok-<MMDD-HHMM> origin/main && git push origin ok-<MMDD-HHMM>` 을 제안한다 (사용자 승인 후 실행). VM의 저장소는 push 권한이 없다.
