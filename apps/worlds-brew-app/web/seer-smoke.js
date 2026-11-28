#!/usr/bin/env node
"use strict";
// Surveyor Flint check (needs `npm run web:serve`): his look, pop-ins on build events (chatty / off), the help menu
// (questions answered from the help text + FAQ, Show me), place facts from Terrain Lab, phone fit.
// node web/seer-smoke.js [base] [shots folder]
const assert = require("assert"), fs = require("fs"), path = require("path");
const { chromium, devices } = require("playwright");
const BASE = process.argv[2] || "http://localhost:8787", SHOTS = process.argv[3] || null;
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }), errs = [];
  const open = async (ctxOpts, name) => { const c = await b.newContext(ctxOpts), p = await c.newPage(); p.on("pageerror", (e) => errs.push(name + ": " + e.message));
    await p.goto(BASE + "/?nostart=1"); await p.waitForFunction(() => window.__psSeer, null, { timeout: 90000 }); await p.waitForTimeout(1200); return { c, p }; };
  const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + ".png") }); } };
  try {
    const { c, p } = await open({ viewport: { width: 1280, height: 800 } }, "desktop");
    assert.ok(await p.$(".ps-flint .f-hat") && await p.$(".ps-flint .f-visor") && await p.$(".ps-flint .f-ring"), "Flint's look: hard hat, visor, the ring");
    // answers
    const qa = await p.evaluate(() => ["how do I rotate things", "make it bigger", "put my photo on a cube", "how to share with friends", "what does stick to ground do", "zzqx"].map((q) => { const r = window.__psSeer.ask(q); return r[0] ? r[0].a : ""; }));
    assert.match(qa[0], /Rotate/); assert.match(qa[1], /Scale/); assert.match(qa[2], /Photo on a thing/); assert.match(qa[3], /Post render/); assert.match(qa[4], /Stick to ground/i); assert.strictEqual(qa[5], "");
    // help menu
    await p.click(".ps-flint-av"); assert.ok(await p.isVisible(".ps-flint-panel"), "tap opens the help menu");
    await p.fill(".ps-flint-q", "how do I change the sky"); await p.press(".ps-flint-q", "Enter"); await p.waitForTimeout(2600);
    assert.match(await p.textContent(".ps-flint-ans"), /Sky/); await shot(p, "flint-panel");
    await p.click(".ps-flint-panel .ps-flint-show"); await p.waitForSelector(".ps-flint-hi", { timeout: 2500 }).catch(() => {});
    const hi = await p.evaluate(() => { const x = document.querySelector(".ps-flint-hi"); return x ? x.outerHTML.slice(0, 100) : "none"; }); assert.match(hi, /Sky/, "Show me opens the Sky tab and glows it: " + hi);
    assert.ok(!(await p.isVisible(".ps-flint-panel")), "the menu steps aside to show it");
    await p.keyboard.press("?"); assert.ok(await p.isVisible(".ps-flint-panel"), "? opens the help menu"); await p.keyboard.press("Escape");
    // pop-ins
    await p.evaluate(() => window.__psSeer.setMode("off")); await p.evaluate(() => { const W = window.__wb; for (let i = 0; i < 4; i++) W.addThing("shape:sphere"); });
    await p.waitForTimeout(1800); assert.ok(await p.$eval(".ps-flint-bubble", (x) => x.hidden), "Off: no pop-ins");
    const said = await p.evaluate(() => { const S = window.__psSeer; S.setMode("chatty"); return S.pop("same", { kind: "sphere", n: 6 }, true); });
    await p.waitForTimeout(1800); assert.ok(!(await p.$eval(".ps-flint-bubble", (x) => x.hidden)), "pop-in shows"); const ptxt = await p.textContent(".ps-flint-text"); assert.match(ptxt, /sphere/i, "said " + said + " / shows " + ptxt); await shot(p, "flint-pop");
    const watched = await p.evaluate(() => { const S = window.__psSeer, W = window.__wb; S._seen.n = 0; S._seen.kinds = {}; W.st.scene.objs.splice(0, W.st.scene.objs.length); W.addThing("shape:cube"); return S.watch(); });
    assert.ok(watched === null || /cube|First piece|start|Bold|^.*—/.test(watched), "a first object gets a line: " + watched);
    // place facts
    const fact = await p.evaluate(() => { const TL = { isOpen: true, tl: { name: "Grand Canyon", wKm: 10, exag: 1 }, st: { data: { dem: { min: 731, max: 2788 }, box: { lat: 36.1, lon: -112.1, w: 10000 } } } }; const W = window.__wb, real = W.TL; W.TL = () => TL; window.__psSeer.bubble.hidden = true; const s = window.__psSeer.watch(); W.TL = real; return s; });
    assert.match(fact || "", /Grand Canyon|2,057|10 km/, "place comment uses the real facts: " + fact);
    // Teach mode: clicking a control explains it instead of doing it; Try it then does it
    await p.evaluate(() => { window.__psSeer.closePanel(); window.__psSeer.setTeach(true); }); await p.waitForTimeout(300);
    const g0 = await p.evaluate(() => window.__wb.st.view.gizmo);
    await p.click("text=Rotate E"); await p.waitForTimeout(1500);
    const t1 = await p.evaluate(() => ({ g: window.__wb.st.view.gizmo, name: window.__psSeer.taught && window.__psSeer.taught.name, said: document.querySelector(".ps-flint-text").textContent }));
    assert.strictEqual(t1.g, g0, "in Teach mode the click does not happen"); assert.ok(t1.said.length > 20, "Flint explains it: " + t1.said); await shot(p, "flint-teach");
    await p.click(".ps-flint-try .ps-flint-show"); await p.waitForTimeout(300);
    assert.strictEqual(await p.evaluate(() => window.__wb.st.view.gizmo), "rotate", "Try it does it");
    const cover = await p.evaluate(() => { const S = window.__psSeer, all = [...document.querySelectorAll("#app [data-help]")].filter((n) => n.offsetParent); const miss = all.filter((n) => !S.lesson(n)).map((n) => n.getAttribute("data-help")); return { n: all.length, miss }; });
    assert.ok(cover.n > 60, "visible controls: " + cover.n); assert.deepStrictEqual(cover.miss, [], "every visible control has a Teach answer");
    for (const sel of [".ps-mode", ".ps-make-btn", "#vp"]) assert.ok(await p.evaluate((sel) => !!window.__psSeer.lesson(document.querySelector(sel)), sel), sel + " has a Teach answer");
    await p.click(".ps-flint-badge"); assert.ok(!(await p.evaluate(() => window.__psSeer.teach)), "the badge ends Teach mode");
    await c.close();
    // phone
    const P = await open(devices["iPhone 13"], "phone");
    await P.p.tap(".ps-flint-av"); await P.p.waitForTimeout(700);
    assert.ok(await P.p.evaluate(() => { const r = document.querySelector(".ps-flint-panel").getBoundingClientRect(), t = document.getElementById("ps-tabs").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= t.top + 1 && document.documentElement.scrollWidth <= innerWidth; }), "help menu fits the phone");
    await P.p.tap('.ps-flint-topics button:nth-child(1)'); await P.p.waitForTimeout(2600); await shot(P.p, "flint-phone");
    await P.p.tap(".ps-flint-show"); await P.p.waitForTimeout(900);
    assert.ok(await P.p.evaluate(() => document.querySelector("#lib.ps-open") && !!document.querySelector("#lib .ps-flint-hi")), "Show me opens the Add drawer on a phone"); await shot(P.p, "flint-phone-show");
    await P.c.close();
    assert.deepStrictEqual(errs, [], "no page errors");
    console.log("seer smoke: ok");
  } finally { await b.close(); }
})().catch((e) => { console.error("seer smoke: FAILED", e.message); process.exit(1); });
