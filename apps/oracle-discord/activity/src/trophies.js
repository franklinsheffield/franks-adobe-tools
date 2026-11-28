// The Trophy Case: one trophy per game, upgraded Bronze -> Silver -> Gold -> Prismatic by finishing harder levels.
// Rooms report a finished round with C.trophy(roomId, level, { won, perfect }); Oracle readings count toward the
// Crystal Eye. Progress lives in prog.trophies = { [id]: { tier, wins: { 1: n, 2: n, 3: n }, perfect: { 1: true } } },
// prog.trophySets = ["story", "cards"] and prog.showcase = [id, id, id]. Each tier pays its Essence once.

export const TIERS = [
  { key: "none", name: "Locked", pay: 0 },
  { key: "bronze", name: "Bronze", pay: 25 },
  { key: "silver", name: "Silver", pay: 60 },
  { key: "gold", name: "Gold", pay: 120 },
  { key: "prism", name: "Prismatic", pay: 250 },
];

/** need: wins at a level to finish it (puzzle rooms need a few; match games need one win). */
export const TROPHIES = [
  { id: "oracle", game: "Oracle readings", name: "Crystal Eye", art: "eye", how: ["10 readings", "50 readings", "150 readings", "150 readings and every system read"] },
  { id: "seance", game: "Séance: Guess the Ghost", name: "Spirit Bell", art: "bell", need: 3 },
  { id: "decoder", game: "Rune & Glyph Decoder", name: "Rune Tablet", art: "tablet", need: 3 },
  { id: "alchemy", game: "Alchemist's Lab", name: "Philosopher's Flask", art: "flask", need: 3 },
  { id: "timeline", game: "History of Magic", name: "Hourglass of Ages", art: "glass", need: 1 },
  { id: "stars", game: "Star Lore Navigator", name: "Astrolabe", art: "astro", need: 3 },
  { id: "calendar", game: "Calendar Keeper", name: "Sun Disc", art: "sun", need: 3 },
  { id: "grimoire", game: "Herbalist's Grimoire", name: "Herbalist's Mortar", art: "mortar", need: 3 },
  { id: "duel", game: "Element Duel", name: "Elemental Crown", art: "crown", need: 1 },
  { id: "rummy", game: "Constellation Rummy", name: "Star Hand", art: "cards", need: 1 },
  { id: "memory", game: "Grimoire Memory", name: "Sealed Grimoire", art: "book", need: 1 },
  { id: "starparty", game: "Star Party", name: "Radiant Medal", art: "astro", need: 3, how: ["Clear First watch", "Clear Busy sky", "Clear Seasoned counter", "A perfect watch at every level"] },
  { id: "messier", game: "Messier's Catalogue", name: "Ferret of Comets", art: "astro", need: 3, how: ["Clear What is it?", "Clear Where is it?", "Clear Tonight", "A perfect run at every level"] },
  { id: "navigator", game: "Celestial Navigator", name: "Brass Sextant", art: "astro", need: 3, how: ["Clear Polaris", "Clear The noon Sun", "Clear Longitude", "A perfect voyage at every level"] },
  { id: "eclipse", game: "Eclipse Chaser", name: "Corona Medal", art: "astro", need: 3, how: ["Clear Line them up", "Clear The nodes", "Clear Saros and paths", "A perfect run at every level"] },
  { id: "comet", game: "Comet Hunter", name: "Halley's Plate", art: "astro", need: 3, how: ["Clear Spot the mover", "Clear Comet or Messier object", "Clear Predict a return", "A perfect run at every level"] },
  { id: "watch", game: "The Night Watch", name: "Brass Eyepiece", art: "astro", need: 3, how: ["Log 3 observations", "Measure 3 plates", "Deliver 3 Almanac Desk jobs", "A perfect round at every step"] },
  { id: "flametest", game: "Flame Test Lab", name: "Bunsen's Burner", art: "burner", need: 3 },
  { id: "inscriptions", game: "Inscription Tray", name: "Scribe's Loupe", art: "loupe", need: 3 },
  { id: "cipherdesk", game: "Cipher Desk", name: "Black Chamber Key", art: "cipherkey", need: 3 },
  { id: "blackchamber", game: "Black Chamber", name: "Lifted Seal", art: "liftedseal", need: 3 },
  { id: "illuminator", game: "Illuminator", name: "Gilded Initial", art: "gildedinitial", need: 3 },
  { id: "minerals", game: "Mineral Cabinet", name: "Collector's Geode", art: "geode", need: 3 },
  { id: "casefiles", game: "Case Files", name: "Investigator's Lens", art: "lens", need: 3 },
  { id: "workshop", game: "The Workshop", name: "Golden Top Hat", art: "tophat", need: 3 },
  { id: "bookings", game: "Bookings", name: "Star Turn Ticket", art: "ticket", need: 3 },
  { id: "darkseance", game: "The Dark Séance", name: "Spirit Trumpet", art: "trumpet", need: 3 },
  { id: "mentalist", game: "The Mentalist", name: "Silk Blindfold", art: "blindfold", need: 3 },
  { id: "phantasmagoria", game: "Phantasmagoria", name: "Brass Lantern", art: "lantern", need: 3 },
  { id: "roguesgallery", game: "The Rogues' Gallery", name: "Gilt Frame", art: "frame", need: 1 }, // L1 a pair, L2 the whole wall, L3 the Final Séance
  { id: "possession", game: "Possession", name: "Spirit Planchette", art: "planchette", need: 3, how: ["Win 3 short tales", "Win 3 tales", "Win 3 epics", "A perfect tale at every length"] },
  { id: "bench", game: "Discovery Bench", name: "Golden Crucible", art: "crucible", need: 1, how: ["10 discoveries", "30 discoveries", "Every discovery", "Every discovery"] },
  { id: "fireworks", game: "Fireworks Workshop", name: "Golden Rocket", art: "rocket", need: 2, how: ["Win Level 1", "Win Level 2", "Win a Level 3 show", "A perfect Level 3 show"] },
  { id: "fregoli", game: "The Same Person", name: "Fregoli's Mask", art: "mask", meta: true, how: ["Find 4 Dossier clues", "Find 9 Dossier clues", "Find 14 Dossier clues", "Find all 17 Dossier clues"] },
  { id: "leadgold", game: "Lead into Gold", name: "Philosopher's Nucleus", art: "nucleus", need: 2, how: ["Win Level 1", "Win Level 2", "Win Level 3", "A perfect Level 3"] },
  { id: "commissions", game: "Commissions", name: "Royal Warrant", art: "seal", need: 3, how: ["3 Village jobs", "3 Guild jobs", "3 Royal Society jobs", "Clear the board at every tier"] },
];
for (const t of TROPHIES) if (!t.how) {
  const n = t.need, w = n === 1 ? "Win" : `Win ${n} rounds`;
  t.how = [`${w} at Level 1`, `${w} at Level 2`, `${w} at Level 3`, "A perfect round at every level"];
}
export const SETS = [
  { id: "story", name: "Story set", ids: ["seance", "decoder", "alchemy", "timeline"], bonus: 100 },
  { id: "cards", name: "Card set", ids: ["duel", "rummy", "memory"], bonus: 100 },
  { id: "topbill", name: "Top of the Bill", ids: ["seance", "timeline", "darkseance", "mentalist", "phantasmagoria"], bonus: 300 }, // Gold on all 5 Séance Parlour games
  { id: "orrery", name: "The Grand Orrery", ids: ["stars", "calendar", "rummy", "comet", "eclipse", "navigator"], bonus: 250 }, // obsprog.js OBS_GAMES: Gold on every Observatory game
];
export const CASE_LEVELS = [{ at: 0, name: "Apprentice" }, { at: 8, name: "Curator" }, { at: 20, name: "Archivist" }, { at: 32, name: "Grand Keeper" }];

/** What the Oracle says when you win each trophy. */
export const LINES = {
  oracle: "The Crystal Eye sees you seeing it. That's a lot of futures, friend.",
  seance: "The Spirit Bell rings itself. The ghosts approve of your detective work.",
  decoder: "The Rune Tablet glows. Even the old carvers would nod at that reading.",
  alchemy: "The Philosopher's Flask! No philosopher's stone inside, but a lot of real chemistry.",
  timeline: "The Hourglass of Ages turns. History knows your name now.",
  stars: "The Astrolabe points straight at you. Navigators everywhere salute.",
  calendar: "The Sun Disc rises. You keep time like the old sky-watchers.",
  grimoire: "The Herbalist's Mortar. Your herbal knowledge is officially ground-breaking.",
  duel: "The Elemental Crown. All four elements, bowing. Mostly the reactive ones.",
  rummy: "The Star Hand. You read the heavens and the table. Unbeatable combo.",
  memory: "The Sealed Grimoire opens only for minds like yours. Remember this moment.",
  flametest: "Bunsen's Burner, in your colours. Every flame you read was a real element.",
  bench: "The Golden Crucible. Every discovery in it was real chemistry.",
  fireworks: "The Golden Rocket. Every colour in your sky was real chemistry.",
  leadgold: "The Philosopher's Nucleus. You did what the alchemists only dreamed of.",
  commissions: "The Royal Warrant. The Society itself vouches for your chemistry.",
  inscriptions: "The Scribe's Loupe. Every mark meant something, and you read the script.",
  starparty: "The Radiant Medal. You counted the shower true, strays and all left out.",
  messier: "The Ferret of Comets. Louis XV's name for Messier, and now yours.",
  navigator: "The Brass Sextant. You found your way home with nothing but the sky and a clock.",
  eclipse: "The Corona Medal. You lined up Sun, Moon and node like a Babylonian scribe.",
  illuminator: "The Gilded Initial. Leaf laid first, then colour, then the fine black line.",
  blackchamber: "The Lifted Seal. Opened, read, resealed: nobody ever knew the post had been read.",
  cipherdesk: "The Black Chamber Key. Every secret on the desk came back in plain words.",
  comet: "Halley's Plate. He predicted a return and so did you. Comets keep appointments.",
  minerals: "The Collector's Geode. Crack it open: crystals, and your name on the label.",
  casefiles: "The Investigator's Lens. Every ghost you looked through it had a method.",
  workshop: "The Golden Top Hat. Every trick under it is one a real medium used, and now you know how.",
  bookings: "The Star Turn Ticket. Your name at the top of the bill, and not one spirit on the payroll.",
  fregoli: "Fregoli's Mask. Five hosts, one face, and you saw through every hat. Fregoli himself never got caught that badly.",
  darkseance: "The Spirit Trumpet. It never floated by itself, and now you know every way it was made to.",
  possession: "The Spirit Planchette. Sold for spirit writing in the 1850s; tonight every word came from you.",
  phantasmagoria: "The Brass Lantern. It filled Paris with ghosts in 1798, and every one was a painted slide.",
  roguesgallery: "The Gilt Frame. Every face on the wall fooled someone, and someone else found out how.",
  mentalist: "The Silk Blindfold. You never read a mind in it, only the audience, and that was the whole act.",
};

const room = (p, id) => { p.trophies = p.trophies || {}; return (p.trophies[id] = p.trophies[id] || { tier: 0, wins: {}, perfect: {} }); };
export const tierOf = (p, id) => ((p.trophies || {})[id] || {}).tier || 0;
export const points = (p) => TROPHIES.reduce((n, t) => n + tierOf(p, t.id), 0);
export const caseLevel = (p) => CASE_LEVELS.reduce((a, l) => (points(p) >= l.at ? l : a), CASE_LEVELS[0]);
export const earned = (p) => TROPHIES.reduce((n, t) => n + TIERS.slice(1, tierOf(p, t.id) + 1).reduce((a, x) => a + x.pay, 0), 0)
  + (p.trophySets || []).reduce((n, id) => n + (SETS.find((s) => s.id === id) || { bonus: 0 }).bonus, 0);

/** Raise a trophy to `tier` if that's higher. Returns the news, with the Essence owed for every tier crossed. */
function raise(p, id, tier) {
  const r = room(p, id), from = r.tier;
  if (tier <= from) return null;
  r.tier = tier;
  const pay = TIERS.slice(from + 1, tier + 1).reduce((a, x) => a + x.pay, 0);
  const sets = [];
  for (const s of SETS) if (!(p.trophySets || []).includes(s.id) && s.ids.every((x) => tierOf(p, x) >= 3)) { p.trophySets = [...(p.trophySets || []), s.id]; sets.push(s); }
  return { id, from, tier, pay: pay + sets.reduce((a, s) => a + s.bonus, 0), sets };
}

/** A room finished a round. `level` is 1-3. Returns the news ({ id, from, tier, pay, sets }) or null. */
export function recordWin(p, id, level, { won = true, perfect = false } = {}) {
  const t = TROPHIES.find((x) => x.id === id), L = Math.max(1, Math.min(3, Math.round(level) || 1));
  if (!t || t.id === "oracle" || !won) return null;
  const r = room(p, id);
  r.wins[L] = (r.wins[L] || 0) + 1; if (perfect) r.perfect[L] = true;
  let tier = 0;
  for (let n = 1; n <= 3; n++) if ((r.wins[n] || 0) >= t.need) tier = n;
  if (tier === 3 && [1, 2, 3].every((n) => r.perfect[n])) tier = 4;
  return raise(p, id, tier);
}

/** The Dossier (hosts/disguise.js): Fregoli's Mask rises with clues found (4, 9, 14, all 17). */
export const CLUE_TIERS = [4, 9, 14, 17];
export function recordClues(p, n) { return raise(p, "fregoli", CLUE_TIERS.reduce((t, need, i) => (n >= need ? i + 1 : t), 0)); }

/** After a reading: the Crystal Eye counts readings, and Prismatic needs every system read. */
export function recordReading(p, systemCount) {
  const n = p.readings || 0, all = Object.keys(p.systems || {}).length >= systemCount;
  const tier = n >= 150 && all ? 4 : n >= 150 ? 3 : n >= 50 ? 2 : n >= 10 ? 1 : 0;
  return raise(p, "oracle", tier);
}

/** Pin or unpin a trophy (up to three) to show beside your name. */
export function togglePin(p, id) {
  const s = (p.showcase || []).filter((x) => x !== id);
  if (s.length === (p.showcase || []).length && tierOf(p, id) > 0) { s.push(id); if (s.length > 3) s.shift(); }
  p.showcase = s; return s;
}

// ---- drawings (100 x 100), coloured by tier ----
const MAT = { none: ["#4a4458", "#2e2a3a", "#1c1926"], bronze: ["#f0b27a", "#b06a32", "#6e3d18"], silver: ["#ffffff", "#c7cfdd", "#7d879b"], gold: ["#fff1b8", "#E2B04A", "#8C5E17"], prism: ["#ffffff", "#ffe17a", "#8fb4ff"] };
let uidN = 0;
export function trophyArt(kind, tierKey, { plinth = true } = {}) {
  const [hi, mid, lo] = MAT[tierKey] || MAT.none, u = "tr" + (++uidN), g = u + "g";
  const F = `fill="url(#${g})" stroke="${lo}" stroke-width="1.2"`;
  const grad = tierKey === "prism"
    ? `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd6f4"/><stop offset=".3" stop-color="#fff2a8"/><stop offset=".6" stop-color="#a8f0ff"/><stop offset="1" stop-color="#b9a4ff"/></linearGradient>`
    : `<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></linearGradient>`;
  const S = {
    eye: `<circle cx="50" cy="46" r="26" ${F}/><path d="M30 46 Q50 30 70 46 Q50 62 30 46Z" fill="#0b0818"/><circle class="tr-pupil" cx="50" cy="46" r="7" fill="#ff5fa8"/><rect x="44" y="70" width="12" height="9" ${F}/>`,
    bell: `<g class="tr-swing"><path d="M50 16 C34 16 30 32 30 48 L26 66 L74 66 L70 48 C70 32 66 16 50 16Z" ${F}/><circle cx="50" cy="71" r="5" ${F}/></g><rect x="46" y="10" width="8" height="8" rx="2" ${F}/><rect x="46" y="74" width="8" height="5" ${F}/>`,
    tablet: `<path d="M30 20 Q50 10 70 20 L70 76 L30 76Z" ${F}/><path class="tr-glyph" d="M42 30 L42 52 M42 34 L52 42 M58 30 L58 52 L66 46 M40 62 L50 56 L60 62" fill="none" stroke="${lo}" stroke-width="2.4" stroke-linecap="round"/>`,
    flask: `<path d="M44 14 L56 14 L56 34 L72 66 Q74 76 64 76 L36 76 Q26 76 28 66 L44 34Z" ${F}/><path d="M34 60 L66 60 L71 68 Q72 73 64 73 L36 73 Q28 73 29 68Z" fill="#66E0C8" opacity=".8"/><circle class="tr-bub" cx="46" cy="58" r="2.5" fill="#fff" opacity=".8"/><circle class="tr-bub b2" cx="54" cy="60" r="1.8" fill="#fff" opacity=".7"/>`,
    glass: `<rect x="28" y="12" width="44" height="6" rx="2" ${F}/><rect x="28" y="70" width="44" height="6" rx="2" ${F}/><path d="M34 18 L66 18 L52 44 L66 70 L34 70 L48 44Z" fill="rgba(255,255,255,.12)" stroke="${mid}" stroke-width="1.5"/><path d="M40 70 L60 70 L50 56Z" fill="#E2B04A"/><path d="M42 24 L58 24 L50 38Z" fill="#E2B04A" opacity=".8"/><rect class="tr-sand" x="49.4" y="38" width="1.2" height="26" fill="#E2B04A"/>`,
    astro: `<circle cx="50" cy="44" r="27" ${F}/><circle cx="50" cy="44" r="19" fill="#0b0818" stroke="${mid}" stroke-width="1.5"/><path d="M50 25 L50 63 M31 44 L69 44" stroke="${mid}" stroke-width="1"/><g class="tr-rot"><path d="M36 30 L64 58" stroke="${hi}" stroke-width="2.2"/></g><circle cx="50" cy="13" r="4" ${F}/><rect x="45" y="70" width="10" height="9" ${F}/>`,
    sun: `<g class="tr-rot">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, P = (r, d) => `${(50 + Math.cos(a + d) * r).toFixed(1)} ${(44 + Math.sin(a + d) * r).toFixed(1)}`; return `<path d="M${P(21, 0)} L${P(31, 0.13)} L${P(31, -0.13)}Z" ${F}/>`; }).join("")}</g><circle cx="50" cy="44" r="18" ${F}/><circle cx="50" cy="44" r="8" fill="none" stroke="${lo}" stroke-width="1.5"/><rect x="45" y="70" width="10" height="9" ${F}/>`,
    crown: `<path d="M24 66 L20 30 L36 46 L50 22 L64 46 L80 30 L76 66Z" ${F}/><rect x="24" y="64" width="52" height="8" rx="2" ${F}/><circle class="tr-gem" cx="20" cy="30" r="4" fill="#ff7a4a"/><circle class="tr-gem g2" cx="50" cy="22" r="4" fill="#66E0C8"/><circle class="tr-gem g3" cx="80" cy="30" r="4" fill="#8fb4ff"/><circle class="tr-gem g4" cx="50" cy="56" r="4" fill="#7ad16a"/><rect x="45" y="72" width="10" height="7" ${F}/>`,
    cards: `<g transform="rotate(-14 50 70)"><rect x="28" y="20" width="26" height="40" rx="3" ${F}/></g><g transform="rotate(14 50 70)"><rect x="46" y="20" width="26" height="40" rx="3" ${F}/></g><rect x="37" y="16" width="26" height="42" rx="3" ${F}/><path class="tr-gem" d="M50 26 L53 34 L61 34 L55 39 L57 47 L50 42 L43 47 L45 39 L39 34 L47 34Z" fill="#0b0818"/><rect x="45" y="62" width="10" height="17" ${F}/>`,
    book: `<path d="M26 22 L50 28 L74 22 L74 66 L50 72 L26 66Z" ${F}/><path d="M50 28 L50 72" stroke="${lo}" stroke-width="1.5"/><g class="tr-rot"><circle cx="62" cy="46" r="7" fill="none" stroke="${lo}" stroke-width="1.6"/><path d="M62 39 L62 53 M55 46 L69 46" stroke="${lo}" stroke-width="1.2"/></g><path d="M34 36 L44 38 M34 44 L44 46 M34 52 L44 54" stroke="${lo}" stroke-width="1.4"/><rect x="45" y="72" width="10" height="7" ${F}/>`,
    burner: `<path class="tr-flame" d="M50 8 C62 24 60 36 50 44 C40 36 38 24 50 8Z" fill="#66E0C8" opacity=".85"/><path d="M50 22 C56 30 55 36 50 40 C45 36 44 30 50 22Z" fill="#fff" opacity=".7"/><rect x="44" y="44" width="12" height="28" rx="2" ${F}/><rect x="40" y="58" width="20" height="6" rx="2" ${F}/><rect x="30" y="72" width="40" height="7" rx="3" ${F}/>`,
    mask: `<path d="M18 40 Q34 28 50 38 Q66 28 82 40 Q84 58 68 62 Q56 62 50 52 Q44 62 32 62 Q16 58 18 40Z" ${F}/><ellipse cx="35" cy="46" rx="7" ry="5" fill="#0b0818"/><ellipse cx="65" cy="46" rx="7" ry="5" fill="#0b0818"/><g class="tr-swing"><path d="M50 52 L50 80" stroke="${mid}" stroke-width="3" stroke-linecap="round"/></g><path class="tr-gem" d="M26 36 Q34 32 42 36" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`,
    trumpet: `<path d="M24 62 L58 48 Q74 30 82 26 L84 44 Q76 52 60 58 Z" ${F}/><circle cx="24" cy="62" r="5" ${F}/><path class="tr-gem" d="M62 44 Q72 36 78 32" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/><circle cx="34" cy="70" r="3" fill="#b8f0ff" opacity=".8"/><circle cx="72" cy="66" r="2.5" fill="#b8f0ff" opacity=".6"/>`,
    blindfold: `<path d="M14 44 Q50 30 86 44 L86 56 Q50 44 14 56 Z" ${F}/><path d="M20 54 Q14 68 22 80" stroke="${lo}" stroke-width="4" fill="none"/><path d="M28 52 Q26 70 34 82" stroke="${lo}" stroke-width="3" fill="none"/><circle class="tr-gem" cx="50" cy="44" r="5" fill="#fff" opacity=".7"/>`,
    frame: `<rect x="22" y="18" width="56" height="66" rx="3" ${F}/><rect x="31" y="27" width="38" height="48" rx="19" stroke="${lo}" stroke-width="3" fill="none"/><circle cx="50" cy="45" r="7" stroke="${lo}" stroke-width="3" fill="none"/><path d="M38 66 Q50 54 62 66" stroke="${lo}" stroke-width="3" fill="none"/>`,
    lantern: `<rect x="34" y="34" width="32" height="34" rx="4" ${F}/><path d="M42 34v-10h16v10" ${F}/><circle cx="50" cy="20" r="4" ${F}/><path d="M66 46h14l4 -4v16l-4 -4h-14z" ${F}/><circle class="tr-gem" cx="50" cy="51" r="7" fill="#FFD27A" opacity=".85"/><path d="M84 46 L96 38 M84 54 L96 62" stroke="#FFF3C4" stroke-width="2" opacity=".6"/>`,
    planchette: `<path d="M50 18 C70 18 80 36 76 54 C72 70 58 80 50 80 C42 80 28 70 24 54 C20 36 30 18 50 18Z" ${F}/><circle class="tr-gem" cx="50" cy="44" r="10" fill="#b8f0ff" opacity=".6"/><circle cx="36" cy="70" r="3.5" fill="${lo}"/><circle cx="64" cy="70" r="3.5" fill="${lo}"/><path d="M50 80 L50 90" stroke="${lo}" stroke-width="3"/>`,
    tophat: `<rect x="32" y="26" width="36" height="40" rx="3" ${F}/><rect x="20" y="64" width="60" height="9" rx="4" ${F}/><rect x="32" y="54" width="36" height="7" fill="#a3122a" opacity=".85"/><path class="tr-gem" d="M40 32 L40 50" stroke="#fff" stroke-width="2.5" opacity=".7"/>`,
    ticket: `<path d="M18 34 H82 V44 Q76 50 82 56 V66 H18 V56 Q24 50 18 44Z" ${F}/><path d="M38 36 V64" stroke="${lo}" stroke-width="1.5" stroke-dasharray="3 3"/><path class="tr-gem" d="M60 40 L63 47 L70 47 L64 51 L66 58 L60 54 L54 58 L56 51 L50 47 L57 47Z" fill="#fff6d0"/>`,
    lens: `<circle cx="44" cy="42" r="20" ${F}/><circle cx="44" cy="42" r="13" fill="#cfe8ff" opacity=".35"/><path class="tr-gem" d="M36 34 Q40 30 46 30" stroke="#fff" stroke-width="3" fill="none"/><path d="M58 56 L76 74" stroke="#5a3a12" stroke-width="9" stroke-linecap="round"/><path d="M58 56 L76 74" stroke="#C9A24A" stroke-width="5" stroke-linecap="round"/>`,
    gildedinitial: `<rect x="22" y="18" width="56" height="64" rx="3" ${F}/><rect x="30" y="26" width="30" height="30" rx="2" fill="#e2b04a" stroke="${mid}" stroke-width="2"/><text x="45" y="50" text-anchor="middle" font-family="Georgia,serif" font-size="24" font-weight="700" fill="#1f4fbf">D</text><path d="M30 64 h40 M30 72 h34 M64 30 h8 M64 38 h8" stroke="${lo}" stroke-width="2"/><path class="tr-rot" d="M30 26 L42 26 L30 38Z" fill="#fff8d8" opacity=".6"/>`,
    liftedseal: `<rect x="18" y="34" width="64" height="42" rx="2" ${F}/><path d="M18 36 L50 58 L82 36" fill="none" stroke="${lo}" stroke-width="2"/><g class="tr-rot"><circle cx="66" cy="28" r="11" fill="#a52a1e" stroke="${mid}" stroke-width="2"/><path d="M60 28 h12 M66 22 v12" stroke="#f3c9a0" stroke-width="2"/></g>`,
    cipherkey: `<circle cx="34" cy="38" r="16" ${F}/><circle cx="34" cy="38" r="7" fill="none" stroke="${lo}" stroke-width="3"/><g class="tr-rot"><path d="M48 46 L80 72 M66 60 l6 -6 M72 66 l6 -6" stroke="${mid}" stroke-width="6" stroke-linecap="round"/></g>`,
    loupe: `<path d="M24 30 Q50 22 70 30 L70 74 L24 74Z" ${F}/><path d="M32 40 h26 M32 48 h20 M32 56 h24" stroke="${lo}" stroke-width="2" stroke-linecap="round"/><g class="tr-rot"><circle cx="62" cy="40" r="14" fill="rgba(255,255,255,.18)" stroke="${mid}" stroke-width="4"/><path d="M72 50 L84 64" stroke="${mid}" stroke-width="6" stroke-linecap="round"/></g>`,
    geode: `<path d="M22 54 Q20 26 50 20 Q80 26 78 54 Q76 76 50 78 Q24 76 22 54Z" ${F}/><path d="M32 52 Q32 34 50 30 Q68 34 68 52 Q66 68 50 70 Q34 68 32 52Z" fill="#7a4ad0" opacity=".85"/><path class="tr-gem" d="M42 52 L50 36 L58 52 L50 64Z" fill="#c8a8ff"/><path d="M36 56 L44 46 L46 60Z M56 46 L64 54 L56 62Z" fill="#e6d8ff" opacity=".8"/>`,
    rocket: `<path d="M50 14 Q62 28 60 56 L40 56 Q38 28 50 14Z" ${F}/><path d="M40 48 L30 64 L40 60Z M60 48 L70 64 L60 60Z" ${F}/><circle cx="50" cy="34" r="6" fill="none" stroke="${lo}" stroke-width="2.5"/><path class="tr-gem" d="M44 60 Q50 78 56 60" fill="#ff9a3c" opacity=".9"/><g class="tr-rot"><path d="M20 22 l4 4 M80 22 l-4 4 M16 40 h6 M84 40 h-6" stroke="#ffd86b" stroke-width="2.5" stroke-linecap="round"/></g>`,
    nucleus: `<circle cx="50" cy="46" r="26" ${F}/>${[[44,40],[56,40],[50,50],[42,52],[58,52],[50,38]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="6" fill="${i%2?"#e2574a":lo}"/>`).join("")}<g class="tr-rot"><ellipse cx="50" cy="46" rx="40" ry="12" fill="none" stroke="#ffd86b" stroke-width="2"/><circle cx="90" cy="46" r="3" fill="#ffd86b"/></g>`,
    seal: `<path d="M38 56 L30 84 L40 78 L46 86 L50 60Z" fill="#b8322a"/><path d="M62 56 L70 84 L60 78 L54 86 L50 60Z" fill="#8a2420"/><circle cx="50" cy="44" r="24" ${F}/><circle cx="50" cy="44" r="16" fill="none" stroke="${lo}" stroke-width="2"/><path class="tr-glyph" d="M40 50 L42 38 L50 46 L58 38 L60 50Z" fill="${lo}"/>`,
    crucible: `<path d="M26 34 L74 34 L66 74 Q64 80 56 80 L44 80 Q36 80 34 74Z" ${F}/><rect x="22" y="28" width="56" height="8" rx="3" ${F}/><path d="M34 46 L66 46 L63 60 L37 60Z" fill="#ffcf6a" opacity=".85"/><circle class="tr-bub" cx="46" cy="50" r="2.5" fill="#fff" opacity=".8"/><path class="tr-flame" d="M40 92 Q46 82 50 92 Q54 82 60 92Z" fill="#ff8a3a"/>`,
    mortar: `<path class="tr-pestle" d="M58 44 L74 14" stroke="${mid}" stroke-width="7" stroke-linecap="round"/><path d="M24 46 L76 46 Q74 74 50 76 Q26 74 24 46Z" ${F}/><rect x="22" y="42" width="56" height="6" rx="3" ${F}/><path d="M36 42 Q40 36 44 42 M48 42 Q52 34 56 42" fill="#7ad16a"/>`,
  };
  const base = plinth ? `<rect x="28" y="84" width="44" height="8" rx="2" fill="#2a1d0c" stroke="#E2B04A" stroke-width=".8"/><rect x="34" y="78" width="32" height="7" rx="1.5" ${F}/>` : "";
  const shine = tierKey === "silver" || tierKey === "gold" || tierKey === "prism" ? `<clipPath id="${u}c"><rect width="100" height="100"/></clipPath><g clip-path="url(#${u}c)"><rect class="tr-shine" x="-30" y="0" width="16" height="100" fill="#fff" opacity=".3" transform="skewX(-20)"/></g>` : "";
  return `<svg class="tr-svg t-${tierKey}" viewBox="0 0 100 100" aria-hidden="true"><defs>${grad}</defs><g class="tr-body">${S[kind] || S.eye}</g>${base}${shine}</svg>`;
}
