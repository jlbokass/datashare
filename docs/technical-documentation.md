---
layout: default
title: "DataShare — OpenClassrooms Technical Documentation"
permalink: /technical-documentation.html
lang: en
---

# DataShare — Technical documentation

[**Français**](technical-documentation.fr.md) · [Documentation home](index.md) · [GitHub repository](https://github.com/jlbokass/datashare)

**Status as of 23 November 2026.** US01–US06, quality batches QL-01 through QL-04 and UI-01 are integrated into `develop`. All three CI workflows passed on [PR #58](https://github.com/jlbokass/datashare/pull/58); the READMEs were simplified in [PR #60](https://github.com/jlbokass/datashare/pull/60). No production deployment is claimed.

## 1. Application architecture

![DataShare architecture](diagrams/architecture.svg)

[Description](architecture.md) · [Editable draw.io](diagrams/architecture.drawio)

**Angular browser → Nginx → Laravel API → PostgreSQL and private file storage.** Nginx provides a single HTTP origin in development; Docker Compose runs the application, database and expiry scheduler. Public download links are separate from the JWT required for owner actions. Local HTTP is not evidence of production HTTPS.

### Repository structure

```text
frontend/src/app/    Angular pages, authentication and routes
backend/app/         Laravel API controllers, models, services and middleware
backend/database/    PostgreSQL migrations and factories
backend/tests/       Laravel / PHPUnit tests
e2e/                 Playwright scenarios and focused performance probe
docker/              PHP and Nginx configuration
.github/workflows/   Backend, frontend and E2E CI
scripts/             Quality-check commands
docs/                Technical deliverables, API and design references
```

### Application navigation

```text
/                 Public home
├── /register     Registration
├── /login        Login
├── /upload       Upload (authentication required)
├── /account      History and deletion (authentication required)
└── /share/:token Public download link
```

Routes are defined in `frontend/src/app/app.routes.ts`. `/upload` reuses the home component and displays the upload form immediately; `/upload` and `/account` use `authGuard`. Unknown URLs redirect to `/`.

## 2. Technology choices and rationale

[Detailed 1–2-page comparison and rationale](technology-choices.md)

| Area | Choice | Main reason |
| --- | --- | --- |
| Frontend | Angular 22, TypeScript | Structured components/forms and static typing |
| Backend | PHP 8.4, Laravel 13 | Integrated API, validation, storage and scheduler |
| Database | PostgreSQL 18 | Relations between users, transfers and files |
| File storage | Private local filesystem | Simple MVP solution allowed by the specifications |
| Authentication | JWT HS256 | Stateless API with server-side access checks |
| Tooling | Docker Compose, Nginx, GitHub Actions | Repeatable development and automated PR verification |

## 3. Data model

[UML conceptual model](data-model.md) · [Diagram](diagrams/data-model.svg)

Three main entities: **User** (unique email, password hash), **Transfer** (owner, public token, expiry) and **File** (name, type, size and private storage locator). A user owns many transfers; each transfer contains one or more files. PostgreSQL migrations are versioned in `backend/database/migrations/`. Optional US08 tags are not implemented.

## 4. REST API documentation

[OpenAPI 3.1 contract](api/openapi.yaml) · [Endpoint guide](api/README.md)

| Feature | Main endpoints |
| --- | --- |
| US03 / US04 — registration and authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| US01 — authenticated upload | `POST /api/transfers` |
| US02 — public sharing/download | `GET /api/shares/{token}`, `GET /api/shares/{token}/files/{fileId}` |
| US05 — owner history | `GET /api/transfers` |
| US06 — individual file deletion | `DELETE /api/transfers/{transferId}/files/{fileId}` |

These routes are implemented; request/response schemas and statuses are documented in OpenAPI. Private owner actions require a JWT, whereas a valid public share is accessible anonymously.

## 5. Security and access management

- **Accounts:** salted password hashes and unique emails. Signed JWTs are verified by Laravel and held only in Angular memory; logout clears local session state but **does not revoke** an issued JWT (about 30-minute lifetime).
- **Files:** storage outside the public web root under opaque internal names; MIME and extension checks; 1 GB per-file limit (5 files and 2 GB per transfer are chosen MVP caps). Downloads are forced as attachments.
- **Shares:** unpredictable token, 1–7-day expiry, invalid/expired-link rejection and scheduled cleanup of bytes and metadata. ZIP archives are **not antivirus-scanned**.
- **Limits:** public HTTPS hosting, tested backup/restore and a complete security audit have not been demonstrated. **Composer and npm dependency audits were run**, with no vulnerabilities reported at the time, as documented in [SECURITY](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md). These checks are not a full security audit.

## 6. Quality, tests and maintenance

| Required document | Status and reference |
| --- | --- |
| **TESTING.md** | [Tests and evidence](https://github.com/jlbokass/datashare/blob/develop/TESTING.md): **96.36%** Laravel and **79.58%** Angular measured line coverage (QL-01), **6 E2E tests** (QL-02); three CI workflows passed on [PR #58](https://github.com/jlbokass/datashare/pull/58) |
| **SECURITY.md** | [Composer and npm audits](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md) run on 23 Nov 2026: **no vulnerabilities reported** (QL-03) |
| **PERF.md** | [QL-04 measurements](https://github.com/jlbokass/datashare/blob/develop/PERF.md): local download, Angular bundle and development-server Lighthouse result; **no production performance claim** |
| **MAINTENANCE.md** | [Local procedures](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.md), updates and risks; no production recovery test |

Line coverage exceeds the indicative 70% target. A durable coverage report screenshot is still needed for the assessment. Measurement methods, dates and limitations are detailed in the documents linked above.

### Development workflow and conventions

**Workflow:** scoped issue → dedicated branch (`feat/`, `fix/`, `quality/` or `docs/`) → commits → PR into `develop` → CI and human review → merge. Releasing to protected `main` requires a separate PR. The [AI journal](ai-journal.md) distinguishes AI contributions from developer decisions and validation.

**Conventions visible in the repository:**

- **PHP/Laravel:** PSR-4 autoloading (`App\` to `backend/app/`), API controllers, Eloquent models, services and server-side validation; formatting checked with **Laravel Pint**; **PHPUnit** tests under `backend/tests/`.
- **Angular/TypeScript:** page components and templates, centralized routes, authentication guard, colocated `*.spec.ts` tests; frontend `.editorconfig` uses **2-space indentation** and **single quotes** in TypeScript. Angular tests run with **Vitest**.
- **E2E:** **Playwright/Chromium** against `compose.test.yaml` with isolated PostgreSQL and file storage. GitHub Actions runs backend, frontend and E2E checks on PRs/pushes targeting `develop` or `main`.

**Commit convention:** many messages already follow `type(scope): description` (`feat`, `fix`, `test`, `docs`, `ci`). Some earlier and merge commits are less consistent; **the history is not rewritten**. Going forward, prefer this format, one coherent change per commit and one PR per batch.

**Evidence of progression:** [API design — PR #16](https://github.com/jlbokass/datashare/pull/16) → [US06 — PR #46](https://github.com/jlbokass/datashare/pull/46) → [coverage — PR #50](https://github.com/jlbokass/datashare/pull/50) → [E2E — PR #52](https://github.com/jlbokass/datashare/pull/52) → [security/performance — PR #54](https://github.com/jlbokass/datashare/pull/54) and [#56](https://github.com/jlbokass/datashare/pull/56) → [UI — PR #58](https://github.com/jlbokass/datashare/pull/58). [Commits](https://github.com/jlbokass/datashare/commits/develop/) and PRs show milestones and corrections; they do not prove a uniform calendar cadence.

## 7. Installation and execution

[README](https://github.com/jlbokass/datashare/blob/develop/README.md) · [Step-by-step installation](installation.md)

**Prerequisites:** Git, Docker and Compose. For a fresh install, initialize private `.env` files using the [installation guide](installation.md) (PostgreSQL, Laravel and JWT secrets); never commit them.

From repository root after initializing dependencies:

```bash
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
bash scripts/qa.sh all
```

The application is served at `http://127.0.0.1:8080/`. E2E tests use **`compose.test.yaml`**, isolated from development data (see TESTING). Do not use `docker compose down -v` on valuable databases. Production deployment has not been performed.

## 8. AI use in development

[AI development journal](ai-journal.md) · [French journal](ai-journal.fr.md)

AI assisted with scoped implementations, tests and documentation; the developer defined tasks, ran acceptance checks, requested corrections and approved changes. The journal distinguishes AI work from human verification and links relevant issues/PRs.

**To clarify before the assessment:** the written mission limits AI-developed work to one User Story, while the journal records contributions spanning multiple stories. Confirm the applicable guidance and accurately present those contributions without altering the history.

## Outstanding assessment work

**To finish before the assessment:** retain a durable coverage report screenshot, prepare the presentation and self-assessment, and clarify the applicable OpenClassrooms policy on AI assistance (section 8). QL-03 audits, QL-04 measurements and UI-01 visual review are complete. [HIST-01 — cleanup/history](https://github.com/jlbokass/datashare/issues/57) remains a separate decision; [pagination](https://github.com/jlbokass/datashare/issues/59) is optional.
