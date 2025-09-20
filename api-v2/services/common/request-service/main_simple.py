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

app = FastAPI(title="request-service-simple")

# Modelos simplificados
class ServiceRequest(BaseModel):
    id: str
    client_id: str
    provider_id: Optional[str] = None
    category: str
    description: str
    address: str
    price: float
    status: str = "pending"
    created_at: datetime
    updated_at: datetime

class RequestCreate(BaseModel):
    client_id: str
    category: str
    description: str
    address: str
    price: float

# Endpoints principais
@app.post("/requests", response_model=ServiceRequest)
async def create_request(request: RequestCreate):
    """Criar nova solicitação de serviço"""
    request_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    service_request = ServiceRequest(
        id=request_id,
        client_id=request.client_id,
        category=request.category,
        description=request.description,
        address=request.address,
        price=request.price,
        status="pending",
        created_at=now,
        updated_at=now
    )
    
    # Salvar no MongoDB
    await db.requests.insert_one(service_request.dict())
    
    return service_request

@app.get("/requests", response_model=List[ServiceRequest])
async def list_requests():
    """Listar solicitações"""
    requests = []
    async for doc in db.requests.find():
        requests.append(ServiceRequest(**doc))
    
    return requests

@app.get("/requests/{request_id}", response_model=ServiceRequest)
async def get_request(request_id: str):
    """Obter solicitação específica"""
    doc = await db.requests.find_one({"id": request_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return ServiceRequest(**doc)

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "request-service-simple",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)
