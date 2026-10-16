"""AI 서비스 (FastAPI). 내부 전용: 브라우저가 아니라 Next.js(web)만 호출한다.

응답 형식은 web 과 같다: {"ok": bool, "data": ..., "error": ...}
"""
import logging

from fastapi import FastAPI
from pydantic import BaseModel

from config import settings
from llm import ask, load_prompt

log = logging.getLogger("ai")
app = FastAPI(title="TELOS AI service")


class ExampleIn(BaseModel):
    text: str


@app.get("/health")
async def health():
    return {"ok": True, "data": {"model": settings.openai_model, "key_set": bool(settings.openai_api_key)}}


# 연결 확인용 샘플. 대회 당일 실제 기능으로 교체한다.
@app.post("/example")
async def example(body: ExampleIn):
    try:
        answer = await ask(load_prompt("example"), body.text)
        return {"ok": True, "data": {"answer": answer}}
    except Exception:
        log.exception("example failed")
        return {"ok": False, "error": "OpenAI 호출 실패 (ai 서비스 로그 확인)"}
