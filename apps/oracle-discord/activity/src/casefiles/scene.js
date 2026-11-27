// Case Files drawings (SVG, 320 x 240): the investigator's desk under a lamp, a case folder with the claim's emblem,
// a row of 5 candles (a snuffed one smokes), and an overlay for the tool just used (magnifier, lights, padlock,
// top hat, flask, newspaper). A solved case gets a red EXPOSED stamp.
const LAMP = { "cf-oil": ["#FFE3A3", 0.22], "cf-banker": ["#9fe0b0", 0.2], "cf-safe": ["#ff5a4a", 0.26] };
const FOLDER = { "cf-manila": ["#d8b97a", "#a8884a"], "cf-redtape": ["#e9dcc0", "#b8a888"], "cf-spr": ["#5a2a3a", "#2a0f1a"] };
const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function candles(lit, total = 5) {
  return Array.from({ length: total }, (_, i) => {
    const x = 34 + i * 20, on = i < lit;
    return `<g><rect x="${x - 4}" y="196" width="8" height="22" rx="1.5" fill="#FFF6EE"/><path d="M${x} 196v-4" stroke="#333" stroke-width="1"/>${on
      ? `<path class="cf-flame" d="M${x} 192q5 -8 0 -15q-5 7 0 15z" fill="#FFE3A3"/><circle cx="${x}" cy="186" r="9" fill="#FFE3A3" opacity=".14"/>`
      : `<path class="cf-smoke" d="M${x} 190q-3 -6 0 -10q3 -5 0 -10" stroke="#bbb" stroke-width="1.4" fill="none" opacity=".5"/>`}</g>`;
  }).join("");
}
function lens(id, x, y) {
  const rim = id === "cf-print" ? "#2a2a2a" : id === "cf-codd" ? "#c8c8d0" : "#C9A24A";
  return `<g transform="translate(${x} ${y})"><circle r="22" fill="#cfe8ff22" stroke="${rim}" stroke-width="4"/><path d="M15 15l18 18" stroke="${rim}" stroke-width="6" stroke-linecap="round"/><path d="M-10 -10q6 -6 14 -6" stroke="#fff" stroke-width="2" opacity=".6" fill="none"/></g>`;
}
const TOOL = {
  look: (look) => `<g class="cf-tool"><g class="cf-glide">${lens(look.lens, 170, 104)}</g></g>`,
  lights: () => `<rect class="cf-wash" width="320" height="240" fill="#fff6d0"/><g class="cf-tool"><circle cx="276" cy="30" r="14" fill="#fff6d0"/><path d="M268 44h16v6h-16z" fill="#888"/></g>`,
  control: () => `<g class="cf-tool"><rect x="246" y="96" width="34" height="28" rx="4" fill="#C9A24A" stroke="#5a3a12"/><path d="M252 96v-10a11 11 0 0 1 22 0v10" stroke="#9aa0b4" stroke-width="5" fill="none"/><circle cx="263" cy="108" r="3" fill="#2a1408"/><path d="M263 110v7" stroke="#2a1408" stroke-width="2"/></g>`,
  magician: () => `<g class="cf-tool"><rect x="248" y="86" width="34" height="32" fill="#111"/><rect x="240" y="116" width="50" height="7" rx="3" fill="#111"/><rect x="248" y="108" width="34" height="5" fill="#7a1a3a"/><path d="M232 74l-26 26" stroke="#111" stroke-width="5" stroke-linecap="round"/><path d="M232 74l-5 5" stroke="#fff" stroke-width="5" stroke-linecap="round"/>${[0, 1, 2].map((i) => `<path class="cf-spark" style="--d:${i * 0.35}s" d="M${230 + i * 14} ${62 - i * 6}l2 5l5 2l-5 2l-2 5l-2 -5l-5 -2l5 -2z" fill="#FFE3A3"/>`).join("")}</g>`,
  lab: () => `<g class="cf-tool"><path d="M256 70h14v22l14 30h-42l14 -30z" fill="#cfe8ff33" stroke="#cfe8ff" stroke-width="2"/><path d="M247 112h32l5 10h-42z" fill="#C3A6FF" opacity=".75"/>${[0, 1, 2].map((i) => `<circle class="cf-bub" style="--d:${i * 0.4}s" cx="${258 + i * 6}" cy="110" r="2.4" fill="#fff"/>`).join("")}</g>`,
  record: () => `<g class="cf-tool"><rect x="234" y="78" width="62" height="48" rx="2" fill="#efe6d2" stroke="#8a7f66" transform="rotate(8 265 102)"/><g transform="rotate(8 265 102)"><rect x="240" y="84" width="50" height="7" fill="#2a2018"/>${[96, 102, 108, 114].map((y) => `<path d="M240 ${y}h${y % 12 ? 50 : 30}" stroke="#8a7f66" stroke-width="2"/>`).join("")}</g></g>`,
};

/** The desk for case c. opts: { look, candles, tool, solved, hidden } (hidden = the case title stays a mystery). */
export function deskSvg(c, { look = {}, candles: lit = 5, tool = null, solved = false } = {}) {
  const [lc, lo] = LAMP[look.lamp] || LAMP["cf-oil"], [fa, fb] = FOLDER[look.folder] || FOLDER["cf-manila"], dark = look.folder === "cf-spr";
  const ink = dark ? "#FFE3A3" : "#2A0F24";
  return `<svg viewBox="0 0 320 240" role="img" aria-label="${xmlEsc(c ? c.name : "The case desk")}">
  <defs><radialGradient id="cf-lamp" cx="50%" cy="20%" r="75%"><stop offset="0" stop-color="${lc}" stop-opacity="${lo}"/><stop offset="1" stop-color="${lc}" stop-opacity="0"/></radialGradient>
    <linearGradient id="cf-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1630"/><stop offset="1" stop-color="#1a0612"/></linearGradient></defs>
  <rect width="320" height="240" fill="#140812"/><path d="M0 0h40v240h-40zM280 0h40v240h-40z" fill="#2A0F24"/>${[8, 18, 28, 288, 298, 308].map((x) => `<path d="M${x} 0v240" stroke="#5a2050" stroke-width="2" opacity=".6"/>`).join("")}
  <rect y="150" width="320" height="90" fill="url(#cf-wood)"/><rect width="320" height="240" fill="url(#cf-lamp)"/>
  <g class="cf-folder"><path d="M70 60h70l8 -10h102v116h-180z" fill="${fb}"/><rect x="70" y="62" width="180" height="108" rx="3" fill="${fa}" stroke="#0004"/>
    ${look.folder === "cf-redtape" ? `<path d="M70 118h180M160 62v108" stroke="#b3123a" stroke-width="4"/>` : ""}
    <text x="84" y="80" font-size="9" fill="${ink}" font-family="Georgia,serif" letter-spacing="2">CASE FILE${c ? ` · ${c.year}` : ""}</text>
    <text x="160" y="132" font-size="40" text-anchor="middle">${c ? c.emoji : "🕯️"}</text>
    ${c ? `<text x="160" y="158" font-size="9" fill="${ink}" text-anchor="middle" font-family="Georgia,serif" font-style="italic">${xmlEsc(c.place)}</text>` : ""}
    ${solved ? `<g class="cf-stamp"><rect x="196" y="58" width="80" height="24" rx="3" fill="none" stroke="#c8203a" stroke-width="3" transform="rotate(-12 236 70)"/><text x="236" y="75" font-size="13" font-weight="700" fill="#c8203a" text-anchor="middle" transform="rotate(-12 236 70)" font-family="Georgia,serif">EXPOSED</text></g>` : ""}</g>
  ${candles(lit)}${tool && TOOL[tool] ? TOOL[tool](look) : ""}</svg>`;
}
