// The Chamber's light game layer: a Codex of everything a member has drawn, a daily streak with moon tokens,
// seeker ranks from points, and cosmetic unlocks (table cloths, crystal-ball colours). Cosmetic only: readings are
// never gated. Progress lives in localStorage and, when signed in to Discord, on the Chamber Worker (KV), so it
// follows the member between devices.

/** What each system adds to the Codex: total possible entries, a name for them, and the entries in a reading. */
export const CODEX = {
  iching: { total: 64, label: "hexagrams", items: (r) => { const m = /I Ching · (\d+)/.exec(r.embeds[0].title || ""); return m ? ["Hexagram " + m[1]] : []; } },
  tarot: { total: 78, label: "cards", items: (r) => (r.reading?.cards || []).map((x) => x.name) },
  lenormand: { total: 36, label: "cards", items: (r) => (r.reading?.cards || []).map((x) => x.name) },
  magicdeck: { total: 44, label: "cards", items: (r) => (r.reading?.cards || []).map((x) => x.name) },
  runes: { total: 24, label: "runes", items: (r) => (r.reading?.runes || []).map((x) => x.name) },
  oraclebones: { total: 60, label: "cycle days", items: (r) => (r.reading?.day ? [r.reading.day] : []) },
  ifa: { total: 256, label: "Odù", items: (r) => (r.reading?.odu ? [r.reading.odu] : []) },
  astrology: { total: 12, label: "Sun signs", items: (r) => { for (const f of r.embeds[0].fields || []) { const m = /Sun in (\w+)/.exec(f.name); if (m) return ["Sun in " + m[1]]; } return []; } },
  humandesign: { total: 5, label: "types", items: (r) => { const t = (r.embeds[0].title || "").split(" · ")[1]; return t ? [t.trim()] : []; } },
  numerology: { total: 12, label: "life paths", items: (r) => (r.reading?.lifePath ? ["Life Path " + r.reading.lifePath.value] : []) },
  chinesezodiac: { total: 12, label: "animals", items: (r) => { const a = (r.headline || "").split(" · ")[0].split(" ").pop(); return a ? [a] : []; } },
  mayan: { total: 20, label: "day signs", items: (r) => (r.reading?.signName ? [r.reading.signName] : []) },
  egyptian: { total: 12, label: "gods", items: (r) => (r.reading?.god ? [r.reading.god] : []) },
  celtic: { total: 13, label: "trees", items: (r) => (r.reading?.tree ? [r.reading.tree] : []) },
};

export const RANKS = [
  { name: "Seeker", at: 0 }, { name: "Initiate", at: 60 }, { name: "Adept", at: 200 }, { name: "Magus", at: 500 }, { name: "Oracle-touched", at: 1200 },
];
export const rankOf = (xp) => RANKS.reduce((a, r) => (xp >= r.at ? r : a), RANKS[0]);
export const nextRank = (xp) => RANKS.find((r) => r.at > xp) || null;

const sysCount = (p) => Object.keys(p.systems).length;
const codexCount = (p) => Object.values(p.codex).reduce((n, a) => n + a.length, 0);

/** Cosmetics and how they're earned. kind "cloth" recolours the table; kind "orb" recolours the crystal ball. */
export const UNLOCKS = [
  { id: "velvet", kind: "cloth", name: "Violet velvet", how: "Yours from the start", ok: () => true, c: ["#5a2a8a", "#36185e", "#170a2e"] },
  { id: "starchart", kind: "cloth", name: "Star chart", how: "Try 3 different systems", ok: (p) => sysCount(p) >= 3, c: ["#1d3a6e", "#122450", "#060d24"] },
  { id: "goldleaf", kind: "cloth", name: "Gold leaf", how: "Keep a 7-day streak", ok: (p) => p.best >= 7, c: ["#8a6420", "#5a3e10", "#24180a"] },
  { id: "moonlit", kind: "cloth", name: "Moonlit silver", how: "Collect 15 moon tokens", ok: (p) => p.tokens >= 15, c: ["#56607a", "#343a4e", "#12141e"] },
  { id: "obsidian", kind: "cloth", name: "Obsidian", how: "Read with all 11 systems", ok: (p) => sysCount(p) >= 11, c: ["#2a2a2e", "#151518", "#050506"] },
  { id: "amethyst", kind: "orb", name: "Amethyst", how: "Yours from the start", ok: () => true, f: "none" },
  { id: "teal", kind: "orb", name: "Teal tide", how: "Do 5 readings", ok: (p) => p.readings >= 5, f: "hue-rotate(-115deg) saturate(1.2)" },
  { id: "rose", kind: "orb", name: "Rose quartz", how: "Fill 25 Codex entries", ok: (p) => codexCount(p) >= 25, f: "hue-rotate(40deg) saturate(1.3) brightness(1.1)" },
  { id: "sunfire", kind: "orb", name: "Sunfire", how: "Reach the rank of Adept", ok: (p) => p.xp >= 200, f: "hue-rotate(120deg) saturate(1.6) brightness(1.15)" },
];

export const fresh = () => ({ v: 1, xp: 0, readings: 0, tokens: 0, streak: 0, best: 0, last: "", systems: {}, codex: {}, unlocked: ["velvet", "amethyst"], cloth: "velvet", orb: "amethyst",
  essence: 0, owned: ["midnight", "classic", "goldflame", "classic-voice"], outfit: "midnight", avatar: "classic", flame: "goldflame", voice: "classic-voice", vibe: "chamber", day: null, heard: [], seen: {} });

const today = (d = new Date()) => d.toLocaleDateString("en-CA");
const yesterday = (d = new Date()) => today(new Date(d.getTime() - 86400000));

const BIRTH = { astrology: "astrology", humandesign: "Human Design", numerology: "numerology", chinesezodiac: "Chinese zodiac", mayan: "Maya calendar", egyptian: "Egyptian", celtic: "Celtic tree" };
const andList = (a) => (a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const times = (n) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);

/**
 * What the member's own Codex adds to a reading: a comparison, not a tally. Returning entries and what they are read
 * as, how this reading's themes sit beside the entries the member has drawn most, and beside their birth charts.
 * themeOf(systemKey, entryName) gives an entry's keywords (see codexthemes.js). Call BEFORE record().
 * Returns plain sentences: the comparison first, then what it may mean. Never advice, and no Codex statistics.
 */
export function codexNotes(p, key, r, themeOf = () => []) {
  const def = CODEX[key]; if (!def || !p) return [];
  const items = [...new Set(def.items(r).filter(Boolean))]; if (!items.length) return [];
  const kw = (k, name) => themeOf(k, name) || [], named = (k, name) => (kw(k, name).length ? `${name} (${kw(k, name).join(", ")})` : name);
  const low = (a) => a.map((x) => String(x).toLowerCase());
  const nowKw = [...new Set(items.flatMap((i) => kw(key, i)))], nowSet = new Set(low(nowKw));
  const charts = Object.keys(BIRTH).filter((k) => k !== key && ((p.codex || {})[k] || []).length === 1).map((k) => ({ k, name: p.codex[k][0], kw: kw(k, p.codex[k][0]) }));
  const chartList = andList(charts.map((c) => `${named(c.k, c.name)} in ${BIRTH[c.k] === "astrology" ? "astrology" : "the " + BIRTH[c.k] + " reading"}`));
  const out = [];
  if (BIRTH[key]) {
    if (!charts.length) return [];
    const shared = [...new Set(charts.flatMap((c) => low(c.kw)).filter((w) => nowSet.has(w)))];
    out.push(`Set beside your other charts: this one gives ${named(key, items[0])}, and your Codex holds ${chartList}.`);
    out.push(shared.length
      ? `The theme of ${andList(shared)} turns up in more than one of them. When systems built on different rules land on the same theme, that may be the part of the description that says most about you.`
      : `No theme repeats word for word across them. They may be read as different angles on one person: each system measures something else, so a description that only one of them gives may be the narrower claim.`);
    out.push("What the comparison leaves open: which of these descriptions would the people who know you best pick first?");
    return out;
  }
  const have = new Set((p.codex || {})[key] || []), seen = ((p.seen || {})[key]) || {}, n = (p.systems || {})[key] || 0;
  const old = items.filter((i) => have.has(i)), fresh = items.filter((i) => !have.has(i));
  if (n) {
    old.slice(0, 3).forEach((i, j) => {
      const c = seen[i] || 1, th = kw(key, i).join(", ");
      out.push(`${i} is back: it came up ${times(c)} before in your readings${th ? `, and it is read as ${th}` : ""}. ${j ? "The same may hold here: a theme that keeps its place across different questions." : `A symbol that returns across separate questions may point to a theme that is still open for you${th ? `, here ${kw(key, i)[0]}` : ""}. Random draws repeat too, so the return only carries weight if the theme rings true.`}`);
    });
    const past = Object.entries(seen).filter(([name]) => !items.includes(name)).sort((a, b) => b[1] - a[1]).slice(0, 2), often = past.length && past[0][1] >= 2;
    if (past.length && nowKw.length) {
      const shared = [...new Set(past.flatMap(([x]) => low(kw(key, x))).filter((w) => nowSet.has(w)))];
      out.push(`Your earlier readings here ${often ? "turned most often to" : "also brought up"} ${andList(past.map(([x]) => named(key, x)))}. This one speaks of ${andList(nowKw.slice(0, 6))}. ${shared.length
        ? `The theme of ${andList(shared)} is in both, so this reading may be continuing a story the earlier ones began.`
        : "If those feel connected to you, this reading may be continuing the same story. If they do not, it may mark a change of subject in what you bring to the table."}`);
    }
    if (fresh.length) out.push(old.length
      ? `${andList(fresh.map((x) => named(key, x)))} ${fresh.length > 1 ? "have" : "has"} not appeared for you before. Next to ${old[0]}, which returns, that may be read as a familiar theme meeting something not yet considered.`
      : `Nothing here repeats an earlier draw. ${andList(fresh.map((x) => named(key, x)))} ${fresh.length > 1 ? "are" : "is"} new ground for you, which may mean the question has moved somewhere your earlier readings have not been.`);
  }
  if (charts.length && nowKw.length) {
    const shared = [...new Set(charts.flatMap((c) => low(c.kw)).filter((w) => nowSet.has(w)))];
    out.push(`Your charts describe you through ${chartList}. ${shared.length
      ? `This reading shares the theme of ${andList(shared)} with them, which may be read as the reading speaking in character for you.`
      : `Where this reading's themes (${andList(nowKw.slice(0, 5))}) match that picture, it may be read as in character for you; where they differ, it may be pointing at something less habitual.`}`);
  }
  return out;
}

/** Record a reading. Returns what happened, for the Oracle to announce. */
export function record(p, key, r, now = new Date()) {
  const out = { xp: 10, newItems: [], firstSystem: false, firstToday: false, streak: p.streak, unlocked: [], rankUp: null };
  const before = rankOf(p.xp).name;
  p.readings++;
  if (!p.systems[key]) { out.firstSystem = true; out.xp += 15; }
  p.systems[key] = (p.systems[key] || 0) + 1;
  const def = CODEX[key], have = new Set(p.codex[key] || []);
  const seen = ((p.seen ||= {})[key] ||= {});
  if (def) for (const it of def.items(r)) { if (!it) continue; seen[it] = (seen[it] || 0) + 1; if (!have.has(it)) { have.add(it); out.newItems.push(it); out.xp += 5; } }
  p.codex[key] = [...have];
  const t = today(now);
  if (p.last !== t) {
    out.firstToday = true; out.xp += 10; p.tokens++;
    p.streak = p.last === yesterday(now) ? p.streak + 1 : 1; p.best = Math.max(p.best, p.streak); p.last = t;
  }
  out.streak = p.streak;
  p.xp += out.xp;
  for (const u of UNLOCKS) if (!p.unlocked.includes(u.id) && u.ok(p)) { p.unlocked.push(u.id); out.unlocked.push(u); }
  const after = rankOf(p.xp).name;
  if (after !== before) out.rankUp = after;
  out.essence = out.xp + (out.rankUp ? 25 : 0); p.essence = (p.essence || 0) + out.essence;
  return out;
}

/** A streak that has lapsed (no reading yesterday or today) shows as 0. */
export const liveStreak = (p, now = new Date()) => (p.last === today(now) || p.last === yesterday(now) ? p.streak : 0);

/** Keep the better of two saved copies (most readings, counting room plays, wins; cosmetics chosen are kept from the newer). */
export function merge(a, b) {
  if (!a) return b; if (!b) return a;
  return activity(b) > activity(a) ? b : a;
}
/** Readings plus plays in the Chamber's rooms (Séance and friends), so room progress isn't lost to a merge. */
export const activity = (p) => (p.readings || 0) + Object.values(p.rooms || {}).reduce((n, r) => n + ((r && r.plays) || 0), 0);

// ---- storage ----
const lk = (id) => "oracle-progress:" + id;
export function loadLocal(id) { try { const j = JSON.parse(localStorage.getItem(lk(id)) || "null"); return j && j.v === 1 ? { ...fresh(), ...j } : null; } catch { return null; } }
export function saveLocal(id, p) { try { localStorage.setItem(lk(id), JSON.stringify(p)); } catch {} }
