// Fact or Fib in Star Lore: how to find a real constellation in the sky; everyone picks a wrong constellation as their
// fib from a short menu, then everyone hunts for the real one. The reveal names one of its fables and where it's told.
import { DECK } from "./lore.js";
import { pickPrompt, dealPick } from "../party/pick.js";
import { stageSvg } from "../party/scene.js";

export const PROMPTS = 5;
const lower = (s) => String(s).toLowerCase();
/** Constellations whose finding note doesn't name them. */
const stems = (name) => lower(name).split(/[^a-zö]+/).filter((w) => w.length >= 3 && w !== "the").map((w) => w.slice(0, 6));
export const usable = () => DECK.filter((g) => g.find && !stems(g.name).some((w) => new RegExp(`(^|[^a-z])${w}`).test(lower(g.find))));
export const promptOf = (g) => pickPrompt({ id: g.id, truth: g.name, pool: DECK.map((x) => x.name), ev: g });
export const promptById = (id) => { const g = usable().find((x) => x.id === id); return g ? promptOf(g) : null; };
export const dealFib = (rand = Math.random) => dealPick(usable(), PROMPTS, {}, rand).map(promptOf);

export const kit = (tableEl) => ({
  game: "factfib-stars", roomId: "stars", input: "pick",
  blurb: `${PROMPTS} real constellations, described the way you'd find them in the sky.`, hint: "Pick the wrong constellation you think will fool the others.",
  deal: () => dealFib(), byId: promptById,
  draw(v, { phase, unroll, party }) { const P = v && promptById(v.prompts[v.i]); tableEl.className = "table";
    tableEl.innerHTML = stageSvg(v, { emoji: P ? P.ev.emoji : "✨", label: "Star Lore", phase, unroll, party, accent: "#8FB8FF", bg: ["#16244f", "#03061a"] }); },
  ask: (P, esc) => `<div class="ff-ask"><b>✨ A figure in the sky</b><p>${esc(P.ev.find)}</p><div class="ff-q">Which constellation is it?</div></div>`,
  fact: (P, esc) => { const f = (P.ev.fables || [])[0];
    return `<b>${P.ev.emoji} ${esc(P.ev.name)}</b>${f ? `<br>One of its stories: “${esc(f.t)}”, told in ${esc(f.c)}.` : ""}`; },
});
