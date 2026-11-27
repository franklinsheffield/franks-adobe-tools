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

// How each birth system is named when the Oracle speaks of it: "Because your Chinese zodiac is Horse…".
const YOURS = {
  astrology: (x) => `your Sun is in ${x.replace(/^Sun in /, "")}`, humandesign: (x) => `your Human Design type is ${x}`, numerology: (x) => `your Life Path is ${x.replace(/^Life Path /, "")}`,
  chinesezodiac: (x) => `your Chinese zodiac is ${x}`, mayan: (x) => `your Maya day sign is ${x}`, egyptian: (x) => `your Egyptian sign is ${x}`, celtic: (x) => `your Celtic tree is ${x}`,
};
const SUGGEST = [
  (a, x) => `you may consider how ${x} looks from the side of you that tradition sums up as ${a}: whether it comes easily or takes effort.`,
  (a, x) => `you may consider whether ${x} is the part of this reading that a nature summed up as ${a} would be quickest to pass over.`,
  (a, x) => `you may consider ${x} as the less familiar ground here, and ${a} as what you bring to it.`,
  (a, x) => `you may consider where ${a} and ${x} have already met in your life, and what came of it.`,
];

/**
 * Personal examinations for "Go deeper": the member's own data (birth charts and earlier draws, both kept in the
 * Codex) cross-compared with the active reading. One sentence each, in the form
 * "Because your Chinese zodiac is Horse (…), and this reading turns on The Moon (…), you may consider …".
 * The Codex is never named and no tallies are given. themeOf(systemKey, entryName) gives an entry's keywords
 * (see codexthemes.js). Call BEFORE record(). At most six, most specific first.
 */
export function codexNotes(p, key, r, themeOf = () => []) {
  const def = CODEX[key]; if (!def || !p) return [];
  const items = [...new Set(def.items(r).filter(Boolean))].filter((i) => (themeOf(key, i) || []).length); if (!items.length) return [];
  const kw = (k, name) => themeOf(k, name) || [], named = (k, name) => `${name} (${kw(k, name).join(", ")})`, low = (a) => a.map((x) => String(x).toLowerCase());
  const chart = !!BIRTH[key], turnsOn = (i) => (chart ? `this chart gives ${named(key, i)}` : `this reading turns on ${named(key, i)}`);
  const out = []; let t = 0;
  const cross = (because, mine, i) => {
    const shared = low(mine).filter((w) => low(kw(key, i)).includes(w));
    out.push(`Because ${because}, and ${turnsOn(i)}, ${shared.length
      ? `both point to ${andList(shared)}, so you may consider ${shared[0]} the thread worth following here.`
      : SUGGEST[t % SUGGEST.length](andList(mine.slice(0, 2)), kw(key, i)[chart ? t++ % kw(key, i).length : (t++, 0)])}`);
  };
  const have = new Set((p.codex || {})[key] || []), seen = ((p.seen || {})[key]) || {}, n = (p.systems || {})[key] || 0;
  const old = chart ? [] : items.filter((i) => have.has(i)), fresh = chart || !n ? [] : items.filter((i) => !have.has(i));
  for (const i of old.slice(0, 2)) out.push(`Because ${i} has come to you ${times(seen[i] || 1)} before (${kw(key, i).join(", ")}), you may consider that ${kw(key, i)[0]} is still an open question for you, and what has changed since it last appeared.`);
  const charts = Object.keys(BIRTH).filter((k) => k !== key && ((p.codex || {})[k] || []).length === 1 && kw(k, p.codex[k][0]).length);
  charts.slice(0, 4).forEach((k, j) => { const x = p.codex[k][0]; cross(`${YOURS[k](x)} (${kw(k, x).join(", ")})`, kw(k, x), items[j % items.length]); });
  if (!chart) {
    const top = Object.entries(seen).filter(([name, c]) => !items.includes(name) && c >= 2 && kw(key, name).length).sort((a, b) => b[1] - a[1])[0];
    if (top) out.push(`Because ${top[0]} is what your readings have turned to most (${kw(key, top[0]).join(", ")}), and ${turnsOn(items[0])}, you may consider whether the subject has changed, or whether this is the same story seen from another side.`);
    if (fresh.length) out.push(`Because ${fresh[0]} has never come up for you before, you may consider its themes (${kw(key, fresh[0]).join(", ")}) as the new information in this reading, set against what is familiar.`);
  }
  return out.slice(0, 6);
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
