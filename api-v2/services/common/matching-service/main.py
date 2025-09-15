import os, asyncio, time, json, random
import redis.asyncio as aioredis
from services.common.kafka import make_producer, make_consumer
from services.common.events import (
    TOPIC_REQ_LIFECYCLE, TOPIC_MATCHING, EV_REQUEST_CREATED, EV_REQUEST_OFFERED
)
from services.common.geo import index as h3index, neighbors

async def run():
    redis = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    prod = await make_producer()
    cons = make_consumer(TOPIC_REQ_LIFECYCLE, "matching")

    await cons.start()
    try:
      async for msg in cons:
        evt = msg.value
        if evt.get("type") != EV_REQUEST_CREATED:
            continue

        rid = evt["request_id"]
        lat, lng = evt["lat"], evt["lng"]
        h = h3index(lat, lng)
        rings = neighbors(h, k=2)  # busca 2 anéis (~vizinhança)
        candidates = []
        now = int(time.time()*1000)

        for cell in rings:
            # pega providers recentes por timestamp
            ids = await redis.zrevrangebyscore(f"h3:{cell}", now, now-120000)  # 2min
            for pid in ids:
                state = await redis.hgetall(f"provider:{pid.decode()}")
                if state and state.get(b"status", b"").decode() == "available":
                    candidates.append(pid.decode())

        # top-K (aqui só sorteio 3 p/ demo)
        random.shuffle(candidates)
        offers = candidates[:3]

        for pid in offers:
            await prod.send_and_wait(TOPIC_MATCHING, {
                "type": EV_REQUEST_OFFERED,
                "request_id": rid,
                "provider_id": pid
            })

        # demo: se ninguém aceitar em 8s, aceita automaticamente o primeiro
        if offers:
            await asyncio.sleep(8)
            locked = await redis.get(f"request:lock:{rid}")
            if not locked:
                # aceita "pelo" provider[0]
                from services.common.events import EV_REQUEST_ACCEPTED
                await prod.send_and_wait(TOPIC_REQ_LIFECYCLE, {
                    "type": EV_REQUEST_ACCEPTED,
                    "request_id": rid,
                    "provider_id": offers[0]
                })

    finally:
      await cons.stop()
      await prod.stop()
      await redis.close()

if __name__ == "__main__":
    asyncio.run(run())
