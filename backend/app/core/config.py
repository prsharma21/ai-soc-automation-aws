import os
from dataclasses import dataclass, field


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = field(default_factory=lambda: os.getenv("APP_NAME", "ai-soc-automation-aws"))
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    version: str = "0.1.0"
    cors_origins: list[str] = field(
        default_factory=lambda: _split_csv(os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5173"))
    )


settings = Settings()
