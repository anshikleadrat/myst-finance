"""Outgoing email. `console` logs messages (development); `smtp` sends via e.g. Gmail SMTP;
`brevo` sends through Brevo's HTTPS API (works where outbound SMTP ports are blocked)."""

import logging
import ssl
from email.message import EmailMessage
from email.utils import parseaddr
from functools import lru_cache
from typing import Protocol

import aiosmtplib
import certifi
import httpx

from app.config import get_settings

log = logging.getLogger("app.mailer")


class Mailer(Protocol):
    async def send(self, to: str, subject: str, text: str, reply_to: str | None = None) -> None: ...


class ConsoleMailer:
    async def send(self, to: str, subject: str, text: str, reply_to: str | None = None) -> None:
        body = text.replace("\n", " | ")
        log.info("console_email to=%s subject=%r body=%r", to, subject, body)


@lru_cache
def _tls_context() -> ssl.SSLContext:
    # Use certifi's CA bundle: standalone Python builds (e.g. uv's) may not find the OS trust store.
    return ssl.create_default_context(cafile=certifi.where())


class SMTPMailer:
    async def send(self, to: str, subject: str, text: str, reply_to: str | None = None) -> None:
        settings = get_settings()
        message = EmailMessage()
        message["From"] = settings.mail_from
        message["To"] = to
        message["Subject"] = subject
        if reply_to:
            message["Reply-To"] = reply_to
        message.set_content(text)
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            start_tls=True,
            username=settings.smtp_username,
            password=settings.smtp_password.get_secret_value(),
            tls_context=_tls_context(),
            timeout=20,
        )
        log.info("smtp_email_sent to=%s subject=%r", to, subject)


class BrevoMailer:
    URL = "https://api.brevo.com/v3/smtp/email"

    def __init__(self, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._transport = transport

    async def send(self, to: str, subject: str, text: str, reply_to: str | None = None) -> None:
        settings = get_settings()
        sender_name, sender_email = parseaddr(settings.mail_from)
        payload: dict[str, object] = {
            "sender": {"name": sender_name or settings.business_name, "email": sender_email},
            "to": [{"email": to}],
            "subject": subject,
            "textContent": text,
        }
        if reply_to:
            payload["replyTo"] = {"email": reply_to}
        async with httpx.AsyncClient(transport=self._transport, timeout=15) as client:
            response = await client.post(
                self.URL, json=payload, headers={"api-key": settings.brevo_api_key.get_secret_value()}
            )
        if response.status_code >= 400:
            raise RuntimeError(f"Brevo rejected the email: {response.status_code} {response.text[:200]}")
        log.info("brevo_email_sent to=%s subject=%r", to, subject)


def get_mailer() -> Mailer:
    backend = get_settings().mail_backend
    if backend == "smtp":
        return SMTPMailer()
    if backend == "brevo":
        return BrevoMailer()
    return ConsoleMailer()


_OTP_TEMPLATES = {
    "en": (
        "{code} is your MYST Finance verification code",
        "Your MYST Finance verification code is {code}.\n\n"
        "It expires in {minutes} minutes. Never share this code with anyone; "
        "MYST Finance staff will never ask for it.\n\n"
        "If you did not request this code, you can ignore this email.",
    ),
    "hi": (
        "{code} आपका MYST Finance सत्यापन कोड है",
        "आपका MYST Finance सत्यापन कोड {code} है।\n\n"
        "यह {minutes} मिनट में समाप्त हो जाएगा। यह कोड किसी के साथ साझा न करें; "
        "MYST Finance कर्मचारी कभी भी यह कोड नहीं माँगेंगे।\n\n"
        "अगर आपने यह कोड नहीं माँगा था, तो इस ईमेल को अनदेखा करें।",
    ),
}


def otp_email(code: str, locale: str, ttl_seconds: int) -> tuple[str, str]:
    subject, body = _OTP_TEMPLATES.get(locale, _OTP_TEMPLATES["en"])
    minutes = ttl_seconds // 60
    return subject.format(code=code), body.format(code=code, minutes=minutes)
