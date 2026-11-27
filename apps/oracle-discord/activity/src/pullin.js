// The pull-in batch of the overhaul: the daily gift (a 7-day ladder), server-wide weekend events, the profile card
// and invite a friend. Rules and markup only; main.js wires them. Everyone sees the same weekend event because it is
// worked out from the date alone. Rewards are Essence (💎) and ✦ only.
import { rankOf } from "./game.js";
import { points, caseLevel } from "./trophies.js";

// ---- the daily gift ----
/** Day 1..7 of the ladder. Coming back on consecutive days climbs it; a missed day starts again at day 1. */
export const LADDER = [10, 15, 20, 30, 40, 60, 150];
const dk = (at) => { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const prevDay = (at) => { const d = new Date(at); d.setDate(d.getDate() - 1); return dk(d.getTime()); };
/** Where the member stands today: { ready, step (0-6, the gift on offer or just taken), streakKept }. */
export function giftState(p, at = Date.now()) {
  const g = p.gift || { last: "", step: -1 }, today = dk(at);
  if (g.last === today) return { ready: false, step: g.step, kept: true };
  const kept = g.last === prevDay(at);
  return { ready: true, step: kept ? (g.step + 1) % LADDER.length : 0, kept };
}
/** Take today's gift. Returns { amount, step, doubled } or null when already taken. */
export function claimGift(p, at = Date.now()) {
  const s = giftState(p, at); if (!s.ready) return null;
  const ev = eventNow(at), doubled = !!(ev && ev.gift2), amount = LADDER[s.step] * (doubled ? 2 : 1);
  p.gift = { last: dk(at), step: s.step }; p.essence = (p.essence || 0) + amount;
  return { amount, step: s.step, doubled };
}
export function giftHtml(p, esc, at = Date.now()) {
  const s = giftState(p, at), ev = eventNow(at);
  return `<div class="gift-in" role="dialog" aria-label="Your daily gift"><p class="gift-eye">${s.kept && s.step ? `Day ${s.step + 1} in a row` : "Welcome in"}</p><h2>🎁 Your daily gift</h2>
<div class="gift-ladder">${LADDER.map((n, i) => `<div class="gl${i < s.step ? " took" : ""}${i === s.step ? " now" : ""}${i === LADDER.length - 1 ? " big" : ""}" style="--i:${i}"><small>Day ${i + 1}</small><span class="gl-box" aria-hidden="true">${i < s.step ? "✓" : i === LADDER.length - 1 ? "👑" : "🎁"}</span><b>💎 ${n * (ev && ev.gift2 ? 2 : 1)}</b></div>`).join("")}</div>
<p class="gift-note">${ev && ev.gift2 ? `${ev.e} ${esc(ev.name)}: gifts are doubled this weekend. ` : ""}Come back tomorrow for day ${((s.step + 1) % LADDER.length) + 1}. Miss a day and the ladder starts again.</p>
<button class="c main" type="button" id="gift-take">✦ Open today's gift</button></div>`;
}

// ---- server-wide weekend events: Friday to Sunday, a different one each week, the same for everyone ----
export const EVENTS = [
  { id: "gilded", e: "💎", name: "Gilded Weekend", blurb: "Daily gifts are doubled", gift2: true },
  { id: "scholar", e: "📚", name: "Scholar's Weekend", blurb: "Every game pays 50% more ✦ experience", xp: 1.5 },
  { id: "treasure", e: "🪙", name: "Treasure Weekend", blurb: "Every game pays 50% more 💎 Essence", essence: 1.5 },
  { id: "spirits", e: "👻", name: "Weekend of Spirits", blurb: "The Séance and the ghostly games pay double Essence", essence: 2, rooms: ["seance", "memory", "decoder"] },
];
const WEEK0 = Date.UTC(1970, 0, 5);
/** The event running at a time (local Friday, Saturday or Sunday), or null on weekdays. */
export function eventNow(at = Date.now()) {
  const d = new Date(at), wd = d.getDay(); if (!(wd === 5 || wd === 6 || wd === 0)) return null;
  const mon = new Date(d); mon.setDate(d.getDate() - ((wd + 6) % 7)); mon.setHours(12, 0, 0, 0);
  const w = Math.floor((mon.getTime() - WEEK0) / (7 * 864e5));
  return EVENTS[((w % EVENTS.length) + EVENTS.length) % EVENTS.length];
}
/** The next event and when it starts (a local Friday), for the weekday banner. */
export function nextEvent(at = Date.now()) {
  const d = new Date(at); for (let i = 1; i <= 7; i++) { const n = new Date(d); n.setDate(d.getDate() + i); n.setHours(0, 0, 0, 0); if (n.getDay() === 5) return { ev: eventNow(n.getTime() + 36e5), at: n.getTime() }; }
  return null;
}
/** Apply the weekend bonus to a game room's reward. */
export function boost(roomId, xp, es, at = Date.now()) {
  const ev = eventNow(at); if (!ev) return { xp, es };
  const fits = !ev.rooms || ev.rooms.includes(roomId);
  return { xp: Math.round(xp * (fits && ev.xp ? ev.xp : 1)), es: Math.round(es * (fits && ev.essence ? ev.essence : 1)) };
}
export function eventBanner(esc, at = Date.now()) {
  const ev = eventNow(at);
  if (ev) return `<div class="ev-banner on"><span class="ev-e" aria-hidden="true">${ev.e}</span><b>${esc(ev.name)}</b><span>${esc(ev.blurb)}. On for everyone until Sunday night.</span></div>`;
  const n = nextEvent(at); return n ? `<div class="ev-banner"><span class="ev-e" aria-hidden="true">${n.ev.e}</span><span>This weekend: <b>${esc(n.ev.name)}</b>. ${esc(n.ev.blurb)}.</span></div>` : "";
}

// ---- the profile card ----
/** The member's numbers, from their own progress only. */
export function profileOf(p, { name = "traveller", records = 0, systems = {} } = {}) {
  const codex = Object.values(p.codex || {}).reduce((a, x) => a + (x || []).length, 0);
  const fav = Object.entries(p.codex || {}).sort((a, b) => (b[1] || []).length - (a[1] || []).length)[0];
  return { name, rank: rankOf(p.xp || 0).name, xp: p.xp || 0, readings: p.readings || 0, best: p.best || 0, streak: p.streak || 0, trophies: points(p), hall: caseLevel(p).name,
    codex, records, secrets: (p.gs || []).length, fav: fav && fav[1] && fav[1].length ? (systems[fav[0]] || fav[0]) : "", owned: (p.owned || []).length };
}
export function profileHtml(x, esc, art = "") {
  const stat = (e, n, l) => `<div class="pf-st"><span aria-hidden="true">${e}</span><b>${n}</b><small>${l}</small></div>`;
  return `<div class="pf-card" id="pf-card"><div class="pf-top"><div class="pf-art" aria-hidden="true">${art}</div><div><p class="pf-eye">Science is Magic · Oracle Chamber</p><h2>${esc(x.name)}</h2><p class="pf-rank">🏅 ${esc(x.rank)} · ${x.xp} ✦</p>${x.fav ? `<p class="pf-fav">Most read: ${esc(x.fav)}</p>` : ""}</div></div>
<div class="pf-grid">${stat("🔮", x.readings, "readings")}${stat("🔥", x.best, "best streak")}${stat("🏆", x.trophies, `trophy points · ${esc(x.hall)}`)}${stat("📖", x.codex, "Codex pages")}${stat("🎵", x.records, "records")}${stat("🗝️", `${x.secrets}/7`, "secrets")}</div></div>`;
}
export const profileLines = (x) => [`🏅 ${x.rank} · ${x.xp} ✦`, `🔮 ${x.readings} readings · 🔥 best streak ${x.best} days`, `🏆 ${x.trophies} trophy points (${x.hall})`, `📖 ${x.codex} Codex pages · 🎵 ${x.records} records · 🗝️ ${x.secrets}/7 secrets`, ...(x.fav ? [`Most read: ${x.fav}`] : [])];

// ---- invite a friend ----
export const INVITE_REWARD = 25;
/** Pay the invite reward the first time only. Returns the Essence paid (0 after the first). */
export function inviteSent(p) { if (p.invited) return 0; p.invited = true; p.essence = (p.essence || 0) + INVITE_REWARD; return INVITE_REWARD; }
