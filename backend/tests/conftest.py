import os

os.environ.setdefault(
    "TEST_DATABASE_URL", "postgresql+psycopg://myst:myst_dev_password@localhost:5432/myst_finance_test"
)
os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
os.environ["ENVIRONMENT"] = "test"
os.environ["PAYMENT_PROVIDER"] = "mock"
os.environ["MAIL_BACKEND"] = "console"
os.environ["SITE_URL"] = "http://testserver"

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.db import engine
from app.main import app
from app.models import Base


class CapturingMailer:
    def __init__(self) -> None:
        self.sent: list[dict[str, str | None]] = []

    async def send(self, to: str, subject: str, text: str, reply_to: str | None = None) -> None:
        self.sent.append({"to": to, "subject": subject, "text": text, "reply_to": reply_to})

    def last_code(self) -> str:
        import re

        match = re.search(r"\b(\d{6})\b", str(self.sent[-1]["subject"]))
        assert match, self.sent[-1]
        return match.group(1)


@pytest.fixture(scope="session", autouse=True)
async def _schema() -> AsyncIterator[None]:
    schema = os.environ.get("DATABASE_SCHEMA")
    async with engine.begin() as connection:
        if schema:
            await connection.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
async def _clean_tables() -> AsyncIterator[None]:
    yield
    tables = ", ".join(table.name for table in Base.metadata.sorted_tables)
    async with engine.begin() as connection:
        await connection.execute(text(f"TRUNCATE {tables} CASCADE"))


@pytest.fixture
def mailer(monkeypatch: pytest.MonkeyPatch) -> CapturingMailer:
    capturing = CapturingMailer()
    monkeypatch.setattr("app.routers.auth.get_mailer", lambda: capturing)
    monkeypatch.setattr("app.routers.support.get_mailer", lambda: capturing)
    return capturing


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as c:
        yield c


async def login(client: AsyncClient, mailer: CapturingMailer, email: str = "rahul@example.com") -> dict:
    response = await client.post("/api/auth/otp/request", json={"email": email})
    assert response.status_code == 200, response.text
    response = await client.post("/api/auth/otp/verify", json={"email": email, "code": mailer.last_code()})
    assert response.status_code == 200, response.text
    return response.json()


@pytest.fixture
async def user_client(client: AsyncClient, mailer: CapturingMailer) -> AsyncClient:
    await login(client, mailer)
    return client


PERSONAL = {"full_name": "Rahul Sharma", "date_of_birth": "1994-05-18", "pan": "abcde1234f", "city": "Pune"}
EMPLOYMENT = {
    "employment_type": "salaried",
    "company_name": "Acme Pvt Ltd",
    "monthly_income": 50000,
    "work_experience": "3_5",
}
LOAN = {"loan_amount": 100000, "loan_purpose": "personal", "tenure_months": 24}


async def submitted_application(client: AsyncClient) -> dict:
    application = (await client.post("/api/applications")).json()
    for step, body in (("personal", PERSONAL), ("employment", EMPLOYMENT), ("loan", LOAN)):
        response = await client.put(f"/api/applications/{application['id']}/{step}", json=body)
        assert response.status_code == 200, response.text
    response = await client.post(f"/api/applications/{application['id']}/submit")
    assert response.status_code == 200, response.text
    return response.json()


async def pay(client: AsyncClient, method: str = "upi") -> dict:
    order = (await client.post("/api/payments/order", json={"method": method})).json()
    signed = (
        await client.post("/api/payments/mock/authorize", json={"order_id": order["order_id"], "method": method})
    ).json()
    response = await client.post("/api/payments/verify", json=signed)
    assert response.status_code == 200, response.text
    return response.json()
