"use strict";
// Frank's Worlds Brew viewport: wireframe drawn into an RGBA buffer (UXP canvas support is patchy,
// so the viewport is shown as an image like every Brew preview). Also returns the screen
// positions of the move / rotate / scale handles so the panel can hit-test drags.
const { camBasis, heightmap, hmAt } = require("./scene.js");
const { meshVerts } = require("./models.js");

const C = { bg: [22, 24, 27], grid: [255, 255, 255], water: [90, 160, 255], horizon: [94, 255, 200], obj: [255, 255, 255], terrain: [190, 215, 180],
  sel: [94, 255, 200], sun: [255, 211, 107], x: [255, 95, 109], y: [125, 255, 138], z: [95, 168, 255], white: [255, 255, 255] };

function canvas(W, H) {
  const a = new Uint8Array(W * H * 4);
  for (let p = 0; p < W * H; p++) { a[p * 4] = C.bg[0]; a[p * 4 + 1] = C.bg[1]; a[p * 4 + 2] = C.bg[2]; a[p * 4 + 3] = 255; }
  const plot = (x, y, c, al) => { if (x < 0 || y < 0 || x >= W || y >= H || al <= 0) return; const p = (y * W + x) * 4;
    a[p] += (c[0] - a[p]) * al; a[p + 1] += (c[1] - a[p + 1]) * al; a[p + 2] += (c[2] - a[p + 2]) * al; };
  // Xiaolin Wu antialiased line
  function line(x0, y0, x1, y1, c, al) {
    if (!isFinite(x0 + y0 + x1 + y1)) return;
    if (Math.max(x0, x1) < -50 || Math.min(x0, x1) > W + 50 || Math.max(y0, y1) < -50 || Math.min(y0, y1) > H + 50) return;
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if (steep) { [x0, y0] = [y0, x0]; [x1, y1] = [y1, x1]; }
    if (x0 > x1) { [x0, x1] = [x1, x0]; [y0, y1] = [y1, y0]; }
    const dx = x1 - x0, g = dx === 0 ? 1 : (y1 - y0) / dx;
    const xs = Math.max(Math.round(x0), steep ? -1 : -1), xe = Math.min(Math.round(x1), (steep ? H : W) + 1);
    let y = y0 + g * (xs - x0);
    for (let x = xs; x <= xe; x++, y += g) { const yi = Math.floor(y), f = y - yi;
      if (steep) { plot(yi, x, c, al * (1 - f)); plot(yi + 1, x, c, al * f); } else { plot(x, yi, c, al * (1 - f)); plot(x, yi + 1, c, al * f); } }
  }
  function rect(x, y, w, h, c) { for (let j = Math.round(y); j < y + h; j++) for (let i = Math.round(x); i < x + w; i++) plot(i, j, c, 1); }
  return { rgba: a, line, rect, plot };
}

function wireframe(scene, cam, W, H, opt) {
  opt = opt || {};
  const B = camBasis(cam, W / H), f = (H / 2) / B.tan, cv = canvas(W, H), sel = opt.sel || null, mode = opt.gizmo || "move";
  const proj = (x, y, z) => { const vx = x - B.ex, vy = y - B.ey, vz = z - B.ez; return [vx * B.rx + vz * B.rz, vx * B.ux + vy * B.uy + vz * B.uz, vx * B.fx + vy * B.fy + vz * B.fz]; };
  const toS = (c) => [W / 2 + c[0] / c[2] * f, H / 2 - c[1] / c[2] * f];
  let col = C.obj, al = 1, thick = false;
  function seg(a, b) {
    let A = proj(a[0], a[1], a[2]), D = proj(b[0], b[1], b[2]); const n = 0.1;
    if (A[2] < n && D[2] < n) return;
    if (A[2] < n || D[2] < n) { const t = (n - A[2]) / (D[2] - A[2]), P = [A[0] + (D[0] - A[0]) * t, A[1] + (D[1] - A[1]) * t, n]; if (A[2] < n) A = P; else D = P; }
    const p = toS(A), q = toS(D); cv.line(p[0], p[1], q[0], q[1], col, al);
    if (thick) { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; cv.line(p[0] - dy / l, p[1] + dx / l, q[0] - dy / l, q[1] + dx / l, col, al * 0.8); }
  }
  const poly = (pts, closed) => { for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1]); if (closed) seg(pts[pts.length - 1], pts[0]); };
  // horizon
  const hz = proj(B.ex + B.fx * 1000, B.ey, B.ez + B.fz * 1000);
  let horizonY = null;
  if (hz[2] > 0) { horizonY = toS(hz)[1]; for (let x = 0; x < W; x += 11) cv.line(x, horizonY, x + 6, horizonY, C.horizon, 0.55); }
  // ground grid
  const gy = scene.water ? scene.waterLvl || 0 : 0; col = scene.water ? C.water : C.grid; al = scene.water ? 0.28 : 0.16; thick = false;
  for (let i = -40; i <= 40; i += 2) { seg([i, gy, -40], [i, gy, 40]); seg([-40, gy, i], [40, gy, i]); }
  for (const o of scene.objs) {
    const isSel = o === sel, ry = o.ry * Math.PI / 180, c = Math.cos(ry), s = Math.sin(ry), ss = o.s;
    const P = (lx, ly, lz) => [o.x + c * lx + s * lz, o.y + ly, o.z - s * lx + c * lz];
    col = isSel ? C.sel : o.type === "terrain" ? C.terrain : C.obj; al = isSel ? 1 : o.type === "terrain" ? 0.55 : 0.72; thick = isSel;
    const circ = (r, y, n, ax) => { const pts = []; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; pts.push(ax === "y" ? P(Math.cos(a) * r, y, Math.sin(a) * r) : ax === "z" ? P(Math.cos(a) * r, Math.sin(a) * r + y, 0) : P(0, Math.sin(a) * r + y, Math.cos(a) * r)); } poly(pts, true); };
    if (o.type === "sphere") { circ(ss, 0, 32, "y"); circ(ss, 0, 32, "z"); circ(ss, 0, 32, "x"); circ(ss * 0.71, ss * 0.71, 24, "y"); circ(ss * 0.71, -ss * 0.71, 24, "y"); }
    else if (o.type === "cube") { const v = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map((q) => P(q[0] * ss, q[1] * ss, q[2] * ss));
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach((e) => seg(v[e[0]], v[e[1]])); }
    else if (o.type === "cylinder") { circ(ss, ss, 28, "y"); circ(ss, -ss, 28, "y"); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; seg(P(Math.cos(a) * ss, ss, Math.sin(a) * ss), P(Math.cos(a) * ss, -ss, Math.sin(a) * ss)); } }
    else if (o.type === "cone") { circ(ss, -ss, 28, "y"); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; seg(P(Math.cos(a) * ss, -ss, Math.sin(a) * ss), P(0, ss, 0)); } }
    else if (o.type === "torus") { const R = ss * 0.72, r = ss * 0.28; circ(R + r, 0, 32, "y"); circ(R - r, 0, 24, "y"); circ(R, r, 28, "y"); circ(R, -r, 28, "y");
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, pts = []; for (let m = 0; m < 12; m++) { const b = m / 12 * Math.PI * 2; pts.push(P(Math.cos(a) * (R + Math.cos(b) * r), Math.sin(b) * r, Math.sin(a) * (R + Math.cos(b) * r))); } poly(pts, true); } }
    else if (o.type === "mesh") { const m = meshVerts(o), fc = o.mesh.f, st = Math.max(1, Math.ceil(fc.length / 3 / 5000)), sx = ss * o.sx, sy = ss * o.sy, sz = ss * o.sz;
      const V = (i) => P(m.v[i * 3] * sx, m.v[i * 3 + 1] * sy, m.v[i * 3 + 2] * sz);
      for (let t = 0; t < fc.length; t += 3 * st) { const a = V(fc[t]), b = V(fc[t + 1]), d = V(fc[t + 2]); seg(a, b); seg(b, d); seg(d, a); } }
    else if (o.type === "terrain") { const hm = heightmap(o), G = 24;
      for (let j = 0; j <= G; j++) { const ra = [], rb = []; for (let i = 0; i <= G; i++) { const u = i / G, v = j / G;
        ra.push(P((u * 2 - 1) * ss, hmAt(hm, u, v) * o.h, (v * 2 - 1) * ss)); rb.push(P((v * 2 - 1) * ss, hmAt(hm, v, u) * o.h, (u * 2 - 1) * ss)); } poly(ra); poly(rb); } }
    else if (o.type === "light") { // a little star in the light's own colour, with its reach as a faint ring
      const m = /^#?([0-9a-f]{6})$/i.exec(o.col || ""), n = m ? parseInt(m[1], 16) : 0xffe2b0, lc = [n >> 16 & 255, n >> 8 & 255, n & 255];
      if (!isSel) col = lc; const r = Math.max(0.15, o.s);
      [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, -0.7, 0.7]].forEach((d) => seg([o.x - d[0] * r * 1.6, o.y - d[1] * r * 1.6, o.z - d[2] * r * 1.6], [o.x + d[0] * r * 1.6, o.y + d[1] * r * 1.6, o.z + d[2] * r * 1.6]));
      circ(r, 0, 16, "y"); circ(r, 0, 16, "z");
      const keep = al; col = lc; al = 0.22; thick = false; circ(o.range || 6, -o.y + (scene.water ? scene.waterLvl || 0 : 0), 48, "y"); al = keep;
      continue; }
    if (isSel) { const isM = o.type === "mesh", hx = isM ? ss * o.sx : ss, hzz = isM ? ss * o.sz : ss, hy = o.type === "terrain" ? o.h : isM ? ss * o.sy * o.mesh.hy : ss, ly = o.type === "terrain" ? 0 : -hy;
      col = C.sel; al = 0.5; thick = false;
      const v = [[-1, ly, -1], [1, ly, -1], [1, hy, -1], [-1, hy, -1], [-1, ly, 1], [1, ly, 1], [1, hy, 1], [-1, hy, 1]].map((q) => P(q[0] * hx, q[1], q[2] * hzz));
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach((e) => seg(v[e[0]], v[e[1]])); }
  }
  // sculpt brush ring on the terrain surface
  if (opt.brush && opt.brush.o) { const b = opt.brush, o = b.o, hm = heightmap(o), ry = o.ry * Math.PI / 180, c = Math.cos(ry), sn = Math.sin(ry), pts = [];
    col = C.sun; al = 1; thick = true;
    for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2, u = b.u + Math.cos(a) * b.r, v = b.v + Math.sin(a) * b.r, lx = (u * 2 - 1) * o.s, lz = (v * 2 - 1) * o.s;
      pts.push([o.x + c * lx + sn * lz, o.y + hmAt(hm, u, v) * o.h + 0.02, o.z - sn * lx + c * lz]); }
    poly(pts, false); thick = false; }
  // handles on the selection
  let gizmo = null;
  if (sel && !(opt.gizmo === "sculpt" && sel.type === "terrain")) {
    const o = sel, pv = [o.x, o.y + (o.type === "terrain" ? o.h * 0.5 : 0), o.z], L = cam.dist * 0.12, c0 = proj(pv[0], pv[1], pv[2]);
    if (c0[2] > 0.2) {
      const s0 = toS(c0); gizmo = { s0, axes: [], ring: null, L, mode };
      if (mode === "rotate") { const pts = []; for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2, c = proj(pv[0] + Math.cos(a) * L, pv[1], pv[2] + Math.sin(a) * L); pts.push(c[2] > 0.1 ? toS(c) : null); }
        for (let i = 1; i < pts.length; i++) if (pts[i] && pts[i - 1]) { cv.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], C.y, 1); cv.line(pts[i - 1][0], pts[i - 1][1] + 1, pts[i][0], pts[i][1] + 1, C.y, 0.8); }
        gizmo.ring = pts.filter(Boolean); }
      else ["x", "y", "z"].forEach((ax, i) => { const e = [0, 0, 0]; e[i] = L; const c1 = proj(pv[0] + e[0], pv[1] + e[1], pv[2] + e[2]); if (c1[2] <= 0.1) return; const s1 = toS(c1);
        cv.line(s0[0], s0[1], s1[0], s1[1], C[ax], 1); cv.line(s0[0] + 1, s0[1], s1[0] + 1, s1[1], C[ax], 0.8);
        if (mode === "move") { const ang = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]); for (let k = -6; k <= 6; k++) { const a2 = ang + Math.PI - k * 0.07; cv.line(s1[0] + Math.cos(ang) * 10, s1[1] + Math.sin(ang) * 10, s1[0] + Math.cos(a2) * 4, s1[1] + Math.sin(a2) * 4, C[ax], 1); } }
        else cv.rect(s1[0] - 5, s1[1] - 5, 10, 10, C[ax]);
        gizmo.axes.push({ ax, s1 }); });
      cv.rect(s0[0] - 4, s0[1] - 4, 8, 8, C.white);
    }
  }
  // sun marker
  const az = scene.sunAz * Math.PI / 180, alt = scene.sunAlt * Math.PI / 180, sp = proj(B.ex + Math.cos(alt) * Math.sin(az) * 500, B.ey + Math.sin(alt) * 500, B.ez + Math.cos(alt) * Math.cos(az) * 500);
  if (sp[2] > 0) { const q = toS(sp); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, b = (k + 1) / 24 * Math.PI * 2; cv.line(q[0] + Math.cos(a) * 9, q[1] + Math.sin(a) * 9, q[0] + Math.cos(b) * 9, q[1] + Math.sin(b) * 9, C.sun, 1); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; cv.line(q[0] + Math.cos(a) * 12, q[1] + Math.sin(a) * 12, q[0] + Math.cos(a) * 17, q[1] + Math.sin(a) * 17, C.sun, 1); } }
  return { w: W, h: H, rgba: cv.rgba, gizmo, horizonY };
}

/* pick: nearest object centre under the pointer (screen px), or null */
function pick(scene, cam, W, H, mx, my) {
  const B = camBasis(cam, W / H), f = (H / 2) / B.tan; let best = null, bd = 60;
  for (const o of scene.objs) { const x = o.x - B.ex, y = o.y + (o.type === "terrain" ? o.h * 0.4 : 0) - B.ey, z = o.z - B.ez, cz = x * B.fx + y * B.fy + z * B.fz; if (cz <= 0.1) continue;
    const sx = W / 2 + (x * B.rx + z * B.rz) / cz * f, sy = H / 2 - (x * B.ux + y * B.uy + z * B.uz) / cz * f, d = Math.hypot(sx - mx, sy - my) - o.s / cz * f * 0.8; if (d < bd) { bd = d; best = o; } }
  return best;
}
/* which handle (if any) is under the pointer */
function pickHandle(gz, mx, my) {
  if (!gz) return null;
  const dseg = (a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], l = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((mx - a[0]) * vx + (my - a[1]) * vy) / l)); return Math.hypot(mx - a[0] - vx * t, my - a[1] - vy * t); };
  if (gz.mode === "rotate") { for (let i = 1; i < (gz.ring || []).length; i++) if (dseg(gz.ring[i - 1], gz.ring[i]) < 9) return { mode: "rotate" }; return null; }
  if (gz.mode === "scale" && Math.hypot(mx - gz.s0[0], my - gz.s0[1]) < 9) return { mode: "scale", ax: "all", u: [0, -80] };
  for (const a of gz.axes) if (dseg(gz.s0, a.s1) < 9) return { mode: gz.mode, ax: a.ax, u: [a.s1[0] - gz.s0[0], a.s1[1] - gz.s0[1]], L: gz.L };
  return null;
}
/* apply a handle drag (dx, dy in screen px since the press) to the object, from its starting copy */
function dragHandle(o, start, h, dx, dy) {
  if (h.mode === "rotate") { o.ry = Math.round(((start.ry + dx * 0.6) % 360 + 360) % 360); return; }
  const along = (dx * h.u[0] + dy * h.u[1]) / (h.u[0] * h.u[0] + h.u[1] * h.u[1] || 1);
  if (h.mode === "move") { o[h.ax] = +(start[h.ax] + along * h.L).toFixed(2); return; }
  const f = Math.max(0.05, 1 + along);
  if (h.ax !== "all" && o.type === "mesh") o["s" + h.ax] = +(start["s" + h.ax] * f).toFixed(3);
  else if (h.ax === "y" && o.type === "terrain") o.h = +(start.h * f).toFixed(2);
  else o.s = +(start.s * f).toFixed(2);
}

module.exports = { wireframe, pick, pickHandle, dragHandle };
