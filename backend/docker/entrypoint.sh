#!/usr/bin/env bash
#
# FAM VAULT API — container entrypoint.
#
# Runs on every boot: prepare the writable dirs, build the Laravel caches,
# migrate, idempotently seed, then serve on $PORT.
#
set -euo pipefail

cd /app
log() { printf '\n[entrypoint] %s\n' "$*"; }

# --------------------------------------------------------------- defaults
export APP_ENV="${APP_ENV:-production}"
export APP_DEBUG="${APP_DEBUG:-false}"
export DB_CONNECTION="${DB_CONNECTION:-sqlite}"
export SESSION_DRIVER="${SESSION_DRIVER:-database}"
export CACHE_STORE="${CACHE_STORE:-database}"
export QUEUE_CONNECTION="${QUEUE_CONNECTION:-sync}"

# ------------------------------------------------------------------ APP_KEY
# Must be set by the host and must stay stable: it encrypts the saved member
# passwords (members.password_secret). Rotating it would make them unreadable.
if [ -z "${APP_KEY:-}" ]; then
  log "APP_KEY is NOT set."
  cat <<'EOF'
  Generate one once on your machine:

      php artisan key:generate --show

  then paste the result as the APP_KEY environment variable on your host.
EOF
  exit 1
fi

# ------------------------------------------------------------------- sqlite
# With SQLite the database is a file. Point DB_DATABASE at a path on a mounted
# volume (e.g. /data/database.sqlite) to survive redeploys; otherwise the
# default ephemeral path is used.
if [ "$DB_CONNECTION" = "sqlite" ]; then
  DBPATH="${DB_DATABASE:-/app/database/database.sqlite}"
  mkdir -p "$(dirname "$DBPATH")"
  if [ ! -f "$DBPATH" ]; then
    log "creating sqlite database at $DBPATH"
    touch "$DBPATH"
  fi
  export DB_DATABASE="$DBPATH"
fi

# ----------------------------------------------------------------- writable
mkdir -p \
  storage/framework/sessions \
  storage/framework/views \
  storage/framework/cache/data \
  storage/logs \
  bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache 2>/dev/null || true

# ------------------------------------------------------------------- caches
log "building configuration cache"
if ! php artisan config:cache; then
  log "config:cache failed — clearing and continuing"
  php artisan config:clear || true
fi
php artisan route:cache || { log "route:cache unavailable — clearing"; php artisan route:clear || true; }
php artisan view:cache || true

# ----------------------------------------------------------------- database
log "running migrations"
php artisan migrate --force

log "seeding (idempotent: existing members/albums are left untouched)"
php artisan db:seed --force || log "seed skipped/failed — continuing"

# -------------------------------------------------------------------- serve
PORT="${PORT:-8080}"
log "serving on 0.0.0.0:${PORT} (PHP_CLI_SERVER_WORKERS=${PHP_CLI_SERVER_WORKERS:-1})"
exec php artisan serve --host=0.0.0.0 --port="$PORT"
