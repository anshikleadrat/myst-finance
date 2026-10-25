import json

import httpx
import pytest

from app.config import get_settings
from app.mailer import BrevoMailer


async def test_brevo_mailer_sends_expected_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "mail_from", "MYST Finance <sender@example.com>")
    monkeypatch.setattr(settings, "brevo_api_key", type(settings.brevo_api_key)("test-key"))
    seen: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["key"] = request.headers["api-key"]
        seen["body"] = json.loads(request.content)
        return httpx.Response(201, json={"messageId": "<abc>"})

    await BrevoMailer(httpx.MockTransport(handler)).send("user@example.com", "Hi", "Body", reply_to="r@example.com")

    assert seen["url"] == BrevoMailer.URL
    assert seen["key"] == "test-key"
    assert seen["body"] == {
        "sender": {"name": "MYST Finance", "email": "sender@example.com"},
        "to": [{"email": "user@example.com"}],
        "subject": "Hi",
        "textContent": "Body",
        "replyTo": {"email": "r@example.com"},
    }


async def test_brevo_mailer_raises_on_rejection() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(401, json={"message": "Key not found"}))
    with pytest.raises(RuntimeError, match="401"):
        await BrevoMailer(transport).send("user@example.com", "Hi", "Body")
