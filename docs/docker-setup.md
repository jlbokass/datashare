---
layout: default
title: "DataShare — Docker-first setup"
permalink: /docker-setup.html
lang: en
---

# DataShare — Docker-first development setup

[**Français**](docker-setup.fr.md) · [Documentation home](index.md)

**Historical TECH-02 foundation guide:** this issue originally prepared dependencies before application scaffolding. The developer subsequently reported Docker checks passing and US01–US06 were implemented. **To install the current MVP**, follow the [up-to-date setup guide](installation.md). The steps below document the original foundation, not the current release status.

## Why Docker first?

The OpenClassrooms specifications allow Laravel/PHP, Angular, PostgreSQL and private local file storage. Docker is our **development environment decision**, not an OC requirement.

Docker first allows us to initialize both frameworks **using the versions inside the containers**. It also keeps PostgreSQL isolated from other local projects, including `datashare-legacy`.

| Service | Current role | Image |
| --- | --- | --- |
| `db` | PostgreSQL with a healthcheck and persistent named volume | `postgres:18` |
| `php` | On-demand PHP + Composer + `pdo_pgsql` tool container | `php:8.4-fpm-bookworm` + `composer:2` |
| `node` | On-demand Node + npm tool container | `node:24-bookworm-slim` |

Only the database runs with `docker compose up -d db`. The `php` and `node` services use a Compose **tools profile** and run with `docker compose run --rm`. Nginx and application servers are **not added yet**; they will be wired in when the frameworks exist.

## Prerequisites

- Docker Desktop with Compose v2, running on your Mac.
- Git and the new `datashare` repository checked out.
- No host PHP, Composer, Node or PostgreSQL installation is required for these commands.

## First local verification

From the repository root, on the `chore/tech-02-docker-foundation` branch:

```bash
cp .env.example .env
```

**Edit `.env` and replace `POSTGRES_PASSWORD` with a unique local password.** This file is excluded by the root `.gitignore`; never paste real credentials into issues, screenshots or build logs.

```bash
# Validate without printing interpolated credentials.
docker compose config --quiet

# Start PostgreSQL only.
docker compose up -d db
docker compose ps

# Verify PostgreSQL reports accepting connections.
docker compose exec -T db sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Build and verify the PHP/Composer tool environment.
docker compose build php
docker compose run --rm php php -v
docker compose run --rm php composer --version
docker compose run --rm php php -m

# Check Node/npm inside their container.
docker compose run --rm node node --version
docker compose run --rm node npm --version
```

**Acceptance evidence:** PostgreSQL appears healthy; PHP reports **8.4.x** and lists `pdo_pgsql`, `mbstring` and `zip` among its extensions; Composer works; Node reports **24.x** and npm runs. Paste **non-secret outputs only** in the issue/PR review.

The tool container mounts the repository under `/workspace`, enabling the official Laravel/Angular installation commands **in the next issue**. Generated frontend dependencies and backend packages are ignored by Git, while package lockfiles will be committed.

## Isolation and lifecycle

- Compose project name: **`datashare-p3`**, separate from legacy containers and volumes.
- PostgreSQL has **no published host port**. Containers talk to the database at hostname `db` on port `5432`.
- PostgreSQL 18 stores data under `/var/lib/postgresql/18/docker`; mount the named volume at **`/var/lib/postgresql`**, not the old 17-and-earlier path.
- `docker compose down` stops/removes containers and network **without deleting the named database volume**. **Do not run `docker compose down -v`** unless you explicitly want to erase the database.
- This environment is for local development; it is **not a production deployment**, and the example database password must not be used in production.

## Next increment

After the local checks are green, create Laravel 13 and Angular 22 using the official generators **inside** `php` and `node`. Then add Nginx and configure Laravel ⇄ PostgreSQL plus Angular ⇄ Laravel; run first integration checks before US03. No unrelated services or extra test infrastructure in this first task.

**References:** [Laravel 13 requirements](https://laravel.com/framework/docs/deployment), [Angular versions](https://angular.dev/reference/versions), [PostgreSQL Docker image](https://hub.docker.com/_/postgres), [Docker Compose profiles](https://docs.docker.com/compose/how-tos/profiles), [Docker interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/).
