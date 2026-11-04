@echo off
title HeartCare AI - Full-Stack Cardiovascular Prediction Suite
echo ============================================================================
echo   HeartCare AI - Intelligent Cardiovascular Risk Assessment Suite
echo ============================================================================
echo   1. Python ML Microservice (Flask + Scikit-Learn Model)   -> Port 5000
echo   2. React Modern Web Portal (Vite + Tailored Medical UI)  -> Port 5173
echo   3. Spring Boot CDSS & MySQL Gateway (Optional)           -> Port 8080
echo ============================================================================
echo.

echo [*] Starting Python ML Microservice on port 5000...
start "HeartCare AI - ML Microservice" cmd /k "python ml-service\app.py"

timeout /t 2 /nobreak >nul

echo [*] Starting React Frontend on port 5173...
start "HeartCare AI - React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================================
echo   HeartCare AI is starting up!
echo ============================================================================
echo   - Web Application : http://localhost:5173
echo   - ML Health Check : http://localhost:5000/api/health
echo.
echo   Demo Clinician Login:
echo     Email    : doctor@cardioguard.com
echo     Password : password123
echo.
echo   To launch the Java Spring Boot CDSS Gateway (Port 8080):
echo     Run: run_spring_backend.bat
echo ============================================================================
pause
