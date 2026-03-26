import requests
import sys
import json
from datetime import datetime

class ShramSetuAPITester:
    def __init__(self, base_url="https://worker-connect-60.preview.emergentagent.com"):
        self.base_url = base_url
        self.worker_token = None
        self.employer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'endpoint': endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'error': str(e),
                'endpoint': endpoint
            })
            return False, {}

    def test_api_status(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Status",
            "GET",
            "api/",
            200
        )
        # Check for v2.0 and enhanced features
        if success:
            message = response.get('message', '')
            features = response.get('features', [])
            print(f"   API Message: {message}")
            print(f"   Features: {features}")
            return 'v2.0' in message and 'Multi-language' in features
        return False

    def test_worker_login(self):
        """Test worker login with demo credentials"""
        success, response = self.run_test(
            "Worker Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "ramesh@demo.com", "password": "demo123"}
        )
        if success and 'access_token' in response:
            self.worker_token = response['access_token']
            print(f"   Worker token obtained: {self.worker_token[:20]}...")
            return True
        return False

    def test_employer_login(self):
        """Test employer login with demo credentials"""
        success, response = self.run_test(
            "Employer Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "abc@contractor.com", "password": "demo123"}
        )
        if success and 'access_token' in response:
            self.employer_token = response['access_token']
            print(f"   Employer token obtained: {self.employer_token[:20]}...")
            return True
        return False

    def test_worker_registration(self):
        """Test worker registration"""
        test_email = f"test_worker_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Worker Registration",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": "Test Worker",
                "phone": "9876543210",
                "role": "worker"
            }
        )
        return success and 'access_token' in response

    def test_employer_registration(self):
        """Test employer registration"""
        test_email = f"test_employer_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Employer Registration",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": "Test Employer",
                "phone": "9876543211",
                "role": "employer"
            }
        )
        return success and 'access_token' in response

    def test_worker_profile(self):
        """Test worker profile endpoints"""
        if not self.worker_token:
            print("❌ Worker token not available")
            return False

        # Get worker profile
        success, response = self.run_test(
            "Get Worker Profile",
            "GET",
            "api/worker/profile",
            200,
            token=self.worker_token
        )
        return success

    def test_employer_profile(self):
        """Test employer profile endpoints"""
        if not self.employer_token:
            print("❌ Employer token not available")
            return False

        # Get employer profile
        success, response = self.run_test(
            "Get Employer Profile",
            "GET",
            "api/employer/profile",
            200,
            token=self.employer_token
        )
        return success

    def test_jobs_listing(self):
        """Test jobs listing"""
        if not self.worker_token:
            print("❌ Worker token not available")
            return False

        success, response = self.run_test(
            "Get Jobs Listing",
            "GET",
            "api/jobs",
            200,
            token=self.worker_token
        )
        return success and isinstance(response, list)

    def test_employer_jobs(self):
        """Test employer jobs"""
        if not self.employer_token:
            print("❌ Employer token not available")
            return False

        success, response = self.run_test(
            "Get Employer Jobs",
            "GET",
            "api/jobs/employer",
            200,
            token=self.employer_token
        )
        return success and isinstance(response, list)

    def test_job_creation(self):
        """Test job creation by employer"""
        if not self.employer_token:
            print("❌ Employer token not available")
            return False

        job_data = {
            "title": "Test Construction Job",
            "description": "Test job for construction work",
            "category": "construction",
            "skills_required": ["Construction", "Mason"],
            "experience_required": 2,
            "pay_type": "daily",
            "pay_amount": 800,
            "location": "Test Location, Mumbai",
            "duration": "1 month",
            "vacancies": 2
        }

        success, response = self.run_test(
            "Create Job",
            "POST",
            "api/jobs",
            200,
            data=job_data,
            token=self.employer_token
        )
        
        if success and 'id' in response:
            self.test_job_id = response['id']
            print(f"   Created job ID: {self.test_job_id}")
            return True
        return False

    def test_job_application(self):
        """Test job application by worker"""
        if not self.worker_token or not hasattr(self, 'test_job_id'):
            print("❌ Worker token or test job not available")
            return False

        success, response = self.run_test(
            "Apply to Job",
            "POST",
            "api/applications",
            200,
            data={
                "job_id": self.test_job_id,
                "cover_message": "I am interested in this job",
                "expected_pay": 850
            },
            token=self.worker_token
        )
        
        if success and 'match_score' in response:
            print(f"   Match score: {response['match_score']}%")
            return True
        return success

    def test_worker_applications(self):
        """Test worker applications listing"""
        if not self.worker_token:
            print("❌ Worker token not available")
            return False

        success, response = self.run_test(
            "Get Worker Applications",
            "GET",
            "api/applications/worker",
            200,
            token=self.worker_token
        )
        return success and isinstance(response, list)

    def test_categories(self):
        """Test categories endpoint"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "api/categories",
            200
        )
        return success and 'categories' in response

    def test_worker_stats(self):
        """Test worker stats"""
        if not self.worker_token:
            print("❌ Worker token not available")
            return False

        success, response = self.run_test(
            "Get Worker Stats",
            "GET",
            "api/stats/worker",
            200,
            token=self.worker_token
        )
        return success and 'total_applications' in response

    def test_employer_stats(self):
        """Test employer stats"""
        if not self.employer_token:
            print("❌ Employer token not available")
            return False

        success, response = self.run_test(
            "Get Employer Stats",
            "GET",
            "api/stats/employer",
            200,
            token=self.employer_token
        )
        return success and 'total_jobs_posted' in response

    def test_notifications(self):
        """Test notifications"""
        if not self.worker_token:
            print("❌ Worker token not available")
            return False

        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "api/notifications",
            200,
            token=self.worker_token
        )
        return success and isinstance(response, list)

    def test_translations(self):
        """Test translation endpoints"""
        # Test Hindi translations
        success, response = self.run_test(
            "Get Hindi Translations",
            "GET",
            "api/translations/hi",
            200
        )
        if success and 'welcome' in response:
            print(f"   Hindi welcome: {response['welcome']}")
            return True
        return False

    def test_boost_packages(self):
        """Test boost packages endpoint"""
        success, response = self.run_test(
            "Get Boost Packages",
            "GET",
            "api/boost/packages",
            200
        )
        if success and 'packages' in response:
            packages = response['packages']
            print(f"   Available packages: {list(packages.keys())}")
            return 'basic' in packages and 'premium' in packages
        return False

    def test_recommended_jobs(self):
        """Test AI recommended jobs"""
        if not self.worker_token:
            print("❌ Worker token not available")
            return False

        success, response = self.run_test(
            "Get Recommended Jobs",
            "GET",
            "api/jobs/recommended",
            200,
            token=self.worker_token
        )
        return success and isinstance(response, list)

    def test_saved_jobs(self):
        """Test job saving functionality"""
        if not self.worker_token or not hasattr(self, 'test_job_id'):
            print("❌ Worker token or test job not available")
            return False

        # Save a job
        success, response = self.run_test(
            "Save Job",
            "POST",
            "api/jobs/save",
            200,
            data={"job_id": self.test_job_id},
            token=self.worker_token
        )
        
        if success:
            # Get saved jobs
            success2, response2 = self.run_test(
                "Get Saved Jobs",
                "GET",
                "api/jobs/saved",
                200,
                token=self.worker_token
            )
            return success2 and isinstance(response2, list)
        return False

    def test_top_candidates(self):
        """Test AI top candidates ranking"""
        if not self.employer_token or not hasattr(self, 'test_job_id'):
            print("❌ Employer token or test job not available")
            return False

        success, response = self.run_test(
            "Get Top Candidates",
            "GET",
            f"api/applications/top-candidates/{self.test_job_id}",
            200,
            token=self.employer_token
        )
        return success and 'top_candidates' in response

def main():
    print("🚀 Starting ShramSetu API Testing...")
    print("=" * 50)
    
    tester = ShramSetuAPITester()
    
    # Test sequence
    tests = [
        ("API Status", tester.test_api_status),
        ("Worker Login", tester.test_worker_login),
        ("Employer Login", tester.test_employer_login),
        ("Worker Registration", tester.test_worker_registration),
        ("Employer Registration", tester.test_employer_registration),
        ("Worker Profile", tester.test_worker_profile),
        ("Employer Profile", tester.test_employer_profile),
        ("Jobs Listing", tester.test_jobs_listing),
        ("Employer Jobs", tester.test_employer_jobs),
        ("Categories", tester.test_categories),
        ("Translations", tester.test_translations),
        ("Boost Packages", tester.test_boost_packages),
        ("Worker Stats", tester.test_worker_stats),
        ("Employer Stats", tester.test_employer_stats),
        ("Notifications", tester.test_notifications),
        ("Recommended Jobs", tester.test_recommended_jobs),
        ("Job Creation", tester.test_job_creation),
        ("Job Application", tester.test_job_application),
        ("Worker Applications", tester.test_worker_applications),
        ("Saved Jobs", tester.test_saved_jobs),
        ("Top Candidates", tester.test_top_candidates),
    ]
    
    print(f"\n📋 Running {len(tests)} test suites...")
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                print(f"⚠️  {test_name} had issues")
        except Exception as e:
            print(f"💥 {test_name} crashed: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
            print(f"   - {failure['test']}: {error_msg}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())