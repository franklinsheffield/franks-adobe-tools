// Coded messages hidden through Your Grimoire. Each one is a real, historical way of hiding words, written as a scrap
// in a page margin. Five can be found in any book; ten only show while the member wears a certain binding. Any of them
// can be broken at any time on the Codebreaker's page (Secrets tab), and every binding scatters its own glyphs and a
// faded sketch in the margins. Rules and markup only; main.js places them. prog.cd = broken ids, prog.cdSeen = spotted ids.
import { toRunes } from "./secrets.js";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const letters = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, "");
const words = (s) => String(s).toUpperCase().replace(/[^A-Z ]/g, "").split(/\s+/).filter(Boolean);
const shiftCh = (c, n) => A[(A.indexOf(c) + n + 26 * 10) % 26];

// ---- the methods: plain text in, coded text out ----
export const caesar = (s, n = 3) => words(s).map((w) => [...w].map((c) => shiftCh(c, n)).join("")).join(" ");
export const atbash = (s) => words(s).map((w) => [...w].map((c) => A[25 - A.indexOf(c)]).join("")).join(" ");
const MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--.." };
export const morse = (s) => words(s).map((w) => [...w].map((c) => MORSE[c].replace(/\./g, "•").replace(/-/g, "–")).join(" ")).join("  /  ");
export const a1z26 = (s) => words(s).map((w) => [...w].map((c) => A.indexOf(c) + 1).join("-")).join("  ");
export const mirror = (s) => words(s).join(" ");
const BRAILLE = "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵";
export const braille = (s) => words(s).map((w) => [...w].map((c) => BRAILLE[A.indexOf(c)]).join("")).join(" ");
export function vigenere(s, key) { const k = letters(key); let i = 0; return words(s).map((w) => [...w].map((c) => shiftCh(c, A.indexOf(k[i++ % k.length]))).join("")).join(" "); }
const SQ = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // the 5x5 square: I and J share a cell
export const polybius = (s) => words(s).map((w) => [...w.replace(/J/g, "I")].map((c) => { const i = SQ.indexOf(c); return `${Math.floor(i / 5) + 1}${(i % 5) + 1}`; }).join(" ")).join("  /  ");
const TAP = "ABCDEFGHIJLMNOPQRSTUVWXYZ"; // the prisoners' tap code: C stands in for K
export const tapCode = (s) => words(s).map((w) => [...w.replace(/K/g, "C")].map((c) => { const i = TAP.indexOf(c); return `${"•".repeat(Math.floor(i / 5) + 1)} ${"•".repeat((i % 5) + 1)}`; }).join("   ")).join("    /    ");
export function railFence(s, rails = 3) { const t = letters(s), rows = Array.from({ length: rails }, () => ""); let r = 0, d = 1; for (const c of t) { rows[r] += c; if (r === 0) d = 1; else if (r === rails - 1) d = -1; r += d; } return rows.join(" "); }
export const binary = (s) => [...String(s).toUpperCase()].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
export const hex = (s) => [...String(s).toUpperCase()].map((c) => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")).join(" ");
export function trithemius(s) { let i = 0; return words(s).map((w) => [...w].map((c) => shiftCh(c, i++)).join("")).join(" "); }
export const runes = (s) => words(s).map(toRunes).join(" · ");

/** Pigpen (the Freemasons' cipher): each letter is the shape of its cell in a grid or an X, with or without a dot. */
export function pigpenSvg(s, ink = "currentColor") {
  const ws = words(s), W = 18, gap = 10; let x = 0; const parts = [];
  for (const w of ws) { for (const c of w) { parts.push(`<g transform="translate(${x} 0)">${pigCell(c)}</g>`); x += W + 4; } x += gap; }
  return `<svg class="cd-pig" viewBox="-2 -2 ${Math.max(20, x)} 22" aria-hidden="true"><g fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round">${parts.join("")}</g></svg>`;
}
function pigCell(c) {
  const i = A.indexOf(c), dot = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="1.6" fill="currentColor" stroke="none"/>`;
  if (i < 18) { // the two grids: A-I plain, J-R dotted
    const k = i % 9, col = k % 3, row = Math.floor(k / 3), L = col > 0, R = col < 2, T = row > 0, B = row < 2;
    const d = [L && "M2 2V16", R && "M16 2V16", T && "M2 2H16", B && "M2 16H16"].filter(Boolean).join(" ");
    return `<path d="${d}"/>${i >= 9 ? dot(9, 9) : ""}`;
  }
  const j = i - 18, k = j % 4, dotted = j >= 4; // the two Xs: S-V plain, W-Z dotted (up, left, right, down)
  const v = [["M2 2L9 14L16 2", 9, 7], ["M2 2L14 9L2 16", 8, 9], ["M16 2L4 9L16 16", 10, 9], ["M2 16L9 4L16 16", 9, 11]][k];
  return `<path d="${v[0]}"/>${dotted ? dot(v[1], v[2]) : ""}`;
}

/** Every coded message. book: only visible in that binding. sec/side: where its scrap sits. how: the method, taught once spotted. */
export const CODES = [
  { id: "cd-caesar", sec: "codex", side: "left", plain: "STARS ARE SUNS FAR AWAY", m: "caesar", name: "The shifted line", pay: 20,
    how: "Caesar's shift: every letter has stepped 3 places along the alphabet (A became D). Step each one back 3." },
  { id: "cd-atbash", sec: "patterns", side: "left", plain: "COUNT BEFORE YOU BELIEVE", m: "atbash", name: "The mirrored alphabet", pay: 20,
    how: "Atbash, about 2,500 years old: the alphabet folded in half. A swaps with Z, B with Y, C with X, and so on." },
  { id: "cd-morse", sec: "journal", side: "left", plain: "LIGHT IS OLD", m: "morse", name: "Dots and dashes", pay: 20,
    how: "Morse code (1830s telegraphs): each letter is a pattern of short and long signals. E is •, T is –, A is • –, S is • • •." },
  { id: "cd-a1z26", sec: "diary", side: "right", plain: "I SEE YOU READING", m: "a1z26", name: "The counted letters", pay: 20,
    how: "Number for letter: A is 1, B is 2, all the way to Z at 26. Dashes join the letters of one word." },
  { id: "cd-mirror", sec: "secrets", side: "left", plain: "EVERY SPELL IS A TEST", m: "mirror", name: "Mirror writing", pay: 20,
    how: "Leonardo da Vinci filled notebooks with writing that runs right to left. Read it in a mirror, or just backwards." },
  { id: "cd-braille", book: "bk-velvet", sec: "journal", side: "right", plain: "THE DARK IS FULL OF STARS", m: "braille", name: "The raised dots", pay: 40,
    how: "Braille (Louis Braille, 1824): six-dot cells you can read by touch. The top row alone makes A to J; adding dots makes the rest." },
  { id: "cd-vigenere", book: "bk-brass", sec: "patterns", side: "right", plain: "MEASURE EVERYTHING TWICE", m: "vigenere", key: "GOLD", name: "The alchemist's key", pay: 40,
    how: "Vigenère (1500s): a Caesar shift that changes with every letter, following a keyword. The key is the metal every alchemist wanted to make. Shift each letter back by its key letter (A=0, B=1…)." },
  { id: "cd-polybius", book: "bk-atlas", sec: "codex", side: "right", plain: "FOLLOW THE POLE STAR", m: "polybius", name: "The star grid", pay: 40,
    how: "Polybius' square (ancient Greece): the alphabet in a 5×5 grid, I and J sharing a cell. Each pair of numbers is row, then column." },
  { id: "cd-pigpen", book: "bk-bone", sec: "diary", side: "left", plain: "NO GHOST HAS SIGNED IN", m: "pigpen", name: "The pigpen marks", pay: 40,
    how: "Pigpen, used by the Freemasons: letters sit in two noughts-and-crosses grids (the second with dots) and two Xs. Each mark is the shape of its letter's cell." },
  { id: "cd-binary", book: "bk-lab", sec: "patterns", side: "left", plain: "TEST IT", m: "binary", name: "The lab's ones and zeros", pay: 40,
    how: "Binary ASCII: computers store each character as a number, here written in base 2. 01000001 is 65, which is A; count up from there." },
  { id: "cd-trithemius", book: "bk-clock", sec: "journal", side: "left", plain: "EACH TICK MOVES ONE", m: "trithemius", name: "The ticking shift", pay: 40,
    how: "Trithemius (1508), from a book on magic: the first letter moves 0 places, the next 1, the next 2… like a gear ticking on. Step each one back." },
  { id: "cd-rail", book: "bk-prism", sec: "codex", side: "left", plain: "LIGHT SPLITS INTO COLOURS", m: "railFence", name: "The split rails", pay: 40,
    how: "Rail fence: the message zig-zags across 3 rails and is read off one rail at a time. Write the three groups on three lines and follow the zig-zag." },
  { id: "cd-tap", book: "bk-abyss", sec: "journal", side: "right", plain: "DEEP WATER HEARS", m: "tapCode", name: "Knocks on the hull", pay: 40,
    how: "Tap code, knocked through prison walls: a 5×5 square (C stands for K). The first group of knocks is the row, the second the column." },
  { id: "cd-hex", book: "bk-aurora", sec: "patterns", side: "right", plain: "SKY ON FIRE", m: "hex", name: "The shimmering numbers", pay: 40,
    how: "Hexadecimal ASCII: each character as a base-16 number (digits 0-9 then A-F). 41 is A, 42 is B… 20 is a space." },
  { id: "cd-runes", book: "bk-rune", sec: "secrets", side: "right", plain: "THE ROOTS RUN DEEP", m: "runes", name: "The deep runes", pay: 40,
    how: "Elder Futhark runes, the same alphabet as the margin cipher. One rune stands for C, K and Q." },
  { id: "cd-crown", book: "bk-crown", sec: "secrets", side: "left", plain: "YOU READ THE WHOLE BOOK", m: "vigenere", key: "CROWN", name: "The crowned cipher", pay: 60,
    how: "A Vigenère cipher again, keyed with the thing that broke the seal. Shift each letter back by its key letter (A=0, B=1…)." },
];
export const BOOK_CODES = CODES.filter((c) => c.book).length;
export const codeOf = (id) => CODES.find((c) => c.id === id);
/** The coded text (or SVG for pigpen) for a code. */
export function encode(c) {
  if (c.m === "pigpen") return pigpenSvg(c.plain);
  const f = { caesar, atbash, morse, a1z26, mirror, braille, vigenere: (s) => vigenere(s, c.key), polybius, binary, trithemius, railFence: (s) => railFence(s, 3), tapCode, hex, runes }[c.m];
  return f(c.plain);
}
const fold = (s) => letters(s).replace(/J/g, "I");
const foldRune = (s) => fold(s).replace(/[KQ]/g, "C").replace(/W/g, "V").replace(/Y/g, "I");
const foldTap = (s) => fold(s).replace(/K/g, "C");
/** Does a guess decode this code? Letters only; the methods that merge letters accept either. */
export function matches(c, guess) {
  const f = c.m === "runes" ? foldRune : c.m === "tapCode" ? foldTap : fold;
  return f(guess).length > 2 && f(guess) === f(c.plain);
}
const cdList = (p, k) => (p[k] = Array.isArray(p[k]) ? p[k] : []);
export const broken = (p, id) => cdList(p, "cd").includes(id);
/** Try a guess against every unbroken code. Returns the code it breaks (and pays once), or null. */
export function tryCode(p, guess) {
  const c = CODES.find((x) => !broken(p, x.id) && matches(x, guess)); if (!c) return null;
  cdList(p, "cd").push(c.id); p.essence = (p.essence || 0) + c.pay; return c;
}
/** Mark codes as spotted (shown on a page). Returns the ids that are new. */
export function spot(p, ids) { const s = cdList(p, "cdSeen"), fresh = ids.filter((id) => !s.includes(id)); s.push(...fresh); return fresh; }
/** The codes on this page in this binding. */
export const codesOn = (sec, bookId) => CODES.filter((c) => c.sec === sec && (!c.book || c.book === bookId));

/** A scrap of coded writing for a page margin. */
export function scrapHtml(c, esc) {
  const body = c.m === "pigpen" ? encode(c) : `<span class="cd-txt${c.m === "mirror" ? " cd-mirror" : ""}">${esc(encode(c))}</span>`;
  return `<div class="cd-scrap cm-${c.m}${c.book ? " cd-bound" : ""}" data-cd="${c.id}" style="--r:${((c.id.length * 7) % 9) - 4}deg" title="A coded message. Break it on the Codebreaker's page in the Secrets tab.">${c.book ? `<i class="cd-seal" aria-hidden="true">✦</i>` : ""}${body}</div>`;
}

// ---- each binding's own glyphs, scattered faintly through the margins ----
const VS = "︎"; // ask for the text form, not the emoji form
export const GLYPHS = {
  "bk-notebook": ["☉", "☽", "☿", "♀", "♂", "♃", "♄", "∴"],
  "bk-velvet": ["☾", "✧", "✦", "⋆", "✶", "☽", "✷", "˚"],
  "bk-brass": ["△", "▽", "⊕", "☿", "⚗" + VS, "∴", "⚖" + VS, "☉"],
  "bk-atlas": ["♈", "♌", "♐", "♉", "♍", "♑", "♊", "♎"].map((g) => g + VS),
  "bk-bone": ["⸸", "†", "‡", "⁂", "※", "☩", "✠", "∵"],
  "bk-lab": ["∫", "∑", "∂", "∇", "π", "∞", "Δ", "λ", "Ω", "⚛" + VS],
  "bk-prism": ["◆", "◇", "⬡", "△", "◯", "✦", "⬢", "◈"],
  "bk-abyss": ["≈", "∿", "◌", "°", "∘", "⌇", "≋", "⊚"],
  "bk-clock": ["◷", "◴", "◵", "◶", "⊙", "⌖", "⚙" + VS, "⏣"],
  "bk-aurora": ["∿", "≋", "✧", "⋆", "˚", "✺", "❋", "✵"],
  "bk-rune": ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᛟ", "ᛉ"],
  "bk-cipher": ["⌗", "⊞", "⊠", "#", "⚿", "⁜", "⌘", "◫"],
  "bk-archive": ["☉", "☯\uFE0E", "ᚠ", "♈\uFE0E", "☰", "∞", "✶", "⚕\uFE0E"],
  "bk-crown": ["♔", "♕", "✠", "✦", "⚜" + VS, "✧", "♛", "✶"],
};
/** A seeded scatter so a page keeps the same doodles while it is open. */
function seeded(seed) { let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); }
/** Faint glyphs and one faded sketch of the binding's emblem, for one page. */
export function glyphLayer(bookId, sec, side, sketch = "", n = 7) {
  const set = GLYPHS[bookId] || GLYPHS["bk-notebook"], r = seeded(`${bookId}|${sec}|${side}`);
  const g = Array.from({ length: n }, (_, i) => { const edge = i % 2 ? 2 + r() * 8 : 90 + r() * 7; // hug the margins
    return `<i style="left:${(side === "left" ? edge : 100 - edge).toFixed(1)}%;top:${(4 + r() * 90).toFixed(1)}%;--r:${Math.round(r() * 50 - 25)}deg;--s:${(0.8 + r() * 0.9).toFixed(2)};--d:${(r() * 6).toFixed(1)}s">${set[Math.floor(r() * set.length)]}</i>`; }).join("");
  const sk = sketch ? `<svg class="gl-sketch" style="${side === "left" ? "right" : "left"}:6%;top:${Math.round(55 + r() * 25)}%;--r:${Math.round(r() * 30 - 15)}deg" viewBox="-40 -40 80 80">${sketch}</svg>` : "";
  return `<div class="gl-layer" aria-hidden="true">${g}${sk}</div>`;
}
