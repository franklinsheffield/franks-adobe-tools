"use strict";
// Frank's Worlds Brew map packs: Fantasy (Kenney CC0 models) and Alien (original models built in code).
// Each pack has ready-made assets (added from the Viewport's Assets card) and 4 maps (Console > Scenes).
const S = require("./scene.js");
const M = require("./models.js");
const { alienAssets } = require("./alienkit.js");

let fantasyCache = null;
function fantasyAssets() {
  if (fantasyCache) return fantasyCache;
  const data = require("./packs-data.js").fantasy;
  fantasyCache = data.map((a) => Object.assign({}, a, { mesh: M.meshFromJSON(a.mesh) }));
  return fantasyCache;
}
const PACK_ASSETS = { Fantasy: fantasyAssets, Alien: alienAssets };
function assets(pack) { return PACK_ASSETS[pack] ? PACK_ASSETS[pack]() : []; }
function asset(id) { const pack = id.startsWith("alien/") ? "Alien" : "Fantasy"; const a = assets(pack).find((x) => x.id === id); if (!a) throw new Error("No asset " + id); return a; }

// a model from a pack, standing on y = base (0 = ground), size = k x the asset's default size
function put(id, x, z, k, extra, base) {
  const a = asset(id), o = S.meshObj(a.mesh, x, z, +(a.size * (k || 1)).toFixed(3), a.mat, Object.assign({ smooth: false }, extra || {}));
  o.y = +(o.y + (base || 0)).toFixed(3); o.asset = a.id; return o;
}
const BASE = { sky: "Noon", sunAz: 200, sunAlt: 30, haze: 15, fog: 0, fogH: 1, clouds: 30, water: false, ground: false, waterLvl: 0 };
const sc = (o) => Object.assign({}, BASE, o);

const MAPS = {
  Fantasy: {
    "Elven Vale": () => sc({ sky: "Dawn", sunAz: 120, sunAlt: 18, haze: 22, fog: 10, fogH: 1.4, clouds: 45, water: true, waterLvl: -0.05,
      cam: { yaw: 18, pitch: 8, dist: 22, fov: 50, tx: 0, ty: 1.6, tz: 0 },
      objs: [S.obj("terrain", -9, 0, -14, 9, "Stone", { h: 6, seed: 21, rough: 0.55 }), S.obj("terrain", 10, 0, -12, 7, "Stone", { h: 4.5, seed: 33 }),
        S.obj("terrain", 0, -0.6, 1, 7, "Stone", { h: 1.2, seed: 8, rough: 0.4 }),
        put("fantasy/statue", 0, 1.5, 1.1, { ry: 200 }, 0.55), put("fantasy/column", -2.2, 0.6, 1, {}, 0.5), put("fantasy/ruin", 2.4, 0.4, 1, { ry: 40 }, 0.5),
        put("fantasy/pine", -4.5, -1, 1.2, {}, 0.3), put("fantasy/pine", 4.6, -1.8, 1.4, { ry: 70 }, 0.25), put("fantasy/grove", -6, 2.5, 1, { ry: 30 }, 0.1),
        put("fantasy/island", 5, -7, 1.1, {}, 5.5), put("fantasy/pine", 5, -7, 0.8, {}, 6.1)]  }),
    "Castle Ruins": () => sc({ sky: "Dusk", sunAz: 230, sunAlt: 24, haze: 12, fog: 5, fogH: 0.8, clouds: 30, ground: true,
      cam: { yaw: 25, pitch: 10, dist: 18, fov: 50, tx: 0, ty: 1.4, tz: -1 },
      objs: [put("fantasy/gate", 0, -3, 1.3), put("fantasy/wall", -3.2, -3, 1.3), put("fantasy/wall", 3.2, -3, 1.3), put("fantasy/corner", -6.2, -3, 1.3, { ry: 90 }), put("fantasy/corner", 6.2, -3, 1.3),
        put("fantasy/banner", -1.9, -2.2, 1.2), put("fantasy/banner", 1.9, -2.2, 1.2), put("fantasy/ruin", -3, 1.5, 1.2, { ry: 20 }), put("fantasy/ruin", 3.4, 2, 1, { ry: 75 }),
        put("fantasy/column", 5.5, 0.5, 1.3), put("fantasy/stairs", 0, -0.9, 1.1), put("fantasy/statue", -5.4, 1.2, 1.2, { ry: 150 }),
        put("fantasy/pine", -9.5, -7, 1.1), put("fantasy/pine", 10, -7.5, 1.2, { ry: 50 }), put("fantasy/forest", 0, -12, 3, {}),
        S.obj("terrain", 0, 0, -26, 12, "Stone", { h: 7, seed: 47, rough: 0.6 })] }),
    "Village Green": () => sc({ sky: "Noon", sunAz: 210, sunAlt: 40, haze: 12, clouds: 40, ground: true,
      cam: { yaw: 35, pitch: 16, dist: 19, fov: 48, tx: 0, ty: 1, tz: 0 },
      objs: [put("fantasy/fountain", 0, 0, 1.1), put("fantasy/house", -4.2, -3.5, 1.2, { ry: 20 }), put("fantasy/house2", 3.8, -4, 1.2, { ry: -15 }), put("fantasy/house", 6.5, 1.5, 1.1, { ry: -80 }),
        put("fantasy/grove", -5.5, 2.5, 1.1), put("fantasy/pine", -7.5, -1, 1.3), put("fantasy/pine", 1, -8, 1.5), put("fantasy/grove", -1, 6, 0.9, { ry: 15 }),
        put("fantasy/flag", 2.4, 2.4, 1.2), put("fantasy/grass", 1.6, 1.2, 1), put("fantasy/grass", -1.8, 1.6, 1.2), put("fantasy/grass", 0.7, -1.9, 0.9),
        S.obj("terrain", -14, 0, -20, 10, "Stone", { h: 5, seed: 12 }), S.obj("terrain", 14, 0, -22, 10, "Stone", { h: 6, seed: 19 })] }),
    "Sky Islands": () => sc({ sky: "Dawn", sunAz: 95, sunAlt: 22, haze: 25, fog: 4, clouds: 70, water: true, waterLvl: -6,
      cam: { yaw: 10, pitch: 6, dist: 20, fov: 52, tx: 0, ty: 2.5, tz: 0 },
      objs: [put("fantasy/island", 0, 0, 1.4, {}, 0), put("fantasy/house", 0.3, -0.3, 0.9, { ry: 25 }, 0.7), put("fantasy/pine", -2.1, 0.4, 0.9, {}, 0.7), put("fantasy/flag", 2, 0.8, 0.9, {}, 0.7),
        put("fantasy/island", -7, -5, 1.1, {}, 3), put("fantasy/grove", -7, -5, 0.8, {}, 3.6), put("fantasy/island", 7.5, -4, 1, {}, 5), put("fantasy/statue", 7.5, -4, 0.8, { ry: 220 }, 5.55),
        put("fantasy/island", 3.5, -12, 1.2, {}, 1.5), put("fantasy/column", 2.6, -12, 0.9, {}, 2.1), put("fantasy/ruin", 4.6, -12.4, 0.8, {}, 2.1)]  })
  },
  Alien: {
    "Crystal Plains": () => sc({ sky: "Alien", sunAz: 210, sunAlt: 28, haze: 10, fog: 2, fogH: 1, clouds: 35, ground: true,
      cam: { yaw: 20, pitch: 9, dist: 20, fov: 50, tx: 0, ty: 1.4, tz: 0 },
      objs: [put("alien/crystals", 0, 0, 1.7), put("alien/crystals", -4.5, -2, 1.3, { ry: 60 }), put("alien/crystals", 5, 1.5, 1.1, { ry: 140 }),
        put("alien/spire", -7, -6, 1.1), put("alien/spire", 7.5, -7, 1.3, { ry: 90 }), put("alien/arch", 1.5, -6.5, 1.1, { ry: 15 }),
        S.obj("terrain", -12, 0, -22, 11, "Stone", { h: 7, seed: 71, rough: 0.6, terrace: 6 }), S.obj("terrain", 12, 0, -24, 11, "Stone", { h: 8, seed: 74, terrace: 7 }),
        S.obj("sphere", -10, 14, -40, 4, "Matte")] }),
    "Spore Jungle": () => sc({ sky: "Alien", sunAz: 260, sunAlt: 14, haze: 10, fog: 16, fogH: 1.2, clouds: 10, water: true, waterLvl: -0.1,
      cam: { yaw: -15, pitch: 6, dist: 16, fov: 52, tx: 0, ty: 1.8, tz: 0 },
      objs: [S.obj("terrain", 0, -0.4, 0, 8, "Stone", { h: 1, seed: 5, rough: 0.4 }),
        put("alien/sporeTree", 0, -1, 1.2, {}, 0.5), put("alien/sporeTree", -4, -3, 1, { ry: 120 }, 0.3), put("alien/sporeTree", 4.5, -2.5, 1.4, { ry: 200 }, 0.3),
        put("alien/glowPods", 1.8, 1.8, 1, {}, 0.45), put("alien/glowPods", -2.5, 1.2, 0.8, { ry: 90 }, 0.45), put("alien/tentacles", 3.2, 1, 0.9, {}, 0.4), put("alien/tentacles", -5.5, 0.5, 1, {}, 0.2),
        put("alien/sporeTree", -8, -8, 1.8, {}, 0), put("alien/sporeTree", 8, -9, 2, { ry: 60 }, 0)] }),
    "Outpost Zeta": () => sc({ sky: "Dusk", sunAz: 250, sunAlt: 16, haze: 18, fog: 4, clouds: 20, ground: true,
      cam: { yaw: 30, pitch: 12, dist: 20, fov: 48, tx: 0, ty: 1.2, tz: 0 },
      objs: [put("alien/dome", 0, 0, 1), put("alien/dome", -5.2, -2.5, 0.7, { ry: 50 }), put("alien/dome", 4.8, -3.5, 0.6, { ry: -40 }), put("alien/antenna", 3, 2.5, 1),
        put("alien/crystals", -3.5, 3, 0.7), put("alien/glowPods", 6, 1, 0.9), put("alien/spire", -9, -9, 1.2), put("alien/arch", 9, -10, 1.3, { ry: -25 }),
        S.obj("torus", -14, 12, -38, 6, "Chrome", { ry: 30 }), S.obj("sphere", -14, 12, -38, 3.6, "Stone")] }),
    "Twin Spires": () => sc({ sky: "Alien", sunAz: 180, sunAlt: 10, haze: 20, fog: 12, fogH: 0.8, clouds: 50, water: true,
      cam: { yaw: 0, pitch: 4, dist: 24, fov: 50, tx: 0, ty: 3, tz: -2 },
      objs: [S.obj("terrain", -4, 0, -6, 4, "Stone", { h: 2.2, seed: 88 }), S.obj("terrain", 4.5, 0, -7, 4, "Stone", { h: 2.6, seed: 91 }),
        put("alien/spire", -4, -6, 1.6, {}, 1.4), put("alien/spire", 4.5, -7, 1.8, { ry: 100 }, 1.7), put("alien/arch", 0.3, -6.5, 1.2, {}, 0),
        put("alien/crystals", -1.5, 1, 0.8, {}, -0.2), put("alien/tentacles", 2, 2.5, 0.9, {}, -0.3)] })
  }
};
const PACKS = Object.keys(MAPS);
function loadMap(pack, name) { const f = MAPS[pack] && MAPS[pack][name]; if (!f) throw new Error("No map called " + name); const s = S.withDefaults(f()); s.name = name; s.pack = pack; return s; }

module.exports = { PACKS, MAPS, assets, asset, put, loadMap };
