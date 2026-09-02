@echo off
title Stop ResQ Servers
echo ========================================================
echo Stopping running ResQ backend and frontend processes...
echo ========================================================
powershell -Command "Get-NetTCPConnection -LocalPort 8000, 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo.
echo All ResQ services on ports 8000 and 3000 have been stopped.
echo ========================================================
pause
