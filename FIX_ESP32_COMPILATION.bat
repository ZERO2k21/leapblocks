@echo off
echo ========================================
echo ESP32-C3 Compilation Fix Script
echo ========================================
echo.

echo Step 1: Clearing ESP32 build cache...
echo Deleting: %TEMP%\forge_esp32_*
rmdir /s /q "%TEMP%\forge_esp32_esp32_esp32_esp32c3" 2>nul
if exist "%TEMP%\forge_esp32_esp32_esp32_esp32c3" (
    echo WARNING: Could not delete build cache. Please close any running processes.
) else (
    echo ✓ Build cache cleared successfully
)
echo.

echo Step 2: Checking ESP32 core installation...
arduino-cli core list | findstr "esp32"
if errorlevel 1 (
    echo ERROR: ESP32 core not found!
    echo Please install it with: arduino-cli core install esp32:esp32
    pause
    exit /b 1
)
echo.

echo Step 3: Checking arduino-cli version...
arduino-cli version
if errorlevel 1 (
    echo ERROR: arduino-cli not found in PATH!
    echo Please install arduino-cli first.
    pause
    exit /b 1
)
echo.

echo ========================================
echo Fix Applied Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Restart your LeapBlocks application
echo 2. Try compiling your ESP32-C3 sketch again
echo.
echo If the issue persists, try downgrading ESP32 core:
echo   arduino-cli core uninstall esp32:esp32
echo   arduino-cli core install esp32:esp32@3.0.7
echo.
pause
