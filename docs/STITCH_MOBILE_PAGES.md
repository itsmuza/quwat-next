# Stitch mobile page implementation

Implemented 2026-10-19 (Asia/Seoul), extending the existing desktop milestone with the seven mobile screens in Stitch project `8490655740396522871`. The approved industrial storefront, existing frontend architecture and homepage composition remain in use.

## References and coverage

| Existing surface | Stitch mobile screen |
| --- | --- |
| `/product` | `4852862bddb842caabd0c3e88700f020` |
| `/agent` | `b4880df9cd6449d9a5d2b515025ecf44` |
| `/mypage` | `e8a9d439fe6b4082b056dcb79913a4f0` |
| `/cs` | `58f01c87abfd4597b849daf3113b8ed6` |
| `/account/join` | `fefb9de42d494877a1fedb3e8594bc27` |
| `/about` | `8a2198b966d845febadd845d32520259` |
| Existing cart drawer | `463cd46b4ad046b0a675304e9bbe016d` |

Stitch MCP supplied the screenshots and HTML. Reference downloads are at `/private/tmp/quwat-mobile-stitch/`; these are 780px-wide captures representing a 390px mobile layout. The existing homepage mobile reference was already implemented in the earlier milestone.

## Behavior and intentional adaptations

- Shared mobile chrome: compact white header with working menu, account/language and role-specific cart/notifications; Inter typography; red actions; compact white footer; five-item fixed bottom navigation with safe-area padding. Route-aware navigation preserves role-specific destinations and directs search to the existing homepage search or the new catalog search field.
- Catalog: scrollable category buttons, synchronized name search, existing sorting/direction, real result count, two phone columns and three tablet columns. A keyboard-accessible MUI filter drawer reuses ProductFilter, including validation, price/date/unit/brand/stock filters and reset. Category/name changes preserve other filters and sorting, reset to page 1 and retain the 18-item limit. Existing description, category, minimum/step, stock, likes, bookmark and cart guards remain intact; bookmark remains adjacent to cart.
- Agents: compact photographic banner, existing name search, single-column phone cards with small white image areas, real identity/description/likes and a full-width profile link. Tablet uses two columns. No invented specialties, review score or agent count.
- About: compact hero, stacked overview/mission/catalog sections, two-column links to all seven real categories, saved/cart explanation, vertical numbered purchase steps and existing support/catalog destinations. Original factual copy remains.
- Help: compact photographic hero, existing local translated FAQ search, 2×2 topic buttons, five accurate accordion answers with the first initially opened, and support links. Desktop already opened the first answer. No unsupported contact details or document/delivery workflows were added.
- Profile: actual user identity summary, horizontally scrollable role-specific section links, compact horizontal image upload, all original fields in a single phone column, existing reset/cancel and full-width save. Desktop identity summary stays hidden; role permissions and admin menu contents remain unchanged.
- Auth: compact white form, existing nickname/password and CLIENT signup fields, password visibility, signup/login toggle and original validation/errors. No new auth provider, password recovery, phone login or remember-me mechanism.
- Cart: existing CLIENT drawer becomes full-screen below 1024px, with compact white item rows, quantity controls, line totals, CASH/CARD choices and a fixed footer. Item list scrolls independently; short landscape viewports also allow the footer to scroll. Stock checks, idempotent sale request, disabled states and payment behavior are unchanged. This remains an offline payment request, with no delivery choice, tax or online gateway introduced.

Styles are scoped to the six existing route roots below 1024px. Portal filter/cart surfaces have explicit component scopes. Desktop page layouts at 1024px and above and unrelated detail/admin routes retain their presentation. Existing white image backgrounds and top/bottom image borders remain.

## Files changed in this milestone

| File | Purpose |
| --- | --- |
| `scss/mobile-pages.scss` (new) | Responsive shared chrome, six route layouts, mobile filter drawer and cart presentation |
| `scss/quwat.scss` | Import mobile extension after desktop styles |
| `libs/components/homepage/HomeNavigation.tsx` | Active route state and cross-page search destination/focus |
| `libs/components/layout/Frame.tsx` | Reuse bottom navigation on the six routes |
| `pages/product/index.tsx` | Mobile category strip, synchronized name search, accessible filter drawer and screen-reader heading |
| `pages/mypage/index.tsx` | Actual mobile identity summary without changing role navigation |
| `pages/cs/index.tsx` | Open first accurate FAQ answer on mobile too |
| `scripts/homepage.test.cjs` | Complete router fixture and cross-page navigation/focus regression test |
| `scripts/mobile-catalog.test.cjs` (new) | Filter preservation, page reset/limit and drawer validation/close behavior tests |
| `docs/STITCH_MOBILE_PAGES.md` (new) | References, changed files, adaptations and validation record |

Other uncommitted files belong to previous authorized homepage/desktop work. No dependency, locale key, GraphQL document, backend source, schema, database, authentication contract or environment changes were needed. The only backend repository write for this milestone is the required completion-log entry.

## Validation

- Phased `yarn typecheck`: passed.
- `yarn lint`: passed without warnings or errors.
- `yarn check:i18n`: passed; 510 matching keys across uz/en/ru/kr.
- `yarn node --test scripts/*.test.cjs`: **132 passed**, zero failures. The original 129 tests remain, with three new navigation/filter tests. Initial failure identified a router test fixture missing `asPath`; the fixture was completed, and navigation subsequently uses locale-independent pathname/query state.
- `git diff --check`: passed.
- `yarn build`: passed in isolated `/private/tmp/quwat-stitch-build-vtZnEn`; all 64 static pages generated. The active development `.next` was preserved. The existing outdated caniuse-lite advisory remains.
- Chromium live-page viewport checks: catalog, agents, About, Help and auth at **320, 390, 768 and 1280px**. Settled document width equals viewport width. Narrow-screen overflow from long category/service text was corrected. Profile's actual rendered component passed the same widths using isolated CLIENT fixtures.
- Browser interactions: category filtering returned six real matching tools and retained the expected URL contract; FAQ topic filtering returned the three saved-product answers; bottom search navigation moved from Help to catalog and focused the visible search input; password visibility and signup phone-field mode worked. Unit tests additionally exercise invalid/valid filter submissions, retained filters and all existing cart/profile/permission behavior.
- Profile/cart visual checks use actual mounted components with isolated fixture state and compiled project/MUI CSS. No live login, profile update/upload, save, like, cart mutation, sale, signup, stock, attendance or database mutation was performed. Profile fixture screenshots omit the public outer layout; shared chrome is verified on the live public pages. The fixture host initially missed the local Inter font and captures could precede stylesheet readiness; the font assets were served successfully, captures explicitly waited for page load, and all profile/cart screenshots were replaced. The compact cart stepper uses its existing product-specific accessible name with no clipped floating visual label.

Evidence: `/private/tmp/quwat-mobile-review/`. Main 390px captures are `{catalog,agents,about,help,auth}-390.png`; additional captures use suffixes `320`, `768`, `1280`. `profile-fixture-{320,390,768,1280}.png` covers the actual profile component; `cart-fixture-{320,390}.png` covers the populated cart. `filters-390.png` shows the filter panel; `widths.json` records the final live width checks for 320/768/1280.

Independent finish review: **ship**. The fresh reviewer found no material issue in sampled live mobile/tablet captures, desktop catalog, filter panel and isolated profile/cart fixtures. The reviewer accepted all 15 exact-width measurements; screenshot review does not independently establish all interaction/error states or pixel equivalence against a pre-change desktop baseline.

Limits: viewport emulation verifies Chromium layout and exercised click/keyboard controls, not physical touch gestures, iOS Safari, Android hardware or on-device performance. Optional Impeccable context/detector engine was unavailable in the sandbox; source/browser checks and independent review are used. No deployment performed.


## Follow-up: account section height carryover

The user reported that visiting the tall purchases list and returning to profile left a large blank area. The account wrapper kept the largest previously measured panel height in React state and applied it through `--quwat-panel-min-height`.

Removed that state, measurement ref, navigation click handler, inline CSS variable and obsolete CSS minimum-height rule from `pages/mypage/index.tsx` and `scss/quwat.scss`. Each section now uses its own content height on desktop and mobile. Existing shallow links, role access, queries, form data and business actions are preserved.

Added a regression in `scripts/account-navigation.test.cjs`: simulate a 6000px purchases panel, then move through profile, favorites, saved, recently visited, purchases and profile again; no retained height or inline minimum survives. Updated suite: **133 tests passed**, typecheck/lint passed, isolated production build passed. No live account or sales changes were submitted.

Actual component fixture measurements at 1280px: purchases **3781.9px**, profile after navigation **872.5px**, saved **194px**, each with computed `min-height: auto` and no inline height. Evidence in `/private/tmp/quwat-mobile-review/`: `height-orders-1280.png`, `height-profile-1280.png`, `height-saved-1280.png`, `height-profile-390.png`. These use isolated test sales, not the user's account history.

The independent reviewer scored font readiness, capture consistency, compact cart labels and account height carryover **resolved**, with final disposition **ship**. Documentation audit passed after recording the exact screenshot scope and missing pre-change desktop pixel baseline.
