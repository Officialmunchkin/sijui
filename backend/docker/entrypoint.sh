#!/usr/bin/env bash
#
# FAM VAULT API — container entrypoint (Apache).
#
# storage/ may or may not be backed by a persistent volume depending on the
# platform: it is a mounted Fly volume, while Render's free tier gives an
# ephemeral filesystem. Either way this re-creates the writable tree on every
# boot (a mount would otherwise shadow the directories baked into the image),
# then migrates/seeds, then hands off to Apache.
#
set -euo pipefail

cd /var/www/html

log() { printf '\n[entrypoint] %s\n' "$*"; }

# --------------------------------------------------------------- defaults
export APP_ENV="${APP_ENV:-production}"
export APP_DEBUG="${APP_DEBUG:-false}"
export DB_CONNECTION="${DB_CONNECTION:-sqlite}"
# DB_DATABASE only applies to the local sqlite driver. When DB_CONNECTION=libsql
# (Turso) the connection is remote: the driver's setConnectionMode() treats any
# non-empty 'database' as a request for a local embedded replica, so leaving it
# unset is required for a clean remote-only connection.
if [ "$DB_CONNECTION" = "sqlite" ]; then
  export DB_DATABASE="${DB_DATABASE:-/var/www/html/storage/database.sqlite}"
fi
export SESSION_DRIVER="${SESSION_DRIVER:-database}"
export CACHE_STORE="${CACHE_STORE:-database}"
export QUEUE_CONNECTION="${QUEUE_CONNECTION:-sync}"

# ------------------------------------------------- writable tree (on volume)
mkdir -p \
  storage/framework/sessions \
  storage/framework/views \
  storage/framework/cache/data \
  storage/logs \
  storage/app/public \
  bootstrap/cache

if [ "$DB_CONNECTION" = "sqlite" ]; then
  if [ ! -f "$DB_DATABASE" ]; then
    log "creating sqlite database at $DB_DATABASE"
    touch "$DB_DATABASE"
  fi
fi

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
if [ "$DB_CONNECTION" = "sqlite" ] && [ -f "$DB_DATABASE" ]; then
  chown www-data:www-data "$DB_DATABASE" 2>/dev/null || true
fi

# ------------------------------------------------------------------ APP_KEY
# Provided by the platform (a Fly secret, or a Render environment variable) and
# must stay stable: it encrypts the saved member passwords (password_secret).
if [ -z "${APP_KEY:-}" ]; then
  log "APP_KEY is NOT set."
  cat <<'EOF'
  Generate one with:  php artisan key:generate --show
  then set the result as APP_KEY in the platform's environment/secrets.
EOF
  exit 1
fi

# ------------------------------------------------------------------- caches
log "building caches"
php artisan config:cache || { log "config:cache failed — clearing"; php artisan config:clear || true; }
php artisan route:cache  || { log "route:cache unavailable — clearing"; php artisan route:clear || true; }
php artisan view:cache   || true
php artisan package:discover --ansi || true

# ----------------------------------------------------------------- database
log "running migrations"
php artisan migrate --force

log "seeding (idempotent — existing rows are kept)"
php artisan db:seed --force || log "seed skipped"

# ---------------------------------------------------------------------- port
# Listen on the port the platform asks for:
#   Fly    -> no PORT is injected; Apache's default 80 is right (fly.toml has
#             internal_port = 80), so nothing changes there.
#   Render -> PORT is injected (10000 by default) and the service is only
#             considered healthy once it answers on that port.
PORT="${PORT:-80}"
if [ "$PORT" != "80" ]; then
  log "binding Apache to port $PORT"
  sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
  sed -ri "s/:80>/:${PORT}>/g" /etc/apache2/sites-available/000-default.conf
fi

# -------------------------------------------------------------------- serve
log "starting: $*"
exec "$@"
