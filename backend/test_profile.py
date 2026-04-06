import httpx
import pytest

from tests.bootstrap import setup_test_imports
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
