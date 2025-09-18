import os
import asyncio
import json
import sys
from pathlib import Path
from fastapi import FastAPI
import socketio
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Adicionar o diretório comum ao path
BASE_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = BASE_DIR.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from common.kafka import make_consumer_with_retry
from common.events import TOPIC_REQ_LIFECYCLE, EV_REQUEST_CREATED, EV_REQUEST_OFFERED

load_dotenv()

# Configurações
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")

# FastAPI app
app = FastAPI(title="notification-service")

# Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')

# MongoDB client
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# HTTP client
http_client = httpx.AsyncClient(timeout=30.0)

# Kafka consumer
consumer_lifecycle = None

@app.on_event("startup")
async def startup():
    """Inicializa o serviço de notificações"""
    global consumer_lifecycle
    
    print("🚀 [NOTIFICATION] Iniciando notification-service...")
    
    try:
        # Criar consumer do Kafka
        consumer_lifecycle = await make_consumer_with_retry(
            TOPIC_REQ_LIFECYCLE,
            group_id="notification-service",
        )
        print(f"✅ [NOTIFICATION] Consumer criado para tópico: {TOPIC_REQ_LIFECYCLE}")
        
        # Iniciar task de consumo
        asyncio.create_task(consume_lifecycle_events())
        print("🔄 [NOTIFICATION] Task de consumo iniciada")
        
    except Exception as e:
        print(f"❌ [NOTIFICATION] Erro ao iniciar Kafka: {e}")
        import traceback
        traceback.print_exc()

@app.on_event("shutdown")
async def shutdown():
    """Finaliza o serviço"""
    if consumer_lifecycle:
        await consumer_lifecycle.stop()
    await http_client.aclose()
    mongo_client.close()

async def consume_lifecycle_events():
    """Consome eventos de lifecycle do Kafka"""
    print("🔄 [NOTIFICATION] Iniciando consumo de eventos...")
    
    if not consumer_lifecycle:
        print("❌ [NOTIFICATION] Consumer não disponível!")
        return
    
    try:
        async for msg in consumer_lifecycle:
            event_data = msg.value
            print(f"📨 [NOTIFICATION] Evento recebido: {event_data}")
            await handle_lifecycle_event(event_data)
    except Exception as e:
        print(f"❌ [NOTIFICATION] Erro no consumer: {e}")
        import traceback
        traceback.print_exc()

async def handle_lifecycle_event(data):
    """Processa eventos de lifecycle"""
    event_type = data.get('type')
    
    print(f"🔔 [NOTIFICATION] Processando evento: {event_type}")
    
    if event_type == EV_REQUEST_CREATED:
        await notify_providers_new_request(data)
    elif event_type == EV_REQUEST_OFFERED:
        await notify_client_offer_received(data)

async def notify_providers_new_request(data):
    """Notifica prestadores sobre nova solicitação"""
    request_id = data.get('request_id')
    client_id = data.get('client_id')
    
    print(f"🔔 [NOTIFICATION] Notificando prestadores sobre: {request_id}")
    
    try:
        # Buscar dados da solicitação
        request_doc = await db.requests.find_one({"id": request_id})
        if not request_doc:
            print(f"❌ [NOTIFICATION] Solicitação {request_id} não encontrada")
            return
        
        # Buscar prestadores da categoria
        category = request_doc.get('category')
        providers_cursor = db.providers.find({
            "category": category,
            "status": "available"
        })
        
        providers = await providers_cursor.to_list(length=100)
        print(f"🔍 [NOTIFICATION] Encontrados {len(providers)} prestadores para {category}")
        
        # Buscar dados do cliente
        client_name = "Cliente"
        try:
            client_doc = await db.users.find_one({"id": client_id})
            if client_doc:
                client_name = client_doc.get('name', 'Cliente')
        except:
            pass
        
        # Preparar dados da notificação
        notification_data = {
            'request_id': request_id,
            'client_id': client_id,
            'client_name': client_name,
            'category': request_doc.get('category'),
            'description': request_doc.get('description'),
            'price': request_doc.get('price'),
            'client_latitude': request_doc.get('client_latitude'),
            'client_longitude': request_doc.get('client_longitude'),
            'urgency': 'high',
            'timestamp': request_doc.get('created_at', 'agora')
        }
        
        # Enviar notificação para cada prestador
        for provider in providers:
            provider_user_id = provider.get('user_id')
            if provider_user_id:
                room_name = f"provider_{provider_user_id}"
                await sio.emit('new_request', notification_data, room=room_name)
                print(f"🔔 [NOTIFICATION] Notificação enviada para {room_name}")
        
    except Exception as e:
        print(f"❌ [NOTIFICATION] Erro ao notificar prestadores: {e}")
        import traceback
        traceback.print_exc()

async def notify_client_offer_received(data):
    """Notifica cliente que recebeu uma oferta"""
    request_id = data.get('request_id')
    provider_id = data.get('provider_id')
    
    print(f"🔔 [NOTIFICATION] Notificando cliente sobre oferta: {request_id}")
    
    try:
        # Buscar dados da solicitação
        request_doc = await db.requests.find_one({"id": request_id})
        if not request_doc:
            return
        
        client_id = request_doc.get('client_id')
        if not client_id:
            return
        
        # Buscar dados do prestador
        provider_doc = await db.providers.find_one({"id": provider_id})
        provider_name = "Prestador"
        if provider_doc:
            provider_user_id = provider_doc.get('user_id')
            try:
                user_doc = await db.users.find_one({"id": provider_user_id})
                if user_doc:
                    provider_name = user_doc.get('name', 'Prestador')
            except:
                pass
        
        # Preparar dados da notificação
        notification_data = {
            'request_id': request_id,
            'provider_id': provider_id,
            'provider_name': provider_name,
            'category': request_doc.get('category'),
            'price': request_doc.get('price'),
            'status': 'offered'
        }
        
        # Enviar notificação para o cliente
        room_name = f"client_{client_id}"
        await sio.emit('offer_received', notification_data, room=room_name)
        print(f"🔔 [NOTIFICATION] Oferta enviada para {room_name}")
        
    except Exception as e:
        print(f"❌ [NOTIFICATION] Erro ao notificar cliente: {e}")

# Socket.IO events
@sio.event
async def connect(sid, environ, auth=None):
    """Cliente conectou"""
    print(f"🔌 [NOTIFICATION] Cliente conectado: {sid}")

    # Extrair informações de autenticação se disponível
    if auth:
        user_id = auth.get('user_id')
        user_type = auth.get('user_type')

        if user_id and user_type:
            # Entrar automaticamente na sala baseada no tipo de usuário
            if user_type == 1:  # Provider
                room_name = f"provider_{user_id}"
                await sio.enter_room(sid, room_name)
                print(f"🏠 [NOTIFICATION] Prestador {user_id} entrou automaticamente na sala: {room_name}")
            elif user_type == 2:  # Client
                room_name = f"client_{user_id}"
                await sio.enter_room(sid, room_name)
                print(f"🏠 [NOTIFICATION] Cliente {user_id} entrou automaticamente na sala: {room_name}")

@sio.event
async def disconnect(sid):
    print(f"🔌 [NOTIFICATION] Cliente desconectado: {sid}")

@sio.event
async def join_providers_room(sid):
    """Compatibilidade com frontend - evento join_providers_room"""
    print(f"🏠 [NOTIFICATION] join_providers_room chamado para {sid}")
    # Emitir confirmação para o frontend
    await sio.emit('room_joined', {'room': 'providers_general'}, room=sid)

@sio.event
async def join_room(sid, data):
    """Cliente entra em uma sala específica"""
    user_id = data.get('user_id')
    user_type = data.get('user_type', 1)  # 1=provider, 2=client

    if user_id:
        room_prefix = "provider" if user_type == 1 else "client"
        room_name = f"{room_prefix}_{user_id}"
        await sio.enter_room(sid, room_name)
        print(f"🏠 [NOTIFICATION] {sid} entrou na sala: {room_name}")

        await sio.emit('joined_room', {'room': room_name}, room=sid)

@app.get("/healthz")
async def health():
    return {"status": "ok", "service": "notification"}

@app.post("/test/notify")
async def test_notify(data: dict):
    """Endpoint para testar notificações"""
    room = data.get('room')
    message = data.get('message', {})
    
    if room:
        await sio.emit('test_notification', message, room=room)
        return {"status": "success", "room": room, "message": message}
    
    return {"error": "room é obrigatório"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8016)
