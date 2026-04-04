import requests
import time

def test_rate_limit(url, method="GET", payload=None, limit=5):
    print(f"Testing rate limit on {url}...")
    for i in range(limit + 2):
        if method == "POST":
            response = requests.post(url, json=payload)
        else:
            response = requests.get(url)
            
        print(f"Request {i+1}: Status {response.status_code}")
        if response.status_code == 429:
             print("SUCCESS: Rate limit triggered!")
             return True
    print("FAILURE: Rate limit NOT triggered.")
    return False

if __name__ == "__main__":
    BASE_URL = "http://localhost:8000"
    
    # Test Chatbot (Limit: 5/min)
    test_rate_limit(f"{BASE_URL}/api/chatbot", "POST", {"query": "Hello"}, limit=5)
    
    # Test OTP (Limit: 5/min)
    test_rate_limit(f"{BASE_URL}/api/auth/send-otp", "POST", {"phone": "1234567890"}, limit=5)
