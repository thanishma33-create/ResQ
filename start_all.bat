@echo off
title ResQ Platform Launcher
echo ========================================================
echo Launching ResQ Full Platform (Backend + Frontend)...
echo ========================================================
cd /d "%~dp0"
start "ResQ Backend (FastAPI)" cmd /c "start_backend.bat"
timeout /t 2 /nobreak >nul
start "ResQ Frontend (Vite)" cmd /c "start_frontend.bat"
echo.
echo ========================================================
echo Both servers are launching:
echo - Frontend:  http://127.0.0.1:3000
echo - Backend:   http://127.0.0.1:8000
echo - Swagger:   http://127.0.0.1:8000/docs
echo - WebSocket: ws://127.0.0.1:8000/ws
echo ========================================================
