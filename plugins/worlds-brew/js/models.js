"use strict";
// Frank's Worlds Brew: 3D model import (.obj, .stl, .glb, .gltf with embedded data), mesh helpers and sample models.
// Models are normalised to fit a -1..1 box around their centre; the scene object scales and places them.
const { hash2, fbm } = require("./noise.js");
const atobSafe = typeof atob === "function" ? atob : (b) => Buffer.from(b, "base64").toString("binary");
function utf8(buf) { if (typeof TextDecoder !== "undefined") return new TextDecoder().decode(buf); const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); try { return decodeURIComponent(escape(s)); } catch (e) { return s; } }
let MESHID = 1;
function finishMesh(name, P, I) {
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { const q = P[i + k]; if (q < mn[k]) mn[k] = q; if (q > mx[k]) mx[k] = q; }
  const c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], half = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2 || 1;
  const v = new Float32Array(P.length); for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) v[i + k] = (P[i + k] - c[k]) / half;
  const f = new Uint32Array(I), nv = P.length / 3; for (let i = 0; i < f.length; i++) if (!(f[i] < nv)) throw new Error("a face points at a missing vertex");
  return { id: MESHID++, name, v, f, tris: f.length / 3, hy: (mx[1] - mn[1]) / 2 / half };
}
function vertexNormals(v, f) {
  const n = new Float32Array(v.length);
  for (let t = 0; t < f.length; t += 3) { const a = f[t] * 3, b = f[t + 1] * 3, c = f[t + 2] * 3;
    const ux = v[b] - v[a], uy = v[b + 1] - v[a + 1], uz = v[b + 2] - v[a + 2], wx = v[c] - v[a], wy = v[c + 1] - v[a + 1], wz = v[c + 2] - v[a + 2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[c] += nx; n[c + 1] += ny; n[c + 2] += nz; }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}
function parseOBJ(text, name) {
  const P = [], I = [];
  for (const line of text.split(/\r?\n/)) { const s = line.trim();
    if (s.startsWith("v ")) { const a = s.split(/\s+/); P.push(+a[1], +a[2], +a[3]); }
    else if (s.startsWith("f ")) { const a = s.split(/\s+/).slice(1).filter(Boolean).map((t) => { const k = parseInt(t.split("/")[0], 10); return k < 0 ? P.length / 3 + k : k - 1; });
      for (let i = 1; i < a.length - 1; i++) I.push(a[0], a[i], a[i + 1]); } }
  if (!I.length) throw new Error("no faces found");
  return finishMesh(name, P, I);
}
function parseSTL(buf, name) { // binary or ASCII; STL files are Z-up, so turn them Y-up
  const dv = new DataView(buf), n = buf.byteLength >= 84 ? dv.getUint32(80, true) : 0, P = [], I = [];
  if (84 + n * 50 === buf.byteLength) { for (let t = 0; t < n; t++) { const o = 84 + t * 50 + 12; for (let k = 0; k < 3; k++) { const x = dv.getFloat32(o + k * 12, true), y = dv.getFloat32(o + k * 12 + 4, true), z = dv.getFloat32(o + k * 12 + 8, true); P.push(x, z, -y); } I.push(t * 3, t * 3 + 1, t * 3 + 2); } }
  else { const re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g, txt = utf8(buf); let m; while ((m = re.exec(txt))) P.push(+m[1], +m[3], -m[2]); for (let i = 0; i < P.length / 3; i++) I.push(i); }
  if (!I.length) throw new Error("no triangles found");
  return finishMesh(name, P, I);
}
function parseGLB(buf, name) {
  const dv = new DataView(buf); if (buf.byteLength < 20 || dv.getUint32(0, true) !== 0x46546C67) throw new Error("not a binary glTF (.glb) file");
  let off = 12, json = null, bin = null;
  while (off + 8 <= buf.byteLength) { const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true), chunk = buf.slice(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(utf8(chunk)); else if (type === 0x004E4942) bin = chunk; off += 8 + len; }
  if (!json || !bin) throw new Error("the file has no mesh data");
  return gltfToMesh(json, [bin], name);
}
function parseGLTF(text, name) {
  const json = JSON.parse(text);
  const bufs = (json.buffers || []).map((b) => { if (!b.uri || !b.uri.startsWith("data:")) throw new Error("this .gltf uses a separate .bin file; export it as .glb instead");
    const s = atobSafe(b.uri.split(",")[1]), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; });
  return gltfToMesh(json, bufs, name);
}
function gltfToMesh(json, bufs, name) {
  const P = [], I = [];
  const acc = (i) => { const a = json.accessors[i], bv = json.bufferViews[a.bufferView], comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const T = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType]; if (!T) throw new Error("unsupported glTF data type");
    const stride = bv.byteStride ? bv.byteStride / T.BYTES_PER_ELEMENT : comps, start = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const raw = new T(bufs[bv.buffer || 0].slice(start, start + ((a.count - 1) * stride + comps) * T.BYTES_PER_ELEMENT)), out = new Array(a.count * comps);
    for (let e = 0; e < a.count; e++) for (let c = 0; c < comps; c++) out[e * comps + c] = raw[e * stride + c]; return out; };
  const mul = (A, B) => { const C = new Array(16).fill(0); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) C[c * 4 + r] += A[k * 4 + r] * B[c * 4 + k]; return C; };
  const local = (n) => { if (n.matrix) return n.matrix; const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], [tx, ty, tz] = n.translation || [0, 0, 0];
    return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0, 2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
      2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, tx, ty, tz, 1]; };
  const visit = (ni, parent) => { const n = json.nodes[ni], M = mul(parent, local(n));
    if (n.mesh != null) for (const pr of json.meshes[n.mesh].primitives) { if (pr.mode != null && pr.mode !== 4) continue;
      const pos = acc(pr.attributes.POSITION), base = P.length / 3;
      for (let i = 0; i < pos.length; i += 3) { const x = pos[i], y = pos[i + 1], z = pos[i + 2]; P.push(M[0] * x + M[4] * y + M[8] * z + M[12], M[1] * x + M[5] * y + M[9] * z + M[13], M[2] * x + M[6] * y + M[10] * z + M[14]); }
      const ind = pr.indices != null ? acc(pr.indices) : Array.from({ length: pos.length / 3 }, (_, k) => k); for (const k of ind) I.push(base + k); }
    (n.children || []).forEach((c) => visit(c, M)); };
  const ID = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], sc = json.scenes ? json.scenes[json.scene || 0] : null;
  (sc ? sc.nodes : (json.nodes || []).map((_, i) => i)).forEach((ni) => visit(ni, ID));
  if (!I.length) throw new Error("no triangle meshes found");
  return finishMesh(name, P, I);
}
function upright(m) { const P = []; for (let i = 0; i < m.v.length; i += 3) P.push(m.v[i], m.v[i + 2], -m.v[i + 1]); return finishMesh(m.name, P, Array.from(m.f)); }
function meshVerts(o) {
  const m = o.mesh, key = m.id + "|" + o.disp;
  if (o._mk === key) return o._mv;
  let v = m.v;
  if (o.disp > 0) { const n0 = vertexNormals(m.v, m.f); v = new Float32Array(m.v.length);
    for (let i = 0; i < v.length; i += 3) { const d = (fbm(m.v[i] * 2.5 + 7, m.v[i + 2] * 2.5 + m.v[i + 1] * 2.5, 4, 0.5) - 0.5) * 2 * o.disp; v[i] = m.v[i] + n0[i] * d; v[i + 1] = m.v[i + 1] + n0[i + 1] * d; v[i + 2] = m.v[i + 2] + n0[i + 2] * d; } }
  o._mv = { v, n: vertexNormals(v, m.f) }; o._mk = key; return o._mv;
}
function lathe(profile, seg, jitter, seed) {
  const P = [], I = [], last = profile.length - 1;
  profile.forEach(([r, y], j) => { for (let k = 0; k < seg; k++) { const a = k / seg * Math.PI * 2, rj = jitter ? 1 + (hash2(j * 31 + seed, k * 17) - 0.5) * jitter : 1, yj = jitter && j > 0 && j < last ? (hash2(k + 3, j + seed) - 0.5) * jitter * 0.4 : 0;
    P.push(Math.cos(a) * r * rj, y + yj, Math.sin(a) * r * rj); } });
  for (let j = 0; j < last; j++) for (let k = 0; k < seg; k++) { const a = j * seg + k, b = j * seg + (k + 1) % seg; I.push(a, a + seg, b, b, a + seg, b + seg); }
  return { P, I };
}
function toOBJ(m) { const out = ["# Frank's Worlds Brew sample"]; for (let i = 0; i < m.P.length; i += 3) out.push("v " + m.P[i].toFixed(4) + " " + m.P[i + 1].toFixed(4) + " " + m.P[i + 2].toFixed(4)); for (let i = 0; i < m.I.length; i += 3) out.push("f " + (m.I[i] + 1) + " " + (m.I[i + 1] + 1) + " " + (m.I[i + 2] + 1)); return out.join("\n"); }
const SAMPLES = {
  pawn: parseOBJ(toOBJ(lathe([[0, 0], [0.9, 0], [0.92, 0.1], [0.8, 0.2], [0.6, 0.28], [0.5, 0.45], [0.42, 0.8], [0.34, 1.15], [0.3, 1.32], [0.52, 1.4], [0.52, 1.5], [0.3, 1.56], [0.4, 1.7], [0.46, 1.9], [0.42, 2.08], [0.3, 2.22], [0.14, 2.3], [0, 2.32]], 40)), "pawn.obj"),
  rock: parseOBJ(toOBJ(lathe(Array.from({ length: 9 }, (_, j) => { const a = j / 8 * Math.PI; return [Math.sin(a), -Math.cos(a) * 0.72]; }), 11, 0.45, 5)), "rock.obj"),
};

/* scene files store models as base64 typed arrays */
function b64(u8) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return typeof btoa === "function" ? btoa(s) : Buffer.from(s, "binary").toString("base64"); }
function unb64(str) { const s = atobSafe(str), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
function meshToJSON(m) { return { name: m.name, hy: m.hy, v: b64(new Uint8Array(m.v.buffer, m.v.byteOffset, m.v.byteLength)), f: b64(new Uint8Array(m.f.buffer, m.f.byteOffset, m.f.byteLength)) }; }
function meshFromJSON(j) { const v = new Float32Array(unb64(j.v)), f = new Uint32Array(unb64(j.f)); return { id: MESHID++, name: j.name, v, f, tris: f.length / 3, hy: j.hy }; }
/* .obj export of a model as placed in the scene (Pro: Export OBJ) */
function exportOBJ(o) { const m = meshVerts(o), f = o.mesh.f, c = Math.cos(o.ry * Math.PI / 180), s = Math.sin(o.ry * Math.PI / 180), out = ["# Frank's Worlds Brew export: " + o.mesh.name];
  for (let i = 0; i < m.v.length; i += 3) { const lx = m.v[i] * o.s * o.sx, ly = m.v[i + 1] * o.s * o.sy, lz = m.v[i + 2] * o.s * o.sz; out.push("v " + (o.x + c * lx + s * lz).toFixed(5) + " " + (o.y + ly).toFixed(5) + " " + (o.z - s * lx + c * lz).toFixed(5)); }
  for (let i = 0; i < f.length; i += 3) out.push("f " + (f[i] + 1) + " " + (f[i + 1] + 1) + " " + (f[i + 2] + 1)); return out.join("\n") + "\n"; }
module.exports = { finishMesh, vertexNormals, parseOBJ, parseSTL, parseGLB, parseGLTF, upright, meshVerts, lathe, toOBJ, SAMPLES, meshToJSON, meshFromJSON, exportOBJ };
