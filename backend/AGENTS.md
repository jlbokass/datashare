# DataShare — Laravel backend rules

Read and follow the repository-root `AGENTS.md` before changing this backend.

- Keep controllers thin, validation in Form Requests and business logic in
  services/actions. Respect existing Laravel conventions.
- Do not install prerequisites, Laravel Boost or other dependencies unless
  the developer explicitly authorizes that work.
- From the repository root, `bash scripts/qa.sh backend` is the authorized
  local backend test and Pint procedure. Use the existing QA script for
  other supported scopes as documented in the root instructions.
- Never run PHPUnit or Artisan tests in the running `app` or `scheduler`
  services. Their PostgreSQL environment is not a test environment.
- Never substitute an execution environment to bypass sandbox restrictions.
  If QA is blocked, stop validation, report the blocker and ask the developer
  to run the same QA command. Do not fall back to host PHP or container exec.
- Laravel tests must extend `Tests\TestCase`, which checks loaded and resolved
  configuration before database test traits run. Pure unit tests may extend
  PHPUnit's base test case only if they do not bootstrap the application or
  access a database. Keep tests on uncached `testing` + SQLite `:memory:`.
- Do not bypass the guard, introduce additional database connections in tests,
  or change database configuration after the guard has run.
- Never execute destructive database commands, resets, destructive seeders or
  volume removal without explicit authorization. The QA procedure authorizes
  only test migrations against the guarded SQLite in-memory database.
