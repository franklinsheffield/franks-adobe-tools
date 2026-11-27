// Star Party shared logic with no heavy imports, so the Activity Worker can use it (/api/party/<kind>):
// ISO weeks, the real meteor showers, and the shared counts kept in KV.
const DAY = 864e5;

// ---- weeks ----
/** ISO week key "2026-W48" (weeks start Monday, UTC). */
export function weekKey(ms = Date.now()) {
  const d = new Date(ms), day = (d.getUTCDay() + 6) % 7, thu = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3));
  const y = thu.getUTCFullYear(), w1 = new Date(Date.UTC(y, 0, 4)), wk = 1 + Math.round(((thu - w1) / DAY - 3 + ((w1.getUTCDay() + 6) % 7)) / 7);
  return `${y}-W${String(wk).padStart(2, "0")}`;
}
// ---- meteor showers (IMO working list; peaks are approximate and shift by about a day from year to year) ----
export const SHOWERS = [
  { id: "qua", name: "Quadrantids", m: 1, d: 3, zhr: 80, ra: 230, dec: 49, parent: "asteroid 2003 EH1", note: "The Quadrantids are named after Quadrans Muralis, a constellation that no longer exists. Their peak lasts only a few hours." },
  { id: "lyr", name: "Lyrids", m: 4, d: 22, zhr: 18, ra: 271, dec: 34, parent: "comet C/1861 G1 Thatcher", note: "The Lyrids are the oldest recorded shower: Chinese astronomers noted them in 687 BC." },
  { id: "eta", name: "Eta Aquariids", m: 5, d: 6, zhr: 50, ra: 338, dec: -1, parent: "Halley's Comet", note: "The Eta Aquariids are dust from Halley's Comet, best seen from the Southern Hemisphere before dawn." },
  { id: "per", name: "Perseids", m: 8, d: 12, zhr: 100, ra: 48, dec: 58, parent: "comet 109P/Swift-Tuttle", note: "The Perseids hit the air at about 59 km per second. Swift-Tuttle, their parent, is 26 km across." },
  { id: "ori", name: "Orionids", m: 10, d: 21, zhr: 20, ra: 95, dec: 16, parent: "Halley's Comet", note: "The Orionids are Halley's dust too: Earth crosses its orbit twice a year, in May and October." },
  { id: "leo", name: "Leonids", m: 11, d: 17, zhr: 15, ra: 152, dec: 22, parent: "comet 55P/Tempel-Tuttle", note: "On 13 November 1833 the Leonids stormed: tens of thousands an hour over North America. It started the science of meteors." },
  { id: "gem", name: "Geminids", m: 12, d: 14, zhr: 150, ra: 112, dec: 33, parent: "asteroid 3200 Phaethon", note: "The Geminids come from an asteroid, 3200 Phaethon, not a comet. They are the richest shower of the year." },
  { id: "urs", name: "Ursids", m: 12, d: 22, zhr: 10, ra: 217, dec: 76, parent: "comet 8P/Tuttle", note: "The Ursids radiate from near the Little Dipper's bowl, close to the north celestial pole." },
];
export const ACTIVE_DAYS = 3;
const peakOf = (s, year) => Date.UTC(year, s.m - 1, s.d);
/** The shower within ACTIVE_DAYS of its peak now, or null: { ...shower, key: "per-2026", peak }. */
export function activeShower(ms = Date.now()) {
  const y = new Date(ms).getUTCFullYear();
  for (const yr of [y - 1, y, y + 1]) for (const s of SHOWERS) { const pk = peakOf(s, yr); if (Math.abs(ms - pk) <= ACTIVE_DAYS * DAY) return { ...s, key: `${s.id}-${yr}`, peak: pk }; }
  return null;
}
/** The next shower peak after now: { ...shower, peak }. */
export function nextShower(ms = Date.now()) {
  const y = new Date(ms).getUTCFullYear(); let best = null;
  for (const yr of [y, y + 1]) for (const s of SHOWERS) { const pk = peakOf(s, yr); if (pk > ms && (!best || pk < best.peak)) best = { ...s, peak: pk }; }
  return best;
}

// ---- the shared counts (Worker side; pure so tests can check them) ----
/** kind "star": this week's Star Party; kind "meteor": the active shower. Returns the KV key or null if not open now. */
export function partyKey(kind, ms = Date.now()) {
  if (kind === "star") return `party:star:${weekKey(ms)}`;
  if (kind === "meteor") { const s = activeShower(ms); return s ? `party:meteor:${s.key}` : null; }
  return null;
}
export const CAPS = { star: 1, meteor: 60 }; // per post: one observation a day; up to 60 meteors from one watch
export const PER_MEMBER = { star: 7, meteor: 600 };
export const PARTY_MAX = 3000;
/** Add a member's contribution to a doc { total, e: { id: { n, c, d } } }. Star posts count once per member per UTC day. */
export function addToParty(doc, kind, me, add, ms = Date.now()) {
  doc = doc || { total: 0, e: {} }; doc.e ||= {};
  const n = Math.max(0, Math.min(CAPS[kind] || 0, Math.floor(Number(add) || 0))), day = new Date(ms).toISOString().slice(0, 10);
  if (!n) return doc;
  const row = doc.e[me.id] || (Object.keys(doc.e).length < PARTY_MAX ? { n: String(me.name || "traveller").slice(0, 32), c: 0, d: "" } : null);
  if (!row) return doc;
  if (kind === "star" && row.d === day) return doc;
  const room = Math.max(0, (PER_MEMBER[kind] || 0) - row.c), k = Math.min(n, room);
  if (!k) return doc;
  row.c += k; row.d = day; doc.e[me.id] = row; doc.total = (doc.total || 0) + k; return doc;
}
export function partyView(doc, meId, key) {
  const all = Object.entries((doc && doc.e) || {}).map(([id, x]) => ({ id, ...x })).sort((a, b) => b.c - a.c);
  return { key, total: (doc && doc.total) || 0, count: all.length, top: all.slice(0, 8).map((x) => ({ name: x.n, count: x.c, me: x.id === meId })), you: ((doc && doc.e) || {})[meId]?.c || 0 };
}
