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

`AppServiceProvider` uses Scramble 0.13.55's `expose(ui: false, document: '/docs/api.json')`: Scramble registers only the generated document route. `routes/web.php` registers one Blade view at `/docs/api`, guarded by `RestrictedDocsAccess` and the presence of Scramble. Neither route needs a second specification or a frontend build. Scramble 0.13.55 also reads `ui.title` when generating OpenAPI `info.title`; this setting is retained and shared with the Blade page title, independently of the disabled default renderer.

`AppServiceProvider` configures `MiddlewareAuthSecurityStrategy` for the existing `AuthenticateJwt` middleware, using a single `bearerAuth` HTTP Bearer scheme with `bearerFormat: JWT`. Four protected operations inherit the document-level requirement; the four public business operations explicitly declare `security: []`. A public share token is a capability, not a JWT. The generated document also includes the public `/health` and `/demo/capabilities` support endpoints.

### Functional documentation and grouping

English PHPDoc supplies the purpose and access/business behavior of all ten operations; inferred schemas and validation rules remain in Scramble. PHP 8 `Group` attributes supply these domains in order (weights 10, 20, 30, 40):

| Domain | Operations |
| --- | --- |
| Authentication | Register, login, current account (3) |
| Transfers | Create, list own transfers, delete a file (3) |
| Public sharing | Read share metadata, download a file (2) |
| System | API availability, demonstration capabilities (2) |

The two support routes remain closures. In 0.13.55 the native `Group` attribute targets classes/methods only; the small `ClosureGroup` subclass adds the function target and is recognized by Scramble's native subclass-aware attribute reader. No custom grouping transformer or controller is needed. Declaration order is retained within domains. Swagger UI uses the DataShare REST API title, a short overview, expanded group lists, filtering and collapsed models through native options; there is no custom theme or sorting JavaScript.

### Documentation acceptance — without API execution

The developer confirmed Step 1 Swagger UI accessibility and backend QA. For Step 2, read `/docs/api` and `/docs/api.json` without using **Try it out**. Verify the title, the four domains in the order above, their 3/3/2/2 operations, and non-empty English summaries/descriptions. Inspect effective security: `/auth/me`, both `/transfers` operations and file deletion require `bearerAuth`; registration, login, both public-sharing operations and both System endpoints have `security: []`. Keep one HTTP Bearer JWT scheme. Inspect upload `multipart/form-data` with required `files[]`, 1–5 binary items and unchanged expiry constraints; inspect download 200 as `application/octet-stream` with `type: string`, `format: binary`. Keep both routes local-only. Functional acceptance below is separate and deferred until documentation review.

### Export and verification

From the repository root, with the existing stack running:

```bash
# Export to the host without modifying the design contract.
docker compose exec -T -e APP_URL=http://127.0.0.1:8080 app \
  php artisan scramble:export --stdout --fail-on-unknown > /tmp/datashare-openapi.json
# Inspect middleware on both documentation routes.
docker compose exec -T app php artisan route:list --path=docs -vv
bash scripts/qa.sh backend
git diff --check
```

CLI generation uses `APP_URL`; the command supplies the gateway origin explicitly. HTTP generation uses the current request origin. `--fail-on-unknown` catches unknown inferred types, but is not proof of complete API correctness. Swagger UI **5.34.1** loads its CSS and JavaScript bundle from **cdn.jsdelivr.net** (`swagger-ui-dist@5.34.1`); rendering requires network access to that CDN. The specification is fetched directly from `/docs/api.json` on the browser origin, not from an external service. External validation is disabled (`validatorUrl: null`), and JWT authorization is not persisted (`persistAuthorization: false`): reauthorize after refreshing the page.

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

### Later functional acceptance — Swagger UI and multipart

Run from the existing local stack; use a disposable account and two small plain-text files, `swagger-one.txt` and `swagger-two.txt`, with harmless demonstration content. Do not delete existing data or demo files. This recipe creates real local records; normal expiration still applies.

1. Open `http://127.0.0.1:8080/docs/api`: confirm Swagger UI. Open `/docs/api.json`: confirm OpenAPI 3.1.2, eight business operations plus two support endpoints, and exactly one HTTP Bearer JWT scheme. Under `paths./transfers.post.requestBody.content.multipart/form-data.schema`, check `required: ["files[]"]`, array items `type: string` / `format: binary`, `minItems: 1`, `maxItems: 5`. Check day expiry 1–7/default 7 and minute enum `[5]` with the documented opt-in restriction. Do not change the running application's environment to test access restrictions.
2. If needed, expand `POST /auth/register`, select **Try it out**, enter a unique disposable email and a password of at least eight characters, then **Execute** (201). Use those credentials with `POST /auth/login` (200). In **Authorize → bearerAuth**, paste only `access_token`, without the `Bearer` prefix, and authorize. Verify `GET /auth/me` returns 200. Do not publish tokens, passwords or raw HAR files.
3. Open browser developer tools → **Network**, then `POST /transfers` → **Try it out**. Select `multipart/form-data`. Add one `files[]` file entry and choose `swagger-one.txt`; set `expires_in_days=1`. Leave `expires_in_minutes` absent, including disabling **Send empty value** if offered. Execute: expect **201** and exactly **one** element in `transfer.files`; record the transfer ID and filename.
4. Inspect the actual Network `POST /api/transfers`, not only Swagger's displayed curl example. Confirm `Content-Type: multipart/form-data; boundary=…`, an Authorization Bearer header, and one file part named exactly `files[]`. Then add a second file entry, choose `swagger-two.txt`, retain the first file and execute once. Expect **201**, one new transfer ID and exactly **two** elements in that response's `transfer.files`. Its request payload must contain two separate file parts named `files[]` (raw multipart: two `Content-Disposition: form-data; name="files[]"; filename="…"` headers), not CSV, JSON or a single `files` field. The 201 response with both file metadata records confirms Laravel accepted the expected array without adding server-side logging.
5. In Swagger UI, execute `GET /transfers` with the same JWT: find both recorded transfer IDs and their respective one/two-file lists. Sign in with the same account at `http://127.0.0.1:8080/login`, open `/account` and confirm both transfers appear in the existing application history.
6. Refresh Swagger UI and confirm authorization is cleared. Optionally check public sharing/downloads using only these demo transfers. Leave the data/files in place; do not call deletion endpoints for this recipe.

Run only `bash scripts/qa.sh backend` for backend QA, then `git diff --check`. If Docker access is blocked, stop and ask the developer to run the same command; do not substitute another environment. Passing backend tests does not prove browser multipart serialization.

Implementation references: [Swagger UI release](https://github.com/swagger-api/swagger-ui/releases/tag/v5.34.1), [OpenAPI compatibility](https://github.com/swagger-api/swagger-ui/tree/v5.34.1), [configuration options](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).

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
