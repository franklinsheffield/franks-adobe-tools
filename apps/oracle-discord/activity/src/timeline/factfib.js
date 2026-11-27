// Fact or Fib: the History of Magic's party round (rules in ../party/vote.js). Each prompt is a real event from the
// timeline deck with its year hidden. Everyone writes a fake year, then everyone hunts for the real one. Answers are
// years only, so no free text ever reaches the room (nothing to filter on a public server).
// Only events whose year is known to within 3 years are used, so the truth is never in doubt.
import { EVENTS, eraOf } from "./events.js";
import "./events2.js"; // adds the expansion cards to EVENTS
import { yearText } from "./logic.js";

export const PROMPTS = 5, MAX_PM = 3, NOW = 2026, MIN_YEAR = -3000;
export const usable = () => EVENTS.filter((e) => e.pm <= MAX_PM && e.year <= NOW);

/** Read a typed year: "1848", "1848 CE", "300 BCE", "300 BC", "-300", "AD 79". Whole years from 3000 BCE to now. */
export function parseYear(text) {
  const s = String(text ?? "").trim().toUpperCase().replace(/(?<=[A-Z])\./g, "").replace(/,/g, "");
  const m = s.match(/^(AD\s*)?(-?)\s*(\d{1,4})\s*(BCE|BC|CE|AD)?$/); if (!m) return null;
  let y = +m[3]; if (m[2] === "-" || m[4] === "BCE" || m[4] === "BC") y = -y;
  if (y === 0 || y < MIN_YEAR || y > NOW) return null; // there is no year 0
  return y;
}

/** The helpers vote.js needs for one event. */
export function promptOf(e) {
  const near = (v) => Math.abs(v - e.year) <= e.pm + 2;
  return {
    id: e.id, ev: e, truth: e.year, truthText: e.when, ask: e.what, parse: parseYear, show: yearText, near,
    /** House fibs: other real years from the same era (they sound right) and nearby round-ish years. */
    house(rand = Math.random) {
      const E = eraOf(e.era), span = Math.max(30, Math.min(400, (E.to - E.from) / 6)), out = new Set();
      const same = EVENTS.filter((x) => x.era === e.era && x.id !== e.id && x.year <= NOW).map((x) => x.year);
      for (let k = 0; k < 6 && same.length; k++) out.add(same[Math.floor(rand() * same.length)]);
      for (let k = 0; k < 8; k++) { let y = Math.round(e.year + (rand() < 0.5 ? -1 : 1) * (6 + rand() * span)); if (rand() < 0.4) y = Math.round(y / 10) * 10 + (e.year % 10);
        if (y === 0) y = 1; out.add(Math.max(MIN_YEAR, Math.min(NOW, y))); }
      return [...out].filter((y) => y !== 0 && !near(y));
    },
  };
}
export const promptById = (id) => { const e = EVENTS.find((x) => x.id === id); return e ? promptOf(e) : null; };

/** Deal a match: PROMPTS events from at least 3 eras, favouring cards this player hasn't chronicled yet. */
export function dealFib(seen = {}, rand = Math.random, n = PROMPTS) {
  const pool = usable(), shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  for (let tries = 0; tries < 30; tries++) {
    const order = [...shuffle(pool.filter((e) => !seen[e.id])), ...shuffle(pool.filter((e) => seen[e.id]))], hand = [];
    for (const e of order) { if (hand.length >= n) break; if (hand.filter((h) => h.era === e.era).length < 2) hand.push(e); }
    if (hand.length === n && new Set(hand.map((h) => h.era)).size >= 3) return shuffle(hand).map(promptOf);
  }
  return shuffle(pool).slice(0, n).map(promptOf);
}

export { EMCEE, emcee } from "../party/emcee.js";
