---
name: shadcn-ui
description: 화면(web/app 의 page.tsx, web/components)을 만들거나 고칠 때, UI 부품(Button, Card, Input 등)을 쓰거나 꾸밀 때 사용한다. 이 프로젝트의 shadcn/ui 는 Base UI 버전이다.
---

# shadcn-ui: 화면 부품 사용 규칙

출처: shadcn-ui/ui 저장소의 공식 shadcn 스킬 중 `rules/` 문서 (MIT, `LICENSE.md`). 이 저장소에 맞게 아래 "우리 프로젝트 기준" 을 덧붙였다.
화면 배치·색·상태 화면 같은 구성 규칙은 `ui-design` 스킬을 함께 따른다.

## 우리 프로젝트 기준 (먼저 읽는다)
- **Base UI 버전이다** (`web/components.json` 의 `"style": "base-nova"`, 부품은 `@base-ui/react` 사용). Radix 방식(`asChild`, `@radix-ui/*`)을 쓰지 않는다. 커스텀 트리거는 `render` prop 을 쓴다 → `rules/base-vs-radix.md`
- **`web/components/ui/` 에 있는 부품만 쓴다.** 지금 있는 것: alert, badge, button, card, chart(recharts), dialog, empty, field, input, label, select, separator, skeleton, sonner, spinner, table, tabs, textarea (폴더를 열어 최신 목록을 확인한다).
- 로딩은 `Skeleton`·`Spinner`, 빈 화면은 `Empty`, 안내 문구는 `Alert`, 폼은 `Field`, 차트는 `chart`(recharts 기반)를 쓴다.
- 규칙 문서가 가리키는 부품(InputGroup, ToggleGroup, Sheet 등)이 폴더에 없으면 **직접 설치하지 않는다.** `npx shadcn` 명령을 실행하지 않는다 (공통 파일이 바뀌고 폰트 설정이 되돌아갈 수 있다, DECISIONS D2). 사용자에게 "<부품> 이 필요합니다. 정민에게 추가를 요청해 주세요" 라고 알리고, 그동안은 있는 부품과 Tailwind 로 단순하게 만든다.
- 토스트 알림은 이미 있는 `sonner` 를 쓴다 (`toast()` from `sonner`, `<Toaster />` 는 `components/ui/sonner.tsx`).
- 아이콘은 `lucide-react` 를 쓴다.
- 클래스 합치기는 `@/lib/utils` 의 `cn()` 을 쓴다.

## 핵심 규칙 (원문 요약, 자세한 예시는 rules/ 문서)
**스타일** → `rules/styling.md`
- `className` 은 배치용이다. 부품의 색·글꼴을 덮어쓰지 않는다.
- `space-x-*`, `space-y-*` 대신 `flex` + `gap-*` (세로는 `flex flex-col gap-*`).
- 가로세로가 같으면 `size-*` (`size-10`).
- 색은 의미 토큰을 쓴다 (`bg-primary`, `text-muted-foreground`). `bg-blue-500` 같은 원색 값, 수동 `dark:` 색 지정, 오버레이의 수동 `z-index` 를 쓰지 않는다.
- 조건부 클래스는 `cn()` 으로 합친다.

**구성** → `rules/composition.md`, `rules/base-vs-radix.md`
- 기본 variant 를 먼저 쓴다 (`variant="outline"`, `size="sm"`).
- Card 는 `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` 로 나눈다.
- Dialog·Sheet·Drawer 에는 Title 이 반드시 있어야 한다 (안 보이게 하려면 `className="sr-only"`).
- 목록 항목은 Group 안에 둔다 (`SelectItem` → `SelectGroup` 등).
- 부품이 있으면 직접 만든 `div` 대신 부품을 쓴다.

**폼** → `rules/forms.md` / **아이콘** → `rules/icons.md` (버튼 안 아이콘은 `data-icon`, 아이콘에 크기 클래스를 붙이지 않음) / **채팅 화면** → `rules/chat.md`

## 확인
화면을 바꾼 뒤에는 `cd web && npm run build` 와 `npm run lint` 가 통과해야 한다. 빌드 오류가 부품 사용법 문제면 해당 rules 문서의 Incorrect / Correct 예시와 비교한다.
