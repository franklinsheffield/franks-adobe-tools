// Workshop drawing (SVG, 320 x 240): a small rehearsal stage. Curtains (shop colour) frame a workbench holding the
// trick's emoji, a stage light washes it, and 3 spotlights hang above (a slip dims one). A clean rehearsal gets a
// bow and falling roses; a flop drops the curtain.
const CURTAIN = { "ws-red": ["#a3122a", "#5c0715"], "ws-plum": ["#8a4bb0", "#3e1a58"], "ws-gold": ["#c99a2e", "#6e4f10"] };
const BENCH = { "ws-pine": ["#c89a5a", "#7a5428"], "ws-black": ["#151515", "#000"], "ws-servante": ["#6b2f1a", "#3a170b"] };
const LIGHT = { "ws-candle": ["#FFE3A3", 0.22], "ws-lime": ["#f4fbff", 0.32], "ws-gas": ["#cfe8a8", 0.24] };
const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function spots(lit, total = 3) {
  return Array.from({ length: total }, (_, i) => {
    const x = 110 + i * 50, on = i < lit;
    return `<g><path d="M${x} 0v14" stroke="#555" stroke-width="2"/><path d="M${x - 9} 14h18l-4 10h-10z" fill="#333" stroke="#777"/>${on
      ? `<path class="ws-beam" d="M${x - 5} 24L${x - 34} 170h58L${x + 5} 24z" fill="#fff6d0" opacity=".1"/><circle cx="${x}" cy="25" r="3.4" fill="#fff6d0"/>`
      : `<circle cx="${x}" cy="25" r="3.4" fill="#444"/>`}</g>`;
  }).join("");
}
/** The stage for trick t. opts: { look, lights, state: null | "bow" | "flop" }. */
export function stageSvg(t, { look = {}, lights = 3, state = null } = {}) {
  const [ca, cb] = CURTAIN[look.curtain] || CURTAIN["ws-red"], [ba, bb] = BENCH[look.bench] || BENCH["ws-pine"], [lc, lo] = LIGHT[look.light] || LIGHT["ws-candle"];
  const folds = (x0, dir) => [0, 1, 2, 3, 4].map((i) => `<path d="M${x0 + dir * i * 11} 0q${dir * 6} 120 ${dir * 2} 240" stroke="${cb}" stroke-width="4" fill="none" opacity=".7"/>`).join("");
  return `<svg viewBox="0 0 320 240" role="img" aria-label="${xmlEsc(t ? t.name : "The Workshop stage")}">
  <defs><radialGradient id="ws-wash" cx="50%" cy="80%" r="70%"><stop offset="0" stop-color="${lc}" stop-opacity="${lo}"/><stop offset="1" stop-color="${lc}" stop-opacity="0"/></radialGradient></defs>
  <rect width="320" height="240" fill="#120a10"/><rect y="176" width="320" height="64" fill="#2a1a10"/>${[190, 206, 222].map((y) => `<path d="M0 ${y}h320" stroke="#3a2618" stroke-width="2"/>`).join("")}
  <rect width="320" height="240" fill="url(#ws-wash)"/>${spots(lights)}
  <g class="ws-bench"><rect x="104" y="138" width="112" height="12" rx="2" fill="${ba}" stroke="${bb}"/><path d="M112 150v32M208 150v32" stroke="${bb}" stroke-width="6"/>${look.bench === "ws-servante" ? `<rect x="104" y="150" width="112" height="6" fill="${bb}" opacity=".8"/>` : ""}
    <text class="ws-prop" x="160" y="132" font-size="40" text-anchor="middle">${t ? t.emoji : "🎩"}</text></g>
  ${state === "bow" ? `<g class="ws-roses">${[0, 1, 2, 3, 4].map((i) => `<text style="--d:${i * 0.18}s" x="${80 + i * 40}" y="40" font-size="16">🌹</text>`).join("")}</g>` : ""}
  <g class="ws-cl"><path d="M0 0h70q-14 120 4 240h-74z" fill="${ca}"/>${folds(8, 1)}</g><g class="ws-cr"><path d="M320 0h-70q14 120 -4 240h74z" fill="${ca}"/>${folds(312, -1)}</g>
  <path d="M0 0h320v18q-160 18 -320 0z" fill="${ca}"/><path d="M0 18q160 18 320 0" stroke="#E2B04A" stroke-width="2" fill="none"/>
  ${state === "flop" ? `<rect class="ws-drop" width="320" height="240" fill="${ca}"/>` : ""}</svg>`;
}
