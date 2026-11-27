// Lead into Gold drawings: a nucleus of protons and neutrons, a proton/neutron chart with the path taken, and the
// flying alpha particles, electrons and beam pulses. All SVG; motion is CSS (see CSS below).
import { label, elName, GOLD } from "./data.js";
import { shopItem, DEFAULT_LOOK } from "./shop.js";
export const CSS = `.table.leadgold{background:#07060f;pointer-events:auto}
.lg-svg{position:absolute;inset:0;width:100%;height:100%}
.lg-nuc{transform-origin:110px 118px;animation:lg-wob 3s ease-in-out infinite}@keyframes lg-wob{50%{transform:scale(1.03) rotate(2deg)}}
.lg-fly{animation:lg-fly .9s ease-out forwards}@keyframes lg-fly{from{transform:translate(0,0);opacity:1}to{transform:translate(var(--dx),var(--dy));opacity:0}}
.lg-beam{stroke-dasharray:6 8;animation:lg-beam .5s linear forwards}@keyframes lg-beam{from{stroke-dashoffset:120;opacity:1}to{stroke-dashoffset:0;opacity:0}}
.lg-flash{animation:lg-flash .6s ease-out forwards}@keyframes lg-flash{from{opacity:.9;r:4}to{opacity:0;r:60}}
.lg-now{animation:lg-pulse 1.2s ease-in-out infinite}@keyframes lg-pulse{50%{r:6}}
.lg-goldglow{animation:lg-gg 1.6s ease-in-out infinite alternate}@keyframes lg-gg{to{opacity:.95}}
.lg-ctl{display:flex;flex-wrap:wrap;gap:4px}.lg-ctl .c{flex:1 1 auto}
.lg-dots{letter-spacing:.2em;color:#E2B04A}.lg-card{border-left:3px solid #ffd25e;padding:4px 10px;margin:6px 0;color:#f3ead2}
@media (prefers-reduced-motion:reduce){.lg-nuc,.lg-fly,.lg-beam,.lg-flash,.lg-now,.lg-goldglow{animation:none}}`;
const lampOf = (look) => (shopItem(look.lamp) || shopItem(DEFAULT_LOOK.lamp)).hex;
/** Balls in a nucleus, packed in a spiral: red protons, grey neutrons, in proportion. */
export function nucleusSvg(z, a, { x = 110, y = 118, gold = false } = {}) {
  const n = 44, reds = Math.round((n * z) / a), out = [];
  for (let i = 0; i < n; i++) { const r = 5.2 * Math.sqrt(i), t = i * 2.4; out.push([x + r * Math.cos(t), y + r * Math.sin(t), (i * 7) % n < reds]); }
  out.sort((p, q) => p[1] - q[1]);
  return `<g class="lg-nuc">${gold ? `<circle class="lg-goldglow" cx="${x}" cy="${y}" r="46" fill="#ffd25e" opacity=".35"/>` : ""}${out.map(([px, py, p]) => `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.4" fill="${p ? (gold ? "#ffcf4a" : "#e2574a") : "#b9bfcc"}" stroke="#0007" stroke-width=".8"/>`).join("")}</g>
    <text x="${x}" y="${y + 58}" text-anchor="middle" fill="#f3ead2" font-size="15" font-weight="700">${label(z, a)}</text><text x="${x}" y="${y + 74}" text-anchor="middle" fill="#a9a3c4" font-size="10">${elName(z)} · ${z} protons · ${a - z} neutrons</text>`;
}
const CX = (nn) => 222 + ((nn - 112) / 36) * 166, CY = (z) => 228 - ((z - 77) / 17) * 196;
/** The proton/neutron chart: neutrons across, protons up. Lead's row and gold-197 are marked; the path is drawn. */
export function chartSvg(path = [], { goal = null } = {}) {
  const dots = []; for (let z = 78; z <= 93; z++) for (let nn = 114; nn <= 146; nn += 2) dots.push(`<circle cx="${CX(nn).toFixed(1)}" cy="${CY(z).toFixed(1)}" r=".9" fill="#3b3560"/>`);
  const pts = path.map((p) => `${CX(p.a - p.z).toFixed(1)},${CY(p.z).toFixed(1)}`).join(" "), cur = path[path.length - 1];
  const g = goal || GOLD;
  return `<rect x="214" y="22" width="180" height="222" rx="8" fill="#0d0b1c" stroke="#3a3060"/>${dots.join("")}
    <rect x="216" y="${(CY(82) - 5).toFixed(1)}" width="176" height="10" fill="#7f8aa3" opacity=".18"/><text x="390" y="${(CY(82) - 7).toFixed(1)}" text-anchor="end" fill="#a9b2c8" font-size="8">lead (82)</text>
    <rect x="216" y="${(CY(79) - 5).toFixed(1)}" width="176" height="10" fill="#ffd25e" opacity=".12"/><text x="390" y="${(CY(79) - 7).toFixed(1)}" text-anchor="end" fill="#ffd25e" font-size="8">gold (79)</text>
    <text x="${CX(g.a - g.z).toFixed(1)}" y="${(CY(g.z) + 4).toFixed(1)}" text-anchor="middle" font-size="12">⭐</text>
    ${pts ? `<polyline points="${pts}" fill="none" stroke="#ffd25e" stroke-width="1.6" stroke-linejoin="round" opacity=".85"/>` : ""}
    ${cur ? `<circle class="lg-now" cx="${CX(cur.a - cur.z).toFixed(1)}" cy="${CY(cur.z).toFixed(1)}" r="4" fill="#fff"/>` : ""}
    <text x="304" y="240" text-anchor="middle" fill="#8c86ad" font-size="8">neutrons →</text><text x="220" y="34" fill="#8c86ad" font-size="8">↑ protons</text>`;
}
/** The whole table: lamp glow, nucleus, chart and charm. */
export function benchSvg({ z, a, path = [], look = DEFAULT_LOOK, gold = false } = {}) {
  const lamp = lampOf(look), charm = shopItem(look.charm) || shopItem(DEFAULT_LOOK.charm);
  return `<svg class="lg-svg" id="lg-svg" viewBox="0 0 400 260" role="img" aria-label="A nucleus on the transmutation bench, and a chart of protons and neutrons">
    <defs><radialGradient id="lg-lamp"><stop offset="0" stop-color="${lamp}" stop-opacity=".45"/><stop offset="1" stop-color="${lamp}" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="260" fill="#07060f"/><circle cx="110" cy="118" r="120" fill="url(#lg-lamp)"/>
    ${z ? nucleusSvg(z, a, { gold }) : ""}${chartSvg(path)}<text x="14" y="248" font-size="18">${charm.e}</text><g id="lg-fx"></g></svg>`;
}
/** Effects dropped into #lg-fx. */
export const alphaFx = () => `<g class="lg-fly" style="--dx:-120px;--dy:-80px"><circle cx="110" cy="118" r="5" fill="#e2574a"/><circle cx="119" cy="118" r="5" fill="#b9bfcc"/><circle cx="110" cy="127" r="5" fill="#b9bfcc"/><circle cx="119" cy="127" r="5" fill="#e2574a"/></g><text class="lg-fly" style="--dx:-90px;--dy:-60px" x="96" y="100" fill="#ffb0a8" font-size="11">α</text>`;
export const betaFx = () => `<g class="lg-fly" style="--dx:-140px;--dy:70px"><circle cx="110" cy="118" r="2.5" fill="#7fc8ff"/><path d="M110 118 l-14 7" stroke="#7fc8ff" stroke-width="1.5"/></g><text class="lg-fly" style="--dx:-110px;--dy:50px" x="100" y="138" fill="#7fc8ff" font-size="11">β⁻</text>`;
export const beamFx = () => `<line class="lg-beam" x1="0" y1="118" x2="110" y2="118" stroke="#9ee7ff" stroke-width="2"/><circle class="lg-flash" cx="110" cy="118" r="4" fill="#fff"/>`;
