// The evidence layer of a numerology reading: the arithmetic behind each number, the letter-value table of the name,
// which digits repeat or are missing, how common each result is, and what the pattern may mean.
// Privacy: unless the caller asks to show the name, no letters and no birth-date parts are printed.
import { N } from "./text.js";
import { insight, plural, list } from "../../insight.js";

const base = (n) => (n > 9 ? { 11: 2, 22: 4, 33: 6 }[n] : n);
const chain = (v) => (v.chain.length > 1 ? v.chain.join(" → ") : String(v.value));
const nm = (n) => N[n].name.replace(/^The /, "");

export function analyse(r, showName, who) {
  if (r.nameless) return dateOnly(r, showName, who);
  const flat = r.letters.flat(), vowels = flat.filter((l) => l.vowel).length;
  const freq = Array.from({ length: 9 }, (_, i) => flat.filter((l) => l.v === i + 1).length);
  const missing = freq.map((c, i) => (c ? 0 : i + 1)).filter(Boolean), top = Math.max(...freq), peak = freq.map((c, i) => (c === top ? i + 1 : 0)).filter(Boolean);
  const core = [["Life Path", r.lifePath], ["Expression", r.expression], ["Soul Urge", r.soulUrge], ["Personality", r.personality]];
  const vals = core.map(([, v]) => v.value), bases = vals.map(base);
  const dup = [...new Set(bases)].filter((b) => bases.filter((x) => x === b).length > 1);
  const masters = core.filter(([, v]) => N[v.value].master), karmic = core.filter(([, v]) => v.karmic);
  const odd = bases.filter((b) => b % 2).length;
  const sumOf = (v) => (showName ? `${v.parts.map((p) => `${p.word} ${p.sum}${p.chain.length > 1 ? `→${p.value}` : ""}`).join(" + ")} = ${v.total}` : `${plural(v.parts.length, "name")} summed to ${v.total}`);
  const lp = r.lifePath, cur = r.current;

  const data = [
    ["Life Path", showName ? `month ${lp.parts.month} + day ${lp.parts.day} + year ${lp.parts.year} = ${lp.total}${lp.chain.length > 1 ? ` → ${lp.chain.slice(1).join(" → ")}` : ""}` : `birth month, day and year each reduced, then added: ${chain(lp)}`],
    ["Expression (all letters)", `${sumOf(r.expression)}${r.expression.chain.length > 1 ? ` → ${r.expression.chain.slice(1).join(" → ")}` : ""}`],
    ["Soul Urge (vowels)", `${sumOf(r.soulUrge)}${r.soulUrge.chain.length > 1 ? ` → ${r.soulUrge.chain.slice(1).join(" → ")}` : ""}`],
    ["Personality (consonants)", `${sumOf(r.personality)}${r.personality.chain.length > 1 ? ` → ${r.personality.chain.slice(1).join(" → ")}` : ""}`],
    ["Letters", `${flat.length} in the name: ${plural(vowels, "vowel")}, ${plural(flat.length - vowels, "consonant")}`],
    ["Letter values", freq.map((c, i) => `${i + 1}×${c}`).join(" · ")],
    ["Timing", `age ${r.age} · Personal Year ${r.personalYear.value} (${r.personalYear.year}) · Personal Month ${r.personalMonth} · Pinnacle ${cur.n} of 4 (number ${cur.pinnacle}, challenge ${cur.challenge}) · Maturity ${r.maturity}`],
  ];

  const patterns = [
    dup.length ? `The same root appears more than once in the four core numbers: ${list(dup.map((b) => `${b} (${core.filter((_, i) => bases[i] === b).map(([k]) => k).join(", ")})`))}.` : `The four core numbers are all different (${vals.join(", ")}).`,
    `${odd} of the 4 core numbers are odd and ${4 - odd} even. Tradition groups odd numbers as initiating and even numbers as sustaining.`,
    missing.length ? `No letter in the name has the value ${list(missing.map(String))}. Tradition calls absent values "karmic lessons".` : "Every value from 1 to 9 appears in the name, which is uncommon in short names.",
    peak.length > 1 ? `Letter values ${list(peak.map(String))} tie for most frequent (${top} of ${flat.length} letters each), so no single "hidden passion" stands out.` : `The most frequent letter value is ${peak[0]} (${top} of ${flat.length} letters). Tradition calls this the "hidden passion".`,
    masters.length ? `Master number${masters.length > 1 ? "s" : ""}: ${list(masters.map(([k, v]) => `${k} ${v.value}`))}. These are sums that landed on 11, 22 or 33 and are left unreduced by convention.` : "",
    karmic.length ? `Karmic-debt sum${karmic.length > 1 ? "s" : ""} on the way down: ${list(karmic.map(([k, v]) => `${k} ${v.karmic}/${v.value}`))}.` : "",
    r.personalYear.value === base(lp.value) ? `The Personal Year (${r.personalYear.value}) matches the Life Path root this year.` : "",
    cur.to != null ? `Pinnacle ${cur.n} runs to age ${cur.to}; ${cur.to - r.age === 0 ? "it changes at the next birthday" : `${plural(cur.to - r.age + 1, "year")} remain`}.` : "The fourth pinnacle has no end date.",
  ];

  const conclusions = [
    `Life Path ${lp.value} is called ${N[lp.value].name} (${N[lp.value].kw.join(", ")}). In this system the birth date describes the kind of situations a life keeps returning to, so those themes may recur more than others.`,
    dup.length ? `A repeated root (${dup.join(", ")}) may mean one theme is reinforced from several directions: a clear strength, and possibly a blind spot where its opposite is concerned.` : "Four different core numbers may describe a personality with distinct modes: one for direction, one for work, one for private motives and one for first impressions.",
    base(r.soulUrge.value) === base(r.personality.value) ? "Soul Urge and Personality share a root, so what is wanted privately and what is shown outwardly may look much the same." : `Soul Urge ${r.soulUrge.value} (${nm(r.soulUrge.value)}: ${N[r.soulUrge.value].kw[0]}) differs from Personality ${r.personality.value} (${nm(r.personality.value)}: ${N[r.personality.value].kw[0]}). Tradition reads that gap as a difference between inner motive and outer manner.`,
    missing.length ? `With no ${list(missing.map(String))} in the name, tradition reads ${list(missing.map((m) => N[m].kw[0]))} as ${missing.length > 1 ? "qualities" : "a quality"} that may come less automatically and be learned by practice.` : "",
    peak.length > 1 ? "" : `A "hidden passion" of ${peak[0]} may point to ${N[peak[0]].kw[0]} as a habitual way of acting, whatever the core numbers say.`,
    masters.length ? "Master numbers are traditionally read as the same theme as their root at higher intensity, with more potential and more strain." : "",
    `Personal Year ${r.personalYear.value} places ${r.personalYear.year} at step ${r.personalYear.value} of a nine-year cycle. Tradition reads ${r.personalYear.value <= 3 ? "the early steps as starting and building momentum" : r.personalYear.value <= 6 ? "the middle steps as work, change and responsibility" : "the late steps as review, harvest and completion"}.`,
  ];

  const questions = [
    `Where does "${N[lp.value].kw[0]}" already show up as a recurring situation, and where does it not fit at all?`,
    base(r.soulUrge.value) === base(r.personality.value) ? "Is the match between inner motive and outer manner comfortable, or does it leave something unsaid?" : `Do other people see the ${nm(r.personality.value)} more than the ${nm(r.soulUrge.value)}?`,
    "Would these descriptions feel just as accurate if a different number had come up? That is the fair test of any personality system.",
  ];

  const method = [
    "Numerology uses only the calendar date and the letters of the name. Birth time and birthplace change nothing here, except that the date is the calendar date at the birthplace.",
    "Pythagorean table: A=1 to I=9, then J=1 again, and so on. Each number is added digit by digit until one digit remains (11, 22 and 33 are kept).",
    "Adding digits until one remains gives the remainder on division by 9 (\"casting out nines\"), which is why Soul Urge plus Personality always reduces to the same root as Expression.",
    `If totals were evenly spread, each root from 1 to 9 would turn up about 1 time in 9 (11%). Sharing a Life Path with ${who === "you" ? "you" : who} is therefore common: roughly 1 person in 9.`,
    "The letter-number table is modern (early 1900s, popularised by L. Dow Balliett), not from Pythagoras. No controlled study has found that these numbers predict personality; they are a framework for reflection.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}

/** No birth name: only the numbers that come from the date. Says plainly what is missing. */
function dateOnly(r, showName, who) {
  const lp = r.lifePath, cur = r.current;
  return insight({
    data: [
      ["Life Path", showName ? `month ${lp.parts.month} + day ${lp.parts.day} + year ${lp.parts.year} = ${lp.total}${lp.chain.length > 1 ? ` → ${lp.chain.slice(1).join(" → ")}` : ""}` : `birth month, day and year each reduced, then added: ${chain(lp)}`],
      ["Timing", `age ${r.age} · Personal Year ${r.personalYear.value} (${r.personalYear.year}) · Personal Month ${r.personalMonth} · Pinnacle ${cur.n} of 4 (number ${cur.pinnacle}, challenge ${cur.challenge})`],
      ["Not included", "Expression, Soul Urge, Personality, Maturity and the letter counts: these come from the full birth name, which was not given"],
    ],
    patterns: [
      N[lp.value].master ? `Life Path ${lp.value} is a master number: a sum that landed on 11, 22 or 33 and is left unreduced by convention.` : "",
      lp.karmic ? `The Life Path passed through the karmic-debt sum ${lp.karmic} on the way down.` : "",
      r.personalYear.value === base(lp.value) ? `The Personal Year (${r.personalYear.value}) matches the Life Path root this year.` : "",
      cur.to != null ? `Pinnacle ${cur.n} runs to age ${cur.to}; ${cur.to - r.age === 0 ? "it changes at the next birthday" : `${plural(cur.to - r.age + 1, "year")} remain`}.` : "The fourth pinnacle has no end date.",
      "Of the five core numbers a full chart uses, this reading has one. Comparisons between numbers (repeats, gaps, odd and even) are not possible without the name.",
    ],
    conclusions: [
      `Life Path ${lp.value} is called ${N[lp.value].name} (${N[lp.value].kw.join(", ")}). In this system the birth date describes the kind of situations a life keeps returning to, so those themes may recur more than others.`,
      `Personal Year ${r.personalYear.value} places ${r.personalYear.year} at step ${r.personalYear.value} of a nine-year cycle. Tradition reads ${r.personalYear.value <= 3 ? "the early steps as starting and building momentum" : r.personalYear.value <= 6 ? "the middle steps as work, change and responsibility" : "the late steps as review, harvest and completion"}.`,
      "A date-only reading is shared by everyone born on the same day, so it may be read as the outline of a chart, not the whole of it.",
    ],
    questions: [
      `Where does "${N[lp.value].kw[0]}" already show up as a recurring situation, and where does it not fit at all?`,
      "Would the description feel just as accurate if a different number had come up? That is the fair test of any personality system.",
    ],
    method: [
      "Numerology uses only the calendar date and the letters of the name. Birth time and birthplace change nothing here, except that the date is the calendar date at the birthplace.",
      "Each number is added digit by digit until one digit remains (11, 22 and 33 are kept).",
      `If totals were evenly spread, each root from 1 to 9 would turn up about 1 time in 9 (11%). Sharing a Life Path with ${who === "you" ? "you" : who} is therefore common: roughly 1 person in 9.`,
      "No controlled study has found that these numbers predict personality; they are a framework for reflection.",
    ],
    who,
  });
}
