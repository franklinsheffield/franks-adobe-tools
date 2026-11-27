#!/usr/bin/env node
// Builds data/models-index.json: a compact copy of Frank's 3D library catalogue (web-pipeline-kit /library/models.json)
// for the /model command and the Activity's 3D Library panel. Files stay where they are (public assets repo); this
// only lists them.
//   node scripts/build-model-index.js [catalogue URL or path]   (default: the live kit site)
"use strict";
const fs = require("fs"), path = require("path");
const SRC = process.argv[2] || "https://web-pipeline-kit.vercel.app/library/models.json";
const OUT = path.join(__dirname, "..", "data", "models-index.json");
// one row per model, in this order (keep in sync with src/models.mjs FIELDS)
const FIELDS = ["id", "name", "file", "category", "style", "pack", "author", "license", "attribution", "tris", "bytes", "thumb", "vibes", "tags", "pointCloud"];
const OK_LICENCE = /^(CC0|CC[- ]BY(?![- ]?(NC|ND|SA))|Public domain|Three D Scans|Apache)/i;   // the kit's rule: no NC / ND / SA / EULA

(async () => {
  const raw = /^https?:/.test(SRC) ? await (await fetch(SRC)).text() : fs.readFileSync(SRC, "utf8");
  const items = JSON.parse(raw).items;
  if (!Array.isArray(items) || items.length < 100) throw new Error("catalogue looks wrong: " + (items && items.length) + " items");
  const rows = [], skipped = [];
  for (const m of items) {
    if (m.excludeFromKit || m.hosted === "usb" || !m.file || !OK_LICENCE.test(String(m.license || ""))) { skipped.push(m.id); continue; }
    rows.push([m.id, m.name, m.file, m.category || "", m.style || "", m.pack || "", m.author || "", m.license || "", m.attribution ? 1 : 0,
      m.tris || 0, m.bytes || 0, m.thumb || "", (m.vibes || []).join(" "), (m.tags || []).join(" "), m.pointCloud ? 1 : 0]);
  }
  const out = { v: 1, built: new Date().toISOString().slice(0, 10), source: /^https?:/.test(SRC) ? SRC : "local file", count: rows.length,
    files: "https://raw.githubusercontent.com/franklinsheffield/web-pipeline-assets/main/models/", site: "https://web-pipeline-kit.vercel.app", fields: FIELDS, rows };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`models index: ${rows.length} models (${skipped.length} skipped), ${(fs.statSync(OUT).size / 1e6).toFixed(2)} MB -> ${path.relative(process.cwd(), OUT)}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
