import os
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "freelancerapp"
    SECRET_KEY: str = "secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REDIS_URL: str | None = None
    KAFKA_BOOTSTRAP: str | None = None
    GOOGLE_MAPS_API_KEY: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URL)
        self.db = self.client[settings.DB_NAME]
        print(f"Connected to MongoDB: {settings.DB_NAME}")

    def close(self):
        if self.client:
            self.client.close()

db = Database()

def get_db():
    return db.db
