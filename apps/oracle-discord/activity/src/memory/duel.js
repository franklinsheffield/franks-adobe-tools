// Grimoire Memory duel: two players in a Discord call share one board (net.js tables; the host's client runs the
// rules in engine.js and deals out a view after every move). Anyone else at the table watches.
// Messages: up {t:"flip", i} | {t:"deal", deck} (guest asks the host to deal); host -> all {t:"view", v} | {t:"lobby", deck}.
import { DECKS, deckById, cardByKey } from "./deck.js";
import { room as mem, duelNew, duelFlip, duelPass, duelWinner, duelView, duelWho, DUEL_TIER } from "./engine.js";
import { joinTable, canJoin } from "../net.js";
import { backOf, backStyle, backHtml, sparkHtml, flourishOf } from "./shop.js";
import { SFX } from "./sfx.js";

export { canJoin };

/** Open the duel table. back() returns to the room's lobby. faceHtml(card, side, esc, mixed) and symHtml come from room.js. */
export async function openDuel(ctx, { back, faceHtml, symHtml }) {
  const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, award, tableEl } = ctx;
  clearReading(); cap("⚔️ Memory duel");
  ui(`<div class="note">Finding the table…</div>`);
  let t;
  try { t = await joinTable("memory", state); } catch (e) {
    say("No one to duel here yet. Start the Activity in a voice call, and a friend can join you.");
    ui(`<div class="note">${esc(e.message || "Couldn't reach the table.")}</div><div class="choices"><button class="c" type="button" id="gm-dback">↩ Back to Grimoire Memory</button></div>`);
    $("gm-dback").onclick = back; return;
  }
  let d = null, deck = "mixed", passTimer = null, shown = null, closed = false, live = false;
  const me = () => t.me.id, name = (id) => (id === me() ? "You" : t.nameOf(id));
  const leave = () => { closed = true; clearTimeout(passTimer); t.leave(); back(); };

  // ---- host side ----
  const broadcast = () => { const v = duelView(d); t.to("*", { t: "view", v }); t.snap(d); show(v); };
  const hostDeal = (deckId) => {
    if (t.members.length < 2) return;
    d = duelNew(deckById(deckId), t.members.map((m) => m.id)); broadcast();
  };
  const hostFlip = (who, i) => {
    if (!d) return; const r = duelFlip(d, who, i); if (r === "ignored") return;
    broadcast();
    if (r === "miss") passTimer = setTimeout(() => { duelPass(d); broadcast(); }, 1100);
  };
  const hostMsg = ({ from, m }) => { if (!t.isHost() || !m) return;
    if (m.t === "flip") hostFlip(from, +m.i);
    else if (m.t === "deal" && (!d || d.g.done)) { deck = DECKS.some((x) => x.id === m.deck) ? m.deck : deck; hostDeal(deck); } };

  // ---- everyone: drawing ----
  const look = backOf(state.prog);
  function lobbyView() {
    const n = t.members.length; cap("⚔️ Memory duel");
    say(n < 2 ? "Waiting for a challenger… Anyone in this call who opens Grimoire Memory can sit down." : `${t.members.map((m) => name(m.id)).join(" and ")} at the table. Pick a deck and deal.`);
    tableEl.className = "table gm-table"; tableEl.innerHTML = `<div class="gm-show"><div class="gm-trophy">⚔️</div><b>Memory duel</b><small>${n} at the table · ${DUEL_TIER.pairs} pairs · a pair and you go again</small></div>`;
    ui(`<div class="gm-daily"><b>⚔️ Memory duel</b> · ${t.members.map((m) => `${esc(name(m.id))}${m.id === t.host ? " (host)" : ""}`).join(" · ")}
      <div class="note">Take turns turning two cards. Find a pair and you score and go again; miss and it's their turn. Most pairs wins. The first two at the table play; anyone else watches.</div></div>
      <div class="gm-decks">${DECKS.map((D) => `<button class="c${D.id === deck ? " main" : ""}" type="button" data-dd="${D.id}" ${n < 2 ? "disabled" : ""}><b>${D.emoji} ${esc(D.name)}</b></button>`).join("")}</div>
      <div class="choices"><button class="c" type="button" id="gm-dleave">✕ Leave the table</button></div>`);
    $("ui").querySelectorAll("[data-dd]").forEach((b) => (b.onclick = () => { deck = b.dataset.dd; if (t.isHost()) hostDeal(deck); else t.up({ t: "deal", deck }); }));
    $("gm-dleave").onclick = leave;
  }

  let built = null; // the deck + seats the board was built for
  function show(v) {
    if (closed) return;
    live = !v.done; if (!v.done) finish.paid = false;
    const D = deckById(v.deck), mixed = D.id === "mixed", sig = v.id + v.deck + v.seats.join();
    const playing = v.seats.includes(me()), mine = duelWho({ seats: v.seats, turn: v.turn }) === me();
    if (built !== sig || !$("gm-board")) {
      built = sig; shown = v.cards.map(() => false);
      cap(`⚔️ ${D.emoji} ${D.name} · duel`);
      ui(`<div class="gm-bar"><div class="gm-top" id="gm-top"></div><div class="gm-tools"><button class="c small" type="button" id="gm-dleave">✕ Leave</button></div></div>
        <div class="gm-board" id="gm-board" style="--cols:${DUEL_TIER.cols};--cols-sm:${DUEL_TIER.colsSm}">${v.cards.map((x) =>
          `<button class="gm-card" type="button" data-i="${x.i}" style="--i:${x.i};${backStyle(look)}" aria-label="Face-down card"><div class="gm-in"><div class="gm-back">${backHtml(look)}</div></div></button>`).join("")}</div>`);
      $("gm-dleave").onclick = leave; SFX.deal(v.cards.length);
      $("gm-board").onclick = (e) => { const b = e.target.closest(".gm-card"); if (!b) return; const i = +b.dataset.i;
        if (t.isHost()) hostFlip(me(), i); else t.up({ t: "flip", i }); };
    }
    let flipped = false;
    for (const x of v.cards) {
      const el = $("gm-board").querySelector(`[data-i="${x.i}"]`);
      if (x.key && !shown[x.i]) { el.querySelector(".gm-in").insertAdjacentHTML("beforeend", faceHtml(cardByKey(x.key), x.side, esc, mixed)); shown[x.i] = true; }
      if (x.up && !el.classList.contains("up")) flipped = true;
      el.classList.toggle("up", !!(x.up || x.done)); el.classList.toggle("done", !!x.done); el.classList.toggle("miss", !!(v.wait && x.up && !x.done));
    }
    const [a, b] = v.seats;
    $("gm-top").innerHTML = v.seats.map((id, k) => `<span${k === v.turn && !v.done ? ' class="gm-combo"' : ""}>${k === v.turn && !v.done ? "▶ " : ""}${esc(name(id))} <b>${v.score[id]}</b></span>`).join("") + `<span>pairs left <b>${v.pairs - v.found.length}</b></span>`;
    // table: the pairs found, coloured by who found them
    tableEl.className = "table gm-table play";
    tableEl.innerHTML = `<div class="gm-tbl"><div class="gm-tbl-h">${esc(name(a))} ${v.score[a]} · ${v.score[b]} ${esc(name(b))}</div><div class="gm-slots" style="--n:${v.pairs}">${Array.from({ length: v.pairs }, (_, i) => { const key = v.found[i];
      if (!key) return `<div class="gm-slot"></div>`; const c = cardByKey(key); return `<div class="gm-slot got${v.last && v.last.key === key && i === v.found.length - 1 ? " new" : ""}"><span class="gm-sym">${symHtml(c, 34, esc)}</span><b>${esc(c.name)}</b></div>`; }).join("")}</div></div>
      ${v.last && v.last.key === v.found[v.found.length - 1] && v.found.length !== (show.n || 0) ? sparkHtml(flourishOf(state.prog), 10) : ""}`;
    const fresh = v.found.length !== (show.n || 0); show.n = v.found.length;
    if (fresh && v.last) { const c = cardByKey(v.last.key); setTimeout(() => SFX.match(1), 150); say(`${v.last.who === me() ? "A pair! Go again." : `${t.nameOf(v.last.who)} finds a pair.`} ${c.fact}`); }
    else if (v.wait) { SFX.miss(); say(mine ? "No pair. Their turn next." : `No pair. ${playing ? "Your turn next." : ""}`); }
    else if (flipped) SFX.flip();
    else if (!v.done) say(mine ? "Your turn: turn two cards." : playing ? `${t.nameOf(duelWho({ seats: v.seats, turn: v.turn }))} is choosing…` : "You're watching this duel.");
    if (v.done) finish(v);
  }

  function finish(v) {
    const win = duelWinner({ seats: v.seats, score: v.score }), playing = v.seats.includes(me());
    SFX.win();
    let line = win === null ? "A tie! The cards can't choose between you." : win === me() ? "You win the duel!" : `${t.nameOf(win)} wins the duel.`;
    let bits = "";
    if (playing && !finish.paid) {
      finish.paid = true;
      const r = mem(state.prog), fresh = v.found.filter((k) => !r.learned.includes(k)); r.learned.push(...fresh); r.duels = (r.duels || 0) + 1; if (win === me()) r.duelWins = (r.duelWins || 0) + 1;
      const xp = (win === me() ? 10 : win === null ? 7 : 5) + fresh.length, ess = win === me() ? 5 : 0;
      const aw = award(xp, ess); saveProgress(); showStats();
      bits = `<div class="reward"><div><b>+${xp} ✦${ess ? ` · +${ess} 💎` : ""}</b>${fresh.length ? ` · ${fresh.length} new sign${fresh.length === 1 ? "" : "s"} learned` : ""} · duels won ${r.duelWins || 0} of ${r.duels}</div>${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>`;
    }
    say(line);
    $("gm-board").classList.add("won");
    const end = document.createElement("div"); end.innerHTML = `${bits}<div class="choices"><button class="c main" type="button" id="gm-drematch">⚔️ Rematch</button><button class="c" type="button" id="gm-dlobby">📚 Another deck</button><button class="c" type="button" id="gm-dleave2">✕ Leave the table</button></div>`;
    $("ui").prepend(end);
    $("gm-drematch").onclick = () => { finish.paid = false; if (t.isHost()) hostDeal(v.deck); else t.up({ t: "deal", deck: v.deck }); };
    $("gm-dlobby").onclick = () => { finish.paid = false; built = null; lobbyView(); };
    $("gm-dleave2").onclick = leave;
  }

  t.on("msg", ({ from, m }) => {
    if (!m) return;
    if (m.t === "view" && from === t.host) show(m.v);
    else if (m.t === "lobby" && from === t.host) { live = false; built = null; lobbyView(); say("A player left the table. The duel is off."); }
    else hostMsg({ from, m });
  });
  t.on("members", () => {
    if (t.isHost() && d && !d.g.done && d.seats.some((id) => !t.members.some((m) => m.id === id))) {
      const gone = d.seats.find((id) => !t.members.some((m) => m.id === id)); clearTimeout(passTimer); d = null;
      t.to("*", { t: "lobby", why: t.nameOf(gone) }); live = false; built = null; lobbyView(); say("Your opponent left the table. The duel is off."); return;
    }
    if (!live) { built = null; lobbyView(); }
  });
  t.on("host", (snap) => { if (snap && snap.g) { d = snap; d.wait && duelPass(d); broadcast(); } });
  t.on("close", () => { closed = true; say("The table closed. The duel is over."); ui(`<div class="choices"><button class="c" type="button" id="gm-dback">↩ Back to Grimoire Memory</button></div>`); $("gm-dback").onclick = back; });
  lobbyView();
}
