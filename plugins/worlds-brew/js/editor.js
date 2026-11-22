"use strict";
// Frank's Worlds Brew scene editing (host-free, used by both panels and the tests):
// add / duplicate / delete objects, drop to ground, camera views, orbit / pan / zoom, Create-strip icon scenes.
const S = require("./scene.js");
const M = require("./models.js");
const { clamp } = require("./noise.js");

const CREATE = [["terrain", "Terrain"], ["sphere", "Sphere"], ["cube", "Cube"], ["cylinder", "Cylinder"], ["cone", "Cone"], ["torus", "Torus"],
  ["water", "Water"], ["ground", "Ground"], ["pawn", "Pawn"], ["rock", "Rock"]];
const MAT_FOR = { terrain: "Stone", sphere: "Chrome", cube: "Gold", cylinder: "Glossy", cone: "Matte", torus: "Neon" };

// a small deterministic offset per new object so new objects don't stack exactly
function spot(scene, k) { const n = scene.objs.length + (k || 0), a = n * 2.399963; return [Math.cos(a) * (1.2 + n * 0.35), Math.sin(a) * (1.2 + n * 0.35)]; }
const groundY = (scene) => (scene.water ? scene.waterLvl || 0 : 0);

function dropToGround(scene, o) {
  if (o.type === "mesh") { const v = M.meshVerts(o).v; let mn = 1e9; for (let i = 1; i < v.length; i += 3) mn = Math.min(mn, v[i]); o.y = +(groundY(scene) - mn * o.s * o.sy).toFixed(3); }
  else if (o.type === "terrain") o.y = 0;
  else o.y = +(groundY(scene) + (o.type === "torus" ? o.s * 0.28 : o.s)).toFixed(3);
  return o;
}

function addMesh(scene, m, mat, extra) {
  const c = scene.cam, [dx, dz] = spot(scene), o = S.obj("mesh", +(c.tx + dx).toFixed(1), 0, +(c.tz + dz).toFixed(1), 1.2, mat, Object.assign({ mesh: m }, extra || {}));
  dropToGround(scene, o); scene.objs.push(o); return o;
}

// returns the new object, or null for the Water / Ground switches
function addObject(scene, type) {
  if (type === "pawn") return addMesh(scene, M.SAMPLES.pawn, "Chrome");
  if (type === "rock") return addMesh(scene, M.SAMPLES.rock, "Stone", { smooth: false });
  if (type === "water") { scene.water = !scene.water; return null; }
  if (type === "ground") { scene.ground = !scene.ground; return null; }
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
  if (type === "ground") { base.ground = true; base.sky = "Dawn"; base.objs.push(S.obj("cube", 0, 0.5, 0, 0.5, "Checker", { ry: 30 })); return [base, { yaw: 30, pitch: 22, dist: 6, fov: 45, tx: 0, ty: 0.3, tz: 0 }]; }
  base.objs.push(S.obj(type, 0, type === "terrain" ? -0.5 : 0, 0, type === "terrain" ? 2 : 1, MAT_FOR[type], type === "terrain" ? { h: 1.6, seed: 4 } : { ry: 25 }));
  return [base, { yaw: 25, pitch: type === "terrain" ? 30 : 20, dist: type === "terrain" ? 5.6 : 3.7, fov: 45, tx: 0, ty: 0, tz: 0 }];
}

// what an object is called in the panels
function label(o) { if (!o) return "NOTHING SELECTED"; return (o.type === "mesh" ? "MODEL " + String(o.mesh && o.mesh.name || "").toUpperCase() : o.type.toUpperCase()) + "  #" + o.id; }

// model file -> mesh, by file extension (buf = ArrayBuffer)
function parseModel(name, buf) {
  const ext = String(name).split(".").pop().toLowerCase(), text = () => (typeof TextDecoder !== "undefined" ? new TextDecoder().decode(new Uint8Array(buf)) : String.fromCharCode.apply(null, new Uint8Array(buf)));
  let m;
  if (ext === "obj") m = M.parseOBJ(text(), name);
  else if (ext === "stl") m = M.parseSTL(buf, name);
  else if (ext === "glb") m = M.parseGLB(buf, name);
  else if (ext === "gltf") m = M.parseGLTF(text(), name);
  else throw new Error("Use a .obj, .stl, .glb or .gltf file (convert .fbx / .usdz / .blend to .glb in Blender).");
  if (m.tris > 400000) throw new Error(m.tris.toLocaleString() + " triangles is over the 400,000 limit.");
  return m;
}

module.exports = { CREATE, MAT_FOR, dropToGround, addMesh, addObject, duplicate, remove, view, orbit, pan, zoom, iconScene, label, parseModel, groundY };
