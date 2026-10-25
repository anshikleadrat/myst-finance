"""Application settings. Everything is read from environment variables (or a local .env)."""

import re
from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Development-only fallbacks so `uv run` works out of the box. Production refuses them.
_DEV_SECRET = "dev-insecure-secret-change-me"  # noqa: S105
_DEV_FERNET_KEY = "ZGV2LWluc2VjdXJlLWZlcm5ldC1rZXktMzJieXRlcyE="


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: Literal["development", "test", "production"] = "development"
    log_level: str = "INFO"

    database_url: str = "postgresql+psycopg://myst:myst_dev_password@localhost:5432/myst_finance"
    # Optional Postgres schema for all tables (e.g. "myst" when sharing a database with another app).
    database_schema: str = ""

    secret_key: SecretStr = SecretStr(_DEV_SECRET)
    pii_encryption_key: SecretStr = SecretStr(_DEV_FERNET_KEY)

    # Public origin of the website (used for CSRF origin checks and links in emails).
    site_url: str = "http://localhost:3000"
    # Comma-separated list of extra origins allowed to make state-changing requests.
    extra_allowed_origins: str = ""

    session_cookie_name: str = "myst_session"
    session_ttl_days: int = 30

    otp_ttl_seconds: int = 600
    otp_resend_cooldown_seconds: int = 30
    otp_max_attempts: int = 5
    otp_max_per_email_per_hour: int = 5
    otp_max_per_ip_per_hour: int = 20
    # Development/testing only: emails at this domain log in with DEV_LOGIN_CODE and receive no email.
    # Production refuses to start when DEV_LOGIN_CODE is set.
    dev_login_code: str = ""
    dev_login_domain: str = "test.mystfinance.in"

    mail_backend: Literal["console", "smtp", "brevo"] = "console"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: SecretStr = SecretStr("")
    # Brevo transactional email over HTTPS (for hosts that block SMTP ports, e.g. Render's free plan).
    brevo_api_key: SecretStr = SecretStr("")
    mail_from: str = "MYST Finance <no-reply@mystfinance.in>"
    support_email: str = "support@mystfinance.in"

    payment_provider: Literal["mock", "razorpay"] = "mock"
    razorpay_key_id: str = ""
    razorpay_key_secret: SecretStr = SecretStr("")
    razorpay_webhook_secret: SecretStr = SecretStr("")
    access_fee_paise: int = 19900

    # Invoice details. When business_gstin is set, invoices show the fee as GST-inclusive.
    business_name: str = "MYST Finance"
    business_address: str = ""
    business_gstin: str = ""
    gst_rate_percent: float = 18.0

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def allowed_origins(self) -> set[str]:
        origins = {self.site_url.rstrip("/")}
        origins.update(o.strip().rstrip("/") for o in self.extra_allowed_origins.split(",") if o.strip())
        return origins

    def is_dev_login_email(self, email: str) -> bool:
        return bool(self.dev_login_code) and not self.is_production and email.endswith(f"@{self.dev_login_domain}")

    @property
    def cookie_secure(self) -> bool:
        return self.site_url.startswith("https://")

    @model_validator(mode="after")
    def _check_schema(self) -> "Settings":
        if self.database_schema and not re.fullmatch(r"[a-z_][a-z0-9_]{0,62}", self.database_schema):
            raise ValueError("DATABASE_SCHEMA must be a lowercase identifier, e.g. 'myst'")
        return self

    @model_validator(mode="after")
    def _check_production(self) -> "Settings":
        if not self.is_production:
            return self
        problems = []
        if self.secret_key.get_secret_value() == _DEV_SECRET:
            problems.append("SECRET_KEY must be set")
        if self.pii_encryption_key.get_secret_value() == _DEV_FERNET_KEY:
            problems.append("PII_ENCRYPTION_KEY must be set")
        if self.dev_login_code:
            problems.append("DEV_LOGIN_CODE must be empty")
        if self.mail_backend == "console":
            problems.append("MAIL_BACKEND must be 'smtp' or 'brevo'")
        if self.mail_backend == "brevo" and not self.brevo_api_key.get_secret_value():
            problems.append("BREVO_API_KEY must be set when MAIL_BACKEND=brevo")
        if self.payment_provider != "razorpay":
            problems.append("PAYMENT_PROVIDER must be 'razorpay'")
        if self.payment_provider == "razorpay" and not (
            self.razorpay_key_id and self.razorpay_key_secret.get_secret_value()
        ):
            problems.append("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set")
        if problems:
            raise ValueError("Invalid production configuration: " + "; ".join(problems))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
