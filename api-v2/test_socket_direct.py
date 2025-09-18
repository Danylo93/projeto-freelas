#!/usr/bin/env python3
"""
Script para testar notificações Socket.IO diretamente
"""
import asyncio
import socketio
import json

async def test_socket_notification():
    """Testa notificação via Socket.IO"""
    
    # Conectar ao Socket.IO
    sio = socketio.AsyncClient()
    
    # Dados do prestador que deve receber a notificação
    provider_user_id = "5b2d9997-e1dc-4242-af34-d3477cb916df"
    
    # Dados da notificação
    notification_data = {
        "request_id": "req_test_socket_123",
        "client_id": "9ae70d35-9b6b-40c6-9aaa-7019cf0a5a0b",
        "category": "Eletricista",
        "description": "🧪 TESTE SOCKET - Preciso de um eletricista urgente!",
        "client_latitude": -23.5505,
        "client_longitude": -46.6333,
        "price": 75,
        "client_address": "São Paulo, SP - TESTE SOCKET",
        "urgency": "high",
        "client_name": "Cliente Teste Socket",
        "client_phone": "11999999999"
    }
    
    @sio.event
    async def connect():
        print(f"🔌 [SOCKET] Conectado ao servidor")
        
        # Entrar na sala do prestador
        await sio.emit('join_room', {
            'user_id': provider_user_id,
            'user_type': 1  # Prestador
        })
        print(f"🏠 [SOCKET] Entrou na sala: provider_{provider_user_id}")
        
        # Aguardar um pouco e então emitir a notificação
        await asyncio.sleep(1)
        
        print(f"🔔 [SOCKET] Enviando notificação...")
        await sio.emit('new_request', notification_data)
        
        # Aguardar um pouco para ver se recebe resposta
        await asyncio.sleep(3)
        
        await sio.disconnect()
    
    @sio.event
    async def disconnect():
        print(f"🔌 [SOCKET] Desconectado do servidor")
    
    @sio.event
    async def new_request(data):
        print(f"🔔 [SOCKET] NOTIFICAÇÃO RECEBIDA: {json.dumps(data, indent=2)}")
    
    @sio.event
    async def connect_error(data):
        print(f"❌ [SOCKET] Erro de conexão: {data}")
    
    try:
        # Conectar ao servidor Socket.IO
        url = "http://localhost:8000"
        print(f"🌐 [SOCKET] Conectando a: {url}")
        
        await sio.connect(url, socketio_path='/socket.io')
        await sio.wait()
        
    except Exception as e:
        print(f"❌ [SOCKET] Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_socket_notification())
