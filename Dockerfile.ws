# ================================================================
# Dockerfile.ws — Standalone Live Stream WebSocket Server
# Affiliate Gadget Platform (LiveKit Chat, Likes, Real-Time Interactivity)
# ================================================================

FROM node:22-alpine AS runner
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install OpenSSL for Prisma engine compatibility and curl for health check
RUN apk add --no-cache libc6-compat openssl curl
RUN corepack enable && corepack prepare pnpm@10.16.0 --activate

# Copy dependency manifests and prisma schema
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies needed by ws-server (including tsx and @prisma/client)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm db:generate

# Copy TypeScript config and ws-server source code
COPY tsconfig.json ./
COPY ws-server ./ws-server

# Create non-root user for container security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 wsuser
RUN chown -R wsuser:nodejs /app

USER wsuser

ENV NODE_ENV=production
ENV WS_PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["./node_modules/.bin/tsx", "ws-server/index.ts"]
