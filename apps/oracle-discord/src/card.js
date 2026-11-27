// Shared Science is Magic image card for the newer modules: starfield, gold frame, atom sigil, Cinzel title,
// a module-drawn body and an optional facts strip. SVG built here, PNG via @resvg/resvg-js (Node only).
export const PAL = { navy: "#161030", purple: "#2E1E68", gold: "#E2B04A", light: "#FADE8C", teal: "#66E0C8", ink: "#0d0920", dim: "#4a3d86", text: "#DCD4FF", mute: "#9C92C8" };
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Font size that fits `t` into width `w` (rough average glyph width ratio `k`). */
export const fit = (t, max, w, k = 0.6) => Math.max(10, Math.min(max, Math.floor(w / (Math.max(1, String(t).length) * k))));

/** Wrap text into lines of at most `n` characters. */
export function wrap(t, n) {
  const out = []; let cur = "";
  for (const w of String(t).split(/\s+/)) { if ((cur + " " + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }
  if (cur) out.push(cur);
  return out;
}
/** Multi-line <text> block. */
export const para = (x, y, t, { n = 60, size = 20, lh = 1.35, fill = PAL.text, anchor = "start", max = 99, style = "" } = {}) =>
  wrap(t, n).slice(0, max).map((l, i) => `<text x="${x}" y="${y + i * size * lh}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${style ? ` ${style}` : ""}>${esc(l)}</text>`).join("");

function stars(W, H, n = 80) {
  let s = "", seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) s += `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" r="${r() < 0.8 ? 0.9 : 1.8}" fill="#fff" fill-opacity="${(0.2 + r() * 0.5).toFixed(2)}"/>`;
  return s;
}

/**
 * Full card SVG. body: SVG markup drawn in the area (0,0)-(W-80, bodyH) after translate(40,150).
 * facts: [[label, value], ...] shown in the bottom strip.
 */
export function cardSvg({ title, subtitle = "", tag = "", body = "", facts = [], W = 1600, H = 1000, sigil = null, defs = "" }) {
  const stripH = facts.length ? 96 : 0;
  const fw = (W - 80) / Math.max(1, facts.length);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="DejaVu Sans">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.purple}"/><stop offset="1" stop-color="${PAL.navy}"/></linearGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#3a2690" stop-opacity="0.9"/><stop offset="1" stop-color="${PAL.navy}" stop-opacity="0"/></radialGradient>
  <radialGradient id="goldfill" cx="0.5" cy="0.35" r="0.8"><stop offset="0" stop-color="${PAL.light}"/><stop offset="1" stop-color="${PAL.gold}"/></radialGradient>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
  ${defs}
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>${stars(W, H)}
<rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="26" fill="none" stroke="${PAL.gold}" stroke-opacity="0.55" stroke-width="2"/>
${sigil ? `<image x="40" y="30" width="96" height="96" href="${sigil}"/>` : ""}
<text x="${sigil ? 152 : 48}" y="80" font-family="Cinzel" font-weight="900" font-size="${fit(title, 46, W - 700, 0.78)}" letter-spacing="4" fill="${PAL.light}">${esc(String(title).toUpperCase())}</text>
<text x="${sigil ? 154 : 50}" y="114" font-size="20" fill="${PAL.teal}">${esc(subtitle)}</text>
<text x="${W - 44}" y="80" font-family="Cinzel" font-size="22" letter-spacing="3" fill="${PAL.gold}" text-anchor="end">SCIENCE IS MAGIC</text>
<text x="${W - 44}" y="112" font-size="16" fill="${PAL.light}" fill-opacity="0.7" text-anchor="end">${esc(tag)}</text>
<g transform="translate(40,150)">${body}</g>
${facts.length ? `<g transform="translate(0,${H - stripH - 26})">
  <rect x="40" y="0" width="${W - 80}" height="${stripH}" rx="16" fill="${PAL.ink}" fill-opacity="0.6" stroke="${PAL.gold}" stroke-opacity="0.4"/>
  ${facts.map(([k, v], i) => `<text x="${70 + i * fw}" y="36" font-size="14" letter-spacing="2" fill="${PAL.teal}">${esc(String(k).toUpperCase())}</text><text x="${70 + i * fw}" y="70" font-family="Cinzel" font-weight="900" font-size="${fit(v, 24, fw - 40, 0.72)}" fill="${PAL.light}">${esc(v)}</text>`).join("")}
</g>` : ""}
</svg>`;
}

let fontCache = null;
/** PNG bytes for a card (Node only). */
export async function cardPng(opts) {
  const { Resvg } = await import("@resvg/resvg-js");
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const here = new URL("../", import.meta.url);
  const f = (n) => fileURLToPath(new URL(n, here));
  fontCache ||= { sigil: "data:image/png;base64," + readFileSync(f("assets/sigil.png")).toString("base64"),
    files: [f("fonts/Cinzel-Regular.otf"), f("fonts/Cinzel-Black.otf"), f("assets/fonts/DejaVuSans.ttf"), f("assets/fonts/DejaVuSans-Bold.ttf"), f("assets/fonts/NotoSerifSC-Subset.ttf"), f("assets/fonts/NotoSansEgyptianHieroglyphs-Subset.ttf"), f("assets/fonts/NotoSansRunic-Subset.ttf")] };
  const svg = cardSvg({ sigil: fontCache.sigil, ...opts });
  return new Resvg(svg, { font: { fontFiles: fontCache.files, loadSystemFonts: true, defaultFontFamily: "DejaVu Sans" } }).render().asPng();
}

export const GOLD = 0xE2B04A, TEAL = 0x66E0C8, PURPLE = 0x8A6CFF;
export const FOOTER = { text: "Science is Magic · for reflection, not prediction" };
export const cut = (s, n = 1024) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
