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
    await sio.save_session(sid, {
        "user_id": auth.get("user_id"),
        "user_type": auth.get("user_type"),
    })
    await sio.emit('presence', {"sid": sid, "status": "online"}, to=sid)

@sio.event
async def disconnect(sid):
    sess = await sio.get_session(sid)
    await sio.emit('presence', {"sid": sid, "status": "offline", "user_id": sess.get("user_id")})

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
        await sio.emit(event_name, msg.value)


@app.on_event("startup")
async def start_ws():
    global consumer_locations, consumer_lifecycle
    consumer_locations = await make_consumer_with_retry(
        TOPIC_PROV_LOCATION,
        group_id="socket-gateway",
    )
    consumer_lifecycle = await make_consumer_with_retry(
        TOPIC_REQ_LIFECYCLE,
        group_id="socket-gateway",
    )
    asyncio.create_task(consume_and_emit(consumer_locations, 'location_updated'))
    asyncio.create_task(consume_and_emit(consumer_lifecycle, 'lifecycle'))


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
