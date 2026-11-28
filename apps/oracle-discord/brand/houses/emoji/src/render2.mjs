import { createRequire } from "module"; const { chromium } = createRequire("/home/user/repo/")("playwright");
import { STEP2 } from "./art2.mjs";
import fs from "fs";
const N = 24;
fs.mkdirSync("frames2", { recursive: true });
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 1 });
await pg.setContent(`<html><body style="margin:0;background:transparent"><div id="s"></div></body></html>`);
for (const [id, { fn, anim }] of Object.entries(STEP2)) {
  const ts = anim ? Array.from({ length: N }, (_, i) => i / N) : [0];
  for (let i = 0; i < ts.length; i++) {
    await pg.evaluate((svg) => { document.getElementById("s").innerHTML = svg; }, `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 128 128" overflow="visible">${fn(ts[i])}</svg>`);
    await pg.locator("svg").screenshot({ path: `frames2/${anim ? `${id}_${String(i).padStart(2, "0")}` : id}.png`, omitBackground: true });
  }
}
await b.close();
