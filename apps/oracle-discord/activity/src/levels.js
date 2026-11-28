// Server level and the House pick ladder (plan locked by Frank 2026-11-28 01:25Z; L6-10 pacing 01:52Z; role sheet 01:59Z).
// Pure data + functions, shared by the Activity (main.js) and the Worker (/api/level). Nothing here is timed: levels come
// from total ✦ (p.xp) and grants only, never the calendar.
//   L1 home House · L2 second House (class) · L3 third House (subclass) · L4 the Common Grounds (no pick; the fourth door
//   "mysteriously" stays shut) · L5 fourth House (Order) · L6 fifth, Capstone House + Path Rite · L7-10 trust roles.
//   Hidden: the ½ (any time after L3) and L11 (L10 + Fregoli's Mask + the Last Trick). Frank alone is L12, a gag.
// The House gate is OFF until Frank switches it on (Worker env HOUSE_GATE="on"); with it off every House stays open.

export const HOUSE_IDS = ["oracle", "alchemist", "observatory", "parlour", "scriptorium"]; // canonical order (keys below use it)

export const LEVELS = [
  { n: 1, at: 0, name: "Neophyte" },
  { n: 2, at: 80, name: "Acolyte" },
  { n: 3, at: 800, name: "Adept" },
  { n: 4, at: 2400, name: "Groundsworn" },
  { n: 5, at: 4800, name: "Journeyman" },
  { n: 6, at: 8300, name: "Path-Sealed" },
  { n: 7, at: 11500, name: "Guide" },
  { n: 8, at: 15300, name: "Curator" },
  { n: 9, at: 19700, name: "Councillor" },
  { n: 10, at: 24900, name: "Magister" },
];
export const IMPOSSIBLE = { n: 12, name: "The Impossible", color: "#F2B63C" }; // Frank only (01:47Z)
/** House picks a member is owed at each level (level 4 adds none: the Common Grounds opens instead). */
const PICKS = [0, 1, 2, 3, 3, 4, 5];
export const picksFor = (n) => PICKS[Math.max(0, Math.min(6, n))];

const key = (ids) => HOUSE_IDS.filter((h) => ids.includes(h)).join("+");
/** Level 2: the two-House hybrid class (10, one per pair). Colours approved 01:59Z. */
export const CLASSES = {
  "oracle+alchemist": { id: "hermeticist", name: "Hermeticist", color: "#F47584" },
  "oracle+observatory": { id: "astrologer-astronomer", name: "Astrologer-Astronomer", color: "#B58CFF" },
  "oracle+parlour": { id: "mentalist", name: "Mentalist", color: "#E17AD9" },
  "oracle+scriptorium": { id: "sibyllist", name: "Sibyllist", color: "#F44C77" },
  "alchemist+observatory": { id: "astrochemist", name: "Astrochemist", color: "#7FD6C2" },
  "alchemist+parlour": { id: "showman-chemist", name: "Showman Chemist", color: "#FFB347" },
  "alchemist+scriptorium": { id: "cipher-alchemist", name: "Cipher Alchemist", color: "#D9663F" },
  "observatory+parlour": { id: "sky-skeptic", name: "Sky Skeptic", color: "#A9C4FF" },
  "observatory+scriptorium": { id: "almanac-maker", name: "Almanac Maker", color: "#C9D96A" },
  "parlour+scriptorium": { id: "document-examiner", name: "Document Examiner", color: "#E0A3A0" },
};
/** Level 3: the three-House subclass (10, one per set). */
export const SUBCLASSES = {
  "oracle+alchemist+observatory": { id: "renaissance-magus", name: "Renaissance Magus" },
  "oracle+alchemist+parlour": { id: "cagliostros-circle", name: "Cagliostro's Circle" },
  "oracle+alchemist+scriptorium": { id: "translator-of-hermes", name: "Translator of Hermes" },
  "oracle+observatory+parlour": { id: "nostradamus-reader", name: "Nostradamus Reader" },
  "oracle+observatory+scriptorium": { id: "babylonian-diarist", name: "Babylonian Diarist" },
  "oracle+parlour+scriptorium": { id: "psychical-researcher", name: "Psychical Researcher" },
  "alchemist+observatory+parlour": { id: "christmas-lecturer", name: "Christmas Lecturer" },
  "alchemist+observatory+scriptorium": { id: "royal-society-fellow", name: "Royal Society Fellow" },
  "alchemist+parlour+scriptorium": { id: "ink-chemist", name: "Ink Chemist" },
  "observatory+parlour+scriptorium": { id: "hoax-hunter", name: "Hoax Hunter" },
};
/** Level 5: the Order, named for the one House still unopened (it becomes the Capstone House). */
export const ORDERS = {
  oracle: { id: "natural-philosophers", name: "Natural Philosophers" },
  alchemist: { id: "cold-furnace", name: "Order of the Cold Furnace" },
  observatory: { id: "lamp", name: "Order of the Lamp" },
  parlour: { id: "unbroken-veil", name: "Order of the Unbroken Veil" },
  scriptorium: { id: "open-road", name: "Order of the Open Road" },
};
/** Home House roles (shown, House colour) and the quiet "Key" role for each other House opened. */
export const HOUSE_ROLES = {
  oracle: { name: "🔮 The Oracle Chamber", key: "Key: Oracle", color: "#FF4FB3" },
  alchemist: { name: "⚗️ The Alchemist's House", key: "Key: Alchemist", color: "#E89A55" },
  observatory: { name: "🔭 The Observatory", key: "Key: Observatory", color: "#8FB8FF" },
  parlour: { name: "🕯️ The Séance Parlour", key: "Key: Parlour", color: "#C3A6FF" },
  scriptorium: { name: "🪶 The Scriptorium", key: "Key: Scriptorium", color: "#E8483B" },
};

export const xpLevel = (xp = 0) => LEVELS.reduce((a, l) => ((xp || 0) >= l.at ? l : a), LEVELS[0]).n;
/** The member's Server level: earned ✦, or a grant (Founding 4, dev.n 6, Frank 12), whichever is higher. */
export function levelOf(p = {}) {
  const g = Number(p.grant) || 0;
  return g >= 12 ? 12 : Math.max(xpLevel(p.xp), Math.min(10, g));
}
export const levelName = (n) => (n >= 12 ? IMPOSSIBLE.name : (LEVELS.find((l) => l.n === n) || LEVELS[0]).name);
/** Progress to the next level: { n, name, next: { n, name, at } | null, toNext } (null next at 10 and above). */
export function levelInfo(p = {}) {
  const n = levelOf(p), next = n < 10 ? LEVELS.find((l) => l.n === n + 1) : null;
  return { n, name: levelName(n), next, toNext: next ? Math.max(0, next.at - (p.xp || 0)) : 0, half: !!p.half };
}
/** "4", "6.5", "12": the ½ is a hidden role, so the number only shows it to the member themselves. */
export const levelLabel = (p = {}) => `${levelOf(p)}${p.half ? ".5" : ""}`;

export const pathOf = (p = {}) => (Array.isArray(p.path) ? p.path.filter((h, i, a) => HOUSE_IDS.includes(h) && a.indexOf(h) === i).slice(0, 5) : []);
export const homeOf = (p = {}) => pathOf(p)[0] || null;
export const picksOwed = (p = {}) => Math.max(0, picksFor(levelOf(p)) - pathOf(p).length);
/** Houses a member may pick next (none when no pick is owed). */
export const choosable = (p = {}) => (picksOwed(p) ? HOUSE_IDS.filter((h) => !pathOf(p).includes(h)) : []);

/** Pick a House (permanent: no switching, Frank 00:52Z). When only one House is left it opens by itself.
 *  Returns the Houses added, in order ([] when the pick isn't allowed). */
export function pickHouse(p, id) {
  if (!p || !choosable(p).includes(id)) return [];
  p.path = [...pathOf(p), id]; const added = [id];
  if (p.path.length === 4 && picksOwed(p)) { const last = HOUSE_IDS.find((h) => !p.path.includes(h)); p.path.push(last); added.push(last); }
  if (p.path.length === 1) p.home = id;
  return added;
}

export const classOf = (path) => (path.length >= 2 ? CLASSES[key(path.slice(0, 2))] : null);
export const subclassOf = (path) => (path.length >= 3 ? SUBCLASSES[key(path.slice(0, 3))] : null);
export const orderOf = (path) => (path.length >= 4 ? ORDERS[path[4] || HOUSE_IDS.find((h) => !path.includes(h))] : null);
export const capstoneOf = (path) => (path.length >= 4 ? path[4] || HOUSE_IDS.find((h) => !path.includes(h)) : null);
/** "Astrochemist of the Order of the Lamp" once the path is sealed (level 6, five Houses). */
export function pathTitle(p = {}) {
  const path = pathOf(p), c = classOf(path), o = orderOf(path);
  return path.length === 5 && levelOf(p) >= 6 && c && o ? `${c.name} of the ${o.name}` : null;
}
/** One line for the stats bar and My card: "Lv 4 Groundsworn · Astrochemist · Royal Society Fellow". */
export function pathLabel(p = {}) {
  const path = pathOf(p), c = classOf(path), s = subclassOf(path), t = pathTitle(p);
  return [`Lv ${levelLabel(p)} ${levelName(levelOf(p))}`, t || (c && c.name), !t && s && s.name].filter(Boolean).join(" · ");
}

/** Houses this member may enter. Founding Members keep every House (they were all open before the switch). */
export const openHouses = (p = {}) => (p.founding ? [...HOUSE_IDS] : pathOf(p));
/** With the gate off, every House is open to everyone (today's behaviour). */
export const canEnter = (p, houseId, gateOn) => !gateOn || openHouses(p).includes(houseId);
/** The Five Doors show at first launch (gate on, no home yet) and whenever a level-up owes a pick. */
export const needsDoors = (p, gateOn) => !!gateOn && pathOf(p).length === 0;

/** What opens a locked House for this member: the level of their next pick, or "pick it now". */
export function unlockHint(p, houseId) {
  if (pathOf(p).includes(houseId)) return { open: true };
  if (choosable(p).includes(houseId)) return { open: false, now: true };
  const n = levelOf(p), path = pathOf(p), nextLv = [1, 2, 3, 5, 6].find((lv) => lv > n && picksFor(lv) > path.length) || null;
  const lv = nextLv && LEVELS.find((l) => l.n === nextLv);
  return { open: false, now: false, level: nextLv, name: lv ? lv.name : null, toNext: lv ? Math.max(0, lv.at - (p.xp || 0)) : 0 };
}

// ---- Founding migration (server pitch, Frank 01:47Z) ----
/** The level a member is granted at the switch: Founding 4, or their Scholar's Path points at 1 pt = 25 ✦ if higher
 *  (capped at level 5); named grants (dev.n 6, Frank 12) win. Members who joined after the switch get no grant. */
export function grantFor({ userId, joinedAt, switchAt, scholarPoints = 0, grants = {} } = {}) {
  const named = Number((grants || {})[userId]) || 0;
  const founding = !!(switchAt && joinedAt && Date.parse(joinedAt) < Date.parse(switchAt));
  let grant = named;
  if (founding) grant = Math.max(grant, 4, Math.min(5, xpLevel((Number(scholarPoints) || 0) * 25)));
  return { grant, founding: founding || named > 0 };
}

// ---- Discord roles (the game is the source of truth; the bot re-syncs on each launch) ----
/** Every role the bot manages: { key, name, color|null, hoist? }. Used by scripts/house-roles.js to create them once. */
export function roleSpecs() {
  const hex = (c) => (c ? parseInt(c.slice(1), 16) : 0);
  return [
    ...HOUSE_IDS.map((h) => ({ key: "home:" + h, name: HOUSE_ROLES[h].name, color: hex(HOUSE_ROLES[h].color), hoist: true })),
    ...HOUSE_IDS.map((h) => ({ key: "open:" + h, name: HOUSE_ROLES[h].key, color: 0 })),
    ...Object.values(CLASSES).map((c) => ({ key: "class:" + c.id, name: c.name, color: hex(c.color) })),
    ...Object.values(SUBCLASSES).map((c) => ({ key: "sub:" + c.id, name: c.name, color: 0 })),
    ...Object.values(ORDERS).map((o) => ({ key: "order:" + o.id, name: o.name, color: 0 })),
    ...LEVELS.map((l) => ({ key: "lv:" + l.n, name: `Lv ${l.n} ${l.name}`, color: 0 })),
    { key: "lv:12", name: `Lv 12 ${IMPOSSIBLE.name}`, color: hex(IMPOSSIBLE.color) },
    { key: "founding", name: "Founding Member", color: 0 },
  ];
}
/** The role keys this member should hold right now. */
export function rolesWanted(p = {}) {
  const path = pathOf(p), n = levelOf(p), out = [];
  if (path[0]) out.push("home:" + path[0]);
  path.slice(1).forEach((h) => out.push("open:" + h));
  const c = classOf(path), s = subclassOf(path), o = n >= 5 ? orderOf(path) : null;
  if (c) out.push("class:" + c.id); if (s) out.push("sub:" + s.id); if (o) out.push("order:" + o.id);
  out.push("lv:" + n); if (p.founding) out.push("founding");
  return out;
}
/** Diff the member's Discord roles against what the game says. Only roles in `ids` ({ key: roleId }) are touched,
 *  so staff and every other role are left alone. Returns { add: [roleId], remove: [roleId] }. */
export function rolesDiff(memberRoles = [], wantKeys = [], ids = {}) {
  const managed = new Set(Object.values(ids || {}).map(String)), have = new Set((memberRoles || []).map(String));
  const want = new Set(wantKeys.map((k) => ids[k]).filter(Boolean).map(String));
  return { add: [...want].filter((r) => !have.has(r)), remove: [...have].filter((r) => managed.has(r) && !want.has(r)) };
}
