---
layout: default
title: "REST API interface contract"
permalink: /api/README.html
lang: en
---

# DataShare API — Interface contract

The REST API covers the required US01–US06 features and optional US08 (private file tags), US09 (file password) and PROFILE-01 (account profile). Its documentation is derived from the Laravel code and the [DESIGN-03](https://github.com/jlbokass/datashare/issues/3) design contract.

[Version française](README.fr.md) · [Technical documentation](../technical-documentation.md) · [Installation](../installation.md)

Release #100 has **13 API operations** in Laravel: 4 Authentication, 4 Transfers, 3 Public sharing and 2 System (`GET /health`, `GET /demo/capabilities`). The YAML contract contains the 11 business operations; Scramble also documents the two support routes by design. The Postman collection contains 18 requests, including multiple scenarios for individual operations. The historical 10-operation acceptance does not validate all 13 final operations.

## Access and use the API

| Resource | Purpose |
| --- | --- |
| [Swagger UI](https://127.0.0.1:8443/docs/api) | Browse operations and execute requests |
| [OpenAPI JSON](https://127.0.0.1:8443/docs/api.json) | Specification generated from Laravel |
| [OpenAPI YAML contract](openapi.yaml) | Design contract reconciled with the implementation |

The HTTPS links assume [local TLS mode](../installation.md#optional-local-https) is active; in default HTTP mode use port 8080 with `http://`. Both local URLs require development dependencies and `APP_ENV=local`. Swagger UI loads assets from jsDelivr (pinned version 5.34.1), so internet access is required. External validation and JWT persistence are disabled.

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
docker compose exec -T -e APP_URL=https://127.0.0.1:8443 app \
  php artisan scramble:export --stdout --fail-on-unknown > /tmp/datashare-openapi.json
```

In HTTP mode, use `APP_URL=http://127.0.0.1:8080` instead. `--fail-on-unknown` flags unknown inferred types; it does not replace validation of actual behavior. Automated checks and their execution environment are described in [TESTING](../en/TESTING.md).

## Paginated history (#59)

`GET /transfers` returns 10 transfers per page, with their files grouped together and `pagination` metadata (`current_page`, `per_page`, `last_page`, `total`). Use `page=2` for the next page and `status=active|all|expired` to filter before pagination. Without `status`, `include_expired` retains its original behavior. Out-of-range pages return an empty list; Angular returns to the last available page automatically.

## Account profile (PROFILE-01 — #65)

Registration accepts optional `name` (family name) and `first_name` (given name), strings up to 255 characters or `null`. Registration, login and `GET /auth/me` responses include both fields. Authenticated `PATCH /auth/me` updates only those fields on the current account; omitted fields are unchanged and `null` clears a value. Email and password are not editable here. Angular's `/profile` route uses the existing auth guard.

## Private tags (US08 — #11)

`PUT /transfers/{transferId}/files/{fileId}/tags` replaces the full list (`{"tags":["Project","Invoices"]}`), or clears it with `{"tags":[]}`. JWT and file ownership are checked. Labels are trimmed, case-sensitive, non-empty, unique per file and limited to 30 characters. Invalid input returns 422; unknown or non-owned files return 404. Private upload and history responses include `tags`; public sharing does not. No tag filter is provided.

## Per-file password (US09 — #12)

On upload, omit `passwords[]` for unprotected files or send one repeated text part `passwords[]` per `files[]` in the same order (empty string for unprotected). A nonempty password must have at least 6 characters and at most 72 UTF-8 bytes (bcrypt limit), with no NUL or whitespace-only value; leading/trailing spaces are preserved. Only the hash is persisted. Metadata exposes only `password_protected`.

For protected files, send `POST /shares/{token}/files/{fileId}/authorize` with JSON `{"password":"..."}`, without JWT. Wrong passwords return 403 (`invalid_password`), invalid input returns 422, and the sixth attempt within the one-minute window returns 429. HTTP 200 returns `download_url`, a file-specific relative signed URL valid for 60 seconds. Open that exact URL on the application origin; the server rechecks the token, transfer expiry, file membership and signature. Unsigned GET on a protected file returns 403 (`password_required`). Unprotected files retain direct GET. Signed URLs are reusable until expiry: do not publish or log them. No plaintext password, hash disclosure or password recovery; anonymous upload remains out of scope.

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

## Postman collection (optional local acceptance)

Import the [v2.1 collection](postman/DataShare.postman_collection.json) and [local environment](postman/DataShare.local.postman_environment.json) into Postman. Enable HTTPS (`make https-up`), select **DataShare — Local**, and if necessary add the public CA certificate at `$(mkcert -CAROOT)/rootCA.pem` under Settings → Certificates → CA certificates. Keep TLS verification enabled; never import the CA private key.

Set only local (not shared) values for `email` (e.g. unique `postman-20261125-01@example.com`) and `password` (disposable password of at least eight characters). Never export populated environments, JWTs or real share tokens. Use disposable files without private content.

Send individual requests in order: System (2), Authentication (4, including the disposable account profile update), Transfers (one-file upload then two-file upload using File fields named `files[]`, then history), Public sharing (metadata then download). JWT and identifiers are stored automatically in the local environment; assertions verify status codes and useful response data. Use Send and Download to inspect the downloaded file if needed. The tag update is guarded by the captured identifiers from the last disposable upload; send a list of tags, then `{"tags":[]}` to check removal. DELETE is limited to the last uploaded acceptance file and skipped by default; only set `allowDelete=true` after public sharing if explicitly deleting this disposable data. Never run it on existing data.

After the standard checks, use the Postman folder **US09 — Password protected (manual)**: upload a disposable protected file, test unsigned GET and wrong password, then authorize and download. Set the local `filePassword` value to a fictional alphanumeric password of at least 6 characters. Send the final request within 60 seconds; the signed URL variable is cleared after use. Never export populated variables.

To update the collection after an API change, import Scramble's JSON at `/docs/api.json` (or use the export above), group by tags and reconcile changes in the existing collection while preserving variables, scripts, authentication and safeguards; export v2.1 without secrets. Swagger UI and the design contract remain the references. No Newman or new CI check is required.
