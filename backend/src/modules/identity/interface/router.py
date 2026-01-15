from fastapi import APIRouter, Depends, HTTPException, status
from src.modules.identity.application.services import AuthService, UserRegisterDTO, TokenDTO
from src.modules.identity.infrastructure.repository import MongoUserRepository

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_auth_service():
    repo = MongoUserRepository()
    return AuthService(repo)

@router.post("/register", response_model=TokenDTO)
async def register(dto: UserRegisterDTO, service: AuthService = Depends(get_auth_service)):
    try:
        return await service.register(dto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class LoginDTO(str):
    pass # Pydantic helper if needed, but we can use Body or Pydantic model

from pydantic import BaseModel
class UserLoginDTO(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=TokenDTO)
async def login(dto: UserLoginDTO, service: AuthService = Depends(get_auth_service)):
    try:
        return await service.login(dto.email, dto.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
