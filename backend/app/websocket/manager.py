"""
WebSocket Connection Manager for Real-Time SCADA Streaming
Broadcasts 1 Hz telemetry packets to all connected browser dashboards.
"""

import json
import logging
from typing import Set, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("scada.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, initial_state: Dict[str, Any]):
        """Accepts WebSocket connection and sends immediate initial state."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Active clients: {len(self.active_connections)}")
        try:
            # Immediate snapshot so UI doesn't have an empty lag before the next tick
            await websocket.send_text(json.dumps(initial_state))
        except Exception as e:
            logger.warning(f"Error sending initial state to client: {e}")

    def disconnect(self, websocket: WebSocket):
        """Removes client from active set."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Active clients: {len(self.active_connections)}")

    async def broadcast(self, data: Dict[str, Any]):
        """Broadcasts telemetry payload to all connected clients."""
        if not self.active_connections:
            return

        payload = json.dumps(data)
        stale_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting to client: {e}")
                stale_connections.append(connection)

        for stale in stale_connections:
            self.disconnect(stale)

manager = ConnectionManager()
