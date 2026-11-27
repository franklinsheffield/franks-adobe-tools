// Pixel Scape: Frank's 3D library (web-pipeline-kit /models, ~6,800 free CC0 / CC BY models) inside the app.
// The list is apps/pixel-scape-discord/data/models-index.json (scripts/build-model-index.js); the .glb files stay in the
// public assets repo. In the Discord Activity everything goes through our Worker (/.proxy/api/lib/...), because the
// Activity frame may only reach its own origin; elsewhere (desktop, local web) the files load straight from GitHub.
const DIRECT = {
  index: "https://raw.githubusercontent.com/franklinsheffield/franks-adobe-tools/main/apps/pixel-scape-discord/data/models-index.json",
};
const PROXY = "/.proxy/api/lib";
export const MAX_BYTES = 40e6;   // bigger scans are left to the website (slow to share with a whole call)

let IDX = null, LOADING = null;
const row = (fields, r) => { const o = {}; fields.forEach((f, i) => { o[f] = r[i]; }); o.vibes = o.vibes ? o.vibes.split(" ") : []; o.tags = o.tags ? o.tags.split(" ") : []; return o; };

async function fetchIndex() {
  if (window.__psWeb) {   // web build: our Worker serves the list and proxies the files (needed inside Discord)
    try { const r = await fetch(PROXY + "/index.json"); if (r.ok) return { j: await r.json(), proxy: true }; } catch (e) { /* not behind the Worker: go direct */ }
  }
  const r = await fetch(DIRECT.index); if (!r.ok) throw new Error("3D library list: HTTP " + r.status);
  return { j: await r.json(), proxy: false };
}
// -> { models, categories: [[name, n]], proxy, files, site }
export function load() {
  if (IDX) return Promise.resolve(IDX);
  if (!LOADING) LOADING = fetchIndex().then(({ j, proxy }) => {
    const models = j.rows.map((r) => row(j.fields, r)).filter((m) => !m.pointCloud && m.bytes <= MAX_BYTES), c = {};
    models.forEach((m) => { m.hay = [m.name, m.id, m.category, m.style, m.pack, m.author, m.tags.join(" "), m.vibes.join(" ")].join(" ").toLowerCase(); c[m.category] = (c[m.category] || 0) + 1; });
    IDX = { models, categories: Object.entries(c).sort((a, b) => b[1] - a[1]), proxy, files: j.files, site: j.site, built: j.built };
    return IDX;
  }).catch((e) => { LOADING = null; throw e; });
  return LOADING;
}
export const fileURL = (m) => (IDX.proxy ? PROXY + "/file/" + m.file : IDX.files + m.file);
export const thumbURL = (m) => (IDX.proxy ? PROXY + "/thumb" + m.thumb : IDX.site + m.thumb);
export const credit = (m) => (m.attribution ? `"${m.name}" by ${m.author || "unknown"} (${m.license})` : "");
export const size = (b) => (b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1e3)) + " KB");

// every word must appear; name hits first, then smaller files
export function search(q, category) {
  if (!IDX) return [];
  const words = String(q || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 8), out = [];
  for (const m of IDX.models) {
    if (category && m.category !== category) continue;
    if (!words.every((w) => m.hay.includes(w))) continue;
    const name = m.name.toLowerCase(); let s = 0; for (const w of words) { if (name.includes(w)) s += 3; if (m.tags.includes(w)) s += 1; }
    out.push([s, m.bytes, m]);
  }
  out.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  return out.map((x) => x[2]);
}
export async function download(m, onProgress) {
  const r = await fetch(fileURL(m)); if (!r.ok) throw new Error("download failed (HTTP " + r.status + ")");
  if (!r.body || !onProgress) return r.arrayBuffer();
  const total = +r.headers.get("content-length") || m.bytes, reader = r.body.getReader(), parts = []; let got = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; onProgress(got, total); }
  const out = new Uint8Array(got); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out.buffer;
}
