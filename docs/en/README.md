---
layout: default
title: "DataShare — Project overview"
permalink: /en/readme.html
lang: en
---

# DataShare

Local API: [interactive reference](http://127.0.0.1:8080/docs/api) · [generated OpenAPI JSON](http://127.0.0.1:8080/docs/api.json) · [export, contract and limits](../api/README.md). Available only with `APP_ENV=local`.

**Temporary file sharing — OpenClassrooms P3 project**

[Français](https://github.com/jlbokass/datashare/blob/develop/README.md) · [Technical documentation](index.md)

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)
[![E2E CI](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml?query=branch%3Adevelop)

## About

DataShare lets users upload private files and share them temporarily through a public link. The **required US01–US06 MVP** provides:

- authenticated uploads, multiple files per transfer and expiry;
- public links and downloads without an account;
- registration and JWT login;
- personal history and individual file deletion.

**Status, 23 November 2026:** the MVP, quality batches QL-01 through QL-04 and Figma UI-01 are integrated into `develop`. Backend, frontend and E2E checks passed on [UI-01 PR #58](https://github.com/jlbokass/datashare/pull/58). The application runs **locally** and is not deployed to production.

**Stack:** Angular 22, Laravel 13 / PHP, PostgreSQL 18, Nginx, Docker Compose and GitHub Actions.

## Run locally

Requirements: Git and Docker with Compose. For a fresh installation, follow the [step-by-step guide](../installation.md), including `.env` setup, dependencies and migrations.

On an **already configured** checkout, from the repository root:

```bash
docker compose up -d
docker compose ps
```

Application: **http://127.0.0.1:8080/**

Run Laravel tests, Pint formatting checks, Angular tests and build:

```bash
bash scripts/qa.sh all
```

E2E tests use an [isolated Docker stack](TESTING.md) to protect local development data.

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

[OC technical dossier](../technical-documentation.md) · [Architecture](../architecture.md) · [API contract](../api/openapi.yaml) · [Testing](TESTING.md) · [Security](SECURITY.md) · [Performance](PERF.md) · [Maintenance](MAINTENANCE.md) · [AI journal](../ai-journal.md)

The local app uses **HTTP without TLS**. JWT session state is intentionally held in memory, so **refreshing requires signing in again**. ZIP archives are not antivirus-scanned. Scheduled cleanup removes expired file bytes and metadata; this policy was retained by the closing decision in [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57). Advanced US07–US10 features remain optional.
