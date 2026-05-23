@echo off
title Electra ESP32 Development Environment
color 0A

echo.
echo ========================================
echo   Electra ESP32 Development Setup
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Starting Compiler Server...
echo.
start "Electra Compiler Server" cmd /k "cd /d %~dp0compiler-server && npm start"
timeout /t 3 /nobreak >nul

echo [2/3] Waiting for server to start...
timeout /t 5 /nobreak >nul

echo [3/3] Testing server...
cd /d %~dp0compiler-server
call node test-server.js
cd /d %~dp0

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Compiler Server: http://localhost:3001
echo.
echo Next steps:
echo 1. Start your web app: npm run dev
echo 2. Open browser: http://localhost:5173
echo 3. Go to Electra Studio
echo 4. Select ESP32-C3 board
echo 5. Write code and click "Compile & Run"
echo.
echo Press any key to exit...
pause >nul
