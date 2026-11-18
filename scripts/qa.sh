#!/usr/bin/env bash
# DataShare — repeatable local QA (no writes to the Git worktree).
set -uo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

usage() {
  cat <<'HELP'
Usage: bash scripts/qa.sh <status|us02|backend|frontend|all>

  status    Fetch remote refs and compare local HEAD/working tree to origin
  us02      Laravel PublicShareTest + Angular tests and production build
  backend   Full Laravel tests + Pint style check
  frontend  Angular tests + production build
  all       Full Laravel/Pint + Angular tests/build

Logs: ${DATASHARE_QA_LOG_DIR:-${TMPDIR:-/tmp}/datashare-qa/<timestamp>}
The script never commits, pushes, merges or modifies databases/volumes.
HELP
}

check_git_status() {
  local branch remote_only local_only dirty
  branch="$(git symbolic-ref --quiet --short HEAD)" || {
    echo "ERROR: detached HEAD (no active branch)" >&2
    return 2
  }
  echo "Branch: $branch"
  if ! git fetch origin --prune; then
    echo "ERROR: cannot refresh remote refs" >&2
    return 2
  fi
  if ! git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
    echo "ERROR: origin/$branch does not exist; publish the branch after review" >&2
    return 2
  fi
  read -r remote_only local_only <<< "$(git rev-list --left-right --count "origin/$branch...HEAD")"
  printf 'Local HEAD:  %s\n' "$(git rev-parse --short HEAD)"
  printf 'Remote HEAD: %s\n' "$(git rev-parse --short "origin/$branch")"
  printf 'Remote-only commits: %s | Local-only commits: %s\n' "$remote_only" "$local_only"
  dirty="$(git status --porcelain)"
  if [[ -n "$dirty" ]]; then
    echo "Working tree has uncommitted/untracked changes:"
    printf '%s\n' "$dirty"
  else
    echo "Working tree: clean"
  fi
  if [[ "$remote_only" == "0" && "$local_only" == "0" && -z "$dirty" ]]; then
    echo "SYNCED: local branch and origin are identical"
    return 0
  fi
  echo "NOT SYNCED: review, commit and push local changes as appropriate"
  return 1
}

MODE="${1:-help}"
case "$MODE" in
  help|-h|--help) usage; exit 0 ;;
  status) check_git_status; exit $? ;;
  us02|backend|frontend|all) ;;
  *) usage >&2; exit 2 ;;
esac

LOG_DIR="${DATASHARE_QA_LOG_DIR:-${TMPDIR:-/tmp}/datashare-qa/$(date +%Y%m%d-%H%M%S)-$$}"
mkdir -p "$LOG_DIR" || exit 2
SUMMARY="$LOG_DIR/summary.txt"
: > "$SUMMARY"
failures=0

run_check() {
  local label="$1"
  shift
  printf '\n[RUN] %s\n' "$label"
  if "$@" > "$LOG_DIR/$label.log" 2>&1; then
    printf '[PASS] %s\n' "$label"
    printf 'PASS\t%s\n' "$label" >> "$SUMMARY"
  else
    local exit_code="$?"
    failures=$((failures + 1))
    printf '[FAIL] %s (exit %s)\n' "$label" "$exit_code"
    printf 'FAIL\t%s (exit %s)\n' "$label" "$exit_code" >> "$SUMMARY"
    echo "Last 25 log lines:"
    tail -n 25 "$LOG_DIR/$label.log"
  fi
}

backend_tests() {
  run_check backend-tests docker compose run --rm php sh -lc 'cd backend && php artisan test'
  run_check backend-pint docker compose run --rm php sh -lc 'cd backend && ./vendor/bin/pint --test'
}

frontend_tests() {
  run_check frontend-tests docker compose run --rm node sh -lc 'cd frontend && npm test -- --watch=false'
  run_check frontend-build docker compose run --rm node sh -lc 'cd frontend && npm run build'
}

case "$MODE" in
  us02)
    run_check us02-public-share docker compose run --rm php sh -lc 'cd backend && php artisan test --filter=PublicShareTest'
    frontend_tests
    ;;
  backend) backend_tests ;;
  frontend) frontend_tests ;;
  all)
    backend_tests
    frontend_tests
    ;;
esac

printf '\nQA summary:\n'
cat "$SUMMARY"
printf 'Full logs: %s\n' "$LOG_DIR"
if [[ "$failures" -gt 0 ]]; then
  printf '%s check(s) failed.\n' "$failures" >&2
  exit 1
fi
echo "All selected checks passed."
