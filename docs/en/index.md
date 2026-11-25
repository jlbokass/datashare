---
layout: default
title: "DataShare — Documentation"
permalink: /en/
lang: en
---

# DataShare — Technical Documentation

[Français](../index.md) · [GitHub repository](https://github.com/jlbokass/datashare)

**25 November 2026 release — [PR #100](https://github.com/jlbokass/datashare/pull/100), [bec72e3](https://github.com/jlbokass/datashare/commit/bec72e39ff80a9c89df600aea6f060e905591b80) (`main`).** US01–US06 are delivered alongside US08 (private tags), US09 (per-file password), PROFILE-01 (profile), history pagination and OPS-03 (S3-compatible Garage, isolated demonstration). Private local storage remains the default. US07 (anonymous uploads) is not implemented; US10 has no separate work package because expiry and daily cleanup are already covered by US01. Feature development is frozen. The application runs locally and is not deployed to production.

All three CI workflows and [GitHub Pages publication](https://github.com/jlbokass/datashare/actions/runs/45548825102) passed. GitHub Pages hosts documentation only.

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
| [Coverage](../coverage.md) | 79.72% Laravel (83 tests) and 88.00% Angular (65 tests), 25 November release; separate line measurements |
| [SECURITY](SECURITY.md) | Composer/npm audits: no vulnerabilities reported on 23 November |
| [PERF](PERF.md) | Local measurements (22–23 November); final CI bundle 370.94 kB; no production performance claim |
| [MAINTENANCE](MAINTENANCE.md) | Local operations, cleanup, updates and recovery |

[![Backend CI](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/backend-ci.yml?query=branch%3Adevelop)
[![Frontend CI](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/frontend-ci.yml?query=branch%3Adevelop)
[![E2E CI](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml/badge.svg?branch=develop)](https://github.com/jlbokass/datashare/actions/workflows/e2e-ci.yml?query=branch%3Adevelop)

## Project and delivery

[Issues](https://github.com/jlbokass/datashare/issues) · [Pull requests](https://github.com/jlbokass/datashare/pulls?q=is%3Apr) · [Commits](https://github.com/jlbokass/datashare/commits/develop/)

The workflow uses a dedicated branch, reviewed PR into `develop`, then a separate release PR into `main`. French reference documents remain at the repository root; the five English translations are grouped in `docs/en/`. The published site follows `main/docs`.

Six manual keyboard checks passed on 24 November ([record](../design-handoff.md)); this is not a comprehensive accessibility audit. Real PostgreSQL concurrency and production performance have not been demonstrated.
