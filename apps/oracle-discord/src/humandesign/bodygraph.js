// Branded Science is Magic bodygraph image: SVG built here, PNG via @resvg/resvg-js (Node only).
import { CHANNELS, PLANETS, CENTERS } from "./data.js";
import { zodiac } from "../ephemeris.js";

export const PAL = { navy: "#161030", purple: "#2E1E68", gold: "#E2B04A", light: "#FADE8C", teal: "#66E0C8", ink: "#0d0920", dim: "#4a3d86" };

// Gate anchor points in a 600 x 820 bodygraph space.
const G = {
  64: [265, 118], 61: [300, 118], 63: [335, 118],
  47: [265, 152], 24: [300, 152], 4: [335, 152], 17: [272, 182], 43: [300, 226], 11: [328, 182],
  62: [270, 268], 23: [300, 268], 56: [330, 268], 16: [252, 288], 20: [252, 322], 35: [348, 284], 12: [348, 306], 45: [348, 330],
  31: [272, 344], 8: [300, 344], 33: [328, 344],
  1: [300, 388], 7: [276, 412], 13: [324, 412], 10: [248, 440], 25: [352, 440], 15: [276, 468], 46: [324, 468], 2: [300, 492],
  21: [413, 487], 51: [381, 496], 26: [388, 521], 40: [428, 521],
  48: [97, 534], 57: [124, 551], 44: [153, 568], 50: [163, 598], 32: [131, 617], 28: [111, 629], 18: [97, 639],
  36: [503, 534], 22: [476, 551], 37: [447, 568], 6: [437, 598], 49: [469, 617], 55: [489, 629], 30: [503, 639],
  5: [272, 562], 14: [300, 562], 29: [328, 562], 34: [252, 590], 27: [252, 625], 59: [348, 612], 42: [272, 648], 3: [300, 648], 9: [328, 648],
  53: [272, 702], 60: [300, 702], 52: [328, 702], 54: [252, 722], 38: [252, 744], 58: [252, 766], 19: [348, 722], 39: [348, 744], 41: [348, 766],
};
const SHAPES = {
  head: "M300,40 L360,122 L240,122 Z", ajna: "M240,148 L360,148 L300,234 Z",
  throat: "M250,264 h100 v84 h-100 Z", g: "M300,382 L358,440 L300,498 L242,440 Z",
  heart: "M398,460 L446,526 L368,526 Z", spleen: "M88,516 L190,584 L88,652 Z", solar: "M512,516 L410,584 L512,652 Z",
  sacral: "M250,556 h100 v96 h-100 Z", root: "M250,698 h100 v84 h-100 Z",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function channelSvg(chart) {
  const out = [], on = chart.gates;
  const colour = (g) => { const a = on[g]; if (!a) return null; return a.personality && a.design ? "both" : a.personality ? PAL.gold : PAL.teal; };
  // base (inactive) channels
  for (const c of CHANNELS) { const [a, b] = c.gates.map((g) => G[g]); out.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${PAL.ink}" stroke-width="11" stroke-linecap="round"/><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${PAL.dim}" stroke-opacity="0.55" stroke-width="7" stroke-linecap="round"/>`); }
  // active halves (hanging gates included)
  for (const c of CHANNELS) {
    const [ga, gb] = c.gates, [a, b] = [G[ga], G[gb]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    for (const [g, p, q] of [[ga, a, m], [gb, b, m]]) {
      const col = colour(g); if (!col) continue;
      if (col === "both") out.push(`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${PAL.gold}" stroke-width="7" stroke-linecap="round"/><line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${PAL.teal}" stroke-width="7" stroke-dasharray="6 6"/>`);
      else out.push(`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${col}" stroke-width="7" stroke-linecap="round"/>`);
    }
  }
  return out.join("");
}

function centerSvg(chart) {
  const out = [];
  for (const [k, d] of Object.entries(SHAPES)) {
    const def = chart.centers[k];
    out.push(`<path d="${d}" fill="${def ? "url(#defined)" : PAL.navy}" stroke="${def ? PAL.light : PAL.gold}" stroke-opacity="${def ? 1 : 0.7}" stroke-width="${def ? 3 : 2}" stroke-linejoin="round"${def ? ' filter="url(#glow)"' : ""}/>`);
  }
  for (const [g, [x, y]] of Object.entries(G)) {
    const a = chart.gates[g], bg = a ? (a.personality && a.design ? PAL.light : a.personality ? PAL.gold : PAL.teal) : "none";
    const center = Object.keys(CENTERS).find((c) => CENTERS[c].gates.includes(+g)), def = chart.centers[center];
    const fg = a ? PAL.ink : def ? PAL.ink : PAL.light;
    if (a) out.push(`<circle cx="${x}" cy="${y}" r="9.5" fill="${bg}" stroke="${PAL.ink}" stroke-width="1.5"/>`);
    out.push(`<text x="${x}" y="${y + 3.6}" font-size="10.5" font-weight="700" text-anchor="middle" fill="${fg}" fill-opacity="${a ? 1 : 0.75}">${g}</text>`);
  }
  return out.join("");
}

function column(side, x, title, colour, align) {
  const rows = PLANETS.map((p, i) => {
    const a = side[p.key], y = 64 + i * 50, z = zodiac(a.lon);
    const tx = align === "end" ? x + 250 : x, anchor = align === "end" ? "end" : "start";
    const gx = align === "end" ? x + 268 : x - 18;
    return `<text x="${gx}" y="${y + 6}" font-size="22" fill="${colour}" text-anchor="middle" font-family="DejaVu Sans">${p.glyph}</text>
      <text x="${tx}" y="${y}" font-size="23" font-weight="700" fill="#fff" text-anchor="${anchor}" font-family="DejaVu Sans">${a.gate}.${a.line}</text>
      <text x="${tx}" y="${y + 20}" font-size="13" fill="${colour}" fill-opacity="0.85" text-anchor="${anchor}" font-family="DejaVu Sans">${esc(p.name)} · ${esc(z.text)}</text>`;
  }).join("");
  const hx = align === "end" ? x + 250 : x;
  return `<text x="${hx}" y="22" font-family="Cinzel" font-weight="900" font-size="24" letter-spacing="3" fill="${colour}" text-anchor="${align === "end" ? "end" : "start"}">${title}</text>${rows}`;
}

/** SVG string, 1600 x 1180. `sigil` is an optional data: URL for the header emblem. */
export function bodygraphSvg(chart, { title = "Human Design", subtitle = "", sigil = null } = {}) {
  const facts = [["Type", chart.type], ["Profile", chart.profile], ["Authority", chart.authority], ["Definition", chart.definition]];
  const stars = Array.from({ length: 70 }, (_, i) => { const x = (i * 9301 + 49297) % 1600, y = (i * 233280 + 12345) % 1180, r = (i % 5 === 0) ? 1.8 : 0.9; return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity="${0.25 + (i % 4) * 0.12}"/>`; }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="1180" viewBox="0 0 1600 1180" font-family="DejaVu Sans">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.purple}"/><stop offset="1" stop-color="${PAL.navy}"/></linearGradient>
  <radialGradient id="defined" cx="0.5" cy="0.35" r="0.8"><stop offset="0" stop-color="${PAL.light}"/><stop offset="1" stop-color="${PAL.gold}"/></radialGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${PAL.purple}" stop-opacity="0.9"/><stop offset="1" stop-color="${PAL.navy}" stop-opacity="0"/></radialGradient>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1600" height="1180" fill="url(#bg)"/>${stars}
<rect x="14" y="14" width="1572" height="1152" rx="26" fill="none" stroke="${PAL.gold}" stroke-opacity="0.55" stroke-width="2"/>
${sigil ? `<image x="40" y="30" width="96" height="96" href="${sigil}"/>` : ""}
<text x="${sigil ? 152 : 48}" y="80" font-family="Cinzel" font-weight="900" font-size="46" letter-spacing="4" fill="${PAL.light}">${esc(title.toUpperCase())}</text>
<text x="${sigil ? 154 : 50}" y="114" font-size="20" fill="${PAL.teal}">${esc(subtitle)}</text>
<text x="1556" y="80" font-family="Cinzel" font-size="22" letter-spacing="3" fill="${PAL.gold}" text-anchor="end">SCIENCE IS MAGIC</text>
<text x="1556" y="112" font-size="16" fill="${PAL.light}" fill-opacity="0.7" text-anchor="end">bodygraph · real ephemeris · 88° solar arc</text>
<g transform="translate(40,160)">${column(chart.design, 30, "DESIGN", PAL.teal, "start")}</g>
<g transform="translate(1270,160)">${column(chart.personality, 0, "PERSONALITY", PAL.gold, "end")}</g>
<circle cx="800" cy="600" r="440" fill="url(#halo)"/>
<g transform="translate(470,150) scale(1.1)">${channelSvg(chart)}${centerSvg(chart)}</g>
<g transform="translate(0,1060)">
  <rect x="40" y="0" width="1520" height="84" rx="16" fill="${PAL.ink}" fill-opacity="0.6" stroke="${PAL.gold}" stroke-opacity="0.4"/>
  ${facts.map(([k, v], i) => `<text x="${80 + i * 300}" y="32" font-size="14" letter-spacing="2" fill="${PAL.teal}">${k.toUpperCase()}</text><text x="${80 + i * 300}" y="62" font-family="Cinzel" font-weight="900" font-size="23" fill="${PAL.light}">${esc(v)}</text>`).join("")}
  <text x="1280" y="32" font-size="14" letter-spacing="2" fill="${PAL.teal}">CROSS</text>
  <text x="1280" y="54" font-size="15" fill="${PAL.light}">${esc(chart.cross.angle)} · ${esc(chart.cross.name)}</text>
  <text x="1280" y="74" font-size="14" fill="${PAL.light}" fill-opacity="0.7">${chart.cross.gates[0]}/${chart.cross.gates[1]} | ${chart.cross.gates[2]}/${chart.cross.gates[3]}</text>
</g>
</svg>`;
}

/** PNG bytes (Node only). */
export async function bodygraphPng(chart, opts = {}) {
  const { Resvg } = await import("@resvg/resvg-js");
  const { readFileSync } = await import("node:fs");
  const here = new URL("../../", import.meta.url);
  const sigil = "data:image/png;base64," + readFileSync(new URL("assets/sigil.png", here)).toString("base64");
  const svg = bodygraphSvg(chart, { sigil, ...opts });
  const r = new Resvg(svg, { font: { fontFiles: [new URL("fonts/Cinzel-Regular.otf", here).pathname, new URL("fonts/Cinzel-Black.otf", here).pathname], loadSystemFonts: true, defaultFontFamily: "DejaVu Sans" } });
  return r.render().asPng();
}
