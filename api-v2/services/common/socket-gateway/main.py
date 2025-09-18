from fastapi import FastAPI, Header
from urllib.parse import urlencode
from fastapi.responses import JSONResponse
import os, traceback
from dotenv import load_dotenv
import httpx
import socketio
import asyncio

from common.events import (
    TOPIC_PROV_LOCATION,
    TOPIC_REQ_LIFECYCLE,
    EV_PROVIDER_LOCATION,
)
from common.kafka import make_consumer_with_retry

load_dotenv()

PROVIDER_URL = os.getenv("PROVIDER_URL", "http://provider-service:8011").rstrip("/")
REQUEST_URL  = os.getenv("REQUEST_URL",  "http://request-service:8012").rstrip("/")
AUTH_URL     = os.getenv("AUTH_URL",     "http://auth-service:8014").rstrip("/")
PAYMENT_URL  = os.getenv("PAYMENT_URL",  "http://payment-service:8016").rstrip("/")
ADMIN_URL    = os.getenv("ADMIN_URL",    "http://admin-service:8017").rstrip("/")

app = FastAPI(title="socket-gateway")
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"gateway","upstreams":{
        "provider": PROVIDER_URL, "request": REQUEST_URL, "auth": AUTH_URL, "payment": PAYMENT_URL, "admin": ADMIN_URL
    }}
@app.get("/api/admin/config")
async def admin_get_config(authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    return await forward("GET", f"{ADMIN_URL}/admin/config", headers=headers)


@app.put("/api/admin/config")
async def admin_put_config(data: dict, authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    return await forward("PUT", f"{ADMIN_URL}/admin/config", data, headers=headers)


@app.get("/api/admin/categories")
async def admin_list_categories(authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    return await forward("GET", f"{ADMIN_URL}/admin/categories", headers=headers)


@app.post("/api/admin/categories")
async def admin_create_category(data: dict, authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    return await forward("POST", f"{ADMIN_URL}/admin/categories", data, headers=headers)


@app.delete("/api/admin/categories/{category_id}")
async def admin_delete_category(category_id: str, authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    return await forward("DELETE", f"{ADMIN_URL}/admin/categories/{category_id}", headers=headers)


@app.get("/api/admin/users")
async def admin_users(q: str | None = None, authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    url = f"{ADMIN_URL}/admin/users"
    if q:
        url += f"?{urlencode({'q': q})}"
    return await forward("GET", url, headers=headers)


@app.get("/api/admin/providers")
async def admin_providers(q: str | None = None, authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    url = f"{ADMIN_URL}/admin/providers"
    if q:
        url += f"?{urlencode({'q': q})}"
    return await forward("GET", url, headers=headers)


@app.get("/api/admin/requests")
async def admin_requests(q: str | None = None, authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    url = f"{ADMIN_URL}/admin/requests"
    if q:
        url += f"?{urlencode({'q': q})}"
    return await forward("GET", url, headers=headers)

async def forward(method: str, url: str, payload: dict | None = None, headers: dict | None = None):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.request(method, url, json=payload, headers=headers)
            r.raise_for_status()
            if r.content:
                return r.json()
            return {}
    except Exception as e:
        return JSONResponse(
            status_code=502,
            content={
                "error": "upstream_failure",
                "target": url,
                "detail": str(e),
                "trace": traceback.format_exc().splitlines()[-5:],
            },
        )


@app.get("/api/providers")
async def list_providers(user_id: str | None = None):
    url = f"{PROVIDER_URL}/providers"
    if user_id:
        url = f"{url}?{urlencode({'user_id': user_id})}"
    return await forward("GET", url)


@app.post("/api/providers")
async def create_provider(data: dict, idempotency_key: str | None = Header(None, alias="Idempotency-Key")):
    headers = {"Idempotency-Key": idempotency_key} if idempotency_key else None
    return await forward("POST", f"{PROVIDER_URL}/providers", data, headers=headers)


@app.put("/api/providers/{provider_id}")
async def upsert_provider(provider_id: str, data: dict, idempotency_key: str | None = Header(None, alias="Idempotency-Key")):
    headers = {"Idempotency-Key": idempotency_key} if idempotency_key else None
    return await forward("PUT", f"{PROVIDER_URL}/providers/{provider_id}", data, headers=headers)


@app.put("/api/providers/{provider_id}/location")
async def update_provider_location(provider_id: str, data: dict):
    return await forward(
        "PUT", f"{PROVIDER_URL}/providers/{provider_id}/location", data
    )


@app.put("/api/providers/{provider_id}/status")
async def update_provider_status(provider_id: str, data: dict):
    return await forward(
        "PUT", f"{PROVIDER_URL}/providers/{provider_id}/status", data
    )


@app.get("/api/requests")
async def list_requests():
    return await forward("GET", f"{REQUEST_URL}/requests")


@app.post("/api/requests")
async def create_request(data: dict, idempotency_key: str | None = Header(None, alias="Idempotency-Key")):
    headers = {"Idempotency-Key": idempotency_key} if idempotency_key else None
    return await forward("POST", f"{REQUEST_URL}/requests", data, headers=headers)


@app.put("/api/requests/{request_id}/accept")
async def accept_request(request_id: str, data: dict, idempotency_key: str | None = Header(None, alias="Idempotency-Key")):
    headers = {"Idempotency-Key": idempotency_key} if idempotency_key else None
    return await forward(
        "PUT", f"{REQUEST_URL}/requests/{request_id}/accept", data, headers=headers
    )


@app.put("/api/requests/{request_id}/status")
async def update_request_status(request_id: str, data: dict, idempotency_key: str | None = Header(None, alias="Idempotency-Key")):
    headers = {"Idempotency-Key": idempotency_key} if idempotency_key else None
    return await forward(
        "PUT", f"{REQUEST_URL}/requests/{request_id}/status", data, headers=headers
    )


# --- WebSocket events ---

@sio.event
async def connect(sid, environ, auth):
    user_id = auth.get("user_id") if auth else None
    user_type = auth.get("user_type") if auth else None

    await sio.save_session(sid, {
        "user_id": user_id,
        "user_type": user_type,
    })

    # Entrar na sala específica baseada no tipo de usuário
    if user_id and user_type:
        if user_type == 1:  # Prestador
            room_name = f"provider_{user_id}"
            await sio.enter_room(sid, room_name)
            print(f"🔌 [SOCKET-GATEWAY] Prestador {user_id} entrou na sala {room_name}")
        elif user_type == 2:  # Cliente
            room_name = f"client_{user_id}"
            await sio.enter_room(sid, room_name)
            print(f"🔌 [SOCKET-GATEWAY] Cliente {user_id} entrou na sala {room_name}")

    await sio.emit('presence', {"sid": sid, "status": "online"}, to=sid)
    print(f"🔌 [SOCKET-GATEWAY] Cliente conectado: {sid} (user_id: {user_id}, user_type: {user_type})")

@sio.event
async def disconnect(sid):
    sess = await sio.get_session(sid)
    user_id = sess.get("user_id")
    user_type = sess.get("user_type")

    print(f"🔌 [SOCKET-GATEWAY] Cliente desconectado: {sid} (user_id: {user_id})")

    await sio.emit('presence', {"sid": sid, "status": "offline", "user_id": user_id})

@sio.event
async def chat_message(sid, data):
    await sio.emit('chat_message', {"from": sid, **(data or {})})


@sio.event
async def join_request_room(sid, data):
    request_id = (data or {}).get('request_id') or (data or {}).get('requestId')
    if request_id:
        await sio.enter_room(sid, f"req:{request_id}")
        await sio.emit('room_joined', {"room": f"req:{request_id}"}, to=sid)


@sio.event
async def leave_request_room(sid, data):
    request_id = (data or {}).get('request_id') or (data or {}).get('requestId')
    if request_id:
        await sio.leave_room(sid, f"req:{request_id}")
        await sio.emit('room_left', {"room": f"req:{request_id}"}, to=sid)


@sio.event
async def send_request_message(sid, data):
    request_id = (data or {}).get('request_id') or (data or {}).get('requestId')
    message = (data or {}).get('message')
    if request_id and message:
        await sio.emit('request_message', {"from": sid, "message": message}, room=f"req:{request_id}")


consumer_locations = None
consumer_lifecycle = None


async def consume_and_emit(consumer, event_name):
    async for msg in consumer:
        print(f"🔔 [SOCKET-GATEWAY] Evento recebido: {event_name} - {msg.value}")

        # Se for um evento de lifecycle, processar especificamente
        if event_name == 'lifecycle':
            await handle_lifecycle_event(msg.value)
        else:
            await sio.emit(event_name, msg.value)

async def handle_lifecycle_event(data):
    """Processa eventos de lifecycle e emite eventos específicos"""
    event_type = data.get('type')

    if event_type == 'request.created':
        # Quando uma solicitação é criada, notificar prestadores próximos
        await notify_providers_for_request(data)
    elif event_type == 'request.accepted':
        # Quando uma solicitação é aceita, notificar o cliente
        await notify_client_request_accepted(data)
    elif event_type == 'request.offered':
        # Quando uma oferta é feita, notificar o cliente
        await notify_client_offer_received(data)

    # Emitir o evento original também
    await sio.emit('lifecycle', data)

async def notify_providers_for_request(data):
    """Notifica prestadores próximos sobre nova solicitação"""
    request_id = data.get('request_id')
    client_id = data.get('client_id')

    if not request_id:
        return

    try:
        # Buscar detalhes da solicitação
        async with httpx.AsyncClient() as client:
            # Buscar a solicitação
            req_response = await client.get(f"{REQUEST_URL}/requests?id={request_id}")
            if req_response.status_code != 200:
                print(f"❌ [SOCKET-GATEWAY] Erro ao buscar solicitação {request_id}")
                return

            requests = req_response.json()
            if not requests:
                print(f"❌ [SOCKET-GATEWAY] Solicitação {request_id} não encontrada")
                return

            request_data = requests[0]

            # Buscar prestadores próximos da categoria
            prov_response = await client.get(f"{PROVIDER_URL}/providers?category={request_data.get('category')}&status=available")
            if prov_response.status_code != 200:
                print(f"❌ [SOCKET-GATEWAY] Erro ao buscar prestadores")
                return

            providers = prov_response.json()

            # Buscar dados do cliente
            client_response = await client.get(f"{AUTH_URL}/auth/users/{client_id}")
            client_name = "Cliente"
            if client_response.status_code == 200:
                client_data = client_response.json()
                client_name = client_data.get('name', 'Cliente')

            # Notificar cada prestador
            for provider in providers:
                provider_id = provider.get('user_id')
                if provider_id:
                    # Calcular distância
                    distance = calculate_distance(
                        request_data.get('client_latitude', 0),
                        request_data.get('client_longitude', 0),
                        provider.get('latitude', 0),
                        provider.get('longitude', 0)
                    )

                    # Preparar dados da notificação
                    notification_data = {
                        'request_id': request_id,
                        'client_id': client_id,
                        'client_name': client_name,
                        'category': request_data.get('category'),
                        'description': request_data.get('description'),
                        'price': request_data.get('price'),
                        'distance': round(distance, 1),
                        'client_latitude': request_data.get('client_latitude'),
                        'client_longitude': request_data.get('client_longitude'),
                    }

                    # Emitir para o prestador específico
                    await sio.emit('new_request', notification_data, room=f"provider_{provider_id}")
                    print(f"🔔 [SOCKET-GATEWAY] Notificação enviada para prestador {provider_id}")

    except Exception as e:
        print(f"❌ [SOCKET-GATEWAY] Erro ao notificar prestadores: {e}")

async def notify_client_request_accepted(data):
    """Notifica cliente que solicitação foi aceita"""
    client_id = data.get('client_id')
    if client_id:
        await sio.emit('request_accepted', data, room=f"client_{client_id}")

async def notify_client_offer_received(data):
    """Notifica cliente que recebeu uma oferta"""
    request_id = data.get('request_id')
    if request_id:
        # Buscar dados da solicitação para obter client_id
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{REQUEST_URL}/requests?id={request_id}")
                if response.status_code == 200:
                    requests = response.json()
                    if requests:
                        client_id = requests[0].get('client_id')
                        if client_id:
                            await sio.emit('offer_received', data, room=f"client_{client_id}")
        except Exception as e:
            print(f"❌ [SOCKET-GATEWAY] Erro ao notificar cliente: {e}")

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calcula distância entre dois pontos em km"""
    import math

    R = 6371  # Raio da Terra em km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@app.on_event("startup")
async def start_ws():
    global consumer_locations, consumer_lifecycle
    print(f"🚀 [SOCKET-GATEWAY] Iniciando consumers...")
    print(f"🚀 [SOCKET-GATEWAY] TOPIC_PROV_LOCATION: {TOPIC_PROV_LOCATION}")
    print(f"🚀 [SOCKET-GATEWAY] TOPIC_REQ_LIFECYCLE: {TOPIC_REQ_LIFECYCLE}")

    try:
        consumer_locations = await make_consumer_with_retry(
            TOPIC_PROV_LOCATION,
            group_id="socket-gateway",
        )
        print(f"✅ [SOCKET-GATEWAY] Consumer de localização criado")
    except Exception as e:
        print(f"❌ [SOCKET-GATEWAY] Erro ao criar consumer de localização: {e}")

    try:
        consumer_lifecycle = await make_consumer_with_retry(
            TOPIC_REQ_LIFECYCLE,
            group_id="socket-gateway",
        )
        print(f"✅ [SOCKET-GATEWAY] Consumer de lifecycle criado")
    except Exception as e:
        print(f"❌ [SOCKET-GATEWAY] Erro ao criar consumer de lifecycle: {e}")

    if consumer_locations:
        asyncio.create_task(consume_and_emit(consumer_locations, 'location_updated'))
        print(f"🔄 [SOCKET-GATEWAY] Task de location_updated iniciada")

    if consumer_lifecycle:
        asyncio.create_task(consume_and_emit(consumer_lifecycle, 'lifecycle'))
        print(f"🔄 [SOCKET-GATEWAY] Task de lifecycle iniciada")


@app.on_event("shutdown")
async def stop_ws():
    if consumer_locations:
        await consumer_locations.stop()
    if consumer_lifecycle:
        await consumer_lifecycle.stop()


@app.post("/api/auth/register")
async def register(data: dict):
    return await forward("POST", f"{AUTH_URL}/auth/register", data)


@app.post("/api/auth/login")
async def login(data: dict):
    return await forward("POST", f"{AUTH_URL}/auth/login", data)


@app.get("/api/auth/me")
async def me(authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    return await forward("GET", f"{AUTH_URL}/auth/me", headers=headers)


@app.post("/api/auth/push-token")
async def push_token(data: dict, authorization: str | None = Header(None)):
    headers = {"Authorization": authorization} if authorization else None
    return await forward("POST", f"{AUTH_URL}/auth/push-token", data, headers=headers)


@app.post("/api/payments/create-intent")
async def create_intent(data: dict):
    return await forward("POST", f"{PAYMENT_URL}/payments/create-intent", data)
