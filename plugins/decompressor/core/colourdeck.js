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

function lumBase(res, Engine, src, base) {
  return Engine.composite(res, { type: base || "black" }, src);
}
function deckRGBA(res, C, Engine, src, base) {
  return Colour.render({ w: res.w, h: res.h, c: 3, data: lumBase(res, Engine, src, base) }, C);
}
// preview: overlay the deck on the tool's own preview (or on the plain
// view background when Solo is on)
function applyDeckPreview(rgb, res, C, Engine, src, viewBg, base) {
  if (!Colour.active(C)) return rgb;
  const deck = deckRGBA(res, C, Engine, src, base);
  if (C.solo) {
    const w = res.w;
    for (let i = 0; i < res.w * res.h; i++) {
      const x = i % w, y = (i / w) | 0;
      const b = viewBg === "black" ? 0 : viewBg === "white" ? 255 : (((x >> 3) + (y >> 3)) & 1 ? 200 : 240);
      rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = b;
    }
  }
  return Colour.overPreview(rgb, deck, C.mix);
}
// apply: one extra layer on top; Solo keeps the tool's layers but hides them
function addDeckLayer(res, C, Engine, src, base) {
  if (!Colour.active(C)) return res;
  const layer = { name: "Colour Deck - " + Colour.label(C), rgba: deckRGBA(res, C, Engine, src, base), blend: "NORMAL", opacity: Math.round(C.mix == null ? 100 : C.mix) };
  const layers = (C.solo ? res.layers.map((L) => Object.assign({}, L, { hidden: true })) : res.layers).concat([layer]);
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
  bind(() => { if (C().mode !== "off") { const s = Colour.strip(C(), 256); stripImg.src = PNG.dataURL(s.rgb, s.w, s.h, 3); } });

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
    ui.row("Match", segGroup("deck.pal.match", [{ v: "nearest", l: "Nearest" }, { v: "dither", l: "Dither" }]))
  ]);
  showIf(palBox, () => C().mode === "palette");

  const common = el("div", { class: "cdbox" }, [
    el("div", { class: "row wrap dials" }, [sliderRow("Mix", "deck.mix", 0, 100, 1, "%"), sliderRow("Contrast", "deck.contrast", -100, 100, 1, "")]),
    checkRow("Colour Deck only (tool layers added hidden)", "deck.solo"),
    o.inkTool ? checkRow("Recolour the ink layers instead (keeps inks separate)", "deck.inks") : null
  ]);
  showIf(common, () => C().mode !== "off");

  const node = card("Colour Deck", [
    el("div", { class: "row" }, [segGroup("deck.mode", [{ v: "off", l: "Off" }, { v: "tone", l: "Tone Map" }, { v: "palette", l: "Palette" }], "big")]),
    toneBox, palBox, common,
    el("div", { class: "hint", text: "Adds a separate Colour Deck layer on top of the result. Hide it or lower its opacity any time." })
  ]);

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

module.exports = { createColourDeck, applyDeckPreview, addDeckLayer, recolourInks, mapColour };
