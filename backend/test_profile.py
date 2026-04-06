import httpx
import pytest

from tests.bootstrap import setup_test_imports
setup_test_imports()

from auth_utils import create_access_token  # noqa: E402
from server import app  # noqa: E402


@pytest.mark.anyio
async def test_worker_profile_endpoint(monkeypatch):
    class _Collection:
        async def find_one(self, _query):
            return None

        async def insert_one(self, _doc):
            return None

    class _FakeDB:
        worker_profiles = _Collection()
        users = _Collection()

    import profile_routes  # noqa: E402
    monkeypatch.setattr(profile_routes, "get_db", lambda: _FakeDB())

    token = create_access_token({"user_id": "69cf68fbb745ea0114848dbb"})
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get(
            "/api/worker/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert res.status_code in (200, 404)
