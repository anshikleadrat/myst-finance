"""Payment gateways. Razorpay in production; a mock gateway for local development and tests."""

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from typing import Protocol

import httpx

from app.config import get_settings

RAZORPAY_API = "https://api.razorpay.com/v1"


@dataclass(frozen=True)
class GatewayOrder:
    order_id: str
    amount_paise: int
    currency: str


class PaymentGateway(Protocol):
    name: str
    key_id: str | None

    async def create_order(self, amount_paise: int, receipt: str, notes: dict[str, str]) -> GatewayOrder: ...

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool: ...

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool: ...

    async def fetch_payment_method(self, payment_id: str) -> str | None: ...


def _hmac_sha256(secret: str, message: bytes) -> str:
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


class RazorpayGateway:
    name = "razorpay"

    def __init__(self, key_id: str, key_secret: str, webhook_secret: str) -> None:
        self.key_id = key_id
        self._key_secret = key_secret
        self._webhook_secret = webhook_secret

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(base_url=RAZORPAY_API, auth=(self.key_id, self._key_secret), timeout=15)

    async def create_order(self, amount_paise: int, receipt: str, notes: dict[str, str]) -> GatewayOrder:
        async with self._client() as client:
            response = await client.post(
                "/orders",
                json={"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": notes},
            )
            response.raise_for_status()
            data = response.json()
        return GatewayOrder(order_id=data["id"], amount_paise=data["amount"], currency=data["currency"])

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        expected = _hmac_sha256(self._key_secret, f"{order_id}|{payment_id}".encode())
        return hmac.compare_digest(expected, signature)

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        if not self._webhook_secret:
            return False
        return hmac.compare_digest(_hmac_sha256(self._webhook_secret, body), signature)

    async def fetch_payment_method(self, payment_id: str) -> str | None:
        async with self._client() as client:
            response = await client.get(f"/payments/{payment_id}")
            if response.status_code != 200:
                return None
            return response.json().get("method")


class MockGateway:
    """Simulates Razorpay's order/signature contract so the same verification path is exercised."""

    name = "mock"
    key_id = None

    def __init__(self, secret: str) -> None:
        self._secret = secret

    async def create_order(self, amount_paise: int, receipt: str, notes: dict[str, str]) -> GatewayOrder:
        return GatewayOrder(order_id=f"order_mock_{secrets.token_hex(8)}", amount_paise=amount_paise, currency="INR")

    def sign(self, order_id: str, payment_id: str) -> str:
        return _hmac_sha256(self._secret, f"{order_id}|{payment_id}".encode())

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        return hmac.compare_digest(self.sign(order_id, payment_id), signature)

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        return hmac.compare_digest(_hmac_sha256(self._secret, body), signature)

    async def fetch_payment_method(self, payment_id: str) -> str | None:
        # Mock payment ids encode the chosen method: pay_mock_<method>_<random>
        parts = payment_id.split("_")
        return parts[2] if len(parts) >= 4 else None


def get_gateway() -> PaymentGateway:
    settings = get_settings()
    if settings.payment_provider == "razorpay":
        return RazorpayGateway(
            settings.razorpay_key_id,
            settings.razorpay_key_secret.get_secret_value(),
            settings.razorpay_webhook_secret.get_secret_value(),
        )
    return MockGateway("mock-gateway:" + settings.secret_key.get_secret_value())
