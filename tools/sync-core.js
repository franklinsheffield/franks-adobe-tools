#!/usr/bin/env node
"use strict";
// Copies /shared into every plugin's core/ folder. UXP can only load files
// inside the plugin folder, so each plugin carries its own copy of the core.
// Run after editing anything in /shared:   node tools/sync-core.js
// tests/core-sync.test.js fails if a plugin's copy is out of date.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SHARED = path.join(ROOT, "shared");
const PLUGINS = path.join(ROOT, "plugins");

function plugins() {
  return fs.readdirSync(PLUGINS).filter((d) => fs.existsSync(path.join(PLUGINS, d, "manifest.json")));
}

function sync(check) {
  const files = fs.readdirSync(SHARED).filter((f) => /\.(js|css)$/.test(f));
  const stale = [];
  for (const p of plugins()) {
    const dst = path.join(PLUGINS, p, "core");
    if (!check) fs.mkdirSync(dst, { recursive: true });
    for (const f of files) {
      const src = fs.readFileSync(path.join(SHARED, f));
      const tgt = path.join(dst, f);
      const same = fs.existsSync(tgt) && Buffer.compare(fs.readFileSync(tgt), src) === 0;
      if (!same) { stale.push(path.join(p, "core", f)); if (!check) fs.writeFileSync(tgt, src); }
    }
  }
  return stale;
}

if (require.main === module) {
  const check = process.argv.includes("--check");
  const stale = sync(check);
  if (check && stale.length) { console.error("Out of date:\n  " + stale.join("\n  ") + "\nRun: node tools/sync-core.js"); process.exit(1); }
  console.log(check ? "core in sync" : (stale.length ? "updated:\n  " + stale.join("\n  ") : "already in sync"));
}
module.exports = { sync, plugins };
