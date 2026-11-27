// Vell's Hazardous Guess Show stage: the flame bench (benchSvg) on the left, Magister Vell at his game-show podium on
// the right wearing every mishap so far (singed brows, smoking coat, flashing alarm, cracked goggles, soot) and still
// smiling, a shelf of joke-labelled bottles (one wobbles and falls at the reveal), marquee lights, and a firework finale.
import { benchSvg } from "./scene.js";
import { sample } from "./data.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const PODIUMS = { "ft-podium-brass": ["#f3d27a", "#8a6420"], "ft-podium-neon": ["#ff4fb3", "#3a0a2a"], "ft-podium-lime": ["#d8ff8a", "#2a4a0a"] };
const CSS = `
.hs-svg *{transform-box:fill-box}
.hs-bulb{animation:hs-blink 1.2s steps(2) var(--d) infinite}
.hs-vell{transform-origin:50% 100%;animation:hs-bob 2.4s ease-in-out infinite}
.hs-vell.hit{animation:hs-jolt .5s cubic-bezier(.3,1.8,.5,1),hs-bob 2.4s .5s ease-in-out infinite}
.hs-smoke{animation:hs-rise 2.2s var(--d) ease-out infinite;opacity:0}
.hs-siren{animation:hs-siren .5s steps(2) infinite}
.hs-bottle.fall{transform-origin:50% 100%;animation:hs-fall .9s .3s cubic-bezier(.5,0,.8,.4) both}
.hs-splash{opacity:0;animation:hs-splash .6s 1.15s ease-out both}
.hs-fog{animation:hs-fogin .8s ease-out both}
.hs-burst circle{transform-origin:center;animation:hs-burst 1.6s var(--d) ease-out infinite}
@keyframes hs-blink{50%{opacity:.25}}
@keyframes hs-bob{50%{transform:translateY(-2px)}}
@keyframes hs-jolt{30%{transform:translate(-4px,-6px) rotate(-4deg)}60%{transform:translate(3px,0) rotate(3deg)}}
@keyframes hs-rise{10%{opacity:.7}to{transform:translateY(-40px) scale(1.8);opacity:0}}
@keyframes hs-siren{50%{opacity:.2}}
@keyframes hs-fall{30%{transform:rotate(-20deg)}to{transform:translate(-6px,70px) rotate(-100deg);opacity:0}}
@keyframes hs-splash{0%{opacity:1;transform:scale(.3)}to{opacity:0;transform:scale(1.6)}}
@keyframes hs-fogin{from{opacity:0}}
@keyframes hs-burst{0%{transform:scale(.1);opacity:1}80%{opacity:.9}to{transform:scale(1.4);opacity:0}}
@media (prefers-reduced-motion:reduce){.hs-svg *{animation:none!important}}
`;
function styleOnce() { if (typeof document === "undefined" || document.getElementById("hs-style")) return; const s = document.createElement("style"); s.id = "hs-style"; s.textContent = CSS; document.head.append(s); }

/** Vell at level `mishap` (0-5). */
export function vellSvg(mishap = 0, { hit = false } = {}) {
  const soot = mishap >= 5, skin = soot ? "#6b5a52" : "#f1c9a5";
  const brows = mishap >= 1 ? `<path d="M-12 -22 l3 -2 l2 2 l3 -2 M4 -22 l3 -2 l2 2 l3 -2" stroke="#2a1a10" stroke-width="1.2" fill="none"/>` : `<path d="M-13 -23 q6 -5 11 0 M3 -23 q6 -5 11 0" stroke="#5a3a20" stroke-width="2.4" fill="none"/>`;
  const smoke = mishap >= 2 ? [0, 1, 2].map((k) => `<circle class="hs-smoke" style="--d:${k * 0.7}s" cx="${-14 + k * 14}" cy="18" r="6" fill="#bbb"/>`).join("") : "";
  const goggles = `<g><circle cx="-7" cy="-14" r="7" fill="#bfe8ff" fill-opacity=".45" stroke="#7a5418" stroke-width="2.5"/><circle cx="9" cy="-14" r="7" fill="#bfe8ff" fill-opacity=".45" stroke="#7a5418" stroke-width="2.5"/><path d="M2 -14 h0" stroke="#7a5418" stroke-width="2"/>
    ${mishap >= 4 ? `<path d="M-11 -19 l4 4 l-2 3 l5 4 M6 -20 l3 5 l4 1" stroke="#fff" stroke-width="1" fill="none"/>` : ""}</g>`;
  const spots = soot ? [[-10, 2], [8, -4], [-2, -30], [14, 10], [-16, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#1a1410" opacity=".7"/>`).join("") : "";
  return `<g class="hs-vell${hit ? " hit" : ""}">
    <path d="M-30 60 q0 -40 30 -40 q30 0 30 40Z" fill="${soot ? "#4a4440" : "#f4f1ea"}" stroke="#7a5418" stroke-width="1.5"/><path d="M0 22 v38" stroke="#c9c2b4"/>${smoke}
    <circle cx="0" cy="-12" r="22" fill="${skin}"/><path d="M-22 -20 q4 -18 22 -18 q18 0 22 18 q-8 -8 -22 -8 q-14 0 -22 8Z" fill="${soot ? "#222" : "#c8c8c8"}"/>
    ${brows}${goggles}<path d="M-9 0 q9 9 18 0" stroke="#5a2a1a" stroke-width="2.2" fill="#fff"/>${spots}
    ${mishap >= 3 ? `<g transform="translate(0 -46)"><path d="M-8 6 h16 l-3 -10 h-10Z" fill="#ff2d3d" class="hs-siren"/><path d="M-10 6 h20" stroke="#555" stroke-width="3"/></g>` : ""}</g>`;
}

/** The whole stage. o: { look, flame (sample id or colours), mishap, hit, label, shelf, drop, fog, firework (sample id), podium, party } */
export function showSvg({ look, flame = null, mishap = 0, hit = false, label = "", shelf = [], drop = null, fog = false, firework = null, podium = "ft-podium-brass", title = "HAZARDOUS GUESS SHOW" } = {}) {
  styleOnce();
  const s = typeof flame === "string" ? sample(flame) : null, colours = s ? s.flame : flame;
  const bench = benchSvg({ look, flame: colours, label: label ? `“${label}”` : "" }).replace("<svg ", '<svg x="0" y="34" width="250" height="188" ');
  const P = PODIUMS[podium] || PODIUMS["ft-podium-brass"];
  const bulbs = Array.from({ length: 18 }, (_, k) => `<circle class="hs-bulb" style="--d:${(k % 2) * 0.6}s" cx="${12 + k * 21.5}" cy="10" r="3.2" fill="${P[0]}"/>`).join("");
  const bottles = shelf.map((l, k) => { const x = 268 + k * 40, falls = drop === k;
    return `<g class="hs-bottle${falls ? " fall" : ""}"><path d="M${x} 60 h14 v6 l6 8 v26 h-26 v-26 l6 -8Z" fill="${["#8fe0c8", "#e0b08f", "#c8a0ff"][k]}" fill-opacity=".75" stroke="#3a2a18"/>
      <rect x="${x - 4}" y="80" width="22" height="12" fill="#f3e6c8"/><text x="${x + 7}" y="89" font-size="6" text-anchor="middle" fill="#3a2a18">${esc(l.split(" ")[0])}</text></g>
      ${falls ? `<g class="hs-splash"><ellipse cx="${x + 4}" cy="176" rx="22" ry="6" fill="${["#8fe0c8", "#e0b08f", "#c8a0ff"][k]}" opacity=".8"/><text x="${x + 4}" y="168" font-size="12" text-anchor="middle">💥</text></g>` : ""}`; }).join("");
  const fw = firework ? (() => { const c = sample(firework).flame; return `<g class="hs-burst">${[[120, 70, 0], [200, 50, 0.4], [300, 80, 0.8], [160, 110, 1.2]].map(([x, y, d]) => `<g style="--d:${d}s">${Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2;
      return `<circle cx="${(x + Math.cos(a) * 26).toFixed(1)}" cy="${(y + Math.sin(a) * 26).toFixed(1)}" r="3" fill="${c[k % 3]}"/>`; }).join("")}<circle cx="${x}" cy="${y}" r="5" fill="${c[0]}"/></g>`).join("")}</g>`; })() : "";
  return `<svg class="hs-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vell's Hazardous Guess Show">
<rect x="-600" y="-400" width="1600" height="1100" fill="#0c0a08"/><rect width="400" height="300" fill="#14110d"/>
<rect width="400" height="22" fill="${P[1]}"/>${bulbs}
${bench}<rect x="100" y="25" width="200" height="18" rx="4" fill="#14110d" opacity=".85"/><text x="200" y="38" font-size="12" font-weight="700" fill="${P[0]}" text-anchor="middle" font-family="Cinzel, Georgia, serif" letter-spacing="2">VELL'S ${esc(title)}</text>${fog ? `<g class="hs-fog"><rect x="20" y="60" width="210" height="150" rx="30" fill="#e8eef2" opacity=".82"/><text x="125" y="140" font-size="12" text-anchor="middle" fill="#556">fogged goggles!</text></g>` : ""}
<path d="M262 102 h130" stroke="#5a4630" stroke-width="4"/>${bottles}
<g transform="translate(322 190)">${vellSvg(mishap, { hit })}</g>
<path d="M280 250 h84 l-8 50 h-68Z" fill="${P[1]}" stroke="${P[0]}" stroke-width="2"/><text x="322" y="272" font-size="9" fill="${P[0]}" text-anchor="middle" font-family="Cinzel, Georgia, serif">MAGISTER VELL</text>
${fw}</svg>`;
}
