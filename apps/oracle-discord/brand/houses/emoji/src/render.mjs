import { createRequire } from "module"; const { chromium } = createRequire("/home/user/repo/")("playwright");
import { KITS, ANIM } from "./art.mjs";
import fs from "fs";
const N = 24;
fs.mkdirSync("frames", { recursive: true });
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 1 });
await pg.setContent(`<html><body style="margin:0;background:transparent"><div id="s"></div></body></html>`);
const only = process.argv[2];
for (const k of KITS) for (const [nm, fn] of Object.entries(k.items)) {
  const id = `${k.p}_${nm}`; if (only && !id.startsWith(only)) continue;
  const ts = ANIM.has(nm) ? Array.from({ length: N }, (_, i) => i / N) : [0];
  if (nm === "cheer") ts.push(k.still);
  for (let i = 0; i < ts.length; i++) {
    await pg.evaluate((svg) => { document.getElementById("s").innerHTML = svg; }, `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 128 128" overflow="visible">${fn(ts[i])}</svg>`);
    const name = ANIM.has(nm) ? (i === N ? `${id}_still` : `${id}_${String(i).padStart(2, "0")}`) : id;
    await pg.locator("svg").screenshot({ path: `frames/${name}.png`, omitBackground: true });
  }
}
await b.close();
