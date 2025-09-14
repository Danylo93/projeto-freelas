import json, asyncio, os
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer

def get_bootstrap() -> str:
    return os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")

async def make_producer() -> AIOKafkaProducer:
    p = AIOKafkaProducer(bootstrap_servers=get_bootstrap(), value_serializer=lambda v: json.dumps(v).encode())
    await p.start()
    return p

def make_consumer(topic: str, group_id: str) -> AIOKafkaConsumer:
    return AIOKafkaConsumer(
        topic,
        bootstrap_servers=get_bootstrap(),
        group_id=group_id,
        value_deserializer=lambda v: json.loads(v.decode()),
        auto_offset_reset="latest"
    )
