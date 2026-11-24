"use strict";
// Frank's Worlds Brew: scene model. A scene is plain data (objects, sky, fog, camera) so it can be
// saved to the Library, shared as .json and stored with the rendered layer group for re-editing.
const { clamp, fbm } = require("./noise.js");
const MOD = require("./models.js");

const MATS = {
  Chrome: { col: [0.78, 0.8, 0.84], refl: 0.75, spec: 1.0 },
  Gold: { col: [1.0, 0.74, 0.32], refl: 0.55, spec: 1.0 },
  Glossy: { col: [0.85, 0.15, 0.2], refl: 0.18, spec: 0.8 },
  Matte: { col: [0.8, 0.78, 0.72], refl: 0.0, spec: 0.05 },
  Stone: { col: [0.55, 0.52, 0.48], refl: 0.0, spec: 0.1, tex: 1 },
  Neon: { col: [0.37, 1.0, 0.78], refl: 0.0, spec: 0.3, emit: 1 },
  Checker: { col: [0.95, 0.95, 0.95], refl: 0.1, spec: 0.4, tex: 2 },
};
const SKIES = {
  Noon: { zen: [0.16, 0.36, 0.78], hor: [0.72, 0.84, 0.96], sun: [1.15, 1.08, 0.95], amb: [0.35, 0.42, 0.55] },
  Dawn: { zen: [0.32, 0.42, 0.74], hor: [1.0, 0.74, 0.66], sun: [1.15, 0.85, 0.7], amb: [0.42, 0.36, 0.45] },
  Dusk: { zen: [0.1, 0.08, 0.28], hor: [1.0, 0.5, 0.3], sun: [1.2, 0.62, 0.36], amb: [0.34, 0.22, 0.32] },
  Alien: { zen: [0.02, 0.1, 0.13], hor: [0.22, 0.92, 0.72], sun: [0.95, 0.55, 1.1], amb: [0.18, 0.36, 0.38] },
  Night: { zen: [0.01, 0.012, 0.04], hor: [0.07, 0.09, 0.2], sun: [0.45, 0.5, 0.68], amb: [0.07, 0.08, 0.14] },
};
const HM_N = 96, hmCache = new Map();
// smooth edge mask (1 inside, 0 at the footprint's rim) shared by the generator and the sculpt brush
function edgeMask(p) { const N = HM_N, u = (p % N) / (N - 1) * 2 - 1, v = Math.floor(p / N) / (N - 1) * 2 - 1, rr = clamp((Math.hypot(u, v) - 0.5) / 0.45, 0, 1); return 1 - rr * rr * (3 - 2 * rr); }
// the brush can reach the whole square footprint except a thin border, so the edges stay sealed
function sculptMask(p) { const N = HM_N, u = Math.abs((p % N) / (N - 1) * 2 - 1), v = Math.abs(Math.floor(p / N) / (N - 1) * 2 - 1), t = clamp((Math.max(u, v) - 0.9) / 0.08, 0, 1); return 1 - t * t * (3 - 2 * t); }
function baseHeightmap(o) {
  const key = [o.seed, o.rough, o.erosion, o.terrace, o.plateau || 0, o.sharp || 1, o.crater ? 1 : 0].join("|");
  if (hmCache.has(key)) return hmCache.get(key);
  if (hmCache.size > 60) hmCache.clear();   // dials make a new shape per value; keep memory bounded
  const N = HM_N, a = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / (N - 1) * 2 - 1, v = j / (N - 1) * 2 - 1;
    let h = fbm(u * 2.2 + o.seed * 7.31, v * 2.2 + o.seed * 3.17, 6, o.rough);
    const r = Math.sqrt(u * u + v * v), t = clamp((r - 0.45) / 0.55, 0, 1), fall = 1 - t * t * (3 - 2 * t);
    a[j * N + i] = Math.pow(clamp(h, 0, 1), 1.35) * fall * 1.6 - 0.12;
  }
  for (let k = 0; k < o.erosion; k++) { const b = a.slice(); for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const p = j * N + i; a[p] = (b[p] * 4 + b[p - 1] + b[p + 1] + b[p - N] + b[p + N]) / 8; } }
  let mx = 0; for (let p = 0; p < N * N; p++) mx = Math.max(mx, a[p]);
  const sharp = o.sharp || 1, pl = clamp(o.plateau || 0, 0, 0.9);
  for (let p = 0; p < N * N; p++) {
    // edge mask after erosion, so the footprint's border and corners sink below ground/water (no flat square skirt)
    const em = edgeMask(p);
    let n = ((a[p] / (mx || 1)) - 0.12) / 0.88;                  // lowlands stay below 0 (under the ground), as before
    if (n > 0 && sharp !== 1) n = Math.pow(n, sharp);              // >1 = sharper peaks, <1 = rounder hills
    if (n > 0 && pl > 0) n = Math.min(n, 1 - pl) / (1 - pl);       // flat-topped mesas
    if (o.crater) { const u = (p % N) / (N - 1) * 2 - 1, v = Math.floor(p / N) / (N - 1) * 2 - 1, r = Math.hypot(u, v), rim = Math.exp(-Math.pow((r - 0.5) / 0.16, 2));
      n = rim * 0.95 + Math.max(n, 0) * 0.3 - (r < 0.42 ? 0.12 * (1 - r / 0.42) : 0); } // bowl with a raised rim
    let h = n * em - 0.08 * (1 - em); /* low fringe sinks below ground */
    if (o.terrace > 0 && h > 0) { const s = h * o.terrace, f = s - Math.floor(s); h = (Math.floor(s) + Math.pow(f, 4)) / o.terrace - 0.03; /* lowest step sits under the ground, not in it */ }
    a[p] = h; }
  let top = 0; for (let p = 0; p < N * N; p++) top = Math.max(top, a[p]); a.top = top; a.key = key;
  hmCache.set(key, a); return a;
}
// final heights = generated shape + the brush sculpt layer (o.sculpt, kept inside the footprint)
function heightmap(o) {
  const base = baseHeightmap(o);
  if (!o.sculpt) return base;
  const key = base.key;
  if (o._hm && o._hmKey === key + "|" + (o.sculptV || 0)) return o._hm;
  const N = HM_N, a = new Float32Array(N * N); let top = 0;
  for (let p = 0; p < N * N; p++) { a[p] = base[p] + o.sculpt[p] * sculptMask(p); if (a[p] > top) top = a[p]; }
  a.top = top; o._hm = a; o._hmKey = key + "|" + (o.sculptV || 0); return a;
}
function hmAt(a, u, v) {
  const N = HM_N; u = clamp(u, 0, 1) * (N - 1); v = clamp(v, 0, 1) * (N - 1);
  const i = Math.min(Math.floor(u), N - 2), j = Math.min(Math.floor(v), N - 2), fu = u - i, fv = v - j, p = j * N + i;
  return (a[p] * (1 - fu) + a[p + 1] * fu) * (1 - fv) + (a[p + N] * (1 - fu) + a[p + N + 1] * fu) * fv;
}
function camBasis(c, aspect) {
  const yw = c.yaw * Math.PI / 180, pt = c.pitch * Math.PI / 180;
  const ex = c.tx + Math.sin(yw) * Math.cos(pt) * c.dist, ey = c.ty + Math.sin(pt) * c.dist, ez = c.tz + Math.cos(yw) * Math.cos(pt) * c.dist;
  let fx = c.tx - ex, fy = c.ty - ey, fz = c.tz - ez; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz, rz = fx; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl; // right = f x up
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy; // up = r x f
  return { ex, ey, ez, fx, fy, fz, rx, ry: 0, rz, ux, uy, uz, tan: Math.tan(c.fov * Math.PI / 360), aspect };
}


let UID = 1;
function obj(type, x, y, z, s, mat, extra) {
  return Object.assign({ id: UID++, type, x, y, z, s, ry: 0, mat, hue: 0, refl: null, h: 3, rough: 0.5, erosion: 1, terrace: 0, seed: 3, plateau: 0, sharp: 1, crater: false, sculpt: null, sculptV: 0,
    col: "#FFE2B0", pow: 100, range: 6, glow: true, shadow: true,
    mesh: null, smooth: true, sx: 1, sy: 1, sz: 1, disp: 0, pat: "None", ts: 1, bump: 0, img: null }, extra || {});
}
function meshObj(m, x, z, s, mat, extra) { const o = obj("mesh", x, 0, z, s, mat, Object.assign({ mesh: m }, extra || {})); o.y = m.hy * s; return o; }
const SAMPLES = MOD.SAMPLES;

/* 12 built-in scenes (Frank's spec: 12 for the gate-2 contact sheet) */
const BASE = { sky: "Noon", sunAz: 200, sunAlt: 30, haze: 15, fog: 0, fogH: 1, clouds: 30, water: false, ground: false, waterLvl: 0 };
// lighting and water settings every scene gets (older saved scenes are filled in by withDefaults)
const DEFAULTS = { sunCol: "", sunPow: 100, ambPow: 100, waveH: 0, waveSize: 1, wind: 30, ripple: 1, waterCol: "#05171F", clarity: 0, waterRefl: 100, foam: 0 };
function withDefaults(s) { Object.keys(DEFAULTS).forEach((k) => { if (s[k] === undefined) s[k] = DEFAULTS[k]; }); return s; }
// a point light: an object of type "light" (position x / y / z, colour, brightness %, reach)
function light(x, y, z, col, pow, range, extra) { return obj("light", x, y, z, 0.25, "Matte", Object.assign({ col: col || "#FFE2B0", pow: pow == null ? 100 : pow, range: range || 6 }, extra || {})); }
const sc = (o) => Object.assign({}, BASE, o);
const PRESETS = {
  "Mint Lagoon": () => sc({ sky: "Alien", sunAz: 210, sunAlt: 22, haze: 10, fog: 8, fogH: 1.2, clouds: 40, water: true,
    cam: { yaw: 28, pitch: 9, dist: 22, fov: 45, tx: 0, ty: 1.4, tz: 0 },
    objs: [obj("terrain", -2, 0, -6, 9, "Stone", { h: 4.5, seed: 4, rough: 0.52 }), obj("sphere", 2.2, 1.6, 1.5, 1.4, "Chrome"), obj("torus", -1.6, 1.0, 3.2, 1.1, "Neon", { ry: 30 }), obj("cube", 5, 0.8, -1, 0.8, "Gold", { ry: 25 })] }),
  "Desert Mesa": () => sc({ sky: "Noon", sunAz: 140, sunAlt: 38, haze: 18, clouds: 20, ground: true,
    cam: { yaw: -20, pitch: 8, dist: 26, fov: 42, tx: 0, ty: 2, tz: -2 },
    objs: [obj("terrain", 0, 0, -8, 10, "Stone", { h: 4, seed: 11, rough: 0.45, terrace: 6, erosion: 2 }), obj("cone", 4, 1.6, 2, 1.6, "Matte"), obj("cylinder", -4, 1.2, 2.5, 1.2, "Glossy")] }),
  "Alien Dusk": () => sc({ sky: "Dusk", sunAz: 180, sunAlt: 7, haze: 40, fog: 45, fogH: 1.2, clouds: 55, water: true,
    cam: { yaw: 5, pitch: 6, dist: 24, fov: 50, tx: 0, ty: 2, tz: -4 },
    objs: [obj("terrain", -5, 0, -9, 8, "Stone", { h: 5.5, seed: 21, rough: 0.58 }), obj("terrain", 6, 0, -12, 7, "Stone", { h: 4, seed: 7 }), obj("sphere", 0, 6.5, -14, 2.4, "Gold"), obj("torus", 1, 0.3, 2, 1.6, "Chrome")] }),
  "Snow Peaks": () => sc({ sky: "Dawn", sunAz: 120, sunAlt: 20, haze: 25, fog: 15, fogH: 2, clouds: 45, water: true,
    cam: { yaw: 0, pitch: 12, dist: 30, fov: 40, tx: 0, ty: 3, tz: -6 },
    objs: [obj("terrain", 0, 0, -8, 13, "Stone", { h: 8, seed: 33, rough: 0.6, erosion: 1 })] }),
  "Chrome Garden": () => sc({ sky: "Dusk", sunAz: 215, sunAlt: 24, haze: 8, fog: 6, clouds: 0, ground: true,
    cam: { yaw: 35, pitch: 18, dist: 16, fov: 45, tx: 0, ty: 1, tz: 0 },
    objs: [obj("sphere", 0, 1.5, 0, 1.5, "Chrome"), meshObj(SAMPLES.pawn, -2.2, 3, 1.25, "Gold"), obj("cube", 3, 0.9, -1, 0.9, "Checker", { ry: 20 }), obj("torus", -3.6, 0.5, -0.5, 1.2, "Neon"),
      meshObj(SAMPLES.rock, 2.4, 3.2, 0.9, "Stone", { smooth: false, pat: "Marble" }), obj("cylinder", -1.5, 0.8, -3, 0.8, "Matte", { pat: "Wood" })] }),
  "Ocean Rock": () => sc({ sky: "Noon", sunAz: 250, sunAlt: 25, haze: 22, clouds: 60, water: true,
    cam: { yaw: -35, pitch: 4, dist: 20, fov: 50, tx: 0, ty: 1, tz: 0 },
    objs: [obj("terrain", 0, 0, -2, 5, "Stone", { h: 3.5, seed: 52, rough: 0.62 }), obj("sphere", 3.5, 0.2, 3, 0.7, "Stone")] }),
  "Canyon Run": () => sc({ sky: "Noon", sunAz: 95, sunAlt: 32, haze: 20, clouds: 35, ground: true,
    cam: { yaw: 0, pitch: 6, dist: 20, fov: 55, tx: 0, ty: 1.5, tz: -4 },
    objs: [obj("terrain", -7, 0, -8, 7, "Stone", { h: 6, seed: 61, rough: 0.5, terrace: 8, erosion: 1 }), obj("terrain", 7, 0, -9, 7, "Stone", { h: 5.5, seed: 64, rough: 0.5, terrace: 7, erosion: 1 }), obj("terrain", 0, 0, -22, 9, "Stone", { h: 7, seed: 67, terrace: 9 })] }),
  "Moon Base": () => sc({ sky: "Night", sunAz: 300, sunAlt: 38, haze: 4, clouds: 0, ground: true,
    cam: { yaw: 40, pitch: 14, dist: 18, fov: 45, tx: 0, ty: 1, tz: 0 },
    objs: [obj("sphere", 0, 0, 0, 2.4, "Matte"), obj("cylinder", 3.6, 1.2, 0.5, 0.9, "Chrome"), obj("cylinder", -3.4, 0.7, 1.4, 0.7, "Chrome"), obj("torus", 0, 0.5, 0, 3.6, "Chrome"), obj("cone", 2, 0.6, 4, 0.6, "Neon"),
      light(-2.5, 2.4, 3.2, "#FF4FD8", 200, 4), light(4.8, 1.4, 3, "#5EFFC8", 180, 3.5)] }),
  "Neon Grid": () => sc({ sky: "Alien", sunAz: 180, sunAlt: 10, haze: 12, fog: 10, fogH: 1, clouds: 25, ground: true,
    cam: { yaw: 0, pitch: 22, dist: 17, fov: 55, tx: 0, ty: 1.2, tz: 0 },
    objs: [obj("cube", 0, 1.6, 0, 1.6, "Chrome", { ry: 45 }), obj("torus", 0, 0.55, 0, 4.2, "Neon"), obj("sphere", -5, 1, -3, 1, "Matte", { pat: "Grid", hue: 300 }), obj("sphere", 5, 1, -3, 1, "Matte", { pat: "Grid", hue: 180 })] }),
  "Misty Fjord": () => sc({ sky: "Dawn", sunAz: 170, sunAlt: 9, haze: 30, fog: 70, fogH: 0.9, clouds: 50, water: true,
    cam: { yaw: 0, pitch: 5, dist: 22, fov: 48, tx: 0, ty: 1.5, tz: -6 },
    objs: [obj("terrain", -9, 0, -10, 9, "Stone", { h: 7, seed: 71, rough: 0.6 }), obj("terrain", 9, 0, -12, 9, "Stone", { h: 7.5, seed: 72, rough: 0.6 }), obj("terrain", 0, 0, -28, 12, "Stone", { h: 9, seed: 73 })] }),
  "Gold Coast": () => sc({ sky: "Dusk", sunAz: 190, sunAlt: 5, haze: 18, fog: 10, fogH: 1, clouds: 45, water: true,
    cam: { yaw: 10, pitch: 6, dist: 14, fov: 50, tx: 0, ty: 0.8, tz: 0 },
    objs: [meshObj(SAMPLES.rock, -2, 1, 1.6, "Stone", { smooth: false }), meshObj(SAMPLES.rock, 1.5, -1, 1.1, "Stone", { smooth: false, ry: 70 }), meshObj(SAMPLES.rock, 3.8, 2, 0.7, "Gold", { smooth: false, ry: 20 }), obj("sphere", -5, 0.8, -6, 0.8, "Chrome")] }),
  "Model Showcase": () => sc({ sky: "Noon", sunAz: 230, sunAlt: 35, haze: 6, clouds: 30, ground: true,
    cam: { yaw: 20, pitch: 16, dist: 13, fov: 45, tx: 0, ty: 1, tz: 0 },
    objs: [meshObj(SAMPLES.pawn, 0, 0, 1.6, "Chrome"), meshObj(SAMPLES.pawn, -2.6, 0.8, 1.1, "Glossy", { pat: "Marble", mat: "Matte" }), meshObj(SAMPLES.pawn, 2.6, 0.8, 1.1, "Gold", { pat: "Wood", mat: "Matte" }),
      meshObj(SAMPLES.rock, 1.5, 3.2, 0.7, "Stone", { smooth: false, disp: 0.15 })] }),
};
function loadPreset(name) { const f = PRESETS[name]; if (!f) throw new Error("No scene called " + name); const s = withDefaults(f()); s.name = name; return s; }

/* save / load: models travel inside the scene file; image textures are kept as small RGBA */
function toJSON(scene) {
  return JSON.stringify(Object.assign({}, scene, { objs: scene.objs.map((o) => { const c = Object.assign({}, o); delete c._mk; delete c._mv; delete c._hm; delete c._hmKey; delete c._undo;
    if (o.sculpt) c.sculpt = b64u8(new Uint8Array(o.sculpt.buffer, o.sculpt.byteOffset, o.sculpt.byteLength));
    if (o.mesh) c.mesh = MOD.meshToJSON(o.mesh);
    if (o.img) c.img = { w: o.img.w, h: o.img.h, name: o.img.name, d: b64u8(o.img.d) };
    if (o.layers) c.layers = o.layers.map((L) => Object.assign({}, L, { img: pic(L.img), mimg: pic(L.mimg) }));
    return c; }) }));
}
const pic = (p) => (p ? { w: p.w, h: p.h, name: p.name, d: b64u8(p.d) } : null);
const unpic = (p) => { if (!p) return null; const raw = typeof atob === "function" ? atob(p.d) : Buffer.from(p.d, "base64").toString("binary"), u = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) u[i] = raw.charCodeAt(i); return { w: p.w, h: p.h, name: p.name, d: u }; };
function b64u8(d) { let s = ""; for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000)); return typeof btoa === "function" ? btoa(s) : Buffer.from(s, "binary").toString("base64"); }
function fromJSON(text) {
  const s = JSON.parse(text);
  s.objs = s.objs.map((o) => { o.id = UID++; if (o.mesh) o.mesh = MOD.meshFromJSON(o.mesh);
    if (o.img) { const raw = typeof atob === "function" ? atob(o.img.d) : Buffer.from(o.img.d, "base64").toString("binary"), u = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) u[i] = raw.charCodeAt(i); o.img = { w: o.img.w, h: o.img.h, name: o.img.name, d: u }; }
    if (o.layers) o.layers = o.layers.map((L) => Object.assign({}, L, { img: unpic(L.img), mimg: unpic(L.mimg) }));
    if (typeof o.sculpt === "string") { const raw = typeof atob === "function" ? atob(o.sculpt) : Buffer.from(o.sculpt, "base64").toString("binary"), u = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) u[i] = raw.charCodeAt(i); o.sculpt = new Float32Array(u.buffer); }
    return o; });
  return withDefaults(s);
}

module.exports = { MATS, SKIES, heightmap, baseHeightmap, edgeMask, hmAt, light, DEFAULTS, withDefaults, camBasis, obj, meshObj, PRESETS, loadPreset, toJSON, fromJSON, HM_N };
