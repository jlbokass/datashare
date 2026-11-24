# DataShare development image: PHP-FPM for Laravel and CLI tools for Composer/tests.
FROM php:8.4-fpm-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libpq-dev \
        libsqlite3-dev \
        libonig-dev \
        libzip-dev \
    && docker-php-ext-install -j"$(nproc)" \
        pcntl \
        pdo_pgsql \
        pdo_sqlite \
        mbstring \
        zip \
    && rm -rf /var/lib/apt/lists/*

COPY uploads.ini /usr/local/etc/php/conf.d/datashare-uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /workspace
