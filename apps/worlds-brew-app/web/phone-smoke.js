#!/usr/bin/env node
"use strict";
// Phone layout check (needs `npm run web:serve`): iPhone portrait + landscape and desktop, tabs open drawers,
// the 3D view stays drawn with the Move pad open, two-finger pinch zooms. node web/phone-smoke.js [base] [shots folder]
const assert = require("assert"), fs = require("fs"), path = require("path");
const { chromium, devices } = require("playwright");
const BASE = process.argv[2] || "http://localhost:8787", SHOTS = process.argv[3] || null;
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }), errs = [];
  const open = async (ctxOpts, name) => { const c = await b.newContext(ctxOpts), p = await c.newPage(); p.on("pageerror", (e) => errs.push(name + ": " + e.message));
    await p.goto(BASE + "/?nostart=1"); await p.waitForFunction(() => window.__wb && window.__wb.vp, null, { timeout: 90000 }); await p.waitForTimeout(4000); return { c, p }; };
  const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + ".png") }); } };
  try {
    const { c, p } = await open(devices["iPhone 13"], "phone");
    assert.ok(await p.evaluate(() => document.body.classList.contains("ps-phone")), "phone layout on");
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no sideways scroll");
    const vpH = await p.evaluate(() => document.getElementById("vpwrap").clientHeight); assert.ok(vpH > 400, "the 3D view fills the screen (" + vpH + ")");
    await shot(p, "phone");
    for (const t of ["lib", "insp", "bar", "menu"]) {
      await p.tap('[data-tab="' + t + '"]'); await p.waitForTimeout(800);
      const r = await p.evaluate((t) => { const el = document.querySelector(".ps-open"); const b = el && el.getBoundingClientRect(); return el && b.top < innerHeight - 60 && b.bottom <= innerHeight - 50 ? el.id || el.className : JSON.stringify([!!el, b && b.top, b && b.bottom, innerHeight]); }, t);
      assert.ok(r && r[0] !== "[", t + " drawer opens on screen " + r); await shot(p, "phone-" + t); await p.tap('[data-tab="' + t + '"]');
    }
    await p.tap('[data-tab="pad"]'); await p.waitForTimeout(500);
    const padOk = await p.evaluate(() => { const pad = document.getElementById("pad").getBoundingClientRect(), v = document.getElementById("vpwrap").getBoundingClientRect(); return pad.height > 100 && v.bottom <= pad.top + 1 && v.height > 150; });
    assert.ok(padOk, "Move pad docks under the view"); await shot(p, "phone-pad"); await p.tap('[data-tab="pad"]');
    const d0 = await p.evaluate(() => window.__wb.st.scene.cam.dist), cdp = await c.newCDPSession(p), bx = await p.locator("#vp").boundingBox(), cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2;
    const tp = (pts) => pts.map(([x, y], id) => ({ x, y, id }));
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp([[cx - 30, cy], [cx + 30, cy]]) });
    for (let k = 1; k <= 5; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: tp([[cx - 30 - k * 8, cy], [cx + 30 + k * 8, cy]]) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(200);
    const d1 = await p.evaluate(() => window.__wb.st.scene.cam.dist); assert.ok(d1 < d0 * 0.6, "pinch zooms in (" + d0 + " -> " + d1 + ")");
    assert.ok(await p.evaluate(() => window.__wb.vp.renderer.getPixelRatio() <= 1.5), "lighter render on phones");
    await c.close();
    const L = await open(devices["iPhone 13 landscape"], "landscape"); assert.ok(await L.p.evaluate(() => document.body.classList.contains("ps-phone")), "landscape phone layout"); await shot(L.p, "landscape"); await L.c.close();
    const D = await open({ viewport: { width: 1280, height: 800 } }, "desktop");
    assert.ok(!(await D.p.evaluate(() => document.body.classList.contains("ps-phone"))), "desktop layout unchanged");
    assert.ok(await D.p.evaluate(() => getComputedStyle(document.getElementById("ps-tabs")).display === "none"), "no tab bar on desktop"); await shot(D.p, "desktop"); await D.c.close();
    assert.deepStrictEqual(errs, [], "no page errors");
    console.log("phone smoke: ok");
  } finally { await b.close(); }
})().catch((e) => { console.error("phone smoke: FAILED", e.message); process.exit(1); });
