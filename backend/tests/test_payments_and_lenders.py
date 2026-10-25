import hashlib
import hmac
import json
import re

from httpx import AsyncClient

from app.config import get_settings
from app.lenders import get_lender, get_lenders, matches_application
from app.pdfs import inr
from tests.conftest import pay, submitted_application


def mock_webhook_signature(body: bytes) -> str:
    secret = "mock-gateway:" + get_settings().secret_key.get_secret_value()
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


async def test_order_requires_submitted_application(user_client: AsyncClient) -> None:
    response = await user_client.post("/api/payments/order", json={})
    assert response.status_code == 400
    assert response.json()["detail"] == "application_required"


async def test_order_is_reused_until_paid(user_client: AsyncClient) -> None:
    await submitted_application(user_client)
    first = (await user_client.post("/api/payments/order", json={})).json()
    second = (await user_client.post("/api/payments/order", json={})).json()
    assert first["order_id"] == second["order_id"]
    assert first["amount_paise"] == 19900
    assert first["provider"] == "mock"
    assert first["prefill"]["email"] == "rahul@example.com"


async def test_payment_unlocks_lender_access(user_client: AsyncClient) -> None:
    await submitted_application(user_client)
    assert (await user_client.get("/api/me/lenders")).status_code == 402

    payment = await pay(user_client, "card")
    assert payment["status"] == "paid"
    assert payment["method"] == "card"
    assert re.fullmatch(r"MF/\d{4}-\d{2}/000001", payment["invoice_number"])

    me = (await user_client.get("/api/auth/me")).json()
    assert me["has_lender_access"] is True
    assert (await user_client.post("/api/payments/order", json={})).status_code == 409

    payments = (await user_client.get("/api/payments")).json()
    assert [p["status"] for p in payments] == ["paid"]
    invoice = await user_client.get(f"/api/payments/{payment['id']}/invoice.pdf")
    assert invoice.status_code == 200
    assert invoice.content.startswith(b"%PDF")


async def test_invalid_signature_is_rejected(user_client: AsyncClient) -> None:
    await submitted_application(user_client)
    order = (await user_client.post("/api/payments/order", json={})).json()
    response = await user_client.post(
        "/api/payments/verify",
        json={"order_id": order["order_id"], "provider_payment_id": "pay_mock_upi_x", "signature": "bad"},
    )
    assert response.status_code == 400
    assert (await user_client.get("/api/auth/me")).json()["has_lender_access"] is False


async def test_verify_is_idempotent(user_client: AsyncClient) -> None:
    await submitted_application(user_client)
    order = (await user_client.post("/api/payments/order", json={})).json()
    signed = (await user_client.post("/api/payments/mock/authorize", json={"order_id": order["order_id"]})).json()
    first = (await user_client.post("/api/payments/verify", json=signed)).json()
    second = (await user_client.post("/api/payments/verify", json=signed)).json()
    assert first["invoice_number"] == second["invoice_number"]


async def test_webhook_marks_payment_paid(user_client: AsyncClient) -> None:
    await submitted_application(user_client)
    order = (await user_client.post("/api/payments/order", json={})).json()
    body = json.dumps(
        {
            "event": "payment.captured",
            "payload": {"payment": {"entity": {"id": "pay_hook_1", "order_id": order["order_id"], "method": "upi"}}},
        }
    ).encode()

    bad = await user_client.post("/api/payments/webhook", content=body, headers={"X-Razorpay-Signature": "nope"})
    assert bad.status_code == 400

    response = await user_client.post(
        "/api/payments/webhook",
        content=body,
        headers={"X-Razorpay-Signature": mock_webhook_signature(body), "Origin": "https://api.razorpay.com"},
    )
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert (await user_client.get("/api/auth/me")).json()["has_lender_access"] is True


async def test_public_lender_endpoints_hide_website(client: AsyncClient) -> None:
    lenders = (await client.get("/api/lenders")).json()
    assert len(lenders) == 24
    assert all("website_url" not in lender for lender in lenders)
    business = (await client.get("/api/lenders", params={"category": "business"})).json()
    assert {lender["category"] for lender in business} == {"business"}

    detail = (await client.get("/api/lenders/moneytap")).json()
    assert detail["locked"] is True
    assert detail["website_url"] is None
    assert (await client.get("/api/lenders/does-not-exist")).status_code == 404


async def test_unlocked_lender_list(user_client: AsyncClient) -> None:
    await submitted_application(user_client)
    await pay(user_client)

    listing = (await user_client.get("/api/me/lenders")).json()
    assert len(listing["lenders"]) == 24
    assert all(lender["website_url"].startswith("https://") for lender in listing["lenders"])
    flags = [lender["matches_application"] for lender in listing["lenders"]]
    assert flags == sorted(flags, reverse=True)  # matches first
    assert any(flags)

    detail = (await user_client.get("/api/lenders/moneytap")).json()
    assert detail["locked"] is False
    assert detail["website_url"] == "https://www.moneytap.com/"

    pdf = await user_client.get("/api/me/lenders.pdf")
    assert pdf.status_code == 200
    assert pdf.content.startswith(b"%PDF")

    dashboard = (await user_client.get("/api/me/dashboard")).json()
    assert dashboard["applications_submitted"] == 1
    assert dashboard["has_lender_access"] is True
    assert dashboard["total_paid_paise"] == 19900
    assert dashboard["total_lenders"] == 24
    kinds = [event["kind"] for event in dashboard["recent_activity"]]
    assert kinds[:3] == ["lender_list_downloaded", "lender_list_accessed", "payment_completed"]


async def test_support_request(user_client: AsyncClient, mailer) -> None:
    response = await user_client.post(
        "/api/support", json={"subject": "Payment question", "message": "I need a GST invoice please."}
    )
    assert response.status_code == 202
    assert mailer.sent[-1]["to"] == get_settings().support_email
    assert mailer.sent[-1]["reply_to"] == "rahul@example.com"


def test_seed_file_is_consistent() -> None:
    lenders = get_lenders()
    assert len(lenders) == 24
    counts = {c: sum(1 for lender in lenders if lender.category == c) for c in ("personal", "business", "other")}
    assert counts == {"personal": 14, "business": 6, "other": 4}
    assert all(not lender.verified for lender in lenders)


def test_matching() -> None:
    moneytap, lendingkart, credila = get_lender("moneytap"), get_lender("lendingkart"), get_lender("credila")
    assert moneytap and lendingkart and credila
    assert matches_application(moneytap, 100_000, "medical")
    assert not matches_application(moneytap, 900_000, "medical")  # above max
    assert not matches_application(lendingkart, 100_000, "medical")
    assert matches_application(lendingkart, 100_000, "business")
    assert matches_application(credila, 500_000, "education")
    assert not matches_application(moneytap, None, None)


def test_inr_grouping() -> None:
    assert inr(199) == "Rs. 199"
    assert inr(100000) == "Rs. 1,00,000"
    assert inr(10000000) == "Rs. 1,00,00,000"
    assert inr(168.64) == "Rs. 168.64"
