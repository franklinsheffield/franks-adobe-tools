"use strict";
// Builds premiere/console/js/ppro-map.js for the Premiere Lab Console.
// Premiere's UXP API reaches an effect's params by position (Component.getParam(i)), not by the
// AE param id the After Effects console uses. For every Lab effect this writes:
//   pos:   AE param id -> position in Effect Controls (ParamOrder in ae/core/param_order.h; 0 = input)
//   names: position -> display name (used at run time to find Premiere's offset and check the map)
//   kinds: AE param id -> num | popup | bool | color | angle | topic | end
//   lookVals: for each built-in look (1-based, same order as the Look menu) the full AE values
//             from the Photoshop preset (LabConvert.psToAE), so Premiere can set every control
//             even if it never sends PF_Cmd_USER_CHANGED_PARAM for the Look popup.
// Usage: node ae/tools/gen-ppro-map.js   (run after gen-console-map.js)
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..", "..");
const rd = (p) => fs.readFileSync(path.join(root, p), "utf8");
const LabConvert = require(path.join(root, "ae/console/js/convert.js"));

const sandbox = { window: {} }; vm.runInNewContext(rd("ae/console/js/brewmap.js"), sandbox);
const B = sandbox.window.BREW;

const MO = ["TOPIC", "ANIMATE", "SPEED", "LOOP", "SEED", "BOIL", "DRIFTX", "DRIFTY", "SPIN", "PULSE", "PULSER", "FLICK", "FLICKR", "JIT", "JITR", "REVEAL", "REVMODE", "REVANG", "END"];
const MO_NAMES = ["Motion", "Animate", "Speed (%)", "Loop (frames, 0 = endless)", "Seed", "Boil", null, null, null, "Pulse (%)", "Pulse rate (Hz)",
  "Flicker (%)", "Flicker rate (Hz)", "Jitter (px)", "Jitter rate (Hz)", "Reveal (%)", "Reveal mode", "Wipe angle", null];
const MO_KINDS = ["topic", "bool", "num", "num", "num", "popup", "num", "num", "num", "num", "num", "num", "num", "num", "num", "num", "popup", "angle", "end"];

function parseEnum(src) {
  const body = /enum\s*\{([\s\S]*?P_NUM)/.exec(src)[1].replace(/\/\/.*$/gm, "");
  const ids = {}; let n = 0;
  for (let tok of body.split(",")) {
    tok = tok.trim(); if (!tok) continue;
    const m = /^(\w+)\s*(?:=\s*(.+))?$/.exec(tok);
    if (m[2] !== undefined) n = /MO_COUNT/.test(m[2]) ? ids.P_MO_BASE + MO.length - 1 : Number(m[2]);
    ids[m[1]] = n++;
  }
  if (ids.P_MO_BASE !== undefined) MO.forEach((k, i) => { ids["P_MO_" + k] = ids.P_MO_BASE + i; });
  return ids;
}
// ParamOrder (ae/core/param_order.h) in JS
function positions(order, numParams) {
  const pos = new Array(numParams).fill(0), firsts = order.slice().sort((a, b) => a - b);
  let p = 1;
  for (const first of order) {
    const nx = firsts.find((f) => f > first), end = nx === undefined ? numParams : nx;
    for (let id = first; id < end; id++) pos[id] = p++;
  }
  return pos;
}
// evaluate "P_RC1 + s * 2" style id expressions for loop variable values
function idsOf(expr, ids, loopVals) {
  const e = expr.replace(/\b[A-Z]\w*\b/g, (w) => (w in ids ? ids[w] : w));
  if (/^[\d\s+*()-]+$/.test(e)) return [vm.runInNewContext(e)];
  return loopVals.map((v) => vm.runInNewContext(e.replace(/\b[a-z]\w*\b/g, String(v))));
}

const out = {};
for (const t of B.tools) {
  const pre = t.pre, src = rd(`ae/effects/${t.id}/ae/${pre}_ae.cpp`).replace(/\/\/.*$/gm, "");
  const ids = parseEnum(src);
  const orderTxt = /BLOCK_ORDER\[\]\s*=\s*\{([^}]*)\}/.exec(src)[1];
  const order = orderTxt.split(",").map((s) => s.trim()).filter(Boolean).map((n) => { if (!(n in ids)) throw new Error(t.id + ": block " + n); return ids[n]; });
  const pos = positions(order, ids.P_NUM);
  const kinds = {}, names = {};
  // literal-named params, plus loop-added ones (kinds only: their names are built at run time)
  const KIND = { BREW_FS: "num", FS: "num", PF_ADD_FLOAT_SLIDERX: "num", PF_ADD_POPUP: "popup", PF_ADD_CHECKBOXX: "bool", PF_ADD_COLOR: "color", PF_ADD_ANGLE: "angle", BREW_TOPIC: "topic", TOPIC: "topic", PF_ADD_TOPIC: "topic", BREW_ENDTOPIC: "end", ENDTOPIC: "end", PF_END_TOPIC: "end", POPUP: "popup", CHECK: "bool", COLOR: "color" };
  const re = /\b(BREW_FS|FS|PF_ADD_FLOAT_SLIDERX|PF_ADD_POPUP|PF_ADD_CHECKBOXX|PF_ADD_COLOR|PF_ADD_ANGLE|BREW_TOPIC|TOPIC|PF_ADD_TOPIC|BREW_ENDTOPIC|ENDTOPIC|PF_END_TOPIC|POPUP|CHECK|COLOR)\(([^;]*)\);/g;
  let m;
  while ((m = re.exec(src))) {
    const args = m[2], kind = KIND[m[1]];
    const parts = args.split(",");
    // TOPIC("Name", ID, collapsed) carries its id second; every other macro carries it last
    const last = (kind === "topic" && (m[1] === "TOPIC" || m[1] === "BREW_TOPIC") ? parts[1] : parts[parts.length - 1]).trim().replace(/\)+$/, "");
    const lit = /^\s*"([^"]*)"/.exec(args);
    // loop variable range: look back for "for (int s = 0; s < N; s++)"
    const before = src.slice(Math.max(0, m.index - 1500), m.index);
    const loop = /for\s*\(int\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\s*;/.exec(before.split("\n").slice(-8).join("\n"));
    let loopVals = [];
    if (loop) { const n = /^\d+$/.test(loop[2]) ? Number(loop[2]) : ids[loop[2]]; for (let i = 0; i < n; i++) loopVals.push(i); }
    let list; try { list = idsOf(last, ids, loopVals); } catch (e) { continue; }
    for (const id of list) {
      if (typeof id !== "number" || !(id >= 0 && id < ids.P_NUM)) continue;
      kinds[id] = kind;
      if (lit && list.length === 1) names[pos[id]] = lit[1];
    }
  }
  if (ids.P_MO_BASE !== undefined) MO.forEach((k, i) => { const id = ids.P_MO_BASE + i; kinds[id] = MO_KINDS[i]; if (MO_NAMES[i]) names[pos[id]] = MO_NAMES[i]; });
  // brewmap.js knows the kind of every look key; fill what the C++ parse missed (gradient stops, colour lists)
  for (const e of Object.values(t.keys)) {
    const put = (id, k) => { if (id != null && id < ids.P_NUM && !kinds[id]) kinds[id] = k; };
    if (e.kind === "num" || e.kind === "bool" || e.kind === "color" || e.kind === "popup") put(e.id, e.kind);
    else if (e.kind === "stops") { put(e.stops, "popup"); for (let s = 0; s < e.max; s++) { put(e.c + (e.stride || 2) * s, "color"); if (e.p != null) put(e.p + (e.stride || 2) * s, "num"); } }
    else if (e.kind === "list") { put(e.count, "popup"); for (let s = 0; s < e.max; s++) put(e.c + e.stride * s, "color"); }
    else if (e.kind === "optcolor") { put(e.on, "bool"); put(e.id, "color"); }
  }
  if (ids.P_LOOKB !== undefined && !kinds[ids.P_LOOKB]) kinds[ids.P_LOOKB] = "popup";
  const missing = Object.keys(t.params).filter((id) => !kinds[id]);
  if (missing.length) console.warn(`  ${t.id}: ${missing.length} params without a parsed kind (inferred from the value at run time)`);
  const st = require(path.join(root, `plugins/${t.id}/js/state.js`));
  const lookVals = st.PRESETS.map((p) => LabConvert.psToAE(t, p.p));
  out[t.id] = { match: t.match, look: ids.P_LOOK, lookB: ids.P_LOOKB, morph: ids.P_MORPH, count: ids.P_NUM, pos: Object.fromEntries(pos.map((p, id) => [id, p]).slice(1)), names, kinds, lookVals };
  console.log(`${t.id}: ${ids.P_NUM - 1} params, ${Object.keys(names).length} named, ${lookVals.length} looks`);
}
const dest = path.join(root, "premiere/console/js/ppro-map.js");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, "// Generated by ae/tools/gen-ppro-map.js - do not edit.\nwindow.LAB_PPRO = " + JSON.stringify(out) + ";\n");
console.log("wrote", path.relative(root, dest), Math.round(fs.statSync(dest).size / 1024) + " KB");
