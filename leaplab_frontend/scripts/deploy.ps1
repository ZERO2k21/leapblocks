# Deploy script for Render CLI (Windows)
# Usage: .\scripts\deploy.ps1 [service-id]

param(
    [string]$ServiceId = "srv-da2ovbmgekts73bd3pcg"
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Checking for Render CLI..." -ForegroundColor Cyan

if (-not (Get-Command render -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Render CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @renderinc/render-cli
    Write-Host "✅ Render CLI installed" -ForegroundColor Green
}

Write-Host "🚀 Deploying service $ServiceId to Render..." -ForegroundColor Cyan
render deploys create $ServiceId --confirm

Write-Host "✅ Deploy triggered! Check status with: render deploys list $ServiceId" -ForegroundColor Green
