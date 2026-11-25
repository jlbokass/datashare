#!/usr/bin/env bash
# Generate separate local demo credentials once; never overwrite existing keys.
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

if [[ -e .env.garage || -L .env.garage ]]; then
  printf '%s\n' 'Existing .env.garage preserved.'
  exit 0
fi

command -v openssl >/dev/null || { echo 'OpenSSL is required.' >&2; exit 1; }
umask 077
postgres_password="$(openssl rand -hex 32)"
app_key="$(openssl rand -base64 32)"
jwt_secret="$(openssl rand -hex 32)"
rpc_secret="$(openssl rand -hex 32)"
access_key="GK$(openssl rand -hex 16)"
secret_key="$(openssl rand -hex 32)"

# noclobber protects against an accidental concurrent invocation.
(
  set -C
  printf '%s\n' \
    'POSTGRES_DB=datashare_garage' \
    'POSTGRES_USER=datashare_garage' \
    "POSTGRES_PASSWORD=$postgres_password" \
    "GARAGE_APP_KEY=base64:$app_key" \
    "GARAGE_JWT_SECRET=$jwt_secret" \
    "GARAGE_RPC_SECRET=$rpc_secret" \
    "GARAGE_DEFAULT_ACCESS_KEY=$access_key" \
    "GARAGE_DEFAULT_SECRET_KEY=$secret_key" > .env.garage
)
printf '%s\n' 'Created .env.garage with independent local credentials.'
