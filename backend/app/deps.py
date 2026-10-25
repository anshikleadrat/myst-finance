from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_db
from app.models import ActivityEvent, Session, User, utcnow
from app.security import hash_session_token

DB = Annotated[AsyncSession, Depends(get_db)]


async def get_optional_user(request: Request, db: DB) -> User | None:
    token = request.cookies.get(get_settings().session_cookie_name)
    if not token:
        return None
    session = await db.scalar(
        select(Session).where(Session.token_hash == hash_session_token(token), Session.expires_at > utcnow())
    )
    return session.user if session else None


async def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "not_authenticated")
    return user


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def client_ip(request: Request) -> str | None:
    # Behind Caddy, uvicorn's --proxy-headers rewrites request.client from X-Forwarded-For.
    return request.client.host if request.client else None


def record_activity(db: AsyncSession, user: User, kind: str, **meta: Any) -> None:
    db.add(ActivityEvent(user_id=user.id, kind=kind, meta=meta))
