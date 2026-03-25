##########
# Timeline Backend (Next.js API) Production Dockerfile
# Multi-stage build: deps -> build -> prod-deps prune -> runtime
# Uses port 8000 (matches package.json scripts)
##########

ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Install minimal dependencies
RUN apk add --no-cache libc6-compat curl
COPY package.json package-lock.json* ./
# Use npm install instead of npm ci to handle dependency changes
RUN npm install --no-audit --no-fund

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
# Install minimal dependencies for builder and Go
RUN apk add --no-cache libc6-compat go gcc musl-dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build (includes compiling TS -> .next output)
# Skip environment validation during build
RUN SKIP_ENV_VALIDATION=true npm run build
# Also compile the TypeScript server
RUN npm run build:server

# Build Go WebSocket server
RUN cd /app && CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o websocket-server .

# Prune dev dependencies after build to shrink image
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules
# Simply prune dev dependencies without rebuilding
RUN npm prune --omit=dev || true

# Final stage
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
		NEXT_TELEMETRY_DISABLED=1

# Install Go WebSocket server dependencies
RUN apk add --no-cache ca-certificates

# Create non-root user (node base image already has node user)
USER node

# Copy necessary runtime artifacts
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/next.config.js ./next.config.js
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=prod-deps /app/package.json ./package.json

# Copy Go WebSocket binary from builder stage
COPY --chown=node:node --from=builder /app/websocket-server ./websocket-server
RUN chmod +x ./websocket-server

# Copy startup script
COPY --chown=node:node start.sh ./start.sh
RUN chmod +x ./start.sh

# Create uploads directory for profile pictures
RUN mkdir -p /app/public/uploads/profile-pictures \
    && chown -R node:node /app/public/uploads \
    && chmod 755 /app/public/uploads

# Expose API port
# Informational only; Heroku will assign $PORT. Keep 8000 as local default.
EXPOSE 8000

# Simple healthcheck hitting the health endpoint (adjust path if base path changes)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD node -e "const http=require('http');const p=process.env.PORT||8000;http.get('http://localhost:'+p+'/api/health',r=>{if(r.statusCode!==200)process.exit(1);}).on('error',()=>process.exit(1));"

# Start both servers using startup script
CMD ["./start.sh"]

