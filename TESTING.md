# DataShare — Testing plan and evidence (OC P3)

[Français](TESTING.fr.md) · [Technical documentation](docs/technical-documentation.md)

**Status: evolving plan updated 21 November 2026.** This file distinguishes **developer-reported local success** from captured evidence and future tests. This QL-02 update is documentation only: no tests were executed.

## Scope, checks and current evidence

| Scope | Expected acceptance | Current record |
| --- | --- | --- |
| US03 registration | Valid/unique email; minimum 8-character password; salted hash; duplicate and invalid rejected | Developer reported backend/frontend tests and browser cases green; French duplicate error corrected; no archived test report |
| US04 login | Correct credentials give signed JWT; wrong credentials/absent token 401; protected profile | Developer reported tests/build and browser login/logout/401 green; no token/session screenshots |
| US01 upload | JWT required; 1–5 files, 1 GB each, 2 GB aggregate operational cap; private storage; one share token; 1–7 day expiry | Developer reported Docker, PostgreSQL migration, PHPUnit, Angular tests/build, PDF and multifile upload, one-day expiry green |
| US01 local demonstration | Opt-in 5-minute expiry only in local mode, home reset and minute scheduler | Developer reported corrected home navigation, new tests and five-minute demo green; minute-level physical deletion has not been independently documented |
| US02 | Public download and expiry handling | See [US02 evidence](docs/us02-public-sharing.md) |
| US05 | Owner history, JWT, multiple files and expiry | [Developer-reported local T01–T04 and multifile PASS; GitHub CI backend 39 tests/255 assertions + Pint and frontend 34 tests + build PASS; earlier Codex sandbox restrictions retained separately](docs/us05-personal-history.md) |
| US06 | Individual deletion, ownership, storage failures and purge coordination | [Developer-reported T01–T05 and `qa.sh all` PASS on Mac; 13 new Laravel deletion tests; PR #46 CI backend 52 tests/364 assertions and Pint PASS, frontend 44 tests and build PASS; real PostgreSQL contention deferred to quality phase](docs/us06-file-deletion.md) |
| UI-01 | Compare actual home/upload and confirmation frames with Figma at 393px, 1440px and intermediate widths | **Open visual nonconformity**: [issue #37](https://github.com/jlbokass/datashare/issues/37) |

**Limits:** PHPUnit uses SQLite in-memory and fake private storage for many feature tests; local PostgreSQL migration and actual browser upload were separately reported successful. No actual 1-GB network load or complete three-scenario QL-02 acceptance has been recorded; partial local E2E results are distinguished below. QL-01 CI evidence and temporary downloadable artifacts are linked below.

## QL-02 plan — three business scenarios

### Strategy and sources

Scope covers the critical US01–US06 MVP journeys, based on the [repository transcription of the OC P3 brief](README.md#mvp-scope), the [API contract](docs/api/openapi.yaml) and [issue #51](https://github.com/jlbokass/datashare/issues/51), consulted on 21 November 2026. The original OC brief is unavailable in the inspected workspace: exact conformity still needs comparison with the original, without inventing additional requirements.

- **Unit/component tests:** PHPUnit and Vitest/Angular TestBed check focused behavior; Angular HTTP test doubles are allowed at this level, not in E2E tests.
- **Integration tests:** Laravel Feature tests check routes, JWT, validation, ownership and storage. Their in-memory SQLite and `Storage::fake` do not prove PostgreSQL behavior or actual transferred bytes.
- **E2E tests:** Playwright 1.63.0, real Chromium, one worker, no retries, standard `list` reporter. Real Angular → Nginx → Laravel → PostgreSQL and private storage; no API mocking/interception or arbitrary sleeps. Network waits precede actions; selectors use accessible roles/labels. QL-01, PHPUnit, Vitest, Pint and builds remain complementary.

`compose.test.yaml` defines the `datashare-ql02-test` project, a dedicated network and no published host ports. PostgreSQL uses tmpfs; Laravel sources are read-only, with private storage and bootstrap cache on tmpfs separate from development data. Frontend/Playwright dependencies use separate, test-project npm volumes. The browser targets `http://web`; the runner uses the `e2e` profile. Never run mutating E2E tests against `compose.yaml`. This isolation protects development data; it does not yet provide a fresh stack per scenario/run.

Shared preconditions: ready services, migrations applied only to the isolated database, locked dependencies and matching Playwright package/image versions. Each journey uses a unique account and small synthetic files only; setup through the real API is allowed and must be distinguished from the UI actions under test. JWT stays in Angular memory; a new context is anonymous. Evidence must contain no passwords, JWTs, HTTP bodies, authorization headers or private files; screenshots, videos and traces are disabled. Reports/results are gitignored.

### Traceability matrix

The following three rows are the **three business scenarios**, regardless of file or subtest count. The smoke test is a technical check outside this matrix.

| Scenario / US | Preconditions | Main actions | Expected results | Acceptance criteria | Actual status on 21 November 2026 |
| --- | --- | --- | --- | --- | --- |
| **E2E-01 — US03/04: registration, login and account protection** | Unique synthetic account; separate owner and anonymous contexts; ready infrastructure | Register through UI, sign in through UI, access `/account`; attempt anonymous access; log out and retry protected access | Registration 201 and confirmation; login/me 200; “Mon espace” heading and email; anonymous account access redirects to `/login`, protected API without JWT returns 401; logout clears local session | Validate 01a, 01b, 01c and continuous registration → login; SPA transition without reload after login; protected access refused after logout in the same context | **Partial**: developer reports 01a and 01b passing locally; 01c absent; continuous journey unproven; no referenced QL-02 CI evidence |
| **E2E-02 — US01/02: authenticated upload and public download** | Signed-in user; small synthetic TXT with known bytes; new context without session | Upload through UI, obtain the unique link, open it anonymously, verify metadata and download | Upload 201; share accessible without JWT; consistent metadata; completed download | Check the actual received filename and bytes, not merely link visibility; no real document or recipient authentication | **Planned**: no corresponding test in this branch; no local or CI evidence for this QL-02 journey |
| **E2E-03 — US05/06: history, deletion and revocation** | Signed-in owner; transfer with two synthetic files; share open in an anonymous context | Check history; cancel deletion; confirm first-file deletion; check remaining file; delete last file | Cancellation sends no DELETE and changes nothing; deletions return 204; first file removed; second still downloadable through the same share; empty transfer removed; old share returns 404 and UI error | Check both history files, no mutation on cancellation, remaining file bytes and final revocation; one business journey | **Planned**: no corresponding test; cancellation retained in this plan although the issue requests it “if possible”; no local or CI QL-02 evidence |

### E2E-01 status before 01c and available evidence

- **Smoke** (`e2e/smoke.spec.ts`, commit `2ac0379`): Angular home displayed; developer-reported local PASS. Counts neither as a business scenario nor as authentication evidence.
- **E2E-01a** (`e2e/registration.spec.ts`, `459344e`): UI registration, POST 201 and visible confirmation; developer-reported local PASS.
- **E2E-01b** (`e2e/login.spec.ts`, `6d5c25b`): setup through `APIRequestContext`, UI login, POST login/GET me 200, displayed identity and preserved SPA document; developer-reported local PASS. The test neither reads nor persists the JWT.
- **E2E-01c — plan only**: verify `/account` without a session → `/login` and `/api/auth/me` without JWT → 401; after login, log out through UI and retry protected navigation in the same context/document. An independent anonymous context complements this check. Distinguish clearing the Angular session from server-side JWT revocation, which US04 does not implement.
- **Continuous journey still to confirm**: 01a and 01b create separate users; 01b creates its user through the API. Their separate success does not prove UI registration → UI login for the same user.

These local validations are developer reports, not executions performed during this review or GitHub Actions evidence. SHAs identify code, not execution results. Earlier Codex Docker attempts were blocked by socket permissions; they are not Chromium successes. The three currently selected files represent one smoke and two E2E-01 fragments, **not E2E-01 through E2E-03**.

Existing command to use after preparing the isolated stack (not executed for this update):

```bash
docker compose -f compose.test.yaml --profile e2e run --no-deps playwright \
  sh -ec 'npm ci --no-audit --no-fund && npm test'
```

### QL-02 exit criteria and open gaps

- [ ] All **three complete business scenarios** in the matrix pass locally against the isolated stack; E2E-01 includes 01c and UI continuity. Discovery alone is not browser execution.
- [ ] The same journeys pass in ephemeral CI, in a separate E2E workflow for PRs targeting `develop`/`main` and pushes, with non-destructive migrations, readiness checks, bounded timeout and one worker. A green PR run is linked as evidence. **Only backend/frontend workflows currently exist.**
- [ ] No regressions, verified through Laravel/Pint/Angular/build (`bash scripts/qa.sh all`) and existing CI. Preserve QL-01 measurements without artificial exclusions; the 52 Laravel/44 Angular counts and QL-01 percentages are historical references, not freshly executed results on this branch.
- [ ] Record each scenario's date, SHA, command, environment/Chromium version, test count, PASS/FAIL/SKIPPED, limitations and sanitized report; for CI, include the run/job URL and short-retention artifact. Regenerate expired evidence. Reports must contain no secrets or user files.
- [ ] Reconcile issue #51 with the minimal branch: its 19 November addendum describes an older `scripts/e2e.sh`, image fingerprints, per-scenario discovery, automatic diagnostics and a separate stack per scenario. These mechanisms are absent from `quality/ql-02-clean`; treat them as gaps requiring review, not fulfilled requirements. The current reporter alone does not supply the requested sanitized/archived report. Raw traces remain excluded despite their mention in the issue's initial wording.
- [ ] Update FR/EN traceability and the AI journal with future actual evidence before closure; this documentation review does not modify the journal or issue.

**Outside QL-02 scope:** load and maximum-size transfers, security/dependency audits, PostgreSQL concurrency, Figma/UI-01 visual tests, multi-browser/mobile, additional badges, US07–US10 and optional scenarios. Functional JWT/ownership checks remain in scope; they are not a security audit. Expiration/purge remains a functional requirement, but no five-minute E2E wait or fourth expiration scenario is added.

## How to run locally outside E2E

The following commands cover existing development checks; mutating E2E tests use only `compose.test.yaml` as described above.

From repository root after installing dependencies and configuring the ignored `.env` files:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
docker compose run --rm php sh -lc 'cd backend && php artisan test'
docker compose run --rm node sh -lc 'cd frontend && npm run build && npm test -- --watch=false'
```

Manual acceptance scripts are versioned in [US03](docs/us03-registration.md), [US04](docs/us04-jwt-login.md) and [US01](docs/us01-upload.md). Do not commit real credentials, JWTs, files uploaded by others or terminal screenshots displaying secrets.

## Required remaining evidence before OC delivery

- [ ] **QL-02: exactly three Playwright/Chromium business scenarios**, as defined in the matrix above, passing locally and in CI. Smoke and partial 01a/01b validation do not close this work package.
- [x] QL-01 [measured coverage and limitations](docs/coverage.md): **GitHub Actions Laravel/PCOV 96.36% of lines (318/330), 52 tests/364 assertions/Pint; Angular/V8 79.58% of lines, 44 tests and production build**. [Backend CI run/artifact](https://github.com/jlbokass/datashare/actions/runs/44536846489), [frontend CI run/artifact](https://github.com/jlbokass/datashare/actions/runs/44536846492), expiring 3 December 2026. **70% was indicative, not imposed as a CI threshold**; no third-party coverage badge.
- [x] GitHub Actions backend (PHPUnit/Pint) and frontend (Angular tests/build) workflows are integrated into `develop` and `main`. Tests and build are verified green on [QL-01 PR #50](https://github.com/jlbokass/datashare/pull/50); see the [CI guide](docs/ci.md).
- [ ] Real-size upload behavior, multipart 413 handling, scheduler purge and corrupted/unsafe file cases.
- [ ] Accessibility, desktop/mobile visual review and external user feedback when available.

**Evidence policy:** report date, Git SHA, command, test count, pass/fail, coverage/output location; never convert a planned test into a green badge.
