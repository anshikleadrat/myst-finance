from httpx import AsyncClient

from tests.conftest import CapturingMailer, login


async def test_otp_login_creates_user_and_session(client: AsyncClient, mailer: CapturingMailer) -> None:
    assert (await client.get("/api/auth/me")).status_code == 401

    user = await login(client, mailer, "New.User@Example.com")

    assert user["email"] == "new.user@example.com"
    assert user["has_lender_access"] is False
    assert "myst_session" in client.cookies
    me = await client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["id"] == user["id"]


async def test_otp_email_is_localized(client: AsyncClient, mailer: CapturingMailer) -> None:
    await client.post("/api/auth/otp/request", json={"email": "a@example.com", "locale": "hi"})
    assert "सत्यापन कोड" in str(mailer.sent[-1]["subject"])


async def test_wrong_code_is_rejected_and_locks_after_max_attempts(
    client: AsyncClient, mailer: CapturingMailer
) -> None:
    await client.post("/api/auth/otp/request", json={"email": "a@example.com"})
    good = mailer.last_code()
    wrong = "000000" if good != "000000" else "111111"

    for _ in range(5):
        response = await client.post("/api/auth/otp/verify", json={"email": "a@example.com", "code": wrong})
        assert response.status_code == 400
    # After the maximum attempts even the right code no longer works.
    response = await client.post("/api/auth/otp/verify", json={"email": "a@example.com", "code": good})
    assert response.status_code == 400
    assert response.json()["detail"] == "otp_expired"


async def test_otp_cannot_be_reused(client: AsyncClient, mailer: CapturingMailer) -> None:
    await client.post("/api/auth/otp/request", json={"email": "a@example.com"})
    code = mailer.last_code()
    assert (await client.post("/api/auth/otp/verify", json={"email": "a@example.com", "code": code})).status_code == 200
    assert (await client.post("/api/auth/otp/verify", json={"email": "a@example.com", "code": code})).status_code == 400


async def test_resend_cooldown(client: AsyncClient, mailer: CapturingMailer) -> None:
    assert (await client.post("/api/auth/otp/request", json={"email": "a@example.com"})).status_code == 200
    response = await client.post("/api/auth/otp/request", json={"email": "a@example.com"})
    assert response.status_code == 429
    assert response.json()["detail"] == "otp_cooldown"
    assert int(response.headers["retry-after"]) > 0


async def test_logout_ends_session(client: AsyncClient, mailer: CapturingMailer) -> None:
    await login(client, mailer)
    assert (await client.post("/api/auth/logout")).status_code == 204
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_update_profile(user_client: AsyncClient) -> None:
    response = await user_client.patch("/api/auth/me", json={"full_name": "  Rahul   Sharma ", "locale": "hi"})
    assert response.status_code == 200
    assert response.json()["full_name"] == "Rahul Sharma"
    assert response.json()["locale"] == "hi"


async def test_cross_site_requests_are_rejected(client: AsyncClient, mailer: CapturingMailer) -> None:
    response = await client.post(
        "/api/auth/otp/request", json={"email": "a@example.com"}, headers={"Origin": "https://evil.example"}
    )
    assert response.status_code == 403
    response = await client.post(
        "/api/auth/otp/request", json={"email": "a@example.com"}, headers={"Sec-Fetch-Site": "cross-site"}
    )
    assert response.status_code == 403
    response = await client.post(
        "/api/auth/otp/request", json={"email": "a@example.com"}, headers={"Origin": "http://testserver"}
    )
    assert response.status_code == 200


async def test_session_endpoint_is_200_for_anonymous_and_logged_in(
    client: AsyncClient, mailer: CapturingMailer
) -> None:
    anonymous = await client.get("/api/auth/session")
    assert anonymous.status_code == 200
    assert anonymous.json() == {"user": None}
    user = await login(client, mailer)
    assert (await client.get("/api/auth/session")).json()["user"]["id"] == user["id"]


async def test_failed_delivery_does_not_start_cooldown(client: AsyncClient, monkeypatch) -> None:
    class BrokenMailer:
        async def send(self, *args: object, **kwargs: object) -> None:
            raise OSError("smtp down")

    monkeypatch.setattr("app.routers.auth.get_mailer", lambda: BrokenMailer())
    first = await client.post("/api/auth/otp/request", json={"email": "a@example.com"})
    assert first.status_code == 502
    assert first.json()["detail"] == "email_delivery_failed"
    # Retrying immediately hits the mailer again instead of the resend cooldown.
    assert (await client.post("/api/auth/otp/request", json={"email": "a@example.com"})).status_code == 502


async def test_dev_login_code_for_test_domain(client: AsyncClient, mailer: CapturingMailer, monkeypatch) -> None:
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "dev_login_code", "123456")
    for _ in range(3):  # no cooldown or hourly limit for test accounts
        assert (
            await client.post("/api/auth/otp/request", json={"email": "paid@test.mystfinance.in"})
        ).status_code == 200
    assert mailer.sent == []  # nothing is emailed
    response = await client.post("/api/auth/otp/verify", json={"email": "paid@test.mystfinance.in", "code": "123456"})
    assert response.status_code == 200

    # Other domains still get a random emailed code.
    await client.post("/api/auth/otp/request", json={"email": "real@example.com"})
    assert len(mailer.sent) == 1


def test_production_rejects_dev_login_code() -> None:
    import pytest
    from pydantic import ValidationError

    from app.config import Settings

    with pytest.raises(ValidationError, match="DEV_LOGIN_CODE must be empty"):
        Settings(
            _env_file=None,
            environment="production",
            secret_key="x" * 40,
            pii_encryption_key="ZmFrZS1rZXktZm9yLXRlc3RzLW9ubHktMzJieXRlcyE=",
            mail_backend="smtp",
            payment_provider="razorpay",
            razorpay_key_id="rzp_live_x",
            razorpay_key_secret="y",
            dev_login_code="123456",
        )
