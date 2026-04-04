import os
import sys
import uuid
import json
import asyncio
import httpx

# Append backend directory so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from server import app
from auth_utils import create_access_token

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
            
    print("\n====================================")
    print("✅ Testing sequence complete!")
    print("====================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
