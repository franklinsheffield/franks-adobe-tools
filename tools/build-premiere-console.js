#!/usr/bin/env node
"use strict";
// Assembles the Premiere Pro Lab Console (UXP) from the shared console in ae/console plus the
// Premiere files in premiere/console, into dist/premiere-console/ (load this folder in UXP
// Developer Tool) and dist/lab-console-premiere-<version>.ccx (double-click to install).
//   node tools/build-premiere-console.js
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, ".."), AE = path.join(ROOT, "ae/console"), PR = path.join(ROOT, "premiere/console");
const OUT = path.join(ROOT, "dist/premiere-console");

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d); else if (!/^(README\.md|\..*)$/.test(f)) fs.copyFileSync(s, d);
  }
}
execFileSync(process.execPath, [path.join(ROOT, "ae/tools/gen-ppro-map.js")], { stdio: "ignore" });
fs.rmSync(OUT, { recursive: true, force: true });
// shared console: styles, tool icons, look thumbnails, UI code
copyDir(path.join(AE, "css"), path.join(OUT, "css"));
copyDir(path.join(AE, "icons"), path.join(OUT, "icons"));
copyDir(path.join(AE, "thumbs"), path.join(OUT, "thumbs"));
fs.mkdirSync(path.join(OUT, "js"), { recursive: true });
for (const f of ["brewmap.js", "help.js", "convert.js", "main.js"]) fs.copyFileSync(path.join(AE, "js", f), path.join(OUT, "js", f));
// Premiere parts (manifest, adapter, map, UXP CSS) on top
copyDir(PR, OUT);
// index.html: the AE page + Premiere CSS + adapter scripts before main.js
let html = fs.readFileSync(path.join(AE, "index.html"), "utf8");
html = html.replace('<link rel="stylesheet" href="css/console.css">', '<link rel="stylesheet" href="css/console.css">\n<link rel="stylesheet" href="css/ppro.css">')
  .replace('<script src="js/main.js"></script>', '<script src="js/ppro-map.js"></script>\n<script src="js/ppro-host.js"></script>\n<script src="js/main.js"></script>')
  .replace("LAB · AE CONSOLE", "LAB · PR CONSOLE");
if (!/ppro-host\.js/.test(html) || !/ppro\.css/.test(html)) throw new Error("index.html injection failed");
fs.writeFileSync(path.join(OUT, "index.html"), html);
const man = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));
const ccx = path.join(ROOT, "dist", "lab-console-premiere-" + man.version + ".ccx");
if (fs.existsSync(ccx)) fs.unlinkSync(ccx);
execFileSync("zip", ["-qr", "-X", ccx, "."], { cwd: OUT });
console.log("built " + path.relative(ROOT, OUT) + " and " + path.relative(ROOT, ccx));
