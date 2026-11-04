@echo off
title HeartCare AI - Full-Stack Cardiovascular Prediction Suite
echo ============================================================================
echo   HeartCare AI - Full-Stack Integrated Cardiovascular CDSS
echo ============================================================================
echo   [1] Database      : MySQL (heart_disease_db on Port 3306)
echo   [2] ML Service    : Python Flask + Calibrated Random Forest (Port 5000)
echo   [3] Backend       : Java 25 + Spring Boot Gateway (Port 8080)
echo   [4] Frontend      : React 19 + Vite Medical Portal (Port 5173)
echo ============================================================================
echo.

echo [*] Launching Python ML Microservice (Port 5000)...
start "HeartCare AI [1/3] - Python ML Service (Port 5000)" cmd /k "python ml-service\app.py"

timeout /t 3 /nobreak >nul

echo [*] Launching Java Spring Boot Gateway (Port 8080)...
start "HeartCare AI [2/3] - Spring Boot Gateway (Port 8080)" cmd /k "set JAVA_HOME=C:\Program Files\Java\jdk-25&& set PATH=%JAVA_HOME%\bin;C:\Program Files\apache-maven-3.9.11\bin;%PATH%&& cd backend && mvn spring-boot:run"

timeout /t 4 /nobreak >nul

echo [*] Launching React Web Portal (Port 5173)...
start "HeartCare AI [3/3] - React Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================================
echo   All 3 services are launching in separate windows!
echo ============================================================================
echo   - Web Application : http://localhost:5173
echo   - Spring Boot CDSS: http://localhost:8080/api/health
echo   - ML Microservice : http://localhost:5000/api/health
echo.
echo   Demo Clinician Logins:
echo     1. doctor@cardioguard.com  (Password: password123) -> Dr. Alistair Reed, MD
echo     2. schen@heartcare.ai      (Password: password123) -> Dr. Sarah Chen, MD
echo.
echo   One-Click Demo buttons are available directly on the login page!
echo ============================================================================
pause
