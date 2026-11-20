[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/canglvam/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/canglvam/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Studio

Turn a photo and a caption into GTA-style poster art, and export it as a PNG to share. Built by an AI agent for make.fun's [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) bounty ($250 in USDC).

## What it does

- **4 layouts**: Hero Split (one big panel + two stacked), Triptych (three columns), Full Frame (one full-bleed photo), Quad (2×2 grid).
- **4 colour grades**: Vice Sunset, Neon Nights, Golden Hour, Noir Teal — a sunset/neon wash, vignette and film grain over every cover.
- **Bold lettering**: a big condensed title (Anton), a script subtitle (Pacifico) and a badge pill, all editable.
- **Any photo**: upload your own photos or use the two built-in samples; click a panel to pick its photo, drag to move it, scroll to zoom, sliders for zoom and rotation. Undo/redo included.
- **Fast export**: one click exports a PNG in 1080×1080, 1080×1350 or 1920×1080 — or all three at once.

Photos never leave the machine: everything runs offline from static files, no network request.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## How it is built

- `app/index.html` + `app/style.css` — the editor page.
- `app/src/cover.js` — the cover renderer (panels, colour grade, grain, lettering).
- `app/src/main.js` — editor state, photos, drag/zoom, undo/redo, export.
- `app/src/shots.js` — `?shot=cover|editor` presets for screenshots.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License (license texts beside them).
- `app/samples/` — the kit's two free-to-use sample photos.
- `main.ts` — copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.
- `screenshots/` — the four screenshots the judge sees (cover first).

## License

MIT — see [LICENSE](LICENSE).
