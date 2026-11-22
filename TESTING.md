# DataShare — Testing plan and evidence (OC P3)

[Français](TESTING.fr.md) · [Technical documentation](docs/technical-documentation.md)

**Status: evolving plan updated 22 November 2026.** This file distinguishes **developer-reported local success** from captured evidence and future tests. This documentation revision does not constitute a new test execution.

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

**Proportionality rule:** verify business acceptance at the least costly level that provides sufficient confidence; do not add E2E scenarios, investigations or infrastructure beyond the documented need.

Scope covers the critical US01–US06 MVP journeys, based on the [repository transcription of the OC P3 brief](README.md#mvp-scope), the [API contract](docs/api/openapi.yaml) and [issue #51](https://github.com/jlbokass/datashare/issues/51), consulted on 21 November 2026. The original OC P3 brief is not versioned in the repository inspected by Codex, but was provided to the assistant for review. Its absence from the repository does not constitute a nonconformity of the plan.

- **Unit/component tests:** PHPUnit and Vitest/Angular TestBed check focused behavior; Angular HTTP test doubles are allowed at this level, not in E2E tests.
- **Integration tests:** Laravel Feature tests check routes, JWT, validation, ownership and storage. Their in-memory SQLite and `Storage::fake` do not prove PostgreSQL behavior or actual transferred bytes.
- **E2E tests:** Playwright 1.63.0, real Chromium, one worker, no retries, standard `list` reporter. Real Angular → Nginx → Laravel → PostgreSQL and private storage; no API mocking/interception or arbitrary sleeps. Network waits precede actions; selectors use accessible roles/labels. QL-01, PHPUnit, Vitest, Pint and builds remain complementary.

`compose.test.yaml` defines the `datashare-ql02-test` project, a dedicated network and no published host ports. PostgreSQL uses tmpfs; Laravel sources are read-only, with private storage and bootstrap cache on tmpfs separate from development data. Frontend/Playwright dependencies use separate, test-project npm volumes. The browser targets `http://web`; the runner uses the `e2e` profile. Never run mutating E2E tests against `compose.yaml`. This isolation protects development data; a separate stack per scenario is not required in the `quality/ql-02-clean` reconstruction.

Shared preconditions: ready services, migrations applied only to the isolated database, locked dependencies and matching Playwright package/image versions. Each journey uses a unique account and small synthetic files only; setup through the real API is allowed and must be distinguished from the UI actions under test. JWT stays in Angular memory; a new context is anonymous. Evidence must contain no passwords, JWTs, HTTP bodies, authorization headers or private files; screenshots, videos and traces are disabled. Reports/results are gitignored.

### Traceability matrix

The following three rows are the **three business scenarios**, regardless of file or subtest count. The smoke test is a technical check outside this matrix.

| Scenario / US | Preconditions | Main actions | Expected results | Acceptance criteria | Actual status on 22 November 2026 |
| --- | --- | --- | --- | --- | --- |
| **E2E-01 — US03/04: registration, login and account protection** | Independent synthetic accounts; separate anonymous context; ready infrastructure | Register through UI and verify confirmation; sign in through UI and verify account identity; reject anonymous access; log out | Registration 201; login/me 200; “Mon espace” and expected email; guest redirected to `/login`, protected APIs without JWT return 401; local logout effective | 01a, 01b and 01c run as independent tests; no single registration → login SPA transition is required | **Developer-reported local PASS (22 November 2026)** for 01a, 01b and 01c; **E2E CI PASS (PR #52)** |
| **E2E-02 — US01/02: authenticated upload and public download** | Signed-in user; synthetic TXT with known bytes; new anonymous browser context | Upload via UI, obtain public link, open anonymously, verify metadata and download | Upload 201; share available without JWT; consistent metadata; completed download | Check actual received filename and bytes; no real files or recipient login | **Developer-reported local PASS (22 November 2026)** for `upload-download.spec.ts`; **E2E CI PASS (PR #52)** |
| **E2E-03 — US05/06: history, deletion and revocation** | Signed-in owner; two synthetic files; anonymous share page | Confirm first-file deletion, verify second file, delete last file | DELETE 204; first file gone, second remains downloadable with same link; empty transfer removed; old share responds 404 and UI shows error | Check history, actual remaining file bytes and final revocation; optional cancellation is not required | **Developer-reported local PASS (22 November 2026)** for `history-deletion.spec.ts`; **E2E CI PASS (PR #52)** |

**QL-02 GitHub Actions evidence (22 November 2026):** [PR #52](https://github.com/jlbokass/datashare/pull/52), [E2E CI run](https://github.com/jlbokass/datashare/actions/runs/45075924438) at commit `8231134`: **6 PASS / 0 FAIL**, Chromium / Playwright 1.63.0, one worker, 7.3 s. [Backend CI](https://github.com/jlbokass/datashare/actions/runs/45075924441) and [Frontend CI](https://github.com/jlbokass/datashare/actions/runs/45075924444) both **PASS**. The `e2e-summary-8231134fde834ca853067a24226b5398b78ae8ad` artifact keeps a sanitized seven-day summary; individual test names/results are in the run logs. This CI result was independently checked, unlike developer-reported local execution.

### E2E-01 status and available evidence

- **Smoke** (`e2e/smoke.spec.ts`, commit `2ac0379`): Angular home displayed; developer-reported local PASS. Counts neither as a business scenario nor as authentication evidence.
- **E2E-01a** (`e2e/registration.spec.ts`, `459344e`): UI registration, POST 201 and visible confirmation; developer-reported local PASS.
- **E2E-01b** (`e2e/login.spec.ts`, `6d5c25b`): setup through `APIRequestContext`, UI login, POST login/GET me 200, displayed identity and preserved SPA document; developer-reported local PASS. The test neither reads nor persists the JWT.
- **E2E-01c** (`e2e/session.spec.ts`, commit `eec7a4a`): anonymous `/account` access redirects to `/login`; `/api/auth/me` and `/api/transfers` without JWT return 401; UI logout and browser-back access remain protected without a hard reload. Developer-reported local PASS; no QL-02 CI evidence.
- **Continuous registration → login journey: non-blocking**. Registration and login have independent automated coverage and the developer separately checked the full journey manually. An additional SPA-transition test was attempted and removed due to disproportionate maintenance cost. It is neither an extra OC requirement nor evidence of an application defect.

These local validations are developer reports, not executions performed during this review or GitHub Actions evidence. SHAs identify code, not execution results. Earlier Codex Docker attempts were blocked by socket permissions; they are not Chromium successes. The six current test files cover technical smoke and all three business scenarios (E2E-01 through E2E-03). **Full local suite on 22 November 2026: 6/6 PASS, 0 failed**, developer-reported on `quality/ql-02-clean`; no terminal output or CI result is archived here. The exact local checkout SHA was not independently confirmed.

Existing command to use after preparing the isolated stack (not executed for this update):

```bash
docker compose -f compose.test.yaml --profile e2e run --no-deps playwright \
  sh -ec 'npm ci --no-audit --no-fund && npm test'
```

### QL-02 exit criteria and open gaps

- [x] **Six local Playwright checks passed**, covering smoke and the three business scenarios (E2E-01 through independent checks 01a/01b/01c). Developer-reported on 22 November 2026; raw test output is not archived.
- [x] **Ephemeral E2E CI PASS on PR #52**: [6/6 Chromium tests](https://github.com/jlbokass/datashare/actions/runs/45075924438), migrations against isolated PostgreSQL, readiness checks, one worker, bounded timeout and sanitized seven-day summary artifact; no screenshots or traces.
- [x] **No regressions according to existing CI** on PR #52: [Backend (PHPUnit/Pint)](https://github.com/jlbokass/datashare/actions/runs/45075924441) and [Frontend (Angular tests/build)](https://github.com/jlbokass/datashare/actions/runs/45075924444) PASS. No separate local `qa.sh all` run was performed just for documentation; QL-01 measurements remain unchanged.
- [x] **Evidence:** date, SHA, command, environment and results in the [GitHub Actions E2E run](https://github.com/jlbokass/datashare/actions/runs/45075924438) and its sanitized summary artifact; per-test details are in job logs, without secrets or real user files.
- **Issue #51 history:** the old runner described in the 19 November addendum (`scripts/e2e.sh`, image fingerprints, per-scenario discovery, automatic diagnostics and a separate stack per scenario) was abandoned when rebuilding `quality/ql-02-clean`. Reimplementing it is not an exit criterion. Data isolation, sanitized and archived execution evidence, the three business journeys and their success in CI remain required. Raw traces remain excluded despite their mention in the issue's initial wording.
- [x] **CI traceability documented** in FR/EN, the AI journal and [issue #51](https://github.com/jlbokass/datashare/issues/51), clearly distinguishing local reports from independently verified GitHub Actions.

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

- [x] **QL-02: three Playwright/Chromium business scenarios**; six tests reported passing locally (22 November 2026), **six tests passing in CI on [PR #52](https://github.com/jlbokass/datashare/pull/52)**. Merge remains subject to human review.
- [x] QL-01 [measured coverage and limitations](docs/coverage.md): **GitHub Actions Laravel/PCOV 96.36% of lines (318/330), 52 tests/364 assertions/Pint; Angular/V8 79.58% of lines, 44 tests and production build**. [Backend CI run/artifact](https://github.com/jlbokass/datashare/actions/runs/44536846489), [frontend CI run/artifact](https://github.com/jlbokass/datashare/actions/runs/44536846492), expiring 3 December 2026. **70% was indicative, not imposed as a CI threshold**; no third-party coverage badge.
- [x] GitHub Actions backend (PHPUnit/Pint) and frontend (Angular tests/build) workflows are integrated into `develop` and `main`. Tests and build are verified green on [QL-01 PR #50](https://github.com/jlbokass/datashare/pull/50); see the [CI guide](docs/ci.md).
- [ ] Real-size upload behavior, multipart 413 handling, scheduler purge and corrupted/unsafe file cases.
- [ ] Accessibility, desktop/mobile visual review and external user feedback when available.

**Evidence policy:** report date, Git SHA, command, test count, pass/fail, coverage/output location; never convert a planned test into a green badge.
