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


@app.get("/health")
async def health():
    return {"ok": True, "data": {"model": settings.openai_model, "key_set": bool(settings.openai_api_key)}}


# 기능 엔드포인트 형태 (10/16 연결 확인용 샘플을 지우고 남긴 것). 계약은 docs/API_CONTRACT.md:
#
# class DiagnoseIn(BaseModel):
#     metrics: dict
#
# @app.post("/diagnose")
# async def diagnose(body: DiagnoseIn):
#     try:
#         text = await ask(load_prompt("diagnose"), body.model_dump_json())  # 프롬프트: prompts/diagnose.md
#         return {"ok": True, "data": {...}}
#     except Exception:
#         log.exception("diagnose failed")
#         return {"ok": False, "error": "OpenAI 호출 실패 (ai 서비스 로그 확인)"}
