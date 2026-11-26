// Local run: node scripts/try.js "36.10,-112.11" [sizeKm] [outDir] [view] -> terrain.glb, terrain.png, info.json
"use strict";
const fs = require("fs"), path = require("path");
const { parseCoords } = require("../src/geo");
const { buildTerrain } = require("../src/terrain");
(async () => {
  const c = parseCoords(process.argv[2] || "36.10,-112.11"), size = +(process.argv[3] || 10), out = process.argv[4] || "out", view = process.argv[5] || "oblique";
  fs.mkdirSync(out, { recursive: true }); console.time("build");
  const r = await buildTerrain({ lat: c.lat, lon: c.lon, sizeKm: size, name: c.name, log: console.log }); console.timeEnd("build");
  fs.writeFileSync(path.join(out, "terrain.glb"), r.glb); fs.writeFileSync(path.join(out, "texture.jpg"), r.jpeg); fs.writeFileSync(path.join(out, "info.json"), JSON.stringify(r.info, null, 1));
  console.log(r.info, "glb MB", (r.glb.length / 1e6).toFixed(2));
  if (process.env.NO_RENDER) return;
  const { Renderer } = require("../src/render"); const rd = new Renderer(); console.time("render");
  const png = await rd.render(r.glb, r.info, { view }); console.timeEnd("render"); fs.writeFileSync(path.join(out, "terrain-" + view + ".png"), png); console.log("png MB", (png.length / 1e6).toFixed(2)); await rd.close();
})().catch((e) => { console.error(e); process.exit(1); });
