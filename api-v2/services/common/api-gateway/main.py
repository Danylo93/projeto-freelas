from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from dotenv import load_dotenv
import asyncio
from typing import Optional
from websocket_handler import websocket_endpoint, manager
import sys
from pathlib import Path
import math
import time

# Adicionar o diretório comum ao path
BASE_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = BASE_DIR.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

try:
    from common.kafka import make_consumer_with_retry
    from common.events import TOPIC_REQ_LIFECYCLE, EV_REQUEST_CREATED, EV_REQUEST_ACCEPTED, EV_REQUEST_OFFERED
    KAFKA_AVAILABLE = True
    print("✅ [API-GATEWAY] Kafka imports bem-sucedidos")
except ImportError as e:
    print(f"⚠️ [API-GATEWAY] Kafka não disponível: {e}")
    KAFKA_AVAILABLE = False
    TOPIC_REQ_LIFECYCLE = None
    EV_REQUEST_CREATED = None
    EV_REQUEST_ACCEPTED = None
    EV_REQUEST_OFFERED = None

load_dotenv()

app = FastAPI(title="API Gateway", version="1.0.0")

# WebSocket nativo implementado via websocket_handler.py

# Configuração dos serviços
SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8014"),
    "providers": os.getenv("PROVIDER_SERVICE_URL", "http://provider-service:8011"),
    "requests": os.getenv("REQUEST_SERVICE_URL", "http://request-service:8012"),
    "matching": os.getenv("MATCHING_SERVICE_URL", "http://matching-service:8013"),
    "payments": os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8016"),
    "admin": os.getenv("ADMIN_SERVICE_URL", "http://admin-service:8017"),
    "socket": os.getenv("SOCKET_SERVICE_URL", "http://socket-gateway:8015"),
    "notifications": os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8016"),
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

# Variáveis globais para Kafka
consumer_lifecycle = None

@app.on_event("startup")
async def startup():
    """Inicializa o cliente HTTP e Kafka"""
    global consumer_lifecycle

    print(f"🚀 [API-GATEWAY] Iniciando startup...")
    print(f"🚀 [API-GATEWAY] KAFKA_AVAILABLE: {KAFKA_AVAILABLE}")
    if KAFKA_AVAILABLE:
        print(f"🚀 [API-GATEWAY] TOPIC_REQ_LIFECYCLE: {TOPIC_REQ_LIFECYCLE}")
    else:
        print(f"🚀 [API-GATEWAY] Kafka não disponível, pulando configuração")

    if KAFKA_AVAILABLE:
        try:
            print(f"🔄 [API-GATEWAY] Criando consumer para tópico: {TOPIC_REQ_LIFECYCLE}")
            consumer_lifecycle = await make_consumer_with_retry(
                TOPIC_REQ_LIFECYCLE,
                group_id="api-gateway",
            )
            print(f"✅ [API-GATEWAY] Consumer criado com sucesso")

            print(f"🔄 [API-GATEWAY] Iniciando task de consumo...")
            asyncio.create_task(consume_lifecycle_events())
            print("✅ [API-GATEWAY] Kafka consumer iniciado")
        except Exception as e:
            print(f"❌ [API-GATEWAY] Erro ao iniciar Kafka: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"⚠️ [API-GATEWAY] Kafka não disponível, pulando inicialização")

@app.on_event("shutdown")
async def shutdown():
    """Fecha o cliente HTTP e Kafka"""
    await http_client.aclose()

    if consumer_lifecycle:
        await consumer_lifecycle.stop()
        print("✅ [API-GATEWAY] Kafka consumer parado")

@app.get("/healthz")
async def health():
    """Health check do gateway"""
    return {"status": "ok", "service": "api-gateway"}

@app.get("/notifications/poll")
async def poll_notifications():
    """Endpoint para polling de notificações"""
    return {"notifications": [], "message": "Polling funcionando", "timestamp": 1234567890}

@app.post("/test/notification")
async def test_notification(data: dict):
    """Endpoint para testar notificações manualmente via WebSocket"""
    provider_user_id = data.get("provider_user_id")
    notification_data = data.get("notification_data", {})

    if not provider_user_id:
        return {"error": "provider_user_id é obrigatório"}

    print(f"🧪 [TEST] Enviando notificação de teste para prestador: {provider_user_id}")
    print(f"🧪 [TEST] Dados: {notification_data}")

    try:
        # Enviar via WebSocket nativo
        success = await manager.send_personal_message({
            'type': 'new_request',
            **notification_data
        }, provider_user_id)
        
        if success:
            print(f"✅ [TEST] Notificação enviada com sucesso")
            return {
                "status": "success",
                "message": f"Notificação enviada para prestador {provider_user_id}",
                "data": notification_data
            }
        else:
            return {"error": "Prestador não conectado"}
    except Exception as e:
        print(f"❌ [TEST] Erro ao enviar notificação: {e}")
        return {"error": str(e)}

@app.post("/test/kafka-event")
async def test_kafka_event(data: dict):
    """Endpoint para simular um evento Kafka manualmente"""
    print(f"🧪 [TEST] Simulando evento Kafka: {data}")

    try:
        await handle_lifecycle_event(data)
        return {
            "status": "success",
            "message": "Evento processado com sucesso",
            "data": data
        }
    except Exception as e:
        print(f"❌ [TEST] Erro ao processar evento: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.get("/test/kafka-status")
async def test_kafka_status():
    """Endpoint para verificar status do Kafka"""
    return {
        "kafka_available": KAFKA_AVAILABLE,
        "consumer_lifecycle": consumer_lifecycle is not None,
        "topic": TOPIC_REQ_LIFECYCLE if KAFKA_AVAILABLE else None,
        "events": {
            "EV_REQUEST_CREATED": EV_REQUEST_CREATED if KAFKA_AVAILABLE else None,
            "EV_REQUEST_OFFERED": EV_REQUEST_OFFERED if KAFKA_AVAILABLE else None,
        }
    }

@app.post("/test/send-notification")
async def test_send_notification(data: dict):
    """Endpoint para enviar notificação diretamente para um prestador"""
    provider_user_id = data.get("provider_user_id")
    request_id = data.get("request_id")

    if not provider_user_id or not request_id:
        return {"error": "provider_user_id e request_id são obrigatórios"}

    try:
        # Buscar dados da solicitação
        req_response = await http_client.get(f"{SERVICES['requests']}/requests?id={request_id}")
        if req_response.status_code != 200:
            return {"error": f"Solicitação {request_id} não encontrada"}

        requests = req_response.json()
        if not requests:
            return {"error": f"Solicitação {request_id} não encontrada"}

        request_data = requests[0]

        # Buscar dados do cliente
        client_id = request_data.get('client_id')
        client_response = await http_client.get(f"{SERVICES['auth']}/auth/users/{client_id}")
        client_name = "Cliente"
        if client_response.status_code == 200:
            client_data = client_response.json()
            client_name = client_data.get('name', 'Cliente')

        # Preparar dados da notificação
        notification_data = {
            'request_id': request_id,
            'client_id': client_id,
            'client_name': client_name,
            'category': request_data.get('category'),
            'description': request_data.get('description'),
            'price': request_data.get('price'),
            'client_latitude': request_data.get('client_latitude'),
            'client_longitude': request_data.get('client_longitude'),
            'urgency': 'high',
            'timestamp': request_data.get('created_at', 'agora')
        }

        # Enviar via WebSocket nativo
        success = await manager.send_personal_message({
            'type': 'new_request',
            **notification_data
        }, provider_user_id)

        if success:
            print(f"🔔 [TEST] Notificação enviada para prestador {provider_user_id}")
            print(f"🔔 [TEST] Dados: {notification_data}")

            return {
                "status": "success",
                "message": f"Notificação enviada para prestador {provider_user_id}",
                "notification_data": notification_data
            }
        else:
            return {"error": "Prestador não conectado"}

    except Exception as e:
        print(f"❌ [TEST] Erro ao enviar notificação: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.get("/ws")
async def websocket_info():
    """Informações sobre o endpoint WebSocket"""
    return {
        "message": "Este é um endpoint WebSocket. Use ws:// ou wss:// para conectar.",
        "endpoint": "/ws",
        "protocol": "WebSocket",
        "parameters": {
            "user_id": "ID do usuário",
            "user_type": "Tipo do usuário (1=prestador, 2=cliente)",
            "token": "Token JWT de autenticação"
        },
        "example": "ws://localhost:8000/ws?user_id=123&user_type=1&token=jwt_token",
        "ngrok_compatible": True,
        "cors_enabled": True
    }

@app.options("/ws")
async def websocket_options():
    """CORS preflight para WebSocket"""
    return JSONResponse(
        content={"message": "WebSocket endpoint ready"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400"
        }
    )

@app.websocket("/ws")
async def websocket_route(websocket: WebSocket, user_id: str = None, user_type: int = None, token: str = None):
    """Endpoint WebSocket para comunicação em tempo real"""
    # Extrair parâmetros da query string
    query_params = websocket.query_params
    user_id = query_params.get("user_id") or user_id
    user_type = int(query_params.get("user_type", 0)) or user_type
    token = query_params.get("token") or token
    
    print(f"🔌 [WS] Tentativa de conexão WebSocket:")
    print(f"🔌 [WS] User ID: {user_id}")
    print(f"🔌 [WS] User Type: {user_type}")
    print(f"🔌 [WS] Token: {'Presente' if token else 'Ausente'}")
    
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

@app.post("/requests/{request_id}/accept")
async def accept_request(request_id: str, request: Request):
    """Aceitar solicitação - proxy para request-service"""
    return await proxy_request("requests", f"requests/{request_id}/accept", request)

@app.post("/requests/{request_id}/decline")
async def decline_request(request_id: str, request: Request):
    """Recusar solicitação - proxy para request-service"""
    return await proxy_request("requests", f"requests/{request_id}/decline", request)

@app.post("/requests/{request_id}/client-accept")
async def client_accept_offer(request_id: str, request: Request):
    """Cliente aceita oferta - proxy para request-service"""
    return await proxy_request("requests", f"requests/{request_id}/client-accept", request)

@app.post("/requests/{request_id}/client-decline")
async def client_decline_offer(request_id: str, request: Request):
    """Cliente recusa oferta - proxy para request-service"""
    return await proxy_request("requests", f"requests/{request_id}/client-decline", request)

# Histórico de serviços - deve vir antes das rotas genéricas
@app.get("/history/services")
async def get_service_history(request: Request):
    """Obter histórico de serviços - proxy para request-service"""
    # Redirecionar para o endpoint de requests com filtros de histórico
    return await proxy_request("requests", "requests", request)

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

# --- WebSocket Events ---
# Eventos WebSocket são gerenciados pelo websocket_handler.py

# --- Kafka Event Handlers ---

async def consume_lifecycle_events():
    """Consome eventos de lifecycle do Kafka e emite para clientes"""
    print(f"🔄 [API-GATEWAY] Iniciando consume_lifecycle_events...")

    if not consumer_lifecycle:
        print(f"❌ [API-GATEWAY] consumer_lifecycle é None!")
        return

    print(f"✅ [API-GATEWAY] Consumer disponível, iniciando loop de consumo...")
    try:
        async for msg in consumer_lifecycle:
            print(f"📨 [API-GATEWAY] Mensagem recebida: {msg.value}")
            await handle_lifecycle_event(msg.value)
    except Exception as e:
        print(f"❌ [API-GATEWAY] Erro no consumer Kafka: {e}")
        import traceback
        traceback.print_exc()

async def handle_lifecycle_event(data):
    """Processa eventos de lifecycle e emite eventos específicos"""
    event_type = data.get('type')

    print(f"🔔 [API-GATEWAY] Evento lifecycle recebido: {event_type} - {data}")

    if event_type == EV_REQUEST_CREATED:
        # Quando uma solicitação é criada, notificar prestadores próximos
        await notify_providers_for_request(data)
    elif event_type == EV_REQUEST_ACCEPTED:
        # Quando uma solicitação é aceita, notificar o cliente
        await notify_client_request_accepted(data)
    elif event_type == EV_REQUEST_OFFERED:
        # Quando uma oferta é feita, notificar o cliente
        await notify_client_offer_received(data)

    # Emitir o evento original também via WebSocket
    await manager.broadcast_message({
        'type': 'lifecycle',
        **data
    })

async def notify_providers_for_request(data):
    """Notifica prestadores próximos sobre nova solicitação"""
    request_id = data.get('request_id')
    client_id = data.get('client_id')

    if not request_id:
        return

    try:
        # Buscar detalhes da solicitação
        req_response = await http_client.get(f"{SERVICES['requests']}/requests?id={request_id}")
        if req_response.status_code != 200:
            print(f"❌ [API-GATEWAY] Erro ao buscar solicitação {request_id}")
            return

        requests = req_response.json()
        if not requests:
            print(f"❌ [API-GATEWAY] Solicitação {request_id} não encontrada")
            return

        request_data = requests[0]

        # Buscar prestadores próximos da categoria
        prov_response = await http_client.get(f"{SERVICES['providers']}/providers?category={request_data.get('category')}&status=available")
        if prov_response.status_code != 200:
            print(f"❌ [API-GATEWAY] Erro ao buscar prestadores")
            return

        providers = prov_response.json()

        # Buscar dados do cliente
        client_response = await http_client.get(f"{SERVICES['auth']}/auth/users/{client_id}")
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

                # Enviar via WebSocket nativo
                success = await manager.send_personal_message({
                    'type': 'new_request',
                    **notification_data
                }, provider_id)
                
                if success:
                    print(f"🔔 [API-GATEWAY] Notificação enviada para prestador {provider_id}")
                else:
                    print(f"⚠️ [API-GATEWAY] Prestador {provider_id} não conectado")

    except Exception as e:
        print(f"❌ [API-GATEWAY] Erro ao notificar prestadores: {e}")

async def notify_client_request_accepted(data):
    """Notifica cliente que solicitação foi aceita"""
    client_id = data.get('client_id')
    if client_id:
        await manager.send_personal_message({
            'type': 'request_accepted',
            **data
        }, client_id)

async def notify_client_offer_received(data):
    """Notifica cliente que recebeu uma oferta"""
    request_id = data.get('request_id')
    if request_id:
        # Buscar dados da solicitação para obter client_id
        try:
            response = await http_client.get(f"{SERVICES['requests']}/requests?id={request_id}")
            if response.status_code == 200:
                requests = response.json()
                if requests:
                    client_id = requests[0].get('client_id')
                    if client_id:
                        await manager.send_personal_message({
                            'type': 'offer_received',
                            **data
                        }, client_id)
        except Exception as e:
            print(f"❌ [API-GATEWAY] Erro ao notificar cliente: {e}")

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calcula distância entre dois pontos em km"""
    R = 6371  # Raio da Terra em km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# WebSocket nativo implementado - não há mais proxy para Socket.IO

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
