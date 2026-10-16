"""환경변수 설정. 값은 ai/.env (로컬) 또는 deploy/.env (VM) 에서 읽는다."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"  # 당일 주최 측이 열어 준 모델로 .env 에서 바꾼다


settings = Settings()
