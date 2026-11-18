# DataShare

**Secure file-sharing platform — OpenClassrooms software development project (P3).**

[English](README.md) · [Français](README.fr.md) · [Documentation](docs/index.md) · [Documentation française](docs/index.fr.md)

## Project status

**Design complete; application implementation has not started in this new repository.** The architecture, conceptual UML model, OpenAPI contract and technical choices have been reviewed. A minimal **Docker-first dependency configuration** is proposed in TECH-02; local execution has not yet been verified. Laravel and Angular have not been generated.

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
- **File storage:** private local filesystem proposed for the MVP.
- **Development environment:** Docker Compose configured first with PHP/Composer, Node/npm and PostgreSQL; Nginx/application wiring follows framework initialization.

See [the technical rationale](docs/technology-choices.md), [architecture](docs/architecture.md), [UML conceptual model](docs/data-model.md), [OpenAPI contract](docs/api/openapi.yaml), and [Docker-first setup instructions](docs/docker-setup.md).

## Documentation and project workflow

The documentation is maintained in **English and French** in the same repository. [Start here](docs/index.md), or open the [French documentation hub](docs/index.fr.md). Our [AI development journal](docs/ai-journal.md) records AI contributions and developer supervision, with a [French version](docs/ai-journal.fr.md).

Git workflow: work branches → Pull Requests → `develop` → reviewed release Pull Request → protected `main`. See the [issues](https://github.com/jlbokass/datashare/issues) for the official user stories and remaining work.

The repository owner reports GitHub Pages has been enabled for static documentation from `main` / `docs`: **https://jlbokass.github.io/datashare/**. The live rendering has not been independently verified here. GitHub Pages does **not** host the Laravel API.

## Installation and quality evidence

Installation instructions will be added **when the actual application and Docker environment exist**. Do not follow the historical `datashare-legacy` installation steps for this clean-slate repository.

CI, code coverage and security scans are not operational yet. Their README **quality badges will be added only after the corresponding checks run successfully**; no green status is asserted in advance.

## Reference

The original OpenClassrooms mission, specifications and documentation template remain in their original French. The project's authored Markdown is bilingual. The [Figma designs](https://www.figma.com/design/i4HHiGsL7Kc3kVBo41m7F6) are the UI reference.
