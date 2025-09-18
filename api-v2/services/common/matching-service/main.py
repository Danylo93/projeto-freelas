import os, asyncio, math, sys
from pathlib import Path
from typing import Optional
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from dotenv import load_dotenv

# Permite executar o serviço sem precisar exportar PYTHONPATH manualmente.
BASE_DIR = Path(__file__).resolve().parent

SERVICE_ROOT = BASE_DIR.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from common.kafka import make_consumer_with_retry, make_producer

from common.events import TOPIC_REQ_LIFECYCLE, EV_REQUEST_OFFERED

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")
REQ_TOPIC = os.getenv("TOPIC_REQUESTS", "service.requests")
LIFECYCLE_TOPIC = os.getenv("TOPIC_REQ_LIFECYCLE", TOPIC_REQ_LIFECYCLE)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="matching-service")
consumer: Optional[AIOKafkaConsumer] = None
producer: Optional[AIOKafkaProducer] = None


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


async def match_request(req: dict):
    print(f"🔍 [MATCHING] Processando solicitação: {req.get('id')} - {req.get('category')}")
    cur = db.providers.find({
        "category": req.get("category"),
        "status": "available",
        "is_online": True,  # Apenas prestadores online
    }, {"_id": 0})

    best = None
    best_dist = float("inf")
    async for prov in cur:
        dist = haversine(
            req.get("client_latitude"),
            req.get("client_longitude"),
            prov.get("latitude"),
            prov.get("longitude"),
        )
        if dist < best_dist:
            best = prov
            best_dist = dist

    if best:
        print(f"✅ [MATCHING] Prestador encontrado: {best['id']} para {req.get('id')}")
        await db.requests.update_one(
            {"id": req.get("id")},
            {"$set": {"provider_id": best["id"], "status": "offered"}},
        )
        await db.providers.update_one(
            {"id": best["id"]},
            {"$set": {"status": "busy"}},
        )
        if producer:
            print(f"📤 [MATCHING] Enviando evento request.offered para {best['id']}")
            await producer.send_and_wait(
                LIFECYCLE_TOPIC,
                {
                    "type": EV_REQUEST_OFFERED,
                    "request_id": req.get("id"),
                    "provider_id": best["id"],
                },
            )
    else:
        print(f"❌ [MATCHING] Nenhum prestador encontrado para {req.get('category')}")


async def consume():
    assert consumer is not None
    print(f"🔄 [MATCHING] Iniciando consumo de mensagens do tópico: {REQ_TOPIC}")
    async for msg in consumer:
        print(f"📨 [MATCHING] Mensagem recebida: {msg.value}")
        await match_request(msg.value)


@app.on_event("startup")
async def start():
    global consumer, producer
    print(f"🚀 [MATCHING] Iniciando matching-service...")
    print(f"🚀 [MATCHING] REQ_TOPIC: {REQ_TOPIC}")
    print(f"🚀 [MATCHING] LIFECYCLE_TOPIC: {LIFECYCLE_TOPIC}")

    try:
        consumer = await make_consumer_with_retry(
            REQ_TOPIC,
            group_id="matching-service",
        )
        print(f"✅ [MATCHING] Consumer criado para tópico: {REQ_TOPIC}")
    except Exception as e:
        print(f"❌ [MATCHING] Erro ao criar consumer: {e}")

    try:
        producer = await make_producer()
        print(f"✅ [MATCHING] Producer criado")
    except Exception as e:
        print(f"❌ [MATCHING] Erro ao criar producer: {e}")

    if consumer:
        asyncio.create_task(consume())
        print(f"🔄 [MATCHING] Task de consumo iniciada")


@app.on_event("shutdown")
async def stop():
    if consumer:
        await consumer.stop()
    if producer:
        await producer.stop()
    client.close()


@app.get("/healthz")
async def health():
    return {"status": "ok", "service": "matching"}
