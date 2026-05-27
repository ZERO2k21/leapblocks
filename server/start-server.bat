@echo off
echo ========================================
echo   LeapBlocks Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

REM Check if arduino-cli exists
set ARDUINO_CLI_PATH=..\arduino-cli\arduino-cli.exe
if not exist "%ARDUINO_CLI_PATH%" (
    echo [WARNING] arduino-cli not found at %ARDUINO_CLI_PATH%
    echo [INFO] Compilation will use system arduino-cli if available
    echo [INFO] To install: https://arduino.github.io/arduino-cli/latest/installation/
    echo.
)

echo [INFO] Starting LeapBlocks Server...
echo [INFO] Server will run on http://localhost:3001
echo [INFO] Press Ctrl+C to stop
echo.
echo ========================================
echo.

REM Start the server
npm start
