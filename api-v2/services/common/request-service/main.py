from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from aiokafka import AIOKafkaProducer
import os, json, asyncio
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL","mongodb://mongo:27017")
DB_NAME   = os.getenv("DB_NAME","freelas")
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP","kafka:29092")
TOPIC_REQUESTS  = os.getenv("TOPIC_REQUESTS","service.requests")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="request-service")
producer: Optional[AIOKafkaProducer] = None

class ServiceRequest(BaseModel):
    id: str
    client_id: str
    provider_id: str
    category: str
    description: str = ""
    client_latitude: float
    client_longitude: float
    price: float
    status: str = "pending"

@app.on_event("startup")
async def start():
    global producer
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP)
    await producer.start()

@app.on_event("shutdown")
async def stop():
    if producer:
        await producer.stop()
    client.close()

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"request"}

@app.get("/requests", response_model=List[ServiceRequest])
async def list_requests():
    cur = db.requests.find({}, {"_id":0})
    return [doc async for doc in cur]

@app.post("/requests", response_model=ServiceRequest)
async def create_request(req: ServiceRequest):
    await db.requests.insert_one(req.dict())
    # publica evento para matching/notifications
    if producer:
        await producer.send_and_wait(TOPIC_REQUESTS, json.dumps(req.dict()).encode())
    return req
