from fastapi import FastAPI, HTTPException, Header, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from aiokafka import AIOKafkaProducer
import os, asyncio
from datetime import datetime
from dotenv import load_dotenv

from common.kafka import make_producer
from common.events import (
    TOPIC_REQ_LIFECYCLE,
    EV_REQUEST_CREATED,
    EV_REQUEST_ACCEPTED,
    EV_STATUS_CHANGED,
)
from common import (
    PaginationParams,
    apply_pagination,
    SortParams,
    apply_sort,
    build_filters,
    IdempotencyKey,
)
from common.idempotency import ensure_idempotency, store_idempotent_result
from common.ratelimit import RateLimiter
from common.rbac import require_roles
from firebase_service.firebase_client import firebase_client

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
REQ_TOPIC = os.getenv("TOPIC_REQUESTS", "service.requests")
LIFECYCLE_TOPIC = os.getenv("TOPIC_REQ_LIFECYCLE", TOPIC_REQ_LIFECYCLE)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="request-service-firebase")
producer: Optional[AIOKafkaProducer] = None
rate_limiter = RateLimiter(max_requests=60, window_seconds=60)

class ServiceRequest(BaseModel):
    id: str
    client_id: str
    provider_id: Optional[str] = None
    category: str
    description: str = ""
    address: str = ""
    client_latitude: float
    client_longitude: float
    price: Optional[float] = None
    status: str = "pending"
    provider_name: Optional[str] = None
    provider_rating: Optional[float] = None

class StatusUpdate(BaseModel):
    status: str

class AcceptPayload(BaseModel):
    provider_id: str

class OfferData(BaseModel):
    price: float
    message: Optional[str] = None
    estimated_time: Optional[int] = None  # em minutos

@app.on_event("startup")
async def start():
    global producer
    producer = await make_producer()

@app.on_event("shutdown")
async def stop():
    if producer:
        await producer.stop()
    client.close()

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"request-firebase"}

@app.post("/requests", response_model=ServiceRequest)
async def create_request(
    req: ServiceRequest,
    request: Request,
    idempotency_key: str | None = Header(None, alias=IdempotencyKey.header_name),
    user=Depends(require_roles([2])),
):
    """Cria uma nova solicitação de serviço"""
    rl_key = request.headers.get("X-Rate-Limit-Key") or request.client.host
    if not rate_limiter.allow(f"create_request:{rl_key}"):
        raise HTTPException(status_code=429, detail="rate limit exceeded")

    cached = ensure_idempotency(idempotency_key)
    if cached is not None:
        return cached

    try:
        # Salvar no MongoDB
        await db.requests.insert_one(req.dict())
        
        # Salvar no Firebase Realtime Database
        firebase_data = {
            'id': req.id,
            'clientId': req.client_id,
            'category': req.category,
            'description': req.description,
            'address': req.address,
            'clientLatitude': req.client_latitude,
            'clientLongitude': req.client_longitude,
            'price': req.price,
            'status': req.status,
            'providerId': req.provider_id,
            'providerName': req.provider_name,
            'providerRating': req.provider_rating
        }
        
        await firebase_client.create_request(firebase_data)
        
        # Publicar eventos no Kafka
        if producer:
            await asyncio.gather(
                producer.send_and_wait(REQ_TOPIC, req.dict()),
                producer.send_and_wait(
                    LIFECYCLE_TOPIC,
                    {
                        "type": EV_REQUEST_CREATED,
                        "request_id": req.id,
                        "client_id": req.client_id,
                    },
                ),
            )
        
        store_idempotent_result(idempotency_key, req)
        return req
        
    except Exception as e:
        print(f"❌ [REQUEST] Erro ao criar solicitação: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/requests/{request_id}/status")
async def update_request_status(
    request_id: str,
    data: StatusUpdate,
    idempotency_key: str | None = Header(None, alias=IdempotencyKey.header_name),
    user=Depends(require_roles([1,2])),
):
    """Atualiza o status de uma solicitação"""
    cached = ensure_idempotency(idempotency_key)
    if cached is not None:
        return cached

    try:
        # Atualizar no MongoDB
        res = await db.requests.update_one(
            {"id": request_id},
            {"$set": {"status": data.status, "updated_at": datetime.utcnow()}}
        )
        
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="request not found")
        
        # Atualizar no Firebase
        await firebase_client.update_request_status(request_id, data.status)
        
        # Publicar evento no Kafka
        if producer:
            await producer.send_and_wait(
                LIFECYCLE_TOPIC,
                {
                    "type": EV_STATUS_CHANGED,
                    "request_id": request_id,
                    "status": data.status,
                },
            )
        
        result = {"status": data.status}
        store_idempotent_result(idempotency_key, result)
        return result
        
    except Exception as e:
        print(f"❌ [REQUEST] Erro ao atualizar status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/requests/{request_id}/accept")
async def accept_request(
    request_id: str,
    provider_data: dict,
    user=Depends(require_roles([1]))  # Apenas prestadores
):
    """Prestador aceita uma solicitação"""
    try:
        provider_id = provider_data.get('provider_id')
        user_id = user.get('sub')

        print(f"✅ [REQUEST] Prestador {user_id} aceitando solicitação {request_id}")

        # Verificar se a solicitação existe e está disponível
        request_doc = await db.requests.find_one({"id": request_id})
        if not request_doc:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")

        if request_doc.get('status') != 'offered':
            raise HTTPException(status_code=400, detail="Solicitação não está disponível para aceitar")

        # Atualizar no MongoDB
        await db.requests.update_one(
            {"id": request_id},
            {
                "$set": {
                    "status": "accepted",
                    "provider_id": provider_id,
                    "accepted_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )

        # Atualizar no Firebase
        await firebase_client.update_request_status(
            request_id, 
            "accepted", 
            {"assignedProvider": provider_id}
        )

        # Marcar prestador como ocupado
        await db.providers.update_many(
            {"user_id": user_id},
            {"$set": {"status": "busy"}}
        )

        # Salvar decisão do prestador
        decision_doc = {
            "id": f"decision_{request_id}_{user_id}",
            "request_id": request_id,
            "provider_id": provider_id,
            "user_id": user_id,
            "decision": "accepted",
            "decided_at": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        await db.provider_decisions.insert_one(decision_doc)

        print(f"✅ [REQUEST] Solicitação {request_id} aceita por {user_id}")

        return {
            "status": "success",
            "request_id": request_id,
            "provider_id": provider_id,
            "decision": "accepted"
        }

    except Exception as e:
        print(f"❌ [REQUEST] Erro ao aceitar solicitação: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/requests/{request_id}/decline")
async def decline_request(
    request_id: str,
    provider_data: dict,
    user=Depends(require_roles([1]))  # Apenas prestadores
):
    """Prestador recusa uma solicitação"""
    try:
        provider_id = provider_data.get('provider_id')
        user_id = user.get('sub')
        reason = provider_data.get('reason', 'Não especificado')

        print(f"❌ [REQUEST] Prestador {user_id} recusando solicitação {request_id}")

        # Verificar se a solicitação existe
        request_doc = await db.requests.find_one({"id": request_id})
        if not request_doc:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")

        # Liberar prestador
        await db.providers.update_many(
            {"user_id": user_id, "is_online": True},
            {"$set": {"status": "available"}}
        )

        # Salvar decisão do prestador
        decision_doc = {
            "id": f"decision_{request_id}_{user_id}",
            "request_id": request_id,
            "provider_id": provider_id,
            "user_id": user_id,
            "decision": "declined",
            "reason": reason,
            "decided_at": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        await db.provider_decisions.insert_one(decision_doc)

        print(f"❌ [REQUEST] Solicitação {request_id} recusada por {user_id}")

        return {
            "status": "success",
            "request_id": request_id,
            "provider_id": provider_id,
            "decision": "declined",
            "reason": reason
        }

    except Exception as e:
        print(f"❌ [REQUEST] Erro ao recusar solicitação: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/requests/{request_id}/offer")
async def create_offer(
    request_id: str,
    offer_data: OfferData,
    user=Depends(require_roles([1]))  # Apenas prestadores
):
    """Prestador cria uma oferta para uma solicitação"""
    try:
        user_id = user.get('sub')
        provider_id = f"provider_{user_id}"

        print(f"💼 [REQUEST] Prestador {user_id} criando oferta para {request_id}")

        # Verificar se a solicitação existe
        request_doc = await db.requests.find_one({"id": request_id})
        if not request_doc:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")

        # Criar oferta no Firebase
        firebase_offer_data = {
            'price': offer_data.price,
            'message': offer_data.message,
            'estimatedTime': offer_data.estimated_time
        }
        
        await firebase_client.create_offer(provider_id, request_id, firebase_offer_data)

        # Atualizar status da solicitação para "offered"
        await db.requests.update_one(
            {"id": request_id},
            {
                "$set": {
                    "status": "offered",
                    "provider_id": provider_id,
                    "price": offer_data.price,
                    "offered_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )

        # Atualizar no Firebase
        await firebase_client.update_request_status(
            request_id, 
            "offered", 
            {
                "assignedProvider": provider_id,
                "price": offer_data.price,
                "providerName": f"Prestador {user_id}",
                "providerRating": 4.5  # Mock rating
            }
        )

        print(f"💼 [REQUEST] Oferta criada para {request_id}")

        return {
            "status": "success",
            "request_id": request_id,
            "provider_id": provider_id,
            "offer": offer_data.dict()
        }

    except Exception as e:
        print(f"❌ [REQUEST] Erro ao criar oferta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/requests/{request_id}/client-accept")
async def client_accept_offer(
    request_id: str,
    user=Depends(require_roles([2]))  # Apenas clientes
):
    """Cliente aceita uma oferta de prestador"""
    try:
        user_id = user.get('sub')
        print(f"✅ [REQUEST] Cliente {user_id} aceitando oferta para solicitação {request_id}")

        # Verificar se a solicitação existe e pertence ao cliente
        request_doc = await db.requests.find_one({"id": request_id, "client_id": user_id})
        if not request_doc:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")

        if request_doc.get('status') != 'offered':
            raise HTTPException(status_code=400, detail="Não há oferta disponível para aceitar")

        # Atualizar no MongoDB
        await db.requests.update_one(
            {"id": request_id},
            {
                "$set": {
                    "status": "accepted",
                    "client_accepted_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )

        # Atualizar no Firebase
        await firebase_client.update_request_status(request_id, "accepted")

        print(f"✅ [REQUEST] Oferta aceita pelo cliente {user_id} para solicitação {request_id}")

        return {
            "status": "success",
            "request_id": request_id,
            "message": "Oferta aceita com sucesso"
        }

    except Exception as e:
        print(f"❌ [REQUEST] Erro ao aceitar oferta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/requests/{request_id}/client-decline")
async def client_decline_offer(
    request_id: str,
    user=Depends(require_roles([2]))  # Apenas clientes
):
    """Cliente recusa uma oferta e busca outro prestador"""
    try:
        user_id = user.get('sub')
        print(f"🔄 [REQUEST] Cliente {user_id} recusando oferta para solicitação {request_id}")

        # Verificar se a solicitação existe e pertence ao cliente
        request_doc = await db.requests.find_one({"id": request_id, "client_id": user_id})
        if not request_doc:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada")

        if request_doc.get('status') != 'offered':
            raise HTTPException(status_code=400, detail="Não há oferta disponível para recusar")

        # Resetar a solicitação para buscar outro prestador
        await db.requests.update_one(
            {"id": request_id},
            {
                "$set": {
                    "status": "pending",
                    "provider_id": None,
                    "client_declined_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                "$unset": {
                    "offered_at": "",
                    "price": ""
                }
            }
        )

        # Atualizar no Firebase
        await firebase_client.update_request_status(
            request_id, 
            "pending", 
            {
                "assignedProvider": None,
                "price": None,
                "providerName": None,
                "providerRating": None
            }
        )

        # Adicionar o prestador recusado à lista de excluídos
        declined_provider = request_doc.get('provider_id')
        if declined_provider:
            await db.requests.update_one(
                {"id": request_id},
                {
                    "$addToSet": {
                        "declined_providers": declined_provider
                    }
                }
            )

        print(f"🔄 [REQUEST] Solicitação {request_id} resetada para buscar outro prestador")

        return {
            "status": "success",
            "request_id": request_id,
            "message": "Oferta recusada, buscando outro prestador"
        }

    except Exception as e:
        print(f"❌ [REQUEST] Erro ao recusar oferta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/requests", response_model=List[ServiceRequest])
async def list_requests(
    client_id: Optional[str] = None,
    provider_id: Optional[str] = None,
    status: Optional[str] = None,
    pagination: PaginationParams = PaginationParams(),
    sorting: SortParams = SortParams(),
    user=Depends(require_roles([1,2,3])),
):
    """Lista solicitações com filtros"""
    params = {
        "client_id": client_id,
        "provider_id": provider_id,
        "status": status,
    }
    query = build_filters(params, ["client_id", "provider_id", "status"])
    cur = db.requests.find(query, {"_id":0})
    cur = apply_sort(cur, sorting)
    cur = apply_pagination(cur, pagination)
    return [doc async for doc in cur]

@app.get("/providers/{user_id}/decisions")
async def get_provider_decisions(
    user_id: str,
    user=Depends(require_roles([1]))  # Apenas prestadores
):
    """Obter histórico de decisões do prestador"""
    try:
        decisions_cursor = db.provider_decisions.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("decided_at", -1).limit(50)

        decisions = await decisions_cursor.to_list(length=50)

        return {
            "status": "success",
            "decisions": decisions,
            "total": len(decisions)
        }

    except Exception as e:
        print(f"❌ [REQUEST] Erro ao obter decisões: {e}")
        raise HTTPException(status_code=500, detail=str(e))
