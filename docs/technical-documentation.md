---
layout: default
title: "DataShare — OpenClassrooms Technical Documentation"
permalink: /technical-documentation.html
lang: en
---

# DataShare — Technical documentation (OC P3)

[**Français**](technical-documentation.fr.md) · [Documentation home](index.md)

**Status — 18 November 2026: evolving draft, NOT the final evaluated report.** Based on the **eight sections** of the OpenClassrooms *Modèle de documentation technique* provided with this project. Where evidence does not yet exist, this document says so. Source specifications, OC mission and original model remain in their supplied French versions; authored project documents are bilingual.

## 1. Application architecture (simple diagram)

![DataShare — architecture](diagrams/architecture.svg)

[Architecture explanation](architecture.md) · [Editable draw.io](diagrams/architecture.drawio).

- Browser Angular 22 (TypeScript/SCSS) → **Nginx** local gateway on `127.0.0.1:8080` → Laravel 13 REST API (PHP 8.4-FPM) → PostgreSQL 18 and **private local file storage**.
- Browser and API share one local origin; HTTP is used **only for local development**, not as a claim of production HTTPS.
- Docker Compose creates an isolated dev stack, app, frontend, Nginx, PostgreSQL and a Laravel scheduler. US01 purge removes expired files and metadata; public download implementation is still US02.
- Main protected `main`, integration `develop`, feature branches reviewed through PRs; GitHub Pages serves **only the static technical documentation**.

## 2. Justified technology choices (1–2-page deliverable)

[Detailed 1–2-page technology rationale](technology-choices.md). It compares the allowed choices and their trade-offs, including:

| Area | Current choice | Reason / alternative |
| --- | --- | --- |
| Backend | PHP 8.4, Laravel 13 | Developer experience, cohesive validation, Eloquent, storage/scheduler; Symfony also allowed |
| Frontend | Angular 22 / TypeScript | Typed, structured SPA forms and routing; Vue/React alternatives |
| Database | PostgreSQL 18 | Relational constraints and ownership between users, transfers and files; MongoDB alternative |
| File storage | Private local Laravel filesystem | Simple OC-authorized MVP; S3 is a later alternative |
| Authentication | JWT HS256, `firebase/php-jwt` v7.2.2 | Separate Angular/API client; tokens require server verification |
| HTTP/dev | Nginx + PHP-FPM + Docker Compose | Reproducible tooling and consistent reverse-proxy origin |
| Versioning and tooling | GitHub, Composer, npm, PHPUnit, Angular tests | Traceability and repeatability; CI not yet implemented |

The rationale documents the **original design decisions**; actual framework/runtime versions above reflect the scaffold and lockfile inspected on GitHub.

## 3. Data model

[Conceptual UML model](data-model.md) · [Single diagram SVG](diagrams/data-model.svg) · [Editable diagram](diagrams/data-model.drawio).

- **USER**: internal numeric Laravel key, unique email, salted password hash, public UUID, created timestamp. Name is optional; no admin role required for MVP.
- **TRANSFER** (US01): UUID, owner, unique unpredictable share token, expiry/creation timestamps. One registered owner can create many transfers.
- **FILE** (US01): UUID, parent transfer, original filename, size, MIME type, private storage locator, timestamps. One transfer contains **one or several files**.
- Implemented PostgreSQL migrations are source-controlled in `backend/database/migrations/`. Optional tags and analytics drawn in DESIGN-02 are **not** in the database implementation. Retention/aggregation needs a separate GDPR analysis before optional tracking.

## 4. REST API contract

[API guide](api/README.md) · [OpenAPI 3.1 source](api/openapi.yaml).

| Contract route | Implemented state |
| --- | --- |
| `POST /api/auth/register` | **US03**, implemented, 201 on success, 422 validation |
| `POST /api/auth/login` | **US04**, implemented, signed Bearer JWT |
| `GET /api/auth/me` | **US04**, JWT protected |
| `POST /api/transfers` | **US01**, JWT-protected multipart, responds 201 and share link |
| `GET /api/shares/{token}`, `GET /api/shares/{token}/files/{fileId}` | **US02 pending**; generated link currently opens a pending page |
| `GET /api/transfers` | [US05 implemented on feature branch; Docker/browser acceptance pending](us05-personal-history.md) |
| `DELETE /api/transfers/{transferId}/files/{fileId}` | [US06 implemented; acceptance pending](us06-file-deletion.md) |

`GET /api/health` is an infrastructure smoke endpoint, **not** an OC business User Story. Contract includes 401/404/410/413/422 response designs; never claim unimplemented endpoints work.

## 5. Security and access management

[Security controls, open risks and planned scan](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md).

- Passwords are salted-hashed; email is unique. JWTs are HS256 signed with dedicated `JWT_SECRET`, ~30-minute TTL, verified server-side. Angular keeps tokens in memory and requires a new login after a full page refresh; client logout does **not** revoke already-issued JWTs.
- Protected upload requires JWT; private content resides outside the web root under opaque names. Validation checks MIME and extension, **1,000,000,000 bytes maximum per file**, and selected operational caps of 5 files / 2 GB aggregate. Default expiration is 7 days (1–7 permitted).
- The five-minute demo expiry is **a local-only feature flag**, not an OC requirement, and is rejected when disabled/outside local or testing.
- ZIP is treated as an opaque file and **not scanned by antivirus**; folder-tree upload is unsupported. Optional US09 password protection remains unimplemented. [ZIP and download decision — US02 #5](https://github.com/jlbokass/datashare/issues/5).
- **HTTPS/TLS for production, security audits, scans, hardening and backup security are not yet demonstrated.**

## 6. Quality, tests and maintenance

Four separate OC-named files are maintained at the repository root, each with a French counterpart:

| OC file | What it contains | Current evidence status |
| --- | --- | --- |
| [TESTING.md](https://github.com/jlbokass/datashare/blob/develop/TESTING.md) · [FR](https://github.com/jlbokass/datashare/blob/develop/TESTING.fr.md) | Test plan, critical acceptance, commands, future E2E and 70% indicative coverage objective | Local green results **reported by developer**, formal coverage report **not measured** |
| [SECURITY.md](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md) · [FR](https://github.com/jlbokass/datashare/blob/develop/SECURITY.fr.md) | Access control, restrictions, unresolved risks, future scan procedure | **No scan evidence yet** |
| [PERF.md](https://github.com/jlbokass/datashare/blob/develop/PERF.md) · [FR](https://github.com/jlbokass/datashare/blob/develop/PERF.fr.md) | Planned critical-endpoint k6 benchmark, frontend bundle budget, future metrics | **No benchmark or measured bundle results yet** |
| [MAINTENANCE.md](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.md) · [FR](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.fr.md) | Docker/DB/scheduler maintenance, dependency update cadence and risks | Local procedure; **no production recovery test** |

**US01 local recipe:** developer reported Docker/migrations, backend/frontend tests/build, PDF/multifile upload, home reset and demo expiry green. Pixel-level Figma conformity remains open in [UI-01 #37](https://github.com/jlbokass/datashare/issues/37); no independent captured commands were attached.

## 7. Installation and execution

[Detailed Docker-first instructions](docker-setup.md) · [Local integrated stack recipe](development.md) · [US01 verification](us01-upload.md).

1. Have Docker Desktop + Compose, Git, a checked-out repository; use a **private root `.env`** for PostgreSQL settings and a **private `backend/.env`** with existing Laravel `APP_KEY` and independently generated JWT secret. Do not commit either.
2. From the repo root, run `docker compose config --quiet`, then `docker compose up -d --build`.
3. Run `docker compose exec -T app php artisan migrate --force` (never `migrate:fresh` on valued data). Confirm `docker compose ps` and `docker compose exec -T app php artisan schedule:list`.
4. Open **http://127.0.0.1:8080/** for Angular and use `/login` to authenticate. Files live in `backend/storage/app/private/transfers`; no public download endpoint exists yet.
5. Test using the commands in TESTING.md. `docker compose down` stops the local stack while preserving named volumes; avoid `down -v` unless intentionally wiping data.

Production hosting, HTTPS setup, deployment scripts and recovery checks are **not yet delivered**.

## 8. AI use in development

[Evidence-based AI journal (EN)](ai-journal.md) · [Journal IA français](ai-journal.fr.md).

Working mode: developer owns decisions, code review, acceptance and final responsibility; AI assists in documented and bounded design, code, tests, GitHub operations and documentation. Examples: UML revisions, OpenAPI, Docker-first integration, US03/US04 authentication and US01 upload/expiry, fixes after user testing. **Logs and PRs are traceable; do not invent actions or individual prompts.**

The **original OC mission supplied** mentions an older restriction to one AI-developed US; the developer reports that their mentor considers this restriction outdated. The latest written policy has **not been independently verified**: confirm the accepted guidance before the final assessment.

## Remaining before final OC delivery

Complete US02 acceptance, US05 Docker/browser acceptance and US06 deletion/concurrency acceptance, capture 2–3 E2E scenarios and coverage evidence (indicative 70%), produce a security dependency scan and critical endpoint performance test with real metrics, resolve US02 ZIP risk and UI-01 Figma mismatch, document deployment/production HTTPS and finalize the quality files and maintenance procedures. This page is the **living index**, not a substitute for missing evidence.
