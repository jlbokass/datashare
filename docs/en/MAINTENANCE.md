---
layout: default
title: "DataShare — Maintenance procedures"
permalink: /en/maintenance.html
lang: en
---

# DataShare — Maintenance procedures (OC P3)

[Français](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.md) · [Technical documentation](../technical-documentation.md)

**Status: development-environment procedure; production operations, backup testing and deployment automation remain unverified.**

## Local runtime

From the repository root with the correct branch and an ignored root `.env` and `backend/.env`:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
docker compose logs --tail=100 app web frontend scheduler db
```

The `scheduler` executes the daily US01 expired-file purge; if local demo flag `TRANSFER_DEMO_5_MIN_ENABLED=true` is set, the app must clear config and the scheduler must be restarted to use minute-level execution. **`docker compose down` keeps named database volumes**; never run `docker compose down -v` without intentionally destroying local data.

## Structured logging and local diagnostics

Nginx writes JSON access logs to standard output (`stdout`). The format includes timestamp, HTTP method, status, total request duration in seconds, request size (line, headers and body) and response body size in bytes. URLs, query parameters, IP addresses, headers and tokens are excluded from **this access-log format**. Nginx error logs, PHP-FPM logs and Laravel exceptions may still contain sensitive information: review them before sharing.

Laravel `app` and `scheduler` use Monolog's `stderr` channel with `JsonFormatter`, configured by Docker Compose without changing local `.env` files. Other container streams retain their existing formats. No external collector is required.

After retrieving the configuration on an already running environment:

```bash
docker compose config --quiet
docker compose up -d --no-deps --force-recreate app scheduler web
docker compose exec -T app php artisan config:clear
docker compose restart scheduler
docker compose exec -T web nginx -t
curl -fsS http://127.0.0.1:8080/api/health
docker compose logs --no-log-prefix --tail=20 web
docker compose logs --tail=20 app scheduler
```

To check the Laravel format without writing business data:

```bash
docker compose exec -T app php artisan tinker --execute='logger()->info("datashare.logging_check", ["status" => "ok"]);'
```

This command's JSON message appears on the stderr of the process launched by `docker compose exec`; it does not on its own prove collection of the PHP-FPM service logs. Long-running service logs remain available through `docker compose logs`. Run the test command locally only.

To analyze metrics, compare status and `request_time_s` during a test transfer or download; `response_body_bytes` measures response body size, not necessarily file size for every route. See [PERF.md](PERF.md) for timed measurements. Local acceptance of structured Nginx and Laravel logging, following the procedure above, was reported successful on 24 November 2026 ([PR #72](https://github.com/jlbokass/datashare/pull/72)). Detailed output and the exact Nginx version were not archived; this is not an exhaustive privacy audit. Dozzle remains an [optional enhancement](https://github.com/jlbokass/datashare/issues/64).

## Updating dependencies — proposed cadence

| When | Activity | Risks / validation |
| --- | --- | --- |
| Promptly after a critical security advisory | Review Composer/npm and Docker images; patch affected dependencies | Breaking changes, lockfile integrity, JWT/file upload regressions |
| Every 2–4 weeks (proposed) | Review available framework/library updates and release notes | Laravel/Angular/PHP/Node compatibility; require tested PR |
| Before an OC release / after a significant feature | Repeat backend/frontend build/tests, migrations and manual critical paths | Schema migration data loss, private storage access, broken JWT session |
| Daily during app operation | Confirm expired-file scheduler is running and logs are healthy | Unpurged data, disk growth, failed cleanup |

Example review commands (these **do not** modify dependency versions):

```bash
docker compose run --rm php sh -lc 'cd backend && composer outdated'
docker compose run --rm node sh -lc 'cd frontend && npm outdated'
```

Run actual Composer/npm updates **in a dedicated branch**; commit both lockfiles, review diffs, run tests and review the existing CI checks.

## Data and recovery — not yet production-ready

- PostgreSQL metadata and private file contents are **two distinct data stores**; a usable backup/recovery policy needs both to be consistent. No tested backup/restore plan exists yet.
- Plan retention/restore, access credentials, encryption and scheduled backups before deploying real user data.
- Review database migration against existing rows, avoid destructive `migrate:fresh`, and document rollback risks.
- No deployed production infrastructure or automated release scripts are claimed.
- Dozzle logs, if later added, require a separate security assessment of Docker socket/API permissions.

## Maintenance record template

Record **date, commit SHA, changed dependencies/images, migrations, commands/tests, observed issue, decision, person approving and recovery action**. Avoid pasting credentials or private upload data.

## Expiry and purge demonstration

Standard mode expires transfers after 1–7 days and purges them daily. The five-minute demo is local only: set `TRANSFER_DEMO_5_MIN_ENABLED=true` in `backend/.env`, then:

```bash
docker compose exec -T app php artisan config:clear
docker compose restart app scheduler
curl -fsS http://127.0.0.1:8080/api/demo/capabilities
docker compose exec -T app php artisan schedule:list
```

The `five_minute_expiry` capability must be true and cleanup scheduled each minute. For the assessment, in accordance with [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57), temporarily stop the scheduler using `docker compose stop scheduler`, create a demo transfer and observe its expired status and public-link rejection after expiry. Always restart with `docker compose start scheduler` and observe metadata removal (`docker compose logs --tail=30 scheduler`). Keep the scheduler running in normal use. To return to standard mode, disable the flag, clear configuration and restart the services.

## Deletion and recovery after failure

`TransferDeletion` locks the parent transfer in a PostgreSQL transaction to serialize deletion and purge. File bytes are removed before metadata. The two stores do not form one atomic transaction: if the database fails after byte removal, the bytes cannot be restored. A retry can reconcile remaining metadata; storage failure retains metadata for recovery. Purge continues with other transfers and exits nonzero if one fails. Inspect logs and avoid recursively deleting storage. See [architecture](../architecture.md).
