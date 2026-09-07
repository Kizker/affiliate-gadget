#!/bin/bash
# ================================================================
# deploy.sh — Affiliate Gadget VPS Deployment Script
# Jalankan di VPS: bash deploy.sh
# ================================================================

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────
APP_DIR="/opt/affiliate-gadget"
REPO_URL="https://github.com/Kizker/affiliate-gadget.git"
BRANCH="feat/responsive-fullscreen-sections"
COMPOSE_FILE="docker-compose.production.yml"

echo "========================================"
echo "  Affiliate Gadget — Deploy to VPS"
echo "========================================"

# ── 1. Install Docker & Docker Compose ───────────────────────────
install_docker() {
    echo ""
    echo "[1/6] Installing Docker..."
    if command -v docker &> /dev/null; then
        echo "  → Docker already installed: $(docker --version)"
        return
    fi

    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "  → Docker installed: $(docker --version)"
}

# ── 2. Install certbot untuk SSL ─────────────────────────────────
install_certbot() {
    echo ""
    echo "[2/6] Installing Certbot (SSL)..."
    if command -v certbot &> /dev/null; then
        echo "  → Certbot already installed"
        return
    fi
    apt-get install -y -qq certbot
    echo "  → Certbot installed"
}

# ── 3. Clone / Pull repo ─────────────────────────────────────────
clone_or_pull_repo() {
    echo ""
    echo "[3/6] Cloning repository..."
    if [ -d "$APP_DIR/.git" ]; then
        echo "  → Repo exists, pulling latest..."
        cd "$APP_DIR"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    else
        git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
        cd "$APP_DIR"
        echo "  → Cloned: $REPO_URL ($BRANCH)"
    fi
}

# ── 4. Setup .env.production ──────────────────────────────────────
setup_env() {
    echo ""
    echo "[4/6] Setting up .env.production..."
    cd "$APP_DIR"
    if [ ! -f ".env.production" ]; then
        cp .env.production.example .env.production
        echo ""
        echo "  ⚠️  FILE .env.production BELUM DIISI!"
        echo "  Edit dulu: nano $APP_DIR/.env.production"
        echo "  Lalu jalankan ulang: bash deploy.sh"
        echo ""
        exit 1
    fi
    echo "  → .env.production ditemukan"
}

# ── 5. Setup SSL Certificate ──────────────────────────────────────
setup_ssl() {
    echo ""
    echo "[5/6] Setting up SSL..."
    mkdir -p "$APP_DIR/nginx/ssl"

    if [ -f "$APP_DIR/nginx/ssl/fullchain.pem" ]; then
        echo "  → SSL cert already exists"
        return
    fi

    # Baca domain dari .env.production
    DOMAIN=$(grep NEXT_PUBLIC_APP_URL "$APP_DIR/.env.production" | cut -d'=' -f2 | sed 's|https://||' | tr -d '"')

    if [ -z "$DOMAIN" ] || [ "$DOMAIN" == "yourdomain.com" ]; then
        echo "  ⚠️  Domain belum diset di .env.production!"
        echo "  Isi NEXT_PUBLIC_APP_URL=https://DOMAINANDA.com"
        exit 1
    fi

    echo "  → Getting SSL cert for: $DOMAIN"
    # Stop nginx jika jalan untuk certbot standalone
    docker compose -f "$COMPOSE_FILE" stop nginx 2>/dev/null || true

    certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN" \
        --non-interactive --agree-tos --email admin@"$DOMAIN"

    # Copy cert ke nginx/ssl
    cp /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem "$APP_DIR/nginx/ssl/fullchain.pem"
    cp /etc/letsencrypt/live/"$DOMAIN"/privkey.pem "$APP_DIR/nginx/ssl/privkey.pem"
    echo "  → SSL cert installed"
}

# ── 6. Build & Start containers ───────────────────────────────────
deploy_containers() {
    echo ""
    echo "[6/6] Building & starting containers..."
    cd "$APP_DIR"

    # Load env production
    export $(grep -v '^#' .env.production | xargs)

    # Build image
    docker compose -f "$COMPOSE_FILE" build --no-cache

    # Start services
    docker compose -f "$COMPOSE_FILE" up -d

    # Jalankan DB migration
    echo "  → Running database migrations..."
    sleep 5
    docker compose -f "$COMPOSE_FILE" exec -T app sh -c "npx prisma db push --schema=./prisma/schema.prisma" || true

    echo ""
    echo "========================================"
    echo "  ✅ DEPLOY SELESAI!"
    echo "========================================"
    docker compose -f "$COMPOSE_FILE" ps
}

# ── Run all steps ─────────────────────────────────────────────────
install_docker
install_certbot
clone_or_pull_repo
setup_env
setup_ssl
deploy_containers
