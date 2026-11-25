#!/usr/bin/env node
"use strict";
// Assembles the After Effects Lab Console as a UXP panel (After Effects 27 UXP) from the shared
// console in ae/console plus the UXP files in ae/uxp, into dist/ae-uxp-console/ (load this folder
// in UXP Developer Tool) and dist/lab-console-ae-<version>.ccx (double-click to install).
// The CEP console (ae/console + jsx/host.jsx) stays as it is for After Effects without UXP.
//   node tools/build-ae-uxp-console.js
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, ".."), AE = path.join(ROOT, "ae/console"), UX = path.join(ROOT, "ae/uxp");
const OUT = path.join(ROOT, "dist/ae-uxp-console");

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d); else if (!/^(README\.md|\..*)$/.test(f)) fs.copyFileSync(s, d);
  }
}
fs.rmSync(OUT, { recursive: true, force: true });
// shared console: styles, tool icons, look thumbnails, UI code (no CEP files: jsx, CSXS, CSInterface)
copyDir(path.join(AE, "css"), path.join(OUT, "css"));
copyDir(path.join(AE, "icons"), path.join(OUT, "icons"));
copyDir(path.join(AE, "thumbs"), path.join(OUT, "thumbs"));
fs.mkdirSync(path.join(OUT, "js"), { recursive: true });
for (const f of ["brewmap.js", "help.js", "convert.js", "main.js"]) fs.copyFileSync(path.join(AE, "js", f), path.join(OUT, "js", f));
// UXP parts (manifest, adapter, flex-grid CSS) on top
copyDir(UX, OUT);
let html = fs.readFileSync(path.join(AE, "index.html"), "utf8");
html = html.replace('<link rel="stylesheet" href="css/console.css">', '<link rel="stylesheet" href="css/console.css">\n<link rel="stylesheet" href="css/uxp.css">')
  .replace('<script src="js/main.js"></script>', '<script src="js/aeuxp-host.js"></script>\n<script src="js/main.js"></script>')
  .replace(/<script src="js\/CSInterface\.js"><\/script>\n?/, "");
if (!/aeuxp-host\.js/.test(html) || !/uxp\.css/.test(html)) throw new Error("index.html injection failed");
fs.writeFileSync(path.join(OUT, "index.html"), html);
const man = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
const ccx = path.join(ROOT, "dist", "lab-console-ae-" + man.version + ".ccx");
if (fs.existsSync(ccx)) fs.unlinkSync(ccx);
execFileSync("zip", ["-qr", "-X", ccx, "."], { cwd: OUT });
console.log("built " + path.relative(ROOT, OUT) + " and " + path.relative(ROOT, ccx));
