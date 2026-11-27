#!/usr/bin/env node
"use strict";
// M3 crossover check (needs `npm run web:serve`): the Make drawer, links from Discord posts (?open=... stands in for
// Discord's customId), a photo on a thing, the phone camera option, and building a place together (room messages fed
// straight to the client). node web/make-smoke.js [base] [shots folder]
const assert = require("assert"), fs = require("fs"), path = require("path"), os = require("os");
const { chromium, devices } = require("playwright");
const BASE = process.argv[2] || "http://localhost:8787", SHOTS = process.argv[3] || null;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==", "base64");
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }), errs = [];
  const img = path.join(os.tmpdir(), "ps-photo.png"); fs.writeFileSync(img, PNG);
  const open = async (ctxOpts, name, qs) => { const c = await b.newContext(ctxOpts), p = await c.newPage(); p.on("pageerror", (e) => errs.push(name + ": " + e.message));
    await p.goto(BASE + "/" + (qs || "?nostart=1")); await p.waitForFunction(() => window.__wb && window.__wb.vp && window.__psExtras, null, { timeout: 90000 }); await p.waitForTimeout(1500); return { c, p }; };
  const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + ".png") }); } };
  const make = async (p, id) => { await p.click(".ps-make-btn"); await p.click('[data-make="' + id + '"]'); await p.waitForTimeout(300); };
  try {
    // ---- desktop: the Make drawer
    const { c, p } = await open({ viewport: { width: 1280, height: 800 } }, "desktop");
    await p.click(".ps-make-btn"); const cards = await p.$$eval(".ps-make [data-make]", (a) => a.map((x) => x.dataset.make));
    assert.deepStrictEqual(cards, ["place", "myphoto", "buildings", "kit", "import", "photo"], "Make drawer choices"); await shot(p, "make-desktop"); await p.click(".ps-make-x");
    await make(p, "place"); assert.ok(await p.evaluate(() => window.__wb.TL().isOpen), "A real place opens Terrain Lab"); await p.evaluate(() => window.__wb.TL().close());
    await make(p, "buildings"); assert.deepStrictEqual(await p.evaluate(() => [window.__wb.TL().isOpen, window.__wb.TL().tl.bld]), [true, "on"], "Real buildings: Terrain Lab with buildings on"); await p.evaluate(() => window.__wb.TL().close());
    const fc = p.waitForEvent("filechooser"); await make(p, "myphoto"); const ch = await fc;
    assert.ok(/\.jpg/.test(await ch.element().getAttribute("accept")), "My photo asks for a picture"); assert.strictEqual(await p.evaluate(() => window.__wb.TL().tl.photo), "my"); await p.evaluate(() => window.__wb.TL().close());
    const fi = p.waitForEvent("filechooser"); await make(p, "import"); assert.ok(/\.glb/.test(await (await fi).element().getAttribute("accept")), "A model file asks for a model");
    await make(p, "kit"); assert.ok(await p.evaluate(() => document.activeElement && document.activeElement.dataset.key === "view.kitQ"), "3D library: the search box is ready");
    await make(p, "photo"); assert.match(await p.evaluate(() => document.querySelector("#bar").textContent), /Select a thing first/, "Photo on a thing needs a selection");
    await p.evaluate(() => { const W = window.__wb; W.select(W.st.scene.objs.find((o) => o.type !== "terrain" && o.type !== "light")); });
    const fp = p.waitForEvent("filechooser"); await make(p, "photo"); await (await fp).setFiles(img); await p.waitForTimeout(800);
    assert.deepStrictEqual(await p.evaluate(() => { const o = window.__wb.st.sel; return o.img && [o.img.w, o.img.h]; }), [2, 2], "the photo is wrapped on the selected thing");
    await c.close();

    // ---- phone: the picker offers the camera (image/*), Make opens as a sheet over the tabs
    const P = await open(devices["iPhone 13"], "phone");
    await P.p.tap(".ps-make-btn"); await P.p.waitForTimeout(300); await shot(P.p, "make-phone");
    assert.ok(await P.p.evaluate(() => { const r = document.querySelector(".ps-make").getBoundingClientRect(), t = document.getElementById("ps-tabs").getBoundingClientRect(); return r.bottom <= t.top && r.left >= 0 && r.right <= innerWidth; }), "Make sheet sits above the tabs");
    const pc = P.p.waitForEvent("filechooser"); await P.p.tap('[data-make="myphoto"]'); assert.match(await (await pc).element().getAttribute("accept"), /image\/\*/, "phone picker offers the camera");
    await P.c.close();

    // ---- links from Discord posts
    const L = await open({ viewport: { width: 1280, height: 800 } }, "link", "?open=" + encodeURIComponent("place|36.1|-112.1|5|Grand Canyon"));
    const lk = await L.p.evaluate(() => { const TL = window.__wb.TL(); return { open: TL.isOpen, lat: TL.tl.lat, lon: TL.tl.lon, w: TL.tl.wKm, name: TL.tl.name, start: !!document.querySelector(".ps-start"), choice: window.__psExtras.choice }; });
    assert.deepStrictEqual(lk, { open: true, lat: 36.1, lon: -112.1, w: 5, name: "Grand Canyon", start: false, choice: "link" }, "Open in Pixel Scape goes straight to the place"); await shot(L.p, "link-place");
    await L.c.close();

    // ---- building a place together (room messages fed to the client)
    const R = await open({ viewport: { width: 1280, height: 800 } }, "room", "?nostart=1&room=smoke&name=Bo");
    const r = await R.p.evaluate(async () => {
      const n = window.__psNet, sent = []; n.closed = true; if (n.ws) n.ws.onclose = null; n.send = (o) => sent.push(o);
      await n.handle({ t: "welcome", you: { sid: "me", name: "Bo", color: "#5effc8" }, peers: [{ sid: "a1", name: "Ana", color: "#ff5ea8" }], scene: { objs: [], env: {}, cam: null, name: "Room" }, max: 8 });
      await n.handle({ t: "place", sid: "a1", name: "Ana", kept: false, place: { name: "Mount Fuji", lat: 35.36, lon: 138.73, km: 8 } });
      const toast = document.querySelector(".ps-room-toast").textContent;
      document.querySelector(".ps-room-toast button").click(); const TL = window.__wb.TL(), looked = [TL.isOpen, TL.tl.lat, TL.tl.name];
      TL.st.data = TL.st.data || { stub: true }; n.watchPlace(); const share = sent.filter((s) => s.t === "place").pop();
      TL.st.folder = "/Library/Terrains/Fuji"; n.watchPlace(); await new Promise((q) => setTimeout(q, 2400)); const keep = sent.filter((s) => s.t === "place").pop();
      TL.close();
      await n.handle({ t: "lib", items: [{ kind: "place", id: 1, name: "Mount Fuji", lat: 35.36, lon: 138.73, km: 8, by: "Ana", at: Date.now() }, { kind: "scene", id: 2, name: "Garden", by: "Bo", at: Date.now() - 1000 }] });
      n.toggleLib(); const rows = [...document.querySelectorAll(".ps-room-item")].map((x) => x.querySelector("b").textContent + " / " + x.querySelector("button").textContent);
      document.querySelectorAll(".ps-room-item button")[1].click(); const unsave = sent.filter((s) => s.t === "unsave").pop();
      return { toast, looked, share, keep, rows, unsave };
    });
    assert.match(r.toast, /Ana is looking at Mount Fuji \(8 km\)/); assert.deepStrictEqual(r.looked, [true, 35.36, "Mount Fuji"], "Look too opens the same place");
    assert.deepStrictEqual([r.share.lat, r.share.lon, r.share.keep], [35.36, 138.73, false], "what I preview is offered to the call");
    assert.strictEqual(r.keep.keep, true, "what I build goes to the server library");
    assert.deepStrictEqual(r.rows, ["Place Mount Fuji / Look", "Scene Garden / Open"], "one library: places and scenes"); assert.deepStrictEqual(r.unsave, { t: "unsave", id: 1, kind: "place" });
    await shot(R.p, "room-library"); await R.c.close();
    assert.deepStrictEqual(errs, [], "no page errors");
    console.log("make smoke: ok");
  } finally { await b.close(); }
})().catch((e) => { console.error("make smoke: FAILED", e.message); process.exit(1); });
