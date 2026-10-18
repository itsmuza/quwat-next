# Quwat homepage photo assets

Current header photos were replaced on2026-10-15 with eight hardware-use scenes under `public/img/header/`, with automatic horizontal advance every3 seconds. See [HEADER_HARDWARE_IMAGES.md](HEADER_HARDWARE_IMAGES.md) for current assets and exact prompts. The original photos below remain for the separate advertising section and historical documentation.

Created 2026-10-14 using the built-in `image_gen.imagegen` tool. These are conceptual construction/store scenes, not photographs of an actual Quwat location. No external stock-photo service or new dependency was used.

## Delivered assets

- `public/img/fiber/quwat-bricklaying.webp`
- `public/img/fiber/quwat-drilling.webp`
- `public/img/fiber/quwat-fastening.webp`
- `public/img/fiber/quwat-plumbing.webp`
- `public/img/fiber/quwat-electrical.webp`
- `public/img/fiber/quwat-painting.webp`
- `public/img/fiber/quwat-door-hardware.webp`
- `public/img/fiber/quwat-repair-tools.webp`
- `public/img/banner/quwat-warehouse.webp`

Each selected PNG was converted to RGB WebP (quality 82, method 6), preserving its original pixel dimensions. Original legacy assets are retained. Only the homepage FiberContainer URLs and the homepage `.header-main` background reference change.

## Exact generation prompts

For each floating photo, the following shared prefix was concatenated with its scene text below:

```text
Use case: photorealistic-natural. Asset type: Quwat construction supply store homepage floating photo panel. Create one premium editorial photograph, landscape 3:2, realistic natural side lighting, warm neutral colours, red brick and charcoal accents, high detail materials, softly blurred background. Composition: keep the complete main tool, hands and work action inside the central 45% of frame, with generous environment all around for square and portrait cropping. Show the actual process, not a finished luxury interior. No readable text, no logos, no brands, no watermark, no collage, no decorative border. Credible hands, accurate tools and safe working posture. All photos belong to a visually consistent construction renovation series. Scene: 
```

### bricklaying

A mason wearing work gloves carefully lays a red clay brick with mortar and a steel trowel on a low unfinished brick wall. Clean authentic construction site.

### drilling

A construction worker wearing safety glasses and gloves drills an anchor hole into a masonry wall using an unbranded cordless rotary drill. Visible side view of drill and gloved hands, believable anatomy and tool mechanics.

### fastening

Gloved hands drive a screw into a timber framework with an unbranded cordless driver; a small tray of screws and anchors nearby. Convincing carpentry work.

### plumbing

Gloved hands tighten a connection on a neat white polypropylene water pipe installation with a pipe wrench. An unfinished bathroom wall, credible straight pipe fittings.

### electrical

An electrician's gloved hands carefully fit a socket faceplate onto a disconnected wall outlet in an unfinished room. Nearby insulated hand tools, safe work without sparks or exposed live wiring.

### painting

A worker's hands roll fresh warm white paint onto an interior wall with a paint roller; a paint tray and brushes visible, authentic renovation scene.

### door-hardware

A craftsman's gloved hands fit a brushed metal lever handle onto a plain wooden interior door with a screwdriver. Convincing hinge and handle proportions.

### repair-tools

A workbench during home repair: gloved hands measuring a timber board with a tape measure, with pliers, hammer, screwdriver and fastener tray neatly nearby.

### Warehouse background

```text
Use case: photorealistic-natural. Asset type: Quwat building materials store homepage hero background. One premium wide panoramic editorial photograph, landscape 16:9. Interior of a tidy building supplies warehouse and hardware shop, central aisle perspective, shelving with anonymous paint buckets, pipe fittings, hardware boxes, neatly stacked timber and brick pallets, softly lit industrial roof. Warm neutral and charcoal colours, natural warm side lighting like the construction photo series. Upper third relatively quiet and dark for white navigation; central space calm because floating photos will overlap it. No people, no signage, no readable text, no logo, no brand, no watermark, no collage. This is a conceptual store photograph, not an actual store identity.
```

## Composition refinements

The selected drilling, electrical, plumbing and painting photographs were edited with their first generated photograph as the reference. Exact prompts:

### drilling

```text
Edit this construction photograph for a narrow homepage photo panel. Keep the same editorial photographic style, warm light, colour palette and construction process. Reframe into a much wider environmental shot: make the worker, complete tool, hands and point of work 50% smaller in the frame than currently. Place the ENTIRE primary tool and contact point exactly around the image centre, inside the middle 30% of the image width and middle 60% height. Include generous context space on BOTH sides. Critical: the complete action must remain readable after cropping to only the central third of the photo. Landscape 3:2 photograph, no lettering, brand logos, watermark, or borders. Scene: A construction worker wearing safety glasses and gloves drills an anchor hole into a masonry wall using an unbranded cordless rotary drill. Visible side view of drill and gloved hands, believable anatomy and tool mechanics.
```

### plumbing

```text
Edit this construction photograph for a narrow homepage photo panel. Keep the same editorial photographic style, warm light, colour palette and construction process. Reframe into a much wider environmental shot: make the worker, complete tool, hands and point of work 50% smaller in the frame than currently. Place the ENTIRE primary tool and contact point exactly around the image centre, inside the middle 30% of the image width and middle 60% height. Include generous context space on BOTH sides. Critical: the complete action must remain readable after cropping to only the central third of the photo. Landscape 3:2 photograph, no lettering, brand logos, watermark, or borders. Scene: Gloved hands tighten a connection on a neat white polypropylene water pipe installation with a pipe wrench. An unfinished bathroom wall, credible straight pipe fittings.
```

### electrical

```text
Edit this construction photograph for a narrow homepage photo panel. Keep the same editorial photographic style, warm light, colour palette and construction process. Reframe into a much wider environmental shot: make the worker, complete tool, hands and point of work 50% smaller in the frame than currently. Place the ENTIRE primary tool and contact point exactly around the image centre, inside the middle 30% of the image width and middle 60% height. Include generous context space on BOTH sides. Critical: the complete action must remain readable after cropping to only the central third of the photo. Landscape 3:2 photograph, no lettering, brand logos, watermark, or borders. Scene: An electrician's gloved hands carefully fit a socket faceplate onto a disconnected wall outlet in an unfinished room. Nearby insulated hand tools, safe work without sparks or exposed live wiring.
```

### painting

```text
Edit this construction photograph for a narrow homepage photo panel. Keep the same editorial photographic style, warm light, colour palette and construction process. Reframe into a much wider environmental shot: make the worker, complete tool, hands and point of work 50% smaller in the frame than currently. Place the ENTIRE primary tool and contact point exactly around the image centre, inside the middle 30% of the image width and middle 60% height. Include generous context space on BOTH sides. Critical: the complete action must remain readable after cropping to only the central third of the photo. Landscape 3:2 photograph, no lettering, brand logos, watermark, or borders. Scene: A worker's hands roll fresh warm white paint onto an interior wall with a paint roller; a paint tray and brushes visible, authentic renovation scene.
```

