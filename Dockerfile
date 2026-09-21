# ==============================================================================
# Editron — Multi-Stage Production Dockerfile (FFmpeg + Node.js 20 + React Client)
# Designed for Render.com, Railway, Fly.io, or VPS Docker hosts
# ==============================================================================

# ---- Stage 1: Build Frontend ----
FROM node:20-bullseye-slim AS frontend-builder
WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY client/ ./
RUN npm run build

# ---- Stage 2: Production Server with FFmpeg ----
FROM node:20-bullseye-slim AS production
WORKDIR /app

# Install native FFmpeg, FFprobe, and essential media codecs
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Verify FFmpeg installation
RUN ffmpeg -version && ffprobe -version

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy root & server package manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies for server
WORKDIR /app/server
RUN npm ci --only=production

# Return to /app
WORKDIR /app

# Copy server code
COPY server/ ./server/

# Copy built frontend from Stage 1 into client/dist (for all-in-one serving)
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create storage directories for video uploads and final renders
RUN mkdir -p server/uploads server/outputs uploads outputs

# Expose server port (Render will bind to $PORT dynamically)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/api/health || exit 1

# Start the Editron server
CMD ["node", "server/index.js"]
