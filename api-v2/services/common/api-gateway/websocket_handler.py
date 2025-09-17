import json
import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
import logging

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
        logger.info(f"🔌 [WS] Usuário {user_id} (tipo {user_type}) conectado")

    def disconnect(self, user_id: str):
        """Desconecta um usuário"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
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

async def websocket_endpoint(websocket: WebSocket, user_id: str = None, user_type: int = None, token: str = None):
    """Endpoint principal do WebSocket"""
    if not user_id or not user_type or not token:
        await websocket.close(code=1008, reason="Missing authentication data")
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
                    
            else:
                logger.warning(f"⚠️ [WS] Tipo de mensagem desconhecido: {message_type}")
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"❌ [WS] Erro no WebSocket: {e}")
        manager.disconnect(user_id)
