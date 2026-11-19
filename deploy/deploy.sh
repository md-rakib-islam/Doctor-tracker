#!/usr/bin/env bash
# One-command deploy from your machine:   ./deploy/deploy.sh
# You type the SSH password yourself (once; the connection is reused). Nothing secret is stored in this repo.
set -euo pipefail

SERVER="${SERVER:-deploy@217.216.34.13}"
API_DOMAIN="${API_DOMAIN:-api.mdrakibulislam.dev}"
WEB_DOMAIN="${WEB_DOMAIN:-doctorportal.mdrakibulislam.dev}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Atlas URI comes from your local, git-ignored backend/.env (the active, non-commented line).
MONGODB_URI="$(grep -E '^MONGODB_URI=mongodb' "$ROOT/backend/.env" | head -1 | cut -d= -f2-)"
[ -n "$MONGODB_URI" ] || { echo "No MONGODB_URI found in backend/.env"; exit 1; }

SSH_OPTS=(-o ControlMaster=auto -o "ControlPath=$HOME/.ssh/cm-dt-%r@%h:%p" -o ControlPersist=15m)
ssh_() { ssh "${SSH_OPTS[@]}" "$@"; }

echo "==> Connecting to $SERVER (enter the SSH password once)"
ssh_ "$SERVER" 'mkdir -p ~/doctor-tracker/src && echo connected as $(whoami) on $(hostname)'

echo "==> Uploading source"
COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata -czf - -C "$ROOT" \
  --exclude node_modules --exclude .next --exclude dist --exclude '.env' --exclude '.env.local' \
  --exclude .mongo-data --exclude docs --exclude '*.log' --exclude .git \
  backend frontend deploy \
  | ssh_ "$SERVER" 'tar xzf - -C ~/doctor-tracker/src'

echo "==> Sending configuration (kept in ~/doctor-tracker/deploy.env, mode 600)"
# %q shell-quotes each value so characters like & in the Atlas URI survive being sourced on the server.
printf 'MONGODB_URI=%q\nAPI_DOMAIN=%q\nWEB_DOMAIN=%q\nENABLE_TLS=%q\nTLS_EMAIL=%q\n' \
  "$MONGODB_URI" "$API_DOMAIN" "$WEB_DOMAIN" "${ENABLE_TLS:-0}" "${TLS_EMAIL:-}" \
  | ssh_ "$SERVER" 'umask 077; cat > ~/doctor-tracker/deploy.env'

echo "==> Building and starting on the server"
ssh_ -t "$SERVER" 'bash ~/doctor-tracker/src/deploy/remote-setup.sh'
