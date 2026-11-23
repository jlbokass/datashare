# DataShare — Test plan and results

[Français](TESTING.fr.md) · [Technical documentation](docs/technical-documentation.md) · [QL-02 tracking](https://github.com/jlbokass/datashare/issues/51)

**Status as of 22 November 2026.** Mandatory MVP features US01–US06 are covered by backend, frontend and three critical E2E business scenarios. All three GitHub Actions workflows on [PR #52](https://github.com/jlbokass/datashare/pull/52) are **passing**. The PR was merged into `develop` on 22 November 2026.

## 1. Scope and acceptance criteria

Tests run at the most appropriate level: **PHPUnit** for backend rules and APIs, **Vitest** for Angular and **Playwright/Chromium** for full user journeys. E2E tests use real Angular → Nginx → Laravel → PostgreSQL and private file storage, without mocking the API.

| Critical journey | Verified acceptance criteria | Tests |
| --- | --- | --- |
| **E2E-01 · US03–US04** — registration, login, account | Registration HTTP 201; login and identity HTTP 200; APIs without JWT reject access (401); anonymous account access redirects; logout effective | Laravel + Angular; `registration.spec.ts`, `login.spec.ts`, `session.spec.ts` |
| **E2E-02 · US01–US02** — upload and public sharing | Authenticated upload HTTP 201; public link opened without a session; downloaded file **name and bytes match** | Laravel + Angular; `upload-download.spec.ts` |
| **E2E-03 · US05–US06** — history and deletion | Owner's files visible; deletions HTTP 204; second file remains downloadable; deleting the last file revokes the share (404) | Laravel + Angular; `history-deletion.spec.ts` |

A sixth test, `smoke.spec.ts`, confirms that the application renders. **Six tests cover three business scenarios plus a technical smoke check**; they are not six additional E2E journeys. Registration → login in the same SPA navigation was checked manually; automating the entire transition in one test is not an acceptance requirement.

Detailed validation (file types and sizes, expiry, JWT, ownership and error conditions) is mainly covered by Laravel and Angular tests rather than duplicated in E2E. Source requirements are listed in the [MVP scope](README.md#about) and the [OpenAPI contract](docs/api/openapi.yaml).

## 2. Results and evidence

**Verified reference:** commit `9810a88`, PR #52, GitHub Actions on **22 November 2026**.

| Level | CI result | Line coverage | Evidence |
| --- | --- | --- | --- |
| **Laravel / PHPUnit + Pint** | **52 tests PASS**, 364 assertions; formatting PASS | **96.36%** (318/330) | [Backend run](https://github.com/jlbokass/datashare/actions/runs/45076254553) |
| **Angular / Vitest + build** | **44 tests PASS**; production build PASS | **79.58%** | [Frontend run](https://github.com/jlbokass/datashare/actions/runs/45076254559) |
| **Playwright / Chromium** | **6 tests PASS**, one worker, 5.8 s | Not applicable | [E2E run](https://github.com/jlbokass/datashare/actions/runs/45076254577) |

The indicative OpenClassrooms **70%** line-coverage target is met on both codebases; **do not add or average the two percentages**. Measurement details: [QL-01 coverage report](docs/coverage.md). The developer also reported **6/6 local E2E PASS** on 22 November 2026; the GitHub Actions runs provide independently checked evidence.

CI coverage artifacts are retained for **14 days**, and the E2E summary for **7 days**, subject to GitHub retention. **A durable screenshot of a coverage report still needs to be included in the assessment submission**, as requested in the specifications.

## 3. Running the checks

From repository root after installing dependencies according to the [README](README.md):

```bash
# Laravel tests, Pint, Angular tests and build
bash scripts/qa.sh all
```

For E2E use **only** `compose.test.yaml`: PostgreSQL and file storage are temporary and isolated from development data.

```bash
docker compose -f compose.test.yaml up -d --build db app frontend web
docker compose -f compose.test.yaml exec -T app sh -ec '
  export APP_KEY="base64:$(php -r "echo base64_encode(random_bytes(32));")"
  export JWT_SECRET="$(php -r "echo bin2hex(random_bytes(32));")"
  php artisan migrate --force
'
# Once Angular and the API are ready:
docker compose -f compose.test.yaml --profile e2e run --rm --no-deps playwright
```

The [E2E CI workflow](.github/workflows/e2e-ci.yml) shows clean installation and readiness checks. **Never run mutating E2E checks against `compose.yaml` or delete development volumes.**

## 4. Limits and remaining deliverables

- PHPUnit/Feature tests primarily use **in-memory SQLite and fake file storage**. E2E also verifies real HTTP flows against **isolated PostgreSQL and private storage**, but only with small synthetic files; no 1 GB load test is implied.
- Line coverage does not guarantee defect-free software. Playwright screenshots, videos and traces remain disabled to avoid disclosing credentials and files.
- **Completed complementary batches:** [security audit](SECURITY.md), [performance measurements](PERF.md) and [Figma visual acceptance](docs/design-handoff.md). Keyboard/accessibility validation is not evidenced by the UI-01 record. Maintenance procedures are in [MAINTENANCE.md](MAINTENANCE.md).

**QL-02 decision:** the three business scenarios and CI checks are validated. No additional E2E scenario is required for this work package.

## 5. Continuous integration and functional acceptance

Three GitHub Actions workflows check PRs targeting `develop` and `main`: [backend](.github/workflows/backend-ci.yml) (PHP 8.4, Composer, PHPUnit, Pint, PCOV), [frontend](.github/workflows/frontend-ci.yml) (Node 24, npm, Vitest/V8, build) and [E2E](.github/workflows/e2e-ci.yml) (Playwright/Chromium, isolated Docker). Reports are temporary artifacts. GitHub Pages publishes documentation only, not the application.

| US | Historical developer-reported acceptance |
| --- | --- |
| US01 | PDF and multi-file upload, one-day expiry and five-minute demo; [#4](https://github.com/jlbokass/datashare/issues/4). |
| US02 | Anonymous PDF, multiple files, invalid link, ZIP and expiry: five passing scenarios ([PR #43](https://github.com/jlbokass/datashare/pull/43)). Automated tests cover 404/410. |
| US03–US04 | Registration, duplicate email, short password, login/logout and 401 rejection; [#6](https://github.com/jlbokass/datashare/issues/6), [#7](https://github.com/jlbokass/datashare/issues/7). |
| US05 | Owner history, account isolation, empty state, 401 rejection and multiple files ([PR #45](https://github.com/jlbokass/datashare/pull/45)). |
| US06 | Single deletion, multiple files, cancellation, non-owner rejection and last-link revocation: five passing scenarios ([PR #46](https://github.com/jlbokass/datashare/pull/46)). |

These acceptance reports do not replace the CI evidence above. The current suite does not demonstrate real PostgreSQL concurrency or a 1 GB load test.
