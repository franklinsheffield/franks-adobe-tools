// The Observatory's animated menu background (#🔭-observatory only). Pure markup + CSS, no DOM work: the Houses engine
// puts obsBg() behind Keeper Altair's home screen. Everything in it is real:
// - the stars wheel slowly round Polaris, as the real sky does once every 23 hours 56 minutes (shown sped up);
// - the Moon shows its real phase tonight;
// - on real meteor-shower peak nights (curios.js SHOWERS) meteors fall more often, with the shower's name in the corner;
// - the dome's slit is open at night for the player's city and closed by day;
// - a faint band of the Milky Way crosses the sky.
// Brand colours (brand/houses/README.md, House 3): Deep Sky #0B1530, Polaris Blue #8FB8FF, Star Silver #DCE6FF,
// Brick Gold #E2B04A, Chart Navy #2A3F6E. Respects prefers-reduced-motion.
import { moonLight } from "../scene.js";
import { SHOWERS } from "../curios.js";
import { sunAlt } from "../stars/tonight.js";
import { placeOf } from "./engine.js";

/** The real shower peaking tonight (its peak night or the night after), or null. */
export function showerTonight(at = Date.now()) {
  const d = new Date(at), M = d.getMonth() + 1, D = d.getDate();
  const s = SHOWERS.find(([, m, day]) => m === M && (D === day || D === day + 1)); return s ? s[0] : null;
}
/** Night for a place: the Sun more than 6° below the horizon (civil twilight over). No place: the device's evening hours. */
export const isNight = (at = Date.now(), place = null) => (place ? sunAlt(place, at) < -6 : ((h) => h >= 19 || h < 6)(new Date(at).getHours()));

export const OBS_BG_CSS = `.obs-bg{position:absolute;inset:0;overflow:hidden;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 50% 110%,#1d2f5c 0%,#0B1530 50%,#050a18 100%)}
.obs-bg svg{position:absolute;inset:0;width:100%;height:100%}
.obs-bg .ob-wheel{transform-origin:var(--px) var(--py);animation:ob-turn 240s linear infinite}
@keyframes ob-turn{to{transform:rotate(-360deg)}}
.obs-bg .ob-tw{animation:ob-tw 4s ease-in-out infinite}.obs-bg .ob-tw:nth-of-type(3n){animation-delay:-1.3s}.obs-bg .ob-tw:nth-of-type(5n){animation-delay:-2.6s}
@keyframes ob-tw{0%,100%{opacity:.9}50%{opacity:.35}}
.obs-bg .ob-met{opacity:0;animation:ob-met var(--mt,11s) linear infinite;animation-delay:var(--md,0s)}
@keyframes ob-met{0%{opacity:0;transform:translate(0,0)}2%{opacity:1}7%{opacity:0;transform:translate(-170px,95px)}100%{opacity:0;transform:translate(-170px,95px)}}
.obs-bg .ob-slit{transition:opacity 2s}.obs-bg .ob-beam{animation:ob-beam 9s ease-in-out infinite alternate}
@keyframes ob-beam{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
.obs-bg .ob-shower{position:absolute;right:12px;top:10px;font:600 .72rem/1 var(--display,serif);letter-spacing:.12em;color:#8FB8FF;text-transform:uppercase;opacity:.85}
.obs-bg .mb-hot{pointer-events:auto;cursor:pointer}
@media (prefers-reduced-motion:reduce){.obs-bg *{animation:none!important}}`;

/** The background markup for a moment and (optionally) the player's city. */
export function obsBg(at = Date.now(), place = null) {
  const W = 1000, H = 600, px = 500, py = 120; // Polaris sits high in the middle; the wheel turns round it
  let seed = 20261127; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const stars = Array.from({ length: 220 }, () => { const a = r() * 6.283, d = 40 + Math.pow(r(), 0.7) * 760, m = r();
    return `<circle class="${m > 0.8 ? "ob-tw" : ""}" cx="${(px + d * Math.cos(a)).toFixed(1)}" cy="${(py + d * Math.sin(a)).toFixed(1)}" r="${(0.5 + m * m * 1.6).toFixed(2)}" fill="${m > 0.93 ? "#ffd2a1" : m > 0.86 ? "#aabfff" : "#DCE6FF"}" opacity="${(0.45 + m * 0.5).toFixed(2)}"/>`; }).join("");
  const milky = `<g class="mb-hot" data-tap="milkyway"><path d="M-200 520 C150 330 420 260 700 160 C860 100 1000 60 1300 -60" stroke="#8FB8FF" stroke-width="120" stroke-linecap="round" fill="none" opacity=".035"/><path d="M-200 520 C150 330 420 260 700 160 C860 100 1000 60 1300 -60" stroke="#DCE6FF" stroke-width="40" fill="none" opacity=".03"/></g>`;
  const shower = showerTonight(at), n = shower ? 7 : 2;
  const meteors = Array.from({ length: n }, (_, i) => `<g class="ob-met mb-hot" data-tap="meteor" style="--mt:${shower ? 6 + (i % 3) * 2 : 14 + i * 5}s;--md:${(i * 2.3).toFixed(1)}s"><line x1="${780 - i * 90}" y1="${60 + (i * 47) % 160}" x2="${820 - i * 90}" y2="${38 + (i * 47) % 160}" stroke="#DCE6FF" stroke-width="1.6" stroke-linecap="round"/><line x1="${780 - i * 90}" y1="${60 + (i * 47) % 160}" x2="${820 - i * 90}" y2="${38 + (i * 47) % 160}" stroke="transparent" stroke-width="22"/></g>`).join("");
  const { lit, waxing } = moonLight(at), mx = 850, my = 110, mr = 26, rx = Math.abs(1 - 2 * lit) * mr;
  const moon = lit < 0.03 ? `<circle cx="${mx}" cy="${my}" r="${mr}" fill="#0d1733" stroke="#2A3F6E"/>`
    : `<circle cx="${mx}" cy="${my}" r="${mr}" fill="#141d38"/><path d="M${mx} ${my - mr} A${mr} ${mr} 0 0 ${waxing ? 1 : 0} ${mx} ${my + mr} A${rx.toFixed(1)} ${mr} 0 0 ${(lit > 0.5) === waxing ? 1 : 0} ${mx} ${my - mr}Z" fill="#f4f1e6"/><circle cx="${mx}" cy="${my}" r="${mr + 14}" fill="#f4f1e6" opacity="${(0.05 * lit).toFixed(3)}"/>`;
  const moonHot = `<g class="mb-hot" data-tap="moon">${moon}</g>`;
  const open = isNight(at, place);
  const dome = `<g class="mb-hot" data-tap="dome" transform="translate(500 600)"><path d="M-190 0 A190 170 0 0 1 190 0Z" fill="#0f1b3a" stroke="#2A3F6E" stroke-width="2"/>
    <path class="ob-slit" d="M-26 -168 L26 -168 L30 0 L-30 0Z" fill="#050a18" opacity="${open ? 1 : 0.15}"/>
    ${open ? `<g class="ob-beam" style="transform-origin:0 -40px"><rect x="-9" y="-150" width="18" height="110" rx="6" fill="#E2B04A" opacity=".8"/><circle cx="0" cy="-40" r="12" fill="#2A3F6E" stroke="#E2B04A" stroke-width="2"/></g>` : ""}
    ${[-130, -70, 70, 130].map((x) => `<line x1="${x}" y1="0" x2="${x * 0.55}" y2="${-Math.sqrt(Math.max(0, 1 - (x / 190) ** 2)) * 170 + 6}" stroke="#2A3F6E" stroke-width="1.5"/>`).join("")}
    <rect x="-240" y="-6" width="480" height="12" fill="#0B1530" stroke="#2A3F6E"/></g>`;
  return `<div class="obs-bg" aria-hidden="true"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
    <g class="ob-wheel" style="--px:${px}px;--py:${py}px">${milky}${stars}</g>
    <g class="mb-hot" data-tap="polaris"><circle cx="${px}" cy="${py}" r="2.4" fill="#DCE6FF"/><circle cx="${px}" cy="${py}" r="16" fill="#8FB8FF" opacity=".12"/></g>
    ${moonHot}${meteors}${dome}</svg>${shower ? `<div class="ob-shower">☄️ ${shower} tonight</div>` : ""}</div>`;
}

/** The Houses engine's menu-background slot: { css, html(at, { prog }) }. City only, from the player's saved place. */
export const menuBg = { css: OBS_BG_CSS, html: (at = Date.now(), { prog } = {}) => obsBg(at, prog ? placeOf(prog) : null) };
