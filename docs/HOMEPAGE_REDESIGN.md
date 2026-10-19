# Homepage redesign — 2026-10-18

## Current: Stitch industrial homepage

The approved Stitch desktop/mobile design is now implemented as the homepage presentation. See [STITCH_HOMEPAGE.md](STITCH_HOMEPAGE.md) for the current layout, complete changed-file list, validation and deliberate adaptations to supported Quwat functionality. The entries below describe earlier appearances.

Current product-card appearance is documented in [PRODUCT_CARD_REDESIGN.md](PRODUCT_CARD_REDESIGN.md). The warm ivory refinement below was reverted at the user's request, then superseded by the shared industrial product-card redesign. The following entries retain the earlier implementation history.

## Homepage product-card refinement — 2026-10-18

Refined only homepage product-card presentation using the installed shadcn-ui/frontend-design/user-project guidance and existing Card slots. The image is now a full-width white surface; product name spans the information area, brand sits below on the left and price on the right. Warm ivory body (#FCFBF8), muted sand footer (#F3F0E9), flat stock row, restrained warm border/shadow and contained images replace the previous inset gray treatment. Agent cards, section backgrounds, routing and ProductActions remain unchanged. No dependency/API/translation change.

PASS: yarn typecheck, lint (no warnings), 10 existing product-actions/homepage regression tests and git diff --check. Browser review at desktop, 375 px and 768 px confirmed no horizontal page overflow; mobile card width 290 px, tablet 300 px. Temporary viewport override reset. This CSS-only follow-up did not repeat the prior production build. Previews: /private/tmp/quwat-home-review/product-cards-refined-desktop.jpg and product-cards-refined-mobile.jpg.

## Homepage card redesign — 2026-10-18

Applied the installed shadcn-ui, frontend-design and user-project skills using the existing SCSS-adapted Card/Header/Content/Footer composition. Product cards now have an inset white image surface, soft gray body, stronger price/title hierarchy, a white stock row/action footer and consistent border/hover treatment. Agent cards use larger contained rectangular portraits, a name area and separate like/profile actions. Changes remain scoped to quwat-home. Existing header/agent background images and 520/280 px advertisement heights remain.

MemberCard has an optional showProfileLink prop, false by default and enabled only by TopAgents. Both profile links reuse the same existing self-agent route rule; the new label is translated into all four languages. No GraphQL, auth, cart, like, save or backend behavior changed; no dependencies were added.

Validation: typecheck; lint without autofix (no warnings); i18n audit (484 keys); 4 i18n plus 19 product-action/guest-like/homepage tests; a DOM-based SSR smoke check for guest profile links, own-agent /mypage links and unchanged default card markup; isolated production build (64 static pages); git diff --check. Desktop, 375 px mobile and 768 px tablet reviewed with no horizontal document overflow. Mobile agent width 343 px; tablet uses two 348 px columns. Viewport override reset. No live business mutations were performed.

Previews: /private/tmp/quwat-home-review/redesigned-product-cards.jpg, redesigned-agent-cards.jpg and redesigned-cards-mobile.jpg.

## Follow-up adjustments — 2026-10-18

The original dark footer background (#181A20) was also restored, with locally scoped light text/link colors and the current compact layout preserved. Follow-up typecheck and whitespace checks passed; desktop preview: /private/tmp/quwat-home-review/restored-footer-background.jpg.

At the user's request, the advertisement slideshow is now 520 px tall on desktop/tablet and 280 px on mobile. The original warehouse background/gradient in the header and clear team image with inset edge shadows in the homepage agent section were restored. Hero copy is light for contrast. The agent heading and View all link now use separate translucent charcoal surfaces with subtle blur/borders, replacing the full-width white panel and leaving the section image unobscured. Desktop reviewed and 375 px containment verified; preview: /private/tmp/quwat-home-review/agents-text-background.jpg. Current layout, slideshow logic and other pages are retained. Follow-up typecheck and whitespace checks passed; both backgrounds were reviewed on desktop and verified at 375 px without horizontal overflow. Previews: /private/tmp/quwat-home-review/restored-header-background.jpg and restored-agents-background.jpg. The original redesign record below describes the earlier white-background version.

Implemented the approved light-storefront design using the existing Next.js Pages Router, MUI, SCSS, Apollo and Framer Motion stack. No dependency, environment, API, database or deployment change was made.

## Changes

- `Frame` derives `quwat-home` from its existing `home` prop. `scss/home-redesign.scss`, imported last by `scss/quwat.scss`, scopes the white navbar/footer, typography, hero and cards to that root. Other public/admin pages and portal cart/notification drawers retain their existing presentation.
- The hero has a white background, existing copy/gallery assets and search beneath the copy. `FiberContainer` accepts optional children for the existing `HeaderFilter`. Its WebGL scroll mechanics, arrows, keyboard navigation, three-second interval and hidden-tab/reduced-motion behavior remain; a localized pause/resume control now clears/restarts the interval.
- `CategoryLinks` exposes all seven existing product categories using MUI icons and the existing catalog inquiry contract. Search and category links use page 1, limit 18, createdAt DESC; there is no unit search field.
- `ProductShelf` retains its three existing queries/sorts, eight results per shelf, swipe/wheel navigation and pagination. Contextual descriptions and View all links were added. Desktop still displays exactly four full cards, with padding for edge hover shadows. Cards retain image containment, price, brand, stock/reservation details and the existing ProductActions component unchanged.
- Agent cards retain MemberCard, likes and self-profile routing. The large agent background was replaced with a white section and divider. Advertisement images, three-second playback and playback controls remain; its homepage framing is contained and the old heavy shadow is removed.
- `HomeSkeleton` provides local loading states, including session restoration; shared QueryState remains unchanged. Empty/error/retry behavior is retained. Section headings use h2, controls keep accessible names/focus indicators and Reduced Motion remains supported.
- Four new messages were translated into uz/en/ru/kr. Global fonts/theme and routes were not changed.

Main files: `libs/components/layout/Frame.tsx`, `libs/components/common/FiberContainer.tsx`, `libs/components/homepage/{CategoryLinks,HomeSkeleton,ProductShelf,TopAgents}.tsx`, `pages/index.tsx`, `scss/{quwat,home-redesign}.scss`, four `public/locales/*/common.json` dictionaries, and `scripts/homepage.test.cjs`.

Skills applied: `skills/user-project/SKILL.md`, `.agents/skills/redesign-existing-projects/SKILL.md`, `.agents/skills/frontend-design/SKILL.md`, `.agents/skills/framer-motion-animator/SKILL.md`. Existing ProductCard/MemberCard, enums, image assets, query/error handling and translations were reused.

## Executed verification

| Check | Result |
| --- | --- |
| `yarn typecheck` after each implementation phase and final adjustment | PASS |
| `git diff --check` after phases/final review | PASS |
| `yarn lint` without autofix | PASS, no ESLint warnings/errors |
| `yarn check:i18n` | PASS, 483 keys across all four locales |
| `yarn test:i18n` | PASS, 4 tests |
| `yarn test:migration` | PASS, 44 tests |
| `yarn node --test scripts/homepage.test.cjs` | PASS, 5 tests |
| Existing fiber-scroll, product-actions, guest-likes, cart-drawer, account-navigation, agent-notifications and admin-attendance-notifications test files | PASS, 46 tests |
| `yarn check:graphql` against running localhost backend | PASS, 42 operations, zero errors; initial sandbox network attempt failed, permitted retry passed |
| `yarn build` in `/private/tmp/quwat-home-build-nlcmpa3r` | PASS, 64 static pages generated; development `.next` untouched |

99 tests passed in total across the listed suites. New homepage tests exercise empty/name/category/combined search, seven category route payloads and localized labels, Fiber timer cleanup/pause/resume/manual controls/Reduced Motion, and loading/empty/error/retry states. Notification/cart/like tests use isolated fixtures; no live sale, like, stock, attendance or chat mutation was performed for QA.

Browser review used the running application and real backend lists. Checked 375, 768 and 1440 px, Uzbek plus Russian/English/Korean text, mobile wrapping, images, agent/footer layout and first-card hover. DOM measurements confirmed no horizontal document overflow and exactly four fully visible desktop slides, with 24 px of clipping gutter. Confirmed `/product` has no `quwat-home` class and retains its dark navbar/footer. A live timed check confirmed pause remained at scrollLeft 643 beyond the three-second interval with unchanged viewport; manual navigation and resume remain usable. Viewport overrides were reset after review. A coordinate click intended to activate the last-card hover was rejected by automatic safety review because it could trigger a product action; no retry or live card action was performed. The last card has the same shared hover rule and its 24 px right clipping gutter was verified read-only; its hovered state was not directly activated.

Screenshots are in `/private/tmp/quwat-home-review/`: `desktop-home.jpg`, `desktop-full.jpg`, `desktop-agents.jpg`, `desktop-products.jpg`, `tablet-home.jpg`, `mobile-home.jpg`, `mobile-full.jpg`.

Limits: responsive checks were desktop-browser viewport simulations, not a physical low-end phone performance benchmark. WebGL and its existing bundle cost remain. Build emitted the existing outdated Browserslist database notice; dependency metadata was intentionally not upgraded.
