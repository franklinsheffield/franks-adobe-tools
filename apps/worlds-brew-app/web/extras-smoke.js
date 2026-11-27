#!/usr/bin/env node
"use strict";
// 3.1 ease-of-use check (needs `npm run web:serve`): start screen, first-time tips, big touch handles, auto quality,
// Explore (fly + walk), long-press ping, and the room bar's presence / follow / ping / weekly theme (the room's
// messages are fed straight to the client, so no Worker is needed). node web/extras-smoke.js [base] [shots folder]
const assert = require("assert"), fs = require("fs"), path = require("path");
const { chromium, devices } = require("playwright");
const BASE = process.argv[2] || "http://localhost:8787", SHOTS = process.argv[3] || null;
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }), errs = [];
  const open = async (ctxOpts, name, qs) => { const c = await b.newContext(ctxOpts), p = await c.newPage(); p.on("pageerror", (e) => errs.push(name + ": " + e.message));
    await p.goto(BASE + "/" + (qs || "")); await p.waitForFunction(() => window.__wb && window.__wb.vp && window.__psExtras, null, { timeout: 90000 }); await p.waitForTimeout(1500); return { c, p }; };
  const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + ".png") }); } };
  try {
    // ---- phone: start screen -> blank world, tips, big handles, Explore, ping
    const { c, p } = await open(devices["iPhone 13"], "phone");
    const cards = await p.$$eval(".ps-start [data-start]", (a) => a.map((x) => x.dataset.start)); assert.deepStrictEqual(cards, ["place", "blank", "library", "sample"], "start screen choices");
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "start screen fits the phone"); await shot(p, "start-phone");
    await p.tap('[data-start="blank"]'); await p.waitForTimeout(400);
    assert.strictEqual(await p.evaluate(() => window.__wb.st.scene.objs.length), 0, "Blank world is empty");
    assert.ok(await p.isVisible(".ps-tip"), "first-time tips show"); await shot(p, "tips-phone");
    for (let i = 0; i < 3; i++) await p.tap(".ps-tip button:not(.ghost)");
    assert.ok(!(await p.$(".ps-tip")), "tips close after the third"); assert.strictEqual(await p.evaluate(() => localStorage.getItem("ps.tips.v1")), "1", "tips remembered");
    assert.strictEqual(await p.evaluate(() => window.__wb.vp.tc.size), 1.6, "bigger handles on touch");
    const pr0 = await p.evaluate(() => window.__wb.vp.renderer.getPixelRatio());
    await p.evaluate(() => window.__psQuality.set(2)); const pr1 = await p.evaluate(() => window.__wb.vp.renderer.getPixelRatio());
    assert.ok(Math.abs(pr1 - pr0 * 0.65) < 0.01, "auto quality lowers the pixel ratio (" + pr0 + " -> " + pr1 + ")"); await p.evaluate(() => window.__psQuality.set(0));
    const vh0 = await p.evaluate(() => document.getElementById("vpwrap").clientHeight);
    await p.tap(".ps-mode"); await p.waitForTimeout(400);
    const ex = await p.evaluate(() => ({ on: document.body.classList.contains("ps-explore"), tabs: getComputedStyle(document.getElementById("ps-tabs")).display, h: document.getElementById("vpwrap").clientHeight }));
    assert.ok(ex.on && ex.tabs === "none" && ex.h > vh0, "Explore hides the panels and the view grows (" + vh0 + " -> " + ex.h + ")"); await shot(p, "explore-phone");
    const c0 = await p.evaluate(() => Object.assign({}, window.__wb.st.scene.cam)), fwd = await p.locator('.ps-xpad [data-k="w"]').boundingBox();
    await p.mouse.move(fwd.x + 20, fwd.y + 20); await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up();
    const c1 = await p.evaluate(() => Object.assign({}, window.__wb.st.scene.cam)); assert.ok(Math.hypot(c1.tx - c0.tx, c1.tz - c0.tz) > 0.2, "holding Forward flies forward " + JSON.stringify([c0, c1]));
    await p.tap(".ps-xkind"); await p.waitForTimeout(200);
    const wk = await p.evaluate(() => { const c = window.__wb.st.scene.cam, r = Math.PI / 180; return { dist: c.dist, eyeY: c.ty + Math.sin(c.pitch * r) * c.dist }; });
    assert.ok(wk.dist === 2.5 && Math.abs(wk.eyeY - 1.6) < 0.05, "Walk puts the eye 1.6 m over the ground " + JSON.stringify(wk));
    await p.tap(".ps-mode"); await p.waitForTimeout(300); assert.ok(!(await p.evaluate(() => document.body.classList.contains("ps-explore"))), "Build brings the panels back");
    const bx = await p.locator("#vp").boundingBox(), cdp = await c.newCDPSession(p), pt = [{ x: bx.x + bx.width / 2, y: bx.y + bx.height * 0.7, id: 0 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt }); await p.waitForTimeout(800); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    assert.ok(await p.$(".ps-mark.ping"), "long-press drops a ping"); await shot(p, "ping-phone");
    await c.close();

    // ---- desktop: Escape closes the start screen, keyboard flying, normal handles
    const D = await open({ viewport: { width: 1280, height: 800 } }, "desktop"); await shot(D.p, "start-desktop");
    await D.p.keyboard.press("Escape"); assert.ok(!(await D.p.$(".ps-start")), "Escape closes the start screen");
    assert.strictEqual(await D.p.evaluate(() => window.__wb.vp.tc.size), 0.9, "normal handles with a mouse");
    await D.p.evaluate(() => document.querySelector(".ps-tip .ghost").click());
    await D.p.click(".ps-mode"); const k0 = await D.p.evaluate(() => Object.assign({}, window.__wb.st.scene.cam));
    await D.p.keyboard.down("w"); await D.p.waitForTimeout(500); await D.p.keyboard.up("w");
    const k1 = await D.p.evaluate(() => Object.assign({}, window.__wb.st.scene.cam)); assert.ok(Math.hypot(k1.tx - k0.tx, k1.tz - k0.tz) > 0.2, "W flies forward");
    assert.strictEqual(await D.p.evaluate(() => window.__wb.st.view.gizmo), "move", "W does not switch the gizmo in Explore"); await shot(D.p, "explore-desktop");
    await D.c.close();

    // ---- room bar: presence markers, follow, pings, weekly theme (the room's messages fed to the client)
    const R = await open({ viewport: { width: 1280, height: 800 } }, "room", "?nostart=1&room=smoke&name=Bo");
    const r = await R.p.evaluate(async () => {
      const n = window.__psNet, sent = []; n.closed = true; if (n.ws) n.ws.onclose = null; n.send = (o) => sent.push(o);
      await n.handle({ t: "welcome", you: { sid: "me", name: "Bo", color: "#5effc8" }, peers: [{ sid: "a1", name: "Ana", color: "#ff5ea8" }], scene: { objs: [], env: {}, cam: null, name: "Room" }, max: 8 });
      await n.handle({ t: "cam", sid: "a1", c: { tx: 3, ty: 1, tz: -2, dist: 9, yaw: 40, pitch: 20, fov: 45 } }); await new Promise((q) => setTimeout(q, 300));
      const marker = !!document.querySelector(".ps-mark.eye"), theme = document.querySelector(".ps-room-theme").textContent;
      document.querySelector('.ps-chip[data-sid="a1"]').click();
      await n.handle({ t: "cam", sid: "a1", c: { tx: 5, ty: 1, tz: 5, dist: 12, yaw: 90, pitch: 30, fov: 45 } });
      window.__sent = sent; return { marker, theme, cam: Object.assign({}, window.__wb.st.scene.cam), following: n.follow };
    });
    await R.p.mouse.click(600, 250);
    Object.assign(r, await R.p.evaluate(async () => {
      const n = window.__psNet, sent = window.__sent;
      await n.handle({ t: "ping", sid: "a1", name: "Ana", color: "#ff5ea8", p: [1, 0, 1] });
      n.sendCam(); n.ping({ x: 2, y: 0, z: 2 });
      return { after: n.follow, pings: document.querySelectorAll(".ps-mark.ping").length, sent: sent.map((s) => s.t) };
    }));
    assert.ok(r.marker, "the other builder's view shows as a marker"); assert.ok(/This week's build theme: \S/.test(r.theme), "weekly theme in the room bar: " + r.theme);
    assert.strictEqual(r.following, "a1"); assert.deepStrictEqual([r.cam.tx, r.cam.tz, r.cam.yaw], [5, 5, 90], "following copies their view");
    assert.strictEqual(r.after, null, "touching the view stops following"); assert.strictEqual(r.pings, 2, "their ping and mine show");
    assert.ok(r.sent.includes("cam") && r.sent.includes("ping"), "my view and ping go to the room: " + r.sent); await shot(R.p, "room-desktop");
    await R.c.close();
    assert.deepStrictEqual(errs, [], "no page errors");
    console.log("extras smoke: ok");
  } finally { await b.close(); }
})().catch((e) => { console.error("extras smoke: FAILED", e.message); process.exit(1); });
