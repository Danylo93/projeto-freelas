from src.modules.identity.domain.repository import UserRepository
from src.modules.identity.domain.entities import User, UserType
from src.core.infrastructure.security import get_password_hash, verify_password, create_access_token
from pydantic import BaseModel
from datetime import timedelta

class UserRegisterDTO(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    user_type: UserType

class UserDTO(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    user_type: UserType

class TokenDTO(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: str
    user_data: UserDTO

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register(self, data: UserRegisterDTO) -> TokenDTO:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ValueError("Email already registered")

        hashed = get_password_hash(data.password)
        new_user = User(
            name=data.name,
            email=data.email,
            phone=data.phone,
            password_hash=hashed,
            user_type=data.user_type
        )

        await self.user_repo.create(new_user)
        return self._create_token(new_user)

    async def login(self, email: str, password: str) -> TokenDTO:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        return self._create_token(user)

    def _create_token(self, user: User) -> TokenDTO:
        access_token = create_access_token(
            data={"sub": user.id, "type": user.user_type},
            expires_delta=timedelta(minutes=1440)
        )
        return TokenDTO(
            access_token=access_token,
            token_type="bearer",
            user_type=user.user_type,
            user_id=user.id,
            user_data=UserDTO(
                id=user.id,
                name=user.name,
                email=user.email,
                phone=user.phone,
                user_type=user.user_type
            )
        )
