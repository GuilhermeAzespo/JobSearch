# Multi-stage lightweight Dockerfile for Easypanel deployment
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies first for better Docker layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Ensure data directory exists for persistent volume mounting in Easypanel
RUN mkdir -p /app/data

EXPOSE 3000

# Run server
CMD ["node", "server.js"]

