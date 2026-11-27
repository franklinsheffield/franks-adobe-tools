// The Oracle's moods: short expressions played on the figure in the left pane. A mood is a data-mood attribute on
// #teller (chamber.css poses the eye, lids, brow, hood and hands for each), a puff of little symbols, a sound in
// the current voice (voice-sfx.js emoteSfx) and, sometimes, a speech bubble. The eye also follows the pointer,
// the Oracle reacts to being poked, and punctuation in her speech flicks her face as she talks.
import { emoteSfx, blip } from "./voice-sfx.js";

/** mood -> how long it holds (ms; 0 = until cleared) and the symbols that puff out around the hood. */
export const MOODS = {
  joy: { ms: 1700, fx: ["✨", "✨", "⭐"] }, cheer: { ms: 2600, fx: ["✨", "🎉", "⭐", "✨", "🎉"] }, love: { ms: 2000, fx: ["💗", "💗", "✨", "💗"] },
  laugh: { ms: 1700, fx: ["🎵", "✨", "🎵"] }, wow: { ms: 1300, fx: ["❗"] }, curious: { ms: 1500, fx: ["❓"] }, think: { ms: 2200, fx: ["💭"] },
  nod: { ms: 1300, fx: [] }, shake: { ms: 1200, fx: [] }, wink: { ms: 900, fx: ["✨"] }, flinch: { ms: 650, fx: ["💫"] },
  sad: { ms: 2600, fx: ["💧"] }, sulk: { ms: 2600, fx: ["💨"] }, smug: { ms: 2300, fx: ["✨"] }, angry: { ms: 2200, fx: ["💢", "💢"] },
  sleepy: { ms: 0, fx: ["💤"] },
};
/** Rooms where you play against the Oracle: she sulks when you win and gloats when you lose. */
export const VS_ROOMS = ["duel", "rummy"];
/** The Oracle's face when a game ends. */
export function moodForOutcome(roomId, { won = false, perfect = false } = {}) {
  if (VS_ROOMS.includes(roomId)) return won ? "sulk" : "smug";
  return won ? (perfect ? "cheer" : "joy") : "sad";
}
/** A yes is a nod, a no is a shake of the hood, anything else a thoughtful look. */
export const moodForTone = (t) => (t > 0 ? "nod" : t < 0 ? "shake" : "think");
/** Punctuation that flicks her face while she talks. */
export const flickFor = (ch) => ({ "!": "ex", "?": "q", "…": "dots" }[ch] || null);

/** What she says when poked, by where. {name} is the member. Kept short: they show in a speech bubble. */
export const POKE = {
  eye: ["Ow. That is my only eye.", "Do not poke the all-seeing eye, {name}.", "I saw that coming. It still hurt.", "Blink and you'll miss me blinking.", "One eye, {name}. I can't spare it."],
  orb: ["Careful! That glass is load-bearing.", "Fingerprints. On the future. Wonderful.", "It tickles the cosmos when you do that.", "The orb says: ask nicely.", "You break it, you buy it. 9,000 Essence."],
  hands: ["High five. Low five. Mystic five.", "These hands are busy conjuring, {name}.", "Up top! …I have very long fingers.", "Careful, I just did my nails.", "A handshake? How formal."],
  hood: ["Yes? I'm listening.", "You rang, {name}?", "That's my good side. They all are.", "Mind the hood, it's vintage.", "Poke received. Destiny unchanged."],
  angry: ["That is ENOUGH poking.", "I am an Oracle, not a doorbell!", "Poke me again. I dare you.", "My patience is not infinite. My robe only looks it."],
  sulk: ["Fine. I'm not looking at you.", "The Oracle is sulking. Come back later.", "Hmph."],
  wake: ["I was resting my eye.", "Wha—! I wasn't asleep. I was foreseeing.", "Oh! {name}. How long was I out?", "Five more minutes of eternity…"],
};
/** After this many quick pokes she gets cross, then sulks. */
export const pokeMood = (zone, count) => (count >= 8 ? "sulk" : count >= 5 ? "angry" : zone === "eye" ? "flinch" : zone === "orb" ? "wow" : zone === "hands" ? "joy" : "curious");
export function pokeLine(zone, count, name = "traveller", rand = Math.random) {
  const pool = POKE[count >= 8 ? "sulk" : count >= 5 ? "angry" : zone] || POKE.hood;
  return pool[Math.floor(rand() * pool.length)].replace(/\{name\}/g, name);
}

const NS = "http://www.w3.org/2000/svg";
/** Wire the figure up. Returns { emote, flick, bubble, sleep, wake, clear, mood() }. `onPoke(zone, count)` may return a line to say. */
export function initMood(teller, { reduced = false, name = () => "traveller", busy = () => false, onPoke = null } = {}) {
  const svg = teller.querySelector("svg"), eye = svg.querySelector(".o-eye"), lid = eye.querySelector(".o-lid"), iris = eye.querySelector(".o-iris");
  // the brow is the dark lash line over the eye; lids are two soft shapes clipped to the eye that slide in to squint or droop
  const brow = eye.querySelector(":scope > path:last-of-type"); brow.classList.add("o-brow");
  const track = document.createElementNS(NS, "g"); track.setAttribute("class", "o-track"); iris.before(track); track.append(iris);
  const lids = document.createElementNS(NS, "g"); lids.setAttribute("clip-path", "url(#m-eyeclip)");
  lids.innerHTML = `<ellipse class="o-lidtop" cx="200" cy="111" rx="58" ry="27" fill="#C8922E" stroke="#1a0b06" stroke-width="3"/><ellipse class="o-lidbot" cx="200" cy="191" rx="54" ry="26" fill="#C8922E" stroke="#1a0b06" stroke-width="2.5"/>`;
  lid.after(lids);
  svg.querySelector("defs").insertAdjacentHTML("beforeend", `<clipPath id="m-eyeclip"><path d="M158 152 Q200 121 242 152 Q200 180 158 152Z"/></clipPath>`);
  brow.insertAdjacentHTML("afterend", `<path class="o-tear" d="M228 164 q5 9 0 13 q-5 -4 0 -13Z" fill="#9fdcff" stroke="#fff" stroke-width=".8"/>`);
  const fx = document.createElement("div"); fx.className = "emote"; fx.setAttribute("aria-hidden", "true");
  const bub = document.createElement("div"); bub.className = "o-bubble"; bub.hidden = true; bub.setAttribute("aria-live", "polite");
  teller.append(fx, bub);

  let cur = "", timer = null, bubT = null, flickT = null, zzz = null, trackT = null;
  const puff = (glyphs) => { if (reduced || !glyphs.length) return;
    const made = glyphs.map((g, i) => { const side = i % 2 ? 1 : -1, el = document.createElement("i"); el.textContent = g;
      el.style.cssText = `--x:${(50 + side * (14 + Math.random() * 14)).toFixed(1)}%;--y:${(14 + Math.random() * 22).toFixed(1)}%;--dx:${(side * (10 + Math.random() * 30)).toFixed(0)}px;--d:${(i * 0.12).toFixed(2)}s`; return el; });
    fx.append(...made); setTimeout(() => made.forEach((n) => n.remove()), 2400); };
  const clear = () => { clearTimeout(timer); clearInterval(zzz); zzz = null; cur = ""; delete teller.dataset.mood; };
  /** Show a mood. opts: { ms, quiet (no sound), fx: false (no symbols), say (bubble text) }. */
  function emote(mood, opts = {}) {
    const M = MOODS[mood]; if (!M) return;
    clear(); cur = mood; teller.dataset.mood = mood; teller.classList.remove("tracking"); teller.style.removeProperty("--lx"); teller.style.removeProperty("--ly");
    void teller.offsetWidth; // restart the pose's animations when the same mood repeats
    if (opts.fx !== false) puff(M.fx);
    if (!opts.quiet) emoteSfx(mood);
    if (opts.say) bubble(opts.say);
    const ms = opts.ms ?? M.ms; if (ms) timer = setTimeout(clear, ms);
    if (mood === "sleepy" && !reduced) zzz = setInterval(() => puff(["💤"]), 2800);
  }
  /** A quick twitch of the face on "!", "?" or "…" while she talks. */
  function flick(kind) { if (!kind || cur) return; clearTimeout(flickT); teller.dataset.flick = kind; flickT = setTimeout(() => delete teller.dataset.flick, 420); }
  /** A little speech bubble by the hood, for asides that must not replace what is in the text box. */
  function bubble(text, ms = 2600) { clearTimeout(bubT); bub.textContent = text; bub.hidden = false; bub.classList.remove("in"); void bub.offsetWidth; bub.classList.add("in");
    [...text.replace(/[^\p{L}]/gu, "").slice(0, 7)].forEach((c, i) => setTimeout(() => blip(c, { final: i === 6 }), 120 + i * 60));
    bubT = setTimeout(() => { bub.hidden = true; }, ms + text.length * 28); }
  const sleep = () => { if (cur !== "sleepy") emote("sleepy"); };
  /** Any input wakes her with a start. Returns true if she was asleep. */
  let wokeAt = 0;
  const wake = () => { if (cur !== "sleepy") return false; wokeAt = Date.now(); emote("wow", { say: pokeLine("wake", 0, name()) }); return true; };

  // the eye follows the pointer (and drifts back to its idle wander when the pointer rests)
  if (!reduced) addEventListener("pointermove", (e) => {
    if (cur || document.body.classList.contains("trance")) return;
    const r = eye.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
    teller.classList.add("tracking"); teller.style.setProperty("--lx", ((dx / d) * 8 * k).toFixed(1) + "px"); teller.style.setProperty("--ly", ((dy / d) * 4.5 * k).toFixed(1) + "px");
    clearTimeout(trackT); trackT = setTimeout(() => { teller.classList.remove("tracking"); teller.style.removeProperty("--lx"); teller.style.removeProperty("--ly"); }, 2600);
  }, { passive: true });

  // poking the Oracle: the eye, the crystal ball, the hands or the hood each get their own reaction
  let pokes = 0, pokeT = null;
  teller.addEventListener("click", (e) => {
    if (document.body.classList.contains("trance")) return;
    if (wake() || Date.now() - wokeAt < 700) return;
    const t = e.target, zone = t.closest?.(".o-eye") ? "eye" : t.closest?.(".o-ball") ? "orb" : t.closest?.(".o-hands") ? "hands" : "hood";
    pokes++; clearTimeout(pokeT); pokeT = setTimeout(() => { pokes = 0; }, 9000);
    const mood = pokeMood(zone, pokes), custom = onPoke ? onPoke(zone, pokes, mood) : null;
    if (zone === "orb" && pokes < 5) { teller.classList.remove("orb-flare"); void teller.offsetWidth; teller.classList.add("orb-flare"); emoteSfx("orb"); setTimeout(() => teller.classList.remove("orb-flare"), 1000); }
    emote(mood, { quiet: zone === "orb" && pokes < 5, say: busy() && pokes < 5 ? null : custom || pokeLine(zone, pokes, name()) });
    if (pokes >= 8) pokes = 0;
  });
  return { emote, flick, bubble, sleep, wake, clear, mood: () => cur };
}
