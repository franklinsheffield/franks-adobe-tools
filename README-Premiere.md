# Lab effects in Premiere Pro

All 7 Lab effects run natively in Premiere Pro 2027 and Media Encoder 2027. They are the same AE plug-ins, which Premiere loads from MediaCore. They appear under **Video Effects › Plugins › Lab**.

The **Lab Console** UXP panel (`premiere/console`) works in Premiere too. It provides the same look grid, Look B morph, Reveal motion and saved looks as the AE Console.

## Install

1. Install the AE effects (see README-After-Effects.md). Premiere picks them up from the same MediaCore folder.
2. Panel: double-click `dist/lab-console-premiere-<version>.ccx`. For development, load `dist/premiere-console/` in UXP Developer Tools. Premiere › Settings › Plugins › "Enable developer mode" must be on, and Premiere restarted.
3. Build: `node tools/build-premiere-console.js`. The param map is regenerated with `node ae/tools/gen-ppro-map.js`.

## Notes

- Premiere's UXP API addresses params by position, so `ppro-map.js` maps AE param ids to positions.
- Premiere counts popup items from 0, while AE counts from 1. The panel converts between them.
- Look values come from each effect's compiled LOOKS table (`ae/effects/<tool>/<ns>_presets.h`), so the Look menu and the console grid always agree.
- The manifest `host` must be one object, not an array. With an array, UDT and Creative Cloud refuse the plugin.

## Update notes

**Milestone 2 (2026-11-25): all 7 effects + Media Encoder**

- Tested on the Mac in Premiere 2027: Depth (Terrace Stack), Halo (Blue Hour), Decompressor (Fax Machine), Chroma (Polished Gold), Dithers (Game Boy) and Paint (Loose Wash). Each was applied from the console, and each render matches its thumbnail.
- Media Encoder 2027 rendered a Premiere sequence with Paint Lab correctly.
- Fix: popups, checkboxes and colours on Depth, Halo, Decompressor, Chroma, Dithers and Paint now get the correct kind. Previously some popups were off by one in Premiere.
- Fix: console looks now use the AE LOOKS tables. Before this, some looks set another look's values, such as Depth Terrace Stack rendering as Topo Map, and Scanline looks from #23 on.
- Tests: every param on all 7 effects has a kind, and every Look-menu entry has values.

**Milestone 1 (2026-11-25): Scanline Lab + Lab Console in Premiere** (PR #7)
