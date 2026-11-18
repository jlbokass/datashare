---
layout: default
title: "DataShare — US01 Authenticated upload"
permalink: /us01-upload.html
lang: en
---

# US01 — Authenticated file upload

[**Français**](us01-upload.fr.md) · [Documentation home](index.md)

**Status:** The developer reports green Docker/migrations, tests/build, PDF/multi-file upload, one-day expiry, repaired home navigation and the optional five-minute demo. **Full Figma visual alignment remains open in [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).** No performance/antivirus or real 1-GB network stress evidence is claimed.

Source: [US01 — Upload (avec compte)](https://github.com/jlbokass/datashare/issues/4), [DESIGN-02 UML](data-model.md), [DESIGN-03 OpenAPI](api/README.md), and [Figma handoff](design-handoff.md).

## Behavior and boundaries

- An authenticated user uploads **one to five files** via `POST /api/transfers` with `multipart/form-data`, key `files[]`; the valid signed JWT is required. Guests receive **401**.
- The response is **201** with one transfer (UUID), an unpredictable **64-hex-character share token** in a relative `/share/{token}` URL, expiration, and per-file UUID, name, size, server-detected MIME type and upload date.
- **One transfer contains multiple files** behind one token and expiration date; all files are owned by the current authenticated user. Transfer metadata persists in PostgreSQL; bytes persist in the private `transfers` Laravel disk under generated `.bin` filenames, never in the web root.
- Expiry defaults to **seven days**; clients may select **1–7 days**. Files and metadata are deleted by a scheduled daily `transfers:purge-expired` command. A separate Docker `scheduler` service runs Laravel's schedule worker.
- Each file is limited to **1,000,000,000 bytes** (decimal GB). Server validation checks both MIME content and the user-provided extension: PDF, PNG, JPEG, GIF, WEBP, TXT, MP3, MP4, ZIP. Executables and unlisted types are rejected. This is a **basic allowlist**, not antivirus scanning; ZIP archives may contain unsafe content.
- For this local MVP we additionally limit uploads to **five files and 2,000,000,000 bytes combined**. These are documented **operational design limits**, *not* additional OpenClassrooms requirements. Nginx and PHP upload caps are configured above the aggregate limit to allow multipart overhead.
- Uploaded bytes are cleaned up after a partially failed database/file operation. Server-side authorization and validation take precedence over the client UI.

**Folders and ZIP — interim decision:** direct folder-tree uploading is **not** supported in the MVP. To transmit a folder, the sender can first package it as **one ZIP file**. ZIP data is stored as **opaque bytes**: the server never unpacks, previews or executes it. ZIPs can contain executables or decompression bombs, and no antivirus/content scanning is implemented yet; review this before delivering public download in US02. Native file pickers gray out `.exe` because of the `accept` filter, but the browser's file filter is only UX: dragged files and all server requests are still validated.

**Five-minute LOCAL demo (outside the OC contract):** set `TRANSFER_DEMO_5_MIN_ENABLED=true` in the existing ignored `backend/.env` (local environment only). Run `docker compose exec -T app php artisan config:clear` then `docker compose restart app scheduler`. Confirm `curl -fsS http://127.0.0.1:8080/api/demo/capabilities` returns `five_minute_expiry: true` and `docker compose exec -T app php artisan schedule:list` shows purge every minute. Angular then offers **“Démo locale — 5 minutes”**. Laravel rejects this duration when the flag is off or the server isn't local/testing. After five minutes, the scheduler should physically purge the expired transfer on its next minute tick if running. Revert the flag to false after the demonstration and clear/restart again.

**Not implemented yet:** the public retrieval endpoint and its file download (US02); personal history (US05); individual deletion (US06); optional password protection (US09) or tags (US08). The `/share/{token}` frontend route is an honest **pending US02 placeholder**, not a working download link. The Figma password field is deliberately omitted from this first upload form.

## Local verification on your Mac

From the repository root, after checking out the US01 feature branch:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan migrate:status
docker compose exec -T app php artisan schedule:list
docker compose exec -T app php artisan transfers:purge-expired

docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
```

Verify the new `scheduler` service is running and `transfers:purge-expired` is listed for daily execution. **Do not run `migrate:fresh`**, `docker compose down -v`, or share credentials.

For the browser flow, **log in first at http://127.0.0.1:8080/login**, then click the DataShare logo **without refreshing the page**, since the US04 JWT is deliberately memory-only. On the home page:

1. Upload a small PDF or PNG, obtain a generated share URL, and copy it.
2. Upload **two files** in one transfer, select an expiry of **1 day**, verify both names, then click the **DataShare brand** from the result to start a fresh transfer without losing authentication.
3. **Drag and drop** an executable `.exe` or `.php` (the OS picker may gray it out), no file, more than five files, and a file larger than 1 GB if practical. Expect clear errors and no upload.
4. If demo mode is enabled, upload with **five-minute expiry** and confirm the expiry timestamp and subsequent purge, without claiming public download is working. Check the home screen at 393px and 1440px, plus intermediate widths. **The developer reported visual mismatches; a dedicated Figma compliance review remains open.**
5. Confirm the link opens a US02-pending page, **not** a working download. Actual download and 404/410 behavior are acceptance tests for US02.

Store one small test upload in PostgreSQL. File bytes are under `backend/storage/app/private/transfers` and **must not be staged in Git**. Tests use `Storage::fake('transfers')` and SQLite in memory, so the live PostgreSQL migration and end-to-end browser flow must be checked separately.

## Review criteria

- [ ] API rejects unauthenticated uploads and forbidden file types; validates exact size, batch count and expiry.
- [ ] PostgreSQL metadata and private file bytes are present; share token is unpredictable.
- [ ] Scheduled daily purge and explicit purge command remove expired bytes **and** metadata, without touching active transfers.
- [ ] Laravel tests, Angular tests/build, Docker and browser flow all reported green by the developer.
- [ ] Handoff visual gaps are recorded; source and AI journal maintained in English and French.
- [ ] Review Draft PR before merging to `develop`.

Official background: [Laravel 13 file storage](https://laravel.com/framework/docs/13.x/filesystem), [validation](https://laravel.com/framework/docs/13.x/validation), [scheduling](https://laravel.com/framework/docs/13.x/scheduling).
