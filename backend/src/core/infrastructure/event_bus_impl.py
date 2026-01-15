from src.core.interfaces.event_bus import EventBus
from typing import Dict, Any, List, Callable

class LocalEventBus(EventBus):
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}

    async def publish(self, topic: str, message: Dict[str, Any]):
        print(f"[EventBus] Publishing to {topic}: {message}")
        if topic in self.subscribers:
            for handler in self.subscribers[topic]:
                await handler(message)

    async def subscribe(self, topic: str, handler):
        if topic not in self.subscribers:
            self.subscribers[topic] = []
        self.subscribers[topic].append(handler)

# Singleton
event_bus = LocalEventBus()
