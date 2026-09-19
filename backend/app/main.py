"""
FastAPI Application Entry Point
PLC-SCADA Digital Twin Industrial System
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.routes import router as api_router
from .websocket.manager import manager
from .simulation.engine import sim_engine
from .database.db import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("scada.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown lifecycles."""
    logger.info("Initializing SCADA SQLite database...")
    init_db()

    logger.info("Hooking simulation engine to WebSocket broadcaster...")
    sim_engine.register_broadcast_callback(manager.broadcast)

    logger.info("Starting Industrial Simulation Engine background loop...")
    await sim_engine.start()

    yield

    logger.info("Stopping Industrial Simulation Engine...")
    await sim_engine.stop()

app = FastAPI(
    title="PLC-SCADA Digital Twin Industrial API",
    description="Real-time industrial automation backend with simulated PLC logic, Modbus TCP registers, and SQLite persistence.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite frontend and general development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API routes
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "project": "PLC-SCADA Digital Twin Dashboard",
        "system": "Automated Industrial Manufacturing Line",
        "status": "ONLINE",
        "endpoints": {
            "docs": "/docs",
            "telemetry_ws": "/ws",
            "system_status": "/api/status",
            "sensors": "/api/sensors",
            "production": "/api/production",
            "history": "/api/history",
            "modbus": "/api/modbus/registers"
        }
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time SCADA telemetry streaming (1 Hz).
    Sends immediate snapshot on connection, then continuous push frames.
    """
    initial_snapshot = sim_engine.get_telemetry_snapshot()
    await manager.connect(websocket, initial_snapshot)
    try:
        while True:
            # Keep socket alive and receive any client messages (ping, commands)
            data = await websocket.receive_text()
            # If client sends a ping or custom JSON command, respond appropriately
            try:
                if data == "ping":
                    await websocket.send_text("pong")
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        manager.disconnect(websocket)
