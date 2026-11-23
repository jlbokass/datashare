# DataShare

**Secure file-sharing platform — OpenClassrooms software development project (P3).**

[English](README.md) · [Français](README.fr.md) · [Documentation](docs/index.md) · [Documentation française](docs/index.fr.md)


[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)

## Project status

**Functional MVP US01–US06 implemented and merged into `develop` (19 November 2026)**: private upload, public download links, registration, JWT login, personal history and individual file deletion. The developer reported successful browser acceptance. [PR #46](https://github.com/jlbokass/datashare/pull/46) passed GitHub Actions with **52 Laravel tests / 364 assertions and Pint**, plus **44 Angular tests and a production build**. The application is **not deployed to production**.

**Status on 23 November 2026:** QL-01 through QL-04 are integrated into `develop`. The developer reports **UI-01 visual acceptance passed** ([summary](docs/design-handoff.md); [issue #37](https://github.com/jlbokass/datashare/issues/37)); its PR CI and keyboard accessibility review still need confirmation. Remaining OpenClassrooms delivery checks (including security, performance and PostgreSQL concurrency) are tracked in the quality reports. ZIP archives are not antivirus-scanned. Optional US07–US10 features are not claimed to be implemented.

This public repository allows the OpenClassrooms assessor to review code, documentation, issues, pull requests and commits.

## MVP scope

The mandatory OpenClassrooms user stories are:

| ID | Feature |
| --- | --- |
| US01 | Authenticated file upload and unique share link |
| US02 | Download through a valid public link |
| US03 | Account registration |
| US04 | User login with JWT |
| US05 | Personal upload history |
| US06 | Individual file deletion by its owner |

Advanced **US07–US10** are tracked as optional. The automatic removal of expired files and metadata remains an **US01 requirement**, independently of optional US10.

## Selected architecture

- **Backend:** PHP / Laravel REST API; JWT authentication required by the specification.
- **Frontend:** TypeScript / Angular.
- **Database:** PostgreSQL.
- **File storage:** private local filesystem, metadata in PostgreSQL; US01 file upload and scheduled expiry cleanup locally checked by the developer.
- **Development environment:** Docker Compose with PHP/Composer, Node/npm, PostgreSQL, Nginx and Angular hot reload (TECH-04 locally validated by the developer).

See [the evolving OC technical documentation](docs/technical-documentation.md), [the technical rationale](docs/technology-choices.md), [architecture](docs/architecture.md), [UML conceptual model](docs/data-model.md), [OpenAPI contract](docs/api/openapi.yaml), [TECH-04 local setup](docs/development.md), [UI handoff review](docs/design-handoff.md), and [TECH-02 Docker setup](docs/docker-setup.md).

## Documentation and project workflow

The documentation is maintained in **English and French** in the same repository. The OC deliverables [TESTING](TESTING.md), [SECURITY](SECURITY.md), [PERF](PERF.md) and [MAINTENANCE](MAINTENANCE.md) have bilingual plans; security scans, coverage, E2E and performance results remain **pending**, not claimed as completed. [Start here](docs/index.md), or open the [French documentation hub](docs/index.fr.md). Our [AI development journal](docs/ai-journal.md) records AI contributions and developer supervision, with a [French version](docs/ai-journal.fr.md).

Git workflow: work branches → Pull Requests → `develop` → reviewed release Pull Request → protected `main`. See the [issues](https://github.com/jlbokass/datashare/issues) for the official user stories and remaining work.

The repository owner reports GitHub Pages has been enabled for static documentation from `main` / `docs`: **https://jlbokass.github.io/datashare/**. The live rendering has not been independently verified here. GitHub Pages does **not** host the Laravel API.

## Local installation — Docker Compose

**Requirements:** Git, Docker Desktop with Docker Compose v2, and Docker running. No host PHP, Composer, Node or PostgreSQL installation is required. This stack binds to **localhost only** and is **not a production deployment**.

**1. Clone the project.** Until the next `main` release, `develop` contains the completed functional MVP:

```bash
git clone https://github.com/jlbokass/datashare.git
cd datashare
git switch develop
```

**2. Create configuration files only on a fresh clone:**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Set a **unique local `POSTGRES_PASSWORD`** in the root `.env`. Keep `APP_ENV=local` and set `JWT_SECRET` in `backend/.env` to a **64-character hex secret** generated by `openssl rand -hex 32`. Do not reuse `APP_KEY` as the JWT secret; the Laravel application key is generated below. **Never overwrite configured `.env` files, commit them or expose secrets.**

**3. Install Laravel dependencies and generate `APP_KEY`:**

```bash
docker compose config --quiet
docker compose build php
docker compose run --rm php sh -lc 'cd backend && composer install --prefer-dist --no-interaction'
docker compose run --rm php sh -lc 'cd backend && php artisan key:generate'
```

**4. Start services and initialize PostgreSQL:**

```bash
docker compose up -d --build
docker compose ps
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan schedule:list
```

On first boot the `frontend` service installs Node dependencies into its dedicated Docker volume. **The CLI `node` service shares this volume**, so QA works on a fresh clone. `db` runs PostgreSQL; `scheduler` purges expired transfers.

**5. Verify and open the application:**

```bash
curl -fsS http://127.0.0.1:8080/api/health
bash scripts/qa.sh all
```

Open **http://127.0.0.1:8080/** to register, sign in, upload, download from a public link, view history and delete individual files. `qa.sh all` runs Laravel tests and Pint, Angular tests and a production build. **CI Laravel tests use in-memory SQLite**; the migration above checks local PostgreSQL separately.

If Nginx briefly responds `502`, let the first Angular dependency install finish and check `docker compose logs -f frontend app web`. Stop without deleting persisted data using `docker compose down` (**not `down -v`**). See the [local development guide](docs/development.md) for troubleshooting.

## Quality badges and evidence

The badges at the top track **actual GitHub Actions runs on `develop`**: `Backend CI` (PHP 8.4, Laravel tests and **Pint**) and `Frontend CI` (Node 24, Angular tests and production build). [Workflow history](https://github.com/jlbokass/datashare/actions). Latest verified functional PR: [#46](https://github.com/jlbokass/datashare/pull/46), with green [backend](https://github.com/jlbokass/datashare/actions/runs/44446701173) and [frontend](https://github.com/jlbokass/datashare/actions/runs/44446701083) runs.

**No coverage, security-audit or performance badge** until those metrics are actually measured and automated. Outstanding evidence is tracked under [TESTING](TESTING.md), [SECURITY](SECURITY.md) and [PERF](PERF.md). GitHub Pages serves **static documentation** from `main/docs` and does **not** run the Laravel/Angular application.

## Reference

The original OpenClassrooms mission, specifications and documentation template remain in their original French. The project's authored Markdown is bilingual. The [Figma designs](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6), [original 23-page UI handoff PDF](docs/design/DataShare_UI_Design_Handoff_v1.pdf) and [bilingual handoff review](docs/design-handoff.md) are the visual references. **UI-01 visual acceptance was reported green on the work branch**, pending review of its PR into `develop`; see [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).
