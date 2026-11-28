// Fact or Fib in the History of Magic: a true event with its year hidden; everyone types a fake year, then everyone
// hunts for the real one. The shared party screen is ../party/factfib-ui.js; prompts are in factfib.js. The room's own
// ribbon is the stage: every revealed event is pinned at its true year.
import { EVENTS, ERAS } from "./events.js";
import { SANDS } from "./logic.js";
import { openFactFib as openParty } from "../party/factfib-ui.js";
import { dealFib, promptById, PROMPTS } from "./factfib.js";

/** The ribbon behind the round: every revealed event pinned at its true year. */
export function runOf(st) {
  const done = st ? st.prompts.slice(0, st.phase === "write" || st.phase === "vote" ? st.i : st.i + 1) : [];
  const line = done.map((id) => EVENTS.find((e) => e.id === id)).filter(Boolean).sort((a, b) => a.year - b.year);
  return { eras: ERAS.map((e) => e.id), line, sands: SANDS };
}

export const kit = (draw) => ({
  game: "factfib", roomId: "timeline", input: "type",
  blurb: `${PROMPTS} real events from the history of magic, their years hidden.`,
  placeholder: "A fake year, e.g. 1650 or 200 BCE", hint: "Fool the others with a year that sounds right. Don't write the real one!",
  truthNear: "Too close to the real year! Pick another fib.", badHint: "Type a year, like 1848 or 300 BCE.",
  deal: (prog) => dealFib((prog.rooms && prog.rooms.timeline && prog.rooms.timeline.cards) || {}),
  byId: promptById,
  draw(v, { phase, unroll, party }) { const e = v && promptById(v.prompts[v.i]).ev;
    draw(runOf(v), phase === "write" || phase === "vote" ? { hand: e, unroll } : phase === "lobby" ? { unroll } : { hi: e.id, party }); },
  ask: (P, esc) => `<div class="ff-ask"><b>${P.ev.emoji} ${esc(P.ev.title)}</b><p>${esc(P.ev.what)}</p><div class="ff-q">In what year did this happen?</div></div>`,
  fact: (P, esc) => `<b>${P.ev.emoji} ${esc(P.ev.title)} · ${esc(P.ev.when)}</b><br>${esc(P.ev.fact)}`,
});

export function openFactFib(ctx, { draw, onBack }) { return openParty(ctx, kit(draw), onBack); }
