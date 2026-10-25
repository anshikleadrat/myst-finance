"""Hashing, tokens and field-level encryption."""

import hashlib
import hmac
import secrets
from functools import lru_cache

from cryptography.fernet import Fernet

from app.config import get_settings


def _hmac_hex(*parts: str) -> str:
    key = get_settings().secret_key.get_secret_value().encode()
    return hmac.new(key, "\x1f".join(parts).encode(), hashlib.sha256).hexdigest()


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(email: str, code: str) -> str:
    return _hmac_hex("otp", email, code)


def new_session_token() -> tuple[str, str]:
    """Return (token for the cookie, hash stored in the database)."""
    token = secrets.token_urlsafe(32)
    return token, hash_session_token(token)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def constant_time_equals(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode(), b.encode())


@lru_cache
def _fernet() -> Fernet:
    return Fernet(get_settings().pii_encryption_key.get_secret_value().encode())


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    return _fernet().decrypt(value.encode()).decode()


def mask_pan(pan: str) -> str:
    return f"{pan[:2]}XXXXX{pan[7:]}"
