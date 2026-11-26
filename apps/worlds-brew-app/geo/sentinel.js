"use strict";
// Pixel Scape Terrain Lab: the satellite photo for a box (plain Node).
// Source: Sentinel-2 L2A (ESA Copernicus, free incl. commercial use with credit) as Cloud-Optimised GeoTIFFs in the
// public AWS bucket sentinel-cogs (Element 84). 10 m true colour (TCI) + the scene classification (SCL) for clouds.
// Pick: list the box's Sentinel-2 tiles' scenes for the last months, rank by the scene's cloud cover, then measure
// clouds / shadows / gaps inside the box itself on the low-res SCL and keep the clearest (newest on a tie).
const P = require("./proj.js"), NET = require("./net.js"), { openCOG } = require("./tiff.js");

const BUCKET = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/", ROOT = "sentinel-s2-l2a-cogs/";
const CREDIT = (year) => "Contains modified Copernicus Sentinel data " + year + " (ESA), via the Sentinel-2 COGs on AWS (Element 84)";
const SEASONS = { Any: null, Spring: [3, 4, 5], Summer: [6, 7, 8], Autumn: [9, 10, 11], Winter: [12, 1, 2] };

const tilePath = (id) => { const m = /^(\d+)([C-X])([A-Z]{2})$/.exec(id); return String(+m[1]) + "/" + m[2] + "/" + m[3] + "/"; };
const sceneURL = (s, file) => BUCKET + ROOT + tilePath(s.tile) + s.year + "/" + s.month + "/" + s.name + "/" + file;
// "S2A_12SUE_20230606_0_L2A" -> { name, tile, date, year, month }
function parseScene(name) { const m = /^S2([ABC])_(\d+[C-X][A-Z]{2})_(\d{4})(\d{2})(\d{2})_(\d+)_L2A$/.exec(name); if (!m) return null; return { name, sat: "S2" + m[1], tile: m[2].padStart(5, "0"), year: +m[3], month: +m[4], day: +m[5], date: m[3] + "-" + m[4] + "-" + m[5], seq: +m[6] }; }

// Sentinel-2 tiles are 109.8 km squares starting at their MGRS 100 km square's west / north edge, so each spills
// 9.8 km east and south into the next square. Candidates: every square that a corner is in, and its west / north neighbours.
function tileFootprint(id) {
  const m = /^(\d+)([C-X])([A-Z])([A-Z])$/.exec(id), zone = +m[1], south = m[2] < "N";
  return { zone, south, col: m[3], row: m[4] };
}
function tilesFor(box) {
  const F = P.boxFrame(box), pts = F.corners.concat([F.at(0.5, 0.5)]), cand = new Map();
  for (const zoneLonOff of [0, -1, 1]) for (const p of pts) {
    const zone = P.utmZone(p.lon, p.lat) + zoneLonOff; if (zone < 1 || zone > 60) continue;
    const south = box.lat < 0, u = P.toUTM(p.lon, p.lat, zone, south);
    if (u.e < 100000 || u.e > 900000) continue;
    for (const [de, dn] of [[0, 0], [-100000, 0], [0, 100000], [-100000, 100000]]) {
      const e0 = Math.floor((u.e + de) / 100000) * 100000, n0 = Math.floor((u.n + dn) / 100000) * 100000;
      if (e0 < 100000 || e0 > 800000) continue;
      const sq = P.square(zone, e0 + 1, n0 + 1), id = String(zone).padStart(2, "0") + P.band(p.lat) + sq.col + sq.row;
      // UTM extent of the tile: x from e0 to e0 + 109800, y from n0 + 100000 - 109800 to n0 + 100000
      const ext = { e0, e1: e0 + 109800, n0: n0 + 100000 - 109800, n1: n0 + 100000 };
      // share of the box this tile covers (corner test + a 5 x 5 sample)
      let inside = 0; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const g = F.at(i / 4, j / 4), q = P.toUTM(g.lon, g.lat, zone, south); if (q.e >= ext.e0 && q.e <= ext.e1 && q.n >= ext.n0 && q.n <= ext.n1) inside++; }
      if (inside && (!cand.has(id) || cand.get(id).cover < inside / 25)) cand.set(id, { id, zone, south, ext, cover: inside / 25, home: zoneLonOff === 0 });
    }
  }
  return [...cand.values()].sort((a, b) => b.cover - a.cover || (b.home - a.home));
}

// the scenes of one tile, newest first, for the last `months` months before `until` (Date)
async function listScenes(tile, months, until) {
  until = until || new Date(); const out = [];
  const ym = []; for (let k = 0; k < months; k++) { const d = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth() - k, 1)); ym.push([d.getUTCFullYear(), d.getUTCMonth() + 1]); }
  const lists = await NET.pool(ym, 6, ([y, m], i) => NET.getFresh(BUCKET + "?list-type=2&prefix=" + encodeURIComponent(ROOT + tilePath(tile) + y + "/" + m + "/") + "&delimiter=%2F", i === 0 ? 86400000 : 30 * 86400000));
  for (const xml of lists) if (xml) for (const m of xml.matchAll(/<Prefix>[^<]*\/(S2[ABC]_[^/<]+_L2A)\/<\/Prefix>/g)) { const s = parseScene(m[1]); if (s) out.push(s); }
  // a re-processed scene (_1_) replaces the first one (_0_) of the same day
  const best = new Map(); for (const s of out) { const k = s.tile + s.date; if (!best.has(k) || best.get(k).seq < s.seq) best.set(k, s); }
  return [...best.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

// scene-wide cloud cover from its STAC record
async function sceneInfo(s) {
  const t = await NET.getText(sceneURL(s, s.name + ".json")); if (!t) return null;
  const j = JSON.parse(t), p = j.properties || {};
  return { cloud: p["eo:cloud_cover"], nodata: p["s2:nodata_pixel_percentage"], sun: p["view:sun_elevation"] };
}

// clouds (8, 9, 10), cloud shadow (3), snow (11, optional) and gaps (0) inside the box, from the scene classification
async function boxCloud(s, tile, box, opt) {
  const cog = await openCOG((r) => NET.get(sceneURL(s, "SCL.tif"), r));
  const F = P.boxFrame(box), res = Math.max(box.w, box.d) / 48, L = cog.levelFor(Math.max(20, res));
  const pts = []; for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) { const g = F.at((i + 0.5) / 24, (j + 0.5) / 24); pts.push(P.toUTM(g.lon, g.lat, tile.zone, tile.south)); }
  const xs = pts.map((p) => p.e), ys = pts.map((p) => p.n), W = await cog.window(L, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), NET.pool);
  let bad = 0, gap = 0;
  for (const p of pts) { const v = W.sample(p.e, p.n); const c = v ? v[0] : 0; if (c === 0) gap++; else if (c === 3 || c === 8 || c === 9 || c === 10 || (opt.noSnow && c === 11)) bad++; }
  return { cloud: bad / pts.length, gap: gap / pts.length };
}

// A low sun bakes long shadows into the photo, which look wrong once the 3D terrain is lit again: prefer a high sun.
const sunCost = (sun) => (sun == null ? 10 : Math.max(0, 65 - sun) * 0.5);
const rankScene = (i) => i.cloud * 0.6 + sunCost(i.sun);                        // scene-wide cloud %, sun height
const pickScore = (f) => (f.cloud + f.gap) * 300 + sunCost(f.sun);              // clouds over the box count most
// find the clearest scene for a box -> [{ scene, tile, cloud, gap }] best first
async function findScenes(box, opt) {
  opt = Object.assign({ months: 12, season: "Any", until: null, tries: 6 }, opt || {});
  const tiles = tilesFor(box).slice(0, 2), season = SEASONS[opt.season] || null, found = [];
  if (!tiles.length) throw new Error("No Sentinel-2 tile covers this place.");
  const prog = opt.progress || (() => {});
  for (const tile of tiles) {
    prog(0.05, "Looking for pictures of " + tile.id);
    let scenes = await listScenes(tile.id, opt.months, opt.until ? new Date(opt.until) : null);
    if (season) scenes = scenes.filter((s) => season.includes(s.month));
    if (opt.date) scenes = scenes.filter((s) => s.date === opt.date);
    const infos = await NET.pool(scenes.slice(0, 60), 8, (s) => sceneInfo(s).catch(() => null));
    const ranked = scenes.slice(0, 60).map((s, i) => ({ s, i: infos[i] })).filter((x) => x.i && x.i.cloud != null && (x.i.nodata == null || x.i.nodata < 95))
      .sort((a, b) => rankScene(a.i) - rankScene(b.i) || (a.s.date < b.s.date ? 1 : -1)).slice(0, opt.tries);
    let n = 0;
    for (const x of ranked) {
      n++; prog(0.1 + 0.4 * n / ranked.length, "Checking clouds over the box: " + x.s.date);
      try { const c = await boxCloud(x.s, tile, box, opt); found.push({ scene: x.s, tile, cloud: c.cloud, gap: c.gap, sceneCloud: x.i.cloud, sun: x.i.sun }); if (c.cloud < 0.005 && c.gap < 0.005 && !(x.i.sun < 50)) break; }
      catch (e) { /* a broken scene: skip it */ }
    }
    if (found.some((f) => f.tile === tile && f.cloud + f.gap < 0.02)) break;
  }
  return found.sort((a, b) => pickScore(a) - pickScore(b) || (a.scene.date < b.scene.date ? 1 : -1));
}

// the photo: px wide, aspect of the box, RGBA (alpha 0 where no scene covers) from the picks, first pick wins
async function photo(box, picks, px, opt) {
  opt = opt || {};
  const F = P.boxFrame(box), W = Math.max(16, Math.round(px)), H = Math.max(16, Math.round(px * box.d / box.w)), out = new Uint8Array(W * H * 4), c = [0, 0, 0];
  let left = W * H, k = 0;
  for (const pk of picks) {
    if (!left) break; k++;
    if (opt.progress) opt.progress(0.55 + 0.4 * k / picks.length, "Downloading the photo (" + pk.scene.date + ")");
    const cog = await openCOG((r) => NET.get(sceneURL(pk.scene, "TCI.tif"), r)), L = cog.levelFor(Math.max(10, Math.max(box.w / W, box.d / H)));
    const pts = F.corners.map((g) => P.toUTM(g.lon, g.lat, pk.tile.zone, pk.tile.south)), xs = pts.map((p) => p.e), ys = pts.map((p) => p.n);
    const Wn = await cog.window(L, Math.min(...xs) - 30, Math.min(...ys) - 30, Math.max(...xs) + 30, Math.max(...ys) + 30, NET.pool);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const q = (y * W + x) * 4; if (out[q + 3]) continue;
      const g = F.at((x + 0.5) / W, (y + 0.5) / H), u = P.toUTM(g.lon, g.lat, pk.tile.zone, pk.tile.south);
      if (Wn.bilinear(u.e, u.n, c) && (c[0] + c[1] + c[2]) > 0.5) { out[q] = c[0]; out[q + 1] = c[1]; out[q + 2] = c[2]; out[q + 3] = 255; left--; }
    }
  }
  return { w: W, h: H, d: out, missing: left / (W * H), credit: CREDIT(picks.length ? picks[0].scene.year : new Date().getFullYear()), dates: picks.map((p) => p.scene.date) };
}

module.exports = { tilesFor, listScenes, sceneInfo, boxCloud, findScenes, photo, parseScene, sceneURL, SEASONS, CREDIT };
