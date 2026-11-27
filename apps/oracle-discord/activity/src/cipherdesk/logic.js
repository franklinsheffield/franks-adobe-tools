// Cipher Desk rules: no DOM. A round deals ROUND documents; each starts with INK drops. Naming the wrong method, a
// wrong key or a wrong forgery clue costs a drop; reading a forgery as genuine cracks Wren's seal (all drops lost).
// The Caesar wheel and al-Kindi's letter count are free tools. Score = drops left × level multiplier.
import { METHODS, LINES, KEYWORDS, INSCRIPTIONS, FORGERIES, LEVELS, ROUND, INK, CHOICES, TOTAL_DOCS, methodOf } from "./data.js";
import { caesar, atbash, a1z26, morse, braille, polybius, tapCode, railFence, binary, hex, vigenere, trithemius, runes } from "../codes.js";
import { foundScripts } from "../inscriptions/logic.js";
import { dailySeed, todayKey } from "../daily.js";

export const WIN_AT = 3, FORGERY_BONUS = 2, INS_PAY = { xp: 10, essence: 15 };
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const lineOf = (id) => LINES.find((l) => l.id === id);
export const forgeryOf = (id) => FORGERIES.find((f) => f.id === id);
export const insOf = (id) => INSCRIPTIONS.find((x) => x.id === id);

export function room(p) {
  p.rooms = p.rooms || {}; const r = (p.rooms.cipherdesk = p.rooms.cipherdesk || {});
  r.plays ||= 0; r.wins ||= {}; r.best ||= {}; r.read = Array.isArray(r.read) ? r.read : []; r.ins = Array.isArray(r.ins) ? r.ins : [];
  return r;
}
/** Documents read so far (lines, forgeries caught, inscriptions), out of TOTAL_DOCS. */
export const readCount = (p) => { const r = room(p); return r.read.length + r.ins.length; };
export { TOTAL_DOCS };

// ---- the methods: encode for the desk, and the decoders the keyed tools use ----
export function encode(m, plain, key) {
  switch (m) {
    case "caesar3": return caesar(plain, 3);
    case "caesar": return caesar(plain, key);
    case "atbash": return atbash(plain);
    case "a1z26": return a1z26(plain);
    case "morse": return morse(plain);
    case "mirror": return plain;
    case "braille": return braille(plain);
    case "polybius": return polybius(plain);
    case "tap": return tapCode(plain);
    case "rails": return railFence(plain, 3);
    case "pigpen": return plain; // drawn as pigpen cells by the scene
    case "binary": return binary(plain.replace(/ /g, "_")).replace(/01011111/g, "·");
    case "hex": return hex(plain.replace(/ /g, "_")).replace(/5F/g, "·");
    case "vigenere": return vigenere(plain, key);
    case "trithemius": return trithemius(plain);
    case "runes": return runes(plain);
    default: return plain;
  }
}
/** Undo a shift on letters (spaces kept). */
export const unshift = (s, n) => [...s].map((c) => (A.includes(c) ? A[(A.indexOf(c) - n + 26 * 10) % 26] : c)).join("");
export function unvigenere(s, key) { const k = key.toUpperCase(); let i = 0; return [...s].map((c) => (A.includes(c) ? A[(A.indexOf(c) - A.indexOf(k[i++ % k.length]) + 260) % 26] : c)).join(""); }
/** Al-Kindi's tool: the commonest letters of a cipher text with their counts. */
export function letterCount(s, n = 5) { const c = {}; for (const ch of String(s).toUpperCase()) if (A.includes(ch)) c[ch] = (c[ch] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n); }

// ---- dealing ----
const methodsFor = (n) => METHODS.filter((m) => m.lvl <= n);
function dealLine(line, L, rand) {
  const pool = methodsFor(L.n), fixed = line.m && methodOf(line.m).lvl <= L.n ? line.m : null;
  const from = rand() < 0.65 ? pool.filter((x) => x.lvl === L.n) : pool, m = fixed || from[Math.floor(rand() * from.length)].id;
  let key = null, kws = null;
  if (m === "caesar") { key = 1 + Math.floor(rand() * 24); if (key >= 3) key++; } // 1..25, never 3 (that is the Caesar3 tool)
  if (m === "vigenere") { kws = shuffle(KEYWORDS, rand).slice(0, 3); key = kws[Math.floor(rand() * 3)]; }
  const others = shuffle(pool.map((x) => x.id).filter((x) => x !== m), rand).slice(0, CHOICES - 1);
  return { kind: "line", id: line.id, m, key, kws, choices: shuffle([m, ...others], rand), drops: INK, tried: [], stage: "method", right: false, done: false, shift: 0 };
}
function dealForgery(f, rand) {
  return { kind: "forgery", id: f.id, clues: shuffle([f.clue, ...f.wrong], rand), drops: INK, tried: [], stage: "judge", right: false, done: false };
}
export function deal(L, rand = Math.random) {
  const lines = shuffle(LINES.filter((l) => l.level === L.n), rand).slice(0, L.forgery ? ROUND - 1 : ROUND).map((l) => dealLine(l, L, rand));
  if (L.forgery) lines.splice(Math.floor(rand() * ROUND), 0, dealForgery(FORGERIES[Math.floor(rand() * FORGERIES.length)], rand));
  return lines;
}
export function start(L, { seed = null, daily = null } = {}) {
  const rand = seed == null ? Math.random : rng(seed);
  return { L, items: deal(L, rand), i: 0, score: 0, daily };
}
export const current = (run) => run.items[run.i];
export const cipherText = (it) => encode(it.m, lineOf(it.id).plain, it.key);
const spend = (it) => { it.drops = Math.max(0, it.drops - 1); if (!it.drops) it.done = true; return it.drops ? "wrong" : "out"; };
const solve = (run, it, bonus = 0) => { it.right = true; it.done = true; run.score += Math.round((it.drops + bonus) * run.L.mult); return "right"; };

/** Name the method. Returns right | key (method right, now set the key) | wrong | out. */
export function tryMethod(run, m) {
  const it = current(run); if (it.done || it.stage !== "method" || it.tried.includes(m)) return null;
  if (m !== it.m) { it.tried.push(m); return spend(it); }
  if (it.m === "caesar" || it.m === "vigenere") { it.stage = "key"; return "key"; }
  return solve(run, it);
}
/** Free: turn the Caesar wheel and look. */
export const preview = (it, shift) => unshift(cipherText(it), shift);
/** Commit a key: a shift for "caesar", a keyword for "vigenere". */
export function tryKey(run, k) {
  const it = current(run); if (it.done || it.stage !== "key") return null;
  const ok = it.m === "caesar" ? +k === it.key : String(k) === it.key;
  if (ok) return solve(run, it);
  if (it.m === "vigenere") it.tried.push(String(k));
  return spend(it);
}
/** Forgeries: judge genuine (the seal cracks) or flag it, then name the clue. */
export function judge(run, verdict) {
  const it = current(run); if (it.kind !== "forgery" || it.stage !== "judge") return null;
  if (verdict === "genuine") { it.drops = 0; it.done = true; return "cracked"; }
  it.stage = "clue"; return "flagged";
}
export function tryClue(run, i) {
  const it = current(run); if (it.kind !== "forgery" || it.stage !== "clue" || it.tried.includes(i)) return null;
  if (it.clues[i] === forgeryOf(it.id).clue) return solve(run, it, FORGERY_BONUS);
  it.tried.push(i); return spend(it);
}
export const next = (run) => (++run.i < run.items.length);
export const rightCount = (run) => run.items.filter((x) => x.right).length;
export const won = (run) => rightCount(run) >= WIN_AT;
export const perfect = (run) => run.items.every((x) => x.right && !x.tried.length);
export const maxScore = (L) => Math.round((ROUND * INK + (L.forgery ? FORGERY_BONUS : 0)) * L.mult);

/** Bank a finished round. Returns { won, xp, essence, best, newRead }. */
export function settle(p, run) {
  const r = room(p), w = won(run), L = run.L; r.plays++;
  if (w) r.wins[L.n] = (r.wins[L.n] || 0) + 1;
  const best = run.score > (r.best[L.n] || 0); if (best) r.best[L.n] = run.score;
  const newRead = [];
  for (const it of run.items) if (it.right) { const key = it.kind === "forgery" ? "f:" + it.id : it.id; if (!r.read.includes(key)) { r.read.push(key); newRead.push(it); } }
  return { won: w, xp: run.score, essence: run.score + newRead.length * 2, best, newRead };
}

// ---- inscriptions: open once the Inscription Tray has filed their script ----
export const unlocked = (p, ins) => foundScripts(p).includes(ins.need);
export const insRead = (p, id) => room(p).ins.includes(id);
/** The three meanings, in a stable order per inscription. */
export const meaningsOf = (ins) => shuffle([ins.meaning, ...ins.wrong], rng(ins.id.length * 97 + ins.id.charCodeAt(0)));
/** Answer an inscription. Returns { ok, pay } (pay only on the first right answer). */
export function readIns(p, id, meaning) {
  const ins = insOf(id); if (!ins || !unlocked(p, ins)) return { ok: false, pay: null };
  const ok = meaning === ins.meaning; if (!ok || insRead(p, id)) return { ok, pay: null };
  room(p).ins.push(id); return { ok, pay: INS_PAY };
}

export function dailyOf(day = todayKey()) { const seed = dailySeed("cipherdesk", day); return { seed, L: LEVELS[seed % 3], day }; }
export { LEVELS };
