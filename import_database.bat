@echo off
title HeartCare AI - MySQL Database Setup
echo ============================================================================
echo   HeartCare AI - Import Schema & Stored Procedures into MySQL
echo ============================================================================
echo.

set "MYSQL_BIN=mysql"
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
) else if exist "C:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_BIN=C:\xampp\mysql\bin\mysql.exe"
)

echo [*] Using MySQL Client: "%MYSQL_BIN%"
echo [*] Importing database\heart_disease_db.sql...
echo.

"%MYSQL_BIN%" -u root -p < "database\heart_disease_db.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Database heart_disease_db and all 7 Stored Procedures are ready!
) else (
    echo.
    echo [NOTE] If needed, enter your MySQL root password when prompted.
    echo You can also open database\heart_disease_db.sql in MySQL Workbench or phpMyAdmin and run it.
)
echo.
pause

