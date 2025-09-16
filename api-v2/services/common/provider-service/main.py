from fastapi import FastAPI, HTTPException, Header, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
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

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
PROVIDER_LOCATION_TOPIC = os.getenv(
    "TOPIC_PROV_LOCATION", TOPIC_PROV_LOCATION
)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="provider-service")

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


class StatusUpdate(BaseModel):
    status: str

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"provider"}


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

@app.post("/providers", response_model=Provider)
async def create_provider(
    p: Provider,
    request: Request,
    idempotency_key: str | None = Header(None, alias=IdempotencyKey.header_name),
    user=Depends(require_roles([1])),
):
    # rate limit per client key or ip
    rl_key = request.headers.get("X-Rate-Limit-Key") or request.client.host
    if not rate_limiter.allow(f"create_provider:{rl_key}"):
        raise HTTPException(status_code=429, detail="rate limit exceeded")

    cached = ensure_idempotency(idempotency_key)
    if cached is not None:
        return cached
    await db.providers.insert_one(p.dict())
    store_idempotent_result(idempotency_key, p)
    return p


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
    data = payload.dict()
    data["id"] = provider_id
    await db.providers.update_one({"id": provider_id}, {"$set": data}, upsert=True)
    stored = await db.providers.find_one({"id": provider_id}, {"_id": 0})
    if not stored:
        raise HTTPException(status_code=500, detail="failed to persist provider")
    result = Provider(**stored)
    store_idempotent_result(idempotency_key, result)
    return result


@app.put("/providers/{provider_id}/location")
async def update_location(provider_id: str, loc: LocationUpdate):
    res = await db.providers.update_one(
        {"id": provider_id},
        {"$set": {"latitude": loc.latitude, "longitude": loc.longitude}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="provider not found")
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


@app.put("/providers/{provider_id}/status")
async def update_status(provider_id: str, data: StatusUpdate):
    res = await db.providers.update_one(
        {"id": provider_id},
        {"$set": {"status": data.status}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="provider not found")
    return {"status": data.status}
