from abc import ABC, abstractmethod
from typing import Any, Dict

class EventBus(ABC):
    @abstractmethod
    async def publish(self, topic: str, message: Dict[str, Any]):
        pass

    @abstractmethod
    async def subscribe(self, topic: str, handler):
        pass
