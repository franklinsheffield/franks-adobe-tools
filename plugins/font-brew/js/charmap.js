"use strict";
// ======================================================================
// Layer name -> character. Frank's rule: the layer name IS the character.
//   "A", "a", "7", "?"            -> that character
//   "uni0041", "U+0041", "u0041"  -> code point
//   "space", "period", "comma"... -> PostScript / AGL glyph names
//   "A copy", "A copy 2", "A 2"   -> Photoshop duplicate suffixes ignored
//   "AV", "f_f"                   -> ligature (phase 2), reported, not mapped
// No Photoshop calls in here.
// ======================================================================

const NAMED = {
  space: " ", exclam: "!", quotedbl: "\"", numbersign: "#", dollar: "$", percent: "%", ampersand: "&",
  quotesingle: "'", parenleft: "(", parenright: ")", asterisk: "*", plus: "+", comma: ",", hyphen: "-",
  period: ".", slash: "/", colon: ":", semicolon: ";", less: "<", equal: "=", greater: ">", question: "?",
  at: "@", bracketleft: "[", backslash: "\\", bracketright: "]", asciicircum: "^", underscore: "_",
  grave: "`", braceleft: "{", bar: "|", braceright: "}", asciitilde: "~",
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  quoteleft: "‘", quoteright: "’", quotedblleft: "“", quotedblright: "”",
  endash: "–", emdash: "—", ellipsis: "…", bullet: "•", copyright: "©",
  registered: "®", trademark: "™", degree: "°", euro: "€", sterling: "£",
  heart: "♥", star: "★"
};
const REV = {};
Object.keys(NAMED).forEach((k) => { if (!REV[NAMED[k]]) REV[NAMED[k]] = k; });

function cleanName(name) {
  let s = String(name == null ? "" : name);
  s = s.replace(/\s+copy(\s+\d+)?$/i, "");           // Photoshop "A copy 2"
  if (s.trim().length > 1) s = s.replace(/\s+\d+$/, ""); // "A 2" (but keep "1")
  if (s.length > 1) s = s.trim();
  return s;
}

// -> { kind:"char", ch } | { kind:"lig", seq } | { kind:"none" }
function parseLayerName(name) {
  const s = cleanName(name);
  if (!s) return { kind: "none" };
  const cps = Array.from(s);
  if (cps.length === 1) return { kind: "char", ch: s };
  let m = /^(?:uni|u\+|u)([0-9a-f]{4,6})$/i.exec(s);
  if (m) { const cp = parseInt(m[1], 16); if (cp > 0 && cp <= 0x10FFFF) return { kind: "char", ch: String.fromCodePoint(cp) }; }
  const low = s.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(NAMED, low)) return { kind: "char", ch: NAMED[low] };
  if (/^\S+_\S+$/.test(s)) return { kind: "lig", seq: s.split("_").map((p) => parseLayerName(p)).every((x) => x.kind === "char") ? s.split("_").map((p) => parseLayerName(p).ch).join("") : s };
  if (cps.length <= 4 && !/\s/.test(s)) return { kind: "lig", seq: s };
  return { kind: "none" };
}

// PostScript glyph name for a character (AGL where it exists, else uniXXXX).
function glyphName(ch) {
  const cp = ch.codePointAt(0);
  if (/^[A-Za-z]$/.test(ch)) return ch;
  if (REV[ch]) return REV[ch];
  return cp > 0xFFFF ? "u" + cp.toString(16).toUpperCase() : "uni" + cp.toString(16).toUpperCase().padStart(4, "0");
}

// The glyph grid: the standard sets plus anything the user adds.
const SETS = [
  { name: "Uppercase", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { name: "Lowercase", chars: "abcdefghijklmnopqrstuvwxyz" },
  { name: "Figures", chars: "0123456789" },
  { name: "Punctuation", chars: ".,:;!?'\"-()&@#$%*/+=" }
];

module.exports = { parseLayerName, glyphName, cleanName, SETS, NAMED };
