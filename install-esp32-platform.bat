@echo off
echo ========================================
echo ESP32 Platform Installation Script
echo ========================================
echo.
echo This will install the ESP32 platform for arduino-cli
echo Installation size: ~200MB
echo Time required: 2-5 minutes (depending on internet speed)
echo.
pause

echo.
echo Step 1: Updating package index...
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core update-index --additional-urls https://dl.espressif.com/dl/package_esp32_index.json,https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to update package index
    pause
    exit /b 1
)

echo.
echo Step 2: Installing ESP32 platform...
echo (This may take several minutes - please be patient)
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core install espressif:esp32 --additional-urls https://dl.espressif.com/dl/package_esp32_index.json

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Installation failed
    echo.
    echo Trying alternative URL...
    arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core install espressif:esp32 --additional-urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Installation failed with both URLs
        echo.
        echo Possible causes:
        echo - No internet connection
        echo - Firewall blocking downloads
        echo - Insufficient disk space
        echo - Antivirus blocking arduino-cli
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Verifying installation...
arduino-cli\arduino-cli.exe --config-file forge-lib\arduino-cli.yaml core list | findstr /i "esp32"

echo.
echo ESP32 platform is now installed.
echo You can now close this window and restart the Electron app.
echo.
pause
