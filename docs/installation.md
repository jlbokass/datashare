---
layout: default
title: "DataShare — Local MVP installation"
permalink: /installation.html
lang: en
---

# Install DataShare locally

[**Français**](installation.fr.md) · [Documentation home](index.md) · [Full README](https://github.com/jlbokass/datashare/blob/main/README.md)

**Functional US01–US06 MVP.** Use this guide on a development computer with Docker. It runs Laravel 13, Angular 22 and PostgreSQL 18 **locally** at **http://127.0.0.1:8080/**. GitHub Pages hosts static documentation only.

## Requirements

Git, Docker Desktop or Docker Engine with Docker Compose v2, and Docker running. PHP, Composer, Node and PostgreSQL are provided by containers.

## Fresh installation

**1. Clone the repository:**

```bash
git clone https://github.com/jlbokass/datashare.git
cd datashare
git switch develop
```

`develop` currently contains all six stories; `main` will represent the published version after the reviewed release merge. **Preserve existing `.env` files** on previously configured machines.

**2. Configure local environments:**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Set a unique local `POSTGRES_PASSWORD` in root `.env`. Keep `APP_ENV=local` and set `JWT_SECRET` in `backend/.env` using `openssl rand -hex 32` (**64 hex characters**). `APP_KEY` must not be reused as the JWT secret. Never commit or expose `.env` files.

**3. Install PHP dependencies and generate the Laravel application key:**

```bash
docker compose config --quiet
docker compose build php
docker compose run --rm php sh -lc 'cd backend && composer install --prefer-dist --no-interaction'
docker compose run --rm php sh -lc 'cd backend && php artisan key:generate'
```

**4. Start containers and migrate PostgreSQL:**

```bash
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
```

The `frontend` container automatically installs Node dependencies into a dedicated Docker volume on first boot, shared with the CLI `node` service. The `scheduler` runs periodic expiry cleanup.

**5. Check and use:**

```bash
curl -fsS http://127.0.0.1:8080/api/health
bash scripts/qa.sh all
```

Open **http://127.0.0.1:8080/**. The `/api/health` response alone does not prove PostgreSQL connectivity; the migration checks that separately. Laravel CI unit tests use in-memory SQLite.

## Troubleshooting and scope

A temporary Nginx `502` may indicate first-boot Angular installation; inspect `docker compose logs -f frontend app web`. Do not overwrite configured environment files or delete volumes. Stop while keeping the database using `docker compose down` (**not `down -v`**).

[Quality badges](index.md) track GitHub Actions Laravel/Pint and Angular tests/build. Measured coverage, E2E, security, performance and [visual acceptance](https://github.com/jlbokass/datashare/issues/37) remain pending before final OC delivery. This development stack must not be exposed to the public Internet.
