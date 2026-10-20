#!/bin/sh
set -eu

deploy_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
stack_root=$(CDPATH= cd -- "$deploy_dir/../.." && pwd)
app_uid=$(id -u)
app_gid=$(id -g)

if [ "$app_uid" -eq 0 ] || [ "$app_gid" -eq 0 ]; then
  printf '%s\n' 'Run this script as muza, without sudo.' >&2
  exit 1
fi
if [ ! -f "$stack_root/frontend/package.json" ] || [ ! -f "$stack_root/backend/package-lock.json" ]; then
  printf '%s\n' 'Expected frontend/ and backend/ repositories under the same quwat-deploy directory.' >&2
  exit 1
fi

umask 077
mkdir -p "$stack_root/secrets" "$stack_root/shared/uploads"
chmod 700 "$stack_root/secrets"
if [ ! -w "$stack_root/shared/uploads" ]; then
  printf '%s\n' 'The deployment user must be able to write shared/uploads. Check its ownership.' >&2
  exit 1
fi

compose_env=$(mktemp "$stack_root/secrets/.compose.env.XXXXXX")
trap 'rm -f "$compose_env"' EXIT HUP INT TERM
printf 'QUWAT_UID=%s\nQUWAT_GID=%s\n' "$app_uid" "$app_gid" > "$compose_env"
chmod 600 "$compose_env"
mv "$compose_env" "$stack_root/secrets/compose.env"

if [ -f "$stack_root/secrets/backend.env" ]; then
  chmod 600 "$stack_root/secrets/backend.env"
  printf '%s\n' 'Backend environment file found; its contents were preserved.'
else
  printf '%s\n' 'Next: securely copy the existing production backend environment to secrets/backend.env.'
fi
printf '%s\n' 'Quwat directories and non-root container UID/GID configuration are ready.'
