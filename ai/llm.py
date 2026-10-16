"""OpenAI 호출 공통 함수. AI 기능은 이 파일의 함수만 사용한다."""
from pathlib import Path

from openai import AsyncOpenAI

from config import settings

_client: AsyncOpenAI | None = None
PROMPTS_DIR = Path(__file__).parent / "prompts"


def client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


def load_prompt(name: str) -> str:
    """prompts/<name>.md 를 읽어 지시문으로 쓴다. 프롬프트는 코드와 분리해 관리한다."""
    return (PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8")


async def ask(instructions: str, user_input: str) -> str:
    res = await client().responses.create(
        model=settings.openai_model,
        instructions=instructions,
        input=user_input,
    )
    return res.output_text
