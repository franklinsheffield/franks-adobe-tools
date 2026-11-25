#!/usr/bin/env node
"use strict";
// Copies each plugin's display name from plugins/<tool>/brand.js into manifest.json
// (name + every panel label). Ids, versions and folders are left alone.
//   node tools/sync-brand.js          write
//   node tools/sync-brand.js --check  list mismatches, exit 1 if any
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const PLUGINS = path.join(ROOT, "plugins");

function run(check) {
  const bad = [];
  for (const p of fs.readdirSync(PLUGINS)) {
    const bf = path.join(PLUGINS, p, "brand.js"), mf = path.join(PLUGINS, p, "manifest.json");
    if (!fs.existsSync(bf) || !fs.existsSync(mf)) continue;
    delete require.cache[require.resolve(bf)];
    const { NAME } = require(bf);
    const txt = fs.readFileSync(mf, "utf8");
    const m = JSON.parse(txt);
    let changed = m.name !== NAME;
    m.name = NAME;
    for (const e of m.entrypoints || []) if (e.label && e.label.default !== NAME) { e.label.default = NAME; changed = true; }
    if (changed) { bad.push(p); if (!check) fs.writeFileSync(mf, JSON.stringify(m, null, 2) + (txt.endsWith("\n") ? "\n" : "")); }
  }
  return bad;
}
if (require.main === module) {
  const check = process.argv.includes("--check");
  const bad = run(check);
  console.log((check ? "out of date: " : "updated: ") + (bad.join(", ") || "none"));
  if (check && bad.length) process.exit(1);
}
module.exports = { run };
