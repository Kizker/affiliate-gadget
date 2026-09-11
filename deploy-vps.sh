#!/bin/bash
# =============================================================
# deploy-vps.sh — Full deploy script untuk Affiliate Gadget VPS
# Jalankan di VPS: bash /tmp/deploy-vps.sh
# =============================================================
set -e

APP_DIR="/var/www/affiliate-gadget"
UPLOADS_DIR="$APP_DIR/public/uploads"
PM2_APP_NAME="affiliate-gadget"

echo "=============================="
echo " 1. Git Pull latest main"
echo "=============================="
cd "$APP_DIR"
git pull origin main

echo ""
echo "=============================="
echo " 2. Install dependencies"
echo "=============================="
pnpm install --frozen-lockfile

echo ""
echo "=============================="
echo " 3. Prisma generate"
echo "=============================="
pnpm prisma generate

echo ""
echo "=============================="
echo " 4. Build Next.js"
echo "=============================="
pnpm build

echo ""
echo "=============================="
echo " 5. Create uploads directory & set permissions"
echo "=============================="
mkdir -p "$UPLOADS_DIR/avatars"
mkdir -p "$UPLOADS_DIR/reviews"
mkdir -p "$UPLOADS_DIR/products"
chmod -R 755 "$UPLOADS_DIR"
chown -R www-data:www-data "$UPLOADS_DIR" 2>/dev/null || chown -R root:root "$UPLOADS_DIR"
echo "Uploads dir ready: $UPLOADS_DIR"
ls -la "$UPLOADS_DIR"

echo ""
echo "=============================="
echo " 6. Configure Nginx to serve /uploads/ directly"
echo "=============================="

NGINX_CONF="/etc/nginx/sites-available/affiliate-gadget"

# Backup current config
cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

# Check if /uploads/ location already configured
if ! grep -q "location /uploads/" "$NGINX_CONF" 2>/dev/null; then
  echo "Adding /uploads/ static serve location to Nginx..."

  # Insert uploads location before the proxy_pass location block
  # We use sed to insert BEFORE the line containing 'location /'
  sed -i '/location \/ {/i\
    # Serve uploaded files directly from disk (avatar, review photos, etc)\
    location /uploads/ {\
        alias '"$APP_DIR"'/public/uploads/;\
        expires 30d;\
        add_header Cache-Control "public, no-transform";\
        try_files $uri =404;\
    }\
' "$NGINX_CONF"

  echo "Nginx config updated."
else
  echo "Nginx /uploads/ location already configured — skipping."
fi

# Validate Nginx config
nginx -t

# Reload Nginx
nginx -s reload
echo "Nginx reloaded."

echo ""
echo "=============================="
echo " 7. Restart PM2 app"
echo "=============================="
pm2 restart "$PM2_APP_NAME" --update-env || pm2 start pnpm --name "$PM2_APP_NAME" -- start
pm2 save

echo ""
echo "=============================="
echo " DEPLOY COMPLETE!"
echo "=============================="
pm2 list
echo ""
echo "Test upload URL: https://affiliategadget.tech/uploads/avatars/"
echo "Test: curl -I https://affiliategadget.tech/uploads/avatars/"
