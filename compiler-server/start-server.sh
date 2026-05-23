#!/bin/bash

echo "========================================"
echo "  Electra Compiler Server"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[INFO] Node.js version:"
node --version
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies!"
        exit 1
    fi
    echo ""
fi

# Check if arduino-cli exists
ARDUINO_CLI_PATH="../arduino-cli/arduino-cli"
if [ ! -f "$ARDUINO_CLI_PATH" ]; then
    echo "[WARNING] arduino-cli not found at $ARDUINO_CLI_PATH"
    echo "[INFO] Compilation will use system arduino-cli if available"
    echo "[INFO] To install: https://arduino.github.io/arduino-cli/latest/installation/"
    echo ""
fi

echo "[INFO] Starting Electra Compiler Server..."
echo "[INFO] Server will run on http://localhost:3001"
echo "[INFO] Press Ctrl+C to stop"
echo ""
echo "========================================"
echo ""

node server.js
