---
layout: default
title: "DataShare — Local development integration"
permalink: /development.html
lang: en
---

# DataShare — Local development (TECH-04)

[**Français**](development.fr.md) · [Documentation home](index.md)

**Status: proposed, not yet validated on the developer's Mac.** TECH-04 connects the Laravel 13 / Angular 22 scaffolds produced in TECH-03. It is a local **development** setup, not production.

## Services and addresses

| Service | Purpose | Access |
| --- | --- | --- |
| `db` | PostgreSQL 18 with persistent data | Docker network only |
| `app` | PHP 8.4 FPM running Laravel | Docker network, port 9000 |
| `frontend` | Angular 22 CLI dev server, live reload and HMR | Docker network, port 4200 |
| `web` | Nginx single-origin gateway | **http://127.0.0.1:8080** only |
| `php`, `node` | One-shot CLI tools | `tools` profile |

Nginx routes `/api/*` and `/up` to Laravel and everything else to the Angular dev server. WebSockets are proxied for Angular HMR. The `GET /api/health` route is an **infrastructure-only probe**, separate from the OpenClassrooms business API contract; it returns JSON `{"status":"ok"}` and **does not test database connectivity**.

## Local recipe (from the repository root)

1. Switch to `feat/tech-04-dev-integration` after pulling `develop`.
2. Keep the **root `.env`** previously made for TECH-02, containing unique local `POSTGRES_*` credentials. **Never commit it.**
3. Keep the `backend/.env` created in TECH-03, with its existing `APP_KEY`; do **not** overwrite it. The Compose `app` service provides `DB_*` at runtime from the root `.env` and overrides any old SQLite value in the generated Laravel `.env`.
4. Execute:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan migrate:status
curl -fsS http://127.0.0.1:8080/api/health
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/up
```

Expected: containers started; database migration/status successful; JSON status `ok`; `/up` returns HTTP **200**. If Nginx responds **502** immediately after startup, allow Angular CLI to finish installing npm dependencies and compiling, then retry. Use `docker compose logs -f frontend app web` to diagnose.

5. Open **http://127.0.0.1:8080/**. With the page open, edit a visible string in `frontend/src/app/app.html`, save, and confirm the browser updates **without manually refreshing or restarting containers**. Restore the original text.
6. Browser developer console smoke test: `fetch('/api/health').then(r => r.json()).then(console.log)`. This verifies **browser → Nginx → Laravel** on the same origin. It is not yet an Angular `HttpClient` service.
7. Regression checks:

```bash
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
```

**Important:** the generated backend `phpunit.xml` still tests with SQLite in memory. These tests do not prove PostgreSQL integration; `migrate` and `migrate:status` above provide separate DB evidence.

## Live reload, lifecycle, safety

- Source folders are bind-mounted. Angular CLI is run with `--poll 1000`, helpful when macOS file changes are not reliably visible in containers. Angular rebuilds and updates the browser; PHP files are read live by FPM during local development.
- Node's `node_modules` live in a separate Docker named volume to avoid host/container native package conflicts. First startup installs with `npm ci`; a `package-lock.json` change may require `docker compose run --rm node sh -lc 'cd frontend && npm ci'` and recreation of the frontend volume later. Do not use `down -v` casually.
- Only Nginx is bound to loopback; PostgreSQL, PHP-FPM and Angular are **not host-exposed**.
- Stop without wiping database data: `docker compose down`. Never run `docker compose down -v` unless explicitly discarding database **and frontend dependencies**.
- This setup has no JWT, file-transfer implementation, production hardening, reverse-proxy TLS, Dozzle or actual UI screens.

## UI handoff

The supplied [UI handoff review](design-handoff.md) defines the upcoming screen work. The [full vector PDF](design/DataShare_UI_Design_Handoff_v1.pdf) is committed on the TECH-04 branch. Source Figma remains authoritative if the designs change. The handoff includes optional password-protected sharing; **do not imply US09 exists until it is implemented**.

## Evidence to collect before merging

Report Compose config, migration/status, `/api/health`, `/up`, an Angular HMR edit and tests/build. Avoid sharing `.env` or the interpolated `docker compose config` output.
