// The Lab's workbench, drawn in the Chamber's table pane: stone wall, shelf of jars, brick furnace (athanor) with one
// flame per try left, the chosen vessel with its liquid, and a wall charm. State: { look, flames, liquid, glyph, chips, glow, label }.
import { GLYPH } from "./glyphs.js";
import { REAGENTS } from "./lab.js";
import { shopItem } from "./shop.js";
import { FLAMES } from "./logic.js";

const xml = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const g = (id, x, y, s, col) => GLYPH[id] ? `<g transform="translate(${x} ${y}) scale(${s / 40})" style="color:${col}">${GLYPH[id]}</g>` : "";

function vessel(kind, liquid) {
  const L = liquid || "#5a4a7a";
  const bulb = `<clipPath id="al-bulb"><circle cx="200" cy="168" r="30"/></clipPath>`;
  const liq = `<g clip-path="url(#al-bulb)"><rect class="al-liq" x="160" y="170" width="80" height="40" fill="${L}"/><circle class="al-bub" cx="192" cy="186" r="2.5" fill="#fff" opacity=".6"/><circle class="al-bub b2" cx="207" cy="190" r="1.8" fill="#fff" opacity=".6"/></g>`;
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

export function sceneSvg(s) {
  const fire = (shopItem(s.look.fire) || shopItem("al-coal")).flame;
  const lit = s.flames ?? FLAMES, xs = [170, 190, 210, 230];
  const flames = xs.map((x, i) => i < lit
    ? `<path class="al-fl f${i}" d="M${x} 236 C${x + 9} 224 ${x + 6} 214 ${x} 204 C${x - 6} 214 ${x - 9} 224 ${x} 236Z" fill="url(#al-fire)"/>`
    : `<circle cx="${x}" cy="233" r="3" fill="#5a2010"/><path class="al-smoke" d="M${x} 228 q-5 -8 0 -14" stroke="#9a92aa" stroke-width="1.6" fill="none" opacity=".5"/>`).join("");
  const jars = (s.shelf || []).slice(0, 6).map((id, i) => { const r = REAGENTS[id] || {}, x = 34 + i * 30;
    return `<g><rect x="${x - 9}" y="${44}" width="18" height="22" rx="4" fill="${r.c || "#888"}" opacity=".85" stroke="#000" stroke-opacity=".4"/><rect x="${x - 7}" y="40" width="14" height="5" rx="1" fill="#6b4a2a"/></g>`; }).join("");
  const chips = (s.chips || []).map((id, i) => { const r = REAGENTS[id] || {};
    return `<g class="al-chip" transform="translate(${90 + i * 34} 196)"><circle r="13" fill="#160b2c" stroke="${r.c || "#E2B04A"}" stroke-width="2"/>${r.glyph ? g(r.glyph, -9, -9, 18, "#FADE8C") : `<text y="4" font-size="9" fill="#FADE8C" text-anchor="middle" font-family="system-ui">${xml(r.f.length <= 5 ? r.f : r.name.slice(0, 4))}</text>`}</g>`; }).join("");
  const scroll = s.glyph ? `<g class="al-scroll"><rect x="22" y="84" width="96" height="100" rx="8" fill="#efe1bf" stroke="#8a6a3a" stroke-width="2"/><rect x="16" y="80" width="108" height="10" rx="5" fill="#c9a46b"/><rect x="16" y="180" width="108" height="10" rx="5" fill="#c9a46b"/>${g(s.glyph, 34, 98, 72, "#3a1f0e")}</g>` : "";
  const label = s.label ? `<g class="al-label"><rect x="${200 - Math.min(180, s.label.length * 4.4 + 20)}" y="10" width="${Math.min(360, s.label.length * 8.8 + 40)}" height="28" rx="6" fill="#160b2c" stroke="#E2B04A" stroke-width="2"/><text x="200" y="29" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="700" font-size="${s.label.length > 34 ? 10 : 13}" fill="#FADE8C">${xml(s.label)}</text></g>` : "";
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true" class="${s.glow ? "al-won" : ""}">
<defs><radialGradient id="al-wall" cx="50%" cy="60%" r="75%"><stop offset="0" stop-color="#3b2a52"/><stop offset="1" stop-color="#0a0612"/></radialGradient>
<radialGradient id="al-fire" cx="50%" cy="80%" r="70%"><stop offset="0" stop-color="${fire[0]}"/><stop offset=".5" stop-color="${fire[1]}"/><stop offset="1" stop-color="${fire[2]}"/></radialGradient>
<radialGradient id="al-halo"><stop offset="0" stop-color="${s.liquid || fire[1]}" stop-opacity=".7"/><stop offset="1" stop-color="${s.liquid || fire[1]}" stop-opacity="0"/></radialGradient>
<radialGradient id="al-stoneglow"><stop offset="0" stop-color="#ff3a4a" stop-opacity=".6"/><stop offset="1" stop-color="#ff3a4a" stop-opacity="0"/></radialGradient>
<pattern id="al-brick" width="20" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#6a2f1f"/><path d="M0 0 H20 M0 5 H20 M10 0 V5 M0 5 V10 M20 5 V10" stroke="#2a120a" stroke-width="1"/></pattern></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="#0a0612"/><rect x="-200" width="800" height="300" fill="url(#al-wall)"/>
<rect x="16" y="66" width="188" height="6" rx="2" fill="#5a3a1e"/>${jars}
${charm(s.look.charm)}${scroll}
<rect x="-200" y="250" width="800" height="60" fill="#2a1a10"/><rect x="-200" y="248" width="800" height="6" fill="#5a3a1e"/>
<circle class="al-halo" cx="200" cy="168" r="${s.glow ? 70 : 40}" fill="url(#al-halo)" opacity="${s.glow ? 1 : 0.35}"/>
<rect x="150" y="198" width="100" height="52" rx="4" fill="url(#al-brick)" stroke="#2a120a" stroke-width="2"/><rect x="160" y="206" width="80" height="34" rx="14" fill="#140804"/>
${flames}
${vessel(s.look.vessel, s.liquid)}
${chips}${label}
</svg>`;
}
