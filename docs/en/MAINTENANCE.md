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
