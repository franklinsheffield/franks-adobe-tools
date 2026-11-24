#!/usr/bin/env node
"use strict";
// Copies the shared Worlds Lab engine (plugins/worlds-brew/js) into engine/ and the suite UI kit (shared/) into engine/kit/,
// so the app and the Photoshop plugin render the same scenes with the same code.
//   node tools/sync-engine.js          copy
//   node tools/sync-engine.js --check  list stale files, exit 1 if any
const fs = require("fs"), path = require("path");
const APP = path.resolve(__dirname, ".."), REPO = path.resolve(APP, "../.."), OUT = path.join(APP, "engine");
// the suite UI kit goes in engine/kit/ (its controls.js is not the engine's camera controls.js)
const KIT = ["ui.js", "console.js", "png.js", "layout.js", "panel.css", "controls.js", "help.js", "help-text.js", "pixfont.js"];
const SRC = [[path.join(REPO, "plugins/worlds-brew/js"), null, OUT], [path.join(REPO, "shared"), KIT, path.join(OUT, "kit")]];
function files() {
  const list = [[path.join(APP, "node_modules/three/examples/jsm/controls/TransformControls.js"), path.join(APP, "renderer/vendor/TransformControls.js")]];   // packaged apps leave out node_modules/*/examples
  for (const [dir, only, to] of SRC) for (const f of fs.readdirSync(dir)) if ((!only || only.includes(f)) && /\.(js|css)$/.test(f)) list.push([path.join(dir, f), path.join(to, f)]);
  return list;
}
function sync(check) {
  const stale = [];
  if (!check) fs.mkdirSync(OUT, { recursive: true });
  for (const [a, b] of files()) {
    const src = fs.readFileSync(a), same = fs.existsSync(b) && Buffer.compare(src, fs.readFileSync(b)) === 0;
    if (!same) { stale.push(path.basename(b)); if (!check) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.writeFileSync(b, src); } }
  }
  return stale.concat(require("./tokens-css.js").sync(check));   // + renderer/tokens.css from the suite's design tokens
}
if (require.main === module) {
  const check = process.argv.includes("--check"), s = sync(check);
  console.log(check ? (s.length ? "stale: " + s.join(", ") : "engine up to date") : "synced " + s.length + " file(s) into engine/");
  if (check && s.length) process.exit(1);
}
module.exports = { sync };
