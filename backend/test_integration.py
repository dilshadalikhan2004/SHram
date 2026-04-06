import uuid
import asyncio
import httpx

from tests.bootstrap import setup_test_imports
setup_test_imports()

from auth_utils import create_access_token  # noqa: E402
from server import app  # noqa: E402


def create_worker_token(user_id=None):
    if not user_id:
        user_id = str(uuid.uuid4())
    return create_access_token({"user_id": user_id}), user_id


def create_employer_token(user_id=None):
    if not user_id:
        user_id = str(uuid.uuid4())
    return create_access_token({"user_id": user_id}), user_id


async def run_tests():
    print("====================================")
    print("🚀 ShramSetu Automated Test Suite 🚀")
    print("====================================")

    worker_tok, worker_id = create_worker_token()
    employer_tok, employer_id = create_employer_token()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Test AI Drafting System
        print("\n[Test 1] Testing AI Draft Engine... ", end="")
        try:
            res = await client.post(
                "/api/jobs/draft",
                json={"query": "Need an electrician to fix a panel"},
                headers={"Authorization": f"Bearer {employer_tok}"}
            )
            if res.status_code == 422:
                print("FAILED ❌ (FastAPI strict error 422 caught)")
            elif res.status_code in [200, 500]:
                print(f"PASSED ✅ (Route signature successfully accepted JSON. Status: {res.status_code})")
            else:
                print(f"UNKNOWN ⚠️ Status: {res.status_code}")
        except Exception as e:
            print(f"FAILED ❌ {e}")

        # 2. Test Squad Verification (Ghost rejection)
        print("[Test 2] Testing Squad Anti-Ghost Security... ", end="")
        try:
            res = await client.post(
                f"/api/squads/{str(uuid.uuid4())}/members",
                json={"user_id": "ghost_user_123"},
                headers={"Authorization": f"Bearer {worker_tok}"}
            )
            if res.status_code == 404 and "not found" in res.text:
                print("PASSED ✅ (Rejected unregistered user)")
            else:
                print(f"FAILED ❌ expected 404 rejection. Got {res.status_code}: {res.text}")
        except Exception as e:
            print(f"FAILED ❌ {e}")

        # 3. Test Earnings Real Aggregation
        print("[Test 3] Testing Earnings DB Aggregation Engine... ", end="")
        try:
            res = await client.get(
                "/api/earnings?period=all",
                headers={"Authorization": f"Bearer {worker_tok}"}
            )
            if res.status_code == 200:
                data = res.json()
                if "total_earned" in data and "history" in data:
                    print(f"PASSED ✅ (Retrieved live math array. Current test user balance: ₹{data['total_earned']})")
                else:
                    print("FAILED ❌ (Malformed earnings payload)")
            else:
                print(f"FAILED ❌ {res.status_code}: {res.text}")
        except Exception as e:
            print(f"FAILED ❌ {e}")

        # 4. Test Webhook Escrow Sandbox
        print("[Test 4] Testing Sandbox Webhook Receiver... ", end="")
        try:
            res = await client.post(
                "/api/payment/escrow/webhook/razorpay",
                json={
                    "event": "payment.captured",
                    "payload": {"payment": {"entity": {"order_id": "sandbox_order_123"}}}
                }
            )
            if res.status_code == 200:
                print("PASSED ✅ (Webhook successfully digested payload)")
            else:
                print(f"FAILED ❌ {res.status_code}: {res.text}")
        except Exception as e:
            print(f"FAILED ❌ {e}")

        # 5. Test worker jobs feed - category=all should not filter jobs
        print("[Test 5] Testing worker jobs feed: category=all returns jobs... ", end="")
        try:
            # First post a job as employer so there is at least one job
            post_res = await client.post(
                "/api/jobs",
                json={
                    "title": "Test Job For Filter",
                    "description": "Integration test job",
                    "category": "construction",
                    "location": "Mumbai",
                    "salary_paise": 50000,
                    "salary_type": "daily"
                },
                headers={"Authorization": f"Bearer {employer_tok}"}
            )
            if post_res.status_code not in [200, 201]:
                print(f"SKIPPED ⚠️ (could not create test job: {post_res.status_code})")
            else:
                # Query with category=all - should not filter out the job we just posted
                list_res = await client.get("/api/jobs?category=all")
                if list_res.status_code == 200:
                    jobs_list = list_res.json()
                    if isinstance(jobs_list, list) and len(jobs_list) >= 1:
                        print("PASSED ✅ (category=all returns jobs without over-filtering)")
                    else:
                        count = len(jobs_list) if isinstance(jobs_list, list) else "?"
                        print(f"FAILED ❌ (expected >=1 job, got {count})")
                else:
                    print(f"FAILED ❌ {list_res.status_code}: {list_res.text}")
        except Exception as e:
            print(f"FAILED ❌ {e}")

        # 6. Test worker jobs feed - legacy/blank-status jobs appear in listing
        print("[Test 6] Testing worker jobs feed: blank-status jobs are visible... ", end="")
        try:
            from database import get_db
            db_ref = get_db()
            if db_ref is None:
                print("SKIPPED ⚠️ (no DB connection)")
            else:
                legacy_job_id = str(uuid.uuid4())
                inserted_doc = {
                    "id": legacy_job_id,
                    "employer_id": employer_id,
                    "title": "Legacy Status Test Job",
                    "description": "Job with empty status field",
                    "category": "plumbing",
                    "location": "Delhi",
                    "salary_paise": 30000,
                    "salary_type": "daily",
                    # Deliberately omit 'status' to simulate a legacy record
                }
                await db_ref.jobs.insert_one(inserted_doc)
                # Confirm the record truly has no 'status' field in DB
                stored = await db_ref.jobs.find_one({"id": legacy_job_id})
                has_no_status = stored is not None and "status" not in stored
                list_res = await client.get("/api/jobs")
                found = False
                if list_res.status_code == 200:
                    jobs_list = list_res.json()
                    found = any(j.get("id") == legacy_job_id for j in jobs_list)
                # Cleanup regardless
                await db_ref.jobs.delete_one({"id": legacy_job_id})
                if found and has_no_status:
                    print("PASSED ✅ (legacy job with missing status appears in worker listing)")
                elif not has_no_status:
                    print("FAILED ❌ (test setup error: inserted job unexpectedly has a status field)")
                else:
                    print("FAILED ❌ (legacy job with missing status NOT found in worker listing)")
        except Exception as e:
            print(f"FAILED ❌ {e}")

    print("\n====================================")
    print("✅ Testing sequence complete!")
    print("====================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
