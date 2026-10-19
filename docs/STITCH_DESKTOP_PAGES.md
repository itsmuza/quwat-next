# Stitch desktop page implementation

Completed 2026-10-19 (Asia/Seoul). Extends the existing Quwat frontend to the six approved desktop screens in Stitch project `8490655740396522871`. Mobile redesign is outside this milestone.

## Design references

| Route | Stitch screen |
| --- | --- |
| `/product` | `ef2d269417d3400b9b5bf51193df55e8` — Mahsulotlar Katalogi |
| `/agent` | `615c17807d2f4e8182e4a80615d50fc9` — Agentlar va Mutaxassislar |
| `/about` | `ad4179b5f64e425490ed4f291873e59f` — Biz Haqimizda |
| `/mypage` | `4ea76d1970f34ac0917e42440cfd8de2` — Shaxsiy Bo‘lim |
| `/cs` | `fca212279bb44a939b5476490697e179` — Yordam va FAQ |
| `/account/join` | `b385afb7b6324799818b8894ba3fd43a` — Kirish va Ro‘yxatdan O‘tish |

Screenshots and HTML were retrieved through Stitch MCP. Local reference artifacts are in `/private/tmp/quwat-desktop-stitch/`.

## Result and preserved behavior

- Shared industrial header/search/navigation, page banners, Inter typography, red actions and slate footer apply to these routes at **1024px and above**. The homepage uses the same extracted chrome mixin; unrelated detail/admin pages keep their existing presentation.
- Catalog retains all existing query filters, input validation, URL state, sorting directions, 18-product pagination and ProductCard actions. Desktop sorting moves above the three-column grid. Cards retain the recently added description, category, minimum/step and available-stock information; bookmark remains next to cart.
- Agent search, identities, images, descriptions, likes and profile destinations remain backed by the existing API. Four cards form a desktop row, with explicit profile links and useful existing destinations below.
- About retains all existing explanatory copy, arranged as overview/mission, catalog/category links, saved-product explanation, four purchase steps and support links.
- Help retains the five accurate existing answers. Desktop adds local translated question/answer search, topic filtering, an empty-result message and links to real agent/catalog pages. No external search service was added. The first answer opens on desktop; mobile keeps the initially collapsed presentation.
- Authentication retains nickname/password login, CLIENT signup, validation, errors and redirect behavior. Desktop adds a password visibility control; it does not add phone login, password recovery or new authentication providers.
- Profile retains every original field, upload path, update mutation, session handling and role-specific destinations. Desktop adds a reset/cancel control that restores loaded user values without submitting, icons, and existing logout/help destinations.
- All four locale dictionaries contain the new copy (510 matching keys in total).

No backend source, API contracts, GraphQL documents, authentication rules, database data, environment files or dependencies changed. No live save, like, sale, signup or profile-update mutation was submitted during QA. Existing local imagery and fonts were reused.

Stitch-only claims/workflows were deliberately adapted: fabricated contact details, SKU, ratings, technical specialties, warehouse locations, delivery promises, certification, B2B contracts/Didox, E-IMZO and unsupported password recovery were not introduced.

## Files changed in this milestone

| Files | Purpose |
| --- | --- |
| `pages/product/index.tsx` | Catalog toolbar, desktop sorting and filter heading |
| `pages/agent/index.tsx` | Search toolbar/count, richer existing cards and useful links |
| `pages/about/index.tsx` | Stitch section composition and real category destinations |
| `pages/cs/index.tsx` | Help hero, translated local search/topics and support column |
| `pages/account/join.tsx` | Desktop password visibility control |
| `pages/mypage/index.tsx` | Sidebar icons, logout/help area and preserved role navigation |
| `libs/components/Top.tsx` | Reuse store header content on the six target routes |
| `libs/components/layout/Frame.tsx` | Scoped desktop route class and banners |
| `libs/components/product/ProductFilter.tsx` | Class hooks for existing sorting controls |
| `libs/components/mypage/MyProfile.tsx` | Reset action and form heading/action composition |
| `scss/_store-chrome.scss` (new) | Shared existing homepage typography/header/footer mixin |
| `scss/home-redesign.scss` | Include extracted chrome without changing homepage composition |
| `scss/desktop-pages.scss` (new) | Desktop page styles plus mobile preservation rules |
| `scss/quwat.scss` | Import desktop extension |
| `public/locales/{uz,en,ru,kr}/common.json` | Eight new translated keys |
| `docs/STITCH_DESKTOP_PAGES.md` (new) | References, scope, file list and verification record |

The backend repository's `docs/ai/COMPLETED_TASKS.md` was updated as required by AGENTS.md. Earlier uncommitted homepage, logo and product-card work was preserved.

## Validation

- `yarn typecheck` after implementation phases: passed.
- `yarn lint`: passed without warnings/errors.
- `yarn check:i18n`: 510 keys across Uzbek, English, Russian and Korean; passed.
- `yarn node --test scripts/*.test.cjs`: **129 passed, zero failed**. An initial admin-navigation failure exposed the support link being inside the menu; moving support outside that menu restored the original role-navigation contract.
- SCSS compilation and `git diff --check`: passed.
- `yarn build`: passed in the isolated `/private/tmp/quwat-stitch-build-vtZnEn` copy; all 64 static pages generated. The running development `.next` was preserved.
- Browser checks at 1280px and 1024px: all six routes matched document width to viewport width, without runtime dialogs. At 375px all six also matched width; desktop-only chrome/intro controls stayed hidden.
- Browser interactions: catalog name search returned the two real matching lock products; sorting preserved its URL contract; page 2 rendered nine remaining products. Agent search returned its matching card. Help search, topic reset, empty results and accordion state worked. Auth password visibility/signup mode and profile reset were verified without submitting.
- Finish review: **ship** after resolving the FAQ keyboard-focus finding and recapturing settled headers/images. The reviewer directly checked all six 1280px captures and the focus evidence; narrower width checks are the implementer's browser evidence.

Settled screenshots: `/private/tmp/quwat-desktop-review/{catalog,agents,about,help,auth,profile}.png`. `catalog-top.png` is the compact delivery preview; `help-focus.png` records the visible search focus ring. Catalog images were loaded by scrolling before the full capture.

Remaining limits: the pre-existing outdated Browserslist/caniuse-lite advisory remains. Impeccable's optional detector could not run because its engine was not installed and its cache path was not writable; manual source/browser review and the independent finish review were completed. This milestone is not a full screen-reader audit or a live business-mutation test. No deployment was performed.
