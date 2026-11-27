// Chinese calendar maths from real astronomy (astronomy-engine): lunar new year, solar terms, four pillars.
// Calendar days are reckoned in China Standard Time (UTC+8), as the modern calendar is.
import * as A from "astronomy-engine";

export const STEMS = [
  { hz: "甲", py: "Jiǎ", el: "Wood", yin: false }, { hz: "乙", py: "Yǐ", el: "Wood", yin: true },
  { hz: "丙", py: "Bǐng", el: "Fire", yin: false }, { hz: "丁", py: "Dīng", el: "Fire", yin: true },
  { hz: "戊", py: "Wù", el: "Earth", yin: false }, { hz: "己", py: "Jǐ", el: "Earth", yin: true },
  { hz: "庚", py: "Gēng", el: "Metal", yin: false }, { hz: "辛", py: "Xīn", el: "Metal", yin: true },
  { hz: "壬", py: "Rén", el: "Water", yin: false }, { hz: "癸", py: "Guǐ", el: "Water", yin: true },
];
export const BRANCHES = [
  { hz: "子", py: "Zǐ", animal: "Rat", el: "Water", hours: "23–01" }, { hz: "丑", py: "Chǒu", animal: "Ox", el: "Earth", hours: "01–03" },
  { hz: "寅", py: "Yín", animal: "Tiger", el: "Wood", hours: "03–05" }, { hz: "卯", py: "Mǎo", animal: "Rabbit", el: "Wood", hours: "05–07" },
  { hz: "辰", py: "Chén", animal: "Dragon", el: "Earth", hours: "07–09" }, { hz: "巳", py: "Sì", animal: "Snake", el: "Fire", hours: "09–11" },
  { hz: "午", py: "Wǔ", animal: "Horse", el: "Fire", hours: "11–13" }, { hz: "未", py: "Wèi", animal: "Goat", el: "Earth", hours: "13–15" },
  { hz: "申", py: "Shēn", animal: "Monkey", el: "Metal", hours: "15–17" }, { hz: "酉", py: "Yǒu", animal: "Rooster", el: "Metal", hours: "17–19" },
  { hz: "戌", py: "Xū", animal: "Dog", el: "Earth", hours: "19–21" }, { hz: "亥", py: "Hài", animal: "Pig", el: "Water", hours: "21–23" },
];
// Hidden stems inside each branch (main qi first), used for the element balance.
export const HIDDEN = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];

const CST = 8 * 3600000;
const DAY = 86400000;
/** Calendar day number (days since 1970-01-01) of a UTC Date, in UTC+8. */
export const cstDay = (d) => Math.floor((d.getTime() + CST) / DAY);
const sunLon = (d) => A.SunPosition(A.MakeTime(d)).elon;

/** The instant the Sun reaches ecliptic longitude `lon`, searching forward from `from` (Date). */
export function solarTerm(lon, from) {
  const t = A.SearchSunLongitude(lon, A.MakeTime(from), 400);
  if (!t) throw new Error("solar term search failed");
  return t.date;
}
const newMoonAfter = (d) => A.SearchMoonPhase(0, A.MakeTime(d), 40).date;

/** New moons (as CST day numbers) of lunar months starting from the month containing `d`'s new moon on or before it. */
function newMoonOnOrBefore(dayNum) {
  let t = new Date(dayNum * DAY - CST + DAY - 1 - 32 * DAY);
  let nm = newMoonAfter(t), last = nm;
  while (cstDay(nm) <= dayNum) { last = nm; nm = newMoonAfter(new Date(nm.getTime() + DAY)); }
  return last;
}

const winterSolstice = (year) => solarTerm(270, new Date(Date.UTC(year, 11, 1)));

/** Lunar new year (Date at 00:00 CST, returned as a UTC Date) for Gregorian year `year`. */
const nyCache = new Map();
export function lunarNewYear(year) {
  if (nyCache.has(year)) return nyCache.get(year);
  // Month 11 always contains the winter solstice. Count lunations between two such months:
  // 13 means a leap month, which is the first month with no principal term (zhongqi).
  const m11a = newMoonOnOrBefore(cstDay(winterSolstice(year - 1)));
  const m11b = newMoonOnOrBefore(cstDay(winterSolstice(year)));
  const moons = [m11a]; let nm = m11a;
  while (cstDay(nm) < cstDay(m11b)) { nm = newMoonAfter(new Date(nm.getTime() + DAY)); moons.push(nm); }
  const leapYear = moons.length === 14; // 13 months from m11a to m11b
  let monthStarts = moons.slice(1); // month 12, month 1, ...
  if (leapYear) {
    // find the first month (from month 12 onward) with no principal term
    for (let i = 0; i < monthStarts.length - 1; i++) {
      const a = cstDay(monthStarts[i]), b = cstDay(monthStarts[i + 1]);
      if (!hasZhongqi(a, b)) { if (i <= 1) monthStarts = [...monthStarts.slice(0, i), ...monthStarts.slice(i + 1)]; break; }
    }
  }
  const ny = new Date(cstDay(monthStarts[1]) * DAY - CST);
  nyCache.set(year, ny);
  return ny;
}
// Does the lunar month [a, b) (CST day numbers) contain a principal term (Sun at a multiple of 30°)?
function hasZhongqi(a, b) {
  const l0 = sunLon(new Date(a * DAY - CST)), l1 = sunLon(new Date(b * DAY - CST));
  const k0 = Math.floor(l0 / 30), k1 = Math.floor((l1 < l0 ? l1 + 360 : l1) / 30);
  return k1 > k0;
}

const mod = (n, m) => ((n % m) + m) % m;
export const pillar = (i) => ({ index: mod(i, 60), stem: STEMS[mod(i, 10)], branch: BRANCHES[mod(i, 12)], s: mod(i, 10), b: mod(i, 12) });

/** Julian day number of a Gregorian calendar date. */
export function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/**
 * Four pillars. utc: birth instant; local: { year, month, day, hour, minute } wall clock at the birthplace; timeKnown.
 * Year and month pillars change at the solar terms (Lichun at 315°, then every 30°). The day changes at 23:00 local
 * (start of the Rat hour), the traditional convention.
 */
export function fourPillars(utc, local, timeKnown = true) {
  const sl = sunLon(utc);
  // Solar year: starts at Lichun (315°). Find the Lichun on or before the birth.
  let lichun = solarTerm(315, new Date(Date.UTC(local.year, 0, 15)));
  if (utc < lichun) lichun = solarTerm(315, new Date(Date.UTC(local.year - 1, 0, 15)));
  const solarYear = lichun.getUTCFullYear();
  const year = pillar(solarYear - 4);
  const monthIdx = Math.floor(mod(sl - 315, 360) / 30); // 0 = Tiger month
  const mStem = mod((year.s % 5) * 2 + 2 + monthIdx, 10), mBranch = mod(2 + monthIdx, 12);
  const monthP = { stem: STEMS[mStem], branch: BRANCHES[mBranch], s: mStem, b: mBranch };
  let dn = jdn(local.year, local.month, local.day);
  if (timeKnown && local.hour >= 23) dn += 1;
  const day = pillar(dn + 49);
  let hour = null;
  if (timeKnown) {
    const hb = Math.floor((local.hour + 1) / 2) % 12, hs = mod((day.s % 5) * 2 + hb, 10);
    hour = { stem: STEMS[hs], branch: BRANCHES[hb], s: hs, b: hb };
  }
  return { year, month: monthP, day, hour, solarYear, sunLon: sl };
}

/** Element balance over the visible stems and branch main qi (8 characters), plus hidden stems at half weight. */
export function elementBalance(p) {
  const out = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
  for (const x of [p.year, p.month, p.day, p.hour].filter(Boolean)) {
    out[x.stem.el] += 1;
    out[x.branch.el] += 1;
    for (const h of HIDDEN[x.b].slice(1)) out[STEMS[h].el] += 0.5;
  }
  return out;
}

/** Popular zodiac year: changes on the lunar new year's calendar date. local: { year, month, day } of birth. */
export function zodiacYear(local) {
  const ny = lunarNewYear(local.year);
  const birthDay = Math.floor(Date.UTC(local.year, local.month - 1, local.day) / DAY);
  const nyDay = cstDay(ny);
  const ly = birthDay >= nyDay ? local.year : local.year - 1;
  return { lunarYear: ly, newYear: ly === local.year ? ny : lunarNewYear(local.year - 1), nextNewYear: ly === local.year ? lunarNewYear(local.year + 1) : ny, ...pillar(ly - 4) };
}
export const ymd = (d) => new Date(d.getTime() + CST).toISOString().slice(0, 10);
