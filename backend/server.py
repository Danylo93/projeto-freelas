from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Create the main app
app = FastAPI(title="FreelancerApp API")

# Create socket app
socket_app = socketio.ASGIApp(sio, app)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserType(int, Enum):
    PRESTADOR = 1
    CLIENTE = 2

class ServiceStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

class RequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Models
class UserBase(BaseModel):
    name: str
    email: str
    phone: str
    user_type: UserType

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: UserType
    user_data: User

class ServiceCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str

class ServiceProviderProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    price: float
    description: str
    status: ServiceStatus = ServiceStatus.AVAILABLE
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating: float = 0.0
    total_reviews: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    provider_id: str
    category: str
    description: str
    price: float
    client_latitude: float
    client_longitude: float
    provider_latitude: Optional[float] = None
    provider_longitude: Optional[float] = None
    status: RequestStatus = RequestStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ServiceRequestCreate(BaseModel):
    provider_id: str
    category: str
    description: str
    price: float
    client_latitude: float
    client_longitude: float

class ServiceProviderProfileCreate(BaseModel):
    category: str
    price: float
    description: str
    status: ServiceStatus = ServiceStatus.AVAILABLE
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class RatingCreate(BaseModel):
    request_id: str
    provider_id: str
    rating: int  # 1-5
    comment: str

class Rating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    client_id: str
    provider_id: str
    rating: int  # 1-5
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return UserInDB(**user)

# Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    del user_dict["password"]
    
    db_user = UserInDB(**user_dict, hashed_password=hashed_password)
    await db.users.insert_one(db_user.dict())
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.id}, expires_delta=access_token_expires
    )
    
    user_data = User(**user_dict, id=db_user.id, created_at=db_user.created_at)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_type=user.user_type,
        user_data=user_data
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email}, {"_id": 0})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_data = User(**{k: v for k, v in user.items() if k != "hashed_password"})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_type=UserType(user["user_type"]),
        user_data=user_data
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return User(**{k: v for k, v in current_user.dict().items() if k != "hashed_password"})

@api_router.post("/provider/profile", response_model=ServiceProviderProfile)
async def create_provider_profile(
    profile_data: ServiceProviderProfileCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.user_type != UserType.PRESTADOR:
        raise HTTPException(status_code=403, detail="Only providers can create profiles")
    
    profile = ServiceProviderProfile(**profile_data.dict(), user_id=current_user.id)
    await db.provider_profiles.insert_one(profile.dict())
    return profile

@api_router.get("/providers", response_model=List[Dict[str, Any]])
async def get_providers(
    category: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.user_type != UserType.CLIENTE:
        raise HTTPException(status_code=403, detail="Only clients can view providers")
    
    filter_query = {}
    if category:
        filter_query["category"] = category
    
    providers = await db.provider_profiles.find(filter_query, {"_id": 0}).to_list(100)
    
    # Get user data for each provider
    result = []
    for provider in providers:
        user_data = await db.users.find_one({"id": provider["user_id"]}, {"_id": 0})
        if user_data:
            provider_info = {
                **provider,
                "name": user_data["name"],
                "phone": user_data["phone"],
                "email": user_data["email"]
            }
            result.append(provider_info)
    
    return result

@api_router.post("/requests", response_model=ServiceRequest)
async def create_service_request(
    request: ServiceRequestCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.user_type != UserType.CLIENTE:
        raise HTTPException(status_code=403, detail="Only clients can create requests")
    
    service_request = ServiceRequest(
        **request.dict(),
        client_id=current_user.id
    )
    
    await db.service_requests.insert_one(service_request.dict())
    
    # Emit to provider
    await sio.emit('new_request', service_request.dict(), room=f"provider_{request.provider_id}")
    
    return service_request

@api_router.get("/requests", response_model=List[Dict[str, Any]])
async def get_requests(current_user: UserInDB = Depends(get_current_user)):
    if current_user.user_type == UserType.PRESTADOR:
        # Get requests for this provider
        requests = await db.service_requests.find({"provider_id": current_user.id}, {"_id": 0}).to_list(100)
        
        # Get client data for each request
        result = []
        for request in requests:
            client_data = await db.users.find_one({"id": request["client_id"]}, {"_id": 0})
            if client_data:
                request_info = {
                    **request,
                    "client_name": client_data["name"],
                    "client_phone": client_data["phone"]
                }
                result.append(request_info)
        return result
        
    else:  # Cliente
        # Get requests made by this client
        requests = await db.service_requests.find({"client_id": current_user.id}, {"_id": 0}).to_list(100)
        
        # Get provider data for each request
        result = []
        for request in requests:
            provider_profile = await db.provider_profiles.find_one({"user_id": request["provider_id"]}, {"_id": 0})
            if provider_profile:
                provider_user = await db.users.find_one({"id": request["provider_id"]}, {"_id": 0})
                if provider_user:
                    request_info = {
                        **request,
                        "provider_name": provider_user["name"],
                        "provider_phone": provider_user["phone"]
                    }
                    result.append(request_info)
        return result

@api_router.put("/requests/{request_id}/accept", response_model=ServiceRequest)
async def accept_request(
    request_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.user_type != UserType.PRESTADOR:
        raise HTTPException(status_code=403, detail="Only providers can accept requests")
    
    request = await db.service_requests.find_one({"id": request_id, "provider_id": current_user.id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update request status
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {"status": RequestStatus.ACCEPTED, "accepted_at": datetime.utcnow()}}
    )
    
    updated_request = await db.service_requests.find_one({"id": request_id})
    service_request = ServiceRequest(**updated_request)
    
    # Emit to client
    await sio.emit('request_accepted', service_request.dict(), room=f"client_{request['client_id']}")
    
    return service_request

@api_router.put("/requests/{request_id}/complete", response_model=ServiceRequest)
async def complete_request(
    request_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.user_type != UserType.PRESTADOR:
        raise HTTPException(status_code=403, detail="Only providers can complete requests")
    
    request = await db.service_requests.find_one({"id": request_id, "provider_id": current_user.id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update request status
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {"status": RequestStatus.COMPLETED, "completed_at": datetime.utcnow()}}
    )
    
    updated_request = await db.service_requests.find_one({"id": request_id})
    service_request = ServiceRequest(**updated_request)
    
    # Emit to client
    await sio.emit('request_completed', service_request.dict(), room=f"client_{request['client_id']}")
    
    return service_request

@api_router.post("/ratings", response_model=Rating)
async def create_rating(
    rating_data: RatingCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.user_type != UserType.CLIENTE:
        raise HTTPException(status_code=403, detail="Only clients can rate providers")
    
    rating = Rating(**rating_data.dict(), client_id=current_user.id)
    await db.ratings.insert_one(rating.dict())
    
    # Update provider's average rating
    ratings = await db.ratings.find({"provider_id": rating.provider_id}).to_list(1000)
    avg_rating = sum([r["rating"] for r in ratings]) / len(ratings)
    
    await db.provider_profiles.update_one(
        {"user_id": rating.provider_id},
        {"$set": {"rating": avg_rating, "total_reviews": len(ratings)}}
    )
    
    return rating

@api_router.put("/provider/location")
async def update_location(
    location: LocationUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.user_type != UserType.PRESTADOR:
        raise HTTPException(status_code=403, detail="Only providers can update location")
    
    await db.provider_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": {"latitude": location.latitude, "longitude": location.longitude}}
    )
    
    return {"message": "Location updated successfully"}

# Socket.IO events
@sio.event
async def connect(sid, environ, auth):
    print(f"Client {sid} connected")
    
    # Join user-specific room based on auth
    if auth and 'user_id' in auth and 'user_type' in auth:
        if auth['user_type'] == UserType.PRESTADOR:
            await sio.enter_room(sid, f"provider_{auth['user_id']}")
        else:
            await sio.enter_room(sid, f"client_{auth['user_id']}")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

@sio.event
async def location_update(sid, data):
    # Handle real-time location updates
    user_id = data.get('user_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    if user_id and latitude and longitude:
        await db.provider_profiles.update_one(
            {"user_id": user_id},
            {"$set": {"latitude": latitude, "longitude": longitude}}
        )
        
        # Emit to relevant clients/providers
        await sio.emit('location_updated', {
            'user_id': user_id,
            'latitude': latitude,
            'longitude': longitude
        }, room=f"provider_{user_id}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Use socket_app instead of app for the main application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8001)