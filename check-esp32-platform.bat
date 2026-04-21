@echo off
echo ========================================
echo ESP32 Platform Installation Check
echo ========================================
echo.

echo Checking arduino-cli location...
if exist "arduino-cli\arduino-cli.exe" (
    echo [OK] arduino-cli.exe found
) else (
    echo [ERROR] arduino-cli.exe NOT FOUND in arduino-cli folder
    echo Please download from: https://arduino.github.io/arduino-cli/latest/installation/
    pause
    exit /b 1
)
echo.

echo Checking config file...
if exist "forge-lib\arduino-cli.yaml" (
    echo [OK] arduino-cli.yaml found
) else (
    echo [ERROR] arduino-cli.yaml NOT FOUND
    pause
    exit /b 1
)
echo.

echo Listing installed cores...
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core list
echo.

echo Checking for ESP32 platform specifically...
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core list | findstr /i "esp32"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] ESP32 platform is installed!
) else (
    echo.
    echo [WARNING] ESP32 platform NOT installed
    echo.
    echo To install, run:
    echo arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core install espressif:esp32 --additional-urls https://dl.espressif.com/dl/package_esp32_index.json
)
echo.

echo ========================================
echo Check complete
echo ========================================
pause
