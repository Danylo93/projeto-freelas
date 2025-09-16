import os
from typing import Any, Dict, List, Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt


JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALGO = os.getenv("JWT_ALGO", "HS256")

security = HTTPBearer(auto_error=False)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="missing auth token")
    payload = decode_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="invalid token")
    return payload


def require_roles(allowed_roles: List[int]):
    async def _checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_type = user.get("user_type")
        if user_type not in allowed_roles:
            raise HTTPException(status_code=403, detail="forbidden")
        return user

    return _checker


