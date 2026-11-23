"use strict";
// Frank's Worlds Brew 0.5 controls (host-free, used by the Viewport panel and the tests):
// where the pointer meets the world, drag-to-place and drag-to-move, camera-relative nudges,
// and fixed camera moves (orbit / pan / raise / zoom steps, named views, frame all, home, saved views).
const S = require("./scene.js");
const ED = require("./editor.js");
const { clamp } = require("./noise.js");

// step sizes for the Fine / Medium / Big switch
const STEP = { fine: { move: 0.1, spin: 5, size: 1.03, orbit: 3, zoom: 0.96 }, med: { move: 0.5, spin: 15, size: 1.1, orbit: 10, zoom: 0.9 }, big: { move: 2, spin: 45, size: 1.3, orbit: 30, zoom: 0.75 } };
const stepOf = (k) => STEP[k] || STEP.med;
const r3 = (v) => +v.toFixed(3);

// ground-plane axes of the camera: right and forward (towards what it looks at)
function camAxes(cam) { const y = cam.yaw * Math.PI / 180; return { rx: Math.cos(y), rz: -Math.sin(y), fx: -Math.sin(y), fz: -Math.cos(y) }; }

// terrain height at a world x, z (or null when outside its footprint)
function terrainY(o, x, z) {
  const ry = o.ry * Math.PI / 180, c = Math.cos(ry), sn = Math.sin(ry), px = x - o.x, pz = z - o.z;
  const u = (c * px - sn * pz) / o.s * 0.5 + 0.5, v = (sn * px + c * pz) / o.s * 0.5 + 0.5;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  return o.y + S.hmAt(S.heightmap(o), u, v) * o.h;
}
// the surface under x, z: the highest terrain there, else the ground / water level
function surfaceY(scene, x, z, skip) {
  let y = ED.groundY(scene);
  for (const o of scene.objs) if (o !== skip && o.type === "terrain") { const t = terrainY(o, x, z); if (t != null && t > y) y = t; }
  return y;
}
// how far an object's base sits below its centre (so it can rest on a surface)
function baseOffset(scene, o) {
  const g = ED.groundY(scene), c = Object.assign({}, o, { y: 0 });
  const save = scene.objs; scene.objs = [];   // drop onto the bare plane to measure
  ED.dropToGround(scene, c); scene.objs = save;
  return c.y - g;
}
// set an object down on whatever is under it
function rest(scene, o) {
  if (o.type === "terrain") return o;
  o.y = r3(surfaceY(scene, o.x, o.z, o) + baseOffset(scene, o)); return o;
}

// where a screen ray meets the world: the nearest terrain surface, else the ground plane (y = level)
function groundHit(scene, ray, skip, level) {
  let best = null, bd = Infinity;
  for (const o of scene.objs) if (o !== skip && o.type === "terrain") {
    const h = ED.terrainHit(o, ray); if (!h) continue;
    const d = Math.hypot(h.x - ray.ox, h.y - ray.oy, h.z - ray.oz); if (d < bd) { bd = d; best = { x: h.x, y: h.y, z: h.z, on: o }; }
  }
  const lv = level == null ? ED.groundY(scene) : level;
  if (Math.abs(ray.dy) > 1e-4) { const t = (lv - ray.oy) / ray.dy; if (t > 0 && t < 400 && t < bd) best = { x: ray.ox + ray.dx * t, y: lv, z: ray.oz + ray.dz * t, on: null }; }
  return best;
}
// a ray against a flat plane at height y (for dragging an object at its own height)
function planeHit(ray, y) {
  if (Math.abs(ray.dy) < 1e-4) return null;
  const t = (y - ray.oy) / ray.dy; if (t <= 0 || t > 400) return null;
  return { x: ray.ox + ray.dx * t, y, z: ray.oz + ray.dz * t };
}

// put an object at x, z; stick = rest it on the surface under that point
function placeAt(scene, o, x, z, stick) { o.x = r3(x); o.z = r3(z); if (stick) rest(scene, o); return o; }

// ---- the object pad: camera-relative moves, height, spin, size
function nudge(scene, o, dir, stepKey, stick) {
  const s = stepOf(stepKey).move * (o.type === "terrain" ? 2 : 1), a = camAxes(scene.cam);
  const m = { left: [-a.rx, -a.rz], right: [a.rx, a.rz], fwd: [a.fx, a.fz], back: [-a.fx, -a.fz] }[dir];
  if (m) { placeAt(scene, o, o.x + m[0] * s, o.z + m[1] * s, stick && o.type !== "terrain"); return o; }
  if (dir === "up") o.y = r3(o.y + s); else if (dir === "down") o.y = r3(o.y - s);
  return o;
}
function spin(o, sign, stepKey) { o.ry = Math.round((((o.ry || 0) + sign * stepOf(stepKey).spin) % 360 + 360) % 360); return o; }
function grow(scene, o, sign, stepKey, stick) {
  const f = sign > 0 ? stepOf(stepKey).size : 1 / stepOf(stepKey).size;
  o.s = +clamp(o.s * f, 0.05, 200).toFixed(3);
  if (stick && o.type !== "terrain") rest(scene, o);
  return o;
}
// next / previous object in the scene
function cycle(scene, cur, dir) {
  const list = scene.objs; if (!list.length) return null;
  const i = list.indexOf(cur); return list[((i < 0 ? (dir > 0 ? -1 : 0) : i) + dir + list.length) % list.length];
}

// ---- the camera pad
function camOrbit(cam, dYaw, dPitch) { cam.yaw = +((((cam.yaw + dYaw) % 360) + 360) % 360).toFixed(1); cam.pitch = +clamp(cam.pitch + dPitch, -10, 89).toFixed(1); return cam; }
// pan along the ground: right / forward in camera terms, plus straight up
function camPan(cam, right, fwd, up) {
  const a = camAxes(cam); cam.tx = r3(cam.tx + a.rx * right + a.fx * fwd); cam.tz = r3(cam.tz + a.rz * right + a.fz * fwd); cam.ty = r3(cam.ty + (up || 0)); return cam;
}
function camZoom(cam, f) { cam.dist = +clamp(cam.dist * f, 2, 160).toFixed(2); return cam; }
const VIEWS = [["front", "Front"], ["back", "Back"], ["left", "Left"], ["right", "Right"], ["top", "Top"], ["three", "3/4"], ["low", "Low"], ["eye", "Eye"]];
function camView(cam, v) {
  const P = { front: [0, 6], back: [180, 6], left: [270, 6], right: [90, 6], top: [cam.yaw, 89], three: [35, 25], low: [cam.yaw, -4], eye: [cam.yaw, 2] }[v];
  if (!P) return cam;
  cam.yaw = P[0]; cam.pitch = P[1];
  if (v === "eye") cam.ty = 1.2;
  return cam;
}
// fit the camera around every object (or just one)
function frame(scene, only) {
  const list = only ? [only] : scene.objs.filter((o) => o.type !== "light");
  const cam = scene.cam;
  if (!list.length) { cam.tx = 0; cam.ty = 1; cam.tz = 0; cam.dist = 14; return cam; }
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const o of list) {
    const r = o.type === "terrain" ? o.s * 1.05 : o.s * Math.max(1, o.sx || 1, o.sy || 1, o.sz || 1), top = o.type === "terrain" ? o.y + o.h : o.y + r, bot = o.type === "terrain" ? o.y : o.y - r;
    x0 = Math.min(x0, o.x - r); x1 = Math.max(x1, o.x + r); z0 = Math.min(z0, o.z - r); z1 = Math.max(z1, o.z + r); y0 = Math.min(y0, bot); y1 = Math.max(y1, top);
  }
  const rad = Math.max(0.6, Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2), tan = Math.tan(cam.fov * Math.PI / 360);
  cam.tx = r3((x0 + x1) / 2); cam.ty = r3((y0 + y1) / 2); cam.tz = r3((z0 + z1) / 2);
  cam.dist = +clamp(rad / tan * 1.15, 2, 160).toFixed(2);
  return cam;
}
const camCopy = (c) => ({ yaw: c.yaw, pitch: c.pitch, dist: c.dist, fov: c.fov, tx: c.tx, ty: c.ty, tz: c.tz });
function camSet(cam, from) { Object.assign(cam, camCopy(from)); return cam; }

module.exports = { STEP, camAxes, terrainY, surfaceY, rest, groundHit, planeHit, placeAt, nudge, spin, grow, cycle, camOrbit, camPan, camZoom, VIEWS, camView, frame, camCopy, camSet };
