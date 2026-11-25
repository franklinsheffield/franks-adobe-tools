"use strict";
// 3.0 approved upgrades (Frank 2026-11-24 "all approved"): shared Auto Tone and friends.
const assert = require("assert");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

module.exports = async function (t) {
  const { loadPanel } = require("./harness.js");
  const ready = async (P) => { for (let i = 0; i < 200 && !/^Preview /.test((P.document.querySelector(".status") || {}).textContent || ""); i++) await P.settle(50); };

  await t("Auto Tone: stretches a dark flat picture, keeps hue, amount 0 is a no-op", () => {
    const M = require("../shared/imgmath.js");
    const w = 64, h = 48, d = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) { const v = 30 + (i % w) / w * 60; d[i * 4] = v * 1.2; d[i * 4 + 1] = v; d[i * 4 + 2] = v * 0.8; d[i * 4 + 3] = 255; }
    const o = M.autoTone({ w, h, c: 4, data: d }, 100);
    let mn = 255, mx = 0, warm = 0;
    for (let i = 0; i < w * h; i++) { const g = o.data[i * 4 + 1]; mn = Math.min(mn, g); mx = Math.max(mx, g); if (o.data[i * 4] >= o.data[i * 4 + 2]) warm++; }
    assert.ok(mx - mn > 150, "range stretched: " + mn + ".." + mx);
    assert.ok(warm > w * h * 0.95, "warm hue kept");
    assert.strictEqual(M.autoTone({ w, h, c: 4, data: d }, 0).data, d);
  });

  await t("Auto Tone: card on CRT, Chroma, Paint (on), Halo and Decompressor (off); CRT turns it on for Phase looks", async () => {
    const want = { "crt-phaser": null, chrometone: true, "paint-brew": true, mobglow: false, decompressor: false };
    for (const tool of Object.keys(want)) {
      const P = await loadPanel(path.join(ROOT, "plugins", tool), { withDoc: false });
      await ready(P);
      const T = P.mod._test;
      assert.ok(Array.from(P.document.querySelectorAll(".ctitle")).some((e) => e.textContent === "Auto Tone"), tool + " has the Auto Tone card");
      if (want[tool] !== null) assert.strictEqual(T.state.autoTone.on, want[tool], tool + " default");
      else {
        const { PRESETS } = require(path.join(ROOT, "plugins", tool, "js/state.js"));
        const phase = PRESETS.find((p) => p.p.phase && p.p.phase.mode && p.p.phase.mode !== "off");
        const plain = PRESETS.find((p) => !p.p.phase || !p.p.phase.mode || p.p.phase.mode === "off");
        T.applyPatch(phase.p, phase.name); assert.strictEqual(T.state.autoTone.on, true, "phase look turns Auto Tone on");
        T.applyPatch(plain.p, plain.name); assert.strictEqual(T.state.autoTone.on, false, "classic look leaves it off");
      }
      const img = P.document.querySelector("img.preview"), before = img.src;
      T.state.autoTone.on = !T.state.autoTone.on; T.touch();
      for (let i = 0; i < 80 && img.src === before; i++) await P.settle(100);
      assert.notStrictEqual(img.src, before, tool + " preview follows Auto Tone");
    }
  });

  await t("Decompressor 3.0: real codec decays more per generation, Fax is 2 colours, Pixel sort reorders, Protect keeps the subject", async () => {
    const E = require("../plugins/decompressor/js/engine.js");
    const { DEFAULTS, merge, clone } = require("../plugins/decompressor/js/state.js");
    const src = E.demoImage(96, 64);
    const run = async (patch) => (await E.render(src, merge(clone(DEFAULTS), patch))).layers[0].rgba;
    const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return s / (a.length / 4); };
    const orig = src.data;
    const one = await run({ jpeg: { real: true, quality: 20, generations: 1 } });
    const many = await run({ jpeg: { real: true, quality: 20, generations: 20, fry: 30 } });
    assert.ok(diff(many, orig) > diff(one, orig), "more generations, more decay");
    const fax = await run({ jpeg: { on: false }, crush: { bits: 1, mode: "fax", fax: 50 } });
    const cols = new Set(); for (let i = 0; i < fax.length; i += 4) cols.add(fax[i] + "," + fax[i + 1] + "," + fax[i + 2]);
    assert.ok(cols.size <= 2, "fax colours: " + cols.size);
    const plain = await run({ jpeg: { on: false } });
    const sorted = await run({ jpeg: { on: false }, sort: { on: true, lo: 0, hi: 100, dir: "horizontal", length: 100 } });
    assert.ok(diff(sorted, plain) > 1, "pixel sort moves pixels");
    let ok = 0; for (let y = 0; y < 64; y++) { let mono = true; for (let x = 1; x < 96; x++) { const a = (y * 96 + x - 1) * 4, b = a + 4; const la = sorted[a] * 0.3 + sorted[a + 1] * 0.59 + sorted[a + 2] * 0.11, lb = sorted[b] * 0.3 + sorted[b + 1] * 0.59 + sorted[b + 2] * 0.11; if (lb < la - 2) mono = false; } if (mono) ok++; }
    assert.ok(ok > 32, "most rows sorted dark to light: " + ok);
    const subject = new Float32Array(96 * 64); for (let y = 16; y < 48; y++) for (let x = 24; x < 72; x++) subject[y * 96 + x] = 1;
    const prot = (await E.render(Object.assign({}, src, { subject }), merge(clone(DEFAULTS), { jpeg: { real: true, quality: 5, generations: 10 }, protect: { on: true, amount: 100, feather: 0 } }))).layers[0].rgba;
    const at = (a, x, y) => { const i = (y * 96 + x) * 4; return Math.abs(a[i] - orig[i]) + Math.abs(a[i + 1] - orig[i + 1]) + Math.abs(a[i + 2] - orig[i + 2]); };
    assert.ok(at(prot, 48, 32) <= 3, "subject untouched");
    assert.ok(at(prot, 4, 4) + at(prot, 90, 60) + at(prot, 10, 50) > 6, "background decayed");
  });

  await t("Halo 3.0: Light Key blooms coloured lights, Key colour keeps one hue, Falloff 50 is unchanged, Streaks run across", async () => {
    const E = require("../plugins/mobglow/js/engine.js");
    const { DEFAULTS, merge, clone } = require("../plugins/mobglow/js/state.js");
    const w = 120, h = 80, d = new Uint8Array(w * h * 4);
    // grey room, a bright white patch (left), a dimmer violet strip (middle) and a green dot (right)
    for (let i = 0; i < w * h; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 40; d[i * 4 + 3] = 255; }
    const put = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; } };
    put(8, 30, 20, 50, [235, 225, 215]); put(50, 38, 70, 42, [150, 60, 220]); put(100, 38, 104, 42, [60, 200, 60]);
    const src = { w, h, c: 4, data: d };
    const glow = async (patch) => { const o = await E.render(src, merge(clone(DEFAULTS), patch)); return o.layers[o.layers.length - 1].rgba; };
    const near = (g, x0, x1, y0, y1) => { let s = 0, k = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; s += g[i] + g[i + 1] + g[i + 2]; k++; } return s / k; };
    const base = { glow: { radius: 120, strength: 300, threshold: 1.2 } };
    const bright = await glow(base), light = await glow(merge(clone(base), { glow: { key: "light" } }));
    const ratio = (g) => near(g, 50, 70, 28, 36) / Math.max(1, near(g, 8, 20, 22, 28));
    assert.ok(ratio(light) > ratio(bright) * 1.3, "violet strip blooms more with Light Key: " + ratio(light).toFixed(2) + " vs " + ratio(bright).toFixed(2));
    const keyed = await glow(merge(clone(base), { glow: { key: "light" }, keycol: { on: true, hex: "#9640DC", range: 30 } }));
    assert.ok(near(keyed, 52, 68, 30, 37) > 8, "violet glows");
    assert.ok(near(keyed, 96, 108, 30, 37) < 2 && near(keyed, 6, 22, 22, 29) < 2, "green and white stay dark");
    const f50 = await glow(merge(clone(base), { glow: { falloff: 50 } }));
    assert.deepStrictEqual(Array.from(f50.slice(0, 4000)), Array.from(bright.slice(0, 4000)), "falloff 50 = 2.x glow");
    const spread = async (fo) => { const g = await glow({ glow: { radius: 600, strength: 300, threshold: 1.2, falloff: fo } }); return near(g, 32, 40, 30, 50) / Math.max(1, near(g, 20, 23, 30, 50)); };
    const tight = await spread(0), wide = await spread(100);
    assert.ok(wide > tight * 1.2, "high falloff spreads further: " + wide.toFixed(2) + " vs " + tight.toFixed(2));
    const st = await glow(merge(clone(base), { streak: { on: true, length: 80, strength: 80, dir: "h" } }));
    assert.ok(near(st, 85, 118, 38, 42) - near(bright, 85, 118, 38, 42) > 3 * Math.max(0.5, near(st, 0, 120, 2, 6) - near(bright, 0, 120, 2, 6)), "streak runs across, not up");
  });

  await t("Dithers 3.0: Modulation and Pattern algorithms print the right amount of ink; Smooth resample, Denoise, Colour in view, ASCII gradient bands overlap", async () => {
    const E = require("../plugins/dithers-brew/js/engine.js");
    const { DEFAULTS, merge, clone } = require("../plugins/dithers-brew/js/state.js");
    const W = 120, flat = (v) => { const d = new Uint8Array(W * W * 4); for (let i = 0; i < W * W; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } return { w: W, h: W, c: 4, data: d }; };
    const ink = (o) => { let k = 0; const m = o.layers[0].mask; for (let i = 0; i < m.length; i++) if (m[i]) k++; return k / m.length; };
    const pats = E.DITHERS.filter((d) => d.t === "pat");
    assert.ok(pats.length >= 15, "15 new algorithms: " + pats.length);
    for (const d of pats) {
      const o = await E.render(flat(178), merge(clone(DEFAULTS), { engine: "dither", algo: { dither: d.id }, tune: { spacing: 5 } }));
      const f = ink(o);
      assert.ok(f > 0.2 && f < 0.42, d.name + " prints ~30% ink on 30% grey: " + f.toFixed(2));
    }
    const grad = (() => { const d = new Uint8Array(W * W * 4); for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = Math.round(x / W * 255); d[i + 3] = 255; } return { w: W, h: W, c: 4, data: d }; })();
    const px = await E.render(grad, merge(clone(DEFAULTS), { engine: "dither", algo: { dither: "b8" }, pixel: 4 }));
    const sm = await E.render(grad, merge(clone(DEFAULTS), { engine: "dither", algo: { dither: "b8" }, pixel: 4, resample: "smooth" }));
    assert.notDeepStrictEqual(Array.from(sm.layers[0].mask), Array.from(px.layers[0].mask), "smooth resample rounds the pixels");
    const dn = await E.render(grad, merge(clone(DEFAULTS), { engine: "dither", algo: { dither: "fs" }, fx: { pre: { on: true, denoise: 100 } } }));
    assert.ok(dn.layers.length >= 1, "denoise renders");
    const cv = await E.render(grad, merge(clone(DEFAULTS), { engine: "dither", algo: { dither: "atk" }, mode: "tonal", tonal: { inks: ["#FFFFFF", "#888888", "#222222"] }, colorView: { on: true } }));
    const top = cv.layers[cv.layers.length - 1];
    assert.ok(top.rgba && top.name === "Colour in view" && top.blend === "COLOR", "3 inks: original on top as Color");
    const cv2 = await E.render(grad, merge(clone(DEFAULTS), { engine: "dither", algo: { dither: "atk" }, colorView: { on: true } }));
    assert.strictEqual(cv2.layers[cv2.layers.length - 1].blend, "MULTIPLY", "1 ink: Multiply");
    const ramp = [{ c: [40, 20, 120], p: 0 }, { c: [200, 40, 160], p: 0.5 }, { c: [255, 240, 200], p: 1 }];
    const ov = await E.render(grad, merge(clone(DEFAULTS), { engine: "ascii", ascii: { cell: 8, glyph: "overlap", ramp } }));
    assert.strictEqual(ov.layers.length, 3, "one layer per gradient colour");
    let both = 0; for (let i = 0; i < W * W; i++) if (ov.layers[0].mask[i] && ov.layers[1].mask[i] || ov.layers[1].mask[i] && ov.layers[2].mask[i]) both++;
    assert.ok(both > 0, "neighbouring bands overlap");
  });

  await t("Chroma 3.0 desert chrome: horizon shapes differ, Bend and Bevel gradient change the face, 6 Desert chrome looks", async () => {
    const E = require("../plugins/chrometone/js/engine.js");
    const { DEFAULTS, PRESETS, merge, clone } = require("../plugins/chrometone/js/state.js");
    const w = 200, h = 100, d = new Uint8Array(w * h * 4);
    for (let y = 20; y < 80; y++) for (let x = 20; x < 180; x++) { const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = 255; }
    const src = { w, h, c: 4, data: d };
    const run = async (sp) => { const P = merge(clone(DEFAULTS), { surface: Object.assign({ from: "outline", reflect: "horizon", wave: 60 }, sp), bands: { count: 0 } }); P.scale = 1; return E.composite(await E.render(src, P, { yield: async () => {} }), { type: "black" }, src); };
    const diff = (a, b) => { let k = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 8) k++; return k; };
    const hills = await run({ hshape: "hills" });
    for (const sh of ["mountains", "angled", "curtain", "flat"]) assert.ok(diff(await run({ hshape: sh }), hills) > 200, sh + " differs from hills");
    assert.ok(diff(await run({ hshape: "hills", bend: 80 }), hills) > 200, "bend moves the horizon");
    assert.ok(diff(await run({ hshape: "hills", bevelOn: true, bevel: 20 }), await run({ hshape: "hills", bevel: 20 })) > 200, "bevel gradient recolours the rim");
    assert.strictEqual(PRESETS.filter((p) => p.cat === "Desert chrome").length, 6);
  });

  await t("Chroma 3.0 photo: Photo chrome embosses a photo, Subject cut-out wraps the subject and keeps the photo around it, Shape badges, Prism Foil retuned", async () => {
    const E = require("../plugins/chrometone/js/engine.js");
    const { DEFAULTS, PRESETS, merge, clone } = require("../plugins/chrometone/js/state.js");
    const src = E.demoImage(160, 120), n = 160 * 120;
    const run = async (p, s2) => { const P = merge(clone(DEFAULTS), p); P.scale = 1; P.out.layers = "merged"; const r = await E.render(s2 || src, P, { yield: async () => {} }); return r; };
    const px = (r) => r.layers[0].rgba;
    const sd = (b) => { let s = 0, q = 0; for (let i = 0; i < b.length; i += 4) { const v = b[i] + b[i + 1] + b[i + 2]; s += v; q += v * v; } const m = s / (b.length / 4); return Math.sqrt(q / (b.length / 4) - m * m); };
    const pc = await run(PRESETS.find((p) => p.name === "Photo Chrome").p);
    assert.ok(sd(px(pc)) > 60, "photo chrome has shape, not flat grey: " + sd(px(pc)));
    // no subject yet: falls back to photo chrome with a note
    const ns = await run(PRESETS.find((p) => p.name === "Subject Chrome").p);
    assert.ok(ns.notes.some((x) => /No subject/.test(x)), "note when there is no subject");
    const subject = new Float32Array(n); for (let y = 30; y < 100; y++) for (let x = 50; x < 110; x++) subject[y * 160 + x] = 1;
    const sb = await run(PRESETS.find((p) => p.name === "Subject Chrome").p, Object.assign({}, src, { subject }));
    const q = px(sb), i0 = (5 * 160 + 5) * 4;
    assert.deepStrictEqual(Array.from(q.slice(i0, i0 + 4)), [src.data[i0], src.data[i0 + 1], src.data[i0 + 2], 255], "photo kept outside the subject");
    const i1 = (60 * 160 + 80) * 4; assert.ok(Math.abs(q[i1] - src.data[i1]) + Math.abs(q[i1 + 2] - src.data[i1 + 2]) > 20, "chrome inside the subject");
    assert.ok(PRESETS.filter((p) => p.badge === "Shape").length >= 20 && !PRESETS.find((p) => p.name === "Photo Chrome").badge, "Shape badges on outline looks only");
    const a = Buffer.from(px(await run(PRESETS.find((p) => p.name === "Holo Foil").p))), b = Buffer.from(px(await run(PRESETS.find((p) => p.name === "Prism Foil").p)));
    let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]); assert.ok(d / a.length > 20, "Prism Foil no longer matches Holo Foil");
  });

  await t("Paint 3.0: the watercolour wash centres on the subject (focus mask), Subject focus option in the panel", async () => {
    const E = require("../plugins/paint-brew/js/engine.js"), S = require("../plugins/paint-brew/js/state.js");
    const w = 160, h = 90, n = w * h, src = E.demoImage(w, h), focus = new Float32Array(n);
    for (let y = 20; y < 80; y++) for (let x = 8; x < 40; x++) focus[y * w + x] = 1;          // subject at the far left
    const P = S.merge(S.DEFAULTS, { style: "watercolour", water: { fade: 80, pencil: 0, splashes: 0 }, focus: { falloff: 10, outside: 100 } }); P.scale = 1;
    const ink = async (s2) => { const r = await E.render(s2, P, { yield: async () => {} }); const q = r.layers[0].rgba; let L = 0, R = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = 765 - q[(y * w + x) * 4] - q[(y * w + x) * 4 + 1] - q[(y * w + x) * 4 + 2]; if (x < 30) L += v; else if (x > 130) R += v; } return { L, R }; };
    const a = await ink(src), b = await ink(Object.assign({}, src, { focus }));
    assert.ok(b.L / Math.max(1, b.R) > a.L / Math.max(1, a.R) * 1.3, "wash moves to the subject: " + JSON.stringify([a, b]));
    const main = require("fs").readFileSync(path.join(ROOT, "plugins/paint-brew/main.js"), "utf8");
    assert.ok(/v: "subject", l: "Subject \(Select Subject\)"/.test(main), "Subject focus option");
  });

  await t("Depth 3.0 depth waves: Columns, Tilt, Depth contrast and Line glow each change the scan; 4 Depth waves looks", async () => {
    const E = require("../plugins/depthtone/js/engine.js");
    const S = require("../plugins/depthtone/js/state.js");
    const w = 120, h = 90, src = E.demoImage(w, h);
    const run = async (rg) => { const P = S.merge(S.DEFAULTS, { style: "ridges", photo: 0, ridges: rg || {} }); P.scale = 1; return E.composite(await E.render(src, P), { type: "black" }, src); };
    const diff = (a, b) => { let k = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 8) k++; return k; };
    const base = await run();
    for (const [k, v] of [["dir", "cols"], ["tilt", 70], ["contrast", 80], ["glow", 80]]) assert.ok(diff(await run({ [k]: v }), base) > 100, k + " changes the scan");
    assert.strictEqual(diff(await run({ tilt: 0, contrast: 0, glow: 0, dir: "rows" }), base), 0, "defaults unchanged");
    assert.strictEqual(S.PRESETS.filter((p) => p.cat === "Waves").length, 4);
  });

  await t("Looks: no two looks in a plugin share the same settings", () => {
    const fs = require("fs");
    for (const tool of fs.readdirSync(path.join(ROOT, "plugins"))) {
      const f = path.join(ROOT, "plugins", tool, "js/state.js");
      if (!fs.existsSync(f)) continue;
      const S = require(f);
      if (!Array.isArray(S.PRESETS) || !S.merge) continue;
      const seen = new Map();
      for (const p of S.PRESETS) {
        const k = JSON.stringify(S.merge(S.clone(S.DEFAULTS), p.p));
        assert.ok(!seen.has(k), tool + ": \"" + p.name + "\" duplicates \"" + seen.get(k) + "\"");
        seen.set(k, p.name);
      }
    }
  });
};
