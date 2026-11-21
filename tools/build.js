#!/usr/bin/env node
"use strict";
// Builds an installable .ccx for every plugin into dist/.
//   node tools/build.js
// A .ccx is a zip of the plugin folder (manifest.json at the root).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { sync, plugins } = require("./sync-core.js");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
fs.mkdirSync(DIST, { recursive: true });
sync(false);
for (const p of plugins()) {
  const dir = path.join(ROOT, "plugins", p);
  const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const out = path.join(DIST, p + "-" + man.version + ".ccx");
  if (fs.existsSync(out)) fs.unlinkSync(out);
  // legacy/ and README stay out of the package
  execFileSync("zip", ["-qr", "-X", out, ".", "-x", "legacy/*", "README.md", ".*"], { cwd: dir });
  console.log("built " + path.relative(ROOT, out));
}
