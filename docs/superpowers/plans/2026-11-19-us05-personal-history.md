# US05 — Personal history implementation plan

> Execution: native implementation in the existing feature branch, following
> superpowers:executing-plans and test-driven-development. No commits or merges.

**Goal:** implement the owner's history on the existing account page.
**Spec:** [issue #8](https://github.com/jlbokass/datashare/issues/8),
[OpenAPI](../../api/openapi.yaml), and the user's US05 instructions.
**Architecture:** JWT middleware resolves the owner; a read service scopes the
query and eagerly loads files; TransferPresenter serializes only contracted fields.
Angular verifies the session, then loads history with the in-memory bearer token.
**Stack:** Laravel 13, Angular 22, PostgreSQL; SQLite for backend tests.

## Constraints and choices

- No US06 deletion, UI-01 redesign, dependencies, secrets, or database changes.
- Reuse the presenter instead of duplicating serialization; use a read service
  instead of placing ownership/expiry logic in the controller or view.
- Default to active records; a labelled checkbox opts into unpurged expired ones.
- Newest uploads first is a display default, not a new filtering contract.
- Expiration starts at `expires_at <= now`; use the same instant for filtering
  and presentation. No stored status and no private paths in responses.
- Keep the existing account style; separate its template/styles for readability.

## Review focus

Ownership even with forged query parameters; expiry equality; multiple files and
exact response keys; network/401 failures; cancellation on page destruction/logout.

## Task 1 — Backend

- [x] Add `backend/tests/Feature/TransferHistoryTest.php`: missing/invalid JWT,
  empty list, owner isolation with both expiry modes, exact metadata for multiple
  files, default/false expiry exclusion, expiry boundary and purged records.
- [x] Run `php artisan test --filter=TransferHistoryTest`; expect failures before implementation.
- [x] Add `ListTransfersController`, `TransferHistory::forUser(User, bool): array`,
  and GET `/transfers` protected by `AuthenticateJwt`. Reuse
  `TransferPresenter::toArray(Transfer, ?CarbonInterface): array` with a shared instant.
- [x] Rerun targeted tests; expect PASS.

## Task 2 — Account page

- [x] Add `account.spec.ts` using real AuthService and HTTP testing: bearer header,
  loading, empty, multiple files/statuses, toggle, retry, 401 and teardown.
- [ ] Run `npm test -- --watch=false --include='**/account.spec.ts'`; expect failures.
- [x] Replace placeholder in `account.ts`, extract `account.html`/`account.scss`;
  request `{ transfers: [...] }`, render metadata and accessible states.
- [ ] Rerun account tests; expect PASS.

## Task 3 — Documentation and verification

- [x] Add EN/FR US05 guides, update both documentation indexes and AI journals.
- [x] Run `bash scripts/qa.sh all`, inspect all results. If Docker is sandbox-blocked,
  record it and run local PHP/Pint and Angular tests/build without claiming Docker passed.
- [x] Inspect registered routes, diff and security boundaries; report remaining limits.

## Execution record

- Backend: six tests RED (405) → GREEN (38 assertions). Full suite 39/39,
  255 assertions; Pint PASS. No existing test was changed.
- Frontend: nine tests written; app/template and test type compilation PASS.
  Runtime RED/GREEN could not be verified: Docker socket denied, native dependency
  platform mismatch, then missing exact packages offline and npm DNS unavailable.
  The two runtime verification steps remain unchecked intentionally.
- QA all: attempted, four Docker checks blocked (exit 1). No Docker/CI/browser pass claimed.
- Read-only independent code review: no blocking findings. Inherited /auth/me
  network/server errors still log out; left unchanged as outside this feature.
- User's explicit no-commit instruction overrides skill commit steps. Work stayed
  on the requested clean feature branch; no dependencies, secrets or schema changed.
