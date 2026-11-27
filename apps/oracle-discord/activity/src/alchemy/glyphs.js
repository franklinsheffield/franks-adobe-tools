// Alchemist's Lab: the classic alchemical symbols drawn as SVG (most fonts lack the Unicode alchemical block).
// Shapes follow the commonest forms in 16th-18th century tables; books varied, so these are the standard versions.
const S = 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
export const GLYPH = {
  gold: `<circle cx="20" cy="20" r="12" ${S}/><circle cx="20" cy="20" r="2.6" fill="currentColor"/>`,
  silver: `<path d="M24 7 A13 13 0 1 0 24 33 A10.5 10.5 0 1 1 24 7 Z" fill="currentColor"/>`,
  mercury: `<path d="M13 5 A7 6 0 0 0 27 5" ${S}/><circle cx="20" cy="16" r="7" ${S}/><path d="M20 23 V37 M14 31 H26" ${S}/>`,
  copper: `<circle cx="20" cy="13" r="8.5" ${S}/><path d="M20 21.5 V37 M13 30 H27" ${S}/>`,
  iron: `<circle cx="16" cy="24" r="9" ${S}/><path d="M22.5 17.5 L33 7 M25 7 H33 V15" ${S}/>`,
  tin: `<path d="M9 13 C10 7 18 6 18 12 C18 17 13 21 10 25 H33 M27 8 V35" ${S}/>`,
  lead: `<path d="M12 9 H24 M17 4 V30 M17 22 C19 17 28 17 28 23 C28 28 22 30 23 35 C23.5 37 27 37 28 35" ${S}/>`,
  sulfur: `<path d="M20 4 L31 21 H9 Z M20 21 V37 M13 29 H27" ${S}/>`,
  salt: `<circle cx="20" cy="20" r="12" ${S}/><path d="M8 20 H32" ${S}/>`,
  fire: `<path d="M20 5 L34 32 H6 Z" ${S}/>`,
  water: `<path d="M6 8 H34 L20 35 Z" ${S}/>`,
  air: `<path d="M20 5 L34 32 H6 Z M11.5 21 H28.5" ${S}/>`,
  earth: `<path d="M6 8 H34 L20 35 Z M11.5 19 H28.5" ${S}/>`,
  antimony: `<circle cx="20" cy="25" r="10" ${S}/><path d="M20 3 V15 M14.5 9 H25.5" ${S}/>`,
};
export const glyphSvg = (id, size = 40, cls = "") => GLYPH[id]
  ? `<svg class="al-g ${cls}" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${GLYPH[id]}</svg>` : "";
