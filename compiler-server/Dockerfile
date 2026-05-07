# ── Electra Compile Server ─────────────────────────────────────────────────
# Multi-stage build: installs arduino-cli + ESP32 core, then runs the server
# Deploy to: Railway, Render, Fly.io, or any Docker host
#
# Build:  docker build -t electra-compiler .
# Run:    docker run -p 3001:3001 electra-compiler

FROM node:20-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# ── Install arduino-cli ───────────────────────────────────────────────────────
ARG ARDUINO_CLI_VERSION=1.1.1
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh \
    | BINDIR=/usr/local/bin sh -s ${ARDUINO_CLI_VERSION}

# ── Configure arduino-cli ─────────────────────────────────────────────────────
RUN arduino-cli config init && \
    arduino-cli config set board_manager.additional_urls \
      "https://dl.espressif.com/dl/package_esp32_index.json" && \
    arduino-cli core update-index

# ── Install Arduino AVR core ──────────────────────────────────────────────────
RUN arduino-cli core install arduino:avr

# ── Install ESP32 core (this takes a few minutes on first build) ──────────────
RUN arduino-cli core install esp32:esp32 && \
    echo "ESP32 core installed successfully"

# ── Install common Arduino libraries ─────────────────────────────────────────
RUN arduino-cli lib install \
    "Adafruit SSD1306" \
    "Adafruit GFX Library" \
    "Adafruit BusIO" \
    "LiquidCrystal I2C" \
    "DHT sensor library" \
    "Servo" \
    "ESP32Servo" \
    "Adafruit NeoPixel" \
    "MPU6050" \
    "IRremote" \
    "Keypad" \
    "HX711" \
    || true

# ── App ───────────────────────────────────────────────────────────────────────
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
