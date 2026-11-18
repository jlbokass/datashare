# PHP version supported by Laravel 13. The service is currently a CLI tool.
# PHP-FPM/Nginx application routing will be configured once Laravel exists.
FROM php:8.4-fpm-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libpq-dev \
        libsqlite3-dev \
        libonig-dev \
        libzip-dev \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql mbstring zip \
    && rm -rf /var/lib/apt/lists/*

# Starter PHPUnit tests use isolated SQLite in memory. Production uses PostgreSQL.
RUN if ! php -m | grep -qi '^pdo_sqlite

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /workspace
; then docker-php-ext-install pdo_sqlite; fi

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /workspace
