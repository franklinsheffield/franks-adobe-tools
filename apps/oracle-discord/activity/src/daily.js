// Daily challenges, shared by every Chamber room: one seed per game per UTC day (everyone gets the same deal),
// a streak kept in prog.daily[game], and a shared leaderboard on the Activity Worker (GET/POST /api/daily/<game>).
// Only the first finished run of the day counts, like a daily puzzle. Rooms use it like this:
//   const seed = dailySeed("duel");               // feed it to the room's seedable rng
//   const st = dailyState(prog, "duel");          // { played, today, streak, best }
//   const res = finishDaily(prog, "duel", { score, won, detail }); // { first, streak, best }; then saveProgress()
//   if (res.first) postDaily(state, "duel", { score, won, detail });
//   const board = await boardOf(state, "duel");   // { day, top: [{ name, score, won, detail, me }], me } or null offline
import { api } from "./discord.js";

/** The UTC day, "YYYY-MM-DD". */
export const todayKey = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
export const yesterdayOf = (day) => todayKey(Date.parse(day + "T00:00:00Z") - 864e5);
/** Days since 2026-01-01, for "Daily Lab #330" style labels. */
export const dayNumber = (day = todayKey()) => Math.round((Date.parse(day + "T00:00:00Z") - Date.parse("2026-01-01T00:00:00Z")) / 864e5) + 1;
/** A 32-bit seed from the game id and the day (FNV-1a). The same for every player on the same day. */
export function dailySeed(game, day = todayKey()) {
  let h = 0x811c9dc5; const s = game + ":" + day;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h || 1;
}
const rec = (p, game) => ((p.daily ||= {})[game] ||= { last: "", streak: 0, best: 0, played: 0, today: null });
/** Where the player stands today. A streak counts while the last daily was today or yesterday. */
export function dailyState(p, game, day = todayKey()) {
  const r = rec(p, game), played = !!(r.today && r.today.day === day);
  const streak = r.last === day || r.last === yesterdayOf(day) ? r.streak : 0;
  return { played, today: played ? r.today : null, streak, best: r.best, total: r.played };
}
/** Record a finished daily run. Only the first run of the day counts: later runs return { first: false }. */
export function finishDaily(p, game, { score = 0, won = false, detail = "" } = {}, day = todayKey()) {
  const r = rec(p, game);
  if (r.today && r.today.day === day) return { first: false, streak: r.streak, best: r.best };
  r.streak = r.last === yesterdayOf(day) ? r.streak + 1 : 1; r.last = day; r.played++;
  r.best = Math.max(r.best, r.streak);
  r.today = { day, score: Math.round(score), won: !!won, detail: String(detail).slice(0, 80) };
  return { first: true, streak: r.streak, best: r.best };
}
const authed = (state) => state && state.token;
/** Send today's first result to the shared board. Quietly does nothing when signed out or offline. */
export async function postDaily(state, game, { score = 0, won = false, detail = "" } = {}, fetchImpl = fetch) {
  if (!authed(state)) return null;
  try {
    const r = await fetchImpl(api("/api/daily/" + game), { method: "POST", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify({ day: todayKey(), score: Math.round(score), won: !!won, detail: String(detail).slice(0, 80) }) });
    return r.ok ? r.json() : null;
  } catch { return null; }
}
/** Today's top 10 and your own place. null when signed out or offline (show the local result instead). */
export async function boardOf(state, game, fetchImpl = fetch) {
  if (!authed(state)) return null;
  try {
    const r = await fetchImpl(api("/api/daily/" + game + "?day=" + todayKey()), { headers: { authorization: "Bearer " + state.token } });
    return r.ok ? r.json() : null;
  } catch { return null; }
}
/** A small leaderboard table. esc is the Chamber's HTML escaper. */
export function boardHtml(board, esc, { unit = "pts", local = null } = {}) {
  if (!board || !board.top) return local ? `<div class="note">Your score today: <b>${esc(String(local.score))} ${esc(unit)}</b>. Sign in through Discord to see the shared board.</div>` : `<div class="note">The shared board shows when you play inside Discord.</div>`;
  if (!board.top.length) return `<div class="note">No one has finished today's challenge yet. Be the first.</div>`;
  const rows = board.top.map((e, i) => `<li${e.me ? ' class="me"' : ""}><b>${i + 1}.</b> ${esc(e.name)} · ${esc(String(e.score))} ${esc(unit)}${e.won ? " ✓" : ""}${e.detail ? ` <span class="note">· ${esc(e.detail)}</span>` : ""}</li>`).join("");
  const me = board.me && board.me.rank > board.top.length ? `<div class="note">You: #${board.me.rank} of ${board.count} · ${esc(String(board.me.score))} ${esc(unit)}</div>` : "";
  return `<ol class="daily-board">${rows}</ol>${me}<div class="note">${board.count} player${board.count === 1 ? "" : "s"} today. First run of the day counts.</div>`;
}
