# Stitch basket redesign

Implemented 2026-10-19 (Asia/Seoul). Uses the user's updated mobile and new desktop basket designs from Stitch project `8490655740396522871`.

## References

| Surface | Stitch screen | Local reference |
| --- | --- | --- |
| Mobile basket | `463cd46b4ad046b0a675304e9bbe016d` (updated screen) | `/private/tmp/quwat-basket-stitch/mobile.png` |
| Desktop side drawer | `8ef748d9a6e444d9af8079f17624a700` | `/private/tmp/quwat-basket-stitch/desktop.png` |

Screenshots and HTML were read through Stitch MCP and downloaded locally. The desktop HTML specifies a 540px right drawer, with a 500px intermediate width; the mobile reference is a 780px capture representing a 390px layout.

## Result

- Desktop: 540px right drawer with a dimmed, blurred backdrop, compact title/count/clear/close header, white image trays and product rows, brand/category metadata, available-stock labels, quantity steppers, line totals, payment choices, order summary and a fixed total/payment footer. At 768–1023px the drawer is 500px wide.
- Mobile below 768px: full-screen drawer with a compact Quwat brand strip, product cards, per-line calculation and unit-aware steppers, payment and order-summary sections in the scrollable body, fixed total/action area and five-item navigation. The existing HomeNavigation component supplies real destinations; the basket item is current and scrolls the item list to the top.
- Long lists scroll inside the body while the footer remains available. On short landscape viewports, the decorative brand strip and auxiliary bottom navigation are hidden; the item body stays scrollable and the footer can also scroll within a bounded height.
- Basket search closes the modal, waits for its exit, navigates to the catalog and focuses its visible mobile search field. Catalog/home/favorites navigation closes the drawer through existing destinations. Empty baskets offer the existing catalog link.
- Uses existing local Inter fonts, SVG brand asset, MUI controls, CartItems, cart/session state and product image handling. No dependencies were added.

## Preserved contracts and intentional adaptations

Only already-returned optional brand/type metadata was added to the in-memory CartProduct snapshot. Persisted storage remains version 1 with product IDs, quantities and any existing request intent. No GraphQL document or backend contract changed.

Quantity parsing, minimum/step/stock validation, reservation arithmetic, exact whole-so‘m rounding, owner isolation, refresh behavior, unknown-response intent, request idempotency, retry behavior and request locks remain unchanged. CASH/CARD still describe the existing offline sale request; no online payment gateway was introduced. Existing account/order routes and role restrictions remain in place.

Unsupported reference content was omitted: invented SKU, warehouse/address/hours, delivery selection/promises, tax inclusions, Didox/E-IMZO, certification, guarantees and security claims. Accurate available quantity is total stock minus reservations. Product units remain the API's dona/qop/metr/kilogramm; a product whose name contains “juft” is not assigned an invented unit. The existing order-history link replaces decorative guarantee claims.

The reference includes smaller controls; quantity +/− buttons, payment choices and the close action have targets of at least 44px. Large translated totals wrap at locale group separators without changing the numeric amount, and long navigation labels wrap within their columns. Prices, summaries and counts are derived from the current cart rather than fixed reference values.

## Files changed in this milestone

| File | Change |
| --- | --- |
| `libs/components/cart/CartMenu.tsx` | Drawer hierarchy, mobile brand/navigation, payment/summary sections, empty catalog link and after-exit search focus |
| `libs/components/cart/CartItems.tsx` | Existing brand/category, available-stock label, unit-aware stepper and explicit line calculation |
| `libs/cart.ts` | Optional brand/type display metadata in the existing in-memory snapshot |
| `libs/components/homepage/HomeNavigation.tsx` | Optional basket mode and navigation/search callbacks; defaults preserve existing pages |
| `scss/cart-redesign.scss` (new) | Scoped desktop/mobile basket and backdrop styles |
| `scss/quwat.scss` | Remove obsolete basket panel rules and import the replacement stylesheet; shared sale/cart image primitives remain |
| `scss/mobile-pages.scss` | Remove superseded mobile basket overrides so there is one owner |
| `public/locales/{uz,en,ru,kr}/common.json` | Translate one new order-summary heading; 511 matching keys total |
| `scripts/cart-drawer.test.cjs` | Add metadata/available-stock/navigation and after-exit search-focus regressions |
| `docs/STITCH_BASKET.md` (new) | References, scope, adaptations and validation |

Other dirty files belong to earlier user-authorized homepage, mobile-page and account-height work. No backend source, schema, database, environment, package manifest or dependency changed. The required backend AI completion log is the only backend repository write for this milestone.

## Verification

- Phased `yarn typecheck`: passed.
- `yarn lint`: passed without warnings/errors after adding the required Link attribute.
- `yarn check:i18n`: passed, 511 keys across uz/en/ru/kr.
- `yarn node --test scripts/*.test.cjs`: **135 passed**, zero failures. Includes all prior rounding/stock/owner/request/clear/lock tests plus two new basket regressions.
- `yarn build`: passed in isolated `/private/tmp/quwat-stitch-build-vtZnEn`; 64 static pages generated. Active development `.next` was preserved.
- SCSS compilation and `git diff --check`: passed.
- Chromium layout checks: normal basket at 320/390/768/1280px; empty, 20-item, large-price/long-Cyrillic and submitting fixtures at 320/1280px; 844×390 landscape. All 12 recorded width checks have no horizontal drawer overflow. Drawer widths are full phone width, 500px intermediate, 540px desktop.
- Native keyboard focus scrolled the mobile body to payment choices while the fixed footer remained visible. Live frontend QA exercised opening/closing and basket-search exit/focus, without submitting a live sale, clearing the basket or changing quantities for testing.

Evidence in `/private/tmp/quwat-basket-review/`: `normal-{320,390,768,1280}.png`, `{empty,long,large-ru,locked}-{320,1280}.png`, `landscape.png`, `normal-bottom-390.png`, and `widths.json`. These state/layout captures use actual mounted components with isolated test cart state, compiled project styles, real local fonts and existing catalog images. They explicitly wait for stylesheet/image load. The gray area behind desktop fixture drawers is the fixture background; the actual app's backdrop was separately inspected live. Static fixture pages verify layout/native focus, while JavaScript workflows are covered by the component tests and noted live interactions.

Independent finish review: **ship**. The reviewer checked both Stitch references and all supplied normal/empty/long-list/locked/large-Cyrillic-total/landscape/scrolled-payment captures and found no blocking UI or source regression. A mislabeled 390px capture was replaced and its 390×844 dimensions independently confirmed. The reviewer accepted the truthful content adaptations and preserved request/arithmetic/lock behavior. The scope is screenshot/source review; reported tests and live interactions were not independently rerun. The optional 36px mobile order-history target remains; the control-size statement above names only the actions verified at 44px or greater.

Limits: Chromium viewport emulation, not physical devices, Safari or hardware touch gestures. Existing outdated Browserslist/caniuse-lite advisory remains. The optional Impeccable context/detector engine was unavailable earlier in this session; direct source/browser and independent review are used. No deployment was performed.
