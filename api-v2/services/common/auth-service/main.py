from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
from jose import jwt
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

SECRET = os.getenv("JWT_SECRET", "dev-secret")
ALGO   = "HS256"
pwd    = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="auth-service")

class Login(BaseModel):
    email: str
    password: str
    user_type: int  # 1 = provider, 2 = client

FAKE_USERS = {
    "provider@example.com": pwd.hash("123456"),
    "client@example.com":   pwd.hash("123456"),
}

@app.get("/healthz")
def health():
    return {"status":"ok", "service":"auth"}

@app.post("/auth/login")
def login(data: Login):
    hp = FAKE_USERS.get(data.email)
    if not hp or not pwd.verify(data.password, hp):
        raise HTTPException(status_code=401, detail="invalid credentials")
    exp = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode({"sub": data.email, "user_type": data.user_type, "exp": exp}, SECRET, algorithm=ALGO)
    return {"access_token": token, "token_type": "bearer"}
