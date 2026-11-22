"use strict";
// Frank's Worlds Brew render engine. Host-free and deterministic (same input, same pixels).
// One path for everything: signed-distance ray marching for terrains, primitives, water and ground,
// plus a bounding-volume tree of triangles for imported models. Sun + sky light, soft shadows,
// reflections, water ripples, aerial haze, height fog and procedural clouds.
const { clamp, vnoise, fbm } = require("./noise.js");
const { MATS, SKIES, heightmap, hmAt, camBasis } = require("./scene.js");
const { meshVerts } = require("./models.js");

function compile(scene) {
  const sky = SKIES[scene.sky];
  const az = scene.sunAz * Math.PI / 180, al = scene.sunAlt * Math.PI / 180;
  const Lx = Math.cos(al) * Math.sin(az), Ly = Math.sin(al), Lz = Math.cos(al) * Math.cos(az);
  const haze = scene.haze / 100 * 0.06, fogD = scene.fog / 100, fogH = Math.max(0.2, scene.fogH), clouds = scene.clouds / 100;
  const wl = scene.waterLvl || 0;
  const O = scene.objs.map((o) => {
    const m = MATS[o.mat] || MATS.Matte, ry = o.ry * Math.PI / 180;
    let col = m.col;
    if (o.hue) { const h = o.hue / 360 * 6, s = 0.7, v = Math.max(...m.col); const c = v * s, x = c * (1 - Math.abs(h % 2 - 1)), mm = v - c;
      const r = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h) % 6]; col = [r[0] + mm, r[1] + mm, r[2] + mm]; }
    return { o, type: o.type, x: o.x, y: o.y, z: o.z, s: o.s, c: Math.cos(ry), sn: Math.sin(ry), col, refl: o.refl != null ? o.refl : m.refl, spec: m.spec, emit: m.emit || 0, tex: m.tex || 0,
      hm: o.type === "terrain" ? heightmap(o) : null, H: o.h, pat: o.pat || "None", ts: o.ts || 1, bump: o.bump || 0, img: o.img || null };
  });
  // ---- imported models: world-space triangles + a bounding volume tree for fast ray hits
  const MT = [], MN = [], MOWN = [], MC = [];
  O.forEach((b, k) => { if (b.type !== "mesh") return; const o = b.o, m = meshVerts(o), f = o.mesh.f, sx = o.s * o.sx, sy = o.s * o.sy, sz = o.s * o.sz, tc = o.vc !== false ? o.mesh.tc : null;
    for (let t = 0; t < f.length; t += 3) { if (tc) MC.push(tc[t] / 255 * 0.92, tc[t + 1] / 255 * 0.92, tc[t + 2] / 255 * 0.92); else MC.push(-1, -1, -1); for (let j = 0; j < 3; j++) { const i = f[t + j] * 3, lx = m.v[i] * sx, ly = m.v[i + 1] * sy, lz = m.v[i + 2] * sz;
      MT.push(o.x + b.c * lx + b.sn * lz, o.y + ly, o.z - b.sn * lx + b.c * lz); const nx = m.n[i] / o.sx, ny = m.n[i + 1] / o.sy, nz = m.n[i + 2] / o.sz; MN.push(b.c * nx + b.sn * nz, ny, -b.sn * nx + b.c * nz); } MOWN.push(k); } });
  const TA = new Float32Array(MT), NA = new Float32Array(MN);
  let ROOT = null;
  if (MOWN.length) {
    const cen = (i, a) => TA[i * 9 + a] + TA[i * 9 + 3 + a] + TA[i * 9 + 6 + a];
    const build = (list) => { const nd = { mn: [1e9, 1e9, 1e9], mx: [-1e9, -1e9, -1e9] };
      for (const i of list) for (let j = 0; j < 9; j++) { const a = j % 3, q = TA[i * 9 + j]; if (q < nd.mn[a]) nd.mn[a] = q; if (q > nd.mx[a]) nd.mx[a] = q; }
      if (list.length <= 4) { nd.tris = list; return nd; }
      const e0 = nd.mx[0] - nd.mn[0], e1 = nd.mx[1] - nd.mn[1], e2 = nd.mx[2] - nd.mn[2], ax = e0 > e1 ? (e0 > e2 ? 0 : 2) : (e1 > e2 ? 1 : 2);
      list.sort((p, q) => cen(p, ax) - cen(q, ax)); const h = list.length >> 1; nd.l = build(list.slice(0, h)); nd.r = build(list.slice(h)); return nd; };
    ROOT = build(Array.from({ length: MOWN.length }, (_, i) => i));
  }
  let MTRI = -1, MU = 0, MV = 0;
  function boxHit(nd, ox, oy, oz, ix, iy, iz, tMax) {
    let t0 = 0, t1 = tMax, a, b, s;
    a = (nd.mn[0] - ox) * ix; b = (nd.mx[0] - ox) * ix; if (a > b) { s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) return false;
    a = (nd.mn[1] - oy) * iy; b = (nd.mx[1] - oy) * iy; if (a > b) { s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) return false;
    a = (nd.mn[2] - oz) * iz; b = (nd.mx[2] - oz) * iz; if (a > b) { s = a; a = b; b = s; } if (a > t0) t0 = a; if (b < t1) t1 = b; return t0 <= t1;
  }
  function meshHit(ox, oy, oz, dx, dy, dz, tMax, any) {
    MTRI = -1; if (!ROOT) return -1;
    const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz, st = [ROOT]; let best = tMax, hit = -1;
    while (st.length) { const nd = st.pop(); if (!boxHit(nd, ox, oy, oz, ix, iy, iz, best)) continue;
      if (!nd.tris) { st.push(nd.l, nd.r); continue; }
      for (const i of nd.tris) { const p = i * 9;
        const e1x = TA[p + 3] - TA[p], e1y = TA[p + 4] - TA[p + 1], e1z = TA[p + 5] - TA[p + 2], e2x = TA[p + 6] - TA[p], e2y = TA[p + 7] - TA[p + 1], e2z = TA[p + 8] - TA[p + 2];
        const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz;
        if (det > -1e-10 && det < 1e-10) continue;
        const inv = 1 / det, tx = ox - TA[p], ty = oy - TA[p + 1], tz = oz - TA[p + 2], u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue;
        const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, v = (dx * qx + dy * qy + dz * qz) * inv; if (v < 0 || u + v > 1) continue;
        const t = (e2x * qx + e2y * qy + e2z * qz) * inv; if (t > 1e-4 && t < best) { best = t; hit = i; MU = u; MV = v; if (any) { MTRI = i; return t; } } } }
    MTRI = hit; return hit < 0 ? -1 : best;
  }
  let HIT = 0, LX = 0, LY = 0, LZ = 0;
  function sdBox(px, py, pz, bx, by, bz) { const qx = Math.abs(px) - bx, qy = Math.abs(py) - by, qz = Math.abs(pz) - bz;
    const mx = qx > 0 ? qx : 0, my = qy > 0 ? qy : 0, mz = qz > 0 ? qz : 0; return Math.sqrt(mx * mx + my * my + mz * mz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0); }
  function sdCone(px, py, pz, s) {
    const qx = Math.sqrt(px * px + pz * pz), qy = py, h = s, r1 = s;
    const cax = qx - Math.min(qx, qy < 0 ? r1 : 0), cay = Math.abs(qy) - h;
    const k2x = -r1, k2y = 2 * h, t = clamp(((-qx) * k2x + (h - qy) * k2y) / (k2x * k2x + k2y * k2y), 0, 1);
    const cbx = qx + k2x * t, cby = qy - h + k2y * t, sg = (cbx < 0 && cay < 0) ? -1 : 1;
    return sg * Math.sqrt(Math.min(cax * cax + cay * cay, cbx * cbx + cby * cby));
  }
  function sdo(b, x, y, z) {
    let px = x - b.x, py = y - b.y, pz = z - b.z;
    const lx = b.c * px - b.sn * pz; pz = b.sn * px + b.c * pz; px = lx;
    const s = b.s;
    switch (b.type) {
      case "sphere": return Math.sqrt(px * px + py * py + pz * pz) - s;
      case "cube": return sdBox(px, py, pz, s, s, s) - 0.02;
      case "cylinder": { const dx = Math.sqrt(px * px + pz * pz) - s, dy = Math.abs(py) - s, mx = dx > 0 ? dx : 0, my = dy > 0 ? dy : 0; return Math.min(Math.max(dx, dy), 0) + Math.sqrt(mx * mx + my * my); }
      case "torus": { const q = Math.sqrt(px * px + pz * pz) - s * 0.72; return Math.sqrt(q * q + py * py) - s * 0.28; }
      case "cone": return sdCone(px, py, pz, s);
      case "terrain": {
        // lower bound: the box, and outside radius 0.95*s the heightmap is sunk to -0.08*H (scene.js),
        // so empty space around the island never casts false soft shadows
        const top = b.H + 0.05, bd = sdBox(px, py - (top - 1) / 2, pz, s, (top + 1) / 2, s), d = Math.max(bd, Math.min(Math.sqrt(px * px + pz * pz) - 0.95 * s, py + 0.08 * b.H));
        if (d > 0.08) return d;
        const h = hmAt(b.hm, px / s * 0.5 + 0.5, pz / s * 0.5 + 0.5) * b.H;
        return (py - h) * 0.42;
      }
    }
    return 1e9;
  }
  function map(x, y, z) {
    let d = 1e9, id = -1;
    if (scene.water) { const dw = y - wl; if (dw < d) { d = dw; id = -3; } }
    if (scene.ground) { const dg = y + 0.01; if (dg < d) { d = dg; id = -4; } }
    for (let k = 0; k < O.length; k++) { const dk = sdo(O[k], x, y, z); if (dk < d) { d = dk; id = k; } }
    HIT = id; return d;
  }
  function march(ox, oy, oz, dx, dy, dz, maxT) {
    let t = 0.01;
    for (let i = 0; i < 220; i++) { const d = map(ox + dx * t, oy + dy * t, oz + dz * t); if (d < 0.0008 * t + 0.0015) return t; t += d; if (t > maxT) break; }
    return -1;
  }
  function shadow(ox, oy, oz) {
    if (ROOT && meshHit(ox, oy, oz, Lx, Ly, Lz, 40, true) > 0) return 0;
    let t = 0.04, res = 1;
    for (let i = 0; i < 48 && t < 40; i++) { const d = map(ox + Lx * t, oy + Ly * t, oz + Lz * t); if (d < 0.001) return 0; if (t > 0.3) res = Math.min(res, 24 * d / t); /* no penumbra right at the surface: heightfield distances are estimates */ t += clamp(d, 0.03, 1.5); }
    return clamp(res, 0, 1);
  }
  function skyCol(dx, dy, dz, out) {
    const y = Math.max(dy, 0), k = Math.pow(y, 0.45);
    let r = sky.hor[0] + (sky.zen[0] - sky.hor[0]) * k, g = sky.hor[1] + (sky.zen[1] - sky.hor[1]) * k, b = sky.hor[2] + (sky.zen[2] - sky.hor[2]) * k;
    if (dy < 0) { const f = Math.min(-dy * 4, 1) * 0.35; r *= 1 - f; g *= 1 - f; b *= 1 - f; }
    const sd = Math.max(dx * Lx + dy * Ly + dz * Lz, 0);
    const glow = Math.pow(sd, 12) * 0.35 + Math.pow(sd, 900) * 2.5;
    r += sky.sun[0] * glow; g += sky.sun[1] * glow; b += sky.sun[2] * glow;
    if (clouds > 0 && dy > 0.02) {
      const t = 40 / dy, cx = dx * t * 0.025, cz = dz * t * 0.025;
      let c = fbm(cx + 3.1, cz + 7.7, 5, 0.5); c = clamp((c - (0.72 - clouds * 0.42)) * 3.2, 0, 1) * Math.min(dy * 6, 1);
      const lit = 0.75 + 0.35 * Math.pow(sd, 3);
      r += (sky.sun[0] * lit * 0.9 - r) * c; g += (sky.sun[1] * lit * 0.9 - g) * c; b += (sky.sun[2] * lit * 0.92 - b) * c;
    }
    out[0] = r; out[1] = g; out[2] = b;
  }
  const tmp = [0, 0, 0], rc = [0, 0, 0];
  function normal(x, y, z, e, out) {
    const a = map(x + e, y - e, z - e), b = map(x - e, y - e, z + e), c = map(x - e, y + e, z - e), d = map(x + e, y + e, z + e);
    let nx = a - b - c + d, ny = -a - b + c + d, nz = -a + b - c + d; const l = Math.hypot(nx, ny, nz) || 1; out[0] = nx / l; out[1] = ny / l; out[2] = nz / l;
  }
  const nrm = [0, 0, 0];
  // returns colour in out; info gets depth + id for passes
  function trace(ox, oy, oz, dx, dy, dz, depth, out, info) {
    const maxT = 160, tm = meshHit(ox, oy, oz, dx, dy, dz, maxT, false), mtri = MTRI, mu = MU, mv = MV;
    const ts = march(ox, oy, oz, dx, dy, dz, tm > 0 ? tm : maxT), t = ts >= 0 ? ts : tm;
    if (t < 0) { skyCol(dx, dy, dz, out); if (info) { info.t = -1; info.id = -1; } return; }
    const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
    let id, nx, ny, nz, tri = -1;
    if (ts >= 0) { map(px, py, pz); id = HIT; normal(px, py, pz, 0.0015 + t * 0.0008, nrm); nx = nrm[0]; ny = nrm[1]; nz = nrm[2]; }
    else { // model triangle: smooth (interpolated) or flat normal, facing the ray
      id = MOWN[mtri]; tri = mtri; const p = mtri * 9;
      if (O[id].o.smooth) { const w = 1 - mu - mv; nx = NA[p] * w + NA[p + 3] * mu + NA[p + 6] * mv; ny = NA[p + 1] * w + NA[p + 4] * mu + NA[p + 7] * mv; nz = NA[p + 2] * w + NA[p + 5] * mu + NA[p + 8] * mv; }
      else { const e1x = TA[p + 3] - TA[p], e1y = TA[p + 4] - TA[p + 1], e1z = TA[p + 5] - TA[p + 2], e2x = TA[p + 6] - TA[p], e2y = TA[p + 7] - TA[p + 1], e2z = TA[p + 8] - TA[p + 2]; nx = e1y * e2z - e1z * e2y; ny = e1z * e2x - e1x * e2z; nz = e1x * e2y - e1y * e2x; }
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; if (nx * dx + ny * dy + nz * dz > 0) { nx = -nx; ny = -ny; nz = -nz; }
    }
    if (info) { info.t = t; info.id = id; }
    let cr, cg, cb, refl = 0, spec = 0.2, emit = 0;
    if (id === -3) { // water
      const w1 = vnoise(px * 1.3, pz * 1.3 + 0.5) - 0.5, w2 = vnoise(px * 4.1 + 9, pz * 4.1) - 0.5;
      nx += (w1 * 0.08 + w2 * 0.03); nz += (w2 * 0.08 - w1 * 0.03); const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      cr = 0.02; cg = 0.09; cb = 0.12; spec = 1.0;
      const ci = Math.max(-(dx * nx + dy * ny + dz * nz), 0); refl = 0.06 + 0.94 * Math.pow(1 - ci, 5); refl = Math.max(refl, 0.25);
    } else if (id === -4) { // ground plane
      const n = fbm(px * 0.35, pz * 0.35, 4, 0.5); cr = 0.62 + n * 0.25; cg = 0.52 + n * 0.2; cb = 0.4 + n * 0.12;
      if (scene.sky === "Night") { const ch = ((Math.floor(px) + Math.floor(pz)) & 1) ? 0.08 : 0.16; cr = cg = cb = ch; refl = 0.25; }
    } else {
      const b = O[id];
      if (b.type === "terrain") {
        const hn = (py - b.y) / Math.max(b.H, 0.01), n = vnoise(px * 2.3, pz * 2.3);
        if (scene.water && py < wl + 0.18) { cr = 0.78; cg = 0.7; cb = 0.52; }
        else if (hn > 0.72 + n * 0.08 && ny > 0.55) { cr = 0.93; cg = 0.95; cb = 1.0; spec = 0.4; }
        else if (ny > 0.78 - n * 0.08) { cr = 0.24 + n * 0.1; cg = 0.38 + n * 0.12; cb = 0.16; }
        else { cr = 0.45 + n * 0.12; cg = 0.4 + n * 0.1; cb = 0.34 + n * 0.08; }
        if (b.o.mat !== "Stone") { const m = b.col; cr = (cr + m[0]) / 2; cg = (cg + m[1]) / 2; cb = (cb + m[2]) / 2; }
      } else {
        cr = b.col[0]; cg = b.col[1]; cb = b.col[2]; refl = b.refl; spec = b.spec; emit = b.emit;
        if (tri >= 0 && MC[tri * 3] >= 0) { cr = MC[tri * 3]; cg = MC[tri * 3 + 1]; cb = MC[tri * 3 + 2]; }   // the model's own colours
        if (b.tex === 1) { const n = fbm(px * 2, pz * 2 + py * 2, 4, 0.55); cr *= 0.7 + n * 0.6; cg *= 0.7 + n * 0.6; cb *= 0.7 + n * 0.6; }
        if (b.tex === 2) { const c = ((Math.floor(px * 2) + Math.floor(py * 2) + Math.floor(pz * 2)) & 1) ? 1 : 0.15; cr *= c; cg *= c; cb *= c; }
        if (b.img) { // image texture, projected from three sides (triplanar)
          const T = b.img, q = b.ts * 0.5, lx = (px - b.x) * q, ly = (py - b.y) * q, lz = (pz - b.z) * q;
          let wx = nx ** 4, wy = ny ** 4, wz = nz ** 4, ir = 0, ig = 0, ib = 0; const ws = wx + wy + wz || 1; wx /= ws; wy /= ws; wz /= ws;
          const smp = (u, v, w) => { if (w < 0.01) return; const x = Math.min(T.w - 1, Math.floor((u - Math.floor(u)) * T.w)), y = Math.min(T.h - 1, Math.floor((1 - (v - Math.floor(v))) * T.h)), o = (y * T.w + x) * 4;
            ir += T.d[o] / 255 * w; ig += T.d[o + 1] / 255 * w; ib += T.d[o + 2] / 255 * w; };
          smp(lz, ly, wx); smp(lx, lz, wy); smp(lx, ly, wz); cr = ir * 0.9; cg = ig * 0.9; cb = ib * 0.9;
        }
        if (b.pat !== "None") { const q = b.ts, lx = (px - b.x) * q, ly = (py - b.y) * q, lz = (pz - b.z) * q; let m = 1;
          if (b.pat === "Marble") m = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(lx * 2.2 + ly * 1.3 + fbm(lx * 0.9 + 4, lz * 0.9 + ly * 0.9, 5, 0.55) * 9)), 0.3);
          else if (b.pat === "Wood") { const r = Math.hypot(lx, lz) * 5 + fbm(lx * 0.7, ly * 0.25, 3, 0.5) * 2.5, g = r - Math.floor(r); m = 0.55 + 0.45 * (1 - g * g * g); cr *= 0.95; cg *= 0.62; cb *= 0.36; }
          else if (b.pat === "Grid") { const f = (v) => { const z = v * 2 - Math.floor(v * 2); return z < 0.07 || z > 0.93; }; m = f(lx) || f(ly) || f(lz) ? 0.15 : 1; }
          else if (b.pat === "Noise") m = 0.45 + 1.1 * fbm(lx * 2 + 1, lz * 2 + ly * 2, 5, 0.55);
          cr *= m; cg *= m; cb *= m; }
        if (b.bump > 0) { const k = b.bump * 0.7, q = 7 * b.ts; nx += (vnoise(px * q + 3, py * q) - 0.5) * k; ny += (vnoise(py * q + 5, pz * q) - 0.5) * k; nz += (vnoise(pz * q + 9, px * q) - 0.5) * k;
          const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; }
      }
    }
    const sx = px + nx * 0.01, sy = py + ny * 0.01, sz = pz + nz * 0.01;
    const ndl = Math.max(nx * Lx + ny * Ly + nz * Lz, 0), sh = ndl > 0 && Ly > -0.05 ? shadow(sx, sy, sz) : 0;
    const amb = 0.55 + 0.45 * ny;
    let r = cr * (sky.sun[0] * ndl * sh + sky.amb[0] * amb), g = cg * (sky.sun[1] * ndl * sh + sky.amb[1] * amb), bb = cb * (sky.sun[2] * ndl * sh + sky.amb[2] * amb);
    // specular
    const rdx = dx - 2 * (dx * nx + dy * ny + dz * nz) * nx, rdy = dy - 2 * (dx * nx + dy * ny + dz * nz) * ny, rdz = dz - 2 * (dx * nx + dy * ny + dz * nz) * nz;
    const sp = Math.pow(Math.max(rdx * Lx + rdy * Ly + rdz * Lz, 0), 60) * spec * sh;
    r += sky.sun[0] * sp; g += sky.sun[1] * sp; bb += sky.sun[2] * sp;
    if (emit) { r = cr * 1.1 + r * 0.2; g = cg * 1.1 + g * 0.2; bb = cb * 1.1 + bb * 0.2; }
    if (refl > 0.01 && depth < 2) {
      trace(sx, sy, sz, rdx, rdy, rdz, depth + 1, rc, null);
      const tint = id === -3 ? 1 : 0.6;
      const kr = refl, mr = id === -3 ? 1 : cr * (1 - tint) + tint, mg = id === -3 ? 1 : cg * (1 - tint) + tint, mb = id === -3 ? 1 : cb * (1 - tint) + tint;
      r = r * (1 - kr) + rc[0] * mr * kr; g = g * (1 - kr) + rc[1] * mg * kr; bb = bb * (1 - kr) + rc[2] * mb * kr;
    }
    // aerial haze + ground fog
    let f = 1 - Math.exp(-t * haze);
    if (fogD > 0) { const hy = Math.max(py - wl, 0); f = 1 - (1 - f) * Math.exp(-fogD * 0.12 * t * Math.exp(-hy / fogH)); }
    skyCol(dx, Math.max(dy, 0.02) * 0.3, dz, tmp);
    out[0] = r + (tmp[0] - r) * f; out[1] = g + (tmp[1] - g) * f; out[2] = bb + (tmp[2] - bb) * f;
  }
  return { trace };
}
function tone(v) { v = v / (1 + v * 0.12) * 1.06; return clamp(Math.round(Math.pow(clamp(v, 0, 1), 0.95) * 255), 0, 255); }

/* Render a scene to RGBA (+ optional depth / object-id buffers for the extra layers).
   opt: { step (1 = every pixel, 3 = draft blocks), aa (1 or 2 = 2x2 samples), passes }
   hooks: { yield(progress) -> Promise (called about every 16 ms), cancelled() -> bool } */
async function render(scene, cam, W, H, opt, hooks) {
  opt = opt || {}; hooks = hooks || {};
  const step = opt.step || 1, aa = opt.aa || 1, R = compile(scene), B = camBasis(cam, W / H), n = aa * aa;
  const rgba = new Uint8Array(W * H * 4), depth = opt.passes ? new Float32Array(W * H) : null, ids = opt.passes ? new Int16Array(W * H) : null;
  const col = [0, 0, 0], info = { t: 0, id: 0 }, now = () => (typeof performance !== "undefined" ? performance.now() : Date.now()), t0 = now();
  let tick = t0 + 16;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      let r = 0, g = 0, b = 0;
      for (let s = 0; s < n; s++) {
        const jx = aa > 1 ? ((s % aa) + 0.5) / aa : 0.5, jy = aa > 1 ? (Math.floor(s / aa) + 0.5) / aa : 0.5;
        const u = ((x + jx * step) / W * 2 - 1) * B.tan * B.aspect, v = (1 - (y + jy * step) / H * 2) * B.tan;
        const dx = B.fx + u * B.rx + v * B.ux, dy = B.fy + v * B.uy, dz = B.fz + u * B.rz + v * B.uz, l = Math.hypot(dx, dy, dz);
        R.trace(B.ex, B.ey, B.ez, dx / l, dy / l, dz / l, 0, col, s === 0 && depth ? info : null);
        r += col[0]; g += col[1]; b += col[2];
      }
      const R8 = tone(r / n), G8 = tone(g / n), B8 = tone(b / n);
      for (let yy = y; yy < Math.min(y + step, H); yy++) for (let xx = x; xx < Math.min(x + step, W); xx++) {
        const p = yy * W + xx; rgba[p * 4] = R8; rgba[p * 4 + 1] = G8; rgba[p * 4 + 2] = B8; rgba[p * 4 + 3] = 255;
        if (depth) { depth[p] = info.t; ids[p] = info.id; }
      }
    }
    if (hooks.yield && now() > tick) { if (hooks.cancelled && hooks.cancelled()) return null; await hooks.yield(Math.min(1, (y + step) / H)); tick = now() + 16; }
  }
  if (hooks.yield) await hooks.yield(1);
  return { w: W, h: H, rgba, depth, ids, ms: now() - t0 };
}

/* Photoshop layers for a finished render: Render plus the optional extra layers */
const ID_COLOURS = [[94, 255, 200], [255, 120, 200], [120, 160, 255], [255, 210, 90], [200, 120, 255], [255, 140, 80], [120, 255, 120], [255, 255, 255]];
function layers(res, want) {
  want = want || {};
  const out = [{ name: "Render", rgba: res.rgba, blend: "normal" }], N = res.w * res.h;
  if (!res.depth) return out;
  const mk = (name, fn) => { const a = new Uint8Array(N * 4); for (let p = 0; p < N; p++) { const c = fn(p); a[p * 4] = c[0]; a[p * 4 + 1] = c[1]; a[p * 4 + 2] = c[2]; a[p * 4 + 3] = 255; } out.push({ name, rgba: a, blend: "normal", hidden: true }); };
  if (want.depth) { let far = 1; for (let p = 0; p < N; p++) if (res.depth[p] > far) far = res.depth[p]; mk("Depth", (p) => { const t = res.depth[p]; const v = t < 0 ? 0 : Math.round(255 * clamp(1 - t / far, 0, 1)); return [v, v, v]; }); }
  if (want.mask) mk("Object mask", (p) => { const id = res.ids[p]; return id < 0 ? [0, 0, 0] : id === -3 ? [40, 90, 160] : id === -4 ? [90, 70, 50] : ID_COLOURS[id % ID_COLOURS.length]; });
  if (want.sky) mk("Sky mask", (p) => (res.depth[p] < 0 ? [255, 255, 255] : [0, 0, 0]));
  return out;
}

module.exports = { compile, render, layers, tone };
