// Fact or Fib in Element Duel: an element's name and one true fact; everyone types a fake atomic number, then everyone
// hunts for the real one. Answers are whole numbers 1-118 only, so no free text reaches the room.
import { ELEMENTS, FAMILY } from "./elements.js";
import { dealPick } from "../party/pick.js";
import { stageSvg } from "../party/scene.js";

export const PROMPTS = 5;
/** Elements whose fact doesn't already give the number away. */
export const usable = () => ELEMENTS.filter((e) => !new RegExp(`\\b${e.z}\\b`).test(e.fact));
export const parseZ = (t) => { const s = String(t ?? "").trim(); if (!/^\d{1,3}$/.test(s)) return null; const z = +s; return z >= 1 && z <= 118 ? z : null; };
export function promptOf(e) {
  return { id: e.s, ev: e, truth: e.z, truthText: String(e.z), parse: parseZ, show: String, near: (v) => v === e.z,
    /** House fibs: the atomic numbers of other elements in the same family, then near neighbours. */
    house(rand = Math.random) { const out = new Set(ELEMENTS.filter((x) => x.fam === e.fam && x.z !== e.z).map((x) => x.z));
      for (let k = 0; k < 8; k++) { const z = e.z + (rand() < 0.5 ? -1 : 1) * (1 + Math.floor(rand() * 9)); if (z >= 1 && z <= 118 && z !== e.z) out.add(z); }
      const a = [...out]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; } };
}
export const promptById = (id) => { const e = ELEMENTS.find((x) => x.s === id); return e ? promptOf(e) : null; };
export const dealFib = (rand = Math.random) => dealPick(usable(), PROMPTS, {}, rand, (x) => x.s).map(promptOf);

export const kit = (tableEl) => ({
  game: "factfib-duel", roomId: "duel", input: "type",
  blurb: `${PROMPTS} real elements, their atomic numbers hidden.`,
  placeholder: "A fake atomic number, 1 to 118", hint: "Fool the others with a number that sounds right. Don't write the real one!",
  truthNear: "That's the real atomic number! Pick another fib.", badHint: "Type a whole number from 1 to 118.",
  deal: () => dealFib(), byId: promptById,
  draw(v, { phase, unroll, party }) { const P = v && promptById(v.prompts[v.i]); tableEl.className = "table";
    tableEl.innerHTML = stageSvg(v, { emoji: P ? P.ev.s : "⚛️", label: "Element Duel", phase, unroll, party, accent: "#66E0C8", bg: ["#12304a", "#030a12"] }); },
  ask: (P, esc) => `<div class="ff-ask"><b>⚛️ ${esc(P.ev.name)} (${esc(P.ev.s)})</b><p>${esc(FAMILY[P.ev.fam].name)}. ${esc(P.ev.fact)}</p><div class="ff-q">What is its atomic number (its number of protons)?</div></div>`,
  fact: (P, esc) => `<b>⚛️ ${esc(P.ev.name)} · atomic number ${P.ev.z}</b><br>Every atom of ${esc(P.ev.name.toLowerCase())} has ${P.ev.z} proton${P.ev.z === 1 ? "" : "s"} in its nucleus. ${esc(P.ev.fact)}`,
});
