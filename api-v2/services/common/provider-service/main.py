from fastapi import FastAPI, HTTPException, Header, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv
from aiokafka import AIOKafkaProducer
import uuid

from common.kafka import make_producer
from common import (
    PaginationParams,
    apply_pagination,
    SortParams,
    apply_sort,
    build_filters,
    IdempotencyKey,
)
from common.idempotency import store_idempotent_result, ensure_idempotency
from common.ratelimit import RateLimiter
from common.rbac import require_roles
from common.events import TOPIC_PROV_LOCATION, EV_PROVIDER_LOCATION
import sys
sys.path.append('/app/firebase-service')
from firebase_client import firebase_client

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
PROVIDER_LOCATION_TOPIC = os.getenv("TOPIC_PROV_LOCATION", TOPIC_PROV_LOCATION)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="provider-service-optimized")
producer: Optional[AIOKafkaProducer] = None
rate_limiter = RateLimiter(max_requests=60, window_seconds=60)

# Modelos integrados
class Provider(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    document: str  # CPF/CNPJ
    vehicle_type: str  # car, motorcycle, bike
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    is_available: bool = True
    is_online: bool = False
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    rating: float = 0.0
    total_rides: int = 0
    total_earnings: float = 0.0
    created_at: datetime
    updated_at: datetime
    categories: List[str] = []  # Categorias de serviço que atende
    max_distance: float = 10.0  # Distância máxima em km
    hourly_rate: float = 50.0  # Taxa por hora

class ProviderLocation(BaseModel):
    provider_id: str
    latitude: float
    longitude: float
    heading: Optional[float] = None  # Direção em graus
    speed: Optional[float] = None  # Velocidade em km/h
    timestamp: datetime

class ProviderCreate(BaseModel):
    name: str
    email: str
    phone: str
    document: str
    vehicle_type: str
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    categories: List[str] = []
    max_distance: float = 10.0
    hourly_rate: float = 50.0

class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    is_available: Optional[bool] = None
    categories: Optional[List[str]] = None
    max_distance: Optional[float] = None
    hourly_rate: Optional[float] = None

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    heading: Optional[float] = None
    speed: Optional[float] = None

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
@app.post("/providers", response_model=Provider)
@ensure_idempotency
async def create_provider(
    provider: ProviderCreate,
    idempotency_key: IdempotencyKey = Depends(),
    authorization: str = Header(None)
):
    """Criar novo prestador"""
    await rate_limiter.check_rate_limit(authorization)
    
    provider_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_provider = Provider(
        id=provider_id,
        name=provider.name,
        email=provider.email,
        phone=provider.phone,
        document=provider.document,
        vehicle_type=provider.vehicle_type,
        vehicle_plate=provider.vehicle_plate,
        vehicle_model=provider.vehicle_model,
        vehicle_color=provider.vehicle_color,
        categories=provider.categories,
        max_distance=provider.max_distance,
        hourly_rate=provider.hourly_rate,
        created_at=now,
        updated_at=now
    )
    
    # Salvar no MongoDB
    await db.providers.insert_one(new_provider.dict())
    
    # Salvar no Firebase
    await firebase_client.create_provider(provider_id, new_provider.dict())
    
    await store_idempotent_result(idempotency_key, new_provider.dict())
    return new_provider

@app.get("/providers", response_model=List[Provider])
async def list_providers(
    is_available: Optional[bool] = None,
    is_online: Optional[bool] = None,
    category: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends()
):
    """Listar prestadores com filtros"""
    filters = build_filters({
        "is_available": is_available,
        "is_online": is_online,
        "categories": {"$in": [category]} if category else None
    })
    
    cursor = db.providers.find(filters)
    cursor = apply_sort(cursor, sort)
    cursor = apply_pagination(cursor, pagination)
    
    providers = []
    async for doc in cursor:
        providers.append(Provider(**doc))
    
    return providers

@app.get("/providers/{provider_id}", response_model=Provider)
async def get_provider(provider_id: str):
    """Obter prestador específico"""
    doc = await db.providers.find_one({"id": provider_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return Provider(**doc)

@app.put("/providers/{provider_id}", response_model=Provider)
async def update_provider(
    provider_id: str,
    update: ProviderUpdate,
    authorization: str = Header(None)
):
    """Atualizar prestador"""
    await rate_limiter.check_rate_limit(authorization)
    
    update_data = update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.providers.update_one(
        {"id": provider_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Atualizar no Firebase
    await firebase_client.update_provider(provider_id, update_data)
    
    # Retornar prestador atualizado
    doc = await db.providers.find_one({"id": provider_id})
    return Provider(**doc)

@app.post("/providers/{provider_id}/location")
async def update_location(
    provider_id: str,
    location: LocationUpdate,
    authorization: str = Header(None)
):
    """Atualizar localização do prestador"""
    await rate_limiter.check_rate_limit(authorization)
    
    # Verificar se o prestador existe
    provider = await db.providers.find_one({"id": provider_id})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    location_data = {
        "provider_id": provider_id,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "heading": location.heading,
        "speed": location.speed,
        "timestamp": datetime.utcnow()
    }
    
    # Atualizar localização no MongoDB
    await db.providers.update_one(
        {"id": provider_id},
        {
            "$set": {
                "current_latitude": location.latitude,
                "current_longitude": location.longitude,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Salvar histórico de localização
    await db.provider_locations.insert_one(location_data)
    
    # Atualizar no Firebase para tempo real
    await firebase_client.update_provider_location(provider_id, {
        "latitude": location.latitude,
        "longitude": location.longitude,
        "heading": location.heading,
        "speed": location.speed,
        "timestamp": location_data["timestamp"]
    })
    
    # Publicar evento Kafka
    await producer.send(
        PROVIDER_LOCATION_TOPIC,
        {
            "event": EV_PROVIDER_LOCATION,
            "provider_id": provider_id,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "heading": location.heading,
            "speed": location.speed,
            "timestamp": location_data["timestamp"].isoformat()
        }
    )
    
    return {"message": "Location updated successfully"}

@app.post("/providers/{provider_id}/online")
async def set_online(
    provider_id: str,
    authorization: str = Header(None)
):
    """Definir prestador como online"""
    await rate_limiter.check_rate_limit(authorization)
    
    result = await db.providers.update_one(
        {"id": provider_id},
        {
            "$set": {
                "is_online": True,
                "is_available": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Atualizar no Firebase
    await firebase_client.update_provider(provider_id, {
        "is_online": True,
        "is_available": True
    })
    
    return {"message": "Provider is now online"}

@app.post("/providers/{provider_id}/offline")
async def set_offline(
    provider_id: str,
    authorization: str = Header(None)
):
    """Definir prestador como offline"""
    await rate_limiter.check_rate_limit(authorization)
    
    result = await db.providers.update_one(
        {"id": provider_id},
        {
            "$set": {
                "is_online": False,
                "is_available": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Atualizar no Firebase
    await firebase_client.update_provider(provider_id, {
        "is_online": False,
        "is_available": False
    })
    
    return {"message": "Provider is now offline"}

@app.get("/providers/{provider_id}/location")
async def get_current_location(provider_id: str):
    """Obter localização atual do prestador"""
    provider = await db.providers.find_one(
        {"id": provider_id},
        {"current_latitude": 1, "current_longitude": 1, "updated_at": 1}
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {
        "provider_id": provider_id,
        "latitude": provider.get("current_latitude"),
        "longitude": provider.get("current_longitude"),
        "last_updated": provider.get("updated_at")
    }

@app.get("/providers/{provider_id}/stats")
async def get_provider_stats(provider_id: str):
    """Obter estatísticas do prestador"""
    provider = await db.providers.find_one({"id": provider_id})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Calcular estatísticas
    total_rides = await db.requests.count_documents({
        "provider_id": provider_id,
        "status": "completed"
    })
    
    total_earnings = await db.requests.aggregate([
        {"$match": {"provider_id": provider_id, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]).to_list(1)
    
    avg_rating = await db.requests.aggregate([
        {"$match": {"provider_id": provider_id, "rating": {"$exists": True}}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
    ]).to_list(1)
    
    return {
        "provider_id": provider_id,
        "total_rides": total_rides,
        "total_earnings": total_earnings[0]["total"] if total_earnings else 0.0,
        "average_rating": avg_rating[0]["avg_rating"] if avg_rating else 0.0,
        "is_online": provider.get("is_online", False),
        "is_available": provider.get("is_available", False)
    }

@app.get("/providers/nearby")
async def get_nearby_providers(
    latitude: float,
    longitude: float,
    radius: float = 5.0,  # km
    category: Optional[str] = None,
    limit: int = 10
):
    """Buscar prestadores próximos"""
    # Buscar prestadores online e disponíveis
    filters = {
        "is_online": True,
        "is_available": True,
        "current_latitude": {"$exists": True},
        "current_longitude": {"$exists": True}
    }
    
    if category:
        filters["categories"] = {"$in": [category]}
    
    providers = []
    async for doc in db.providers.find(filters):
        # Calcular distância (simplificado)
        if doc.get("current_latitude") and doc.get("current_longitude"):
            # Aqui você implementaria o cálculo de distância real
            # Por simplicidade, vamos assumir que todos estão próximos
            providers.append({
                "id": doc["id"],
                "name": doc["name"],
                "vehicle_type": doc["vehicle_type"],
                "rating": doc.get("rating", 0.0),
                "latitude": doc["current_latitude"],
                "longitude": doc["current_longitude"],
                "distance": 1.0  # Simulado
            })
    
    return providers[:limit]

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "provider-service-optimized",
        "timestamp": datetime.utcnow().isoformat(),
        "firebase_connected": await firebase_client.is_connected()
    }
