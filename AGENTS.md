# DataShare — Agent operating rules

This is the repository-wide context for AI coding agents. Work from the Git
repository root. For Laravel-specific conventions, also read any generated
`backend/AGENTS.md` / Laravel Boost guidance if Boost is installed.

## Project and scope

- OpenClassrooms P3: Laravel 13 / PHP backend, Angular 22 frontend,
  PostgreSQL, private file storage, Docker Compose development.
- Mandatory MVP: US01–US06; optional US07–US10 are not silently added.
- Branch workflow: feature branch -> reviewed PR into `develop` ->
  separate reviewed release PR into `main`.
- Treat `docs/api/openapi.yaml`, the GitHub issues, and the OC specification
  as requirements; reconcile documentation with implemented behavior.

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
  `migrate:fresh` and `docker compose down -v`) without explicit approval.
- During merges inspect both sides; do not resolve conflicts by blindly
  replacing a file. Check registered API routes after route-file changes.
- Do not commit, push, merge PRs, deploy or alter branch protection without
  developer authorization.

## Development / QA workflow

- At the start: inspect `git status`, current branch and upstream.
- Prefer minimal, tested changes on the active task; do not hide failures by
  deleting tests or weakening assertions.
- Run `bash scripts/qa.sh us02` for US02, `bash scripts/qa.sh backend`
  for Laravel checks, `bash scripts/qa.sh frontend` for Angular, or
  `bash scripts/qa.sh all` before proposing a merge.
- `bash scripts/qa.sh status` fetches remote refs and reports whether local
  HEAD, remote branch and working tree are synchronized.
- The QA script writes logs outside the Git worktree, under
  `${TMPDIR:-/tmp}/datashare-qa/` unless `DATASHARE_QA_LOG_DIR` is set.
- Local tests using SQLite do not replace PostgreSQL/browser acceptance
  tests. Never claim that Docker, CI or E2E passed when unverified.
- If Docker is blocked by an agent sandbox, report that limitation and let
  the developer execute the exact command outside the sandbox.
- Summarize root cause, files changed, commands, pass/fail counts, any
  limitations, and outstanding decisions. Never infer green CI from local
  test results.

## Documentation

- Maintain EN/FR project documentation and the AI development journal when
  functionality changes; distinguish verified evidence from plans.
- Leave Figma parity and advanced features tracked in their own issues.
