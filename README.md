[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/canglvam/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/canglvam/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Palms & Neon — GTA-style Cover Maker

Turn a photo and a caption into GTA 6-style poster cover art: the multi-panel
poster look, bold lettering, a Vice City sunset or neon colour grade, exported
as a PNG to share. Built for the
[make.fun "Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01).

## How it works

1. Add up to three photos (upload your own, or use the two built-in samples).
   Photos are read on your own machine and never uploaded anywhere.
2. Pick one of five layouts: Classic, Duo, Quad, Solo, or Strip.
3. Pick one of six colour grades: Vice Sunset, Neon Nights, Hot Pink,
   Golden Hour, Teal Noir, or Noir Mono.
4. Type a title and a subtitle — the title is lettered in Anton, the subtitle
   in Pacifico, with a synthwave sun and a palm silhouette drawn in code.
5. Click a panel to select it, drag it to move the photo inside the panel,
   scroll to zoom, or use the sliders. Undo and redo are one click away.
6. Export the cover as a PNG in 1080 × 1080, 1080 × 1350, or 1920 × 1080 —
   or all three at once.

## Try it

The app is plain static files under `app/` — no build step, no network:

```sh
node serve.ts
# open http://localhost:8080
```

The program at `main.ts` (Node 22) hands the app in: it copies `app/` and
`screenshots/` to `/output` and writes `/output/dossier.json`.

## What is in here

- `app/index.html`, `app/style.css` — the page and its dark neon styling
- `app/src/cover.js` — the cover renderer: layouts, colour grades, the
  synthwave sun, the palm, the caption lettering
- `app/src/main.js` — the editor wiring: photos, panels, undo/redo, export
- `app/src/shots.js` — fixed scenes for the screenshots (`?shot=editor`,
  `?shot=cover`)
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License
  (`OFL.txt`); `app/samples/` — two sample photos made for make.fun
- `screenshots/` — the app at work and the covers it exported

Everything is original: no Rockstar Games logo, official artwork, or fonts.

## License

MIT — see `LICENSE`.
