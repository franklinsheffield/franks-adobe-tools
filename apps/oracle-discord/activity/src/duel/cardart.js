// Element Duel card faces: a small picture of what each element really looks like, and its elemental association.
// Pictures (true to life): gases glow in a discharge tube in their real colour (neon's red-orange, argon's violet…),
// (radon, too radioactive for sign tubes, is drawn pale), coloured gases and the two liquid elements sit in a flask, metals are ingots or soft cut chunks in their real colour,
// and the non-metal solids are crystals or powder (yellow sulfur, violet-black iodine, bismuth's rainbow hopper crystal).
// Association: the four classical elements, assigned by how the real element behaves at room temperature:
//   Air = a gas · Water = a liquid · Fire = burns or reacts fiercely in air or water · Earth = every other solid.
// The seven metals known in antiquity also carry their alchemical planet sign (gold ☉ Sun, silver ☽ Moon, iron ♂ Mars,
// copper ♀ Venus, mercury ☿ Mercury, tin ♃ Jupiter, lead ♄ Saturn), and antimony its old sign ♁.
import { EL, FAMILY } from "./elements.js";

// form: tube (discharge glow) · gas (coloured gas in a flask) · liquid · ingot · chunk (soft alkali metal) · crystal · powder · gem
const A = (form, col, col2) => ({ form, col, col2 });
export const ART = {
  H: A("tube", "#e8a6ff"), He: A("tube", "#ffc9a0"), N: A("tube", "#c79bff"), Ne: A("tube", "#ff6a2a"), Ar: A("tube", "#b36bff"),
  Kr: A("tube", "#e6e1ff"), Xe: A("tube", "#7fb0ff"), Rn: A("tube", "#e9e4ee"),
  O: A("gas", "#a9d4ff"), F: A("gas", "#f3f08a"), Cl: A("gas", "#b8e04a"),
  Br: A("liquid", "#9b2d12"), Hg: A("liquid", "#d9dde3", "#8e96a3"),
  Li: A("chunk", "#d9dde3"), Na: A("chunk", "#e3e6ea"), K: A("chunk", "#d6dae0"), Rb: A("chunk", "#d1d4da"), Cs: A("chunk", "#e9cf86"),
  Be: A("ingot", "#b9c0c8"), Mg: A("ingot", "#d4d8dd"), Al: A("ingot", "#d8dde3"), Ca: A("ingot", "#cfd3d6"), Ti: A("ingot", "#a8aeb6"),
  V: A("ingot", "#9aa3ad"), Cr: A("ingot", "#c9d2dc"), Mn: A("ingot", "#b4aca4"), Fe: A("ingot", "#8f9397"), Co: A("ingot", "#a9adc2"),
  Ni: A("ingot", "#c4c0b0"), Cu: A("ingot", "#d0804e"), Zn: A("ingot", "#b8c2c9"), Sr: A("ingot", "#d8d2c0"), Zr: A("ingot", "#b5b9bd"),
  Mo: A("ingot", "#a7adb4"), Ag: A("ingot", "#e8ecf0"), Cd: A("ingot", "#c2c6cc"), Sn: A("ingot", "#d4d6d8"), Ba: A("ingot", "#c7c9c2"),
  W: A("ingot", "#8e9196"), Au: A("ingot", "#f2c440"), Pb: A("ingot", "#7d8590"), U: A("ingot", "#7b8079"),
  B: A("crystal", "#3d3a3a"), C: A("gem", "#e9f6ff"), Si: A("crystal", "#6f7f9a"), P: A("powder", "#c2412f"), S: A("crystal", "#f2d73a"),
  As: A("crystal", "#8a8e93"), Se: A("crystal", "#5a5d63"), Sb: A("crystal", "#b9bec4"), I: A("crystal", "#4b2a6e"), Bi: A("crystal", "#c9a7e8", "#6fd6c8"),
};
export const FIRE = ["Li", "Na", "K", "Rb", "Cs", "Mg", "P", "S"];
export const PLANET = { Au: ["☉", "the Sun"], Ag: ["☽", "the Moon"], Fe: ["♂", "Mars"], Cu: ["♀", "Venus"], Hg: ["☿", "Mercury"], Sn: ["♃", "Jupiter"], Pb: ["♄", "Saturn"], Sb: ["♁", "antimony's old sign"] };
export const CLASSICAL = {
  air: { name: "Air", col: "#9fd8ff", why: "a gas at room temperature" },
  water: { name: "Water", col: "#5fa8ff", why: "a liquid at room temperature" },
  fire: { name: "Fire", col: "#ff7a3d", why: "burns or reacts fiercely in air or water" },
  earth: { name: "Earth", col: "#8fbf5a", why: "a solid at room temperature" },
};
/** Fire, water, air or earth, from how the element behaves at room temperature. */
export function classicalOf(s) {
  const a = ART[s];
  if (a.form === "tube" || a.form === "gas") return "air";
  if (a.form === "liquid") return "water";
  if (FIRE.includes(s)) return "fire";
  return "earth";
}
/** The alchemists' triangle for a classical element: fire up, water down, air up + bar, earth down + bar. */
export function triangleSvg(k, size = 12) {
  const col = CLASSICAL[k].col, up = k === "fire" || k === "air", bar = k === "air" || k === "earth";
  const tri = up ? "M6 1 L11 10.5 H1 Z" : "M6 11 L11 1.5 H1 Z", ln = up ? "M2.4 7.5 H9.6" : "M2.4 4.5 H9.6";
  return `<svg class="du-tri" viewBox="0 0 12 12" width="${size}" height="${size}" aria-hidden="true"><path d="${tri}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/>${bar ? `<path d="${ln}" stroke="${col}" stroke-width="1.3"/>` : ""}</svg>`;
}
/** A 40×26 picture of the element as it really looks. */
export function iconSvg(s) {
  const a = ART[s] || A("ingot", "#aaa"), c = a.col, id = "du-i-" + s;
  const wrap = (inner, defs = "") => `<svg class="du-ico" viewBox="0 0 40 26" aria-hidden="true"><defs>${defs}</defs>${inner}</svg>`;
  const flask = (fill, lvl) => `<path d="M16 3 H24 M17.5 3 V9 L11 22 Q10 24 12.5 24 H27.5 Q30 24 29 22 L22.5 9 V3" fill="none" stroke="#5b5470" stroke-width="1.3"/>${fill ? `<path d="M${lvl === "full" ? "15.5 12.5" : "13.6 17"} L${lvl === "full" ? "24.5 12.5" : "26.4 17"} L29 22 Q30 24 27.5 24 H12.5 Q10 24 11 22 Z" fill="${fill}"/>` : ""}`;
  switch (a.form) {
    case "tube": return wrap(`<rect x="3" y="9" width="34" height="8" rx="4" fill="url(#${id})" stroke="#5b5470" stroke-width=".8"/><rect x="1" y="11" width="3" height="4" rx="1" fill="#6b6478"/><rect x="36" y="11" width="3" height="4" rx="1" fill="#6b6478"/><path d="M6 13 H34" stroke="#fff" stroke-width="1" opacity=".75"/>`,
      `<radialGradient id="${id}" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".35"/></radialGradient>`);
    case "gas": return wrap(`${flask(null)}<path d="M14 15 Q16 12 19 14 Q22 11 25 14 Q28 14 27.5 18 L29 22 Q30 24 27.5 24 H12.5 Q10 24 11 22 Z" fill="${c}" opacity=".85"/><circle cx="20" cy="7" r="2.2" fill="${c}" opacity=".6"/>`);
    case "liquid": return wrap(`${flask(a.col2 ? `url(#${id})` : c, "low")}`, a.col2 ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="${c}"/><stop offset="1" stop-color="${a.col2}"/></linearGradient>` : "");
    case "chunk": return wrap(`<path d="M9 21 L13 9 H29 L32 21 Z" fill="${c}" stroke="#6b6f78" stroke-width=".8"/><path d="M13 9 L20 6 H33 L29 9 Z" fill="#fff" opacity=".85" stroke="#6b6f78" stroke-width=".6"/><path d="M29 9 L33 6 L35 18 L32 21 Z" fill="${c}" opacity=".7" stroke="#6b6f78" stroke-width=".6"/><path d="M15 19 L18 11" stroke="#fff" stroke-width="1.2" opacity=".7"/>`);
    case "ingot": return wrap(`${a.col2 ? `<ellipse cx="20" cy="15" rx="17" ry="10" fill="${a.col2}" opacity=".25"/>` : ""}<path d="M5 21 L10 11 H30 L35 21 Z" fill="url(#${id})" stroke="#4b4f58" stroke-width=".8"/><path d="M10 11 L13 7 H27 L30 11 Z" fill="#fff" opacity=".55" stroke="#4b4f58" stroke-width=".6"/>`,
      `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".75"/></linearGradient>`);
    case "gem": return wrap(`<path d="M12 9 L16 4 H24 L28 9 L20 23 Z" fill="${c}" stroke="#7aa4c8" stroke-width=".9"/><path d="M12 9 H28 M16 4 L18 9 L20 23 L22 9 L24 4" fill="none" stroke="#7aa4c8" stroke-width=".6"/><path d="M15 6 L17 6" stroke="#fff" stroke-width="1.2"/>`);
    case "powder": return wrap(`<path d="M6 22 Q12 11 20 12 Q28 11 34 22 Z" fill="${c}"/>${[[13, 18], [18, 15], [24, 17], [28, 20], [16, 21], [21, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#fff" opacity=".35"/>`).join("")}`);
    default: { // crystal: a cluster of faceted points (bismuth gets its rainbow sheen)
      const fill = a.col2 ? `url(#${id})` : c;
      return wrap(`<path d="M8 23 L11 12 L15 23 Z M14 23 L19 4 L24 23 Z M22 23 L27 10 L32 23 Z" fill="${fill}" stroke="rgba(0,0,0,.45)" stroke-width=".7"/><path d="M19 4 L20.5 23 M27 10 L28 23 M11 12 L12 23" stroke="#fff" stroke-width=".7" opacity=".55"/>`,
        a.col2 ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6c1ff"/><stop offset=".35" stop-color="${c}"/><stop offset=".7" stop-color="${a.col2}"/><stop offset="1" stop-color="#ffd76a"/></linearGradient>` : "");
    }
  }
}
const sign = (o) => (o > 0 ? "+" + o : String(o));
/** One element card (a button). attr = e.g. `data-h="12"`; cls adds classes (small, glow, hint). */
export function cardFace(c, esc, attr, cls = "") {
  const e = EL[c.s], fam = FAMILY[e.fam], k = classicalOf(c.s), K = CLASSICAL[k], pl = PLANET[c.s];
  const tip = `${e.name} · ${fam.name} · ${K.name}: ${K.why}${pl ? ` · alchemists' sign ${pl[0]} (${pl[1]})` : ""} · ${e.fact}`;
  return `<button class="du-card ${cls}" type="button" ${attr} style="--fam:${fam.col};--cl:${K.col}" title="${esc(tip)}" aria-label="${esc(e.name)}, ${esc(K.name)}"><span class="z">${e.z}</span><span class="ox">${e.ox.filter((o) => o).slice(0, 2).map(sign).join(" ") || "0"}</span>${iconSvg(c.s)}<span class="sym">${c.s}</span><span class="nm">${esc(e.name)}</span><span class="cl">${triangleSvg(k)}<i>${K.name}</i>${pl ? `<b>${pl[0]}</b>` : ""}</span><span class="fam"></span></button>`;
}
