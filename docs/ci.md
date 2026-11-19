---
layout: default
title: "DataShare — GitHub Actions CI"
permalink: /ci.html
lang: en
---

# CI-01 — Automated quality checks

[**Français**](ci.fr.md) · [Technical documentation](index.md)

**Status on 19 November 2026: both workflows are merged into `develop` and check every PR targeting `develop` or `main`.** Badges track actual runs on the `develop` branch.

On the latest functional User Story [PR #46](https://github.com/jlbokass/datashare/pull/46): [Backend CI](https://github.com/jlbokass/datashare/actions/runs/44446701173) **52 Laravel tests, 364 assertions and Pint passed**; [Frontend CI](https://github.com/jlbokass/datashare/actions/runs/44446701083) **44 Angular tests and the production build passed**. These are GitHub Actions results, not measured code coverage or a security audit.

## Active workflows

| GitHub Actions workflow | Stable job/check name | What it runs |
| --- | --- | --- |
| [Backend CI](https://github.com/jlbokass/datashare/blob/develop/.github/workflows/backend-ci.yml) | `Backend / Tests and style` | PHP 8.4, Composer manifest/lock validation, `composer install`, ephemeral `APP_KEY`, Laravel tests with SQLite in memory, Pint formatting |
| [Frontend CI](https://github.com/jlbokass/datashare/blob/develop/.github/workflows/frontend-ci.yml) | `Frontend / Tests and build` | Node.js 24, `npm ci`, Angular tests (`--watch=false`), production build |

Both checks trigger on **all pull requests targeting `develop` or `main`**, plus pushes to these branches and manual dispatch. No path filters are used so the eventual required checks do not disappear on documentation-only PRs. Runs use minimal `contents: read` permissions, no production credentials, and may cancel older runs on the same ref.

**Limitation:** Laravel CI currently uses **SQLite**, not a live PostgreSQL service. Browser E2E, private file uploads against real storage, real large-file testing, security scans, coverage and performance benchmarks remain separate quality tasks. Keep those limitations explicit in [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.md).

## QL-01 coverage extension — CI reports and artifacts verified

[PR #50](https://github.com/jlbokass/datashare/pull/50) adds PCOV/Clover/HTML/text for Laravel and V8/HTML/LCOV/JSON coverage for Angular, preserving job names, Pint and production build. **Measured in GitHub Actions on 19 November 2026:** [Backend CI #44536846489](https://github.com/jlbokass/datashare/actions/runs/44536846489) **96.36% line coverage (318/330), 52 tests/364 assertions**; [Frontend CI #44536846492](https://github.com/jlbokass/datashare/actions/runs/44536846492) **79.58% line coverage, 44 tests and successful build**. Downloadable reports are attached for 14 days (expire 3 December 2026). No threshold or external service. See [scope and limits](coverage.md).

## Release and CD

GitHub Pages already deploys static `main/docs` after release merges; this is a separate **documentation CD** process, not an application deploy. Laravel, PostgreSQL and Angular have **no approved production environment/CI-CD deployment job** yet.

Workflow: `feature/ci branch → PR develop → CI green → review/merge develop → release PR main → CI green → review/merge main → GitHub Pages rebuild`.

After the first confirmed green runs, a repository owner should configure protected `main` to require **Backend / Tests and style** and **Frontend / Tests and build** (and `develop` where useful). Do not enable strict required checks prematurely while their workflow has never succeeded or branch-rules are unverified. Check names must match the actual GitHub UI jobs.

## Evidence to capture

For CI-01 and OC assessment: PR number, head SHA, Actions run URLs, pass/fail per job, corrected failures, and screenshots only after execution. Avoid committing tokens, logs with secrets or fabricated badges.
