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
    await p.goto("http://localhost:8788/"); await p.waitForFunction(() => window.__wb && window.__psWeb, null, { timeout: 30000 });
    assert.ok(!(await p.evaluate(() => [...document.querySelectorAll("button")].some((x) => /Photoshop/.test(x.textContent)))), "no Photoshop buttons on the web");
    await p.evaluate(() => { window.__wb.st.out.w = 320; window.__wb.st.out.h = 180; return window.__wb.renderNow(); });
    assert.ok(await p.evaluate(() => !!window.__wb.refs.lastPics), "render made pictures");
    await p.evaluate(() => window.__wb.save(true)); await p.waitForTimeout(500);
    assert.ok(dl.some((f) => f.endsWith(".wbscene")), "save downloads a .wbscene");
    const n = await p.evaluate(async () => { const I = window.__psWeb.ipcRenderer; await I.invoke("surf:save", "Test preset", "{}"); return I.invoke("surf:list"); });
    assert.deepStrictEqual(n, ["Test preset"], "surface presets save in the browser");
    assert.deepStrictEqual(errs, [], "no page errors");
    console.log("web smoke: ok");
  } finally { await b.close(); server.close(); }
})().catch((e) => { console.error("web smoke: FAILED", e.message); process.exit(1); });
