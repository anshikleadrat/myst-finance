from httpx import AsyncClient

from tests.conftest import EMPLOYMENT, LOAN, PERSONAL, CapturingMailer, login, submitted_application


async def test_requires_login(client: AsyncClient) -> None:
    assert (await client.post("/api/applications")).status_code == 401


async def test_full_application_flow(user_client: AsyncClient) -> None:
    draft = (await user_client.post("/api/applications")).json()
    assert draft["status"] == "draft"
    assert draft["completed_steps"] == []
    # Starting again returns the same open draft.
    assert (await user_client.post("/api/applications")).json()["id"] == draft["id"]

    response = await user_client.put(f"/api/applications/{draft['id']}/personal", json=PERSONAL)
    body = response.json()
    assert body["pan"] == "ABCDE1234F"
    assert body["pan_masked"] == "ABXXXXX34F"
    assert body["completed_steps"] == ["personal"]

    submitted = await submitted_application(user_client)
    assert submitted["id"] == draft["id"]
    assert submitted["status"] == "submitted"
    assert submitted["pan"] is None  # never echoed back once submitted
    assert submitted["completed_steps"] == ["personal", "employment", "loan"]

    me = (await user_client.get("/api/auth/me")).json()
    assert me["full_name"] == "Rahul Sharma"


async def test_submitted_application_is_read_only(user_client: AsyncClient) -> None:
    application = await submitted_application(user_client)
    response = await user_client.put(f"/api/applications/{application['id']}/loan", json=LOAN)
    assert response.status_code == 409


async def test_new_application_is_prefilled_from_previous(user_client: AsyncClient) -> None:
    first = await submitted_application(user_client)
    second = (await user_client.post("/api/applications")).json()
    assert second["id"] != first["id"]
    assert second["completed_steps"] == ["personal", "employment"]
    assert second["pan"] == "ABCDE1234F"
    assert second["loan_amount"] is None


async def test_submit_incomplete_application(user_client: AsyncClient) -> None:
    draft = (await user_client.post("/api/applications")).json()
    await user_client.put(f"/api/applications/{draft['id']}/personal", json=PERSONAL)
    response = await user_client.post(f"/api/applications/{draft['id']}/submit")
    assert response.status_code == 422
    assert response.json()["detail"] == "incomplete_steps:employment,loan"


async def test_validation(user_client: AsyncClient) -> None:
    draft = (await user_client.post("/api/applications")).json()
    url = f"/api/applications/{draft['id']}"
    assert (await user_client.put(f"{url}/personal", json={**PERSONAL, "pan": "ABC123"})).status_code == 422
    assert (
        await user_client.put(f"{url}/personal", json={**PERSONAL, "date_of_birth": "2015-01-01"})
    ).status_code == 422
    assert (await user_client.put(f"{url}/employment", json={**EMPLOYMENT, "employment_type": "x"})).status_code == 422
    assert (await user_client.put(f"{url}/loan", json={**LOAN, "loan_amount": 5_000})).status_code == 422
    assert (await user_client.put(f"{url}/loan", json={**LOAN, "tenure_months": 7})).status_code == 422


async def test_cannot_access_other_users_application(client: AsyncClient, mailer: CapturingMailer) -> None:
    await login(client, mailer, "owner@example.com")
    draft = (await client.post("/api/applications")).json()
    await client.post("/api/auth/logout")
    client.cookies.clear()

    await login(client, mailer, "intruder@example.com")
    assert (await client.get(f"/api/applications/{draft['id']}")).status_code == 404
    assert (await client.put(f"/api/applications/{draft['id']}/loan", json=LOAN)).status_code == 404
