#!/bin/bash
# Deploy script for Render CLI
# Usage: ./scripts/deploy.sh [service-id]

set -e

SERVICE_ID="${1:-srv-da2ovbmgekts73bd3pcg}"

echo "🔧 Checking for Render CLI..."

if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Installing..."
    npm install -g @renderinc/render-cli
    echo "✅ Render CLI installed"
fi

echo "🚀 Deploying service $SERVICE_ID to Render..."
render deploys create "$SERVICE_ID" --confirm

echo "✅ Deploy triggered! Check status with: render deploys list $SERVICE_ID"
