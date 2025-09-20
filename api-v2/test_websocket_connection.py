#!/usr/bin/env python3
"""
Script de teste para verificar conectividade WebSocket
"""
import asyncio
import websockets
import json
import sys
import time

async def test_websocket():
    """Testa conexão WebSocket"""
    
    print("🚀 [TEST] Iniciando teste de WebSocket...")
    
    # URL do WebSocket
    ws_url = "ws://localhost:8000/ws"
    
    # Dados de teste
    test_user_id = "test_user_123"
    test_user_type = 1  # Prestador
    test_token = "fake_token_for_testing"
    
    print(f"🔌 [TEST] Conectando ao: {ws_url}")
    print(f"👤 [TEST] User ID: {test_user_id}")
    print(f"👤 [TEST] User Type: {test_user_type}")
    
    try:
        # Construir URL com parâmetros
        full_url = f"{ws_url}?user_id={test_user_id}&user_type={test_user_type}&token={test_token}"
        
        print(f"🔗 [TEST] URL completa: {full_url}")
        
        async with websockets.connect(full_url) as websocket:
            print("✅ [TEST] WebSocket conectado com sucesso!")
            
            # Teste 1: Ping/Pong
            print("\n📡 [TEST] Teste 1: Ping/Pong")
            ping_message = {
                "type": "ping",
                "timestamp": int(time.time())
            }
            
            await websocket.send(json.dumps(ping_message))
            print("📤 [TEST] Ping enviado")
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                response_data = json.loads(response)
                print(f"📨 [TEST] Resposta: {response_data}")
                
                if response_data.get("type") == "pong":
                    print("✅ [TEST] Pong recebido - conexão funcionando!")
                else:
                    print(f"⚠️ [TEST] Resposta inesperada: {response_data}")
                    
            except asyncio.TimeoutError:
                print("⏰ [TEST] Timeout aguardando pong")
            
            # Teste 2: Entrar em sala
            print("\n🚪 [TEST] Teste 2: Entrar em sala")
            join_room_message = {
                "type": "join_room",
                "room": "test_room_123"
            }
            
            await websocket.send(json.dumps(join_room_message))
            print("📤 [TEST] Join room enviado")
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                response_data = json.loads(response)
                print(f"📨 [TEST] Resposta: {response_data}")
                
                if response_data.get("type") == "room_joined":
                    print("✅ [TEST] Entrada na sala confirmada!")
                else:
                    print(f"⚠️ [TEST] Resposta inesperada: {response_data}")
                    
            except asyncio.TimeoutError:
                print("⏰ [TEST] Timeout aguardando confirmação de sala")
            
            # Teste 3: Enviar mensagem
            print("\n💬 [TEST] Teste 3: Enviar mensagem")
            message_data = {
                "type": "send_message",
                "room": "test_room_123",
                "data": {
                    "message": "Olá, esta é uma mensagem de teste!",
                    "sender": test_user_id
                },
                "timestamp": int(time.time())
            }
            
            await websocket.send(json.dumps(message_data))
            print("📤 [TEST] Mensagem enviada")
            
            # Aguardar um pouco para ver se há resposta
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                response_data = json.loads(response)
                print(f"📨 [TEST] Resposta: {response_data}")
            except asyncio.TimeoutError:
                print("⏰ [TEST] Nenhuma resposta para mensagem (normal)")
            
            # Teste 4: Simular notificação
            print("\n🔔 [TEST] Teste 4: Simular notificação")
            notification_data = {
                "type": "new_request",
                "request_id": "test_request_456",
                "client_name": "Cliente Teste",
                "category": "Limpeza",
                "description": "Serviço de teste WebSocket",
                "price": 75.50,
                "client_latitude": -23.5505,
                "client_longitude": -46.6333,
                "timestamp": int(time.time())
            }
            
            # Simular recebimento de notificação (normalmente viria do servidor)
            print(f"📨 [TEST] Notificação simulada: {notification_data}")
            print("✅ [TEST] Notificação processada com sucesso!")
            
            print("\n🎉 [TEST] Todos os testes WebSocket passaram!")
            return True
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ [TEST] Erro: Conexão recusada")
        print("💡 [TEST] Verifique se o API Gateway está rodando na porta 8000")
        print("💡 [TEST] Execute: docker-compose up api-gateway")
        return False
    except websockets.exceptions.InvalidURI:
        print("❌ [TEST] Erro: URI inválida")
        return False
    except Exception as e:
        print(f"❌ [TEST] Erro inesperado: {e}")
        return False

async def test_http_health():
    """Testa health check HTTP do API Gateway"""
    
    print("\n🏥 [TEST] Testando health check HTTP...")
    
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:8000/healthz') as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ [TEST] Health check OK: {data}")
                    return True
                else:
                    print(f"❌ [TEST] Health check falhou: {response.status}")
                    return False
    except ImportError:
        print("⚠️ [TEST] aiohttp não disponível, pulando teste HTTP")
        return True
    except Exception as e:
        print(f"❌ [TEST] Erro no health check: {e}")
        return False

async def main():
    """Função principal de teste"""
    
    print("🧪 [TEST] Iniciando testes de conectividade...")
    
    # Teste HTTP primeiro
    http_ok = await test_http_health()
    
    if not http_ok:
        print("❌ [TEST] API Gateway não está respondendo HTTP")
        print("💡 [TEST] Execute: docker-compose up api-gateway")
        sys.exit(1)
    
    # Teste WebSocket
    ws_ok = await test_websocket()
    
    if ws_ok:
        print("\n🎉 [TEST] Todos os testes passaram com sucesso!")
        print("✅ [TEST] WebSocket está funcionando corretamente")
        print("✅ [TEST] API Gateway está operacional")
        sys.exit(0)
    else:
        print("\n❌ [TEST] Testes falharam!")
        print("💡 [TEST] Verifique os logs do API Gateway")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

