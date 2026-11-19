---
layout: default
title: "DataShare — US02 Public downloads"
permalink: /us02-download.html
lang: en
---

# US02 — Download from a unique public link

[**Français**](us02-public-sharing.fr.md) · [Documentation home](index.md)

**Status on 18 November 2026:** Backend CI (33 Laravel tests, 217 assertions and Pint) and frontend CI (tests and build) **passed** on [PR #43](https://github.com/jlbokass/datashare/pull/43). Developer reports **all five browser scenarios passed: T01 anonymous PDF, T02 multiple files, T03 invalid link, T04 harmless ZIP and T05 expiry** after synchronizing the local branch. Exact HTTP observations for T05 were not provided as browser logs; automated tests cover 410 and 404. US02 is not yet merged into `develop`.

Sources: [official US02 #5](https://github.com/jlbokass/datashare/issues/5), [DESIGN-03 OpenAPI](api/openapi.yaml), [UI handoff](design-handoff.md), [SECURITY.md](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md).

## Contract

- `GET /api/shares/{token}` is **public**; a known, non-expired and unpredictable 64-character share token returns **200** with the allowed file metadata (name, MIME type, size, expiry and public file UUID). It never reveals owner IDs, password hashes, JWTs or private storage paths.
- `GET /api/shares/{token}/files/{fileId}` is **public**, streams the bytes of exactly that file as `Content-Disposition: attachment`, with a safe original filename, `Content-Type: application/octet-stream`, `X-Content-Type-Options: nosniff` and private no-store caching.
- Unknown/invalid/purged tokens or files outside the transfer → **404** `not_found`. Expired but not-yet-purged transfer → **410** `share_expired` for metadata and download. The US01 scheduler may purge quickly, so a URL already purged returns 404.
- The API does not unpack or execute files. ZIP remains an **opaque archive**; the page warns about the lack of antivirus scanning. **No direct folder upload** and no server scanning exist yet; review this decision before any internet-facing deployment.
- Password-protected sharing belongs to optional **US09**; no password input is shown. US01 default expiry is 7 days, or 1–7 days; local-only 5-minute demo is permitted only if the flag is enabled.

## Local acceptance on Mac

From `feat/us02-public-download`:

```bash
docker compose run --rm php sh -lc 'cd backend && php artisan test --filter=PublicShareTest'
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
docker compose up -d
```

1. Log in, upload a small **PDF** on the homepage, copy the generated `/share/{token}` URL.
2. Open the URL in a **new private browsing window**, *without logging in*. Confirm filename, type, size and expiry. Click **Download**; verify the real bytes match the original and that the file is saved, not executed/previewed inline.
3. Upload **two files** (PDF and PNG), use the single share link, download each and check its filename and contents.
4. Confirm that `/share/bad-token` shows a meaningful missing-link error.
5. First check `GET /api/demo/capabilities`: `five_minute_expiry` must be `true`. If disabled, enable `TRANSFER_DEMO_5_MIN_ENABLED=true` in `backend/.env` only with `APP_ENV=local`, run `php artisan config:clear`, restart `app` and `scheduler`, then check `schedule:list` (purge every minute). Explicitly select the **five-minute demo option** for a **new** transfer, then retry after expiry. Expect 410 before purge or 404 afterward; both must block downloads. The automated test explicitly covers 410.
6. Try a harmless ZIP file. It should download unchanged, without server extraction, while the UI displays the archive warning. Do not test with real malicious software.
7. Check 393px and 1440px against the Figma handoff; actual visual parity is separately tracked in [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).

**Important:** Generated upload URLs from US01 now lead to a real public download page; you must merge US02 before saying this about `develop`. GitHub Pages hosts the documentation, not this Laravel/Angular runtime.

## Acceptance record

- [x] Laravel tests green in GitHub Actions (33 tests / 217 assertions / Pint) for anonymous access, bytes/headers, 404, 410, wrong file, missing private bytes and inert ZIP.
- [x] Angular tests and build green in GitHub Actions for valid/malformed/expired share links and download URL generation.
- [x] Developer reported T01 PDF, T02 multifile, T03 invalid link and T04 harmless ZIP green in browser.
- [x] T05 browser expiry **accepted based on developer report after local synchronization**. Automated HTTP 410/404 tests pass; detailed browser evidence was not provided.
- [ ] ZIP security limitations reviewed and recorded.
- [x] CI-01 [backend/frontend checks — CI-01 PR #42](https://github.com/jlbokass/datashare/pull/42) green on [US02 PR #43](https://github.com/jlbokass/datashare/pull/43); docs and AI journal updated with limits.
- [ ] PR approved for `develop`.
