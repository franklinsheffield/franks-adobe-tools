// The Magnum Opus: the Alchemist's House's Star Crown. Four stages named for the colours of the Great Work
// (nigredo black, albedo white, citrinitas yellow, rubedo red), each paying 🪨 5 philosopher's stones once.
// Finishing all four calls grantOpus (the Magnum Opus record + the Magister coat), sets a red stone in Vell's
// goggle and rolls the credits. Paid stages live in prog.houses.alchemist.opusStages = [stage ids].
import { levelsDone } from "./credits.js";
import { room as labRoom } from "./alchemy/logic.js";
import { grantOpus } from "./hosts/alchemist-lab.js";

/** The games in Vell's rooms (tests check this matches hosts/alchemist.js). */
export const OPUS_GAMES = ["alchemy", "duel", "grimoire", "bench", "commissions", "fireworks", "leadgold", "flametest", "minerals"];
export const STAGE_STONES = 5, CELLS_NEEDED = 60;
const lvl3 = (p) => OPUS_GAMES.filter((id) => levelsDone(p, id).includes(3)).length;
const allLv = (p) => OPUS_GAMES.filter((id) => levelsDone(p, id).length === 3).length;
/** have(p, lit) -> how far along; lit = the Lab Notebook's lit-element count (passed in so this file stays small). */
export const STAGES = [
  { id: "nigredo", name: "Nigredo", col: "#1b1b1b", ink: "#e8e8e8", e: "⚫", task: "Survive 5 lab hazards", need: 5, have: (p) => (labRoom(p).accidents || []).length,
    lore: "The blackening: matter broken down and burned to ash. Alchemists started the Work in the dark." },
  { id: "albedo", name: "Albedo", col: "#f2f2ec", ink: "#2b2b2b", e: "⚪", task: "Finish Level 3 in any 3 of Vell's games", need: 3, have: (p) => lvl3(p),
    lore: "The whitening: the ash washed clean. Writers compared it to the moon and to silver." },
  { id: "citrinitas", name: "Citrinitas", col: "#e9c43a", ink: "#2b1d00", e: "🟡", task: `Light ${CELLS_NEEDED} elements in the Lab Notebook's table`, need: CELLS_NEEDED, have: (p, lit) => lit || 0,
    lore: "The yellowing: the dawn of the solar light. Later writers often merged it into the next stage." },
  { id: "rubedo", name: "Rubedo", col: "#e3173e", ink: "#fff", e: "🔴", task: `Finish every level of all ${OPUS_GAMES.length} of Vell's games`, need: OPUS_GAMES.length, have: (p) => allLv(p),
    lore: "The reddening: the last stage, when the philosopher's stone was said to turn red." },
];
const box = (p) => { p.houses ||= {}; const h = (p.houses.alchemist ||= {}); h.opusStages = Array.isArray(h.opusStages) ? h.opusStages : []; return h; };
export const opusDone = (p) => !!(((p.houses || {}).alchemist || {}).opus);
/** Each stage in order: { ...stage, n, done, paid }. A stage counts only once the one before it is done. */
export function opusState(p, lit = 0) {
  const paid = box(p).opusStages; let open = true;
  return STAGES.map((s) => { const n = Math.min(s.need, s.have(p, lit)), locked = !open, done = open && n >= s.need; if (!done) open = false; return { ...s, n, done, locked, paid: paid.includes(s.id) }; });
}
/** Pay newly finished stages; when all four are done, grant the Opus. Returns { stones, stages: [names], finished }. */
export function claimOpus(p, lit = 0) {
  const h = box(p), out = { stones: 0, stages: [], finished: false };
  for (const s of opusState(p, lit)) if (s.done && !h.opusStages.includes(s.id)) { h.opusStages.push(s.id); out.stones += STAGE_STONES; out.stages.push(s.name); }
  if (!h.opus && STAGES.every((s) => h.opusStages.includes(s.id))) { grantOpus(p); out.finished = true; }
  return out;
}
export function opusHtml(p, esc, lit = 0) {
  const st = opusState(p, lit), done = opusDone(p);
  return `<h3 class="bk-h">🔴 The Magnum Opus</h3><div class="bk-sub">${done ? "The Great Work is finished. Vell wears the red stone." : "The Great Work, in four colours. Each stage pays 🪨 " + STAGE_STONES + "."}</div>
    <div class="op-flask" aria-hidden="true">${st.map((s, i) => `<i style="--c:${s.col};--f:${s.done ? 1 : s.locked ? 0 : s.n / s.need};--i:${i}"></i>`).join("")}</div>
    ${st.map((s, i) => `<div class="op-stage${s.done ? " done" : ""}" style="--c:${s.col};--k:${s.ink}"><b>${s.e} ${i + 1}. ${esc(s.name)}</b><span>${esc(s.task)}</span>
      <div class="op-bar"><i style="width:${s.locked ? 0 : Math.round((s.n / s.need) * 100)}%"></i></div><small>${s.locked ? "🔒 Opens after " + esc(st[i - 1].name) : `${s.n} / ${s.need}${s.done ? " ✓" : ""}`}</small><p>${esc(s.lore)}</p></div>`).join("")}
    ${done ? `<div class="op-done">🪨 The Magnum Opus record and the Magister coat are yours.</div>` : `<p class="bk-note">Finish all four for the Magnum Opus record, the Magister coat, a red stone in Vell's goggle and a credits roll.</p>`}`;
}
export const OPUS_CSS = `
.op-flask{display:flex;gap:4px;height:14px;margin:8px 0}.op-flask i{flex:1;border-radius:7px;border:1px solid #7a4f12;background:linear-gradient(90deg,var(--c) calc(var(--f)*100%),transparent 0)}
.op-stage{margin:8px 0;padding:8px 10px;border-left:4px solid var(--c);background:color-mix(in srgb,var(--c) 10%,transparent);border-radius:4px}
.op-stage b{display:block}.op-stage span{font-size:13px}.op-stage small{opacity:.75}.op-stage p{margin:4px 0 0;font-size:12px;opacity:.8}
.op-bar{height:6px;border-radius:3px;background:rgba(0,0,0,.12);margin:4px 0;overflow:hidden}.op-bar i{display:block;height:100%;background:var(--c);border:1px solid rgba(0,0,0,.4);box-sizing:border-box}
.op-stage.done{box-shadow:0 0 0 1px var(--c) inset}.op-done{padding:8px;border-radius:6px;background:#e3173e;color:#fff;font-weight:600}
`;
