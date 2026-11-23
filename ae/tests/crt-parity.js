"use strict";
// JS (Photoshop engine) vs C++ (After Effects engine) parity for every CRT Phaser look.
// Usage: node ae/tests/crt-parity.js <path-to-crt_cli>
const fs = require("fs"), os = require("os"), path = require("path"), { execFileSync } = require("child_process");
const root = path.join(__dirname, "..", "..");
const Engine = require(path.join(root, "plugins/crt-phaser/js/engine.js"));
const { DEFAULTS, PRESETS, merge } = require(path.join(root, "plugins/crt-phaser/js/state.js"));
const M = require(path.join(root, "shared/imgmath.js"));
const toText = require("./crt-params-text.js");

const cli = process.argv[2];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "crtpar-"));
const cases = [{ w: 240, h: 180, scale: 1 }, { w: 160, h: 120, scale: 0.5, fullH: 240 }];
let worst = 0, fails = 0;
(async () => {
  for (const c of cases) {
    const src = M.demoImage(c.w, c.h);
    fs.writeFileSync(path.join(tmp, "in.rgba"), Buffer.from(src.data));
    for (const pr of PRESETS) {
      const P = merge(DEFAULTS, pr.p); P.out.layers = "merged"; P.scale = c.scale; if (c.fullH) P.fullH = c.fullH;
      const js = (await Engine.render(src, P)).layers[0].rgba;
      fs.writeFileSync(path.join(tmp, "p.txt"), toText(P));
      execFileSync(cli, [path.join(tmp, "in.rgba"), c.w, c.h, path.join(tmp, "p.txt"), path.join(tmp, "out.rgba")].map(String));
      const cc = fs.readFileSync(path.join(tmp, "out.rgba"));
      let max = 0, sum = 0, over = 0;
      for (let i = 0; i < js.length; i++) { const d = Math.abs(js[i] - cc[i]); sum += d; if (d > max) max = d; if (d > 2) over++; }
      const mean = sum / js.length, ok = mean < 0.05 && over / js.length < 0.001;
      worst = Math.max(worst, mean);
      if (!ok) fails++;
      console.log(`${ok ? "ok  " : "FAIL"} ${c.w}x${c.h} s${c.scale}  ${pr.name.padEnd(18)} mean ${mean.toFixed(4)}  max ${max}  >2: ${over}`);
    }
  }
  console.log(fails ? `${fails} looks differ` : `all ${cases.length * PRESETS.length} renders match (worst mean diff ${worst.toFixed(4)})`);
  process.exit(fails ? 1 : 0);
})();
