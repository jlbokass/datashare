---
layout: default
title: "DataShare — AI Development Journal"
permalink: /ai-journal.html
lang: en
---

# DataShare — AI Development Journal

[**Français**](ai-journal.fr.md) · [Documentation home](index.md)

**DOC-02 · Living record · Started 18 November 2026.**

This log documents the **actual use of generative AI** in the new DataShare project. The first entries were **reconstructed retrospectively** from project discussions and GitHub issues/PRs; they are **not** a transcript of prompts. Future entries should be added when a meaningful issue is reviewed, **before its PR is merged**.

**Source of this format:** OpenClassrooms' supplied *Modèle de documentation technique*, section *Utilisation de l'IA dans le développement*. It requests an account of the working posture, delegated tasks, supervision/corrections, and observed benefits/limits; it does **not** mandate a chronological log.

## 1. Working posture

The developer **owns the requirements, architectural decisions, acceptance and final responsibility**. ChatGPT acts as a **pair-design assistant** and, for clearly scoped tasks, a **delegate for writing diagrams, documentation, API schemas and repository changes**. The developer may challenge assumptions, request corrections or reject unnecessary functionality. All changes remain traceable in GitHub issues, PRs and commits.

The developer reported that their mentor considers an older handout's "AI for only one User Story" restriction outdated. The current written policy has **not been independently verified** here; this journal records actual usage transparently regardless of that discrepancy.

## 2. Retrospective record — design and documentation phase

_All entries below relate to **18 November 2026**; their grouping is reconstructed after the work. GitHub proves artifacts and merge history, while design decisions and approvals were discussed with the developer. No personal manual code edits or test executions are inferred from a PR._

| Issue / evidence | AI contribution (delegated work) | Developer supervision and outcome |
| --- | --- | --- |
| **DESIGN-01** · [#1](https://github.com/jlbokass/datashare/issues/1) · [PR #14](https://github.com/jlbokass/datashare/pull/14) | Generated an editable draw.io architecture, SVG and bilingual explanations for Angular, Laravel, PostgreSQL, private storage and expiry. | The developer inspected the proposed diagram and accepted its overall structure. Nginx and local storage remained **proposals**, not proof of deployment. |
| **DESIGN-02** · [#2](https://github.com/jlbokass/datashare/issues/2) · [PR #15](https://github.com/jlbokass/datashare/pull/15) | Drafted and iteratively changed the UML conceptual model and FR/EN documentation. Separated mandatory and optional concepts in **one diagram**; described nullable download-event association and privacy limits. | The developer proposed additional entities/fields, corrected the download-event semantics, requested a single diagram, and selected retaining analytics after transfer deletion. The assistant flagged that `ON DELETE SET NULL` is **not sufficient anonymisation**. Developer approved the MCD. |
| **DESIGN-03** · [#3](https://github.com/jlbokass/datashare/issues/3) · [PR #16](https://github.com/jlbokass/datashare/pull/16) | Prepared OpenAPI 3.1 design contract and bilingual guide for US01–US06, including per-file deletion, JWT, upload and share download. Performed **structural checks** of operations and references. | The developer accepted the API contract and called out the need to integrate earlier deliverables before progressing. **Independent OpenAPI validation was not yet recorded.** |
| **TECH-01** · [#17](https://github.com/jlbokass/datashare/issues/17) · [PR #18](https://github.com/jlbokass/datashare/pull/18) · [PR #19](https://github.com/jlbokass/datashare/pull/19) | Drafted `.gitignore`, created `develop` and handled GitHub PR integration using the connected tools. | The developer requested a `develop` workflow and branch hygiene, kept `main` protected, and decided **not** to add extra branch protection on `develop` for a solo project. |
| **DESIGN-04** · [#20](https://github.com/jlbokass/datashare/issues/20) · [PR #21](https://github.com/jlbokass/datashare/pull/21) | Wrote EN/FR technology-choice rationale with alternatives and trade-offs based on the OC template. | The developer identified the missing technology justification **before** framework setup and reviewed/approved the drafts. No runtime installation or benchmarking was claimed. |
| **DOC-01** · [#22](https://github.com/jlbokass/datashare/issues/22) · [PR #23](https://github.com/jlbokass/datashare/pull/23) · [PR #24](https://github.com/jlbokass/datashare/pull/24) | Created bilingual READMEs and GitHub Pages documentation entry points, configured Jekyll front matter and checked local Markdown links. | The developer approved the documentation and subsequently reported enabling GitHub Pages. This report is **not** equivalent to a separately verified live-site review. |

**Nature of AI work to date:** design diagrams, Markdown documentation, proposed API contract, repository configuration and GitHub operations. **No Laravel/Angular application source has yet been generated in the new project.**

## 3. Observed benefits and limitations

**Benefits:** shorter iteration time for diagrams and parallel EN/FR texts; explicit requirements traceability; ability to correct UML or branching decisions before writing application code.

**Limitations/corrections:** independently developed branches initially omitted earlier design files until integrated; the data model needed several corrections around per-file deletion, optional tracking and privacy; generated checks for Markdown/OpenAPI were **structural**, not proof of a successful application build, runtime security or formal OpenAPI validation. Technical and privacy decisions remain the developer's responsibility.

## 4. Development phase — Docker and application scaffolding

| Issue / evidence | AI contribution (delegated work) | Developer actions, review and evidence |
| --- | --- | --- |
| **TECH-02** · [#28](https://github.com/jlbokass/datashare/issues/28) · [PR #29](https://github.com/jlbokass/datashare/pull/29) | Prepared a Docker-first Compose setup with PostgreSQL, PHP/Composer and Node tooling, and bilingual verification instructions. | The developer chose the Docker-first sequence, ran the prescribed Docker commands locally, and reported all checks green. **Exact terminal output was not captured in this journal**, so version details and persistence tests are not independently asserted. Hot reload and Dozzle were explicitly deferred. |
| **TECH-03** · [#30](https://github.com/jlbokass/datashare/issues/30) · [scaffold commit](https://github.com/jlbokass/datashare/compare/develop...feat/tech-03-scaffold-apps) | Provided official Docker-based Composer and Angular CLI scaffold commands, reviewed the pushed directory structure, versions in manifests, ignored artifacts and generated defaults; prepared the GitHub review and journal. **No feature code was AI-generated in this task.** | The developer generated Laravel 13 under `backend/` and Angular 22 under `frontend/`, executed the requested version checks, reported passing Laravel tests and an Angular build, then committed and pushed the scaffold. Detailed command output was not retained; Angular unit tests were subsequently reported **passing** by the developer (`npm test -- --watch=false` run inside the Node container); detailed terminal output was not retained. PostgreSQL integration and hot reload are deferred. |

| **TECH-04** · [#32](https://github.com/jlbokass/datashare/issues/32) · [Draft PR #33](https://github.com/jlbokass/datashare/pull/33) | Prepared the Docker Compose app/frontend/web integration, Nginx gateway, non-business Laravel health route, hot-reload configuration, bilingual setup instructions and review of the 23-page UI handoff. The original PDF was committed by the developer. | The developer reported **Docker, Angular and health checks OK** locally. Exact commands and outputs were not shared, and **PostgreSQL migrations, browser hot reload and Laravel/Angular regression tests were subsequently reported green by the developer**. No claim of finished integration or UI compliance is made. |

## 5. Entry template for the MVP phase

Add **one concise entry per significant issue/PR**; do not archive every prompt. If an activity is not documented, write **“not verified”**, rather than inventing evidence.

| Field | Record |
| --- | --- |
| Date · Issue · PR | YYYY-MM-DD · issue URL · PR URL / commit |
| Objective | What the user story or task required |
| AI tasks | What was delegated: analysis, code, tests, diagrams, documentation, tooling |
| Human actions | Decisions, review performed, changes requested or implemented by the developer |
| Verification | Commands/tests **actually run**, result and link; otherwise **not verified** |
| Outcome and limits | Accepted changes, defects found, security/performance caveats and next action |

**Maintenance rule:** update both language versions in the same PR review cycle. Never commit secrets, identifiable user data, private prompts or access tokens. This journal supports the final OC technical-documentation summary; it does not replace that summary.
