# syntax=docker/dockerfile:1
#
# FAM VAULT API — PHP 8.3 + Apache, SQLite on the Fly volume.
#
FROM php:8.3-apache

# --------------------------------------------------------------- extensions
#   libsqlite3-dev -> pdo_sqlite (the app's database)
#   libzip-dev     -> zip
#   sqlite3        -> CLI for debugging inside the machine
RUN apt-get update && apt-get install -y --no-install-recommends \
        libsqlite3-dev libzip-dev unzip sqlite3 \
    && docker-php-ext-install pdo_sqlite zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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

RUN composer dump-autoload --no-dev --optimize --no-scripts --no-interaction \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod +x /var/www/html/docker/entrypoint.sh

# Apache listens on 80; fly.toml sets internal_port = 80.
EXPOSE 80

ENTRYPOINT ["/var/www/html/docker/entrypoint.sh"]
CMD ["apache2-foreground"]
