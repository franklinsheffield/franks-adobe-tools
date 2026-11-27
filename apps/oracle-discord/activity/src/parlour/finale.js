// The Final Séance (the Parlour's Star Crown). Houdini and Bess agreed that a true message would be "Rosabelle,
// believe", sent in the word code of their old stage act. You earn the 7 letters B-E-L-I-E-V-E one milestone at a
// time, each shown as its code words; then you decode the message yourself. It is a code puzzle, not a contact.
// prog.houses.parlour.finale = { done: bool, at }.
import { room as cfRoom } from "../casefiles/logic.js";
import { room as wsRoom } from "../workshop/logic.js";
import { room as bkRoom } from "../bookings/logic.js";
import { billingOf } from "../bookings/bill.js";
import { room as mtRoom } from "../mentalist/logic.js";
import { room as phRoom } from "../phantasmagoria/logic.js";
import { pairsDone } from "./gallery.js";
import { CODE } from "../mentalist/data.js";

export const MESSAGE = "BELIEVE";
/** A letter in the Houdinis' code: A-J are one word (Pray..Be quick); later letters are their number in two words. */
export function encodeLetter(ch) {
  const n = ch.toUpperCase().charCodeAt(0) - 64; if (n < 1 || n > 26) return [];
  if (n <= 10) return [CODE[n - 1][0]];
  return String(n).split("").map((d) => CODE[(+d || 10) - 1][0]);
}
export function decodeWords(words) {
  const nums = words.map((w) => (CODE.find(([k]) => k.toLowerCase() === String(w).toLowerCase()) || [])[1]); if (nums.some((n) => !n)) return null;
  const n = nums.length === 1 ? nums[0] : +nums.map((x) => x % 10).join(""); return n >= 1 && n <= 26 ? String.fromCharCode(64 + n) : null;
}
const trophyPerfect = (p, id, lv) => !!(((p.trophies || {})[id] || {}).perfect || {})[lv];
/** The 7 milestones, one per letter, in order. */
export const MILESTONES = [
  { ch: "B", name: "Solve 10 cases in the Case Files", ok: (p) => cfRoom(p).solved.length >= 10 },
  { ch: "E", name: "Learn 10 tricks in the Workshop", ok: (p) => wsRoom(p).rep.length >= 10 },
  { ch: "L", name: "Reach Top of the Bill in Bookings", ok: (p) => billingOf(bkRoom(p).shows).n >= 2 },
  { ch: "I", name: "A perfect Level 3 Dark Séance", ok: (p) => trophyPerfect(p, "darkseance", 3) },
  { ch: "E", name: "Win a Level 2 Mentalist show (the code)", ok: (p) => (mtRoom(p).wins[2] || 0) > 0 },
  { ch: "V", name: "Win a Level 3 Phantasmagoria show", ok: (p) => (phRoom(p).wins[3] || 0) > 0 },
  { ch: "E", name: "Finish 5 pairs in the Rogues' Gallery", ok: (p) => pairsDone(p) >= 5 },
];
export const lettersEarned = (p) => MILESTONES.map((m) => m.ok(p));
export const allEarned = (p) => lettersEarned(p).every(Boolean);
const box = (p) => { p.houses = p.houses && typeof p.houses === "object" ? p.houses : {}; const h = (p.houses.parlour ||= {}); h.finale ||= { done: false }; return h.finale; };
export const finaleDone = (p) => box(p).done;
export const CROWN_PAY = { gem: 300, keys: 5 };
/** Try a decoded answer. Returns "locked" | "wrong" | "solved" | "already". Solving pays once and sets the crown. */
export function solveFinale(p, answer, at = Date.now()) {
  const b = box(p); if (b.done) return "already"; if (!allEarned(p)) return "locked";
  if (String(answer || "").replace(/[^a-z]/gi, "").toUpperCase() !== MESSAGE) return "wrong";
  b.done = true; b.at = at; p.essence = (p.essence || 0) + CROWN_PAY.gem; return "solved";
}
/** The credits for the Parlour's crown: real people behind the House, a fact each. */
export const CURTAIN_CALL = [
  ["Harry Houdini (1874-1926)", "Escape artist who spent his last years exposing fake mediums."],
  ["Bess Houdini (1876-1943)", "Held a séance for him every Halloween for ten years, then said ten years was long enough to wait."],
  ["John Nevil Maskelyne (1839-1917)", "Copied the Davenports' cabinet act to show it was a trick."],
  ["Michael Faraday (1791-1867)", "Showed in 1853 that sitters pushed their own tables."],
  ["Harry Price (1881-1948)", "Caught a spirit photographer with secretly marked plates."],
  ["James Randi (1928-2020)", "Magician who tested psychic claims for over fifty years."],
  ["Bertram Forer (1914-2000)", "Showed in 1948 why vague readings feel personal."],
  ["Étienne-Gaspard Robertson (1763-1837)", "Filled Paris with lantern ghosts from 1798."],
  ["John Henry Pepper (1821-1900)", "Put a ghost on a London stage with a sheet of glass in 1862."],
];
