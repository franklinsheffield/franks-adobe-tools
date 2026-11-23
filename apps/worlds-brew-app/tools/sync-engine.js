#!/usr/bin/env node
"use strict";
// Copies the shared Worlds Brew engine (plugins/worlds-brew/js) and the suite UI kit (shared/) into engine/,
// so the app and the Photoshop plugin render the same scenes with the same code.
//   node tools/sync-engine.js          copy
//   node tools/sync-engine.js --check  list stale files, exit 1 if any
const fs = require("fs"), path = require("path");
const APP = path.resolve(__dirname, ".."), REPO = path.resolve(APP, "../.."), OUT = path.join(APP, "engine");
const SRC = [[path.join(REPO, "plugins/worlds-brew/js"), null], [path.join(REPO, "shared"), ["ui.js", "console.js", "png.js", "layout.js", "panel.css"]]];
function files() {
  const list = [[path.join(APP, "node_modules/three/examples/jsm/controls/TransformControls.js"), path.join(APP, "renderer/vendor/TransformControls.js")]];   // packaged apps leave out node_modules/*/examples
  for (const [dir, only] of SRC) for (const f of fs.readdirSync(dir)) if ((!only || only.includes(f)) && /\.(js|css)$/.test(f)) list.push([path.join(dir, f), path.join(OUT, f)]);
  return list;
}
function sync(check) {
  const stale = [];
  if (!check) fs.mkdirSync(OUT, { recursive: true });
  for (const [a, b] of files()) {
    const src = fs.readFileSync(a), same = fs.existsSync(b) && Buffer.compare(src, fs.readFileSync(b)) === 0;
    if (!same) { stale.push(path.basename(b)); if (!check) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.writeFileSync(b, src); } }
  }
  return stale;
}
if (require.main === module) {
  const check = process.argv.includes("--check"), s = sync(check);
  console.log(check ? (s.length ? "stale: " + s.join(", ") : "engine up to date") : "synced " + s.length + " file(s) into engine/");
  if (check && s.length) process.exit(1);
}
module.exports = { sync };
