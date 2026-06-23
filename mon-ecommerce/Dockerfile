# ==== Dockerfile for WhatsApp bot (Render) ====
# Base image with Node and Debian utilities
FROM node:20-slim AS base

# ---- Install Chrome (stable) ----
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates wget gnupg && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends google-chrome-stable && \
    apt-get purge -y --auto-remove wget gnupg && \
    rm -rf /var/lib/apt/lists/*

# ---- Puppeteer configuration ----
# Use the Chrome binary we just installed
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_DOWNLOAD=1
ENV NODE_ENV=production

# ---- Working directory ----
WORKDIR /app

# Copy only lockfiles first for caching
COPY package*.json ./
COPY services/whatsapp-bot/package*.json services/whatsapp-bot/

# Install root dependencies + bot dependencies
RUN npm ci && \
    npm ci --prefix services/whatsapp-bot

# Copy the rest of the source code
COPY . .

# ---- Start the bot ----
CMD ["node", "services/whatsapp-bot/server.js"]
