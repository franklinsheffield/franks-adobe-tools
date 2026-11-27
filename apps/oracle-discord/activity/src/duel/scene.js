// Element Duel's table, drawn in the Chamber's table pane (400 × 300 SVG).
// Top: the Oracle's hand (card backs) and its Stability. Left: this round's lab condition card. Right: the bonus
// compound. Centre: the reaction: atoms fly in, fuse into a molecule, flash, and the damage flies at the target.
// Bottom: your Stability and discoveries. Look = { back, bench } from shop.js.
import { colourOf } from "./elements.js";
import { BY_ID, pretty } from "./compounds.js";
import { COND, START, GOAL } from "./logic.js";

const xml = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const BENCH = {
  "bn-school": { wall: ["#3a4150", "#232834"], top: "#5d6573", edge: "#2b3039", deco: () => `<g opacity=".35">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 50} 0 V190" stroke="#8b95a8" stroke-width="1"/>`).join("")}${[50, 100, 150].map((y) => `<path d="M0 ${y} H400" stroke="#8b95a8" stroke-width="1"/>`).join("")}</g><rect x="362" y="10" width="26" height="34" rx="3" fill="#b3122a"/><text x="375" y="30" font-size="6.5" fill="#fff" text-anchor="middle" font-family="system-ui">FIRE</text>` },
  "bn-alchemist": { wall: ["#3b2a1e", "#1a120c"], top: "#5a3b22", edge: "#2a1a0d", deco: () => `<g opacity=".5">${[[30, 40], [70, 34], [330, 38], [368, 44]].map(([x, y]) => `<rect x="${x}" y="${y}" width="16" height="22" rx="4" fill="#4a6b3a"/><rect x="${x + 4}" y="${y - 6}" width="8" height="6" fill="#6b4a2a"/>`).join("")}<path d="M10 66 H110 M300 66 H392" stroke="#6b4a2a" stroke-width="4"/></g><text x="200" y="40" font-size="22" fill="#e2b04a" opacity=".35" text-anchor="middle" font-family="Georgia,serif">☉ ☽ ☿ ♀ ♂ ♃ ♄</text>` },
  "bn-lavoisier": { wall: ["#5b4a6e", "#2a1f38"], top: "#7a5634", edge: "#3e2a17", deco: () => `<g opacity=".55" transform="translate(352 70)"><path d="M0 -30 V30 M-22 -20 H22" stroke="#e2b04a" stroke-width="2"/><path d="M-22 -20 l-8 18 h16 Z M22 -20 l-8 18 h16 Z" fill="none" stroke="#e2b04a" stroke-width="1.5"/><rect x="-10" y="30" width="20" height="5" fill="#e2b04a"/></g><g opacity=".4"><circle cx="46" cy="60" r="24" fill="none" stroke="#cfe6ff" stroke-width="3"/><path d="M46 84 V120" stroke="#7a5634" stroke-width="4"/></g>` },
  "bn-faraday": { wall: ["#2d3a2e", "#151d16"], top: "#4a3626", edge: "#231810", deco: () => `<g opacity=".5"><rect x="20" y="40" width="60" height="70" fill="#1f2a20" stroke="#6b7b5a"/><path d="M28 60 h44 M28 75 h44 M28 90 h44" stroke="#6b7b5a"/></g><g opacity=".6" transform="translate(350 76)"><circle r="16" fill="none" stroke="#c88033" stroke-width="5"/><circle r="9" fill="none" stroke="#c88033" stroke-width="3"/><path d="M-26 0 H-16 M16 0 H26" stroke="#c88033" stroke-width="2"/></g>` },
  "bn-clean": { wall: ["#dfe7ef", "#a9b8c8"], top: "#eef3f7", edge: "#8a9bae", ink: "#1b2533", deco: () => `<g opacity=".5">${Array.from({ length: 8 }, (_, i) => `<rect x="${12 + i * 48}" y="14" width="36" height="12" rx="3" fill="#ffffff" stroke="#9fb2c6"/>`).join("")}</g><rect x="0" y="150" width="400" height="6" fill="#ffd84a" opacity=".6"/>` },
  "bn-curie": { wall: ["#2b2a26", "#11100e"], top: "#4f4637", edge: "#28231b", deco: () => `<g opacity=".6">${[[44, 96], [70, 100], [330, 98], [356, 94]].map(([x, y], i) => `<g class="du-glow" style="animation-delay:-${i * 0.6}s"><rect x="${x}" y="${y}" width="12" height="20" rx="3" fill="rgba(160,255,200,.25)" stroke="#9fffcf"/><rect x="${x + 2}" y="${y + 9}" width="8" height="9" rx="2" fill="#7dffc0"/></g>`).join("")}</g><path d="M0 40 L120 20 L280 20 L400 40" stroke="#3a352c" stroke-width="10" fill="none" opacity=".8"/>` },
};
export const benchOf = (id) => BENCH[id] || BENCH["bn-school"];

/** The look of a reaction in the damage phase, from the compound's real properties. */
export const KIND = {
  frost: { col: "#9fe8ff", glow: "#e8fbff", label: "endothermic: it soaks up heat" },
  spark: { col: "#ffe14a", glow: "#fffbe0", label: "a spark reaction" },
  acid: { col: "#8cff5a", glow: "#eaffd8", label: "an acid" },
  base: { col: "#b8a6ff", glow: "#f1ecff", label: "a base" },
  fire: { col: "#ff7a1f", glow: "#fff1c2", label: "strongly exothermic" },
  catalyst: { col: "#66e0c8", glow: "#e4fff8", label: "made over a catalyst" },
  gas: { col: "#c9d3e6", glow: "#ffffff", label: "a gas" },
  crystal: { col: "#ff8fd0", glow: "#fff0fa", label: "a solid crystal" },
};
export function kindOf(c) {
  if (c.tags.includes("spark")) return "spark";
  if (c.endo) return "frost";
  if (c.tags.includes("acid")) return "acid";
  if (c.tags.includes("base")) return "base";
  if (c.dh < -400) return "fire";
  if (c.tags.includes("cat")) return "catalyst";
  if (c.gas) return "gas";
  return "crystal";
}
const R = (n, f) => Array.from({ length: n }, (_, i) => f(i));
/** Effect layers for each kind, centred on (200, 138). */
function kindFx(k) {
  const K = KIND[k], c = K.col;
  if (k === "fire") return R(9, (i) => `<path class="du-k-flame" style="--i:${i};--a:${i * 40}deg" d="M200 138 q-9 -18 0 -40 q9 22 0 40 Z" fill="${i % 2 ? "#ffd27a" : c}" opacity=".85"/>`).join("") + `<circle class="du-k-ring" cx="200" cy="138" r="40" fill="none" stroke="${c}" stroke-width="6"/>`;
  if (k === "frost") return R(6, (i) => `<g class="du-k-ice" style="--i:${i};--a:${i * 60}deg"><path d="M200 138 v-52 M200 104 l-8 -8 M200 104 l8 -8 M200 118 l-6 -6 M200 118 l6 -6" stroke="${c}" stroke-width="3" stroke-linecap="round"/></g>`).join("") + `<circle class="du-k-ring" cx="200" cy="138" r="46" fill="rgba(159,232,255,.12)" stroke="${c}" stroke-width="2" stroke-dasharray="4 5"/>`;
  if (k === "spark") return R(5, (i) => `<path class="du-k-bolt" style="--i:${i};--a:${i * 72 + 18}deg" d="M200 138 l6 -16 l-9 -4 l8 -22 l-4 18 l9 4 Z" fill="${c}" stroke="#fff" stroke-width="1"/>`).join("") + `<circle class="du-k-ring" cx="200" cy="138" r="38" fill="none" stroke="${c}" stroke-width="3"/>`;
  if (k === "acid") return R(10, (i) => `<path class="du-k-drop" style="--i:${i};--dx:${(i - 4.5) * 12}px" d="M${200 + (i - 4.5) * 4} 120 q-5 8 0 12 q5 -4 0 -12 Z" fill="${c}"/>`).join("") + `<ellipse class="du-k-pool" cx="200" cy="186" rx="60" ry="6" fill="${c}" opacity=".5"/>`;
  if (k === "base") return R(12, (i) => `<circle class="du-k-bub" style="--i:${i};--dx:${((i * 37) % 90) - 45}px" cx="200" cy="160" r="${4 + (i % 4) * 2}" fill="rgba(184,166,255,.18)" stroke="${c}" stroke-width="1.5"/>`).join("");
  if (k === "catalyst") return `<g class="du-k-gear"><circle cx="200" cy="138" r="44" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="10 7"/><circle cx="200" cy="138" r="54" fill="none" stroke="${c}" stroke-width="1.5" opacity=".6"/></g>` + R(6, (i) => `<circle class="du-k-orbit" style="--i:${i};--a:${i * 60}deg" cx="200" cy="88" r="3.5" fill="${c}"/>`).join("");
  if (k === "gas") return R(7, (i) => `<circle class="du-k-cloud" style="--i:${i};--dx:${(i - 3) * 22}px;--dy:${-20 - (i % 3) * 12}px" cx="200" cy="138" r="${16 + (i % 3) * 6}" fill="${c}" opacity=".35"/>`).join("");
  return R(8, (i) => `<path class="du-k-shard" style="--i:${i};--a:${i * 45}deg" d="M200 138 l5 -14 l-5 -26 l-5 26 Z" fill="${c}" stroke="#fff" stroke-width=".8"/>`).join("") + `<circle class="du-k-ring" cx="200" cy="138" r="36" fill="none" stroke="${c}" stroke-width="2.5"/>`;
}
/** The played cards flying from the hand (bottom) or the Oracle's hand (top) to the middle. */
function flyingCards(cards, up) {
  const n = Math.min(cards.length, 7);
  return cards.slice(0, 7).map((c, i) => { const x = 200 + (i - (n - 1) / 2) * 30;
    return `<g class="du-k-card" style="--i:${i};--sx:${(i - (n - 1) / 2) * 18}px;--sy:${up ? 150 : -130}px"><rect x="${x - 13}" y="120" width="26" height="36" rx="3" fill="#fbf6ea" stroke="${colourOf(c.s)}" stroke-width="2"/><text x="${x}" y="143" font-size="12" font-weight="800" text-anchor="middle" fill="#1b1430" font-family="system-ui">${c.s}</text></g>`; }).join("");
}

/** A card back pattern, drawn in a w × h box at (x, y). */
export function backSvg(id, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, s = Math.min(w, h) / 40;
  const frame = (fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${4 * s}" fill="${fill}" stroke="${stroke}" stroke-width="${1.4 * s}"/>`;
  if (id === "db-lattice") return frame("#1c2a4a", "#9fc4ff") + Array.from({ length: 4 }, (_, i) => Array.from({ length: 5 }, (_, j) => `<circle cx="${x + w * (i + 0.5) / 4}" cy="${y + h * (j + 0.5) / 5}" r="${((i + j) % 2 ? 1.6 : 2.6) * s}" fill="${(i + j) % 2 ? "#3fdc6a" : "#b07cff"}"/>`).join("")).join("");
  if (id === "db-grid") return frame("#2a1d10", "#e2b04a") + Array.from({ length: 6 }, (_, i) => Array.from({ length: 7 }, (_, j) => ((j === 0 || j === 6 || i > 1) && !(i === 3 && j === 3)) ? `<rect x="${x + 3 * s + i * (w - 6 * s) / 6}" y="${y + 4 * s + j * (h - 8 * s) / 7}" width="${(w - 6 * s) / 6 - s}" height="${(h - 8 * s) / 7 - s}" fill="#e2b04a" opacity="${0.25 + ((i * 7 + j) % 5) * 0.1}"/>` : "").join("")).join("");
  if (id === "db-benzene") { const r = 11 * s, pts = Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos(Math.PI / 6 + i * Math.PI / 3), cy + r * Math.sin(Math.PI / 6 + i * Math.PI / 3)]);
    return frame("#14261e", "#66e0c8") + `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#66e0c8" stroke-width="${1.6 * s}"/><circle cx="${cx}" cy="${cy}" r="${6 * s}" fill="none" stroke="#66e0c8" stroke-width="${s}"/><path d="M${cx - 14 * s} ${cy + 15 * s} q${14 * s} ${8 * s} ${26 * s} -${4 * s}" stroke="#5fbf6a" stroke-width="${2 * s}" fill="none"/>`; }
  if (id === "db-spectrum") return frame("#08060f", "#fff") + ["#ff2a1f", "#ff9a00", "#ffe14a", "#5fe07a", "#3fb4ff", "#7a5cff"].map((c, i) => `<rect x="${x + w * (0.12 + i * 0.14 + (i % 2) * 0.03)}" y="${y + 3 * s}" width="${1.6 * s}" height="${h - 6 * s}" fill="${c}"/>`).join("");
  if (id === "db-radium") return frame("#0b1a12", "#7dffc0") + `<circle class="du-glow" cx="${cx}" cy="${cy}" r="${10 * s}" fill="#7dffc0" opacity=".55"/><circle cx="${cx}" cy="${cy}" r="${4 * s}" fill="#eaffef"/>`;
  // db-atom
  return frame("#24124a", "#e2b04a") + [0, 60, 120].map((a) => `<ellipse cx="${cx}" cy="${cy}" rx="${13 * s}" ry="${5 * s}" fill="none" stroke="#e2b04a" stroke-width="${s}" transform="rotate(${a} ${cx} ${cy})"/>`).join("") + `<circle cx="${cx}" cy="${cy}" r="${2.6 * s}" fill="#ff4fb3"/>`;
}

/** Atom positions for a little ball-and-stick drawing of a compound (a sketch, not the real 3D shape). */
export function molecule(c, cx, cy, scale = 1) {
  const list = Object.entries(c.atoms).flatMap(([s, n]) => Array(n).fill(s));
  const counts = c.atoms, centre = Object.keys(counts).find((s) => counts[s] === 1 && !["H", "F", "Cl", "Br", "I"].includes(s)) || list[0];
  const rest = [...list]; rest.splice(rest.indexOf(centre), 1);
  const R = (list.length === 2 ? 22 : 34) * scale, out = [{ s: centre, x: cx, y: cy }];
  if (list.length === 2) { out[0].x = cx - R / 2; out.push({ s: rest[0], x: cx + R / 2, y: cy }); return out; }
  rest.forEach((s, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / rest.length; out.push({ s, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }); });
  return out;
}
const rOf = (s, k = 1) => (s === "H" ? 8 : 12) * k;
function moleculeSvg(c, cx, cy, k = 1, cls = "") {
  const at = molecule(c, cx, cy, k), [a0, ...rest] = at;
  const bonds = at.length === 2 ? `<path d="M${at[0].x} ${cy} H${at[1].x}" stroke="#ddd" stroke-width="${4 * k}"/>` : rest.map((a) => `<path d="M${a0.x} ${a0.y} L${a.x} ${a.y}" stroke="#ddd" stroke-width="${4 * k}"/>`).join("");
  return `<g class="${cls}">${bonds}${at.map((a, i) => `<g class="du-atom" style="--i:${i}"><circle cx="${a.x}" cy="${a.y}" r="${rOf(a.s, k)}" fill="${colourOf(a.s)}" stroke="#000" stroke-opacity=".5"/><circle cx="${a.x - rOf(a.s, k) * 0.35}" cy="${a.y - rOf(a.s, k) * 0.35}" r="${rOf(a.s, k) * 0.3}" fill="#fff" opacity=".45"/><text x="${a.x}" y="${a.y + 3.5 * k}" font-size="${(a.s === "H" ? 8 : 10) * k}" text-anchor="middle" fill="${["C", "N", "Cs", "Rb", "I", "Br", "K"].includes(a.s) ? "#fff" : "#111"}" font-weight="700" font-family="system-ui">${a.s}</text></g>`).join("")}</g>`;
}
function bar(x, y, w, hp, col, label, found, shield) {
  const f = Math.max(0, hp) / START;
  return `<g class="du-bar${shield ? " shielded" : ""}"><text x="${x}" y="${y - 4}" font-size="9" fill="${col}" font-family="Cinzel,Georgia,serif" letter-spacing="1.5">${label}</text>
    <text x="${x + w}" y="${y - 4}" font-size="9" fill="#ece6fa" text-anchor="end" font-family="system-ui">${hp} / ${START} · ${"◆".repeat(found)}${"◇".repeat(Math.max(0, GOAL - found))}</text>
    <rect x="${x}" y="${y}" width="${w}" height="9" rx="4.5" fill="rgba(0,0,0,.5)" stroke="${col}" stroke-opacity=".6"/>
    <rect class="du-fill" x="${x}" y="${y}" width="${(w * f).toFixed(1)}" height="9" rx="4.5" fill="${col}"/>
    ${shield ? `<rect class="du-shield" x="${x - 4}" y="${y - 4}" width="${w + 8}" height="17" rx="8.5" fill="rgba(95,224,232,.15)" stroke="#5fe0e8" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + 7.5}" font-size="8" fill="#e8ffff" text-anchor="middle" font-family="system-ui">🛡 ${shield}</text>` : ""}</g>`;
}

/**
 * s = { look, g, fx } where g is the duel (or null for the lobby), fx = { kind: "react"|"fizz"|"shield"|"win"|"lose", side, c, dmg, blocked }
 */
export function sceneSvg(s) {
  const B = benchOf(s.look.bench), g = s.g, fx = s.fx || {}, ink = B.ink || "#ece6fa";
  const wall = `<defs><linearGradient id="du-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${B.wall[0]}"/><stop offset="1" stop-color="${B.wall[1]}"/></linearGradient>
    <radialGradient id="du-flash"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#ffe7a0" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient></defs>
    <rect width="400" height="300" fill="url(#du-wall)"/>${B.deco()}<rect y="196" width="400" height="104" fill="${B.top}"/><rect y="196" width="400" height="5" fill="${B.edge}"/>`;
  if (!g) {
    // lobby: a fanned hand of element cards and the deck
    const fan = ["Na", "Cl", "H", "O", "C"].map((e, i) => { const a = (i - 2) * 12; return `<g transform="rotate(${a} 200 330)" class="du-fan" style="--i:${i}"><rect x="178" y="120" width="44" height="62" rx="5" fill="#f5efe0" stroke="#e2b04a" stroke-width="1.5"/><text x="200" y="157" font-size="20" font-weight="700" text-anchor="middle" fill="${colourOf(e) === "#f4f4f4" ? "#666" : colourOf(e)}" font-family="system-ui" stroke="#000" stroke-width=".4">${e}</text></g>`; }).join("");
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${wall}${backSvg(s.look.back, 40, 200, 44, 62)}${backSvg(s.look.back, 44, 204, 44, 62)}${fan}
      <text x="200" y="52" font-size="24" text-anchor="middle" fill="${ink}" font-family="Cinzel,Georgia,serif" letter-spacing="3">ELEMENT DUEL</text>
      <text x="200" y="72" font-size="10" text-anchor="middle" fill="${ink}" opacity=".75" font-family="system-ui">Make real compounds. Out-react the Oracle.</text></svg>`;
  }
  const cond = COND[g.cond], bonus = BY_ID[g.bonus];
  const backs = Array.from({ length: g.oracle.hand.length }, (_, i) => `<g class="du-oback" style="--i:${i}">${backSvg(s.look.back, 200 - g.oracle.hand.length * 17 + i * 34 + 2, 10, 30, 40)}</g>`).join("");
  const condCard = `<g class="du-cond" key="${g.round}"><rect x="12" y="84" width="98" height="104" rx="8" fill="rgba(10,8,24,.82)" stroke="#e2b04a"/><text x="61" y="99" font-size="7.5" fill="#e2b04a" text-anchor="middle" font-family="Cinzel,Georgia,serif" letter-spacing="1">LAB · ROUND ${g.round}</text>
    <text x="61" y="130" font-size="26" text-anchor="middle">${cond.emoji}</text><text x="61" y="150" font-size="10" fill="#fff" text-anchor="middle" font-weight="700" font-family="system-ui">${xml(cond.name)}</text>
    <foreignObject x="16" y="153" width="90" height="34"><div xmlns="http://www.w3.org/1999/xhtml" style="font:7.5px/1.2 system-ui;color:#d8d0f0;text-align:center">${xml(cond.rule)}</div></foreignObject></g>`;
  const bonusCard = `<g class="du-bonus"><rect x="290" y="84" width="98" height="104" rx="8" fill="rgba(10,8,24,.82)" stroke="#ff4fb3"/><text x="339" y="99" font-size="7.5" fill="#ff8fd0" text-anchor="middle" font-family="Cinzel,Georgia,serif" letter-spacing="1">★ BONUS</text>
    ${moleculeSvg(bonus, 339, 130, bonus.n > 4 ? 0.5 : 0.62)}<text x="339" y="168" font-size="13" fill="#fff" text-anchor="middle" font-weight="700" font-family="system-ui">${xml(pretty(bonus.f))}</text>
    <text x="339" y="181" font-size="7.5" fill="#d8d0f0" text-anchor="middle" font-family="system-ui">+2 power · +3 💎</text></g>`;
  let centre = `<g class="du-idle" opacity=".55"><path d="M188 120 V146 L170 178 Q166 186 176 186 H224 Q234 186 230 178 L212 146 V120 Z" fill="rgba(200,230,255,.1)" stroke="#cfe6ff" stroke-width="1.6"/><path d="M174 172 H226 L230 180 Q232 186 224 186 H176 Q168 186 170 180 Z" fill="#66e0c8" opacity=".6"/><rect x="184" y="114" width="32" height="6" rx="2" fill="#cfe6ff" opacity=".7"/></g>`;
  if (fx.kind === "react" && fx.c) {
    const up = fx.side === "you", ty = up ? 106 : 236, k = kindOf(fx.c), K = KIND[k], hitY = up ? 70 : 274;
    centre = `<g class="du-rx ${up ? "from-you" : "from-oracle"} k-${k}" style="--kc:${K.col}">${flyingCards(fx.cards || [], up)}
      <circle class="du-flash" cx="200" cy="138" r="70" fill="url(#du-flash)"/><g class="du-kfx">${kindFx(k)}</g>${moleculeSvg(fx.c, 200, 138, fx.c.n > 5 ? 0.8 : 1, "du-mol")}
      <text class="du-name" x="200" y="194" font-size="14" fill="#fff" text-anchor="middle" font-weight="700" font-family="system-ui" stroke="#000" stroke-width=".6" paint-order="stroke">${xml(pretty(fx.c.f))} · ${xml(fx.c.name)}</text>
      <path class="du-beam" d="M200 ${up ? 116 : 160} L200 ${hitY}" stroke="${K.col}" stroke-width="5" stroke-linecap="round"/><circle class="du-orb" cx="200" cy="138" r="7" fill="${K.glow}" stroke="${K.col}" stroke-width="3" style="--ty:${hitY - 138}px"/>
      ${fx.blocked ? `<circle class="du-block" cx="200" cy="${hitY}" r="26" fill="rgba(95,224,232,.25)" stroke="#5fe0e8" stroke-width="3"/>` : ""}
      ${fx.dmg ? R(10, (i) => `<circle class="du-impact" style="--a:${i * 36}deg" cx="200" cy="${hitY}" r="3" fill="${K.col}"/>`).join("") : ""}
      <text class="du-dmg" x="200" y="${ty}" font-size="22" fill="${up ? "#ff4fb3" : "#66e0c8"}" text-anchor="middle" font-weight="800" font-family="system-ui" stroke="#000" stroke-width="1" paint-order="stroke">${fx.dmg ? "−" + fx.dmg : fx.blocked ? "🛡 blocked" : "0"}</text></g>`;
  } else if (fx.kind === "fizz") {
    centre = `<g class="du-fizz">${(fx.cards || []).slice(0, 6).map((c, i) => `<g class="du-wob" style="--i:${i}"><circle cx="${200 + (i - (Math.min(6, fx.cards.length) - 1) / 2) * 28}" cy="140" r="12" fill="${colourOf(c.s)}" stroke="#000" stroke-opacity=".5"/><text x="${200 + (i - (Math.min(6, fx.cards.length) - 1) / 2) * 28}" y="144" font-size="10" text-anchor="middle" font-weight="700" fill="#111" font-family="system-ui">${c.s}</text></g>`).join("")}
      ${[0, 1, 2, 3].map((i) => `<circle class="du-smoke" cx="${186 + i * 9}" cy="122" r="${8 + (i % 2) * 4}" fill="#6a6478" style="--dx:${(i - 1.5) * 14}px;animation-delay:${i * 0.08}s"/>`).join("")}
      <text x="200" y="186" font-size="13" fill="#ffb3bf" text-anchor="middle" font-weight="700" font-family="system-ui">fizzle…</text></g>`;
  } else if (fx.kind === "win" || fx.kind === "lose") {
    centre = `<g class="du-end ${fx.kind}"><text x="200" y="140" font-size="30" text-anchor="middle" fill="${fx.kind === "win" ? "#fade8c" : "#ffb3bf"}" font-family="Cinzel,Georgia,serif" letter-spacing="2" stroke="#000" stroke-width=".8" paint-order="stroke">${fx.kind === "win" ? "VICTORY" : fx.draw ? "STALEMATE" : "THE ORACLE WINS"}</text>
      ${fx.kind === "win" ? Array.from({ length: 14 }, (_, i) => `<circle class="du-conf" cx="200" cy="130" r="3" fill="${["#fade8c", "#ff4fb3", "#66e0c8", "#b07cff"][i % 4]}" style="--a:${i * 25.7}deg;--d:${(i % 5) * 0.06}s"/>`).join("") : ""}</g>`;
  }
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true" class="${fx.hit ? "du-hit-" + fx.hit : ""}">${wall}${backs}
    <g class="du-o">${bar(110, 66, 180, g.oracle.hp, "#ff4fb3", "ORACLE", g.oracle.found.length, g.oracle.shield)}</g>
    ${condCard}${bonusCard}${centre}
    <g class="du-y">${bar(110, 270, 180, g.you.hp, "#66e0c8", "YOU", g.you.found.length, g.you.shield)}</g>
    <text x="12" y="290" font-size="8" fill="${ink}" opacity=".6" font-family="system-ui">deck ${g.you.deck.length}</text></svg>`;
}
