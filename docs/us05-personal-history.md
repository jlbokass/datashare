# US05 — Personal upload history

[Français](us05-personal-history.fr.md) · [Issue #8](https://github.com/jlbokass/datashare/issues/8)

Implemented on `feat/us05-personal-history` in [PR #45](https://github.com/jlbokass/datashare/pull/45). **Developer reports functional T01–T04 and multifile acceptance complete; both GitHub CI workflows are green.** PR review/merge into `develop` remains pending.

## API and security

`GET /api/transfers` requires the existing login JWT. The response follows
[OpenAPI](api/openapi.yaml): `{ "transfers": [...] }`. The verified user's internal
ID scopes the database query; client-supplied owner parameters cannot select another
account. Files are eagerly loaded and `TransferPresenter` returns only contracted
metadata: transfer ID, relative share URL, creation/expiry dates, derived status,
and each file's ID, name, size, MIME type and upload date. Storage paths, owner IDs,
password hashes and other model attributes are not serialized. The owner's share
URL is intentionally included by the contract; treat it as a capability.

- By default, and with `include_expired=false`, return only active transfers.
- `include_expired=true` also returns expired records still present before purge.
- A transfer is expired at `expires_at <= now`. Filtering and presentation use
  the same instant. No status column or schema change is needed.
- Purged records do not reappear. GET does not purge, delete or modify files.
- Results are newest first (creation time, then ID); there is no pagination or
  user-selectable sorting in this MVP.
- Responses use `Cache-Control: private, no-store, max-age=0`.
- Missing/invalid JWTs return `401` with `code=unauthenticated`.

## Account page

After session verification, `/account` loads history with the in-memory bearer
header. Each transfer groups all its files with filename, decimal size, upload
date, shared expiry date and the API's valid/expired link status. Dates use the
browser's local timezone. Valid links lead to the existing public share page;
expired links have no active share anchor.

The page provides loading, empty and safe error messages, retry, and an unchecked
“Include expired transfers” checkbox. Already purged records are explained.
A history `401` clears the session and returns to login; server/network errors
allow retry without logging out. Leaving the page or logging out cancels pending
requests. JWT persistence, deletion (US06) and Figma parity (UI-01) are unchanged.
Status is a snapshot at load time; toggling the switch or revisiting reloads it.
The public download API remains authoritative for expiry.

## Verification — 19 November 2026

**Developer acceptance update:** `bash scripts/qa.sh all` was run successfully on the developer's Mac outside the Codex sandbox. Browser/manual verification confirmed T01 owner history, T02 cross-account isolation, T03 empty history, T04 **HTTP 401 Unauthorized without JWT**, and multifile display. Full terminal logs and raw browser responses have not been archived in the repository. Automated tests also cover expired, unpurged and purged records.

**GitHub Actions CI evidence for PR #45:** [backend](https://github.com/jlbokass/datashare/actions/runs/44423778354) **39 tests, 255 assertions and Pint passed**; [frontend](https://github.com/jlbokass/datashare/actions/runs/44423778417) **34 Angular tests and production build passed**. These later checks do not invalidate the earlier agent sandbox restrictions recorded below.

### Earlier Codex sandbox execution record

- Backend test-first cycle: six new tests failed with `405` before the route,
  then passed: `php artisan test --filter=TransferHistoryTest` (6 tests, 38 assertions).
- Local `php artisan test`: **39 passed, 255 assertions**; `php vendor/bin/pint --test`: **PASS**.
- Angular application/template compilation (`ngc -p tsconfig.app.json --noEmit`)
  and test type checking (`tsc -p tsconfig.spec.json --noEmit`): **PASS**.
- Nine account tests added: HTTP/auth headers, loading/empty, multi-file metadata,
  expired switch/status, server/network errors and retry, 401, session failure,
  teardown and logout. Runtime execution **not verified**.
- `bash scripts/qa.sh all`: **4 checks blocked/exit 1**, Docker socket access denied
  by the agent sandbox; no Docker test or build executed.
- Native Angular execution is blocked by Linux dependencies on macOS. A temporary
  copy using the lockfile/cache could not recover all exact native packages; npm
  network resolution was unavailable. Repository dependencies/lockfile were not changed.
- Local environment: PHP 8.5.9 / Node 26.7.0; Docker/CI target PHP 8.4 / Node 24.
  Local checks do not establish PostgreSQL, browser, build or CI acceptance.

Run `bash scripts/qa.sh all` outside the sandbox, then check two accounts in the
browser: one empty account, multiple files owned by each, active/default view,
expired-but-unpurged opt-in, and an expired session. Confirm the required metadata
and that another account's filenames/share links never appear. Do not delete real
data or run a destructive migration to prepare this acceptance check.

**Subsequent acceptance:** local QA and the reported browser scenarios passed; visual and responsive checks remain deferred to [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).
