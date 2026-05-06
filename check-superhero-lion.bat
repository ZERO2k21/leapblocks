@echo off
echo.
echo Superhero Lion Sprite Status Check
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

if exist "public\assets\sprites\leap\superhero_lion_superhero_lion-a.png" (
    echo [OK] superhero_lion_superhero_lion-a.png
    set /a count+=1
) else (
    echo [MISSING] superhero_lion_superhero_lion-a.png
)

if exist "public\assets\sprites\leap\superhero_lion_superhero_lion-b.png" (
    echo [OK] superhero_lion_superhero_lion-b.png
    set /a count+=1
) else (
    echo [MISSING] superhero_lion_superhero_lion-b.png
)

if exist "public\assets\sprites\leap\superhero_lion_superhero_lion-c.png" (
    echo [OK] superhero_lion_superhero_lion-c.png
    set /a count+=1
) else (
    echo [MISSING] superhero_lion_superhero_lion-c.png
)

if exist "public\assets\sprites\leap\superhero_lion_superhero_lion-d.png" (
    echo [OK] superhero_lion_superhero_lion-d.png
    set /a count+=1
) else (
    echo [MISSING] superhero_lion_superhero_lion-d.png
)

echo.
echo Found %count% of 4 required files
echo.

if %count%==4 (
    echo SUCCESS: All sprite files are in place!
    echo.
    echo Next steps:
    echo   1. Restart your dev server: npm run dev
    echo   2. Open the sprite library
    echo   3. Search for "Superhero Lion"
    echo   4. Test the sprite!
) else (
    echo Please copy your 4 lion sprite images to:
    echo   public\assets\sprites\leap\
    echo.
    echo With these exact names:
    echo   - superhero_lion_superhero_lion-a.png
    echo   - superhero_lion_superhero_lion-b.png
    echo   - superhero_lion_superhero_lion-c.png
    echo   - superhero_lion_superhero_lion-d.png
)

echo.
echo See SUPERHERO_LION_SPRITE_GUIDE.md for more details
echo.
pause
