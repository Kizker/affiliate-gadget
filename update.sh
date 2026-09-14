#!/bin/bash
# ================================================================
# update.sh — Script Cepat Update & Deploy Affiliate Gadget di VPS Hostinger
# Cara pakai: cd /opt/affiliate-gadget && bash update.sh
# ================================================================

set -e

APP_DIR="/opt/affiliate-gadget"
COMPOSE_FILE="docker-compose.yml"

echo "=========================================="
echo "🚀 Memulai Update Deploy di VPS Hostinger..."
echo "=========================================="

cd "$APP_DIR"

# 1. Tarik kode terbaru dari GitHub
echo ""
echo "[1/4] Mengambil kode terbaru dari Git (main)..."
git fetch origin
git checkout main
git pull origin main

# 2. Sinkronisasi Skema Database Prisma (jika ada perubahan skema)
echo ""
echo "[2/4] Sinkronisasi skema database (Prisma db push)..."
DOCKER_NETWORK=$(docker network ls --filter name=affiliate --format '{{.Name}}' | head -1)
if [ -z "$DOCKER_NETWORK" ]; then
    DOCKER_NETWORK="affiliate_gadget_network"
fi

docker run --rm \
    --network "$DOCKER_NETWORK" \
    -v "$APP_DIR":/app \
    -w /app \
    -e DATABASE_URL="postgresql://agadget:AgProd2026Secure@postgres:5432/affiliate_gadget?schema=public" \
    node:22-alpine \
    sh -c "apk add --no-cache openssl && npm install -g tsx@4.19.2 && npx prisma@6 db push --schema=./prisma/schema.prisma --skip-generate" 2>&1 || true

# 3. Rebuild container Next.js app dengan kode baru
echo ""
echo "[3/4] Melakukan build container Next.js (app)..."
docker compose -f "$COMPOSE_FILE" build app

# 4. Restart container app
echo ""
echo "[4/4] Memperbarui dan menjalankan container..."
docker compose -f "$COMPOSE_FILE" up -d app

echo ""
echo "=========================================="
echo "✅ UPDATE DEPLOY BERHASIL!"
echo "=========================================="
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "📋 Log aplikasi (10 baris terakhir):"
docker compose -f "$COMPOSE_FILE" logs --tail=10 app
