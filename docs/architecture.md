---
layout: default
title: "Application architecture"
permalink: /architecture.html
lang: en
---

# DataShare — Application architecture

**Status:** logical architecture of the 25 November 2026 release ([PR #100](https://github.com/jlbokass/datashare/pull/100)), based on DESIGN-01 and implemented locally. This is not a production deployment plan.

**Source:** OpenClassrooms mission, step 1 (*Concevez l'architecture technique*), and *DataShare — Spécifications fonctionnelles*, MVP **US01–US06**.

- [Français](architecture.fr.md)
- [Editable draw.io diagram](diagrams/architecture.drawio)
- [Vector diagram (SVG)](diagrams/architecture.svg)

## Logical architecture

![DataShare logical architecture — editable source in draw.io](diagrams/architecture.svg)

The diagram separates a **public client/browser area** from the **private application environment**. It deliberately omits infrastructure that is not needed to explain the MVP.

## Components and responsibilities

| Component | Responsibility | Architecture decision |
| --- | --- | --- |
| Browser + Angular SPA | User interface, routing, forms, client feedback and protected API calls | **Selected** frontend; runs in the browser |
| Nginx gateway | Proxy the Angular development server and route `/api` requests to Laravel/PHP-FPM | **Selected** HTTP entry point; not an OC-mandated technology |
| Laravel REST API | JWT authentication, authorization, server-side input validation, business rules, share tokens and file streaming | **Selected** backend |
| PostgreSQL | Persist registered users, file metadata, share tokens and expiry timestamps | **Selected** database |
| Private file storage | Persist file contents outside the public web root; accessed only through Laravel | **Default:** local filesystem; **demonstration alternative:** isolated S3-compatible Garage |
| Scheduled cleanup | Remove expired file contents and corresponding metadata | **Required behaviour in US01**; Laravel command and scheduler in use |

Angular, Laravel, PostgreSQL and storage are at the core of this design. The scheduler runs the same Laravel code using `schedule:work`, without calling the API over HTTP. The default private `transfers` disk uses the local filesystem; the isolated Garage demonstration (HTTPS 8444) uses a private bucket through the S3 driver and a separate PostgreSQL database. The modes are alternatives for an instance; existing files are not migrated. See the [installation guide](installation.md). Docker Compose is the chosen development runtime, **not a separate business component or a required production platform**.

## Key flows

1. **Registration and authentication (US03, US04).** The user enters credentials in Angular. The API validates registration or login and issues a JWT on successful login. Angular sends the JWT on later protected API requests.
2. **Authenticated upload (US01).** Angular uploads file bytes and selected expiration via a protected REST request. Laravel validates authentication, the allowed size (maximum **1 GB**), permitted file types and expiry (no more than seven days); it stores bytes privately and metadata in PostgreSQL, then returns an unpredictable share token/link.
3. **Public download (US02).** The recipient opens the shared link without an account. Laravel validates its token and expiry, returns the required metadata (name, type, size, expiration), and streams the file through an API endpoint. Public clients never access private storage directly. For a password-protected file (US09), password verification precedes issuance of a relative signed URL valid for 60 seconds.
4. **Personal history and deletion (US05, US06).** Protected API calls list only the owner's files. Deleting a file requires frontend confirmation and an ownership check on the API; the stored bytes and metadata are removed.
5. **Expiry cleanup (US01).** The sender's expiration choice defaults to **seven days**, is bounded by the specification, and a scheduled process removes expired bytes and metadata. Expired links must not serve files even before the next cleanup run.

Routes, response structures and HTTP status codes are documented in [the API contract](api/README.md). Entity attributes, relationships and cardinalities belong to DESIGN-02.

## Trust boundaries and security principles

- The **client is untrusted**. Angular validation is for usability; Laravel repeats all security-sensitive validation.
- JWTs authenticate protected operations; public share tokens grant limited, time-bounded download access only.
- The storage volume/bucket is **private**. No direct public URL exposes uploaded bytes.
- Only the owner can view their private history or delete their files.
- Allowed file types are documented in [SECURITY](en/SECURITY.md).
- Public deployments must use HTTPS; local development may use HTTP on localhost.
- Secrets and credentials are configured outside the source code.

## Scope boundary

**Required MVP:** US01, US02, US03, US04, US05, US06.

**Delivered extensions:** US08 (private tags), US09 (per-file password), PROFILE-01, history pagination and OPS-03 (Garage). US07 (anonymous upload) is not implemented. US10 has no separate work package: expiry and daily cleanup are already implemented under US01.

The technical drawing must stay consistent with the conceptual model and OpenAPI contract produced in DESIGN-02 and DESIGN-03.

## Storage and database consistency

Manual deletion and cleanup use `TransferDeletion`: a PostgreSQL transaction locks the parent transfer (`FOR UPDATE`), then re-reads its files and, for cleanup, its expiry. Operations on the same transfer therefore serialize. Deleting the final file revokes the share; a download that already opened a file may finish.

Storage and the database do not form one atomic transaction. Already absent bytes allow metadata removal; storage failure preserves metadata for retry. If the database fails after byte removal, those bytes are not restored. Partial cleanup failure retains metadata for recovery. Cleanup continues for other transfers and reports failure with a nonzero exit code. SQLite tests do not demonstrate real PostgreSQL concurrency.

See [maintenance](en/MAINTENANCE.md) and [HIST-01 #57](https://github.com/jlbokass/datashare/issues/57): the current purge policy was retained without code changes. No production deployment is claimed.
