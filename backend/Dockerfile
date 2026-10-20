# syntax=docker/dockerfile:1
#
# FAM VAULT API — PHP 8.4 + Apache.
#
# Datastore: Turso (libSQL) in production, plain SQLite locally. Photo bytes
# never live here — they are stored in Cloudflare R2 and streamed back through
# the famvault-r2 Worker.
#
# PHP 8.4 (not 8.3): composer.lock resolves symfony/* v8.1.x, which requires
# PHP >= 8.4.1. The lock was generated on PHP 8.4, so the runtime must match.
FROM php:8.4-apache

# --------------------------------------------------------------- extensions
#   libsqlite3-dev -> pdo_sqlite (the app's database)
#   libzip-dev     -> zip
#   sqlite3        -> CLI for debugging inside the machine
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsqlite3-dev libzip-dev libsodium-dev unzip sqlite3 curl ca-certificates \
    && docker-php-ext-install pdo_sqlite zip sodium \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------- libsql (Turso) driver
# Production talks to Turso, which needs the native libSQL extension. There is
# no PECL package and no `docker-php-ext-install` source for it, so pull the
# prebuilt object published by the Turso team for this exact combination:
# PHP 8.4, non-thread-safe (the php:*-apache images are NTS), linux x86_64.
# `php -m` is grepped at the end so the build FAILS loudly if the .so cannot be
# loaded (e.g. a glibc mismatch) instead of blowing up at runtime.
ARG LIBSQL_EXT_TAG=turso-php-extension-v1.6.2
RUN set -eux; \
    test "$(dpkg --print-architecture)" = "amd64"; \
    extdir="$(php -r 'echo ini_get("extension_dir");')"; \
    curl -fsSL -o /tmp/libsql.tgz \
      "https://github.com/tursodatabase/turso-client-php/releases/download/${LIBSQL_EXT_TAG}/libsql_php-${LIBSQL_EXT_TAG}-php-8.4-nts-x86_64-unknown-linux-gnu.tar.gz"; \
    tar -xzf /tmp/libsql.tgz -C /tmp; \
    cp /tmp/libsql_php-*/liblibsql_php.so "${extdir}/liblibsql_php.so"; \
    printf 'extension=liblibsql_php.so\n' > /usr/local/etc/php/conf.d/zz-libsql.ini; \
    rm -rf /tmp/libsql.tgz /tmp/libsql_php-*; \
    php -m | grep -i libsql

# ------------------------------------------------------------------- apache
# mod_rewrite: Laravel ships public/.htaccess for clean /api/... routing.
RUN a2enmod rewrite headers

# Serve Laravel's public/ directory as the document root.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# CRITICAL: the stock image sets "AllowOverride None", which makes Apache IGNORE
# public/.htaccess and 404 every route that isn't a real file. Laravel needs it.
RUN sed -ri -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# ------------------------------------------------------------- php settings
# The stock php.ini limits are unusable for a photo vault:
#   upload_max_filesize = 2M  -> every phone photo/video over 2 MB is silently
#                                dropped before Laravel ever sees the file
#   post_max_size       = 8M  -> the entire body vanishes over 8 MB
# docker/uploads.ini raises them to the 200 MB cap enforced by PhotoController.
COPY docker/uploads.ini /usr/local/etc/php/conf.d/zz-famvault-uploads.ini

# ----------------------------------------------------------------- composer
# The php:*-apache image does NOT ship composer, so copy the official binary.
# (Without this, `composer install` silently does nothing and Laravel has no
#  vendor/ directory at all.)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies first so this layer caches until composer.json/lock change.
# --no-scripts: the build must not need a live .env or APP_KEY.
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev --no-interaction --no-scripts \
        --prefer-dist --optimize-autoloader \
    && composer clear-cache

# ---------------------------------------------------------------- application
COPY . .

# ------------------------------------------------- patch tursodatabase driver
# v1.3.1's read path (LibSQLPDOStatement::decodeDoubleBase64) base64-decodes
# TWICE any SELECT value that merely looks like base64. Crypt::encryptString()
# output is base64, so members.password_secret came back as binary and the
# admin password viewer returned null. The script is self-verifying: it exits
# non-zero (failing the build) if upstream changes so this never silently
# regresses. See docker/patches/patch-libsql-driver.php.
RUN php docker/patches/patch-libsql-driver.php

# v1.3.1 also wraps column defaults in a Query\Expression in
# LibSQLSchemaBuilder::getColumns(), and Laravel's BlueprintState then calls
# Str::wrap() on that Expression — "could not be converted to string" — so any
# Schema column read of a table with a column DEFAULT (members.color,
# members.is_admin, ...) fataled and took the deploy down during
# 2026_10_20_000004_remove_password_secret_column. Same self-verifying
# contract as the patch above. See docker/patches/patch-libsql-schema-builder.php.
RUN php docker/patches/patch-libsql-schema-builder.php

RUN composer dump-autoload --no-dev --optimize --no-scripts --no-interaction \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod +x /var/www/html/docker/entrypoint.sh

# Apache listens on 80 by default, which is what Fly's internal_port expects.
# The entrypoint rewrites this to $PORT when the platform injects one (Render).
EXPOSE 80

ENTRYPOINT ["/var/www/html/docker/entrypoint.sh"]
CMD ["apache2-foreground"]
