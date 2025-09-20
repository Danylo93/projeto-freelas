from fastapi import FastAPI, HTTPException, Header, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from aiokafka import AIOKafkaProducer
import os, asyncio
from datetime import datetime
from dotenv import load_dotenv
import uuid

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
import sys
sys.path.append('/app/firebase-service')
from firebase_client import firebase_client

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
REQ_TOPIC = os.getenv("TOPIC_REQUESTS", "service.requests")
LIFECYCLE_TOPIC = os.getenv("TOPIC_REQ_LIFECYCLE", TOPIC_REQ_LIFECYCLE)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="request-service-optimized")
producer: Optional[AIOKafkaProducer] = None
rate_limiter = RateLimiter(max_requests=60, window_seconds=60)

# Modelos integrados
class ServiceRequest(BaseModel):
    id: str
    client_id: str
    provider_id: Optional[str] = None
    category: str
    description: str = ""
    address: str
    client_latitude: float
    client_longitude: float
    provider_latitude: Optional[float] = None
    provider_longitude: Optional[float] = None
    price: float
    status: str = "pending"  # pending, offered, accepted, en_route, arrived, started, completed, cancelled
    created_at: datetime
    updated_at: datetime
    estimated_duration: Optional[int] = None  # em minutos
    distance: Optional[float] = None  # em km
    rating: Optional[float] = None  # rating do serviço (1-5)
    payment_status: str = "pending"  # pending, paid, refunded
    payment_method: Optional[str] = None  # credit_card, pix, cash

class RequestCreate(BaseModel):
    client_id: str
    category: str
    description: str
    address: str
    client_latitude: float
    client_longitude: float
    price: float
    estimated_duration: Optional[int] = None

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    provider_id: Optional[str] = None
    provider_latitude: Optional[float] = None
    provider_longitude: Optional[float] = None
    estimated_duration: Optional[int] = None
    distance: Optional[float] = None
    rating: Optional[float] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None

class RequestOffer(BaseModel):
    provider_id: str
    price: float
    estimated_duration: int
    message: Optional[str] = None

class PaymentInfo(BaseModel):
    payment_method: str
    amount: float
    currency: str = "BRL"
    description: str

# Inicialização
@app.on_event("startup")
async def startup_event():
    global producer
    producer = await make_producer()
    await firebase_client.initialize()

@app.on_event("shutdown")
async def shutdown_event():
    if producer:
        await producer.stop()
    await firebase_client.cleanup()

# Endpoints principais
@app.post("/requests", response_model=ServiceRequest)
async def create_request(
    request: RequestCreate,
    authorization: str = Header(None)
):
    """Criar nova solicitação de serviço"""
    await rate_limiter.check_rate_limit(authorization)
    
    request_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    service_request = ServiceRequest(
        id=request_id,
        client_id=request.client_id,
        category=request.category,
        description=request.description,
        address=request.address,
        client_latitude=request.client_latitude,
        client_longitude=request.client_longitude,
        price=request.price,
        status="pending",
        created_at=now,
        updated_at=now,
        estimated_duration=request.estimated_duration
    )
    
    # Salvar no MongoDB
    await db.requests.insert_one(service_request.dict())
    
    # Salvar no Firebase para tempo real
    await firebase_client.create_request(request_id, service_request.dict())
    
    # Publicar evento Kafka
    await producer.send(
        LIFECYCLE_TOPIC,
        {
            "event": EV_REQUEST_CREATED,
            "request_id": request_id,
            "client_id": request.client_id,
            "category": request.category,
            "price": request.price,
            "location": {
                "lat": request.client_latitude,
                "lng": request.client_longitude
            },
            "timestamp": now.isoformat()
        }
    )
    
    return service_request

@app.get("/requests", response_model=List[ServiceRequest])
async def list_requests(
    client_id: Optional[str] = None,
    provider_id: Optional[str] = None,
    status: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends()
):
    """Listar solicitações com filtros"""
    filters = build_filters({
        "client_id": client_id,
        "provider_id": provider_id,
        "status": status
    })
    
    cursor = db.requests.find(filters)
    cursor = apply_sort(cursor, sort)
    cursor = apply_pagination(cursor, pagination)
    
    requests = []
    async for doc in cursor:
        requests.append(ServiceRequest(**doc))
    
    return requests

@app.get("/requests/{request_id}", response_model=ServiceRequest)
async def get_request(request_id: str):
    """Obter solicitação específica"""
    doc = await db.requests.find_one({"id": request_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return ServiceRequest(**doc)

@app.put("/requests/{request_id}", response_model=ServiceRequest)
async def update_request(
    request_id: str,
    update: RequestUpdate,
    authorization: str = Header(None)
):
    """Atualizar solicitação"""
    await rate_limiter.check_rate_limit(authorization)
    
    update_data = update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Atualizar no Firebase
    await firebase_client.update_request(request_id, update_data)
    
    # Publicar evento de mudança de status
    if "status" in update_data:
        await producer.send(
            LIFECYCLE_TOPIC,
            {
                "event": EV_STATUS_CHANGED,
                "request_id": request_id,
                "status": update_data["status"],
                "timestamp": update_data["updated_at"].isoformat()
            }
        )
    
    # Retornar solicitação atualizada
    doc = await db.requests.find_one({"id": request_id})
    return ServiceRequest(**doc)

@app.post("/requests/{request_id}/offers")
async def create_offer(
    request_id: str,
    offer: RequestOffer,
    authorization: str = Header(None)
):
    """Criar oferta para uma solicitação"""
    await rate_limiter.check_rate_limit(authorization)
    
    # Verificar se a solicitação existe e está pendente
    request_doc = await db.requests.find_one({"id": request_id})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request_doc["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is not available for offers")
    
    offer_data = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "provider_id": offer.provider_id,
        "price": offer.price,
        "estimated_duration": offer.estimated_duration,
        "message": offer.message,
        "created_at": datetime.utcnow(),
        "status": "pending"
    }
    
    # Salvar oferta
    await db.offers.insert_one(offer_data)
    
    # Atualizar status da solicitação
    await db.requests.update_one(
        {"id": request_id},
        {"$set": {"status": "offered", "updated_at": datetime.utcnow()}}
    )
    
    # Atualizar no Firebase
    await firebase_client.update_request(request_id, {"status": "offered"})
    
    # Publicar evento
    await producer.send(
        LIFECYCLE_TOPIC,
        {
            "event": EV_REQUEST_OFFERED,
            "request_id": request_id,
            "provider_id": offer.provider_id,
            "price": offer.price,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    return {"message": "Offer created successfully", "offer_id": offer_data["id"]}

@app.post("/requests/{request_id}/accept")
async def accept_request(
    request_id: str,
    provider_id: str,
    authorization: str = Header(None)
):
    """Aceitar solicitação"""
    await rate_limiter.check_rate_limit(authorization)
    
    # Atualizar solicitação
    result = await db.requests.update_one(
        {"id": request_id},
        {
            "$set": {
                "provider_id": provider_id,
                "status": "accepted",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Atualizar no Firebase
    await firebase_client.update_request(request_id, {
        "provider_id": provider_id,
        "status": "accepted"
    })
    
    # Publicar evento
    await producer.send(
        LIFECYCLE_TOPIC,
        {
            "event": EV_REQUEST_ACCEPTED,
            "request_id": request_id,
            "provider_id": provider_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    return {"message": "Request accepted successfully"}

@app.post("/requests/{request_id}/rate")
async def rate_request(
    request_id: str,
    rating: float,
    authorization: str = Header(None)
):
    """Avaliar solicitação (1-5 estrelas)"""
    await rate_limiter.check_rate_limit(authorization)
    
    if not 1.0 <= rating <= 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0")
    
    result = await db.requests.update_one(
        {"id": request_id},
        {
            "$set": {
                "rating": rating,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Atualizar no Firebase
    await firebase_client.update_request(request_id, {"rating": rating})
    
    return {"message": "Rating submitted successfully"}

@app.post("/requests/{request_id}/payment")
async def process_payment(
    request_id: str,
    payment: PaymentInfo,
    authorization: str = Header(None)
):
    """Processar pagamento"""
    await rate_limiter.check_rate_limit(authorization)
    
    # Simular processamento de pagamento
    payment_id = str(uuid.uuid4())
    
    # Atualizar status de pagamento
    result = await db.requests.update_one(
        {"id": request_id},
        {
            "$set": {
                "payment_status": "paid",
                "payment_method": payment.payment_method,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Atualizar no Firebase
    await firebase_client.update_request(request_id, {
        "payment_status": "paid",
        "payment_method": payment.payment_method
    })
    
    return {
        "message": "Payment processed successfully",
        "payment_id": payment_id,
        "status": "paid"
    }

@app.get("/requests/{request_id}/offers")
async def list_offers(request_id: str):
    """Listar ofertas de uma solicitação"""
    offers = []
    async for doc in db.offers.find({"request_id": request_id}):
        offers.append(doc)
    
    return offers

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "request-service-optimized",
        "timestamp": datetime.utcnow().isoformat(),
        "firebase_connected": await firebase_client.is_connected()
    }
