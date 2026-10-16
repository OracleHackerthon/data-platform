---
name: mock
description: 확정된 계약 형태 그대로 가짜 응답을 돌려주는 API를 먼저 만들 때 사용한다. 사용자가 "가짜 API", "mock", "목업 응답 만들어줘" 라고 하면 쓴다.
---

# mock: 계약대로 가짜 응답 만들기

화면과 API의 개발 속도가 달라도 서로 기다리지 않게, 실제 구현 전에 계약과 똑같은 형태의 가짜 응답을 먼저 머지한다.

## 1. 계약 확인
- 어떤 기능인지 사용자에게 묻고 `docs/API_CONTRACT.md` 에서 해당 항목을 찾는다.
- 항목이 없거나 상태가 "확정" 이 아니면 멈추고 "계약이 아직 확정되지 않았습니다. 정민에게 확인해 주세요." 라고 말한다.

## 2. 담당 확인 (AGENTS.md 소유권 표)
- 화면 → web 계약(`/api/<기능>`): 영진 담당. 파일 `web/app/api/<기능>/route.ts`
- web → ai 계약(`/<기능>`): 승연 담당. 파일 `ai/main.py` 에 엔드포인트 추가
- 사용자 담당이 아니면 만들지 않는다. "이 API는 <담당자> 담당입니다. <담당자>에게 mock 을 요청해 주세요." 라고 말하고 멈춘다.
- 같은 경로에 이미 실제 구현이 있으면 덮어쓰지 않고 멈춘다.

## 3. 만들기
- 응답 data 는 계약과 **필드 이름, 타입, 중첩 구조를 정확히 같게** 한다. 값은 화면에서 보기 좋은 그럴듯한 값으로 넣는다 (목록이면 2~3개).
- 파일 맨 위에 표시를 단다.
  - TypeScript: `// MOCK: <기능> - 실제 구현 전 임시 응답`
  - Python: 엔드포인트 함수 바로 위에 `# MOCK: <기능> - 실제 구현 전 임시 응답`
- 요청 검사(필수 값이 없으면 400)는 실제처럼 넣는다. DB, AI, 외부 호출은 하지 않는다.
- 응답 형식은 반드시 `web/lib/api.ts` 의 `ok`, `fail` 을 쓴다 (Python 은 `{"ok": True, "data": ...}`).

web 예시 (`web/app/api/summary/route.ts`):
```ts
// MOCK: summary - 실제 구현 전 임시 응답
import { ok, fail } from "@/lib/api";

export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim()) return fail("text 가 비어 있습니다", 400);
  return ok({ answer: "가짜 요약입니다. 실제 구현 전 임시 응답입니다." });
}
```

ai 예시 (`ai/main.py` 에 추가):
```python
# MOCK: summary - 실제 구현 전 임시 응답
@app.post("/summary")
def summary(req: SummaryRequest):
    return {"ok": True, "data": {"answer": "가짜 요약입니다."}}
```

## 4. 확인
- 개발 서버를 띄우고 직접 호출해서 응답이 계약 형태와 같은지 사용자에게 보여 준다.
  - web: `curl -X POST http://localhost:3000/api/<기능> -H "Content-Type: application/json" -d '<계약의 요청 예시>'`
  - ai: 브라우저 `http://localhost:8000/docs` 에서 실행
- 필수 값을 빼고 호출하면 400 이 나오는지도 확인한다.

## 5. 제출
- `submit` 스킬로 PR 을 올린다. PR 제목 앞에 `[MOCK]` 을 붙이고, 본문 "남은 MOCK" 에 이 파일을 적는다.
- 사용자에게 "정민에게 계약 상태를 MOCK 으로 바꿔 달라고 알려 주세요. 화면 담당자에게도 이제 연결해도 된다고 알려 주세요." 라고 말한다.

## 나중에 실제 구현으로 바꿀 때
- 같은 파일을 고친다. 경로, 요청·응답 형태는 바꾸지 않는다.
- `MOCK` 주석을 지운다. PR 본문에 "MOCK 제거: <기능>" 을 적는다.
