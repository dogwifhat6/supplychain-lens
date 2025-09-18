# Simple Dockerfile for Railway deployment
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    python3 \
    py3-pip \
    build-base \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install frontend dependencies
RUN npm install

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Copy source code
WORKDIR /app
COPY . .

# Make startup script executable
RUN chmod +x /app/start.sh

# Build frontend
RUN npm run build

# Copy built frontend to backend public directory
RUN mkdir -p backend/public && cp -r dist/* backend/public/

# Set working directory to backend
WORKDIR /app/backend

# Build backend
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create necessary directories
RUN mkdir -p logs uploads temp && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
