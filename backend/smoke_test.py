import httpx
import asyncio


async def test_api_health():
    async with httpx.AsyncClient() as client:
        try:
            # Test Health
            res = await client.get("http://127.0.0.1:8000/api/health")
            print(f"Health: {res.status_code} - {res.json()}")

            # Test Categories (common 404)
            res = await client.get("http://127.0.0.1:8000/api/categories")
            print(f"Categories: {res.status_code}")

            # Test Public Profile (New)
            # Use a dummy ID or just check 404 vs 500
            res = await client.get("http://127.0.0.1:8000/api/worker/profile/nonexistent_id")
            print(f"Public Profile (Missing): {res.status_code}")

        except Exception as e:
            print(f"Test Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_health())
