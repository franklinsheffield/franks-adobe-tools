// House music (Frank 2026-11-27): every House has up to 25 records from the brand map, an opening song (its "main shop
// song", the most on-brand record) that plays first whenever the app opens in that House, a record crate paid in that
// House's own tokens, and hidden "cross-brand" records borrowed from another House. Hidden records are found three ways:
//   find  - poke the right things in the House's scene (data-tap hotspots), in the right order
//   task  - finish something real in the game (checked like every other task record)
//   wrong - pay for a crate record in ANOTHER House's tokens while you hold enough of this House's own
// Data and rules only (no audio, no DOM), so the tests can check it. house-records.gen.js is built from BRAND-MAP.csv.
import { RECORDS } from "./house-records.gen.js";
import { LIBRARY } from "./soundtracks.js";
import { tierOf } from "../trophies.js";

const H = (p, h) => (((p && p.houses) || {})[h] || {});
const visit = (h) => (p) => !!H(p, h).day;
const rounds = (h, n) => (p) => (H(p, h).rounds || 0) >= n;
const lvl3 = (h) => (p) => (H(p, h).lv || []).some((k) => /-3$/.test(k));

export const HOUSE_NAMES = { oracle: "the Oracle's Chamber", alchemist: "the Alchemist's House", observatory: "the Observatory", parlour: "the Séance Parlour", scriptorium: "the Scriptorium", pixelscape: "Pixel Scape" };
/** Each House's token (hosts/*.js token.emoji, checked by the tests). Pixel Scape records are sold for Essence. */
export const TOKEN_EMOJI = { oracle: "🌙", alchemist: "🪨", observatory: "☄️", parlour: "🗝️", scriptorium: "📜" };
/** Sleeve colours and icon for House records: [label, ink, icon]. */
export const SLEEVE = { oracle: ["#E2B04A", "#2a1606", "🔮"], alchemist: ["#C88A3A", "#fff1c4", "⚗️"], observatory: ["#8FB8FF", "#0B1530", "🔭"],
  parlour: ["#C3A6FF", "#2A0F24", "🕯️"], scriptorium: ["#E8483B", "#F1E4C6", "🪶"], pixelscape: ["#5CF2FF", "#05040C", "🛰️"] };
/** Regular records take turns: one unlocks by rounds played in the House, the next is sold in its crate. */
export const ROUND_STEPS = [3, 6, 10, 15, 20, 30, 40, 50, 65, 80, 100, 125];
export const CRATE_PRICES = [2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 10];
/** Pixel Scape records live on the Satellite Jukebox shelf in the Store, for Essence. */
export const PIXEL_PRICES = [100, 120, 140, 160, 180, 200, 220, 250];

// ---- hidden cross-brand records: id -> how it is found. hint is a riddle in the House's crate, never the answer. ----
let lastTap = "", dark = false;
export const HIDDEN = {
  // Séance Parlour
  "midnight-cruiser": { kind: "find", hint: "Put the candle out. Something in the spirit cabinet only plays in the dark.",
    on: (k, d) => k === "tap" && d.tap === "cabinet" && dark, line: "Music, from inside the cabinet. In the dark, of course. That's where mediums kept all their best effects." },
  "a-cup-of-tea": { kind: "task", hint: "Madame Rook takes tea with regulars: ten sittings in her Parlour, and three readings in the Chamber.",
    test: (p) => (H(p, "parlour").rounds || 0) >= 10 && (p.readings || 0) >= 3 },
  "chilly-bells": { kind: "wrong", pay: "observatory", hint: "Rook is paid in keys. A pocket of comet shards rings like little bells, though, if you'd rather pay with those." },
  "wednesday-night-funk-fusion": { kind: "task", hint: "Vell and Rook have a standing Wednesday night. Beat a Level 3 game in both of their Houses.",
    test: (p) => lvl3("alchemist")(p) && lvl3("parlour")(p) },
  // Scriptorium
  "calm6-innocence": { kind: "find", hint: "Open the book on the desk, then turn to a page.",
    on: (k, d) => k === "tap" && d.tap === "page" && lastTap === "book", line: "A quiet tune, tucked into the book. Monks often wrote music into the margins of other texts." },
  "another-august": { kind: "task", hint: "The copying season is long. Sit at Wren's desk fifty times.", test: rounds("scriptorium", 50) },
  "calm-ambient-3-lifewave-2k": { kind: "wrong", pay: "observatory", hint: "Wren is paid in scrolls. But she has always wanted a comet shard, and never says so." },
  "champ-de-tournesol": { kind: "find", hint: "The margin has its own little garden. Visit the snail, then the worm.",
    on: (k, d) => k === "tap" && d.tap === "worm" && lastTap === "snail", line: "A field of sunflowers, drawn small. Medieval margins are full of gardens, snails and worms." },
  "annas-song-part-1": { kind: "task", hint: "Earn the first key at the Cipher Desk.", test: (p) => tierOf(p, "cipherdesk") >= 1 },
  "fouler-lhorizon": { kind: "wrong", pay: "oracle", hint: "Wren takes scrolls. Offer her moonlight instead, when you could have paid in scrolls, and see what she plays." },
  frets: { kind: "find", hint: "The little figure in the margin is holding something with strings. Tap it until it plays.",
    on: (k, d) => k === "tap" && d.tap === "drollery" && d.count >= 3, line: "It plays! Drolleries, the doodles in medieval margins, often show animals playing lutes and harps." },
};

const lib = new Map(LIBRARY.flatMap((L) => L.tracks).map((t) => [t.id, t]));
const houses = [...new Set(RECORDS.map((r) => r.house))];

/** Every House record (not the Chamber's 16, which stay in music.js TRACKS), with its unlock. */
export const HOUSE_TRACKS = [];
/** The opening song of each House. */
export const OPENER = {};
for (const house of houses) {
  let k = 0, px = 0;
  for (const r of RECORDS.filter((x) => x.house === house)) {
    if (r.opener) OPENER[house] = r.id;
    if (r.live) continue; // already in music.js TRACKS
    const [label, ink, icon] = SLEEVE[house] || SLEEVE.oracle, L = lib.get(r.id) || {};
    const t = { id: r.id, title: r.title, house, label: L.label || label, ink: L.ink || ink, icon: L.icon || icon, credit: r.credit || "", licence: r.licence || "", from: r.from || "", role: r.role };
    const hid = r.role === "hidden" ? HIDDEN[r.id] : null;
    if (hid) Object.assign(t, hid.kind === "task" ? { how: "task", task: hid.hint, test: hid.test } : { how: "hidden" }, { hidden: hid.kind, hint: hid.hint }, hid.pay ? { pay: hid.pay } : {});
    else if (r.opener) Object.assign(t, house === "pixelscape" ? { how: "start", note: "Pixel Scape's opening song. Yours from the start." } : { how: "task", task: `Visit ${HOUSE_NAMES[house]}`, test: visit(house) }, { opener: true });
    else if (L.test) Object.assign(t, { how: "task", task: L.task, test: L.test });
    else if (house === "pixelscape") Object.assign(t, { how: "shop", price: PIXEL_PRICES[Math.min(px++, PIXEL_PRICES.length - 1)], note: "From the Satellite Jukebox" });
    else if (house !== "oracle" && k % 2 === 0) { const n = ROUND_STEPS[Math.min(k++ >> 1, ROUND_STEPS.length - 1)]; Object.assign(t, { how: "task", task: `Play ${n} rounds in ${HOUSE_NAMES[house]}`, test: rounds(house, n) }); }
    else { const i = house === "oracle" ? k++ : k++ >> 1; Object.assign(t, { how: "crate", price: CRATE_PRICES[Math.min(i, CRATE_PRICES.length - 1)] }); }
    HOUSE_TRACKS.push(t);
  }
}
const got = (p) => ((p.music ||= {}).got ||= []);
const list = (p) => ((p.music ||= {}).list ||= []);
/** Give a record (saved in music.got, and onto the playlist). Returns true if it is new. */
export function grantRecord(p, t) { if (!t || got(p).includes(t.id)) return false; got(p).push(t.id); if (!list(p).includes(t.id)) list(p).push(t.id); return true; }
/** A House's crate: its records for sale, plus its hidden ones (shown as riddles until found). */
export const crateOf = (house) => HOUSE_TRACKS.filter((t) => t.house === house && (t.how === "crate" || t.hidden));

/** Scene events (the same ones House secrets get): returns the hidden "find" records found just now. */
export function musicEvent(p, house, kind, data = {}) {
  const fresh = [];
  for (const t of HOUSE_TRACKS) { const h = HIDDEN[t.id]; if (t.house !== house || !h || h.kind !== "find" || got(p).includes(t.id)) continue; let ok = false; try { ok = h.on(kind, data); } catch {} if (ok && grantRecord(p, t)) fresh.push({ t, line: h.line }); }
  if (kind === "tap") { if (data.tap === "bgcandle") dark = !dark; lastTap = data.tap; }
  return fresh;
}
/** Reset the scene memory (a new House or a test). */
export function resetMusicEvents() { lastTap = ""; dark = false; }

/** Buy a crate record. wallet = { left(houseId), spend(houseId, n) }; pay = the House whose tokens you pay with.
 *  Returns null (unknown, owned, hidden or too dear) or { t, bonus: [hidden records unlocked by paying the "wrong" way] }. */
export function buyRecord(p, id, pay, wallet) {
  const t = HOUSE_TRACKS.find((x) => x.id === id); if (!t || t.how !== "crate" || got(p).includes(t.id) || !TOKEN_EMOJI[pay]) return null;
  if (wallet.left(pay) < t.price) return null;
  const homeEnough = pay !== t.house && wallet.left(t.house) >= t.price;
  wallet.spend(pay, t.price); grantRecord(p, t);
  const bonus = homeEnough ? HOUSE_TRACKS.filter((x) => x.house === t.house && x.hidden === "wrong" && x.pay === pay && grantRecord(p, x)) : [];
  return { t, bonus };
}
