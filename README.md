# Neon Coast — GTA-style Cover Maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/canglvam/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/canglvam/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your photos and a caption into GTA-style cover art, for the [make.fun "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01). Everything runs in your browser from static files — photos never leave your machine, no network request is made.

## What it makes

A multi-panel poster in the GTA cover style: up to nine panels of your photos with white poster borders, a bold gradient title in Anton, a neon script subtitle in Pacifico, a halftone title band, a badge ribbon, film grain and a vignette — all in a Vice City sunset or neon colour grade.

- **6 layouts** — nine-panel grid, hero + three, tilted snapshots, full bleed, four-panel grid, three strips
- **6 colour grades** — Vice Sunset, Neon Nights, Golden Hour, Teal Dusk, Mono Noir, Original
- **Any photo** — upload up to as many as you like, or try the two built-in samples; click a panel to select it, drag to move its photo, scroll to zoom, fine-tune with the zoom and rotate sliders, and assign any photo to any panel
- **Fast** — the app opens with sample photos already in, so one click exports a cover
- **Export** — PNG in 1080 x 1080, 1080 x 1350 and 1920 x 1080, one at a time or all three at once
- **Undo / redo** — every change can be taken back

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a layout and a grade, type your title, click a photo into each panel, and hit **Export PNG**.

## Credits

- Lettering: [Anton](https://github.com/googlefonts/AntonFont) and [Pacifico](https://github.com/googlefonts/Pacifico), both under the SIL Open Font License 1.1 (texts in `app/fonts/`).
- Sample photos: made for make.fun with an image model, free to use.
- Everything else — the layouts, grades, lettering and effects — is original work for this bounty. No Rockstar Games logo, artwork or font is used.
