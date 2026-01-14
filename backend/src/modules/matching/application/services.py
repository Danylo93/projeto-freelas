from src.modules.matching.domain.entities import ServiceRequest, RequestStatus
from src.modules.matching.infrastructure.repository import RequestRepository
from src.core.infrastructure.event_bus_impl import event_bus
from pydantic import BaseModel

class CreateRequestDTO(BaseModel):
    client_id: str
    category: str
    description: str
    client_latitude: float
    client_longitude: float
    price: float

class RequestService:
    def __init__(self, repo: RequestRepository):
        self.repo = repo

    async def create_request(self, dto: CreateRequestDTO) -> ServiceRequest:
        request = ServiceRequest(
            client_id=dto.client_id,
            category=dto.category,
            description=dto.description,
            client_latitude=dto.client_latitude,
            client_longitude=dto.client_longitude,
            price=dto.price
        )
        await self.repo.create(request)

        # Publish event
        await event_bus.publish("request.created", {
            "request_id": request.id,
            "category": request.category,
            "lat": request.client_latitude,
            "lng": request.client_longitude
        })

        return request
