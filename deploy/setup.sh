#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -e .env ]]; then
  printf '%s\n' '.env already exists; kept existing credentials.'
  exit 0
fi

random_hex() {
  od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
}

# Keep generated secrets out of terminal output, shell history, and Git.
umask 077
set -o noclobber
{
  printf 'MYSQL_ROOT_PASSWORD=%s\n' "$(random_hex)"
  printf 'MYSQL_PASSWORD=%s\n' "$(random_hex)"
  printf 'JWT_SECRET=%s\n' "$(random_hex)"
  printf 'HTTP_BIND=127.0.0.1\nHTTP_PORT=8080\n'
} > .env
printf '%s\n' '.env created (permissions 600). Local check: http://127.0.0.1:8080'
