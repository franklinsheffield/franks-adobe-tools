// Star Party: pure logic (no DOM), shared by the room and the Activity Worker (/api/party/<kind>).
// Weekly Star Party: one target for everyone each ISO week; each member observes it once a day; the channel fills a goal.
// Meteor watch: real annual showers; near a peak the channel keeps one shared count of shower meteors, like the counts
// observers send to the International Meteor Organization (IMO). Out of season it is practice.
// Progress: prog.rooms.starparty = { plays, best: { level: score }, cleared: [levels], seen: { week: [days] }, paid: [weeks], meteors }.
import { MESSIER } from "../messier/engine.js";
import { sunRaDec, altAz, lst } from "../stars/tonight.js";
import { weekKey, SHOWERS, activeShower, nextShower, ACTIVE_DAYS } from "./shared.js";
export * from "./shared.js";

export const ROOM = "starparty";
export const room = (p) => {
  const r = ((p.rooms ||= {})[ROOM] ||= { plays: 0, best: {}, cleared: [], seen: {}, paid: [], meteors: 0 });
  r.best ||= {}; r.cleared ||= []; r.seen ||= {}; r.paid ||= []; r.meteors ||= 0; return r;
};
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h || 1; };
/** This week's target: a Messier object near opposition (high around midnight this week) and within 35° of the celestial
 * equator, so it is up at night from most of the world. Same for everyone. */
export function weeklyTarget(ms = Date.now()) {
  const d = new Date(ms), mon = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7), 12);
  const [sra] = sunRaDec(mon + 3 * 864e5), anti = (sra + 180) % 360, gap = (a) => Math.abs(((a - anti + 540) % 360) - 180);
  const pool = MESSIER.filter((o) => gap(o.ra) <= 30 && Math.abs(o.dec) <= 35 && o.mag <= 9);
  const list = pool.length ? pool : MESSIER.filter((o) => gap(o.ra) <= 60);
  return list[hash(weekKey(ms)) % list.length];
}
export const PARTY_GOAL = 30, PARTY_SHARDS = 2;
/** Is the target up (at least 15°) over a city at a time? Returns its altitude. */
export const targetAlt = (o, place, at) => altAz(o.ra, o.dec, place.lat, lst(at, place.lon))[1];
/** Note today's observation; once a day. Returns true if it counted. */
export function observeTarget(p, ms = Date.now()) {
  const r = room(p), wk = weekKey(ms), day = new Date(ms).toISOString().slice(0, 10), list = (r.seen[wk] ||= []);
  for (const k of Object.keys(r.seen)) if (k !== wk) delete r.seen[k];
  if (list.includes(day)) return false; list.push(day); return true;
}
export const observedToday = (p, ms = Date.now()) => (room(p).seen[weekKey(ms)] || []).includes(new Date(ms).toISOString().slice(0, 10));
/** The week's reward: ☄️ PARTY_SHARDS once, if you helped and the channel reached the goal. */
export function partyPayDue(p, total, ms = Date.now()) {
  const r = room(p), wk = weekKey(ms);
  if (total < PARTY_GOAL || !(r.seen[wk] || []).length || r.paid.includes(wk)) return false;
  r.paid.push(wk); r.paid = r.paid.slice(-12); return true;
}

// ---- the meteor watch game ----
/** Levels: how many meteors, how many are sporadic (not from the radiant), how long each streak shows (ms). */
export const LEVELS = [null, { n: 14, sporadic: 0.3, show: 1500, secs: 45 }, { n: 20, sporadic: 0.45, show: 1100, secs: 45 }, { n: 26, sporadic: 0.55, show: 800, secs: 45 }];
export const PASS = 0.7; // score 70% of the possible to clear a level
/** A watch: meteors on a 400×260 sky with the radiant at (rx, ry). Shower meteors point straight away from the radiant;
 * sporadics fly in random directions that do not trace back to it. Each: { t (ms), x1, y1, x2, y2, shower }. */
export function makeWatch(level, seed) {
  const L = LEVELS[level], r = rng(seed * 2654435761), rx = 70 + r() * 260, ry = 40 + r() * 80, out = [];
  for (let i = 0; i < L.n; i++) {
    const t = Math.round(((i + 0.3 + r() * 0.4) / L.n) * (L.secs - 3) * 1000), shower = r() >= L.sporadic, len = 40 + r() * 50;
    let x1, y1, ang;
    for (let k = 0; k < 30; k++) {
      x1 = 30 + r() * 340; y1 = 25 + r() * 200;
      const away = Math.atan2(y1 - ry, x1 - rx), dist = Math.hypot(x1 - rx, y1 - ry);
      if (dist < 40) continue;
      if (shower) { ang = away; break; }
      ang = away + (r() < 0.5 ? 1 : -1) * (0.9 + r() * 1.6); // at least ~50° off the radiant line
      break;
    }
    out.push({ t, x1: +x1.toFixed(1), y1: +y1.toFixed(1), x2: +(x1 + Math.cos(ang) * len).toFixed(1), y2: +(y1 + Math.sin(ang) * len).toFixed(1), shower });
  }
  return { level, rx: +rx.toFixed(1), ry: +ry.toFixed(1), meteors: out, secs: L.secs, show: L.show };
}
/** Does a streak trace back to the radiant? (its backward line passes within `tol` of it) */
export function tracesBack(m, rx, ry, tol = 14) {
  const dx = m.x2 - m.x1, dy = m.y2 - m.y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = rx - m.x1, py = ry - m.y1;
  const along = px * ux + py * uy; if (along > 0) return false; // the radiant must be behind the streak
  return Math.abs(px * uy - py * ux) <= tol;
}
/** Score a watch: +1 per shower meteor tapped, −1 per sporadic tapped. taps = indices. Returns { score, max, hits, wrong, won }. */
export function scoreWatch(w, taps) {
  const set = new Set(taps), hits = w.meteors.filter((m, i) => m.shower && set.has(i)).length, wrong = w.meteors.filter((m, i) => !m.shower && set.has(i)).length;
  const max = w.meteors.filter((m) => m.shower).length, score = Math.max(0, hits - wrong);
  return { score, max, hits, wrong, won: score >= Math.ceil(max * PASS), perfect: hits === max && !wrong };
}
export const isOpen = (p, level) => level === 1 || room(p).cleared.includes(level - 1);
export function settleWatch(p, level, res) {
  const r = room(p), first = res.won && !r.cleared.includes(level); if (first) r.cleared.push(level);
  r.best[level] = Math.max(r.best[level] || 0, res.score); r.plays += 1; r.meteors += res.hits; return { first };
}

