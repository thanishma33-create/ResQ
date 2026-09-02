import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.websocket_manager import manager

logger = logging.getLogger("resq.websocket")
router = APIRouter(tags=["Real-Time WebSockets"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-Time WebSocket Hub: ws://127.0.0.1:8000/ws
    Streams live SOS broadcasts, new emergencies, team location updates,
    shelter occupancy changes, resource allocations, and weather alerts.
    """
    await manager.connect(websocket)
    try:
        # Send initial connected greeting
        await websocket.send_text(json.dumps({
            "event": "CONNECTED",
            "message": "Connected to ResQ Real-Time Command Stream"
        }))

        while True:
            # Keep connection alive and process incoming messages/heartbeats
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "PING":
                    await websocket.send_text(json.dumps({"event": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
