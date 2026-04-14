import asyncio
import os
import json
from bson import ObjectId
from backend.database import get_db
from backend.models import Job, WorkerProfile

async def test_fixes():
    db = get_db()
    if db is None:
        print("Database not connected")
        return

    # 1. Create a dummy job
    job_id = "test-job-123"
    job = Job(
        id=job_id,
        title="Electrician Expert Needed",
        category="electrician",
        salary_paise=100000,
        requirements=["wiring", "maintenance"]
    )
    await db.jobs.delete_one({"id": job_id})
    await db.jobs.insert_one(job.dict())
    print(f"Created test job: {job_id}")

    # 2. Test Fetch Detail (New Route Logic)
    fetched = await db.jobs.find_one({"id": job_id})
    if fetched:
        print(f"Successfully fetched job {job_id}")
    else:
        print(f"Failed to fetch job {job_id}")

    # 3. Test Match Score Calculation
    # Mock a worker profile
    user_id = "test-worker-456"
    worker = WorkerProfile(
        user_id=user_id,
        category="electrician",
        skills=["wiring", "solar"],
        experience_years=5
    )
    await db.worker_profiles.delete_one({"user_id": user_id})
    await db.worker_profiles.insert_one(worker.dict())
    print(f"Created test worker: {user_id}")

    # Now verify the matching logic by calling the endpoint function or simulating it
    # Since I can't easily call the API here without a server running, I'll just check the logic in job_routes.py
    # But wait, I can import it!
    from backend.job_routes import get_job_match_score
    from fastapi import Request
    
    class MockRequest:
        def __init__(self, token):
            self.headers = {"Authorization": f"Bearer {token}"}
            self.method = "GET"
            self.url = "http://test"

    # Mock get_current_user_id
    import backend.job_routes as job_routes
    original_get_user = job_routes.get_current_user_id
    job_routes.get_current_user_id = lambda req: asyncio.Future()
    job_routes.get_current_user_id.set_result(user_id) # Won't work with async
    
    async def mock_get_user(req): return user_id
    job_routes.get_current_user_id = mock_get_user

    try:
        result = await get_job_match_score(job_id, MockRequest("token"))
        print("Match Score Result:", json.dumps(result, indent=2))
        if result['score'] >= 65:
            print("SUCCESS: Electrician match is respectable (>= 65%)")
        else:
            print(f"FAILURE: Score {result['score']}% is too low for matching trade")
    except Exception as e:
        print(f"Error during match test: {e}")
    finally:
        job_routes.get_current_user_id = original_get_user

if __name__ == "__main__":
    asyncio.run(test_fixes())
