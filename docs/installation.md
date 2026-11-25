---
layout: default
title: "DataShare — Local MVP installation"
permalink: /installation.html
lang: en
---

# Install DataShare locally

[**Français**](installation.fr.md) · [Documentation home](en/index.md) · [Full README](en/README.md)

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

`develop` contains all six stories and quality batches; `main` represents the latest published release. **Preserve existing `.env` files** on previously configured machines.

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


## Optional Garage S3 demonstration (OPS-03 — #98)

The MVP keeps local storage with `make up` / `make https-up`. Garage demonstrates object storage using the same Laravel `transfers` disk and endpoints. The Compose override uses the **datashare-garage** project, loopback HTTPS port **8444** (HTTP 8081 redirects to HTTPS), a new `datashare_garage` database in a dedicated volume, and a private `datashare-transfers` bucket. It does not use existing files or database records. S3 stays internal to the Docker network; browsers download through Laravel with the existing JWT/share, expiry and US09 controls.

Prerequisites: Docker Compose ≥ 2.24.4 (`!override`), OpenSSL, the existing project mkcert certificates (see [local HTTPS](#optional-local-https)) and Composer-installed Laravel dependencies. The official `league/flysystem-aws-s3-v3:^3.0` adapter is included in the Composer manifest and lockfile; use `composer install` to reproduce the locked versions.

```bash
make garage-init
make garage-up
make garage-migrate
make garage-status
make garage-health
```

`garage-init` creates `.env.garage` once (private permissions, ignored by Git) without modifying the existing two `.env` files. Preserve it with the Garage volumes: do not regenerate keys for existing storage. `garage-migrate` applies ordinary migrations **only** to the demo database, without resetting anything.

If Nginx returns 502 after PHP-FPM container recreation, restart only the Garage project's web service: `docker compose --env-file .env.garage -p datashare-garage -f compose.yaml -f compose.garage.yaml restart web`, then `make garage-health`.

Open [https://127.0.0.1:8444/](https://127.0.0.1:8444/) and create a disposable account. Verify upload, direct and protected download, individual deletion, expiry and purge (five-minute local demo enabled). Also try a disposable file of several tens of MB to exercise S3 multipart upload. `make qa` remains the normal project's regression check, not a Garage integration test.

Stop the demonstration with `make garage-stop`. Volumes are preserved; the main project is not stopped. Stop the demo before switching branches (shared source bind mount). Never set `DATASHARE_GARAGE_DEMO=true` for the ordinary database or run the override under the main project name. No existing-file migration. Single-node Garage (replication 1) has no redundancy or availability guarantees: local demonstration only. This override reuses the existing mkcert certificates with a dedicated redirect to 8444; do not add `compose.https.yaml` (reserved for the main project). Laravel → Garage remains internal HTTP. Production would require separate storage and backup design; this demonstration is not production validation.

Sources: [Garage Quick Start](https://github.com/deuxfleurs-org/garage/blob/main-v2/doc/book/quick-start/_index.md), [Laravel 13 Filesystem](https://laravel.com/docs/13.x/filesystem).

## Optional local HTTPS

After HTTP installation, on macOS with Homebrew, install [mkcert](https://github.com/FiloSottile/mkcert) if needed and create a development-only certificate from the repository root:

```bash
brew install mkcert
mkcert -install
mkdir -p docker/nginx/certs
mkcert -cert-file docker/nginx/certs/datashare.pem \
  -key-file docker/nginx/certs/datashare-key.pem localhost 127.0.0.1
git check-ignore docker/nginx/certs/datashare-key.pem
make https-up
make https-health
```

Open **https://127.0.0.1:8443/** and [Swagger UI](https://127.0.0.1:8443/docs/api). HTTP port 8080 redirects to HTTPS (307) when the override is active. No existing `.env` is modified; the override sets Laravel's URL and enables Secure cookies. Nginx uses TLS 1.2/1.3; internal Docker network traffic is not encrypted.

Restart in HTTPS mode with `make https-up` (instead of `make up`), or restore HTTP using `make https-off`. The direct HTTPS startup command is `docker compose -f compose.yaml -f compose.https.yaml up -d`. The project and volumes remain unchanged. CI/E2E retains its isolated HTTP environment.

Never commit the certificates and keys under `docker/nginx/certs/` or share the local authority's private `rootCA-key.pem`. For a client that does not recognize the macOS trust store, use the public CA certificate at `$(mkcert -CAROOT)/rootCA.pem`; do not disable TLS verification. This setup is not intended for production.

## Troubleshooting and scope

A temporary Nginx `502` may indicate first-boot Angular installation; inspect `docker compose logs -f frontend app web`. Do not overwrite configured environment files or delete volumes. Stop while keeping the database using `docker compose down` (**not `down -v`**).

All three CI workflows and quality batches have been validated; see [TESTING](en/TESTING.md). Do not expose this development configuration to the public Internet.

## Services and diagnostics

| Service | Role |
| --- | --- |
| `db` | PostgreSQL 18, private Docker network, persistent volume mounted at `/var/lib/postgresql` |
| `app` | Laravel via PHP-FPM 8.4, private network |
| `frontend` | Angular 22 development server and HMR |
| `web` | Nginx, local HTTP entry point on port 8080 (optional HTTPS on 8443); API and `/up` routes to Laravel |
| `scheduler` | Laravel cleanup |
| `php`, `node` | On-demand CLI tools, `tools` profile |

Compose project `datashare-p3` isolates its containers and volumes. Source files are mounted; Angular detects changes with `--poll 1000` and Nginx proxies HMR WebSockets. Node dependencies use a dedicated volume; lockfile changes may require `npm ci`. Compose-injected PostgreSQL variables override old local SQLite values.

```bash
docker compose exec -T db sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker compose exec -T app php artisan migrate:status
curl -fsS http://127.0.0.1:8080/up
docker compose run --rm php php -v
docker compose run --rm php composer --version
docker compose run --rm php php -m
docker compose run --rm node node --version
docker compose run --rm node npm --version
```

Use these diagnostics when needed. Never publish interpolated Compose secrets. See [MAINTENANCE](en/MAINTENANCE.md) for purge demonstration and operating procedures.
