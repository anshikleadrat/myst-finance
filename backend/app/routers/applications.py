import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import DB, CurrentUser, record_activity
from app.models import Application, User, utcnow
from app.schemas import ApplicationOut, EmploymentStepIn, LoanStepIn, PersonalStepIn, StepName
from app.security import mask_pan

router = APIRouter(prefix="/api/applications", tags=["applications"])

STEP_FIELDS: dict[StepName, tuple[str, ...]] = {
    "personal": ("full_name", "date_of_birth", "pan", "city"),
    "employment": ("employment_type", "company_name", "monthly_income", "work_experience"),
    "loan": ("loan_amount", "loan_purpose", "tenure_months"),
}


def completed_steps(application: Application) -> list[StepName]:
    return [
        step for step, fields in STEP_FIELDS.items() if all(getattr(application, field) is not None for field in fields)
    ]


def to_out(application: Application, user: User, *, include_pan: bool = False) -> ApplicationOut:
    return ApplicationOut.model_validate(
        {
            **{c.key: getattr(application, c.key) for c in Application.__table__.columns},
            "pan": application.pan if include_pan else None,
            "email": user.email,
            "completed_steps": completed_steps(application),
        }
    )


async def get_owned(db: DB, user: User, application_id: uuid.UUID) -> Application:
    application = await db.scalar(
        select(Application).where(Application.id == application_id, Application.user_id == user.id)
    )
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "application_not_found")
    return application


@router.get("", response_model=list[ApplicationOut])
async def list_applications(user: CurrentUser, db: DB) -> list[ApplicationOut]:
    rows = await db.scalars(
        select(Application).where(Application.user_id == user.id).order_by(Application.created_at.desc())
    )
    return [to_out(a, user) for a in rows]


@router.post("", response_model=ApplicationOut)
async def start_application(user: CurrentUser, db: DB) -> ApplicationOut:
    """Return the user's open draft, or start a new one prefilled from their last application."""
    draft = await db.scalar(select(Application).where(Application.user_id == user.id, Application.status == "draft"))
    if draft is None:
        previous = await db.scalar(
            select(Application).where(Application.user_id == user.id).order_by(Application.created_at.desc()).limit(1)
        )
        draft = Application(user_id=user.id, full_name=user.full_name)
        if previous is not None:
            for field in STEP_FIELDS["personal"] + STEP_FIELDS["employment"]:
                setattr(draft, field, getattr(previous, field))
            draft.pan_masked = previous.pan_masked
        db.add(draft)
        await db.commit()
    return to_out(draft, user, include_pan=True)


@router.get("/{application_id}", response_model=ApplicationOut)
async def get_application(application_id: uuid.UUID, user: CurrentUser, db: DB) -> ApplicationOut:
    application = await get_owned(db, user, application_id)
    return to_out(application, user, include_pan=application.status == "draft")


async def _save_step(db: DB, user: User, application_id: uuid.UUID, values: dict[str, object]) -> ApplicationOut:
    application = await get_owned(db, user, application_id)
    if application.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "application_already_submitted")
    for field, value in values.items():
        setattr(application, field, value)
    await db.commit()
    return to_out(application, user, include_pan=True)


@router.put("/{application_id}/personal", response_model=ApplicationOut)
async def save_personal(
    application_id: uuid.UUID, payload: PersonalStepIn, user: CurrentUser, db: DB
) -> ApplicationOut:
    return await _save_step(db, user, application_id, {**payload.model_dump(), "pan_masked": mask_pan(payload.pan)})


@router.put("/{application_id}/employment", response_model=ApplicationOut)
async def save_employment(
    application_id: uuid.UUID, payload: EmploymentStepIn, user: CurrentUser, db: DB
) -> ApplicationOut:
    return await _save_step(db, user, application_id, payload.model_dump())


@router.put("/{application_id}/loan", response_model=ApplicationOut)
async def save_loan(application_id: uuid.UUID, payload: LoanStepIn, user: CurrentUser, db: DB) -> ApplicationOut:
    return await _save_step(db, user, application_id, payload.model_dump())


@router.post("/{application_id}/submit", response_model=ApplicationOut)
async def submit_application(application_id: uuid.UUID, user: CurrentUser, db: DB) -> ApplicationOut:
    application = await get_owned(db, user, application_id)
    if application.status != "draft":
        raise HTTPException(status.HTTP_409_CONFLICT, "application_already_submitted")
    missing = [step for step in STEP_FIELDS if step not in completed_steps(application)]
    if missing:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"incomplete_steps:{','.join(missing)}")

    application.status = "submitted"
    application.submitted_at = utcnow()
    if not user.full_name:
        user.full_name = application.full_name
    record_activity(
        db, user, "application_submitted", application_id=str(application.id), loan_amount=application.loan_amount
    )
    await db.commit()
    return to_out(application, user)
