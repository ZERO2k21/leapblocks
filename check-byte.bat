@echo off
echo.
echo Byte Character Sprite Status Check
echo ===================================
echo.

cd /d "%~dp0"

if not exist "public\assets\sprites\leap" (
    echo ERROR: Sprites directory not found!
    pause
    exit /b 1
)

echo Checking for sprite files...
echo.

set count=0

if exist "public\assets\sprites\leap\byte_byte-a.png" (
    echo [OK] byte_byte-a.png
    set /a count+=1
) else (
    echo [MISSING] byte_byte-a.png
)

if exist "public\assets\sprites\leap\byte_byte-b.png" (
    echo [OK] byte_byte-b.png
    set /a count+=1
) else (
    echo [MISSING] byte_byte-b.png
)

if exist "public\assets\sprites\leap\byte_byte-c.png" (
    echo [OK] byte_byte-c.png
    set /a count+=1
) else (
    echo [MISSING] byte_byte-c.png
)

if exist "public\assets\sprites\leap\byte_byte-d.png" (
    echo [OK] byte_byte-d.png
    set /a count+=1
) else (
    echo [MISSING] byte_byte-d.png
)

echo.
echo Found %count% of 4 required files
echo.

if %count%==4 (
    echo SUCCESS: All sprite files are in place!
    echo.
    echo IMPORTANT: Verify transparent backgrounds!
    echo   - Open each PNG in an image viewer
    echo   - Background should be transparent (checkerboard pattern)
    echo   - No white or colored box around the character
    echo.
    echo Next steps:
    echo   1. Verify transparent backgrounds
    echo   2. Restart your dev server: npm run dev
    echo   3. Open the sprite library
    echo   4. Search for "Byte"
    echo   5. Test the sprite!
) else (
    echo Please prepare your 4 Byte character images:
    echo   1. Remove backgrounds (make transparent)
    echo   2. Save as PNG format
    echo   3. Rename with these exact names:
    echo      - byte_byte-a.png
    echo      - byte_byte-b.png
    echo      - byte_byte-c.png
    echo      - byte_byte-d.png
    echo   4. Copy to: public\assets\sprites\leap\
    echo.
    echo Tools for background removal:
    echo   - Remove.bg (online, automatic)
    echo   - Photoshop (professional)
    echo   - GIMP (free)
    echo   - PowerPoint (quick method)
)

echo.
echo See BYTE_SPRITE_GUIDE.md for detailed instructions
echo.
pause
