// Calendar Keeper puzzles. Three levels, as in the Séance: 1 how the cycles turn, 2 predict the festivals, 3 predict
// the eclipses. Each puzzle has a fixed id (stars are saved by it) and a gen(rng, today) that builds a fresh question
// whose answer is computed by engine.js, so replays change and every answer is real.
// A generated puzzle: { q, kind, answer, choices?, hints: [two], explain, desk (JDN the wheels show), after? (JDN to turn
// the wheels to on reveal) }. kind: choice | num | tz (tone + sign) | haab (day + month) | egy (month + day).
import * as E from "./engine.js";

const pickOf = (rng) => (a) => a[Math.floor(rng() * a.length)];
const int = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
/** Four distinct options with the answer among them, shuffled. */
function four(rng, answer, wrong) {
  const out = [answer]; for (const w of wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
const dateChoices = (rng, j, offs) => four(rng, E.fmt(j), offs.map((o) => E.fmt(j + o)));
const an = (w) => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

// ---------------- Level 1: how the cycles turn ----------------
const L1 = [
  { id: "tz-next", title: "Turn the sacred count", gen(rng, today) {
    const s = today - int(rng, 1, 400), m = E.maya(s), n = int(rng, 1, 3) === 1 ? 1 : int(rng, 2, 6), a = E.tzAdd(m.tone, m.sign, n);
    return { kind: "tz", answer: a, desk: s, after: s + n,
      q: `The Tzolk'in on the desk reads ${m.tz}. What will it read ${n === 1 ? "tomorrow" : `${n} days from now`}?`,
      hints: ["The number and the day sign both move on by one each day. Numbers run 1 to 13, then back to 1. Signs run through all 20, then start again at Imix.",
        `The number will be ${a.tone}.`],
      explain: `${m.tz} plus ${plural(n, "day")} is ${E.tzName(a.tone, a.sign)}. The 13 numbers and 20 signs turn like two meshed gears, so the number and the sign never reset together until 260 days have passed.` }; } },
  { id: "tz-260", title: "Why 260?", gen() {
    return { kind: "num", answer: 260, q: "The Tzolk'in pairs 13 numbers with 20 day signs. How many days pass before exactly the same day (same number, same sign) comes round again?",
      hints: ["13 and 20 share no common factor, so every number meets every sign once.", "Multiply them."],
      explain: "13 × 20 = 260 days. The 260-day count is still kept today by Maya daykeepers (aj q'ij) in highland Guatemala. One idea for why 260: it is close to the nine months of a human pregnancy." }; } },
  { id: "haab-wayeb", title: "The vague year", gen() {
    return { kind: "num", answer: 5, q: "The Haab' has 18 named months of 20 days. The year still needs 365 days, so a short extra period called Wayeb' closes it. How many days long is Wayeb'?",
      hints: ["18 × 20 = 360.", "365 − 360."],
      explain: "18 × 20 = 360, plus 5 days of Wayeb' = 365. Wayeb' was treated as an unlucky, dangerous time. Like Egypt's civil year, the Haab' never added a leap day, so it slowly slid against the seasons." }; } },
  { id: "lc-tun", title: "Units of the Long Count", gen(rng) {
    const ask = pickOf(rng)([["tun", 360, "18 winal of 20 days"], ["k'atun", 7200, "20 tun of 360 days"], ["winal", 20, "20 k'in (days)"]]);
    return { kind: "num", answer: ask[1], q: `In the Long Count, 1 k'in = 1 day, 20 k'in = 1 winal, 18 winal = 1 tun, 20 tun = 1 k'atun, 20 k'atun = 1 b'ak'tun. How many days are in one ${ask[0]}?`,
      hints: [`One ${ask[0]} = ${ask[2]}.`, "Multiply the two numbers."],
      explain: `One ${ask[0]} = ${ask[1].toLocaleString("en")} days. The Long Count counts every day from a starting point, 13.0.0.0.0, equal to 11 August 3114 BCE. A new b'ak'tun, 13.0.0.0.0 again, began on 21 December 2012: a calendar turning over, not the end of the world.` }; } },
  { id: "egy-season", title: "Egypt's three seasons", gen(rng) {
    const S = [["Akhet", "the flood, when the Nile rose over the fields", 0], ["Peret", "emergence, when the fields reappeared and crops grew", 1], ["Shemu", "harvest and low water", 2]];
    const s = pickOf(rng)(S), all = ["Akhet", "Peret", "Shemu", "Heriu-renpet"];
    return { kind: "choice", answer: s[0], choices: four(rng, s[0], all), q: `The Egyptian civil year had three seasons of four 30-day months. Which season was ${s[1]}?`,
      hints: [`It was season number ${s[2] + 1} of the year.`, `Its name starts with “${s[0][0]}”.`],
      explain: "Akhet (flood), Peret (emergence) and Shemu (harvest) each had four months of 30 days, 360 in all. The five extra days, Heriu-renpet, ‘those upon the year’, came at the end." }; } },
  { id: "egy-add", title: "Count the Egyptian days", gen(rng, today) {
    const m = int(rng, 0, 10), d = int(rng, 12, 30), n = int(rng, 6, 25), a = E.egyAdd(m, d, n);
    const s = E.NABONASSAR + 365 * Math.floor((today - E.NABONASSAR) / 365) + m * 30 + d - 1;
    return { kind: "egy", answer: a, desk: s, after: s + n, q: `It is ${E.egyName(m, d)} in the Egyptian civil calendar. What is the date ${n} days later?`,
      hints: ["Every month has exactly 30 days. Go past 30 and you are into the next month.", `It falls in ${E.EGY_MONTHS[a.month]}.`],
      explain: `${E.egyName(m, d)} + ${n} days = ${E.egyName(a.month, a.day)}. Thirty-day months made Egyptian sums easy: astronomers such as Ptolemy used this calendar for exactly that reason, centuries after Egypt itself.` }; } },
  { id: "celt-nights", title: "Counting by nights", gen(rng) {
    return { kind: "choice", answer: "nights", choices: four(rng, "nights", ["moons", "harvests", "market days", "kings"]),
      q: "Julius Caesar wrote that the Gauls measured time not in days but in…",
      hints: ["It's the reason Samhain begins on the evening of 31 October.", "Think dark, not light."],
      explain: "In The Gallic War (book 6), Caesar says the Gauls count time by nights, so a day begins at nightfall. That is why the fire festivals start the evening before: Samhain on 31 October, Bealtaine on 30 April. English still says ‘fortnight’ (fourteen nights)." }; } },
  { id: "celt-fest", title: "The four fire festivals", gen(rng) {
    const f = pickOf(rng)(E.FESTIVALS);
    return { kind: "choice", answer: f.name, choices: four(rng, f.name, E.FESTIVALS.map((x) => x.name)),
      q: `Which Irish festival marks ${f.marks}?`,
      hints: [`It falls on 1 ${E.MONTHS[f.month - 1]}.`, `It sits halfway between ${f.between}.`],
      explain: `${f.name}, 1 ${E.MONTHS[f.month - 1]}. The four festivals are named in early medieval Irish texts. They are ‘cross-quarter days’, about halfway between ${f.between}.` }; } },
  { id: "moon-solar", title: "When can the Sun go dark?", gen(rng) {
    const solar = rng() < 0.5, ans = solar ? "New moon" : "Full moon";
    return { kind: "choice", answer: ans, choices: four(rng, ans, ["New moon", "Full moon", "First quarter", "Last quarter"]),
      q: solar ? "A solar eclipse can only happen at which phase of the Moon?" : "A lunar eclipse can only happen at which phase of the Moon?",
      hints: [solar ? "The Moon has to pass between the Sun and the Earth." : "The Earth has to be between the Sun and the Moon.", solar ? "It's the phase when we can't see the Moon at all." : "The Moon is opposite the Sun in the sky."],
      explain: solar ? "Only at new moon is the Moon between us and the Sun, so only then can it hide the Sun. Most new moons miss, because the Moon's orbit is tilted about 5° to the Earth's." : "Only at full moon is the Moon behind the Earth, where the Earth's shadow falls. Most full moons miss the shadow, because the Moon's orbit is tilted about 5°." }; } },
];

// ---------------- Level 2: predict the festivals ----------------
const L2 = [
  { id: "tz-today", title: "Today's sacred day", gen(rng, today) {
    const n = int(rng, 4, 30), r = E.maya(today - n), t = E.maya(today);
    return { kind: "tz", answer: { tone: t.tone, sign: t.sign }, desk: today - n, after: today,
      q: `${plural(n, "day")} ago, on ${E.fmt(today - n)}, the Tzolk'in read ${r.tz}. What does it read today?`,
      hints: [`Add ${n} to the number (wrapping past 13) and move the sign on ${n} places (wrapping past 20).`, `Today's number is ${t.tone}.`],
      explain: `Today is ${t.tz}. Its Haab' date is ${t.haabName} and the Long Count reads ${t.lc}. A daykeeper does this counting in their head.` }; } },
  { id: "haab-newyear", title: "The Maya New Year", gen(rng, today) {
    const j = E.nextHaab(today, 0, 0), h = E.maya(today);
    return { kind: "choice", answer: E.fmt(j), choices: dateChoices(rng, j, [-5, 20, 365, -20]), desk: today, after: j,
      q: `Today the Haab' reads ${h.haabName}. When does the next Haab' New Year, the seating of Pop (0 Pop), arrive?`,
      hints: ["Wayeb', the 5 unlucky days, comes right before 0 Pop.", `It is ${plural(j - today, "day")} away.`],
      explain: `0 Pop falls on ${E.fmt(j, true)}, after the 5 days of Wayeb'. The Haab' counts days from 0, so the first day of a month is its ‘seating’. Its Tzolk'in day, ${E.maya(j).tz}, is the ‘year bearer’ that names the coming year.` }; } },
  { id: "round", title: "The Calendar Round", gen() {
    return { kind: "num", answer: E.CALENDAR_ROUND, q: "The 260-day Tzolk'in and the 365-day Haab' turn together. After how many days does the same pair of dates (for example 4 Ajaw 8 Kumk'u) come round again?",
      hints: ["You need the lowest number that both 260 and 365 divide into. They share a factor of 5.", "260 × 365 ÷ 5."],
      explain: "18,980 days: 73 Tzolk'in rounds or 52 Haab' years. The Aztecs, who kept the same pair of calendars, marked the end of each 52-year round with the New Fire ceremony, putting out every fire and lighting a new one. The last was held in 1507." }; } },
  { id: "wepet", title: "The wandering New Year", gen(rng, today) {
    const j = E.nextThoth(today), c = E.egyptCivil(today);
    return { kind: "choice", answer: E.fmt(j), choices: dateChoices(rng, j, [E.nextNayrouz(today) - j, -30, 30, -1]), desk: today, after: j,
      q: `By the ancient civil calendar (365 days, never a leap day), today is ${c.name}. When is the next 1 Thoth, Wepet Renpet, ‘the opening of the year’?`,
      hints: ["Count to the end of the 12 months, then add the 5 epagomenal days.", `It is ${plural(j - today, "day")} away.`],
      explain: `${E.fmt(j, true)}. Because the civil year is a quarter-day short, its New Year slips one day earlier every 4 years. Ideally it came with the first dawn rising of Sirius (Sopdet) in July, near the start of the Nile flood. The two lined up again only after about 1,460 years, the Sothic cycle.` }; } },
  { id: "sothic", title: "The Sothic cycle", gen() {
    return { kind: "num", answer: 1460, q: "The civil year is 365 days, but the year of the Sun and Sirius is about 365¼. The New Year slips one day every 4 years. About how many years until it slips all the way round the 365 days and lines up with Sirius again?",
      hints: ["One day every 4 years.", "365 × 4."],
      explain: "365 × 4 = 1,460 years, the Sothic cycle. The Roman writer Censorinus records that New Year's Day and Sirius's rising fell together in 139 CE. In 238 BCE the Canopus Decree of Ptolemy III ordered a leap day every 4 years, but it didn't stick. Augustus finally imposed one in the 20s BCE, creating the Alexandrian calendar." }; } },
  { id: "nayrouz", title: "Coptic New Year", gen(rng, today) {
    const j = E.nextNayrouz(today);
    return { kind: "choice", answer: E.fmt(j), choices: dateChoices(rng, j, [E.nextThoth(today) - j, -1, 1, -14]), desk: today, after: j,
      q: `The Coptic Church still keeps Egypt's months, fixed to the sun by Augustus's leap day. Today is ${E.copticOf(today).text}. When is the next Nayrouz, 1 Thout?`,
      hints: ["It falls in September every year.", "It is 11 September, or 12 September in the year before a Gregorian leap year."],
      explain: `${E.fmt(j, true)}. With the leap day added, 1 Thout stopped wandering. It falls on 11 September (12 September before a leap year) and opens a new year of the Era of the Martyrs, counted from 284 CE.` }; } },
  { id: "epag", title: "Born upon the year", gen(rng) {
    const ans = "Osiris, Horus, Set, Isis, Nephthys";
    return { kind: "choice", answer: ans, choices: four(rng, ans, ["Ra, Thoth, Ptah, Amun, Mut", "Anubis, Bastet, Sobek, Hathor, Ma'at", "Shu, Tefnut, Geb, Nut, Atum"]),
      q: "The five epagomenal days at the end of the civil year were celebrated as the birthdays of five gods. Which five?",
      hints: ["They are the children of the sky goddess Nut and the earth god Geb.", "The first is the god of the dead and rebirth."],
      explain: "Osiris, Horus (the Elder), Set, Isis and Nephthys. Plutarch tells the myth: Nut was forbidden to give birth on any day of the year, so Thoth won five extra days from the Moon, and her children were born on them." }; } },
  { id: "fest-eve", title: "Light the fire on time", gen(rng, today) {
    const nf = E.nextFestival(today + 1), eve = nf.jdn - 1;
    return { kind: "choice", answer: E.fmt(eve), choices: dateChoices(rng, eve, [1, -7, 7]), desk: today, after: eve,
      q: `The next fire festival is ${nf.f.name}, kept on 1 ${E.MONTHS[nf.f.month - 1]}. Counting days from nightfall, as the Gauls did, on what date do the fires begin at sunset?`,
      hints: ["A day that starts at nightfall begins the evening before.", "It's the last day of the previous month."],
      explain: `Sunset on ${E.fmt(eve, true)}. That's why Halloween, All Hallows' Eve, falls on the night before 1 November, Samhain.` }; } },
  { id: "cross-quarter", title: "The Sun's own festival", gen(rng, today) {
    const nf = E.nextFestival(today + 1), astro = E.sunAt(nf.f.lon, nf.jdn - 40);
    return { kind: "choice", answer: E.fmt(astro), choices: dateChoices(rng, astro, [nf.jdn - astro, -14, 14]), desk: today, after: astro,
      q: `${nf.f.name} is kept on 1 ${E.MONTHS[nf.f.month - 1]}. But the true midpoint between ${nf.f.between} is when the Sun reaches ${nf.f.lon}° along the ecliptic. When is that, this time?`,
      hints: ["The astronomical midpoint lands a few days after the calendar date.", `It is in ${E.MONTHS[E.dateOf(astro).month - 1]}.`],
      explain: `The Sun reaches ${nf.f.lon}° on ${E.fmt(astro, true)} (UT). Calendar and sky drift apart by several days because the seasons aren't equal in length: the Earth moves faster near the Sun in January.` }; } },
];

// ---------------- Level 3: predict the eclipses ----------------
const SPAN = [E.jdnOf({ year: 1990, month: 1, day: 1 }), E.jdnOf({ year: 2030, month: 1, day: 1 })];
let cache = null;
const pool = () => (cache ||= { solar: E.eclipsesBetween("solar", ...SPAN), lunar: E.eclipsesBetween("lunar", ...SPAN, true) });
const where = (e) => (e.type === "solar" ? ` (greatest at ${Math.round(Math.abs(e.lat))}°${e.lat < 0 ? "S" : "N"}, ${E.lonText(e.lon)})` : "");

const L3 = [
  { id: "saros-solar", title: "The Saros: a solar eclipse returns", gen(rng) {
    const e = pickOf(rng)(pool().solar), n = E.sarosAfter(e);
    return { kind: "choice", answer: E.fmt(n.jdn), choices: dateChoices(rng, n.jdn, [-30, 354, -11]), desk: e.jdn, after: n.jdn,
      q: `${an(e.kind).replace(/^a/, "A")} solar eclipse peaked on ${E.fmt(e.jdn)}${where(e)}. One Saros is 223 lunar months: 6,585⅓ days, about 18 years 11 days 8 hours. When is the next eclipse of this Saros series?`,
      hints: ["Add 18 years, then 10 to 12 more days depending on how many leap days fall in between.", `It's in ${E.MONTHS[E.dateOf(n.jdn).month - 1]} ${E.dateOf(n.jdn).year}.`],
      explain: `${E.fmt(n.jdn, true)}: ${an(n.kind)} eclipse${where(n)}. The extra 8 hours let the Earth turn about a third further, so the shadow lands roughly 120° of longitude to the west. After 223 months the Sun, Moon and the Moon's orbit nodes are almost exactly lined up again.` }; } },
  { id: "saros-lunar", title: "The Saros: a lunar eclipse returns", gen(rng) {
    const e = pickOf(rng)(pool().lunar), n = E.sarosAfter(e);
    return { kind: "choice", answer: E.fmt(n.jdn), choices: dateChoices(rng, n.jdn, [-30, 30, -354]), desk: e.jdn, after: n.jdn,
      q: `${an(e.kind).replace(/^a/, "A")} lunar eclipse peaked on ${E.fmt(e.jdn)}. Use the Saros (6,585⅓ days, about 18 years 11 days) to predict its next eclipse.`,
      hints: ["Add 18 years and about 11 days.", `It's in ${E.dateOf(n.jdn).year}.`],
      explain: `${E.fmt(n.jdn, true)}: ${an(n.kind)} lunar eclipse. Babylonian astronomers were predicting lunar eclipses with this 223-month pattern by the 6th century BCE. The name ‘Saros’ came much later, from Edmond Halley in 1691.` }; } },
  { id: "half-year", title: "The next eclipse season", gen(rng) {
    const all = pool().solar, i = int(rng, 0, all.length - 2), e = all[i], n = all[i + 1], gap = n.jdn - e.jdn;
    return { kind: "choice", answer: E.fmt(n.jdn), choices: dateChoices(rng, n.jdn, [e.jdn + 30 - n.jdn, e.jdn + 354 - n.jdn, gap === 177 || gap === 178 ? -29 : 29, -88, 60]), desk: e.jdn, after: n.jdn,
      q: `A solar eclipse happened on ${E.fmt(e.jdn)}. Eclipses come in seasons, when the new or full moon falls near a node of the Moon's tilted orbit. When is the next solar eclipse?`,
      hints: ["Eclipse seasons are about 173 days apart, and eclipses happen at new moons, so count in whole lunar months of 29½ days.", "Usually 6 lunar months (177 days), sometimes 5 (148 days) or 1 (29 days)."],
      explain: `${E.fmt(n.jdn, true)}, ${gap} days later (${Math.round(gap / E.SYNODIC)} lunar months): ${an(n.kind)} eclipse. The Maya eclipse table in the Dresden Codex uses exactly these steps, mostly 177 days with an occasional 148.` }; } },
  { id: "dresden", title: "The Dresden Codex table", gen() {
    return { kind: "num", answer: 6, q: "The Maya eclipse table in the Dresden Codex spaces most of its eclipse warnings 177 days apart. A lunar month is about 29.5 days. How many lunar months is 177 days?",
      hints: ["Divide 177 by 29.5.", "It's between 5 and 7."],
      explain: "6 × 29.53 = 177.2 days. The table covers 405 lunar months (about 33 years) in 69 steps of 177 days, with some 148-day steps (5 months). Maya astronomers built it from long records of the Moon." }; } },
  { id: "fortnight", title: "Eclipses come in pairs", gen(rng) {
    const all = pool().solar, pairs = [];
    for (const s of all) { const l = E.nextLunar(s.jdn - 16, false); if (Math.abs(l.jdn - s.jdn) <= 16) pairs.push([s, l]); }
    const [s, l] = pickOf(rng)(pairs), ans = E.fmt(l.jdn);
    return { kind: "choice", answer: ans, choices: dateChoices(rng, l.jdn, [2 * (s.jdn - l.jdn), 177, 29, -29]), desk: s.jdn, after: l.jdn,
      q: `A solar eclipse peaked on ${E.fmt(s.jdn)}, at new moon. In the same eclipse season there was also a lunar eclipse (some only penumbral, a faint darkening). When was it?`,
      hints: ["A lunar eclipse needs a full moon: half a lunar month away from the new moon.", "About two weeks before or after."],
      explain: `${E.fmt(l.jdn, true)}: ${an(l.kind)} lunar eclipse, ${Math.abs(l.jdn - s.jdn)} days ${l.jdn > s.jdn ? "after" : "before"}. While the Sun sits near a node, both the new moon and the full moon around it can line up.` }; } },
  { id: "exeligmos", title: "Three Saros: the exeligmos", gen(rng) {
    const ans = "3 × 8 hours = 24 hours: the Earth has made a whole extra turn";
    return { kind: "choice", answer: ans, choices: four(rng, ans, ["The Moon's orbit flips over every 54 years", "Leap years cancel out after 54 years", "The Sun's eclipse year is exactly 54 years"]),
      q: "Each Saros lands an eclipse about 120° further west. After three Saros (the exeligmos, about 54 years 33 days) it returns to nearly the same longitude. Why?",
      hints: ["What is left over after 6,585 whole days?", "One Saros overshoots by about 8 hours."],
      explain: "Three Saros is about 19,756 days with almost no leftover hours, so the Earth faces the same way again. The Antikythera mechanism, a Greek gear computer from the 2nd or 1st century BCE found in a shipwreck in 1901, had dials for both the Saros and the exeligmos." }; } },
  { id: "next-real", title: "The next eclipse on Earth", gen(rng, today) {
    const e = E.nextEclipse(today, true), n = E.nextEclipse(e.jdn + 1, true);
    return { kind: "choice", answer: E.fmt(e.jdn), choices: four(rng, E.fmt(e.jdn), [E.fmt(n.jdn), E.fmt(e.jdn + 29), E.fmt(e.jdn + 177), E.fmt(e.jdn + 60), E.fmt(e.jdn + 14)]), desk: today, after: e.jdn,
      q: `From today, ${E.fmt(today)}, when is the next eclipse anywhere on Earth (solar, or a lunar eclipse with the Moon in the Earth's dark shadow)? Use what you know: seasons about 173 days apart, pairs two weeks apart.`,
      hints: [`It's a ${e.type} eclipse.`, `It's in ${E.MONTHS[E.dateOf(e.jdn).month - 1]} ${E.dateOf(e.jdn).year}.`],
      explain: `${E.fmt(e.jdn, true)}: ${an(e.kind)} ${e.type} eclipse${where(e)}. After it: ${an(n.kind)} ${n.type} eclipse on ${E.fmt(n.jdn, true)}. These dates come from the same orbital maths astronomers use, worked out live.` }; } },
  { id: "halley", title: "Who named the Saros?", gen(rng) {
    const ans = "Edmond Halley, in 1691";
    return { kind: "choice", answer: ans, choices: four(rng, ans, ["Ptolemy, in 150 CE", "Galileo Galilei, in 1610", "Nicolaus Copernicus, in 1543"]),
      q: "Babylonian astronomers used the 223-month eclipse cycle by the 6th century BCE, but they didn't call it the Saros. Who gave it that name?",
      hints: ["The same astronomer predicted the return of a famous comet.", "It happened in the 1690s."],
      explain: "Edmond Halley named it in 1691, borrowing ‘saros’ from a Byzantine dictionary, the Suda. To the Babylonians a šar was 3,600: the name is a historical mix-up that stuck." }; } },
];

export const LEVELS = [
  { n: 1, name: "Apprentice", what: "How the cycles turn", deck: L1, mult: 1 },
  { n: 2, name: "Daykeeper", what: "Predict the festivals", deck: L2, mult: 1.5 },
  { n: 3, name: "Sky Watcher", what: "Predict the eclipses", deck: L3, mult: 2 },
];
export const ALL = LEVELS.flatMap((L) => L.deck.map((p) => ({ L, p })));
export const keyOf = (L, p) => `${L.n}:${p.id}`;
export const byKey = (k) => { const [n, id] = String(k).split(":"); const L = LEVELS[+n - 1]; return L && { L, p: L.deck.find((x) => x.id === id) }; };
