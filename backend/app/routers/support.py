import logging
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.config import get_settings
from app.deps import DB, CurrentUser, record_activity
from app.mailer import get_mailer
from app.models import ActivityEvent, utcnow
from app.schemas import SupportIn

router = APIRouter(prefix="/api/support", tags=["support"])
log = logging.getLogger("app.support")

MAX_REQUESTS_PER_DAY = 5


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def contact_support(payload: SupportIn, user: CurrentUser, db: DB) -> dict[str, str]:
    recent = await db.scalar(
        select(func.count()).where(
            ActivityEvent.user_id == user.id,
            ActivityEvent.kind == "support_request",
            ActivityEvent.created_at > utcnow() - timedelta(days=1),
        )
    )
    if (recent or 0) >= MAX_REQUESTS_PER_DAY:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "support_rate_limited")

    body = f"From: {user.full_name or '-'} <{user.email}>\nUser ID: {user.id}\n\n{payload.message}"
    try:
        await get_mailer().send(get_settings().support_email, f"[Support] {payload.subject}", body, reply_to=user.email)
    except Exception:
        log.exception("support_email_failed user=%s", user.id)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "email_delivery_failed") from None
    record_activity(db, user, "support_request", subject=payload.subject)
    await db.commit()
    return {"status": "sent"}
