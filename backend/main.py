import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import engine, Base
import models
from routers import (
    auth,
    emergencies,
    sos,
    disasters,
    teams,
    volunteers,
    assignments,
    resources,
    shelters,
    weather,
    notifications,
    broadcasts,
    analytics,
    audit,
    evidence,
    map as map_router,
    locations,
    duplicates,
    incidents,
    websocket
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and ensure offline sync schema
    from database import ensure_db_schema
    ensure_db_schema()
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title="ResQ – Disaster Relief Resource Tracking & Volunteer Coordination API",
    description="""
    ## ResQ Command & Control Disaster Response Backend
    
    Comprehensive mission-critical API backend providing:
    - 🚨 **Emergency Requests & Triage**: AI Priority Scoring & Lifecycle Workflow
    - 🆘 **Instant 1-Click SOS Dispatch**: Rapid distress signalling and notifications
    - 🌪️ **Disaster & Weather Risk**: Multi-hazard monitoring & early warnings
    - 📍 **GPS & Location Intelligence**: Haversine proximity & dynamic ETA calculation
    - 🚑 **Rescue Teams & Volunteers**: Skill-based AI matching & real-time dispatch
    - 📦 **Resource Inventory & Allocation**: Strict availability quotas & shortage prevention
    - 🏫 **Shelter Operations**: Strict capacity controls & occupancy tracking
    - 📡 **Real-Time WebSockets**: Live telemetry, alerts, and instant broadcast stream
    - 🔐 **JWT & Role-Based Access Control**: Secure multi-tiered authorization
    - 📷 **Proof of Resolution**: On-scene evidence uploading & chronological audit trails
    - 🔄 **Duplicate Incident Detection**: Proximity & semantic matching algorithms
    - 📴 **Offline Synchronization**: Idempotent batch syncing for low-network environments
    - 🗣️ **Voice Emergency Reporting**: Structured intake from browser speech recognition
    - 🗺️ **Unified Operational Map Layer**: Geospatial intelligence and command center feeds
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if "*" not in settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Evidence Uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix="/api/auth")
app.include_router(auth.router, prefix="/auth")
app.include_router(emergencies.router)
app.include_router(sos.router)
app.include_router(sos.router, prefix="/sos")
app.include_router(disasters.router)
app.include_router(teams.router)
app.include_router(volunteers.router)
app.include_router(assignments.router)
app.include_router(resources.router)
app.include_router(shelters.router)
app.include_router(weather.router)
app.include_router(notifications.router)
app.include_router(broadcasts.router)
app.include_router(analytics.router)
app.include_router(audit.router)
app.include_router(evidence.router)
app.include_router(map_router.router)
app.include_router(locations.router)
app.include_router(locations.router, prefix="/locations")
app.include_router(duplicates.router)
app.include_router(incidents.router)
app.include_router(websocket.router)

@app.get("/", tags=["System"])
def root():
    return {
        "project": "ResQ Disaster Relief & Volunteer Coordination Platform",
        "status": "OPERATIONAL",
        "version": "1.0.0",
        "docs_url": "/docs",
        "websocket_url": "ws://127.0.0.1:8000/ws"
    }

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
