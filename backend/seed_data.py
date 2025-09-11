#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados iniciais de prestadores
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
import googlemaps

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Google Maps client
gmaps = googlemaps.Client(key=os.environ['GOOGLE_MAPS_API_KEY'])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

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

async def create_sample_providers():
    """Create sample providers with their profiles"""
    
    providers_data = [
        {
            "name": "João Silva",
            "email": "joao.encanador@exemplo.com",
            "phone": "11999887766",
            "password": "123456",
            "category": "Encanador",
            "price": 120.00,
            "description": "Serviços de encanamento residencial e comercial. Experiência de 10 anos. Trabalho com vazamentos, instalações e reparos.",
            "latitude": -23.5489,
            "longitude": -46.6388,
            "status": "available"
        },
        {
            "name": "Carlos Eletricista",
            "email": "carlos.eletricista@exemplo.com", 
            "phone": "11777665544",
            "password": "123456",
            "category": "Eletricista",
            "price": 150.00,
            "description": "Instalações elétricas e manutenção. Certificado pelo CREA. Serviços residenciais e comerciais.",
            "latitude": -23.5505,
            "longitude": -46.6333,
            "status": "available"
        },
        {
            "name": "Maria Borracheira",
            "email": "maria.pneus@exemplo.com",
            "phone": "11888776655", 
            "password": "123456",
            "category": "Borracheiro",
            "price": 80.00,
            "description": "Serviços de borracharia 24h. Troca de pneus, consertos e calibragem. Atendimento rápido e eficiente.",
            "latitude": -23.5518,
            "longitude": -46.6395,
            "status": "offline"
        },
        {
            "name": "Pedro Pintor",
            "email": "pedro.pintor@exemplo.com",
            "phone": "11555443322",
            "password": "123456", 
            "category": "Pintor",
            "price": 200.00,
            "description": "Pintura residencial e comercial. Trabalho com tintas de qualidade. Orçamento gratuito.",
            "latitude": -23.5475,
            "longitude": -46.6358,
            "status": "available"
        },
        {
            "name": "Ana Diarista",
            "email": "ana.limpeza@exemplo.com",
            "phone": "11666554433",
            "password": "123456",
            "category": "Diarista", 
            "price": 100.00,
            "description": "Serviços de limpeza residencial. Trabalho com produtos próprios. Flexibilidade de horários.",
            "latitude": -23.5520,
            "longitude": -46.6420,
            "status": "available"
        },
        {
            "name": "Ricardo Marceneiro",
            "email": "ricardo.madeira@exemplo.com",
            "phone": "11777888999",
            "password": "123456",
            "category": "Marceneiro",
            "price": 180.00,
            "description": "Móveis sob medida e reformas em madeira. 15 anos de experiência. Trabalho artesanal de qualidade.",
            "latitude": -23.5495,
            "longitude": -46.6370,
            "status": "available"
        },
        {
            "name": "Fernanda Jardineira",
            "email": "fernanda.jardim@exemplo.com",
            "phone": "11444555666",
            "password": "123456",
            "category": "Jardineiro",
            "price": 90.00,
            "description": "Cuidado de jardins e plantas. Poda, replantio e paisagismo. Serviço especializado e cuidadoso.",
            "latitude": -23.5460,
            "longitude": -46.6410,
            "status": "offline"
        },
        {
            "name": "Luiz Mecânico",
            "email": "luiz.mecanico@exemplo.com",
            "phone": "11333222111",
            "password": "123456",
            "category": "Mecânico",
            "price": 220.00,
            "description": "Mecânica automotiva geral. Diagnóstico e reparo. Atendimento domiciliar e em oficina.",
            "latitude": -23.5535,
            "longitude": -46.6385,
            "status": "available"
        },
        {
            "name": "Tatiana Cozinheira",
            "email": "tatiana.cozinha@exemplo.com",
            "phone": "11222333444",
            "password": "123456",
            "category": "Cozinheira",
            "price": 160.00,
            "description": "Serviços de culinária para eventos e refeições diárias. Especialista em comida brasileira.",
            "latitude": -23.5445,
            "longitude": -46.6325,
            "status": "available"
        },
        {
            "name": "Roberto Chaveiro",
            "email": "roberto.chaves@exemplo.com",
            "phone": "11111222333",
            "password": "123456",
            "category": "Chaveiro",
            "price": 70.00,
            "description": "Serviços de chaveiro 24h. Abertura de portas, cópias de chaves e reparos em fechaduras.",
            "latitude": -23.5525,
            "longitude": -46.6355,
            "status": "available"
        }
    ]
    
    print("🌱 Iniciando população do banco de dados...")
    print("🚀 Criando prestadores de exemplo...")
    
    for provider_data in providers_data:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": provider_data["email"]})
        if existing_user:
            print(f"⚠️  Usuário {provider_data['name']} já existe, pulando...")
            continue
            
        # Create user
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "name": provider_data["name"],
            "email": provider_data["email"],
            "phone": provider_data["phone"],
            "user_type": 1,  # Prestador
            "hashed_password": get_password_hash(provider_data["password"]),
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.users.insert_one(user)
        
        # Get address from coordinates
        address = await get_address_from_coordinates(
            provider_data["latitude"], 
            provider_data["longitude"]
        )
        
        # Create provider profile
        profile_id = str(uuid.uuid4())
        profile = {
            "id": profile_id,
            "user_id": user_id,
            "category": provider_data["category"],
            "price": provider_data["price"],
            "description": provider_data["description"],
            "latitude": provider_data["latitude"],
            "longitude": provider_data["longitude"],
            "address": address,
            "status": provider_data["status"],
            "rating": round(3.5 + (hash(provider_data["name"]) % 150) / 100, 1),  # Random rating between 3.5-5.0
            "total_ratings": hash(provider_data["name"]) % 50 + 10,  # Random ratings count
            "created_at": datetime.utcnow()
        }
        
        await db.provider_profiles.insert_one(profile)
        print(f"✅ Criado prestador: {provider_data['name']} - {provider_data['category']}")

async def create_sample_clients():
    """Create sample clients"""
    
    clients_data = [
        {
            "name": "Cliente Teste 1",
            "email": "cliente1@exemplo.com",
            "phone": "11987654321",
            "password": "123456"
        },
        {
            "name": "Cliente Teste 2", 
            "email": "cliente2@exemplo.com",
            "phone": "11876543210",
            "password": "123456"
        },
        {
            "name": "Maria Santos",
            "email": "maria.santos@exemplo.com",
            "phone": "11765432109",
            "password": "123456"
        },
        {
            "name": "José Silva",
            "email": "jose.silva@exemplo.com",
            "phone": "11654321098",
            "password": "123456"
        }
    ]
    
    print("🚀 Criando clientes de exemplo...")
    
    for client_data in clients_data:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": client_data["email"]})
        if existing_user:
            print(f"⚠️  Cliente {client_data['name']} já existe, pulando...")
            continue
            
        # Create client user
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "name": client_data["name"],
            "email": client_data["email"],
            "phone": client_data["phone"],
            "user_type": 2,  # Cliente
            "hashed_password": get_password_hash(client_data["password"]),
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.users.insert_one(user)
        print(f"✅ Criado cliente: {client_data['name']}")

async def create_sample_categories():
    """Create service categories"""
    
    categories = [
        {"name": "Encanador", "description": "Serviços de encanamento e hidráulica"},
        {"name": "Eletricista", "description": "Instalações e reparos elétricos"},
        {"name": "Borracheiro", "description": "Serviços de borracharia e pneus"},
        {"name": "Pintor", "description": "Pintura residencial e comercial"},
        {"name": "Diarista", "description": "Serviços de limpeza e organização"},
        {"name": "Marceneiro", "description": "Trabalhos em madeira e móveis"},
        {"name": "Jardineiro", "description": "Cuidado de jardins e plantas"},
        {"name": "Mecânico", "description": "Reparos e manutenção automotiva"},
        {"name": "Cozinheira", "description": "Serviços culinários e eventos"},
        {"name": "Chaveiro", "description": "Serviços de chaveiro e fechaduras"}
    ]
    
    print("🚀 Criando categorias de serviços...")
    
    for category_data in categories:
        # Check if category already exists
        existing_category = await db.service_categories.find_one({"name": category_data["name"]})
        if existing_category:
            continue
            
        category_id = str(uuid.uuid4())
        category = {
            "id": category_id,
            "name": category_data["name"],
            "description": category_data["description"]
        }
        
        await db.service_categories.insert_one(category)

async def main():
    try:
        await create_sample_categories()
        await create_sample_providers()
        await create_sample_clients()
        print("✅ Banco de dados populado com sucesso!")
        
        # Show summary
        providers_count = await db.provider_profiles.count_documents({})
        clients_count = await db.users.count_documents({"user_type": 2})
        categories_count = await db.service_categories.count_documents({})
        
        print(f"\n📊 Resumo:")
        print(f"   • {providers_count} prestadores criados")
        print(f"   • {clients_count} clientes criados") 
        print(f"   • {categories_count} categorias criadas")
        print(f"\n🔑 Credenciais de teste:")
        print(f"   • Prestador: joao.encanador@exemplo.com / 123456")
        print(f"   • Cliente: cliente1@exemplo.com / 123456")
        
    except Exception as e:
        print(f"❌ Erro ao popular banco de dados: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())