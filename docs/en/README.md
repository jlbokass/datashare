---
layout: default
title: "DataShare — Project overview"
permalink: /en/readme.html
lang: en
---

# DataShare

**Temporary file sharing — OpenClassrooms P3 project**

[Français](https://github.com/jlbokass/datashare/blob/main/README.md) · [Technical documentation — GitHub Pages](https://jlbokass.github.io/datashare/en/) · [Documentation sources](index.md)

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)
[![E2E CI](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml?query=branch%3Adevelop)

[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=jlbokass_datashare&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=jlbokass_datashare)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=jlbokass_datashare&metric=coverage)](https://sonarcloud.io/summary/new_code?id=jlbokass_datashare)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=jlbokass_datashare&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=jlbokass_datashare)
[![Lines of code](https://sonarcloud.io/api/project_badges/measure?project=jlbokass_datashare&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=jlbokass_datashare)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=jlbokass_datashare&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=jlbokass_datashare)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=jlbokass_datashare&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=jlbokass_datashare)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=jlbokass_datashare&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=jlbokass_datashare)

*SonarQube Cloud metrics: latest `main` analysis, scope and coverage described in [TESTING.md](TESTING.md). Informational Quality Gate.*

## About

DataShare lets users upload private files and share them temporarily through a public link. The **required US01–US06 MVP** provides:

- authenticated uploads, multiple files per transfer and expiry;
- public links and downloads without an account;
- registration and JWT login;
- personal history and individual file deletion.

**25 November 2026 release — [PR #100](https://github.com/jlbokass/datashare/pull/100), [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80) (`main`).** US01–US06 are delivered alongside US08 (private tags), US09 (per-file password), PROFILE-01 (profile), history pagination and OPS-03 (S3-compatible Garage, isolated demonstration). Private local storage remains the default. US07 (anonymous uploads) is not implemented; US10 has no separate work package because expiry and daily cleanup are already covered by US01. Feature development is frozen. The application runs locally and is not deployed to production.

All three workflows passed: [backend](https://github.com/jlbokass/datashare/actions/runs/45548826977) (83 tests, 79.72% line coverage), [frontend](https://github.com/jlbokass/datashare/actions/runs/45548827002) (65 tests, 88.00%) and [E2E](https://github.com/jlbokass/datashare/actions/runs/45548827035) (6 tests). See [TESTING.md](TESTING.md).

**Stack:** Angular 22, Laravel 13 / PHP, PostgreSQL 18, Nginx, Docker Compose and GitHub Actions.

## Run locally

Requirements: Git and Docker with Compose. For a fresh installation, follow the [step-by-step guide](../installation.md), including `.env` setup, dependencies and migrations.

On an **already configured** checkout, from the repository root:

```bash
docker compose up -d
docker compose ps
```

Default HTTP application: **http://127.0.0.1:8080/**. Recommended local acceptance over HTTPS: **https://127.0.0.1:8443/** ([enable with mkcert](../installation.md#optional-local-https)).

Local API: [Swagger UI HTTP](http://127.0.0.1:8080/docs/api) · [Swagger UI HTTPS](https://127.0.0.1:8443/docs/api) · [API guide](../api/README.md).

**Postman (optional):** import the [collection](../api/postman/DataShare.postman_collection.json) and [local environment](../api/postman/DataShare.local.postman_environment.json) to test API requests. See the [Postman guide](../api/README.md) for HTTPS setup and test instructions.

Run Laravel tests, Pint formatting checks, Angular tests and build:

```bash
bash scripts/qa.sh all
```

E2E tests use an [isolated Docker stack](TESTING.md) to protect local development data.

### Development shortcuts (optional)

If GNU Make is available, run `make help` to list the commands. From the repository root, `make up`, `make ps`, `make logs`, `make health` and `make down` manage the local environment (`down` preserves volumes). `make qa`, `make qa-backend` and `make qa-frontend` reuse the existing QA script; `make status` checks Git synchronization. Docker and Bash commands remain available without Make.

### Dozzle — Docker logs (optional)

```bash
make dozzle-up
make dozzle-stop
```

Open [Dozzle](http://127.0.0.1:9999/) while the service is running. Local use only; stop it after inspection. See [maintenance and security precautions](MAINTENANCE.md).

### Scheduler — expiry cleanup

The `scheduler` service starts with the main stack and runs Laravel's scheduled cleanup. To pause cleanup temporarily for a demonstration, then resume it on the already configured main project:

```bash
docker compose stop scheduler
docker compose start scheduler
docker compose ps scheduler
```

Run these commands separately as needed. Stopping the scheduler pauses physical cleanup, not the API's expiry checks. Keep it running during normal use. See [expiry and cleanup demonstration](MAINTENANCE.md).

### Test the 1 GB file limit (macOS)

```bash
mkfile -n 1100000000 /tmp/datashare-oversize.zip
# Select this file at /upload; the upload must be rejected.
rm /tmp/datashare-oversize.zip
```

This **1.1 GB** sparse test file is **not a real ZIP archive**. It is used only to check size validation.

## Repository map

```text
frontend/     Angular: pages, routing and authentication
backend/      Laravel: API, models, migrations and tests
docker/       Nginx and PHP configuration
e2e/          Playwright scenarios
docs/         Technical dossier and OpenClassrooms deliverables
scripts/      Quality-check commands
```

## Workflow and Git history

The workflow is **work branch → PR into `develop` → review/CI → release PR into protected `main`**. [Issues](https://github.com/jlbokass/datashare/issues), [pull requests](https://github.com/jlbokass/datashare/pulls?q=is%3Apr) and [`develop` commits](https://github.com/jlbokass/datashare/commits/develop/) trace design work, user stories, quality batches and UI refinement.

For future commits, use **`type(scope): action`** (for example `feat(upload): ...`, `fix(auth): ...`, `test(e2e): ...`, `docs: ...`). Earlier commit messages are not entirely consistent; the existing history is preserved.

## Documentation and limitations

The bilingual technical documentation is published on [GitHub Pages](https://jlbokass.github.io/datashare/) from `main/docs`. The application and Swagger UI run locally only.

[OC technical dossier](../technical-documentation.md) · [Architecture](../architecture.md) · [API contract](../api/openapi.yaml) · [Testing](TESTING.md) · [Security](SECURITY.md) · [Performance](PERF.md) · [Maintenance](MAINTENANCE.md) · [AI journal](../ai-journal.md)

Local HTTPS is optional and uses a development certificate authority; no public HTTPS deployment is claimed. JWT session state is intentionally held in memory, so **refreshing requires signing in again**. ZIP archives are not antivirus-scanned. Scheduled cleanup removes expired file bytes and metadata; this policy was retained by the closing decision in [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57).
