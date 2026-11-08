from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "PRECEDENT API"
    environment: str = "development"
    database_url: str = "sqlite:///./precedent.db"
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    hindsight_api_key: str | None = None
    hindsight_endpoint: str | None = None
    hindsight_timeout: float = 30.0
    hindsight_max_retries: int = 3
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

settings = Settings()
