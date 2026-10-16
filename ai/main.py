"""AI 서비스 (FastAPI). 내부 전용: 브라우저가 아니라 Next.js(web)만 호출한다.

응답 형식은 web 과 같다: {"ok": bool, "data": ..., "error": ...}
"""
import json
import logging
import re
from typing import Any

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field
from starlette.requests import Request
from starlette.responses import JSONResponse

from config import settings
from llm import ask, load_prompt
from value_index import calculate_value_index

log = logging.getLogger("ai")
app = FastAPI(title="TELOS AI service")


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"ok": False, "error": "진단 요청 형식이 올바르지 않습니다"},
    )


@app.get("/health")
async def health():
    return {"ok": True, "data": {"model": settings.openai_model, "key_set": bool(settings.openai_api_key)}}


class ColumnIn(BaseModel):
    name: str
    type: str


class DiagnoseIn(BaseModel):
    metrics: dict[str, Any]
    meta: dict[str, Any]
    columns: list[ColumnIn]


class TaskCardOut(BaseModel):
    title: str
    problem: str
    metric: str
    dataNeeded: str


class DiagnoseLLMOut(BaseModel):
    infoCategoryCount: int = Field(ge=1)
    standardLinkageKeyCount: int = Field(ge=0)
    continuousNameClarity: float = Field(ge=0, le=1)
    categoryValueClarity: float = Field(ge=0, le=1)
    report: str
    taskCard: TaskCardOut
    improvementTexts: dict[str, str]


REQUIRED_IMPROVEMENT_KEYS = {
    "diversity",
    "linkage",
    "clarity",
    "timeliness",
    "physical_quality",
    "row_sufficiency",
    "provider_reliability",
    "delivery_convenience",
    "format_openness",
}


def _parse_llm_json(text: str) -> dict[str, Any]:
    """Accept JSON directly or wrapped in a Markdown code fence."""
    content = text.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content, count=1, flags=re.IGNORECASE)
        content = re.sub(r"\s*```$", "", content, count=1)
    value = json.loads(content)
    if not isinstance(value, dict):
        raise ValueError("진단 응답은 JSON 객체여야 합니다")
    return value


@app.post("/diagnose")
async def diagnose(body: DiagnoseIn):
    try:
        # Only the aggregate metrics, metadata and column names/types reach the LLM.
        llm_text = await ask(
            load_prompt("diagnose"),
            json.dumps(body.model_dump(), ensure_ascii=False),
        )
        llm_result = DiagnoseLLMOut.model_validate(_parse_llm_json(llm_text))
        llm_data = llm_result.model_dump()
        improvement_texts = llm_data["improvementTexts"]
        if not REQUIRED_IMPROVEMENT_KEYS.issubset(improvement_texts) or any(
            not improvement_texts[key].strip() for key in REQUIRED_IMPROVEMENT_KEYS
        ):
            raise ValueError("진단 응답에 요소별 개선 제안이 빠졌습니다")
        value_index = calculate_value_index(
            metrics=body.metrics,
            meta=body.meta,
            llm_assessment=llm_data,
            improvement_texts=improvement_texts,
        )
        return {
            "ok": True,
            "data": {
                "valueIndex": value_index,
                "report": llm_data["report"],
                "taskCard": llm_data["taskCard"],
            },
        }
    except Exception:
        log.exception("diagnose failed")
        return {"ok": False, "error": "진단 생성 실패 (ai 서비스 로그 확인)"}
