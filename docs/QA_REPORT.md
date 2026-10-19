# Frontend verification — 2026-10-19

The checks below found no blocking frontend errors. This records the tested scope; it is not a guarantee that every possible browser, account state, or input is error-free.

## Automated checks

| Check | Result |
| --- | --- |
| `yarn typecheck` | Passed; repeated after the fixes |
| `yarn lint` | Passed, no ESLint warnings or errors; repeated after the fixes |
| `yarn check:graphql` | 42 operations validated against the running backend schema, zero errors |
| `yarn check:i18n` | 514 keys across Uzbek, English, Korean and Russian; interpolation and UI text checks passed |
| `yarn node --test scripts/*.test.cjs` | 138 passed, zero failed, skipped or cancelled |
| Header/account/homepage tests after the fixes | 16 passed, zero failed |
| `yarn build` | Passed, including type validation and generation of 64 static pages |
| `git diff --check` | Passed |

Production builds ran in an isolated temporary copy with the existing dependencies so the running development build was preserved. No dependencies were installed or upgraded.

The regression suite covers migration contracts, sessions, role boundaries, account navigation, cart, product likes/bookmarks, guest likes, mobile catalog filters, homepage controls, sales notifications, attendance, permanent deletion safeguards, comments, chat, translations and gallery scrolling. Database-changing actions use isolated test doubles.

## Browser checks

Chrome checks covered the homepage, catalog, agent list, About, support, sign-in, personal profile, one real product detail page, and the admin products, users, attendance and sales pages. Public and admin pages were checked on desktop and at mobile widths of 390px and 320px; product details were sampled at 320px. Admin headings and catalog/user records were allowed to finish loading before judging their state.

- No runtime console errors or Next.js error overlays were observed in the checked states.
- Loaded page layouts stayed within the viewport at the checked widths.
- Mobile product and agent next controls moved their native horizontal scrollers.
- Admin filters remained in one row at 320px and 390px.
- No live purchases, stock changes, user edits, deletions, authentication changes or attendance decisions were submitted.

## Fixes made during this review

- `scss/_store-chrome.scss`: the desktop header logo now renders at 36 × 36px. A legacy width override previously stretched it to 40 × 36px. The mobile logo remains 25 × 25px.
- `libs/components/Top.tsx`: account transitions now use `AnimatePresence`'s `popLayout` mode. This removes the outgoing sign-in control from normal layout while the authenticated account control enters. Previously, the outgoing control briefly widened the header at 320px when notifications appeared. The same loading/transition checks now remain at a 320px document width, including while both animation nodes exist.

Authentication, GraphQL operations, backend code and database schemas were preserved.

## Non-blocking observations and limits

- Browserslist reports an outdated `caniuse-lite` dataset during production build. The build succeeds; dependencies were not upgraded as part of this review.
- Next.js development diagnostics recommend image priority for some dynamically loaded above-the-fold product/member images and report a dimension override for a sampled product detail image. These are image optimization/layout diagnostics, not runtime exceptions. The distorted header logo was fixed separately.
- A sales-filter test emits MUI `anchorEl` warnings because JSDOM has no actual element layout. Its assertions pass. Reduced-motion diagnostics also appear in the test environment.
- Live browser checks used the currently available admin session. Client and agent role-specific mutations, failure handling and cart flows were covered by automated tests rather than by creating or changing live data.
