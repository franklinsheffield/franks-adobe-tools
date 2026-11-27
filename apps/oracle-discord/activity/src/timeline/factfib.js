// Fact or Fib: the History of Magic's party round (rules in ../party/vote.js). Each prompt is a real event from the
// timeline deck with its year hidden. Everyone writes a fake year, then everyone hunts for the real one. Answers are
// years only, so no free text ever reaches the room (nothing to filter on a public server).
// Only events whose year is known to within 3 years are used, so the truth is never in doubt.
import { EVENTS, eraOf } from "./events.js";
import "./events2.js"; // adds the expansion cards to EVENTS
import { yearText } from "./logic.js";
import { host } from "../hosts/index.js";

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

/* ---------- The emcee: each House hosts the round in its own voice. No facts in these lines: the facts come from
   the cards. {name} = a player, {n} = a number, {year} = the real date. ---------- */
const L = (open, write, vote, truth, nobody, fooled, final, win) => ({ open, write, vote, truth, nobody, fooled, final, win });
export const EMCEE = {
  oracle: L(
    ["Gather round the crystal, seekers. I'll show you a true moment from history; you whisper me a false year.", "Fact or Fib! I know every date. You know how to lie. Let's see who wins."],
    ["Write me a year that sounds true. The best lies wear a convincing hat.", "Shh. Type a fib. I won't peek. Much."],
    ["One of these is real. The rest are your friends being sneaky.", "The crystal holds the truth. Which year is it?"],
    ["The true year: {year}. The crystal never lies. Your friends, however…", "There it is: {year}. History, unmasked."],
    ["Nobody found the truth. I'm proud of you all as liars and worried about you as historians.", "Not one of you saw it. The fibs win this round."],
    ["{name} fooled {n}! A natural. I'd hire you, but you'd lie about your references.", "{name} tricked {n} of you. Very mysterious. Very rude."],
    ["Final round! Double points. Lie like your crown depends on it.", "The last card, and every point counts twice. Make it beautiful."],
    ["{name} wins Fact or Fib! The greatest liar and the sharpest eye at this table.", "The crystal crowns {name}. Truth-finder, fib-weaver, champion."]),
  alchemist: L(
    ["Into the crucible, colleagues. A true event, a hidden date. Bring me your most plausible impurities.", "Fact or Fib, my apprentices. Truth is the gold; your fibs are the lead."],
    ["Mix me a false year. Precise. Confident. Utterly wrong.", "Write your fib. A good forgery needs the right weight in the hand."],
    ["Assay the samples. Only one is pure.", "Test each date. One will ring true when struck."],
    ["The pure sample: {year}. Everything else was base metal.", "{year}. The crucible has spoken, and it smells faintly of sulphur."],
    ["Nobody found it! A perfect batch of lead. I'm almost impressed.", "Not one assay right. Back to the bench, all of you."],
    ["{name} fooled {n}! A forger of rare talent. Keep away from my notes.", "{name}'s fib passed for gold {n} times. Shameless. Excellent."],
    ["The final transmutation: double points. Turn your lies to gold.", "Last round. Twice the points, twice the heat."],
    ["{name} wins! The Great Work belongs to you, at least until the next round.", "{name} takes the crucible. Gold, at last."]),
  observatory: L(
    ["Dim the lamps, observers. One true date among the false stars. Let's find it.", "Fact or Fib, from the dome. I'll show you a moment; you plot a false position for it."],
    ["Chart a false year. Make it look like it belongs on the map.", "Write your fib. A good false star sits just where a real one might."],
    ["Take your sightings. Only one point on this chart is real.", "Sweep the sky. One of these dates is a true star."],
    ["The true position: {year}. Everything else was a smudge on the lens.", "There, {year}. Fixed and catalogued."],
    ["No one found it. A whole sky of decoys tonight.", "Clouds over the truth this round. Nobody sighted it."],
    ["{name} fooled {n}! A decoy so bright it pulled the whole telescope off course.", "{name} led {n} of you astray. A fine false star."],
    ["The final sighting, double points. Steady hands on the eyepiece.", "Last plate of the night. Everything counts twice."],
    ["{name} wins the night's watch! Sharpest eye in the dome.", "{name} takes the Fact or Fib crown. The log will remember."]),
  parlour: L(
    ["Take your seats, dear sitters. A true event, a hidden date, and a table full of liars. My favourite kind of evening.", "Fact or Fib in the Parlour. Tonight, you're all mediums. Let's see who's honest."],
    ["Write me a false year, darling. Say it like you believe it. Every good medium does.", "Your fib, please. Confidence is half of any trick."],
    ["One of these is the truth. The rest are table-rapping. Choose.", "Lights low. Which date is real, and which is a toe under the table?"],
    ["The true year: {year}. Exposed, like a cheesecloth ghost.", "{year}. The committee confirms it. The rest were humbug."],
    ["Not one of you found it! The whole séance was a sham. I'm so proud.", "Nobody saw through it. Fooled, every one of you. Delicious."],
    ["{name} fooled {n}! Darling, the music halls would have adored you.", "{name}'s fib took in {n} sitters. A born showman."],
    ["The final act, double points. Star Turn, everyone.", "Last trick of the night. Every point counts twice."],
    ["{name} wins! Top of the bill, and the best liar in the house.", "{name} takes the night. Bow, darling, they're applauding."]),
  scriptorium: L(
    ["Settle at your desks, scribes. A true entry from the chronicle, its date scraped off. Supply a forgery.", "Fact or Fib in the Scriptorium. I'll show you the record; you forge the margin."],
    ["Ink me a false year. Neat hand, no blots, no tells.", "Write your fib. A good forgery copies the style, not just the words."],
    ["Compare the copies. Only one matches the original.", "Read each date closely. One is genuine."],
    ["The original reads {year}. The rest go in the forgeries drawer.", "{year}, in the true hand. Well read, those who found it."],
    ["No one found the original. A drawer full of forgeries today.", "Every copy was false, and every one of you believed one. Remarkable."],
    ["{name} fooled {n}! A forger worthy of the archive. I'm keeping an eye on you.", "{name}'s copy fooled {n} readers. Steady hand."],
    ["The final page, double points. Your best hand, please.", "Last entry. It counts twice in the ledger."],
    ["{name} wins! Master of the true record, and of the false one.", "{name} takes the ledger. Sign it in your best hand."]),
};
/** An emcee line for the current House (falls back to the Oracle's). */
export function emcee(kind, vars = {}, rand = Math.random) {
  const E = EMCEE[(host() || {}).id] || EMCEE.oracle, pool = E[kind] || EMCEE.oracle[kind] || [""];
  return pool[Math.floor(rand() * pool.length)].replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}
