---
layout: default
title: "DataShare — Documentation"
permalink: /
lang: en
---

# DataShare — Technical Documentation

[**English**](index.md) · [**Français**](index.fr.md)

Secure file-sharing MVP — OpenClassrooms P3.

**Status as of 19 November 2026:** all six mandatory functional stories US01–US06 are merged into `develop`, with developer-reported browser acceptance and green [PR #46 CI](https://github.com/jlbokass/datashare/pull/46). Visual parity and final quality checks remain open.

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

## Continuous integration and quality badges

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)

These badges reflect **real `develop` workflow runs**, not a fabricated coverage score. [CI-01 guide](ci.md) describes Laravel/Pint checks and Angular tests/build. The latest verified functional PR [#46](https://github.com/jlbokass/datashare/pull/46) passed **52 Laravel tests / 364 assertions and 44 Angular tests**. E2E, security audits, measured coverage and performance remain pending.

## Development environment

[Docker-first dependency setup](docker-setup.md) (TECH-02) · [Laravel / Angular integration and hot reload](development.md) (TECH-04, locally verified by developer).

## UI design reference

[UI design handoff review and scope decisions](design-handoff.md) — visual tokens, desktop/mobile reference widths and explicit US09 password discrepancy. The [source PDF](design/DataShare_UI_Design_Handoff_v1.pdf) is committed on the TECH-04 branch.

## Functional MVP — US01 through US06

- [US03 — Registration](us03-registration.md) and [US04 — JWT login](us04-jwt-login.md)
- [US01 — Private upload, expiration and purge](us01-upload.md)
- [US02 — Public share metadata and download](us02-public-sharing.md) — T01–T05 accepted per developer
- [US05 — Personal history](us05-personal-history.md) — owner isolation and HTTP 401 accepted
- [US06 — Individual deletion](us06-file-deletion.md) — T01–T05 accepted per developer

These features are merged into **`develop`**. Publishing `main` and visual/responsive acceptance are separate steps. ZIP archives are not antivirus-scanned.

## MVP requirements

US01 authenticated upload · US02 link-based download · US03 registration · US04 JWT login · US05 personal history · US06 individual file deletion.

US07–US10 remain optional; **US01 already mandates expiry and automatic deletion**. The current architectural choice is one share link per transfer, which may contain multiple individually manageable files.

## Project and delivery

[**GitHub repository**](https://github.com/jlbokass/datashare) · [Issues and user stories](https://github.com/jlbokass/datashare/issues) · [Pull requests](https://github.com/jlbokass/datashare/pulls)

The project uses work branches → `develop` → protected `main`. GitHub Pages publishes **documentation only** from `main/docs`; running the Laravel API requires a separate application runtime.

### Remaining quality deliverables

[Testing evidence](https://github.com/jlbokass/datashare/blob/develop/TESTING.md) separates GitHub-verified results, developer-reported acceptance and remaining work. **Before OC delivery:** representative E2E, measured coverage, security checks, performance, PostgreSQL concurrency and [UI/responsive acceptance](https://github.com/jlbokass/datashare/issues/37).

---

**Language:** [Documentation en français](index.fr.md) · [Read the repository README](https://github.com/jlbokass/datashare#readme)
