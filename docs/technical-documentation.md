---
layout: default
title: "DataShare — OpenClassrooms Technical Documentation"
permalink: /technical-documentation.html
lang: en
---

# DataShare — Technical documentation

[**Français**](technical-documentation.fr.md) · [Documentation home](en/index.md) · [GitHub repository](https://github.com/jlbokass/datashare)

**Functional release of 25 November 2026 — [PR #100](https://github.com/jlbokass/datashare/pull/100), [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80) (`main`).** The US01–US06 MVP is delivered with US08 (private tags), US09 (per-file password), PROFILE-01, history pagination and OPS-03 (isolated Garage S3). US07 is not implemented; daily cleanup belongs to US01, without a separate US10 work package. All three CI workflows and GitHub Pages publication passed. The prototype runs locally without production deployment.

## 1. Application architecture

![DataShare architecture](diagrams/architecture.svg)

[Description](architecture.md) · [Editable draw.io](diagrams/architecture.drawio)

**Angular browser → Nginx → Laravel API → PostgreSQL and private file storage.** Nginx provides a single origin in development (HTTP or optional local HTTPS); Docker Compose runs the application, database and expiry scheduler. Public download links are separate from the JWT required for owner actions. Local TLS termination uses mkcert and Nginx; it is not evidence of production HTTPS. Garage is an alternative storage mode in a separate local instance, with a private bucket and its own database. The scheduler runs Laravel code without an HTTP call to the API.

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
├── /profile      Profile (authentication required)
└── /share/:token Public download link
```

Routes are defined in `frontend/src/app/app.routes.ts`. `/upload` reuses the home component and displays the upload form immediately; `/upload`, `/account` and `/profile` use `authGuard`. Unknown URLs redirect to `/`.

## 2. Technology choices and rationale

[Detailed 1–2-page comparison and rationale](technology-choices.md)

| Area | Choice | Main reason |
| --- | --- | --- |
| Frontend | Angular 22, TypeScript | Structured components/forms and static typing |
| Backend | PHP 8.4, Laravel 13 | Integrated API, validation, storage and scheduler |
| Database | PostgreSQL 18 | Relations between users, transfers and files |
| File storage | Private local disk; Garage S3 (isolated demo) | Simple permitted MVP; object storage via Laravel's abstraction without API changes |
| Authentication | JWT HS256 | Stateless API with server-side access checks |
| Tooling | Docker Compose, Nginx, GitHub Actions | Repeatable development and automated PR verification |

## 3. Data model

[UML conceptual model](data-model.md) · [Diagram](diagrams/data-model.svg)

Three main entities: **User** (unique email, password hash), **Transfer** (owner, public token, expiry) and **File** (name, type, size and private storage locator). A user owns many transfers; each transfer contains one or more files. PostgreSQL migrations are versioned in `backend/database/migrations/`. Optional US08 associates zero or more private tags with each file (maximum 30 characters, per-file uniqueness, cascade deletion). PROFILE-01 adds optional family and given names; only `first_name` is added to the existing schema for this profile. US09 adds nullable `transfer_files.password_hash` per file. `users.id` and `tags.id` are internal BIGINT keys; the API exposes UUID `users.public_id`, while transfers and files use UUID keys.

## 4. REST API documentation

[Swagger UI](http://127.0.0.1:8080/docs/api) · [OpenAPI JSON](http://127.0.0.1:8080/docs/api.json) · [Design contract](api/openapi.yaml) · [API guide](api/README.md)

Documentation is generated from Laravel: **PHPDoc** describes behavior, **PHP 8 attributes** group operations and **Scramble** generates the OpenAPI 3.1 specification. Targeted corrections supplement file schemas and responses that cannot be inferred accurately. **Swagger UI** reads the generated JSON directly for consultation and requests, without a second runtime specification. This approach reduces drift between code and documentation; the YAML retains the design contract.

Laravel declares 13 operations: Authentication (4), Transfers (4), Public sharing (3) and System (2). The YAML covers the 11 business operations; the local-only Scramble documentation is designed to include both support routes (`GET /api/health` and `GET /api/demo/capabilities`). Swagger UI assets require CDN access; security rules and generation limitations are described in the API guide.

| Feature | Main endpoints |
| --- | --- |
| US03 / US04 — registration and authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| PROFILE-01 — optional profile | `PATCH /api/auth/me` |
| US01 — authenticated upload | `POST /api/transfers` |
| US02 — public sharing/download | `GET /api/shares/{token}`, `GET /api/shares/{token}/files/{fileId}` |
| US09 — optional file password | `POST /api/shares/{token}/files/{fileId}/authorize` then signed GET |
| US05 — owner history | `GET /api/transfers` |
| US06 — individual file deletion | `DELETE /api/transfers/{transferId}/files/{fileId}` |
| US08 — private tags (optional) | `PUT /api/transfers/{transferId}/files/{fileId}/tags` |
| System — support | `GET /api/health`, `GET /api/demo/capabilities` |

These routes are implemented; request/response schemas and statuses are documented in OpenAPI. Private owner actions require a JWT, whereas a valid public share is accessible anonymously.

## 5. Security and access management

- **Accounts:** salted password hashes and unique emails. Signed JWTs are verified by Laravel and held only in Angular memory; logout clears local session state but **does not revoke** an issued JWT (about 30-minute lifetime).
- **Files:** storage outside the public web root under opaque internal names; MIME and extension checks; 1 GB per-file limit (5 files and 2 GB per transfer are chosen MVP caps). Downloads are forced as attachments.
- **Shares:** unpredictable token, 1–7-day expiry, invalid/expired-link rejection and scheduled cleanup of bytes and metadata. ZIP archives are **not antivirus-scanned**.
- **Per-file protection (US09):** bcrypt hash, server-side verification and rate limiting (5 attempts/minute/IP). Successful verification issues a file-specific relative signed URL, reusable for 60 seconds. Token, expiry and signature are checked on download. No hash disclosure or password recovery; no file encryption at rest.
- **Limits:** public HTTPS hosting, tested backup/restore and a complete security audit have not been demonstrated. **Composer and npm dependency audits were run**, with no vulnerabilities reported at the time, as documented in [SECURITY](en/SECURITY.md). These checks are not a full security audit.

## 6. Quality, tests and maintenance

| Required document | Status and reference |
| --- | --- |
| **TESTING.md** | [Tests and evidence](en/TESTING.md): [Laravel](https://github.com/jlbokass/datashare/actions/runs/45548826977) **79.72%** (83 tests, 576 assertions), [Angular](https://github.com/jlbokass/datashare/actions/runs/45548827002) **88.00%** (65 tests), [Playwright](https://github.com/jlbokass/datashare/actions/runs/45548827035) **6/6**; 25 November release. [Coverage and limitations](coverage.md) |
| **SECURITY.md** | [Composer and npm audits](en/SECURITY.md) run on 23 Nov 2026: **no vulnerabilities reported** (QL-03) |
| **PERF.md** | [Measurements](en/PERF.md): download endpoint and Lighthouse measured locally on 22–23 November; final bundle 370.94 kB, below the 500 kB threshold, two SCSS warnings. No production performance guarantee |
| **MAINTENANCE.md** | [Local procedures](en/MAINTENANCE.md): structured logs, Dozzle, scheduler, updates and risks; no production recovery test |

Line coverage exceeds the indicative 70% target independently. Screenshots should match the reference release; earlier measurements remain historical. Six manual keyboard checks passed on 24 November ([UI-01 acceptance](design-handoff.md)), without claiming a comprehensive RGAA/WCAG audit. SonarQube Cloud complements CI with an informational Quality Gate, distinct from PHPUnit and Vitest measurements.

### Development workflow and conventions

**Workflow:** scoped issue → dedicated branch (`feat/`, `fix/`, `quality/` or `docs/`) → commits → PR into `develop` → CI and human review → merge. Releasing to protected `main` requires a separate PR. The [AI journal](ai-journal.md) distinguishes AI contributions from developer decisions and validation.

**Conventions visible in the repository:**

- **PHP/Laravel:** PSR-4 autoloading (`App\` to `backend/app/`), API controllers, Eloquent models, services and server-side validation; formatting checked with **Laravel Pint**; **PHPUnit** tests under `backend/tests/`.
- **Angular/TypeScript:** page components and templates, centralized routes, authentication guard, colocated `*.spec.ts` tests; frontend `.editorconfig` uses **2-space indentation** and **single quotes** in TypeScript. Angular tests run with **Vitest**.
- **E2E:** **Playwright/Chromium** against `compose.test.yaml` with isolated PostgreSQL and file storage. GitHub Actions runs backend, frontend and E2E checks on PRs/pushes targeting `develop` or `main`.

**Tracking language:** write new issues and PR descriptions in **French**, keeping standard technical terms and the **FR/EN** reference documentation. Existing bilingual issues remain unchanged.

**Commit convention:** many messages already follow `type(scope): description` (`feat`, `fix`, `test`, `docs`, `ci`). Some earlier and merge commits are less consistent; **the history is not rewritten**. Going forward, prefer this format, one coherent change per commit and one PR per batch.

**Evidence of progression:** [API design — PR #16](https://github.com/jlbokass/datashare/pull/16) → [US06 — PR #46](https://github.com/jlbokass/datashare/pull/46) → [coverage — PR #50](https://github.com/jlbokass/datashare/pull/50) → [E2E — PR #52](https://github.com/jlbokass/datashare/pull/52) → [security/performance — PR #54](https://github.com/jlbokass/datashare/pull/54) and [#56](https://github.com/jlbokass/datashare/pull/56) → [UI — PR #58](https://github.com/jlbokass/datashare/pull/58). [Commits](https://github.com/jlbokass/datashare/commits/develop/) and PRs show milestones and corrections; they do not prove a uniform calendar cadence.

## 7. Installation and execution

[README](en/README.md) · [Step-by-step installation](installation.md)

**Prerequisites:** Git, Docker and Compose; PHP 8.4 and Node.js 24 are provided by containers. GNU Make is optional; mkcert is required only for local HTTPS. For a fresh install, initialize private `.env` files using the [installation guide](installation.md) (PostgreSQL, Laravel and JWT secrets); never commit them.

From repository root after initializing dependencies:

```bash
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
bash scripts/qa.sh all
```

The application is served at `http://127.0.0.1:8080/` or, with [local TLS mode](installation.md#optional-local-https), at `https://127.0.0.1:8443/`. E2E tests use **`compose.test.yaml`**, isolated from development data (see TESTING). Do not use `docker compose down -v` on valuable databases. Production deployment has not been performed.

**Demonstration shortcuts and tools:** `make up`, `make qa`, `make down` (volumes preserved); `make scheduler-stop`, `make scheduler-start` and `make scheduler-status` for cleanup in the main stack. `make dozzle-up` starts the log viewer at [localhost:9999](http://127.0.0.1:9999/); stop it with `make dozzle-stop`. Swagger UI and the Postman collection are described in the [API guide](api/README.md). The [installation guide](installation.md) also documents isolated Garage (HTTPS 8444) and `make garage-*` commands.

## 8. AI use in development

[AI development journal](ai-journal.md) · [French journal](ai-journal.fr.md)

**Working posture.** I used AI as a development assistant through supervised delegation: I retained responsibility for scoping tasks, architectural choices, trade-offs, correction requests and acceptance of deliverables.

**Delegated tasks.** ChatGPT and Codex contributed to design, implementation of multiple user stories, test generation, debugging and documentation. Issues, commits and pull requests trace these contributions. The AI journal distinguishes proposals, decisions and verification.

### Technical review of AI-generated code

The summary below presents examples of review and acceptance from the [AI journal](ai-journal.md). It documents requested corrections, decisions and verification results.

| Feature | Finding and decision | Verification |
| --- | --- | --- |
| Registration (US03, [PR #34](https://github.com/jlbokass/datashare/pull/34)) | Validation messages were initially in English; a correction was requested to match the interface language. | Local acceptance and regression tests were reported successful after correction; detailed output was not archived. |
| Public download (US02, [PR #43](https://github.com/jlbokass/datashare/pull/43)) | Routes lost during a merge conflict were identified with Codex; routes were restored and formatting corrected. | Successful CI: 33 Laravel tests, 217 assertions, Pint and frontend checks. Five local acceptance scenarios passed. |
| Individual deletion (US06, [PR #46](https://github.com/jlbokass/datashare/pull/46)) | Ownership checks, file-scoped deletion and parent-transfer locking were retained. | [Backend CI](https://github.com/jlbokass/datashare/actions/runs/44446497875): 52 tests and 364 assertions; [frontend CI](https://github.com/jlbokass/datashare/actions/runs/44446497731): 44 tests and successful build. Five local scenarios passed. Storage/database atomicity remains a documented limitation. |

**Supervision.** Diff review, local functional acceptance and CI checks control AI contributions; this summary is not an exhaustive code audit.

**Benefits and limitations.** AI accelerates preparation of code, tests and documentation; no quantified time saving was measured. Context and execution errors require human review. When Docker access was blocked, running PHPUnit in the application service reset the local PostgreSQL schema through `RefreshDatabase`. The fix enforces in-memory SQLite and checks configuration before test traits; it was validated in [PR #78](https://github.com/jlbokass/datashare/pull/78). The incident illustrates the need for isolated test environments and non-destructive procedures. Details and limitations are recorded in the AI journal.

## Outstanding assessment work

**Before the assessment:** include coverage screenshots for the 25 November release, finalize the presentation and demonstration script. Feature development is frozen.
