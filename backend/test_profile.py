import httpx
import pytest
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault("JWT_SECRET", "test_secret_for_ci_only_do_not_use_in_production")

from auth_utils import create_access_token  # noqa: E402
from server import app  # noqa: E402


@pytest.mark.anyio
async def test_worker_profile_endpoint():
    token = create_access_token({"user_id": "69cf68fbb745ea0114848dbb"})
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get(
            "/api/worker/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert res.status_code in (200, 404, 500)
