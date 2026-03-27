#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — VPS'e (Ubuntu 22.04+) tam kurulum scripti
# Kullanım: bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

APP_DIR="/opt/apartman-yonetim"
DOMAIN="${DOMAIN:-your-domain.com}"

# 1. Sistem güncellemesi
log "Sistem güncelleniyor…"
apt-get update -qq && apt-get upgrade -y -qq

# 2. Docker kurulumu
if ! command -v docker &>/dev/null; then
  log "Docker kuruluyor…"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker && systemctl start docker
fi

# 3. Docker Compose v2
if ! docker compose version &>/dev/null; then
  log "Docker Compose kuruluyor…"
  apt-get install -y docker-compose-plugin
fi

# 4. Nginx + Certbot
log "Nginx ve Certbot kuruluyor…"
apt-get install -y nginx certbot python3-certbot-nginx

# 5. Uygulama dizini
log "Uygulama dizini hazırlanıyor…"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 6. .env dosyası
if [ ! -f .env ]; then
  warn ".env dosyası oluşturuluyor — SECRET_KEY'i değiştirmeyi unutmayın!"
  cat > .env <<EOF
SECRET_KEY=$(openssl rand -hex 32)
DATABASE_URL=sqlite:////app/data/apartman.db
EOF
fi

# 7. Docker build & up
log "Docker imajları derleniyor ve başlatılıyor…"
docker compose pull || true
docker compose up -d --build

# 8. Nginx reverse proxy
log "Nginx konfigürasyonu ayarlanıyor…"
cat > /etc/nginx/sites-available/apartman <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        client_max_body_size 20M;
    }

    location /uploads/ {
        proxy_pass http://localhost:8000;
    }
}
EOF

ln -sf /etc/nginx/sites-available/apartman /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 9. SSL (opsiyonel)
if [ "$DOMAIN" != "your-domain.com" ]; then
  log "SSL sertifikası alınıyor ($DOMAIN)…"
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" || warn "SSL alınamadı, sonra tekrar deneyin: certbot --nginx -d $DOMAIN"
fi

# 10. Systemd servisi (otomatik başlatma)
cat > /etc/systemd/system/apartman.service <<EOF
[Unit]
Description=ApartmanPro Docker Compose
Requires=docker.service
After=docker.service

[Service]
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable apartman

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Kurulum tamamlandı! 🏢"
log ""
log "  Frontend : http://$DOMAIN"
log "  API Docs : http://$DOMAIN/api/docs"
log "  Admin    : admin@apartman.com / admin123"
log ""
warn "Güvenlik için admin şifresini değiştirin!"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
