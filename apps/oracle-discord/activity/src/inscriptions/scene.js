// The Inscription Tray, drawn as SVG: the chosen tray, the find lying in it (a stone, clay tablet, sheet of parchment,
// paper or papyrus, a bone, a wooden board or a small seal) with its sample written in the real script, the chosen
// light, and a copy pinned beside it (a rubbing, a paper squeeze or a plaster cast). Fonts come from fonts.gen.js.
import { FONTS } from "./fonts.gen.js";
import { script } from "./data.js";

const X = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/** @font-face rules for every bundled script font (family "ins-<key>"). */
export const fontCss = () => Object.entries(FONTS).map(([k, b]) => `@font-face{font-family:"ins-${k}";src:url(data:font/woff2;base64,${b}) format("woff2");font-display:block}`).join("");
export const familyOf = (s) => (s.font ? `ins-${s.font},` : "") + `"Noto Sans","Segoe UI Historic","Segoe UI Symbol","Apple Symbols",serif`;
const RTL = new Set(["hebrew", "arabic", "phoenician", "syriac", "nko", "etruscan"]);

const SURFACE = {
  stone: { fill: "#8d8679", edge: "#4e4a42", ink: "#2b2823", shape: "M40 60 Q36 40 60 36 L250 32 Q276 34 278 58 L282 150 Q280 172 256 174 L62 178 Q38 176 38 152Z" },
  clay: { fill: "#c08a5a", edge: "#6a4a2a", ink: "#5a3618", shape: "M58 44 Q160 30 262 44 Q272 100 262 166 Q160 180 58 166 Q48 100 58 44Z" },
  parchment: { fill: "#efe0bd", edge: "#a88c5a", ink: "#3b2f2a", shape: "M44 42 L276 38 L280 172 L46 176Z" },
  paper: { fill: "#f4ecd8", edge: "#b8a888", ink: "#1f1a14", shape: "M48 40 L272 40 L272 174 L48 174Z" },
  papyrus: { fill: "#d9c08a", edge: "#9a7a40", ink: "#2a1e10", shape: "M42 46 L278 42 L276 170 L44 174Z" },
  bone: { fill: "#e8dfc8", edge: "#8a7e64", ink: "#3a3024", shape: "M40 86 Q40 66 60 70 Q84 58 160 60 Q236 58 260 70 Q280 66 280 86 L280 132 Q280 152 260 148 Q236 158 160 156 Q84 158 60 148 Q40 152 40 132Z" },
  wood: { fill: "#7a5432", edge: "#3e2814", ink: "#1e1208", shape: "M42 50 L278 46 L280 168 L44 172Z" },
  seal: { fill: "#e2d2b0", edge: "#7a6a4a", ink: "#3a2c1a", shape: "M100 50 L220 50 L224 170 L96 170Z" },
};
const LIGHTS = {
  "in-lamp": { glow: "#ffcf7a", op: 0.28, cx: 70 },
  "in-raking": { glow: "#fff2d0", op: 0.42, cx: 10, rake: true },
  "in-rti": { glow: "#cfe6ff", op: 0.3, cx: 160, dome: true },
};

/** Sketches for scripts with no Unicode encoding, drawn in the find's ink colour. */
const SKETCH = {
  maya: (c) => `<g fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"><rect x="108" y="74" width="44" height="44" rx="12"/><circle cx="124" cy="92" r="5" fill="${c}"/><path d="M118 108 q12 6 24 -2"/>
    <rect x="164" y="74" width="44" height="44" rx="12"/><path d="M172 90 h28 M176 100 h20"/>
    <circle cx="120" cy="136" r="4" fill="${c}"/><circle cx="134" cy="136" r="4" fill="${c}"/><circle cx="148" cy="136" r="4" fill="${c}"/><path d="M110 146 h46 M110 156 h46" stroke-width="6"/>
    <circle cx="186" cy="136" r="4" fill="${c}"/><path d="M164 146 h46" stroke-width="6"/></g>`,
  sinai: (c) => `<g fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M96 90 q14 -22 28 0 M100 90 v24 q10 12 20 0 v-24"/><path d="M96 82 q-10 -12 -4 -20 M124 82 q10 -12 4 -20"/>
    <path d="M150 116 v-36 h34 v36 M150 98 h20"/><path d="M200 96 l10 -12 l10 12 l10 -12 l10 12"/><path d="M200 116 l10 -12 l10 12 l10 -12 l10 12"/></g>`,
  indus: (c) => `<g fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"><path d="M104 66 q12 -12 24 0 q-12 12 -24 0z M128 66 l8 -6 v12z"/><path d="M148 58 v20 M156 58 v20 M164 58 v20"/>
    <path d="M182 58 q10 10 20 0 v20 h-20z"/><path d="M212 58 l12 20 M224 58 l-12 20"/>
    <path d="M110 150 q-4 -30 30 -32 q40 -4 54 10 q10 4 8 20 M142 118 q-8 -18 6 -26 M126 150 v14 M150 150 v14 M178 150 v14 M196 148 v14"/><path d="M200 132 l26 -16"/></g>`,
  rongo: (c) => `<g fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"><circle cx="90" cy="84" r="7"/><path d="M90 91 v18 M80 98 l10 4 l10 -6 M90 109 l-8 12 M90 109 l8 12"/>
    <path d="M124 86 q10 -16 20 0 q-10 6 -20 0 M134 92 v26 M126 118 l8 -6 l8 6"/><path d="M164 92 q14 -10 24 4 q-10 10 -24 -4 M188 96 l10 -6 v12z"/>
    <circle cx="222" cy="82" r="6"/><path d="M222 88 v20 l-10 14 M222 108 l10 14 M212 94 q10 8 20 0"/>
    <g transform="rotate(180 160 148)"><circle cx="110" cy="140" r="6"/><path d="M110 146 v16 M102 152 h16"/><path d="M150 140 q10 -14 20 0 q-10 6 -20 0 M160 146 v18"/><path d="M196 136 q14 -8 22 6 q-10 8 -22 -6"/></g></g>`,
};

/** The find on its own, as an svg group (also used by the race and the drawers). */
export function findSvg(s, { size = 30 } = {}) {
  const f = SURFACE[s.find] || SURFACE.stone, rtl = RTL.has(s.id), sample = s.sample ? X(s.sample) : "";
  const body = s.draw ? SKETCH[s.draw](f.ink)
    : s.vertical ? `<text x="160" y="56" font-family='${familyOf(s)}' font-size="${size}" fill="${f.ink}" style="writing-mode:vertical-lr" class="in-ink">${sample}</text>`
    : `<text x="160" y="${s.find === "bone" ? 118 : 116}" font-family='${familyOf(s)}' font-size="${s.size || (s.sample.length > 20 ? size * 0.5 : s.sample.length > 14 ? size * 0.62 : size)}" fill="${f.ink}" text-anchor="middle" class="in-ink"${rtl ? ' direction="rtl"' : ""}>${sample}</text>`;
  const extra = s.find === "seal" ? `<rect x="112" y="64" width="96" height="92" rx="6" fill="none" stroke="${f.edge}" stroke-width="2"/>` : s.find === "papyrus" ? Array.from({ length: 9 }, (_, i) => `<path d="M44 ${56 + i * 13} H276" stroke="#b39a60" stroke-width="1" opacity=".5"/>`).join("") : s.find === "wood" ? Array.from({ length: 6 }, (_, i) => `<path d="M44 ${66 + i * 18} Q160 ${60 + i * 18} 278 ${68 + i * 18}" stroke="#5a3a1c" stroke-width="1.2" fill="none"/>`).join("") : "";
  return `<g class="in-find"><path d="${f.shape}" fill="${f.fill}" stroke="${f.edge}" stroke-width="3"/>${extra}${body}</g>`;
}

const TRAYS = {
  "in-wood": `<rect x="14" y="20" width="292" height="176" rx="10" fill="#5a3a20" stroke="#2e1c0c" stroke-width="3"/><rect x="24" y="30" width="272" height="156" rx="6" fill="#3a2614"/>`,
  "in-drawer": `<rect x="14" y="20" width="292" height="176" rx="6" fill="#2e2a26" stroke="#b8893a" stroke-width="3"/><rect x="24" y="30" width="272" height="156" rx="4" fill="#1e3a2c"/><rect x="24" y="30" width="272" height="156" rx="4" fill="#cfe8ff" opacity=".08" class="in-glass"/>`,
  "in-box": `<rect x="14" y="20" width="292" height="176" rx="4" fill="#8a8e92" stroke="#4a4e52" stroke-width="3"/><rect x="24" y="30" width="272" height="156" rx="2" fill="#d8d6d0"/>`,
};
const COPIES = {
  "in-charcoal": (s) => `<g class="in-copy" transform="translate(236 150) rotate(6)"><rect width="74" height="56" fill="#f3eee2" stroke="#999"/><rect x="6" y="6" width="62" height="44" fill="#2a2a2a" opacity=".55"/><text x="37" y="34" font-size="10" fill="#f3eee2" text-anchor="middle">rubbing</text></g>`,
  "in-squeeze": (s) => `<g class="in-copy" transform="translate(234 148) rotate(-5)"><rect width="76" height="58" fill="#e8e4da" stroke="#b0a890"/><path d="M8 14 h60 M8 26 h52 M8 38 h58" stroke="#bdb6a2" stroke-width="3"/><text x="38" y="54" font-size="9" fill="#6a6250" text-anchor="middle">paper squeeze</text></g>`,
  "in-cast": (s) => `<g class="in-copy" transform="translate(236 148) rotate(4)"><rect width="74" height="58" rx="4" fill="#f6f4ee" stroke="#c8c4b8"/><path d="M10 16 h54 M10 28 h46 M10 40 h52" stroke="#e0dcd0" stroke-width="4"/><text x="37" y="54" font-size="9" fill="#8a8678" text-anchor="middle">plaster cast</text></g>`,
};

/** The whole tray. id = the find's script id (or null for an empty tray); scan = the light sweeps over it (a test). */
export function traySvg({ look, id = null, scan = false, label = "", filed = false } = {}) {
  const s = id ? script(id) : null, L = LIGHTS[look.light] || LIGHTS["in-lamp"];
  return `<svg class="in-tray" viewBox="0 0 320 220" role="img" aria-label="${s ? "An unlabelled find lies in the tray" : "An empty finds tray"}">
    <defs><radialGradient id="in-light" cx="${L.cx / 320}" cy="0.2" r="0.9"><stop offset="0" stop-color="${L.glow}" stop-opacity="${L.op}"/><stop offset="1" stop-color="${L.glow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="in-rake" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
    <linearGradient id="in-sweep" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <rect width="320" height="220" fill="#1C1710"/>${TRAYS[look.tray] || TRAYS["in-wood"]}
    ${s ? `<g class="in-slide">${findSvg(s)}</g>` : `<text x="160" y="116" font-size="13" fill="#C9B58A" text-anchor="middle" opacity=".6">The tray is empty</text>`}
    ${L.rake ? `<rect x="24" y="30" width="272" height="156" fill="url(#in-rake)"/>` : ""}${L.dome ? `<path d="M30 30 Q160 -30 290 30" stroke="#cfe6ff" stroke-width="2" fill="none" opacity=".5"/>${[60, 110, 160, 210, 260].map((x) => `<circle cx="${x}" cy="${x === 160 ? 2 : x === 110 || x === 210 ? 10 : 24}" r="3" fill="#eaf4ff" class="in-led"/>`).join("")}` : ""}
    <rect width="320" height="220" fill="url(#in-light)" class="in-glow"/>
    ${scan ? `<rect class="in-scan" x="-60" y="30" width="60" height="156" fill="url(#in-sweep)"/>` : ""}
    ${s ? (COPIES[look.copy] || COPIES["in-charcoal"])(s) : ""}
    ${filed ? `<g class="in-stamp"><circle cx="70" cy="170" r="20" fill="#E8483B" stroke="#8a1a10" stroke-width="2"/><path d="M60 170 l7 7 l14 -16" stroke="#F1E4C6" stroke-width="3" fill="none"/></g>` : ""}
    ${label ? `<text x="160" y="212" font-size="12" fill="#F1E4C6" text-anchor="middle">${X(label)}</text>` : ""}</svg>`;
}
