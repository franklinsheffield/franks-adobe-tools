// Observatory Phase 4 shelves (House 3, Keeper Altair), store department "House hosts":
//   obsscope  Altair's eyepiece, restyled after a real telescope (prog.obsscope; painted by hosts/observatory.js)
//   obssky    the night sky in the dome scene (prog.obssky; drawn by hosts/observatory-dome.js)
// Every note is a real fact.

/** Eyepieces. ring = the eyepiece's rim colour; deco = extra SVG drawn around the eye (centre 200,152). */
export const SCOPES = [
  { id: "sc-brass", name: "Brass refractor", price: 0, ring: "#E2B04A", deco: "", note: "Galileo built his first refractors in 1609, with a lens at each end of a tube, and soon reached about 20 times magnification." },
  { id: "sc-newton", name: "Newton's reflector", price: 30, ring: "#C9CED8", deco: `<circle cx="200" cy="152" r="9" fill="none" stroke="#C9CED8" stroke-width="1.4" opacity=".7"/>`, note: "Isaac Newton built a working reflecting telescope in 1668, using a curved metal mirror instead of a lens." },
  { id: "sc-dobson", name: "Dobsonian", price: 30, ring: "#d8c7a0", deco: `<path d="M150 186h100" stroke="#a88a5a" stroke-width="4" stroke-linecap="round"/>`, note: "John Dobson built cheap big telescopes from plywood and portholes, and set them up on pavements for anyone to look." },
  { id: "sc-hubble", name: "Hubble's foil", price: 50, ring: "#dcd6c8", deco: `${[0, 1, 2, 3].map((i) => `<rect x="${158 + i * 21}" y="112" width="17" height="6" fill="#8a96b8" stroke="#dcd6c8" stroke-width=".8"/>`).join("")}`, note: "The Hubble Space Telescope went up in 1990 with a 2.4 m mirror. Its silver foil blanket keeps its temperature steady." },
  { id: "sc-webb", name: "Webb's gold hexagons", price: 60, ring: "#E8B830", deco: `${[[-44, -34], [44, -34], [-60, 0], [60, 0], [-44, 34], [44, 34]].map(([dx, dy]) => `<path d="M${200 + dx - 6} ${152 + dy}l3 -5.2h6l3 5.2l-3 5.2h-6z" fill="#F5C842" stroke="#8C5E17" stroke-width=".8"/>`).join("")}`, note: "The James Webb Space Telescope has 18 gold-coated hexagonal mirror segments, 6.5 m across. It launched on 25 December 2021." },
  { id: "sc-arecibo", name: "Arecibo dish", price: 60, ring: "#9aa6b0", deco: `<path d="M200 116V104M188 106L200 100L212 106" stroke="#9aa6b0" stroke-width="1.6" fill="none"/>`, note: "Arecibo's radio dish in Puerto Rico was 305 m across. It worked for 57 years before collapsing in 2020." },
];
export const scopeOf = (id) => SCOPES.find((s) => s.id === id) || SCOPES[0];

/** Night skies over the dome. */
export const SKIES = [
  { id: "sky-clear", name: "A clear night", price: 0, note: "On a dark, moonless night a sharp eye can see a few thousand stars at once." },
  { id: "sky-milkyway", name: "The Milky Way", price: 30, note: "The Milky Way's band is our own galaxy seen edge-on from inside. Light pollution hides it from most cities." },
  { id: "sky-perseids", name: "The Perseids", price: 40, note: "The Perseid meteor shower peaks around 12 August. The meteors are dust left behind by Comet Swift-Tuttle." },
  { id: "sky-aurora", name: "Aurora borealis", price: 40, note: "Auroras glow when particles from the Sun hit the upper air. Oxygen gives the green, about 100 to 300 km up." },
  { id: "sky-zodiacal", name: "Zodiacal light", price: 50, note: "Zodiacal light is sunlight scattered by dust along the plane of the planets. Look west after dusk in spring." },
  { id: "sky-noctilucent", name: "Noctilucent clouds", price: 50, note: "Noctilucent clouds float about 80 km up, the highest clouds on Earth, and shine after sunset in summer." },
];
export const skyOf = (id) => SKIES.find((s) => s.id === id) || SKIES[0];
/** The sky layer, drawn first in the dome scene (behind everything else). */
export function skyHtml(id) {
  const S = skyOf(id); if (S.id === "sky-clear") return "";
  const streaks = S.id === "sky-perseids" ? Array.from({ length: 5 }, (_, i) => `<i style="--d:${(i * 1.7).toFixed(1)}s;--x:${20 + i * 14}%;--y:${6 + (i % 3) * 9}%"></i>`).join("") : "";
  return `<div class="od-sky ${S.id}" aria-hidden="true">${streaks}</div>`;
}

/** The store shows every House's shelves in every House, so the sky preview brings its own CSS. */
function styleOnce(doc = typeof document !== "undefined" ? document : null) { if (!doc || doc.getElementById("od-sky-css")) return; const st = doc.createElement("style"); st.id = "od-sky-css"; st.textContent = SHELVES_CSS; doc.head.appendChild(st); }
const scopeCard = (S) => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect width="200" height="200" rx="16" fill="#0B1530" stroke="#2A3F6E" stroke-width="3"/><g transform="translate(0 -52)"><ellipse cx="100" cy="152" rx="56" ry="42" fill="#8FB8FF" fill-opacity=".12" stroke="${S.ring}" stroke-width="9"/><circle cx="100" cy="152" r="14" fill="#DCE6FF"/><g transform="translate(-100 0)">${S.deco}</g></g></svg>`;
const talk = (open, tryon, buy) => ({ open, tryon, buy });
export const scopeShop = {
  kind: "obsscope", label: "🔭 Altair's eyepieces",
  items: SCOPES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: talk(["One eye, many telescopes. Each of these changed what people could see.", "Pick an eyepiece. Every one is modelled on a real instrument.", "Lenses, mirrors, foil, gold, a dish the size of a valley. Choose your eye."],
    ["{item}. Hold still while I focus.", "{item}. The sky looks different already.", "{item}. Everything's a little sharper."],
    ["{item}, fitted. Thank you, {name}.", "{item}. I'll keep it polished.", "{item}. My eye thanks you."]),
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(scopeCard(scopeOf(id))); ctx.cap("🔭 " + scopeOf(id).name); },
};
export const skyShop = {
  kind: "obssky", label: "🌌 Night skies over the dome",
  items: SKIES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: talk(["Choose tonight's sky. Every one of these really happens up there.", "Night skies, all real. Some need dark country roads to see.", "Pick a sky. I'll open the slit."],
    ["{item}. Look up through the slit.", "{item}. Worth staying up for.", "{item}. Give your eyes a minute."],
    ["{item}, over the dome for good. Thank you, {name}.", "{item}. I'll leave the slit open.", "{item}. Best seat in the House."]),
  preview: (id, ctx) => { styleOnce(); ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(`<div class="od-skycard">${skyHtml(id) || '<div class="od-sky sky-clear"></div>'}</div>`); ctx.cap("🌌 " + skyOf(id).name); },
};

export const SHELVES_CSS = `.od-sky{position:absolute;inset:0;pointer-events:none;z-index:0}
.od-skycard{position:relative;width:min(220px,60vw);aspect-ratio:1;border-radius:16px;overflow:hidden;background:#050a18;border:3px solid #2A3F6E}
.od-sky.sky-milkyway{background:linear-gradient(125deg,transparent 30%,rgba(220,214,255,.22) 42%,rgba(255,236,210,.34) 50%,rgba(220,214,255,.22) 58%,transparent 70%)}
.od-sky.sky-aurora{background:radial-gradient(120% 50% at 50% 0%,rgba(77,255,176,.28),transparent 60%),radial-gradient(60% 30% at 30% 0%,rgba(255,79,122,.16),transparent 70%);animation:od-aur 9s ease-in-out infinite alternate}
@keyframes od-aur{from{filter:hue-rotate(0)}to{filter:hue-rotate(30deg);opacity:.8}}
.od-sky.sky-zodiacal{background:conic-gradient(from 160deg at 85% 100%,transparent 0deg,rgba(255,240,200,.16) 18deg,transparent 36deg)}
.od-sky.sky-noctilucent{background:repeating-linear-gradient(170deg,transparent 0 14px,rgba(120,200,255,.10) 14px 18px),linear-gradient(180deg,transparent 40%,rgba(120,200,255,.14))}
.od-sky.sky-perseids i{position:absolute;left:var(--x);top:var(--y);width:70px;height:1.5px;background:linear-gradient(90deg,transparent,#fff);transform:rotate(28deg);opacity:0;animation:od-met 8.5s linear infinite;animation-delay:var(--d)}
@keyframes od-met{0%,88%{opacity:0;translate:0 0}90%{opacity:1}96%{opacity:0;translate:90px 48px}100%{opacity:0}}
@media (prefers-reduced-motion: reduce){.od-sky,.od-sky i{animation:none!important}.od-sky.sky-perseids i{opacity:.6}}`;
