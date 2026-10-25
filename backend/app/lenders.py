"""Lender directory, loaded from the YAML seed file at startup and served from memory."""

from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, HttpUrl, TypeAdapter, model_validator

LENDERS_FILE = Path(__file__).parent / "data" / "lenders.yaml"

Category = Literal["personal", "business", "other"]
LoanType = Literal["personal", "business", "gold", "education"]
Feature = Literal[
    "quick_approval",
    "minimal_documentation",
    "flexible_repayment",
    "online_process",
    "credit_line",
    "no_collateral",
    "instant_disbursal",
    "part_prepayment",
    "for_self_employed",
    "for_new_to_credit",
    "gst_based_lending",
    "gold_valuation",
    "study_abroad",
]
Document = Literal[
    "pan",
    "aadhaar",
    "bank_statement",
    "salary_slips",
    "photo",
    "itr",
    "gst_returns",
    "business_proof",
    "gold_items",
    "admission_letter",
    "address_proof",
    "co_applicant_kyc",
]


class LocalizedText(BaseModel):
    en: str
    hi: str


class Lender(BaseModel):
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
    website_url: HttpUrl
    features: list[Feature]
    documents: list[Document]
    tagline: LocalizedText
    about: LocalizedText
    verified: bool = False
    last_verified_on: date | None = None

    @model_validator(mode="after")
    def _ranges(self) -> "Lender":
        if self.min_amount > self.max_amount:
            raise ValueError(f"{self.slug}: min_amount > max_amount")
        if self.rate_min_pa > self.rate_max_pa:
            raise ValueError(f"{self.slug}: rate_min_pa > rate_max_pa")
        if self.tenure_min_months > self.tenure_max_months:
            raise ValueError(f"{self.slug}: tenure_min_months > tenure_max_months")
        return self


def load_lenders(path: Path = LENDERS_FILE) -> list[Lender]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    lenders = TypeAdapter(list[Lender]).validate_python(raw)
    slugs = [lender.slug for lender in lenders]
    duplicates = {s for s in slugs if slugs.count(s) > 1}
    if duplicates:
        raise ValueError(f"Duplicate lender slugs: {sorted(duplicates)}")
    return lenders


@lru_cache
def get_lenders() -> tuple[Lender, ...]:
    return tuple(load_lenders())


def get_lender(slug: str) -> Lender | None:
    return next((lender for lender in get_lenders() if lender.slug == slug), None)


def matches_application(lender: Lender, loan_amount: int | None, loan_purpose: str | None) -> bool:
    """Whether a lender is a plausible fit for an application's amount and purpose."""
    if loan_amount is None or not (lender.min_amount <= loan_amount <= lender.max_amount):
        return False
    if loan_purpose == "business":
        return lender.category == "business"
    if loan_purpose == "education":
        return lender.loan_type in ("education", "personal")
    return lender.category == "personal"
