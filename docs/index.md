---
layout: default
title: "DataShare — Documentation"
permalink: /
lang: en
---

# DataShare — Technical Documentation

[**English**](index.md) · [**Français**](index.fr.md)

Secure file-sharing MVP — OpenClassrooms P3.

**Current state:** design approved and Laravel/Angular scaffolds present. Docker dependency checks were reported successful by the developer; TECH-04 service integration and hot reload **were reported locally verified by the developer**, not proof of a deployed application.

## Consolidated OpenClassrooms technical dossier

[Technical documentation — eight OC sections](technical-documentation.md) (evolving draft). Root quality reports: [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.md), [SECURITY](https://github.com/jlbokass/datashare/blob/develop/SECURITY.md), [PERF](https://github.com/jlbokass/datashare/blob/develop/PERF.md), [MAINTENANCE](https://github.com/jlbokass/datashare/blob/develop/MAINTENANCE.md). **Plans exist; actual E2E, coverage, scans and measurements remain outstanding.**

## Design deliverables

| Deliverable | Documentation | Supporting assets |
| --- | --- | --- |
| **DESIGN-01 — Architecture** | [Application architecture](architecture.md) | [Editable draw.io](diagrams/architecture.drawio) · [SVG diagram](diagrams/architecture.svg) |
| **DESIGN-02 — Conceptual data model** | [UML domain model](data-model.md) | [Editable draw.io](diagrams/data-model.drawio) · [SVG diagram](diagrams/data-model.svg) |
| **DESIGN-03 — API interface contract** | [REST API contract](api/README.md) | [OpenAPI 3.1 YAML](api/openapi.yaml) |
| **DESIGN-04 — Technology rationale** | [Technology choices](technology-choices.md) | Comparison and trade-offs |

All four deliverables have French counterparts accessible within their respective pages. The UML diagram places the optional extensions in the **same drawing** as the required MVP classes, clearly distinguished.

## AI use and supervision

The [AI development journal](ai-journal.md) records delegated tasks, developer decisions, corrections and evidence, with a [French equivalent](ai-journal.fr.md). Its first entries are explicitly retrospective.

## Development environment

[Docker-first dependency setup](docker-setup.md) (TECH-02) · [Laravel / Angular integration and hot reload](development.md) (TECH-04, locally verified by developer).

## UI design reference

[UI design handoff review and scope decisions](design-handoff.md) — visual tokens, desktop/mobile reference widths and explicit US09 password discrepancy. The [source PDF](design/DataShare_UI_Design_Handoff_v1.pdf) is committed on the TECH-04 branch.

## Account features (under development)

[US03 — Registration](us03-registration.md), [US04 — JWT login](us04-jwt-login.md) and [US01 — Authenticated upload with expiry](us01-upload.md) were implemented and reported **locally green** by the developer. US02/US05/US06 remain incomplete; the [UI-01 visual mismatch](https://github.com/jlbokass/datashare/issues/37) is tracked separately.

## File transfers — US01 in review

[US01 upload guide and acceptance criteria](us01-upload.md) covers multipart authenticated upload, private storage, 1–7 day expiration and scheduled cleanup. The public download experience belongs to US02, not to this unverified Draft.

## MVP requirements

US01 authenticated upload · US02 link-based download · US03 registration · US04 JWT login · US05 personal history · US06 individual file deletion.

US07–US10 remain optional; **US01 already mandates expiry and automatic deletion**. The current architectural choice is one share link per transfer, which may contain multiple individually manageable files.

## Project and delivery

[**GitHub repository**](https://github.com/jlbokass/datashare) · [Issues and user stories](https://github.com/jlbokass/datashare/issues) · [Pull requests](https://github.com/jlbokass/datashare/pulls)

The project uses work branches → `develop` → protected `main`. GitHub Pages publishes **documentation only** from `main/docs`; running the Laravel API requires a separate application runtime.

### Quality evidence — to be completed after integration

The developer reported TECH-02–04 and US01–04 local checks green. CI, E2E, coverage, security scans and performance evidence will be linked **only after those checks actually run**.

---

**Language:** [Documentation en français](index.fr.md) · [Read the repository README](https://github.com/jlbokass/datashare#readme)
