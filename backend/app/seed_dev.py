"""Create test accounts for local testing: `uv run python -m app.seed_dev`.

Log in with any of these emails and the DEV_LOGIN_CODE from backend/.env (no email is sent):

  new@test.mystfinance.in      fresh account, no application
  applied@test.mystfinance.in  submitted application, lender list still locked (test checkout)
  paid@test.mystfinance.in     submitted application + paid ₹199 (lender list unlocked, invoice available)

Re-running resets these three accounts to the states above. Refuses to run in production.
"""

import asyncio
from datetime import date

from sqlalchemy import delete, select

from app.config import get_settings
from app.db import SessionLocal, engine
from app.deps import record_activity
from app.models import Application, Payment, User, utcnow
from app.routers.payments import mark_paid
from app.security import mask_pan

ACCOUNTS = {
    "new@test.mystfinance.in": {"name": None, "stage": "new"},
    "applied@test.mystfinance.in": {"name": "Priya Verma", "stage": "applied"},
    "paid@test.mystfinance.in": {"name": "Rahul Sharma", "stage": "paid"},
}


async def seed() -> None:
    settings = get_settings()
    if settings.is_production:
        raise SystemExit("Refusing to seed test accounts in production.")

    async with SessionLocal() as db:
        # Reset: deleting the users cascades to their sessions, applications, payments and activity.
        await db.execute(delete(User).where(User.email.in_(list(ACCOUNTS))))
        await db.commit()

        for email, spec in ACCOUNTS.items():
            user = User(email=email, full_name=spec["name"], last_login_at=None)
            db.add(user)
            await db.flush()
            record_activity(db, user, "account_created")
            if spec["stage"] == "new":
                continue

            pan = "ABCDE1234F" if spec["stage"] == "paid" else "PQRST6789K"
            application = Application(
                user_id=user.id,
                status="submitted",
                full_name=spec["name"],
                date_of_birth=date(1994, 5, 18),
                pan=pan,
                pan_masked=mask_pan(pan),
                city="Pune",
                employment_type="salaried",
                company_name="Acme Technologies Pvt Ltd",
                monthly_income=50_000,
                work_experience="3_5",
                loan_amount=100_000,
                loan_purpose="personal",
                tenure_months=24,
                submitted_at=utcnow(),
            )
            db.add(application)
            await db.flush()
            record_activity(db, user, "application_submitted", application_id=str(application.id), loan_amount=100_000)

            if spec["stage"] == "paid":
                payment = Payment(
                    user_id=user.id,
                    application_id=application.id,
                    provider="mock",
                    order_id=f"order_seed_{user.id.hex[:12]}",
                    amount_paise=settings.access_fee_paise,
                    currency="INR",
                )
                db.add(payment)
                await db.flush()
                await mark_paid(db, payment, f"pay_seed_upi_{user.id.hex[:12]}", "upi")
        await db.commit()

        rows = await db.scalars(select(User).where(User.email.in_(list(ACCOUNTS))).order_by(User.email))
        print("Seeded test accounts:")
        for user in rows:
            print(f"  {user.email:<32} lender access: {'yes' if user.has_lender_access else 'no'}")
        if settings.dev_login_code:
            print(f"Login code for @{settings.dev_login_domain} emails: {settings.dev_login_code}")
        else:
            print("DEV_LOGIN_CODE is not set in backend/.env, so these accounts need a real emailed OTP.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
