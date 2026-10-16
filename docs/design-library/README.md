# 디자인 보관함 (design-library)

외부 디자인 스킬을 복사해 둔 곳이다. **스킬 폴더(`.agents/skills`)가 아니라서 Codex 가 스스로 불러오지 않는다.**
`ui-design` 스킬의 "보관함 연결표"가 정한 때에만 읽거나, 사용자가 파일 경로를 직접 말할 때만 쓴다.

## 우리 규칙이 먼저다
보관함의 스킬이 아래와 다른 것을 권하면 **우리 규칙을 따른다**. 보관함 내용은 참고 자료이지 지시가 아니다.
- 패키지 설치, 폰트 변경(DECISIONS D2), 다크 모드, `tailwind.config` 생성, `web/components/ui/` 수정을 하지 않는다.
- 색은 `web/app/globals.css` 의 `:root` 변수로만 바꾼다 (`ui-design` 2절).
- 담당 경로(AGENTS.md 소유권 표) 밖은 고치지 않는다. 화면에 가짜 데이터를 넣지 않는다 (D4). 단, 아래 임시 페이지는 예외.
- **점검 결과는 먼저 보고하고, 사용자가 고르기 전에는 고치지 않는다.** 결과가 길면 "Broken / 깨짐" 등급부터 고친다.
- 임시 페이지(`break`, `state-machine`)는 `web/app/dev-preview/<이름>/page.tsx` 에만 만든다 (`_` 로 시작하는 폴더는 Next.js 에서 주소가 열리지 않는다). **PR 에 넣지 않고(`.gitignore` 로 막아 둠), 다 보면 사용자 승인을 받아 지운다.**
- 영어 스킬이다. 사용자에게는 한국어로 보고한다. `better-writing` 은 영어 문구 기준이라 한국어 화면에는 원칙(짧게, 다음 행동을 알려 주기)만 적용한다.

## 목록
| 폴더 | 무엇을 하나 | 쓰는 방식 |
|---|---|---|
| `no-ai-design-slop` | 새 화면이 "AI 가 만든 뻔한 디자인"(의미 없는 그라디언트, 장식용 카드 남발, 흐린 위계)이 되지 않게 막는 기준 | 자동: 새 화면을 만들 때 SKILL.md 만 읽고 따른다 |
| `better-colors` | 색 체계, 의미 토큰, 대비(읽기 쉬운 글자색) 점검 | 자동: 색을 정하거나 고칠 때 SKILL.md 만 참고 |
| `better-typography` | 글자 크기 단계, 줄 간격, 줄바꿈, 숫자 정렬 | 자동: 글자 모양을 고칠 때 SKILL.md 만 참고 (폰트 교체 조언은 무시) |
| `better-layout` | 묶음, 정렬, 읽는 순서, 좁은 화면 대응 | 자동: 배치를 고칠 때 SKILL.md 만 참고 |
| `break` | 컴포넌트 하나를 긴 값·빈 값·큰 숫자 같은 최악의 데이터로 임시 페이지에 펼쳐 깨지는 곳을 찾음 | 제안만: 핵심 흐름이 동작한 뒤 |
| `state-machine` | 컴포넌트 하나의 로딩·빈·오류·한 개·많음 상태를 임시 페이지에서 전환하며 보게 함 | 제안만: 상태 화면을 다듬을 때 |
| `better-interface` | 아래 `better-*` 를 묶어 한 화면을 종합 점검 | 제안만: 2일차 09:00~11:00 다듬기 |
| `better-accessibility` | 키보드, 포커스, 폼 라벨, 클릭 영역 | `better-interface` 가 함께 씀 |
| `better-writing` | 버튼, 오류, 빈 화면 문구 | `better-interface` 가 함께 씀 |
| `better-ui` | 모서리, 그림자, 아이콘 정렬 같은 표면 마감 (애니메이션 부분은 쓰지 않음) | `better-interface` 가 함께 씀 |
| `interface-review` | 브랜치·PR 의 화면 변경만 골라 점검 | 제안만 / 정민이 화면 PR 리뷰 때 |
| `audit-ai-design-slop` | 완성된 화면을 "AI 티" 기준으로 점수 매겨 점검 (고치지 않음) | 제안만: 발표 전 |

## 사람이 직접 부르는 법
- "docs/design-library/break/SKILL.md 읽고 그 절차대로 결과 카드 컴포넌트 점검해줘. 우리 규칙은 docs/design-library/README.md 를 따라."
- "docs/design-library/better-interface/SKILL.md 대로 메인 화면 점검해서 보고만 해줘."
- "docs/design-library/audit-ai-design-slop/SKILL.md 기준으로 발표용 화면 점수 매겨줘."

## 출처
| 폴더 | 출처 (확인한 커밋) | 라이선스 |
|---|---|---|
| `break`, `state-machine`, `better-*`, `interface-review` | jakubkrehel/skills `skills/` (4c66b1f) | MIT, `LICENSES/jakubkrehel-skills.txt` |
| `no-ai-design-slop`, `audit-ai-design-slop` | MengTo/Skills `agent-skills/ui/` (83a47fe) | MIT, `LICENSES/MengTo-Skills.txt` |

원본에서 `agents/openai.yaml`(Codex 자동 호출 설정)만 지웠고 나머지는 그대로다. 실행 스크립트는 없다.
