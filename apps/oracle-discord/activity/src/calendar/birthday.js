// Your birthday in every calendar: the Maya day, the Egyptian civil date and the Celtic season of a birth date,
// plus the next 260-day sacred birthday and the next wandering Egyptian birthday. Pure maths, tested in tests/calendar.test.js.
import * as E from "./engine.js";

/** Common translations of the 20 day signs (glyph names as used in Yucatec Maya; meanings vary by source). */
export const SIGN_MEANING = ["water lily, the earth crocodile", "wind and breath", "night and darkness", "ripe maize and seed", "the snake", "death and rebirth", "the deer", "Venus, the star", "water and jade", "the dog",
  "the monkey, the craftsman", "the road and tooth", "the reed, the maize stalk", "the jaguar", "the eagle", "the vulture, wax and bees", "the earth", "flint, the blade", "the storm", "the lord, the Sun"];

/** The Celtic quarter a day falls in: the last fire festival on or before it (by the fixed dates). */
export function celticSeason(j) {
  const { year, month, day } = E.dateOf(j), md = month * 100 + day;
  const fs = [...E.FESTIVALS].sort((a, b) => a.month - b.month);
  const before = [...fs].reverse().find((f) => f.month * 100 + f.day <= md) || fs[fs.length - 1];
  const next = fs[(fs.indexOf(before) + 1) % fs.length];
  const half = before.id === "samhain" || before.id === "imbolc" ? "the dark half of the year" : "the light half of the year";
  return { after: before, next, half, onDay: before.month === month && before.day === day, year };
}

/** Everything the birthday page shows. birth and today are JDNs. */
export function birthdayOf(birth, today) {
  const m = E.maya(birth), e = E.egyptCivil(birth), k = celticSeason(birth), lived = today - birth;
  const tzNext = E.mod(birth - today, 260), egyNext = E.mod(e.doy - E.egyptCivil(today).doy, 365);
  return {
    maya: { tz: m.tz, tone: m.tone, sign: m.sign, meaning: SIGN_MEANING[m.sign], haab: m.haabName, lc: m.lc },
    egypt: { name: e.name, short: e.short, season: e.season, god: e.month === 12 ? E.EPAGOMENAL_GODS[e.day - 1] : null },
    celtic: k, coptic: E.copticOf(birth).text,
    lived, rounds: lived >= 0 ? Math.floor(lived / 260) : 0,
    nextTz: { days: tzNext, jdn: today + tzNext }, nextEgy: { days: egyNext, jdn: today + egyNext },
  };
}
