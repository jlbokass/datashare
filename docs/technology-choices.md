---
layout: default
title: "Technology choices and rationale"
permalink: /technology-choices.html
lang: en
---

# DataShare — Technology Choices and Rationale

**DESIGN-04 · Reviewed technology rationale · Mandatory MVP: US01–US06**

**Basis:** OpenClassrooms mission (technical choices: **1–2 pages**), supplied technical-documentation template and application specifications (permitted stacks). The choices below describe the **chosen solution implemented locally**.

## Decision matrix

| Area | Choice and status | Alternatives | Why this choice / trade-off |
| --- | --- | --- | --- |
| **Backend** | **PHP + Laravel — selected** | Symfony (also PHP), Spring Boot, ASP.NET Core, NestJS | The sole developer's PHP experience limits onboarding risk. Laravel brings routing, validation, authorization, ORM/migrations, filesystem and scheduling within one framework. Symfony is equally permitted; this is a project-fit decision, **not a performance claim**. |
| **Frontend** | **TypeScript + Angular — selected** | React, Vue | Typed components, services, routing and forms provide a structured base for authenticated and public workflows. In exchange, Angular introduces framework conventions and build-tooling complexity. |
| **Database** | **PostgreSQL — selected** | MongoDB | The UML model has clear ownership and one-to-many associations between users, transfers and files. Relational constraints and transactions suit metadata consistency and deletion; schema migrations need maintenance. |
| **File storage** | **Private local filesystem — selected for MVP** | AWS S3 | Permitted by OC and simpler to demonstrate without cloud credentials or another service. Laravel alone controls download access. A persistent volume, backups and available disk capacity are necessary; multi-server scaling would favor object storage later. |
| **Authentication** | **JWT — required by OC** | Session-based authentication (not chosen) | Fits a separate Angular client and REST API. Laravel must verify tokens and file ownership. Token lifetime, in-memory storage and revocation limitations are documented in SECURITY. Public share tokens are **not** JWTs. |
| **HTTP gateway** | **Nginx + PHP-FPM — selected** | Framework development servers | One entry point for Angular static assets and `/api` calls; upload limits and public HTTPS can be configured centrally. It adds a service to maintain and is not imposed by OC. |
| **Development runtime** | **Docker Compose — used locally** | Local host installation | PHP/Composer, Node/npm and PostgreSQL were isolated before scaffolding Laravel and Angular in their containers. This makes framework versions reproducible without host dependencies. Nginx was added after scaffolding; no OC project generator is used. |
| **Version control** | **Git + GitHub — in use** | GitLab | Public repository for evaluation, protected `main`, `develop` for integration and feature branches with PRs. The solo-developer workflow does **not** require protecting `develop`. |
| **Documentation** | **Bilingual Markdown; GitHub Pages — in use** | Repository-only Markdown, PDF | Versioned English/French technical material and browsable static documentation. Pages **cannot host the Laravel API**. |
| **Quality / CI** | **Tests, formatting and GitHub Actions — in use** | Manual-only checks | API, frontend and end-to-end tests; dependency scans and performance measurements follow the OC requirements. PHPUnit, Pint, Vitest and Playwright are in use; no application deployment pipeline is in place. **CI and quality badges must report real checks**, not planned success. |

## Scope and development approach

The MVP uses **US01–US06**, including JWT access control, private storage, public share links, **1 GB maximum file size**, a default expiry of **seven days**, and deletion of expired files and metadata. Optional US07–US10 are not prerequisites; US01 already requires expiry cleanup.

1. **Design:** [architecture](architecture.md), [conceptual UML model](data-model.md) and [OpenAPI contract](api/openapi.yaml) define the baseline.
2. **Prepare Docker dependencies first**, then initialize Laravel and Angular with their official generators **inside the containers**. Add Nginx/application routing after scaffolding, before implementing the first user story.
3. **Implement and test** authentication (US03–US04), upload/download (US01–US02), history/deletion (US05–US06), followed by security, performance and CI evidence.
4. **Documentation publication** via GitHub Pages from `main/docs`; the application needs separate runtime hosting for a functional public demonstration.

**Limitation:** no production application hosting or tested backup/recovery is claimed.
