---
layout: default
title: "REST API interface contract"
permalink: /api/README.html
lang: en
---

# DataShare API — Interface contract

**Status (24 November 2026):** [DESIGN-03](https://github.com/jlbokass/datashare/issues/3) design contract reconciled with the implemented US01–US06 API in [DELIVERY-API #75](https://github.com/jlbokass/datashare/issues/75). Generated documentation supplements this contract.

- [Version française](README.fr.md)
- [OpenAPI 3.1 specification](openapi.yaml)
- [Architecture (EN)](../architecture.md) · [Conceptual UML data model (EN)](../data-model.md)

## 1. Scope and conventions

### Local generated documentation — DELIVERY-API

Scramble **0.13.55** generates OpenAPI **3.1.2** from Laravel. Phase 1 installation, routing, Composer audit, backend tests and Pint were manually validated by the developer. The maintained [OpenAPI 3.1.0 YAML](openapi.yaml) remains the design contract, reconciled with implemented behavior; it is not overwritten by generation.

- [Interactive reference](http://127.0.0.1:8080/docs/api)
- [Generated JSON](http://127.0.0.1:8080/docs/api.json)

Documentation requires `APP_ENV=local`: `RestrictedDocsAccess` is retained and no `viewApiDocs` gate grants access elsewhere. The Nginx gateway binds to loopback and forwards the two documentation paths to Laravel. Install development dependencies with the existing Composer lock; Scramble is not required for normal application boot without dev packages.

`AppServiceProvider` configures `MiddlewareAuthSecurityStrategy` for the existing `AuthenticateJwt` middleware, using a single `bearerAuth` HTTP Bearer scheme with `bearerFormat: JWT`. Four protected operations inherit the document-level requirement; the four public business operations explicitly declare `security: []`. A public share token is a capability, not a JWT. The generated document also includes the public `/health` and `/demo/capabilities` support endpoints.

### Export and verification

From the repository root, with the existing stack running:

```bash
# Export to the host without modifying the design contract.
docker compose exec -T -e APP_URL=http://127.0.0.1:8080 app \
  php artisan scramble:export --stdout --fail-on-unknown > /tmp/datashare-openapi.json
# Inspect middleware on both documentation routes.
docker compose exec -T app php artisan route:list --path=docs -vv
bash scripts/qa.sh all
git diff --check
```

CLI generation uses `APP_URL`; the command supplies the gateway origin explicitly. HTTP generation uses the current request origin. `--fail-on-unknown` catches unknown inferred types, but is not proof of complete API correctness. The UI loads Stoplight assets from a CDN, so rendering requires network access.

### Reconciliation and remaining inference limits

| Area | Correction or remaining limit |
| --- | --- |
| Authentication | One JWT scheme, four protected/four public business operations; missing middleware 401 responses added. |
| Public sharing | Explicit response annotation for the public metadata envelope; service-level 404/410 added. No owner email, numeric user key, password, storage path or raw share token in public metadata. |
| Download | Replaced incorrect JSON success with `application/octet-stream`, binary schema, attachment, `nosniff` and private/no-store headers. An unhandled failure before streaming uses a framework 500; failure after headers may truncate bytes. |
| Validation | 422 includes `message`, `code: validation_error` and field `errors`. 429 is a framework response with `message`, without a guaranteed `code`. |
| Upload | Required `files[]`, 1–5 binary files; 1,000,000,000 bytes each and 2,000,000,000 total. Byte caps and allowed types are described, not machine-enforced by JSON Schema. Actual content/extension checks remain server-side. |
| Expiration | 1–7 days, default 7; integer enum `[5]` for opt-in local/testing demo. The generator does not express mutual exclusion or the environment/feature-flag condition structurally; descriptions and the YAML record them. |
| Parameters and models | UUID/date-time/email formats and 64-lowercase-hex token pattern added; `include_expired` behavior described. User ID and creation date retain conservative nullable inference from the existing model/schema. |
| Design drift | Removed unimplemented `title`/`message`; specified total/count limits, demo expiry, token format and 429; removed request `additionalProperties: false` because Laravel ignores unknown fields. |

`backend/app/Documentation/DataShareOperationTransformer.php` only corrects gaps in generated documentation; it never changes request validation or response execution. The public-share response attribute and these corrections must be reviewed when runtime behavior changes. Most upload/history/authentication shapes remain inferred. Structural differences (inline schemas versus YAML references, operation IDs/tags and OpenAPI patch version) are intentional. The YAML remains more explicit about response object closure and some bounds. Its reusable ApiError permits optional errors, whereas runtime field errors are emitted for 422 only. Local `APP_DEBUG` may expose diagnostics on unhandled framework errors; the documented safe custom envelopes do not imply that every failure is sanitized.

### Short manual acceptance

1. Open both URLs and confirm the DataShare title, eight business operations and two support operations.
2. With a disposable local account, call login. Copy its JWT into the reference's Bearer authorization input. Confirm `/auth/me`, upload, history and deletion require it; a request without it returns 401.
3. Upload a small allowed file using `files[]`, with `expires_in_days=1` and no minute expiry. Expect 201 and a relative `/share/{token}` URL. Record the file UUID and token from this response only.
4. Clear JWT authorization. Read `/shares/{token}` and download `/shares/{token}/files/{fileId}`: expect 200, restricted metadata and unchanged attachment bytes. Do not paste real credentials or private files into examples.
5. Check history with and without `include_expired=true`; malformed/mismatched share identifiers return 404. Existing tests cover expired links (410), invalid uploads (413/422), ownership and deletion. Run the existing QA command above; no new test suite is needed.

The API contract covers the **mandatory OpenClassrooms MVP US01–US06**. The backend is Laravel, the client Angular, persistence PostgreSQL, and uploaded bytes remain in private storage.

- **REST API root:** `/api` (the OpenAPI `servers` entry defines this prefix).
- **Payloads:** JSON for application data, `multipart/form-data` for file uploads, streamed bytes for downloads.
- **Naming:** `snake_case` in JSON fields and path parameters named `transferId`, `fileId`, `token`.
- **Dates:** ISO 8601 date-time values with an explicit timezone.
- **Identifiers:** UUID for user, transfer and file; the public share token is an independent, unpredictable opaque secret.
- **Authorization:** `Authorization: Bearer <JWT>` for private routes; the public `/shares` routes require no JWT.
- **Error shape:** `{ "message": "...", "code": "...", "errors": { "field": ["..."] } }`. The `errors` object is present for validation. Framework 429 and unhandled 500 responses do not guarantee a `code` field.

## 2. Endpoint contract mapped to the official user stories

| US | Method and API path | Authentication | Expected success | Purpose |
| --- | --- | --- | --- | --- |
| **US03** | `POST /api/auth/register` | Public | 201 JSON | Create account with unique valid email and password of at least 8 characters |
| **US04** | `POST /api/auth/login` | Public | 200 JSON | Verify email/password and issue a JWT |
| **US04 support** | `GET /api/auth/me` | JWT | 200 JSON | Restore signed-in user context for the Angular SPA (supporting operation, not a new US) |
| **US01** | `POST /api/transfers` | JWT | 201 JSON | Upload one or more files; create transfer and share token |
| **US05** | `GET /api/transfers` | JWT | 200 JSON | List the authenticated user's transfers and associated files |
| **US06** | `DELETE /api/transfers/{transferId}/files/{fileId}` | JWT | 204 | Irreversibly delete **one owned file** after frontend confirmation |
| **US02** | `GET /api/shares/{token}` | Public link | 200 JSON | Show share metadata before download |
| **US02** | `GET /api/shares/{token}/files/{fileId}` | Public link | 200 binary | Stream one file without exposing private storage |

There is **no** `DELETE /api/transfers/{id}` user endpoint in this MVP because the official **US06 concerns a single file**, not the entire transfer. If the final file is deleted, its empty parent transfer is removed as a backend invariant.

## 3. Contract examples

### Register — US03

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{ "email": "user@example.test", "password": "example-password-123" }
```

A `201` response returns public user fields under `user`, without a password or token. The user then logs in; login returns `access_token`, `token_type: "Bearer"` and `user`.

### Upload — US01

```http
POST /api/transfers
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

Form fields: `files[]` (**1–5** files); optional `expires_in_days` (integer **1–7**, default **7**). Alternatively, `expires_in_minutes=5` is available only in local/testing with the explicit demo flag; never send both expiry fields. `title` and `message` are not implemented.

`201` JSON:

```json
{
  "transfer": {
    "id": "11111111-1111-4111-8111-111111111111",
    "share_url": "/share/sample-token-placeholder",
    "created_at": "2026-11-18T11:00:00Z",
    "expires_at": "2026-11-25T11:00:00Z",
    "status": "valid",
    "files": [
      {
        "id": "22222222-2222-4222-8222-222222222222",
        "original_name": "report.pdf",
        "size_bytes": 204800,
        "mime_type": "application/pdf",
        "uploaded_at": "2026-11-18T11:00:00Z"
      }
    ]
  }
}
```

The `share_url` is an **Angular route**, not an API endpoint. Angular opens `/share/{token}` and calls `GET /api/shares/{token}`.

The MVP uses **1,000,000,000 bytes per file**, at most five files and **2,000,000,000 total bytes** per transfer. The latter two limits are local choices, not OC requirements. Formats are validated server-side (see [SECURITY](../en/SECURITY.md)).

### Delete — US06

```http
DELETE /api/transfers/11111111-1111-4111-8111-111111111111/files/22222222-2222-4222-8222-222222222222
Authorization: Bearer <JWT>
```

Returns `204 No Content`. Angular must request confirmation **before sending** the DELETE. Laravel checks that both the transfer and the file belong to the authenticated user's scope. File bytes and metadata are removed without deleting sibling files.

## 4. Errors and access-control decisions

| Condition | Response | Explanation |
| --- | --- | --- |
| Missing, invalid or expired JWT | **401** | Protected route is unavailable |
| Invalid or duplicate registration input | **422** | Structured field validation errors |
| Invalid upload size at the HTTP boundary | **413** | Payload/file too large, clear user message |
| Unsupported file type or bad expiry | **422** | Server-side validation and file-type policy |
| Unknown public token, missing file, or file outside a share | **404** | No file/owner information leaked |
| Expired public token, not yet purged | **410** | Explicit expired-link message |
| Transfer/file not owned by logged-in user | **404** | Deliberate concealment of private resource existence |
| Storage or server failure | **500** | Generic message; internal diagnostics stay in server logs |

No direct file-storage URL may be returned. Downloads must be streamed through the API with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` and suitable caching controls. Server-side validation remains authoritative.

## 5. History and expiry

US05 requests a valid/expired link status. US06 specifies that **only non-expired files appear by default**. The [US05](https://github.com/jlbokass/datashare/issues/8) of `GET /api/transfers` excludes expired records by default and supports an optional `include_expired=true` query switch for records awaiting physical purge. Fully purged records cannot reappear. The link status is **derived**, not an additional database column.

US01 requires files **and metadata** to be removed at expiry. The cleanup mechanism is implemented in DESIGN-01, while OpenAPI only documents client-visible behavior.

## 6. Optional features deliberately excluded

The OpenAPI file does **not** expose US07 anonymous upload, US08 tags, US09 protected downloads, nor optional download-analytics management routes. Optional US10 scheduling is an internal operation; it is not a public API endpoint. These features remain in the backlog, and the MCD marks the optional concepts separately.

## 7. Implemented behavior

- Registration: 201 without JWT; normalized email, duplicate or invalid password → 422. Login: Bearer JWT, generic 401 for invalid credentials. `/api/auth/me` requires a valid JWT.
- Upload: multipart `files[]`, one relative `/share/{token}` link (64 hexadecimal characters), common expiry, UUIDs and metadata; no private path exposure. On storage or database failure, already written bytes are cleaned up. Expiry 1–7 days (7 by default); five-minute demo restricted to local use.
- Download: public link without an account, permitted metadata only, forced attachment bytes, `application/octet-stream`, `nosniff` and no shared cache. 410 after expiry while metadata exists; 404 after purge.
- History: owner only, descending creation time then ID, no pagination; `include_expired=true` includes only records awaiting purge. `Cache-Control: private, no-store, max-age=0`. Status is derived from expiry.
- Deletion: 204, 404 for unknown or other-account resources; only one file, siblings remain available. Last-file deletion revokes the link. Storage failure returns 500 and retains metadata for recovery (see [architecture](../architecture.md)).
- [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57) is closed: purge and history unchanged. No permanent retention mechanism was added.

See [TESTING](../en/TESTING.md) for evidence and limits, and [installation](../installation.md) to run the MVP.
