# Quwat page imagery — 2026-10-15

Generated with the built-in `image_gen.imagegen` tool. Conceptual scenes, not photos of actual Quwat premises or employees. No external stock service or new dependency. Converted to RGB WebP at quality 82, method 6.

## Active replacements

- Retained, inactive texture trial: `public/img/background/quwat-lime-plaster.webp` (1254×1254, 184764 bytes). Generated with the built-in imagegen tool; WebP quality82/method6. Superseded by the requested white homepage sections. The beige card trial was also reverted: cards use the original white body, #FAFAFA footer, neutral border and shadows. Product image areas remain white. The texture is no longer referenced by runtime source.
- Catalog banner: `public/img/banner/quwat-catalog.webp` (1672×941).
- Agent list and public profiles: `public/img/banner/quwat-team.webp` (1672×941).
- Homepage Agentlar section: reuses `quwat-team.webp` at full clarity without a white overlay, with inset shadows along its top and bottom edges. Scoped to `.home-page .top-agents`; other homepage sections retain their white backgrounds.
- Sign-in/sign-up side panel: `public/img/banner/quwat-account.webp` (1024×1536).
- Other public-page banners and legacy homepage CSS fallback: existing `quwat-warehouse.webp`.
- Homepage advertising section: six existing Quwat photos (`fastening`, `bricklaying`, `drilling`, `plumbing`, `electrical`, `painting`) from `public/img/fiber/quwat-*.webp`, replacing the legacy `ads.mov` source. Existing section size retained. Swiper now loops horizontally every 3 seconds with a 700ms transition, swipe/clickable indicators and a manual pause/resume button. Hovering does not pause playback. Reduced Motion disables autoplay and animated transitions; pagination and swipe remain available. Shared local assets are reused without generating or duplicating files.

Replaced all active legacy decorative image/video references in pages/components/SCSS. Unused legacy files remain on disk; user-uploaded product/profile images and generic UI icons are untouched. Banner gradients preserve text contrast. Sign-in and sign-up share the same panel; the existing mobile layout hides that panel and keeps the updated page banner.

## Exact generation prompts

### Homepage natural plaster texture

```text
Use case: photorealistic-natural. Asset type: seamless repeating background texture for the content sections of Quwat, a construction-materials ecommerce website. Create one square 1024x1024 close-up photograph of fine matte lime plaster / honed light limestone. Warm ivory and very light natural stone-grey, quiet subtle cloudy mineral variation and delicate fine grain, clean contemporary architectural surface. The texture must be visible but low contrast so white product cards and dark text stand out clearly. Even diffuse lighting, flat front-on view, no directional shadows, no vignette, no perspective, no edges or seams. Tileable on all four edges. No tiles, grout, cracks, dramatic veins, pebbles, stains, objects, tools, people, lettering, logos or watermark. A simple calm authentic material surface, not a flat solid color and not a room scene.
```

### catalog

```text
Use case: photorealistic-natural. Asset type: Quwat building-materials ecommerce catalog panoramic banner, landscape 16:9. One premium editorial photograph of a tidy construction supply shop: foreground organized anonymous hand tools, fasteners in bins, brass plumbing fittings, a few paint buckets, red clay bricks and timber; metal shelves recede naturally behind. Warm neutral and charcoal tones, natural side lighting, realistic materials. Objects and workbench centered in the middle horizontal band to work as a shallow full-width website banner. Not a luxury house or apartment. No people, no readable text, no logos, no brands, no watermark, no collage.
```

### team

```text
Use case: photorealistic-natural. Asset type: Quwat building-materials store agent-team page panoramic banner, landscape 16:9. One premium editorial photograph of two adult hardware-store assistants, woman and man in charcoal work aprons, collaboratively checking a small plumbing fitting and order clipboard at a real hardware-store counter, organized tool and fastener shelves behind. Warm neutral palette, natural daylight, candid credible scene, realistic hands. Subjects and tools in central middle horizontal band suitable for a shallow banner crop. Do not portray real Quwat staff or a documented real location; conceptual photo. No readable text, no logos, no brands, no watermark, no luxury interiors.
```

### account

```text
Use case: photorealistic-natural. Asset type: Quwat construction-supply store sign-in/sign-up decorative side panel, portrait 2:3. One premium editorial still-life photograph of an organized workshop bench: unbranded cordless drill, measuring tape, steel pliers, screwdrivers, fastener tray, work gloves, a small stack of red clay bricks and timber. Quiet tool wall in softly blurred background. Warm natural side lighting with neutral beige, charcoal and restrained terracotta details. Main complete tools stay central with breathing space for portrait cropping. Authentic useful construction materials, not a residential interior. No people, no readable text, no logos, no brands, no watermark, no collage.
```

