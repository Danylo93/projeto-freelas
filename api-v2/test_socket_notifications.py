#!/usr/bin/env python3
"""
Teste de notificações Socket.IO
Simula um cliente conectando ao notification-service
"""
import socketio
import asyncio
import json
import time

# Configuração
NOTIFICATION_SERVICE_URL = 'http://localhost:8016'
PROVIDER_USER_ID = '5b2d9997-e1dc-4242-af34-d3477cb916df'  # Patty
CLIENT_USER_ID = 'a3d09ab2-4a96-4533-b6a2-e0fe7fd5bf1b'    # Danylo

class NotificationTester:
    def __init__(self):
        self.sio = socketio.AsyncClient()
        self.setup_events()
    
    def setup_events(self):
        @self.sio.event
        async def connect():
            print("🔌 [TEST] Conectado ao notification-service")
            
        @self.sio.event
        async def disconnect():
            print("❌ [TEST] Desconectado do notification-service")
            
        @self.sio.event
        async def new_request(data):
            print(f"🔔 [TEST] NOVA SOLICITAÇÃO RECEBIDA!")
            print(f"📋 [TEST] Dados: {json.dumps(data, indent=2)}")
            
        @self.sio.event
        async def offer_received(data):
            print(f"✅ [TEST] OFERTA RECEBIDA!")
            print(f"📋 [TEST] Dados: {json.dumps(data, indent=2)}")
            
        @self.sio.event
        async def request_accepted(data):
            print(f"🎉 [TEST] SOLICITAÇÃO ACEITA!")
            print(f"📋 [TEST] Dados: {json.dumps(data, indent=2)}")
    
    async def test_provider_notifications(self):
        """Testa notificações para prestador"""
        print(f"🧪 [TEST] Testando notificações para PRESTADOR: {PROVIDER_USER_ID}")
        
        try:
            await self.sio.connect(NOTIFICATION_SERVICE_URL)
            
            # Entrar na sala do prestador
            await self.sio.emit('join_room', {
                'user_id': PROVIDER_USER_ID,
                'user_type': 'provider'
            })
            print(f"🏠 [TEST] Entrou na sala: provider_{PROVIDER_USER_ID}")
            
            # Aguardar notificações
            print("⏳ [TEST] Aguardando notificações por 30 segundos...")
            await asyncio.sleep(30)
            
        except Exception as e:
            print(f"❌ [TEST] Erro: {e}")
        finally:
            await self.sio.disconnect()
    
    async def test_client_notifications(self):
        """Testa notificações para cliente"""
        print(f"🧪 [TEST] Testando notificações para CLIENTE: {CLIENT_USER_ID}")
        
        try:
            await self.sio.connect(NOTIFICATION_SERVICE_URL)
            
            # Entrar na sala do cliente
            await self.sio.emit('join_room', {
                'user_id': CLIENT_USER_ID,
                'user_type': 'client'
            })
            print(f"🏠 [TEST] Entrou na sala: client_{CLIENT_USER_ID}")
            
            # Aguardar notificações
            print("⏳ [TEST] Aguardando notificações por 30 segundos...")
            await asyncio.sleep(30)
            
        except Exception as e:
            print(f"❌ [TEST] Erro: {e}")
        finally:
            await self.sio.disconnect()

async def main():
    print("🚀 [TEST] Iniciando teste de notificações Socket.IO")
    
    tester = NotificationTester()
    
    # Testar notificações para prestador
    await tester.test_provider_notifications()
    
    print("\n" + "="*50 + "\n")
    
    # Testar notificações para cliente
    await tester.test_client_notifications()

if __name__ == "__main__":
    asyncio.run(main())
