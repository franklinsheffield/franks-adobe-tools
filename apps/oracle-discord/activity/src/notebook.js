// The Lab Notebook: the Alchemist's House book, drawn in the same engine as Your Grimoire (its own tab there).
// It writes itself from what the member has done in Vell's rooms: recipes, the periodic table, the hazard log, plant
// compounds, mineral drawers, Bench discoveries, finished Commissions and four coded margin notes (Hidden Lab).
// prog.rooms.notebook = { studied: [symbols lit by the Element of the Day], day, rows: [periods paid], seal }.
// No DOM here: every function returns HTML strings or plain data, so it can be tested.
import { LEVELS as LAB_LEVELS, room as labRoom } from "./alchemy/logic.js";
import { HAZARDS } from "./alchemy/lab.js";
import { MINERALS, CLASSES } from "./minerals/data.js";
import { RECIPES as BENCH_RECIPES } from "./bench/data.js";
import { JOBS } from "./commissions/data.js";
import { PRODUCTS } from "./bench/data.js";
import { sample } from "./flametest/data.js";
import { BY_ID as DUEL_COMPOUNDS } from "./duel/compounds.js";
import { ALL as PLANTS_ALL } from "./grimoire/logic.js";
import { dailySeed, todayKey } from "./daily.js";

// ---- the 118 elements, in order of atomic number ----
export const SYMS = "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og".split(" ");
export const NAMES = "Hydrogen Helium Lithium Beryllium Boron Carbon Nitrogen Oxygen Fluorine Neon Sodium Magnesium Aluminium Silicon Phosphorus Sulfur Chlorine Argon Potassium Calcium Scandium Titanium Vanadium Chromium Manganese Iron Cobalt Nickel Copper Zinc Gallium Germanium Arsenic Selenium Bromine Krypton Rubidium Strontium Yttrium Zirconium Niobium Molybdenum Technetium Ruthenium Rhodium Palladium Silver Cadmium Indium Tin Antimony Tellurium Iodine Xenon Caesium Barium Lanthanum Cerium Praseodymium Neodymium Promethium Samarium Europium Gadolinium Terbium Dysprosium Holmium Erbium Thulium Ytterbium Lutetium Hafnium Tantalum Tungsten Rhenium Osmium Iridium Platinum Gold Mercury Thallium Lead Bismuth Polonium Astatine Radon Francium Radium Actinium Thorium Protactinium Uranium Neptunium Plutonium Americium Curium Berkelium Californium Einsteinium Fermium Mendelevium Nobelium Lawrencium Rutherfordium Dubnium Seaborgium Bohrium Hassium Meitnerium Darmstadtium Roentgenium Copernicium Nihonium Flerovium Moscovium Livermorium Tennessine Oganesson".split(" ");
const SYM_SET = new Set(SYMS);
const zOf = (s) => SYMS.indexOf(s) + 1;
const IN = (z, list) => list.includes(z), RANGE = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const FAM = {
  alkali: [3, 11, 19, 37, 55, 87], alkaline: [4, 12, 20, 38, 56, 88], noble: [2, 10, 18, 36, 54, 86, 118], halogen: [9, 17, 35, 53, 85, 117],
  lanthanide: RANGE(57, 71), actinide: RANGE(89, 103), transition: [...RANGE(21, 30), ...RANGE(39, 48), ...RANGE(72, 80), ...RANGE(104, 112)],
  metalloid: [5, 14, 32, 33, 51, 52], nonmetal: [1, 6, 7, 8, 15, 16, 34],
};
export const FAMILY_NAME = { alkali: "Alkali metal", alkaline: "Alkaline-earth metal", noble: "Noble gas", halogen: "Halogen", lanthanide: "Lanthanide", actinide: "Actinide", transition: "Transition metal", metalloid: "Metalloid", nonmetal: "Non-metal", post: "Post-transition metal" };
const FAM_COL = { alkali: "#b07cff", alkaline: "#3fae6a", noble: "#5fe0e8", halogen: "#5fd46a", lanthanide: "#e6b86a", actinide: "#ff7aa8", transition: "#e0915a", metalloid: "#c7b45a", nonmetal: "#66b3ff", post: "#9aa6b8" };
export const familyOf = (z) => Object.keys(FAM).find((k) => IN(z, FAM[k])) || "post";
export const periodOf = (z) => (z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : z <= 86 ? 6 : 7);
/** Where an element sits on the 18-column table: { row, col }. Rows 9 and 10 hold the lanthanides and actinides. */
export function cellOf(z) {
  if (z === 1) return { row: 1, col: 1 }; if (z === 2) return { row: 1, col: 18 };
  const p = periodOf(z), first = [0, 1, 3, 11, 19, 37, 55, 87][p];
  if (z >= 57 && z <= 71) return { row: 9, col: z - 57 + 3 };
  if (z >= 89 && z <= 103) return { row: 10, col: z - 89 + 3 };
  if (z - first < 2) return { row: p, col: z - first + 1 };
  if (p <= 3) return { row: p, col: z - first + 11 };   // the short periods skip the transition block
  if (p <= 5) return { row: p, col: z - first + 1 };
  return { row: p, col: z - (p === 6 ? 68 : 100) };    // periods 6 and 7 carry on after the f-block
}
/** Symbols in a formula string ("CaCO₃", "Fe2O3", "CaO + MgO"); anything that is not a real symbol is dropped. */
export const symbolsIn = (f) => [...new Set((String(f || "").match(/[A-Z][a-z]?/g) || []).filter((s) => SYM_SET.has(s)))];

// ---- the room record ----
export function nbRoom(p) { const r = ((p.rooms ||= {}).notebook ||= {}); r.studied ||= []; r.rows ||= []; return r; }
const R = (p, id) => ((p.rooms || {})[id]) || {};
/** Every lit element and what lit it: { [symbol]: [source labels] }. */
export function litTable(p) {
  const out = {}, add = (s, src) => { if (!SYM_SET.has(s)) return; (out[s] ||= []); if (!out[s].includes(src)) out[s].push(src); };
  for (const s of labRoom(p).elements || []) add(s, "Alchemist's Lab");
  for (const id of Object.keys(R(p, "duel").codex || {})) for (const s of (DUEL_COMPOUNDS[id] || {}).els || []) add(s, "Element Duel");
  for (const id of R(p, "minerals").found || []) for (const s of (MINERALS.find((m) => m.id === id) || {}).el || []) add(s, "Mineral Cabinet");
  for (const id of R(p, "bench").made || []) for (const s of symbolsIn((PRODUCTS.find((x) => x.id === id) || {}).f)) add(s, "Discovery Bench");
  for (const id of R(p, "flametest").seen || []) { const sm = sample(id); if (sm && sm.sym) add(sm.sym, "Flame Test Lab"); }
  const lg = R(p, "leadgold"); if (lg.plays) for (const s of ["U", "Th", "Pb"]) add(s, "Lead into Gold"); if (lg.gold) for (const s of ["Au", "Hg"]) add(s, "Lead into Gold");
  for (const s of nbRoom(p).studied) add(s, "Element of the Day");
  return out;
}
/** The Element of the Day: the same element for everyone today. */
export const elementOfDay = (day = todayKey()) => { const z = 1 + (dailySeed("notebook", day) % 118); return { z, sym: SYMS[z - 1], name: NAMES[z - 1], fam: familyOf(z), period: periodOf(z) }; };
/** Study today's element: it lights on the table (once a day). Returns true when it was new today. */
export function studyToday(p, day = todayKey()) { const r = nbRoom(p); if (r.day === day) return false; r.day = day; const e = elementOfDay(day); if (!r.studied.includes(e.sym)) r.studied.push(e.sym); return true; }
export const ROW_PAY = 50, SEAL_STONES = 10;
/** Pay for every newly full period (💎 50 each) and the full table (🪨 10 + Mendeleev's seal), once each. */
export function claimTable(p) {
  const r = nbRoom(p), lit = litTable(p), out = { essence: 0, stones: 0, rows: [], seal: false };
  for (let per = 1; per <= 7; per++) {
    if (r.rows.includes(per)) continue;
    if (SYMS.every((s, i) => periodOf(i + 1) !== per || lit[s])) { r.rows.push(per); out.rows.push(per); out.essence += ROW_PAY; }
  }
  if (!r.seal && SYMS.every((s) => lit[s])) { r.seal = true; out.seal = true; out.stones = SEAL_STONES; }
  return out;
}

// ---- the margin notes: Hidden Lab finds decode them, one note for every three finds ----
// The cipher alphabet is real alchemy: the seven planets stood for the seven metals, the twelve signs for the twelve
// operations of the Great Work, the triangles for the four elements, and the nodes for the head and tail of the dragon.
const VS = "︎";
export const GLYPHS = ["☉", "☽", "☿", "♀", "♂", "♃", "♄", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "△", "▽", "🜁", "🜃", "☊", "☋", "🜍"];
export const encode = (t) => String(t).toUpperCase().replace(/[A-Z]/g, (c) => GLYPHS[c.charCodeAt(0) - 65] + (c.charCodeAt(0) - 65 < 19 ? VS : ""));
export const NOTES = [
  { at: 3, text: "Solve et coagula", gloss: "Dissolve and bind together: the alchemists' motto for taking a substance apart and building it again." },
  { at: 6, text: "As above so below", gloss: "The Emerald Tablet's best-known line: the alchemists believed the heavens and the metals answered each other." },
  { at: 9, text: "Visita interiora terrae", gloss: "Visit the interior of the earth: the start of the VITRIOL motto, whose initials spell the old name for sulfuric acid salts." },
  { at: 12, text: "Saturn rules lead and the Sun rules gold", gloss: "Each of the seven metals had a planet: lead Saturn, tin Jupiter, iron Mars, gold the Sun, copper Venus, mercury Mercury, silver the Moon." },
];
const hiddenFound = (p) => (((p.houses || {}).alchemist || {}).sec || []).length;

// ---- plant compounds: the real chemistry behind the Herbalist's plants ----
export const PLANT_COMPOUNDS = {
  willow: ["Salicin", "The body turns it into salicylic acid. In 1897 Felix Hoffmann at Bayer made a gentler cousin, acetylsalicylic acid: aspirin."],
  meadowsweet: ["Salicylates", "Salicylic acid was first isolated from meadowsweet (then Spiraea), which gave aspirin the 'spir' in its name."],
  foxglove: ["Digitoxin", "A heart drug. William Withering published his foxglove trials for dropsy in 1785."],
  poppy: ["Morphine and codeine", "Friedrich Sertürner isolated morphine from opium around 1804, the first alkaloid taken from a plant."],
  belladonna: ["Atropine", "It widens the pupil; eye doctors still use atropine drops, and it treats some nerve-agent poisoning."],
  henbane: ["Hyoscyamine and scopolamine", "Tropane alkaloids; scopolamine patches are used against motion sickness."],
  datura: ["Scopolamine and atropine", "The same tropane alkaloids as deadly nightshade, which is why the whole plant is poisonous."],
  mandrake: ["Tropane alkaloids", "Hyoscyamine and scopolamine: the real reason mandrake was used as an old anaesthetic."],
  hemlock: ["Coniine", "A nerve poison that paralyses from the feet up; Socrates was executed with hemlock in 399 BCE."],
  monkshood: ["Aconitine", "One of the most toxic plant compounds known; it can be absorbed through the skin."],
  yew: ["Taxanes", "The cancer drug docetaxel is made from a compound in the needles of the European yew."],
  periwinkle: ["Vincristine and vinblastine", "Cancer drugs from the 1950s-60s that changed the outlook for childhood leukaemia."],
  chilli: ["Capsaicin", "It triggers the same heat receptor (TRPV1) as real heat, so the mouth reads it as burning."],
  garlic: ["Allicin", "Made only when a clove is crushed, when the enzyme alliinase meets alliin."],
  turmeric: ["Curcumin", "The yellow pigment; it is poorly absorbed by the body on its own."],
  peppermint: ["Menthol", "It switches on the cold receptor TRPM8, so it feels cool without changing temperature."],
  ginger: ["Gingerol", "Cooking or drying turns some of it into the sharper shogaols."],
  cinnamon: ["Cinnamaldehyde", "The compound that gives cinnamon its smell and taste."],
  nutmeg: ["Myristicin", "In large amounts it is toxic, which is why nutmeg is a spice and not a snack."],
  thyme: ["Thymol", "An antiseptic still used in some mouthwashes."],
  saffron: ["Crocin and safranal", "Crocin gives the gold colour, safranal the hay-like smell."],
  lilyvalley: ["Convallatoxin", "A cardiac glycoside, like foxglove's: every part of the plant is poisonous."],
  oleander: ["Oleandrin", "A cardiac glycoside; even smoke from burning oleander is dangerous."],
  castor: ["Ricin", "A protein toxin in the seed; the pressed oil is safe because ricin stays behind in the mash."],
  rosarypea: ["Abrin", "A protein toxin related to ricin, sealed inside the hard seed coat."],
  milkthistle: ["Silymarin", "A mix of flavonolignans studied for the liver."],
  potato: ["Solanine", "It builds up in green and sprouting potatoes."],
  tomato: ["Lycopene", "The red pigment; the leaves hold tomatine instead."],
  rhubarb: ["Oxalic acid", "Rich in the leaves, which is why only the stalks are eaten."],
  stjohns: ["Hyperforin and hypericin", "Hyperforin speeds up the liver enzymes that clear many medicines, so it interferes with them."],
  lavender: ["Linalool", "Linalool and linalyl acetate make most of lavender oil."],
  chamomile: ["Chamazulene", "It turns chamomile oil deep blue when the flowers are distilled."],
  fennel: ["Anethole", "The same sweet compound as in anise and star anise."],
  dill: ["Carvone", "One mirror-image form smells of caraway and dill, the other of spearmint."],
  rosemary: ["1,8-Cineole and camphor", "The sharp, piney notes of rosemary oil."],
  sage: ["Thujone", "Also found in wormwood; in large doses it is a nerve toxin."],
  wormwood: ["Thujone", "Blamed for absinthe's reputation, though the drink holds very little of it."],
  feverfew: ["Parthenolide", "Studied for migraine prevention."],
  valerian: ["Valerenic acid", "Studied for sleep; the root smells strongly of old socks."],
  waterhemlock: ["Cicutoxin", "It causes violent seizures; often called the most toxic plant in North America."],
  snakeroot: ["Tremetol", "Passed into cows' milk it caused 'milk sickness', which killed Abraham Lincoln's mother in 1818."],
  daffodil: ["Galantamine", "Used for Alzheimer's disease; daffodils are grown as a commercial source of it."],
  elder: ["Sambunigrin", "A cyanide-releasing glycoside in raw leaves, stems and unripe berries; cooking makes the berries safe."],
  apple: ["Amygdalin", "In the pips; it releases cyanide only when seeds are crushed, and a few swallowed whole pass harmlessly."],
  lemonbalm: ["Citral and rosmarinic acid", "Citral gives the lemon smell."],
  parsley: ["Apiol", "Its oil was once sold as a medicine; in large doses it is toxic to the liver and kidneys."],
  bay: ["1,8-Cineole", "The eucalyptus-like note in bay leaves."],
  nettle: ["Histamine and acetylcholine", "Injected by the brittle, glass-like tips of the stinging hairs."],
  horsetail: ["Silica", "So much that the stems were used to scour pots ('scouring rush')."],
};
/** Plant names the member has named in the Herbalist's Grimoire. */
export function namedPlants(p) { const solved = R(p, "grimoire").solved || {}, ids = new Set(Object.keys(solved).map((k) => k.split(":")[1])); return PLANTS_ALL.map((x) => x.p).filter((pl, i, a) => ids.has(pl.id) && a.findIndex((y) => y.id === pl.id) === i); }

// ---- what goes on each page ----
export function labRecipes(p) {
  const solved = labRoom(p).solved || {};
  return LAB_LEVELS.filter((L) => L.n > 1).flatMap((L) => L.deck.filter((x) => solved[L.n + ":" + x.id] != null).map((x) => ({ L, x })));
}
export const benchMade = (p) => (R(p, "bench").made || []).map((id) => BENCH_RECIPES.find((r) => r.id === id)).filter(Boolean);
export const foundMineralsOf = (p) => (R(p, "minerals").found || []).map((id) => MINERALS.find((m) => m.id === id)).filter(Boolean);
export const accidentsOf = (p) => (labRoom(p).accidents || []).map((id) => HAZARDS.find((h) => h.id === id)).filter(Boolean);
export function commissionsDone(p) { const done = R(p, "commissions").done || {}, seen = new Set(), out = [];
  for (const day of Object.keys(done).sort()) for (const id of done[day] || []) if (!seen.has(id)) { seen.add(id); const j = JOBS.find((x) => x.id === id); if (j) out.push({ j, day }); }
  return out; }

export const NB_PAGES = [
  ["table", "🧮 The Table"], ["recipes", "📜 Recipes"], ["bench", "🔬 Bench discoveries"], ["minerals", "🪨 Mineral drawers"],
  ["plants", "🌿 Plant compounds"], ["hazards", "⚠️ Hazard log"], ["commissions", "📦 Commissions"], ["margins", "🜍 Margin notes"],
];
/** The counts shown on the contents page: [have, total]. */
export function nbCounts(p) {
  const lit = Object.keys(litTable(p)).length;
  return {
    table: [lit, 118], recipes: [labRecipes(p).length, LAB_LEVELS.filter((L) => L.n > 1).reduce((a, L) => a + L.deck.length, 0)],
    bench: [benchMade(p).length, PRODUCTS.length], minerals: [foundMineralsOf(p).length, MINERALS.length],
    plants: [namedPlants(p).filter((x) => PLANT_COMPOUNDS[x.id]).length, Object.keys(PLANT_COMPOUNDS).length], hazards: [accidentsOf(p).length, HAZARDS.length],
    commissions: [commissionsDone(p).length, JOBS.length], margins: [NOTES.filter((n) => hiddenFound(p) >= n.at).length, NOTES.length],
  };
}
const head = (t, sub = "") => `<h3 class="bk-h">${t}</h3>${sub ? `<div class="bk-sub">${sub}</div>` : ""}`;
const empty = (t) => `<p class="bk-empty">${t}</p>`;
const page = (title, body, esc) => `<details class="nb-pg"><summary>${title}</summary><div>${body}</div></details>`;

export function tableHtml(p, esc, day = todayKey()) {
  const lit = litTable(p), r = nbRoom(p), today = elementOfDay(day), studied = r.day === day, n = Object.keys(lit).length;
  const cells = SYMS.map((s, i) => { const z = i + 1, c = cellOf(z), f = familyOf(z), on = !!lit[s];
    return `<span class="nb-el${on ? " on" : ""}${s === today.sym ? " today" : ""}" style="grid-row:${c.row};grid-column:${c.col};--fc:${FAM_COL[f]}" title="${z} ${esc(NAMES[i])}${on ? " · lit by " + esc(lit[s].join(", ")) : ""}"><small>${z}</small>${s}</span>`; }).join("");
  const rows = Array.from({ length: 7 }, (_, i) => i + 1).map((per) => { const all = SYMS.filter((s, i) => periodOf(i + 1) === per), got = all.filter((s) => lit[s]).length;
    return `<span class="nb-per${r.rows.includes(per) ? " paid" : ""}">Period ${per}: ${got}/${all.length}${r.rows.includes(per) ? " ✓" : ""}</span>`; }).join("");
  return head("🧮 The Table", `${n} of 118 elements lit${r.seal ? " · 🏵️ Mendeleev's seal" : ""}`)
    + `<div class="nb-today"><b>Element of the Day: ${today.z} ${esc(today.sym)} ${esc(today.name)}</b><small>${esc(FAMILY_NAME[today.fam])} · period ${today.period}</small>
      <button type="button" class="c small" data-nb-study="1" ${studied ? "disabled" : ""}>${studied ? "✓ Studied today" : "🔍 Study it (lights it)"}</button></div>
    <div class="nb-table" role="img" aria-label="Periodic table, ${n} of 118 elements lit">${cells}<span class="nb-gap" style="grid-row:8;grid-column:1/19"></span></div>
    <div class="nb-pers">${rows}</div>
    <p class="bk-note">Elements light from the Alchemist's Lab, Element Duel compounds, the Mineral Cabinet, Discovery Bench products, the Flame Test Lab, Lead into Gold and the Element of the Day. Each full period pays 💎 ${ROW_PAY}; the full table pays 🪨 ${SEAL_STONES} and Mendeleev's seal.</p>`;
}
export function nbPageHtml(sec, p, esc, day = todayKey()) {
  if (sec === "table") return tableHtml(p, esc, day);
  if (sec === "recipes") { const L = labRecipes(p);
    return head("📜 Recipes", "Every experiment you finished in the Alchemist's Lab becomes a page") + (L.length ? L.map(({ L: lv, x }) => page(`${esc(x.product || x.goal)} <small>· ${esc(lv.name)}</small>`,
      `<p><b>${esc(x.eq || "")}</b></p>${x.who ? `<p>${esc(x.who)}${x.when ? ", " + esc(x.when) : ""}</p>` : ""}${x.story ? `<p>${esc(x.story)}</p>` : ""}${x.answer ? `<p><i>What it really showed:</i> ${esc(x.answer)}</p>` : ""}`)).join("") : empty("Finish a Level 2 experiment in the Alchemist's Lab to write the first recipe."));
  }
  if (sec === "bench") { const L = benchMade(p);
    return head("🔬 Bench discoveries", `${L.length} of ${PRODUCTS.length} products`) + (L.length ? L.map((r) => page(`${esc(r.name)} <small>${esc(r.f)}</small>`, `<p><b>${esc(r.eq)}</b></p><p>${esc(r.note)}</p>`)).join("") : empty("Make something at the Discovery Bench to fill this page."));
  }
  if (sec === "minerals") { const L = foundMineralsOf(p);
    return head("🪨 Mineral drawers", `${L.length} of ${MINERALS.length} specimens`) + (L.length ? CLASSES.map(([k, label]) => { const d = L.filter((m) => m.cls === k); if (!d.length) return "";
      return `<h4>${esc(label)}</h4>` + d.map((m) => { const fl = m.flame ? sample(m.flame) : null;
        return page(`${esc(m.name)} <small>${esc(m.f)}</small>`, `<p>Hardness ${m.hard} · ${esc(m.lustre)} lustre · streak ${esc(m.streak)}${fl ? ` · <span class="nb-flame" style="--fl:${fl.flame[1]}">flame ${esc(fl.colour)}</span>` : ""}</p><p>${esc(m.fact)}</p>`); }).join(""); }).join("") : empty("Name a specimen in the Mineral Cabinet to open the first drawer."));
  }
  if (sec === "plants") { const L = namedPlants(p).filter((x) => PLANT_COMPOUNDS[x.id]);
    return head("🌿 Plant compounds", "The chemistry behind the plants you have named in the Herbalist's Grimoire") + (L.length ? L.map((pl) => { const [c, t] = PLANT_COMPOUNDS[pl.id];
      return page(`${pl.emoji || "🌿"} ${esc(pl.name)} <small>→ ${esc(c)}</small>`, `<p><i>${esc(pl.latin)}</i></p><p>${esc(t)}</p>`); }).join("") : empty("Name a plant in the Herbalist's Grimoire. Its compound is written here."));
  }
  if (sec === "hazards") { const L = accidentsOf(p);
    return head("⚠️ Hazard log", `${L.length} of ${HAZARDS.length} accidents learned`) + (L.length ? L.map((h) => page(`${h.kind === "gas" ? "☠️" : "💥"} ${esc(h.name)}`, `<p>${esc(h.what)}</p><p>${esc(h.lesson)}</p>`)).join("") : empty("No accidents yet. The Alchemist's Lab sandbox logs every one you set off."));
  }
  if (sec === "commissions") { const L = commissionsDone(p), pr = (id) => (PRODUCTS.find((x) => x.id === id) || {}).name || id;
    return head("📦 Commissions", `${L.length} finished`) + (L.length ? L.map(({ j, day: d }) => page(`${j.e} ${esc(j.who)} <small>· ${esc(pr(j.wants))}</small>`, `<p>“${esc(j.ask)}”</p><p>${esc(j.why)}</p><p class="bk-note">Delivered ${esc(d)}</p>`)).join("") : empty("Deliver a Commission and its page is written here."));
  }
  if (sec === "margins") { const n = hiddenFound(p);
    return head("🜍 Margin notes", `${n} Hidden Lab find${n === 1 ? "" : "s"} · every 3 finds decodes a note`)
      + NOTES.map((x) => n >= x.at ? `<div class="nb-margin open"><div class="nb-glyphs" aria-hidden="true">${encode(x.text)}</div><b>${esc(x.text)}</b><p>${esc(x.gloss)}</p></div>`
        : `<div class="nb-margin"><div class="nb-glyphs" aria-label="A note in alchemical symbols">${encode(x.text)}</div><small>🔒 Decodes at ${x.at} Hidden Lab finds</small></div>`).join("")
      + (n >= 3 ? `<p class="bk-note">The key: ${GLYPHS.map((g, i) => `${g}${i < 19 ? VS : ""}=${String.fromCharCode(65 + i)}`).join(" ")}. Planets were the metals, signs the operations, triangles the elements.</p>` : "");
  }
  return "";
}
/** The two pages of the Notebook tab: [contents, the open page]. */
export function notebookPages(p, esc, sec = "table", day = todayKey()) {
  const c = nbCounts(p), row = ([k, label]) => `<button type="button" class="bk-row${sec === k ? " on" : ""}" data-nb="${k}"><span>${label}</span><small>${c[k][0]} / ${c[k][1]}</small><i style="--p:${Math.min(100, (c[k][0] / c[k][1]) * 100)}%"></i></button>`;
  const left = head("🧪 The Lab Notebook", "Vell's House book: it writes itself from your work in her rooms") + `<div class="bk-list">${NB_PAGES.map(row).join("")}</div>`;
  return [left, nbPageHtml(sec, p, esc, day)];
}
export const NOTEBOOK_CSS = `
.nb-table{display:grid;grid-template-columns:repeat(18,minmax(0,1fr));grid-template-rows:repeat(7,auto) 6px repeat(2,auto);gap:2px;margin:8px 0}
.nb-el{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:clamp(7px,1.4vw,11px);line-height:1.05;min-height:22px;border-radius:3px;border:1px solid color-mix(in srgb,var(--fc) 70%,#5a4630);color:rgba(70,48,24,.62);background:color-mix(in srgb,var(--fc) 12%,transparent)}
.nb-el small{font-size:.62em;opacity:.7}.nb-el.on{color:#111;background:var(--fc);border-color:var(--fc);box-shadow:0 0 6px color-mix(in srgb,var(--fc) 60%,transparent)}
.nb-el.today{outline:2px solid #ffd76a;outline-offset:1px;animation:nb-pulse 2.4s ease-in-out infinite}@keyframes nb-pulse{50%{outline-color:transparent}}
.nb-today{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:6px 0}.nb-today small{opacity:.75}
.nb-pers{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;opacity:.85}.nb-per.paid{color:#7fe0a0}
.nb-pg{border-bottom:1px dashed color-mix(in srgb,var(--ink,#eee) 25%,transparent);padding:4px 0}.nb-pg summary{cursor:pointer}.nb-pg summary small{opacity:.7}.nb-pg p{margin:4px 0}
.nb-flame{color:var(--fl);font-weight:600}
.nb-margin{margin:8px 0;padding:8px;border-left:3px solid #c88a3a;background:color-mix(in srgb,#c88a3a 8%,transparent)}.nb-glyphs{font-size:18px;letter-spacing:2px;word-break:break-word;font-family:"Segoe UI Symbol","Noto Sans Symbols","Noto Sans Symbols 2",serif}
.nb-margin.open .nb-glyphs{font-size:13px;opacity:.6}
@media (prefers-reduced-motion:reduce){.nb-el.today{animation:none}}`;
