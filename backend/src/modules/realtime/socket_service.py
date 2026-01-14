import socketio
from src.core.infrastructure.event_bus_impl import event_bus

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

async def setup_realtime_listeners():
    # Example: Listen to internal events and push to socket
    await event_bus.subscribe("request.created", handle_request_created)
    await event_bus.subscribe("provider.location_update", handle_location_update)

async def handle_request_created(data):
    # Notify providers in room (or specific provider)
    # For matching, maybe broadcast to 'providers' room
    await sio.emit('new_request', data)

async def handle_location_update(data):
    request_id = data.get('request_id')
    if request_id:
        await sio.emit('location_update', data, room=f"request_{request_id}")

@sio.event
async def connect(sid, environ, auth):
    print(f"Socket connected: {sid}")
    # Handle auth join rooms
    if auth and 'user_id' in auth:
        await sio.enter_room(sid, f"user_{auth['user_id']}")

@sio.event
async def update_location(sid, data):
    # Client sends location -> Publish to Event Bus
    await event_bus.publish("client.location_update", data)
