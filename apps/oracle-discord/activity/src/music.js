// The Chamber's music: Frank's 16 soundtracks, kept as records in the Trophy Case's record player.
// One record is yours from the start, 12 are unlocked by finishing tasks, 3 are sold in the Essence store.
// The four themed records (Nordic, Coin Drop, Arcade Alley, Jade) unlock in ways that match their names.
// Don't Judge a Space Kid is the end-credits song (credits.js); its record unlocks when every game is finished.
// The two "hero" tracks are battle music: they take over in the rooms where you play against the Oracle.
// This file is data and rules only (no audio), so the tests can check it. player.js plays the music and draws the UI.
import { tierOf } from "./trophies.js";
import { LIBRARY } from "./hosts/soundtracks.js";

/** Every record. how: "start" (yours from the start), "task" (test(p) says when it unlocks) or "shop" (price in Essence).
 *  label/ink colour the record's centre label and sleeve; icon sits on both. */
export const TRACKS = [
  { id: "ember-menu", title: "Ember Menu", icon: "🔥", label: "#e2542b", ink: "#ffd9a8", how: "start", note: "The Chamber's own tune. Yours from the start." },
  { id: "pixel-and-pennywhistle", title: "Pixel and Pennywhistle", icon: "🪈", label: "#4fb36a", ink: "#eaffd8", how: "task", task: "Finish your first reading", test: (p) => (p.readings || 0) >= 1 },
  { id: "arcade-groove", title: "Arcade Groove", icon: "🕹️", label: "#ff4fb3", ink: "#ffe3f3", how: "task", task: "Visit the Chamber 3 days in a row", test: (p) => Math.max(p.best || 0, p.streak || 0) >= 3 },
  { id: "the-occurrence", title: "The Occurrence", icon: "👻", label: "#7fc8ff", ink: "#eaf6ff", how: "task", task: "Earn the Spirit Bell in the Séance", test: (p) => tierOf(p, "seance") >= 1 },
  { id: "the-cults-secret", title: "The Cult's Secret", icon: "🗝️", label: "#6b3fa0", ink: "#efe0ff", how: "task", task: "Earn the Rune Tablet in the Decoder", test: (p) => tierOf(p, "decoder") >= 1 },
  { id: "dreamy-game-over", title: "Dreamy Game Over", icon: "💤", label: "#5b6fb8", ink: "#e3e8ff", how: "task", task: "Lose a game to the Oracle", test: (p) => !!(p.music && p.music.lost) },
  { id: "high-score-hero", title: "High Score Hero", icon: "⚔️", label: "#E2B04A", ink: "#2a1606", hero: true, how: "task", task: "Win an Element Duel at Level 1", test: (p) => tierOf(p, "duel") >= 1 },
  { id: "arcade-heros-theme", title: "Arcade Hero's Theme", icon: "🛡️", label: "#c0392b", ink: "#ffe9d6", hero: true, how: "task", task: "Win Constellation Rummy at Level 1", test: (p) => tierOf(p, "rummy") >= 1 },
  { id: "the-curiosity-shop", title: "The Curiosity Shop", icon: "🏺", label: "#8a5a2b", ink: "#fbeedd", how: "shop", price: 150, note: "A wander through dusty shelves" },
  { id: "nile-arcade-dreams", title: "Nile Arcade Dreams", icon: "🐫", label: "#1f8a8a", ink: "#e0fffb", how: "shop", price: 200, note: "Desert sunsets on a tiny screen" },
  { id: "dont-judge-a-space-kid", title: "Don't Judge a Space Kid", icon: "🚀", label: "#1b2a6b", ink: "#dfe9ff", how: "task", task: "Finish every game on every level", test: (p) => !!(p.credits && p.credits.done), credits: true },
  { id: "the-nordic-trading-post", title: "The Nordic Trading Post", icon: "ᚱ", label: "#3a5a7a", ink: "#e3f0ff", how: "task", task: "Crack the runic margin cipher in Your Grimoire", test: (p) => (p.gs || []).includes("cipher") },
  { id: "coin-drop-groove", title: "Coin Drop Groove", icon: "🪙", label: "#c8901e", ink: "#2a1606", how: "task", task: "Save up 💎1,000 Essence at once", test: (p) => (p.essence || 0) >= 1000 },
  { id: "arcade-alley", title: "Arcade Alley", icon: "👾", label: "#7a2ee0", ink: "#f0e3ff", how: "task", task: "Play any daily challenge 3 days in a row", test: (p) => Object.values(p.daily || {}).some((r) => (r && r.best) >= 3) },
  { id: "jade-cartridge-shop", title: "Jade Cartridge Shop", icon: "🐉", label: "#1f8a5a", ink: "#e0fff0", how: "task", task: "Open a mystery box in the store", test: (p) => (p.boxes || 0) >= 1 },
  { id: "pixel-shaman", title: "Pixel Shaman", icon: "🪶", label: "#2e7d32", ink: "#e8ffe3", how: "shop", price: 250, note: "Drums, chants and chiptune smoke" },
];
/** House records whose audio is in (hosts/soundtracks.js HAVE). Unlocked by their House task; they play on the same record player. */
export const HOUSE_TRACKS = LIBRARY.flatMap((L) => L.tracks.filter((t) => t.file && t.test));
/** Every playable record: the Chamber's 16, then the House records. (credits.js keeps to TRACKS, the Chamber's own.) */
export const ALL_TRACKS = [...TRACKS, ...HOUSE_TRACKS];
export const STARTER = "ember-menu";
/** Rooms where you play against the Oracle: hero tracks take over there (if you own any). */
export const BATTLE_ROOMS = ["duel", "rummy"];
/** The store's id for a record sold on the Records shelf. */
export const shopId = (t) => "rec-" + t.id;
export const trackOf = (id) => ALL_TRACKS.find((t) => t.id === id || shopId(t) === id) || null;
export const fileOf = (t) => `music/${t.id}.mp3`;

/** The music settings in the member's progress (created on first use). on/vol: the always-there switch and volume. */
export function musicOf(p) {
  const m = (p.music ||= {});
  if (typeof m.on !== "boolean") m.on = true;
  if (typeof m.vol !== "number") m.vol = 0.45;
  if (!Array.isArray(m.got)) m.got = [STARTER];
  if (!Array.isArray(m.list)) m.list = [STARTER];
  return m;
}
/** Does the member own this record? */
export function hasTrack(p, t) {
  if (!t) return false;
  if (t.how === "start") return true;
  if (t.how === "shop") return (p.owned || []).includes(shopId(t)) || musicOf(p).got.includes(t.id);
  return musicOf(p).got.includes(t.id);
}
/** Check every task record; returns the ones unlocked just now (they are saved into music.got). */
export function checkUnlocks(p) {
  const m = musicOf(p), fresh = [];
  for (const t of ALL_TRACKS) if (t.how === "task" && !m.got.includes(t.id)) { let ok = false; try { ok = t.test(p); } catch {} if (ok) { m.got.push(t.id); fresh.push(t); } }
  for (const t of fresh) if (!t.hero && !m.list.includes(t.id)) m.list.push(t.id); // new records join the playlist (hero tracks stay for battles unless you add them)
  return fresh;
}
/** The playlist, cleaned: only owned records, in your order. Empty means nothing to play. */
export const playlist = (p) => musicOf(p).list.filter((id) => hasTrack(p, trackOf(id)));
/** Add or take out a record. Returns true if it is now in the playlist. */
export function togglePlaylist(p, id) {
  const m = musicOf(p), t = trackOf(id); if (!hasTrack(p, t)) return false;
  const i = m.list.indexOf(t.id); if (i >= 0) { m.list.splice(i, 1); return false; } m.list.push(t.id); return true;
}
/** Move a record up (-1) or down (+1) the playlist. */
export function moveInPlaylist(p, id, d) {
  const L = musicOf(p).list, i = L.indexOf(id), j = i + d; if (i < 0 || j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]];
}
/** Battle music for a room: the hero tracks you own, or null (keep your playlist). */
export const battleList = (p, roomId) => (BATTLE_ROOMS.includes(roomId) ? TRACKS.filter((t) => t.hero && hasTrack(p, t)).map((t) => t.id) : null);
/** The next index in an endless loop. */
export const nextIndex = (i, n, d = 1) => (n ? (((i + d) % n) + n) % n : 0);

/** The Records shelf in the Essence store (store.js registerShelf). Buying a record adds it to your playlist. */
export const recordShop = {
  kind: "record",
  label: "🎵 Records",
  items: TRACKS.filter((t) => t.how === "shop").map((t) => ({ id: shopId(t), name: t.title, note: t.note, price: t.price })),
  talk: {
    open: ["Records for the Chamber's player. Music for the soul, and for the waiting.", "Put a record on. The spirits dance better with a beat."],
    tryon: ["Have a listen: {item}. Lovely, isn't it?", "{item}. I hum this one when nobody's asking questions."],
    buy: ["{item} is yours. It's on your playlist now, and in the record player.", "Sold! {item} joins your collection. Find it in the Trophy Case."],
  },
};
