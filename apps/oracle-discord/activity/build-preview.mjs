// Builds a single-file preview of the Oracle Chamber (activity/dist/oracle-chamber-preview.html) to try outside
// Discord: CSS, script and fonts inlined, sample birth details filled in, and an offline city list so a few birth
// places work where OpenStreetMap can't be reached. Run after build.mjs: node activity/build-preview.mjs
import { readFileSync, writeFileSync } from "node:fs";
const dist = new URL("dist/", import.meta.url);
const read = (f) => readFileSync(new URL(f, dist));
const mime = { otf: "font/otf", ttf: "font/ttf", png: "image/png", woff2: "font/woff2" };
const css = read("chamber.css").toString().replace(/url\((assets\/[^)]+)\)/g, (m, f) => `url(data:${mime[f.split(".").pop()]};base64,${read(f).toString("base64")})`);
const js = read("chamber.js").toString().replace(/<\/script/gi, "<\\/script");
const CITIES = { phoenix: [33.4484, -112.074], "new york": [40.7128, -74.006], "los angeles": [34.0522, -118.2437], chicago: [41.8781, -87.6298],
  london: [51.5074, -0.1278], paris: [48.8566, 2.3522], berlin: [52.52, 13.405], tokyo: [35.6762, 139.6503], sydney: [-33.8688, 151.2093],
  toronto: [43.6532, -79.3832], "mexico city": [19.4326, -99.1332], "sao paulo": [-23.5505, -46.6333], lagos: [6.5244, 3.3792],
  cairo: [30.0444, 31.2357], mumbai: [19.076, 72.8777], beijing: [39.9042, 116.4074], "hong kong": [22.3193, 114.1694], seattle: [47.6062, -122.3321],
  "san francisco": [37.7749, -122.4194], austin: [30.2672, -97.7431], denver: [39.7392, -104.9903], miami: [25.7617, -80.1918], tucson: [32.2226, -110.9747],
  "las vegas": [36.1699, -115.1398], dublin: [53.3498, -6.2603], madrid: [40.4168, -3.7038], rome: [41.9028, 12.4964], seoul: [37.5665, 126.978] };
const pre = `window.ORACLE_PREVIEW = { profile: { date: "1990-04-09", time: "14:30", place: "Phoenix, USA", name: "Mary Ann Smith" },
  note: "Preview: sample details are filled in, change them to yours. Places: big cities or coordinates like 33.45, -112.07." };
(() => { const C = ${JSON.stringify(CITIES)}, real = window.fetch.bind(window);
  window.fetch = async (u, o) => { const url = String(u); if (!url.includes("nominatim.openstreetmap.org")) return real(u, o);
    try { const r = await real(u, o); if (r.ok) return r; } catch {}
    const q = decodeURIComponent((url.split("q=")[1] || "").replace(/\\+/g, " ")).toLowerCase();
    const k = Object.keys(C).find((c) => q.includes(c));
    if (!k) throw new Error("In this preview, use a big city (Phoenix, London, Tokyo…) or coordinates like 33.45, -112.07.");
    return new Response(JSON.stringify([{ lat: C[k][0], lon: C[k][1], display_name: k }]), { headers: { "content-type": "application/json" } }); }; })();`;
let html = read("index.html").toString()
  .replace('<link rel="stylesheet" href="chamber.css">', () => `<meta name="description" content="Science is Magic Oracle Chamber preview"><style>${css}</style>`)
  .replace('<script type="module" src="chamber.js"></script>', () => `<script>${pre}</script><script type="module">${js}</script>`);
writeFileSync(new URL("oracle-chamber-preview.html", dist), html);
console.log("preview", (html.length / 1e6).toFixed(2), "MB");
