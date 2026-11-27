// The Cabinet of Curiosities: small things hidden all over the Chamber (the window, the eye, the crystal ball, the shelf
// skull, the herbs, the dust, the walls, the door, the store, the Trophy Case, the record player, the emote wheel), plus
// a few that only happen at certain real times (3:33, 11:11, Friday the 13th, a leap day, your birthday, an eclipse day,
// two planets meeting in the sky). Each find pays once (💎 Essence, or 🌙 moon tokens for the rare ones) and fills a
// drawer in the Cabinet, which lives in Your Grimoire. Rules, words and markup only; curio-ui.js wires the hotspots.
// Tracked in prog.cur = [ids], prog.curW = [magic words heard], prog.curM = { ten, all } milestones paid.
import * as A from "astronomy-engine";
import { positions } from "../../src/ephemeris.js";
import { moonLight } from "./scene.js";

/** pay: { gem } Essence or { moon } moon tokens. rare: the rare ones glow in the Cabinet. hint: a riddle, never the answer. */
export const CURIOS = [
  { id: "window", e: "🦉", name: "Someone at the window", hint: "Knock on the glass where the sky lives. Three times, politely.", pay: { gem: 15 } },
  { id: "wolf", e: "🐺", name: "The full-moon howl", hint: "Knock on the same glass when the Moon is round and bright.", pay: { moon: 2 }, rare: true },
  { id: "stare", e: "👁️", name: "The staring contest", hint: "Hold her gaze. Don't look away, don't touch.", pay: { gem: 20 } },
  { id: "spin", e: "🌀", name: "A galaxy in the glass", hint: "Stir the crystal ball. Round and round, three times.", pay: { gem: 20 } },
  { id: "skull", e: "💀", name: "The skull's whole act", hint: "Someone on the shelf has jokes. Hear five of them.", pay: { gem: 15 } },
  { id: "leaf", e: "🍃", name: "A falling leaf", hint: "Brush the drying herbs. Catch what falls before it lands.", pay: { gem: 15 } },
  { id: "mote", e: "✨", name: "The golden mote", hint: "One speck of dust is not like the others. It does not stay long.", pay: { gem: 25 } },
  { id: "visitor", e: "🐈‍⬛", name: "A rare visitor", hint: "Now and then, something wanders across the Chamber floor. Be quick.", pay: { moon: 3 }, rare: true },
  { id: "attic", e: "🏚️", name: "The Oracle's attic", hint: "After fifty readings, the walls start to crack.", pay: { moon: 3 }, rare: true },
  { id: "word", e: "🪄", name: "A magic word", hint: "Ask her a question that is really a spell.", pay: { gem: 15 } },
  { id: "lexicon", e: "📖", name: "Every magic word", hint: "There are eight words she answers in her own way.", pay: { moon: 3 }, rare: true },
  { id: "witch", e: "🕰️", name: "The witching minute", hint: "Visit when the clock shows the same digits twice, or three of them.", pay: { gem: 25 } },
  { id: "fri13", e: "🐈", name: "Friday the 13th", hint: "Visit on the unluckiest day of the calendar.", pay: { moon: 2 }, rare: true },
  { id: "leap", e: "🐸", name: "The leap day", hint: "Visit on a day that only exists once every four years.", pay: { moon: 5 }, rare: true },
  { id: "bday", e: "🎂", name: "Your birthday", hint: "Visit on your birthday. She remembers the date you gave her.", pay: { gem: 50 } },
  { id: "eclipse", e: "🌘", name: "An eclipse day", hint: "Visit on a day when the Sun or the Moon is eclipsed somewhere on Earth.", pay: { moon: 5 }, rare: true },
  { id: "align", e: "🪐", name: "Planets meeting", hint: "Visit while two planets stand close together in the sky.", pay: { moon: 2 }, rare: true },
  { id: "backmask", e: "⏪", name: "Played backwards", hint: "Records hide messages. Spin one the wrong way.", pay: { gem: 25 } },
  { id: "knock", e: "🚪", name: "Knock knock", hint: "Rap on the Trophy Case three times. Something inside may answer.", pay: { gem: 15 } },
  { id: "backroom", e: "🏷️", name: "The back room", hint: "The shopkeeper's price tag hangs loose. Give it a tug. Or three.", pay: { gem: 30 } },
  { id: "gate", e: "🌌", name: "The word in the stars", hint: "Before you enter, four stars by the door spell a word. Touch them in order.", pay: { gem: 25 } },
  { id: "combo", e: "🪢", name: "The conjurer's knot", hint: "Wave, dance, wave. Quickly.", pay: { gem: 25 } },
  { id: "sulk", e: "😤", name: "Silenced once too often", hint: "Turn her voice off again and again. See how she takes it.", pay: { gem: 15 } },
  { id: "sync", e: "🫶", name: "In sync", hint: "In a call, send the same emote as a friend at the same moment.", pay: { moon: 2 }, rare: true },
];
export const curioOf = (id) => CURIOS.find((c) => c.id === id) || null;
export const TEN_EMOTE = "curator", ALL_PAY = { gem: 300, moon: 10 };
const list = (p) => (Array.isArray(p.cur) ? p.cur : (p.cur = []));
export const curFound = (p, id) => list(p).includes(id);
export const curCount = (p) => list(p).filter((id) => curioOf(id)).length;
export const payText = (pay) => [pay.gem ? `💎 ${pay.gem}` : "", pay.moon ? `🌙 ${pay.moon}` : ""].filter(Boolean).join(" + ");

/** Mark a find. Pays once. Returns { c, pay, ten, all } or null when already found or unknown. */
export function findCurio(p, id) {
  const c = curioOf(id); if (!c || curFound(p, id)) return null;
  list(p).push(id); const m = (p.curM ||= {}), give = (x) => { p.essence = (p.essence || 0) + (x.gem || 0); p.tokens = (p.tokens || 0) + (x.moon || 0); };
  give(c.pay); const n = curCount(p), out = { c, pay: c.pay, ten: false, all: false };
  if (n >= 10 && !m.ten) { m.ten = true; out.ten = true; }
  if (n >= CURIOS.length && !m.all) { m.all = true; out.all = true; give(ALL_PAY); }
  return out;
}

// ---- magic words: questions that are really spells. Normalised; a phrase counts anywhere in the question ----
export const WORDS = [
  ["abracadabra", ["abracadabra"], "Abracadabra! …Nothing happened. That's the trick: the magic is in the asking."],
  ["42", ["42", "meaning of life"], "Forty-two. The answer was always easy. The question is the hard part."],
  ["xyzzy", ["xyzzy", "plugh"], "A hollow voice says: nothing happens here. Old adventurers will understand."],
  ["sesame", ["open sesame"], "The door was open the whole time, traveller. You only had to knock."],
  ["hocus", ["hocus pocus"], "Hocus pocus. Pocus hocus. Still a chamber. Science is like that too: say it right, test it twice."],
  ["real", ["are you real"], "As real as the questions you bring me. Which is to say: very."],
  ["maker", ["who made you", "who created you"], "Science is Magic made me. I wrote my own jokes. You can tell."],
  ["thanks", ["thank you", "thanks oracle"], "You're welcome. Good manners are the oldest magic there is."],
];
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
/** The magic word in a question, or null: [id, line]. */
export function magicWord(q) {
  const s = norm(q); if (!s) return null;
  for (const [id, keys, line] of WORDS) if (keys.some((k) => (k.length < 4 ? s === k : s.includes(k)))) return [id, line];
  return null;
}
/** Record a word heard. Returns { first, all } for the finds it earns. */
export function hearWord(p, id) {
  const W = (p.curW = Array.isArray(p.curW) ? p.curW : []); if (!W.includes(id)) W.push(id);
  return { first: W.length >= 1, all: WORDS.every(([w]) => W.includes(w)) };
}

// ---- real times: the clock, the calendar, the sky ----
/** The timed finds open right now: witch (3:33 or 11:11), fri13, leap, bday (birth date "YYYY-MM-DD"), wolf-able full moon. */
export function timedNow(at = new Date(), birth = "") {
  const d = at instanceof Date ? at : new Date(at), h = d.getHours() % 12 || 12, mi = d.getMinutes(), out = [];
  if ((h === 3 && mi === 33) || (h === 11 && mi === 11)) out.push("witch");
  if (d.getDay() === 5 && d.getDate() === 13) out.push("fri13");
  if (d.getMonth() === 1 && d.getDate() === 29) out.push("leap");
  const b = /^\d{4}-(\d{2})-(\d{2})/.exec(String(birth || ""));
  if (b && +b[1] === d.getMonth() + 1 && +b[2] === d.getDate()) out.push("bday");
  return out;
}
/** Is the Moon full enough for the howl? (98% lit or more.) */
export const fullMoon = (at = Date.now()) => moonLight(at).lit >= 0.98;
/** An eclipse peaking on this local day, anywhere on Earth: { kind: "lunar"|"solar", type } or null. Real astronomy. */
export function eclipseOn(at = new Date()) {
  const d = new Date(at), start = new Date(d.getFullYear(), d.getMonth(), d.getDate()), end = +start + 864e5;
  try {
    const L = A.SearchLunarEclipse(start); if (L && +L.peak.date < end) return { kind: "lunar", type: L.kind };
    const S = A.SearchGlobalSolarEclipse(start); if (S && +S.peak.date < end) return { kind: "solar", type: S.kind };
  } catch { /* out of range */ }
  return null;
}
const WANDERERS = [["mercury", "Mercury"], ["venus", "Venus"], ["mars", "Mars"], ["jupiter", "Jupiter"], ["saturn", "Saturn"]];
/** Two naked-eye planets within `orb` degrees of each other along the ecliptic (a conjunction): { a, b, sep } or null. */
export function meeting(at = Date.now(), orb = 3) {
  let best = null; const pos = positions(new Date(at));
  for (let i = 0; i < WANDERERS.length; i++) for (let j = i + 1; j < WANDERERS.length; j++) {
    let s = Math.abs(pos[WANDERERS[i][0]].lon - pos[WANDERERS[j][0]].lon); if (s > 180) s = 360 - s;
    if (s <= orb && (!best || s < best.sep)) best = { a: WANDERERS[i][1], b: WANDERERS[j][1], sep: +s.toFixed(1) };
  }
  return best;
}

// ---- the shelf skull's act, the attic, the backwards record, the knock, the back room ----
export const SKULL_JOKES = [
  "Why didn't the skeleton go to the party? No body to go with.",
  "I'd tell you a joke about calcium, but the humour is very dry.",
  "I have a bone to pick with you. Several. I'm mostly bones.",
  "People call me heartless. Fair.",
  "Skeletons can't lie. You can see right through us.",
  "I was in a band once. The Skele-tones.",
  "Don't stare. I can't stare back. No eyes. Very unfair.",
  "The Oracle keeps me for company. I keep her for the laughs.",
];
export const ATTIC = [
  ["🧳", "A trunk of old robes", "My very first robe. It was beige. We do not talk about the beige years."],
  ["🔮", "A cracked crystal ball", "Ball number one. It saw a great deal. Mostly the floor, in the end."],
  ["✉️", "A bundle of letters", "Questions from long ago. \"Will it rain tomorrow?\" Every one of them, for a whole year."],
  ["🔭", "A brass telescope", "Not Galileo's. But he would have liked it, and it still points at Jupiter."],
  ["🖼️", "A portrait with no eyes", "That's not a portrait, it's a window into the wall. Please stop looking through it."],
  ["🫙", "A jar marked DO NOT OPEN", "…You opened it. It was empty. That was the lesson. Or the joke. Both."],
];
export const BACKMASK = ["…erom yalp …sdrawkcab gninetsil er'uoY", "You're listening backwards. Play more.", "The B-side of every record hides a thank-you note. This is it: thank you for staying."];
export const KNOCK = ["Who's there?", "Atom.", "Atom who?", "Atom-ic! You found the Trophy Case's secret. It's science and it's magic."];
export const BACKROOM = "The shopkeeper's back room: dusty boxes, one candle, and a note. \"For whoever tugged the tag: nothing here is for sale. Take this for being nosy.\"";
/** The four door stars: tap S, E, E, K in order from left to right. Positions are % of the door screen. */
export const GATE_STARS = [["S", 18, 30], ["E", 30, 22], ["E", 70, 22], ["K", 82, 30]];

/** The Cabinet pages: one drawer per curiosity. Found ones show the name; others show only the riddle. Returns [left, right]. */
export function cabinetHtml(p, esc) {
  const n = curCount(p), W = Array.isArray(p.curW) ? p.curW.length : 0, half = Math.ceil(CURIOS.length / 2);
  const drawer = (c) => { const f = curFound(p, c.id);
    return `<div class="cu-drawer${f ? " found" : ""}${c.rare ? " rare" : ""}"><span class="cu-knob" aria-hidden="true">${f ? c.e : "?"}</span><div><b>${f ? esc(c.name) : c.rare ? "A rare curiosity" : "An empty drawer"}</b><small>${esc(c.hint)}</small><i>${f ? "✓ Found" : payText(c.pay)}</i></div></div>`; };
  const bar = (done, e, t, prize, pct) => `<div class="co-row${done ? " done" : ""}"><span class="co-e">${done ? "✓" : e}</span><div><b>${t}</b><small>${prize}</small><i class="co-bar"><i style="--p:${pct}%"></i></i></div></div>`;
  const top = `<p class="bk-note">${n} of ${CURIOS.length} found · magic words heard: ${W} of ${WORDS.length}</p><div class="co">${bar(n >= 10, "🔍", "Ten curiosities", "The Curator's lens emote", Math.round((Math.min(n, 10) / 10) * 100))}${bar(n >= CURIOS.length, "🏺", "The whole Cabinet", `${payText(ALL_PAY)} and the Wonder emote`, Math.round((n / CURIOS.length) * 100))}</div>`;
  return [`${top}<div class="cu-drawers">${CURIOS.slice(0, half).map(drawer).join("")}</div>`, `<div class="cu-drawers">${CURIOS.slice(half).map(drawer).join("")}</div>`];
}
