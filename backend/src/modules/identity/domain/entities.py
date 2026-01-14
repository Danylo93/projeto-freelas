from enum import Enum
from src.core.domain.entity import Entity

class UserType(str, Enum):
    PRESTADOR = "PRESTADOR"
    CLIENTE = "CLIENTE"

class User(Entity):
    name: str
    email: str
    phone: str
    password_hash: str
    user_type: UserType
    is_active: bool = True
