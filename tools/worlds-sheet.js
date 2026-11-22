#!/usr/bin/env node
"use strict";
// Renders every built-in Worlds Brew scene to PNG (plus one wireframe) for the look check, and prints timings.
//   node tools/worlds-sheet.js <out-dir> [width=480] [aa=2]
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const S = require(ROOT + "/plugins/worlds-brew/js/scene.js"), E = require(ROOT + "/plugins/worlds-brew/js/engine.js"), Wf = require(ROOT + "/plugins/worlds-brew/js/wire.js");
const PNG = require(ROOT + "/shared/png.js");
const out = process.argv[2] || "worlds-sheet", W = +(process.argv[3] || 480), H = Math.round(W * 9 / 16), AA = +(process.argv[4] || 2);
fs.mkdirSync(out, { recursive: true });
const rgb = (rgba, n) => { const a = new Uint8Array(n * 3); for (let p = 0; p < n; p++) { a[p * 3] = rgba[p * 4]; a[p * 3 + 1] = rgba[p * 4 + 1]; a[p * 3 + 2] = rgba[p * 4 + 2]; } return a; };
(async () => {
  const times = {};
  for (const name of Object.keys(S.PRESETS)) {
    const s = S.loadPreset(name), r = await E.render(s, s.cam, W, H, { aa: AA });
    fs.writeFileSync(path.join(out, name.replace(/\s+/g, "-").toLowerCase() + ".png"), Buffer.from(PNG.encodePNG(rgb(r.rgba, W * H), W, H, 3)));
    times[name] = Math.round(r.ms); console.log(name.padEnd(16), (r.ms / 1000).toFixed(2) + " s");
  }
  const s = S.loadPreset("Chrome Garden"), wf = Wf.wireframe(s, s.cam, W, H, { sel: s.objs[1], gizmo: "move" });
  fs.writeFileSync(path.join(out, "_wireframe.png"), Buffer.from(PNG.encodePNG(rgb(wf.rgba, W * H), W, H, 3)));
  fs.writeFileSync(path.join(out, "times.json"), JSON.stringify({ width: W, height: H, aa: AA, node: process.version, ms: times }, null, 1));
})();
