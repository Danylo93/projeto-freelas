#!/usr/bin/env python3
"""
Script para testar o API Gateway
"""
import requests
import json
import sys

GATEWAY_URL = "http://localhost:8000"

def test_health():
    """Testa o health check do gateway"""
    print("🔍 Testando health check do gateway...")
    try:
        response = requests.get(f"{GATEWAY_URL}/healthz", timeout=5)
        if response.status_code == 200:
            print("✅ Gateway está funcionando")
            print(f"   Resposta: {response.json()}")
        else:
            print(f"❌ Gateway retornou status {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao conectar com o gateway: {e}")
        return False
    return True

def test_api_health():
    """Testa o health check de todos os serviços"""
    print("\n🔍 Testando health check de todos os serviços...")
    try:
        response = requests.get(f"{GATEWAY_URL}/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check dos serviços:")
            for service, status in data.get("services", {}).items():
                status_icon = "✅" if status.get("status") == "healthy" else "❌"
                print(f"   {status_icon} {service}: {status.get('status', 'unknown')}")
        else:
            print(f"❌ API health retornou status {response.status_code}")
    except Exception as e:
        print(f"❌ Erro ao testar API health: {e}")

def test_endpoints():
    """Testa alguns endpoints básicos"""
    print("\n🔍 Testando endpoints...")
    
    # Teste de providers
    try:
        response = requests.get(f"{GATEWAY_URL}/api/providers", timeout=5)
        print(f"   📋 Providers: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Providers: {e}")
    
    # Teste de requests
    try:
        response = requests.get(f"{GATEWAY_URL}/api/requests", timeout=5)
        print(f"   📋 Requests: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Requests: {e}")
    
    # Teste de auth
    try:
        response = requests.get(f"{GATEWAY_URL}/api/auth/me", timeout=5)
        print(f"   🔐 Auth: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Auth: {e}")

def main():
    print("🚀 Testando API Gateway")
    print("=" * 50)
    
    if not test_health():
        print("\n❌ Gateway não está funcionando. Verifique se está rodando na porta 8000")
        sys.exit(1)
    
    test_api_health()
    test_endpoints()
    
    print("\n" + "=" * 50)
    print("✅ Teste concluído!")
    print(f"\n📝 URLs disponíveis:")
    print(f"   Gateway: {GATEWAY_URL}")
    print(f"   Health: {GATEWAY_URL}/healthz")
    print(f"   API Health: {GATEWAY_URL}/api/health")
    print(f"   Providers: {GATEWAY_URL}/api/providers")
    print(f"   Requests: {GATEWAY_URL}/api/requests")
    print(f"   Auth: {GATEWAY_URL}/api/auth")

if __name__ == "__main__":
    main()
