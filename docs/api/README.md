# DataShare API — Interface contract

**Status:** Draft v0.1 — DESIGN-03 ([issue #3](https://github.com/jlbokass/datashare/issues/3)). **This is a design contract, not implemented Laravel code.**

- [Version française](README.fr.md)
- [OpenAPI 3.1 specification](openapi.yaml)
- [Architecture (EN)](../architecture.md) · [Conceptual UML data model (EN)](../data-model.md)

## 1. Scope and conventions

The API contract covers the **mandatory OpenClassrooms MVP US01–US06**. The backend will be Laravel, the client Angular, the persistence PostgreSQL, and uploaded bytes will remain in a private storage system.

- **REST API root:** `/api` (the OpenAPI `servers` entry defines this prefix).
- **Payloads:** JSON for application data, `multipart/form-data` for file uploads, streamed bytes for downloads.
- **Naming:** `snake_case` in JSON fields and path parameters named `transferId`, `fileId`, `token`.
- **Dates:** ISO 8601 date-time values with an explicit timezone.
- **Identifiers:** UUID for user, transfer and file; the public share token is an independent, unpredictable opaque secret.
- **Authorization:** `Authorization: Bearer <JWT>` for private routes; the public `/shares` routes require no JWT.
- **Error shape:** `{ "message": "...", "code": "...", "errors": { "field": ["..."] } }`. The `errors` object is only present when useful.

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

There is **no** `DELETE /api/transfers/{id}` user endpoint in this MVP draft because the official **US06 concerns a single file**, not the entire transfer. If the final file is deleted, its empty parent transfer is removed as a backend invariant.

## 3. Examples of the planned contract

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

Form fields: `files[]` (one or more files); optional `expires_in_days` (integer **1–7**, default **7**); optionally `title` and `message` (optional DESIGN-02 attributes, not mandatory US fields).

Proposed `201` JSON:

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

The requirement specifies **1 GB maximum** for a file. This draft interprets that as **1,000,000,000 bytes per file**; the combined size limit for a multi-file HTTP request is a separate decision, not explicitly specified by OC. The security file-type policy is also still to be selected.

### Delete — US06

```http
DELETE /api/transfers/11111111-1111-4111-8111-111111111111/files/22222222-2222-4222-8222-222222222222
Authorization: Bearer <JWT>
```

Returns `204 No Content`. Angular must request confirmation **before sending** the DELETE. Laravel checks that both the transfer and the file belong to the authenticated user's scope. File bytes and metadata are removed without deleting sibling files.

## 4. Errors and access-control decisions

| Condition | Proposed response | Explanation |
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

US05 requests a valid/expired link status. US06 specifies that **only non-expired files appear by default**. The draft `GET /api/transfers` therefore excludes expired records by default and proposes an optional `include_expired=true` query switch for records awaiting physical purge. Fully purged records cannot reappear. The link status is **derived**, not an additional database column.

US01 requires files **and metadata** to be removed at expiry. The cleanup mechanism was proposed in DESIGN-01, while OpenAPI only documents client-visible behavior.

## 6. Optional features deliberately excluded

The OpenAPI file does **not** expose US07 anonymous upload, US08 tags, US09 protected downloads, nor optional download-analytics management routes. Optional US10 scheduling is an internal operation; it is not a public API endpoint. These features remain in the backlog, and the MCD marks the optional concepts separately.

## 7. Pending approval decisions

- [ ] Confirm the route and response naming conventions (`/transfers`, `/shares`, `snake_case`).
- [ ] Confirm the **one share token for many files** rule from DESIGN-02.
- [ ] Confirm `DELETE` works on **one file**, not automatically the entire group.
- [ ] Confirm **1 GB per file** versus any total multipart-request cap; verify frontend/backend/proxy limits later.
- [ ] Confirm `include_expired` is useful or remove it as unnecessary.
- [ ] Choose permitted/forbidden file types and document them in `SECURITY.md` before implementation.
- [ ] Validate `openapi.yaml` syntactically and against an OpenAPI 3.1 validator.
- [ ] Keep this documentation synchronized with [the French version](README.fr.md) and cross-check DESIGN-01/DESIGN-02.

**No endpoint has been implemented in the new repository yet.**
