// Dark Séance drawing (SVG, 320 x 240): a darkened room seen from above-front. A round table with a candle snuffed,
// the sitters' hands (glowing bands when that control is on), the spirit cabinet behind, the medium's chair at the
// front, 3 eyes of suspicion, the effect you just produced, and an investigator's flashlight beam (rotated by the room).
const PAINT = { "ds-balmain": "#b8f0ff", "ds-radium": "#9dff8a", "ds-modern": "#7ab8ff" };
const TABLE = { "ds-tripod": ["#6b3a1e", "#3a1d0c"], "ds-oak": ["#8a5a2e", "#4a2e14"], "ds-faraday": ["#6b3a1e", "#3a1d0c"] };
const CAB = { "ds-curtain": ["#2a0f24", "#5a2050"], "ds-davenport": ["#4a2e14", "#7a5428"], "ds-margery": ["#5a3a1a", "#8a6a3a"] };
const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const FX = {
  rap: () => `<g class="ds-fx">${[0, 1, 2].map((i) => `<circle class="ds-ring" style="--d:${i * 0.3}s" cx="160" cy="150" r="10" fill="none" stroke="#fff" stroke-width="2"/>`).join("")}</g>`,
  tilt: () => "",
  breeze: () => `<g class="ds-fx">${[0, 1, 2].map((i) => `<path class="ds-wind" style="--d:${i * 0.25}s" d="M90 ${100 + i * 14}q20 -8 40 0t40 0t40 0" stroke="#cfe8ff" stroke-width="2" fill="none" opacity=".6"/>`).join("")}</g>`,
  touch: () => `<text class="ds-fx ds-float" x="214" y="150" font-size="26">✋</text>`,
  bell: () => `<text class="ds-fx ds-ring2" x="196" y="118" font-size="24">🔔</text>`,
  trumpet: () => `<text class="ds-fx ds-float" x="140" y="82" font-size="30">📯</text>`,
  voice: () => `<g class="ds-fx"><text class="ds-float" x="140" y="82" font-size="30">📯</text><text x="178" y="64" font-size="12" fill="#cfe8ff" font-style="italic" font-family="Georgia,serif">“Hello…”</text></g>`,
  tambourine: () => `<text class="ds-fx ds-shake" x="146" y="52" font-size="26">🪘</text>`,
  form: () => `<path class="ds-fx ds-ghost" d="M160 30q-22 0 -24 30v40l8 -6l8 6l8 -6l8 6l8 -6l8 6v-40q-2 -30 -24 -30z" fill="#f4f0ff" opacity=".75"/>`,
  apport: () => `<g class="ds-fx">${[0, 1, 2].map((i) => `<text class="ds-drop" style="--d:${i * 0.2}s" x="${138 + i * 18}" y="138" font-size="16">🌸</text>`).join("")}</g>`,
  slate: () => `<g class="ds-fx"><rect x="184" y="126" width="36" height="24" rx="2" fill="#2a2f33" stroke="#8a6a3a" stroke-width="2"/><path d="M190 134h22M190 140h16" stroke="#fff" stroke-width="1.4"/></g>`,
};
/** The séance room. opts: { look, controls, effect, eyes, caught, exposed }. The beam (id ds-beam) is rotated by the room. */
export function roomSvg({ look = {}, controls = [], effect = null, eyes = 3, caught = false, exposed = false } = {}) {
  const paint = PAINT[look.paint] || PAINT["ds-balmain"], [ta, tb] = TABLE[look.table] || TABLE["ds-tripod"], [ca, cb] = CAB[look.cabinet] || CAB["ds-curtain"];
  const bands = controls.includes("bands"), light = controls.includes("light"), torch = controls.includes("torch"), tilt = effect === "tilt";
  const hands = [[112, 148], [208, 148], [126, 116], [194, 116], [160, 106]].map(([x, y]) => `<g><circle cx="${x}" cy="${y}" r="6" fill="#d9b8a0" opacity=".7"/>${bands ? `<circle class="ds-glow" cx="${x}" cy="${y}" r="9" fill="none" stroke="${paint}" stroke-width="2.4"/>` : ""}</g>`).join("");
  const cab = look.cabinet === "ds-margery" ? `<rect x="122" y="14" width="76" height="56" fill="${ca}" stroke="${cb}" stroke-width="3"/><circle cx="160" cy="24" r="6" fill="#0008"/><circle cx="136" cy="44" r="4" fill="#0008"/><circle cx="184" cy="44" r="4" fill="#0008"/>`
    : look.cabinet === "ds-davenport" ? `<rect x="114" y="8" width="92" height="64" fill="${ca}" stroke="${cb}" stroke-width="3"/><path d="M144 8v64M176 8v64" stroke="${cb}" stroke-width="2"/><circle cx="160" cy="22" r="3" fill="#0008"/>`
    : `<path d="M110 6h100v66h-100z" fill="${ca}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${116 + i * 17} 6q4 33 0 66" stroke="${cb}" stroke-width="3" fill="none"/>`).join("")}`;
  return `<svg viewBox="0 0 320 240" role="img" aria-label="The séance room">
  <defs><radialGradient id="ds-red" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#ff3a2a" stop-opacity=".22"/><stop offset="1" stop-color="#ff3a2a" stop-opacity="0"/></radialGradient>
    <linearGradient id="ds-beamg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6d0" stop-opacity=".75"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></linearGradient></defs>
  <rect width="320" height="240" fill="#07050a"/><g class="ds-cab">${cab}</g>
  ${light ? `<rect width="320" height="240" fill="url(#ds-red)"/><circle cx="290" cy="22" r="7" fill="#ff5a4a"/>` : ""}
  <g class="ds-sitters">${[[96, 112], [224, 112], [74, 156], [246, 156], [160, 92]].map(([x, y]) => `<path d="M${x - 18} ${y + 26}q0 -22 18 -22q18 0 18 22z" fill="#1a1220"/><circle cx="${x}" cy="${y - 2}" r="10" fill="#22182a"/>`).join("")}</g>
  <g class="ds-table${tilt ? " ds-tilt" : ""}"><ellipse cx="160" cy="132" rx="70" ry="32" fill="${ta}" stroke="${tb}" stroke-width="3"/>${look.table === "ds-faraday" ? `<rect x="146" y="124" width="28" height="14" fill="#efe2c2" opacity=".85"/><path d="M160 131l14 -10" stroke="#a3122a" stroke-width="1.5"/>` : ""}${look.table === "ds-tripod" ? `<path d="M150 162l-14 22M170 162l14 22M160 164v24" stroke="${tb}" stroke-width="4"/>` : `<path d="M120 158v26M200 158v26" stroke="${tb}" stroke-width="6"/>`}</g>
  ${hands}
  <g class="ds-medium"><path d="M136 236q0 -40 24 -40q24 0 24 40z" fill="#1c0f22"/><circle cx="160" cy="190" r="13" fill="#2a1530"/>${bands ? `<circle class="ds-glow" cx="142" cy="214" r="5" fill="none" stroke="${paint}" stroke-width="2"/><circle class="ds-glow" cx="178" cy="214" r="5" fill="none" stroke="${paint}" stroke-width="2"/>` : ""}</g>
  ${effect && FX[effect] ? FX[effect]() : ""}
  ${torch ? `<g id="ds-beam" transform="rotate(0 160 120)"><path d="M160 120L330 70L330 170Z" fill="url(#ds-beamg)"/><circle cx="160" cy="120" r="4" fill="#fff6d0"/></g>` : ""}
  <g>${[0, 1, 2].map((i) => `<text x="${12 + i * 22}" y="22" font-size="16" opacity="${i < 3 - eyes ? 1 : 0.22}">👁️</text>`).join("")}</g>
  ${caught ? `<rect class="ds-flash" width="320" height="240" fill="#fff"/>` : ""}
  ${exposed ? `<g class="ds-stamp"><rect x="96" y="96" width="128" height="34" rx="3" fill="#0009" stroke="#c8203a" stroke-width="3" transform="rotate(-8 160 113)"/><text x="160" y="120" font-size="17" font-weight="700" fill="#ff5a6a" text-anchor="middle" transform="rotate(-8 160 113)" font-family="Georgia,serif">EXPOSED</text></g>` : ""}</svg>`;
}
export { xmlEsc };
