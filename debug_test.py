#!/usr/bin/env python3
"""
Debug test to identify specific backend issues
"""

import requests
import json
import time

BACKEND_URL = "https://jobber.preview.emergentagent.com/api"

def test_auth_and_providers():
    """Test authentication and provider listing"""
    
    timestamp = int(time.time())
    
    # Register a client
    client_data = {
        "name": "Test Client",
        "email": f"testclient{timestamp}@example.com",
        "phone": "+5511999999999",
        "user_type": 2,
        "password": "password123"
    }
    
    print("1. Registering client...")
    response = requests.post(f"{BACKEND_URL}/auth/register", json=client_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        client_token = response.json()["access_token"]
        print("✅ Client registered successfully")
    else:
        print(f"❌ Client registration failed: {response.text}")
        return
    
    # Register a provider
    provider_data = {
        "name": "Test Provider",
        "email": f"testprovider{timestamp}@example.com",
        "phone": "+5511888888888",
        "user_type": 1,
        "password": "password123"
    }
    
    print("\n2. Registering provider...")
    response = requests.post(f"{BACKEND_URL}/auth/register", json=provider_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        provider_token = response.json()["access_token"]
        provider_id = response.json()["user_data"]["id"]
        print("✅ Provider registered successfully")
    else:
        print(f"❌ Provider registration failed: {response.text}")
        return
    
    # Create provider profile
    profile_data = {
        "category": "Test Service",
        "price": 100.0,
        "description": "Test description",
        "latitude": -23.5505,
        "longitude": -46.6333
    }
    
    print("\n3. Creating provider profile...")
    response = requests.post(f"{BACKEND_URL}/provider/profile", 
                           json=profile_data,
                           headers={"Authorization": f"Bearer {provider_token}"})
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Provider profile created successfully")
    else:
        print(f"❌ Provider profile creation failed: {response.text}")
        return
    
    # Test listing providers (as client)
    print("\n4. Listing providers as client...")
    response = requests.get(f"{BACKEND_URL}/providers",
                          headers={"Authorization": f"Bearer {client_token}"})
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        providers = response.json()
        print(f"✅ Found {len(providers)} providers")
        for provider in providers:
            print(f"   - {provider.get('name', 'Unknown')} ({provider.get('category', 'Unknown')})")
    else:
        print(f"❌ Provider listing failed: {response.text}")
    
    # Test creating service request
    request_data = {
        "provider_id": provider_id,
        "category": "Test Service",
        "description": "Test request",
        "price": 100.0,
        "client_latitude": -23.5505,
        "client_longitude": -46.6333
    }
    
    print("\n5. Creating service request...")
    response = requests.post(f"{BACKEND_URL}/requests",
                           json=request_data,
                           headers={"Authorization": f"Bearer {client_token}"})
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        request_id = response.json()["id"]
        print("✅ Service request created successfully")
    else:
        print(f"❌ Service request creation failed: {response.text}")
        return
    
    # Test listing requests (as provider)
    print("\n6. Listing requests as provider...")
    response = requests.get(f"{BACKEND_URL}/requests",
                          headers={"Authorization": f"Bearer {provider_token}"})
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        requests_list = response.json()
        print(f"✅ Found {len(requests_list)} requests")
    else:
        print(f"❌ Request listing failed: {response.text}")

if __name__ == "__main__":
    test_auth_and_providers()