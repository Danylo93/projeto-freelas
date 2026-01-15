import uvicorn
import socketio
from fastapi import FastAPI
from src.core.infrastructure.db import db
from src.modules.identity.interface.router import router as auth_router
from src.modules.realtime.socket_service import socket_app, setup_realtime_listeners, sio

app = FastAPI(title="FreelancerApp API v2")

@app.on_event("startup")
async def startup():
    db.connect()
    await setup_realtime_listeners()

@app.on_event("shutdown")
async def shutdown():
    db.close()

app.include_router(auth_router)

@app.get("/")
def health_check():
    return {"status": "ok", "version": "v2"}

# Wrap FastAPI with SocketIO
final_app = socketio.ASGIApp(sio, app)

if __name__ == "__main__":
    uvicorn.run("src.main:final_app", host="0.0.0.0", port=8000, reload=True)
