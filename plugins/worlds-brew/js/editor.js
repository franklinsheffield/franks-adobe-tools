"use strict";
// Frank's Worlds Brew scene editing (host-free, used by both panels and the tests):
// add / duplicate / delete objects, drop to ground, camera views, orbit / pan / zoom, Create-strip icon scenes.
const S = require("./scene.js");
const M = require("./models.js");
const { clamp, vnoise } = require("./noise.js");

const CREATE = [["terrain", "Terrain"], ["sphere", "Sphere"], ["cube", "Cube"], ["cylinder", "Cylinder"], ["cone", "Cone"], ["torus", "Torus"],
  ["water", "Water"], ["ground", "Ground"], ["light", "Light"], ["pawn", "Pawn"], ["rock", "Rock"]];
const MAT_FOR = { terrain: "Stone", sphere: "Chrome", cube: "Gold", cylinder: "Glossy", cone: "Matte", torus: "Neon" };

// a small deterministic offset per new object so new objects don't stack exactly
function spot(scene, k) { const n = scene.objs.length + (k || 0), a = n * 2.399963; return [Math.cos(a) * (1.2 + n * 0.35), Math.sin(a) * (1.2 + n * 0.35)]; }
const groundY = (scene) => (scene.water ? scene.waterLvl || 0 : 0);

function dropToGround(scene, o) {
  if (o.type === "light") { o.y = +(groundY(scene) + 1.5).toFixed(3); return o; }
  if (o.type === "mesh") { const v = M.meshVerts(o).v; let mn = 1e9; for (let i = 1; i < v.length; i += 3) mn = Math.min(mn, v[i]); o.y = +(groundY(scene) - mn * o.s * o.sy).toFixed(3); }
  else if (o.type === "terrain") o.y = 0;
  else o.y = +(groundY(scene) + (o.type === "torus" ? o.s * 0.28 : o.s) * (o.sy || 1)).toFixed(3);
  return o;
}

function addMesh(scene, m, mat, extra) {
  const c = scene.cam, [dx, dz] = spot(scene), o = S.obj("mesh", +(c.tx + dx).toFixed(1), 0, +(c.tz + dz).toFixed(1), 1.2, mat, Object.assign({ mesh: m, vc: !!m.tc }, extra || {}));
  dropToGround(scene, o); scene.objs.push(o); return o;
}

// returns the new object, or null for the Water / Ground switches
function addObject(scene, type) {
  if (type === "pawn") return addMesh(scene, M.SAMPLES.pawn, "Chrome");
  if (type === "rock") return addMesh(scene, M.SAMPLES.rock, "Stone", { smooth: false });
  if (type === "water") { scene.water = !scene.water; return null; }
  if (type === "ground") { scene.ground = !scene.ground; return null; }
  if (type === "light") { const c = scene.cam, [dx, dz] = spot(scene), o = S.light(+(c.tx + dx).toFixed(1), +(groundY(scene) + 1.8).toFixed(1), +(c.tz + dz).toFixed(1), "#FFE2B0", 120, 5); scene.objs.push(o); return o; }
  const c = scene.cam, [dx, dz] = spot(scene), x = +(c.tx + dx).toFixed(1), z = +(c.tz + dz).toFixed(1);
  const o = type === "terrain" ? S.obj("terrain", x, 0, z - 4, 6, MAT_FOR.terrain, { h: 3, seed: (scene.objs.length * 17 + 5) % 90 }) : S.obj(type, x, 1, z, 1, MAT_FOR[type] || "Matte");
  if (type !== "terrain") dropToGround(scene, o);
  scene.objs.push(o); return o;
}

function duplicate(scene, o) {
  if (!o) return null;
  const n = S.obj(o.type, o.x + o.s * 2.2, o.y, o.z, o.s, o.mat, {});
  Object.keys(o).forEach((k) => { if (k !== "id" && k !== "x" && k[0] !== "_") n[k] = o[k]; });
  scene.objs.push(n); return n;
}
function remove(scene, o) { scene.objs = scene.objs.filter((x) => x !== o); return scene.objs[scene.objs.length - 1] || null; }

function view(scene, v, sel) {
  const c = scene.cam;
  if (v === "top") c.pitch = 89;
  else if (v === "front") { c.pitch = 3; c.yaw = 0; }
  else if (v === "persp") { c.pitch = 18; c.yaw = 30; }
  else if (v === "eye") { c.pitch = 2; c.ty = 1.2; }
  else if (v === "frame" && sel) { c.tx = sel.x; c.ty = sel.y + (sel.type === "terrain" ? sel.h * 0.4 : 0); c.tz = sel.z; c.dist = Math.max(sel.s * 5, 4); }
}
function orbit(cam, start, dx, dy) { cam.yaw = +(start.yaw - dx * 0.4).toFixed(1); cam.pitch = +clamp(start.pitch + dy * 0.3, -10, 89).toFixed(1); }
function pan(cam, start, dx, dy, aspect) {
  const B = S.camBasis(start, aspect || 16 / 9), k = start.dist / 400;
  cam.tx = +(start.tx - dx * k * B.rx + dy * k * B.ux).toFixed(3); cam.ty = +(start.ty + dy * k * B.uy).toFixed(3); cam.tz = +(start.tz - dx * k * B.rz + dy * k * B.uz).toFixed(3);
}
function zoom(cam, dir) { cam.dist = +clamp(cam.dist * (dir > 0 ? 1.08 : 0.93), 3, 120).toFixed(2); }

// a one-object scene + camera for a Create-strip icon
function iconScene(type) {
  const base = { sky: "Dusk", sunAz: 200, sunAlt: 35, haze: 0, fog: 0, fogH: 1, clouds: 0, water: false, ground: false, waterLvl: 0, objs: [] };
  if (type === "pawn" || type === "rock") { base.objs.push(S.obj("mesh", 0, 0, 0, 1, type === "pawn" ? "Chrome" : "Stone", { mesh: M.SAMPLES[type], smooth: type === "pawn", ry: 20 })); return [base, { yaw: 25, pitch: 15, dist: 3.9, fov: 45, tx: 0, ty: 0, tz: 0 }]; }
  if (type === "water") { base.water = true; base.sky = "Noon"; base.sunAlt = 12; base.sunAz = 0; base.objs.push(S.obj("sphere", 0, 1.2, -6, 0.9, "Gold")); return [base, { yaw: 0, pitch: 12, dist: 7, fov: 50, tx: 0, ty: 0.3, tz: 0 }]; }
  if (type === "light") { base.sky = "Night"; base.sunPow = 15; base.ground = true; base.objs.push(S.obj("sphere", 0.45, 0.55, 0.2, 0.55, "Matte"), S.light(-0.5, 1.1, 0.9, "#FFB050", 260, 1.6, { s: 0.16 })); return [base, { yaw: 25, pitch: 18, dist: 4.2, fov: 45, tx: 0, ty: 0.5, tz: 0 }]; }
  if (type === "ground") { base.ground = true; base.sky = "Dawn"; base.objs.push(S.obj("cube", 0, 0.5, 0, 0.5, "Checker", { ry: 30 })); return [base, { yaw: 30, pitch: 22, dist: 6, fov: 45, tx: 0, ty: 0.3, tz: 0 }]; }
  base.objs.push(S.obj(type, 0, type === "terrain" ? -0.5 : 0, 0, type === "terrain" ? 2 : 1, MAT_FOR[type], type === "terrain" ? { h: 1.6, seed: 4 } : { ry: 25 }));
  return [base, { yaw: 25, pitch: type === "terrain" ? 30 : 20, dist: type === "terrain" ? 5.6 : 3.7, fov: 45, tx: 0, ty: 0, tz: 0 }];
}

// ---- surface shaping: brush sculpting on a terrain's height grid (o.sculpt, in units of the terrain's peak height)
const BRUSHES = [["raise", "Raise"], ["lower", "Lower"], ["smooth", "Smooth"], ["flatten", "Flatten"], ["roughen", "Roughen"], ["restore", "Restore"]];
// screen point (wireframe pixels) -> world ray
function screenRay(cam, W, H, mx, my) {
  const B = S.camBasis(cam, W / H), u = (mx / W * 2 - 1) * B.tan * B.aspect, v = (1 - my / H * 2) * B.tan;
  let dx = B.fx + u * B.rx + v * B.ux, dy = B.fy + v * B.uy, dz = B.fz + u * B.rz + v * B.uz; const l = Math.hypot(dx, dy, dz);
  return { ox: B.ex, oy: B.ey, oz: B.ez, dx: dx / l, dy: dy / l, dz: dz / l };
}
// where a ray meets a terrain's surface: { u, v, x, y, z } (u, v = 0..1 across the footprint) or null
function terrainHit(o, ray) {
  const hm = S.heightmap(o), ry = o.ry * Math.PI / 180, c = Math.cos(ry), sn = Math.sin(ry);
  const at = (t) => { const px = ray.ox + ray.dx * t - o.x, py = ray.oy + ray.dy * t - o.y, pz = ray.oz + ray.dz * t - o.z, lx = c * px - sn * pz, lz = sn * px + c * pz, u = lx / o.s * 0.5 + 0.5, v = lz / o.s * 0.5 + 0.5;
    const inside = u >= 0 && u <= 1 && v >= 0 && v <= 1; return { u, v, below: inside && py < S.hmAt(hm, u, v) * o.h, inside }; };
  const step = Math.max(0.02, o.s / 120); let prev = 0;
  for (let t = step; t < 300; t += step) { const a = at(t); if (a.below) { let lo = prev, hi = t; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (at(m).below) hi = m; else lo = m; } const b = at(hi);
      return { u: b.u, v: b.v, x: ray.ox + ray.dx * hi, y: ray.oy + ray.dy * hi, z: ray.oz + ray.dz * hi }; } prev = t; }
  return null;
}
// one brush dab at (u, v). size = brush radius as a fraction of the footprint width, power 0..1.
// flatten uses ref (the height under the brush when the stroke started)
function sculpt(o, tool, u, v, size, power, ref) {
  const N = S.HM_N; if (!o.sculpt) o.sculpt = new Float32Array(N * N);
  const base = S.baseHeightmap(o), cur = S.heightmap(o), out = o.sculpt, r = Math.max(1.5, size * (N - 1)), ci = u * (N - 1), cj = v * (N - 1), k = clamp(power, 0, 1);
  const i0 = Math.max(0, Math.floor(ci - r)), i1 = Math.min(N - 1, Math.ceil(ci + r)), j0 = Math.max(0, Math.floor(cj - r)), j1 = Math.min(N - 1, Math.ceil(cj + r)), next = out.slice();
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const d = Math.hypot(i - ci, j - cj) / r; if (d >= 1) continue;
    const w = (1 - d * d) * (1 - d * d), p = j * N + i, h = cur[p];
    if (tool === "raise") next[p] += 0.09 * k * w;
    else if (tool === "lower") next[p] -= 0.09 * k * w;
    else if (tool === "smooth") { let sum = 0, n = 0; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue; sum += cur[jj * N + ii]; n++; } next[p] += (sum / n - h) * 0.6 * k * w; }
    else if (tool === "flatten") next[p] += ((ref == null ? h : ref) - h) * 0.35 * k * w;
    else if (tool === "roughen") next[p] += (vnoise(i * 0.55 + o.seed * 3, j * 0.55) - 0.5) * 0.08 * k * w;
    else if (tool === "restore") next[p] *= 1 - 0.35 * k * w;
    next[p] = clamp(next[p], -1.2 - base[p], 1.6 - base[p]);
  }
  o.sculpt = next; o.sculptV = (o.sculptV || 0) + 1; return o;
}
function heightAt(o, u, v) { return S.hmAt(S.heightmap(o), u, v); }
function clearSculpt(o) { o.sculpt = null; o.sculptV = (o.sculptV || 0) + 1; o._hm = null; return o; }

// what an object is called in the panels
function label(o) { if (!o) return "NOTHING SELECTED"; return (o.type === "light" ? "LIGHT" : o.type === "mesh" ? "MODEL " + String(o.mesh && o.mesh.name || "").toUpperCase() : o.type.toUpperCase()) + "  #" + o.id; }

// model file -> mesh, by file extension (buf = ArrayBuffer)
function parseModel(name, buf, opt) {
  const ext = String(name).split(".").pop().toLowerCase(), text = () => (typeof TextDecoder !== "undefined" ? new TextDecoder().decode(new Uint8Array(buf)) : String.fromCharCode.apply(null, new Uint8Array(buf)));
  let m;
  if (ext === "obj") m = M.parseOBJ(text(), name);
  else if (ext === "stl") m = M.parseSTL(buf, name);
  else if (ext === "glb") m = M.parseGLB(buf, name, opt);
  else if (ext === "gltf") m = M.parseGLTF(text(), name, opt);
  else throw new Error("Use a .obj, .stl, .glb or .gltf file (convert .fbx / .usdz / .blend to .glb in Blender).");
  if (m.tris > 400000) throw new Error(m.tris.toLocaleString() + " triangles is over the 400,000 limit.");
  return m;
}

module.exports = { CREATE, MAT_FOR, BRUSHES, screenRay, terrainHit, sculpt, heightAt, clearSculpt, dropToGround, addMesh, addObject, duplicate, remove, view, orbit, pan, zoom, iconScene, label, parseModel, groundY };
