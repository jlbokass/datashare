#!/usr/bin/env bash
# Optional database explorer. No migrations, published DB ports or DB restarts.
set -euo pipefail
cd -- "$(dirname -- "$0")/.."

compose() {
  docker compose -p datashare-pgadmin -f compose.pgadmin.yaml "$@"
}

# Connect only the running database with the exact Compose project/service labels.
# Each database has its own access network, so "db" aliases never collide.
access_db() {
  local action="$1" project="$2" target="$3" container network
  network="datashare-pgadmin-$target"
  container="$(docker ps -q \
    --filter "label=com.docker.compose.project=$project" \
    --filter 'label=com.docker.compose.service=db')"

  if [[ -z "$container" ]]; then
    printf '%s\n' "$target: database not running (skipped)."
    return
  fi
  if [[ "$container" == *$'\n'* ]]; then
    printf '%s\n' "$target: multiple database containers; refusing an ambiguous connection." >&2
    return 1
  fi

  local attached
  attached="$(docker inspect --format "{{if index .NetworkSettings.Networks \"$network\"}}yes{{end}}" "$container")"
  if [[ "$action" == up && "$attached" != yes ]]; then
    docker network connect --alias "$target-db" "$network" "$container"
  elif [[ "$action" == stop && "$attached" == yes ]]; then
    docker network disconnect "$network" "$container"
  fi
  printf '%s\n' "$target: $action complete."
}

if [[ $# -ne 1 ]]; then
  echo 'Usage: bash scripts/pgadmin.sh up|stop' >&2
  exit 2
fi

case "$1" in
  up)
    if [[ ! -e .env.pgadmin && ! -L .env.pgadmin ]]; then
      command -v openssl >/dev/null || { echo 'OpenSSL is required.' >&2; exit 1; }
      umask 077
      password="$(openssl rand -hex 24)"
      (set -C; printf 'PGADMIN_DEFAULT_PASSWORD=%s\n' "$password" > .env.pgadmin)
      echo 'Created .env.pgadmin with a dedicated local password.'
    fi
    compose up -d pgadmin
    ;;
  stop)
    if [[ ! -f .env.pgadmin ]]; then
      echo 'Missing .env.pgadmin; cannot resolve the pgAdmin Compose configuration.' >&2
      exit 1
    fi
    compose stop pgadmin
    ;;
  *)
    echo 'Usage: bash scripts/pgadmin.sh up|stop' >&2
    exit 2
    ;;
esac

access_db "$1" datashare-p3 app
access_db "$1" datashare-garage garage
access_db "$1" datashare-ql02-test test

if [[ "$1" == up ]]; then
  printf '%s\n' 'pgAdmin: http://127.0.0.1:8082' 'Login: admin@example.com; password in .env.pgadmin.'
fi
