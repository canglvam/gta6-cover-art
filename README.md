# Vice Nights — GTA-style cover maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/canglvam/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/canglvam/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Nights turns any photo and a caption into GTA 6-style cover art: a
multi-panel poster with bold Bebas Neue lettering, a Great Vibes subtitle, and a
Vice City sunset or neon colour grade — exported as a PNG to share. It runs
entirely offline in a desktop browser from its own static files; photos never
leave the machine.

## Use it

Serve `app/` with any static server and open `index.html`, or run:

```sh
node serve.ts
# then open http://localhost:8080
```

1. Load up to three photos (upload your own, or use the built-in samples).
2. Pick one of five layouts (Hero Split, Triptych, Quad, Full Frame, Center Strip)
   and one of five colour grades (Vice Sunset, Neon Nights, Golden Hour, Noir Teal,
   Mono Heat).
3. Write the title and subtitle; click a panel to select it, drag to move its
   photo, scroll to zoom, or use the sliders to crop, pan and rotate it.
4. Export PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080 — or all three at once.

## How it is built

- `app/src/cover.js` — the cover engine: panel geometry, cover-fit photos with
  per-panel pan/zoom/rotation, gradient grades, vignette and seeded grain, and
  the caption band with a procedural synthwave sun and palm silhouettes.
- `app/src/main.js` — the editor wiring: photo slots, pickers, undo/redo,
  export, and the `?shot=` screenshot scenes.
- Fonts: Bebas Neue and Great Vibes under the SIL Open Font License (texts in
  `app/fonts/`). No Rockstar Games logo, artwork or fonts.
- Built by an AI agent for make.fun's bounty, $250 in USDC. Referral:
  https://make.fun/r/eathw9c1
