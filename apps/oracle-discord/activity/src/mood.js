// The Oracle's moods: short expressions played on the figure in the left pane. A mood is a data-mood attribute on
// #teller (chamber.css poses the eye, lids, brow, hood and hands for each), a puff of little symbols, a sound in
// the current voice (voice-sfx.js emoteSfx) and, sometimes, a speech bubble. The eye also follows the pointer,
// the Oracle reacts to being poked, and punctuation in her speech flicks her face as she talks.
import { emoteSfx, blip, setVoiceMood, handSfx } from "./voice-sfx.js";

/** mood -> how long it holds (ms; 0 = until cleared) and the symbols that puff out around the hood. */
export const MOODS = {
  joy: { ms: 1700, fx: ["✨", "✨", "⭐"] }, cheer: { ms: 2600, fx: ["✨", "🎉", "⭐", "✨", "🎉"] }, love: { ms: 2000, fx: ["💗", "💗", "✨", "💗"] },
  laugh: { ms: 1700, fx: ["🎵", "✨", "🎵"] }, wow: { ms: 1300, fx: ["❗"] }, curious: { ms: 1500, fx: ["❓"] }, think: { ms: 2200, fx: ["💭"] },
  nod: { ms: 1300, fx: [] }, shake: { ms: 1200, fx: [] }, wink: { ms: 900, fx: ["✨"] }, flinch: { ms: 650, fx: ["💫"] },
  sad: { ms: 2600, fx: ["💧"] }, sulk: { ms: 2600, fx: ["💨"] }, smug: { ms: 2300, fx: ["✨"] }, angry: { ms: 2200, fx: ["💢", "💢"] },
  sleepy: { ms: 0, fx: ["💤"] }, nervous: { ms: 1800, fx: ["💦"] }, dizzy: { ms: 2400, fx: ["💫", "⭐", "💫"] },
};
/** The emoji for each mood: it pops over her hood, rides on her speech bubble and sits by her name in the text box. */
export const MOOD_EMOJI = { joy: "😄", cheer: "🥳", love: "😍", laugh: "😂", wow: "😲", curious: "🧐", think: "🤔", nod: "👍", shake: "🙅", wink: "😉", flinch: "😖",
  sad: "😢", sulk: "😒", smug: "😏", angry: "😤", sleepy: "😴", nervous: "😅", dizzy: "😵" };
// ---- reaction emojis: each mood pops its emoji somewhere new around the Oracle, moving in its own way ----
/** Where an emoji can appear, in % of the Oracle pane: beside the hood, over the head, by each hand, by the orb. */
export const EMOJI_SPOTS = [[50, 2], [28, 12], [72, 12], [18, 34], [82, 34], [22, 66], [78, 66], [50, 58]];
/** How each mood's emoji moves. bounce: hop and float off · float: drift up swaying · burst: shake-in with sparks
 *  · slam: drop from above and squash · drip: sag and slide down · orbit: circle the head · pop: the plain pop. */
export const EMOJI_MOTION = { joy: "bounce", cheer: "burst", laugh: "bounce", love: "float", wow: "burst", flinch: "burst", nervous: "drip", dizzy: "orbit",
  curious: "orbit", think: "orbit", angry: "slam", sulk: "slam", sad: "drip", sleepy: "drip", smug: "float", wink: "pop", nod: "bounce", shake: "slam" };
const SPARKS = { cheer: ["🎉", "✨", "⭐"], love: ["💕", "💗", "💖"], wow: ["✨", "❗"], flinch: ["💦", "💥"], angry: ["💢"], laugh: ["😆"], sleepy: ["💤"], sad: ["💧"], dizzy: ["💫"], nervous: ["💦"] };
/** Pick a spot: not the one used last time, and for orbit moods always over the head. */
export function emojiSpot(mood, last = -1, rnd = Math.random) {
  if (EMOJI_MOTION[mood] === "orbit") return 0;
  let i; do i = Math.floor(rnd() * EMOJI_SPOTS.length); while (i === last && EMOJI_SPOTS.length > 1); return i;
}
let lastSpot = -1;
function popEmoji(teller, mood) {
  const pane = teller.parentElement || teller, motion = EMOJI_MOTION[mood] || "pop", i = emojiSpot(mood, lastSpot); lastSpot = i;
  const [x, y] = EMOJI_SPOTS[i], side = x < 50 ? -1 : 1, b = document.createElement("b");
  b.className = "emo-pop em-" + motion; b.textContent = MOOD_EMOJI[mood]; b.setAttribute("aria-hidden", "true");
  b.style.cssText = `left:${x}%;top:${y}%;--r:${(Math.random() * 30 - 15).toFixed(0)}deg;--s:${(0.85 + Math.random() * 0.45).toFixed(2)};--side:${side}`;
  pane.append(b); setTimeout(() => b.remove(), 2200);
  for (const [k, e] of (SPARKS[mood] || []).entries()) {
    for (let n = 0; n < (motion === "burst" ? 2 : 1); n++) {
      const sp = document.createElement("i"), a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 50;
      sp.className = "emo-spark"; sp.textContent = e; sp.setAttribute("aria-hidden", "true");
      sp.style.cssText = `left:${x}%;top:${y}%;--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d - 20).toFixed(0)}px;--d:${(k * 0.08 + n * 0.12 + 0.1).toFixed(2)}s`;
      pane.append(sp); setTimeout(() => sp.remove(), 1700);
    }
  }
}
/** Rooms where you play against the Oracle: she sulks when you win and gloats when you lose. */
export const VS_ROOMS = ["duel", "rummy"];
/** The Oracle's face when a game ends. */
export function moodForOutcome(roomId, { won = false, perfect = false } = {}) {
  if (VS_ROOMS.includes(roomId)) return won ? "sulk" : "smug";
  return won ? (perfect ? "cheer" : "joy") : "sad";
}
/** Hand sounds that land on a mood's gesture beat: [sound, delay ms] (chamber.css times the poses to match). */
export const HAND_BEATS = { angry: [["slam", 260]], cheer: [["clap", 180], ["clap", 480], ["clap", 780], ["clap", 1080]], love: [["clap", 120]], wow: [["swat", 0]], flinch: [["swat", 0]] };
/** One-off hand gestures that play over any mood: snap (cards flip), point (she talks to you), swatL / swatR (a poke). */
export const GESTURES = { snap: 520, point: 1500, swatL: 430, swatR: 430 };

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
export const pokeMood = (zone, count) => (count >= 8 ? "sulk" : count >= 5 ? "angry" : count >= 3 && zone === "hood" ? "nervous" : zone === "eye" ? "flinch" : zone === "orb" ? "wow" : zone === "hands" ? "joy" : "curious");
export function pokeLine(zone, count, name = "traveller", rand = Math.random) {
  const pool = POKE[count >= 8 ? "sulk" : count >= 5 ? "angry" : zone] || POKE.hood;
  return pool[Math.floor(rand() * pool.length)].replace(/\{name\}/g, name);
}

const NS = "http://www.w3.org/2000/svg";
/** Wire the figure up. Returns { emote, flick, bubble, gesture, sleep, wake, clear, mood() }. `onPoke(zone, count)` may return a line to say. */
export function initMood(teller, { reduced = false, name = () => "traveller", busy = () => false, onPoke = null, onChange = null } = {}) {
  const svg = teller.querySelector("svg"), eye = svg.querySelector(".o-eye"), lid = eye.querySelector(".o-lid"), iris = eye.querySelector(".o-iris");
  // the brow is the dark lash line over the eye; lids are two soft shapes clipped to the eye that slide in to squint or droop
  const brow = eye.querySelector(":scope > path:last-of-type"); brow.classList.add("o-brow");
  const track = document.createElementNS(NS, "g"); track.setAttribute("class", "o-track"); iris.before(track); track.append(iris);
  const lids = document.createElementNS(NS, "g"); lids.setAttribute("clip-path", "url(#m-eyeclip)");
  lids.innerHTML = `<ellipse class="o-lidtop" cx="200" cy="111" rx="58" ry="27" fill="#C8922E" stroke="#1a0b06" stroke-width="3"/><ellipse class="o-lidbot" cx="200" cy="191" rx="54" ry="26" fill="#C8922E" stroke="#1a0b06" stroke-width="2.5"/>`;
  lid.after(lids);
  svg.querySelector("defs").insertAdjacentHTML("beforeend", `<clipPath id="m-eyeclip"><path d="M158 152 Q200 121 242 152 Q200 180 158 152Z"/></clipPath>`);
  brow.insertAdjacentHTML("afterend", `<path class="o-tear" d="M228 164 q5 9 0 13 q-5 -4 0 -13Z" fill="#9fdcff" stroke="#fff" stroke-width=".8"/>`);
  // anime-style expression marks (manpu): drawn once, shown per mood by chamber.css
  const star = (x, y, r, c = "#fff") => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${c}"/>`;
  lids.insertAdjacentHTML("afterend", `<g class="o-eyealt">
    <path class="e-happy" d="M168 158 Q200 126 232 158" fill="none" stroke="#1a0b06" stroke-width="7" stroke-linecap="round"/>
    <path class="e-scrunch" d="M172 138 L216 152 L172 166" fill="none" stroke="#1a0b06" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="e-spiral" d="M200 152 m0 0 a4 4 0 1 1 4 4 a8 8 0 1 1 -12 -6 a13 13 0 1 1 20 12 a17 17 0 0 1 -26 4" fill="none" stroke="#2a0420" stroke-width="3.2" stroke-linecap="round"/>
    <path class="e-heart" d="M200 163 C184 151 187 139 195 139 C198 139 200 142 200 144 C200 142 202 139 205 139 C213 139 216 151 200 163Z" fill="#ff2f8f" stroke="#fff" stroke-width="1.5"/>
    <g class="e-stars">${star(193, 146, 7)}${star(208, 158, 4.5)}${star(206, 143, 3)}</g>
    <g class="e-glint">${star(234, 134, 11, "#fff")}${star(234, 134, 5, "#FADE8C")}</g></g>`);
  const rays = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), r0 = 118 + (i % 2) * 10; return `<path d="M${(200 + c * r0).toFixed(0)} ${(150 + s * r0 * 0.9).toFixed(0)} L${(200 + c * (r0 + 34)).toFixed(0)} ${(150 + s * (r0 + 34) * 0.9).toFixed(0)}"/>`; }).join("");
  svg.insertAdjacentHTML("beforeend", `<g class="o-manpu" aria-hidden="true">
    <g class="mp-shock" stroke="#fff" stroke-width="4" stroke-linecap="round">${rays}</g>
    <g class="mp-spark">${star(118, 96, 12, "#FADE8C")}${star(288, 84, 9, "#fff")}${star(96, 190, 7, "#fff")}${star(306, 176, 11, "#FADE8C")}${star(150, 40, 6, "#fff")}</g>
    <g class="mp-vein" fill="none" stroke="#ff2a2a" stroke-width="5" stroke-linecap="round"><path d="M250 58 q8 6 2 14 M266 58 q-8 6 -2 14 M250 90 q8 -6 2 -14 M266 90 q-8 -6 -2 -14"/></g>
    <g class="mp-sweat"><path d="M286 96 q12 20 0 27 q-12 -7 0 -27Z" fill="#8fd4ff" stroke="#fff" stroke-width="1.6"/><path d="M282 114 q2 5 6 5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>
    <g class="mp-gloom" stroke="#5b6fb8" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M178 78 v30 M189 70 v44 M200 66 v50 M211 70 v44 M222 78 v30"/></g>
    <g class="mp-blush"><ellipse cx="164" cy="184" rx="15" ry="7" fill="#ff7fb0" opacity=".55"/><ellipse cx="236" cy="184" rx="15" ry="7" fill="#ff7fb0" opacity=".55"/><path d="M154 188 l5 -9 M162 189 l5 -9 M170 188 l5 -9 M226 188 l5 -9 M234 189 l5 -9 M242 188 l5 -9" stroke="#ff4f93" stroke-width="2" stroke-linecap="round"/></g>
    <g class="mp-snot"><circle cx="222" cy="176" r="11" fill="#bfe9ff" fill-opacity=".55" stroke="#fff" stroke-width="1.5"/><circle cx="218" cy="172" r="2.5" fill="#fff"/></g>
    <g class="mp-dots" fill="#fff"><circle cx="262" cy="92" r="4"/><circle cx="276" cy="86" r="4"/><circle cx="290" cy="80" r="4"/></g>
    <g class="mp-cloud" fill="#3a3f66" opacity=".85"><circle cx="262" cy="64" r="11"/><circle cx="276" cy="58" r="13"/><circle cx="291" cy="65" r="10"/><path d="M262 78 q4 6 -2 10 M276 78 q4 7 -2 12 M290 78 q4 6 -2 10" stroke="#8fd4ff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
  </g>`);
  const big = document.createElement("b"); big.className = "emote-big"; big.setAttribute("aria-hidden", "true");
  const fx = document.createElement("div"); fx.className = "emote"; fx.setAttribute("aria-hidden", "true");
  const bub = document.createElement("div"); bub.className = "o-bubble"; bub.hidden = true; bub.setAttribute("aria-live", "polite");
  teller.append(fx, big, bub);

  let beats = [], gestT = null;
  /** A one-off hand gesture over the current pose. */
  function gesture(kind, { sound = true, sx = 0, sy = 0 } = {}) {
    if (!GESTURES[kind] || reduced) return; clearTimeout(gestT);
    teller.style.setProperty("--sx", sx.toFixed(0) + "px"); teller.style.setProperty("--sy", sy.toFixed(0) + "px");
    delete teller.dataset.gesture; void teller.offsetWidth; teller.dataset.gesture = kind;
    if (sound && kind === "snap") setTimeout(() => handSfx("snap"), 230);
    if (sound && kind.startsWith("swat")) handSfx("swat");
    gestT = setTimeout(() => delete teller.dataset.gesture, GESTURES[kind]);
  }
  let cur = "", timer = null, bubT = null, flickT = null, zzz = null, trackT = null;
  const puff = (glyphs) => { if (reduced || !glyphs.length) return;
    const made = glyphs.map((g, i) => { const side = i % 2 ? 1 : -1, el = document.createElement("i"); el.textContent = g;
      el.style.cssText = `--x:${(50 + side * (14 + Math.random() * 14)).toFixed(1)}%;--y:${(14 + Math.random() * 22).toFixed(1)}%;--dx:${(side * (10 + Math.random() * 30)).toFixed(0)}px;--d:${(i * 0.12).toFixed(2)}s`; return el; });
    fx.append(...made); setTimeout(() => made.forEach((n) => n.remove()), 2400); };
  const tell = () => { if (cur) document.body.dataset.mood = cur; else delete document.body.dataset.mood; setVoiceMood(cur); onChange && onChange(cur); }; // the room, the candles and the voice follow her mood
  const clear = () => { clearTimeout(timer); beats.forEach(clearTimeout); beats = []; clearInterval(zzz); zzz = null; cur = ""; delete teller.dataset.mood; tell(); };
  /** Show a mood. opts: { ms, quiet (no sound), fx: false (no symbols), say (bubble text) }. */
  function emote(mood, opts = {}) {
    const M = MOODS[mood]; if (!M) return;
    clear(); cur = mood; teller.dataset.mood = mood; teller.classList.remove("tracking"); teller.style.removeProperty("--lx"); teller.style.removeProperty("--ly");
    tell(); void teller.offsetWidth; // restart the pose's animations when the same mood repeats
    if (opts.fx !== false) puff(M.fx);
    if (!reduced && opts.fx !== false && MOOD_EMOJI[mood]) popEmoji(teller, mood);
    if (!opts.quiet) { emoteSfx(mood); (HAND_BEATS[mood] || []).forEach(([k, d]) => beats.push(setTimeout(() => cur === mood && handSfx(k), d))); }
    if (mood === "angry") beats.push(setTimeout(() => { document.body.classList.remove("slam"); void document.body.offsetWidth; document.body.classList.add("slam"); setTimeout(() => document.body.classList.remove("slam"), 420); }, 260));
    if (opts.say) bubble(opts.say, 2600, MOOD_EMOJI[mood]);
    const ms = opts.ms ?? M.ms; if (ms) timer = setTimeout(clear, ms);
    if (mood === "sleepy" && !reduced) zzz = setInterval(() => puff(["💤"]), 2800);
  }
  /** A quick twitch of the face on "!", "?" or "…" while she talks. */
  function flick(kind) { if (!kind || cur) return; clearTimeout(flickT); teller.dataset.flick = kind; flickT = setTimeout(() => delete teller.dataset.flick, 420); }
  /** A little speech bubble by the hood, for asides that must not replace what is in the text box. */
  function bubble(text, ms = 2600, emoji = "") { clearTimeout(bubT); bub.textContent = text; if (emoji) { const e = document.createElement("span"); e.className = "be"; e.textContent = emoji; bub.append(e); } bub.hidden = false; if (!document.body.classList.contains("trance")) { const sw = (teller.dataset.gesture || "").startsWith("swat"); setTimeout(() => gesture("point", { sound: false }), sw ? 440 : 0); } bub.classList.remove("in"); void bub.offsetWidth; bub.classList.add("in");
    [...text.replace(/[^\p{L}]/gu, "").slice(0, 7)].forEach((c, i) => setTimeout(() => blip(c, { final: i === 6 }), 120 + i * 60));
    bubT = setTimeout(() => { bub.hidden = true; }, ms + text.length * 28); }
  const sleep = () => { if (cur !== "sleepy") emote("sleepy"); };
  /** Any input wakes her with a start. Returns true if she was asleep. */
  let wokeAt = 0;
  const wake = () => { if (cur !== "sleepy") return false; wokeAt = Date.now(); emote("nervous", { say: pokeLine("wake", 0, name()) }); return true; };

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
    const m = svg.getScreenCTM(); if (m) { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()), L = p.x < 200, x = L ? p.x : 400 - p.x;
      const cl = (v, a) => Math.max(-a, Math.min(a, v)); gesture(L ? "swatL" : "swatR", { sx: cl((x - 140) * 0.6, 50), sy: cl((p.y - 300) * 0.6, 90) }); }
    pokes++; clearTimeout(pokeT); pokeT = setTimeout(() => { pokes = 0; }, 9000);
    const mood = pokeMood(zone, pokes), custom = onPoke ? onPoke(zone, pokes, mood) : null;
    if (zone === "orb" && pokes < 5) { teller.classList.remove("orb-flare"); void teller.offsetWidth; teller.classList.add("orb-flare"); emoteSfx("orb"); setTimeout(() => teller.classList.remove("orb-flare"), 1000); }
    emote(mood, { quiet: zone === "orb" && pokes < 5, say: busy() && pokes < 5 ? null : custom || pokeLine(zone, pokes, name()) });
    if (pokes >= 8) pokes = 0;
  });
  return { emote, flick, bubble, gesture, sleep, wake, clear, mood: () => cur };
}
