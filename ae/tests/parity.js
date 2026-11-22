"use strict";
// JS (Photoshop engine) vs C++ (After Effects engine) parity for every look of a wave-2 tool.
// Usage: node ae/tests/parity.js <mobglow|depthtone|decompressor|chrometone> <path-to-tool_cli>
const fs = require("fs"), os = require("os"), path = require("path"), { execFileSync } = require("child_process");
const root = path.join(__dirname, "..", "..");
const tool = process.argv[2], cli = process.argv[3];
const Engine = require(path.join(root, `plugins/${tool}/js/engine.js`));
const { DEFAULTS, PRESETS, merge } = require(path.join(root, `plugins/${tool}/js/state.js`));
const M = require(path.join(root, "shared/imgmath.js"));
const toText = require("./params-text.js");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "par-"));
const cases = [{ w: 240, h: 180, scale: 1 }, { w: 160, h: 120, scale: 0.5, fullH: 240, fullW: 320 }];
// Chrometone also builds an outline surface from transparent shapes: test that path too
if (tool === "dithers-brew") cases.push({ w: 200, h: 150, scale: 1, shape: true, ppi: 300 }, { w: 180, h: 140, scale: 1, ppi: 150 });
if (tool === "chrometone") cases.push({ w: 200, h: 150, scale: 1, shape: true }, { w: 200, h: 150, scale: 0.5, shape: true });
function shapeImage(w, h) {          // a soft-edged ring + bar logo on transparency
  const s = M.demoImage(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - w * 0.4, dy = y - h * 0.5, r = Math.hypot(dx, dy), ring = Math.abs(r - h * 0.28) < h * 0.09;
    const bar = x > w * 0.68 && x < w * 0.86 && y > h * 0.2 && y < h * 0.8;
    s.data[(y * w + x) * 4 + 3] = ring || bar ? 255 : 0;
  }
  return s;
}
let worst = 0, fails = 0;
(async () => {
  for (const c of cases) {
    const src = c.shape ? shapeImage(c.w, c.h) : M.demoImage(c.w, c.h);
    fs.writeFileSync(path.join(tmp, "in.rgba"), Buffer.from(src.data));
    for (const pr of PRESETS) {
      const P = merge(DEFAULTS, pr.p); P.scale = c.scale; if (P.out) P.out.layers = "merged"; if (c.fullH) { P.fullH = c.fullH; P.fullW = c.fullW; }
      if (tool === "dithers-brew") P.ppi = c.ppi || 300;
      const res = await Engine.render(src, P);
      const js = tool === "dithers-brew" ? Engine.composite(res, { type: "white" }) : tool === "decompressor" || tool === "chrometone" ? res.layers[0].rgba : M.composite(res, { type: "black" }, src);
      fs.writeFileSync(path.join(tmp, "p.txt"), toText(P));
      execFileSync(cli, [tool, path.join(tmp, "in.rgba"), c.w, c.h, path.join(tmp, "p.txt"), path.join(tmp, "out.bin")].map(String));
      const cc = fs.readFileSync(path.join(tmp, "out.bin"));
      if (cc.length !== js.length) { console.log("FAIL size", pr.name, cc.length, js.length); fails++; continue; }
      let max = 0, sum = 0, over = 0;
      for (let i = 0; i < js.length; i++) { const d = Math.abs(js[i] - cc[i]); sum += d; if (d > max) max = d; if (d > 2) over++; }
      const mean = sum / js.length, ok = mean < 0.05 && over / js.length < 0.001;
      worst = Math.max(worst, mean); if (!ok) fails++;
      console.log(`${ok ? "ok  " : "FAIL"} ${c.w}x${c.h} s${c.scale}  ${pr.name.padEnd(18)} mean ${mean.toFixed(4)}  max ${max}  >2: ${over}`);
    }
  }
  console.log(fails ? `${fails} looks differ` : `all ${cases.length * PRESETS.length} renders match (worst mean diff ${worst.toFixed(4)})`);
  process.exit(fails ? 1 : 0);
})();
