"use strict";
// Dithers ASCII 3.0 (spec "Dithers ASCII 3.0"): 20 algorithms, 4 fonts, size in px, spacing, invert, seed.
const assert = require("assert");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

module.exports = async function (t) {
  const A3 = require("../plugins/dithers-brew/js/ascii3.js");
  const A1 = require("../plugins/dithers-brew/js/ascii.js");
  const W = 192, H = 144, n = W * H;
  const grad = new Uint8Array(n), lum = new Uint8Array(n), disc = new Uint8Array(n), dlum = new Uint8Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, v = Math.round(x / (W - 1) * 255); grad[i] = v; lum[i] = 255 - v;
    const d = Math.hypot(x - W / 2, y - H / 2) < 45 ? 230 : 25; disc[i] = d; dlum[i] = 255 - d;
  }
  const ink = (m, x0, x1) => { let s = 0, c = 0; for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) { s += m[y * W + x] ? 1 : 0; c++; } return s / c; };

  await t("ASCII 3.0: 20 algorithms in 4 groups of 5, 4 built-in fonts", () => {
    assert.strictEqual(A3.ALGOS.length, 20);
    A3.GROUPS.forEach((g) => assert.strictEqual(A3.ALGOS.filter((a) => a.g === g).length, 5, g));
    assert.deepStrictEqual(A3.FONTS.map((f) => [f.w, f.h]), [[3, 5], [5, 7], [8, 8], [8, 16]]);
    for (const f of A3.FONTS) for (const ch of "0123456789ABCXYZ.:-=+*#%@") { const g = A3.glyph(f.id, ch); assert.ok(g && g.length === f.w * f.h, f.id + " " + ch); }
  });

  await t("ASCII 3.0: every algorithm on every font draws ink, darker input draws more (tone groups)", () => {
    for (const a of A3.ALGOS) for (const f of A3.FONTS) {
      const src = a.g === "Structure" ? disc : grad, l = a.g === "Structure" ? dlum : lum;
      const m = A3.render(src, W, H, { algo: a.id, font: f.id, cell: 16, set: "classic", text: "FRANK", seed: 2, lum: l });
      assert.ok(m && m.length === n, a.id + " " + f.id);
      assert.ok(ink(m, 0, W) > 0.002, a.id + "/" + f.id + " draws nothing");
      if (a.g !== "Structure" && a.id !== "rain") assert.ok(ink(m, W * 2 / 3, W) > ink(m, 0, W / 3), a.id + "/" + f.id + " dark side should hold more ink");
    }
  });

  await t("ASCII 3.0: seeded algorithms are repeatable and the seed changes them; size, spacing and invert work", () => {
    for (const id of ["bluenoise", "glitch", "rain"]) {
      const o = { algo: id, font: "classic", cell: 12, set: "dense", seed: 5, lum };
      assert.deepStrictEqual(Buffer.from(A3.render(grad, W, H, o)), Buffer.from(A3.render(grad, W, H, o)), id + " repeatable");
      assert.notDeepStrictEqual(Buffer.from(A3.render(grad, W, H, o)), Buffer.from(A3.render(grad, W, H, Object.assign({}, o, { seed: 6 }))), id + " seed");
    }
    const g8 = A3.geom({ font: "classic", cell: 8 }), g32 = A3.geom({ font: "classic", cell: 32 }), gs = A3.geom({ font: "classic", cell: 32, spacing: 3 });
    assert.deepStrictEqual([g8.cw, g8.ch, g32.cw, g32.ch, gs.cw - g32.cw], [6, 8, 24, 32, 3]);
    const plain = A3.render(grad, W, H, { algo: "ordered", font: "tiny", cell: 12, set: "classic", lum });
    const inv = A3.render(grad, W, H, { algo: "ordered", font: "tiny", cell: 12, set: "classic", lum, invert: true });
    assert.ok(ink(inv, 0, W / 3) > ink(plain, 0, W / 3), "inverted: the light side becomes ink");
  });

  await t("ASCII 3.0: 2.x looks render exactly as before (Classic font, Luminance / Edge / Text)", () => {
    for (const [o, legacy] of [
      [{ algo: "luma", set: "classic", cell: 24 }, { k: 3, ramp: A1.buildRamp("classic"), edgeAmt: 0 }],
      [{ algo: "luma", set: "dense", cell: 24, edgeAmt: 0.7 }, { k: 3, ramp: A1.buildRamp("dense"), edgeAmt: 0.7 }],
      [{ algo: "text", set: "classic", cell: 40, text: "FRANK" }, { k: 5, ramp: A1.buildRamp("classic"), textMode: true, text: "FRANK" }]
    ]) {
      const a = A3.render(disc, W, H, Object.assign({ font: "classic", lum: dlum }, o));
      const b = A1.asciiInk(disc, W, H, Object.assign({ lum: dlum }, legacy));
      assert.deepStrictEqual(Buffer.from(a), Buffer.from(b), o.algo);
    }
  });

  await t("Dithers engine: Cell colour glyphs take the picture colour; Size in px replaces Scale (2.x Scale x 8)", async () => {
    const E = require("../plugins/dithers-brew/js/engine.js");
    const { DEFAULTS, merge, normAscii } = require("../plugins/dithers-brew/js/state.js");
    const w = 96, h = 64, data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) { data[i * 4] = 200; data[i * 4 + 1] = 30; data[i * 4 + 2] = 40; data[i * 4 + 3] = 255; }
    const P = merge(DEFAULTS, { engine: "ascii", ascii: { algo: "ordered", cell: 16, glyph: "cell" } }); P.ppi = 72; P.scale = 1;
    const r = await E.render({ w, h, c: 4, data }, P);
    assert.strictEqual(r.layers.length, 1); const q = r.layers[0].rgba; assert.ok(q, "rgba layer");
    let on = -1; for (let i = 0; i < w * h; i++) if (q[i * 4 + 3]) { on = i; break; }
    assert.ok(on >= 0, "glyphs drawn"); assert.deepStrictEqual(Array.from(q.slice(on * 4, on * 4 + 3)), [200, 30, 40]);
    assert.ok(E.composite(r, { type: "white" }).length === w * h * 3);
    assert.strictEqual(normAscii(merge(DEFAULTS, { ascii: { size: 3 } })).ascii.cell, 24);
    assert.strictEqual(normAscii(merge(DEFAULTS, { ascii: { textMode: true } })).ascii.algo, "text");
  });
};
