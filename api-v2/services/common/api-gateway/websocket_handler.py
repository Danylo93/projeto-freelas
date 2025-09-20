import json
import asyncio
import os
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
import logging
import jwt

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Armazena conexões ativas por user_id
        self.active_connections: Dict[str, WebSocket] = {}
        # Armazena salas por room_id -> set de user_ids
        self.rooms: Dict[str, Set[str]] = {}
        # Armazena user_id -> set de rooms
        self.user_rooms: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, user_type: int):
        """Conecta um usuário"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
        # Armazenar dados do usuário
        if not hasattr(self, 'user_data'):
            self.user_data = {}
        self.user_data[user_id] = {
            'user_type': user_type,
            'connected_at': asyncio.get_event_loop().time()
        }
        
        logger.info(f"🔌 [WS] Usuário {user_id} (tipo {user_type}) conectado")

    def disconnect(self, user_id: str):
        """Desconecta um usuário"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
        # Remove dados do usuário
        if hasattr(self, 'user_data') and user_id in self.user_data:
            del self.user_data[user_id]
            
        # Remove de todas as salas
        if user_id in self.user_rooms:
            for room_id in self.user_rooms[user_id]:
                if room_id in self.rooms:
                    self.rooms[room_id].discard(user_id)
                    if not self.rooms[room_id]:
                        del self.rooms[room_id]
            del self.user_rooms[user_id]
            
        logger.info(f"🔌 [WS] Usuário {user_id} desconectado")

    async def join_room(self, user_id: str, room_id: str):
        """Adiciona usuário a uma sala"""
        if user_id not in self.active_connections:
            return False
            
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
            
        self.rooms[room_id].add(user_id)
        
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)
        
        logger.info(f"🚪 [WS] Usuário {user_id} entrou na sala {room_id}")
        return True

    async def leave_room(self, user_id: str, room_id: str):
        """Remove usuário de uma sala"""
        if room_id in self.rooms:
            self.rooms[room_id].discard(user_id)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
                
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]
                
        logger.info(f"🚪 [WS] Usuário {user_id} saiu da sala {room_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        """Envia mensagem para um usuário específico"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
                return True
            except Exception as e:
                logger.error(f"❌ [WS] Erro ao enviar mensagem para {user_id}: {e}")
                return False
        return False

    async def send_room_message(self, message: dict, room_id: str):
        """Envia mensagem para todos os usuários de uma sala"""
        if room_id not in self.rooms:
            return False
            
        sent_count = 0
        for user_id in self.rooms[room_id].copy():
            if await self.send_personal_message(message, user_id):
                sent_count += 1
                
        logger.info(f"📤 [WS] Mensagem enviada para {sent_count} usuários na sala {room_id}")
        return sent_count > 0

    async def broadcast_message(self, message: dict):
        """Envia mensagem para todos os usuários conectados"""
        sent_count = 0
        for user_id in list(self.active_connections.keys()):
            if await self.send_personal_message(message, user_id):
                sent_count += 1
                
        logger.info(f"📤 [WS] Mensagem broadcast enviada para {sent_count} usuários")
        return sent_count > 0

    def get_connection_count(self) -> int:
        """Retorna número de conexões ativas"""
        return len(self.active_connections)

    def get_room_count(self) -> int:
        """Retorna número de salas ativas"""
        return len(self.rooms)

# Instância global do gerenciador
manager = ConnectionManager()

async def notify_providers_new_request(request_data: dict):
    """Notifica prestadores disponíveis sobre nova solicitação"""
    category = request_data.get('category')
    client_latitude = request_data.get('client_latitude')
    client_longitude = request_data.get('client_longitude')

    # Encontrar prestadores online da categoria
    online_providers = []
    if hasattr(manager, 'user_data'):
        for user_id, user_data in manager.user_data.items():
            if user_data.get('user_type') == 1:  # Prestador
                # Aqui você pode adicionar lógica para verificar categoria e distância
                online_providers.append(user_id)

    # Enviar notificação para prestadores elegíveis
    notification = {
        'type': 'new_request',
        'request_id': request_data.get('id'),
        'category': category,
        'description': request_data.get('description'),
        'price': request_data.get('price'),
        'client_latitude': client_latitude,
        'client_longitude': client_longitude,
        'client_address': request_data.get('client_address'),
        'timestamp': request_data.get('created_at')
    }

    for provider_id in online_providers:
        await manager.send_personal_message(notification, provider_id)

async def notify_client_provider_found(request_id: str, provider_data: dict):
    """Notifica cliente que um prestador foi encontrado"""
    notification = {
        'type': 'provider_found',
        'request_id': request_id,
        'provider_id': provider_data.get('id'),
        'provider_name': provider_data.get('name'),
        'provider_rating': provider_data.get('rating'),
        'estimated_arrival': '10-15 min',
        'timestamp': provider_data.get('updated_at')
    }

    await manager.send_room_message(notification, f"request_{request_id}")

async def notify_request_accepted(request_id: str, provider_data: dict):
    """Notifica cliente que prestador aceitou a solicitação"""
    notification = {
        'type': 'request_accepted',
        'request_id': request_id,
        'provider_id': provider_data.get('id'),
        'provider_name': provider_data.get('name'),
        'message': 'Prestador aceitou sua solicitação e está a caminho!',
        'timestamp': provider_data.get('updated_at')
    }

    await manager.send_room_message(notification, f"request_{request_id}")

async def websocket_endpoint(websocket: WebSocket, user_id: str = None, user_type: int = None, token: str = None):
    """Endpoint principal do WebSocket"""
    print(f"🔌 [WS] Iniciando websocket_endpoint")
    print(f"🔌 [WS] Parâmetros recebidos: user_id={user_id}, user_type={user_type}, token={'Presente' if token else 'Ausente'}")
    
    if not user_id or not user_type or not token:
        print(f"❌ [WS] Dados de autenticação ausentes: user_id={user_id}, user_type={user_type}, token={'Presente' if token else 'Ausente'}")
        await websocket.close(code=1008, reason="Missing authentication data")
        return

    # Validar token JWT
    try:
        SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-here-change-in-production")
        print(f"🔌 [WS] Validando token JWT...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        token_user_id = payload.get("sub")
        token_user_type = payload.get("user_type")

        print(f"🔌 [WS] Token decodificado: user_id={token_user_id}, user_type={token_user_type}")

        # Verificar se os dados do token batem com os parâmetros
        if token_user_id != user_id or token_user_type != user_type:
            print(f"❌ [WS] Dados do token não batem: token_user_id={token_user_id} != user_id={user_id} ou token_user_type={token_user_type} != user_type={user_type}")
            await websocket.close(code=1008, reason="Invalid authentication data")
            return

        print(f"✅ [WS] Autenticação válida, conectando usuário {user_id}")

    except jwt.ExpiredSignatureError:
        print(f"❌ [WS] Token expirado")
        await websocket.close(code=1008, reason="Token expired")
        return
    except jwt.InvalidTokenError as e:
        print(f"❌ [WS] Token inválido: {e}")
        await websocket.close(code=1008, reason="Invalid token")
        return
    except Exception as e:
        print(f"❌ [WS] Erro inesperado na autenticação: {e}")
        await websocket.close(code=1008, reason="Authentication error")
        return

    await manager.connect(websocket, user_id, user_type)
    
    try:
        while True:
            # Receber mensagem do cliente
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Processar tipo de mensagem
            message_type = message.get('type', '')
            
            if message_type == 'ping':
                # Heartbeat
                await manager.send_personal_message({
                    'type': 'pong',
                    'timestamp': message.get('timestamp')
                }, user_id)
                
            elif message_type == 'join_room':
                room_id = message.get('room')
                if room_id:
                    await manager.join_room(user_id, room_id)
                    await manager.send_personal_message({
                        'type': 'room_joined',
                        'room': room_id
                    }, user_id)
                    
            elif message_type == 'leave_room':
                room_id = message.get('room')
                if room_id:
                    await manager.leave_room(user_id, room_id)
                    await manager.send_personal_message({
                        'type': 'room_left',
                        'room': room_id
                    }, user_id)
                    
            elif message_type == 'send_message':
                room_id = message.get('room')
                message_data = message.get('data', {})
                if room_id:
                    await manager.send_room_message({
                        'type': 'message',
                        'from': user_id,
                        'data': message_data,
                        'timestamp': message.get('timestamp')
                    }, room_id)
                else:
                    # Broadcast se não especificar sala
                    await manager.broadcast_message({
                        'type': 'message',
                        'from': user_id,
                        'data': message_data,
                        'timestamp': message.get('timestamp')
                    })

            elif message_type == 'location_update':
                # Atualização de localização do prestador
                request_id = message.get('request_id')
                provider_id = message.get('provider_id')
                latitude = message.get('latitude')
                longitude = message.get('longitude')

                if request_id and provider_id and latitude and longitude:
                    await manager.send_room_message({
                        'type': 'location_updated',
                        'request_id': request_id,
                        'provider_id': provider_id,
                        'latitude': latitude,
                        'longitude': longitude,
                        'timestamp': message.get('timestamp')
                    }, f"request_{request_id}")

            elif message_type == 'request_status_update':
                # Atualização de status da solicitação
                request_id = message.get('request_id')
                status = message.get('status')

                if request_id and status:
                    await manager.send_room_message({
                        'type': 'request_status_updated',
                        'request_id': request_id,
                        'status': status,
                        'timestamp': message.get('timestamp')
                    }, f"request_{request_id}")

            else:
                logger.warning(f"⚠️ [WS] Tipo de mensagem desconhecido: {message_type}")
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"❌ [WS] Erro no WebSocket: {e}")
        manager.disconnect(user_id)
