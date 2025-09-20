from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uuid
from datetime import datetime

app = FastAPI(title="request-service-ultra-simple")

# Modelo simplificado
class ServiceRequest(BaseModel):
    id: str
    client_id: str
    category: str
    description: str
    address: str
    price: float
    status: str = "pending"
    created_at: datetime

class RequestCreate(BaseModel):
    client_id: str
    category: str
    description: str
    address: str
    price: float

# Armazenamento em memória para teste
requests_db = []

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
        created_at=now
    )
    
    requests_db.append(service_request.dict())
    return service_request

@app.get("/requests", response_model=List[ServiceRequest])
async def list_requests():
    """Listar solicitações"""
    return [ServiceRequest(**r) for r in requests_db]

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "request-service-ultra-simple",
        "timestamp": datetime.utcnow().isoformat(),
        "requests_count": len(requests_db)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)
