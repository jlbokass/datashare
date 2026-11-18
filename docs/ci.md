---
layout: default
title: "DataShare — GitHub Actions CI"
permalink: /ci.html
lang: en
---

# CI-01 — Automated quality checks

[**Français**](ci.fr.md) · [Technical documentation](index.md)

**Status: proposed in a Draft PR, awaiting the first GitHub Actions execution. No green CI results are claimed yet.**

## Planned workflows

| GitHub Actions workflow | Stable job/check name | What it runs |
| --- | --- | --- |
| [Backend CI](https://github.com/jlbokass/datashare/blob/ci/github-actions-quality-gates/.github/workflows/backend-ci.yml) | `Backend / Tests and style` | PHP 8.4, Composer manifest/lock validation, `composer install`, ephemeral `APP_KEY`, Laravel tests with SQLite in memory, Pint formatting |
| [Frontend CI](https://github.com/jlbokass/datashare/blob/ci/github-actions-quality-gates/.github/workflows/frontend-ci.yml) | `Frontend / Tests and build` | Node.js 24, `npm ci`, Angular tests (`--watch=false`), production build |

Both checks trigger on **all pull requests targeting `develop` or `main`**, plus pushes to these branches and manual dispatch. No path filters are used so the eventual required checks do not disappear on documentation-only PRs. Runs use minimal `contents: read` permissions, no production credentials, and may cancel older runs on the same ref.

**Limitation:** Laravel CI currently uses **SQLite**, not a live PostgreSQL service. Browser E2E, private file uploads against real storage, real large-file testing, security scans, coverage and performance benchmarks remain separate quality tasks. Keep those limitations explicit in [TESTING](https://github.com/jlbokass/datashare/blob/develop/TESTING.md).

## Release and CD

GitHub Pages already deploys static `main/docs` after release merges; this is a separate **documentation CD** process, not an application deploy. Laravel, PostgreSQL and Angular have **no approved production environment/CI-CD deployment job** yet.

Workflow: `feature/ci branch → PR develop → CI green → review/merge develop → release PR main → CI green → review/merge main → GitHub Pages rebuild`.

After the first confirmed green runs, a repository owner should configure protected `main` to require **Backend / Tests and style** and **Frontend / Tests and build** (and `develop` where useful). Do not enable strict required checks prematurely while their workflow has never succeeded or branch-rules are unverified. Check names must match the actual GitHub UI jobs.

## Evidence to capture

For CI-01 and OC assessment: PR number, head SHA, Actions run URLs, pass/fail per job, corrected failures, and screenshots only after execution. Avoid committing tokens, logs with secrets or fabricated badges.
