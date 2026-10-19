#!/usr/bin/env bash
#
# FAM VAULT API — container entrypoint (Apache).
#
# The Fly volume is mounted at /var/www/html/storage, so on the FIRST boot it
# is EMPTY and shadows the directories baked into the image. Laravel fails
# immediately without storage/framework/{views,sessions,cache} and storage/logs,
# so recreate them here, then migrate/seed, then hand off to Apache.
#
set -euo pipefail

cd /var/www/html

log() { printf '\n[entrypoint] %s\n' "$*"; }

# --------------------------------------------------------------- defaults
export APP_ENV="${APP_ENV:-production}"
export APP_DEBUG="${APP_DEBUG:-false}"
export DB_CONNECTION="${DB_CONNECTION:-sqlite}"
export DB_DATABASE="${DB_DATABASE:-/var/www/html/storage/database.sqlite}"
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
# Must be provided as a Fly secret and must stay stable: it encrypts the
# saved member passwords (members.password_secret).
if [ -z "${APP_KEY:-}" ]; then
  log "APP_KEY is NOT set."
  cat <<'EOF'
  Set it once with:
      fly secrets set APP_KEY="$(php artisan key:generate --show)"
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

# -------------------------------------------------------------------- serve
log "starting: $*"
exec "$@"
