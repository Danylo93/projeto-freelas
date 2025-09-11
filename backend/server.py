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
import googlemaps
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Google Maps client
gmaps = googlemaps.Client(key=os.environ['GOOGLE_MAPS_API_KEY'])

# JWT Configuration
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
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
    NEAR_CLIENT = "near_client"
    STARTED = "started"
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
    latitude: float
    longitude: float
    address: str
    status: ServiceStatus = ServiceStatus.AVAILABLE
    rating: float = 0.0
    total_ratings: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    provider_id: str
    category: str
    description: str
    client_latitude: float
    client_longitude: float
    client_address: str
    provider_latitude: Optional[float] = None
    provider_longitude: Optional[float] = None
    price: float
    status: RequestStatus = RequestStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    photo_url: Optional[str] = None

class Rating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    client_id: str
    provider_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

# Helper functions
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in kilometers between two points"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_address_from_coordinates(latitude: float, longitude: float) -> str:
    """Get address from coordinates using Google Maps Geocoding API"""
    try:
        result = gmaps.reverse_geocode((latitude, longitude))
        if result:
            return result[0]['formatted_address']
        return f"Lat: {latitude}, Lng: {longitude}"
    except Exception as e:
        print(f"Geocoding error: {e}")
        return f"Lat: {latitude}, Lng: {longitude}"

# API Routes

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "FreelancerApp API is running", "status": "ok"}

@api_router.get("/health")
async def health_check():
    return {"message": "API is healthy", "status": "ok"}

# Authentication routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = UserInDB(
        **user_data.dict(exclude={"password"}),
        hashed_password=hashed_password
    )
    
    await db.users.insert_one(user.dict())
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_type=user.user_type,
        user_data=User(**user.dict())
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_type=user["user_type"],
        user_data=User(**user)
    )

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Provider routes
@api_router.post("/provider/profile", response_model=ServiceProviderProfile)
async def create_provider_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.PRESTADOR:
        raise HTTPException(status_code=403, detail="Only providers can create profiles")
    
    # Get address from coordinates
    address = await get_address_from_coordinates(
        profile_data["latitude"], 
        profile_data["longitude"]
    )
    
    profile = ServiceProviderProfile(
        user_id=current_user.id,
        category=profile_data["category"],
        price=profile_data["price"],
        description=profile_data["description"],
        latitude=profile_data["latitude"],
        longitude=profile_data["longitude"],
        address=address
    )
    
    await db.provider_profiles.insert_one(profile.dict())
    return profile

@api_router.get("/providers", response_model=List[Dict[str, Any]])
async def get_providers(current_user: User = Depends(get_current_user)):
    if current_user.user_type != UserType.CLIENTE:
        raise HTTPException(status_code=403, detail="Only clients can view providers")
    
    providers = []
    async for provider in db.provider_profiles.find():
        user = await db.users.find_one({"id": provider["user_id"]})
        if user:
            # Calculate distance (assuming client is at a default location for now)
            distance = calculate_distance(-23.5489, -46.6388, provider["latitude"], provider["longitude"])
            
            providers.append({
                "id": provider["id"],
                "name": user["name"],
                "category": provider["category"],
                "price": provider["price"],
                "description": provider["description"],
                "latitude": provider["latitude"],
                "longitude": provider["longitude"],
                "address": provider["address"],
                "status": provider["status"],
                "rating": provider["rating"],
                "distance": round(distance, 1),
                "user_id": provider["user_id"]
            })
    
    return providers

# Service request routes
@api_router.post("/requests", response_model=ServiceRequest)
async def create_service_request(
    request_data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CLIENTE:
        raise HTTPException(status_code=403, detail="Only clients can create requests")
    
    # Get client address
    client_address = await get_address_from_coordinates(
        request_data["client_latitude"],
        request_data["client_longitude"]
    )
    
    service_request = ServiceRequest(
        client_id=current_user.id,
        provider_id=request_data["provider_id"],
        category=request_data["category"],
        description=request_data["description"],
        client_latitude=request_data["client_latitude"],
        client_longitude=request_data["client_longitude"],
        client_address=client_address,
        price=request_data["price"]
    )
    
    await db.service_requests.insert_one(service_request.dict())
    
    # Emit real-time notification to provider
    await sio.emit('new_request', {
        'request_id': service_request.id,
        'client_name': current_user.name,
        'client_phone': current_user.phone,
        'category': service_request.category,
        'description': service_request.description,
        'price': service_request.price,
        'distance': calculate_distance(
            request_data["client_latitude"],
            request_data["client_longitude"],
            0, 0  # Provider coordinates will be updated
        ),
        'client_address': client_address
    }, room=f"provider_{request_data['provider_id']}")
    
    return service_request

@api_router.get("/requests", response_model=List[Dict[str, Any]])
async def get_requests(current_user: User = Depends(get_current_user)):
    requests = []
    
    if current_user.user_type == UserType.PRESTADOR:
        # Providers see requests made to them
        async for request in db.service_requests.find({"provider_id": current_user.id}):
            client = await db.users.find_one({"id": request["client_id"]})
            if client:
                requests.append({
                    **request,
                    "client_name": client["name"],
                    "client_phone": client["phone"]
                })
    else:
        # Clients see their own requests
        async for request in db.service_requests.find({"client_id": current_user.id}):
            provider_profile = await db.provider_profiles.find_one({"user_id": request["provider_id"]})
            provider_user = await db.users.find_one({"id": request["provider_id"]})
            if provider_profile and provider_user:
                requests.append({
                    **request,
                    "provider_name": provider_user["name"],
                    "provider_phone": provider_user["phone"],
                    "provider_category": provider_profile["category"]
                })
    
    return requests

@api_router.put("/requests/{request_id}/accept")
async def accept_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
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
    
    # Get provider profile for location
    provider_profile = await db.provider_profiles.find_one({"user_id": current_user.id})
    
    # Emit real-time notification to client
    await sio.emit('request_accepted', {
        'request_id': request_id,
        'provider_name': current_user.name,
        'provider_phone': current_user.phone,
        'category': request["category"],
        'estimated_time': 15,  # Mock estimation
        'provider_latitude': provider_profile["latitude"] if provider_profile else None,
        'provider_longitude': provider_profile["longitude"] if provider_profile else None
    }, room=f"client_{request['client_id']}")
    
    return {"message": "Request accepted successfully"}

@api_router.put("/requests/{request_id}/update-status")
async def update_request_status(
    request_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_user)
):
    request = await db.service_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update request status
    update_data = {"status": status_data["status"]}
    if status_data["status"] == RequestStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
        if "photo_url" in status_data:
            update_data["photo_url"] = status_data["photo_url"]
    
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    # Emit real-time notification
    room = f"client_{request['client_id']}" if current_user.user_type == UserType.PRESTADOR else f"provider_{request['provider_id']}"
    await sio.emit('status_updated', {
        'request_id': request_id,
        'status': status_data["status"],
        'message': status_data.get("message", "")
    }, room=room)
    
    return {"message": "Status updated successfully"}

@api_router.post("/ratings", response_model=Rating)
async def create_rating(
    rating_data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.CLIENTE:
        raise HTTPException(status_code=403, detail="Only clients can rate services")
    
    request = await db.service_requests.find_one({"id": rating_data["request_id"], "client_id": current_user.id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    rating = Rating(
        request_id=rating_data["request_id"],
        client_id=current_user.id,
        provider_id=request["provider_id"],
        rating=rating_data["rating"],
        comment=rating_data.get("comment")
    )
    
    await db.ratings.insert_one(rating.dict())
    
    # Update provider's average rating
    ratings = []
    async for r in db.ratings.find({"provider_id": request["provider_id"]}):
        ratings.append(r["rating"])
    
    if ratings:
        avg_rating = sum(ratings) / len(ratings)
        await db.provider_profiles.update_one(
            {"user_id": request["provider_id"]},
            {"$set": {"rating": round(avg_rating, 1), "total_ratings": len(ratings)}}
        )
    
    return rating

@api_router.put("/provider/location")
async def update_provider_location(
    location: LocationUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != UserType.PRESTADOR:
        raise HTTPException(status_code=403, detail="Only providers can update location")
    
    # Update provider location
    await db.provider_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": {"latitude": location.latitude, "longitude": location.longitude}}
    )
    
    # Emit location update to active requests
    async for request in db.service_requests.find({
        "provider_id": current_user.id,
        "status": {"$in": [RequestStatus.ACCEPTED, RequestStatus.IN_PROGRESS]}
    }):
        distance = calculate_distance(
            location.latitude, location.longitude,
            request["client_latitude"], request["client_longitude"]
        )
        
        await sio.emit('provider_location_update', {
            'request_id': request["id"],
            'provider_latitude': location.latitude,
            'provider_longitude': location.longitude,
            'distance': round(distance, 1),
            'estimated_time': max(5, int(distance * 2))  # Mock time estimation
        }, room=f"client_{request['client_id']}")
    
    return {"message": "Location updated successfully"}

# Socket.IO Events
@sio.event
async def connect(sid, environ, auth):
    print(f"Client {sid} connected")
    if auth and 'user_id' in auth:
        user_type = auth.get('user_type', 1)
        user_id = auth['user_id']
        room = f"{'provider' if user_type == 1 else 'client'}_{user_id}"
        await sio.enter_room(sid, room)
        print(f"Client {sid} joined room {room}")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

@sio.event
async def location_update(sid, data):
    user_id = data.get('user_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    if user_id and latitude and longitude:
        await db.provider_profiles.update_one(
            {"user_id": user_id},
            {"$set": {"latitude": latitude, "longitude": longitude}}
        )
        
        # Emit to relevant clients
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

# For production, export socket_app
app = socket_app