@echo off
title HeartCare AI - Spring Boot CDSS & MySQL Gateway (Port 8080)
echo ============================================================================
echo   HeartCare AI - Spring Boot Clinical Decision Support Backend
echo ============================================================================
echo   Running on: http://localhost:8080
echo   Database  : MySQL (heart_disease_db)
echo ============================================================================
echo.

set JAVA_HOME=C:\Program Files\Java\jdk-25
set PATH=%JAVA_HOME%\bin;C:\Program Files\apache-maven-3.9.11\bin;%PATH%

cd backend
mvn spring-boot:run
pause

