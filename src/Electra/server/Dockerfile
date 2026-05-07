FROM node:18-slim

# Install dependencies for arduino-cli
RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install arduino-cli
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
ENV PATH="/root/bin:$PATH"

# Setup arduino core + forge-lib
RUN arduino-cli core update-index && \
    arduino-cli core install arduino:avr && \
    mkdir -p /app/forge-lib/libraries

# Init arduino config pointing to forge-lib
# We skip dest-dir if it's already in the path or handle it via environment
RUN arduino-cli config init && \
    arduino-cli config set directories.user /app/forge-lib

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/index.js"]
