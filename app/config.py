from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "notesapp"
    database_url: str = "postgresql+asyncpg://notesuser:notesStrongP0ssw0rd@localhost:5432/notesapp"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change_me_secret"
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = 60
    cors_origins: str = "*"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
