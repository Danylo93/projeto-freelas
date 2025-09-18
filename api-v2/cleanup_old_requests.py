#!/usr/bin/env python3
"""
Script para limpar solicitações antigas do banco de dados
"""

import asyncio
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Configuração do MongoDB
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'freelas')

async def cleanup_old_requests():
    """Limpar solicitações antigas (mais de 1 hora)"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Data limite (1 hora atrás)
        cutoff_time = datetime.utcnow() - timedelta(hours=1)
        
        print(f"🧹 [CLEANUP] Limpando solicitações anteriores a {cutoff_time}")
        
        # Buscar solicitações antigas
        old_requests = await db.requests.find({
            "created_at": {"$lt": cutoff_time},
            "status": {"$in": ["pending", "offered"]}
        }).to_list(length=None)
        
        print(f"🧹 [CLEANUP] Encontradas {len(old_requests)} solicitações antigas")
        
        if old_requests:
            # Atualizar status para cancelled
            result = await db.requests.update_many(
                {
                    "created_at": {"$lt": cutoff_time},
                    "status": {"$in": ["pending", "offered"]}
                },
                {
                    "$set": {
                        "status": "cancelled",
                        "cancelled_reason": "Timeout - solicitação expirada",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            print(f"✅ [CLEANUP] {result.modified_count} solicitações marcadas como canceladas")
            
            # Liberar prestadores que estavam ocupados com essas solicitações
            provider_ids = [req.get('provider_id') for req in old_requests if req.get('provider_id')]
            if provider_ids:
                provider_result = await db.providers.update_many(
                    {"id": {"$in": provider_ids}},
                    {"$set": {"status": "available", "updated_at": datetime.utcnow()}}
                )
                print(f"✅ [CLEANUP] {provider_result.modified_count} prestadores liberados")
        
        # Estatísticas finais
        total_requests = await db.requests.count_documents({})
        active_requests = await db.requests.count_documents({
            "status": {"$in": ["pending", "offered", "accepted", "in_progress"]}
        })
        
        print(f"📊 [CLEANUP] Total de solicitações: {total_requests}")
        print(f"📊 [CLEANUP] Solicitações ativas: {active_requests}")
        
    except Exception as e:
        print(f"❌ [CLEANUP] Erro durante limpeza: {e}")
    finally:
        client.close()

async def show_current_status():
    """Mostrar status atual das solicitações"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Contar por status
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        status_counts = await db.requests.aggregate(pipeline).to_list(length=None)
        
        print("📊 [STATUS] Solicitações por status:")
        for item in status_counts:
            print(f"   {item['_id']}: {item['count']}")
        
        # Mostrar solicitações recentes
        recent_requests = await db.requests.find({}).sort("created_at", -1).limit(10).to_list(length=10)
        
        print("\n📋 [RECENT] Últimas 10 solicitações:")
        for req in recent_requests:
            created = req.get('created_at', 'N/A')
            print(f"   {req['id']}: {req['status']} - {created}")
            
    except Exception as e:
        print(f"❌ [STATUS] Erro ao obter status: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "status":
        asyncio.run(show_current_status())
    else:
        asyncio.run(cleanup_old_requests())
