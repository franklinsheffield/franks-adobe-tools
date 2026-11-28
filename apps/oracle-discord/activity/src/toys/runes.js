// Name in runes (a Scriptorium toy): your name in the Elder Futhark, in Ogham and in an insular uncial hand.
// Pure data and rules; drawing in toys/scriptorium.js. Runes and Ogham are drawn as SVG strokes (no font needed),
// so the quill can ink them stroke by stroke. Every mapping follows the real scripts:
//   Elder Futhark: 24 runes (about AD 150-800). No letters for C, Q, V, X or Y; K, KW, W, KS and J/I stand in.
//   Runic carvers usually wrote a doubled letter once, so "Anna" is carved ANA.
//   Ogham: 20 letters (feda) in four groups (aicmí) of 1-5 strokes on a stem line, Primitive Irish, about AD 300-600.
//   The F letter (fearn) was first a W sound. Ogham's first 20 letters have no P (a later extra letter, peith, was
//   added for it), so P is written with B here, and the toy says so.

/** Elder Futhark: [Latin value, Unicode rune, rune name, strokes in a 10 x 24 box]. */
export const FUTHARK = [
  ["f", "ᚠ", "fehu", "M3 0V24M3 9L9 3M3 15L9 9"],
  ["u", "ᚢ", "ūruz", "M2 24V0L9 9V24"],
  ["th", "ᚦ", "þurisaz", "M3 0V24M3 7L9 12L3 17"],
  ["a", "ᚨ", "ansuz", "M3 0V24M3 2L9 7M3 8L9 13"],
  ["r", "ᚱ", "raidō", "M2 24V0L8 6L2 12L9 24"],
  ["k", "ᚲ", "kaunan", "M8 5L2 11L8 17"],
  ["g", "ᚷ", "gebō", "M1 3L9 21M9 3L1 21"],
  ["w", "ᚹ", "wunjō", "M2 24V0L8 6L2 12"],
  ["h", "ᚺ", "hagalaz", "M2 0V24M8 0V24M2 8L8 14"],
  ["n", "ᚾ", "naudiz", "M5 0V24M2 9L8 15"],
  ["i", "ᛁ", "īsaz", "M5 0V24"],
  ["j", "ᛃ", "jēra", "M5 3L1 8L5 13M5 11L9 16L5 21"],
  ["ï", "ᛇ", "īwaz", "M5 0V24M5 0L9 4M5 24L1 20"],
  ["p", "ᛈ", "perþ", "M2 0V24M2 1L8 6L6 10M2 23L8 18L6 14"],
  ["z", "ᛉ", "algiz", "M5 24V0M5 9L1 3M5 9L9 3"],
  ["s", "ᛊ", "sōwilō", "M7 0L2 8L8 16L3 24"],
  ["t", "ᛏ", "tīwaz", "M5 24V0M1 6L5 0L9 6"],
  ["b", "ᛒ", "berkanan", "M2 0V24M2 0L8 6L2 12L8 18L2 24"],
  ["e", "ᛖ", "ehwaz", "M1 24V0L5 8L9 0V24"],
  ["m", "ᛗ", "mannaz", "M1 24V0L9 10M9 24V0L1 10"],
  ["l", "ᛚ", "laguz", "M3 24V0L9 6"],
  ["ng", "ᛜ", "ingwaz", "M5 6L9 12L5 18L1 12Z"],
  ["d", "ᛞ", "dagaz", "M1 0V24M9 0V24M1 0L9 24M9 0L1 24"],
  ["o", "ᛟ", "ōþila", "M1 24L9 9L5 2L1 9L9 24"],
];
const FU = Object.fromEntries(FUTHARK.map(([v, ch, name, d]) => [v, { v, ch, name, d }]));

/** Ogham: [Latin value, Unicode letter, letter name, group 0-3, strokes 1-5]. */
export const OGHAM = [
  ["b", "ᚁ", "beith", 0, 1], ["l", "ᚂ", "luis", 0, 2], ["f", "ᚃ", "fearn", 0, 3], ["s", "ᚄ", "sail", 0, 4], ["n", "ᚅ", "nion", 0, 5],
  ["h", "ᚆ", "uath", 1, 1], ["d", "ᚇ", "dair", 1, 2], ["t", "ᚈ", "tinne", 1, 3], ["c", "ᚉ", "coll", 1, 4], ["q", "ᚊ", "ceirt", 1, 5],
  ["m", "ᚋ", "muin", 2, 1], ["g", "ᚌ", "gort", 2, 2], ["ng", "ᚍ", "ngéadal", 2, 3], ["z", "ᚎ", "straif", 2, 4], ["r", "ᚏ", "ruis", 2, 5],
  ["a", "ᚐ", "ailm", 3, 1], ["o", "ᚑ", "onn", 3, 2], ["u", "ᚒ", "úr", 3, 3], ["e", "ᚓ", "eadhadh", 3, 4], ["i", "ᚔ", "iodhadh", 3, 5],
];
const OG = Object.fromEntries(OGHAM.map(([v, ch, name, g, n]) => [v, { v, ch, name, g, n }]));
export const OGHAM_GROUPS = ["aicme beithe (strokes on one side)", "aicme húatha (strokes on the other side)", "aicme muine (slanted strokes across)", "aicme ailme (notches on the line: the vowels)"];

/** Clean a typed name: letters and spaces only, accents folded (é -> e), at most 24 letters. */
export function cleanName(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/æ/gi, "ae").replace(/ø/gi, "o").replace(/ß/g, "ss").replace(/þ/gi, "th").replace(/ð/gi, "th")
    .replace(/[^a-z ]/gi, "").replace(/\s+/g, " ").trim().slice(0, 24);
}

/** A word to Futhark values: ["a","n","a"], plus notes on each swap made. */
export function toFuthark(word) {
  const w = cleanName(word).toLowerCase(), out = [], notes = new Set();
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n = w[i + 1];
    if (c === " ") { out.push(" "); continue; }
    if (c === "t" && n === "h") { out.push("th"); i++; continue; }
    if (c === "n" && n === "g") { out.push("ng"); i++; continue; }
    if (c === "p" && n === "h") { out.push("f"); i++; notes.add("PH is written with fehu, F."); continue; }
    if (c === "c" && n === "k") { out.push("k"); i++; continue; }
    if (c === "q") { out.push("k"); if (n === "u") { out.push("w"); i++; } notes.add("The futhark has no Q: QU is K + W."); continue; }
    if (c === "c") { out.push(n && "eiy".includes(n) ? "s" : "k"); notes.add("The futhark has no C: a hard C is kaunan (K), a soft C is sōwilō (S)."); continue; }
    if (c === "x") { out.push("k", "s"); notes.add("The futhark has no X: it is K + S."); continue; }
    if (c === "v") { out.push("w"); notes.add("The futhark has no V: wunjō (W) is the nearest."); continue; }
    if (c === "y") { out.push(out.length && out[out.length - 1] !== " " ? "i" : "j"); notes.add("The futhark has no Y: jēra (J) or īsaz (I) stand in."); continue; }
    out.push(FU[c] ? c : "i");
  }
  // runic carvers usually wrote a doubled letter once
  const carved = out.filter((v, i) => v === " " || v !== out[i - 1]);
  if (carved.length < out.length) notes.add("Runic carvers usually wrote a doubled letter once, so I have too.");
  return { runes: carved, notes: [...notes] };
}

/** A word to Ogham values, plus notes. */
export function toOgham(word) {
  const w = cleanName(word).toLowerCase(), out = [], notes = new Set();
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n = w[i + 1];
    if (c === " ") { out.push(" "); continue; }
    if (c === "n" && n === "g") { out.push("ng"); i++; continue; }
    if (c === "k") { out.push("c"); continue; }
    if (c === "w" || c === "v") { out.push("f"); notes.add("Ogham's F letter, fearn, was first a W sound, so W and V use it."); continue; }
    if (c === "p") { out.push("b"); notes.add("Ogham's first 20 letters have no P (a later extra letter was added for it), so P is written with B."); continue; }
    if (c === "x") { out.push("c", "s"); continue; }
    if (c === "y" || c === "j") { out.push("i"); notes.add("Ogham has no J or Y: I stands in."); continue; }
    out.push(OG[c] ? c : "i");
  }
  return { letters: out, notes: [...notes] };
}

export const futharkText = (vals) => vals.map((v) => (v === " " ? "᛫" : FU[v].ch)).join("");
export const oghamText = (vals) => "᚛" + vals.map((v) => (v === " " ? " " : OG[v].ch)).join("") + "᚜";
export const runeOf = (v) => FU[v] || null;
export const oghamOf = (v) => OG[v] || null;

/** Ogham strokes for one letter on a horizontal stem at y = 0, in a box `w` wide. Returns path data. */
export function oghamPath(v, w = 16) {
  const L = OG[v]; if (!L) return "";
  const gap = w / (L.n + 1), xs = Array.from({ length: L.n }, (_, k) => (gap * (k + 1)).toFixed(1));
  if (L.g === 0) return xs.map((x) => `M${x} 0V-12`).join("");          // beith group: one side of the stem
  if (L.g === 1) return xs.map((x) => `M${x} 0V12`).join("");           // húath group: the other side
  if (L.g === 2) return xs.map((x) => `M${+x - 4} 12L${+x + 4} -12`).join(""); // muin group: slanted, across
  return xs.map((x) => `M${x} -3V3`).join("");                         // ailm group: notches on the line
}
export const oghamWidth = (v) => (v === " " ? 10 : Math.max(16, OG[v].n * 6 + 6));

/** The seal's letter: the first rune of the name. */
export const sealRune = (name) => { const r = toFuthark(name).runes.find((v) => v !== " "); return r ? FU[r] : FU.o; };

/** Lines for the channel post (Discord shows the Unicode runes and Ogham). */
export function shareLines(name) {
  const f = toFuthark(name), o = toOgham(name);
  return [`ᚠ Elder Futhark: ${futharkText(f.runes)}`, `  (${f.runes.map((v) => (v === " " ? "·" : FU[v].name)).join(" ")})`, `᚛ Ogham: ${oghamText(o.letters)}`, `✒️ Uncial hand: ${cleanName(name)}`, "Sealed by Archivist Wren, the Scriptorium."];
}
