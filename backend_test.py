#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Climate Intelligence Platform
Tests all endpoints including authentication, climate data, AI chat, and scenario simulation
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class ClimateAPITester:
    def __init__(self, base_url: str = "https://climateai-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, auth_required: bool = False) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            print(f"🔗 Making {method} request to: {url}")
            if data:
                print(f"📤 Request data: {json.dumps(data, indent=2)}")

            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}", {}

            print(f"📥 Response status: {response.status_code}")
            
            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
                print(f"📄 Response data: {json.dumps(response_data, indent=2)}")
            except:
                response_data = {"raw_response": response.text}
                print(f"📄 Raw response: {response.text}")

            if not success:
                print(f"❌ Expected status {expected_status}, got {response.status_code}")

            return success, f"Status: {response.status_code}", response_data

        except requests.exceptions.Timeout:
            return False, "Request timeout (30s)", {}
        except requests.exceptions.ConnectionError:
            return False, "Connection error - server may be down", {}
        except Exception as e:
            return False, f"Request error: {str(e)}", {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, details, data = self.make_request('GET', '')
        self.log_test("Root Endpoint", success, details, data)
        
        # Test health endpoint
        success, details, data = self.make_request('GET', 'health')
        self.log_test("Health Check", success, details, data)

    def test_authentication_flow(self):
        """Test complete authentication flow"""
        print("\n🔍 Testing Authentication Flow...")
        
        # Try to use existing test user first
        test_email = "test@example.com"
        test_password = "TestPass123!"
        
        # Try login first with existing user
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        success, details, data = self.make_request('POST', 'auth/login', login_data)
        
        if success and 'access_token' in data:
            self.log_test("User Login (Existing)", success, details, data)
            self.token = data['access_token']
            self.user_id = data['user']['id']
            print(f"🔑 Token obtained from existing user: {self.token[:20]}...")
            
            # Test get current user
            success, details, data = self.make_request('GET', 'auth/me', auth_required=True)
            self.log_test("Get Current User", success, details, data)
            
            return True
        else:
            # If login fails, try registration with new user
            print("🔄 Login failed, trying registration...")
            
            # Generate unique test user with random component
            import random
            timestamp = datetime.now().strftime('%H%M%S')
            random_id = random.randint(1000, 9999)
            test_email = f"climate_test_{timestamp}_{random_id}@gmail.com"
            test_password = "TestPass123!"
            test_name = f"Climate Test User {timestamp}"

            # Test registration
            register_data = {
                "email": test_email,
                "password": test_password,
                "name": test_name,
                "preferred_language": "en"
            }
            
            success, details, data = self.make_request('POST', 'auth/register', register_data)
            self.log_test("User Registration", success, details, data)
            
            if not success:
                print("❌ Registration failed, skipping auth flow tests")
                return False

            # Extract demo OTP
            demo_otp = data.get('demo_otp')
            if not demo_otp:
                self.log_test("Demo OTP Extraction", False, "No demo_otp in response")
                return False
            
            print(f"📱 Demo OTP received: {demo_otp}")

            # Test OTP verification
            otp_data = {
                "email": test_email,
                "otp": demo_otp
            }
            
            success, details, data = self.make_request('POST', 'auth/verify-otp', otp_data)
            self.log_test("OTP Verification", success, details, data)
            
            if success and 'access_token' in data:
                self.token = data['access_token']
                self.user_id = data['user']['id']
                print(f"🔑 Token obtained: {self.token[:20]}...")

            # Test login with new credentials
            login_data = {
                "email": test_email,
                "password": test_password
            }
            
            success, details, data = self.make_request('POST', 'auth/login', login_data)
            self.log_test("User Login (New)", success, details, data)
            
            # Test get current user
            success, details, data = self.make_request('GET', 'auth/me', auth_required=True)
            self.log_test("Get Current User", success, details, data)

            return self.token is not None

    def test_climate_data_endpoints(self):
        """Test climate data retrieval"""
        print("\n🔍 Testing Climate Data Endpoints...")
        
        if not self.token:
            print("❌ No auth token, skipping climate data tests")
            return

        # Test climate data for Chennai (default location)
        climate_data = {
            "lat": 13.0827,
            "lon": 80.2707
        }
        
        success, details, data = self.make_request('POST', 'climate/data', climate_data, auth_required=True)
        self.log_test("Get Climate Data", success, details, data)
        
        if success:
            # Validate response structure
            required_fields = ['location', 'current', 'historical', 'forecast', 'risk_assessment', 'sustainability_trends']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Climate Data Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Climate Data Structure", True, "All required fields present")
                
                # Test risk assessment values
                risk = data.get('risk_assessment', {})
                risk_fields = ['drought_risk', 'flood_risk', 'heat_stress', 'confidence']
                risk_valid = all(field in risk for field in risk_fields)
                self.log_test("Risk Assessment Data", risk_valid, f"Risk data: {risk}")

        # Test map layers endpoint
        success, details, data = self.make_request('GET', 'climate/layers')
        self.log_test("Get Map Layers", success, details, data)

    def test_scenario_simulation(self):
        """Test scenario simulation"""
        print("\n🔍 Testing Scenario Simulation...")
        
        if not self.token:
            print("❌ No auth token, skipping scenario tests")
            return

        scenario_data = {
            "lat": 13.0827,
            "lon": 80.2707,
            "rainfall_change": 20.0,  # +20% rainfall
            "temperature_change": 2.0  # +2°C temperature
        }
        
        success, details, data = self.make_request('POST', 'climate/scenario', scenario_data, auth_required=True)
        self.log_test("Scenario Simulation", success, details, data)
        
        if success:
            # Validate scenario response structure
            required_fields = ['original_weather', 'modified_weather', 'original_risk', 'modified_risk', 'scenario_impact']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Scenario Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Scenario Response Structure", True, "All scenario fields present")

    def test_ai_chat_integration(self):
        """Test AI chat functionality"""
        print("\n🔍 Testing AI Chat Integration...")
        
        if not self.token:
            print("❌ No auth token, skipping AI chat tests")
            return

        # Test English chat
        chat_data = {
            "message": "What is the current drought risk?",
            "language": "en"
        }
        
        success, details, data = self.make_request('POST', 'chat', chat_data, auth_required=True)
        self.log_test("AI Chat (English)", success, details, data)
        
        if success:
            # Validate chat response structure
            required_fields = ['response', 'confidence', 'assumptions', 'references']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Chat Response Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Chat Response Structure", True, "All chat fields present")

        # Test Tamil chat
        tamil_chat_data = {
            "message": "வறட்சி ஆபத்து என்ன?",
            "language": "ta"
        }
        
        success, details, data = self.make_request('POST', 'chat', tamil_chat_data, auth_required=True)
        self.log_test("AI Chat (Tamil)", success, details, data)

    def test_recommendations(self):
        """Test AI recommendations"""
        print("\n🔍 Testing AI Recommendations...")
        
        if not self.token:
            print("❌ No auth token, skipping recommendations tests")
            return

        recommendations_data = {
            "lat": 13.0827,
            "lon": 80.2707,
            "risk_data": {
                "drought_risk": 65.0,
                "flood_risk": 30.0,
                "heat_stress": 45.0
            },
            "language": "en"
        }
        
        success, details, data = self.make_request('POST', 'recommendations', recommendations_data, auth_required=True)
        self.log_test("AI Recommendations", success, details, data)

    def test_user_preferences(self):
        """Test user preference updates"""
        print("\n🔍 Testing User Preferences...")
        
        if not self.token:
            print("❌ No auth token, skipping preferences tests")
            return

        # Test language update
        success, details, data = self.make_request('PUT', 'user/language?language=ta', auth_required=True)
        self.log_test("Update Language Preference", success, details, data)

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Climate Intelligence Platform API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)

        # Run test suites in order
        self.test_health_check()
        
        auth_success = self.test_authentication_flow()
        if auth_success:
            self.test_climate_data_endpoints()
            self.test_scenario_simulation()
            self.test_ai_chat_integration()
            self.test_recommendations()
            self.test_user_preferences()
        else:
            print("❌ Authentication failed, skipping authenticated endpoint tests")

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            
            # Print failed tests
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            
            return 1

def main():
    """Main test execution"""
    tester = ClimateAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())