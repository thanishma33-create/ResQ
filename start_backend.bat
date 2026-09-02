@echo off
title ResQ Backend Server (FastAPI)
echo ========================================================
echo Starting ResQ Disaster Relief FastAPI Backend Server...
echo API Docs: http://127.0.0.1:8000/docs
echo WebSocket: ws://127.0.0.1:8000/ws
echo ========================================================
cd /d "%~dp0"
if exist ".\venv\Scripts\python.exe" (
    .\venv\Scripts\python.exe -m uvicorn main:app --reload --app-dir backend --host 127.0.0.1 --port 8000
) else (
    python -m uvicorn main:app --reload --app-dir backend --host 127.0.0.1 --port 8000
)
pause
