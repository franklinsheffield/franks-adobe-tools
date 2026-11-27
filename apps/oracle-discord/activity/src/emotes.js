// The emote collection: the 8 starting emotes, 8 earned in themed ways, and a signature emote for every robe (yours when
// you own the robe). Gamified: each emote levels up with use (Bronze 10, Silver 50, Gold 150), and one emote a day is the
// Emote of the day, worth Essence the first time you use it. Rules and markup only; main.js runs the wheel and the book.
import { EMOTES } from "./character.js";
import { points } from "./trophies.js";
import { hasCrown } from "./credits.js";

/** fx: particles thrown out by the emote. p: the pieces, m: how they move (rise, fall, burst, swirl, orbit, wave). */
const START = EMOTES.map((e) => ({ ...e, how: "Yours from the start", fx: { p: [e.e], m: "burst" } }));
const EARNED = [
  { id: "levitate", e: "🔮", name: "Levitate", mood: "smug", say: "Look, no table.", how: "Finish 25 readings", test: (p) => (p.readings || 0) >= 25, fx: { p: ["✨", "🔮"], m: "rise" } },
  { id: "moonbow", e: "🌙", name: "Moon bow", mood: "nod", say: "The Moon sends its regards.", how: "Keep a 7-day streak", test: (p) => (p.best || 0) >= 7, fx: { p: ["🌙", "⭐"], m: "orbit" } },
  { id: "flourish", e: "🃏", name: "Card flourish", mood: "wink", say: "Pick a card. Any card.", how: "Earn 10 trophy points", test: (p) => points(p) >= 10, fx: { p: ["🃏", "♠️", "♥️", "♦️", "♣️"], m: "swirl" } },
  { id: "smoke", e: "💨", name: "Puff of smoke", mood: "wow", say: "And… gone. Almost.", how: "Open a mystery box", test: (p) => (p.boxes || 0) >= 1, fx: { p: ["💨", "☁️"], m: "burst" } },
  { id: "handshake", e: "🤝", name: "Secret handshake", mood: "wink", say: "You know the code.", how: "Break a coded message in Your Grimoire", test: (p) => (p.cd || []).length >= 1, fx: { p: ["🔐", "✦"], m: "orbit" } },
  { id: "stargaze", e: "🔭", name: "Stargaze", mood: "curious", say: "Every one of those is a sun.", how: "Find 3 secrets in Your Grimoire", test: (p) => (p.gs || []).length >= 3, fx: { p: ["⭐", "✨", "🌟"], m: "fall" } },
  { id: "applause", e: "👏", name: "Applause", mood: "cheer", say: "Bravo! Encore!", how: "Use emotes 30 times", test: (p) => total(p) >= 30, fx: { p: ["👏", "🎉"], m: "burst" } },
  { id: "crownbow", e: "👑", name: "Royal bow", mood: "smug", say: "You may rise.", how: "Win the Star Crown", test: (p) => hasCrown(p), fx: { p: ["👑", "✨"], m: "rise" } },
];
/** One per robe, in the robe's own element. */
const ROBE = [
  ["midnight", "🌌", "Midnight hush", "sleepy", "Shh. The night is listening.", ["🌙", "✦"], "fall"],
  ["crimson", "🔥", "Ember flare", "angry", "Things are heating up.", ["🔥", "✨"], "rise"],
  ["tide", "🌊", "Tide call", "joy", "The sea answers.", ["🌊", "💧"], "wave"],
  ["emerald", "🍃", "Grove whisper", "love", "The trees say hello.", ["🍃", "🌿"], "swirl"],
  ["zephyr", "🌪️", "Zephyr spin", "dizzy", "Wheee…", ["🌪️", "💨"], "swirl"],
  ["labcoat", "⚗️", "Eureka", "wow", "Eureka! Write that down.", ["⚗️", "🫧", "💡"], "rise"],
  ["starcloak", "🌠", "Starfall", "cheer", "Make a wish.", ["🌠", "⭐"], "fall"],
  ["vestments", "☀️", "Sunburst", "cheer", "Let there be light.", ["☀️", "✨"], "burst"],
  ["set-abyss-robe", "🫧", "Deep breath", "curious", "Bubbles from the deep.", ["🫧", "🐟"], "rise"],
  ["set-clock-robe", "⚙️", "Tick tock", "think", "Right on time.", ["⚙️", "🕰️"], "orbit"],
  ["set-aurora-robe", "🌈", "Aurora wave", "love", "The sky is dancing.", ["🌈", "✨"], "wave"],
  ["rare-phoenix", "🐦‍🔥", "Rebirth", "cheer", "From the ashes!", ["🔥", "🪶"], "rise"],
  ["sea-pumpkin", "🎃", "Hex", "smug", "Boo. You're hexed.", ["🎃", "🦇"], "burst"],
  ["sea-frost", "❄️", "Frost breath", "nervous", "Brr. Who left the door open?", ["❄️", "✦"], "fall"],
  ["sea-blossom", "🌸", "Petal storm", "joy", "Spring is here.", ["🌸", "🌷"], "swirl"],
].map(([robe, e, name, mood, say, p, m]) => ({ id: "robe-" + robe, robe, e, name, mood, say, how: "Own the robe", fx: { p, m } }));

export const ALL_EMOTES = [...START, ...EARNED, ...ROBE];
export const emoteAny = (id) => ALL_EMOTES.find((x) => x.id === id) || null;
const total = (p) => Object.values(p.emo || {}).reduce((a, n) => a + n, 0);
/** Can this member use the emote? */
export function emoteOk(p, e, robeName = null) {
  if (!e) return false; if (!e.test && !e.robe) return true;
  if (e.robe) return (p.owned || []).includes(e.robe) || p.outfit === e.robe;
  try { return !!e.test(p); } catch { return false; }
}
export const owned = (p) => ALL_EMOTES.filter((e) => emoteOk(p, e));
/** The emote's level from its uses: 0 none, 1 Bronze (10), 2 Silver (50), 3 Gold (150). */
export const LEVELS = [{ at: 10, name: "Bronze" }, { at: 50, name: "Silver" }, { at: 150, name: "Gold" }];
export const levelOf = (n) => LEVELS.reduce((a, l, i) => (n >= l.at ? i + 1 : a), 0);
/** The Emote of the day: the same for everyone on a day, picked from the starting set so all can try for it. */
export function emoteOfDay(at = Date.now()) { const d = new Date(at), k = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); return START[(k * 7) % START.length]; }
export const DAY_PAY = 5;
const dk = (at) => { const d = new Date(at); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
/** Count a use. Returns { level, levelUp, dayBonus, unlocked } — unlocked lists emotes this use made available. */
export function useEmote(p, id, at = Date.now()) {
  const before = new Set(owned(p).map((e) => e.id));
  p.emo = p.emo || {}; const n = (p.emo[id] = (p.emo[id] || 0) + 1), lv = levelOf(n), levelUp = lv > levelOf(n - 1) ? LEVELS[lv - 1].name : null;
  let dayBonus = 0; if (emoteOfDay(at).id === id && p.emoDay !== dk(at)) { p.emoDay = dk(at); dayBonus = DAY_PAY; p.essence = (p.essence || 0) + DAY_PAY; }
  return { level: lv, levelUp, dayBonus, unlocked: owned(p).filter((e) => !before.has(e.id)) };
}

/** The emote book: every emote, owned ones playable, locked ones with how to get them. */
export function emoteBookHtml(p, esc, robeName = (id) => id) {
  const mine = owned(p), day = emoteOfDay();
  const card = (e) => { const ok = mine.includes(e), n = (p.emo || {})[e.id] || 0, lv = levelOf(n), nx = LEVELS[lv];
    return `<button type="button" class="eb-card${ok ? "" : " locked"}${e.id === day.id ? " today" : ""}" ${ok ? `data-emote="${e.id}"` : "disabled"} title="${esc(ok ? e.say : e.how)}">
      <span class="eb-e" aria-hidden="true">${ok ? e.e : "🔒"}</span><b>${esc(e.name)}</b>${lv ? `<i class="eb-lv lv${lv}">${LEVELS[lv - 1].name}</i>` : ""}
      <small>${ok ? (nx ? `${n}/${nx.at} to ${nx.name}` : `${n} uses · mastered`) : esc(e.robe ? `Own the ${robeName(e.robe)}` : e.how)}</small></button>`; };
  const sec = (t, xs) => `<h4>${t}</h4><div class="eb-grid">${xs.map(card).join("")}</div>`;
  return `<div class="eb" role="dialog" aria-label="Your emotes"><div class="eb-top"><h3>😀 Your emotes <small>${mine.length} of ${ALL_EMOTES.length}</small></h3><button type="button" class="c small" id="eb-close">✕</button></div>
    <p class="eb-day">⭐ Emote of the day: <b>${day.e} ${esc(day.name)}</b>. Use it today for 💎 ${DAY_PAY}${p.emoDay === dk(Date.now()) ? " (done ✓)" : ""}. Emotes level up with use: Bronze 10, Silver 50, Gold 150.</p>
    ${sec("Starting set", START)}${sec("Earned", EARNED)}${sec("Robe signatures", ROBE)}</div>`;
}
/** The particles an emote throws out, as markup for the Oracle's pane. */
export function emoteFxHtml(e, rnd = Math.random) {
  const n = e.fx.m === "burst" ? 10 : 8;
  return Array.from({ length: n }, (_, i) => `<i class="efx efx-${e.fx.m}" style="--i:${i};--n:${n};--x:${Math.round(rnd() * 80 - 40)}px;--d:${(i * 0.07 + rnd() * 0.1).toFixed(2)}s;--s:${(0.8 + rnd() * 0.7).toFixed(2)}">${e.fx.p[i % e.fx.p.length]}</i>`).join("");
}
