#!/usr/bin/env python3
"""
Script para testar notificações Socket.IO diretamente
"""
import asyncio
import aiohttp
import json

async def send_notification():
    """Envia uma notificação diretamente para o prestador via Socket.IO"""
    
    # Dados da notificação
    notification_data = {
        "request_id": "req_test_manual_123",
        "client_id": "9ae70d35-9b6b-40c6-9aaa-7019cf0a5a0b",
        "category": "Eletricista",
        "description": "TESTE MANUAL - Preciso de um eletricista",
        "client_latitude": -23.5505,
        "client_longitude": -46.6333,
        "price": 50,
        "client_address": "São Paulo, SP - TESTE MANUAL",
        "urgency": "high"
    }
    
    # ID do prestador que deve receber a notificação
    provider_user_id = "5b2d9997-e1dc-4242-af34-d3477cb916df"
    
    print(f"🔔 Enviando notificação para prestador: {provider_user_id}")
    print(f"📋 Dados: {json.dumps(notification_data, indent=2)}")
    
    try:
        # Enviar via API Gateway (que tem Socket.IO integrado)
        async with aiohttp.ClientSession() as session:
            # Simular evento de nova solicitação
            url = "http://localhost:8000/socket.io/"
            
            # Dados para emitir via Socket.IO
            socket_data = {
                "event": "new_request",
                "room": f"provider_{provider_user_id}",
                "data": notification_data
            }
            
            print(f"🌐 Enviando para: {url}")
            print(f"📤 Socket data: {json.dumps(socket_data, indent=2)}")
            
            # Tentar emitir diretamente
            headers = {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "1"
            }
            
            async with session.post(url, json=socket_data, headers=headers) as response:
                print(f"📥 Response status: {response.status}")
                text = await response.text()
                print(f"📥 Response: {text}")
                
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    asyncio.run(send_notification())
