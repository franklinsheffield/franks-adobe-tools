"use strict";
// Colour section 3.0: all 12 tools (spec "Colour section 3.0", Frank locked in all 12 on 2026-11-24).
const assert = require("assert");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

module.exports = async function (t) {
  const K = require("../shared/colour3.js");
  const Colour = require("../shared/colour.js");
  const grey = (w, h) => { const d = new Uint8Array(w * h * 3); for (let i = 0; i < w * h; i++) d[i * 3] = d[i * 3 + 1] = d[i * 3 + 2] = Math.round((i % w) / (w - 1) * 255); return { w, h, c: 3, data: d }; };

  await t("Colour 3.0 engine: gradient map, duotone/tritone inks, grade, OKLab reduction with 5 dithers", () => {
    const img = grey(64, 4);
    // 1 gradient: black end takes the first stop, white end the last
    const g = Colour.render(img, Object.assign(Colour.normalize({}), { mode: "gradient", grad: { stops: [{ c: "#FF0000", p: 0 }, { c: "#0000FF", p: 100 }] } }));
    const near = (a, b, msg) => assert.ok(a.every((x, i) => Math.abs(x - b[i]) <= 2), msg + ": " + a);
    near(Array.from(g.slice(0, 3)), [255, 0, 0], "black end"); near(Array.from(g.slice(63 * 4, 63 * 4 + 3)), [0, 0, 255], "white end");
    // 2 inks: white = paper, black = all inks multiplied
    const I = { n: 2, paper: "#FFFFFF", inks: [{ c: "#00FFFF", g: 1, lo: 0, hi: 100 }, { c: "#FFFF00", g: 1, lo: 0, hi: 100 }, { c: "#000000", g: 1, lo: 0, hi: 100 }] };
    const ink = Colour.render(img, Object.assign(Colour.normalize({}), { mode: "inks", ink: I }));
    assert.deepStrictEqual(Array.from(ink.slice(63 * 4, 63 * 4 + 3)), [255, 255, 255], "paper in the whites");
    assert.deepStrictEqual(Array.from(ink.slice(0, 3)), [0, 255, 0], "cyan x yellow = green in the blacks");
    assert.strictEqual(Colour.label({ mode: "inks", ink: { n: 3 } }), "Tritone");
    // 8 grade: saturation -100 makes greys; temperature warms (more red than blue)
    const red = { w: 1, h: 1, c: 3, data: Uint8Array.from([200, 60, 60]) };
    const gs = Colour.render(red, Object.assign(Colour.normalize({}), { mode: "grade", adj: Object.assign({}, K.DEFAULT_ADJ, { sat: -100 }) }));
    assert.ok(Math.abs(gs[0] - gs[1]) <= 2 && Math.abs(gs[1] - gs[2]) <= 2, "desaturated: " + Array.from(gs.slice(0, 3)));
    const mid = { w: 1, h: 1, c: 3, data: Uint8Array.from([128, 128, 128]) };
    const warm = Colour.render(mid, Object.assign(Colour.normalize({}), { mode: "grade", adj: Object.assign({}, K.DEFAULT_ADJ, { temp: 80 }) }));
    assert.ok(warm[0] > warm[2] + 10, "warmer: " + Array.from(warm.slice(0, 3)));
    // 9 colour replace: red becomes blue, a far-away green is untouched
    const two = { w: 2, h: 1, c: 3, data: Uint8Array.from([230, 20, 20, 20, 200, 20]) };
    const rep = Colour.render(two, Object.assign(Colour.normalize({}), { mode: "grade", adj: Object.assign({}, K.DEFAULT_ADJ, { replace: [{ from: "#E61414", to: "#1414E6", tol: 20, soft: 0 }] }) }));
    assert.ok(rep[2] > 180 && rep[0] < 60, "red -> blue: " + Array.from(rep.slice(0, 3)));
    assert.deepStrictEqual(Array.from(rep.slice(4, 7)), [20, 200, 20]);
    // 7 wheels: a blue shadow tint makes darks bluer, leaves white alone
    const sw = Colour.render({ w: 2, h: 1, c: 3, data: Uint8Array.from([40, 40, 40, 255, 255, 255]) }, Object.assign(Colour.normalize({}), { mode: "grade", adj: Object.assign({}, K.DEFAULT_ADJ, { sh: { h: 260, a: 100 } }) }));
    assert.ok(sw[2] > sw[0] + 5, "shadows bluer: " + Array.from(sw.slice(0, 3))); assert.ok(sw[4] >= 250 && sw[6] >= 250, "white stays white");
    // 6 reduction: every output pixel is a palette colour, for every dither
    const pal = ["#000000", "#FF3D6E", "#5CF2FF", "#FFFFFF"];
    for (const m of ["nearest", "dither", "floyd", "atkinson", "blue"]) {
      const o = Colour.render(grey(32, 8), Object.assign(Colour.normalize({}), { mode: "palette", pal: { colors: pal, count: 4, match: m, metric: "oklab" } }));
      const set = new Set(pal);
      for (let i = 0; i < 32 * 8; i++) assert.ok(set.has(K.rgbToHex([o[i * 4], o[i * 4 + 1], o[i * 4 + 2]])), m + " pixel " + i + " is a palette colour");
    }
    // saved pre-3.0 palette decks keep the old RGB match (no metric key)
    assert.strictEqual(Colour.normalize({ mode: "palette", pal: { colors: pal, count: 4, match: "nearest" } }).pal.metric, "rgb");
  });

  await t("Colour 3.0 tools: harmony, palette import/export (.ase .aco .gpl hex), brand lock, spot layers, proof, randomise with locks", () => {
    // 4 harmony: right count, distinct, dark -> light in OKLCH
    const h = K.harmony("#FF3D6E", "triad", 6);
    assert.strictEqual(h.length, 6); assert.strictEqual(new Set(h).size, 6);
    for (let i = 1; i < 6; i++) assert.ok(K.hexLch(h[i])[0] > K.hexLch(h[i - 1])[0], "lighter each step");
    // 3 library: round trips and formats
    assert.deepStrictEqual(K.parseASE(K.writeASE(["#FF0000", "#00FF80", "#123456"], "x")), ["#FF0000", "#00FF80", "#123456"]);
    assert.deepStrictEqual(K.parseGPL(K.writeGPL(["#ABCDEF"])), ["#ABCDEF"]);
    assert.deepStrictEqual(K.importPalette("list.txt", "brand: #5cf2ff, ff3d6e and #abc"), ["#5CF2FF", "#FF3D6E", "#AABBCC"]);
    const aco = new Uint8Array(4 + 10); const v = new DataView(aco.buffer); v.setUint16(0, 1); v.setUint16(2, 1); v.setUint16(4, 0); v.setUint16(6, 65535); v.setUint16(8, 0); v.setUint16(10, 32896);
    assert.deepStrictEqual(K.parseACO(aco), ["#FF0080"]);
    assert.throws(() => K.importPalette("x.ase", new Uint8Array(8)), /Not an .ase/);
    // 5 brand lock: every colour lands on a brand colour
    const C = Colour.normalize({ mode: "gradient" }); const brand = ["#05040C", "#BC71FE", "#5CF2FF", "#FFFFFF"];
    K.lockToBrand(C, brand);
    assert.ok(C.grad.stops.every((s) => brand.includes(s.c)), "stops on brand: " + C.grad.stops.map((s) => s.c));
    // 10 spot layers: one layer per used colour, masks cover every pixel once
    const rgba = Colour.render(grey(16, 2), Object.assign(Colour.normalize({}), { mode: "palette", pal: { colors: ["#000000", "#FF0000", "#FFFFFF"], count: 3, match: "nearest", metric: "oklab" } }));
    const L = K.spotLayers(rgba, 16, 2, ["#000000", "#FF0000", "#FFFFFF"]);
    assert.ok(L.length >= 2 && L.every((x) => /^Spot \d #/.test(x.name)));
    let cover = 0; for (let i = 0; i < 32; i++) cover += L.filter((x) => x.mask[i]).length;
    assert.strictEqual(cover, 32, "each pixel on exactly one spot layer");
    // 11 proof: pure RGB green is out of CMYK, mid grey is in; deutan sim changes red/green
    assert.ok(K.outOfCMYK([0, 255, 0]) && !K.outOfCMYK([128, 128, 128]));
    const p = Uint8Array.from([255, 0, 0, 0, 255, 0]); K.proof(p, "deutan");
    assert.ok(Math.abs(p[0] - p[3]) < 120, "red and green move closer for deutan: " + Array.from(p));
    // randomise: locked swatches stay, others change, same seed -> same result
    const cur = ["#FF0000", "#00FF00", "#0000FF", "#FFFFFF"], locks = [true, false, false, true];
    const r1 = K.randomise(cur, locks, 4, 42), r2 = K.randomise(cur, locks, 4, 42);
    assert.deepStrictEqual(r1, r2); assert.strictEqual(r1[0], "#FF0000"); assert.strictEqual(r1[3], "#FFFFFF");
    assert.ok(r1[1] !== "#00FF00" || r1[2] !== "#0000FF");
  });

  await t("Colour 3.0 panel: 6-mode grid, gradient/inks/grade cards, blend mode + spot layers on Apply, swatch sync", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins", "crt-phaser"), { withDoc: true });
    const ready = async () => { for (let i = 0; i < 200 && !/^Preview /.test(P.document.querySelector(".status").textContent); i++) await P.settle(50); };
    await ready();
    const D = P.document, T = P.mod._test;
    const tiles = Array.from(D.querySelectorAll(".cdmodes .tile"));
    assert.strictEqual(tiles.length, 6, "six colour modes as a tile grid");
    const tile = (name) => tiles.find((x) => x.textContent.trim() === name);
    tile("Gradient").dispatchEvent(new P.window.MouseEvent("click", { bubbles: true }));
    assert.strictEqual(T.state.deck.mode, "gradient");
    assert.ok(Array.from(D.querySelectorAll(".dlabel")).some((n) => /Stop/.test(n.textContent) && n.offsetParent !== null || /Stop/.test(n.textContent)), "stop steppers");
    // swatch sync: PS foreground/background into the colours
    const byKey = (k) => Array.from(D.querySelectorAll("*")).find((n) => n.__help && n.__help.key === k);
    const fg = byKey("deck.sync.fgbg");
    fg.dispatchEvent(new P.window.MouseEvent("click", { bubbles: true }));
    assert.strictEqual(T.state.deck.grad.stops[0].c, "#FF3D6E"); assert.strictEqual(T.state.deck.grad.stops[T.state.deck.grad.stops.length - 1].c, "#05040C");
    // blend mode reaches the PS layer
    T.state.deck.blend = "color"; T.state.deck.proof = "deutan"; T.touch(); await ready();
    P.host.calls.length = 0;
    await T.applyNow();
    const L = P.host.doc.layers.find((x) => /^Colour Deck - Gradient Map/.test(x.name));
    assert.ok(L, "Colour layer written: " + P.host.doc.layers.map((x) => x.name));
    assert.strictEqual(L.blendMode, "color");
    // spot layers in palette mode
    tile("Palette").dispatchEvent(new P.window.MouseEvent("click", { bubbles: true }));
    T.state.deck.pal.colors = ["#000000", "#BC71FE", "#FFFFFF"]; T.state.deck.pal.count = 3; T.state.deck.spots = true; T.state.deck.blend = "normal"; T.touch(); await ready();
    await T.applyNow();
    const spots = P.host.doc.layers.filter((x) => /^Spot \d #/.test(x.name));
    assert.ok(spots.length >= 2, "spot layers: " + P.host.doc.layers.map((x) => x.name));
    // grade card exists with its Advanced wheels and swap rows
    assert.ok(Array.from(D.querySelectorAll(".ctitle")).some((n) => /Colour grade/.test(n.textContent)));
  });
};
