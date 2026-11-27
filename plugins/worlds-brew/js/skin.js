"use strict";
// Frank's Worlds Brew: skins from the web-pipeline-kit skin editor (https://web-pipeline-kit.vercel.app/models/editor).
// A skin link carries a small recipe: { m: model id, e: { [glTF material index]: { color, tex, tile, finish, rough, metal,
// glow, hidden, shader, ... } } } as base64url JSON in ?s=. Pixel Scape renders per-triangle colours and surface layers,
// not three.js materials, so a skin is baked into the glTF before the model reader reads it (models.js opt.editJson):
// colour and tint -> baseColorFactor, a library texture -> the colour texture (tiled with KHR_texture_transform),
// hidden -> the surface's primitives dropped. Shine and glow map onto the object's material preset.
// Shaders, glass transmission, HDRIs, bloom and overlays stay in the web editor.

const atobSafe = typeof atob === "function" ? atob : (b) => Buffer.from(b, "base64").toString("binary");
const utf8 = (bin) => { try { return decodeURIComponent(escape(bin)); } catch (e) { return bin; } };

/* A skin link (any URL with ?s=..., or the bare code) -> recipe, or null. */
function parseSkinLink(text) {
  const s = String(text || "").trim(); if (!s) return null;
  let code = s;
  const m = /[?&]s=([A-Za-z0-9_-]+)/.exec(s); if (m) code = m[1];
  else { const mm = /[?&]model=([\w.-]+)/.exec(s); if (mm) return { m: mm[1], e: {} }; }
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try {
    const r = JSON.parse(utf8(atobSafe(code.replace(/-/g, "+").replace(/_/g, "/"))));
    if (!r || typeof r.m !== "string" || !/^[\w.-]+$/.test(r.m)) return null;
    const e = {};
    for (const [k, v] of Object.entries(r.e || {})) if (/^\d+$/.test(k) && v && typeof v === "object") e[k] = v;
    return { m: r.m, h: r.h, e };
  } catch (err) { return null; }
}

/* Library texture sets a recipe uses (their colour maps get downloaded and decoded first). */
function textureIds(recipe) {
  const out = new Set(); for (const v of Object.values((recipe && recipe.e) || {})) if (v.tex && /^[\w.-]+$/.test(v.tex)) out.add(v.tex); return [...out];
}
/* Path of a texture set's colour map in the asset repo (under textures/). */
const texturePath = (id) => id + "/color.webp";

const hex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "")); if (!m) return null; const n = parseInt(m[1], 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const s2lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/* The editJson hook for models.js: bakes the recipe into json (and fills decoded[] with the texture pictures).
   textures: { [texture id]: { w, h, rgba } } decoded colour maps; decoded: the reader's { [image index]: picture } map. */
function editJson(recipe, textures, decoded) {
  return (json) => {
    const mats = json.materials || [], e = (recipe && recipe.e) || {}, added = {};
    const imageFor = (id) => {
      if (added[id] != null) return added[id];
      const pic = textures && textures[id]; if (!pic) return null;
      json.images = json.images || []; json.textures = json.textures || [];
      const img = json.images.push({ name: "skin:" + id }) - 1; decoded[img] = pic;
      return (added[id] = json.textures.push({ source: img }) - 1);
    };
    for (const [k, v] of Object.entries(e)) {
      const mat = mats[+k]; if (!mat) continue;
      const pbr = mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
      if (v.tex === "") delete pbr.baseColorTexture;
      else if (v.tex) { const ti = imageFor(v.tex);
        if (ti != null) { const t = +v.tile || 1; pbr.baseColorTexture = { index: ti, texCoord: 0 }; if (t !== 1) pbr.baseColorTexture.extensions = { KHR_texture_transform: { scale: [t, t] } }; pbr.baseColorFactor = [1, 1, 1, 1]; } }
      let col = hex(v.color) || (v.shader ? hex(v.shA) : null);
      if (v.glow) { const g = hex(v.glow); if (g) col = g; }   // a glowing surface reads as its glow colour
      if (col) pbr.baseColorFactor = [s2lin(col[0]), s2lin(col[1]), s2lin(col[2]), (pbr.baseColorFactor || [1, 1, 1, 1])[3]];
      if (v.rough != null) pbr.roughnessFactor = +v.rough;
      if (v.metal != null) pbr.metallicFactor = +v.metal;
    }
    const hide = new Set(Object.entries(e).filter(([, v]) => v.hidden).map(([k]) => +k));
    const tinted = new Set(Object.entries(e).filter(([, v]) => v.tex || v.color || v.glow).map(([k]) => +k));
    for (const mesh of json.meshes || []) {
      if (hide.size) mesh.primitives = mesh.primitives.filter((p) => !hide.has(p.material));
      // vertex colours would tint the new colour or texture; the editor drops them too
      for (const p of mesh.primitives) if (tinted.has(p.material) && p.attributes) delete p.attributes.COLOR_0;
    }
  };
}

const METAL = new Set(["chrome", "brushed-steel"]), WARM = new Set(["gold", "copper"]), GLOSS = new Set(["gloss-plastic", "car-paint", "pearl", "iridescent", "clear-glass", "tinted-glass", "crystal", "soap-film"]);
/* Material preset for the whole object: Neon when every visible edited surface glows, else the most used finish. */
function preset(recipe, fallback) {
  const v = Object.values((recipe && recipe.e) || {}).filter((x) => !x.hidden); if (!v.length) return fallback || "Matte";
  if (v.every((x) => x.glow)) return "Neon";
  const n = { Chrome: 0, Gold: 0, Glossy: 0 };
  for (const x of v) { const f = x.finish; if (METAL.has(f)) n.Chrome++; else if (WARM.has(f)) n.Gold++; else if (GLOSS.has(f) || (x.rough != null && x.rough < 0.3)) n.Glossy++; }
  const best = Object.entries(n).sort((a, b) => b[1] - a[1])[0];
  return best[1] * 2 >= v.length ? best[0] : fallback || "Matte";
}

module.exports = { parseSkinLink, textureIds, texturePath, editJson, preset };
