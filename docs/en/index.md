---
layout: default
title: "DataShare — Documentation"
permalink: /en/
lang: en
---

# DataShare — Technical Documentation

[Français](../index.md) · [GitHub repository](https://github.com/jlbokass/datashare)

**Status as of 24 November 2026:** US01–US06, quality batches QL-01 through QL-04 and UI-01 visual acceptance are merged into `develop`. HIST-01 is closed: the existing purge policy is retained. The application runs locally; GitHub Pages hosts documentation only.

## Get started

[Local installation](../installation.md) · [README](README.md)

## OpenClassrooms technical dossier

[Consolidated technical documentation — eight sections](../technical-documentation.md)

| Topic | Reference |
| --- | --- |
| Architecture | [Description](../architecture.md) · [Draw.io](../diagrams/architecture.drawio) · [SVG](../diagrams/architecture.svg) |
| Technology choices | [Rationale and alternatives](../technology-choices.md) |
| Data model | [Conceptual UML](../data-model.md) · [Draw.io](../diagrams/data-model.drawio) · [SVG](../diagrams/data-model.svg) |
| REST API | [Guide](../api/README.md) · [OpenAPI contract](../api/openapi.yaml) |
| Interface | [UI-01 acceptance and Figma decisions](../design-handoff.md) · [Source PDF](../design/DataShare_UI_Design_Handoff_v1.pdf) |
| AI and oversight | [AI development journal](../ai-journal.md) |

## Quality

| Document | Reference result |
| --- | --- |
| [TESTING](TESTING.md) | Test plan, CI evidence, 6 E2E tests covering three critical journeys and a smoke check |
| [Coverage](../coverage.md) | 96.36% Laravel and 79.58% Angular (separate line measurements) |
| [SECURITY](SECURITY.md) | Composer/npm audits: no vulnerabilities reported on 23 November |
| [PERF](PERF.md) | Local measurements and limitations; no production performance claim |
| [MAINTENANCE](MAINTENANCE.md) | Local operations, cleanup, updates and recovery |

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)
[![E2E CI](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml?query=branch%3Adevelop)

## Project and delivery

[Issues](https://github.com/jlbokass/datashare/issues) · [Pull requests](https://github.com/jlbokass/datashare/pulls?q=is%3Apr) · [Commits](https://github.com/jlbokass/datashare/commits/develop/)

The workflow uses a dedicated branch, reviewed PR into `develop`, then a separate release PR into `main`. French reference documents remain at the repository root; the five English translations are grouped in `docs/en/`. The published site follows `main/docs`.

For assessment: include a coverage screenshot, prepare the presentation and self-assessment, and clarify applicable OC AI-use rules. Real PostgreSQL concurrency, keyboard accessibility and production performance are not demonstrated by the current results.
