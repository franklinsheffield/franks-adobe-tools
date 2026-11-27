// The Mentalist's stage (SVG, 320 x 240): a backdrop, a spotlight that breathes, the mentalist blindfolded on a chair,
// a prop table, face-down cards in the shared card back, the assistant down in the audience with a cue bubble,
// the billet tray, nerve masks, and applause or boos at the end.
import { cardBackSvg } from "../cardbacks.js";
const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const CARD = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const BACKDROP = {
  "mt-velvet": () => `<rect width="320" height="170" fill="#0c0a10"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${20 + i * 40} 0q-8 85 0 170" stroke="#1a1622" stroke-width="10" fill="none"/>`).join("")}`,
  "mt-zancig": () => `<rect width="320" height="170" fill="#140818"/><rect x="40" y="10" width="240" height="30" rx="4" fill="#5a1838" stroke="#E2B04A"/><text x="160" y="24" font-size="9" text-anchor="middle" fill="#FFE3A3" font-family="Georgia,serif" letter-spacing="1">TWO MINDS WITH BUT</text><text x="160" y="35" font-size="9" text-anchor="middle" fill="#FFE3A3" font-family="Georgia,serif" letter-spacing="1">A SINGLE THOUGHT</text>`,
  "mt-egyptian": () => `<rect width="320" height="170" fill="#1a120a"/>${[30, 290].map((x) => `<rect x="${x - 12}" y="10" width="24" height="160" fill="#4a3a1a" stroke="#E2B04A"/><path d="M${x - 16} 10h32M${x - 16} 20h32" stroke="#E2B04A" stroke-width="2"/>`).join("")}<path d="M120 22h80l-8 10h-64z" fill="#E2B04A" opacity=".7"/><circle cx="160" cy="18" r="5" fill="#E2B04A"/>`,
};
const BLIND = {
  "mt-silk": (y) => `<rect x="146" y="${y - 3}" width="28" height="6" rx="2" fill="#050308"/><path d="M174 ${y} l8 6" stroke="#050308" stroke-width="3"/>`,
  "mt-coins": (y) => `<rect x="146" y="${y - 4}" width="28" height="8" rx="2" fill="#050308"/><circle cx="154" cy="${y}" r="3" fill="#E2B04A"/><circle cx="166" cy="${y}" r="3" fill="#E2B04A"/>`,
  "mt-kuda": (y) => `<rect x="145" y="${y - 6}" width="30" height="12" rx="4" fill="#efe6d2"/><path d="M146 ${y - 2}h28M146 ${y + 3}h28" stroke="#cfc4aa"/>`,
};
const PROP = {
  "mt-slate": (txt) => `<rect x="34" y="132" width="50" height="34" rx="2" fill="#2a2f33" stroke="#8a6a3a" stroke-width="3"/>${txt ? `<text x="59" y="153" font-size="10" text-anchor="middle" fill="#fff" font-family="Georgia,serif">${xmlEsc(txt)}</text>` : ""}`,
  "mt-crystal": () => `<circle class="mt-glow" cx="59" cy="146" r="16" fill="#bfe3ff" opacity=".55" stroke="#e8f4ff"/><path d="M48 162h22l-4 6h-14z" fill="#8a6a3a"/>`,
  "mt-dunninger": (txt) => `<rect x="38" y="134" width="42" height="32" fill="#f4ecd8" stroke="#8a6a3a"/><path d="M42 142h34M42 148h30" stroke="#9a8a70"/>${txt ? `<text x="59" y="161" font-size="9" text-anchor="middle" fill="#3a0a0a" font-family="Georgia,serif">${xmlEsc(txt)}</text>` : ""}`,
};
const backOf = (id, x, y, w = 22, h = 31) => cardBackSvg(id, `x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"`) || `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#7a1028" stroke="#FFE3A3"/><path d="M${x + 4} ${y + 4}l${w - 8} ${h - 8}M${x + w - 4} ${y + 4}l${-(w - 8)} ${h - 8}" stroke="#FFE3A3" stroke-width=".6"/>`;

/** opts: { look, back, mode: "force"|"read"|"send"|"hear"|"two"|"billet"|null, card, cue, slips, opened, nerve, state: "hit"|"miss"|"won"|"booed" } */
export function stageSvg({ look = {}, back = "", mode = null, card = null, cue = "", slips = 0, opened = "", nerve = 3, state = null } = {}) {
  const bd = (BACKDROP[look.backdrop] || BACKDROP["mt-velvet"])(), bf = (BLIND[look.blindfold] || BLIND["mt-silk"])(96), pr = (PROP[look.prop] || PROP["mt-slate"])(card ? CARD[card] : "");
  const cards = mode === "force" || mode === "send" || mode === "hear" ? `<g class="mt-cards">${[0, 1, 2, 3, 4].map((i) => `<g class="mt-deal" style="--d:${i * 0.08}s" transform="rotate(${(i - 2) * 9} ${160} 236)">${backOf(back, 149, 176)}</g>`).join("")}</g>` : "";
  const face = card && mode !== "hear" ? `<g class="mt-flip"><rect x="232" y="150" width="26" height="36" rx="3" fill="#fbf7ee" stroke="#5a3a1a"/><text x="245" y="173" font-size="13" text-anchor="middle" fill="#a3122a" font-family="Georgia,serif" font-weight="bold">${CARD[card]}</text></g>` : "";
  const aud = `<g class="mt-aud">${[30, 70, 110, 210, 250, 290].map((x, i) => `<path d="M${x - 14} 240q0 -18 14 -18q14 0 14 18z" fill="#120c16"/><circle cx="${x}" cy="${216 - (i % 2) * 3}" r="8" fill="#1a1220"/>`).join("")}</g>`;
  const assistant = cue ? `<g class="mt-cue"><path d="M240 240q0 -22 16 -22q16 0 16 22z" fill="#2a1530"/><circle cx="256" cy="212" r="9" fill="#3a2040"/><rect x="190" y="182" width="124" height="22" rx="10" fill="#fbf7ee" opacity=".92"/><path d="M246 204l6 6l2 -6z" fill="#fbf7ee"/><text x="252" y="197" font-size="9" text-anchor="middle" fill="#2A0F24" font-family="Georgia,serif" font-style="italic">${xmlEsc(cue.length > 26 ? cue.slice(0, 25) + "…" : cue)}</text></g>` : "";
  const tray = mode === "billet" ? `<g class="mt-tray"><ellipse cx="232" cy="176" rx="34" ry="8" fill="#8a6a3a"/>${Array.from({ length: Math.max(0, slips) }, (_, i) => `<path d="M${212 + i * 9} ${170 - (i % 2) * 2}l8 -4l8 4l-8 4z" fill="#f4ecd8" stroke="#9a8a70"/>`).join("")}</g>
    ${opened ? `<g class="mt-open"><rect x="196" y="116" width="118" height="30" rx="2" fill="#f4ecd8" stroke="#9a8a70" transform="rotate(-3 255 131)"/><text x="255" y="134" font-size="7.5" text-anchor="middle" fill="#3a0a0a" font-family="Georgia,serif" transform="rotate(-3 255 131)">${xmlEsc(opened.length > 34 ? opened.slice(0, 33) + "…" : opened)}</text></g>` : ""}
    <path class="mt-held" d="M174 92l10 -5l10 5l-10 5z" fill="#f4ecd8" stroke="#9a8a70"/>` : "";
  const read = mode === "read" ? `<g class="mt-sitter"><path d="M226 200q0 -30 22 -30q22 0 22 30z" fill="#3a2a40"/><circle cx="248" cy="160" r="12" fill="#4a3650"/><text class="mt-q" x="276" y="150" font-size="16" fill="#FFE3A3">?</text></g>` : "";
  const fx = state === "hit" || state === "won" ? `<g class="mt-fx">${Array.from({ length: 10 }, (_, i) => `<text class="mt-clap" style="--d:${(i * 0.13).toFixed(2)}s" x="${24 + i * 30}" y="${206 - (i % 3) * 10}" font-size="12">${i % 2 ? "👏" : "✨"}</text>`).join("")}</g>`
    : state === "booed" ? `<rect width="320" height="240" fill="#000" opacity=".45"/><g class="mt-stamp"><rect x="100" y="96" width="120" height="34" rx="3" fill="#0009" stroke="#c8203a" stroke-width="3" transform="rotate(-6 160 113)"/><text x="160" y="120" font-size="17" font-weight="700" fill="#ff5a6a" text-anchor="middle" transform="rotate(-6 160 113)" font-family="Georgia,serif">BOOED OFF</text></g>`
    : state === "miss" ? `<text class="mt-hmm" x="40" y="200" font-size="14" fill="#cfc6d8" font-family="Georgia,serif" font-style="italic">murmur… murmur…</text>` : "";
  return `<svg viewBox="0 0 320 240" role="img" aria-label="The mentalist's stage">
  <defs><radialGradient id="mt-spot" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".38"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></radialGradient></defs>
  <rect width="320" height="240" fill="#07050a"/>${bd}<rect y="168" width="320" height="72" fill="#2a1408"/><path d="M0 168h320" stroke="#6a3a1a" stroke-width="3"/>
  <path class="mt-beam" d="M140 0h40l70 200h-180z" fill="url(#mt-spot)"/>
  <g class="mt-chair"><rect x="140" y="128" width="40" height="8" fill="#5a2a14"/><path d="M144 136v34M176 136v34" stroke="#5a2a14" stroke-width="4"/></g>
  <g class="mt-man"><path d="M136 150q0 -42 24 -42q24 0 24 42z" fill="#1c0f22"/><path d="M152 112l8 18l8 -18" fill="#f4ecd8"/><circle cx="160" cy="96" r="15" fill="#d9b8a0"/><path d="M145 90q15 -16 30 0" fill="#1a0a14"/>${bf}</g>
  <g class="mt-prop"><rect x="44" y="166" width="30" height="4" fill="#5a2a14"/><path d="M59 170v30" stroke="#5a2a14" stroke-width="4"/>${pr}</g>
  ${cards}${face}${read}${tray}${aud}${assistant}
  <g>${[0, 1, 2].map((i) => `<text x="${12 + i * 22}" y="22" font-size="16" opacity="${i < nerve ? 1 : 0.22}">🎭</text>`).join("")}</g>${fx}</svg>`;
}
export { xmlEsc };
