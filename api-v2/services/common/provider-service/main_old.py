from fastapi import FastAPI, HTTPException, Header, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv
from aiokafka import AIOKafkaProducer

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
PROVIDER_LOCATION_TOPIC = os.getenv(
    "TOPIC_PROV_LOCATION", TOPIC_PROV_LOCATION
)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="provider-service-firebase")

producer: Optional[AIOKafkaProducer] = None
rate_limiter = RateLimiter(max_requests=30, window_seconds=60)

class Provider(BaseModel):
    id: str
    name: str
    category: str
    price: float
    description: str = ""
    latitude: float
    longitude: float
    status: str = "available"  # available/offline/busy
    rating: float = 5.0
    user_id: str

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    heading: Optional[float] = None

class StatusUpdate(BaseModel):
    status: str

class ProviderService(BaseModel):
    category: str
    basePrice: float
    enabled: bool

class ProviderServicesConfig(BaseModel):
    user_id: str
    services: List[ProviderService]
    location: dict
    is_available: bool = True

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"provider-firebase"}

@app.on_event("startup")
async def start():
    global producer
    producer = await make_producer()

@app.on_event("shutdown")
async def stop():
    if producer:
        await producer.stop()
    client.close()

@app.get("/providers", response_model=List[Provider])
async def list_providers(
    request: Request,
    user_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    pagination: PaginationParams = PaginationParams(),
    sorting: SortParams = SortParams(),
    user=Depends(require_roles([1,2,3])),
):
    allowed = ["user_id", "category", "status"]
    params_dict = {
        "user_id": user_id,
        "category": category,
        "status": status,
        "price_min": price_min,
        "price_max": price_max,
    }
    query = build_filters(params_dict, allowed)
    cur = db.providers.find(query, {"_id": 0})
    cur = apply_sort(cur, sorting)
    cur = apply_pagination(cur, pagination)
    return [doc async for doc in cur]

@app.get("/providers/{provider_id}", response_model=Provider)
async def get_provider(provider_id: str):
    """Buscar um prestador específico por ID"""
    provider = await db.providers.find_one({"id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return Provider(**provider)

@app.post("/providers", response_model=Provider)
async def create_provider(
    p: Provider,
    request: Request,
    idempotency_key: str | None = Header(None, alias=IdempotencyKey.header_name),
    user=Depends(require_roles([1])),
):
    rl_key = request.headers.get("X-Rate-Limit-Key") or request.client.host
    if not rate_limiter.allow(f"create_provider:{rl_key}"):
        raise HTTPException(status_code=429, detail="rate limit exceeded")

    cached = ensure_idempotency(idempotency_key)
    if cached is not None:
        return cached
    
    try:
        # Salvar no MongoDB
        await db.providers.insert_one(p.dict())
        
        # Atualizar status no Firebase
        await firebase_client.set_provider_online_status(p.user_id, p.status == "available")
        
        store_idempotent_result(idempotency_key, p)
        return p
    except Exception as e:
        print(f"❌ [PROVIDER] Erro ao criar provider: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/providers/{provider_id}", response_model=Provider)
async def upsert_provider(
    provider_id: str,
    payload: Provider,
    idempotency_key: str | None = Header(None, alias=IdempotencyKey.header_name),
    user=Depends(require_roles([1])),
):
    cached = ensure_idempotency(idempotency_key)
    if cached is not None:
        return cached
    
    try:
        data = payload.dict()
        data["id"] = provider_id
        await db.providers.update_one({"id": provider_id}, {"$set": data}, upsert=True)
        stored = await db.providers.find_one({"id": provider_id}, {"_id": 0})
        if not stored:
            raise HTTPException(status_code=500, detail="failed to persist provider")
        
        # Atualizar status no Firebase
        await firebase_client.set_provider_online_status(payload.user_id, payload.status == "available")
        
        result = Provider(**stored)
        store_idempotent_result(idempotency_key, result)
        return result
    except Exception as e:
        print(f"❌ [PROVIDER] Erro ao atualizar provider: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/providers/{provider_id}/location")
async def update_location(provider_id: str, loc: LocationUpdate):
    """Atualiza a localização de um prestador"""
    try:
        # Atualizar no MongoDB
        res = await db.providers.update_one(
            {"id": provider_id},
            {"$set": {
                "latitude": loc.latitude, 
                "longitude": loc.longitude,
                "updated_at": datetime.utcnow()
            }},
        )
        
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="provider not found")
        
        # Atualizar no Firebase
        location_data = {
            "lat": loc.latitude,
            "lng": loc.longitude
        }
        
        if loc.heading is not None:
            location_data["heading"] = loc.heading
        
        await firebase_client.update_provider_location(provider_id, location_data)
        
        # Publicar evento no Kafka
        if producer:
            await producer.send_and_wait(
                PROVIDER_LOCATION_TOPIC,
                {
                    "type": EV_PROVIDER_LOCATION,
                    "provider_id": provider_id,
                    "location": {"lat": loc.latitude, "lng": loc.longitude},
                },
            )
        
        return {"status": "location updated"}
        
    except Exception as e:
        print(f"❌ [PROVIDER] Erro ao atualizar localização: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/providers/{provider_id}/status")
async def update_status(provider_id: str, data: StatusUpdate):
    """Atualiza o status de um prestador"""
    try:
        # Atualizar no MongoDB
        res = await db.providers.update_one(
            {"id": provider_id},
            {"$set": {"status": data.status, "updated_at": datetime.utcnow()}}
        )
        
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="provider not found")
        
        # Obter user_id do provider
        provider = await db.providers.find_one({"id": provider_id})
        if provider:
            # Atualizar status no Firebase
            is_online = data.status in ["available", "busy"]
            await firebase_client.set_provider_online_status(provider["user_id"], is_online)
        
        return {"status": data.status}
        
    except Exception as e:
        print(f"❌ [PROVIDER] Erro ao atualizar status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/providers/services")
async def configure_provider_services(
    config: ProviderServicesConfig,
    user=Depends(require_roles([1])),
):
    """Configura os serviços oferecidos por um prestador"""
    try:
        user_id = config.user_id

        # Remover serviços existentes do usuário
        await db.providers.delete_many({"user_id": user_id})

        # Criar um provider para cada serviço habilitado
        providers_to_insert = []
        for service in config.services:
            if service.enabled:
                provider_data = {
                    "id": f"{user_id}_{service.category}",
                    "name": service.category,
                    "category": service.category,
                    "price": service.basePrice,
                    "description": f"Serviço de {service.category}",
                    "latitude": config.location.get("latitude", 0),
                    "longitude": config.location.get("longitude", 0),
                    "status": "available" if config.is_available else "offline",
                    "is_online": config.is_available,
                    "rating": 5.0,
                    "user_id": user_id,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
                providers_to_insert.append(provider_data)

        if providers_to_insert:
            await db.providers.insert_many(providers_to_insert)
            
            # Atualizar status no Firebase
            await firebase_client.set_provider_online_status(user_id, config.is_available)

        return {
            "status": "success",
            "services_configured": len(providers_to_insert),
            "services": [p["category"] for p in providers_to_insert]
        }
        
    except Exception as e:
        print(f"❌ [PROVIDER] Erro ao configurar serviços: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/providers/{user_id}/status")
async def update_provider_status(
    user_id: str,
    status_data: dict,
    user=Depends(require_roles([1]))
):
    """Atualizar status online/offline do prestador"""
    try:
        is_online = status_data.get('is_online', True)

        print(f"🔄 [PROVIDER] Atualizando status para {user_id}: {'ONLINE' if is_online else 'OFFLINE'}")

        # Atualizar todos os serviços do prestador no MongoDB
        result = await db.providers.update_many(
            {"user_id": user_id},
            {
                "$set": {
                    "is_online": is_online,
                    "status": "available" if is_online else "offline",
                    "updated_at": datetime.utcnow()
                }
            }
        )

        # Atualizar status no Firebase
        await firebase_client.set_provider_online_status(user_id, is_online)

        print(f"✅ [PROVIDER] {result.modified_count} serviços atualizados")

        return {
            "status": "success",
            "is_online": is_online,
            "services_updated": result.modified_count
        }

    except Exception as e:
        print(f"❌ [PROVIDER] Erro ao atualizar status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/providers/{user_id}/status")
async def get_provider_status(
    user_id: str,
    user=Depends(require_roles([1, 2, 3]))
):
    """Obter status atual do prestador"""
    try:
        # Buscar um serviço do prestador para verificar status
        provider = await db.providers.find_one({"user_id": user_id})

        if not provider:
            return {
                "status": "not_found",
                "is_online": False,
                "services_count": 0
            }

        # Contar total de serviços
        services_count = await db.providers.count_documents({"user_id": user_id})

        return {
            "status": "success",
            "is_online": provider.get('is_online', False),
            "provider_status": provider.get('status', 'offline'),
            "services_count": services_count,
            "last_updated": provider.get('updated_at')
        }

    except Exception as e:
        print(f"❌ [PROVIDER] Erro ao obter status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/providers/{user_id}/location")
async def get_provider_location(
    user_id: str,
    user=Depends(require_roles([1, 2, 3]))
):
    """Obter localização atual do prestador do Firebase"""
    try:
        # Buscar provider_id do usuário
        provider = await db.providers.find_one({"user_id": user_id})
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        
        provider_id = provider["id"]
        
        # Obter localização do Firebase
        location_data = await firebase_client.get_provider_location(provider_id)
        
        if not location_data:
            return {
                "status": "not_found",
                "message": "Location not available"
            }
        
        return {
            "status": "success",
            "provider_id": provider_id,
            "location": location_data
        }
        
    except Exception as e:
        print(f"❌ [PROVIDER] Erro ao obter localização: {e}")
        raise HTTPException(status_code=500, detail=str(e))
