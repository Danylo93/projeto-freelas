from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv
import uuid

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="provider-service-simple")

# Modelos simplificados
class Provider(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    document: str
    vehicle_type: str
    is_available: bool = True
    is_online: bool = False
    created_at: datetime
    updated_at: datetime

class ProviderCreate(BaseModel):
    name: str
    email: str
    phone: str
    document: str
    vehicle_type: str

# Endpoints principais
@app.post("/providers", response_model=Provider)
async def create_provider(provider: ProviderCreate):
    """Criar novo prestador"""
    provider_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_provider = Provider(
        id=provider_id,
        name=provider.name,
        email=provider.email,
        phone=provider.phone,
        document=provider.document,
        vehicle_type=provider.vehicle_type,
        created_at=now,
        updated_at=now
    )
    
    # Salvar no MongoDB
    await db.providers.insert_one(new_provider.dict())
    
    return new_provider

@app.get("/providers", response_model=List[Provider])
async def list_providers():
    """Listar prestadores"""
    providers = []
    async for doc in db.providers.find():
        providers.append(Provider(**doc))
    
    return providers

@app.get("/providers/{provider_id}", response_model=Provider)
async def get_provider(provider_id: str):
    """Obter prestador específico"""
    doc = await db.providers.find_one({"id": provider_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return Provider(**doc)

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "provider-service-simple",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)
