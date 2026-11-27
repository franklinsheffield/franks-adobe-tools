#!/usr/bin/env node
"use strict";
// Pixel Scape web build: smoke test in headless Chromium (no network needed).
// Boots the page, checks for errors, renders a small PNG, saves a scene (a download), and writes a surface preset.
//   npm run web && npm run web:smoke
const assert = require("assert");
const { chromium } = require("playwright");
const { server } = require("./serve.js");
(async () => {
  await new Promise((r) => server.listen(8788, r));
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true }), p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  const dl = []; p.on("download", (d) => dl.push(d.suggestedFilename()));
  try {
    await p.goto("http://localhost:8788/?nostart=1"); await p.waitForFunction(() => window.__wb && window.__psWeb, null, { timeout: 30000 });
    assert.ok(!(await p.evaluate(() => [...document.querySelectorAll("button")].some((x) => /Photoshop/.test(x.textContent)))), "no Photoshop buttons on the web");
    await p.evaluate(() => { window.__wb.st.out.w = 320; window.__wb.st.out.h = 180; return window.__wb.renderNow(); });
    assert.ok(await p.evaluate(() => !!window.__wb.refs.lastPics), "render made pictures");
    await p.evaluate(() => window.__wb.save(true)); await p.waitForTimeout(500);
    assert.ok(dl.some((f) => f.endsWith(".wbscene")), "save downloads a .wbscene");
    const n = await p.evaluate(async () => { const I = window.__psWeb.ipcRenderer; await I.invoke("surf:save", "Test preset", "{}"); return I.invoke("surf:list"); });
    assert.deepStrictEqual(n, ["Test preset"], "surface presets save in the browser");
    // Terrain Lab My photo (0.13): a deflate GeoTIFF read in the page (zlib shim) lands on a made-up terrain
    const { writeTIFF, checker } = require("../tests/pictures.js"), MP = require("../geo/myphoto.js");
    const tif = [...writeTIFF({ w: 60, h: 40, rgb: checker(60, 40, 10), comp: 8, pred: 2, geo: { sx: 2, sy: 2, x0: 399000, y0: 3993000, epsg: 32612 } })], c = MP.fromCRS(399060, 3992960, { kind: "utm", zone: 12, south: false });
    const my = await p.evaluate(async ({ tif, c }) => {
      window.require("fs").writeFileSync("/Uploads/gc.tif", new Uint8Array(tif)); window.__wb.openTerrainLab(); const T = window.__wb.TL(), n = 17;
      Object.assign(T.tl, { lat: c.lat, lon: c.lon, wKm: 0.4, dKm: 0.4, turn: 0, photo: "sat", bld: "off" });
      T.st.data = { dem: { n, h: new Float32Array(n * n).fill(100), min: 100, max: 100, z: 15, pixelM: 12, source: "t", credit: "t" }, photo: null, picks: [], box: T.box(), full: true, key: T.dataKey(), buildings: null };
      T.remesh(); await T.myp.load(["/Uploads/gc.tif"]); await new Promise((ok) => setTimeout(ok, 300));
      const r = { desc: T.myp.describe(), cover: T.st.my && T.st.my.cover }; T.close(); return r;
    }, { tif, c });
    assert.ok(/EPSG 32612/.test(my.desc) && Math.abs(my.cover - 0.06) < 0.01, "My photo GeoTIFF in the browser: " + JSON.stringify(my));
    assert.deepStrictEqual(errs, [], "no page errors");
    console.log("web smoke: ok");
  } finally { await b.close(); server.close(); }
})().catch((e) => { console.error("web smoke: FAILED", e.message); process.exit(1); });
