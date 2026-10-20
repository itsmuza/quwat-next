#!/bin/sh
# Run only after copying the reviewed release and rebuilding/recreating web.
set -eu

if [ "$(id -u)" -ne 0 ]; then
    echo "Run this server-only script with sudo." >&2
    exit 1
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
stack_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)
cd "$stack_root"

# Refuse to expose the old container or another service using the chosen ports.
docker compose --env-file secrets/compose.env -p quwat \
    -f frontend/deploy/compose.yaml exec -T web node -e \
    'if (require("next/package.json").version !== "16.4.2") { console.error("Rebuild and recreate Quwat web with Next 16.4.2 first."); process.exit(1); }'
curl --fail --silent --show-error --max-time 15 -I http://127.0.0.1:4100/ >/dev/null
test "$(curl --fail --silent --show-error --max-time 15 http://127.0.0.1:4107/)" = "Welcome Quwat API server!"
test -s /etc/letsencrypt/live/quwat.tech/fullchain.pem
test -s /etc/letsencrypt/live/quwat.tech/privkey.pem

for name in quwat-acme quwat-https; do
    test -s "$script_dir/nginx/$name.conf"
    test -f "/etc/nginx/sites-available/$name"
    test "$(readlink "/etc/nginx/sites-enabled/$name")" = "/etc/nginx/sites-available/$name"
done
nginx -t

umask 077
backup=$(mktemp -d /etc/nginx/quwat-backup-XXXXXXXX)
for name in quwat-acme quwat-https; do
    cp -p "/etc/nginx/sites-available/$name" "$backup/$name"
done

changed=0
success=0
finish() {
    result=$?
    trap - EXIT
    if [ "$changed" -eq 1 ] && [ "$success" -ne 1 ]; then
        echo "Restoring the two Quwat configurations from $backup" >&2
        for name in quwat-acme quwat-https; do
            cp -p "$backup/$name" "/etc/nginx/sites-available/$name"
        done
        if nginx -t; then
            systemctl reload nginx || echo "Nginx reload failed; inspect its status." >&2
        fi
    fi
    exit "$result"
}
trap finish EXIT

changed=1
for name in quwat-acme quwat-https; do
    install -m 644 "$script_dir/nginx/$name.conf" "/etc/nginx/sites-available/$name"
done
nginx -t
systemctl reload nginx
success=1
echo "OK: Quwat public routes enabled. Previous configurations: $backup"
