import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from common.common.rbac import require_roles

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="admin-service")


class Config(BaseModel):
    platform_fee_percent: float = 10.0
    surge_enabled: bool = False
    surge_multiplier: float = 1.0


class Category(BaseModel):
    id: str
    name: str
    base_price: float = 0.0
    description: str = ""


@app.get("/healthz")
async def health():
    return {"status": "ok", "service": "admin"}


# Config
@app.get("/admin/config", response_model=Config)
async def get_config(user=Depends(require_roles([3]))):
    stored = await db.admin_config.find_one({}, {"_id": 0})
    if not stored:
        cfg = Config()
        await db.admin_config.replace_one({}, cfg.dict(), upsert=True)
        return cfg
    return Config(**stored)


@app.put("/admin/config", response_model=Config)
async def update_config(payload: Config, user=Depends(require_roles([3]))):
    await db.admin_config.replace_one({}, payload.dict(), upsert=True)
    return payload


# Categories
@app.get("/admin/categories", response_model=List[Category])
async def list_categories(user=Depends(require_roles([3]))):
    cur = db.categories.find({}, {"_id": 0})
    return [doc async for doc in cur]


@app.post("/admin/categories", response_model=Category)
async def create_category(cat: Category, user=Depends(require_roles([3]))):
    await db.categories.update_one({"id": cat.id}, {"$set": cat.dict()}, upsert=True)
    return cat


@app.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, user=Depends(require_roles([3]))):
    res = await db.categories.delete_one({"id": category_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="category not found")
    return {"status": "deleted"}


# Listings (read-only)
@app.get("/admin/users")
async def list_users(q: Optional[str] = None, user=Depends(require_roles([3]))):
    query = {}
    if q:
        query = {"$or": [{"name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]}
    cur = db.users.find(query, {"_id": 0})
    return [doc async for doc in cur]


@app.get("/admin/providers")
async def list_providers_admin(q: Optional[str] = None, user=Depends(require_roles([3]))):
    query = {}
    if q:
        query = {"$or": [{"name": {"$regex": q, "$options": "i"}}, {"category": {"$regex": q, "$options": "i"}}]}
    cur = db.providers.find(query, {"_id": 0})
    return [doc async for doc in cur]


@app.get("/admin/requests")
async def list_requests_admin(q: Optional[str] = None, user=Depends(require_roles([3]))):
    query = {}
    if q:
        query = {"$or": [{"category": {"$regex": q, "$options": "i"}}, {"status": {"$regex": q, "$options": "i"}}]}
    cur = db.requests.find(query, {"_id": 0})
    return [doc async for doc in cur]


