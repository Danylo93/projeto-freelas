from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL","mongodb://mongo:27017")
DB_NAME   = os.getenv("DB_NAME","freelas")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="provider-service")

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

@app.get("/healthz")
async def health():
    return {"status":"ok","service":"provider"}

@app.get("/providers", response_model=List[Provider])
async def list_providers():
    cur = db.providers.find({}, {"_id":0})
    return [doc async for doc in cur]

@app.post("/providers", response_model=Provider)
async def create_provider(p: Provider):
    await db.providers.insert_one(p.dict())
    return p
