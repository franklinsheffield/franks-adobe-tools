// Frank's 3D library (web-pipeline-kit /models) for Pixel Scape: the bundled index (data/models-index.json,
// scripts/build-model-index.js), search, random picks and links. Used by the bot (/model) and the Activity Worker.
import INDEX from "../data/models-index.json" with { type: "json" };

export const FIELDS = ["id", "name", "file", "category", "style", "pack", "author", "license", "attribution", "tris", "bytes", "thumb", "vibes", "tags", "pointCloud"];
export const FILES = INDEX.files, SITE = INDEX.site;
const row = (r) => { const o = {}; FIELDS.forEach((f, i) => { o[f] = r[i]; }); o.vibes = o.vibes ? o.vibes.split(" ") : []; o.tags = o.tags ? o.tags.split(" ") : []; o.attribution = !!o.attribution; o.pointCloud = !!o.pointCloud; return o; };
export const MODELS = INDEX.rows.map(row);
const BY_ID = new Map(MODELS.map((m) => [m.id, m]));
const HAY = MODELS.map((m) => [m.name, m.id, m.category, m.style, m.pack, m.author, m.tags.join(" "), m.vibes.join(" ")].join(" ").toLowerCase());
const count = (key) => { const c = {}; MODELS.forEach((m) => [].concat(m[key]).forEach((v) => { if (v) c[v] = (c[v] || 0) + 1; })); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ v, n })); };
export const CATEGORIES = count("category"), STYLES = count("style"), VIBES = count("vibes");
export const info = { count: MODELS.length, built: INDEX.built };

export const get = (id) => BY_ID.get(String(id || "").trim().toLowerCase()) || null;
export const fileUrl = (m) => FILES + m.file;
export const thumbUrl = (m) => SITE + m.thumb;
export const siteUrl = () => SITE + "/models";
// "CC BY" models need a credit line wherever they are used
export const credit = (m) => (m.attribution ? `"${m.name}" by ${m.author || "unknown"}, ${m.license}` : "");
export const mb = (b) => (b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");

const matches = (m, f) => (!f.category || m.category === f.category) && (!f.style || m.style === f.style) && (!f.vibe || m.vibes.includes(f.vibe)) && (!f.triangles || !m.pointCloud);
// query words must all appear; whole-word and name hits rank higher, then smaller files (quicker to use)
export function search(q, f = {}, limit = 10) {
  const words = String(q || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 8), whole = words.map((w) => new RegExp("\\b" + w + "\\b")), out = [];
  for (let i = 0; i < MODELS.length; i++) {
    const m = MODELS[i]; if (!matches(m, f)) continue;
    const h = HAY[i]; if (!words.every((w) => h.includes(w))) continue;
    let s = 0; const name = m.name.toLowerCase();
    words.forEach((w, k) => { if (name.includes(w)) s += 3; if (whole[k].test(h)) s += 2; if (m.tags.includes(w)) s += 1; });
    if (m.style === "realistic") s += 0.5;
    out.push([s, m.bytes, m]);
  }
  out.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  return { total: out.length, items: out.slice(0, limit).map((x) => x[2]) };
}
export function random(f = {}, rnd = Math.random) {
  const pool = MODELS.filter((m) => matches(m, f)); return pool.length ? pool[Math.floor(rnd() * pool.length)] : null;
}
// autocomplete choices (max 25, name <= 100 chars)
export function suggest(q, f = {}) {
  return search(q, f, 25).items.map((m) => ({ name: (m.name + " · " + m.category).slice(0, 100), value: m.id.slice(0, 100) }));
}
