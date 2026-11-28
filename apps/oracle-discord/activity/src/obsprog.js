// Observatory progression (House 3, Keeper Altair): the House rank, the Harmony of the Spheres (the House's Star Crown)
// and The Grand Orrery check. Pure logic, computed from progress the games already keep, so nothing new is stored
// except which Harmony stages have been paid: prog.houses.observatory.harmony = [stage ids].
// hosts/ (Houses thread) shows the rank under the dome and the star in Altair's eyepiece; rooms may show both too.
import { room as watchRoom, logCount, plateCount } from "./watch/engine.js";
import { loggedCount } from "./messier/engine.js";
import { addTokens } from "./hosts/tokens.js";

/** The six Observatory games (Trophy Case ids). */
export const OBS_GAMES = ["stars", "calendar", "rummy", "comet", "eclipse", "navigator"];
export const RANKS = [{ at: 0, name: "Stargazer" }, { at: 40, name: "Observer" }, { at: 150, name: "Fellow" }, { at: 400, name: "Astronomer Royal" }];
const trophy = (p, id) => ((p.trophies || {})[id]) || { tier: 0, wins: {} };
const tier = (p, id) => trophy(p, id).tier || 0;

/** House XP: game wins (4 × level each, up to 5 a level), observations ×2, plates ×3, Desk jobs ×5, Messier objects ×2. */
export function houseXp(p) {
  let xp = 0;
  for (const id of OBS_GAMES) { const w = trophy(p, id).wins || {}; for (const L of [1, 2, 3]) xp += Math.min(w[L] || 0, 5) * 4 * L; }
  return xp + 2 * logCount(p) + 3 * plateCount(p) + 5 * (watchRoom(p).jobsDone || 0) + 2 * loggedCount(p);
}
/** { name, xp, next: { name, at } | null } */
export function houseRank(p) {
  const xp = houseXp(p), r = RANKS.reduce((a, t) => (xp >= t.at ? t : a), RANKS[0]);
  return { name: r.name, xp, next: RANKS.find((t) => t.at > xp) || null };
}

/** Kepler's Harmonices Mundi (1619) gave his third law; the stages follow his three laws. */
export const HARMONY = [
  { id: "light", name: "First Light", need: "Log 10 observations in the Night Watch", fact: "A telescope's first night of use is called its first light." },
  { id: "ellipse", name: "The Ellipse", need: "Finish Level 3 in any 3 Observatory games", fact: "Kepler's first law (1609): planets move in ellipses with the Sun at one focus." },
  { id: "areas", name: "Equal Areas", need: "Log 55 Messier objects", fact: "Kepler's second law (1609): a planet sweeps out equal areas in equal times, so it moves faster near the Sun." },
  { id: "harmony", name: "Harmony", need: "Finish every Observatory game on every level", fact: "Kepler's third law (1619): the square of a planet's year is proportional to the cube of its distance from the Sun." },
];
export const HARMONY_SHARDS = 5;
const level3 = (p) => OBS_GAMES.filter((id) => tier(p, id) >= 3).length;
const done = { light: (p) => logCount(p) >= 10, ellipse: (p) => level3(p) >= 3, areas: (p) => loggedCount(p) >= 55, harmony: (p) => level3(p) === OBS_GAMES.length };
const paid = (p) => (((p.houses ||= {}).observatory ||= {}).harmony ||= []);
/** [{ id, name, need, fact, done, claimed }] */
export const harmony = (p) => HARMONY.map((s) => ({ ...s, done: done[s.id](p), claimed: paid(p).includes(s.id) }));
export const harmonyDone = (p) => HARMONY.every((s) => done[s.id](p));
/** Pay ☄️ HARMONY_SHARDS for each finished stage not yet paid. host = the Observatory host. Returns the stages just paid. */
export function claimHarmony(p, host) {
  const out = [];
  for (const s of harmony(p)) if (s.done && !s.claimed) { paid(p).push(s.id); if (host) addTokens(p, host, HARMONY_SHARDS); out.push(s); }
  return out;
}
/** The Grand Orrery trophy set: Gold (or better) on all six Observatory games. */
export const grandOrrery = (p) => OBS_GAMES.every((id) => tier(p, id) >= 3);

/** A small panel for any Observatory room: rank, progress to the next, and the four Harmony stages. */
export function progressHtml(p, esc) {
  const r = houseRank(p), h = harmony(p);
  return `<div class="op-panel"><div><b>🔭 ${esc(r.name)}</b> · ${r.xp} House XP${r.next ? ` · ${r.next.at - r.xp} to ${esc(r.next.name)}` : ""}</div>
    <div class="op-stages">${h.map((s) => `<span class="op-stage${s.done ? " on" : ""}" title="${esc(s.need)}. ${esc(s.fact)}">${s.done ? "✦" : "○"} ${esc(s.name)}</span>`).join("")}</div></div>`;
}
