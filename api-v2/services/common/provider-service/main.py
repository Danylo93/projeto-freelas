from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from aiokafka import AIOKafkaProducer

from common.kafka import make_producer
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
async def list_providers():
    cur = db.providers.find({}, {"_id":0})
    return [doc async for doc in cur]

@app.post("/providers", response_model=Provider)
async def create_provider(p: Provider):
    await db.providers.insert_one(p.dict())
    return p


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
