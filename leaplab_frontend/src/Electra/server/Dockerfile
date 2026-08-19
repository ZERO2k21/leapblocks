FROM oven/bun:1-slim

# PlatformIO Core (Apache-2.0 — replaces the GPL-3.0 arduino-cli)
RUN apt-get update && apt-get install -y python3 python3-pip ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    pip3 install --no-cache-dir platformio

ENV PIO_CLI_PATH=/usr/local/bin/pio
ENV PIO_LIB_DIRS=/app/forge-lib/libraries

# Preinstall platforms + forge-lib library cache
RUN pio platform install atmelavr && \
    pio platform install espressif32 && \
    mkdir -p /app/forge-lib/libraries

WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
RUN bun run build

EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]