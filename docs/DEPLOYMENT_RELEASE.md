# Production release preparation — 2026-10-20

Base frontend commit: `cae036e`. Prepared locally; not committed, pushed or deployed automatically. The user operates the remote SSH session.

## Changes

- `package.json`, `yarn.lock`: Next 14.2.0 → 16.4.2, TypeScript 4.6.2 → 5.9.3, matching Next ESLint config and compatible ESLint 9.39.5. React/ReactDOM 18.2, Pages Router, Apollo, URLs/auth/business logic and existing UI are preserved. Dev/build explicitly use Webpack. Node 22 remains the deployment runtime.
- `.eslintrc.json` → `eslint.config.mjs`: use ESLint CLI because Next 16 removed `next lint`; builds no longer run lint implicitly. Keep the prior hooks/dependency/JSX checks. New compiler-oriented `set-state-in-effect` and `immutability` rules are disabled to retain existing synchronization and imperative carousel behavior during this framework-only release. React Compiler is not enabled.
- `tsconfig.json`: adopt the bundler resolver and automatic JSX runtime required by Next 16. `libs/types/swiper.d.ts` reuses Swiper 8's own exported public types for the four runtime modules already imported by the app; it compensates for Swiper 8's missing root declaration export without an `any` shim, runtime alias, carousel upgrade or disabled typechecking.
- Explicit event parameter types in `Top`, `LanguageMenu`, `LayoutAdmin`, and `pages/cs`; no changed event behavior.
- `deploy/nginx/*.conf`: dedicated HTTP ACME/HTTPS redirects, canonical www redirect, frontend/API reverse proxy, restricted production browser origins, WSS forwarding/timeouts and API access logs without query arguments. Backend CORS code is unchanged and remains private behind this allowlist.
- `deploy/activate-nginx.sh`: require the running web container to use the reviewed Next version; verify private endpoints; back up and replace only the two existing Quwat virtual hosts; test/reload Nginx; restore on failure.

## Validation

- PASS: typecheck with final bundler configuration; lint with zero lint warnings/errors; 138/138 existing tests; 514 translation keys across four locales.
- PASS: isolated production build (64 generated pages) with the actual HTTPS GraphQL/API and WSS URLs; compiled public URL configuration verified. No `.env` or credentials were copied into the build fixture.
- PASS: isolated production HTTP checks on 11 routes, including localized/account/admin shell routes, plus favicon. HTTP shell rendering alone does not verify authenticated access or data operations.
- PASS: real Chrome sign-in rendering, language-menu interaction and client navigation to English; mobile 390px header/menu opens/closes, no horizontal document overflow, no browser warnings/errors on the tested sign-in route. No login/signup or database mutation was submitted. Screenshot: `/private/tmp/quwat-next16-mobile.png`.
- PASS: activation shell syntax and isolated safety branches: unsupported container version refusal, Nginx syntax-failure restoration, reload-failure restoration, successful scoped installation; unrelated virtual-host fixture unchanged in all cases.
- PASS: whitespace checks. Actual Linux Docker rebuild, Nginx parser and final public API/CORS/WSS/upload/browser checks remain remote steps.

The first upgraded build exposed Swiper 8 declaration resolution under mandatory bundler mode; the typed compatibility declaration fixed this and the final build passed. The TypeScript and lint migration issues were resolved without rewriting UI flows.

## Remaining limits

Next 16 supports React 18 but reports its deprecation for the next major release; React 19 migration is separate because of existing MUI/other React peers. ESLint 9's support notice and inherited peer-dependency installation warnings remain; current Next config's React/import/a11y plugin peers constrain ESLint to 9, so this release does not force an incompatible ESLint 10. These development-tool notices are distinct from lint failures.

Production data transactions/indexes/attendance prerequisites need their existing deployment checks; isolated UI tests do not establish live database race safety. The API's unauthenticated/invalid-origin checks, GraphQL preflight and WSS must be verified through the final proxy. Access-log redaction does not promise that Nginx error logs omit request queries. Review Cloudflare upload limits before proxying large multipart requests.

See `deploy/README.md` for activation, read-only verification and rollback guidance. The site remains in maintenance mode until the user copies/rebuilds the release and explicitly runs the activation script.

## Public activation verified — 2026-10-20

The user copied `/private/tmp/quwat-release-next16.tgz`, completed the actual Linux web Docker rebuild (437.6 seconds), ran the supplied startup/activation steps and reported frontend HTTP 200/API welcome through the public HTTPS domains. Maintenance mode has ended.

Independent external checks passed with certificate validation enabled:

- Root HTTPS 200; API HTTPS 200 with the expected welcome; www redirects to canonical root (301).
- Allowed-origin GraphQL preflight 204 with exact allow-origin, credentials and requested authorization/content-type/guest headers; untrusted Origin rejected with 403.
- Read-only public GraphQL catalog returned 27 active products/total 27. All 27 referenced product images returned HTTP 200 with image content types.
- Allowed-origin WSS handshake received the application `connected` event; untrusted-origin WSS rejected with 403. No chat message was sent and no authenticated token was used; this does not verify authenticated agent notifications.
- Real Chrome desktop homepage loaded 24 product cards across its shelves, with no document overflow, failed loaded images or captured browser warnings/errors. Mobile catalog at 390px rendered one 358px-wide card per row, no horizontal document overflow, failed loaded images or captured browser warnings/errors. Screenshots: `/private/tmp/quwat-live-desktop.png`, `/private/tmp/quwat-live-mobile.png`. QA tabs closed and viewport reset.

The Python.org local Python installation lacked a configured CA trust chain, so the first Python HTTPS probe failed locally. Node's verified TLS client and Chrome succeeded; certificate validation was never bypassed.

Still user-operated: Quwat-scoped Certbot renewal dry-run (including deploy hook), normal account login/role-specific screens and authenticated notifications. No sale, upload, like/save, attendance or other production mutation was submitted by these checks. Database concurrency/index/attendance operational checks retain their previously documented limits. No Git commit or push was performed; local changes and deployed release files still need normal repository tracking.
