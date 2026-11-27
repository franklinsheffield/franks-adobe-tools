#!/usr/bin/env node
"use strict";
// Building together (Discord D4): two (then three) browsers in one room against the Activity Worker run locally:
//   npm run web && (cd ../pixel-scape-discord/activity && npx wrangler dev --port 8799 --var DEV_ROOMS:1)
//   node web/multi-smoke.js [http://127.0.0.1:8799] [shots folder]
const assert = require("assert"), path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://127.0.0.1:8799", SHOTS = process.argv[3] || null, ROOM = "smoke-" + Date.now().toString(36);
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const errs = [], pages = [], open = async (name) => {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }), p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(name + ": " + e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(name + ": " + m.text()); });
    p.on("dialog", (d) => d.accept(d.type() === "prompt" ? "Smoke garden" : undefined));
    pages.push(p); await p.goto(BASE + "/?nostart=1&room=" + ROOM + "&name=" + name);
    await p.waitForFunction(() => window.__psNet && window.__psNet.ready && !window.__psNet.pendingReplace, null, { timeout: 90000 }); return p;
  };
  let step = "start";
  const until = (p, fn, arg, ms) => { step = String(fn).slice(0, 90); return p.waitForFunction(fn, arg, { timeout: ms || 8000, polling: 20 }); };
  const objs = (p) => p.evaluate(() => window.__wb.st.scene.objs.map((o) => ({ nid: o._nid, type: o.type, x: o.x, mesh: !!o.mesh, img: o.img ? o.img.d.length : 0 })));
  try {
    const A = await open("Ana"), B = await open("Bo");
    const a0 = await objs(A), b0 = await objs(B);
    assert.ok(a0.length >= 5, "A seeded the room"); assert.deepStrictEqual(b0, a0, "B loads A's scene, meshes included");
    // A selects and moves an object: B sees it, and can't take it
    const nid = a0[0].nid;
    await A.evaluate((nid) => { const W = window.__wb, o = W.st.scene.objs.find((x) => x._nid === nid); W.select(o); o.x += 2; W.commit(); W.changed("val"); }, nid);
    const t0 = Date.now(); await until(B, ({ nid, x }) => window.__wb.st.scene.objs.find((o) => o._nid === nid).x === x, { nid, x: a0[0].x + 2 });
    const ms = Date.now() - t0;
    await until(B, () => window.__wb.vp.peers && window.__wb.vp.peers.length === 1 && window.__wb.vp.peers[0].box.visible);
    assert.strictEqual(await B.evaluate(() => window.__wb.vp.peers[0].tag.textContent), "Ana", "B sees Ana's name on it");
    const took = await B.evaluate((nid) => { const W = window.__wb; W.select(W.st.scene.objs.find((x) => x._nid === nid)); return W.st.sel !== W.NONE; }, nid);
    assert.ok(!took, "B can't select what Ana is editing");
    // live drag streams while A drags
    await A.evaluate((nid) => { const W = window.__wb, o = W.st.scene.objs.find((x) => x._nid === nid); o.z = 4.25; W.changed("drag"); }, nid);
    await until(B, (nid) => window.__wb.st.scene.objs.find((o) => o._nid === nid).z === 4.25, nid);
    // B adds an object with a picture (a blob) and changes the sky; A sees both
    await B.evaluate(() => { const W = window.__wb, o = W.S.obj("cube", -3, 1, 2, 1, "Matte"); const d = new Uint8Array(64 * 64 * 4); for (let i = 0; i < d.length; i++) d[i] = i % 251; o.img = { w: 64, h: 64, d, name: "smoke" }; W.st.scene.objs.push(o); W.commit(); W.st.scene.sky = "Night"; W.commit(); W.changed("val"); });
    await until(A, () => window.__wb.st.scene.sky === "Night" && window.__wb.st.scene.objs.some((o) => o.img && o.img.d.length === 16384 && o.img.d[300] === 300 % 251));
    // A deletes its object, B sees it gone; A's Undo brings it back for both
    await A.evaluate((nid) => { const W = window.__wb, o = W.st.scene.objs.find((x) => x._nid === nid); W.ED.remove(W.st.scene, o); W.select(null); W.commit(); }, nid);
    await until(B, (nid) => !window.__wb.st.scene.objs.some((o) => o._nid === nid), nid);
    await A.evaluate(() => window.__wb.undo());
    await until(B, (nid) => window.__wb.st.scene.objs.some((o) => o._nid === nid), nid);
    // B's Undo only undoes B's own edit (the sky), not Ana's
    await B.evaluate(() => window.__wb.undo());
    await until(A, () => window.__wb.st.scene.sky === "Dusk");
    assert.ok(await A.evaluate((nid) => window.__wb.st.scene.objs.some((o) => o._nid === nid), nid), "Ana's object survives Bo's undo");
    // server library: save, change, open again
    await A.evaluate(() => window.__psNet.saveToServer());
    await until(B, () => window.__psNet.lib.some((x) => x.name === "Smoke garden"));
    const n1 = (await objs(A)).length;
    await A.evaluate(() => { const W = window.__wb; W.loadScene(W.S.loadPreset("Snow Peaks")); });
    await until(B, () => window.__wb.st.scene.objs.length === 1, null, 15000);
    await B.evaluate(() => { const N = window.__psNet; N.send({ t: "open", id: N.lib.find((x) => x.name === "Smoke garden").id }); });
    await until(A, (n) => window.__wb.st.scene.objs.length === n, n1, 15000);
    // a late joiner gets everything; the room shows three builders
    const C = await open("Cy");
    assert.deepStrictEqual((await objs(C)).map((o) => o.nid).sort(), (await objs(A)).map((o) => o.nid).sort(), "C has the same scene");
    await until(A, () => document.querySelectorAll(".ps-room-people .ps-chip").length === 3);
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await A.evaluate((nid) => { const W = window.__wb; W.select(W.st.scene.objs[1]); W.commit(); }, nid);
      await B.evaluate(() => { const W = window.__wb; W.select(W.st.scene.objs[3]); W.commit(); });
      await A.waitForTimeout(800);
      await A.screenshot({ path: path.join(SHOTS, "ana.png") }); await B.screenshot({ path: path.join(SHOTS, "bo.png") });
    }
    assert.deepStrictEqual(errs, [], "no page errors");
    console.log("multi smoke: ok (an edit reached the other browser in " + ms + " ms)");
  } catch (e) {
    for (const p of pages) e.message += "\n  page: " + await p.evaluate(() => window.__wb.st.scene.objs.length + " objs, ready " + window.__psNet.ready + " pend " + window.__psNet.pendingReplace + ", status: " + document.querySelector(".status").textContent).catch(() => "?");
    e.message += "\n  at step: " + step + (errs.length ? "\n  page errors: " + errs.join(" | ") : ""); throw e; } finally { await b.close(); }
})().catch((e) => { console.error("multi smoke: FAILED", e.message); process.exit(1); });
