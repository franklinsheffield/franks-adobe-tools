// Duel a friend: two players in the same Discord call, on the Chamber's shared tables (../net.js, server tables.mjs).
// The host's client runs the duel (logic.js friendMove) and plays side "you"; the first other player at the table plays
// side "oracle". Each player is sent only their own view (viewFor: their hand, the other hand hidden). Anyone else at
// the table is told it's full. Between friends a bench that isn't a real compound is refused, never charged.
import { EL, FAMILY, isNoble } from "./elements.js";
import { BY_ID, pretty } from "./compounds.js";
import { LEVELS, COND, GOAL, SHIELD, newGame, friendMove, viewFor, compoundOf, settle } from "./logic.js";
import { sceneSvg, powerTier, kindOf } from "./scene.js";
import { SFX } from "./sfx.js";
import { joinTable } from "../net.js";
import { cardFace } from "./cardart.js";

const sign = (o) => (o > 0 ? "+" + o : String(o));
/** A move result, made small enough to send, and seen from side `as` ("you" or "oracle" of the host's game). */
export function packOut(out, as) {
  if (!out) return null;
  const side = out.side === as ? "you" : "oracle";
  return { side, ok: !!out.ok, c: out.c ? out.c.id : null, cards: (out.cards || []).map((c) => ({ id: c.id, s: c.s })), dmg: out.dmg || 0, blocked: out.blocked || 0, power: out.power || 0, cost: out.cost || 0, isNew: !!out.isNew, recycled: out.recycled ?? null, shield: out.shield || null };
}

export async function friendDuel(ctx, { look, back }) {
  const { $, esc, say, ui, cap, state, saveProgress, showStats, award, tableEl } = ctx;
  let T = null, G = null, V = null, sel = [], gameNo = 0, settled = -1, L = LEVELS[1];
  const gone = () => state.inRoom !== "duel" || !T;
  const oppOf = (t) => (t.members.find((m) => m.id !== t.host) || {}).id || null;
  const foe = () => { if (!T) return "your friend"; const id = T.isHost() ? oppOf(T) : T.host; return id ? T.nameOf(id) : "your friend"; };
  const amPlayer = () => T && (T.isHost() || T.me.id === oppOf(T));
  function quit() { if (T) { const t = T; T = null; t.leave(); } G = null; V = null; back(); }

  cap("👥 Duel a friend"); say("Setting the table for two…");
  try { T = await joinTable("duel", state); } catch (e) { T = null; back(); return say(`The table won't set: ${e.message}`); }
  T.on("msg", ({ from, m }) => { if (gone()) return quit(); onMsg(from, m); });
  T.on("members", () => { if (gone()) return quit();
    if (G && T.isHost() && !oppOf(T)) { G = null; V = null; say(`${foe()} left the table. The duel is off.`); }
    if (!T.isHost() && V && !V.over && !T.members.some((m) => m.id === T.host)) V = null;
    paint(); });
  T.on("host", () => { if (gone()) return quit(); G = null; V = null; say("The host left, so the table is yours now. Pick a level when your friend is here."); paint(); });
  T.on("close", () => { if (state.inRoom === "duel") say("The table connection closed."); T = null; G = null; V = null; back(); });
  say(T.isHost() ? "You've set the table. When a friend in the call opens Element Duel and presses Duel a friend, pick a level." : `You sit down opposite ${foe()}.`);
  paint();

  // ---- host ----
  function start(n) { if (!T || !T.isHost() || !oppOf(T)) return; L = LEVELS[n - 1]; gameNo++; G = newGame(n, Date.now(), null, { friend: true }); sel = []; SFX.deal(7); send(null); }
  function send(out) {
    if (!T || !T.isHost() || !G) return; const opp = oppOf(T);
    if (opp) T.to([opp], { k: "st", v: viewFor(G, "oracle"), out: packOut(out, "oracle"), n: gameNo, lvl: G.level });
    show(viewFor(G, "you"), packOut(out, "you"));
  }
  function hostMove(s, mv, from) {
    const out = friendMove(G, s, mv);
    if (out.error) { if (from) T.to([from], { k: "err", e: out.error, why: out.why || "" }); else oops(out); return; }
    send(out);
  }
  // ---- messages ----
  function onMsg(from, m) {
    if (!m || typeof m !== "object") return;
    if (T.isHost()) { if (m.k === "mv" && G && from === oppOf(T)) hostMove("oracle", m.mv, from); return; }
    if (from !== T.host) return;
    if (m.k === "st") { gameNo = m.n; L = LEVELS[(m.lvl || 2) - 1]; if (V && V.round !== m.v.round) sel = []; show(m.v, m.out); }
    else if (m.k === "err") oops({ error: m.e, why: m.why });
  }
  function move(mv) { if (!V || V.turn !== "you" || V.over) return; sel = []; if (T.isHost()) hostMove("you", mv); else T.up({ k: "mv", mv }); }
  function oops(o) { say(o.error === "fizzle" ? `That bench isn't a real compound. ${o.why || ""} Between friends it costs nothing: try another mix.` : o.error); paint(); }

  // ---- drawing ----
  function show(v, out) {
    V = { ...v, foeName: foe() }; let fx = null;
    if (out && out.c && out.ok) {
      fx = { kind: "react", side: out.side, c: BY_ID[out.c], cards: out.cards, dmg: out.dmg, blocked: out.blocked, power: out.power, hit: out.dmg ? (out.side === "you" ? "oracle" : "you") : null };
      SFX.react(out.power, kindOf(fx.c), out); if (out.side === "you" && out.isNew) setTimeout(() => SFX.discover(), 1300);
      const who = out.side === "you" ? "You make" : `${foe()} makes`, c = fx.c;
      say(`${who} ${pretty(c.f)}, ${c.name}. Power ${out.power}${out.blocked ? `, ${out.blocked} blocked` : ""}${out.dmg ? `: ${out.dmg} damage.` : "."}`);
    } else if (out && out.shield) { SFX.shield(); say(`${out.side === "you" ? "You raise" : `${foe()} raises`} a ${EL[out.shield.s].name} shield (blocks ${out.shield.shield}).`); }
    else if (out && out.recycled != null) { SFX.deal(Math.max(1, out.recycled)); say(out.recycled ? `${out.side === "you" ? "You recycle" : `${foe()} recycles`} ${out.recycled} card${out.recycled === 1 ? "" : "s"}.` : `${out.side === "you" ? "You pass" : `${foe()} passes`}.`); }
    else if (!out) say(`A ${L.name} duel with ${foe()}. ${COND[V.cond].emoji} ${COND[V.cond].name}: ${COND[V.cond].rule}`);
    tableEl.className = "table duel"; tableEl.innerHTML = sceneSvg({ look: look(), g: V, fx: V.over ? { kind: V.over.winner === "you" ? "win" : "lose", draw: V.over.winner === "draw" } : fx });
    const tier = fx && powerTier(fx.power); if (tier === "big" || tier === "huge") tableEl.classList.add("du-quake", tier);
    if (fx && fx.c) $("reading-body").innerHTML = `<div class="du-page"><h3>${esc(pretty(fx.c.f))} · ${esc(fx.c.name)}</h3><div class="du-sec"><b class="h">🔬 Fact</b>${esc(fx.c.fact)}</div></div>`;
    if (V.over) end(); else paint();
  }
  const card = (c, on) => cardFace(c, esc, `data-fc="${c.id}"`, on ? "small hint" : "");
  function paint() {
    if (!T) return;
    const leave = `<div class="choices"><button class="c small" type="button" id="du-fleave">Leave the table</button></div>`;
    const wire = () => { $("du-fleave").onclick = quit; };
    if (!amPlayer()) { ui(`<div class="note">Two players are already duelling at this table (${esc(T.nameOf(T.host))} and ${esc(T.nameOf(oppOf(T)))}). Element Duel is for two.</div>${leave}`); return wire(); }
    if (!V || (!G && T.isHost())) {
      if (T.isHost()) {
        const opp = oppOf(T);
        ui(opp ? `<div class="note">${esc(T.nameOf(opp))} is at the table. Pick a level for you both:</div><div class="levels">${LEVELS.map((x) => `<button class="c level" type="button" data-fl="${x.n}"><b>${"⚛️".repeat(x.n)} ${esc(x.name)}</b><span>${esc(x.what.split(",").slice(0, 2).join(","))} · both players hold 7 cards</span></button>`).join("")}</div>${leave}`
          : `<div class="note">⏳ Waiting for a friend. In the same Discord call, they open the Chamber, then Element Duel, then 👥 Duel a friend.</div>${leave}`);
        $("ui").querySelectorAll("[data-fl]").forEach((b) => (b.onclick = () => start(+b.dataset.fl)));
      } else ui(`<div class="note">⏳ Waiting for ${esc(T.nameOf(T.host))} to pick a level.</div>${leave}`);
      return wire();
    }
    const me = V.you, mine = V.turn === "you", cards = sel.map((id) => me.hand.find((c) => c.id === id)).filter(Boolean);
    const made = cards.length ? compoundOf(cards, L) : null, lone = cards.length === 1 && isNoble(cards[0].s);
    const stats = `<div class="du-stats"><span>Round <b>${V.round}</b></span><span>🛡 You <b>${me.hp}</b>${me.shield ? ` (+${me.shield})` : ""}</span><span>👤 ${esc(foe())} <b>${V.oracle.hp}</b>${V.oracle.shield ? ` (+${V.oracle.shield})` : ""}</span><span>◆ <b>${me.found.length}</b> vs ${V.oracle.found.length} of ${GOAL}</span></div>
      <div class="du-cond-line">${COND[V.cond].emoji} <b>${esc(COND[V.cond].name)}</b>: ${esc(COND[V.cond].rule)} · ★ bonus ${esc(pretty(BY_ID[V.bonus].f))}</div>`;
    if (!mine) { ui(`${stats}<div class="note">⏳ ${esc(foe())} is thinking…</div><div class="du-hand">${me.hand.map((c) => card(c, false)).join("")}</div>${leave}`); $("ui").querySelectorAll("[data-fc]").forEach((b) => (b.disabled = true)); return wire(); }
    const n = Math.min(cards.length, L.recycle);
    ui(`${stats}<div class="du-bench">${cards.length ? cards.map((c) => card(c, true)).join("") + `<span class="formula${made ? " ok" : ""}">${made ? `${esc(pretty(made.f))} ✓ ${esc(made.name)}` : "not a compound yet"}</span>` : `<span class="empty">Your turn. Tap cards to put them on the bench.</span>`}</div>
      <div class="du-hand">${me.hand.filter((c) => !sel.includes(c.id)).map((c) => card(c, false)).join("")}</div>
      <div class="choices">${lone && !me.shieldUsed ? `<button class="c main" type="button" id="du-fsh">🛡 Raise ${esc(EL[cards[0].s].name)} shield (blocks ${SHIELD * (V.cond === "argon" ? 2 : 1)})</button>` : `<button class="c main" type="button" id="du-frx" ${made ? "" : "disabled"}>⚗️ React</button>`}
        <button class="c" type="button" id="du-frc">${cards.length ? `♻ Recycle ${n} &amp; end turn` : "⏭ Pass turn"}</button></div>
      <div class="note">Tap a bench card to take it back. Between friends, React only lights up for a real compound.</div>${leave}`);
    $("ui").querySelectorAll("[data-fc]").forEach((b) => (b.onclick = () => { const id = +b.dataset.fc, i = sel.indexOf(id); if (i >= 0) { sel.splice(i, 1); SFX.unplace(); } else { sel.push(id); SFX.place(sel.length - 1); } paint(); }));
    if ($("du-frx")) $("du-frx").onclick = () => move({ a: "react", ids: [...sel] });
    if ($("du-fsh")) $("du-fsh").onclick = () => move({ a: "shield", id: sel[0] });
    $("du-frc").onclick = () => move({ a: "recycle", ids: sel.slice(0, L.recycle) });
    wire();
  }
  function end() {
    const won = V.over.winner === "you", draw_ = V.over.winner === "draw";
    won ? SFX.win() : SFX.lose();
    let line = "";
    if (settled !== gameNo) { settled = gameNo; const r = settle(state.prog, V); const xp = Math.ceil(r.xp / 2), es = Math.ceil(r.essence / 2); award(xp, es); saveProgress(); showStats();
      line = `+${xp} ✦${es ? ` · +${es} 💎` : ""}${r.newCodex.length ? ` · 📒 new in your Codex: ${r.newCodex.map((id) => esc(pretty(id))).join(", ")}` : ""}`; }
    const how = { stability: won ? `${foe()}'s Stability hits zero.` : "Your Stability hits zero.", discovery: won ? `You discovered ${GOAL} compounds first.` : `${foe()} discovered ${GOAL} compounds first.`, time: "Thirty rounds: the higher Stability takes it." }[V.over.how];
    say(draw_ ? "A perfect stalemate between friends." : `${how} ${won ? "You win the duel!" : `${foe()} wins this one.`}`);
    ui(`<div class="reward">${line ? `<div><b>${line}</b></div>` : ""}<div class="note">Friend duels pay half the usual points, and your discoveries still go in your Codex.</div></div>
      <div class="choices">${T && T.isHost() ? `<button class="c main" type="button" id="du-fagain">⚛️ Rematch (${esc(L.name)})</button><button class="c" type="button" id="du-flvl">📜 Another level</button>` : `<span class="note">⏳ ${esc(foe())} can start a rematch.</span>`}<button class="c small" type="button" id="du-fleave">Leave the table</button></div>`);
    if ($("du-fagain")) $("du-fagain").onclick = () => start(L.n);
    if ($("du-flvl")) $("du-flvl").onclick = () => { G = null; V = null; paint(); };
    $("du-fleave").onclick = quit;
  }
}
