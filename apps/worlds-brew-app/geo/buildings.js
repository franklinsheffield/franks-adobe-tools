"use strict";
// Pixel Scape Terrain Lab: real buildings for a box (plain Node and the app window).
// Source: Overture Maps buildings (OpenStreetMap, Microsoft, Google and others merged; ODbL / CDLA), read from
// Overture's PMTiles archive with byte-range requests: outlines plus height, floors, roof and facade colours.
//   fetch(box, opt)              -> { list: [{ rings (local metres), height, base, roof, wall, kind }], tiles, credit }
//   mesh(list, dem, box, terrain, opt) -> { pos, nrm, col, idx, tris, count }  seated on the terrain mesh's heights
const P = require("./proj.js"), PM = require("./pmtiles.js"), NET = require("./net.js");

const RELEASE = "2026-11-18.0";
const ARCHIVE = (rel) => "https://overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com/tiles/" + (rel || RELEASE) + "/buildings.pmtiles";
const CREDIT = "Buildings: Overture Maps Foundation (overturemaps.org), incl. OpenStreetMap contributors (ODbL), Microsoft and Google open buildings";
const FLOOR = 3.2;   // metres per floor when only a floor count is known
const MAX_TILES = 64;

// ---- polygon helpers (2D, [x, y] points, closed rings without the repeated last point)
const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return a / 2; };
function clip(ring, edges) {   // Sutherland-Hodgman against a convex polygon given as [[ax, ay, bx, by], ...] (inside = left of a->b)
  let out = ring;
  for (const [ax, ay, bx, by] of edges) {
    if (!out.length) break;
    const inp = out, side = (p) => (bx - ax) * (p[1] - ay) - (by - ay) * (p[0] - ax); out = [];
    for (let i = 0; i < inp.length; i++) {
      const p = inp[i], q = inp[(i + 1) % inp.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
  }
  return out;
}
const edgesOf = (poly) => poly.map((p, i) => { const q = poly[(i + 1) % poly.length]; return [p[0], p[1], q[0], q[1]]; });
// MVT rings -> polygons [outer, ...holes] (outer rings have positive area in tile space, y down)
function polygons(rings) {
  const out = [];
  // MVT: exterior rings have positive area by this formula (clockwise on screen, y down), holes negative
  for (const r0 of rings) { const r = r0.slice(0, -1); if (r.length < 3) continue; const a = area(r); if (a === 0) continue; if (a > 0 || !out.length) out.push([a > 0 ? r : r.reverse()]); else out[out.length - 1].push(r); }
  return out;
}

// colours: "#rrggbb", "#rgb" or a few names -> [r, g, b]
const NAMED = { white: [236, 236, 230], black: [40, 40, 40], grey: [150, 150, 150], gray: [150, 150, 150], silver: [190, 190, 195], red: [160, 70, 60], brown: [130, 95, 70], beige: [215, 200, 170], yellow: [220, 200, 120], green: [100, 130, 90], blue: [90, 120, 160], tan: [200, 175, 140], orange: [200, 120, 70] };
function colour(s) {
  if (!s || typeof s !== "string") return null; s = s.trim().toLowerCase();
  if (NAMED[s]) return NAMED[s];
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/.exec(s); if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const WALLS = [[208, 200, 186], [196, 190, 182], [222, 214, 198], [186, 180, 172], [214, 206, 192], [176, 170, 164]];

// the height (metres above its base) of one building or part
function heightOf(p, footM2) {
  if (p.height > 0) return { h: p.height, base: p.min_height > 0 ? p.min_height : 0, known: "height" };
  if (p.num_floors > 0) return { h: p.num_floors * FLOOR + 1, base: p.min_floor > 0 ? p.min_floor * FLOOR : 0, known: "floors" };
  const c = String(p.class || p.subtype || "");
  let h = /garage|shed|carport|hut|kiosk|roof/.test(c) ? 3 : /house|detached|residential|semi|terrace|bungalow|cabin|farm/.test(c) ? 6.5 : /industrial|warehouse|commercial|retail|church|school/.test(c) ? 9 : 7;
  if (footM2 < 25) h = Math.min(h, 3); else if (footM2 > 3000 && h < 9) h = 10;
  return { h, base: 0, known: "guess" };
}

// ---- download + decode the buildings over a box
async function fetch(box, opt) {
  opt = opt || {};
  const F = P.boxFrame(box), prog = opt.progress || (() => {});
  let z = 14, a, b; for (;;) { a = P.tileXY(F.west, F.north, z); b = P.tileXY(F.east, F.south, z); if ((Math.floor(b.x) - Math.floor(a.x) + 1) * (Math.floor(b.y) - Math.floor(a.y) + 1) <= MAX_TILES || z <= 12) break; z--; }
  const list = []; for (let y = Math.floor(a.y); y <= Math.floor(b.y); y++) for (let x = Math.floor(a.x); x <= Math.floor(b.x); x++) list.push([x, y]);
  if (list.length > MAX_TILES * 4) throw new Error("This area is too big for buildings; make the box smaller.");
  const arc = PM.open(opt.url || ARCHIVE(opt.release));
  let done = 0, parts = 0, guessed = 0; const out = [], partOf = new Set(), cornersT = F.corners;
  const tiles = await NET.pool(list, 6, async ([x, y]) => { const t = await arc.tile(z, x, y); done++; prog(done / list.length, "Building tiles " + done + " / " + list.length); return t ? PM.decodeMVT(t, ["building", "building_part"]) : null; });
  // buildings that have parts are drawn from their parts (towers on podiums etc.), when the parts are there
  tiles.forEach((L) => { if (L && L.building_part) for (const f of L.building_part) if (f.props.building_id) partOf.add(f.props.building_id); });
  tiles.forEach((L, k) => {
    if (!L) return;
    const [tx, ty] = list[k], n = 2 ** z;
    // the box in this tile's 0..1 space (convex), and back: tile space -> lon / lat -> box metres
    const boxT = cornersT.map((c) => { const t = P.tileXY(c.lon, c.lat, z); return [t.x - tx, t.y - ty]; });
    if (area(boxT) < 0) boxT.reverse();
    // clip regions run the positive-area way round (then "inside" is where clip() keeps points)
    const rectE = edgesOf([[0, 0], [1, 0], [1, 1], [0, 1]]), boxE = edgesOf(boxT);
    const toLocal = (p) => { const g = P.tileLonLat(tx + p[0], ty + p[1], z), q = F.local(g.lon, g.lat); return [q.x, q.z]; };
    const onSeam = (p, q) => { const e = 1e-6; return (Math.abs(p[0]) < e && Math.abs(q[0]) < e) || (Math.abs(p[0] - 1) < e && Math.abs(q[0] - 1) < e) || (Math.abs(p[1]) < e && Math.abs(q[1]) < e) || (Math.abs(p[1] - 1) < e && Math.abs(q[1] - 1) < e); };
    for (const layer of ["building", "building_part"]) for (const f of L[layer] || []) {
      if (f.type !== 3 || f.props.is_underground) continue;
      if (layer === "building" && f.props.has_parts && partOf.has(f.props.id)) continue;
      for (const poly of polygons(f.rings)) {
        const rings = []; let seams = null;
        poly.forEach((r, ri) => {
          let c = clip(r, rectE); c = clip(c, boxE); if (c.length < 3 || Math.abs(area(c)) < 1e-12) return;
          if (ri === 0) seams = c.map((p, i) => onSeam(p, c[(i + 1) % c.length]));
          if (ri === 0 || rings.length) rings.push(c.map(toLocal));
        });
        if (!rings.length) continue;
        const foot = Math.abs(area(rings[0])); if (foot < (opt.minArea || 8)) continue;
        const hh = heightOf(f.props, foot); if (hh.known === "guess") guessed++;
        const id = String(f.props.id || f.props.building_id || out.length), roof = colour(f.props.roof_color), wall = colour(f.props.facade_color);
        out.push({ id, rings, seams, foot: Math.round(foot), height: hh.h, base: hh.base, known: hh.known, roof, wall, part: layer === "building_part", cls: f.props.class || null });
        if (layer === "building_part") parts++;
      }
    }
  });
  return { list: out, zoom: z, tiles: list.length, parts, guessed, credit: CREDIT, release: opt.release || RELEASE };
}

// ---- meshes. terrain = { h (dem heights, metres), n, lo (the terrain mesh's lowest height), exag }; photo = { w, h, d } or null
function mesh(list, dem, box, terrain, opt) {
  opt = opt || {};
  const earcut = require("earcut"), n = dem.n, H = dem.h, ex = terrain.exag || 1, lo = terrain.lo, hs = opt.scale || 1, water = terrain.water;
  const ground = (x, z) => {   // the terrain mesh's surface height (y) at box metres x, z
    const fx = Math.max(0, Math.min(n - 1, (x / box.w + 0.5) * (n - 1))), fz = Math.max(0, Math.min(n - 1, (z / box.d + 0.5) * (n - 1)));
    const i = Math.min(n - 2, Math.floor(fx)), j = Math.min(n - 2, Math.floor(fz)), ax = fx - i, az = fz - j, p = j * n + i;
    let h = (H[p] * (1 - ax) + H[p + 1] * ax) * (1 - az) + (H[p + n] * (1 - ax) + H[p + n + 1] * ax) * az; if (water != null && h < water) h = water;
    return (h - lo) * ex;
  };
  const photoAt = (x, z) => {
    const ph = opt.photo; if (!ph) return null;
    let r = 0, g = 0, b = 0, k = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const px = Math.round((x / box.w + 0.5) * ph.w + dx), py = Math.round((z / box.d + 0.5) * ph.h + dy); if (px < 0 || py < 0 || px >= ph.w || py >= ph.h) continue;
      const q = (py * ph.w + px) * 4; if (!ph.d[q + 3]) continue; r += ph.d[q]; g += ph.d[q + 1]; b += ph.d[q + 2]; k++;
    }
    return k ? [r / k, g / k, b / k] : null;
  };
  const P3 = [], C3 = [], I = [];
  const vert = (x, y, z, c) => { P3.push(x, y, z); C3.push(c[0], c[1], c[2]); return P3.length / 3 - 1; };
  // a building's ground: the lowest terrain point under it (so none float); its base sinks 1 m below that
  const bases = new Map();
  for (const b of list) { let g = Infinity; for (const p of b.rings[0]) g = Math.min(g, ground(p[0], p[1])); b._g = g; if (!b.part) bases.set(b.id, g); }
  let count = 0;
  for (const b of list) {
    const g = b.part && bases.has(b.id) ? bases.get(b.id) : b._g, y0 = (b.base > 0 ? g + b.base * hs : g - 1), y1 = g + (b.base + b.height) * hs;
    if (!(y1 > y0)) continue;
    let cx = 0, cz = 0; for (const p of b.rings[0]) { cx += p[0]; cz += p[1]; } cx /= b.rings[0].length; cz /= b.rings[0].length;
    const ph = photoAt(cx, cz), t = hash(b.id);
    const roof = b.roof || (ph ? ph.map((v) => Math.min(255, v * 1.08 + 10)) : [170, 168, 160]);
    const wall = b.wall || WALLS[Math.floor(t * WALLS.length)];
    // roof: earcut over the outline + holes (x, z), flat at y1
    const flat = [], holes = []; b.rings.forEach((r, ri) => { if (ri) holes.push(flat.length / 2); for (const p of r) flat.push(p[0], p[1]); });
    const tri = earcut(flat, holes, 2), base = P3.length / 3;
    for (let k = 0; k < flat.length; k += 2) vert(flat[k], y1, flat[k + 1], roof);
    // the rings run clockwise on screen with y down = counter-clockwise seen from above (+y) once z runs south; earcut keeps the ring's winding
    for (let k = 0; k < tri.length; k += 3) I.push(base + tri[k], base + tri[k + 2], base + tri[k + 1]);
    // walls: one quad per edge (flat-shaded: own vertices), skipping edges on a tile seam (inside the building)
    b.rings.forEach((r, ri) => {
      for (let i = 0; i < r.length; i++) {
        if (ri === 0 && b.seams && b.seams[i]) continue;
        const p = r[i], q = r[(i + 1) % r.length], shade = wall;
        const a = vert(p[0], y1, p[1], shade), c = vert(q[0], y1, q[1], shade), d = vert(p[0], y0, p[1], shade), e = vert(q[0], y0, q[1], shade);
        I.push(a, c, d, c, e, d);   // outward (rings run clockwise seen from above with z south)
      }
    });
    count++;
  }
  const pos = new Float32Array(P3), idx = new Uint32Array(I), col = new Uint8Array(C3.map((v) => Math.max(0, Math.min(255, Math.round(v)))));
  // orient every triangle outwards: roofs face +y, walls face away from their building's middle is not needed when the
  // winding above holds; normals are per vertex (walls and roofs have their own vertices, so edges stay sharp)
  const nrm = new Float32Array(pos.length);
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (const q of [a, b, c]) { nrm[q] += nx; nrm[q + 1] += ny; nrm[q + 2] += nz; }
  }
  for (let i = 0; i < nrm.length; i += 3) { const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l; }
  return { pos, nrm, col, idx, tris: idx.length / 3, count };
}

module.exports = { fetch, mesh, heightOf, colour, clip, polygons, area, ARCHIVE, RELEASE, CREDIT };
