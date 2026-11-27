// Fact or Fib in the Case Files: a real claim of the supernatural; everyone picks a wrong method as their fib from a
// short menu of real fraud methods, then everyone hunts for the method that was really behind it. The reveal gives
// the evidence that exposed it. Cases and methods come from data.js (read only).
import { CASES, METHODS, method } from "./data.js";
import { pickPrompt, dealPick } from "../party/pick.js";
import { stageSvg } from "../party/scene.js";

export const PROMPTS = 5;
export const usable = () => CASES.filter((c) => method(c.method));
export const promptOf = (c) => pickPrompt({ id: c.id, truth: method(c.method).name, pool: METHODS.map((m) => m.name), ev: c, how: method(c.method).how });
export const promptById = (id) => { const c = usable().find((x) => x.id === id); return c ? promptOf(c) : null; };
export const dealFib = (seen = {}, rand = Math.random) => dealPick(usable(), PROMPTS, seen, rand).map(promptOf);

export const kit = (tableEl, seen = {}) => ({
  game: "factfib-cases", roomId: "casefiles", input: "pick",
  blurb: `${PROMPTS} real cases of the supernatural, each with a documented method behind it.`, hint: "Pick the wrong method you think will fool the others.",
  deal: () => dealFib(seen), byId: promptById,
  draw(v, { phase, unroll, party }) { const P = v && promptById(v.prompts[v.i]); tableEl.className = "table";
    tableEl.innerHTML = stageSvg(v, { emoji: P ? P.ev.emoji : "🗝️", label: "The Case Files", phase, unroll, party, accent: "#E2B04A", bg: ["#3a1430", "#0d0309"] }); },
  ask: (P, esc) => `<div class="ff-ask"><b>${P.ev.emoji} ${esc(P.ev.name)}</b> <span class="note">${esc(P.ev.place)}, ${P.ev.year} · ${esc(P.ev.who)}</span><p>${esc(P.ev.scene)}</p><div class="ff-q">How was it really done?</div></div>`,
  fact: (P, esc) => `<b>${P.ev.emoji} ${esc(P.ev.name)}: ${esc(P.truth)}</b><br>${esc(P.how)}${P.ev.ev.record ? `<br>${esc(P.ev.ev.record)}` : P.ev.ev.control ? `<br>${esc(P.ev.ev.control)}` : ""}<br><span class="note">Exposed by ${esc(P.ev.by)}.</span>`,
});
