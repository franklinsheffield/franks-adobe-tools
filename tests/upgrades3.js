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
