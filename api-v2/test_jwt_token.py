#!/usr/bin/env python3
"""
Teste para verificar se o token JWT está sendo gerado corretamente
"""
import jwt
import requests
import json

def test_jwt_token():
    """Testa se o token JWT está sendo gerado corretamente"""
    
    print("🔐 [TEST] Testando geração de token JWT...")
    
    # URL do auth-service
    auth_url = "http://localhost:8014"
    
    # Dados de teste
    test_user = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    try:
        # Tentar fazer login
        print(f"🔐 [TEST] Tentando login em: {auth_url}/auth/login")
        response = requests.post(f"{auth_url}/auth/login", json=test_user, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            
            if token:
                print(f"✅ [TEST] Token obtido: {token[:50]}...")
                
                # Tentar decodificar o token
                try:
                    # Usar o mesmo JWT_SECRET do backend
                    JWT_SECRET = "your-secret-key-here-change-in-production"
                    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
                    
                    print(f"✅ [TEST] Token decodificado com sucesso:")
                    print(f"   - User ID: {payload.get('sub')}")
                    print(f"   - User Type: {payload.get('user_type')}")
                    print(f"   - Exp: {payload.get('exp')}")
                    
                    return token, payload
                    
                except jwt.ExpiredSignatureError:
                    print("❌ [TEST] Token expirado")
                    return None, None
                except jwt.InvalidTokenError as e:
                    print(f"❌ [TEST] Token inválido: {e}")
                    return None, None
            else:
                print("❌ [TEST] Token não encontrado na resposta")
                return None, None
        else:
            print(f"❌ [TEST] Erro no login: {response.status_code}")
            print(f"❌ [TEST] Resposta: {response.text}")
            return None, None
            
    except requests.exceptions.ConnectionError:
        print("❌ [TEST] Erro de conexão com auth-service")
        print("💡 [TEST] Verifique se o auth-service está rodando na porta 8014")
        return None, None
    except Exception as e:
        print(f"❌ [TEST] Erro inesperado: {e}")
        return None, None

def test_websocket_with_token():
    """Testa WebSocket com token válido"""
    
    print("\n🔌 [TEST] Testando WebSocket com token...")
    
    token, payload = test_jwt_token()
    
    if not token or not payload:
        print("❌ [TEST] Não foi possível obter token válido")
        return False
    
    # Testar WebSocket
    import asyncio
    import websockets
    
    async def test_ws():
        user_id = payload.get('sub')
        user_type = payload.get('user_type')
        
        ws_url = f"ws://localhost:8000/ws?token={token}&user_id={user_id}&user_type={user_type}"
        
        print(f"🔌 [TEST] Conectando WebSocket: {ws_url}")
        
        try:
            async with websockets.connect(ws_url) as websocket:
                print("✅ [TEST] WebSocket conectado com sucesso!")
                
                # Enviar ping
                ping_message = {
                    "type": "ping",
                    "timestamp": 1234567890
                }
                
                await websocket.send(json.dumps(ping_message))
                print("📤 [TEST] Ping enviado")
                
                # Aguardar resposta
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    response_data = json.loads(response)
                    print(f"📨 [TEST] Resposta: {response_data}")
                    
                    if response_data.get("type") == "pong":
                        print("✅ [TEST] Pong recebido - WebSocket funcionando!")
                        return True
                    else:
                        print(f"⚠️ [TEST] Resposta inesperada: {response_data}")
                        return False
                        
                except asyncio.TimeoutError:
                    print("⏰ [TEST] Timeout aguardando pong")
                    return False
                    
        except websockets.exceptions.ConnectionRefused:
            print("❌ [TEST] Conexão WebSocket recusada")
            return False
        except Exception as e:
            print(f"❌ [TEST] Erro no WebSocket: {e}")
            return False
    
    return asyncio.run(test_ws())

if __name__ == "__main__":
    print("🚀 [TEST] Iniciando testes de JWT e WebSocket...")
    
    # Testar JWT
    token, payload = test_jwt_token()
    
    if token and payload:
        print("\n✅ [TEST] JWT funcionando corretamente!")
        
        # Testar WebSocket
        if test_websocket_with_token():
            print("\n🎉 [TEST] Todos os testes passaram!")
        else:
            print("\n❌ [TEST] WebSocket falhou")
    else:
        print("\n❌ [TEST] JWT falhou - verifique auth-service")

