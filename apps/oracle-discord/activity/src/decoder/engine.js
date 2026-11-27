// Rune and Glyph Decoder rules: no DOM here, so the tests can run it in Node.
import { SCRIPTS, LEVELS, levelsOf, byId } from "./levels.js";
import { mayaDate } from "../../../src/modules/mayan/calendar.js";

const chars = (s) => Array.from(s);
export const signOf = (script, g) => SCRIPTS[script].signs.find((s) => s.g === g) || null;

/** The glyphs of a level that are real signs (separators, the Ogham feather marks and spaces dropped). */
export function glyphsOf(level) {
  if (level.script === "maya") return level.text.map(String);
  return chars(level.text).filter((g) => signOf(level.script, g));
}
/** The sounds the player has to tap, in order. */
export const target = (level) => glyphsOf(level).map((g) => (level.script === "maya" ? g : signOf(level.script, g).v));

/** Signs the player has met in this script up to and including this level. */
export function taught(level) {
  if (level.script === "maya") return SCRIPTS.maya.signs;
  const seen = new Set();
  for (const l of levelsOf(level.script)) { for (const g of chars(l.teach || "")) seen.add(g); if (l.id === level.id) break; }
  return SCRIPTS[level.script].signs.filter((s) => seen.has(s.g));
}
/** Tiles to tap: each distinct sound met so far, in the script's own order. */
export function tiles(level) {
  const out = []; for (const s of taught(level)) if (!out.includes(s.v)) out.push(s.v);
  return out;
}

/** Compare taps so far against the answer. */
export function check(level, picks) {
  const t = target(level);
  for (let i = 0; i < picks.length; i++) if (picks[i] !== t[i]) return { ok: false, wrongAt: i, done: false };
  return { ok: true, wrongAt: -1, done: picks.length === t.length };
}
export const hint = (level, picks) => target(level)[picks.length] ?? null;

/** 3 stars: from memory. 2: peeked at the codebook or a couple of slips. 1: needed hints. */
export function starsFor({ peeks = 0, hints = 0, misses = 0 }) {
  if (hints > 0 || misses > 4) return 1;
  if (peeks > 0 || misses > 0) return 2;
  return 3;
}

/** Spell Latin letters in a script (digraphs first). Unknown characters are skipped. */
export function writeIn(script, text) {
  const w = SCRIPTS[script].write, s = String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const words = []; let cur = "";
  for (let i = 0; i < s.length; ) {
    const two = s.slice(i, i + 2);
    if (w[two]) { cur += w[two]; i += 2; continue; }
    if (w[s[i]]) cur += w[s[i]]; else if (/\s|-/.test(s[i]) && cur) { words.push(cur); cur = ""; }
    i++;
  }
  if (cur) words.push(cur);
  return words;
}

/** A Gregorian date ("YYYY-MM-DD") in the Maya calendar, or null. */
export function mayaOf(iso) {
  const m = /^(-?\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(String(iso || "").trim()); if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const r = mayaDate({ year: y, month: mo, day: d });
  return r.days < 0 ? null : r;
}

// ---- progress: kept in state.prog.rooms.decoder = { plays, solved: { levelId: stars }, codex: [titles] } ----
export const XP_PER_STAR = 5;
export const ESSENCE_PER_STAR = 5;
export const FIRST_CLEAR = 5;
export const dec = (p) => { const d = ((p.rooms ||= {}).decoder ||= {}); d.plays ||= 0; d.solved ||= {}; d.codex ||= []; return d; };

/** Score a finished level. Returns what to award; only improvements earn, so replays are free practice. */
export function complete(p, id, stars) {
  const d = dec(p), before = d.solved[id] || 0, lvl = byId(id);
  const gained = Math.max(0, stars - before), first = !before;
  d.plays++; if (stars > before) d.solved[id] = stars;
  let newCodex = null;
  if (lvl && lvl.codex && !d.codex.includes(lvl.codex)) { d.codex.push(lvl.codex); newCodex = lvl.codex; }
  return { first, stars, best: Math.max(stars, before), xp: gained * XP_PER_STAR + (first ? FIRST_CLEAR : 0), essence: gained * ESSENCE_PER_STAR + (first ? FIRST_CLEAR : 0), newCodex };
}
export const unlocked = (p, id) => { const l = byId(id), list = levelsOf(l.script), i = list.indexOf(l); return i === 0 || !!dec(p).solved[list[i - 1].id]; };
export const scriptStars = (p, script) => levelsOf(script).reduce((n, l) => n + (dec(p).solved[l.id] || 0), 0);
export const totalStars = () => LEVELS.length * 3;
