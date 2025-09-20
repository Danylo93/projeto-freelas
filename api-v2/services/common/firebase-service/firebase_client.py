import firebase_admin
from firebase_admin import credentials, db
import os
import json
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime
import logging
from firebase_config import FIREBASE_DATABASE_URL, get_firebase_credentials

logger = logging.getLogger(__name__)

class FirebaseRealtimeClient:
    """Cliente para interagir com Firebase Realtime Database"""
    
    def __init__(self):
        self.app = None
        self.database_url = FIREBASE_DATABASE_URL
        self._initialize_app()
    
    def _initialize_app(self):
        """Inicializa o app Firebase"""
        try:
            cred_data = get_firebase_credentials()
            
            if isinstance(cred_data, str):
                # Usar arquivo de credenciais
                cred = credentials.Certificate(cred_data)
            elif isinstance(cred_data, dict):
                # Usar credenciais de variáveis de ambiente
                cred = credentials.Certificate(cred_data)
            else:
                # Usar credenciais padrão (Application Default Credentials)
                cred = credentials.ApplicationDefault()
            
            self.app = firebase_admin.initialize_app(
                cred,
                {
                    'databaseURL': self.database_url
                },
                name='freelas-backend'
            )
            logger.info("✅ Firebase app inicializado com sucesso")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar Firebase: {e}")
            raise
    
    def get_database(self):
        """Retorna a referência do banco de dados"""
        if not self.app:
            raise Exception("Firebase app não inicializado")
        return db.reference()
    
    async def create_request(self, request_data: Dict[str, Any]) -> bool:
        """Cria uma nova solicitação no Firebase"""
        try:
            ref = self.get_database()
            request_ref = ref.child('requests').child(request_data['id'])
            
            # Adicionar timestamps
            request_data['createdAt'] = datetime.utcnow().isoformat()
            request_data['updatedAt'] = datetime.utcnow().isoformat()
            
            request_ref.set(request_data)
            logger.info(f"✅ Request {request_data['id']} criado no Firebase")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar request no Firebase: {e}")
            return False
    
    async def update_request_status(self, request_id: str, status: str, additional_data: Optional[Dict[str, Any]] = None) -> bool:
        """Atualiza o status de uma solicitação"""
        try:
            ref = self.get_database()
            request_ref = ref.child('requests').child(request_id)
            
            update_data = {
                'status': status,
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            if additional_data:
                update_data.update(additional_data)
            
            request_ref.update(update_data)
            logger.info(f"✅ Request {request_id} status atualizado para {status}")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar status do request {request_id}: {e}")
            return False
    
    async def update_provider_location(self, provider_id: str, location_data: Dict[str, Any]) -> bool:
        """Atualiza a localização de um prestador"""
        try:
            ref = self.get_database()
            location_ref = ref.child('providerLocations').child(provider_id)
            
            location_data['updatedAt'] = datetime.utcnow().isoformat()
            location_ref.set(location_data)
            
            logger.info(f"✅ Localização do provider {provider_id} atualizada")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar localização do provider {provider_id}: {e}")
            return False
    
    async def create_offer(self, provider_id: str, request_id: str, offer_data: Dict[str, Any]) -> bool:
        """Cria uma oferta de prestador"""
        try:
            ref = self.get_database()
            offer_ref = ref.child('offers').child(provider_id).child(request_id)
            
            offer_data.update({
                'requestId': request_id,
                'providerId': provider_id,
                'status': 'pending',
                'createdAt': datetime.utcnow().isoformat()
            })
            
            offer_ref.set(offer_data)
            logger.info(f"✅ Oferta criada para request {request_id} pelo provider {provider_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar oferta: {e}")
            return False
    
    async def update_offer_status(self, provider_id: str, request_id: str, status: str) -> bool:
        """Atualiza o status de uma oferta"""
        try:
            ref = self.get_database()
            offer_ref = ref.child('offers').child(provider_id).child(request_id)
            
            update_data = {
                'status': status,
                'updatedAt': datetime.utcnow().isoformat()
            }
            
            if status == 'accepted':
                update_data['acceptedAt'] = datetime.utcnow().isoformat()
            elif status == 'rejected':
                update_data['rejectedAt'] = datetime.utcnow().isoformat()
            
            offer_ref.update(update_data)
            logger.info(f"✅ Oferta {request_id} status atualizado para {status}")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar status da oferta: {e}")
            return False
    
    async def set_provider_online_status(self, provider_id: str, is_online: bool) -> bool:
        """Define o status online/offline de um prestador"""
        try:
            ref = self.get_database()
            provider_ref = ref.child('users').child(provider_id)
            
            status_data = {
                'status': 'online' if is_online else 'offline',
                'lastSeen': datetime.utcnow().isoformat()
            }
            
            provider_ref.update(status_data)
            logger.info(f"✅ Provider {provider_id} status atualizado para {'online' if is_online else 'offline'}")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar status do provider {provider_id}: {e}")
            return False
    
    async def get_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Obtém uma solicitação específica"""
        try:
            ref = self.get_database()
            request_ref = ref.child('requests').child(request_id)
            request_data = request_ref.get()
            return request_data
        except Exception as e:
            logger.error(f"❌ Erro ao obter request {request_id}: {e}")
            return None
    
    async def get_provider_location(self, provider_id: str) -> Optional[Dict[str, Any]]:
        """Obtém a localização atual de um prestador"""
        try:
            ref = self.get_database()
            location_ref = ref.child('providerLocations').child(provider_id)
            location_data = location_ref.get()
            return location_data
        except Exception as e:
            logger.error(f"❌ Erro ao obter localização do provider {provider_id}: {e}")
            return None
    
    async def delete_offer(self, provider_id: str, request_id: str) -> bool:
        """Remove uma oferta"""
        try:
            ref = self.get_database()
            offer_ref = ref.child('offers').child(provider_id).child(request_id)
            offer_ref.delete()
            logger.info(f"✅ Oferta {request_id} removida")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao remover oferta: {e}")
            return False

# Instância global do cliente Firebase
firebase_client = FirebaseRealtimeClient()
