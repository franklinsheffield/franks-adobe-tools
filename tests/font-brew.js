"use strict";
// Font Brew tests: charmap, tracer, path reader, font writer (validated by
// fontTools + OTS when Python has them), and the panel against a fake Photoshop.
const path = require("path");
const fs = require("fs");
const os = require("os");
const assert = require("assert");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "plugins/font-brew");
const J = (f) => require(path.join(DIR, "js", f));

// fontTools check: returns parsed JSON or null when Python/fontTools is missing
const PY = `
import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.areaPen import AreaPen
f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap()
areas = {}
for cp, g in cmap.items():
    p = AreaPen(gs); gs[g].draw(p); areas[chr(cp)] = round(p.value)
ots_ok = None
try:
    import ots
    ots_ok = ots.sanitize(sys.argv[1], sys.argv[1] + ".ots", capture_output=True).returncode == 0
except ImportError:
    pass
n = f["name"]
print(json.dumps({"tables": sorted(f.keys()), "chars": "".join(sorted(chr(c) for c in cmap)), "areas": areas,
  "family": n.getDebugName(1), "full": n.getDebugName(4), "ps": n.getDebugName(6), "upm": f["head"].unitsPerEm,
  "widths": {chr(c): f["hmtx"][g][0] for c, g in cmap.items()}, "ots": ots_ok}))
`;
function fontTools(file) {
  try { return JSON.parse(execFileSync("python3", ["-c", PY, file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })); } catch (e) {
    if (/No module named 'fontTools'|ENOENT/.test(String(e.stderr || e.message))) return null;
    throw new Error("fontTools could not read the font: " + (e.stderr || e.message));
  }
}

// Fake lettering document: one layer per character, laid out on one line.
function fakeLetters(host, chars, opts) {
  opts = opts || {};
  const F = J("fontbuild.js");
  const doc = host.doc;
  doc.resolution = 300;
  const layers = [];
  let id = 500;
  const images = {};
  chars.forEach((name, i) => {
    const ch = opts.imageFor ? opts.imageFor(name) : name;
    const img = F.demoImage(F.DEMO_CHARS.indexOf(ch) >= 0 ? ch : "H");
    const L = { id: id++, name, kind: "pixel", visible: true, bounds: { left: 40 + i * 90, top: 30, right: 40 + i * 90 + img.w, bottom: 30 + img.h } };
    images[L.id] = img;
    layers.push(L);
  });
  if (opts.shapeI) {   // a shape layer: a 60 x 90 px rectangle "I" with a vector mask in points
    const L = { id: id++, name: "I", kind: "solidColor", visible: true, bounds: { left: 1000, top: 36, right: 1060, bottom: 126 } };
    const w = 60, h = 90, data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) data[i * 4 + 3] = 255;
    images[L.id] = { w, h, c: 4, data };
    layers.push(L);
    const k = 72 / 300, P = (x, y) => ({ anchor: { horizontal: { _unit: "distanceUnit", _value: x * k }, vertical: { _unit: "distanceUnit", _value: y * k } } });
    host.vectorMasks = { [L.id]: { pathContents: { pathComponents: [{ shapeOperation: { _value: "add" }, subpathListKey: [{ closedSubpath: true, points: [P(1000, 36), P(1060, 36), P(1060, 126), P(1000, 126)] }] }] } } };
  }
  const group = { id: 499, name: "Letters", kind: "group", layers };
  doc.activeLayers = opts.flat ? layers : [group];
  doc.guides = [];
  host.photoshop.imaging.getPixels = async (o) => {
    host.calls.push(["getPixels", o.layerID]);
    const img = images[o.layerID];
    let w = img.w, h = img.h, out = img.data;
    if (o.targetSize) {
      const tw = o.targetSize.width, th = o.targetSize.height, sm = new Uint8Array(tw * th * 4);
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const s = (((y * h / th) | 0) * w + ((x * w / tw) | 0)) * 4, d = (y * tw + x) * 4; for (let c = 0; c < 4; c++) sm[d + c] = out[s + c]; }
      out = sm; w = tw; h = th;
    }
    return { imageData: { width: w, height: h, components: 4, async getData() { return out; }, dispose() {} } };
  };
  const bp = host.photoshop.action.batchPlay;
  host.photoshop.action.batchPlay = async (cmds, o) => {
    const c = cmds[0];
    if (c._obj === "get") {
      host.calls.push(["batchPlay", "get"]);
      const lid = (c._target.find((t) => t._ref === "layer") || {})._id;
      if (c._target[0]._property === "hasVectorMask") { host.calls.push(["hasVectorMask", lid]); return [{ hasVectorMask: !!(host.vectorMasks && host.vectorMasks[lid]) }]; }
      if (!(host.vectorMasks && host.vectorMasks[lid])) throw new Error("path asked for on a layer without a vector mask (Photoshop would quit)");
      return [host.vectorMasks && host.vectorMasks[lid] ? host.vectorMasks[lid] : {}];
    }
    return bp(cmds, o);
  };
  host.uxp.storage.formats = { binary: "binary" };
  host.saved = null;
  host.uxp.storage.localFileSystem.getFileForSaving = async (name) => ({ name, nativePath: "/tmp/" + name, async write(buf, o) { host.saved = { name, buf, o }; host.calls.push(["saveFont", name]); } });
  return layers;
}

module.exports = async function (t) {
  const { loadPanel } = require("./harness.js");

  await t("Font Brew charmap: layer names map to characters", () => {
    const { parseLayerName: p, glyphName } = J("charmap.js");
    assert.deepStrictEqual(p("A"), { kind: "char", ch: "A" });
    assert.deepStrictEqual(p("A copy 2"), { kind: "char", ch: "A" });
    assert.deepStrictEqual(p("uni00E9"), { kind: "char", ch: "é" });
    assert.deepStrictEqual(p("U+20AC"), { kind: "char", ch: "€" });
    assert.deepStrictEqual(p("period"), { kind: "char", ch: "." });
    assert.deepStrictEqual(p("Space"), { kind: "char", ch: " " });
    assert.deepStrictEqual(p("7"), { kind: "char", ch: "7" });
    assert.strictEqual(p("AV").kind, "lig");
    assert.deepStrictEqual(p("f_f"), { kind: "lig", seq: "ff" });
    assert.strictEqual(p("Layer 1").kind, "none");
    assert.strictEqual(glyphName("A"), "A"); assert.strictEqual(glyphName("&"), "ampersand"); assert.strictEqual(glyphName("é"), "uni00E9");
  });

  await t("Font Brew tracer: ring + square give 3 contours, holes wound the other way, fill matches pixels", () => {
    const T = J("trace.js"), G = J("geom.js");
    const w = 120, h = 100, data = new Uint8Array(w * h * 4), m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = Math.hypot(x + 0.5 - 50, y + 0.5 - 50); const ink = (d < 40 && d > 20) || (x >= 95 && x < 115 && y >= 10 && y < 30); if (ink) { data[(y * w + x) * 4 + 3] = 255; m[y * w + x] = 1; } }
    const r = T.traceImage({ w, h, c: 4, data }, { smooth: 1, corner: 60 });
    assert.strictEqual(r.contours.length, 3);
    const fixed = G.fixWinding(r.contours, true);
    const signs = fixed.map((c) => Math.sign(G.area(G.flatten(c)))).sort();
    assert.deepStrictEqual(signs, [-1, 1, 1], "one hole, two outers");
    assert.ok(G.iou(G.rasterize(fixed, w, h), m) > 0.97);
    assert.ok(r.contours[0].some((s) => s.t === "C"), "circle uses curves");
    const sq = r.contours.find((c) => c.every((s) => s.t !== "C"));
    assert.ok(sq && sq.length === 4, "square stays 4 straight lines");
  });

  await t("Font Brew path reader: picks points-vs-pixels and handle order by matching the layer pixels", () => {
    const { bestReading } = J("pathread.js");
    const k = 72 / 300, P = (x, y) => ({ anchor: { horizontal: { _value: x * k }, vertical: { _value: y * k } } });
    const desc = { pathContents: { pathComponents: [{ shapeOperation: { _value: "add" }, subpathListKey: [{ closedSubpath: true, points: [P(10, 10), P(70, 10), P(70, 100), P(10, 100)] }] }] } };
    const w = 60, h = 90, m = new Uint8Array(w * h).fill(1);
    const r = bestReading(desc, 300, { w, h, m }, { left: 10, top: 10 }, 1);
    assert.ok(r && !r.rejected && r.iou > 0.99 && Math.abs(r.unit - 300 / 72) < 1e-9, JSON.stringify(r && { iou: r.iou, unit: r.unit }));
    const xor = JSON.parse(JSON.stringify(desc)); xor.pathContents.pathComponents[0].shapeOperation._value = "xor";
    assert.strictEqual(bestReading(xor, 300, { w, h, m }, { left: 10, top: 10 }, 1), null, "xor shapes are traced instead");
  });

  await t("Font Brew writer: demo alphabet -> valid .otf (fontTools + OTS), right names, outer contours counter-clockwise", () => {
    const F = J("fontbuild.js"), T = J("trace.js");
    const S = require(path.join(DIR, "js/state.js"));
    const P = S.merge(S.DEFAULTS, {});
    const srcs = Array.from(F.DEMO_CHARS).map((ch, i) => ({ ch, contours: T.traceImage(F.demoImage(ch), P.outline).contours, origin: { left: i * 90, top: 20 }, scale: 1, adj: {} }));
    const L = F.computeLayout(srcs, P, null);
    assert.strictEqual(L.mode, "line");
    const H = L.glyphs.find((g) => g.ch === "H");
    assert.ok(Math.abs(H.box.y0) <= 6 && Math.abs(H.box.y1 - 700) <= 6, "H sits on the baseline at cap height 700: " + JSON.stringify(H.box));
    const f = F.buildFont(L, { family: "Brew Test", style: "Bold", designer: "Frank", version: "1.2" });
    assert.strictEqual(f.fileName, "BrewTest-Bold.otf");
    const G = J("geom.js"), O = L.glyphs.find((g) => g.ch === "O");
    assert.deepStrictEqual(O.contours.map((c) => Math.sign(G.area(G.flatten(c)))).sort(), [-1, 1], "O = outer + counter wound the other way");
    const file = path.join(os.tmpdir(), "fontbrew-test.otf");
    fs.writeFileSync(file, Buffer.from(f.buffer));
    const r = fontTools(file);
    if (!r) { console.log("     (fontTools not installed: font validation skipped)"); return; }
    assert.ok(r.tables.includes("CFF ") && r.tables.includes("cmap") && r.tables.includes("OS/2"), r.tables.join(","));
    assert.strictEqual(r.family, "Brew Test"); assert.strictEqual(r.full, "Brew Test Bold"); assert.strictEqual(r.upm, 1000);
    for (const c of F.DEMO_CHARS) assert.ok(r.chars.includes(c), "has " + c);
    for (const c of "HOAB8.") assert.ok(r.areas[c] > 0, c + " outer contours counter-clockwise, got " + r.areas[c]);
    assert.strictEqual(r.widths[" "], P.metrics.space);
    if (r.ots !== null) assert.strictEqual(r.ots, true, "OTS sanitiser accepts the font");
  });

  await t("Font Brew panel: Map reads a group of letter layers, shape paths kept, assign by click, Export writes a valid font", async () => {
    const chars = ["A", "B", "C", "O", "H", "E", "AV", "Logo 1"];
    const P = await loadPanel(DIR, { withDoc: true, extend: (host) => fakeLetters(host, chars, { shapeI: true, imageFor: (n) => (n === "AV" ? "A" : n === "Logo 1" ? "8" : n) }) });
    const d = P.document, api = P.mod._font;
    assert.deepStrictEqual([...d.querySelectorAll(".ctitle")].map((e) => e.textContent), ["Preview", "Library", "Map", "Metrics", "Outline", "Export"]);
    assert.ok(/Demo glyphs/.test(d.querySelector(".docline").textContent), "demo before mapping");
    const mapBtn = [...d.querySelectorAll(".ub")].find((b) => b.textContent === "Map selected layers");
    mapBtn.dispatchEvent(new P.window.Event("click"));
    await P.settle(900);
    const on = [...d.querySelectorAll(".cell.on")].map((c) => c.textContent).sort().join("");
    assert.strictEqual(on, "ABCEHIO", "mapped cells lit: " + on);
    assert.ok(P.host.calls.filter((c) => c[0] === "getPixels").length === 9, "each layer read once");
    assert.deepStrictEqual(api.project.unassigned.map((u) => u.name).sort(), ["AV", "Logo 1"]);
    const status = d.querySelector(".status").textContent;
    assert.ok(/1 from shape paths, 6 traced/.test(status), status);
    // assign "Logo 1" to &
    const tray = [...d.querySelectorAll("select")].find((s) => [...s.options].some((o) => o.textContent.startsWith("Logo 1")));
    const opt = [...tray.options].find((o) => o.textContent.startsWith("Logo 1"));
    tray.value = opt.value;
    const amp = [...d.querySelectorAll(".cell")].find((c) => c.textContent === "&");
    amp.dispatchEvent(new P.window.Event("click"));
    await P.settle(300);
    assert.ok(amp.parentNode && [...d.querySelectorAll(".cell.on")].some((c) => c.textContent === "&"), "& now mapped");
    // per-glyph spacing on the selected glyph
    const adj = [...d.querySelectorAll("input.num")][0];
    adj.value = "25"; adj.dispatchEvent(new P.window.Event("change"));
    assert.strictEqual(api.project.glyphs["&"].adj.lsb, 25);
    // export
    const fam = [...d.querySelectorAll("input[type=text]")].find((i) => i.value === "Brew Lettering");
    fam.value = "Frank Test"; fam.dispatchEvent(new P.window.Event("change"));
    d.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
    await P.settle(600);
    assert.ok(P.host.saved, "font saved: " + d.querySelector(".status").textContent);
    assert.strictEqual(P.host.saved.name, "FrankTest-Regular.otf");
    assert.strictEqual(P.host.saved.o.format, "binary");
    assert.ok(/Saved .*8 glyphs/.test(d.querySelector(".status").textContent), d.querySelector(".status").textContent);
    assert.ok(!P.host.calls.some((c) => /createPixelLayer|createLayerGroup|putPixels|suspendHistory/.test(c[0])), "document never changed");
    const file = path.join(os.tmpdir(), "fontbrew-panel.otf");
    fs.writeFileSync(file, Buffer.from(P.host.saved.buf));
    const r = fontTools(file);
    if (r) {
      assert.strictEqual(r.chars, " &ABCEHIO");
      assert.strictEqual(r.family, "Frank Test");
      assert.ok(r.areas.I > 0 && r.areas.O > 0);
      if (r.ots !== null) assert.strictEqual(r.ots, true);
    }
  });

  await t("Font Brew panel: 8 presets give 8 different previews", async () => {
    const P = await loadPanel(DIR, { withDoc: false });
    const d = P.document, img = d.querySelector("img.preview"), sel = d.querySelector(".card select");
    const seen = new Set();
    for (let i = 1; i < sel.options.length; i++) {
      sel.selectedIndex = i; sel.value = sel.options[i].value; sel.dispatchEvent(new P.window.Event("change"));
      await P.settle(500);
      seen.add(crypto.createHash("sha1").update(img.src).digest("hex"));
    }
    assert.strictEqual(seen.size, 8, "different previews: " + seen.size);
  });
};
