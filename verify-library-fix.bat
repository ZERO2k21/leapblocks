@echo off
REM Verify Arduino Library Fix
REM This script checks if the Adafruit_NeoPixel library is properly installed

echo ========================================
echo Verifying Arduino Library Fix
echo ========================================
echo.

set LIBS_DIR=forge-lib\libraries
set NEOPIXEL_DIR=%LIBS_DIR%\Adafruit_NeoPixel
set NEOPIXEL_HEADER=%NEOPIXEL_DIR%\Adafruit_NeoPixel.h

echo [1/3] Checking libraries directory...
if exist "%LIBS_DIR%" (
    echo     ✓ Libraries directory exists: %LIBS_DIR%
) else (
    echo     ✗ ERROR: Libraries directory not found!
    goto :error
)

echo.
echo [2/3] Checking Adafruit_NeoPixel installation...
if exist "%NEOPIXEL_DIR%" (
    echo     ✓ Adafruit_NeoPixel directory exists
) else (
    echo     ✗ ERROR: Adafruit_NeoPixel not installed!
    echo.
    echo     To install, run:
    echo     arduino-cli\arduino-cli.exe --config-file "forge-lib\arduino-cli.yaml" lib install "Adafruit NeoPixel"
    goto :error
)

echo.
echo [3/3] Checking header file...
if exist "%NEOPIXEL_HEADER%" (
    echo     ✓ Adafruit_NeoPixel.h header file found
) else (
    echo     ✗ ERROR: Header file not found!
    goto :error
)

echo.
echo ========================================
echo All Installed Libraries:
echo ========================================
dir /b "%LIBS_DIR%"

echo.
echo ========================================
echo ✓ Verification PASSED!
echo ========================================
echo.
echo The Adafruit_NeoPixel library is properly installed.
echo You can now compile sketches that use #include ^<Adafruit_NeoPixel.h^>
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo ✗ Verification FAILED!
echo ========================================
echo.
echo Please run: install-common-libraries.bat
echo Or manually install: arduino-cli lib install "Adafruit NeoPixel"
echo.
pause
exit /b 1
