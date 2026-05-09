@echo off
REM Install Common Arduino Libraries for LeapBlocks/Electra
REM This script installs frequently used Arduino libraries to forge-lib

echo ========================================
echo Installing Common Arduino Libraries
echo ========================================
echo.

set ARDUINO_CLI=arduino-cli\arduino-cli.exe
set CONFIG_FILE=forge-lib\arduino-cli.yaml

echo Checking arduino-cli...
if not exist "%ARDUINO_CLI%" (
    echo ERROR: arduino-cli.exe not found!
    echo Please ensure arduino-cli is installed in the arduino-cli folder.
    pause
    exit /b 1
)

echo.
echo Installing libraries...
echo.

REM Core Arduino Libraries
echo [1/10] Installing Servo...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "Servo"

echo [2/10] Installing WiFi...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "WiFi"

echo [3/10] Installing Wire...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "Wire"

echo [4/10] Installing LiquidCrystal...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "LiquidCrystal"

REM Adafruit Libraries
echo [5/10] Installing Adafruit NeoPixel...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "Adafruit NeoPixel"

echo [6/10] Installing DHT sensor library...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "DHT sensor library"

echo [7/10] Installing Adafruit Unified Sensor...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "Adafruit Unified Sensor"

REM Third-Party Libraries
echo [8/10] Installing LiquidCrystal I2C...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "LiquidCrystal I2C"

echo [9/10] Installing Keypad...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "Keypad"

REM ESP32 Specific
echo [10/10] Installing ESP32Servo...
"%ARDUINO_CLI%" --config-file "%CONFIG_FILE%" lib install "ESP32Servo"

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Installed libraries are located in:
echo %CD%\forge-lib\libraries\
echo.
echo You can now use these libraries in your sketches.
echo.
pause
