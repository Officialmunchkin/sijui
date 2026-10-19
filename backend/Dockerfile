# syntax=docker/dockerfile:1
#
# FAM VAULT API — production image.
#
# Portable on purpose: the same image runs on Render, Railway, Fly.io or any
# Docker host. The app serves itself with `php artisan serve` (Laravel's
# built-in server, which honours PHP_CLI_SERVER_WORKERS), so no nginx/php-fpm
# stack is required for a family-sized workload.
#
FROM php:8.3-cli

# ----------------------------------------------------------------- system
# git + unzip      -> composer
# libpq-dev        -> pdo_pgsql (managed Postgres)
# libsqlite3-dev   -> pdo_sqlite (default DB)
# curl/openssl already ship with the base image and are what Guzzle uses to
# talk to the Cloudflare Worker. No CA bundle needed on Linux.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libpq-dev libsqlite3-dev \
    && docker-php-ext-install pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# ----------------------------------------------------------- dependencies
# Copied first so this layer is cached until composer.json/lock changes.
# --no-scripts: the build must not need a live .env or APP_KEY.
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev --no-interaction --no-scripts \
        --prefer-dist --optimize-autoloader \
    && composer clear-cache

# ------------------------------------------------------------ application
COPY . .

# Rebuild the optimised autoloader now that every class is present.
RUN composer dump-autoload --no-dev --optimize --no-scripts --no-interaction \
    && chmod +x docker/entrypoint.sh

ENV APP_ENV=production \
    APP_DEBUG=false \
    PHP_CLI_SERVER_WORKERS=4 \
    PORT=8080

EXPOSE 8080

ENTRYPOINT ["docker/entrypoint.sh"]
