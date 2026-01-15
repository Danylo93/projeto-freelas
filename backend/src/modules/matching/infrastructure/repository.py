from typing import List
from src.modules.matching.domain.entities import ServiceRequest
from src.core.infrastructure.db import get_db

class RequestRepository:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.service_requests

    async def create(self, request: ServiceRequest) -> ServiceRequest:
        await self.collection.insert_one(request.model_dump())
        return request

    async def get_by_id(self, request_id: str) -> ServiceRequest | None:
        data = await self.collection.find_one({"id": request_id})
        return ServiceRequest(**data) if data else None

    async def update(self, request: ServiceRequest):
        await self.collection.update_one({"id": request.id}, {"$set": request.model_dump()})
