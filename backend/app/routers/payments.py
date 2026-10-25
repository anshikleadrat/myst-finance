import json
import logging
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.deps import DB, CurrentUser, record_activity
from app.models import Application, InvoiceCounter, Payment, User, utcnow
from app.payments import MockGateway, get_gateway
from app.pdfs import invoice_pdf
from app.schemas import (
    CreateOrderIn,
    CreateOrderOut,
    MockAuthorizeIn,
    MockAuthorizeOut,
    PaymentOut,
    VerifyPaymentIn,
)

router = APIRouter(prefix="/api/payments", tags=["payments"])
log = logging.getLogger("app.payments")

ORDER_REUSE_WINDOW = timedelta(hours=1)


def financial_year(moment: datetime) -> str:
    start = moment.year if moment.month >= 4 else moment.year - 1
    return f"{start}-{str(start + 1)[-2:]}"


async def next_invoice_number(db: AsyncSession) -> str:
    fy = financial_year(utcnow())
    number = await db.scalar(
        update(InvoiceCounter)
        .where(InvoiceCounter.financial_year == fy)
        .values(last_number=InvoiceCounter.last_number + 1)
        .returning(InvoiceCounter.last_number)
    )
    if number is None:
        db.add(InvoiceCounter(financial_year=fy, last_number=1))
        await db.flush()
        number = 1
    return f"MF/{fy}/{number:06d}"


async def mark_paid(db: AsyncSession, payment: Payment, provider_payment_id: str, method: str | None) -> None:
    """Idempotently mark a payment as paid and grant lifetime lender access."""
    if payment.status == "paid":
        return
    now = utcnow()
    payment.status = "paid"
    payment.provider_payment_id = provider_payment_id
    payment.method = method
    payment.paid_at = now
    payment.invoice_number = await next_invoice_number(db)
    user = await db.get(User, payment.user_id)
    assert user is not None
    if user.lender_access_granted_at is None:
        user.lender_access_granted_at = now
    record_activity(
        db, user, "payment_completed", amount_paise=payment.amount_paise, invoice_number=payment.invoice_number
    )
    await db.commit()
    log.info("payment_paid payment=%s order=%s method=%s", payment.id, payment.order_id, method)


@router.get("", response_model=list[PaymentOut])
async def list_payments(user: CurrentUser, db: DB) -> list[Payment]:
    rows = await db.scalars(
        select(Payment)
        .where(Payment.user_id == user.id, Payment.status != "created")
        .order_by(Payment.created_at.desc())
    )
    return list(rows)


@router.post("/order", response_model=CreateOrderOut)
async def create_order(payload: CreateOrderIn, user: CurrentUser, db: DB) -> CreateOrderOut:
    settings = get_settings()
    gateway = get_gateway()
    if user.has_lender_access:
        raise HTTPException(status.HTTP_409_CONFLICT, "already_unlocked")

    application = await db.scalar(
        select(Application)
        .where(Application.user_id == user.id, Application.status == "submitted")
        .order_by(Application.submitted_at.desc())
        .limit(1)
    )
    if application is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "application_required")

    payment = await db.scalar(
        select(Payment)
        .where(
            Payment.user_id == user.id,
            Payment.status == "created",
            Payment.provider == gateway.name,
            Payment.amount_paise == settings.access_fee_paise,
            Payment.created_at > utcnow() - ORDER_REUSE_WINDOW,
        )
        .order_by(Payment.created_at.desc())
        .limit(1)
    )
    if payment is None:
        receipt = f"rcpt_{uuid.uuid4().hex[:16]}"
        try:
            order = await gateway.create_order(
                settings.access_fee_paise, receipt, {"user_id": str(user.id), "application_id": str(application.id)}
            )
        except Exception:
            log.exception("order_create_failed user=%s", user.id)
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "payment_gateway_unavailable") from None
        payment = Payment(
            user_id=user.id,
            application_id=application.id,
            provider=gateway.name,
            order_id=order.order_id,
            amount_paise=order.amount_paise,
            currency=order.currency,
        )
        db.add(payment)
        await db.commit()

    return CreateOrderOut(
        payment_id=payment.id,
        provider=gateway.name,  # type: ignore[arg-type]
        key_id=gateway.key_id,
        order_id=payment.order_id,
        amount_paise=payment.amount_paise,
        currency=payment.currency,
        business_name=settings.business_name,
        prefill={"email": user.email, "name": user.full_name or ""},
    )


@router.post("/mock/authorize", response_model=MockAuthorizeOut)
async def mock_authorize(payload: MockAuthorizeIn, user: CurrentUser, db: DB) -> MockAuthorizeOut:
    """Development only: plays the role of Razorpay Checkout and returns a signed payment."""
    gateway = get_gateway()
    if not isinstance(gateway, MockGateway):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not_found")
    payment = await db.scalar(select(Payment).where(Payment.order_id == payload.order_id, Payment.user_id == user.id))
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "order_not_found")
    provider_payment_id = f"pay_mock_{payload.method}_{uuid.uuid4().hex[:12]}"
    return MockAuthorizeOut(
        order_id=payment.order_id,
        provider_payment_id=provider_payment_id,
        signature=gateway.sign(payment.order_id, provider_payment_id),
    )


@router.post("/verify", response_model=PaymentOut)
async def verify_payment(payload: VerifyPaymentIn, user: CurrentUser, db: DB) -> Payment:
    gateway = get_gateway()
    payment = await db.scalar(
        select(Payment).where(Payment.order_id == payload.order_id, Payment.user_id == user.id).with_for_update()
    )
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "order_not_found")
    if payment.status == "paid":
        return payment
    if not gateway.verify_payment_signature(payload.order_id, payload.provider_payment_id, payload.signature):
        log.warning("payment_signature_invalid order=%s user=%s", payload.order_id, user.id)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid_signature")
    method = await gateway.fetch_payment_method(payload.provider_payment_id)
    await mark_paid(db, payment, payload.provider_payment_id, method)
    return payment


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def webhook(request: Request, db: DB) -> dict[str, str]:
    """Razorpay webhook (payment.captured / order.paid). Backs up the client-side verify call."""
    gateway = get_gateway()
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    if not gateway.verify_webhook_signature(body, signature):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid_signature")

    event = json.loads(body)
    if event.get("event") not in ("payment.captured", "order.paid"):
        return {"status": "ignored"}
    entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    order_id, provider_payment_id = entity.get("order_id"), entity.get("id")
    if not order_id or not provider_payment_id:
        return {"status": "ignored"}

    payment = await db.scalar(select(Payment).where(Payment.order_id == order_id).with_for_update())
    if payment is None:
        log.warning("webhook_unknown_order order=%s", order_id)
        return {"status": "ignored"}
    await mark_paid(db, payment, provider_payment_id, entity.get("method"))
    return {"status": "ok"}


@router.get("/{payment_id}/invoice.pdf")
async def invoice(payment_id: uuid.UUID, user: CurrentUser, db: DB) -> Response:
    payment = await db.scalar(
        select(Payment).where(Payment.id == payment_id, Payment.user_id == user.id, Payment.status == "paid")
    )
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "invoice_not_found")
    filename = (payment.invoice_number or "invoice").replace("/", "-") + ".pdf"
    return Response(
        invoice_pdf(payment, user),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
