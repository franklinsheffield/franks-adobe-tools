// Level 4, Sky Archive: real eclipses that changed history. Every date is checked against astronomy-engine at play
// time (and in tests/calendar.test.js): the eclipse search must land on the day the historians give.
// Dates before 1582 are in the Julian calendar, as historians write them; the desk shows our (proleptic Gregorian) date.
import * as E from "./engine.js";

function four(rng, answer, wrong) {
  const out = [answer]; for (const w of wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const J = (year, month, day) => E.julianJdn({ year, month, day });
const G = (year, month, day) => E.jdnOf({ year, month, day });
/** The archive's eclipses, found live with astronomy-engine from a few days before the recorded date. */
export const EVENTS = {
  thales: () => E.nextSolar(J(-584, 5, 28) - 5),     // Herodotus 1.74: the battle of the Halys
  bursagale: () => E.nextSolar(J(-762, 6, 15) - 5),  // Assyrian eponym list, year of Bur-Sagale
  nicias: () => E.nextLunar(J(-412, 8, 27) - 5),     // Thucydides 7.50: Syracuse
  pydna: () => E.nextLunar(J(-167, 6, 21) - 5),      // Livy 44.37: Sulpicius Gallus
  columbus: () => E.nextLunar(J(1504, 2, 29) - 5),   // Jamaica: Ferdinand Columbus's account
  halley: () => E.nextSolar(G(1715, 5, 3) - 5),      // Halley's map of the shadow over England
  helium: () => E.nextSolar(G(1868, 8, 18) - 5),     // Janssen in Guntur, India
  eddington: () => E.nextSolar(G(1919, 5, 29) - 5),  // Príncipe and Sobral
};

export const L4 = [
  { id: "thales", title: "The battle that stopped", gen(rng) {
    const e = EVENTS.thales(), y = 1 - E.julianOf(e.jdn).year, ans = `${y} BCE`;
    return { scene: "solar", kind: "choice", answer: ans, choices: four(rng, ans, ["610 BCE", "557 BCE", "480 BCE"]), after: e.jdn, // no desk: its date would give the year away
      q: "Herodotus tells of a battle between the Lydians and the Medes that stopped when ‘day was suddenly turned to night’. Both sides made peace. Eclipse maths dates the battle. Which year was it?",
      hints: ["It was in the 6th century BCE.", "Thales of Miletus is said to have foretold it. Astronomers find a total eclipse over Asia Minor in late May."],
      explain: `The eclipse fell on ${E.fmtJ(e.jdn)} (Julian calendar), ${an(e.kind)} solar eclipse. Herodotus wrote that Thales predicted the year; how he could have done it is still argued. It is one of the oldest events in history dated to the day.` }; } },
  { id: "bursagale", title: "No year zero", gen() {
    const e = EVENTS.bursagale(), y0 = E.julianOf(e.jdn).year, ans = 1919 - y0;
    return { scene: "solar", kind: "num", answer: ans, desk: e.jdn - 1, after: e.jdn,
      q: `Assyrian records mention a solar eclipse in the year of the official Bur-Sagale. Astronomers date it to ${E.fmtJ(e.jdn)}, and it anchors the whole chronology of the ancient Near East. How many years before the 1919 eclipse that tested Einstein was it?`,
      hints: ["There is no year 0: 1 BCE is followed directly by 1 CE.", `Astronomers write ${1 - y0} BCE as year ${y0}. Subtract that from 1919.`],
      explain: `${1 - y0} BCE to 1919 CE is ${ans.toLocaleString("en")} years, not ${(ans + 1).toLocaleString("en")}, because the count goes from 1 BCE straight to 1 CE. Astronomers avoid the trap by calling 1 BCE ‘year 0’ and ${1 - y0} BCE ‘year ${y0}’.` }; } },
  { id: "nicias", title: "Thrice nine days", gen() {
    const e = EVENTS.nicias();
    return { scene: "lunar", kind: "num", answer: 27, desk: e.jdn - 1, after: e.jdn,
      q: `On ${E.fmtJ(e.jdn)} the Athenian army at Syracuse was ready to sail home when the full Moon was eclipsed. Thucydides says the seers told the general Nicias to wait ‘thrice nine days’. How many days was that?`,
      hints: ["Three times nine.", "It's just under one month of the Moon."],
      explain: `Twenty-seven days. Nicias waited, the Syracusans blockaded the harbour, and the Athenian army was destroyed. Astronomy confirms ${an(e.kind)} lunar eclipse that night.` }; } },
  { id: "pydna", title: "The general who explained it", gen(rng) {
    const e = EVENTS.pydna(), next = E.nextLunar(e.jdn + 1), n = Math.round((next.jdn - e.jdn) / E.SYNODIC), ans = String(n);
    return { scene: "lunar", kind: "choice", answer: ans, choices: four(rng, ans, ["1", "5", "6", "12", "18"].filter((x) => x !== ans)), desk: e.jdn - 1, after: next.jdn,
      q: `Before the battle of Pydna (${E.fmtJ(e.jdn)}), the Roman officer Gaius Sulpicius Gallus told the troops the Moon would be eclipsed that night, so it would not frighten them. After that eclipse, how many full moons passed before the Moon was eclipsed again?`,
      hints: ["Eclipses come in seasons, about half a year apart.", `One synodic month is ${E.SYNODIC.toFixed(2)} days. The next lunar eclipse came on ${E.fmt(next.jdn)} (our calendar).`],
      explain: `${n} full moons later, on ${E.fmtJ(next.jdn)} (Julian), the Moon was eclipsed again (${next.kind}). Livy says Gallus's explanation made the Romans trust him; the Macedonians took the eclipse as an omen and lost the battle.` }; } },
  { id: "columbus", title: "Columbus's almanac", gen(rng) {
    const e = EVENTS.columbus(), j = J(1504, 2, 29), ans = E.fmt(j);
    return { scene: "lunar", kind: "choice", answer: ans, choices: four(rng, ans, ["29 Feb 1504", E.fmt(j - 1), E.fmt(j + 1), E.fmt(j + 10)]), desk: j - 1, after: j,
      q: "Stranded on Jamaica, Christopher Columbus used an almanac to warn the Taíno that the Moon would rise ‘inflamed with wrath’ on the night of 29 February 1504. That date is in the Julian calendar. What is it in our Gregorian calendar?",
      hints: ["In 1504 the Julian calendar ran 10 days behind the Gregorian one.", "Add ten days, and remember 1504 was a leap year."],
      explain: `29 February 1504 (Julian) is ${E.fmt(j, true)} in the Gregorian calendar. Astronomy finds ${an(e.kind)} lunar eclipse that night (the middle came just after midnight Universal Time). The almanac was Regiomontanus's Ephemerides. The trick worked: the islanders brought food again.` }; } },
  { id: "halley-map", title: "Halley's shadow map", gen(rng) {
    const e = EVENTS.halley(), ans = cap(e.kind);
    return { scene: "solar", kind: "choice", answer: ans, choices: four(rng, ans, ["Total", "Annular", "Partial", "Hybrid"]), desk: e.jdn - 1, after: e.jdn,
      q: "For the eclipse of 3 May 1715, Edmond Halley printed a map of the Moon's shadow crossing England and asked people to report what they saw, so nobody would take it as an omen. What kind of eclipse was it?",
      hints: ["London went dark in the middle of the morning.", "Stars came out over London."],
      explain: `It was ${an(e.kind)} solar eclipse. Halley's predicted time was within about four minutes, and the reports he collected let him correct the map: one of the first public science projects.` }; } },
  { id: "helium", title: "An element from the Sun", gen(rng) {
    const e = EVENTS.helium(), ans = "Helium";
    return { scene: "solar", kind: "choice", answer: ans, choices: four(rng, ans, ["Neon", "Argon", "Hydrogen"]), desk: e.jdn - 1, after: e.jdn,
      q: `During the ${e.kind} eclipse of ${E.fmt(e.jdn, true)}, Jules Janssen in India saw a bright yellow line in the light of the Sun's edge that matched no known element. Norman Lockyer named it after the Greek word for the Sun. Which element?`,
      hints: ["The Greek Sun god is Helios.", "It wasn't found on Earth until 1895."],
      explain: "Helium: seen in the Sun in 1868, found on Earth by William Ramsay in 1895. Janssen realised the line was so bright he could see it without an eclipse, and from then on astronomers could study the Sun's edge any day." }; } },
  { id: "eddington", title: "Einstein's eclipse returns", gen(rng) {
    const e = EVENTS.eddington(), s = E.sarosAfter(e), ans = E.fmt(s.jdn);
    return { scene: "solar", kind: "choice", answer: ans, choices: four(rng, ans, [E.fmt(s.jdn - 10), E.fmt(s.jdn + 29), E.fmt(s.jdn - 365)]), desk: e.jdn, after: s.jdn,
      q: `On ${E.fmt(e.jdn, true)} Arthur Eddington's teams photographed stars beside the eclipsed Sun and found their light bent as Einstein's relativity predicted. One Saros later the same eclipse family returned. When?`,
      hints: ["One Saros is 6,585⅓ days: 18 years and 10 or 11 days.", "Count from 29 May 1919 to 1937."],
      explain: `${E.fmt(s.jdn, true)}: ${an(s.kind)} solar eclipse, ${(s.jdn - e.jdn).toLocaleString("en")} days later. The extra third of a day moves each return about 120° west, so this one was seen over the Pacific and Peru.` }; } },
];
const an = (w) => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
