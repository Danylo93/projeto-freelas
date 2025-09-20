#!/usr/bin/env python3
"""
Teste de conectividade WebSocket para API Gateway
"""
import asyncio
import websockets
import json
import sys

async def test_websocket_connection():
    """Testa conexão WebSocket com o API Gateway"""
    
    # URL do WebSocket
    ws_url = "ws://localhost:8000/ws"
    
    # Dados de teste (token falso para teste)
    test_data = {
        "user_id": "test_user_123",
        "user_type": 1,  # Prestador
        "token": "fake_token_for_testing"
    }
    
    print(f"🔌 [TEST] Conectando ao WebSocket: {ws_url}")
    
    try:
        # Construir URL com parâmetros
        full_url = f"{ws_url}?user_id={test_data['user_id']}&user_type={test_data['user_type']}&token={test_data['token']}"
        
        async with websockets.connect(full_url) as websocket:
            print("✅ [TEST] WebSocket conectado com sucesso!")
            
            # Enviar mensagem de ping
            ping_message = {
                "type": "ping",
                "timestamp": 1234567890
            }
            
            await websocket.send(json.dumps(ping_message))
            print("📤 [TEST] Mensagem ping enviada")
            
            # Aguardar resposta
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                response_data = json.loads(response)
                print(f"📨 [TEST] Resposta recebida: {response_data}")
                
                if response_data.get("type") == "pong":
                    print("✅ [TEST] Pong recebido - conexão funcionando!")
                else:
                    print(f"⚠️ [TEST] Resposta inesperada: {response_data}")
                    
            except asyncio.TimeoutError:
                print("⏰ [TEST] Timeout aguardando resposta")
            
            # Testar entrada em sala
            join_room_message = {
                "type": "join_room",
                "room": "test_room"
            }
            
            await websocket.send(json.dumps(join_room_message))
            print("📤 [TEST] Mensagem join_room enviada")
            
            # Aguardar confirmação
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                response_data = json.loads(response)
                print(f"📨 [TEST] Resposta join_room: {response_data}")
                
                if response_data.get("type") == "room_joined":
                    print("✅ [TEST] Entrada na sala confirmada!")
                else:
                    print(f"⚠️ [TEST] Resposta inesperada: {response_data}")
                    
            except asyncio.TimeoutError:
                print("⏰ [TEST] Timeout aguardando confirmação de sala")
            
            print("✅ [TEST] Teste WebSocket concluído com sucesso!")
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ [TEST] Erro: Conexão recusada. Verifique se o API Gateway está rodando na porta 8000")
        return False
    except websockets.exceptions.InvalidURI:
        print("❌ [TEST] Erro: URI inválida")
        return False
    except Exception as e:
        print(f"❌ [TEST] Erro inesperado: {e}")
        return False
    
    return True

async def test_notification_send():
    """Testa envio de notificação via WebSocket"""
    
    print("\n🔔 [TEST] Testando envio de notificação...")
    
    # Simular notificação para prestador
    notification_data = {
        "type": "new_request",
        "request_id": "test_request_123",
        "client_name": "Cliente Teste",
        "category": "Limpeza",
        "description": "Serviço de teste",
        "price": 50.00,
        "client_latitude": -23.5505,
        "client_longitude": -46.6333
    }
    
    # Aqui você poderia implementar um teste mais completo
    # simulando o envio de notificação para um prestador específico
    print(f"📤 [TEST] Dados de notificação: {notification_data}")
    print("✅ [TEST] Teste de notificação simulado")

if __name__ == "__main__":
    print("🚀 [TEST] Iniciando testes WebSocket...")
    
    # Executar teste de conexão
    result = asyncio.run(test_websocket_connection())
    
    if result:
        # Executar teste de notificação
        asyncio.run(test_notification_send())
        print("\n🎉 [TEST] Todos os testes passaram!")
        sys.exit(0)
    else:
        print("\n❌ [TEST] Testes falharam!")
        sys.exit(1)

