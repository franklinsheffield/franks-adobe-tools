// Illuminator drawing: one vellum page built up stage by stage (ruling, text, red headings, sketch, gold, colours,
// outlines and highlights) on the workshop desk. SVG + CSS only; no rules. Look from shop.js: brush, burnisher, palette.
import { pigmentOf } from "./data.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const col = (g, part) => { const z = g && g.zones.find((x) => x.part === part); if (!z) return null; const id = z.got || (z.tried.length ? z.tried[z.tried.length - 1] : null); return id ? pigmentOf(id).hex : null; };

/** The page. g: the game (or null for a finished sample). letter: the initial. */
export function pageSvg(g, letter = "D", sample = false) {
  const has = (s) => sample || (g && g.done.includes(s)), C = (part, dflt) => (sample ? dflt : col(g, part));
  const gold = C("initial", "#e2b04a"), robe = C("robe", "#1f4fbf"), border = C("border", "#d8322a"), leaves = C("leaves", "#3aa06a"), hi = C("highlight", "#f3efe6");
  const lines = (x, y0, n, w) => Array.from({ length: n }, (_, i) => `<path d="M${x} ${y0 + i * 12} h${w - (i % 3) * 8}"/>`).join("");
  return `<svg class="il-page" viewBox="0 0 220 300" aria-hidden="true">
    <rect x="4" y="4" width="212" height="292" rx="3" fill="#efe2c2" stroke="#c8b48a"/>
    ${has("rule") ? `<g class="il-rule" stroke="#c9b48c" stroke-width=".6">${Array.from({ length: 18 }, (_, i) => `<path d="M30 ${40 + i * 12} H190"/>`).join("")}</g><g fill="#a08a64">${Array.from({ length: 18 }, (_, i) => `<circle cx="16" cy="${40 + i * 12}" r=".9"/>`).join("")}</g>` : ""}
    ${has("write") ? `<g class="il-ink" stroke="#2a1b10" stroke-width="2.2" stroke-linecap="round">${lines(110, 40, 6, 78)}${lines(30, 160, 4, 156)}</g>` : ""}
    ${has("rubric") ? `<g class="il-ink" stroke="#c0392b" stroke-width="2.6" stroke-linecap="round"><path d="M30 148 h110"/></g>` : ""}
    ${has("sketch") || has("gild") || has("paint") ? `<g class="il-sketch" fill="none" stroke="#8a7a5a" stroke-width=".8"><rect x="30" y="34" width="70" height="70"/><rect x="62" y="210" width="96" height="74"/><path transform="translate(-40 140)" d="M150 140 q-18 -40 0 -60 q18 20 0 60z"/></g>` : ""}
    ${has("gild") ? `<rect class="il-gold" x="30" y="34" width="70" height="70" rx="3" fill="${gold || "#e9d8a8"}"/>` : ""}
    <text x="65" y="92" text-anchor="middle" font-family="Georgia,serif" font-size="58" font-weight="700" fill="${has("paint") && robe ? robe : has("write") ? "#2a1b10" : "transparent"}" class="il-letter">${esc(letter)}</text>
    ${has("paint") ? `<g transform="translate(-40 140)"><path class="il-fill" d="M150 140 q-18 -40 0 -60 q18 20 0 60z" fill="${robe || "#d9c9a8"}"/><circle class="il-fill" cx="150" cy="74" r="8" fill="#f0d5b8"/></g>` : ""}
    ${has("paint") ? `<g class="il-fill"><path d="M10 10 V290" stroke="${border || "#d9c9a8"}" stroke-width="6"/><path d="M10 290 H210" stroke="${border || "#d9c9a8"}" stroke-width="6"/>${[40, 90, 140, 190, 240].map((y) => `<ellipse cx="${y % 100 ? 18 : 2}" cy="${y}" rx="7" ry="4" transform="rotate(-30 10 ${y})" fill="${leaves || "#d9c9a8"}"/>`).join("")}</g>` : ""}
    ${has("outline") ? `<g class="il-ink" fill="none" stroke="#1d1a17" stroke-width="1.2"><path transform="translate(-40 140)" d="M150 140 q-18 -40 0 -60 q18 20 0 60z"/><rect x="30" y="34" width="70" height="70" rx="3"/><rect x="62" y="210" width="96" height="74"/></g><path class="il-ink" transform="translate(-40 140)" d="M144 100 q6 -10 4 -18 M156 110 q-2 -12 2 -20" stroke="${hi || "#f3efe6"}" stroke-width="1.4" fill="none"/>` : ""}
    ${has("gild") && (sample || (g && g.zones[0].got)) ? `<path class="il-shine" d="M30 34 L60 34 L30 64Z" fill="#fff8d8" opacity=".5"/>` : ""}
  </svg>`;
}
const brushSvg = (id) => id === "il-quill" ? `<path d="M10 70 Q30 40 60 8" stroke="#f3efe6" stroke-width="3" fill="none"/><path d="M60 8 Q44 30 30 50 Q40 26 60 8Z" fill="#f3efe6"/>`
  : id === "il-reed" ? `<path d="M14 72 L62 10" stroke="#c9a96a" stroke-width="5" stroke-linecap="round"/><path d="M14 72 l-4 6 l8 -3z" fill="#2a1b10"/>`
  : `<path d="M14 72 L56 16" stroke="#8a6a3a" stroke-width="4"/><path d="M56 16 q8 -10 10 -14 q-2 8 -6 18z" fill="#6b4a2a"/>`;
const burnSvg = (id) => id === "il-tooth" ? `<path d="M64 60 q6 -20 14 -24 q-2 14 -10 26z" fill="#f3efe6"/><rect x="58" y="60" width="8" height="16" fill="#8a6a3a"/>`
  : id === "il-agate" ? `<path d="M62 56 q8 -16 18 -12 q-4 12 -14 16z" fill="#b5a3c8"/><rect x="58" y="58" width="8" height="18" fill="#5a3d22"/>`
  : `<ellipse cx="70" cy="54" rx="8" ry="5" fill="#5a4a4a"/><rect x="66" y="58" width="8" height="18" fill="#8a6a3a"/>`;

/** The desk with the page on it. look: { brush, burnisher, palette }. */
export function deskHtml({ g = null, letter = "D", look, sample = false, label = "", state = "" }) {
  const shells = look.palette === "il-goldbook" ? `<rect x="6" y="58" width="22" height="16" fill="#e2b04a" stroke="#8a6a3a"/><rect x="9" y="61" width="16" height="10" fill="#f3e0a0"/>`
    : look.palette === "il-horn" ? `<path d="M6 70 q10 -20 26 -14 l-4 14z" fill="#d9c49b" stroke="#8a6a3a"/>`
    : `<ellipse cx="14" cy="66" rx="9" ry="5" fill="#2a2f3a"/><ellipse cx="14" cy="65" rx="6" ry="3" fill="#1f4fbf"/><ellipse cx="30" cy="70" rx="9" ry="5" fill="#2a2f3a"/><ellipse cx="30" cy="69" rx="6" ry="3" fill="#d8322a"/>`;
  return `<div class="il-desk${state ? " " + state : ""}"><div class="il-light"></div>${pageSvg(g, letter, sample)}
    <svg class="il-tools" viewBox="0 0 90 80" aria-hidden="true">${shells}${brushSvg(look.brush)}${burnSvg(look.burnisher)}</svg>${label ? `<div class="il-label">${esc(label)}</div>` : ""}</div>`;
}

export const CSS = () => `
.table.illuminator{padding:0;overflow:hidden}
.il-desk{position:relative;width:100%;height:100%;min-height:260px;background:linear-gradient(160deg,#5a3d22,#3a2414);display:flex;align-items:center;justify-content:center;overflow:hidden}
.il-light{position:absolute;inset:0;background:radial-gradient(circle at 70% 10%,rgba(255,236,180,.35),transparent 60%);pointer-events:none}
.il-page{height:92%;max-width:60%;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5));transform:rotate(-1.5deg)}
.il-tools{position:absolute;right:3%;bottom:4%;width:20%;max-width:130px}
.il-ink{stroke-dasharray:400;stroke-dashoffset:400;animation:il-draw 1.4s ease-out forwards}
.il-rule{animation:il-fade .8s ease-out}
.il-sketch{animation:il-fade 1s ease-out}
.il-gold{animation:il-gold 1.2s ease-out}
.il-shine{animation:il-shine 2.6s ease-in-out infinite}
.il-fill{animation:il-fade .9s ease-out}
.il-letter{transition:fill .6s}
.il-desk.done .il-page{animation:il-lift .9s ease-out}
.il-label{position:absolute;left:4%;top:5%;max-width:40%;font:600 12px Georgia,serif;color:#f3e6c8;letter-spacing:.1em;text-transform:uppercase}
.il-steps .c.done{opacity:.45}
.il-swatch{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:6px;border:1px solid rgba(255,255,255,.4)}
.il-order{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}.il-order span{padding:3px 8px;border-radius:12px;background:rgba(255,255,255,.08);font-size:12px}
@keyframes il-draw{to{stroke-dashoffset:0}}
@keyframes il-fade{from{opacity:0}}
@keyframes il-gold{from{opacity:0;filter:brightness(2)}}
@keyframes il-shine{0%,100%{opacity:.15}50%{opacity:.6}}
@keyframes il-lift{50%{transform:rotate(0) scale(1.04)}}
@media (prefers-reduced-motion:reduce){.il-desk *{animation:none!important;stroke-dashoffset:0!important}}
`;
