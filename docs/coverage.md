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

## Historical measurements

| Date (2026) | Laravel: line coverage / tests | Angular: line coverage / tests | E2E | CI evidence |
| --- | --- | --- | --- | --- |
| 19 Nov | 96.36% (318/330), 52 tests, 364 assertions | 79.58%, 44 tests | — | [Backend](https://github.com/jlbokass/datashare/actions/runs/44536846489) · [Frontend](https://github.com/jlbokass/datashare/actions/runs/44536846492) |
| 22 Nov | 96.36% (318/330), 52 tests, 364 assertions | 79.58%, 44 tests | 6/6 (5.8 s) | [Backend](https://github.com/jlbokass/datashare/actions/runs/45076254553) · [Frontend](https://github.com/jlbokass/datashare/actions/runs/45076254559) · [E2E](https://github.com/jlbokass/datashare/actions/runs/45076254577) |
| 24 Nov | 96.36% (318/330), 52 tests, 364 assertions | 85.97%, 52 tests | 6/6 (7.7 s) | [Backend](https://github.com/jlbokass/datashare/actions/runs/45302509975) · [Frontend](https://github.com/jlbokass/datashare/actions/runs/45302510070) · [E2E](https://github.com/jlbokass/datashare/actions/runs/45302509992) |

Local measurements on 19 November (Xdebug and V8) matched CI. These historical results do not describe the final release scope.

## Reports and reproduction

[Backend CI](https://github.com/jlbokass/datashare/blob/main/.github/workflows/backend-ci.yml) (PCOV) and [Frontend CI](https://github.com/jlbokass/datashare/blob/main/.github/workflows/frontend-ci.yml) (Vitest/V8) generate the reports. They retain them for 14 days with `run.txt` (commit, date, command and scope). Download reports from **Artifacts** in the runs above.

- Laravel: `backend/coverage/clover.xml`, `backend/coverage/html/index.html`, `backend/coverage/summary.txt`.
- Angular: `frontend/coverage/datashare/` (HTML, LCOV and JSON).
- Locally, use the authorized QA commands in the [test plan](en/TESTING.md). Never run PHPUnit inside the `app` or `scheduler` services.

## Scope and limitations

- PHP: `backend/app/**/*.php`, including uncovered files; dependencies, routes, migrations, configuration, tests and generated views excluded. PCOV measures lines, not branches.
- Angular: `frontend/src/**/*.ts`, including guards and bootstrap; `*.spec.ts`, `*.d.ts`, dependencies and generated code excluded.
- Laravel tests use in-memory SQLite and fake storage. Coverage does not demonstrate PostgreSQL concurrency, real browser behavior or security. The two percentages are not aggregated.

**References:** [PHPUnit](https://docs.phpunit.de/en/12.5/code-coverage.html) · [Angular](https://angular.dev/guide/testing/code-coverage) · [Vitest](https://vitest.dev/config/coverage#coverage-include).
