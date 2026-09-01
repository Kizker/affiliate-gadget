# ==========================================
# Multi-Stage Dockerfile for Next.js 15 App
# Affiliate Gadget Platform
# ==========================================

# 1. Base stage
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.16.0 --activate

# 2. Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build & prisma)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm db:generate

# 3. Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application (standalone output)
RUN pnpm build

# 4. Production Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and compiled standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
