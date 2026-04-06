import httpx
import pytest
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("JWT_SECRET", "test_secret_for_ci_only_do_not_use_in_production")

from auth_utils import create_access_token
from server import app


@pytest.mark.asyncio
async def test_worker_profile_endpoint():
    token = create_access_token({"user_id": "69cf68fbb745ea0114848dbb"})
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get(
            "/api/worker/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert res.status_code in (200, 404)
