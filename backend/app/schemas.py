"""Request/response models shared by the routers."""

import re
import uuid
from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.lenders import Category, Document, Feature, LoanType, LocalizedText

Locale = Literal["en", "hi"]
EmploymentType = Literal["salaried", "self_employed_professional", "business_owner"]
WorkExperience = Literal["lt_1", "1_3", "3_5", "gt_5"]
LoanPurpose = Literal[
    "personal",
    "medical",
    "wedding",
    "travel",
    "education",
    "home_renovation",
    "debt_consolidation",
    "business",
    "other",
]
TENURE_OPTIONS = (6, 12, 18, 24, 36, 48, 60)
LOAN_AMOUNT_MIN = 10_000
LOAN_AMOUNT_MAX = 1_000_000
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")


class ErrorOut(BaseModel):
    detail: str


# ---------- auth ----------


class OtpRequestIn(BaseModel):
    email: EmailStr
    locale: Locale = "en"


class OtpRequestOut(BaseModel):
    resend_after_seconds: int
    expires_in_seconds: int


class OtpVerifyIn(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str | None
    locale: str
    has_lender_access: bool
    lender_access_granted_at: datetime | None
    created_at: datetime


class SessionOut(BaseModel):
    user: UserOut | None


class ProfileUpdateIn(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    locale: Locale | None = None


# ---------- applications ----------


class PersonalStepIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    date_of_birth: date
    pan: str
    city: str = Field(min_length=2, max_length=80)

    @field_validator("full_name", "city")
    @classmethod
    def _strip(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("pan")
    @classmethod
    def _pan(cls, value: str) -> str:
        value = value.strip().upper()
        if not PAN_RE.match(value):
            raise ValueError("Enter a valid 10-character PAN, e.g. ABCDE1234F")
        return value

    @field_validator("date_of_birth")
    @classmethod
    def _age(cls, value: date) -> date:
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise ValueError("You must be at least 18 years old")
        if age > 75:
            raise ValueError("Enter a valid date of birth")
        return value


class EmploymentStepIn(BaseModel):
    employment_type: EmploymentType
    company_name: str = Field(min_length=2, max_length=160)
    monthly_income: int = Field(ge=1_000, le=10_000_000)
    work_experience: WorkExperience

    @field_validator("company_name")
    @classmethod
    def _strip(cls, value: str) -> str:
        return " ".join(value.split())


class LoanStepIn(BaseModel):
    loan_amount: int = Field(ge=LOAN_AMOUNT_MIN, le=LOAN_AMOUNT_MAX)
    loan_purpose: LoanPurpose
    tenure_months: int

    @field_validator("tenure_months")
    @classmethod
    def _tenure(cls, value: int) -> int:
        if value not in TENURE_OPTIONS:
            raise ValueError(f"Tenure must be one of {TENURE_OPTIONS}")
        return value


StepName = Literal["personal", "employment", "loan"]


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: Literal["draft", "submitted"]
    full_name: str | None
    email: str
    date_of_birth: date | None
    pan: str | None = None
    pan_masked: str | None
    city: str | None
    employment_type: EmploymentType | None
    company_name: str | None
    monthly_income: int | None
    work_experience: WorkExperience | None
    loan_amount: int | None
    loan_purpose: LoanPurpose | None
    tenure_months: int | None
    completed_steps: list[StepName]
    created_at: datetime
    submitted_at: datetime | None


# ---------- lenders ----------


class LenderPublicOut(BaseModel):
    slug: str
    name: str
    category: Category
    loan_type: LoanType
    min_amount: int
    max_amount: int
    rate_min_pa: float
    rate_max_pa: float
    processing_fee: LocalizedText
    tenure_min_months: int
    tenure_max_months: int
    features: list[Feature]
    documents: list[Document]
    tagline: LocalizedText
    about: LocalizedText
    verified: bool
    last_verified_on: date | None


class LenderDetailOut(LenderPublicOut):
    locked: bool
    website_url: str | None


class LenderUnlockedOut(LenderPublicOut):
    website_url: str
    matches_application: bool


class LenderListOut(BaseModel):
    lenders: list[LenderUnlockedOut]
    application_id: uuid.UUID | None


# ---------- payments ----------


class CreateOrderIn(BaseModel):
    method: Literal["upi", "card", "netbanking", "wallet"] | None = None


class CreateOrderOut(BaseModel):
    payment_id: uuid.UUID
    provider: Literal["mock", "razorpay"]
    key_id: str | None
    order_id: str
    amount_paise: int
    currency: str
    business_name: str
    prefill: dict[str, str]


class VerifyPaymentIn(BaseModel):
    order_id: str = Field(max_length=64)
    provider_payment_id: str = Field(max_length=64)
    signature: str = Field(max_length=256)


class MockAuthorizeIn(BaseModel):
    order_id: str = Field(max_length=64)
    method: Literal["upi", "card", "netbanking", "wallet"] = "upi"


class MockAuthorizeOut(BaseModel):
    order_id: str
    provider_payment_id: str
    signature: str


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: str
    amount_paise: int
    currency: str
    status: Literal["created", "paid", "failed"]
    method: str | None
    invoice_number: str | None
    created_at: datetime
    paid_at: datetime | None


# ---------- dashboard ----------


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    kind: str
    meta: dict[str, Any]
    created_at: datetime


class DashboardOut(BaseModel):
    full_name: str | None
    applications_submitted: int
    has_lender_access: bool
    total_paid_paise: int
    total_lenders: int
    recent_activity: list[ActivityOut]


class SupportIn(BaseModel):
    subject: str = Field(min_length=3, max_length=150)
    message: str = Field(min_length=10, max_length=4000)
