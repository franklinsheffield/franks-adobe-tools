"use strict";
// Frank's Worlds Brew: the Alien kit. Original low-poly models built in code (no files, no licence needed):
// crystals, spore trees, glow pods, spires, a habitat dome, an antenna, a rock arch and tentacle plants.
// Each part carries its own colour (per triangle), like an imported coloured model.
const { finishMesh } = require("./models.js");
const { hash2 } = require("./noise.js");

function Kit() { this.P = []; this.I = []; this.C = []; }
Kit.prototype.add = function (P, I, col, xf) {
  const base = this.P.length / 3;
  for (let i = 0; i < P.length; i += 3) { const p = xf ? xf(P[i], P[i + 1], P[i + 2]) : [P[i], P[i + 1], P[i + 2]]; this.P.push(p[0], p[1], p[2]); }
  for (let i = 0; i < I.length; i += 3) { this.I.push(I[i] + base, I[i + 1] + base, I[i + 2] + base); this.C.push(col[0], col[1], col[2]); }
  return this;
};
Kit.prototype.mesh = function (name) { return finishMesh(name, this.P, this.I, this.C); };

// rotate about X then Y, scale, move
function xf(o) {
  const ax = (o.rx || 0) * Math.PI / 180, ay = (o.ry || 0) * Math.PI / 180, az = (o.rz || 0) * Math.PI / 180, s = o.s || 1;
  return (x, y, z) => {
    x *= (o.sx || 1) * s; y *= (o.sy || 1) * s; z *= (o.sz || 1) * s;
    let y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax); y = y1; z = z1;
    let x1 = x * Math.cos(az) - y * Math.sin(az); y1 = x * Math.sin(az) + y * Math.cos(az); x = x1; y = y1;
    x1 = x * Math.cos(ay) + z * Math.sin(ay); z1 = -x * Math.sin(ay) + z * Math.cos(ay);
    return [x1 + (o.x || 0), y + (o.y || 0), z1 + (o.z || 0)];
  };
}
// surface of revolution around Y from [radius, height] pairs, capped at both ends
function lathe(profile, seg) {
  const P = [], I = [], n = profile.length;
  profile.forEach(([r, y]) => { for (let k = 0; k < seg; k++) { const a = k / seg * Math.PI * 2; P.push(Math.cos(a) * r, y, Math.sin(a) * r); } });
  for (let j = 0; j < n - 1; j++) for (let k = 0; k < seg; k++) { const a = j * seg + k, b = j * seg + (k + 1) % seg; I.push(a, b, a + seg, b, b + seg, a + seg); }
  const cap = (j, y, up) => { const c = P.length / 3; P.push(0, y, 0); for (let k = 0; k < seg; k++) { const a = j * seg + k, b = j * seg + (k + 1) % seg; if (up) I.push(c, b, a); else I.push(c, a, b); } };
  if (profile[0][0] > 0) cap(0, profile[0][1], false);
  if (profile[n - 1][0] > 0) cap(n - 1, profile[n - 1][1], true);
  return { P, I };
}
// tube swept along a path of [x, y, z, radius] points
function tube(path, seg) {
  const P = [], I = [];
  path.forEach((p, j) => {
    const q = path[Math.min(j + 1, path.length - 1)], o = path[Math.max(j - 1, 0)];
    let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let ux = 0, uy = 0, uz = 1; if (Math.abs(tz) > 0.9) { ux = 1; uz = 0; }
    let ax = ty * uz - tz * uy, ay = tz * ux - tx * uz, az = tx * uy - ty * ux; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
    const bx = ty * az - tz * ay, by = tz * ax - tx * az, bz = tx * ay - ty * ax;
    for (let k = 0; k < seg; k++) { const a = k / seg * Math.PI * 2, c = Math.cos(a) * p[3], s = Math.sin(a) * p[3]; P.push(p[0] + ax * c + bx * s, p[1] + ay * c + by * s, p[2] + az * c + bz * s); }
  });
  for (let j = 0; j < path.length - 1; j++) for (let k = 0; k < seg; k++) { const a = j * seg + k, b = j * seg + (k + 1) % seg; I.push(a, b, a + seg, b, b + seg, a + seg); }
  const last = path[path.length - 1], c = P.length / 3; P.push(last[0], last[1], last[2]);
  for (let k = 0; k < seg; k++) { const a = (path.length - 1) * seg + k, b = (path.length - 1) * seg + (k + 1) % seg; I.push(c, a, b); }
  return { P, I };
}
const C = { cyan: [70, 255, 230], magenta: [255, 70, 210], violet: [140, 80, 255], teal: [30, 170, 150], purple: [90, 40, 120], bone: [215, 205, 185],
  rust: [150, 70, 50], slate: [70, 80, 95], white: [235, 240, 245], orange: [255, 150, 40], lime: [170, 255, 60], deep: [30, 30, 60] };
const rnd = (a, b) => hash2(a * 7 + 3, b * 13 + 5);

function crystals() {
  const k = new Kit();
  for (let i = 0; i < 7; i++) {
    const h = 1.2 + rnd(i, 1) * 2.2, r = 0.18 + rnd(i, 2) * 0.16, col = i % 3 === 0 ? C.magenta : i % 3 === 1 ? C.cyan : C.violet;
    const g = lathe([[r * 0.7, 0], [r, h * 0.15], [r, h * 0.8], [0, h]], 6);
    k.add(g.P, g.I, col, xf({ x: (rnd(i, 3) - 0.5) * 1.2, z: (rnd(i, 4) - 0.5) * 1.2, rx: (rnd(i, 5) - 0.5) * 50, rz: (rnd(i, 6) - 0.5) * 50, ry: rnd(i, 7) * 60 }));
  }
  const b = lathe([[0.9, 0], [0.75, 0.2], [0.3, 0.3], [0, 0.32]], 9); k.add(b.P, b.I, C.slate);
  return k.mesh("Crystal cluster");
}
function sporeTree() {
  const k = new Kit(), path = [];
  for (let j = 0; j <= 10; j++) { const t = j / 10; path.push([Math.sin(t * 3.2) * 0.35, t * 3.2, Math.cos(t * 2.1) * 0.2 - 0.2, 0.22 - t * 0.1]); }
  const s = tube(path, 8); k.add(s.P, s.I, C.purple);
  const top = path[path.length - 1], cap = lathe([[0.15, 0], [1.3, 0.05], [1.45, 0.25], [1.1, 0.55], [0.6, 0.78], [0, 0.85]], 14);
  k.add(cap.P, cap.I, C.teal, xf({ x: top[0], y: top[1] - 0.1, z: top[2] }));
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, d = lathe([[0.1, 0], [0.12, 0.04], [0, 0.07]], 6); k.add(d.P, d.I, C.lime, xf({ x: top[0] + Math.cos(a) * 1.05, y: top[1] + 0.28, z: top[2] + Math.sin(a) * 1.05 })); }
  const gills = lathe([[0.15, 0], [1.2, 0.04], [0, 0.06]], 14); k.add(gills.P, gills.I, C.magenta, xf({ x: top[0], y: top[1] - 0.14, z: top[2] }));
  return k.mesh("Spore tree");
}
function glowPods() {
  const k = new Kit();
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + rnd(i, 1), h = 1 + rnd(i, 2) * 1.4, bend = 0.3 + rnd(i, 3) * 0.4, path = [];
    for (let j = 0; j <= 6; j++) { const t = j / 6; path.push([Math.cos(a) * bend * t * t, t * h, Math.sin(a) * bend * t * t, 0.07 - t * 0.03]); }
    const s = tube(path, 6); k.add(s.P, s.I, C.teal);
    const e = path[6], pod = lathe([[0, -0.05], [0.2, 0.05], [0.28, 0.25], [0.2, 0.48], [0, 0.56]], 10); k.add(pod.P, pod.I, i % 2 ? C.orange : C.cyan, xf({ x: e[0], y: e[1], z: e[2] }));
  }
  const b = lathe([[0.6, 0], [0.5, 0.12], [0, 0.18]], 8); k.add(b.P, b.I, C.purple);
  return k.mesh("Glow pods");
}
function spire() {
  const k = new Kit(), prof = [];
  for (let j = 0; j <= 14; j++) { const t = j / 14; prof.push([0.9 * (1 - t) ** 1.3 + 0.03 + (j % 3 === 0 ? 0.08 * (1 - t) : 0), t * 6]); }
  const g = lathe(prof, 7); k.add(g.P, g.I, C.bone, (x, y, z) => { const a = y * 0.35; return [x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)]; });
  for (let i = 0; i < 3; i++) { const r = lathe([[0.95 - i * 0.25, 0], [1.05 - i * 0.25, 0.05], [0.95 - i * 0.25, 0.1]], 16); k.add(r.P, r.I, C.cyan, xf({ y: 1.2 + i * 1.4 })); }
  return k.mesh("Bone spire");
}
function dome() {
  const k = new Kit(), prof = [];
  for (let j = 0; j <= 8; j++) { const a = j / 8 * Math.PI / 2; prof.push([Math.cos(a) * 2, Math.sin(a) * 1.6 + 0.3]); }
  const d = lathe(prof, 20); k.add(d.P, d.I, C.white);
  const base = lathe([[2.3, 0], [2.3, 0.3], [2.0, 0.32]], 20); k.add(base.P, base.I, C.slate);
  const band = lathe([[2.02, 0], [2.04, 0.1], [2.02, 0.2]], 20); k.add(band.P, band.I, C.cyan, xf({ y: 0.6 }));
  const door = tube([[0, 0, 2.0, 0.42], [0, 0, 2.45, 0.42]], 10); k.add(door.P, door.I, C.slate, xf({ y: 0.5, rx: 0 }));
  const win = lathe([[0.25, 0], [0.25, 0.02], [0, 0.03]], 10); k.add(win.P, win.I, C.orange, xf({ y: 0.55, z: 2.46, rx: 90 }));
  return k.mesh("Habitat dome");
}
function antenna() {
  const k = new Kit();
  const m = lathe([[0.18, 0], [0.12, 4], [0.05, 4.4]], 8); k.add(m.P, m.I, C.slate);
  const legs = [0, 120, 240]; legs.forEach((a) => { const t = tube([[0, 2.2, 0, 0.05], [Math.cos(a * Math.PI / 180) * 1.1, 0, Math.sin(a * Math.PI / 180) * 1.1, 0.07]], 6); k.add(t.P, t.I, C.rust); });
  const dish = lathe([[0, 0], [0.5, 0.06], [1.0, 0.3], [1.05, 0.38], [0.95, 0.34], [0.45, 0.12], [0, 0.08]], 16); k.add(dish.P, dish.I, C.white, xf({ y: 3.4, rx: -35 }));
  const tip = lathe([[0, 0], [0.15, 0.15], [0, 0.3]], 8); k.add(tip.P, tip.I, C.magenta, xf({ y: 4.4 }));
  return k.mesh("Antenna");
}
function arch() {
  const k = new Kit(), path = [];
  for (let j = 0; j <= 16; j++) { const a = j / 16 * Math.PI; path.push([Math.cos(a) * 2.4, Math.sin(a) * 3, 0, 0.55 + 0.25 * Math.abs(Math.cos(a)) + (rnd(j, 9) - 0.5) * 0.15]); }
  const t = tube(path, 7); k.add(t.P, t.I, C.rust);
  [-2.4, 2.4].forEach((x, i) => { const b = lathe([[0.9, 0], [0.8, 0.3], [0, 0.4]], 7); k.add(b.P, b.I, C.rust, xf({ x, ry: i * 20 })); });
  return k.mesh("Rock arch");
}
function tentacles() {
  const k = new Kit();
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2, h = 1.6 + rnd(i, 4) * 1.2, path = [];
    for (let j = 0; j <= 12; j++) { const t = j / 12, cw = Math.sin(t * 4 + i) * 0.35 * t; path.push([Math.cos(a) * (0.25 + t * 0.6) + Math.cos(a + 1.6) * cw, t * h, Math.sin(a) * (0.25 + t * 0.6) + Math.sin(a + 1.6) * cw, 0.16 * (1 - t) + 0.02]); }
    const s = tube(path, 7); k.add(s.P, s.I, i % 2 ? C.magenta : C.violet);
  }
  const b = lathe([[0.7, 0], [0.6, 0.15], [0, 0.25]], 10); k.add(b.P, b.I, C.deep);
  return k.mesh("Tentacle plant");
}


// ---- 0.6: eight more originals (Frank, 2026-11-23: double the starter assets)
function rocket() {
  const k = new Kit(), body = lathe([[0.55, 0], [0.62, 0.5], [0.62, 2.6], [0.5, 3.3], [0.25, 3.9], [0, 4.2]], 14); k.add(body.P, body.I, C.white);
  const band = lathe([[0.64, 0], [0.64, 0.25], [0.63, 0.3]], 14); k.add(band.P, band.I, C.magenta, xf({ y: 2.2 }));
  const nose = lathe([[0.26, 0], [0.12, 0.3], [0, 0.45]], 10); k.add(nose.P, nose.I, C.magenta, xf({ y: 3.85 }));
  [0, 120, 240].forEach((a) => { const r = a * Math.PI / 180, f = tube([[Math.cos(r) * 0.5, 1.2, Math.sin(r) * 0.5, 0.06], [Math.cos(r) * 1.1, 0.1, Math.sin(r) * 1.1, 0.1]], 5); k.add(f.P, f.I, C.slate); });
  const win = lathe([[0.2, 0], [0.2, 0.02], [0, 0.03]], 10); k.add(win.P, win.I, C.cyan, xf({ y: 2.9, z: 0.55, rx: 80 }));
  const flame = lathe([[0.45, 0], [0.3, -0.3], [0, -0.6]], 10); k.add(flame.P, flame.I, C.orange);
  return k.mesh("Rocket");
}
function pylon() {
  const k = new Kit(), shaft = lathe([[0.5, 0], [0.42, 0.4], [0.22, 3.6], [0.3, 3.8], [0.15, 4]], 6); k.add(shaft.P, shaft.I, C.slate);
  for (let i = 0; i < 4; i++) { const r = lathe([[0.48 - i * 0.07, 0], [0.56 - i * 0.07, 0.06], [0.48 - i * 0.07, 0.12]], 12); k.add(r.P, r.I, C.lime, xf({ y: 0.7 + i * 0.8 })); }
  const orb = lathe([[0, -0.4], [0.3, -0.3], [0.4, 0], [0.3, 0.3], [0, 0.4]], 12); k.add(orb.P, orb.I, C.cyan, xf({ y: 4.5 }));
  const base = lathe([[1, 0], [0.9, 0.25], [0, 0.3]], 6); k.add(base.P, base.I, C.deep);
  return k.mesh("Energy pylon");
}
function eggs() {
  const k = new Kit();
  for (let i = 0; i < 6; i++) { const s = 0.5 + rnd(i, 11) * 0.5, e = lathe([[0, 0], [0.45, 0.25], [0.5, 0.6], [0.38, 1.0], [0, 1.2]], 10);
    k.add(e.P, e.I, i % 2 ? C.lime : C.teal, xf({ s, x: (rnd(i, 12) - 0.5) * 1.8, z: (rnd(i, 13) - 0.5) * 1.8, rx: (rnd(i, 14) - 0.5) * 30, rz: (rnd(i, 15) - 0.5) * 30 })); }
  const goo = lathe([[1.3, 0], [1.1, 0.08], [0, 0.1]], 12); k.add(goo.P, goo.I, C.purple);
  return k.mesh("Egg cluster");
}
function jelly() {
  const k = new Kit(), bell = lathe([[0.2, 0], [1.1, 0.05], [1.2, 0.35], [1.0, 0.8], [0.6, 1.1], [0, 1.2]], 16); k.add(bell.P, bell.I, C.magenta, xf({ y: 2.6 }));
  const rim = lathe([[1.12, 0], [1.22, 0.04], [1.12, 0.08]], 16); k.add(rim.P, rim.I, C.cyan, xf({ y: 2.6 }));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, path = []; for (let j = 0; j <= 8; j++) { const t = j / 8; path.push([Math.cos(a) * (0.8 - t * 0.3) + Math.sin(t * 5 + i) * 0.12, 2.6 - t * 2.4, Math.sin(a) * (0.8 - t * 0.3), 0.06 * (1 - t) + 0.015]); }
    const s = tube(path, 5); k.add(s.P, s.I, i % 2 ? C.violet : C.cyan); }
  return k.mesh("Sky jelly");
}
function obelisk() {
  const k = new Kit(), g = lathe([[0.7, 0], [0.6, 0.4], [0.42, 4.2], [0, 5]], 4); k.add(g.P, g.I, C.deep, xf({ ry: 45 }));
  for (let i = 0; i < 5; i++) { const w = 0.6 - i * 0.04, r = lathe([[w, 0], [w + 0.03, 0.05], [w, 0.1]], 4); k.add(r.P, r.I, C.magenta, xf({ y: 0.8 + i * 0.7, ry: 45 })); }
  const base = lathe([[1.3, 0], [1.3, 0.25], [0, 0.3]], 4); k.add(base.P, base.I, C.slate, xf({ ry: 45 }));
  return k.mesh("Rune obelisk");
}
function coral() {
  const k = new Kit();
  const branch = (x, y, z, a, len, r, d) => { const ex = x + Math.cos(a) * len * 0.45, ey = y + len, ez = z + Math.sin(a) * len * 0.2;
    const t = tube([[x, y, z, r], [ex, ey, ez, r * 0.7]], 6); k.add(t.P, t.I, d % 2 ? C.orange : C.magenta);
    if (d < 3) { branch(ex, ey, ez, a - 0.6, len * 0.7, r * 0.7, d + 1); branch(ex, ey, ez, a + 0.6, len * 0.7, r * 0.7, d + 1); }
    else { const b = lathe([[0, -0.08], [0.1, 0], [0, 0.1]], 6); k.add(b.P, b.I, C.cyan, xf({ x: ex, y: ey, z: ez })); } };
  branch(0, 0, 0, Math.PI / 2, 1.2, 0.14, 0);
  const rock = lathe([[0.6, 0], [0.5, 0.2], [0, 0.28]], 8); k.add(rock.P, rock.I, C.slate);
  return k.mesh("Coral fan");
}
function fungus() {
  const k = new Kit();
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = 1.2 + (rnd(i, 21) - 0.5) * 0.3, h = 0.4 + rnd(i, 22) * 0.6, s = 0.7 + rnd(i, 23) * 0.5;
    const st = lathe([[0.08, 0], [0.06, h]], 6); k.add(st.P, st.I, C.bone, xf({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, s }));
    const cap = lathe([[0.05, 0], [0.35, 0.02], [0.3, 0.15], [0, 0.22]], 10); k.add(cap.P, cap.I, i % 3 ? C.violet : C.lime, xf({ x: Math.cos(a) * rr, y: h * s, z: Math.sin(a) * rr, s })); }
  const ring = lathe([[1.6, 0], [1.5, 0.04], [0.9, 0.05], [0.8, 0]], 18); k.add(ring.P, ring.I, C.purple);
  return k.mesh("Fungus ring");
}
function hoverpad() {
  const k = new Kit(), disc = lathe([[0, 0.6], [1.8, 0.62], [2, 0.8], [1.8, 0.95], [0, 0.97]], 16); k.add(disc.P, disc.I, C.slate);
  const rim = lathe([[2.01, 0], [2.03, 0.06], [2.01, 0.12]], 16); k.add(rim.P, rim.I, C.cyan, xf({ y: 0.72 }));
  [45, 135, 225, 315].forEach((a) => { const r = a * Math.PI / 180, l = tube([[Math.cos(r) * 1.2, 0.65, Math.sin(r) * 1.2, 0.08], [Math.cos(r) * 1.7, 0, Math.sin(r) * 1.7, 0.1]], 5); k.add(l.P, l.I, C.rust);
    const lamp = lathe([[0, -0.1], [0.14, 0], [0, 0.1]], 8); k.add(lamp.P, lamp.I, C.orange, xf({ x: Math.cos(r) * 1.5, y: 1.0, z: Math.sin(r) * 1.5 })); });
  const mark = lathe([[0.7, 0], [0.75, 0.01], [0.6, 0.02]], 16); k.add(mark.P, mark.I, C.magenta, xf({ y: 0.97 }));
  return k.mesh("Hover pad");
}

const BUILD = { crystals, sporeTree, glowPods, spire, dome, antenna, arch, tentacles, rocket, pylon, eggs, jelly, obelisk, coral, fungus, hoverpad };
let cache = null;
// [{ id, name, mesh, mat, size }] built once
function alienAssets() {
  if (cache) return cache;
  cache = [
    ["crystals", "Crystal cluster", "Glossy", 1.4], ["sporeTree", "Spore tree", "Matte", 2.2], ["glowPods", "Glow pods", "Matte", 1.2], ["spire", "Bone spire", "Matte", 3.2],
    ["dome", "Habitat dome", "Glossy", 2.4], ["antenna", "Antenna", "Matte", 2.4], ["arch", "Rock arch", "Matte", 3], ["tentacles", "Tentacle plant", "Matte", 1.5],
    ["rocket", "Rocket", "Glossy", 2.6], ["pylon", "Energy pylon", "Glossy", 2.4], ["eggs", "Egg cluster", "Glossy", 0.9], ["jelly", "Sky jelly", "Glossy", 1.6],
    ["obelisk", "Rune obelisk", "Glossy", 2.6], ["coral", "Coral fan", "Matte", 1.4], ["fungus", "Fungus ring", "Matte", 1.1], ["hoverpad", "Hover pad", "Glossy", 1.8]
  ].map(([id, name, mat, size]) => ({ id: "alien/" + id, name, mesh: BUILD[id](), mat, size, credit: "Original (Frank's Worlds Brew)" }));
  return cache;
}

module.exports = { alienAssets, lathe, tube, Kit, xf };
