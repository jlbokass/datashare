---
layout: default
title: "DataShare — Documentation"
permalink: /
lang: en
---

# DataShare — Technical Documentation

[**English**](index.md) · [**Français**](index.fr.md)

Secure file-sharing MVP — OpenClassrooms P3.

**Current state:** conceptual design approved; Laravel/Angular application development has **not yet started** in the clean-slate repository. This documentation is a design reference, not proof of a deployed application.

## Design deliverables

| Deliverable | Documentation | Supporting assets |
| --- | --- | --- |
| **DESIGN-01 — Architecture** | [Application architecture](architecture.md) | [Editable draw.io](diagrams/architecture.drawio) · [SVG diagram](diagrams/architecture.svg) |
| **DESIGN-02 — Conceptual data model** | [UML domain model](data-model.md) | [Editable draw.io](diagrams/data-model.drawio) · [SVG diagram](diagrams/data-model.svg) |
| **DESIGN-03 — API interface contract** | [REST API contract](api/README.md) | [OpenAPI 3.1 YAML](api/openapi.yaml) |
| **DESIGN-04 — Technology rationale** | [Technology choices](technology-choices.md) | Comparison and trade-offs |

All four deliverables have French counterparts accessible within their respective pages. The UML diagram places the optional extensions in the **same drawing** as the required MVP classes, clearly distinguished.

## MVP requirements

US01 authenticated upload · US02 link-based download · US03 registration · US04 JWT login · US05 personal history · US06 individual file deletion.

US07–US10 remain optional; **US01 already mandates expiry and automatic deletion**. The current architectural choice is one share link per transfer, which may contain multiple individually manageable files.

## Project and delivery

[**GitHub repository**](https://github.com/jlbokass/datashare) · [Issues and user stories](https://github.com/jlbokass/datashare/issues) · [Pull requests](https://github.com/jlbokass/datashare/pulls)

The project uses work branches → `develop` → protected `main`. GitHub Pages publishes **documentation only** from `main/docs`; running the Laravel API requires a separate application runtime.

### Implementation and quality — to be documented later

The application installation, backend/frontend tests, CI, coverage, security scans and performance results will be linked here **after they exist**. No operational badges or test results are claimed during the design-only phase.

---

**Language:** [Documentation en français](index.fr.md) · [Read the repository README](https://github.com/jlbokass/datashare#readme)
