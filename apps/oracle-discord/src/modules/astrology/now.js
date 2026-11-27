// The sky right now: current chart, Moon phase, retrogrades, sign changes ahead, and transits to a natal chart.
import { positions, norm, SIGNS } from "../../ephemeris.js";
import { castChart, NAMES, ASPECTS } from "./chart.js";
import { SIGN, capital } from "./text.js";

const CORE = { sun: "your identity", moon: "your emotional needs", mercury: "your mind", venus: "your affections", mars: "your drive",
  jupiter: "your growth", saturn: "your discipline", uranus: "your need for freedom", neptune: "your imagination", pluto: "your power",
  node: "your path", asc: "your outward style", mc: "your public direction" };

// What each moving planet brings when it touches a natal point.
const TRANSIT = {
  sun: "puts a spotlight on", moon: "stirs the feelings around", mercury: "brings news and conversations about",
  venus: "sweetens and softens", mars: "fires up", jupiter: "opens and expands", saturn: "tests and strengthens",
  uranus: "shakes loose and upgrades", neptune: "blurs and inspires", pluto: "slowly transforms",
};
const ASPECT_TONE = { conjunction: "Full intensity.", opposition: "Someone or something mirrors it back to you.", trine: "Easy flow.",
  square: "Pressure that asks for action.", sextile: "A small opening if you take it.", quincunx: "Needs a small adjustment." };
const LENGTH = { sun: "a few days", moon: "a few hours", mercury: "a few days", venus: "a few days", mars: "about a week",
  jupiter: "a few weeks", saturn: "about a month", uranus: "several months", neptune: "about a year", pluto: "a year or more" };

const PHASES = [
  ["🌑 New Moon", "Seed time. Tradition gives this phase to quiet intentions."],
  ["🌒 Waxing Crescent", "Momentum is building. Tradition gives this phase to first small steps."],
  ["🌓 First Quarter", "Decision point. Tradition reads this phase as the first obstacle met."],
  ["🌔 Waxing Gibbous", "The phase of refining and adjusting before the peak."],
  ["🌕 Full Moon", "Peak visibility. Results, emotions and truths come to light."],
  ["🌖 Waning Gibbous", "The phase of sharing what was learned."],
  ["🌗 Last Quarter", "The phase of clearing out what did not work."],
  ["🌘 Waning Crescent", "The phase of rest before the next cycle."],
];

export function moonPhase(sunLon, moonLon) {
  const e = norm(moonLon - sunLon);
  const [name, note] = PHASES[Math.floor(norm(e + 22.5) / 45) % 8];
  return { name, note, elongation: e, illumination: Math.round((1 - Math.cos(e * Math.PI / 180)) / 2 * 100) };
}

/** Next sign change for each body within `days` (hour steps; Moon always reported). */
export function ingresses(date, days = 14) {
  const out = [], start = positions(date);
  for (const k of ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]) {
    const s0 = Math.floor(start[k].lon / 30), step = k === "moon" ? 1 : 6, max = (k === "moon" ? 3 : days) * 24;
    for (let h = step; h <= max; h += step) {
      const p = positions(new Date(date.getTime() + h * 3600000))[k];
      const s = Math.floor(p.lon / 30);
      if (s !== s0) {
        let lo = h - step, hi = h; // refine to ~1 minute
        while (hi - lo > 1 / 60) { const m = (lo + hi) / 2; (Math.floor(positions(new Date(date.getTime() + m * 3600000))[k].lon / 30) === s0 ? (lo = m) : (hi = m)); }
        out.push({ key: k, sign: SIGNS[s], from: SIGNS[s0], at: new Date(date.getTime() + hi * 3600000), retro: p.speed < 0 });
        break;
      }
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Transits: moving planets (now) in aspect to natal points. Tight orbs only. */
export function transits(natal, now) {
  const W = { sun: 3, moon: 3, asc: 2.5, mc: 2, mercury: 2, venus: 2, mars: 2, jupiter: 1.5, saturn: 1.5, uranus: 1, neptune: 1, pluto: 1, node: 0.5 };
  const SLOW = { jupiter: 1.5, saturn: 1.5, uranus: 1.5, neptune: 1.5, pluto: 1.5 };
  const out = [];
  for (const t of now.points) {
    if (!TRANSIT[t.key]) continue;
    for (const n of natal.points) {
      let d = Math.abs(t.lon - n.lon); if (d > 180) d = 360 - d;
      for (const a of ASPECTS) {
        const orb = Math.abs(d - a.angle), max = t.key === "moon" ? 2 : SLOW[t.key] || 2;
        if (orb <= max) { out.push({ t: t.key, n: n.key, type: a.type, symbol: a.symbol, orb, score: (W[n.key] || 1) * (t.key === "moon" ? 0.6 : SLOW[t.key] ? 1.6 : 1) / (0.5 + orb) }); break; }
      }
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

export const transitLine = (x) =>
  `**${NAMES[x.t]} ${x.symbol} your ${NAMES[x.n]}** (${x.orb.toFixed(1)}°) ${capital(NAMES[x.t])} ${TRANSIT[x.t]} ${CORE[x.n]}. ${ASPECT_TONE[x.type]} Lasts ${LENGTH[x.t]}.`;

const SKY_ASPECT = { conjunction: "joins", opposition: "faces off with", trine: "harmonises with", square: "clashes with", sextile: "supports", quincunx: "grinds against" };
const SKY_CORE = { sun: "the spotlight", mercury: "communication", venus: "love and money", mars: "action and tempers",
  jupiter: "optimism", saturn: "rules and limits", uranus: "sudden change", neptune: "dreams and confusion", pluto: "power shifts" };
const SKY_TONE = { conjunction: "They merge into one loud theme.", opposition: "Read as push-and-pull, with the middle as the resolution.", trine: "An easy current to ride.",
  square: "Read as friction that turns useful when acted on.", sextile: "Read as an opening that rewards effort.", quincunx: "Small, awkward adjustments." };
const MOOD = { fire: "bold and restless", earth: "practical and steady", air: "talkative and social", water: "emotional and intuitive" };

/** Context for the current sky, as embed fields. */
export function skyContext(now, date) {
  const sun = now.get("sun"), moon = now.get("moon");
  const ph = moonPhase(sun.lon, moon.lon);
  const ts = (d) => `<t:${Math.floor(d.getTime() / 1000)}:f>`;
  const fields = [];
  fields.push({ name: `${ph.name} in ${moon.sign} · ${ph.illumination}% lit`,
    value: `${ph.note} The Moon in ${moon.sign} makes the collective mood ${MOOD[SIGN[moon.sign].el]}.` });
  fields.push({ name: `☉ Sun in ${sun.sign} season`, value: `The backdrop for everyone: ${SIGN[sun.sign].style}.` });
  const retro = now.points.filter((p) => p.retro && p.key !== "node");
  fields.push({ name: "℞ Retrogrades", value: retro.length
    ? retro.map((p) => `${NAMES[p.key]} in ${p.sign}`).join(" · ") + (retro.some((p) => ["mercury", "venus", "mars"].includes(p.key)) ? "\nA personal planet is retrograde: astrologers read that as a time of review and revision more than of launches." : "\nOnly slow planets are retrograde: background inner work, business as usual.")
    : "None. Astrologers read that as an unobstructed sky." });
  const big = now.aspects.filter((a) => !["asc", "mc", "node"].includes(a.a) && !["asc", "mc", "node"].includes(a.b) && a.a !== "moon" && a.b !== "moon" && a.orb < 2.5).slice(0, 4);
  if (big.length) fields.push({ name: "⚗️ Sky reactions", value: big.map((a) => `**${NAMES[a.a]} ${a.symbol} ${NAMES[a.b]}** (${a.orb.toFixed(1)}°) ${capital(SKY_CORE[a.a])} ${SKY_ASPECT[a.type]} ${SKY_CORE[a.b]}. ${SKY_TONE[a.type]}`).join("\n") });
  const ing = ingresses(date).slice(0, 4);
  if (ing.length) fields.push({ name: "🔜 Coming up", value: ing.map((x) => `${NAMES[x.key]} enters ${x.sign} ${ts(x.at)}`).join("\n") });
  return { fields, phase: ph };
}

/** Cast the sky for a moment (houses only when a place is given). */
export function castNow(date, where) {
  return castChart({ utc: date, lat: where ? where.lat : 0, lon: where ? where.lon : 0, houses: where ? "whole" : "none" });
}
