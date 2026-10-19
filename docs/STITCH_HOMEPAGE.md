# Stitch homepage implementation — 2026-10-18

Visual reference: Stitch project `8490655740396522871`, desktop screen `c9d30d96323046a09a8c627a5951fbf1` and mobile screen `d421847a9db84d1ebd6e6a0ef00fe0be`. The screenshots and project metadata were inspected through Stitch MCP. This implementation adapts their industrial storefront composition to Quwat's existing product contract.

## Delivered

- Compact homepage utility/header rows with the existing name/category search, real account/language/cart/notification controls and a mobile navigation drawer.
- Contained dark warehouse hero, real catalog CTA, catalog product total, user-supplied 1,000 customers and 15 years of experience, and the existing animated photo gallery. The product total shares the newest shelf's Apollo query and uses `metaCounter.total`; it displays an em dash until data is available. Customer count and experience are fixed copy supplied by the user, not live account statistics. Gallery photos use two small panels above one large panel; mobile can expand the gallery with an accessible disclosure. Existing arrows, keyboard controls, pause/resume and Reduced Motion behavior remain.
- Seven real category shortcuts; mobile electrical/plumbing shortcuts use the existing category inquiry contract.
- All three existing eight-product query/sort datasets remain. Desktop/tablet use Swiper; mobile now shows one full card and part of the next card in each horizontal carousel. Swipe guidance, a moving progress track and 44px previous/next buttons make navigation visible. No query or schema changes.
- Homepage-only compact ProductCard variant: brand/heart header, contained imagery, reservation-aware availability badge, price/stock deck and existing client cart/bookmark controls. Mobile uses white price areas and labeled red cart buttons. Catalog/Saved/detail cards keep their default variant.
- Compact promotional slideshow with a working catalog CTA; clean agent section with real names/images/descriptions, existing likes and profile routes, horizontal mobile agent cards; useful-link strip, dark footer and mobile bottom navigation.
- Local variable Inter Latin/Latin Extended/Cyrillic and JetBrains Mono Latin WOFF2 files. Font licenses included; Korean uses the platform glyph fallback. Homepage styling overrides the legacy reset's direct font assignments without changing other pages.
- New text translated across Uzbek, English, Russian and Korean.

## Product boundaries

Stitch's SKU identifiers/search, mock category/product totals, ratings, certifications, warehouse locations, contact details, delivery guarantees, credit/payment terms, B2B contracts and tax-invoice claims were not copied as facts or new workflows. Existing catalog/help/account destinations replace unsupported promotional actions. All seven categories and the third product shelf remain available even though the mobile mockup is shorter. Saved controls remain CLIENT-only; the ADMIN bottom-nav fourth destination is Agents rather than an unavailable favorites page.

No dependency, authentication/session implementation, GraphQL operation, API endpoint, backend runtime code, database content or deployment configuration changed. No live sale, like, save, stock, attendance or chat mutation was submitted for validation. A completion note is recorded in the backend's required AI task log; this is documentation only.

## Changed frontend files

| Files | Purpose |
| --- | --- |
| `pages/index.tsx` | Add trade shortcuts and useful links around existing sections |
| `libs/components/layout/Frame.tsx` | Enable homepage header and bottom navigation; move existing search out of hero |
| `libs/components/Top.tsx` | Optional homepage header variant, mobile drawer and accessible sign-in link |
| `libs/components/common/FiberContainer.tsx` | Hero composition, mobile gallery disclosure and truthful product information |
| `libs/components/common/MemberCard.tsx` | Optional real member description |
| `libs/components/homepage/HeaderFilter.tsx` | Compact presentation and focusable search ID; existing submission logic |
| `libs/components/homepage/ProductShelf.tsx` | Responsive Swiper configuration and compact cards |
| `libs/components/homepage/MobileShelfControls.tsx` | Shared native scroll arrows, progress and gesture guidance for product and agent shelves |
| `libs/components/homepage/TopAgents.tsx` | Enable descriptions for homepage cards |
| `libs/components/homepage/Advertisement.tsx` | Promotional copy and catalog link over existing slideshow |
| `libs/components/homepage/HomeNavigation.tsx` | New role-aware mobile navigation |
| `libs/components/homepage/HomeSupport.tsx` | New trade shortcuts and supported useful links |
| `libs/components/product/ProductCard.tsx` | Optional compact variant and computed availability badge |
| `libs/components/product/ProductActions.tsx` | Optional cart label and stable like-group styling hook; existing handlers retained |
| `scss/home-redesign.scss` | Homepage tokens, local font declarations and complete responsive presentation |
| `public/locales/{uz,en,ru,kr}/common.json` | Thirteen new messages in each dictionary |
| `public/fonts/{inter-latin,inter-latin-ext,inter-cyrillic,jetbrains-mono-latin}.woff2` | Local font assets |
| `public/fonts/{Inter-OFL,JetBrainsMono-OFL}.txt` | Font licenses |
| `scripts/homepage.test.cjs` | Navigation/shortcut permissions and search-focus regression coverage |
| `scripts/product-actions.test.cjs` | Compact reserved-stock/cart regression coverage |
| `docs/HOMEPAGE_REDESIGN.md`, `docs/STITCH_HOMEPAGE.md` | Current implementation record |

## Validation

- Baseline and phased/final `yarn typecheck`: passed.
- `yarn lint` without autofix: passed with no ESLint warnings or errors.
- `yarn check:i18n`: 497 matching keys across four locales, UI text and interpolation checks passed.
- `yarn node --test scripts/*.test.cjs`: all 128 frontend tests passed. The eight product-action tests were repeated after the final card markup correction and passed.
- `yarn check:graphql`: 42 operations checked against localhost:3007, zero errors. Sandbox-local networking required the permitted read-only retry.
- `yarn build`: passed in an isolated `/private/tmp/quwat-stitch-build-*` copy; all 64 static pages generated. The running development `.next` was preserved.
- `git diff --check`: passed.
- Browser review covered 320/375px mobile, 768px tablet and 1440px desktop, four localized homepages, mobile drawer open/close and search focus. Measured document width matched viewport width; mobile shelves use two columns and desktop shelves show four full cards.
- Client-only cart/bookmark layout, large WholeSom prices and reserved/zero-stock cases were inspected in a separate, clearly labeled static fixture preview using real components and no live API. Action behavior/role isolation was exercised by automated fixtures rather than live mutations.

Previews: `/private/tmp/quwat-stitch-review/desktop-home.png`, `desktop-full.png`, `mobile-home.png`, `tablet-home.png` and `client-cards-mobile.png`. Temporary browser viewport overrides and preview processes are cleaned up after review.

## Mobile product carousel follow-up — 2026-10-19

Replaced the two-column phone layout with 1.15 cards per view, retaining eight products per shelf and all product actions. The three shelves have independent navigation and progress tracks. Loading placeholders follow the same horizontal composition; empty and single-product lists hide the extra controls. Swipe guidance is translated across all four locales. Catalog cards and the desktop/tablet layouts are unchanged.

Validated 320px and 390px phone widths without document overflow, drag navigation, previous/next controls, progress updates and the final eighth card. At 1280px, four full cards remain visible and phone controls are hidden. Typecheck, lint, the 512-key translation audit, nine existing homepage tests, SCSS compilation and whitespace checks passed. Preview: `/private/tmp/quwat-home-mobile-carousel.png`.

Follow-up scroll fix: phone shelves now use native `overflow-x: auto` with scroll snapping and unrestricted touch panning, rather than relying on Swiper's transform/touch handlers. Swiper is disabled below 601px and remains active for tablet/desktop. Arrow controls call the same container's native scroll method; its scroll/resize events update the progress track and disabled edge controls. Browser checks confirmed all three shelves scroll horizontally, the last product is reachable at 320px, and document width stays within the phone viewport. A new regression test covers arrow movement, gesture scroll events, progress, end states and resizing; all ten homepage tests, typecheck, lint, SCSS compilation and whitespace checks passed. Updated preview: `/private/tmp/quwat-home-scroll-fixed.png`.

The phone agent shelf now uses the same shared native scroll controls, progress track and 1.15-card composition. Agent profile/like actions and the four-column desktop layout remain. Loading placeholders follow the horizontal composition; empty/single-agent results hide the controls. Checked horizontal scrolling, previous/next navigation and progress at 390px, 320px containment, and the unchanged 1280px layout. All eleven homepage tests, typecheck, lint, the 514-key translation audit, SCSS compilation and whitespace checks passed. Preview: `/private/tmp/quwat-home-agents-scroll.png`.

## Remaining limits

- This adapts the visual reference to real data and supported workflows; unsupported sample claims and fictional people/products are intentionally absent.
- Responsive QA uses browser viewport simulation, not physical low-end phones. The existing WebGL gallery remains, including its bundle/rendering cost.
- The production build reports the existing outdated Browserslist database notice. Dependencies and lockfiles were not upgraded.
- This task does not deploy the frontend.
