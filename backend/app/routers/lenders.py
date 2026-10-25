from datetime import timedelta

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select

from app.deps import DB, CurrentUser, OptionalUser, record_activity
from app.lenders import Category, get_lender, get_lenders, matches_application
from app.models import ActivityEvent, Application, Payment, User, utcnow
from app.pdfs import lender_list_pdf
from app.schemas import (
    ActivityOut,
    DashboardOut,
    LenderDetailOut,
    LenderListOut,
    LenderPublicOut,
    LenderUnlockedOut,
)

router = APIRouter(tags=["lenders"])

PUBLIC_FIELDS = set(LenderPublicOut.model_fields)


@router.get("/api/lenders", response_model=list[LenderPublicOut])
async def public_lenders(category: Category | None = None) -> list[LenderPublicOut]:
    return [
        LenderPublicOut.model_validate(lender.model_dump(include=PUBLIC_FIELDS))
        for lender in get_lenders()
        if category is None or lender.category == category
    ]


@router.get("/api/lenders/{slug}", response_model=LenderDetailOut)
async def lender_detail(slug: str, user: OptionalUser) -> LenderDetailOut:
    lender = get_lender(slug)
    if lender is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "lender_not_found")
    unlocked = bool(user and user.has_lender_access)
    return LenderDetailOut(
        **lender.model_dump(include=PUBLIC_FIELDS),
        locked=not unlocked,
        website_url=str(lender.website_url) if unlocked else None,
    )


def require_access(user: User) -> None:
    if not user.has_lender_access:
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "payment_required")


async def latest_submitted(db: DB, user: User) -> Application | None:
    return await db.scalar(
        select(Application)
        .where(Application.user_id == user.id, Application.status == "submitted")
        .order_by(Application.submitted_at.desc())
        .limit(1)
    )


@router.get("/api/me/lenders", response_model=LenderListOut)
async def unlocked_lenders(user: CurrentUser, db: DB) -> LenderListOut:
    require_access(user)
    application = await latest_submitted(db, user)
    amount = application.loan_amount if application else None
    purpose = application.loan_purpose if application else None

    # Log list access at most once a day to keep the activity feed meaningful.
    seen_today = await db.scalar(
        select(func.count()).where(
            ActivityEvent.user_id == user.id,
            ActivityEvent.kind == "lender_list_accessed",
            ActivityEvent.created_at > utcnow() - timedelta(days=1),
        )
    )
    if not seen_today:
        record_activity(db, user, "lender_list_accessed")
        await db.commit()

    lenders = [
        LenderUnlockedOut(
            **lender.model_dump(include=PUBLIC_FIELDS),
            website_url=str(lender.website_url),
            matches_application=matches_application(lender, amount, purpose),
        )
        for lender in get_lenders()
    ]
    lenders.sort(key=lambda lender: not lender.matches_application)
    return LenderListOut(lenders=lenders, application_id=application.id if application else None)


@router.get("/api/me/lenders.pdf")
async def download_lenders(user: CurrentUser, db: DB) -> Response:
    require_access(user)
    record_activity(db, user, "lender_list_downloaded")
    await db.commit()
    return Response(
        lender_list_pdf(get_lenders(), user),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="myst-finance-lender-list.pdf"'},
    )


@router.get("/api/me/dashboard", response_model=DashboardOut)
async def dashboard(user: CurrentUser, db: DB) -> DashboardOut:
    submitted = await db.scalar(
        select(func.count()).where(Application.user_id == user.id, Application.status == "submitted")
    )
    paid = await db.scalar(
        select(func.coalesce(func.sum(Payment.amount_paise), 0)).where(
            Payment.user_id == user.id, Payment.status == "paid"
        )
    )
    activity = await db.scalars(
        select(ActivityEvent)
        .where(ActivityEvent.user_id == user.id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(10)
    )
    return DashboardOut(
        full_name=user.full_name,
        applications_submitted=submitted or 0,
        has_lender_access=user.has_lender_access,
        total_paid_paise=paid or 0,
        total_lenders=len(get_lenders()),
        recent_activity=[ActivityOut.model_validate(a) for a in activity],
    )
