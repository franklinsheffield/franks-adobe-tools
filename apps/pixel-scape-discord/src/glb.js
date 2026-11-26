// Minimal glTF 2.0 binary writer for a textured heightfield tile with a diorama skirt.
"use strict";

// h: Float32Array grid*grid (row 0 = north), metres. Geometry: 1 unit = 1 m, X east, Y up, Z south, centred.
function terrainGLB({ h, grid, widthM, depthM, jpeg, name = "terrain", extras = {} }) {
  const G = grid; if (G > 256) throw new Error("grid must be <= 256 for 16-bit indices");
  let lo = Infinity, hi = -Infinity; for (const v of h) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const dx = widthM / (G - 1), dz = depthM / (G - 1), N = G * G;
  const pos = new Float32Array(N * 3), nor = new Float32Array(N * 3), uv = new Float32Array(N * 2);
  const H = (i, j) => h[Math.max(0, Math.min(G - 1, j)) * G + Math.max(0, Math.min(G - 1, i))] - lo;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const k = j * G + i;
    pos[k * 3] = -widthM / 2 + i * dx; pos[k * 3 + 1] = H(i, j); pos[k * 3 + 2] = -depthM / 2 + j * dz;
    const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * dx), nz = -(H(i, j + 1) - H(i, j - 1)) / (2 * dz), l = Math.hypot(nx, 1, nz);
    nor[k * 3] = nx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = nz / l;
    uv[k * 2] = i / (G - 1); uv[k * 2 + 1] = j / (G - 1);
  }
  const idx = new Uint16Array((G - 1) * (G - 1) * 6); let t = 0;
  for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) {
    const a = j * G + i, b = a + 1, c = a + G, d = c + 1; idx.set([a, c, b, b, c, d], t); t += 6;
  }
  // Skirt: walls from the terrain edge down to a flat base below the lowest point.
  const baseY = -Math.max(20, (hi - lo) * 0.08, widthM * 0.01), ring = [];
  for (let i = 0; i < G; i++) ring.push([i, 0]); for (let j = 1; j < G; j++) ring.push([G - 1, j]);
  for (let i = G - 2; i >= 0; i--) ring.push([i, G - 1]); for (let j = G - 2; j >= 1; j--) ring.push([0, j]);
  const sp = [], sn = [], si = [];
  for (let r = 0; r < ring.length; r++) {
    const [i0, j0] = ring[r], [i1, j1] = ring[(r + 1) % ring.length], k0 = j0 * G + i0, k1 = j1 * G + i1;
    const ex = pos[k1 * 3] - pos[k0 * 3], ez = pos[k1 * 3 + 2] - pos[k0 * 3 + 2], el = Math.hypot(ex, ez) || 1, onx = ez / el, onz = -ex / el;
    const v = sp.length / 3;
    sp.push(pos[k0 * 3], pos[k0 * 3 + 1], pos[k0 * 3 + 2], pos[k1 * 3], pos[k1 * 3 + 1], pos[k1 * 3 + 2], pos[k0 * 3], baseY, pos[k0 * 3 + 2], pos[k1 * 3], baseY, pos[k1 * 3 + 2]);
    for (let q = 0; q < 4; q++) sn.push(onx, 0, onz);
    si.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
  }
  const hw = widthM / 2, hd = depthM / 2, v0 = sp.length / 3;   // bottom face
  sp.push(-hw, baseY, -hd, hw, baseY, -hd, -hw, baseY, hd, hw, baseY, hd); for (let q = 0; q < 4; q++) sn.push(0, -1, 0);
  si.push(v0, v0 + 1, v0 + 2, v0 + 1, v0 + 3, v0 + 2);
  const sP = new Float32Array(sp), sN = new Float32Array(sn), sI = new Uint32Array(si);

  const parts = [], views = [], acc = [];
  let off = 0;
  const add = (buf, target) => { const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength); const pad = (4 - (b.length % 4)) % 4; views.push(Object.assign({ buffer: 0, byteOffset: off, byteLength: b.length }, target ? { target } : {})); parts.push(b, Buffer.alloc(pad)); off += b.length + pad; return views.length - 1; };
  const accessor = (view, type, ct, count, mm) => { acc.push(Object.assign({ bufferView: view, componentType: ct, count, type }, mm || {})); return acc.length - 1; };
  const bounds = (a) => { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (let i = 0; i < a.length; i += 3) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], a[i + c]); mx[c] = Math.max(mx[c], a[i + c]); } return { min: mn, max: mx }; };
  const aP = accessor(add(pos, 34962), "VEC3", 5126, N, bounds(pos)), aN = accessor(add(nor, 34962), "VEC3", 5126, N), aU = accessor(add(uv, 34962), "VEC2", 5126, N);
  const aI = accessor(add(idx, 34963), "SCALAR", 5123, idx.length);
  const bP = accessor(add(sP, 34962), "VEC3", 5126, sP.length / 3, bounds(sP)), bN = accessor(add(sN, 34962), "VEC3", 5126, sN.length / 3), bI = accessor(add(sI, 34963), "SCALAR", 5125, sI.length);
  const imgView = add(new Uint8Array(jpeg));
  const json = {
    asset: { version: "2.0", generator: "Pixel Scape Terrain Lab bot" },
    scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ name, mesh: 0, extras: Object.assign({ minElevationM: lo, maxElevationM: hi, widthM, depthM, units: "metres" }, extras) }],
    meshes: [{ name, primitives: [
      { attributes: { POSITION: aP, NORMAL: aN, TEXCOORD_0: aU }, indices: aI, material: 0 },
      { attributes: { POSITION: bP, NORMAL: bN }, indices: bI, material: 1 }] }],
    materials: [
      { name: "satellite", pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 } },
      { name: "base", doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.06, 0.06, 0.07, 1], metallicFactor: 0, roughnessFactor: 0.9 } }],
    textures: [{ source: 0, sampler: 0 }], samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: imgView, mimeType: "image/jpeg" }],
    accessors: acc, bufferViews: views, buffers: [{ byteLength: off }],
  };
  let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const bin = Buffer.concat(parts), head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, jh, js, bh, bin]);
}
module.exports = { terrainGLB };
