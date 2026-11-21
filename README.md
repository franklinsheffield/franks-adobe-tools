# Frank's Adobe Tools

A suite of Photoshop (and later After Effects) effect panels for the team's branding work. Every tool shares one core, so they all look and behave the same way: a live panel preview, a Library card with presets your team can share, and results written to new layers as one undo step.

| Tool | Status |
|---|---|
| Frank's Dithers Brew | v1.0 rebuilt on the shared core. Not yet tested in Photoshop. |
| Chrome / CRT / Depth / Glow / Decompress tools | Planned. Each gets its own name and design. |

## Layout

```
shared/          the core every tool uses (edit here only)
  ps-io.js       all Photoshop calls: read pixels, write layers + group, presets on disk
  ui.js          panel controls (sliders, toggles, colour fields, cards)
  preview.js     debounced preview loop that pauses during Apply
  library.js     Library card: presets, save / delete / export / import
  png.js         PNG encoder for the preview image
  panel.css      shared panel styles
plugins/<tool>/  one UXP plugin per tool; core/ is a synced copy of shared/
tools/           sync-core.js (copy shared/ into each plugin), build.js (make .ccx files)
tests/           Node tests incl. a headless panel run against fake Photoshop
```

## Working on it

```
npm install          # jsdom, for the headless panel tests
npm test             # all tests
npm run sync         # after editing anything in shared/
npm run build        # writes dist/<tool>-<version>.ccx
```

UXP only loads files from inside a plugin's own folder, which is why each plugin carries a copy of the core. `npm test` fails if a copy is out of date.

## Loading a plugin in Photoshop

1. Install **UXP Developer Tool** from Creative Cloud Desktop.
2. **Add Plugin**, pick `plugins/<tool>/manifest.json`.
3. Start Photoshop 24.4+ and click **Load**.
