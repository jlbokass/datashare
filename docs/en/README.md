---
layout: default
title: "DataShare — Project overview"
permalink: /en/readme.html
lang: en
---

# DataShare

**Temporary file sharing — OpenClassrooms P3 project**

[Français](https://github.com/jlbokass/datashare/blob/develop/README.md) · [Technical documentation — GitHub Pages](https://jlbokass.github.io/datashare/en/) · [Documentation sources](index.md)

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

**Status, 23 November 2026:** the MVP, quality batches QL-01 through QL-04 and Figma UI-01 are integrated into `develop`. Backend, frontend and E2E checks passed on [UI-01 PR #58](https://github.com/jlbokass/datashare/pull/58). The application runs **locally** and is not deployed to production.

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

Run Laravel tests, Pint formatting checks, Angular tests and build:

```bash
bash scripts/qa.sh all
```

E2E tests use an [isolated Docker stack](TESTING.md) to protect local development data.

### Development shortcuts (optional)

If GNU Make is available, run `make help` to list the commands. From the repository root, `make up`, `make ps`, `make logs`, `make health` and `make down` manage the local environment (`down` preserves volumes). `make qa`, `make qa-backend` and `make qa-frontend` reuse the existing QA script; `make status` checks Git synchronization. Docker and Bash commands remain available without Make.

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

Local HTTPS is optional and uses a development certificate authority; no public HTTPS deployment is claimed. JWT session state is intentionally held in memory, so **refreshing requires signing in again**. ZIP archives are not antivirus-scanned. Scheduled cleanup removes expired file bytes and metadata; this policy was retained by the closing decision in [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57). Advanced US07–US10 features remain optional.
