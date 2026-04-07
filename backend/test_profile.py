import httpx
import pytest

try:
    from tests.bootstrap import setup_test_imports
except ModuleNotFoundError:
    from backend.tests.bootstrap import setup_test_imports

setup_test_imports()

from auth_utils import create_access_token  # noqa: E402
from server import app  # noqa: E402


@pytest.mark.anyio
async def test_worker_profile_endpoint(monkeypatch):
    class MockCollection:
        async def find_one(self, _query):
            return None

        async def insert_one(self, _doc):
            return None

    class MockDB:
        worker_profiles = MockCollection()
        users = MockCollection()

    import profile_routes  # noqa: E402
    monkeypatch.setattr(profile_routes, "get_db", lambda: MockDB())

    token = create_access_token({"user_id": "69cf68fbb745ea0114848dbb"})
    # Keep endpoint-level status assertions stable by returning HTTP responses instead of bubbling app exceptions.
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get(
            "/api/worker/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert res.status_code in (200, 404)


@pytest.mark.anyio
async def test_employer_profile_autocreates_when_user_exists(monkeypatch):
    """Employer profile endpoint should auto-create a basic profile when user exists but has no profile."""

    class MockUsersCollection:
        async def find_one(self, _query):
            return {"_id": "69cf68fbb745ea0114848dbb", "full_name": "Test Employer"}

    class MockProfilesCollection:
        def __init__(self):
            self.inserted = []

        async def find_one(self, _query):
            return None

        async def insert_one(self, doc):
            self.inserted.append(doc)

    mock_profiles = MockProfilesCollection()

    class MockDB:
        employer_profiles = mock_profiles
        users = MockUsersCollection()

    import profile_routes  # noqa: E402
    monkeypatch.setattr(profile_routes, "get_db", lambda: MockDB())

    token = create_access_token({"user_id": "69cf68fbb745ea0114848dbb"})
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get(
            "/api/employer/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
    # Should auto-create and return 200, not 500
    assert res.status_code == 200
    assert mock_profiles.inserted, "A new profile document should have been created"


@pytest.mark.anyio
async def test_employer_profile_returns_404_when_no_user(monkeypatch):
    """Employer profile endpoint should return 404 when neither profile nor user exist."""

    class MockCollection:
        async def find_one(self, _query):
            return None

        async def insert_one(self, _doc):
            return None

    class MockDB:
        employer_profiles = MockCollection()
        users = MockCollection()

    import profile_routes  # noqa: E402
    monkeypatch.setattr(profile_routes, "get_db", lambda: MockDB())

    token = create_access_token({"user_id": "69cf68fbb745ea0114848dbb"})
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get(
            "/api/employer/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert res.status_code == 404


@pytest.mark.anyio
async def test_chatbot_health_endpoint():
    """Chatbot health endpoint should return a JSON status object."""
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/chatbot/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "gemini_configured" in data
    assert "client_ready" in data
    assert data["status"] in ("ok", "unconfigured", "degraded")
