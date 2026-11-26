#!/usr/bin/env node
"use strict";
// Pixel Scape app tests:  npm test   (Linux CI: runs under xvfb-run when there is no display)
//   1. host-free: engine copy is current, scaling tools, width / height / depth stretch in the ray tracer
//   2. the real app in Electron: drag-and-drop from the Library, click-select and drag-move, Scale card,
//      camera pad, undo / redo, save and open a .wbscene, render to PNG; screenshots go to tests/out/
const path = require("path"), fs = require("fs"), os = require("os"), assert = require("assert");
const APP = path.resolve(__dirname, ".."), OUT = path.join(__dirname, "out");
let failed = 0;
async function t(name, fn) { try { await fn(); console.log("ok   " + name); } catch (e) { failed++; console.log("FAIL " + name + "\n     " + String(e && e.stack || e).split("\n").slice(0, 8).join("\n     ")); } }
const hash = (a) => { let h = 2166136261; for (let i = 0; i < a.length; i++) { h ^= a[i]; h = Math.imul(h, 16777619); } return h >>> 0; };
const { writeTIFF, writePNG, checker } = require("./pictures.js");   // tiny GeoTIFF / PNG writers for the My photo tests

(async () => {
  await t("engine/ matches plugins/worlds-brew/js and shared/ (run npm run sync)", () => { assert.deepStrictEqual(require("../tools/sync-engine.js").sync(true), []); });

  const S = require("../engine/scene.js"), E = require("../engine/engine.js"), ED = require("../engine/editor.js"), PK = require("../engine/packs.js"), SC = require("../renderer/scaletools.js");
  await t("scaling tools: real size, set height, x2, stretch with and without the proportion lock, match, reset", () => {
    const sc = S.loadPreset("Chrome Garden"), cube = S.obj("cube", 0, 1, 0, 1, "Gold"); sc.objs.push(cube); ED.dropToGround(sc, cube);
    assert.deepStrictEqual(SC.dims(cube), { w: 2, h: 2, d: 2 });
    assert.ok(/2\.00 x 2\.00 x 2\.00 m/.test(SC.sizeText(cube)) && /6\.6 x 6\.6 x 6\.6 ft/.test(SC.sizeText(cube)));
    SC.setHeight(sc, cube, 1.8, true); assert.strictEqual(SC.dims(cube).h, 1.8); assert.ok(Math.abs(cube.y - 0.9) < 0.01, "rests on the ground after resizing");
    SC.mul(sc, cube, 2, true); assert.strictEqual(SC.dims(cube).h, 3.6);
    SC.stretch(sc, cube, "w", 2, false, true); assert.deepStrictEqual([cube.sx, cube.sy, cube.sz], [2, 1, 1]);
    SC.stretch(sc, cube, "h", 2, true, true); assert.deepStrictEqual([cube.sx, cube.sy, cube.sz], [4, 2, 2], "locked: all three follow");
    assert.ok(Math.abs(cube.y - SC.dims(cube).h / 2) < 0.01, "a taller cube still stands on the ground");
    const prev = { sx: cube.sx, sy: cube.sy, sz: cube.sz }; cube.sz = 4; assert.ok(SC.applyLock(cube, prev)); assert.deepStrictEqual([cube.sx, cube.sy, cube.sz], [8, 4, 4]);
    SC.resetStretch(sc, cube, true); assert.deepStrictEqual([cube.sx, cube.sy, cube.sz], [1, 1, 1]);
    const pine = PK.put("fantasy/pine", 3, 0, 1); sc.objs.push(pine); SC.match(sc, cube, pine, true); assert.ok(Math.abs(SC.dims(cube).h - SC.dims(pine).h) < 0.01, "matched heights");
    const ter = S.obj("terrain", 0, 0, -8, 6, "Stone", { h: 3 }); assert.strictEqual(SC.dims(ter).w, 12); SC.mul(sc, ter, 2, true); assert.strictEqual(ter.s, 12); assert.strictEqual(ter.h, 6);
    assert.deepStrictEqual(SC.dims(S.light(0, 1, 0)), { w: 0, h: 0, d: 0 });
  });
  await t("ray tracer: width / height / depth stretch reshapes spheres, cubes and cylinders (and leaves unstretched ones alone)", async () => {
    for (const type of ["sphere", "cube", "cylinder", "cone", "torus"]) {
      const base = S.loadPreset("Chrome Garden"); base.objs = [S.obj(type, 0, 1, 0, 1, "Matte")]; base.cam = { yaw: 0, pitch: 5, dist: 8, fov: 45, tx: 0, ty: 1, tz: 0 };
      const a = await E.render(base, base.cam, 48, 27); base.objs[0].sx = 1; const b = await E.render(base, base.cam, 48, 27);
      assert.strictEqual(hash(a.rgba), hash(b.rgba), type + ": scale 1 is unchanged");
      base.objs[0].sx = 2.2; const c = await E.render(base, base.cam, 48, 27); assert.notStrictEqual(hash(a.rgba), hash(c.rgba), type + ": wider");
    }
    const sc = S.loadPreset("Chrome Garden"), tall = S.obj("sphere", 0, 0, 0, 1, "Matte", { sy: 3 }); ED.dropToGround(sc, tall); assert.strictEqual(tall.y, 3, "drop to ground uses the height stretch");
  });
  await t("surface layers: shared maths (place, masks, blends), presets, the ray tracer draws them, layers save and load", async () => {
    const SF = require("../engine/surface.js");
    assert.deepStrictEqual(SF.place({ tile: 2 }, 0.75, 0.5), [1, 0.5], "tile doubles around the centre");
    const rp = SF.place({ rot: 90 }, 1, 0.5); assert.ok(Math.abs(rp[0] - 0.5) < 1e-9 && Math.abs(rp[1] - 1) < 1e-9, "turn 90 degrees");
    assert.strictEqual(SF.band({ lo: 0.5, soft: 0.01 }, 0.9), 1); assert.strictEqual(SF.band({ lo: 0.5, soft: 0.01 }, 0.1), 0); assert.strictEqual(SF.band({ hi: 0.3, soft: 0.01 }, 0.9), 0);
    assert.strictEqual(SF.blendCh("Multiply", 0.5, 0.5), 0.25); assert.strictEqual(SF.blendCh("Screen", 0.5, 0.5), 0.75); assert.strictEqual(SF.blendCh("Add", 0.8, 0.5), 1);
    assert.ok(SF.presetNames().length >= 9 && SF.presetNames().every((n) => SF.preset(n).every((L) => L.img && L.img.d.length === L.img.w * L.img.h * 4)));
    const mk = () => { const sc = S.loadPreset("Chrome Garden"); sc.objs = [S.obj("cube", 0, 1, 0, 1, "Matte")]; sc.cam = { yaw: 30, pitch: 15, dist: 5, fov: 45, tx: 0, ty: 1, tz: 0 }; return sc; };
    const a = await E.render(mk(), mk().cam, 64, 36), lay = mk(); lay.objs[0].layers = SF.preset("Red bricks");
    const b = await E.render(lay, lay.cam, 64, 36); assert.notStrictEqual(hash(a.rgba), hash(b.rgba), "a layer changes the picture");
    lay.objs[0].layers[0].on = false; const c = await E.render(lay, lay.cam, 64, 36); assert.strictEqual(hash(a.rgba), hash(c.rgba), "a hidden layer changes nothing");
    lay.objs[0].layers[0].on = true; const back = S.fromJSON(JSON.parse(JSON.stringify(S.toJSON(lay))));
    const L0 = back.objs[0].layers[0]; assert.strictEqual(L0.bump, 1); assert.strictEqual(hash(L0.img.d), hash(lay.objs[0].layers[0].img.d), "the picture survives save and open");
    const d = await E.render(back, back.cam, 64, 36); assert.strictEqual(hash(b.rgba), hash(d.rgba));
  });
  await t("design tokens: renderer/tokens.css comes from tokens/brew-tokens.json and the app's mint is the suite's worlds-brew glow", () => {
    const tok = require("../../../tokens/brew-tokens.json"), hex = tok.color.glow["worlds-brew"].$value.hex.toLowerCase();
    assert.ok(new RegExp('GLOW = "' + hex + '"', "i").test(fs.readFileSync(path.join(APP, "renderer/app.js"), "utf8")), "app.js GLOW matches the token");
    const css = fs.readFileSync(path.join(APP, "renderer/tokens.css"), "utf8"); assert.ok(css.includes("--tk-glow-hex: " + hex) && /--mint-l: 0\.90\d; --mint-c: 0\.15\d; --mint-h: 16\d\.\d/.test(css));
    assert.ok(/href="tokens.css"[\s\S]*href="app.css"/.test(fs.readFileSync(path.join(APP, "renderer/index.html"), "utf8")), "tokens load before app.css");
  });
  await t("the starter pack doubled: 52 models and 10 maps", () => {
    assert.strictEqual(PK.assets("Fantasy").length + PK.assets("Alien").length, 52);
    assert.strictEqual(PK.PACKS.reduce((n, p) => n + Object.keys(PK.MAPS[p]).length, 0), 10);
  });

  await t("Terrain Lab maths: lon/lat to tiles and UTM, Sentinel-2 tile names, scene names", () => {
    const P = require("../geo/proj.js"), SN = require("../geo/sentinel.js");
    assert.deepStrictEqual([P.mgrsTile(-112.13, 36.075), P.mgrsTile(151.21, -33.87), P.mgrsTile(2.35, 48.86)].map((x) => x.id), ["12SUE", "56HLH", "31UDQ"]);
    const u = P.toUTM(-112.13, 36.075, 12, false), back = P.fromUTM(u.e, u.n, 12, false); assert.ok(Math.abs(back.lon + 112.13) < 1e-6 && Math.abs(back.lat - 36.075) < 1e-6, "UTM round trip");
    const t = P.tileXY(-112.13, 36.075, 12), ll = P.tileLonLat(t.x, t.y, 12); assert.ok(Math.abs(ll.lon + 112.13) < 1e-9 && Math.abs(ll.lat - 36.075) < 1e-9, "web tiles round trip");
    const F = P.boxFrame({ lat: 36.075, lon: -112.13, w: 10000, d: 8000, turn: 0 }), c = F.at(0.5, 0.5);
    assert.ok(Math.abs(c.lon + 112.13) < 1e-6 && Math.abs(c.lat - 36.075) < 1e-6 && F.north > F.south && F.east > F.west, "box frame centred, north up");
    assert.strictEqual(SN.tilesFor({ lat: 36.075, lon: -112.13, w: 12600, d: 10000, turn: 0 })[0].id, "12SUE");
    assert.deepStrictEqual(SN.parseScene("S2C_12SUE_20260819_1_L2A"), { name: "S2C_12SUE_20260819_1_L2A", sat: "S2C", tile: "12SUE", year: 2026, month: 8, day: 19, date: "2026-08-19", seq: 1 });
    assert.strictEqual(SN.sceneURL(SN.parseScene("S2A_09UXA_20250601_0_L2A"), "TCI.tif"), "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/9/U/XA/2025/6/S2A_09UXA_20250601_0_L2A/TCI.tif");
  });
  await t("Terrain Lab heights + mesh: terrarium tiles decode to metres, the mesh is real scale with an earth-layer base, the .glb and heightmap are valid", async () => {
    const NET = require("../geo/net.js"), DEM = require("../geo/dem.js"), B = require("../geo/build.js"), PNGX = require("../geo/png.js"), M = require("../engine/models.js");
    // fake terrarium tiles: height = 1000 m + 2 m per pixel eastwards (no network)
    const get0 = NET.get; NET.get = async (url) => { const d = new Uint8Array(256 * 256 * 4); for (let i = 0; i < 65536; i++) { const v = 1000 + (i & 255) * 2 + 32768; d[i * 4] = v >> 8; d[i * 4 + 1] = v & 255; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; } return PNGX.encodeRGBA(256, 256, d); };
    try {
      const box = { lat: 36.075, lon: -112.13, w: 3000, d: 3000, turn: 0 }, dem = await DEM.heights(box, 33);
      assert.ok(dem.min >= 1000 && dem.max <= 1510 && dem.max > dem.min, "heights in metres: " + dem.min + ".." + dem.max);
      const m = B.grid(dem, box, { n: 33, exag: 1, smooth: 0, water: null, base: "skirt" });
      assert.strictEqual(m.w, 3000); assert.ok(m.idx.every((i) => i < m.pos.length / 3), "indices in range"); assert.ok(m.tris > 32 * 32 * 2, "top + walls + floor: " + m.tris);
      let lo = Infinity, hi = -Infinity; for (let i = 1; i < m.pos.length; i += 3) { lo = Math.min(lo, m.pos[i]); hi = Math.max(hi, m.pos[i]); } assert.ok(hi - lo > dem.max - dem.min, "the base goes below the lowest ground");
      const pic = { w: 32, h: 32, d: new Uint8Array(32 * 32 * 4).fill(200) }, banded = B.addBand(pic); assert.strictEqual(banded.w, 32); assert.ok(banded.h > 32 && banded.d.length === 32 * banded.h * 4, "earth band rows added");
      const flat = B.grid(dem, box, { n: 33, exag: 1, base: "none" }); assert.ok(flat.tris === 32 * 32 * 2, "no base: just the ground");
      const jpg = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AN//Z", "base64");
      const g = B.glb(m, { bytes: new Uint8Array(jpg), mime: "image/jpeg" }, "Test"), ab = g.buffer.slice(g.byteOffset, g.byteOffset + g.byteLength), back = M.parseGLB(ab, "Test.glb");
      assert.strictEqual(back.tris, m.tris, "the .glb reads back"); assert.deepStrictEqual(M.gltfImages("Test.glb", ab).map((x) => x.mime), ["image/jpeg"], "the photo is inside");
      const hp = require("../engine/pngdec.js").decodePNG(PNGX.encodeGray16(dem.n, dem.n, B.heightValues(dem))); assert.ok(hp.gray16 && hp.gray16[dem.n - 1] === 65535 && hp.gray16[0] === 0, "16-bit heightmap, white = highest");
    } finally { NET.get = get0; }
  });
  await t("Terrain Lab heights: bad source pixels (spikes and garbage patches) are repaired, real slopes are left alone", () => {
    const DEM = require("../geo/dem.js"), n = 64, h = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h[j * n + i] = 10 + i * 0.5;   // a gentle slope
    const ok = Float32Array.from(h);
    h[10 * n + 10] = -9000; h[20 * n + 30] = 4000; h[21 * n + 31] = -700;   // spikes
    for (let j = 50; j < n; j++) for (let i = 40; i < n; i++) h[j * n + i] = -13000 + i;   // a garbage corner
    const fixed = DEM.fillHoles(h, n, 50) + DEM.despike(h, n, 50);
    let worst = 0; for (let i = 0; i < h.length; i++) worst = Math.max(worst, Math.abs(h[i] - ok[i]));
    assert.ok(fixed > 300 && worst < 15, "repaired: " + fixed + " samples, worst error " + worst.toFixed(1) + " m");
    const cliff = new Float32Array(n * n); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) cliff[j * n + i] = i < 32 ? 0 : 30;
    const c2 = Float32Array.from(cliff); assert.strictEqual(DEM.fillHoles(c2, n, 50) + DEM.despike(c2, n, 50), 0, "a real 30 m step is kept");
  });
  await t("Terrain Lab buildings: a PMTiles archive + vector tile decode to outlines with heights, meshes sit on the ground, roofs face up, the .glb carries them", async () => {
    const NET = require("../geo/net.js"), PM = require("../geo/pmtiles.js"), BL = require("../geo/buildings.js"), P = require("../geo/proj.js"), B = require("../geo/build.js"), M = require("../engine/models.js");
    // a tiny vector tile: layer "building" with one 40 x 40 unit square (height 30 m) and one 20 x 20 square with 5 floors
    const vi = (n) => { const o = []; do { let b = n & 0x7f; n = Math.floor(n / 128); if (n) b |= 0x80; o.push(b); } while (n); return o; };
    const fld = (f, bytes) => [...vi((f << 3) | 2), ...vi(bytes.length), ...bytes], str = (f, s) => fld(f, [...Buffer.from(s)]), zz = (n) => (n << 1) ^ (n >> 31);
    const box = { lat: 33.4484, lon: -112.074, w: 400, d: 400, turn: 0 }, z = 14, c = P.tileXY(box.lon, box.lat, z), tx = Math.floor(c.x), ty = Math.floor(c.y);
    const cx = Math.round((c.x - tx) * 4096), cy = Math.round((c.y - ty) * 4096);
    const square = (x0, y0, s) => { const pts = [[x0, y0], [x0 + s, y0], [x0 + s, y0 + s], [x0, y0 + s]]; let px = 0, py = 0; const g = [1 | (1 << 3)];   // plain command / parameter integers (feat() writes them as varints)
      pts.forEach((p, i) => { if (i === 1) g.push(2 | (3 << 3)); g.push(zz(p[0] - px), zz(p[1] - py)); px = p[0]; py = p[1]; }); g.push(7 | (1 << 3)); return g; };
    const feat = (tags, geom) => fld(2, [...fld(2, tags.flatMap(vi)), 3 << 3, 3, ...fld(4, geom.flatMap(vi))]);
    const layer = [15 << 3 | 0, 2, ...str(1, "building"), ...feat([0, 0, 1, 1], square(cx - 20, cy - 20, 40)), ...feat([2, 2], square(cx + 60, cy, 20)),
      ...str(3, "height"), ...str(3, "roof_color"), ...str(3, "num_floors"), ...fld(4, [3 << 3 | 1, ...new Uint8Array(new Float64Array([30]).buffer)]), ...fld(4, str(1, "#ff0000")), ...fld(4, [4 << 3, 5]), 5 << 3, ...vi(4096)];
    const tile = Buffer.from(fld(3, layer));
    // the archive: header, root directory (one entry), the tile; no compression
    const id = PM.zxyToId(z, tx, ty), dir = Buffer.from([...vi(1), ...vi(id), ...vi(1), ...vi(tile.length), ...vi(1)]), hdr = Buffer.alloc(127);
    hdr.write("PMTiles", 0, "latin1"); hdr[7] = 3; const w64 = (o, v) => hdr.writeBigUInt64LE(BigInt(v), o);
    w64(8, 127); w64(16, dir.length); w64(24, 127 + dir.length); w64(32, 0); w64(40, 127 + dir.length); w64(48, 0); w64(56, 127 + dir.length); w64(64, tile.length); hdr[97] = 1; hdr[98] = 1; hdr[99] = 1; hdr[100] = 0; hdr[101] = 14;
    const arc = Buffer.concat([hdr, dir, tile]), get0 = NET.get; NET.get = async (url, r) => arc.subarray(r[0], Math.min(arc.length, r[1] + 1));
    try {
      const L = PM.decodeMVT(tile); assert.strictEqual(L.building.length, 2); assert.deepStrictEqual(L.building[0].props, { height: 30, roof_color: "#ff0000" }); assert.strictEqual(L.building[0].rings[0].length, 5, "closed ring");
      const r = await BL.fetch(box, { url: "test://b.pmtiles" });
      assert.strictEqual(r.list.length, 2, "both buildings inside the box"); const [a, b] = r.list;
      assert.ok(a.foot > 300 && a.foot < 600, "about 20 x 20 m: " + a.foot); assert.deepStrictEqual([a.height, a.known, a.roof], [30, "height", [255, 0, 0]]); assert.deepStrictEqual([b.height, b.known], [5 * 3.2 + 1, "floors"]);
      assert.strictEqual(BL.heightOf({ class: "garage" }, 20).known, "guess"); assert.deepStrictEqual(BL.colour("#abc"), [170, 187, 204]);
      // on a slope: 100 m at the west edge up to 140 m at the east
      const n = 9, h = new Float32Array(n * n); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h[j * n + i] = 100 + 40 * i / (n - 1);
      const dem = { n, h, min: 100, max: 140, z, pixelM: 50 }, m = BL.mesh(r.list, dem, box, { lo: 100, exag: 1 }, {});
      assert.strictEqual(m.count, 2); assert.ok(m.idx.every((i) => i < m.pos.length / 3));
      let top = -1e9, up = 0, down = 0; for (let i = 1; i < m.pos.length; i += 3) top = Math.max(top, m.pos[i]);
      for (let k = 0; k < m.idx.length; k += 3) { const ny = m.nrm[m.idx[k] * 3 + 1]; if (ny > 0.99) up++; if (ny < -0.99) down++; }
      assert.ok(up > 0 && down === 0, "roofs face up, nothing faces down: " + up + "/" + down); assert.ok(top > 30 && top < 30 + 40, "the 30 m tower sits on the slope: " + top);
      const g = B.glb(B.grid(dem, box, { n, base: "none" }), null, "T", { buildings: m }), back = M.parseGLB(g.buffer.slice(g.byteOffset, g.byteOffset + g.byteLength), "T.glb");
      assert.strictEqual(back.tris, (n - 1) * (n - 1) * 2 + m.tris, "terrain + buildings in the .glb");
    } finally { NET.get = get0; }
  });
  await t(".glb with a JPEG texture: decoded pictures are used, and one texture over the model is handed back", () => {
    const B = require("../geo/build.js"), M = require("../engine/models.js");
    const dem = { n: 3, h: new Float32Array(9), min: 0, max: 0, z: 1, pixelM: 1 }, m = B.grid(dem, { w: 10, d: 10 }, { n: 3, base: "none" });
    const g = B.glb(m, { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), mime: "image/jpeg" }, "J"), ab = g.buffer.slice(g.byteOffset, g.byteOffset + g.byteLength);
    const red = { w: 2, h: 2, rgba: new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]) };
    const a = M.parseGLB(ab, "J.glb"), b = M.parseGLB(ab, "J.glb", { decoded: { 0: red } });
    assert.ok(!a.texture, "undecodable JPEG: no texture"); assert.ok(b.texture && b.texture.w === 2 && b.texture.d[0] === 255, "decoded JPEG becomes the texture");
    assert.ok(b.tc && b.tc[0] === 255 && b.tc[1] === 0, "triangle colours come from the decoded picture");
  });

  await t("My photo (0.13): GeoTIFFs (plain / LZW / deflate + predictor / tiled) decode and land at their map position; world files, .prj, pins and drone GPS place photos", () => {
    const MP = require("../geo/myphoto.js"), P = require("../geo/proj.js"), w = 60, h = 40, rgb = checker(w, h, 10);
    const geo = { sx: 2, sy: 2, x0: 399000, y0: 3993000, epsg: 32612 };   // UTM 12N, 2 m pixels, near the Grand Canyon
    for (const o of [{ comp: 1 }, { comp: 5 }, { comp: 8, pred: 2 }, { comp: 8, tile: 16 }, { comp: 5, pred: 2, tile: 32 }]) {
      const r = MP.decodeTIFF(writeTIFF(Object.assign({ w, h, rgb, geo }, o)));
      assert.deepStrictEqual([r.w, r.h, r.geo.epsg], [w, h, 32612], JSON.stringify(o));
      let bad = 0; for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) if (r.d[i * 4 + c] !== rgb[i * 3 + c]) bad++;
      assert.strictEqual(bad, 0, "every pixel right: " + JSON.stringify(o)); assert.deepStrictEqual(r.geo.wf, [2, 0, 0, -2, 399001, 3992999], "world file points at pixel centres");
    }
    // where it lands: the photo's corner is the tiepoint, pixels go both ways
    const r = MP.decodeTIFF(writeTIFF({ w, h, rgb, comp: 8, geo })), pl = MP.placement({ kind: "world", wf: r.geo.wf, crs: MP.crsFromEPSG(r.geo.epsg) }, r.w, r.h);
    const c0 = pl.pxToLonLat(0, 0), u = P.toUTM(c0.lon, c0.lat, 12, false); assert.ok(Math.abs(u.e - 399000) < 0.01 && Math.abs(u.n - 3993000) < 0.01, "top-left corner at the tiepoint");
    const g = pl.pxToLonLat(25.5, 10.5), back = pl.lonlatToPx(g.lon, g.lat); assert.ok(Math.abs(back[0] - 25.5) < 1e-4 && Math.abs(back[1] - 10.5) < 1e-4, "round trip (to 0.2 mm)");
    assert.ok(Math.abs(pl.mpp - 2) < 0.01, "2 m pixels: " + pl.mpp);
    // shrunk on loading: every 2nd pixel, still in the same place
    const s = MP.decodeTIFF(writeTIFF({ w, h, rgb, comp: 1, geo }), 30), ps = MP.placement({ kind: "world", wf: s.geo.wf, crs: MP.crsFromEPSG(32612) }, s.w, s.h);
    assert.deepStrictEqual([s.w, s.h, s.shrink], [30, 20, 2]); const a = ps.pxToLonLat(7.5, 4.5), b = pl.pxToLonLat(14.5, 8.5); assert.ok(Math.abs(a.lon - b.lon) < 1e-9 && Math.abs(a.lat - b.lat) < 1e-9, "shrunk pixel 7 = source pixel 14");
    // world files and projections
    assert.deepStrictEqual(MP.worldFile("2.0\n0\n0\n-2.0\n399001\n3992999\n"), [2, 0, 0, -2, 399001, 3992999]); assert.strictEqual(MP.worldFile("hello"), null);
    assert.deepStrictEqual(MP.crsFromPrj('PROJCS["WGS 84 / UTM zone 12N",GEOGCS["WGS 84"],UNIT["metre",1],AUTHORITY["EPSG","32612"]]'), { kind: "utm", zone: 12, south: false, epsg: 32612 });
    assert.strictEqual(MP.crsFromPrj('PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984"]]').kind, "merc"); assert.strictEqual(MP.crsFromPrj('GEOGCS["GCS_WGS_1984"]').kind, "ll");
    assert.deepStrictEqual([MP.guessCRS(-112.1, 36.07).kind, MP.guessCRS(399000, 3993000, -112.1, 36.07).zone, MP.guessCRS(-12480000, 4310000).kind], ["ll", 12, "merc"]);
    for (const crs of [{ kind: "merc" }, { kind: "ll" }, { kind: "utm", zone: 12, south: false }]) { const [X, Y] = MP.toCRS(-112.115, 36.0728, crs), q = MP.fromCRS(X, Y, crs); assert.ok(Math.abs(q.lon + 112.115) < 1e-7 && Math.abs(q.lat - 36.0728) < 1e-7, crs.kind); }
    // pins: 2 = move / turn / size, 3 = stretch too, 4+ = perspective; a known map is found again, and the miss is reported once there are spare pins
    const pin = (u, v) => { const q = pl.pxToLonLat(u, v); return { u, v, lon: q.lon, lat: q.lat }; }, P5 = [pin(3, 4), pin(55, 6), pin(50, 35), pin(6, 33), pin(30, 20)];
    for (const [k, kind] of [[2, "similar"], [3, "affine"], [4, "perspective"], [5, "perspective"]]) {
      const q = MP.placement({ kind: "pins", pins: P5.slice(0, k) }, w, h), t2 = pl.pxToLonLat(40, 12), uv = q.lonlatToPx(t2.lon, t2.lat);
      assert.strictEqual(q.kind, kind); assert.ok(Math.hypot(uv[0] - 40, uv[1] - 12) < 0.05, kind + " finds the map again: " + uv); assert.ok(Math.abs(q.mpp - 2) < 0.02, kind + " 2 m pixels");
      assert.ok(k === 5 ? q.rms < 0.01 : q.rms === null, "miss reported only with spare pins");
    }
    // the photo over a box: alpha 0 outside, the photo's own colours inside, coverage about right (120 x 80 m of a 400 x 400 m box = 6%)
    const ctr = pl.pxToLonLat(30, 20), box = { lat: ctr.lat, lon: ctr.lon, w: 400, d: 400, turn: 0 }, out = MP.render(pl, box, 200, 200, r);
    assert.ok(Math.abs(out.cover - 0.06) < 0.01, "cover " + out.cover); assert.strictEqual(out.d[3], 0, "outside the photo stays see-through");
    const mid = (100 * 200 + 100) * 4; assert.ok(out.d[mid + 3] === 255, "inside is solid");
    // drone photo: DJI-style JPEG with GPS in EXIF and height / gimbal in XMP; 100 m up with a 24 mm lens sees 150 m across
    const T = Buffer.alloc(128); T.write("II*\0", 0, "latin1"); T.writeUInt32LE(8, 4); T.writeUInt16LE(1, 8); T.writeUInt16LE(0x8825, 10); T.writeUInt16LE(4, 12); T.writeUInt32LE(1, 14); T.writeUInt32LE(26, 18);
    const ge = (i, tag, type, n, v) => { const o = 28 + i * 12; T.writeUInt16LE(tag, o); T.writeUInt16LE(type, o + 2); T.writeUInt32LE(n, o + 4); if (typeof v === "string") T.write(v, o + 8, "latin1"); else T.writeUInt32LE(v, o + 8); };
    T.writeUInt16LE(4, 26); ge(0, 1, 2, 2, "N\0"); ge(1, 2, 5, 3, 80); ge(2, 3, 2, 2, "W\0"); ge(3, 4, 5, 3, 104);
    [[36, 1], [4, 1], [2208, 100], [112, 1], [6, 1], [5400, 100]].forEach(([n, d], i) => { T.writeUInt32LE(n, 80 + i * 8); T.writeUInt32LE(d, 84 + i * 8); });   // 36 4' 22.08" N, 112 6' 54" W
    const app1 = (body) => { const b = Buffer.alloc(4); b[0] = 0xff; b[1] = 0xe1; b.writeUInt16BE(body.length + 2, 2); return Buffer.concat([b, body]); };
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8]), app1(Buffer.concat([Buffer.from("Exif\0\0", "latin1"), T])),
      app1(Buffer.from('http://ns.adobe.com/xap/1.0/\0<x drone-dji:GimbalPitchDegree="-90.0" drone-dji:RelativeAltitude="+100.00" drone-dji:GimbalYawDegree="+30.0"/>', "latin1")), Buffer.from([0xff, 0xd9])]);
    const ex = MP.readEXIF(jpg); assert.ok(Math.abs(ex.lat - 36.0728) < 1e-6 && Math.abs(ex.lon + 112.115) < 1e-6, "GPS read"); assert.deepStrictEqual([ex.pitch, ex.relAlt, ex.yaw], [-90, 100, 30]);
    const cs = MP.droneCorners(ex, 400, 300), across = (p, q) => { const r2 = P.radii(p.lat); return Math.hypot((q.lon - p.lon) * P.D2R * r2.N * Math.cos(p.lat * P.D2R), (q.lat - p.lat) * P.D2R * r2.M); };
    assert.ok(Math.abs(across(cs[0], cs[1]) - 150) < 0.5 && Math.abs(across(cs[1], cs[2]) - 112.5) < 0.5, "150 x 112.5 m on the ground");
    assert.ok(cs[1].lat < cs[0].lat, "turned 30 degrees: the top edge runs south-east"); assert.strictEqual(MP.droneCorners(Object.assign({}, ex, { pitch: -45 }), 400, 300), null, "angled shots need pins");
  });
  // ---- the app itself
  if (process.env.WB_SKIP_UI) { console.log("skip UI tests (WB_SKIP_UI)"); return done(); }
  if (process.platform === "linux" && !process.env.DISPLAY) {   // re-run under a virtual display
    const r = require("child_process").spawnSync("xvfb-run", ["-a", "-s", "-screen 0 1600x1000x24", process.execPath, __filename, "--ui-only"], { stdio: "inherit" });
    failed += r.status ? 1 : 0; return done();
  }
  await uiTests();
  done();
})();
function done() { console.log(failed ? failed + " failed" : "all passed"); process.exit(failed ? 1 : 0); }

async function uiTests() {
  if (process.argv.includes("--ui-only")) failed = 0;
  const { _electron: electron } = require("playwright");
  fs.mkdirSync(OUT, { recursive: true });
  const args = [APP, "--no-sandbox"].concat(process.platform === "linux" ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : []);
  const app = await electron.launch({ executablePath: require(path.join(APP, "node_modules/electron")), args });
  const win = await app.firstWindow(), errors = [];
  win.on("pageerror", (e) => errors.push(e.message)); win.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1500, 940));
  await win.waitForFunction(() => !!window.__wb, null, { timeout: 60000 }); await win.waitForTimeout(800);
  const W = (fn, arg) => win.evaluate(fn, arg);
  const centre = () => W(() => { const r = document.getElementById("vp").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });

  await t("app: window, live viewport, Library, Inspector and render bar are up, with no script errors", async () => {
    assert.ok(await W(() => !!document.querySelector("#vp") && document.querySelectorAll(".wbtile").length === 9 + 52), "9 shapes + 52 models in the Add card");
    assert.ok(await W(() => document.querySelectorAll(".wbcell").length === 22), "22 scenes");
    const px = await W(() => { const c = document.getElementById("vp"); window.__wb.vp.draw(); const g = c.getContext("webgl2", { preserveDrawingBuffer: true }); const p = new Uint8Array(4); g.readPixels(c.width >> 1, c.height >> 1, 1, 1, g.RGBA, g.UNSIGNED_BYTE, p); return Array.from(p); });
    assert.ok(px[0] + px[1] + px[2] > 30, "the GPU view draws something: " + px);
    await win.screenshot({ path: path.join(OUT, "app-start.png") });
    assert.deepStrictEqual(errors, []);
  });
  await t("app: drag a model from the Library into the view; it lands where it is dropped, standing on the ground", async () => {
    await W(() => { const w = window.__wb; w.loadScene(w.S.loadPreset("Chrome Garden")); w.st.view.addPack = "Fantasy"; w.changed("val"); });
    const n0 = await W(() => window.__wb.st.scene.objs.length);
    const target = await W(() => { const w = window.__wb; w.vp.draw(); return w.vp.project(-3, 0, 2.5); });
    await W(({ x, y }) => { const tile = [...document.querySelectorAll(".wbtile")].find((t) => t.__key === "asset:fantasy/knight"), dt = new DataTransfer(), wrap = document.getElementById("vpwrap");
      tile.dispatchEvent(new DragEvent("dragstart", { dataTransfer: dt, bubbles: true }));
      wrap.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, clientX: x, clientY: y, bubbles: true, cancelable: true }));
      wrap.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, clientX: x, clientY: y, bubbles: true, cancelable: true })); }, target);
    const o = await W(() => { const s = window.__wb.st.sel; return { n: window.__wb.st.scene.objs.length, asset: s.asset, x: s.x, z: s.z, h: window.__wb.SC.dims(s).h, y: s.y }; });
    assert.strictEqual(o.n, n0 + 1); assert.strictEqual(o.asset, "fantasy/knight");
    assert.ok(Math.hypot(o.x + 3, o.z - 2.5) < 0.2, "landed at the drop point: " + o.x + ", " + o.z);
    await win.screenshot({ path: path.join(OUT, "app-dropped-knight.png") });
  });
  await t("app: click an object to select it, then drag it across the ground", async () => {
    await W(() => { const w = window.__wb; w.st.view.gizmo = "move"; w.changed("view"); });
    const p = await W(() => { const w = window.__wb, o = w.st.scene.objs.find((q) => q.type === "cube"); w.select(null); w.vp.draw(); return Object.assign(w.vp.project(o.x, o.y, o.z), { x0: o.x, z0: o.z, id: o.id }); });
    await win.mouse.move(p.x, p.y); await win.mouse.down();
    for (let i = 1; i <= 10; i++) { await win.mouse.move(p.x - i * 12, p.y + i * 4); await win.waitForTimeout(16); }
    await win.mouse.up();
    const o = await W((id) => { const w = window.__wb, q = w.st.scene.objs.find((x) => x.id === id); return { sel: w.st.sel === q, x: q.x, z: q.z, y: q.y, s: q.s }; }, p.id);
    assert.ok(o.sel, "selected"); assert.ok(Math.hypot(o.x - p.x0, o.z - p.z0) > 0.5, "moved"); assert.ok(Math.abs(o.y - o.s) < 0.02, "still on the ground");
  });
  await t("app: Scale card (x2, real height, Person, lock) and the R handles", async () => {
    await win.locator(".tabbtn", { hasText: "Scale" }).click();
    const s0 = await W(() => window.__wb.st.sel.s);
    await win.locator("#insp [role=button]", { hasText: "x2" }).click();
    assert.strictEqual(await W(() => window.__wb.st.sel.s), +(s0 * 2).toFixed(3));
    await win.locator("#insp [role=button]", { hasText: "Person" }).click();
    assert.strictEqual(await W(() => window.__wb.SC.dims(window.__wb.st.sel).h), 1.8);
    await win.screenshot({ path: path.join(OUT, "app-scale-card.png") });
    await win.keyboard.press("r"); assert.strictEqual(await W(() => window.__wb.st.view.gizmo), "scale");
    assert.ok(await W(() => window.__wb.vp.tc.mode === "scale" && !!window.__wb.vp.tc.object), "scale handles on the selection");
    await win.keyboard.press("w");
  });
  await t("app: camera pad and view buttons move the camera; Lock camera stops them", async () => {
    const y0 = await W(() => window.__wb.st.scene.cam.yaw);
    await win.locator(".wbpad", { hasText: "CAMERA" }).locator("[role=button]", { hasText: ">" }).first().click();
    assert.notStrictEqual(await W(() => window.__wb.st.scene.cam.yaw), y0);
    await win.locator("#pad [role=button]", { hasText: "Top" }).click(); assert.strictEqual(await W(() => window.__wb.st.scene.cam.pitch), 89);
    await win.locator("#pad [role=button]", { hasText: "Frame all" }).click();
    const c = await centre(); const d0 = await W(() => window.__wb.st.scene.cam.dist); await win.mouse.move(c.x, c.y); await win.mouse.wheel(0, -400); await win.waitForTimeout(100);
    assert.ok(await W(() => window.__wb.st.scene.cam.dist) < d0, "wheel zooms in");
    await W(() => { window.__wb.st.view.camLock = true; }); const y1 = await W(() => window.__wb.st.scene.cam.yaw);
    await win.locator(".wbpad", { hasText: "CAMERA" }).locator("[role=button]", { hasText: ">" }).first().click();
    assert.strictEqual(await W(() => window.__wb.st.scene.cam.yaw), y1); await W(() => { window.__wb.st.view.camLock = false; });
    await W(() => window.__wb.CT.camView(window.__wb.st.scene.cam, "three")); await W(() => window.__wb.changed("view"));
  });
  await t("app: undo / redo", async () => {
    const n = await W(() => window.__wb.st.scene.objs.length);
    await W(() => window.__wb.addThing("shape:torus"));
    assert.strictEqual(await W(() => window.__wb.st.scene.objs.length), n + 1);
    await W(() => window.__wb.undo()); assert.strictEqual(await W(() => window.__wb.st.scene.objs.length), n);
    await W(() => window.__wb.redo()); assert.strictEqual(await W(() => window.__wb.st.scene.objs.length), n + 1);
  });
  const file = path.join(os.tmpdir(), "wb-test-" + process.pid + ".wbscene");
  await t("app: save a .wbscene and open it again (models, sizes and the camera come back)", async () => {
    await W((f) => { window.__wb.filePath = f; return window.__wb.save(false); }, file);
    assert.ok(fs.existsSync(file) && fs.statSync(file).size > 1000);
    const before = await W(() => window.__wb.st.scene.objs.map((o) => [o.type, o.asset || "", +o.s.toFixed(3), +o.x.toFixed(2)]).join(";"));
    await W(() => { const w = window.__wb; w.loadScene(w.S.loadPreset("Snow Peaks")); });
    await W((f) => window.__wb.openScene(f), file);
    assert.strictEqual(await W(() => window.__wb.st.scene.objs.map((o) => [o.type, o.asset || "", +o.s.toFixed(3), +o.x.toFixed(2)]).join(";")), before);
    assert.strictEqual(await W(() => window.__wb.dirty), false);
    fs.unlinkSync(file);
  });
  await t("app: Render PNG (draft) shows the result and keeps a valid PNG", async () => {
    await W(() => { const w = window.__wb; w.st.out.w = 240; w.st.out.h = 135; w.st.out.quality = "draft"; });
    await W(() => window.__wb.renderNow());
    await win.waitForFunction(() => !document.getElementById("shot").hidden, null, { timeout: 60000 });
    await win.screenshot({ path: path.join(OUT, "app-render-result.png") });
    await win.keyboard.press("Escape");
    const sig = await W(() => Array.from(document.getElementById("shotimg").src.slice(0, 22)).join(""));
    assert.strictEqual(sig, "data:image/png;base64,");
  });
  await t("app: Ctrl+K command palette finds and runs actions (search 'top view', 'add knight')", async () => {
    await win.locator("#vp").click({ position: { x: 5, y: 5 } }).catch(() => {});
    await win.keyboard.press("Control+k");
    assert.ok(await W(() => window.__wb.pal.isOpen), "palette opens");
    assert.ok(await W(() => window.__wb.commands().length) > 120, "covers files, tools, views, tabs, sky, water, every asset and scene");
    await win.keyboard.type("top view");
    assert.strictEqual(await win.locator(".palrow.on .pall").textContent(), "Top view");
    await win.screenshot({ path: path.join(OUT, "app-palette.png") });
    await win.keyboard.press("Enter");
    assert.ok(!(await W(() => window.__wb.pal.isOpen)), "closes after running");
    assert.strictEqual(await W(() => window.__wb.st.scene.cam.pitch), 89);
    const n = await W(() => window.__wb.st.scene.objs.length);
    await win.keyboard.press("Control+k"); await win.keyboard.type("knight"); await win.keyboard.press("Enter");
    assert.strictEqual(await W(() => window.__wb.st.scene.objs.length), n + 1);
    assert.strictEqual(await W(() => window.__wb.st.sel.asset), "fantasy/knight");
    await win.keyboard.press("Control+k"); await win.keyboard.press("Escape"); assert.ok(!(await W(() => window.__wb.pal.isOpen)), "Esc closes");
  });
  await t("app: view ball: smooth axis snaps, same axis again = opposite, drag orbits, ZOOM / PAN / FRAME / HOME, camera lock; key hints", async () => {
    await W(() => { const w = window.__wb; w.st.scene.cam.yaw = 30; w.st.scene.cam.pitch = 20; w.changed("view"); });
    assert.strictEqual(await win.locator(".axisgizmo .agaxis").count(), 6);
    const cam = () => W(() => { const c = window.__wb.st.scene.cam; return [c.yaw, c.pitch, c.dist, c.tx, c.ty, c.tz]; });
    const click = async (sel) => { const n = win.locator(sel); await n.dispatchEvent("pointerdown", { clientX: 5, clientY: 5 }); await n.dispatchEvent("pointerup", { clientX: 5, clientY: 5 }); };
    const settle = () => win.waitForTimeout(450);
    await click('.axisgizmo .agaxis[data-axis="+X"]');
    const mid = await cam(); assert.ok(mid[0] !== 90 || mid[1] !== 6, "snap is animated, not instant");
    await settle(); assert.deepStrictEqual((await cam()).slice(0, 2), [90, 6]);
    await click('.axisgizmo .agaxis[data-axis="+X"]'); await settle(); assert.deepStrictEqual((await cam()).slice(0, 2), [270, 6], "same end again: opposite view");
    await click('.axisgizmo .agaxis[data-axis="+Y"]'); await settle(); assert.strictEqual((await cam())[1], 89);
    await click('.axisgizmo .agaxis[data-axis="+Z"]'); await settle(); assert.deepStrictEqual((await cam()).slice(0, 2), [0, 6]);
    // drag the ball: orbit
    const ball = win.locator(".axisgizmo");
    await ball.dispatchEvent("pointerdown", { clientX: 100, clientY: 100 });
    for (let i = 1; i <= 5; i++) { await ball.dispatchEvent("pointermove", { clientX: 100 + i * 6, clientY: 100 + i * 2 }); }
    await win.waitForTimeout(200); await ball.dispatchEvent("pointerup", { clientX: 130, clientY: 110 }); await win.waitForTimeout(600);
    const o = await cam(); assert.ok(Math.abs(((o[0] + 540) % 360) - 180) > 40 && o[1] > 6, "dragging the ball orbits: " + o);
    // ZOOM drag + click, PAN drag, FRAME, HOME
    const zb = win.locator('.agb[data-nav="zoom"]'), d0 = (await cam())[2];
    await zb.dispatchEvent("pointerdown", { clientX: 50, clientY: 50 }); await zb.dispatchEvent("pointermove", { clientX: 50, clientY: 10 }); await zb.dispatchEvent("pointerup", { clientX: 50, clientY: 10 });
    assert.ok((await cam())[2] < d0 * 0.8, "drag up zooms in");
    const d1 = (await cam())[2]; await click('.agb[data-nav="zoom"]'); assert.ok(Math.abs((await cam())[2] - d1 * 0.85) < 0.02, "click zooms one step");
    const pb = win.locator('.agb[data-nav="pan"]'), t0 = await cam();
    await pb.dispatchEvent("pointerdown", { clientX: 50, clientY: 50 }); await pb.dispatchEvent("pointermove", { clientX: 90, clientY: 50 }); await pb.dispatchEvent("pointerup", { clientX: 90, clientY: 50 });
    const t1 = await cam(); assert.ok(Math.hypot(t1[3] - t0[3], t1[5] - t0[5]) > 0.01 && t1[0] === t0[0], "pan slides the target, no turn");
    await W(() => { const w = window.__wb; w.select(w.st.scene.objs.find((x) => x.type === "cube")); });
    await click('.agb[data-nav="frame"]'); const fr = await W(() => { const w = window.__wb, c = w.st.scene.cam, s = w.st.sel; return Math.hypot(c.tx - s.x, c.tz - s.z); }); assert.ok(fr < 0.01, "frame centres the selection");
    await click('.agb[data-nav="home"]'); assert.ok(await W(() => { const w = window.__wb, c = w.st.scene.cam, h = w.homeCam; return ["yaw", "pitch", "dist", "tx", "ty", "tz"].every((k) => c[k] === h[k]); }), "HOME restores the opening view");
    await W(() => window.__wb.select(null));
    // camera lock: the ball can't move the camera
    await W(() => { window.__wb.st.view.camLock = true; }); const lk = await cam();
    await click('.axisgizmo .agaxis[data-axis="-Z"]'); await settle(); await click('.agb[data-nav="zoom"]'); assert.deepStrictEqual(await cam(), lk, "camera lock holds");
    await W(() => { window.__wb.st.view.camLock = false; });
    await W(() => { const w = window.__wb; w.CT.camView(w.st.scene.cam, "three"); w.select(w.st.scene.objs.find((o) => o.type === "cube")); });
    const k1 = await win.locator(".keyhints").textContent(); assert.ok(/nudge/.test(k1) && /Del/.test(k1), "selection hints: " + k1);
    await W(() => window.__wb.select(null)); const k2 = await win.locator(".keyhints").textContent(); assert.ok(/select next/.test(k2) && !/nudge/.test(k2), "no-selection hints: " + k2);
    await W(() => { const w = window.__wb; w.st.view.gizmo = "sculpt"; w.changed("view"); }); assert.ok(/sculpt terrain/.test(await win.locator(".keyhints").textContent()));
    await W(() => { const w = window.__wb; w.st.view.gizmo = "move"; w.select(w.st.scene.objs.find((o) => o.type === "cube")); w.changed("view"); });
    await win.screenshot({ path: path.join(OUT, "app-view-ball.png") });
  });
  await t("app: Surfaces tab: presets add layers, the live GPU view shows them, undo takes them off", async () => {
    const px = () => W(() => { const w = window.__wb, c = document.getElementById("vp"); w.vp.draw(); const g = c.getContext("webgl2", { preserveDrawingBuffer: true }), p = new Uint8Array(4); g.readPixels(c.width >> 1, c.height >> 1, 1, 1, g.RGBA, g.UNSIGNED_BYTE, p); return Array.from(p); });
    await W(() => { const w = window.__wb, S = w.S; w.loadScene(S.loadPreset("Chrome Garden")); const sc = w.st.scene; sc.objs = []; const cube = S.obj("cube", 0, 1, 0, 1.2, "Matte"); sc.objs.push(cube); w.select(cube); sc.cam = { yaw: 0, pitch: 8, dist: 5, fov: 45, tx: 0, ty: 1.2, tz: 0 }; w.changed("view"); w.commit(); });
    const before = await px();
    await W(() => { window.__wb.commands().find((c) => c.label === "Surfaces tab").run(); window.__wb.commands().find((c) => c.label === "Add preset: Neon grid").run(); });
    assert.strictEqual(await W(() => window.__wb.st.sel.layers.length), 1);
    assert.ok(await W(() => document.querySelectorAll(".wblayers .wbobj").length === 1), "the layer is listed");
    await W(() => { window.__wb.st.sel.layers[0].opacity = 100; window.__wb.st.sel.layers[0].blend = "Normal"; window.__wb.st.sel.layers[0].tile = 0.13; window.__wb.changed("val"); });   // big grid: the centre is a dark cell
    const after = await px(); assert.ok(Math.abs(after[0] - before[0]) + Math.abs(after[1] - before[1]) + Math.abs(after[2] - before[2]) > 40, "the view shows the layer: " + before + " -> " + after);
    await win.screenshot({ path: path.join(OUT, "app-surfaces.png") });
    await W(() => window.__wb.undo()); assert.ok(!(await W(() => (window.__wb.st.sel.layers || []).length)), "undo takes the layer off");
  });
  await t("app: GPU render (Draft and Final) with Depth, Object mask and Sky mask passes; ray tracer still works", async () => {
    for (const [engine, quality] of [["gpu", "draft"], ["gpu", "final"], ["ray", "draft"]]) {
      await W(([e, q]) => { const w = window.__wb; Object.assign(w.st.out, { engine: e, quality: q, w: e === "gpu" ? 320 : 96, h: e === "gpu" ? 180 : 54 }); return w.renderNow(); }, [engine, quality]);
      const info = await W(() => { const r = window.__wb.refs.lastRender; const ids = new Set(r.ids); return { w: r.w, h: r.h, n: r.rgba.length, objs: Array.from(ids).filter((i) => i >= 0).length, sky: Array.from(ids).includes(-1), tabs: Array.from(document.querySelectorAll("#shot .shotrow > *")).map((b) => b.textContent.trim()) }; });
      assert.strictEqual(info.n, info.w * info.h * 4, engine + " " + quality + " picture size");
      assert.ok(info.objs >= 1 && info.sky, engine + " " + quality + " passes see the object and the sky");
      assert.deepStrictEqual(info.tabs.slice(1, 5), ["Render", "Depth", "Object mask", "Sky mask"]);
    }
    await win.screenshot({ path: path.join(OUT, "app-gpu-render.png") });
    await win.keyboard.press("Escape"); await W(() => { document.getElementById("shot").hidden = true; });
  });
  await t("app: Photoshop bridge: Send to Photoshop writes the render + passes; Match document size and Send layer from the panel reach the app", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "wbl-"));
    try {
      await W((r) => { const w = window.__wb; w.refs.bridgeWatch && w.refs.bridgeWatch.stop(); w.BR.setRoot(r); w.refs.bridgeWatch = w.BR.watch({ every: 200, docSize: (j) => { w.st.out.w = j.w; w.st.out.h = j.h; }, picture: (p) => { w.refs.psPic = p; } }); }, root);
      await W(() => { const w = window.__wb; w.refs.lastPics = null; Object.assign(w.st.out, { engine: "gpu", quality: "draft", w: 160, h: 90 }); return w.sendToPhotoshop(); });
      const base = path.join(root, "Pixel Scape"), latest = JSON.parse(fs.readFileSync(path.join(base, "Renders/latest.json"), "utf8")), dir = path.join(base, "Renders", latest.folder);
      assert.deepStrictEqual(["depth.png", "info.json", "mask.png", "render.png", "sky.png"], fs.readdirSync(dir).sort());
      const info = JSON.parse(fs.readFileSync(path.join(dir, "info.json"), "utf8")); assert.deepStrictEqual([info.w, info.h, info.engine], [160, 90, "gpu"]);
      await W(() => { document.getElementById("shot").hidden = true; });
      await new Promise((r) => setTimeout(r, 400));
      fs.mkdirSync(path.join(base, "Bridge/Pictures"), { recursive: true });
      fs.writeFileSync(path.join(base, "Bridge/doc-size.json"), JSON.stringify({ worldsBrewBridge: 1, w: 3000, h: 2000, doc: "poster.psd", time: Date.now() }));
      const PNG = require("../engine/kit/png.js"); fs.writeFileSync(path.join(base, "Bridge/Pictures/brick.png"), PNG.encodePNG(new Uint8Array(8 * 8 * 4).fill(180), 8, 8, 4));
      fs.writeFileSync(path.join(base, "Bridge/picture.json"), JSON.stringify({ worldsBrewBridge: 1, file: "brick.png", name: "Brick wall", w: 8, h: 8, time: Date.now() }));
      await win.waitForFunction(() => window.__wb.st.out.w === 3000 && !!window.__wb.refs.psPic, null, { timeout: 5000 });
      assert.strictEqual(await W(() => window.__wb.st.out.h), 2000);
      const n = await W(async () => { const w = window.__wb, S = w.S, c = S.obj("cube", 0, 1, 0, 1, "Matte"); w.st.scene.objs.push(c); w.select(c); await w.commands().find((x) => x.label === "Add the picture from Photoshop").run(); await new Promise((r) => setTimeout(r, 100)); return [c.layers.length, c.layers[0].img.name, c.layers[0].img.w]; });
      assert.deepStrictEqual(n, [1, "Brick wall", 8]);
    } finally { await W(() => { const w = window.__wb; w.refs.bridgeWatch && w.refs.bridgeWatch.stop(); }); fs.rmSync(root, { recursive: true, force: true }); }
  });
  await t("app: My library: import texture / heightmap / shader files and folders, GLSL bakes the same everywhere, PBR folder, 16-bit heightmap, save terrain", async () => {
    const zlib = require("zlib"), PNGE = require("../engine/kit/png.js");
    const crc = (b) => PNGE.crc32(b, 0, b.length), chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td) >>> 0); return Buffer.concat([len, td, c]); };
    const png16 = (w, h, f) => { const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 16; ih[9] = 0; const raw = Buffer.alloc(h * (w * 2 + 1));
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw.writeUInt16BE(f(x, y), y * (w * 2 + 1) + 1 + x * 2);
      return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]); };
    const png8 = (w, h, f) => { const px = new Uint8Array(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.set(f(x, y).concat([255]), (y * w + x) * 4); return Buffer.from(PNGE.encodePNG(px, w, h, 4)); };
    const docs = fs.mkdtempSync(path.join(os.tmpdir(), "wblib-")), src = fs.mkdtempSync(path.join(os.tmpdir(), "wbsrc-"));
    fs.mkdirSync(path.join(src, "pics", "more"), { recursive: true });
    fs.writeFileSync(path.join(src, "pics", "red.png"), png8(8, 8, () => [255, 0, 0]));
    fs.writeFileSync(path.join(src, "pics", "more", "checker.png"), png8(8, 8, (x, y) => ((x + y) & 1 ? [255, 255, 255] : [0, 0, 0])));
    fs.writeFileSync(path.join(src, "pics", "notes.txt"), "not a picture");
    fs.writeFileSync(path.join(src, "dune16.png"), png16(64, 64, (x, y) => Math.round(65535 * Math.sin(x / 63 * Math.PI) * Math.sin(y / 63 * Math.PI))));
    fs.writeFileSync(path.join(src, "gradient.frag"), "void mainImage(out vec4 fragColor, in vec2 fragCoord) { vec2 uv = fragCoord / iResolution.xy; fragColor = vec4(uv.x, 0.25 + 0.5 * sin(iTime), 0.8, 1.0); }\n");
    fs.writeFileSync(path.join(src, "sandbox.glsl"), "uniform float time; uniform vec2 resolution; void main() { gl_FragColor = vec4(gl_FragCoord.y / resolution.y, 0.0, 0.0, 1.0); }\n");
    fs.writeFileSync(path.join(src, "broken.glsl"), "void mainImage(out vec4 c, in vec2 p) { c = nothingHere; }\n");
    fs.mkdirSync(path.join(src, "Brick set"));
    fs.writeFileSync(path.join(src, "Brick set", "brick_basecolor.png"), png8(16, 16, () => [180, 70, 50]));
    fs.writeFileSync(path.join(src, "Brick set", "brick_height.png"), png8(16, 16, (x, y) => (y % 4 === 0 ? [0, 0, 0] : [255, 255, 255])));
    fs.writeFileSync(path.join(src, "Brick set", "brick_roughness.png"), png8(16, 16, () => [204, 204, 204]));
    fs.writeFileSync(path.join(src, "Brick set", "brick_normal.png"), png8(16, 16, () => [128, 128, 255]));
    await W((d) => { const w = window.__wb; w.LIB.setRoot(d); }, docs);
    await W(() => { const w = window.__wb; w.loadScene(w.S.loadPreset("Chrome Garden")); });
    const lib = path.join(docs, "Pixel Scape", "Library");
    assert.ok(["Textures", "Terrains", "Shaders"].every((k) => fs.existsSync(path.join(lib, k))), "library folders made");
    // import: a folder of pictures (sub-folder flattened, text file skipped), shaders (files + a material folder), a heightmap
    const r1 = await W((p) => window.__wb.importPathsToLibrary("Textures", [p]), path.join(src, "pics"));
    assert.deepStrictEqual(r1.added.sort(), ["checker", "red"]); assert.deepStrictEqual(r1.skipped, []);
    const r2 = await W((ps) => window.__wb.importPathsToLibrary("Shaders", ps), [path.join(src, "gradient.frag"), path.join(src, "sandbox.glsl"), path.join(src, "broken.glsl"), path.join(src, "Brick set")]);
    assert.strictEqual(r2.added.length, 4);
    const r3 = await W((p) => window.__wb.importPathsToLibrary("Terrains", [p]), path.join(src, "dune16.png")); assert.deepStrictEqual(r3.added, ["dune16"]);
    const again = await W((p) => window.__wb.importPathsToLibrary("Textures", [p]), path.join(src, "pics", "red.png")); assert.deepStrictEqual(again.added, ["red 2"], "never overwrites");
    // the grid shows them; a shader that doesn't compile is marked
    await W(() => { const w = window.__wb; w.st.view.myKind = "Shaders"; w.uis.forEach((u) => u.refreshAll()); return w.refs.drawMyLib(); });
    await win.waitForTimeout(300);
    assert.strictEqual(await win.locator(".wbmylib .wblibitem").count(), 4);
    assert.strictEqual(await win.locator(".wbmylib .wblibitem.bad").count(), 1, "broken shader marked: " + JSON.stringify(await W(() => Array.from(document.querySelectorAll(".wbmylib .wblibitem.bad")).map((n) => n.dataset.lib + " " + n.dataset.err))));
    // a texture on the selected sphere (a surface layer)
    const it = (kind, name) => W(([k, n]) => window.__wb.LIB.list(k).find((x) => x.name === n), [kind, name]);
    await W(() => { const w = window.__wb; w.select(w.st.scene.objs.find((o) => o.type === "sphere")); });
    const tex = await it("Textures", "red"); await W(async (x) => { await window.__wb.applyLibItem(x, null, null); }, tex);
    assert.deepStrictEqual(await W(() => { const L = window.__wb.st.lay; return [L.name, L.img.w, L.img.d[0], L.img.d[1]]; }), ["red", 8, 255, 0]);
    // GLSL (Shadertoy): baked to a picture, red runs left to right; Time re-bakes; undo keeps the code
    const gl = await it("Shaders", "gradient"); await W(async (x) => { await window.__wb.applyLibItem(x, null, null); }, gl);
    const px = await W(() => { const L = window.__wb.st.lay, d = L.img.d, w = L.img.w; return [L.img.w, !!L.shader, d[0], d[(w - 1) * 4], d[1]]; });
    assert.strictEqual(px[0], 512); assert.ok(px[1], "code kept on the layer"); assert.ok(px[2] < 8 && px[3] > 247, "red ramps left to right: " + px);
    assert.ok(Math.abs(px[4] - 64) < 4, "iTime 0: green 0.25");
    await W(() => { const w = window.__wb; w.st.lay.shader.t = 1.5708; w.uis.forEach((u) => u.refreshAll()); });
    await W(() => { const w = window.__wb; w.rebakeShader(); });
    assert.ok(Math.abs(await W(() => window.__wb.st.lay.img.d[1]) - 191) < 4, "iTime pi/2: green 0.75");
    // GLSL-sandbox style
    const sb = await it("Shaders", "sandbox"); await W(async (x) => { await window.__wb.applyLibItem(x, null, null); }, sb);
    const sbp = await W(() => { const L = window.__wb.st.lay, d = L.img.d, w = L.img.w, h = L.img.h; return [d[0], d[((h - 1) * w) * 4]]; }); assert.ok(sbp[0] > 247 && sbp[1] < 8, "top row bright, bottom row dark: " + sbp);
    // a broken shader: nothing added, the error is in the status bar
    const nL = await W(() => window.__wb.st.sel.layers.length);
    const bad = await it("Shaders", "broken"); await W(async (x) => { await window.__wb.applyLibItem(x, null, null); }, bad);
    assert.strictEqual(await W(() => window.__wb.st.sel.layers.length), nL); assert.ok(/Shader error/.test(await win.locator(".status").textContent()));
    // PBR folder: colour layer with shine from the roughness map + a Relief layer from the height map
    const pbr = await it("Shaders", "Brick set"); await W(async (x) => { await window.__wb.applyLibItem(x, null, null); }, pbr);
    const pl = await W(() => window.__wb.st.sel.layers.slice(-2).map((L) => [L.blend, L.shine, L.rough, L.bump]));
    assert.deepStrictEqual(pl, [["Normal", true, 0.8, 0], ["Relief", false, 0.5, 1]]);
    // Relief leaves colour alone (ray tracer maths)
    const SFm = require("../engine/surface.js"); assert.strictEqual(SFm.BLENDS.includes("Relief"), true);
    // 16-bit heightmap on the selected terrain: smooth steps survive
    await W(() => { const w = window.__wb; w.select(w.st.scene.objs.find((o) => o.type === "terrain")); });
    const dune = await it("Terrains", "dune16"); await W(async (x) => { await window.__wb.applyLibItem(x, null, null); }, dune);
    const hm = await W(() => { const o = window.__wb.st.sel, d = o.hmap.d, set = new Set(); for (const v of d) set.add(Math.round(v * 65535)); return [o.hmap.name, set.size, window.__wb.S.heightmap(o).top > 0.3]; });
    assert.strictEqual(hm[0], "dune16"); assert.ok(hm[1] > 300, "more than 256 levels: " + hm[1]); assert.ok(hm[2], "it has height");
    // save it (scene file keeps the map), and to the library
    const back = await W(() => { const w = window.__wb, sc = w.S.fromJSON(w.S.toJSON(w.st.scene)), t = sc.objs.find((o) => o.hmap); return t && t.hmap.d.length; }); assert.strictEqual(back, 96 * 96);
    await W(async () => { const w = window.__wb; const n = await w.LIB.saveTerrain(w.st.sel, "My dune"); return n; });
    assert.ok(fs.existsSync(path.join(lib, "Terrains", "My dune.wbterrain")));
    const saved = await it("Terrains", "My dune"); await W(async (x) => { await window.__wb.applyLibItem(x, null, { x: 6, y: 0, z: 2 }); }, saved);
    assert.deepStrictEqual(await W(() => { const o = window.__wb.st.sel; return [o.type, o.hmap.name, o.x, o.z]; }), ["terrain", "My dune", 6, 2], "a new terrain where it was dropped");
    await W(() => { const w = window.__wb; w.st.view.myKind = "Textures"; w.uis.forEach((u) => u.refreshAll()); return w.refs.drawMyLib(); });
    await W(() => { const w = window.__wb; w.select(w.st.scene.objs.find((o) => o.type === "sphere")); w.CT.frame(w.st.scene, w.st.sel); w.changed("view"); });
    await win.waitForTimeout(400); await win.screenshot({ path: path.join(OUT, "app-my-library.png") });
  });
  await t("app: Terrain Lab (TL-11) opens, builds a terrain from heights, saves it to My library / Terrains, adds it to the scene and rebuilds it from the library", async () => {
    await W(() => { const w = window.__wb; w.loadScene(w.S.loadPreset("Chrome Garden")); w.openTerrainLab(); });
    await win.waitForTimeout(400);
    assert.ok(await W(() => window.__wb.TL().isOpen && !!document.querySelector("#tlab canvas")), "the Terrain Lab screen is up");
    // a made-up place (no network in tests): a 4 x 3 km dome, 200 m to 900 m
    const r = await W(async () => {
      const T = window.__wb.TL(), n = 65, h = new Float32Array(n * n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = i / (n - 1) - 0.5, y = j / (n - 1) - 0.5; h[j * n + i] = 200 + 700 * Math.max(0, 1 - 3 * (x * x + y * y)); }
      T.tl.name = "Test Dome"; T.tl.base = "skirt"; T.tl.bld = "on"; T.tl.bMin = 8;
      // two made-up buildings near the top of the dome: a 60 m tower and a shed (left out by "Smallest")
      const sq = (x, z, s) => [[[x - s, z - s], [x + s, z - s], [x + s, z + s], [x - s, z + s]]];
      const buildings = { release: "test", credit: "Buildings: test", list: [{ id: "a", rings: sq(0, 0, 50), seams: null, foot: 10000, height: 60, base: 0, known: "height", roof: null, wall: null, part: false },
        { id: "b", rings: sq(300, 0, 1), seams: null, foot: 4, height: 3, base: 0, known: "guess", roof: null, wall: null, part: false }] };
      T.st.data = { dem: { n, h, min: 200, max: 900, z: 12, pixelM: 30, source: "test", credit: "test" }, photo: null, picks: [], box: { lat: 36, lon: -112, w: 4000, d: 3000, turn: 0 }, full: true, key: "test", buildings };
      T.remesh(); const folder = await T.saveToLibrary(); T.st.folder = folder; const n0 = window.__wb.st.scene.objs.length; T.addToScene(); T.close();
      const o = window.__wb.st.sel, bo = window.__wb.st.scene.objs[window.__wb.st.scene.objs.length - 1];
      return { added: window.__wb.st.scene.objs.length - n0, bname: bo.mesh && bo.mesh.name, bcount: T.st.bmesh && T.st.bmesh.count, folder, tris: T.st.mesh.tris, type: o && o.type, layer: o && o.layers && o.layers[0] && o.layers[0].name, layerH: o && o.layers[0].img.h, s: o && o.s };
    });
    assert.deepStrictEqual([r.added, r.bname, r.bcount], [2, "Test Dome buildings", 1], "terrain + its buildings (the shed is below Smallest)");
    for (const f of ["terrain.glb", "height16.png", "photo.jpg", "thumb.jpg", "terrain.json", "buildings.json"]) assert.ok(fs.existsSync(path.join(r.folder, f)), f + " saved");
    const j = JSON.parse(fs.readFileSync(path.join(r.folder, "terrain.json"), "utf8")); assert.deepStrictEqual([j.sizeM, j.heightM, j.mesh.base], [{ w: 4000, d: 3000 }, { min: 200, max: 900 }, "skirt"]);
    assert.strictEqual(j.buildings.count, 1); assert.ok(j.credits.includes("Buildings: test"), "buildings credited");
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(r.folder, "buildings.json"), "utf8")).list.length, 1, "buildings.json keeps what is shown");
    assert.strictEqual(r.type, "mesh"); assert.strictEqual(r.layer, "Satellite photo"); assert.strictEqual(r.s, 20, "shown 40 m wide"); assert.ok(r.tris > 64 * 64 * 2);
    const item = await W(() => window.__wb.LIB.list("Terrains").find((x) => x.type === "geo" && x.name === "Test Dome")); assert.ok(item, "listed in My library / Terrains");
    const n0 = await W(() => window.__wb.st.scene.objs.length); await W(async (x) => { await window.__wb.applyLibItem(x, null, { x: 5, y: 0, z: 5 }); }, item);
    assert.deepStrictEqual(await W(() => { const w = window.__wb, o = w.st.sel; return [w.st.scene.objs.length, o.type, o.layers[0].name, o.layers[0].img.h > o.layers[0].img.w * 3 / 4]; }), [n0 + 2, "mesh", "Satellite photo", true], "rebuilt from the library with the earth band under the photo, and its buildings");
    await win.waitForTimeout(400); await win.screenshot({ path: path.join(OUT, "app-terrain-lab.png") });
  });
  await t("app: My photo (0.13): a GeoTIFF lands by itself, so does a PNG with its world file and .prj, the pin aligner pins it, and the photo goes on the terrain and into terrain.json", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "px-myphoto-")), w = 60, h = 40, rgb = checker(w, h, 10);
    fs.writeFileSync(path.join(dir, "gc.tif"), writeTIFF({ w, h, rgb, comp: 5, geo: { sx: 2, sy: 2, x0: 399000, y0: 3993000, epsg: 32612 } }));
    fs.writeFileSync(path.join(dir, "fine.tif"), writeTIFF({ w, h, rgb, comp: 8, geo: { sx: 0.25, sy: 0.25, x0: 399055, y0: 3992965, epsg: 32612 } }));
    fs.writeFileSync(path.join(dir, "gc.png"), writePNG(w, h, rgb)); fs.writeFileSync(path.join(dir, "gc.pgw"), "2\n0\n0\n-2\n399001\n3992999\n");
    fs.writeFileSync(path.join(dir, "gc.prj"), 'PROJCS["WGS 84 / UTM zone 12N",GEOGCS["WGS 84"],AUTHORITY["EPSG","32612"]]');
    const c = require("../geo/myphoto.js").fromCRS(399060, 3992960, { kind: "utm", zone: 12, south: false });   // the photo's middle
    const r = await W(async ({ dir, c }) => {
      const w = window.__wb; w.openTerrainLab(); const T = w.TL(), n = 33, wait = () => new Promise((ok) => setTimeout(ok, 250));
      Object.assign(T.tl, { lat: c.lat, lon: c.lon, wKm: 0.4, dKm: 0.4, turn: 0, photo: "sat", bld: "off", name: "My photo test" });
      T.st.data = { dem: { n, h: new Float32Array(n * n).fill(2000), min: 2000, max: 2000, z: 15, pixelM: 12, source: "test", credit: "test" }, photo: null, picks: [], box: T.box(), full: true, key: T.dataKey(), buildings: null };
      T.remesh();
      // a spot 11 m east and 9 m north of the middle is photo pixel (35, 15): a blue square of the checker
      const at = () => { const p = T.st.pic, x = Math.floor(p.w / 2 + 11 / 400 * p.w), y = Math.floor(p.h / 2 - 9 / 400 * p.h), o = (y * p.w + x) * 4; return [p.d[o], p.d[o + 1], p.d[o + 2]]; };
      const out = { before: at() };
      await T.myp.load([dir + "/gc.tif"]); await wait();
      out.tif = { desc: T.myp.describe(), photo: T.tl.photo, cover: T.st.my.cover, px: at(), data: !!T.st.data };
      await T.myp.load([dir + "/gc.png"]); await wait();
      out.png = { desc: T.myp.describe(), px: at() };
      const pl = T.st.my.place, pin = T.myp.openPins(); out.overlay = !!document.querySelector(".tlpin canvas");
      for (const [u, v] of [[5, 5], [55, 8], [30, 36]]) { const g = pl.pxToLonLat(u, v); pin.add(u, v, g.lon, g.lat); }
      out.pinInfo = document.querySelector(".tlpininfo").textContent; pin.finish(true); await wait();
      out.pinned = { desc: T.myp.describe(), px: at(), overlayGone: !document.querySelector(".tlpin") };
      const f = await T.files("x"); out.info = f.info.myPhoto; out.credit = f.info.credits[0];
      // 0.14: a sharper photo makes a sharper texture (25 cm pixels over 400 m = 1600 px, not the 256 px picture under it)
      out.w0 = T.st.pic.w; await T.myp.load([dir + "/fine.tif"]); await wait(); out.fine = { w: T.st.pic.w, h: T.st.pic.h, desc: T.myp.describe() };
      return out;
    }, { dir, c });
    const blue = (p) => p[0] < 70 && p[1] < 80 && p[2] > 170;
    assert.ok(!blue(r.before), "height colours before the photo: " + r.before);
    assert.ok(/placed from its map position \(EPSG 32612\), 2\.0 m pixels/.test(r.tif.desc), r.tif.desc); assert.strictEqual(r.tif.photo, "my"); assert.ok(r.tif.data, "no new download needed");
    assert.ok(Math.abs(r.tif.cover - 0.06) < 0.01, "120 x 80 m of a 400 m box: " + r.tif.cover); assert.ok(blue(r.tif.px), "the photo is on the terrain: " + r.tif.px);
    assert.ok(/gc\.pgw/.test(r.png.desc) && !/guessed/.test(r.png.desc), "PNG placed by its world file + .prj: " + r.png.desc); assert.ok(blue(r.png.px), "PNG on the terrain: " + r.png.px);
    assert.ok(r.overlay && /3 pins: stretch/.test(r.pinInfo), r.pinInfo); assert.ok(/pinned \(3 pins, stretch\)/.test(r.pinned.desc) && r.pinned.overlayGone, r.pinned.desc); assert.ok(blue(r.pinned.px), "pinned photo on the terrain");
    assert.deepStrictEqual([r.info.file, r.info.placed], ["gc.png", "affine pins"]); assert.ok(Math.abs(parseFloat(r.info.coversBox) - 6) < 1, r.info.coversBox); assert.ok(/^Photo: gc\.png \(your own picture\)/.test(r.credit), r.credit);
    assert.ok(r.w0 <= 512 && r.fine.w === 1600 && r.fine.h === 1600, "texture follows the photo's sharpness: " + r.w0 + " -> " + r.fine.w + " x " + r.fine.h + " (" + r.fine.desc + ")");
    await win.waitForTimeout(300); await win.screenshot({ path: path.join(OUT, "app-my-photo.png") });
    assert.strictEqual(await W(() => { const T = window.__wb.TL(); T.tl.photo = "tint"; T.changed(); const i = T.myp.info(); T.close(); return i; }), null, "Heights leaves the photo out");
  });
  await t("app: the centre (XYZ) scale handle sizes smoothly from the pointer (it used to blow models up)", async () => {
    const r = await W(() => {
      const w = window.__wb, o = w.st.scene.objs.find((q) => q.type === "sphere"), node = w.vp.world.nodes.get(o).node, s0 = o.s, mv = (y) => window.dispatchEvent(new PointerEvent("pointermove", { clientY: y }));
      mv(500); w.vp.hooks.onGizmoDrag(true, o); w.vp.tc.axis = "XYZ"; mv(499); w.vp.hooks.onGizmoChange(o, node, "scale"); const tiny = o.s;
      mv(350); w.vp.hooks.onGizmoChange(o, node, "scale"); const up = o.s; mv(650); w.vp.hooks.onGizmoChange(o, node, "scale"); const down = o.s;
      w.vp.tc.axis = null; w.vp.hooks.onGizmoDrag(false, o); return { s0, tiny, up, down };
    });
    assert.ok(Math.abs(r.tiny / r.s0 - 1) < 0.02, "1 px is a tiny change: " + JSON.stringify(r)); assert.ok(Math.abs(r.up / r.s0 - 2) < 0.01, "150 px up doubles"); assert.ok(Math.abs(r.down / r.s0 - 0.5) < 0.01, "150 px down halves");
  });
  await t("app: a .glb with a JPEG texture imports with its picture; a folder of several PBR sets imports each set", async () => {
    const r = await W(async () => {
      const w = window.__wb, B = window.require("../geo/build.js"), c = document.createElement("canvas"); c.width = c.height = 8; const g = c.getContext("2d"); g.fillStyle = "#ff0000"; g.fillRect(0, 0, 8, 4); g.fillStyle = "#0000ff"; g.fillRect(0, 4, 8, 4);
      const jpg = new Uint8Array(await (await new Promise((res) => c.toBlob(res, "image/jpeg", 0.95))).arrayBuffer());
      const dem = { n: 5, h: new Float32Array(25), min: 0, max: 0, z: 1, pixelM: 1 }, m = B.grid(dem, { w: 10, d: 10 }, { n: 5, base: "none" }), glb = B.glb(m, { bytes: jpg, mime: "image/jpeg" }, "Jpeg test");
      await w.importModelData("Jpeg test.glb", glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength)); const o = w.st.sel, tc = o.mesh.tc;
      let red = 0, blue = 0; for (let i = 0; i < tc.length; i += 3) { if (tc[i] > 200 && tc[i + 2] < 60) red++; if (tc[i + 2] > 200 && tc[i] < 60) blue++; }
      return { name: o.mesh.name, layer: o.layers && o.layers[0] && o.layers[0].name, w: o.layers && o.layers[0].img.w, red, blue };
    });
    assert.strictEqual(r.layer, "Model texture"); assert.strictEqual(r.w, 8); assert.ok(r.red > 0 && r.blue > 0, "the texture colours reach the mesh: " + JSON.stringify(r));
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "wbpbr-")), PNGE = require("../engine/kit/png.js");
    for (const s of ["Rock A", "Rock B", "Moss"]) { fs.mkdirSync(path.join(parent, "sets", s), { recursive: true }); const px = new Uint8Array(4 * 4 * 4).fill(120);
      fs.writeFileSync(path.join(parent, "sets", s, s.replace(" ", "_") + "_basecolor.png"), Buffer.from(PNGE.encodePNG(px, 4, 4, 4))); fs.writeFileSync(path.join(parent, "sets", s, s.replace(" ", "_") + "_height.png"), Buffer.from(PNGE.encodePNG(px, 4, 4, 4))); }
    const imp = await W((p) => window.__wb.importPathsToLibrary("Shaders", [p]), path.join(parent, "sets"));
    assert.deepStrictEqual(imp.added.slice().sort(), ["Moss", "Rock A", "Rock B"]); assert.deepStrictEqual(imp.skipped, []);
  });
  await t("app: 3.0 interface like the plugins: Night Arcade style, pixel type, LCD boxes, one HELP switch, help text on every control", async () => {
    const r = await W(async () => {
      const w = window.__wb, root = document.getElementById("app");
      for (const tb of [...document.querySelectorAll("#insp .tabbtn")]) { tb.click(); await new Promise((q) => setTimeout(q, 120)); }
      w.sweepAll(); await new Promise((q) => setTimeout(q, 200));
      const miss = {}; w.uis.forEach((u) => u.help.missing().forEach((m) => { miss[m.key] = m.name; }));
      const sw = document.querySelector("#top .assist"), was = w.uis[0].help.on; sw.click(); const off = w.uis.map((u) => u.help.on); sw.click();
      return { cls: ["arcade", "ui3"].every((c) => root.classList.contains(c)), bg: getComputedStyle(root).backgroundColor, sprites: document.querySelectorAll("#app .pxt").length,
        lcd: document.querySelectorAll("#insp .vbox .lcd").length, helped: w.uis.reduce((n, u) => n + u.help.nodes().length, 0), miss, was, off, back: w.uis.map((u) => u.help.on) };
    });
    assert.ok(r.cls, "#app has the arcade / ui3 classes"); assert.strictEqual(r.bg, "rgb(5, 4, 12)");
    assert.ok(r.sprites > 10, "pixel-sprite headings: " + r.sprites); assert.ok(r.lcd > 0, "LCD value boxes in the Inspector");
    assert.ok(r.helped > 150, "controls with hover help: " + r.helped); assert.deepStrictEqual(r.miss, {}, "controls without help text");
    assert.deepStrictEqual([r.was, r.off, r.back], [true, r.off.map(() => false), r.off.map(() => true)], "one HELP switch turns every bubble off and on"); assert.ok(r.off.length >= 3, "the Terrain Lab panel follows the switch too");
  });
  await t("app: no script errors during the session", () => { assert.deepStrictEqual(errors, []); });
  await t("app: Quit with unsaved changes asks first; Don't Save ends the app (macOS used to keep it running)", async () => {
    await W(() => { window.__wb.dirty = true; });
    const proc = app.process(), exited = new Promise((r) => proc.once("exit", () => r(true)));
    await app.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 1 }); });   // answer "Don't Save"
    await app.evaluate(({ app: a }) => { setTimeout(() => a.quit(), 10); });
    assert.ok(await Promise.race([exited, new Promise((r) => setTimeout(() => r(false), 10000))]), "the app process ended");
  });
}
