---
layout: default
title: "REST API interface contract"
permalink: /api/README.html
lang: en
---

# DataShare API — Interface contract

The REST API covers the required US01–US06 features. Its documentation is derived from the Laravel code and the [DESIGN-03](https://github.com/jlbokass/datashare/issues/3) design contract.

[Version française](README.fr.md) · [Technical documentation](../technical-documentation.md) · [Installation](../installation.md)

## Access and use the API

| Resource | Purpose |
| --- | --- |
| [Swagger UI](http://127.0.0.1:8080/docs/api) | Browse operations and execute requests |
| [OpenAPI JSON](http://127.0.0.1:8080/docs/api.json) | Specification generated from Laravel |
| [OpenAPI YAML contract](openapi.yaml) | Design contract reconciled with the implementation |

Both local URLs require development dependencies and `APP_ENV=local`. Swagger UI loads assets from jsDelivr (pinned version 5.34.1), so internet access is required. External validation and JWT persistence are disabled.

## Conventions

- `/api` prefix; JSON for application data, `multipart/form-data` for uploads and streamed bytes for downloads.
- `snake_case` JSON fields, ISO 8601 dates and public UUID identifiers.
- Private operations require `Authorization: Bearer <JWT>`; the 64-character hexadecimal share token is independent of the JWT.
- Application errors expose `message` and `code`, with `errors` for validation (422). Framework 429 and unhandled 500 responses may omit `code`.

The user-story mapping is in the [technical documentation](../technical-documentation.md). Request/response schemas, descriptions and HTTP statuses are available in Swagger UI.

## Maintain the documentation

English PHPDoc describes functional behavior; PHP 8 `Group` attributes organize operations by domain. Scramble 0.13.55 infers the OpenAPI 3.1 specification from the code. The two support routes retain their closures through the `ClosureGroup` adapter.

`DataShareOperationTransformer` and the public-share response attribute supplement inference for multipart uploads, binary downloads, errors, formats and constraints that cannot be inferred. File-byte limits and conditional demonstration expiry remain server-side rules described but not fully represented by the generated schema. The YAML remains the design contract; exporting does not overwrite it.

To export the specification from the repository root with the local stack running:

```bash
docker compose exec -T -e APP_URL=http://127.0.0.1:8080 app \
  php artisan scramble:export --stdout --fail-on-unknown > /tmp/datashare-openapi.json
```

`--fail-on-unknown` flags unknown inferred types; it does not replace validation of actual behavior. Automated checks and their execution environment are described in [TESTING](../en/TESTING.md).

## Interactive acceptance

Use a disposable account and two small allowed files. Requests create real local records; never use private data or publish JWTs.

| Check | Expected result |
| --- | --- |
| `POST /auth/register`, then `POST /auth/login` | 201 then 200; copy `access_token` into Authorize without the `Bearer` prefix |
| `GET /auth/me` | 200 with JWT; 401 without JWT |
| `POST /transfers` with one file, then two | Two 201 responses; one then two items in `transfer.files` |
| `GET /transfers` | Both transfers appear in the account history |
| `GET /shares/{token}` and `GET /shares/{token}/files/{fileId}` | 200 without JWT; metadata then file attachment |

For uploads, set `expires_in_days=1` and omit `expires_in_minutes`. In the browser Network panel, verify that each binary part is named `files[]` (one then two parts). Confirm both transfers in the Angular history. The `share_url` field points to an Angular route; the `/api/shares` endpoints use the token it contains.

Demo files remain subject to normal expiry. Passing backend tests alone does not establish browser multipart serialization.
