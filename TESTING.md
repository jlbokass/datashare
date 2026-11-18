# DataShare — Testing plan and evidence (OC P3)

[Français](TESTING.fr.md) · [Technical documentation](docs/technical-documentation.md)

**Status: evolving plan, 18 November 2026.** This file distinguishes **developer-reported local success** from captured evidence and future tests.

## Scope, checks and current evidence

| Scope | Expected acceptance | Current record |
| --- | --- | --- |
| US03 registration | Valid/unique email; minimum 8-character password; salted hash; duplicate and invalid rejected | Developer reported backend/frontend tests and browser cases green; French duplicate error corrected; no archived test report |
| US04 login | Correct credentials give signed JWT; wrong credentials/absent token 401; protected profile | Developer reported tests/build and browser login/logout/401 green; no token/session screenshots |
| US01 upload | JWT required; 1–5 files, 1 GB each, 2 GB aggregate operational cap; private storage; one share token; 1–7 day expiry | Developer reported Docker, PostgreSQL migration, PHPUnit, Angular tests/build, PDF and multifile upload, one-day expiry green |
| US01 local demonstration | Opt-in 5-minute expiry only in local mode, home reset and minute scheduler | Developer reported corrected home navigation, new tests and five-minute demo green; minute-level physical deletion has not been independently documented |
| US02 / US05 / US06 | Public download and expiry handling / owner history / individual deletion | **Not implemented or verified** |
| UI-01 | Compare actual home/upload and confirmation frames with Figma at 393px, 1440px and intermediate widths | **Open visual nonconformity**: [issue #37](https://github.com/jlbokass/datashare/issues/37) |

**Limits:** PHPUnit uses SQLite in-memory and fake private storage for many feature tests; local PostgreSQL migration and actual browser upload were separately reported successful. No isolated large-file network load, end-to-end suite or CI run has been recorded yet.

## How to run locally

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

- [ ] End-to-end automation (Cypress, Playwright or equivalent), at least **2–3 critical scenarios**: registration/login, upload/public download, history/deletion/expiry. Those scenarios require US02/US05/US06.
- [ ] Coverage report and screenshot: **indicative goal 70% or higher**; percentage **not measured** yet.
- [ ] CI executing backend/frontend lint/tests/build and linking workflow results.
- [ ] Real-size upload behavior, multipart 413 handling, scheduler purge and corrupted/unsafe file cases.
- [ ] Accessibility, desktop/mobile visual review and external user feedback when available.

**Evidence policy:** report date, Git SHA, command, test count, pass/fail, coverage/output location; never convert a planned test into a green badge.
