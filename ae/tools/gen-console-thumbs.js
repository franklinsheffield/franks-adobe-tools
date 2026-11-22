"use strict";
// Renders every look of every AE Brew tool on the suite's look sample (Frank's group photo)
// with the Photoshop engines (bit-exact with the AE effects) -> ae/console/thumbs/<tool>-<n>.jpg
// Usage: node ae/tools/gen-console-thumbs.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "..");
const PNG = require(path.join(root, "shared/png.js"));
const { merge } = require(path.join(root, "shared/imgmath.js"));
const dest = path.join(root, "ae/console/thumbs"); fs.mkdirSync(dest, { recursive: true });
function decode(smp) {
  const buf = Buffer.from(smp.rgb, "base64"), n = smp.w * smp.h, data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { data[i * 4] = buf[i * 3]; data[i * 4 + 1] = buf[i * 3 + 1]; data[i * 4 + 2] = buf[i * 3 + 2]; data[i * 4 + 3] = 255; }
  return { w: smp.w, h: smp.h, c: 4, data };
}
(async () => {
  for (const tool of ["crt-phaser", "mobglow", "depthtone", "decompressor"]) {
    const dir = path.join(root, "plugins", tool);
    const Engine = require(path.join(dir, "js/engine.js"));
    const { DEFAULTS, PRESETS } = require(path.join(dir, "js/state.js"));
    const src = decode(require(path.join(dir, "look-sample.js")));
    let i = 0;
    for (const pr of PRESETS) {
      i++;
      const P = merge(DEFAULTS, pr.p);
      Object.assign(P, { scale: 1, fullH: src.h, fullW: src.w });
      const res = await Engine.render(src, P);
      const rgb = Engine.composite(res, { type: (DEFAULTS.view && DEFAULTS.view.bg) || "black" }, src);
      fs.writeFileSync(path.join(dest, `${tool}-${i}.png`), Buffer.from(PNG.encodePNG(rgb, res.w, res.h, 3)));
    }
    console.log(tool, i, "thumbs");
  }
  // shrink to 160 px JPEGs (6 MB of PNGs -> about 0.4 MB)
  require("child_process").execFileSync("python3", ["-c",
    "import glob,os\nfrom PIL import Image\nfor f in glob.glob(os.path.join(" + JSON.stringify(dest) + ",'*.png')):\n  im=Image.open(f).convert('RGB'); im.thumbnail((160,160)); im.save(f[:-4]+'.jpg',quality=85); os.remove(f)"], { stdio: "inherit" });
})().catch((e) => { console.error(e); process.exit(1); });
