from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from dotenv import load_dotenv
import asyncio
from typing import Optional
import socketio
from websocket_handler import websocket_endpoint

load_dotenv()

app = FastAPI(title="API Gateway", version="1.0.0")

# Configuração do Socket.io
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')

# Configuração dos serviços
SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8014"),
    "providers": os.getenv("PROVIDER_SERVICE_URL", "http://provider-service:8011"),
    "requests": os.getenv("REQUEST_SERVICE_URL", "http://request-service:8012"),
    "matching": os.getenv("MATCHING_SERVICE_URL", "http://matching-service:8013"),
    "payments": os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8016"),
    "admin": os.getenv("ADMIN_SERVICE_URL", "http://admin-service:8017"),
    "socket": os.getenv("SOCKET_SERVICE_URL", "http://socket-gateway:8015"),
}

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cliente HTTP assíncrono
http_client = httpx.AsyncClient(timeout=30.0)

@app.on_event("startup")
async def startup():
    """Inicializa o cliente HTTP"""
    pass

@app.on_event("shutdown")
async def shutdown():
    """Fecha o cliente HTTP"""
    await http_client.aclose()

@app.get("/healthz")
async def health():
    """Health check do gateway"""
    return {"status": "ok", "service": "api-gateway"}

@app.websocket("/ws")
async def websocket_route(websocket: WebSocket, user_id: str = None, user_type: int = None, token: str = None):
    """Endpoint WebSocket para comunicação em tempo real"""
    # Extrair parâmetros da query string
    query_params = websocket.query_params
    user_id = query_params.get("user_id") or user_id
    user_type = int(query_params.get("user_type", 0)) or user_type
    token = query_params.get("token") or token
    
    await websocket_endpoint(websocket, user_id, user_type, token)

@app.get("/api/health")
async def api_health():
    """Health check de todos os serviços"""
    health_status = {}
    
    for service_name, service_url in SERVICES.items():
        try:
            response = await http_client.get(f"{service_url}/healthz", timeout=5.0)
            health_status[service_name] = {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "status_code": response.status_code
            }
        except Exception as e:
            health_status[service_name] = {
                "status": "unhealthy",
                "error": str(e)
            }
    
    return {"gateway": "healthy", "services": health_status}

# Rotas de proxy para cada serviço
@app.api_route("/api/auth", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_auth_root(request: Request):
    """Proxy para o serviço de autenticação (root)"""
    return await proxy_request("auth", "auth", request)

@app.api_route("/api/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_auth(path: str, request: Request):
    """Proxy para o serviço de autenticação"""
    return await proxy_request("auth", f"auth/{path}", request)

@app.api_route("/api/providers", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_providers_api_root(request: Request):
    """Proxy para o serviço de prestadores (root)"""
    return await proxy_request("providers", "providers", request)

@app.api_route("/api/providers/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_providers(path: str, request: Request):
    """Proxy para o serviço de prestadores"""
    return await proxy_request("providers", f"providers/{path}", request)

@app.api_route("/api/requests", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_requests_api_root(request: Request):
    """Proxy para o serviço de solicitações (root)"""
    return await proxy_request("requests", "requests", request)

@app.api_route("/api/requests/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_requests(path: str, request: Request):
    """Proxy para o serviço de solicitações"""
    return await proxy_request("requests", f"requests/{path}", request)

@app.api_route("/api/matching", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_matching_api_root(request: Request):
    """Proxy para o serviço de matching (root)"""
    return await proxy_request("matching", "matching", request)

@app.api_route("/api/matching/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_matching(path: str, request: Request):
    """Proxy para o serviço de matching"""
    return await proxy_request("matching", f"matching/{path}", request)

@app.api_route("/api/payments", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_payments_api_root(request: Request):
    """Proxy para o serviço de pagamentos (root)"""
    return await proxy_request("payments", "payments", request)

@app.api_route("/api/payments/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_payments(path: str, request: Request):
    """Proxy para o serviço de pagamentos"""
    return await proxy_request("payments", f"payments/{path}", request)

@app.api_route("/api/admin", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_admin_api_root(request: Request):
    """Proxy para o serviço de admin (root)"""
    return await proxy_request("admin", "admin", request)

@app.api_route("/api/admin/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_admin(path: str, request: Request):
    """Proxy para o serviço de admin"""
    return await proxy_request("admin", f"admin/{path}", request)

# Rotas diretas para compatibilidade
@app.api_route("/providers", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_providers_root(request: Request):
    """Proxy direto para prestadores (root)"""
    return await proxy_request("providers", "providers", request)

@app.api_route("/providers/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_providers_direct(path: str, request: Request):
    """Proxy direto para prestadores (compatibilidade)"""
    return await proxy_request("providers", f"providers/{path}", request)

@app.api_route("/requests", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_requests_root(request: Request):
    """Proxy direto para solicitações (root)"""
    return await proxy_request("requests", "requests", request)

@app.api_route("/requests/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_requests_direct(path: str, request: Request):
    """Proxy direto para solicitações (compatibilidade)"""
    return await proxy_request("requests", f"requests/{path}", request)

@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_auth_direct(path: str, request: Request):
    """Proxy direto para autenticação (compatibilidade)"""
    return await proxy_request("auth", f"auth/{path}", request)

async def proxy_request(service_name: str, path: str, request: Request):
    """Função genérica para fazer proxy das requisições"""
    service_url = SERVICES.get(service_name)
    if not service_url:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    
    # Constrói a URL completa
    target_url = f"{service_url}/{path}"
    
    # Adiciona query parameters se existirem
    if request.query_params:
        target_url += f"?{request.query_params}"
    
    # Prepara headers (remove alguns headers problemáticos)
    headers = dict(request.headers)
    headers_to_remove = ["host", "content-length", "content-encoding"]
    for header in headers_to_remove:
        headers.pop(header, None)
    
    try:
        # Faz a requisição
        response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=await request.body(),
            timeout=30.0
        )
        
        # Retorna a resposta
        response_headers = dict(response.headers)
        # Remove headers problemáticos da resposta
        response_headers.pop("content-encoding", None)
        response_headers.pop("transfer-encoding", None)
        
        return JSONResponse(
            content=response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
            status_code=response.status_code,
            headers=response_headers
        )
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Service {service_name} timeout")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail=f"Service {service_name} unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error proxying to {service_name}: {str(e)}")

# --- Socket.io Events ---

@sio.event
async def connect(sid, environ, auth):
    """Evento de conexão do Socket.io"""
    print(f"🔌 [SOCKET] Cliente conectado: {sid}")
    await sio.save_session(sid, {
        "user_id": auth.get("user_id") if auth else None,
        "user_type": auth.get("user_type") if auth else None,
    })
    await sio.emit('presence', {"sid": sid, "status": "online"}, to=sid)

@sio.event
async def disconnect(sid):
    """Evento de desconexão do Socket.io"""
    print(f"🔌 [SOCKET] Cliente desconectado: {sid}")
    sess = await sio.get_session(sid)
    await sio.emit('presence', {"sid": sid, "status": "offline", "user_id": sess.get("user_id")})

@sio.event
async def chat_message(sid, data):
    """Evento de mensagem de chat"""
    await sio.emit('chat_message', {"from": sid, **(data or {})})

@sio.event
async def join_request_room(sid, data):
    """Evento para entrar em sala de solicitação"""
    request_id = (data or {}).get('request_id') or (data or {}).get('requestId')
    if request_id:
        await sio.enter_room(sid, f"req:{request_id}")
        await sio.emit('room_joined', {"room": f"req:{request_id}"}, to=sid)

@sio.event
async def leave_request_room(sid, data):
    """Evento para sair de sala de solicitação"""
    request_id = (data or {}).get('request_id') or (data or {}).get('requestId')
    if request_id:
        await sio.leave_room(sid, f"req:{request_id}")
        await sio.emit('room_left', {"room": f"req:{request_id}"}, to=sid)

@sio.event
async def send_request_message(sid, data):
    """Evento para enviar mensagem de solicitação"""
    request_id = (data or {}).get('request_id') or (data or {}).get('requestId')
    message = (data or {}).get('message')
    if request_id and message:
        await sio.emit('request_message', {"from": sid, "message": message}, room=f"req:{request_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)
