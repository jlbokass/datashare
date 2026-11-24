# DataShare — Agent operating rules

This is the repository-wide context for AI coding agents. Work from the Git
repository root. For Laravel-specific conventions and test safety, also read
`backend/AGENTS.md`.

## Project and scope

- OpenClassrooms P3: Laravel 13 / PHP backend, Angular 22 frontend,
  PostgreSQL, private file storage, Docker Compose development.
- Mandatory MVP: US01–US06; optional US07–US10 are not silently added.
- Branch workflow: feature branch -> reviewed PR into `develop` ->
  separate reviewed release PR into `main`.
- Treat `docs/api/openapi.yaml`, the GitHub issues, and the OC specification
  as requirements; reconcile documentation with implemented behavior.

## Outcome-first delivery and productivity

- Begin with the user's objective and documented acceptance criteria. Distinguish **required**, **risk-justified**, and **optional** work; never promote an optional technical experiment into a release gate.
- Choose the smallest sufficient solution and validation level. Reuse existing tools and tests; avoid extra frameworks, infrastructure, documents, scenarios, or diagnostics without a clear return on effort.
- Define the stopping condition before implementation. Once requirements are met and no critical defect remains, finish the task rather than expanding its scope.
- Ground debugging in observed evidence, clearly separating facts and hypotheses. If an investigation becomes disproportionate, reassess the business value and offer the simpler compliant option.
- Prefer focused changes, brief reviews, and actionable results. Manual acceptance is appropriate where automation has lower value than its construction and maintenance cost. Automate repetitive, critical paths.
- Do not change unrelated code or force additional work solely to exercise a tool. Keep the developer in control of trade-offs and decisions.

## Safety rules

- Keep uploads on the private `transfers` disk; never expose storage paths.
- Public share URLs are capabilities separate from login JWTs. Public
  endpoints must not require JWT, must check token and expiry, and must
  reject access to files from another transfer.
- Force downloads as attachments. Do not execute, unpack or preview
  untrusted ZIP content. ZIPs are not antivirus-scanned.
- Do not add password protection without implementing and testing US09.
- Never reveal, commit, rotate or overwrite real secrets, `.env`, private
  uploads or production data.
- Never execute destructive database/volume commands (including
  `migrate:fresh`, `migrate:refresh`, `db:wipe`, destructive seeders and
  `docker compose down -v`) without explicit authorization. Test commands
  using `RefreshDatabase` also reset their selected database; only the
  guarded SQLite in-memory database is authorized for local automated tests.
- During merges inspect both sides; do not resolve conflicts by blindly
  replacing a file. Check registered API routes after route-file changes.
- Do not commit, push, merge PRs, deploy or alter branch protection without
  developer authorization.

## Development / QA workflow

- At the start: inspect `git status`, current branch and upstream.
- Prefer minimal, tested changes on the active task; do not hide failures by
  deleting tests or weakening assertions.
- The existing QA script is the authorized local test procedure.
  Run `bash scripts/qa.sh us02` for US02, `bash scripts/qa.sh backend`
  for Laravel checks, `bash scripts/qa.sh frontend` for Angular, or
  `bash scripts/qa.sh all` before proposing a merge.
- `bash scripts/qa.sh status` fetches remote refs and reports whether local
  HEAD, remote branch and working tree are synchronized.
- The QA script writes logs outside the Git worktree, under
  `${TMPDIR:-/tmp}/datashare-qa/` unless `DATASHARE_QA_LOG_DIR` is set.
- Local tests using SQLite do not replace PostgreSQL/browser acceptance
  tests. Never claim that Docker, CI or E2E passed when unverified.
- Never run PHPUnit or Artisan tests inside the running `app` or
  `scheduler` services, even if PHPUnit declares a testing environment.
- Never substitute an execution environment to bypass sandbox restrictions
  (including direct container execution or host PHP as a QA fallback).
- If the authorized QA procedure is blocked, stop validation, report the
  blocker and ask the developer to run the exact QA command outside the
  sandbox. Do not claim tests passed or clear a configuration cache to
  bypass the test guard.
- Summarize root cause, files changed, commands, pass/fail counts, any
  limitations, and outstanding decisions. Never infer green CI from local
  test results.

## Documentation

- Maintain EN/FR project documentation and the AI development journal when
  functionality changes; distinguish verified evidence from plans.
- Leave Figma parity and advanced features tracked in their own issues.
