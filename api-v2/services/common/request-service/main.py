from fastapi import FastAPI, HTTPException, Header, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from aiokafka import AIOKafkaProducer
import os, asyncio
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

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
REQ_TOPIC = os.getenv("TOPIC_REQUESTS", "service.requests")
LIFECYCLE_TOPIC = os.getenv("TOPIC_REQ_LIFECYCLE", TOPIC_REQ_LIFECYCLE)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="request-service")
producer: Optional[AIOKafkaProducer] = None
rate_limiter = RateLimiter(max_requests=60, window_seconds=60)

class ServiceRequest(BaseModel):
    id: str
    client_id: str
    provider_id: Optional[str] = None
    category: str
    description: str = ""
    client_latitude: float
    client_longitude: float
    price: float
    status: str = "pending"


class StatusUpdate(BaseModel):
    status: str


class AcceptPayload(BaseModel):
    provider_id: str

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
    return {"status":"ok","service":"request"}

@app.get("/requests", response_model=List[ServiceRequest])
async def list_requests(
    client_id: Optional[str] = None,
    provider_id: Optional[str] = None,
    status: Optional[str] = None,
    pagination: PaginationParams = PaginationParams(),
    sorting: SortParams = SortParams(),
    user=Depends(require_roles([1,2,3])),
):
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

@app.post("/requests", response_model=ServiceRequest)
async def create_request(
    req: ServiceRequest,
    request: Request,
    idempotency_key: str | None = Header(None, alias=IdempotencyKey.header_name),
    user=Depends(require_roles([2])),
):
    rl_key = request.headers.get("X-Rate-Limit-Key") or request.client.host
    if not rate_limiter.allow(f"create_request:{rl_key}"):
        raise HTTPException(status_code=429, detail="rate limit exceeded")

    cached = ensure_idempotency(idempotency_key)
    if cached is not None:
        return cached

    await db.requests.insert_one(req.dict())
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


@app.put("/requests/{request_id}/accept")
async def accept_request(
    request_id: str,
    data: AcceptPayload,
    idempotency_key: str | None = Header(None, alias=IdempotencyKey.header_name),
    user=Depends(require_roles([1])),
):
    cached = ensure_idempotency(idempotency_key)
    if cached is not None:
        return cached
    res = await db.requests.update_one(
        {"id": request_id},
        {"$set": {"status": "accepted", "provider_id": data.provider_id}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="request not found")
    if producer:
        await producer.send_and_wait(
            LIFECYCLE_TOPIC,
            {
                "type": EV_REQUEST_ACCEPTED,
                "request_id": request_id,
                "provider_id": data.provider_id,
            },
        )
    result = {"status": "accepted"}
    store_idempotent_result(idempotency_key, result)
    return result


@app.put("/requests/{request_id}/status")
async def update_request_status(
    request_id: str,
    data: StatusUpdate,
    idempotency_key: str | None = Header(None, alias=IdempotencyKey.header_name),
    user=Depends(require_roles([1,2])),
):
    cached = ensure_idempotency(idempotency_key)
    if cached is not None:
        return cached
    res = await db.requests.update_one(
        {"id": request_id},
        {"$set": {"status": data.status}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="request not found")
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
