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
  { id: "keeper", e: "🗝️", name: "Keeper's sigil", mood: "smug", say: "Every secret, kept.", how: "Find all 7 secrets in Your Grimoire", test: (p) => (p.gs || []).length >= 7, fx: { p: ["🗝️", "✦", "🕯️"], m: "orbit" } },
  { id: "archivist", e: "🏛️", name: "Archivist's flourish", mood: "cheer", say: "The whole Codex. Every page.", how: "Finish the whole Codex", test: (p) => !!(p.coll && p.coll.codex), fx: { p: ["📜", "✨", "🏛️"], m: "rise" } },
  { id: "knot", e: "🪢", name: "Conjurer's knot", mood: "wink", say: "Tied, untied, and tied again.", how: "A hidden emote combo (see the Cabinet of Curiosities)", test: (p) => (p.cur || []).includes("combo"), fx: { p: ["🪢", "✨"], m: "swirl" } },
  { id: "curator", e: "🔍", name: "Curator's lens", mood: "curious", say: "Fascinating. Put it in a drawer.", how: "Find 10 curiosities", test: (p) => (p.cur || []).length >= 10, fx: { p: ["🔍", "🏺", "✦"], m: "orbit" } },
  { id: "wonder", e: "🏺", name: "Wonder", mood: "wow", say: "Every drawer full. Every corner looked into.", how: "Fill the whole Cabinet of Curiosities", test: (p) => !!(p.curM && p.curM.all), fx: { p: ["🏺", "🌙", "✨", "🪐"], m: "burst" } },
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

// ---- six slots: only equipped emotes are usable; swap them in the Oracle creator ----
export const SLOTS = 6;
/** The equipped emotes (ids), always valid and owned; empty slots fill from the starting set. */
export function slots(p) {
  const mine = owned(p).map((e) => e.id), cur = (Array.isArray(p.emoSlots) ? p.emoSlots : []).filter((id, i, a) => mine.includes(id) && a.indexOf(id) === i).slice(0, SLOTS);
  for (const id of mine) { if (cur.length >= SLOTS || Array.isArray(p.emoSlots)) break; cur.push(id); }
  return cur;
}
/** Equip or unequip. Returns "on", "off", "full" (6 already equipped) or "last" (keep at least one). */
export function toggleSlot(p, id) {
  const cur = slots(p); if (!emoteOk(p, emoteAny(id))) return null;
  if (cur.includes(id)) { if (cur.length <= 1) return "last"; p.emoSlots = cur.filter((x) => x !== id); return "off"; }
  if (cur.length >= SLOTS) return "full"; p.emoSlots = [...cur, id]; return "on";
}
export const equipped = (p, id) => slots(p).includes(id);

/** The emote book: every emote, owned ones playable, locked ones with how to get them. */
export function emoteBookHtml(p, esc, robeName = (id) => id, { modal = true } = {}) {
  const mine = owned(p), day = emoteOfDay(), eq = slots(p);
  const card = (e) => { const ok = mine.includes(e), on = eq.includes(e.id), n = (p.emo || {})[e.id] || 0, lv = levelOf(n), nx = LEVELS[lv];
    return `<button type="button" class="eb-card${ok ? "" : " locked"}${on ? " on" : ""}${e.id === day.id ? " today" : ""}" ${ok ? `data-slot="${e.id}" aria-pressed="${on}"` : "disabled"} title="${esc(ok ? (on ? "Equipped. Tap to take it off." : "Tap to equip") : e.how)}">
      <span class="eb-e" aria-hidden="true">${ok ? e.e : "🔒"}</span><b>${esc(e.name)}</b>${lv ? `<i class="eb-lv lv${lv}">${LEVELS[lv - 1].name}</i>` : ""}${on ? `<i class="eb-on">✓ ${eq.indexOf(e.id) + 1}</i>` : ""}
      <small>${ok ? (nx ? `${n}/${nx.at} to ${nx.name}` : `${n} uses · mastered`) : esc(e.robe ? `Own the ${robeName(e.robe)}` : e.how)}</small></button>`; };
  const sec = (t, xs) => `<h4>${t}</h4><div class="eb-grid">${xs.map(card).join("")}</div>`;
  const bar = `<div class="eb-slots" aria-label="Equipped emotes">${Array.from({ length: SLOTS }, (_, i) => { const e = emoteAny(eq[i]); return `<span class="eb-slot${e ? "" : " empty"}" title="${e ? esc(e.name) : "Empty slot"}">${e ? e.e : i + 1}</span>`; }).join("")}<small>${eq.length} of ${SLOTS} equipped. Tap an emote to equip it or take it off.</small></div>`;
  return `<div class="eb${modal ? "" : " inline"}"${modal ? ` role="dialog" aria-label="Your emotes"` : ""}><div class="eb-top"><h3>😀 Your emotes <small>${mine.length} of ${ALL_EMOTES.length} collected</small></h3>${modal ? `<button type="button" class="c small" id="eb-close">✕</button>` : ""}</div>${bar}
    <p class="eb-day">⭐ Emote of the day: <b>${day.e} ${esc(day.name)}</b>. Use it today for 💎 ${DAY_PAY}${p.emoDay === dk(Date.now()) ? " (done ✓)" : ""}. Emotes level up with use: Bronze 10, Silver 50, Gold 150.</p>
    ${sec("Starting set", START)}${sec("Earned", EARNED)}${sec("Robe signatures", ROBE)}</div>`;
}
/** The particles an emote throws out, as markup for the Oracle's pane. */
export function emoteFxHtml(e, rnd = Math.random) {
  const n = e.fx.m === "burst" ? 10 : 8;
  return Array.from({ length: n }, (_, i) => `<i class="efx efx-${e.fx.m}" style="--i:${i};--n:${n};--x:${Math.round(rnd() * 80 - 40)}px;--d:${(i * 0.07 + rnd() * 0.1).toFixed(2)}s;--s:${(0.8 + rnd() * 0.7).toFixed(2)}">${e.fx.p[i % e.fx.p.length]}</i>`).join("");
}
