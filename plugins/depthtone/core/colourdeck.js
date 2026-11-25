"use strict";
// ======================================================================
// Colour Deck card + pipeline glue (UI side of shared/colour.js).
//
//   const deck = createColourDeck(ui, {
//     getC: () => state.colour,        the Colour Deck state (see colour.js)
//     touch,                           call after every change
//     getSource: () => img | null,     last preview source {w,h,c,data} for Extract
//     io: PS,                          optional: loadData/saveData for saved maps
//     setStatus })
//   deck.card                          the card node
//   deck.load()                        reads saved custom maps
//   applyDeckPreview(rgb, res, C, Engine, src, viewBg, base)   preview overlay, in place
//   addDeckLayer(res, C, Engine, src, base)                     result for Apply
// ======================================================================
const Colour = require("./colour.js");
const PNG = require("./png.js");
const K = require("./colour3.js");

// ---- 3.0: blend mode of the Colour Deck layer (preview maths + PS name)
const BLENDS = [
  { v: "normal", l: "Normal" }, { v: "multiply", l: "Multiply" }, { v: "screen", l: "Screen" }, { v: "overlay", l: "Overlay" },
  { v: "softLight", l: "Soft Light" }, { v: "hardLight", l: "Hard Light" }, { v: "darken", l: "Darken" }, { v: "lighten", l: "Lighten" },
  { v: "color", l: "Color" }, { v: "hue", l: "Hue" }, { v: "saturation", l: "Saturation" }, { v: "luminosity", l: "Luminosity" }
];
const psBlend = (b) => String(b || "normal").toUpperCase();
function blendPx(mode, a, b) {        // a = below, b = deck colour, 0..255
  const f = (x, y) => {
    x /= 255; y /= 255;
    switch (mode) {
      case "multiply": return x * y;
      case "screen": return 1 - (1 - x) * (1 - y);
      case "overlay": return x < 0.5 ? 2 * x * y : 1 - 2 * (1 - x) * (1 - y);
      case "hardLight": return y < 0.5 ? 2 * x * y : 1 - 2 * (1 - x) * (1 - y);
      case "softLight": return y < 0.5 ? x - (1 - 2 * y) * x * (1 - x) : x + (2 * y - 1) * ((x < 0.25 ? ((16 * x - 12) * x + 4) * x : Math.sqrt(x)) - x);
      case "darken": return Math.min(x, y);
      case "lighten": return Math.max(x, y);
      default: return y;
    }
  };
  if (mode === "color" || mode === "hue" || mode === "saturation" || mode === "luminosity") {
    const A = K.labToLch(K.rgbToLab(a)), B = K.labToLch(K.rgbToLab(b));
    const L = mode === "luminosity" ? B[0] : A[0], C = mode === "color" || mode === "saturation" ? B[1] : A[1], H = mode === "color" || mode === "hue" ? B[2] : A[2];
    return K.labToRgb(L, C * Math.cos(H * Math.PI / 180), C * Math.sin(H * Math.PI / 180));
  }
  return [f(a[0], b[0]) * 255, f(a[1], b[1]) * 255, f(a[2], b[2]) * 255];
}
function overBlend(rgb, deck, mix, mode) {
  if (!mode || mode === "normal") return Colour.overPreview(rgb, deck, mix);
  const k = Math.max(0, Math.min(100, mix == null ? 100 : mix)) / 100, n = rgb.length / 3;
  for (let i = 0; i < n; i++) {
    const al = deck[i * 4 + 3] / 255 * k;
    if (!al) continue;
    const a = [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]], r = blendPx(mode, a, [deck[i * 4], deck[i * 4 + 1], deck[i * 4 + 2]]);
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = a[c] + (r[c] - a[c]) * al;
  }
  return rgb;
}

function lumBase(res, Engine, src, base) {
  return Engine.composite(res, { type: base || "black" }, src);
}
function deckRGBA(res, C, Engine, src, base) {
  return Colour.render({ w: res.w, h: res.h, c: 3, data: lumBase(res, Engine, src, base) }, C);
}
// preview: overlay the deck on the tool's own preview (or on the plain
// view background when Solo is on)
function applyDeckPreview(rgb, res, C, Engine, src, viewBg, base) {
  if (!Colour.active(C)) return C && C.proof && C.proof !== "off" ? K.proof(rgb, C.proof) : rgb;
  const deck = deckRGBA(res, C, Engine, src, base);
  if (C.solo) {
    const w = res.w;
    for (let i = 0; i < res.w * res.h; i++) {
      const x = i % w, y = (i / w) | 0;
      const b = viewBg === "black" ? 0 : viewBg === "white" ? 255 : (((x >> 3) + (y >> 3)) & 1 ? 200 : 240);
      rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = b;
    }
  }
  overBlend(rgb, deck, C.mix, C.solo ? "normal" : C.blend);
  return C.proof && C.proof !== "off" ? K.proof(rgb, C.proof) : rgb;     // proof checks are preview only
}
// apply: one extra layer on top; Solo keeps the tool's layers but hides them
function addDeckLayer(res, C, Engine, src, base) {
  if (!Colour.active(C)) return res;
  const rgba = deckRGBA(res, C, Engine, src, base), op = Math.round(C.mix == null ? 100 : C.mix), blend = psBlend(C.blend);
  // 3.0 Spot-colour layers: one named mask layer per palette colour (screen print / Riso)
  const add = C.spots && C.mode === "palette"
    ? K.spotLayers(rgba, res.w, res.h, Colour.colours(C)).map((L) => ({ name: L.name, color: L.color, mask: L.mask, blend, opacity: op }))
    : [{ name: "Colour Deck - " + Colour.label(C), rgba, blend, opacity: op }];
  const layers = (C.solo ? res.layers.map((L) => Object.assign({}, L, { hidden: true })) : res.layers).concat(add);
  return Object.assign({}, res, { layers, paperHidden: !!C.solo });
}

// ink tools (mask layers, e.g. Dithers Brew): map each ink's own colour
// through the deck instead of adding a layer, so inks stay separate for print
function mapColour(rgb, C) {
  const px = Colour.render({ w: 1, h: 1, c: 3, data: Uint8Array.from(rgb) }, Object.assign({}, C, { tone: Object.assign({}, C.tone, { knockout: false }) }));
  return [px[0], px[1], px[2]];
}
function recolourInks(res, C) {
  if (!Colour.active(C)) return res;
  const layers = res.layers.map((L) => (L.color && L.mask ? Object.assign({}, L, { color: mapColour(L.color, C), name: L.name + " > " + Colour.label(C) }) : L));
  return Object.assign({}, res, { layers });
}

function createColourDeck(ui, o) {
  const { el, bind, showIf, segGroup, sliderRow, checkRow, hexField, card } = ui;
  const C = () => o.getC();
  const touch = () => o.touch();
  let custom = { tone: [], pal: [] };
  const btn = (text, title, fn) => { const b = el("button", { class: "btn small", text, title: title || "" }); b.addEventListener("click", fn); return b; };

  // ---- preset picker (built-ins + saved), rebuilt when the saved list changes
  function presetPicker(kind) {
    const sel = el("select", { "data-key": "deck.picker." + kind });
    let opts = [];
    const fill = () => {
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      const base = kind === "tone" ? Colour.TONEMAPS : Colour.PALETTES;
      opts = [{ name: "Choose a " + (kind === "tone" ? "tone map" : "palette") + "...", v: null }]
        .concat(base.map((p) => ({ name: p.name, v: p })))
        .concat(custom[kind].map((p) => ({ name: "* " + p.name, v: p })));
      opts.forEach((p) => sel.appendChild(el("option", { value: p.name, text: p.name })));
      sel.selectedIndex = 0;
    };
    fill();
    sel.addEventListener("change", () => {
      const p = opts[sel.selectedIndex] && opts[sel.selectedIndex].v;
      if (!p) return;
      if (kind === "tone") Colour.applyToneMap(C(), p);
      else { C().pal.colors = p.colors.slice(); C().pal.count = p.colors.length; }
      sel.selectedIndex = 0;
      touch();
    });
    sel.__fill = fill;
    return sel;
  }

  // ---- colour strip under the black -> white ramp
  const stripImg = el("img", { class: "cdstrip" });
  const rampImg = el("img", { class: "cdramp" });
  (() => {
    const w = 256, h = 6, d = new Uint8Array(w * h * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d.fill(x, (y * w + x) * 3, (y * w + x) * 3 + 3);
    rampImg.src = PNG.dataURL(d, w, h, 3);
  })();
  bind(() => { if (C().mode !== "off") { const s = Colour.strip(C(), 256), u = PNG.dataURL(s.rgb, s.w, s.h, 3); if (stripImg.__u !== u) { stripImg.__u = u; stripImg.src = u; } } });

  // ---- one tone band row: swatch + two-handle range bar + numbers
  function rangeBar(i) {
    const band = () => C().tone.bands[i];
    const fill = el("div", { class: "cdfill" });
    const hA = el("div", { class: "cdh", title: "Drag: where this colour starts" });
    const hB = el("div", { class: "cdh", title: "Drag: where this colour ends" });
    const track = el("div", { class: "cdtrack" }, [fill, hA, hB]);
    bind(() => {
      const b = band(), a = Math.min(b.a, b.b), z = Math.max(b.a, b.b);
      fill.style.left = a + "%"; fill.style.width = Math.max(0.5, z - a) + "%"; fill.style.backgroundColor = b.c;
      hA.style.left = "calc(" + a + "% - 4px)"; hB.style.left = "calc(" + z + "% - 4px)";
    });
    let drag = null;
    const pct = (e) => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / Math.max(1, r.width) * 100))); };
    const move = (e) => {
      if (!drag) return;
      const b = band(), v = pct(e);
      if (drag.k === "both") { const w = drag.b - drag.a, d = Math.max(-drag.a, Math.min(100 - drag.b, v - drag.x)); b.a = drag.a + d; b.b = drag.a + d + w; }
      else b[drag.k] = v;
      ui.refreshAll();
    };
    const up = () => { if (!drag) return; drag = null; document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); const b = band(); if (b.a > b.b) { const t = b.a; b.a = b.b; b.b = t; } touch(); };
    const start = (k) => (e) => {
      const b = band();
      drag = { k, x: pct(e), a: b.a, b: b.b };
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
      if (e.stopPropagation) e.stopPropagation(); if (e.preventDefault) e.preventDefault();
    };
    hA.addEventListener("mousedown", start("a"));
    hB.addEventListener("mousedown", start("b"));
    fill.addEventListener("mousedown", start("both"));
    track.addEventListener("mousedown", (e) => {     // click on empty track: move the nearest end there
      const b = band(), v = pct(e), k = Math.abs(v - b.a) <= Math.abs(v - b.b) ? "a" : "b";
      b[k] = v; touch(); start(k)(e);
    });
    return track;
  }
  function numBox(get, set) {
    const n = el("input", { type: "text", class: "num cdnum", "data-key": "deck.band" });
    n.addEventListener("change", () => { let v = parseFloat(n.value); if (isNaN(v)) v = get(); set(Math.max(0, Math.min(100, Math.round(v)))); touch(); });
    bind(() => { n.value = String(get()); });
    return n;
  }
  const bandRows = [];
  for (let i = 0; i < Colour.MAX_BANDS; i++) {
    const b = () => C().tone.bands[i];
    const r = el("div", { class: "cdband" }, [
      hexField(() => b().c, (v) => { b().c = v; }),
      rangeBar(i),
      numBox(() => Math.min(b().a, b().b), (v) => { b().a = v; }),
      numBox(() => Math.max(b().a, b().b), (v) => { b().b = v; })
    ]);
    showIf(r, () => i < C().tone.n);
    bandRows.push(r);
  }

  const tonePick = presetPicker("tone");
  const toneBox = el("div", { class: "cdbox" }, [
    ui.row("Tone map", tonePick),
    ui.row("Colours", segGroup("deck.tone.n", [1, 2, 3, 4, 5, 6].map((k) => ({ v: k, l: String(k) })), "cdcount")),
    el("div", { class: "cdrampwrap" }, [rampImg, stripImg])
  ].concat(bandRows).concat([
    ui.row("Blend", segGroup("deck.tone.trans", [{ v: "hard", l: "Hard" }, { v: "smooth", l: "Smooth" }, { v: "dither", l: "Dither", t: "Overlaps mix with an ordered dither, like a print" }])),
    el("div", { class: "row wrap dials" }, [sliderRow("Spread", "deck.tone.spread", 0, 100, 1, "%")]),
    ui.row("Background", hexField(() => C().tone.bg, (v) => { C().tone.bg = v; })),
    checkRow("Knockout (transparent background)", "deck.tone.knockout"),
    el("div", { class: "row wrap" }, [
      btn("Reverse", "Flip the colours end to end", () => { Colour.reverse(C()); touch(); }),
      btn("Even spread", "Share the tone range evenly", () => { Colour.evenSpread(C()); touch(); }),
      btn("+ Save map", "Keep this tone map in the picker", () => saveCustom("tone"))
    ])
  ]));
  showIf(toneBox, () => C().mode === "tone");

  // ---- palette swatches
  let selSw = 0;
  const dots = el("div", { class: "cddots" });
  const swEdit = el("div", { class: "row" }, [
    el("span", { class: "lbl", text: "Swatch" }),
    hexField(() => C().pal.colors[selSw] || "#000000", (v) => { C().pal.colors[selSw] = v; }),
    btn("x", "Remove this swatch", () => { const p = C().pal; if (p.colors.length > 1) { p.colors.splice(selSw, 1); selSw = Math.max(0, selSw - 1); p.count = Math.min(p.count, p.colors.length); touch(); } })
  ]);
  bind(() => {
    while (dots.firstChild) dots.removeChild(dots.firstChild);
    const p = C().pal;
    if (selSw >= p.colors.length) selSw = 0;
    p.colors.forEach((c, k) => {
      const d = el("div", { class: "cddot" + (k === selSw ? " on" : "") + (k >= p.count ? " off" : ""), title: c + (k >= p.count ? " (not used: raise Colour count)" : "") });
      d.style.backgroundColor = c;
      d.addEventListener("click", () => { selSw = k; ui.refreshAll(); });
      dots.appendChild(d);
    });
    if (p.colors.length < Colour.MAX_SWATCHES) {
      const add = el("div", { class: "cddot add", text: "+", title: "Add a swatch" });
      add.addEventListener("click", () => { p.colors.push("#FFFFFF"); selSw = p.colors.length - 1; p.count = p.colors.length; touch(); });
      dots.appendChild(add);
    }
  });
  const palPick = presetPicker("pal");
  const palBox = el("div", { class: "cdbox" }, [
    ui.row("Palette", palPick),
    dots, swEdit,
    el("div", { class: "row wrap" }, [
      btn("Extract", "Take the palette from the image", () => {
        const src = o.getSource && o.getSource();
        if (!src) { if (o.setStatus) o.setStatus("Extract needs a preview first.", true); return; }
        C().pal.colors = Colour.extract(src, C().pal.count); C().pal.count = C().pal.colors.length; selSw = 0; touch();
      }),
      btn("Reset", "Back to the default palette", () => { C().pal = Colour.cloneColour(Colour.DEFAULT_COLOUR).pal; selSw = 0; touch(); }),
      btn("+ Save", "Keep this palette in the picker", () => saveCustom("pal"))
    ]),
    el("div", { class: "row wrap dials" }, [sliderRow("Colour count", "deck.pal.count", 2, Colour.MAX_SWATCHES, 1, "")]),
    o.v3 ? null : ui.row("Match", segGroup("deck.pal.match", [{ v: "nearest", l: "Nearest" }, { v: "dither", l: "Dither" }]))
  ]);
  showIf(palBox, () => C().mode === "palette");

  const common = el("div", { class: "cdbox" }, [
    el("div", { class: "row wrap dials" }, [sliderRow("Mix", "deck.mix", 0, 100, 1, "%"), sliderRow("Contrast", "deck.contrast", -100, 100, 1, "")]),
    checkRow("Colour Deck only (tool layers added hidden)", "deck.solo"),
    o.inkTool ? checkRow("Recolour the ink layers instead (keeps inks separate)", "deck.inks") : null
  ]);
  showIf(common, () => C().mode !== "off");

  let node;
  if (!o.v3) {
    node = card("Colour Deck", [
      el("div", { class: "row" }, [segGroup("deck.mode", [{ v: "off", l: "Off" }, { v: "tone", l: "Tone Map" }, { v: "palette", l: "Palette" }], "big")]),
      toneBox, palBox, common,
      el("div", { class: "hint", text: "Adds a separate Colour Deck layer on top of the result. Hide it or lower its opacity any time." })
    ]);
  } else node = buildV3();

  // ===================================================================
  // 3.0 Colour section (spec "Colour section 3.0", all 12 tools)
  // ===================================================================
  function buildV3() {
    const H = (n, key, name, kind) => (ui.helpAt ? ui.helpAt(n, { key, name, kind: kind || "button" }) : n);
    const hb = (text, key, fn) => H(btn(text, "", fn), key, text);
    const say = (m, err) => { if (o.setStatus) o.setStatus(m, err); };
    const io = o.io || {};

    // -- mode: 6 choices -> tile grid (spec: segmented 2-5, grid 6-12)
    const modeGrid = (ui.grid || segGroup)("deck.mode", [
      { v: "off", l: "Off" }, { v: "tone", l: "Tone" }, { v: "palette", l: "Palette" },
      { v: "gradient", l: "Gradient" }, { v: "inks", l: "Inks" }, { v: "grade", l: "Grade" }
    ], { cls: "cdmodes" });

    // -- 1 Gradient Map
    const gPick = el("select", { "data-key": "deck.picker.grad" });
    [{ name: "Choose a gradient..." }].concat(K.GRADIENTS).forEach((g) => gPick.appendChild(el("option", { value: g.name, text: g.name })));
    gPick.addEventListener("change", () => { const g = K.GRADIENTS[gPick.selectedIndex - 1]; if (g) { C().grad.stops = g.stops.map((x) => Object.assign({}, x)); touch(); } gPick.selectedIndex = 0; });
    const stopRows = [];
    for (let i = 0; i < K.MAX_STOPS; i++) {
      const st = () => C().grad.stops[i];
      const r = el("div", { class: "cdband" }, [
        hexField(() => (st() ? st().c : "#000000"), (v) => { st().c = v; }),
        ui.stepper("Stop", "deck.grad.stops." + i + ".p", 0, 100, 1, "%"),
        H(btn("x", "", () => { const g = C().grad; if (g.stops.length > 2) { g.stops.splice(i, 1); touch(); } }), "deck.grad.remove", "Remove stop")
      ]);
      showIf(r, () => i < C().grad.stops.length);
      stopRows.push(r);
    }
    const gradBox = el("div", { class: "cdbox" }, [
      ui.row("Gradient", gPick),
      el("div", { class: "cdrampwrap" }, [rampImg.cloneNode(), stripImg.cloneNode()])
    ].concat(stopRows).concat([
      el("div", { class: "row wrap" }, [
        hb("+ Stop", "deck.grad.add", () => { const g = C().grad; if (g.stops.length < K.MAX_STOPS) { const a = g.stops[g.stops.length - 2], b = g.stops[g.stops.length - 1]; g.stops.splice(g.stops.length - 1, 0, { c: a.c, p: Math.round((a.p + b.p) / 2) }); touch(); } }),
        hb("Reverse", "deck.grad.reverse", () => { C().grad.stops.forEach((x) => (x.p = 100 - x.p)); C().grad.stops.reverse(); touch(); }),
        hb("Even", "deck.grad.even", () => { const g = C().grad.stops; g.forEach((x, k) => (x.p = Math.round(k / (g.length - 1) * 100))); touch(); })
      ])
    ]));
    showIf(gradBox, () => C().mode === "gradient");

    // -- 2 Duotone / Tritone inks
    const iPick = el("select", { "data-key": "deck.picker.ink" });
    [{ name: "Choose an ink set..." }].concat(K.INKSETS).forEach((g) => iPick.appendChild(el("option", { value: g.name, text: g.name })));
    iPick.addEventListener("change", () => {
      const s2 = K.INKSETS[iPick.selectedIndex - 1];
      if (s2) { const I = C().ink; I.paper = s2.paper; I.n = s2.inks.length; s2.inks.forEach((k, j) => (I.inks[j] = Object.assign({}, k))); touch(); }
      iPick.selectedIndex = 0;
    });
    const inkRows = [0, 1, 2].map((j) => {
      const k = () => C().ink.inks[j] || {};
      const r = el("div", { class: "cdink" }, [
        ui.row("Ink " + (j + 1), hexField(() => k().c || "#000000", (v) => { k().c = v; })),
        ui.stepper("Curve", "deck.ink.inks." + j + ".g", 0.2, 5, 0.1, ""),
        ui.range("Coverage", "deck.ink.inks." + j + ".lo", "deck.ink.inks." + j + ".hi", 0, 100, 1, "%")
      ]);
      showIf(r, () => j < C().ink.n);
      return r;
    });
    const inkBox = el("div", { class: "cdbox" }, [
      ui.row("Ink set", iPick),
      ui.row("Inks", segGroup("deck.ink.n", [{ v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3" }])),
      ui.row("Paper", hexField(() => C().ink.paper, (v) => { C().ink.paper = v; })),
      el("div", { class: "cdrampwrap" }, [rampImg.cloneNode(), stripImg.cloneNode()])
    ].concat(inkRows));
    showIf(inkBox, () => C().mode === "inks");
    bind(() => {
      const m = C().mode, box = m === "inks" ? inkBox : m === "gradient" ? gradBox : null;
      if (box) { const st = Colour.strip(C(), 256); box.querySelectorAll(".cdstrip").forEach((n) => (n.src = PNG.dataURL(st.rgb, st.w, st.h, 3))); }
    });

    // -- 3 Palette library + 4 Harmony + 6 Smarter reduction + locks (palette box gets extras)
    const harmBase = { c: "#5CF2FF", kind: "triad" };
    const harmKind = el("select", { "data-key": "deck.harmony.kind" });
    K.HARMONIES.forEach((h) => harmKind.appendChild(el("option", { value: h.v, text: h.l })));
    harmKind.addEventListener("change", () => { harmBase.kind = K.HARMONIES[harmKind.selectedIndex].v; });
    const pasteBox = H(el("input", { type: "text", class: "hexlist", placeholder: "Paste hex codes" }), "deck.pal.paste", "Paste hex list", "info");
    pasteBox.addEventListener("change", () => {
      const cols = K.parseHexList(pasteBox.value);
      if (!cols.length) { say("No hex colours found in that text.", true); return; }
      C().pal.colors = cols.slice(0, Colour.MAX_SWATCHES); C().pal.count = C().pal.colors.length; pasteBox.value = ""; touch();
    });
    const lockBtn = hb("Lock", "deck.pal.lock", () => { const L = C().pal.locks || (C().pal.locks = []); L[selSw] = !L[selSw]; touch(); });
    bind(() => { const L = C().pal.locks || []; lockBtn.textContent = L[selSw] ? "Unlock" : "Lock"; dots.querySelectorAll(".cddot").forEach((d, k) => d.classList.toggle("locked", !!L[k])); });
    const palExtra = el("div", { class: "cdbox" }, [
      ui.selectRow("Match", "deck.pal.match", K.DITHERS.map((d) => ({ v: d.v === "none" ? "nearest" : d.v === "bayer" ? "dither" : d.v, l: d.l }))),
      el("div", { class: "row wrap" }, [
        lockBtn,
        hb("Import", "deck.pal.import", async () => {
          try {
            const f = io.openPaletteFile ? await io.openPaletteFile() : null;
            if (!f) return;
            const cols = K.importPalette(f.name, f.data).slice(0, Colour.MAX_SWATCHES);
            C().pal.colors = cols; C().pal.count = cols.length; touch(); say("Loaded " + cols.length + " colours from " + f.name + ".");
          } catch (e) { say("Could not read that palette: " + e.message, true); }
        }),
        hb("Export", "deck.pal.export", async () => {
          try { const ok = io.savePaletteFile && await io.savePaletteFile("lab-palette.ase", K.writeASE(Colour.colours(C()), "Lab palette")); if (ok) say("Saved the palette as an .ase swatch file."); }
          catch (e) { say("Could not save: " + e.message, true); }
        })
      ]),
      el("div", { class: "row" }, [pasteBox]),
      ui.row("Harmony", hexField(() => harmBase.c, (v) => { harmBase.c = v; })),
      ui.row("", harmKind, hb("Build", "deck.harmony.build", () => { C().pal.colors = K.harmony(harmBase.c, harmBase.kind, C().pal.count); C().pal.locks = []; touch(); })),
      checkRow("Spot layers", "deck.spots")
    ]);
    showIf(palExtra, () => C().mode === "palette");

    // -- 7 + 8 + 9 Grade: global knobs, tone wheels, colour replace
    const wheel = (k, name) => el("div", { class: "row wrap dials" }, [ui.angle(name + " hue", "deck.adj." + k + ".h", 0, 360, 1), sliderRow(name, "deck.adj." + k + ".a", 0, 100, 1, "%")]);
    const repRows = [0, 1, 2, 3].map((j) => {
      const R = () => C().adj.replace[j] || {};
      const r = el("div", { class: "cdrep" }, [
        ui.row("Replace", hexField(() => R().from || "#000000", (v) => { R().from = v; }), el("span", { class: "lbl", text: "with" }), hexField(() => R().to || "#000000", (v) => { R().to = v; }),
          H(btn("x", "", () => { C().adj.replace.splice(j, 1); touch(); }), "deck.adj.replace.remove", "Remove")),
        el("div", { class: "row wrap dials" }, [sliderRow("Tolerance", "deck.adj.replace." + j + ".tol", 0, 100, 1, "%"), sliderRow("Softness", "deck.adj.replace." + j + ".soft", 0, 100, 1, "%")])
      ]);
      showIf(r, () => j < (C().adj.replace || []).length);
      return r;
    });
    const gradeCard = card("Colour grade", [
      el("div", { class: "row wrap dials" }, [
        sliderRow("Hue", "deck.adj.hue", -180, 180, 1, "°"), sliderRow("Saturation", "deck.adj.sat", -100, 100, 1, ""),
        sliderRow("Lightness", "deck.adj.light", -100, 100, 1, ""), sliderRow("Temperature", "deck.adj.temp", -100, 100, 1, ""),
        sliderRow("Tint", "deck.adj.tint", -100, 100, 1, "")
      ])
    ], {
      advanced: [wheel("sh", "Shadows"), wheel("mid", "Mids"), wheel("hi", "Highlights")].concat(repRows).concat([
        el("div", { class: "row wrap" }, [hb("+ Replace", "deck.adj.replace.add", () => {
          const A = C().adj; if (A.replace.length >= 4) return;
          const fgbg = io.getFgBg ? io.getFgBg() : {};
          A.replace.push({ from: fgbg.fg || "#FF0000", to: fgbg.bg || "#00FFFF", tol: 20, soft: 50, on: true }); touch();
        }), hb("Reset grade", "deck.adj.reset", () => { C().adj = JSON.parse(JSON.stringify(K.DEFAULT_ADJ)); touch(); })])
      ]),
      foldKey: "deck.grade"
    });
    showIf(gradeCard, () => C().mode !== "off");

    // -- shared: Mix fader, Contrast, blend mode, Randomise, brand lock, proof, swatch sync
    const brandState = { colors: [] };
    const loadBrand = async () => { try { const d = io.loadData ? await io.loadData("brand-palette.json") : null; if (d && Array.isArray(d.colors)) brandState.colors = d.colors; } catch (e) { /* none yet */ } };
    loadBrand();
    const shared = el("div", { class: "cdbox" }, [
      el("div", { class: "row wrap dials" }, [ui.fader("Mix", "deck.mix", 0, 100, 1, "%"), sliderRow("Contrast", "deck.contrast", -100, 100, 1, "")]),
      ui.selectRow("Blend", "deck.blend", BLENDS),
      el("div", { class: "row wrap" }, [
        hb("Randomise", "deck.random", () => {
          const c = C(), cur = Colour.colours(c), locks = c.mode === "palette" ? (c.pal.locks || []) : [];
          Colour.setColours(c, K.randomise(cur, locks, cur.length));
          if (c.brandLock) K.lockToBrand(c, brandState.colors);
          touch();
        }),
        hb("Use PS colours", "deck.sync.fgbg", () => {
          const f = io.getFgBg ? io.getFgBg() : {};
          if (!f.fg) { say("Could not read Photoshop's foreground colour.", true); return; }
          const c = C(), cur = Colour.colours(c);
          // foreground = darkest/first ink, background = lightest/paper
          if (c.mode === "inks") { c.ink.paper = f.bg || c.ink.paper; c.ink.inks[0].c = f.fg; }
          else { cur[0] = f.fg; if (f.bg) cur[cur.length - 1] = f.bg; Colour.setColours(c, cur); }
          touch();
        }),
        hb("To Swatches", "deck.sync.swatches", async () => {
          try { const n = io.addSwatches ? await io.addSwatches(Colour.colours(C()), "Lab") : 0; say("Added " + n + " colours to the Swatches panel."); }
          catch (e) { say("Could not add swatches: " + e.message, true); }
        })
      ]),
      checkRow("Brand lock", "deck.brandLock", (on) => { if (on) { if (!brandState.colors.length) say("Set a brand palette first: Palette mode, then Set brand.", true); K.lockToBrand(C(), brandState.colors); } }),
      el("div", { class: "row wrap" }, [
        hb("Set brand", "deck.brand.set", async () => {
          brandState.colors = Colour.colours(C()).slice();
          try { if (io.saveData) await io.saveData("brand-palette.json", { colors: brandState.colors }); say("Brand palette set (" + brandState.colors.length + " colours). Export it as .ase to share with the team."); }
          catch (e) { say("Could not save the brand palette: " + e.message, true); }
        }),
        hb("Import brand", "deck.brand.import", async () => {
          try {
            const f = io.openPaletteFile ? await io.openPaletteFile() : null; if (!f) return;
            brandState.colors = K.importPalette(f.name, f.data);
            if (io.saveData) await io.saveData("brand-palette.json", { colors: brandState.colors });
            if (C().brandLock) { K.lockToBrand(C(), brandState.colors); touch(); }
            say("Brand palette loaded: " + brandState.colors.length + " colours.");
          } catch (e) { say("Could not read that palette: " + e.message, true); }
        })
      ]),
      ui.selectRow("Proof", "deck.proof", K.PROOFS),
      checkRow("Colour only", "deck.solo"),
      o.inkTool ? checkRow("Recolour inks", "deck.inks") : null
    ]);
    showIf(shared, () => C().mode !== "off");
    // brand lock also applies after any edit while it is on
    bind(() => { const c = C(); if (c.brandLock && brandState.colors.length) K.lockToBrand(c, brandState.colors); });

    const main = card("Colour", [modeGrid, toneBox, palBox, palExtra, gradBox, inkBox, shared,
      el("div", { class: "hint", text: "The colour result goes on its own layer at the top of the group. Proof checks change only the preview." })]);
    const wrap = el("div", { class: "cd3" }, [main, gradeCard]);
    wrap.__brand = brandState;
    return wrap;
  }

  async function saveCustom(kind) {
    const n = custom[kind].length + 1, c = C();
    const item = kind === "tone"
      ? { name: "My map " + n, bands: c.tone.bands.slice(0, c.tone.n).map((b) => Object.assign({}, b)), bg: c.tone.bg, knockout: c.tone.knockout, trans: c.tone.trans }
      : { name: "My palette " + n, colors: c.pal.colors.slice(0, c.pal.count) };
    custom[kind].push(item);
    (kind === "tone" ? tonePick : palPick).__fill();
    try { if (o.io && o.io.saveData) await o.io.saveData("colour-deck.json", custom); if (o.setStatus) o.setStatus("Saved \"" + item.name + "\" to the Colour Deck picker."); }
    catch (e) { if (o.setStatus) o.setStatus("Could not save: " + e.message, true); }
  }
  async function load() {
    try {
      const d = o.io && o.io.loadData ? await o.io.loadData("colour-deck.json") : null;
      if (d && Array.isArray(d.tone) && Array.isArray(d.pal)) { custom = d; tonePick.__fill(); palPick.__fill(); }
    } catch (e) { /* no saved maps yet */ }
  }
  return { card: node, load };
}

module.exports = { createColourDeck, applyDeckPreview, addDeckLayer, recolourInks, mapColour, BLENDS, blendPx };
