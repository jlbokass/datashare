# DataShare

**Secure file-sharing platform — OpenClassrooms software development project (P3).**

[English](README.md) · [Français](README.fr.md) · [Documentation](docs/index.md) · [Documentation française](docs/index.fr.md)

## Project status

**Design approved; Laravel 13 and Angular 22 scaffolds generated in TECH-03.** The developer reported the initial Docker, test and frontend build checks successful. TECH-04 now provides a local development gateway and Angular hot reload; **the developer reports successful local integration checks**, including PostgreSQL migrations and regression tests.

US03 registration and US04 JWT login have been locally validated by the developer and merged into `develop`. **US01 authenticated upload** (PDF, multiple files, expiry and local five-minute demo) was reported **green by the developer** with migrations, tests, build and browser checks. The public download is not available until **US02**. [US01 acceptance and limitations](docs/us01-upload.md).

This repository is public so the OpenClassrooms evaluator can inspect the code, documentation, issues, Pull Requests and commit history.

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

See [the technical rationale](docs/technology-choices.md), [architecture](docs/architecture.md), [UML conceptual model](docs/data-model.md), [OpenAPI contract](docs/api/openapi.yaml), [TECH-04 local setup](docs/development.md), [UI handoff review](docs/design-handoff.md), and [TECH-02 Docker setup](docs/docker-setup.md).

## Documentation and project workflow

The documentation is maintained in **English and French** in the same repository. [Start here](docs/index.md), or open the [French documentation hub](docs/index.fr.md). Our [AI development journal](docs/ai-journal.md) records AI contributions and developer supervision, with a [French version](docs/ai-journal.fr.md).

Git workflow: work branches → Pull Requests → `develop` → reviewed release Pull Request → protected `main`. See the [issues](https://github.com/jlbokass/datashare/issues) for the official user stories and remaining work.

The repository owner reports GitHub Pages has been enabled for static documentation from `main` / `docs`: **https://jlbokass.github.io/datashare/**. The live rendering has not been independently verified here. GitHub Pages does **not** host the Laravel API.

## Installation and quality evidence

The [local integration recipe](docs/development.md) records the TECH-04 environment (developer-reported green). No steps from historical `datashare-legacy` apply automatically.

CI, code coverage and security scans are not operational yet. Their README **quality badges will be added only after the corresponding checks run successfully**; no green status is asserted in advance.

## Reference

The original OpenClassrooms mission, specifications and documentation template remain in their original French. The project's authored Markdown is bilingual. The [Figma designs](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6), [original 23-page UI handoff PDF](docs/design/DataShare_UI_Design_Handoff_v1.pdf) and [bilingual handoff review](docs/design-handoff.md) are the visual references. **Functional US01 is not yet visually Figma-compliant**; see [UI-01 #37](https://github.com/jlbokass/datashare/issues/37).
