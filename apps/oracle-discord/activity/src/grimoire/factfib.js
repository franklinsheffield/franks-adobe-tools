// Fact or Fib in the Herbalist's Grimoire: two true clues about a plant; everyone picks a wrong plant name as their fib
// from a short menu, then everyone hunts for the real plant. Fibs are always real plants from the same garden, so the
// lies sound right. The reveal always carries the plant's safety note. For learning only, never medical advice.
import { LEVELS } from "./logic.js";
import { pickPrompt, dealPick } from "../party/pick.js";
import { stageSvg } from "../party/scene.js";

export const PROMPTS = 5;
const lower = (s) => String(s).toLowerCase();
/** Plants whose first two clues don't name them. */
export const usable = () => LEVELS.flatMap((L) => L.deck.map((p) => ({ L, p }))).filter(({ p }) => {
  const txt = lower(p.clues[0] + " " + p.clues[1]); return ![p.name, ...(p.aliases || [])].some((a) => a.length >= 4 && txt.includes(lower(a)));
});
export function promptOf({ L, p }) {
  return pickPrompt({ id: p.id, truth: p.name, pool: L.deck.map((x) => x.name), ev: p, level: L });
}
export const promptById = (id) => { const x = usable().find(({ p }) => p.id === id); return x ? promptOf(x) : null; };
export const dealFib = (seen = {}, rand = Math.random) => dealPick(usable(), PROMPTS, seen, rand, ({ p }) => p.id).map(promptOf);

export const kit = (tableEl) => ({
  game: "factfib-grimoire", roomId: "grimoire", input: "pick",
  blurb: `${PROMPTS} real plants, two true clues each.`, hint: "Pick the wrong plant you think will fool the others.",
  deal: () => dealFib(), byId: promptById,
  draw(v, { phase, unroll, party }) { const P = v && promptById(v.prompts[v.i]); tableEl.className = "table";
    tableEl.innerHTML = stageSvg(v, { emoji: P ? P.ev.emoji : "🌿", label: "Herbalist's Grimoire", phase, unroll, party, accent: "#9fd36b", bg: ["#1d3a22", "#050d06"] }); },
  ask: (P, esc) => `<div class="ff-ask"><b>🌿 A specimen from the ${esc(P.level.name.toLowerCase())}</b><p>${esc(P.ev.clues[0])}</p><p>${esc(P.ev.clues[1])}</p><div class="ff-q">Which plant is it?</div></div>`,
  fact: (P, esc) => `<b>${P.ev.emoji} ${esc(P.ev.name)} · <i>${esc(P.ev.latin)}</i></b><br>${esc(P.ev.science)}<br><span class="note">⚠️ ${esc(P.ev.safety)}</span>`,
});
