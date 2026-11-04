@echo off
title CardioGuard AI - Heart Disease Prediction Suite
echo ========================================================
echo   Starting CardioGuard AI Application
echo   1. ML Backend & Medical Reporting API (Port 5000)
echo   2. React Frontend (Port 5173)
echo ========================================================

start "CardioGuard ML Service" cmd /k "python ml-service\app.py"
start "CardioGuard Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are launching in separate windows!
echo - Web Dashboard: http://localhost:5173
echo - ML API:        http://localhost:5000/api/health
echo ========================================================
pause

