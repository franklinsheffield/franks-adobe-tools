// Flame Test Lab bench, drawn as SVG: the chosen burner, its flame (pale blue until a sample goes in), the wire loop,
// a cobalt-glass square, and the spectroscope's view (a dark strip with the element's bright lines and bands).
import { nmToRgb } from "./data.js";

const BLUE = ["#e8f4ff", "#6fb6ff", "#2a5fd8"];
const burnerSvg = (id) => {
  if (id === "ft-spirit") return `<g class="ft-burner"><ellipse cx="110" cy="214" rx="34" ry="8" fill="#0006"/><path d="M80 212 Q80 168 110 166 Q140 168 140 212Z" fill="#9fd3e6" opacity=".55" stroke="#d8f1ff" stroke-width="2"/><path d="M84 210 Q86 186 110 184 Q134 186 136 210Z" fill="#7ab8ff" opacity=".35"/><rect x="104" y="150" width="12" height="18" rx="2" fill="#c9a36a"/><rect x="108" y="140" width="4" height="12" fill="#efe3cf"/></g>`;
  const grid = id === "ft-meker", teclu = id === "ft-teclu";
  return `<g class="ft-burner"><ellipse cx="110" cy="216" rx="40" ry="8" fill="#0006"/><rect x="74" y="204" width="72" height="12" rx="4" fill="#5b5f66" stroke="#9aa0a8"/>
    <rect x="${grid ? 98 : 102}" y="${grid ? 132 : 140}" width="${grid ? 24 : 16}" height="${grid ? 72 : 64}" rx="2" fill="url(#ft-brass)" stroke="#7a5a1a"/>
    ${teclu ? `<path d="M100 196 L120 196 L116 178 L104 178Z" fill="#a07a2a" stroke="#6a4a10"/>` : `<rect x="100" y="188" width="20" height="8" rx="2" fill="#8a6a20"/><circle cx="110" cy="192" r="2.5" fill="#222"/>`}
    ${grid ? `<path d="M98 134 h24 M98 137 h24 M102 132 v6 M106 132 v6 M110 132 v6 M114 132 v6 M118 132 v6" stroke="#3a2a08" stroke-width="1"/>` : ""}
    <path d="M146 210 Q170 210 182 222" stroke="#c44" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
};
const flameSvg = (c, top, wide, lit) => {
  const [a, b, d] = c, y = top, w = wide;
  return `<g class="ft-flame${lit ? " lit" : ""}" style="--fa:${a};--fb:${b};--fd:${d}">
    <path class="ft-f1" d="M110 ${y} C ${110 + w} ${y + 40}, ${110 + w * 0.9} ${y + 70}, 110 ${y + 92} C ${110 - w * 0.9} ${y + 70}, ${110 - w} ${y + 40}, 110 ${y}Z" fill="${d}" opacity=".55"/>
    <path class="ft-f2" d="M110 ${y + 14} C ${110 + w * 0.7} ${y + 46}, ${110 + w * 0.6} ${y + 72}, 110 ${y + 90} C ${110 - w * 0.6} ${y + 72}, ${110 - w * 0.7} ${y + 46}, 110 ${y + 14}Z" fill="${b}" opacity=".85"/>
    <path class="ft-f3" d="M110 ${y + 50} C ${110 + w * 0.3} ${y + 66}, ${110 + w * 0.25} ${y + 80}, 110 ${y + 90} C ${110 - w * 0.25} ${y + 80}, ${110 - w * 0.3} ${y + 66}, 110 ${y + 50}Z" fill="${lit ? a : "#bfe0ff"}"/></g>`;
};
const wireSvg = (id, dip) => {
  const col = id === "ft-platinum" ? "#e8e8ee" : id === "ft-splint" ? "#c9a36a" : "#b8b0a0", w = id === "ft-splint" ? 5 : 2;
  const x = dip ? 118 : 196, y = dip ? 86 : 70;
  return `<g class="ft-wire${dip ? " dip" : ""}"><path d="M${x} ${y} L${x + 92} ${y - 40}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>${id === "ft-splint" ? "" : `<circle cx="${x - 3}" cy="${y + 2}" r="5" fill="none" stroke="${col}" stroke-width="2"/>`}
    <rect x="${x + 70}" y="${y - 38}" width="34" height="10" rx="3" transform="rotate(-24 ${x + 87} ${y - 33})" fill="#3a2a1a"/></g>`;
};
/** The spectroscope view: lines are [nm, strength], bands [from, to, strength]. Spans 400-800 nm. */
export function spectrumSvg({ lines = [], bands = [] } = {}, { w = 300, h = 54, scale = true } = {}) {
  const X = (nm) => ((nm - 400) / 400) * w;
  const rainbow = Array.from({ length: 9 }, (_, i) => `<stop offset="${i / 8}" stop-color="${nmToRgb(400 + i * 50)}" stop-opacity=".12"/>`).join("");
  return `<svg class="ft-spec" viewBox="0 0 ${w} ${h + (scale ? 14 : 0)}" role="img" aria-label="Spectrum: ${lines.map((l) => l[0] + " nm").join(", ")}"><defs><linearGradient id="ft-rb">${rainbow}</linearGradient></defs>
    <rect width="${w}" height="${h}" fill="#05060a"/><rect width="${w}" height="${h}" fill="url(#ft-rb)"/>
    ${bands.map(([a, b, s]) => `<rect x="${X(a).toFixed(1)}" y="0" width="${Math.max(2, X(b) - X(a)).toFixed(1)}" height="${h}" fill="${nmToRgb((a + b) / 2)}" opacity="${(0.35 + 0.5 * s).toFixed(2)}"/>`).join("")}
    ${lines.map(([nm, s]) => `<rect class="ft-line" x="${(X(nm) - 1).toFixed(1)}" y="0" width="${s > 0.6 ? 3 : 2}" height="${h}" fill="${nmToRgb(nm)}" opacity="${(0.45 + 0.55 * s).toFixed(2)}"/>`).join("")}
    ${scale ? [400, 500, 600, 700, 800].map((n) => `<text x="${Math.min(w - 12, Math.max(10, X(n))).toFixed(0)}" y="${h + 11}" font-size="9" fill="#cfc7b8" text-anchor="middle">${n}</text>`).join("") : ""}</svg>`;
}
/** The whole bench. */
export function benchSvg({ look, flame = null, dip = false, cobalt = null, spectrum = null, label = "", puff = false } = {}) {
  const lit = !!flame, c = flame || BLUE, wide = look.burner === "ft-meker" ? 30 : 22, top = look.burner === "ft-spirit" ? 54 : 40;
  return `<svg class="ft-bench" viewBox="0 0 320 240" role="img" aria-label="${lit ? "A coloured flame on the burner" : "A burner with a pale blue flame"}">
    <defs><linearGradient id="ft-brass" x1="0" x2="1"><stop offset="0" stop-color="#8a6420"/><stop offset=".45" stop-color="#f3d27a"/><stop offset="1" stop-color="#7a5418"/></linearGradient>
    <radialGradient id="ft-glow"><stop offset="0" stop-color="${c[1]}" stop-opacity=".55"/><stop offset="1" stop-color="${c[1]}" stop-opacity="0"/></radialGradient></defs>
    <rect width="320" height="240" fill="#14110d"/><rect y="214" width="320" height="26" fill="#2a2018"/><path d="M0 214 H320" stroke="#5a4630"/>
    <circle class="ft-glow" cx="110" cy="${top + 60}" r="${lit ? 90 : 50}" fill="url(#ft-glow)"/>
    ${flameSvg(c, top, wide, lit)}${burnerSvg(look.burner)}${wireSvg(look.wire, dip)}
    ${puff ? `<g class="ft-puff"><circle cx="110" cy="40" r="12" fill="#bbb" opacity=".35"/><circle cx="124" cy="30" r="9" fill="#bbb" opacity=".25"/></g>` : ""}
    ${cobalt ? `<g class="ft-cobalt"><rect x="58" y="44" width="104" height="104" rx="6" fill="#1636c8" opacity=".55" stroke="#8fb0ff" stroke-width="3"/>${cobalt.hex ? `<ellipse cx="110" cy="100" rx="16" ry="34" fill="${cobalt.hex}" opacity=".9"/>` : ""}<text x="110" y="160" font-size="10" fill="#cfe0ff" text-anchor="middle">cobalt glass</text></g>` : ""}
    ${spectrum ? `<g transform="translate(176 150)"><rect x="-6" y="-20" width="146" height="84" rx="8" fill="#000a" stroke="#7a5a1a"/><text x="67" y="-7" font-size="10" fill="#f3d27a" text-anchor="middle">spectroscope</text><g transform="scale(.45)">${spectrumSvg(spectrum, { w: 300, h: 80, scale: true }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></g>` : ""}
    ${label ? `<text x="160" y="232" font-size="12" fill="#f3e6c8" text-anchor="middle">${label.replace(/[<&>]/g, "")}</text>` : ""}</svg>`;
}
