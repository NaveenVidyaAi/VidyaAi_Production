import socket
from pathlib import Path
from urllib.parse import urlparse, urlunparse

from pydantic import field_validator
from pydantic_settings import BaseSettings

ROOT_DIR = Path(__file__).resolve().parent.parent


def _resolve_host(host: str, port: int | None = None) -> str:
    if not host or host in ("localhost", "127.0.0.1"):
        return host
    try:
        socket.getaddrinfo(host, port or 0)
        return host
    except OSError:
        return "localhost"


def _replace_host_in_url(url: str, new_host: str) -> str:
    parsed = urlparse(url)
    if not parsed.hostname:
        return url
    auth = ""
    if parsed.username:
        auth = parsed.username
        if parsed.password:
            auth += f":{parsed.password}"
        auth += "@"
    host_port = new_host
    if parsed.port:
        host_port += f":{parsed.port}"
    return urlunparse(parsed._replace(netloc=f"{auth}{host_port}"))


class Settings(BaseSettings):
    anthropic_api_key: str
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"
    database_url: str
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    jwt_secret: str
    jwt_expire_minutes: int = 10080
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173"
    use_mock_embeddings: str = "true"
    admin_emails: str = ""

    @field_validator("database_url")
    def normalize_database_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.hostname == "postgres":
            resolved_host = _resolve_host("postgres", parsed.port)
            if resolved_host != "postgres":
                return _replace_host_in_url(value, resolved_host)
        return value

    @field_validator("qdrant_host")
    def normalize_qdrant_host(cls, value: str) -> str:
        return _resolve_host(value, 6333)

    class Config:
        env_file = str(ROOT_DIR / ".env")
        env_file_encoding = "utf-8"


settings = Settings()


def is_admin_email(email: str) -> bool:
    if not email:
        return False
    allowed = {item.strip().lower() for item in settings.admin_emails.split(",") if item.strip()}
    return email.strip().lower() in allowed
