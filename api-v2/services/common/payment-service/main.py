import os, sys
from fastapi import FastAPI, HTTPException, Header, Request
from pydantic import BaseModel
from dotenv import load_dotenv
import stripe
from typing import Optional
from aiokafka import AIOKafkaProducer
from pathlib import Path

# Permite acessar o pacote compartilhado "common" ao rodar localmente ou no container.
BASE_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = BASE_DIR.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from common.events import TOPIC_REQ_LIFECYCLE
from common.kafka import make_producer

load_dotenv()

STRIPE_SECRET = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET: Optional[str] = os.getenv("STRIPE_WEBHOOK_SECRET")
stripe.api_key = STRIPE_SECRET

app = FastAPI(title="payment-service")
producer: Optional[AIOKafkaProducer] = None


class CreateIntentPayload(BaseModel):
    amount: int
    currency: str = "brl"
    customer_id: str | None = None
    metadata: dict | None = None


@app.get("/healthz")
async def health():
    return {"status": "ok", "service": "payment"}


@app.on_event("startup")
async def start():
    global producer
    producer = await make_producer()


@app.on_event("shutdown")
async def stop():
    if producer:
        await producer.stop()


@app.post("/payments/create-intent")
async def create_intent(payload: CreateIntentPayload):
    if not STRIPE_SECRET:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    try:
        intent = stripe.PaymentIntent.create(
            amount=payload.amount,
            currency=payload.currency,
            automatic_payment_methods={"enabled": True},
            metadata=payload.metadata or {},
        )
        return {"clientSecret": intent["client_secret"], "id": intent["id"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/payments/webhook")
async def webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
        else:
            event = stripe.Event.construct_from(request.json(), stripe.api_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"webhook error: {e}")

    evt_type = event.get("type")
    data = event.get("data", {}).get("object", {})
    if evt_type == "payment_intent.succeeded":
        metadata = data.get("metadata", {})
        request_id = metadata.get("request_id") or metadata.get("requestId")
        if producer and request_id:
            await producer.send_and_wait(
                TOPIC_REQ_LIFECYCLE,
                {"type": "payment.succeeded", "request_id": request_id, "amount": data.get("amount")},
            )
    return {"received": True}


