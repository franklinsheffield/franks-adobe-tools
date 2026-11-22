"use strict";
// JS (Photoshop engine) vs C++ (After Effects engine) parity for every look of a wave-2 tool.
// Usage: node ae/tests/parity.js <mobglow|depthtone|decompressor> <path-to-tool_cli>
const fs = require("fs"), os = require("os"), path = require("path"), { execFileSync } = require("child_process");
const root = path.join(__dirname, "..", "..");
const tool = process.argv[2], cli = process.argv[3];
const Engine = require(path.join(root, `plugins/${tool}/js/engine.js`));
const { DEFAULTS, PRESETS, merge } = require(path.join(root, `plugins/${tool}/js/state.js`));
const M = require(path.join(root, "shared/imgmath.js"));
const toText = require("./params-text.js");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "par-"));
const cases = [{ w: 240, h: 180, scale: 1 }, { w: 160, h: 120, scale: 0.5, fullH: 240, fullW: 320 }];
let worst = 0, fails = 0;
(async () => {
  for (const c of cases) {
    const src = M.demoImage(c.w, c.h);
    fs.writeFileSync(path.join(tmp, "in.rgba"), Buffer.from(src.data));
    for (const pr of PRESETS) {
      const P = merge(DEFAULTS, pr.p); P.scale = c.scale; if (c.fullH) { P.fullH = c.fullH; P.fullW = c.fullW; }
      const res = await Engine.render(src, P);
      const js = tool === "decompressor" ? res.layers[0].rgba : M.composite(res, { type: "black" }, src);
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
