# Product card redesign — 2026-10-18

## Product information enrichment — 2026-10-19

Shared product cards now show the actual translated category, an optional two-line description, minimum order quantity, quantity step and the unit covered by the displayed price. Minimum/step values use the existing locale-aware three-decimal formatter. Missing descriptions add no placeholder or blank description block. Details use the existing Product GraphQL fields; queries, data, routes, actions and permissions are unchanged.

Added shared styling in `scss/product-cards.scss`, compact desktop/mobile refinements in `scss/home-redesign.scss`, and one price-unit message across all four locale dictionaries. Reduced the homepage price area's fixed minimum height to avoid unnecessary empty space. This applies to homepage, catalog, related products and personal product lists through the existing `ProductCard` component.

Validation: `yarn typecheck`, non-autofix `yarn lint`, 498-key `yarn check:i18n`, 24 existing product-action/guest-like/homepage tests and `git diff --check` passed. Browser reviewed desktop and 375/320px mobile cards, with category, description wrapping, purchase quantities and price units visible. No API, backend runtime, database or dependency change; no live product action submitted. Previews: `/private/tmp/quwat-rich-cards/desktop.png` and `/private/tmp/quwat-rich-cards/mobile.png`.

Implemented the user's request for a fresh product-card composition using the installed frontend-design, shadcn-ui and user-project skills. This supersedes the homepage-only card refinements recorded in HOMEPAGE_REDESIGN.md; the most recent warm ivory version had first been reverted at the user's request.

## Design

The visual reference is an industrial product sheet: a white display tray, quiet brand identification and a two-line product name, followed by a graphite purchasing deck combining the price and inventory. White #FFFFFF, graphite #26343E, ink #202B33, steel #65717B, border #DCE1E5 and the existing Quwat red #C7352B form the palette. The existing font system is retained. The image, identity and purchasing information have distinct roles rather than identically framed nested boxes.

Images remain contained on white at 236 px high, or 216 px on mobile. Names reserve two lines, full names remain available through their link/title, absent brands retain alignment without a decorative marker, very large prices wrap, and missing/failed images keep the existing translated fallback. Real total/reserved/available quantities and translated units are retained. Empty available stock uses a muted peach quantity on the dark deck; positive stock uses pale green. Favorite count, bookmark and cart remain in the white action row. Keyboard outlines and reduced-motion-aware restrained hover remain.

## Changed files

- `libs/components/product/ProductCard.tsx`: moves brand before name and groups the existing formatted price with stock; adds semantic heading and presentation-only empty-state attributes. No action logic changed.
- `scss/product-cards.scss`: new styles scoped only to shared ProductCard instances, including responsive image sizing, fallback, price/stock treatment, controls and hover/focus.
- `scss/quwat.scss`: imports the new styles after existing homepage styles.
- `scss/home-redesign.scss`: removes only superseded homepage product-card appearance overrides. Agent-card appearance, section backgrounds, margins and carousel widths remain.
- `scripts/product-actions.test.cjs`: existing action tests now mount full ProductCard instances; adds regression cases for large prices, names, fractional/reserved inventory, product links, missing images and archived saved cards.
- This record and a current-state pointer in `docs/HOMEPAGE_REDESIGN.md`; backend `docs/ai/COMPLETED_TASKS.md` receives the required completion entry.

Shared cards are consistent in homepage shelves, catalog, related products and personal lists. Admin list cards, unrelated page layouts, API documents, auth, Apollo behavior, database, translations, dependencies and carousel mechanics were not modified. Existing ProductActions and ProductImage behavior is reused without modification.

## Executed validation

- `yarn typecheck`: passed at baseline and after implementation/refinement.
- `yarn lint`: passed without warnings/errors or autofix.
- `yarn node --test scripts/product-actions.test.cjs scripts/guest-likes.test.cjs scripts/homepage.test.cjs scripts/cart-drawer.test.cjs`: 27/27 passed with isolated mocks. Covers guest/member likes, optimistic save/unsave synchronization and rollback, cart warning localization/timing, pending request locking, quantity/removal, drawer behavior and unchanged homepage controls.
- `yarn build`: passed, 64 static pages, in `/private/tmp/quwat-product-build-je4jnj2w` with a separate `.next`. The live development server's output was preserved. Existing outdated caniuse-lite advisory remains; no dependency update was made.
- `git diff --check`: passed.
- Browser review: homepage at 1440, 768 and 375 px; real catalog at 375 px. Document width equaled viewport width at each tested size. Homepage retains exactly four desktop cards; 300 px tablet and 290 px mobile cards retain horizontal scrolling and indicators. Existing carousel shadow gutters remain.
- Image click in the real catalog successfully opened the corresponding product-detail ID. Public data and images were reviewed; no live sale, attendance, save or like mutation was submitted.
- Separate temporary static HTML rendered from the actual ProductCard/ProductActions and project CSS reviewed large whole-som values up to Number.MAX_SAFE_INTEGER, long names, absent images/brands, fractional/reserved inventory, zero stock, archived cards and all client controls. At 375 px, all fixture cards/prices had equal clientWidth and scrollWidth (no internal horizontal overflow). This test fixture is outside the repository and is never served by the application.
- Temporary preview tabs closed and viewport overrides reset. No deployment performed.

Screenshots: `/private/tmp/quwat-card-review/desktop.png`, `mobile.png`, `tablet.png`, and isolated `edge-mobile.png`.
