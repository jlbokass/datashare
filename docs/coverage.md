# QL-01 — Coverage measurements and limits

[Français](coverage.fr.md) · [Issue #49](https://github.com/jlbokass/datashare/issues/49) · [Testing](en/TESTING.md)

## Final release measurements — 25 November 2026

Reference: [PR #100](https://github.com/jlbokass/datashare/pull/100), commit [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80) on `main`. Results verified in the logs of all three release workflows.

| Check | Result | Line coverage | Evidence |
| --- | --- | --- | --- |
| Laravel / PHPUnit + Pint | 83 tests passed, 576 assertions; Pint passed | **79.72%** (456/572) | [Backend CI](https://github.com/jlbokass/datashare/actions/runs/45548826977) · [Report](https://github.com/jlbokass/datashare/actions/runs/45548826977/artifacts/14992641842) |
| Angular / Vitest + build | 65 tests passed (8 files); build passed | **88.00%** | [Frontend CI](https://github.com/jlbokass/datashare/actions/runs/45548827002) · [Report](https://github.com/jlbokass/datashare/actions/runs/45548827002/artifacts/14993031980) |
| Playwright / Chromium | 6 tests passed (8.0 s) | Not applicable | [E2E CI](https://github.com/jlbokass/datashare/actions/runs/45548827035) · [Summary](https://github.com/jlbokass/datashare/actions/runs/45548827035/artifacts/14992712719) |

The indicative 70% target is met separately for both applications. Coverage artifacts expire on **9 December 2026** and the E2E summary on **2 December 2026**. Download these reports and include release-specific screenshots in the assessment submission; screenshots are not versioned here.

Angular V8: 87.15% statements, 78.87% branches, 89.07% functions. Laravel PCOV measures 572 executable lines, compared with 330 on 24 November. The expanded measured codebase must be considered when interpreting the lower percentage. No combined coverage is calculated.

## Historical measurements — 19 November 2026

Measured at **03:47 UTC**, base commit
`0f5e6990357e4c268e2af2df02ab4812e91a34e7` plus uncommitted QL-01 configuration.
Application code and existing tests are unchanged. No combined backend/frontend
percentage is calculated. **70% remains an indicative target, not a CI threshold.**

| Stack / environment | Actual line coverage | Test result | Evidence |
| --- | --- | --- | --- |
| Laravel, macOS PHP 8.4.19 / Xdebug 3.5.0 | **96.36% — 318/330 executable lines** | **52 passed, 364 assertions**, exit 0 | Local `backend/coverage/clover.xml`, `html/index.html`, `summary.txt` |
| Laravel, GitHub Actions / PCOV | **96.36% — 318/330 lines** | **52 tests/364 assertions and Pint passed** | [backend run #44536846489](https://github.com/jlbokass/datashare/actions/runs/44536846489) · [artifact](https://github.com/jlbokass/datashare/actions/runs/44536846489/artifacts/14535857372) |
| Angular, developer Mac / Docker / V8 | **79.58% lines** | **44 tests passed (7 files)**, `qa.sh all` developer-reported passed | Terminal screenshots supplied by developer, not committed |
| Angular, GitHub Actions / V8 | **79.58% lines** | **44 tests and production build passed** | [frontend run #44536846492](https://github.com/jlbokass/datashare/actions/runs/44536846492) · [artifact](https://github.com/jlbokass/datashare/actions/runs/44536846492/artifacts/14537150369) |

The local backend report covers **all 20 PHP files under `backend/app/`**.
Methods: 87.10% (27/31); classes: 78.95% (15/19). These are different metrics, not
additional line coverage. Empty/non-executable units do not add executable lines.
Xdebug was already installed locally, so no system extension/configuration was
changed. CI explicitly selects PCOV; its result must be recorded separately and
must not be inferred from this Xdebug measurement.

## Historical release measurements — 24 November 2026

Commit [97abebd](https://github.com/jlbokass/datashare/commit/97abebd7fc704821e0f8c5bbcedf7f7e0b58590b) on `main` was checked by all three workflows. Laravel remains at **96.36%** (318/330 lines; 52 tests, 364 assertions), and Angular reaches **85.97%** line coverage (52 tests, 7 files; 86.52% statements, 80.23% branches, 87.2% functions). All 6 E2E tests passed in 7.7 s.

Evidence: [Backend CI](https://github.com/jlbokass/datashare/actions/runs/45302509975) · [Frontend CI](https://github.com/jlbokass/datashare/actions/runs/45302510070) · [E2E CI](https://github.com/jlbokass/datashare/actions/runs/45302509992). Coverage artifacts for this run expire on 8 December 2026. Screenshots were reported prepared for the assessment submission. The 19 November measurements above remain historical.

## Reproduction and report locations

Backend, from `backend/`, with PCOV enabled (CI), or Xdebug in coverage mode:

```bash
php artisan test --coverage-clover=coverage/clover.xml --coverage-html=coverage/html --coverage-text=coverage/summary.txt
cat coverage/summary.txt
```

Exact local measurement command:

```bash
PAO_DISABLE=1 XDEBUG_MODE=coverage /opt/homebrew/opt/php@8.4/bin/php artisan test --coverage-clover=coverage/clover.xml --coverage-html=coverage/html --coverage-text=coverage/summary.txt
```

Frontend, from `frontend/`, after a successful `npm ci`:

```bash
npm run test:coverage
```

This runs `ng test --watch=false --coverage`. Vitest is locked at **5.1.1**, with
`@vitest/coverage-v8` pinned to **5.1.1**. npm generated the lockfile additions;
no existing dependency version was changed. Angular writes HTML (`index.html`),
LCOV (`lcov.info`), and JSON totals (`coverage-summary.json`) under
`frontend/coverage/datashare/`, with per-file percentages in the terminal.

Both workflows keep their names/triggers, existing tests, Pint and production build.
They upload only their coverage directory using `actions/upload-artifact`, including
`run.txt` (commit SHA, UTC, command, driver, scope), with **14-day retention**.
Uploads are attempted even on job failure; a missing report is an error, not a
passing coverage result. Download the artifact from the run's **Artifacts** section.
**Both QL-01 CI workflows passed**, and the linked coverage artifacts have been uploaded. The pull-request test merge commit `63b439241dd778594744dd44feff7cf073efe688` appears in artifact names, distinct from feature branch head `b9e8be873640e8d6d57f8d7a8005c8ab1309e958`. Artifacts expire on **3 December 2026**.
Reports are already ignored by `**/coverage/`; no generated report is versioned.

## Measurement scope

- PHP: `backend/app/**/*.php`, explicitly including uncovered files. Dependencies,
  tests, routes, migrations, configuration and generated views are outside this
  application-source metric. PCOV measures lines, not branch/path coverage.
- Angular: **all `frontend/src/**/*.ts`**, including guards, configuration, bootstrap
  and files with no dedicated tests. Exclusions: `*.spec.ts` and `*.d.ts`, alongside
  the runner's dependency/generated-code exclusions. HTML/CSS are not standalone
  TypeScript coverage units. No application component/service is excluded.
- The first frontend report must be checked against the source inventory, including
  untested `src/main.ts` and guards. Do not narrow the include list to make it pass.
- Tests use synthetic users/files, SQLite in memory and fake private storage.
  Coverage artifacts contain source/line metadata, not uploads, `.env` or credentials.
  Line coverage does not prove PostgreSQL concurrency, browser behavior or security.

## Initial Codex sandbox checks and blockers (historical record)

- Backend coverage command above: **PASS**; Pint and PHPUnit XML schema: **PASS**.
- `bash scripts/qa.sh all`: **4 blocked checks / exit 1**, Docker socket permission
  denied before backend/frontend tests or build start in the agent sandbox.
- `npm run test:coverage`: **exit 1**, provider not installed in the existing
  `node_modules` (lockfile-only update). A full installation in a temporary frontend
  copy failed with `ENOTFOUND registry.npmjs.org` while fetching `zod@4.6.6`.
  Existing dependencies were prepared for Linux, not this macOS host. No Angular
  test count, percentage or build success is claimed for this QL-01 execution.
- The prior functional CI results (52 Laravel tests / 44 Angular tests on PR #46)
  remain historical evidence and are not coverage measurements.

## Subsequent developer acceptance and GitHub Actions evidence

On the developer's Mac, `docker compose run --rm node sh -lc 'cd frontend && npm ci && npm run test:coverage'` **passed** with **44 tests and 79.58% Angular line coverage**. The developer also reports `bash scripts/qa.sh all` green. npm warnings about optional install scripts are not evidence of full security auditing.

Both GitHub Actions jobs for [PR #50](https://github.com/jlbokass/datashare/pull/50) passed and archived coverage reports for **14 days**:

- [Backend CI #44536846489](https://github.com/jlbokass/datashare/actions/runs/44536846489): **PCOV 96.36% lines**, 318/330, 52 tests/364 assertions, Pint passed; [Clover/HTML/text](https://github.com/jlbokass/datashare/actions/runs/44536846489/artifacts/14535857372).
- [Frontend CI #44536846492](https://github.com/jlbokass/datashare/actions/runs/44536846492): **V8 79.58% lines**, 81.08% statements, 77.54% branches, 76.92% functions, **44 tests and production build passed**; [HTML/LCOV/JSON](https://github.com/jlbokass/datashare/actions/runs/44536846492/artifacts/14537150369).

Angular coverage includes `src/main.ts`, `src/app/app.routes.ts` and `src/app/auth/auth.guard.ts`, each at **0% line coverage** in this 19 November measurement. No combined backend/frontend metric is calculated. Earlier sandbox errors above are historical facts, **not the latest acceptance status**.

## Limits and release evidence

The final measurements meet the indicative target. Preserve the artifacts and screenshots of the 25 November release before expiry. Additional tests may be considered in a future maintenance cycle based on risk, not to increase the percentage alone; no further coverage work is planned before the assessment. Earlier measurements and sandbox observations remain historical.

References: [PHPUnit coverage](https://docs.phpunit.de/en/12.5/code-coverage.html),
[Angular coverage](https://angular.dev/guide/testing/code-coverage),
[Vitest source inclusion](https://vitest.dev/config/coverage#coverage-include).
