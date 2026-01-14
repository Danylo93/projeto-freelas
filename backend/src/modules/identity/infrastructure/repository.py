from src.modules.identity.domain.repository import UserRepository
from src.modules.identity.domain.entities import User
from src.core.infrastructure.db import get_db

class MongoUserRepository(UserRepository):
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.users

    async def get_by_email(self, email: str) -> User | None:
        data = await self.collection.find_one({"email": email})
        if data:
            return User(**data)
        return None

    async def get_by_id(self, user_id: str) -> User | None:
        data = await self.collection.find_one({"id": user_id})
        if data:
            return User(**data)
        return None

    async def create(self, user: User) -> User:
        await self.collection.insert_one(user.model_dump())
        return user
