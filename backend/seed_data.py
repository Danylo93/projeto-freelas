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

# Load environment variables
load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

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
            "description": "Serviços de encanamento residencial e comercial. Experiência de 10 anos.",
            "latitude": -23.5489,
            "longitude": -46.6388,
        },
        {
            "name": "Carlos Eletricista",
            "email": "carlos.eletricista@exemplo.com", 
            "phone": "11777665544",
            "password": "123456",
            "category": "Eletricista",
            "price": 300.00,
            "description": "Instalações elétricas e manutenção. Certificado pelo CREA.",
            "latitude": -23.5489,
            "longitude": -46.6388,
        },
        {
            "name": "Maria Borracheira",
            "email": "maria.borracheira@exemplo.com",
            "phone": "11555443322", 
            "password": "123456",
            "category": "Borracheiro",
            "price": 80.00,
            "description": "Conserto de pneus e serviços automotivos 24h.",
            "latitude": -23.5489,
            "longitude": -46.6388,
        },
        {
            "name": "Pedro Pintor",
            "email": "pedro.pintor@exemplo.com",
            "phone": "11333221100",
            "password": "123456", 
            "category": "Pintor",
            "price": 200.00,
            "description": "Pintura residencial e comercial. Materiais próprios.",
            "latitude": -23.5489,
            "longitude": -46.6388,
        },
        {
            "name": "Ana Diarista",
            "email": "ana.diarista@exemplo.com",
            "phone": "11888777666",
            "password": "123456",
            "category": "Diarista", 
            "price": 150.00,
            "description": "Limpeza residencial e comercial. Produtos próprios.",
            "latitude": -23.5489,
            "longitude": -46.6388,
        }
    ]

    print("🚀 Criando prestadores de exemplo...")
    
    for provider_data in providers_data:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": provider_data["email"]})
        if existing_user:
            print(f"⚠️  Usuário {provider_data['name']} já existe, pulando...")
            continue
            
        # Create user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(provider_data["password"])
        
        user_doc = {
            "id": user_id,
            "name": provider_data["name"],
            "email": provider_data["email"],
            "phone": provider_data["phone"],
            "user_type": 1,  # Prestador
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.users.insert_one(user_doc)
        
        # Create provider profile
        profile_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "category": provider_data["category"],
            "price": provider_data["price"],
            "description": provider_data["description"],
            "status": "available",
            "latitude": provider_data["latitude"],
            "longitude": provider_data["longitude"],
            "rating": 4.5,  # Iniciar com rating inicial
            "total_reviews": 0,
            "created_at": datetime.utcnow()
        }
        
        await db.provider_profiles.insert_one(profile_doc)
        
        print(f"✅ Criado prestador: {provider_data['name']} - {provider_data['category']}")

async def create_sample_clients():
    """Create sample clients"""
    
    clients_data = [
        {
            "name": "Cliente Teste 1",
            "email": "cliente1@exemplo.com",
            "phone": "11111111111",
            "password": "123456"
        },
        {
            "name": "Cliente Teste 2", 
            "email": "cliente2@exemplo.com",
            "phone": "11222222222",
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
            
        # Create user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(client_data["password"])
        
        user_doc = {
            "id": user_id,
            "name": client_data["name"],
            "email": client_data["email"], 
            "phone": client_data["phone"],
            "user_type": 2,  # Cliente
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.users.insert_one(user_doc)
        print(f"✅ Criado cliente: {client_data['name']}")

async def main():
    print("🌱 Iniciando população do banco de dados...")
    await create_sample_providers()
    await create_sample_clients() 
    print("✅ Banco de dados populado com sucesso!")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(main())