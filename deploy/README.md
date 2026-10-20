# Quwat — shared Ubuntu server deployment

Target: `quwat.tech` / `api.quwat.tech`. Existing host Nginx forwards to loopback-only ports `4100` (web) and `4107` (API). Compose project name is `quwat`; its bridge network and services are separate from the existing Creatorhub project. Docker daemon access itself is privileged and is not a security boundary between server administrators.

Container setup and public-route activation are separate steps. `activate-nginx.sh` explicitly publishes only Quwat's routes after verifying the upgraded web container and private endpoints; preparation/build commands do not publish routes. No step initializes a database or starts the batch worker.

## Server directory layout

```text
/home/muza/quwat-deploy/
├── frontend/                  # itsmuza/quwat-next, develop
│   └── deploy/                # these deployment files
├── backend/                   # itsmuza/quwat, develop
├── secrets/
│   ├── compose.env            # generated UID/GID only
│   └── backend.env            # private production Nest environment
└── shared/
    └── uploads/               # persistent original relative upload paths
```

Both repositories have already been cloned. Copy this `deploy` directory from your Mac to the server; this does not require a Git commit or push. Run on the Mac, from the frontend repository:

```bash
scp -r deploy muza@179.197.240.195:~/quwat-deploy/frontend/
```

## Prepare directories and private configuration

Run on the server as `muza`, without sudo:

```bash
cd ~/quwat-deploy
sh frontend/deploy/prepare.sh
```

This records the deployment user's numeric UID/GID for non-root containers. The existing production environment is never overwritten by the script. Copy the private backend environment from your Mac, from the frontend repository:

```bash
scp ../quwat/.env.production.local muza@179.197.240.195:~/quwat-deploy/secrets/backend.env
```

The file must select `quwat_prod` via `MONGO_PROD` and include the existing production `SECRET_TOKEN`. Do not use the development `.env`, print the secret values, commit them, or regenerate the signing key on each deploy. The file is mounted read-only and parsed by the existing Nest ConfigModule; its values do not become Docker build arguments or image layers.

Run the preparation script again on the server to enforce file permissions:

```bash
cd ~/quwat-deploy
sh frontend/deploy/prepare.sh
```

Add server IP `179.197.240.195` to the appropriate Atlas IP access list. This is separate from the database user's existing permissions. Database namespace/user isolation, required indexes and a current backup must be checked before starting against production. Do not rerun the database-copy script against an existing production database.

Copy the required uploaded images to `shared/uploads/`, retaining paths such as `product/...` and `member/...`. The verified production backup contains an uploads snapshot; use that or verify that the current local uploads still contain every production reference. An additive copy from the current backend directory can be performed on the Mac:

```bash
rsync -a ../quwat/uploads/ muza@179.197.240.195:~/quwat-deploy/shared/uploads/
```

Do not use `--delete`. Files must remain readable/writable by `muza`; the containers use the same numeric UID/GID. Back up both MongoDB data and this directory during operation.

## Validate, build sequentially and test private ports

Run on the server from `~/quwat-deploy`. Use the full file/project options for every command, so only this stack is targeted. `config --quiet` does not display the private environment file.

```bash
sudo docker compose --env-file secrets/compose.env -p quwat -f frontend/deploy/compose.yaml config --quiet
sudo docker compose --env-file secrets/compose.env -p quwat -f frontend/deploy/compose.yaml build api
sudo docker compose --env-file secrets/compose.env -p quwat -f frontend/deploy/compose.yaml build web
```

Frontend installation uses Yarn's existing lockfile; backend installation uses its existing npm lockfile. Both images use Node 22 on Debian slim. Frontend API/GraphQL/WebSocket URLs are supplied at build time and are not read from copied local `.env` files. Rebuild the web image whenever these public URLs change. Secrets, host dependencies and existing build output are excluded by Dockerfile-specific ignore files.

Start only after the production environment, backup, Atlas access and database prerequisites have been verified:

```bash
sudo docker compose --env-file secrets/compose.env -p quwat -f frontend/deploy/compose.yaml up -d --wait --wait-timeout 180
sudo docker compose --env-file secrets/compose.env -p quwat -f frontend/deploy/compose.yaml ps
curl --fail --show-error http://127.0.0.1:4107/
curl --fail --show-error -I http://127.0.0.1:4100/
```

The API root should return `Welcome Quwat API server!`; frontend should return HTTP 200. The web container waits for API health. These checks confirm process startup and private HTTP delivery, not database transactions, uploads, browser API calls or WSS connectivity through the final domains. Host ports are loopback-only. Browser requests in the built frontend use `api.quwat.tech`, which will work after its HTTPS route is configured.

Runtime defaults are one instance per service, up to one CPU and 1 GiB RAM each, restart-unless-stopped, non-root execution and rotated per-container logs. These are initial limits for the shared 2-CPU/8-GB host; review actual utilization after deployment. Build workloads are separate from runtime limits and are deliberately run sequentially. `unhealthy` reports a failing healthcheck; Docker's restart policy restarts a process that exits, not an otherwise running unhealthy process.

For troubleshooting, view logs locally on the server and redact any credentials/private member details before sharing:

```bash
sudo docker compose --env-file secrets/compose.env -p quwat -f frontend/deploy/compose.yaml logs --tail 80 api web
```

## Before enabling public Nginx routes

- Rebuild/recreate the web container with the prepared Next.js 16.4.2 release. The old 14.2.0 image must not be exposed. The activation script checks the actual running container version. See `docs/DEPLOYMENT_RELEASE.md` for compatibility changes and checks.
- The API remains bound to loopback. `nginx/quwat-https.conf` rejects browser Origin values other than `https://quwat.tech` and `https://www.quwat.tech` for both HTTP/preflight and WebSocket upgrades. Requests without Origin remain allowed for CLI/server clients and still require existing application authentication where applicable. Backend development CORS remains unchanged; do not publish the API port or bypass this production proxy.
- Confirm production agent attendance setup and actual required unique indexes. Initialize only missing enrollment dates when necessary, after explicitly selecting production. Test stock reservation/approval races in a separate test database.
- Verify successful public `/graphql`, `/uploads/...`, multipart uploads, login/role controls, cart and WSS notifications/chat. Keep the existing API and business rules.
- Add dedicated Nginx virtual hosts for Quwat, preserving existing sites. API proxy needs WebSocket Upgrade/Connection forwarding, a suitable idle timeout, upload-size settings and access logs that omit query arguments: the current WebSocket URL contains a token.
- Configure A records `@` and `api` to `179.197.240.195`, optional CNAME `www` to `quwat.tech`, and valid TLS certificates. Use Cloudflare Full (strict) after origin TLS is valid. Check the Cloudflare plan's upload limits before enabling its proxy; proxy and backend multipart limits must agree.

The user has now built/started both images, confirmed API welcome/frontend HTTP 200 on private ports, activated Cloudflare nameservers/DNS and obtained a certificate covering root/www/api. Dedicated `quwat-acme` and `quwat-https` hosts currently serve maintenance responses; HTTPS verification returned the expected 503 without certificate errors. A Quwat-scoped Certbot deploy hook reloads Nginx after renewal. Certificate renewal dry-run and final public browser verification remain to be performed.

After copying this reviewed release, rebuild and recreate **web** with the same Compose options shown above. Keep a tag of the previous image before building. Then run on the server:

```bash
cd ~/quwat-deploy
sudo sh frontend/deploy/activate-nginx.sh
```

The script requires the existing two Quwat symlinks, checks private endpoints and the running Next version, backs up only those two virtual hosts, installs the reviewed templates, tests all Nginx configuration and reloads. If installation/testing/reload fails, it restores those two files. It never replaces the host's main config or touches other projects' virtual hosts. Actual Nginx syntax/runtime behavior must be verified on the server; local fixture checks cover the activation script's safety/rollback branches, not the Nginx parser.

API access logs omit query arguments because WebSocket URLs include tokens. Nginx error logs may still include request details on failures; restrict access and redact before sharing. The 160 MiB origin body limit allows the existing 10 × 15 MB multipart maximum with overhead. Cloudflare Free's proxied upload limit can be lower; leave API DNS-only until that limit is reconciled with intended uploads. Use Full (strict) when enabling Cloudflare's proxy. Do not start additional API replicas without coordinating in-memory chat state.

Read-only public checks after activation:

```bash
curl -fsSI https://quwat.tech/
curl -fsS https://api.quwat.tech/
curl -sSI https://www.quwat.tech/
curl -sSI -H 'Origin: https://untrusted.example' https://api.quwat.tech/graphql
curl -sSi -X OPTIONS https://api.quwat.tech/graphql -H 'Origin: https://quwat.tech' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: authorization,content-type,x-quwat-guest-id'
sudo certbot renew --cert-name quwat.tech --dry-run --run-deploy-hooks
```

Expected: frontend 200, API welcome, www redirect to root, untrusted Origin 403, allowed preflight 204 with matching allow-origin/credentials/headers. Then verify actual catalog/uploads, client login and WSS in the browser. Do not create real orders or alter production data merely to test deployment.

## Updates and rollback

Record both repository commit IDs and retain the previous working images before rebuilding. Build the selected release first, then recreate only Quwat services. Rollback must restore the matching previous images while preserving `secrets` and `shared/uploads`; it must not restore stale database data over new purchases. Never use a global Docker prune or delete shared volumes as a deployment shortcut.

## Local preparation checks

Verified during preparation on 2026-10-20: frontend typecheck, parsed Compose YAML and secret/loopback mount settings, preparation-script syntax and isolated behavior (missing repositories, root refusal, repeated execution, preservation of existing secrets and private permissions), a frontend production build with the three real public Quwat API URLs and no local environment files, and an isolated Nest API build. Both application builds passed.

The preparation machine has no Docker CLI/engine. The user subsequently reported successful actual Docker image builds, production database read-only connectivity (`quwat_prod`, 27 products), 56 copied upload files and private container responses. These reports do not establish final public GraphQL/upload/WSS or transaction correctness. The frontend framework upgrade is prepared locally and must still be copied/rebuilt on the server before public activation; backend code, credentials and database contents are unchanged by that upgrade.

## Public activation status — 2026-10-20

The user has now copied the reviewed Next 16 release, completed the Linux web image rebuild and activated Quwat's routes. Independent verified-TLS checks passed for root/API HTTPS, canonical www redirect, allowed CORS preflight and rejected foreign Origin, the read-only public catalog (27 products), all 27 referenced product images, and guest WSS connection/rejected foreign-origin WSS. Real Chrome desktop homepage and 390px single-column mobile catalog rendered without captured browser errors or document overflow. See `docs/DEPLOYMENT_RELEASE.md` for detailed evidence and remaining limits.

The Quwat-scoped Certbot renewal dry-run and normal authenticated account/role/notification checks remain. No production mutation or database-backed concurrency test was performed. The release package was copied manually; repository changes have not been committed or pushed by the agent.
