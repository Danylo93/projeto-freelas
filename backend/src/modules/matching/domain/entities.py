from enum import Enum
from typing import Optional
from datetime import datetime
from src.core.domain.entity import Entity
from pydantic import Field

class RequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ServiceRequest(Entity):
    client_id: str
    provider_id: Optional[str] = None
    category: str
    description: str
    client_latitude: float
    client_longitude: float
    price: float
    status: RequestStatus = RequestStatus.PENDING
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
