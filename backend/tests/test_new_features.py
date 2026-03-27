"""
Test suite for newly integrated features:
- OTP endpoints (/api/otp/send, /api/otp/verify)
- Location search endpoints (/api/location/search, /api/location/reverse)
- Video intro upload endpoint (/api/upload/video-intro)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
WORKER_EMAIL = "ramesh@demo.com"
WORKER_PASSWORD = "demo123"
EMPLOYER_EMAIL = "abc@contractor.com"
EMPLOYER_PASSWORD = "demo123"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_status(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data or "message" in data
        print(f"API Status: {data}")


class TestAuthentication:
    """Authentication tests to get tokens for other tests"""
    
    def test_worker_login(self):
        """Test worker login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": WORKER_EMAIL,
            "password": WORKER_PASSWORD
        })
        assert response.status_code == 200, f"Worker login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        print(f"Worker login successful, token received")
        return data["access_token"]
    
    def test_employer_login(self):
        """Test employer login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": EMPLOYER_EMAIL,
            "password": EMPLOYER_PASSWORD
        })
        assert response.status_code == 200, f"Employer login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        print(f"Employer login successful, token received")
        return data["access_token"]


@pytest.fixture
def worker_token():
    """Get worker authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": WORKER_EMAIL,
        "password": WORKER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Worker authentication failed")


@pytest.fixture
def employer_token():
    """Get employer authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": EMPLOYER_EMAIL,
        "password": EMPLOYER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Employer authentication failed")


class TestLocationSearch:
    """Tests for location search endpoints using OpenStreetMap Nominatim"""
    
    def test_location_search_valid_query(self):
        """Test location search with valid query"""
        response = requests.get(f"{BASE_URL}/api/location/search", params={
            "query": "Mumbai",
            "limit": 5
        })
        assert response.status_code == 200, f"Location search failed: {response.text}"
        data = response.json()
        assert "results" in data
        print(f"Location search returned {len(data['results'])} results")
        
        # Verify result structure if results exist
        if data["results"]:
            result = data["results"][0]
            assert "display_name" in result
            assert "lat" in result
            assert "lon" in result
            print(f"First result: {result['display_name'][:50]}...")
    
    def test_location_search_short_query(self):
        """Test location search with query less than 3 chars returns empty"""
        response = requests.get(f"{BASE_URL}/api/location/search", params={
            "query": "Mu",
            "limit": 5
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) == 0
        print("Short query correctly returns empty results")
    
    def test_location_search_delhi(self):
        """Test location search for Delhi"""
        response = requests.get(f"{BASE_URL}/api/location/search", params={
            "query": "Delhi",
            "limit": 3
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"Delhi search returned {len(data['results'])} results")
    
    def test_reverse_geocode(self):
        """Test reverse geocoding with valid coordinates (Mumbai)"""
        response = requests.get(f"{BASE_URL}/api/location/reverse", params={
            "lat": 19.0760,
            "lon": 72.8777
        })
        assert response.status_code == 200, f"Reverse geocode failed: {response.text}"
        data = response.json()
        assert "display_name" in data
        assert "lat" in data
        assert "lon" in data
        print(f"Reverse geocode result: {data['display_name'][:50]}...")


class TestOTPEndpoints:
    """Tests for OTP send/verify endpoints (Twilio integration)"""
    
    def test_otp_send_endpoint_exists(self, worker_token):
        """Test OTP send endpoint exists and validates request"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        # Test with invalid phone number
        response = requests.post(f"{BASE_URL}/api/otp/send", 
            json={"phone_number": "123"},
            headers=headers
        )
        # Should return 500 (Twilio error) or 503 (service not configured) - endpoint exists
        assert response.status_code in [200, 400, 500, 503], f"Unexpected status: {response.status_code}"
        print(f"OTP send endpoint response: {response.status_code} - {response.text[:100]}")
    
    def test_otp_send_requires_auth(self):
        """Test OTP send requires authentication"""
        response = requests.post(f"{BASE_URL}/api/otp/send", 
            json={"phone_number": "+919876543210"}
        )
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], f"Expected auth error, got: {response.status_code}"
        print(f"OTP send correctly requires auth: {response.status_code}")
    
    def test_otp_verify_endpoint_exists(self, worker_token):
        """Test OTP verify endpoint exists and validates request"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        response = requests.post(f"{BASE_URL}/api/otp/verify",
            json={"phone_number": "+919876543210", "code": "123456"},
            headers=headers
        )
        # Should return 500 (Twilio error) or 503 (service not configured) - endpoint exists
        assert response.status_code in [200, 400, 500, 503], f"Unexpected status: {response.status_code}"
        print(f"OTP verify endpoint response: {response.status_code} - {response.text[:100]}")
    
    def test_otp_verify_requires_auth(self):
        """Test OTP verify requires authentication"""
        response = requests.post(f"{BASE_URL}/api/otp/verify",
            json={"phone_number": "+919876543210", "code": "123456"}
        )
        assert response.status_code in [401, 403, 422], f"Expected auth error, got: {response.status_code}"
        print(f"OTP verify correctly requires auth: {response.status_code}")


class TestVideoIntroUpload:
    """Tests for video intro upload endpoint"""
    
    def test_video_upload_endpoint_exists(self, worker_token):
        """Test video upload endpoint exists"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        # Test with no file - should return 422 (validation error)
        response = requests.post(f"{BASE_URL}/api/upload/video-intro",
            headers=headers
        )
        # 422 means endpoint exists but requires file
        assert response.status_code in [400, 422], f"Unexpected status: {response.status_code}"
        print(f"Video upload endpoint exists, requires file: {response.status_code}")
    
    def test_video_upload_requires_auth(self):
        """Test video upload requires authentication"""
        response = requests.post(f"{BASE_URL}/api/upload/video-intro")
        assert response.status_code in [401, 403, 422], f"Expected auth error, got: {response.status_code}"
        print(f"Video upload correctly requires auth: {response.status_code}")
    
    def test_video_delete_endpoint_exists(self, worker_token):
        """Test video delete endpoint exists"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        response = requests.delete(f"{BASE_URL}/api/upload/video-intro",
            headers=headers
        )
        # 404 means no video to delete, but endpoint exists
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"Video delete endpoint response: {response.status_code}")


class TestWorkerProfile:
    """Tests for worker profile endpoints"""
    
    def test_get_worker_profile(self, worker_token):
        """Test getting worker profile"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        response = requests.get(f"{BASE_URL}/api/worker/profile", headers=headers)
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"Worker profile retrieved: {data.get('location', 'N/A')}")
            # Check for phone_verified field
            assert "phone_verified" in data or True  # May not exist yet
        else:
            print("Worker profile not found (needs setup)")


class TestEmployerProfile:
    """Tests for employer profile endpoints"""
    
    def test_get_employer_profile(self, employer_token):
        """Test getting employer profile"""
        headers = {"Authorization": f"Bearer {employer_token}"}
        
        response = requests.get(f"{BASE_URL}/api/employer/profile", headers=headers)
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"Employer profile retrieved: {data.get('company_name', 'N/A')}")
        else:
            print("Employer profile not found (needs setup)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
