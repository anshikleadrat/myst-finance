import logging
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import delete, func, select, update

from app.config import get_settings
from app.deps import DB, CurrentUser, OptionalUser, client_ip, record_activity
from app.mailer import get_mailer, otp_email
from app.models import EmailOTP, Session, User, utcnow
from app.schemas import OtpRequestIn, OtpRequestOut, OtpVerifyIn, ProfileUpdateIn, SessionOut, UserOut
from app.security import constant_time_equals, generate_otp, hash_otp, hash_session_token, new_session_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
log = logging.getLogger("app.auth")


@router.post("/otp/request", response_model=OtpRequestOut)
async def request_otp(payload: OtpRequestIn, request: Request, db: DB) -> OtpRequestOut:
    settings = get_settings()
    email = payload.email.lower()
    ip = client_ip(request)
    now = utcnow()
    hour_ago = now - timedelta(hours=1)
    dev_login = settings.is_dev_login_email(email)

    latest = await db.scalar(select(func.max(EmailOTP.created_at)).where(EmailOTP.email == email))
    if not dev_login and latest and (now - latest).total_seconds() < settings.otp_resend_cooldown_seconds:
        wait = settings.otp_resend_cooldown_seconds - int((now - latest).total_seconds())
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "otp_cooldown", headers={"Retry-After": str(wait)})

    per_email = await db.scalar(select(func.count()).where(EmailOTP.email == email, EmailOTP.created_at > hour_ago))
    per_ip = await db.scalar(select(func.count()).where(EmailOTP.ip == ip, EmailOTP.created_at > hour_ago))
    if not dev_login and (
        per_email >= settings.otp_max_per_email_per_hour or (ip and per_ip >= settings.otp_max_per_ip_per_hour)
    ):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "otp_rate_limited", headers={"Retry-After": "3600"})

    # A new code invalidates any earlier unused ones.
    await db.execute(
        update(EmailOTP).where(EmailOTP.email == email, EmailOTP.consumed_at.is_(None)).values(consumed_at=now)
    )
    code = settings.dev_login_code if dev_login else generate_otp()
    otp = EmailOTP(
        email=email,
        code_hash=hash_otp(email, code),
        ip=None if dev_login else ip,
        expires_at=now + timedelta(seconds=settings.otp_ttl_seconds),
    )
    db.add(otp)
    await db.commit()

    if dev_login:
        log.info("dev_login_code_issued email=%s", email)
    else:
        subject, body = otp_email(code, payload.locale, settings.otp_ttl_seconds)
        try:
            await get_mailer().send(email, subject, body)
        except Exception:
            log.exception("otp_email_failed email=%s", email)
            # An undelivered code must not count towards the cooldown or hourly limits.
            await db.delete(otp)
            await db.commit()
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "email_delivery_failed") from None

    return OtpRequestOut(
        resend_after_seconds=settings.otp_resend_cooldown_seconds, expires_in_seconds=settings.otp_ttl_seconds
    )


@router.post("/otp/verify", response_model=UserOut)
async def verify_otp(payload: OtpVerifyIn, request: Request, response: Response, db: DB) -> User:
    settings = get_settings()
    email = payload.email.lower()
    now = utcnow()

    otp = await db.scalar(
        select(EmailOTP)
        .where(EmailOTP.email == email, EmailOTP.consumed_at.is_(None), EmailOTP.expires_at > now)
        .order_by(EmailOTP.created_at.desc())
        .limit(1)
        .with_for_update()
    )
    if otp is None or otp.attempts >= settings.otp_max_attempts:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "otp_expired")

    if not constant_time_equals(otp.code_hash, hash_otp(email, payload.code)):
        otp.attempts += 1
        if otp.attempts >= settings.otp_max_attempts:
            otp.consumed_at = now
        await db.commit()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "otp_invalid")

    otp.consumed_at = now
    user = await db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email)
        db.add(user)
        await db.flush()
        record_activity(db, user, "account_created")
    user.last_login_at = now

    token, token_hash = new_session_token()
    db.add(
        Session(
            token_hash=token_hash,
            user_id=user.id,
            user_agent=(request.headers.get("user-agent") or "")[:255],
            ip=client_ip(request),
            expires_at=now + timedelta(days=settings.session_ttl_days),
        )
    )
    await db.commit()

    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=settings.session_ttl_days * 86400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response, db: DB) -> None:
    settings = get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        await db.execute(delete(Session).where(Session.token_hash == hash_session_token(token)))
        await db.commit()
    response.delete_cookie(settings.session_cookie_name, path="/")


@router.get("/session", response_model=SessionOut)
async def session(user: OptionalUser) -> SessionOut:
    """Like /me but 200 for anonymous visitors, so public pages can check login state without errors."""
    return SessionOut(user=UserOut.model_validate(user) if user else None)


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> User:
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(payload: ProfileUpdateIn, user: CurrentUser, db: DB) -> User:
    if payload.full_name is not None:
        user.full_name = " ".join(payload.full_name.split())
    if payload.locale is not None:
        user.locale = payload.locale
    await db.commit()
    return user
