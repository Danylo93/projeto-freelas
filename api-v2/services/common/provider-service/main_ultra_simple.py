from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uuid
from datetime import datetime

app = FastAPI(title="provider-service-ultra-simple")

# Modelo simplificado
class Provider(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    document: str
    vehicle_type: str
    created_at: datetime

class ProviderCreate(BaseModel):
    name: str
    email: str
    phone: str
    document: str
    vehicle_type: str

# Armazenamento em memória para teste
providers_db = []

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
        created_at=now
    )
    
    providers_db.append(new_provider.dict())
    return new_provider

@app.get("/providers", response_model=List[Provider])
async def list_providers():
    """Listar prestadores"""
    return [Provider(**p) for p in providers_db]

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "provider-service-ultra-simple",
        "timestamp": datetime.utcnow().isoformat(),
        "providers_count": len(providers_db)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)
