#!/usr/bin/env python3
"""
Teste direto de WebSocket para debug
"""
import asyncio
import websockets
import json
import sys

async def test_websocket_direct():
    """Teste direto de WebSocket"""
    
    print("🔌 [TEST] Teste direto de WebSocket...")
    
    # URL do WebSocket
    ws_url = "ws://localhost:8000/ws"
    
    # Dados de teste (usar token real se disponível)
    test_data = {
        "user_id": "faf52c5c-46fb-4600-9845-52b06705aef2",
        "user_type": 1,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWY1MmM1Yy00NmZiLTQ2MDAtOTg0NS01MmIwNjcwNWFlZjIiLCJ1c2VyX3R5cGUiOjEsImV4cCI6MTc1ODMwMTMzOX0.LDnsQQtTrY110hSPXgsd0G8eOVT_o5VsNZHuS63H2pI"
    }
    
    # Construir URL com parâmetros
    full_url = f"{ws_url}?user_id={test_data['user_id']}&user_type={test_data['user_type']}&token={test_data['token']}"
    
    print(f"🔌 [TEST] URL: {full_url}")
    
    try:
        async with websockets.connect(full_url) as websocket:
            print("✅ [TEST] WebSocket conectado!")
            
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
        print("❌ [TEST] Conexão recusada")
        print("💡 [TEST] Verifique se o API Gateway está rodando na porta 8000")
        return False
    except websockets.exceptions.InvalidURI:
        print("❌ [TEST] URI inválida")
        return False
    except Exception as e:
        print(f"❌ [TEST] Erro: {e}")
        return False

async def test_http_endpoint():
    """Testa endpoint HTTP do WebSocket"""
    
    print("\n🌐 [TEST] Testando endpoint HTTP...")
    
    try:
        import requests
        response = requests.get("http://localhost:8000/ws", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ [TEST] Endpoint HTTP OK: {data}")
            return True
        else:
            print(f"❌ [TEST] Endpoint HTTP falhou: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ [TEST] Erro de conexão HTTP")
        return False
    except Exception as e:
        print(f"❌ [TEST] Erro HTTP: {e}")
        return False

async def main():
    """Função principal"""
    
    print("🚀 [TEST] Iniciando testes de conectividade...")
    
    # Teste HTTP primeiro
    http_ok = await test_http_endpoint()
    
    if not http_ok:
        print("❌ [TEST] API Gateway não está respondendo HTTP")
        sys.exit(1)
    
    # Teste WebSocket
    ws_ok = await test_websocket_direct()
    
    if ws_ok:
        print("\n🎉 [TEST] WebSocket funcionando!")
        sys.exit(0)
    else:
        print("\n❌ [TEST] WebSocket falhou")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

