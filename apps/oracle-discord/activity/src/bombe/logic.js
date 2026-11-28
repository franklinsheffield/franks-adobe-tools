// Bombe Room rules: no DOM. A real Enigma I (no plugboard, rings at A) enciphers a message. You 1) slide the crib to
// the one place where no letter sits on itself, 2) choose a wheel order and run the bombe, which really searches all
// 17,576 rotor starts for one that turns the crib into the cipher, 3) say what the German means. Wrong moves cost an hour.
import { ROTORS, REFLECTOR_B, ORDERS, MESSAGES, LEVELS, HOURS, CHOICES } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const msgOf = (id) => MESSAGES.find((m) => m.id === id);
export const orderKey = (o) => o.join("-");

// ---- the machine ----
const W = Object.fromEntries(Object.entries(ROTORS).map(([k, r]) => {
  const f = [...r.wiring].map((c) => A.indexOf(c)), b = Array(26); f.forEach((v, i) => (b[v] = i));
  return [k, { f, b, notch: A.indexOf(r.notch) }];
}));
const REF = [...REFLECTOR_B].map((c) => A.indexOf(c));
/** Step the rotors once (with the real double step of the middle rotor). pos: [left, middle, right] as 0-25. */
export function step(pos, order) {
  const M = W[order[1]], R = W[order[2]];
  if (pos[1] === M.notch) { pos[0] = (pos[0] + 1) % 26; pos[1] = (pos[1] + 1) % 26; }
  else if (pos[2] === R.notch) pos[1] = (pos[1] + 1) % 26;
  pos[2] = (pos[2] + 1) % 26;
}
const fwd = (r, c, p) => (r.f[(c + p) % 26] - p + 26) % 26, back = (r, c, p) => (r.b[(c + p) % 26] - p + 26) % 26;
/** Press one key (after stepping). c: 0-25. */
function press(c, pos, order) {
  const [L, M, R] = order.map((k) => W[k]);
  c = fwd(R, c, pos[2]); c = fwd(M, c, pos[1]); c = fwd(L, c, pos[0]); c = REF[c];
  c = back(L, c, pos[0]); c = back(M, c, pos[1]); return back(R, c, pos[2]);
}
/** Encipher (or decipher: Enigma is its own inverse) text from a start such as "AAA". */
export function enigma(text, order, start) {
  const pos = [...start].map((c) => A.indexOf(c));
  return [...text].map((ch) => { step(pos, order); return A[press(A.indexOf(ch), pos, order)]; }).join("");
}

// ---- the codebreaking ----
/** Letters where the crib, placed at offset, sits on its own cipher letter (impossible on Enigma). */
export const clashes = (cipher, crib, at) => [...crib].map((c, i) => (cipher[at + i] === c ? i : -1)).filter((i) => i >= 0);
/** The slide window: around the true offset, as far as other offsets are ruled out by a clash. */
export function window(cipher, crib, at, max = 9) {
  let lo = at, hi = at; const last = cipher.length - crib.length, ruled = (o) => clashes(cipher, crib, o).length > 0;
  while (hi - lo + 1 < max) { const l = lo - 1 >= 0 && ruled(lo - 1), r = hi + 1 <= last && ruled(hi + 1); if (!l && !r) break; if (r) hi++; if (l && hi - lo + 1 < max) lo--; }
  return [lo, hi];
}
/** The bombe: try all 17,576 starts for this wheel order; return the starts that turn the crib into the cipher. */
export function search(order, cipher, crib, at) {
  const stops = [], want = [...cipher.slice(at, at + crib.length)].map((c) => A.indexOf(c)), cr = [...crib].map((c) => A.indexOf(c));
  for (let s = 0; s < 17576; s++) {
    const st = [Math.floor(s / 676), Math.floor(s / 26) % 26, s % 26], pos = [...st];
    for (let i = 0; i < at; i++) step(pos, order);
    let ok = true; for (let i = 0; i < cr.length && ok; i++) { step(pos, order); if (press(cr[i], pos, order) !== want[i]) ok = false; }
    if (ok) stops.push(st.map((v) => A[v]).join(""));
  }
  return stops;
}

export function room(p) {
  p.rooms = p.rooms || {}; const r = (p.rooms.bombe = p.rooms.bombe || {});
  r.plays ||= 0; r.wins ||= {}; r.best ||= {}; r.read = Array.isArray(r.read) ? r.read : [];
  return r;
}
export function start(L, { seed = null, msg = null, daily = null } = {}) {
  const rand = seed == null ? Math.random : rng(seed), m = msgOf(msg) || MESSAGES[Math.floor(rand() * MESSAGES.length)];
  const order = ORDERS[Math.floor(rand() * ORDERS.length)], at = m.text.indexOf(m.crib);
  let key, cipher, lo, hi; // re-roll the key until the crib has at least 4 places to slide (all but one ruled out)
  for (let t = 0; t < 80; t++) { key = Array.from({ length: 3 }, () => A[Math.floor(rand() * 26)]).join(""); cipher = enigma(m.text, order, key); [lo, hi] = window(cipher, m.crib, at); if (hi - lo >= 3) break; }
  const orders = L.orders >= ORDERS.length ? ORDERS.map(orderKey) : shuffle([orderKey(order), ...shuffle(ORDERS.filter((o) => o !== order), rand).slice(0, L.orders - 1).map(orderKey)], rand);
  const others = shuffle(MESSAGES.filter((x) => x.en !== m.en), rand).slice(0, CHOICES - 1).map((x) => x.id);
  return { L, msg: m.id, crib: m.crib, cipher, order: orderKey(order), key, at, lo, hi, slide: at === lo ? hi : lo, orders, tried: [], stop: null,
    meanings: shuffle([m.id, ...others], rand), wrongMeaning: [], stage: "crib", hours: HOURS, misses: 0, over: false, won: false, daily, score: 0 };
}
const spend = (g) => { g.hours--; g.misses++; if (g.hours <= 0) { g.hours = 0; g.over = true; g.won = false; } };
/** Move the crib along the cipher, within the window. */
export function slide(g, d) { if (g.stage !== "crib") return g.slide; g.slide = Math.max(g.lo, Math.min(g.hi, g.slide + d)); return g.slide; }
/** Place the crib where it sits. right | wrong | lost | null */
export function place(g) {
  if (g.over || g.stage !== "crib") return null;
  if (g.slide !== g.at) { spend(g); return g.over ? "lost" : "wrong"; }
  g.stage = "bombe"; return "right";
}
/** Run the bombe on a wheel order. Returns { stops, result: stop | nostop | lost | null }. */
export function run(g, ok) {
  if (g.over || g.stage !== "bombe" || !g.orders.includes(ok) || g.tried.includes(ok)) return { stops: [], result: null };
  g.tried.push(ok); const stops = search(ok.split("-"), g.cipher, g.crib, g.at);
  if (stops.includes(g.key) && ok === g.order) { g.stop = g.key; g.stage = "read"; return { stops, result: "stop" }; }
  spend(g); return { stops, result: g.over ? "lost" : "nostop" };
}
/** The message deciphered with the found key. */
export const plain = (g) => enigma(g.cipher, g.order.split("-"), g.key);
/** Choose what the message says. right | wrong | lost | null */
export function read(g, id) {
  if (g.over || g.stage !== "read" || g.wrongMeaning.includes(id)) return null;
  if (id !== g.msg) { g.wrongMeaning.push(id); spend(g); return g.over ? "lost" : "wrong"; }
  g.over = true; g.won = true; g.score = Math.round(g.hours * 3 * g.L.mult); return "right";
}
export const perfect = (g) => g.won && g.misses === 0;
export const maxScore = (L) => Math.round(HOURS * 3 * L.mult);
export function settle(p, g) {
  const r = room(p); r.plays++;
  if (g.won) r.wins[g.L.n] = (r.wins[g.L.n] || 0) + 1;
  const best = g.score > (r.best[g.L.n] || 0); if (best) r.best[g.L.n] = g.score;
  const newMsg = g.won && !r.read.includes(g.msg); if (newMsg) r.read.push(g.msg);
  return { won: g.won, xp: g.score, essence: g.score + (newMsg ? 10 : 0), best, newMsg };
}
export function dailyOf(day = todayKey()) { const seed = dailySeed("bombe", day); return { seed, L: LEVELS[seed % 3], day }; }
export { LEVELS, A };
