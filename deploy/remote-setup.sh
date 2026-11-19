#!/usr/bin/env bash
# Runs ON the server as the deploy user. Idempotent: safe to re-run for every release.
set -euo pipefail
BASE="$HOME/doctor-tracker"
SRC="$BASE/src"
set -a; . "$BASE/deploy.env"; set +a

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$*"; }

# ---------- ports: reuse previous choice, otherwise first free port in range ----------
port_free() { ! ss -ltn 2>/dev/null | awk 'NR>1{print $4}' | grep -qE "[:.]$1$"; }
pick_port() { for p in $(seq "$1" "$(($1 + 60))"); do port_free "$p" && { echo "$p"; return; }; done; echo "no free port from $1" >&2; exit 1; }
[ -f "$BASE/ports.env" ] && . "$BASE/ports.env"
if [ -z "${API_PORT:-}" ]; then API_PORT=$(pick_port 5001); fi
if [ -z "${WEB_PORT:-}" ]; then WEB_PORT=$(pick_port 3001); [ "$WEB_PORT" = "$API_PORT" ] && WEB_PORT=$(pick_port $((API_PORT + 1))); fi
printf 'API_PORT=%s\nWEB_PORT=%s\n' "$API_PORT" "$WEB_PORT" > "$BASE/ports.env"
log "Ports in use for this app: API=$API_PORT  WEB=$WEB_PORT  (existing listeners on the box are untouched)"
ss -ltn 2>/dev/null | awk 'NR>1{print $4}' | sed 's/.*[:.]//' | sort -n | uniq | tr '\n' ' ' | sed 's/^/Already listening: /'; echo

# ---------- Node >= 20.9 (installs via nvm in the deploy user's home, no sudo) ----------
need_node=1
if command -v node >/dev/null 2>&1; then
  node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=9)?0:1)' && need_node=0
fi
if [ "$need_node" = 1 ]; then
  log "Installing Node 22 with nvm"
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] || curl -fsSo- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  . "$NVM_DIR/nvm.sh"; nvm install 22 >/dev/null; nvm use 22 >/dev/null
fi
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 && nvm use 22 >/dev/null 2>&1 || true
log "Node $(node -v), npm $(npm -v)"

# ---------- secrets ----------
if [ ! -f "$BASE/secrets.env" ]; then
  umask 077; echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" > "$BASE/secrets.env"
fi
. "$BASE/secrets.env"

# ---------- backend ----------
log "Building backend"
cd "$SRC/backend"
cat > .env <<ENV
NODE_ENV=production
PORT=$API_PORT
MONGODB_URI=$MONGODB_URI
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=8h
COOKIE_NAME=dt_session
COOKIE_SAMESITE=lax
CORS_ORIGIN=https://$WEB_DOMAIN
ENV
chmod 600 .env
npm ci --no-audit --no-fund
npm run build
npm prune --omit=dev --no-audit --no-fund

# ---------- frontend ----------
log "Building frontend"
cd "$SRC/frontend"
# Rewrites are baked at build time: the Next server reaches the API over loopback.
printf 'API_URL=http://127.0.0.1:%s\n' "$API_PORT" > .env.production.local
npm ci --no-audit --no-fund
API_URL="http://127.0.0.1:$API_PORT" npm run build

# ---------- process manager (pm2 installed locally, no root) ----------
log "Starting with pm2"
[ -x "$BASE/pm2/node_modules/.bin/pm2" ] || npm install --prefix "$BASE/pm2" pm2 --no-audit --no-fund >/dev/null
PM2="$BASE/pm2/node_modules/.bin/pm2"
cat > "$BASE/ecosystem.config.cjs" <<ECO
module.exports = { apps: [
  { name: 'dt-api', cwd: '$SRC/backend', script: 'dist/server.js', env: { NODE_ENV: 'production' }, max_memory_restart: '300M' },
  { name: 'dt-web', cwd: '$SRC/frontend', script: 'node_modules/next/dist/bin/next', args: 'start -p $WEB_PORT -H 127.0.0.1',
    env: { NODE_ENV: 'production', API_URL: 'http://127.0.0.1:$API_PORT' }, max_memory_restart: '500M' },
] };
ECO
"$PM2" startOrReload "$BASE/ecosystem.config.cjs" --update-env
"$PM2" save >/dev/null
# Survive reboots without root: resurrect saved apps at boot.
CRON_LINE="@reboot . \$HOME/.nvm/nvm.sh >/dev/null 2>&1; $PM2 resurrect"
( crontab -l 2>/dev/null | grep -v 'pm2 resurrect' ; echo "$CRON_LINE" ) | crontab - || warn "could not install @reboot cron"

# ---------- local health check ----------
sleep 5
log "Local health checks"
curl -fsS "http://127.0.0.1:$API_PORT/api/health" && echo
curl -fsS -o /dev/null -w "web /login -> HTTP %{http_code}\n" "http://127.0.0.1:$WEB_PORT/login"
curl -fsS "http://127.0.0.1:$WEB_PORT/api/health" >/dev/null && echo "web -> api proxy OK"

# ---------- nginx (needs sudo; prints the config if that's not possible) ----------
CONF=$(mktemp)
cat > "$CONF" <<NGINX
# Doctor Tracker (managed by deploy/remote-setup.sh)
map \$http_cf_connecting_ip \$dt_client_ip { default \$http_cf_connecting_ip; "" \$remote_addr; }

server {
  listen 80;
  server_name $API_DOMAIN;
  client_max_body_size 1m;
  location / {
    proxy_pass http://127.0.0.1:$API_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$dt_client_ip;
    proxy_set_header X-Forwarded-For \$dt_client_ip;
    proxy_set_header X-Forwarded-Proto https;
  }
}

server {
  listen 80;
  server_name $WEB_DOMAIN;
  client_max_body_size 1m;
  location / {
    proxy_pass http://127.0.0.1:$WEB_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Real-IP \$dt_client_ip;
    proxy_set_header X-Forwarded-For \$dt_client_ip;
    proxy_set_header X-Forwarded-Proto https;
  }
}
NGINX
cp "$CONF" "$BASE/nginx-doctor-tracker.conf"

install_nginx() {
  if ! command -v nginx >/dev/null 2>&1; then log "Installing nginx"; sudo apt-get update -y >/dev/null && sudo apt-get install -y nginx >/dev/null; fi
  sudo cp "$CONF" /etc/nginx/sites-available/doctor-tracker.conf
  sudo ln -sf /etc/nginx/sites-available/doctor-tracker.conf /etc/nginx/sites-enabled/doctor-tracker.conf
  sudo nginx -t
  sudo systemctl reload nginx
}
log "Configuring nginx for $API_DOMAIN and $WEB_DOMAIN"
if install_nginx; then
  if [ "${ENABLE_TLS:-0}" = 1 ] && [ -n "${TLS_EMAIL:-}" ]; then
    command -v certbot >/dev/null 2>&1 || sudo apt-get install -y certbot python3-certbot-nginx >/dev/null
    sudo certbot --nginx -d "$API_DOMAIN" -d "$WEB_DOMAIN" --non-interactive --agree-tos -m "$TLS_EMAIL" --redirect
  fi
else
  warn "Could not configure nginx automatically (no sudo, or another web server is in use)."
  warn "Config saved at $BASE/nginx-doctor-tracker.conf - ask the server admin to install it, or adapt it to your web server."
fi

log "Done. Test:  curl -i https://$API_DOMAIN/api/health   and open  https://$WEB_DOMAIN"
"$PM2" status
