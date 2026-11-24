"use strict";
// Builds ae/console/js/brewmap.js: for every AE Brew effect, its match name, look list,
// Photoshop defaults, and the map from Photoshop look keys ("glow.radius") to AE param ids.
// The Brew Console uses it to apply looks, import/export Photoshop look files and add motion.
// Usage: node ae/tools/gen-console-map.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "..");
const rd = (p) => fs.readFileSync(path.join(root, p), "utf8");

const TOOLS = [
  { id: "crt-phaser", pre: "crt", code: "CRT-06", glow: "#bc71fe", title: "Frank's CRT Phaser Brew", match: "com.franks.crtphaser.ae" },
  { id: "mobglow", pre: "mob", code: "MG-04", glow: "#ff2fd6", title: "Frank's Mobglow Brew", match: "com.franks.mobglow.ae" },
  { id: "depthtone", pre: "dt", code: "DT-03", glow: "#f5ff3b", title: "Frank's Depthtone Brew", match: "com.franks.depthtone.ae" },
  { id: "decompressor", pre: "dc", code: "DC-05", glow: "#39ff14", title: "Frank's Decompressor Brew", match: "com.franks.decompressor.ae" },
  { id: "chrometone", pre: "ct", code: "CT-02", glow: "#00e5ff", title: "Frank's Chrometone Brew", match: "com.franks.chrometone.ae" },
  { id: "dithers-brew", pre: "di", code: "DB-01", glow: "#ff9f1c", title: "Frank's Dithers Brew", match: "com.franks.dithers.ae" },
  { id: "paint-brew", pre: "pb", code: "PB-09", glow: "#6c96ff", title: "Frank's Paint Brew", match: "com.franks.paint.ae" }
];
// Tools shown in the rack as "coming soon" until their AE effects exist (none now).
const COMING = [];
// Keys that need a value conversion the generic reader can't see.
//   popup: PS value -> AE popup index (1-based)   stops: gradient [{p,c}] -> count popup + colour/position pairs
const DI = require(path.join(root, "plugins/dithers-brew/js/engine.js"));
const SPECIAL = {
  // list: colour array -> count popup (value = length - countOff) + colours every `stride` ids
  // optcolor: "" (none) or a colour -> checkbox `on` + colour; skip: Photoshop-only text / panel state
  "dithers-brew": Object.assign({
    "engine": { popup: "P_ENGINE", values: ["halftone", "dither", "ascii"] },
    "mode": { popup: "P_MODE", values: ["mono", "tonal", "grade", "rgb", "cmyk"] },
    "algo.halftone": { popup: "P_SCREEN", values: DI.SCREENS.map((x) => x.id) },
    "algo.dither": { popup: "P_DITHER", values: DI.DITHERS.map((x) => x.id) },
    "algo.ascii": { popup: "P_ASCII", values: DI.ASCII_SETS.map((x) => x.id) },
    "tune.direction": { popup: "P_DIR", values: ["h", "v", "d", "r"] },
    "mono.paper": { kind: "optcolor", on: "P_MONO_PAPER_ON", color: "P_MONO_PAPER" },
    "tonal.paper": { kind: "optcolor", on: "P_TN_PAPER_ON", color: "P_TN_PAPER" },
    "tonal.inks": { kind: "list", c: "P_TN1", stride: 2, count: "P_TN_COUNT", countOff: 0, min: 1, max: 5 },
    "grade.colors": { kind: "list", c: "P_PC1", stride: 1, count: "P_PAL_COUNT", countOff: 1, min: 2, max: 16 },
    "ascii.custom": { kind: "skip" }, "ascii.text": { kind: "skip" }, "fx.pre.invert": { num: "P_INVERT" }
  }, ...[0, 1, 2, 3, 4].map((k) => ({ [`tonal.angles.${k}`]: { num: `P_TA1+${k * 2}` } })),
     ...[0, 1, 2, 3].map((k) => ({ [`cmyk.on.${k}`]: { bool: `P_C_ON+${k * 2}` }, [`cmyk.angles.${k}`]: { num: `P_C_ANG+${k * 2}` } })),
     ...[0, 1, 2].map((k) => ({ [`rgb.on.${k}`]: { bool: `P_R_ON+${k * 3}` }, [`rgb.angles.${k}`]: { num: `P_R_ANG+${k * 3}` }, [`rgb.strength.${k}`]: { num: `P_R_STR+${k * 3}` } }))),
  "crt-phaser": {
    "mask.type": { popup: "P_MASK_TYPE", values: ["none", "grille", "shadow", "slot", "dots"] },
    "finish.tint": { popup: "P_TINT", values: ["none", "green", "amber", "white"] },
    "phase.mode": { popup: "P_PH_MODE", values: ["off", "waveform", "linear", "flux", "fluxdots"] },
    "phase.color": { popup: "P_PH_COLOR", map: { full: 2 }, other: 1 },
    "phase.base": { color: "P_PH_BASE" },
    "phase.ramp": { stops: "P_PH_STOPS", c: "P_RC1", p: "P_RP1", max: 7, min: 2 }
  },
  "mobglow": {},
  "paint-brew": {
    "style": { popup: "P_STYLE", values: ["oil", "watercolour", "impressionism", "ink", "spray", "pastel"] },
    "brush.tool": { popup: "P_TOOL", values: ["brush", "knife"] },
    "ink.metal": { popup: "P_I_METAL", values: ["gold", "silver", "copper"] },
    "spray.wall": { popup: "P_S_WALL", values: ["plain", "concrete", "stucco", "brick", "block", "metal", "wood"] },
    "spray.blend": { popup: "P_S_BLEND", values: ["normal", "multiply", "linearburn", "overlay", "softlight", "hardlight"] },
    "spray.brickPattern": { popup: "P_S_BOND", values: ["running", "stack", "flemish", "basket"] },
    "spray.woodDir": { popup: "P_S_WDIR", values: ["vertical", "horizontal"] },
    "spray.woodFinish": { popup: "P_S_WFIN", values: ["raw", "weathered", "painted"] },
    "pastel.hatch": { popup: "P_P_HATCH", values: ["follow", "fixed"] },
    "focus.falloff": { kind: "skip" }, "focus.outside": { kind: "skip" }
  },
  "depthtone": {
    "style": { popup: "P_STYLE", map: { contours: 1, terraces: 2, relief: 3 }, other: 2 },
    "look.stops": { stops: "P_STOPS", c: "P_SC1", p: "P_SP1", max: 5, min: 2 },
    "lines.colorBy": { popup: "P_COLORBY", map: { depth: 2 }, other: 1 }
  },
  "chrometone": Object.assign({
    "look.stops": { stops: "P_STOPS", c: "P_SC1", p: "P_SP1", max: 6, min: 2 },
    "surface.sky": { stops: null, c: "P_SKC1", p: "P_SKP1", max: 3, min: 3 },
    "surface.ground": { stops: null, c: "P_GRC1", p: "P_GRP1", max: 3, min: 3 },
    "extrude.stops": { stops: null, c: "P_EX_FRONT", p: null, stride: 1, max: 2, min: 2 },
    "bands.shape": { popup: "P_BSHAPE", values: ["sine", "triangle", "hard"] },
    "surface.from": { popup: "P_FROM", values: ["brightness", "auto", "outline"] },
    "surface.profile": { popup: "P_PROFILE", values: ["chamfer", "round", "rim"] },
    "surface.reflect": { popup: "P_REFLECT", values: ["gradient", "horizon"] }
  }, ...[0, 1, 2, 3].map((g) => ({
    [`glow.modules.${g}.on`]: { bool: `P_G1_ON+${g}` }, [`glow.modules.${g}.type`]: { popup: `P_G1_TYPE+${g}`, values: ["dreamy", "halo", "neon", "bloom", "inner"] },
    [`glow.modules.${g}.color`]: { color: `P_G1_COL+${g}` }, [`glow.modules.${g}.size`]: { num: `P_G1_SIZE+${g}` }, [`glow.modules.${g}.strength`]: { num: `P_G1_STR+${g}` }
  }))),
  "decompressor": {
    "jpeg.chroma": { popup: "P_CHROMA", map: { "444": 1, "420": 2, "411": 3 }, other: 1 },
    "mosh.block": { popup: "P_MOSH_BLOCK", map: { "8": 1 }, other: 2 }
  }
};
const MO = ["TOPIC", "ANIMATE", "SPEED", "LOOP", "SEED", "BOIL", "DRIFTX", "DRIFTY", "SPIN", "PULSE", "PULSER", "FLICK", "FLICKR", "JIT", "JITR", "REVEAL", "REVMODE", "REVANG", "END"];

function parseEnum(src) {
  const body = /enum\s*\{([\s\S]*?P_NUM)/.exec(src)[1].replace(/\/\/.*$/gm, "");
  const ids = {}; let n = 0;
  for (let tok of body.split(",")) {
    tok = tok.trim(); if (!tok) continue;
    const m = /^(\w+)\s*(?:=\s*(.+))?$/.exec(tok);
    if (m[2] !== undefined) {
      n = /MO_COUNT/.test(m[2]) ? ids.P_MO_BASE + MO.length - 1 : Number(m[2]);
    }
    ids[m[1]] = n++;
  }
  if (ids.P_MO_BASE !== undefined) MO.forEach((k, i) => { ids["P_MO_" + k] = ids.P_MO_BASE + i; });
  else { ids.P_MO_TOPIC = ids.T_MO_START; ids.P_MO_END = ids.T_MO_END; }
  return ids;
}

const out = { tools: [], coming: COMING };
for (const t of TOOLS) {
  const dir = `ae/effects/${t.id}`;
  const ae = rd(`${dir}/ae/${t.pre}_ae.cpp`), io = rd(`${dir}/${t.pre}_params_io.h`);
  const ids = parseEnum(ae);
  // param display names
  const names = {};
  const defRe = /(?:BREW_FS|FS|PF_ADD_POPUP|PF_ADD_CHECKBOXX|PF_ADD_COLOR|PF_ADD_ANGLE|BREW_TOPIC|TOPIC)\("([^"]+)"[^;]*?,\s*(P_\w+|T_\w+)\);/g;
  let m; while ((m = defRe.exec(ae))) names[m[2]] = m[1];
  // P.field -> AE id + kind
  const field = {};
  const readRe = /P\.(\w+)\s*=\s*(?:std::\w+\()?(fv|bv|cv|av)\(p,\s*(P_\w+)\)/g;
  while ((m = readRe.exec(ae))) field[m[1]] = { id: m[3], kind: { fv: "num", bv: "bool", cv: "color", av: "num" }[m[2]] };
  // PS key -> P.field
  const keyField = {};
  const numRe = /\{"([\w.]+)",\s*&P\.(\w+)\}/g;
  while ((m = numRe.exec(io))) keyField[m[1]] = m[2];
  const kRe = /k == "([\w.]+)"\)\s*\{\s*P\.(\w+)\s*=/g;
  while ((m = kRe.exec(io))) keyField[m[1]] = m[2];
  const keys = {}, skipped = [];
  for (const [k, f] of Object.entries(keyField)) {
    if (/^m\.|^scale$|^full[WH]$/.test(k)) continue;
    if (SPECIAL[t.id][k]) continue;
    const sp = SPECIAL[t.id][k];
    if (sp) continue;
    if (field[f]) keys[k] = { id: ids[field[f].id], kind: field[f].kind };
    else skipped.push(k);
  }
  for (const [k, sp] of Object.entries(SPECIAL[t.id])) {
    const e = Object.assign({}, sp);
    const res = (nm) => { const m = /^(\w+)\+(\d+)$/.exec(nm); const v = m ? ids[m[1]] + Number(m[2]) * (t.id === "chrometone" ? ids.T_G2_START - ids.T_G1_START : 1) : ids[nm]; if (v === undefined) throw new Error(t.id + " no " + nm); return v; };
    for (const f of ["popup", "color", "stops", "c", "p", "bool", "num", "on", "count"]) if (typeof e[f] === "string") e[f] = res(e[f]);
    e.kind = sp.kind ? sp.kind : "stops" in sp ? "stops" : sp.color ? "color" : sp.bool ? "bool" : sp.num ? "num" : "popup";
    for (const f of ["color", "popup", "bool", "num"]) if (e[f] !== undefined) { e.id = e[f]; delete e[f]; }
    keys[k] = e;
  }
  if (skipped.length) throw new Error(t.id + ": unmapped Photoshop keys " + skipped.join(", "));
  const motion = {}; MO.forEach((k) => { motion[k.toLowerCase()] = ids["P_MO_" + k]; });
  // every real AE param (for saved AE looks): id -> name; topics left out
  const params = {};
  for (const [nm, id] of Object.entries(ids)) if (/^P_/.test(nm) && nm !== "P_INPUT" && nm !== "P_NUM" && nm !== "P_MO_BASE" && nm !== "P_MO_LAST" && !/^P_MO_(TOPIC|END)$/.test(nm)) params[id] = names[nm] || nm;
  const st = require(path.join(root, `plugins/${t.id}/js/state.js`));
  const defaults = JSON.parse(JSON.stringify(st.DEFAULTS)); delete defaults.view; delete defaults.out;
  out.tools.push(Object.assign({}, t, {
    look: ids.P_LOOK, lookB: ids.P_LOOKB, morph: ids.P_MORPH, motion, keys, params, defaults,
    looks: st.PRESETS.map((p, i) => ({ i: i + 1, cat: p.cat, name: p.name }))
  }));
  console.log(`${t.id}: ${Object.keys(keys).length} look keys, ${Object.keys(params).length} params, ${st.PRESETS.length} looks`);
}
const dest = path.join(root, "ae/console/js/brewmap.js");
fs.writeFileSync(dest, "// Generated by ae/tools/gen-console-map.js - do not edit.\nwindow.BREW = " + JSON.stringify(out, null, 1) + ";\n");
console.log("wrote", path.relative(root, dest));
