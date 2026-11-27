// Pythagorean numerology. Master numbers 11, 22 and 33 are kept; karmic debt 13/14/16/19 is noted.
export const MASTER = new Set([11, 22, 33]);
export const KARMIC = new Set([13, 14, 16, 19]);
const VAL = Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c, i) => [c, (i % 9) + 1]));

const digits = (n) => String(n).split("").reduce((a, d) => a + +d, 0);
/** Reduce to one digit, keeping masters. Returns { value, chain } where chain lists every step (e.g. [29, 11]). */
export function reduce(n, keepMaster = true) {
  const chain = [n];
  while (n > 9 && !(keepMaster && MASTER.has(n))) { n = digits(n); chain.push(n); }
  return { value: n, chain };
}
const karmicIn = (chain) => chain.find((x) => KARMIC.has(x)) || null;

/** Latin letters only, accents stripped, upper case. */
export function letters(name) {
  return String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "SS").replace(/[ÆæŒœ]/g, (c) => ({ Æ: "AE", æ: "AE", Œ: "OE", œ: "OE" }[c])).toUpperCase();
}

/** Y is a vowel when it is not next to another vowel (Mary, Lynn, Bryan), a consonant otherwise (Yolanda, Maya). */
export function isVowelAt(word, i) {
  const c = word[i];
  if ("AEIOU".includes(c)) return true;
  if (c !== "Y") return false;
  const near = (j) => j >= 0 && j < word.length && "AEIOU".includes(word[j]);
  return !near(i - 1) && !near(i + 1);
}

/** Sum a name. which: "all" | "vowels" | "consonants". Each name part is reduced first, then the total. */
export function nameNumber(name, which = "all") {
  const parts = letters(name).split(/[^A-Z]+/).filter(Boolean);
  if (!parts.length) throw new Error("I need a name written with letters.");
  const partVals = parts.map((w) => {
    let sum = 0;
    for (let i = 0; i < w.length; i++) {
      const v = isVowelAt(w, i);
      if (which === "all" || (which === "vowels" && v) || (which === "consonants" && !v)) sum += VAL[w[i]];
    }
    return { word: w, sum, ...reduce(sum) };
  });
  const total = partVals.reduce((a, p) => a + p.value, 0);
  const r = reduce(total);
  return { value: r.value, parts: partVals, total, chain: r.chain, karmic: karmicIn(partVals.length === 1 ? partVals[0].chain : r.chain) };
}

export function lifePath({ year, month, day }) {
  const m = reduce(month), d = reduce(day), y = reduce(year);
  const total = m.value + d.value + y.value, r = reduce(total);
  return { value: r.value, parts: { month: m.value, day: d.value, year: y.value }, total, chain: r.chain, karmic: karmicIn([...d.chain, ...r.chain]) };
}

export const birthday = ({ day }) => ({ value: day, reduced: reduce(day).value });

export function personalYear({ month, day }, year) {
  const r = reduce(reduce(month).value + reduce(day).value + reduce(year).value, false);
  return { value: r.value, year };
}
export const personalMonth = (py, month) => reduce(py + month, false).value;

/** Letter values for the card: [{ ch, v, vowel }] per word. */
export function letterTable(name) {
  return letters(name).split(/[^A-Z]+/).filter(Boolean).map((w) => [...w].map((ch, i) => ({ ch, v: VAL[ch], vowel: isVowelAt(w, i) })));
}

/** Four pinnacles and challenges, with the age each pinnacle starts. */
export function pinnacles(b, lp) {
  const m = reduce(b.month).value, d = reduce(b.day).value, y = reduce(b.year).value;
  const lpSingle = reduce(lp, false).value;
  const firstEnd = 36 - lpSingle;
  const P = [reduce(m + d).value, reduce(d + y).value];
  P.push(reduce(P[0] + P[1]).value, reduce(m + y).value);
  const m1 = reduce(b.month, false).value, d1 = reduce(b.day, false).value, y1 = reduce(b.year, false).value;
  const C = [Math.abs(m1 - d1), Math.abs(d1 - y1)];
  C.push(Math.abs(C[0] - C[1]), Math.abs(m1 - y1));
  const starts = [0, firstEnd + 1, firstEnd + 10, firstEnd + 19];
  return P.map((p, i) => ({ n: i + 1, pinnacle: p, challenge: C[i], from: starts[i], to: i < 3 ? starts[i + 1] - 1 : null }));
}

/** Full numerology profile. birth: { year, month, day }, today: Date. */
export function numerology(name, birth, today = new Date()) {
  const nameless = !/\p{L}/u.test(String(name || "")); // no birth name: the date numbers still stand, the name numbers are left out
  const lp = lifePath(birth), ex = nameless ? null : nameNumber(name, "all"), su = nameless ? null : nameNumber(name, "vowels"), pe = nameless ? null : nameNumber(name, "consonants");
  const nowY = today.getUTCFullYear();
  // The personal year runs birthday to birthday in some schools, calendar year in most; we use the calendar year.
  const py = personalYear(birth, nowY), pm = personalMonth(py.value, today.getUTCMonth() + 1);
  const maturity = nameless ? { value: null } : reduce(reduce(lp.value, true).value + ex.value);
  const age = nowY - birth.year - ((today.getUTCMonth() + 1 < birth.month || (today.getUTCMonth() + 1 === birth.month && today.getUTCDate() < birth.day)) ? 1 : 0);
  const pins = pinnacles(birth, lp.value), current = pins.find((p) => p.to == null || age <= p.to);
  return { name, nameless, birth, lifePath: lp, expression: ex, soulUrge: su, personality: pe, birthday: birthday(birth), personalYear: py, personalMonth: pm, maturity: maturity.value, pinnacles: pins, current, age, letters: nameless ? [] : letterTable(name) };
}
