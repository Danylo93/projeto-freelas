#!/usr/bin/env python3
"""
Script de teste para verificar se as notificações estão funcionando
"""
import requests
import json
import time

# Configurações
API_BASE = "http://localhost:8000"
NGROK_URL = "https://a09f89583882.ngrok-free.app"

def test_auth():
    """Testa autenticação"""
    print("🔐 Testando autenticação...")
    
    # Dados de teste
    user_data = {
        "email": "prestador@test.com",
        "password": "123456",
        "name": "Prestador Teste",
        "user_type": 1,  # Prestador
        "phone": "+5511999999999"
    }
    
    # Registrar usuário
    try:
        response = requests.post(f"{API_BASE}/auth/register", json=user_data)
        print(f"Register response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Usuário registrado com sucesso")
        else:
            print(f"⚠️ Registro: {response.text}")
    except Exception as e:
        print(f"❌ Erro no registro: {e}")
    
    # Login
    try:
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        response = requests.post(f"{API_BASE}/auth/login", json=login_data)
        print(f"Login response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login realizado com sucesso")
            return data.get("access_token"), data.get("user", {}).get("id")
        else:
            print(f"❌ Login falhou: {response.text}")
            return None, None
    except Exception as e:
        print(f"❌ Erro no login: {e}")
        return None, None

def test_provider_setup(token, user_id):
    """Configura prestador"""
    print("🔧 Configurando prestador...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Configurar serviços
    services_data = {
        "user_id": user_id,
        "services": [2],  # Eletricista
        "location": {
            "latitude": -23.5505,
            "longitude": -46.6333
        },
        "is_available": True
    }
    
    try:
        response = requests.post(f"{API_BASE}/providers/services", json=services_data, headers=headers)
        print(f"Services setup response: {response.status_code}")
        if response.status_code == 200:
            print("✅ Serviços configurados")
        else:
            print(f"⚠️ Configuração de serviços: {response.text}")
    except Exception as e:
        print(f"❌ Erro na configuração: {e}")

def test_client_request():
    """Cria solicitação de cliente"""
    print("📱 Criando solicitação de cliente...")
    
    # Registrar cliente
    client_data = {
        "email": "cliente@test.com",
        "password": "123456",
        "name": "Cliente Teste",
        "user_type": 2,  # Cliente
        "phone": "+5511888888888"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/register", json=client_data)
        print(f"Client register response: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Cliente já existe: {e}")
    
    # Login cliente
    try:
        login_data = {"email": client_data["email"], "password": client_data["password"]}
        response = requests.post(f"{API_BASE}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            client_token = data.get("access_token")
            client_id = data.get("user", {}).get("id")
            print("✅ Cliente logado")
        else:
            print(f"❌ Login cliente falhou: {response.text}")
            return
    except Exception as e:
        print(f"❌ Erro no login cliente: {e}")
        return
    
    # Criar solicitação
    request_data = {
        "client_id": client_id,
        "service_type": 2,  # Eletricista
        "description": "Preciso de um eletricista para trocar uma tomada",
        "location": {
            "latitude": -23.5505,
            "longitude": -46.6333,
            "address": "São Paulo, SP"
        },
        "urgency": "medium"
    }
    
    headers = {"Authorization": f"Bearer {client_token}"}
    
    try:
        response = requests.post(f"{API_BASE}/requests", json=request_data, headers=headers)
        print(f"Request creation response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Solicitação criada com sucesso!")
            print(f"Request ID: {data.get('id')}")
            return data.get('id')
        else:
            print(f"❌ Falha na criação: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erro na criação da solicitação: {e}")
        return None

def main():
    print("🚀 Iniciando teste de notificações...")
    print("=" * 50)
    
    # 1. Configurar prestador
    token, user_id = test_auth()
    if not token:
        print("❌ Falha na autenticação")
        return
    
    test_provider_setup(token, user_id)
    
    # 2. Aguardar um pouco
    print("⏳ Aguardando 3 segundos...")
    time.sleep(3)
    
    # 3. Criar solicitação de cliente
    request_id = test_client_request()
    
    if request_id:
        print("=" * 50)
        print("✅ TESTE CONCLUÍDO!")
        print(f"📋 Solicitação criada: {request_id}")
        print("🔔 Verifique se o prestador recebeu a notificação no app!")
        print("📱 Abra o app como prestador e veja se aparece a solicitação")
    else:
        print("❌ Teste falhou")

if __name__ == "__main__":
    main()
