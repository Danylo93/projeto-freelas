from src.core.domain.entity import Entity

class Location(Entity):
    user_id: str
    latitude: float
    longitude: float
    timestamp: float
