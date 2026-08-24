# Builds the bundled pio.exe (PlatformIO Core, Apache-2.0) that the LeapBlocks
# Electron app ships with — replacing the GPL-3.0 arduino-cli binary.
#
# Usage:  pwsh scripts/build-pio.ps1
# Output: src/drivers/platformio/pio.exe  (commit this artifact)
#
# Requires Python 3.10+ on PATH. Uses an isolated venv so the system Python
# is never touched. The output is a single ~70 MB self-contained exe.

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$outDir = Join-Path $root 'src\drivers\platformio'
$venv = Join-Path $env:TEMP 'leapblocks-pio-venv'
$buildDir = Join-Path $env:TEMP 'leapblocks-pio-build'

# 1. Choose a Python (prefer 3.10/3.11/3.12 — avoid 3.14 for PyInstaller compat)
$py = $null
foreach ($ver in @('3.12', '3.11', '3.10')) {
    $candidate = py -$ver -c "import sys; print(sys.executable)" 2>$null
    if ($LASTEXITCODE -eq 0 -and $candidate) { $py = $candidate.Trim(); break }
}
if (-not $py) {
    $probe = python -c "import sys; print(sys.executable)" 2>$null
    if ($LASTEXITCODE -eq 0 -and $probe) { $py = $probe.Trim() }
}
if (-not $py) { throw 'No Python found. Install Python 3.10+ and try again.' }
Write-Host "[pio-build] Using Python: $py"

# 2. Isolated venv + dependencies
if (-not (Test-Path (Join-Path $venv 'Scripts\python.exe'))) {
    Write-Host '[pio-build] Creating venv...'
    & $py -m venv $venv
}
$venvPy = Join-Path $venv 'Scripts\python.exe'
Write-Host '[pio-build] Installing platformio + pyinstaller...'
& $venvPy -m pip install --quiet --upgrade pip
& $venvPy -m pip install --quiet platformio pyinstaller
$version = & $venvPy -c "import platformio; print(platformio.__version__)" 2>$null
if (-not $version) { $version = 'unknown' }

# 3. Entry script (PyInstaller onefile needs a real module import)
$entry = Join-Path $buildDir 'pio_entry.py'
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
@'
import sys

def main():
    from platformio.__main__ import main as pio_main
    sys.exit(pio_main())

if __name__ == '__main__':
    main()
'@ | Set-Content -Path $entry -Encoding utf8

# 3b. Python embeddable package — PlatformIO runs scons.py via
#     PYTHONEXEPATH (proc.get_pythonexe_path), and a frozen exe cannot run
#     scons itself. Ship the matching-version embeddable Python next to
#     pio.exe, pip-install PlatformIO into it (scons + builder scripts import
#     platformio/click from there), and always set PYTHONEXEPATH + PYTHONPATH
#     when spawning pio.exe.
$embedVersion = '3.10.11'
$embedDir = Join-Path $outDir 'python'
$embedPython = Join-Path $embedDir 'python.exe'
if (-not (Test-Path $embedPython)) {
    Write-Host "[pio-build] Downloading Python $embedVersion embeddable package..."
    $zip = Join-Path $buildDir "python-$embedVersion-embed-amd64.zip"
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/$embedVersion/python-$embedVersion-embed-amd64.zip" -OutFile $zip
    New-Item -ItemType Directory -Force -Path $embedDir | Out-Null
    Expand-Archive -Force -Path $zip -DestinationPath $embedDir
    Remove-Item -Force $zip
}
$pthFile = Get-ChildItem $embedDir -Filter 'python*._pth' | Select-Object -First 1
if ($pthFile) {
    $content = Get-Content $pthFile.FullName
    if ($content -notcontains 'import site') {
        ($content -replace '^#import site', 'import site') | Set-Content $pthFile.FullName
    }
}
$embedSitePackages = Join-Path $embedDir 'Lib\site-packages'
$marker = Join-Path $embedSitePackages 'platformio'
if (-not (Test-Path $marker)) {
    Write-Host "[pio-build] Bootstrapping pip + platformio into embeddable python..."
    $getPip = Join-Path $buildDir 'get-pip.py'
    Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile $getPip
    & $embedPython $getPip --no-warn-script-location
    if ($LASTEXITCODE -ne 0) { throw 'get-pip.py failed' }
    Remove-Item -Force $getPip
    & $embedPython -m pip install --quiet --no-warn-script-location "platformio==$version"
    if ($LASTEXITCODE -ne 0) { throw 'pip install platformio into embeddable python failed' }
}
# esptool (GPLv2+) is required by espressif32 platform for ELF->BIN and bootloader merge.
# It is bundled here for offline ESP32 builds. For commercial distribution, GPL compliance
# is handled via THIRD_PARTY_LICENSES (see public/licenses/GPL-2.0-esptool.txt and source offer
# in public/licenses/README.txt). The tool is invoked as a separate process (aggregation),
# so your proprietary LeapLab code is not GPL-viral (see LICENSES/README).
& $embedPython -m pip install --quiet --no-warn-script-location esptool
if ($LASTEXITCODE -ne 0) { throw 'pip install esptool into embeddable python failed' }

# 4. Build the onefile exe
Write-Host "[pio-build] Building pio.exe (PlatformIO Core $version)..."
& $venvPy -m PyInstaller --noconfirm --clean --onefile --name pio `
    --collect-all platformio `
    --distpath (Join-Path $buildDir 'dist') `
    --workpath (Join-Path $buildDir 'work') `
    --specpath $buildDir $entry
if ($LASTEXITCODE -ne 0) { throw 'PyInstaller build failed' }

$exe = Join-Path $buildDir 'dist\pio.exe'
if (-not (Test-Path $exe)) { throw 'pio.exe not produced' }

# 5. Verify + copy into the repo
& $exe --version
if ($LASTEXITCODE -ne 0) { throw 'pio.exe --version failed' }

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Copy-Item -Force $exe (Join-Path $outDir 'pio.exe')
$size = [math]::Round((Get-Item (Join-Path $outDir 'pio.exe')).Length / 1MB, 1)
$pySize = [math]::Round((Get-ChildItem -Recurse $embedDir | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host "[pio-build] Done: src\drivers\platformio\pio.exe ($size MB, PlatformIO Core $version) + python/ embeddable ($pySize MB)"

# 6. (Optional) smoke test: AVR + ESP32 compile to verify the exe works
$smoke = $env:PIO_BUILD_SMOKE_TEST -eq '1'
if ($smoke) {
    Write-Host '[pio-build] Smoke test: compiling a minimal sketch (AVR)...'
    $proj = Join-Path $buildDir 'smoke'
    New-Item -ItemType Directory -Force -Path (Join-Path $proj 'src') | Out-Null
    '[env:uno]' | Set-Content (Join-Path $proj 'platformio.ini')
    'platform = atmelavr' | Add-Content (Join-Path $proj 'platformio.ini')
    'framework = arduino' | Add-Content (Join-Path $proj 'platformio.ini')
    'board = uno' | Add-Content (Join-Path $proj 'platformio.ini')
    'void setup() {}' | Set-Content (Join-Path $proj 'src\main.ino')
    'void loop() {}' | Add-Content (Join-Path $proj 'src\main.ino')
    $env:PYTHONEXEPATH = $embedPython
    $env:PYTHONPATH = Join-Path $embedDir 'Lib\site-packages'
    & $exe run -d $proj
    if ($LASTEXITCODE -ne 0) { throw 'Smoke test compile failed' }
    $hex = Get-ChildItem (Join-Path $proj '.pio\build\uno') -Filter '*.hex' -ErrorAction SilentlyContinue
    if (-not $hex) { throw 'Smoke test: firmware.hex not produced' }
    Write-Host "[pio-build] Smoke test passed: $($hex.Name)"
}