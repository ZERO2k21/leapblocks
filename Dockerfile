FROM node:20-slim

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

ARG ARDUINO_CLI_VERSION=1.1.1
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh \
    | BINDIR=/usr/local/bin sh -s ${ARDUINO_CLI_VERSION}

ENV ARDUINO_DIRECTORIES_DATA=/app/arduino-data
ENV ARDUINO_DIRECTORIES_DOWNLOADS=/app/arduino-data/staging
ENV ARDUINO_DIRECTORIES_USER=/app/arduino-data/user

RUN arduino-cli config init && \
    arduino-cli config set board_manager.additional_urls \
      "https://dl.espressif.com/dl/package_esp32_index.json" && \
    arduino-cli core update-index

RUN arduino-cli core install arduino:avr

RUN arduino-cli core install esp32:esp32 && \
    echo "ESP32 core installed successfully"

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

WORKDIR /app

COPY server/package.json server/package-lock.json* /tmp/server/
RUN cd /tmp/server && npm install --production && \
    mkdir -p /app && cp -r /tmp/server/node_modules /app/node_modules

COPY server/ ./server/
COPY src/studio/apk/ ./src/studio/apk/
COPY tools/ ./tools/

EXPOSE 3001
EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "server/server.js"]
