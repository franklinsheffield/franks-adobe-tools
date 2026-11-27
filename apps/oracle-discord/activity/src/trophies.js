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
];
for (const t of TROPHIES) if (!t.how) {
  const n = t.need, w = n === 1 ? "Win" : `Win ${n} rounds`;
  t.how = [`${w} at Level 1`, `${w} at Level 2`, `${w} at Level 3`, "A perfect round at every level"];
}
export const SETS = [
  { id: "story", name: "Story set", ids: ["seance", "decoder", "alchemy", "timeline"], bonus: 100 },
  { id: "cards", name: "Card set", ids: ["duel", "rummy", "memory"], bonus: 100 },
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
    mortar: `<path class="tr-pestle" d="M58 44 L74 14" stroke="${mid}" stroke-width="7" stroke-linecap="round"/><path d="M24 46 L76 46 Q74 74 50 76 Q26 74 24 46Z" ${F}/><rect x="22" y="42" width="56" height="6" rx="3" ${F}/><path d="M36 42 Q40 36 44 42 M48 42 Q52 34 56 42" fill="#7ad16a"/>`,
  };
  const base = plinth ? `<rect x="28" y="84" width="44" height="8" rx="2" fill="#2a1d0c" stroke="#E2B04A" stroke-width=".8"/><rect x="34" y="78" width="32" height="7" rx="1.5" ${F}/>` : "";
  const shine = tierKey === "silver" || tierKey === "gold" || tierKey === "prism" ? `<clipPath id="${u}c"><rect width="100" height="100"/></clipPath><g clip-path="url(#${u}c)"><rect class="tr-shine" x="-30" y="0" width="16" height="100" fill="#fff" opacity=".3" transform="skewX(-20)"/></g>` : "";
  return `<svg class="tr-svg t-${tierKey}" viewBox="0 0 100 100" aria-hidden="true"><defs>${grad}</defs><g class="tr-body">${S[kind] || S.eye}</g>${base}${shine}</svg>`;
}
