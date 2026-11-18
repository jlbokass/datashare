---
layout: default
title: "DataShare — US03 Account registration"
permalink: /us03-registration.html
lang: en
---

# US03 — Account registration

[**Français**](us03-registration.fr.md) · [Documentation home](index.md)

**Status: developer reports green Docker builds, PostgreSQL migrations, Laravel/Angular tests and Angular build. Registration, duplicate emails, short passwords and French feedback were verified in the browser. Full Figma-level responsiveness remains a later UI acceptance task.**

This issue implements the mandatory [US03 — Création de compte](https://github.com/jlbokass/datashare/issues/6) from the supplied OpenClassrooms specifications, using the approved [OpenAPI contract](api/README.md) and the [UI handoff](design-handoff.md).

## Scope and contract

- Public `POST /api/auth/register` accepts **only** `email` and `password`, returns HTTP **201** and `{"user":{"id":"<uuid>","email":"...","created_at":"..."}}`.
- Email is validated, trimmed and lowercased before unique lookup. The database already has a unique email index.
- Password requires **at least 8 characters**. The Laravel model's `hashed` cast creates a salted hash; raw password is not returned.
- No name, administrator account, email verification, automatic login or JWT is added to US03. **US04** handles JWT.
- Additional user migration makes the scaffold's `name` nullable and adds a UUID `public_id` for API responses, keeping the existing integer internal key and data intact. Existing rows get a UUID; new rows generate it at creation.
- Register endpoint is rate-limited at **10 requests per minute per client** as an extra basic abuse control (not a claim of production hardening).
- Validation error JSON includes `message`, `code=validation_error` and `errors`, consistent with the approved API error schema.
- Angular `/register` uses reactive forms, visible validation and the handoff's desktop/mobile palette and card styling. Password confirmation exists **only in the form**; the backend contract remains unchanged.

## Local recipe

On `feat/us03-registration` after pulling `develop`, with your existing root and backend `.env` unchanged:

```bash
docker compose config --quiet
docker compose build app php
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan migrate:status
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
```

**The PHP image is rebuilt to ensure `pdo_sqlite` is present for isolated PHPUnit tests.** Production/development database migrations above run on PostgreSQL via the `app` service; the automated tests use isolated SQLite in memory. Never run `migrate:fresh` on a database you wish to keep.

Open **http://127.0.0.1:8080/register**. Create an account, repeat the same email with different capitalization and try a password shorter than eight characters. Verify validation and success messages, layout on mobile **393px** and desktop **1440px**; check browser DevTools for unwanted errors.

Optional API smoke test (use test credentials only):

```bash
curl -i -X POST http://127.0.0.1:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"us03-demo@example.com","password":"ExamplePass123!"}'
```

A successful result returns **201**, only the user envelope, **no JWT**. A repeated email returns **422**. Your test account persists in your local PostgreSQL database.

## Acceptance evidence

- [ ] Laravel tests pass (valid, missing, invalid, duplicate-case emails, short password, hashed password and absence of JWT).
- [ ] Angular build and tests pass; registration form sends only email/password and displays server errors.
- [ ] PostgreSQL migration applies **without data reset**.
- [ ] Browser flow works on local Nginx origin and handoff's desktop/mobile widths.
- [ ] The developer reviews the code and the bilingual AI journal entry before merging to `develop`.

**Not in US03:** JWT issuance, signed-in session, protected history, actual upload, full pixel-perfect Figma acceptance, production deployment.
