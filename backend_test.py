#!/usr/bin/env python3
"""
Backend Test Suite for FreelancerApp API
Tests all critical backend functionality including authentication, CRUD operations, and Socket.io
"""

import requests
import json
import time
import asyncio
import socketio
from typing import Dict, Any, Optional
import sys
import os

# Get backend URL from environment
BACKEND_URL = "https://fixerapp.preview.emergentagent.com/api"

class FreelancerAppTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
        self.provider_profiles = {}
        self.service_requests = {}
        self.test_results = {
            "authentication": {"passed": 0, "failed": 0, "errors": []},
            "data_models": {"passed": 0, "failed": 0, "errors": []},
            "crud_operations": {"passed": 0, "failed": 0, "errors": []},
            "socket_io": {"passed": 0, "failed": 0, "errors": []},
            "authorization": {"passed": 0, "failed": 0, "errors": []}
        }
        
    def log_result(self, category: str, test_name: str, success: bool, error: str = None):
        """Log test results"""
        if success:
            self.test_results[category]["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.test_results[category]["failed"] += 1
            self.test_results[category]["errors"].append(f"{test_name}: {error}")
            print(f"❌ {test_name}: {error}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> Dict[str, Any]:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": response.status_code < 400
            }
        except requests.exceptions.RequestException as e:
            return {
                "status_code": 0,
                "data": {},
                "success": False,
                "error": str(e)
            }
        except json.JSONDecodeError as e:
            return {
                "status_code": response.status_code,
                "data": {},
                "success": False,
                "error": f"JSON decode error: {str(e)}"
            }

    def test_authentication_system(self):
        """Test JWT authentication with user types"""
        print("\n🔐 Testing Authentication System...")
        
        # Test 1: Register Provider (user_type = 1)
        provider_data = {
            "name": "João Silva",
            "email": "joao.encanador@email.com",
            "phone": "+5511999887766",
            "user_type": 1,
            "password": "senha123"
        }
        
        response = self.make_request("POST", "/auth/register", provider_data)
        if response["success"] and response["data"].get("access_token"):
            self.tokens["provider"] = response["data"]["access_token"]
            self.users["provider"] = response["data"]["user_data"]
            self.log_result("authentication", "Provider Registration", True)
        else:
            self.log_result("authentication", "Provider Registration", False, 
                          f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 2: Register Client (user_type = 2)
        client_data = {
            "name": "Maria Santos",
            "email": "maria.cliente@email.com", 
            "phone": "+5511888776655",
            "user_type": 2,
            "password": "senha456"
        }
        
        response = self.make_request("POST", "/auth/register", client_data)
        if response["success"] and response["data"].get("access_token"):
            self.tokens["client"] = response["data"]["access_token"]
            self.users["client"] = response["data"]["user_data"]
            self.log_result("authentication", "Client Registration", True)
        else:
            self.log_result("authentication", "Client Registration", False,
                          f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 3: Login Provider
        login_data = {
            "email": "joao.encanador@email.com",
            "password": "senha123"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response["success"] and response["data"].get("access_token"):
            self.log_result("authentication", "Provider Login", True)
        else:
            self.log_result("authentication", "Provider Login", False,
                          f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 4: Login Client
        login_data = {
            "email": "maria.cliente@email.com",
            "password": "senha456"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response["success"] and response["data"].get("access_token"):
            self.log_result("authentication", "Client Login", True)
        else:
            self.log_result("authentication", "Client Login", False,
                          f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 5: Get current user info (Provider)
        if "provider" in self.tokens:
            response = self.make_request("GET", "/auth/me", token=self.tokens["provider"])
            if response["success"] and response["data"].get("user_type") == 1:
                self.log_result("authentication", "Get Provider Profile", True)
            else:
                self.log_result("authentication", "Get Provider Profile", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 6: Get current user info (Client)
        if "client" in self.tokens:
            response = self.make_request("GET", "/auth/me", token=self.tokens["client"])
            if response["success"] and response["data"].get("user_type") == 2:
                self.log_result("authentication", "Get Client Profile", True)
            else:
                self.log_result("authentication", "Get Client Profile", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 7: Invalid credentials
        invalid_login = {
            "email": "invalid@email.com",
            "password": "wrongpassword"
        }
        
        response = self.make_request("POST", "/auth/login", invalid_login)
        if not response["success"] and response["status_code"] == 401:
            self.log_result("authentication", "Invalid Login Rejection", True)
        else:
            self.log_result("authentication", "Invalid Login Rejection", False,
                          f"Should reject invalid credentials, got status: {response['status_code']}")

    def test_data_models(self):
        """Test data models and validation"""
        print("\n📊 Testing Data Models...")
        
        # Test 1: Create Provider Profile
        if "provider" in self.tokens:
            profile_data = {
                "category": "Encanador",
                "price": 120.00,
                "description": "Serviços de encanamento residencial e comercial. Experiência de 10 anos.",
                "latitude": -23.5505,
                "longitude": -46.6333
            }
            
            response = self.make_request("POST", "/provider/profile", profile_data, self.tokens["provider"])
            if response["success"]:
                self.provider_profiles["provider"] = response["data"]
                self.log_result("data_models", "Provider Profile Creation", True)
            else:
                self.log_result("data_models", "Provider Profile Creation", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 2: Create another provider for testing
        provider2_data = {
            "name": "Carlos Eletricista",
            "email": "carlos.eletricista@email.com",
            "phone": "+5511777665544",
            "user_type": 1,
            "password": "senha789"
        }
        
        response = self.make_request("POST", "/auth/register", provider2_data)
        if response["success"]:
            self.tokens["provider2"] = response["data"]["access_token"]
            self.users["provider2"] = response["data"]["user_data"]
            
            # Create profile for provider2
            profile2_data = {
                "category": "Eletricista",
                "price": 300.00,
                "description": "Instalações elétricas e manutenção. Certificado pelo CREA.",
                "latitude": -23.5489,
                "longitude": -46.6388
            }
            
            response = self.make_request("POST", "/provider/profile", profile2_data, self.tokens["provider2"])
            if response["success"]:
                self.provider_profiles["provider2"] = response["data"]
                self.log_result("data_models", "Second Provider Profile Creation", True)
            else:
                self.log_result("data_models", "Second Provider Profile Creation", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 3: Client trying to create provider profile (should fail)
        if "client" in self.tokens:
            invalid_profile = {
                "category": "Borracheiro",
                "price": 80.00,
                "description": "Serviços de borracharia"
            }
            
            response = self.make_request("POST", "/provider/profile", invalid_profile, self.tokens["client"])
            if not response["success"] and response["status_code"] == 403:
                self.log_result("data_models", "Client Profile Creation Rejection", True)
            else:
                self.log_result("data_models", "Client Profile Creation Rejection", False,
                              f"Should reject client creating provider profile, got status: {response['status_code']}")

    def test_crud_operations(self):
        """Test CRUD operations for providers and service requests"""
        print("\n🔧 Testing CRUD Operations...")
        
        # Test 1: List providers (as client)
        if "client" in self.tokens:
            response = self.make_request("GET", "/providers", token=self.tokens["client"])
            if response["success"] and isinstance(response["data"], list):
                providers_count = len(response["data"])
                self.log_result("crud_operations", f"List Providers ({providers_count} found)", True)
            else:
                self.log_result("crud_operations", "List Providers", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 2: List providers with category filter
        if "client" in self.tokens:
            response = self.make_request("GET", "/providers?category=Encanador", token=self.tokens["client"])
            if response["success"]:
                filtered_providers = [p for p in response["data"] if p.get("category") == "Encanador"]
                self.log_result("crud_operations", f"Filter Providers by Category ({len(filtered_providers)} found)", True)
            else:
                self.log_result("crud_operations", "Filter Providers by Category", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 3: Provider trying to list providers (should fail)
        if "provider" in self.tokens:
            response = self.make_request("GET", "/providers", token=self.tokens["provider"])
            if not response["success"] and response["status_code"] == 403:
                self.log_result("crud_operations", "Provider List Providers Rejection", True)
            else:
                self.log_result("crud_operations", "Provider List Providers Rejection", False,
                              f"Should reject provider listing providers, got status: {response['status_code']}")
        
        # Test 4: Create service request (as client)
        if "client" in self.tokens and "provider" in self.users:
            request_data = {
                "provider_id": self.users["provider"]["id"],
                "category": "Encanador",
                "description": "Vazamento na cozinha, preciso de reparo urgente",
                "price": 120.00,
                "client_latitude": -23.5505,
                "client_longitude": -46.6333
            }
            
            response = self.make_request("POST", "/requests", request_data, self.tokens["client"])
            if response["success"]:
                self.service_requests["request1"] = response["data"]
                self.log_result("crud_operations", "Create Service Request", True)
            else:
                self.log_result("crud_operations", "Create Service Request", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 5: Provider trying to create service request (should fail)
        if "provider" in self.tokens and "provider2" in self.users:
            invalid_request = {
                "provider_id": self.users["provider2"]["id"],
                "category": "Eletricista",
                "description": "Test request",
                "price": 200.00,
                "client_latitude": -23.5505,
                "client_longitude": -46.6333
            }
            
            response = self.make_request("POST", "/requests", invalid_request, self.tokens["provider"])
            if not response["success"] and response["status_code"] == 403:
                self.log_result("crud_operations", "Provider Create Request Rejection", True)
            else:
                self.log_result("crud_operations", "Provider Create Request Rejection", False,
                              f"Should reject provider creating request, got status: {response['status_code']}")
        
        # Test 6: List requests (as provider)
        if "provider" in self.tokens:
            response = self.make_request("GET", "/requests", token=self.tokens["provider"])
            if response["success"] and isinstance(response["data"], list):
                provider_requests = len(response["data"])
                self.log_result("crud_operations", f"Provider List Requests ({provider_requests} found)", True)
            else:
                self.log_result("crud_operations", "Provider List Requests", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 7: List requests (as client)
        if "client" in self.tokens:
            response = self.make_request("GET", "/requests", token=self.tokens["client"])
            if response["success"] and isinstance(response["data"], list):
                client_requests = len(response["data"])
                self.log_result("crud_operations", f"Client List Requests ({client_requests} found)", True)
            else:
                self.log_result("crud_operations", "Client List Requests", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 8: Accept service request (as provider)
        if "provider" in self.tokens and "request1" in self.service_requests:
            request_id = self.service_requests["request1"]["id"]
            response = self.make_request("PUT", f"/requests/{request_id}/accept", token=self.tokens["provider"])
            if response["success"] and response["data"].get("status") == "accepted":
                self.log_result("crud_operations", "Accept Service Request", True)
            else:
                self.log_result("crud_operations", "Accept Service Request", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 9: Complete service request (as provider)
        if "provider" in self.tokens and "request1" in self.service_requests:
            request_id = self.service_requests["request1"]["id"]
            response = self.make_request("PUT", f"/requests/{request_id}/complete", token=self.tokens["provider"])
            if response["success"] and response["data"].get("status") == "completed":
                self.log_result("crud_operations", "Complete Service Request", True)
            else:
                self.log_result("crud_operations", "Complete Service Request", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 10: Client trying to accept request (should fail)
        if "client" in self.tokens and "request1" in self.service_requests:
            request_id = self.service_requests["request1"]["id"]
            response = self.make_request("PUT", f"/requests/{request_id}/accept", token=self.tokens["client"])
            if not response["success"] and response["status_code"] == 403:
                self.log_result("crud_operations", "Client Accept Request Rejection", True)
            else:
                self.log_result("crud_operations", "Client Accept Request Rejection", False,
                              f"Should reject client accepting request, got status: {response['status_code']}")

    def test_rating_system(self):
        """Test rating system"""
        print("\n⭐ Testing Rating System...")
        
        # Test 1: Create rating (as client)
        if "client" in self.tokens and "request1" in self.service_requests and "provider" in self.users:
            rating_data = {
                "request_id": self.service_requests["request1"]["id"],
                "provider_id": self.users["provider"]["id"],
                "rating": 5,
                "comment": "Excelente serviço! Muito profissional e pontual."
            }
            
            response = self.make_request("POST", "/ratings", rating_data, self.tokens["client"])
            if response["success"]:
                self.log_result("crud_operations", "Create Rating", True)
            else:
                self.log_result("crud_operations", "Create Rating", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 2: Provider trying to create rating (should fail)
        if "provider" in self.tokens and "request1" in self.service_requests and "client" in self.users:
            invalid_rating = {
                "request_id": self.service_requests["request1"]["id"],
                "provider_id": self.users["client"]["id"],
                "rating": 4,
                "comment": "Good client"
            }
            
            response = self.make_request("POST", "/ratings", invalid_rating, self.tokens["provider"])
            if not response["success"] and response["status_code"] == 403:
                self.log_result("crud_operations", "Provider Create Rating Rejection", True)
            else:
                self.log_result("crud_operations", "Provider Create Rating Rejection", False,
                              f"Should reject provider creating rating, got status: {response['status_code']}")

    def test_location_updates(self):
        """Test location update functionality"""
        print("\n📍 Testing Location Updates...")
        
        # Test 1: Update provider location
        if "provider" in self.tokens:
            location_data = {
                "latitude": -23.5489,
                "longitude": -46.6388
            }
            
            response = self.make_request("PUT", "/provider/location", location_data, self.tokens["provider"])
            if response["success"]:
                self.log_result("crud_operations", "Update Provider Location", True)
            else:
                self.log_result("crud_operations", "Update Provider Location", False,
                              f"Status: {response['status_code']}, Error: {response.get('error', response['data'])}")
        
        # Test 2: Client trying to update location (should fail)
        if "client" in self.tokens:
            location_data = {
                "latitude": -23.5505,
                "longitude": -46.6333
            }
            
            response = self.make_request("PUT", "/provider/location", location_data, self.tokens["client"])
            if not response["success"] and response["status_code"] == 403:
                self.log_result("crud_operations", "Client Update Location Rejection", True)
            else:
                self.log_result("crud_operations", "Client Update Location Rejection", False,
                              f"Should reject client updating location, got status: {response['status_code']}")

    def test_socket_io_connection(self):
        """Test Socket.io connectivity (basic connection test)"""
        print("\n🔌 Testing Socket.io Connection...")
        
        try:
            # Create socket client
            sio_client = socketio.SimpleClient()
            
            # Try to connect
            socket_url = BACKEND_URL.replace('/api', '')
            sio_client.connect(socket_url, wait_timeout=10)
            
            if sio_client.connected:
                self.log_result("socket_io", "Socket.io Connection", True)
                sio_client.disconnect()
            else:
                self.log_result("socket_io", "Socket.io Connection", False, "Failed to establish connection")
                
        except Exception as e:
            self.log_result("socket_io", "Socket.io Connection", False, str(e))

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting FreelancerApp Backend Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run test suites
        self.test_authentication_system()
        self.test_data_models()
        self.test_crud_operations()
        self.test_rating_system()
        self.test_location_updates()
        self.test_socket_io_connection()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("📊 TEST RESULTS SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅" if failed == 0 else "❌"
            print(f"{status} {category.upper()}: {passed} passed, {failed} failed")
            
            if results["errors"]:
                for error in results["errors"]:
                    print(f"   • {error}")
        
        print("-" * 60)
        print(f"TOTAL: {total_passed} passed, {total_failed} failed")
        
        if total_failed == 0:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {total_failed} TESTS FAILED - See details above")
        
        print("="*60)

if __name__ == "__main__":
    tester = FreelancerAppTester()
    tester.run_all_tests()