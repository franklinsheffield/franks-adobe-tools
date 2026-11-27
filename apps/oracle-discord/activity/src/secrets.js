// Secrets hidden in Your Grimoire, and the book's extra pages (month view, notes, ribbons, weekly recap, search).
// Rules and words only; main.js draws them. Found secrets live in prog.gs (small, synced); notes and ribbons stay on
// the device beside the Journal log. Every secret is about the member's own data or plain facts: no advice, no verdicts.
import { dayKey } from "./book.js";

/** The seven secrets. hint: what the Secrets page says before one is found. */
export const SECRETS = [
  { id: "ink", e: "🕯️", name: "Invisible ink", hint: "Some pages look blank. Bring a little light closer.", pay: 15 },
  { id: "cipher", e: "ᚱ", name: "The margin cipher", hint: "Three margins hold runes. The Scribe's Hand teaches the alphabet.", pay: 60 },
  { id: "diary", e: "👁️", name: "The Oracle's diary", hint: "The sigil on the spine does not like being tapped. Try it seven times.", pay: 25 },
  { id: "calendar", e: "🌕", name: "Calendar pages", hint: "Some pages only appear on certain nights. Open the Journal on a full moon.", pay: 25 },
  { id: "gilded", e: "🏵️", name: "Gilded plates", hint: "Finish every entry in one system of the Codex.", pay: 80 },
  { id: "sealed", e: "👑", name: "The sealed chapter", hint: "A wax seal only a crown can break.", pay: 0 },
  { id: "pressed", e: "🌿", name: "Pressed specimens", hint: "Name a plant in the Herbalist's Grimoire. It will turn up between the pages.", pay: 10 },
];
export const secretOf = (id) => SECRETS.find((s) => s.id === id);
const gs = (p) => (p.gs = Array.isArray(p.gs) ? p.gs : []);
export const found = (p, id) => gs(p).includes(id);
/** Mark a secret found. Returns its Essence on the first find, otherwise 0. */
export function findSecret(p, id) {
  const s = secretOf(id); if (!s || found(p, id)) return 0;
  gs(p).push(id); p.essence = (p.essence || 0) + s.pay; return s.pay;
}

// ---- 1. invisible ink: a blank page on each tab; light it to read it ----
export const INK = {
  codex: "Every name in this book was chosen by chance: a shuffle, a coin, a cast. The pattern you see in them is yours. That is the oldest trick in the Chamber, and it still works.",
  journal: "A diary is a slow experiment. Write the day down, wait a month, read it back. The past you is the only control group you will ever get.",
  patterns: "Flip a fair coin twenty times and you will probably see a run of four. Streaks feel like messages. Count them anyway: that is how magic turns into science.",
};
/** How much of an ink page has been lit (0..1) from the cells the candle has passed over. */
export const inkLit = (cells, total = 24) => Math.min(1, new Set(cells).size / total);

// ---- 2. the margin cipher: three words in Elder Futhark runes, one per tab ----
const RUNE = { A: "ᚨ", B: "ᛒ", C: "ᚲ", D: "ᛞ", E: "ᛖ", F: "ᚠ", G: "ᚷ", H: "ᚺ", I: "ᛁ", J: "ᛃ", K: "ᚲ", L: "ᛚ", M: "ᛗ", N: "ᚾ", O: "ᛟ", P: "ᛈ", Q: "ᚲ", R: "ᚱ", S: "ᛊ", T: "ᛏ", U: "ᚢ", V: "ᚹ", W: "ᚹ", X: "ᛉ", Y: "ᛃ", Z: "ᛉ" };
export const toRunes = (word) => [...String(word).toUpperCase()].map((c) => RUNE[c] || c).join("");
export const CIPHER = [{ sec: "codex", n: "I", w: "QUESTION" }, { sec: "journal", n: "II", w: "EVERY" }, { sec: "patterns", n: "III", w: "ANSWER" }];
/** The rune table writes C, K and Q the same, so any of them is accepted where the phrase has one. */
const fold = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, "").replace(/[KQ]/g, "C").replace(/W/g, "V").replace(/J/g, "Y");
export const cipherSolved = (guess) => fold(guess) === fold(CIPHER.map((c) => c.w).join(""));

// ---- 3. the Oracle's diary: her own entries, about the member's data ----
export function diary(p, name = "traveller") {
  const n = p.readings || 0, best = p.best || 0, codex = Object.values(p.codex || {}).reduce((a, x) => a + (x || []).length, 0);
  return [
    ["Dawn", "Polished the crystal ball. It showed me my own reflection, which is the most accurate reading I have ever given."],
    ["9:00", `${name.charAt(0).toUpperCase() + name.slice(1)} has asked me ${n} question${n === 1 ? "" : "s"}. I have answered ${n}. I am keeping score, in case anyone asks.`],
    ["10:30", "Someone poked my eye again. I do not have a second eye for this. Noted in the margin, in red."],
    ["Noon", `The Codex holds ${codex} page${codex === 1 ? "" : "s"} in this book. I wrote every one of them, and I have opinions about the handwriting.`],
    ["14:15", "Shuffled the tarot deck 7 times. Mathematicians say 7 riffles make a deck properly random. I did 8, to be dramatic."],
    ["16:00", `Best streak on record here: ${best} day${best === 1 ? "" : "s"}. I don't get attached. I simply notice.`],
    ["Dusk", "Lit the candles. Blew them out. Lit them again. Candles are the only thing in here that obey me."],
    ["Midnight", "If you are reading this, you tapped the sigil seven times. Seven. I respect the commitment. Please close my diary."],
  ];
}

// ---- 4. calendar pages: days that open a page of their own ----
const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
/** Moon age in days (0 = new, ~14.8 = full) at a time. */
export const moonAge = (at) => { const d = ((at - NEW_MOON) / 864e5) % SYNODIC; return d < 0 ? d + SYNODIC : d; };
/** Today's calendar page, if any (local date). */
export function calendarPage(at = Date.now()) {
  const d = new Date(at), m = d.getMonth() + 1, day = d.getDate(), age = moonAge(at), full = SYNODIC / 2;
  if (Math.abs(age - full) < 1) return { id: "fullmoon", e: "🌕", t: "Full moon", body: "Tonight the Moon sits opposite the Sun, so the whole face we can see is lit. Many cultures timed festivals and planting by this night. Studies looking for a full-moon effect on behaviour mostly find small or no effects, which is a finding too." };
  if (age < 1 || age > SYNODIC - 1) return { id: "newmoon", e: "🌑", t: "New moon", body: "The Moon is between Earth and the Sun, its lit side facing away. The sky is darker than any other night of the month: the best night for faint stars." };
  if ((m === 3 && day === 20) || (m === 9 && day === 22)) return { id: "equinox", e: "⚖️", t: "Equinox", body: "Day and night are close to equal everywhere on Earth today. The Sun rises almost due east and sets almost due west." };
  if ((m === 6 && day === 21) || (m === 12 && day === 21)) return { id: "solstice", e: "☀️", t: "Solstice", body: "The Sun reaches its furthest point north or south today: the longest day in one hemisphere, the shortest in the other. Stone circles and temples were lined up to catch it." };
  if (m === 10 && day === 31) return { id: "halloween", e: "🎃", t: "All Hallows' Eve", body: "Samhain marked the end of harvest, when the boundary to the other world was said to be thin. Today the Chamber's ghosts get the night off." };
  if (m === 3 && day === 14) return { id: "piday", e: "π", t: "Pi Day", body: "3.14159… A circle's circumference over its diameter never repeats and never ends. Every crystal ball in the Chamber is built on it." };
  if (m === 1 && day === 1) return { id: "newyear", e: "✨", t: "New Year", body: "A fresh Journal year. The Earth has gone round the Sun once more, about 940 million kilometres." };
  return null;
}

// ---- 7. the sealed chapter: opened by the Star Crown ----
export const CREED = [
  "Magic is what science looks like before you understand it.",
  "Ask the question anyway. Then check the answer.",
  "A pattern is a clue, not a verdict.",
  "The stars do not care about us, which is why they are honest.",
  "Wonder is not the opposite of knowing. It is where knowing starts.",
  "Question every answer, including this one.",
];

// ---- improvements: month view, weekly recap, search ----
/** A month grid (weeks of 7, Monday first) with each day's entry count from the log. */
export function monthGrid(log, y, m) {
  const counts = {}; for (const x of log || []) { const k = dayKey(x.at); counts[k] = (counts[k] || 0) + 1; }
  const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) { const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; cells.push({ d, k, n: counts[k] || 0 }); }
  while (cells.length % 7) cells.push(null);
  return cells;
}
/** The last 7 days, counted from the log: data only. */
export function weekRecap(log, now = Date.now()) {
  const wk = (log || []).filter((x) => now - x.at < 7 * 864e5), c = (k) => wk.filter((x) => x.k === k).length;
  const won = wk.filter((x) => x.k === "game" && /won/.test(x.t)).length, lost = wk.filter((x) => x.k === "game" && /lost/.test(x.t)).length;
  const days = new Set(wk.map((x) => dayKey(x.at))).size;
  return { entries: wk.length, days, readings: c("reading"), saves: c("save"), won, lost, trophies: c("trophy"), records: c("record") };
}
export const recapLine = (r, name = "traveller") => r.entries
  ? `This week, ${name}: ${r.readings} reading${r.readings === 1 ? "" : "s"}, ${r.won} game${r.won === 1 ? "" : "s"} won${r.lost ? ` and ${r.lost} lost` : ""}, across ${r.days} day${r.days === 1 ? "" : "s"}. What stands out to you in that?`
  : `Your week is a blank page, ${name}. A blank page is data too.`;
/** Log entries whose text matches every word of the query, newest first. */
export function searchLog(log, q, max = 40) {
  const words = String(q || "").toLowerCase().split(/\s+/).filter(Boolean); if (!words.length) return [];
  return (log || []).filter((x) => words.every((w) => String(x.t).toLowerCase().includes(w))).sort((a, b) => b.at - a.at).slice(0, max);
}
