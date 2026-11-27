// The Lab's workbench, drawn in the Chamber's table pane: stone wall, shelf of jars, brick furnace (athanor) with one
// flame per try left, the chosen vessel with its liquid, and a wall charm. State: { look, flames, liquid, glyph, chips, glow, label }.
import { GLYPH } from "./glyphs.js";
import { REAGENTS } from "./lab.js";
import { shopItem } from "./shop.js";
import { FLAMES } from "./logic.js";

const xml = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const g = (id, x, y, s, col) => GLYPH[id] ? `<g transform="translate(${x} ${y}) scale(${s / 40})" style="color:${col}">${GLYPH[id]}</g>` : "";

function vessel(kind, liquid, rise, anim = "") {
  const L = liquid || "#5a4a7a";
  const bulb = `<clipPath id="al-bulb"><circle cx="200" cy="168" r="30"/></clipPath>`;
  const liq = `<g clip-path="url(#al-bulb)"><rect class="al-liq${rise ? " rise" : ""}" x="160" y="170" width="80" height="40" fill="${L}">${anim}</rect>${[[188, 2.4, 0], [196, 1.6, .5], [204, 2.8, 1.1], [211, 1.8, 1.6], [200, 2, 2]].map(([x, r, d]) => `<circle class="al-bub" cx="${x}" cy="194" r="${r}" fill="#fff" opacity=".6" style="animation-delay:-${d}s"/>`).join("")}</g>`;
  const glass = 'fill="rgba(200,230,255,.12)" stroke="#cfe6ff" stroke-width="2"';
  if (kind === "al-copper") return `<defs>${bulb}</defs><path d="M170 148 Q168 198 200 198 Q232 198 230 148 Z" fill="#b8642e" stroke="#ffb27a" stroke-width="2"/>${liq.replace('clip-path="url(#al-bulb)"', 'opacity=".0"')}
    <path d="M190 148 C190 120 220 108 246 118 L312 150" fill="none" stroke="#c8743a" stroke-width="7" stroke-linecap="round"/><path d="M174 160 H226 M172 176 H228" stroke="#7a3a14" stroke-width="1.5" opacity=".6"/>
    <ellipse cx="200" cy="148" rx="30" ry="6" fill="${L}" stroke="#ffb27a" stroke-width="2"/>${receiver(L)}`;
  if (kind === "al-retort") return `<defs>${bulb}</defs>${liq}<circle cx="200" cy="168" r="30" ${glass}/><path d="M222 148 C240 128 262 128 330 178" fill="none" stroke="#cfe6ff" stroke-width="7" stroke-linecap="round" opacity=".8"/>${receiver(L, 334)}`;
  if (kind === "al-pelican") return `<defs>${bulb}</defs>${liq}<circle cx="200" cy="168" r="30" ${glass}/><path d="M192 140 V104 Q200 92 208 104 V140" ${glass}/>
    <path d="M194 110 C160 96 150 150 174 160 M206 110 C240 96 250 150 226 160" fill="none" stroke="#cfe6ff" stroke-width="4" opacity=".8"/>`;
  return `<defs>${bulb}</defs>${liq}<circle cx="200" cy="168" r="30" ${glass}/><path d="M190 140 V124 Q200 104 210 124 V140" ${glass}/>
    <path d="M206 112 Q232 104 300 150" fill="none" stroke="#cfe6ff" stroke-width="4" opacity=".8"/>${receiver(L)}`;
}
const receiver = (L, x = 306) => `<path d="M${x - 12} 152 Q${x - 18} 196 ${x} 198 Q${x + 18} 196 ${x + 12} 152 Z" fill="rgba(200,230,255,.1)" stroke="#cfe6ff" stroke-width="1.8"/><path class="al-drip" d="M${x} 160 v6" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`;

function charm(id) {
  if (id === "al-ouroboros") return `<g transform="translate(336 64)"><circle r="26" fill="none" stroke="#5fbf6a" stroke-width="7"/><circle r="26" fill="none" stroke="#2c6b34" stroke-width="7" stroke-dasharray="3 6"/>
    <path d="M18 -20 l9 -4 l-2 10 Z" fill="#5fbf6a"/><circle cx="20" cy="-17" r="1.6" fill="#ff4fb3"/><text y="4" font-size="8" fill="#FADE8C" text-anchor="middle" font-family="Georgia,serif">ἓν τὸ πᾶν</text></g>`;
  if (id === "al-tablet") return `<g transform="translate(336 64)"><rect x="-24" y="-32" width="48" height="62" rx="10" fill="#1f8a5a" stroke="#9ff0c8" stroke-width="2"/>${[-18, -10, -2, 6, 14, 22].map((y) => `<path d="M-15 ${y} h30" stroke="#0b3a26" stroke-width="2" stroke-dasharray="${(y + 40) % 7 + 2} 2"/>`).join("")}</g>`;
  if (id === "al-stone") return `<g transform="translate(336 70)"><circle r="26" fill="url(#al-stoneglow)"/><path d="M0 -16 L14 -4 L9 14 L-9 14 L-14 -4 Z" fill="#d4142e" stroke="#ff9aa6" stroke-width="1.5"/><path d="M0 -16 L0 14 M-14 -4 L14 -4" stroke="#ff9aa6" stroke-width=".8" opacity=".6"/></g>`;
  return "";
}

const embers = () => [176, 188, 199, 211, 222, 230].map((x, i) => `<circle class="al-ember" cx="${x}" cy="206" r="${1 + (i % 3) * 0.5}" fill="#ffd27a" style="--dx:${(i % 2 ? 1 : -1) * (4 + i * 2)}px;animation-delay:-${(i * 0.37).toFixed(2)}s"/>`).join("");
const vapour = () => [0, 1, 2].map((i) => `<path class="al-vap" d="M${196 + i * 4} 132 q-6 -10 0 -20 q6 -10 0 -20" stroke="#e8f2ff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0" style="animation-delay:-${i * 0.9}s"/>`).join("");
const pourFx = (c) => `<g class="al-pourer"><g class="al-jar-tilt"><rect x="218" y="40" width="22" height="28" rx="5" fill="${c}" stroke="#000" stroke-opacity=".4"/><rect x="220" y="35" width="18" height="6" rx="2" fill="#6b4a2a"/></g>
  <path class="al-stream" d="M216 66 Q206 90 201 150" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>${[0, 1, 2].map((i) => `<circle class="al-drop" cx="201" cy="150" r="3" fill="${c}" style="--sx:${(i - 1) * 9}px;animation-delay:${0.45 + i * 0.05}s"/>`).join("")}</g>`;
const puffFx = () => [0, 1, 2, 3].map((i) => `<circle class="al-puff" cx="${190 + i * 7}" cy="132" r="${9 + (i % 2) * 4}" fill="#4a4458" style="--dx:${(i - 1.5) * 14}px;animation-delay:${i * 0.08}s"/>`).join("");
const burstFx = (c) => `<g class="al-rays">${Array.from({ length: 12 }, (_, i) => `<path d="M200 168 L${200 + Math.cos(i * 0.5236) * 150} ${168 + Math.sin(i * 0.5236) * 150}" stroke="${c}" stroke-width="${i % 2 ? 3 : 6}" opacity=".35"/>`).join("")}</g>
  ${Array.from({ length: 10 }, (_, i) => { const a = i * 0.628; return `<path class="al-spark" d="M200 160 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 Z" fill="#fff6d0" style="--x:${(Math.cos(a) * 95).toFixed(0)}px;--y:${(Math.sin(a) * 75).toFixed(0)}px;animation-delay:${(i % 3) * 0.12}s"/>`; }).join("")}`;

/** The reaction: reagent colours swirl and blend into the real product, then the product's own effect plays. */
const REACT = {
  fumes: (c) => [0, 1, 2, 3, 4].map((i) => `<circle class="al-fume" cx="${194 + i * 3}" cy="128" r="${8 + (i % 3) * 3}" fill="${c}" style="--dx:${(i - 2) * 16}px;animation-delay:${1.2 + i * 0.25}s"/>`).join(""),
  sublime: (c) => REACT.fumes(c) + `<path class="al-crust" d="M176 150 Q200 136 224 150" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  powder: (c) => Array.from({ length: 14 }, (_, i) => `<circle class="al-fall" cx="${184 + (i * 7) % 32}" cy="150" r="1.8" fill="${c}" style="animation-delay:${1.1 + i * 0.07}s"/>`).join("") + `<ellipse class="al-heap" cx="200" cy="194" rx="16" ry="4" fill="${c}"/>`,
  nugget: (c) => `<ellipse class="al-shrink" cx="200" cy="188" rx="9" ry="6" fill="${c}" stroke="#fff6c8" stroke-width="1"/>`,
  plate: (c) => `<rect x="196" y="150" width="8" height="42" rx="2" fill="#8a8f99"><animate attributeName="fill" values="#8a8f99;#8a8f99;${c}" dur="2.4s" fill="freeze"/></rect><rect x="192" y="148" width="16" height="4" rx="1" fill="#6d727c"/>`,
  crystals: (c) => Array.from({ length: 9 }, (_, i) => `<path class="al-xtal" d="M${182 + (i * 11) % 36} ${190 - (i % 3) * 5} l3 -5 l3 5 l-3 5 Z" fill="${c}" stroke="#fff" stroke-width=".5" style="animation-delay:${1.3 + i * 0.12}s"/>`).join(""),
  tree: (c) => ["M200 196 V170 l-8 -8 M200 178 l9 -9 l2 -8 M200 186 l-11 -5 l-4 -8", "M190 196 l-4 -14 l-6 -4 M186 186 l6 -9", "M210 196 l5 -12 l7 -4 M213 188 l-3 -10"]
    .map((d, i) => `<path class="al-branch" d="${d}" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round" style="animation-delay:${1.2 + i * 0.3}s"/>`).join(""),
  drip: (c) => [0, 1, 2, 3].map((i) => `<circle class="al-dripx" cx="306" cy="160" r="2.4" fill="${c}" style="animation-delay:${1 + i * 0.35}s"/>`).join(""),
  glow: (c) => `<circle class="al-glowpulse" cx="200" cy="168" r="44" fill="${c}"/>`,
  bubbles: (c) => Array.from({ length: 12 }, (_, i) => `<circle class="al-fizz" cx="${184 + (i * 5) % 32}" cy="196" r="${1.4 + (i % 3) * 0.7}" fill="none" stroke="${c}" stroke-width="1" style="animation-delay:${1 + i * 0.11}s"/>`).join(""),
  flare: (c) => `<path class="al-flare" d="M200 100 l6 18 l18 6 l-18 6 l-6 18 l-6 -18 l-18 -6 l18 -6 Z" fill="${c}"/>` + REACT.fumes("rgba(255,255,255,.5)"),
  calx: (c) => `<rect class="al-film" x="172" y="168" width="56" height="5" rx="2" fill="${c}"/>`,
  sparks: (c) => Array.from({ length: 12 }, (_, i) => { const a = i * 0.5236; return `<circle class="al-spark2" cx="200" cy="176" r="2.2" fill="${c}" style="--x:${(Math.cos(a) * 70).toFixed(0)}px;--y:${(Math.sin(a) * 50 - 20).toFixed(0)}px;animation-delay:${1.1 + (i % 4) * 0.15}s"/>`; }).join(""),
};
export const reactionFx = (r) => {
  const cols = [...(r.from || []), r.to];
  const swirl = `<g class="al-swirl">${(r.from || []).map((c, i, a) => { const ang = (i / a.length) * 6.283; return `<circle cx="${(200 + Math.cos(ang) * 18).toFixed(1)}" cy="${(182 + Math.sin(ang) * 8).toFixed(1)}" r="6" fill="${c}" stroke="#fff" stroke-opacity=".5"/>`; }).join("")}</g>`;
  return { anim: `<animate attributeName="fill" values="${cols.join(";")}" dur="${0.5 + cols.length * 0.4}s" fill="freeze"/>`, over: swirl, after: (REACT[r.fx] || (() => ""))(r.fxc || r.to) };
};

/** The explosion: white flash, shockwave rings, flying glass shards, a fireball, a soot cloud and a cracked, empty stand. */
const boomFx = (c = "#ff9a3c") => `<g class="al-boom">
  <circle class="al-fireball" cx="200" cy="165" r="60" fill="url(#al-fireball)"/>
  ${[0, 1].map((i) => `<circle class="al-ring" cx="200" cy="165" r="30" fill="none" stroke="${i ? "#fff" : c}" stroke-width="${i ? 3 : 8}" style="animation-delay:${i * 0.12}s"/>`).join("")}
  ${Array.from({ length: 16 }, (_, i) => { const a = i * 0.3927 + (i % 2) * 0.2, d = 120 + (i % 4) * 40;
    return `<path class="al-shard" d="M200 165 l${4 + (i % 3) * 3} -2 l-3 ${6 + (i % 2) * 4} Z" fill="#cfe6ff" opacity=".9" style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d * 0.8).toFixed(0)}px;--r:${(i * 97) % 720}deg"/>`; }).join("")}
  ${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="al-soot" cx="${170 + i * 12}" cy="160" r="${16 + (i % 3) * 6}" fill="#2a2430" style="--dx:${(i - 2.5) * 22}px;animation-delay:${0.25 + i * 0.07}s"/>`).join("")}
  <path class="al-crack" d="M150 210 l14 -6 l6 10 l12 -8 M250 214 l-10 -4 l-4 9" stroke="#140804" stroke-width="2" fill="none"/>
  <rect class="al-flash" x="-600" y="-400" width="1600" height="1100" fill="#fff"/></g>`;

export function sceneSvg(s) {
  const rx = s.react ? reactionFx(s.react) : null;
  const fire = (shopItem(s.look.fire) || shopItem("al-coal")).flame;
  const lit = s.flames ?? FLAMES, xs = [170, 190, 210, 230];
  const flames = xs.map((x, i) => i < lit
    ? `<path class="al-fl f${i}" d="M${x} 236 C${x + 9} 224 ${x + 6} 214 ${x} 204 C${x - 6} 214 ${x - 9} 224 ${x} 236Z" fill="url(#al-fire)"/>`
    : `<circle cx="${x}" cy="233" r="3" fill="#5a2010"/><path class="al-smoke" d="M${x} 228 q-5 -8 0 -14" stroke="#9a92aa" stroke-width="1.6" fill="none" opacity=".5"/>`).join("");
  const jars = (s.shelf || []).slice(0, 6).map((id, i) => { const r = REAGENTS[id] || {}, x = 34 + i * 30;
    return `<g><rect x="${x - 9}" y="${44}" width="18" height="22" rx="4" fill="${r.c || "#888"}" opacity=".85" stroke="#000" stroke-opacity=".4"/><rect x="${x - 7}" y="40" width="14" height="5" rx="1" fill="#6b4a2a"/></g>`; }).join("");
  const chips = (s.chips || []).map((id, i) => { const r = REAGENTS[id] || {};
    return `<g transform="translate(${90 + i * 34} 196)"><g class="al-chip"><circle r="13" fill="#160b2c" stroke="${r.c || "#E2B04A"}" stroke-width="2"/>${r.glyph ? g(r.glyph, -9, -9, 18, "#FADE8C") : `<text y="4" font-size="9" fill="#FADE8C" text-anchor="middle" font-family="system-ui">${xml(r.f.length <= 5 ? r.f : r.name.slice(0, 4))}</text>`}</g></g>`; }).join("");
  const scroll = s.glyph ? `<g class="al-scroll${s.fizzle ? " shake" : ""}"><rect x="22" y="84" width="96" height="100" rx="8" fill="#efe1bf" stroke="#8a6a3a" stroke-width="2"/><rect x="16" y="80" width="108" height="10" rx="5" fill="#c9a46b"/><rect x="16" y="180" width="108" height="10" rx="5" fill="#c9a46b"/><g class="al-ink${s.glow ? " lit" : ""}">${g(s.glyph, 34, 98, 72, "#3a1f0e")}</g></g>` : "";
  const label = s.label ? `<g class="al-label"><rect x="${200 - Math.min(180, s.label.length * 4.4 + 20)}" y="10" width="${Math.min(360, s.label.length * 8.8 + 40)}" height="28" rx="6" fill="#160b2c" stroke="#E2B04A" stroke-width="2"/><text x="200" y="29" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="700" font-size="${s.label.length > 34 ? 10 : 13}" fill="#FADE8C">${xml(s.label)}</text></g>` : "";
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true" class="${s.glow ? "al-won" : ""}${s.boom ? " al-exploded" : ""}">
<defs><radialGradient id="al-wall" cx="50%" cy="60%" r="75%"><stop offset="0" stop-color="#3b2a52"/><stop offset="1" stop-color="#0a0612"/></radialGradient>
<radialGradient id="al-fire" cx="50%" cy="80%" r="70%"><stop offset="0" stop-color="${fire[0]}"/><stop offset=".5" stop-color="${fire[1]}"/><stop offset="1" stop-color="${fire[2]}"/></radialGradient>
<radialGradient id="al-halo"><stop offset="0" stop-color="${s.liquid || fire[1]}" stop-opacity=".7"/><stop offset="1" stop-color="${s.liquid || fire[1]}" stop-opacity="0"/></radialGradient>
<radialGradient id="al-fireball"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffd23a"/><stop offset=".7" stop-color="#ff5a1f"/><stop offset="1" stop-color="#7a1010" stop-opacity="0"/></radialGradient>
<radialGradient id="al-stoneglow"><stop offset="0" stop-color="#ff3a4a" stop-opacity=".6"/><stop offset="1" stop-color="#ff3a4a" stop-opacity="0"/></radialGradient>
<pattern id="al-brick" width="20" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#6a2f1f"/><path d="M0 0 H20 M0 5 H20 M10 0 V5 M0 5 V10 M20 5 V10" stroke="#2a120a" stroke-width="1"/></pattern></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="#0a0612"/><rect x="-200" width="800" height="300" fill="url(#al-wall)"/>
<rect x="16" y="66" width="188" height="6" rx="2" fill="#5a3a1e"/>${jars}
${charm(s.look.charm)}${scroll}
<rect x="-200" y="250" width="800" height="60" fill="#2a1a10"/><rect x="-200" y="248" width="800" height="6" fill="#5a3a1e"/>
<circle class="al-halo" cx="200" cy="168" r="${s.glow ? 70 : 40}" fill="url(#al-halo)" opacity="${s.glow ? 1 : 0.35}"/>
<rect x="150" y="198" width="100" height="52" rx="4" fill="url(#al-brick)" stroke="#2a120a" stroke-width="2"/><rect x="160" y="206" width="80" height="34" rx="14" fill="#140804"/>
${flames}${s.snuff ? `<g class="al-dying"><path d="M${xs[lit]} 236 C${xs[lit] + 9} 224 ${xs[lit] + 6} 214 ${xs[lit]} 204 C${xs[lit] - 6} 214 ${xs[lit] - 9} 224 ${xs[lit]} 236Z" fill="url(#al-fire)"/></g>` : ""}${lit ? embers() : ""}
${s.glow ? burstFx(s.liquid || "#FADE8C") : ""}<g class="al-vessel${s.fizzle ? " shake" : ""}${s.boom ? " gone" : ""}">${vessel(s.look.vessel, s.react ? s.react.from[0] || s.liquid : s.liquid, !!s.pour, s.react ? rx.anim : "")}${s.react ? rx.over + rx.after : ""}</g>${lit && !s.fizzle ? vapour() : ""}${s.pour ? pourFx(s.pour) : ""}${s.fizzle ? puffFx() : ""}${s.boom ? boomFx(s.boomColor) : ""}
${chips}${label}
</svg>`;
}
