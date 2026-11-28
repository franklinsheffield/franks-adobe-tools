// Fact or Fib, the shared party screen: any room hands it a kit and gets the full round (rules in vote.js, emcee in
// emcee.js, sounds in sfx.js). In a Discord call everyone who opens the same room's Fact or Fib shares one table
// (net.js joinTable; the host's client runs the match). Alone, you hunt the truth among the House's own fibs.
// Kit: { game (table id), roomId, deal(prog) -> [prompt], byId(id) -> prompt, draw(view|null, { phase, ev, unroll }),
//        ask(P, esc) -> html, fact(P, esc) -> html, blurb, input: "type" | "pick", placeholder?, hint, badHint?, truthNear? }
// A prompt: see vote.js. Pick kits add P.options (values offered as fibs) instead of free typing.
import { canJoin, joinTable } from "../net.js";
import * as V from "./vote.js";
import * as sfx from "./sfx.js";
import { emcee } from "./emcee.js";

export const REVEAL_S = 15;
const CSS = `
.ff-ask{padding:10px 12px;border:1px solid var(--gold);border-radius:12px;background:linear-gradient(135deg,rgba(176,108,255,.16),rgba(102,224,200,.06));animation:ff-in .45s cubic-bezier(.3,1.3,.5,1) both}
.ff-ask b{font-family:var(--display);color:var(--gold2)}.ff-ask p{margin:4px 0 0}.ff-ask .ff-q{margin-top:6px;color:var(--teal);font-weight:700}
.ff-in{display:flex;gap:8px;margin:8px 0}.ff-in input{flex:1;min-width:0;font:inherit;font-size:1.1rem;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:rgba(0,0,0,.35);color:inherit;font-variant-numeric:tabular-nums}
.ff-clock{float:right;font-variant-numeric:tabular-nums;color:var(--gold2)}.ff-clock.low{color:#ff6b8a;animation:ff-pulse .5s ease-in-out infinite alternate}
.ff-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0}
.ff-cards .c{font-size:1.15rem;font-variant-numeric:tabular-nums;animation:ff-flip .45s cubic-bezier(.3,1.3,.5,1) var(--d) both}
.ff-cards .c[disabled]{opacity:.45}.ff-cards .c.mine{outline:2px solid var(--teal)}
.ff-fact{font-size:.9rem;margin:6px 0;padding:8px 12px;border-radius:12px;background:rgba(243,227,195,.06);border:1px solid rgba(250,222,140,.3);animation:ff-slide .5s ease-out both}.ff-fact b{color:var(--gold2)}
.ff-res{display:flex;flex-direction:column;gap:6px;margin:8px 0}
.ff-row{padding:7px 10px;border-radius:10px;border:1px solid var(--line);background:rgba(243,227,195,.05);font-size:.9rem;animation:ff-slide .4s ease-out var(--d) both}
.ff-row b{font-size:1.05rem;font-variant-numeric:tabular-nums}.ff-row.truth{border-color:#66E0C8;background:rgba(102,224,200,.14);animation:ff-slide .4s ease-out var(--d) both,ff-glow 1.4s ease-in-out var(--d) 2 alternate}
.ff-row .ff-stamp{display:inline-block;margin-left:6px;padding:0 6px;border:2px solid #ff6b8a;color:#ff6b8a;border-radius:6px;font-size:.72rem;font-weight:700;transform:rotate(-6deg);animation:ff-stamp .35s cubic-bezier(.3,1.8,.5,1) calc(var(--d) + .3s) both}
.ff-row.truth .ff-stamp{border-color:#66E0C8;color:#66E0C8}
.ff-score{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.ff-score span{padding:3px 9px;border:1px solid var(--line);border-radius:999px;font-size:.8rem}.ff-score span.lead{border-color:var(--gold);color:var(--gold2)}
@keyframes ff-in{from{transform:translateY(-10px) scale(.96);opacity:0}}
@keyframes ff-flip{from{transform:rotateY(90deg);opacity:0}}
@keyframes ff-slide{from{transform:translateX(-14px);opacity:0}}
@keyframes ff-glow{to{box-shadow:0 0 18px rgba(102,224,200,.6)}}
@keyframes ff-stamp{from{transform:scale(2.4) rotate(-20deg);opacity:0}}
@keyframes ff-pulse{to{opacity:.5}}
@media (prefers-reduced-motion:reduce){.ff-ask,.ff-cards .c,.ff-row,.ff-stamp,.ff-clock{animation:none!important}}
@media (max-width:520px){.ff-cards{grid-template-columns:1fr}}
`;
function styleOnce() { if (document.getElementById("ff-style")) return; const s = document.createElement("style"); s.id = "ff-style"; s.textContent = CSS; document.head.append(s); }

export function openFactFib(ctx, kit, onBack) {
  const { $, esc, say, ui, cap, state, saveProgress, showStats, award, clearReading } = ctx;
  styleOnce(); clearReading?.();
  let T = null, G = null, V_ = null, long = false, tick = null, until = 0, rewarded = false, lastPhase = "", gone = false;
  const solo = !canJoin(state), me = () => (T ? T.me.id : "me");
  const members = () => (T ? T.members : [{ id: "me", name: state.name }]);
  const nameOf = (id) => (T ? T.nameOf(id) : id === "me" ? state.name : "someone");
  const P = () => (G ? kit.byId(G.prompts[G.i]) : null);
  const isHost = () => !T || T.isHost();
  const alone = () => members().length === 1; // nobody to fool: skip straight to hunting the truth among the House's fibs
  const stop = () => { clearInterval(tick); tick = null; };
  const leave = () => { gone = true; stop(); if (T) { const t = T; T = null; t.leave(); } onBack(); };

  /* ---------- the host runs the match ---------- */
  function setClock() { const s = G && G.phase === "reveal" ? REVEAL_S : G ? V.seconds(G) : 0; until = s ? Date.now() + s * 1000 : 0; }
  function broadcast(ev = "") {
    if (!G) return paint(null, ev);
    const left = until ? Math.max(0, Math.round((until - Date.now()) / 1000)) : 0;
    if (T) { for (const m of T.members) if (m.id !== me()) T.to(m.id, { k: "st", st: V.publicView(G, m.id), left, ev }); T.snap(G); }
    paint(V.publicView(G, me()), ev, left);
  }
  function hostAct(from, a) {
    if (!a) return;
    if (a.a === "start") { if (from !== me()) return; G = V.startMatch(kit.deal(state.prog).map((p) => ({ id: p.id })), members(), { long }); rewarded = false;
      if (alone()) V.openVote(G, P()); setClock(); sfx.curtain(); return broadcast("start"); }
    if (!G) return;
    if (a.a === "fib") { const r = V.submit(G, P(), from, a.text); if (from === me()) feedback(r); else if (T) T.to(from, { k: "res", r });
      if (r === "ok" && V.allWritten(G)) return step(); return broadcast(); }
    if (a.a === "vote") { const r = V.vote(G, from, a.key); if (!r) return; if (G.phase === "vote" && V.allVoted(G) && G.seats.length) return step(); return broadcast(); }
    if (a.a === "skip" && from === me()) return step();
  }
  function step() {
    const was = G.phase; let r = V.advance(G, P(), members());
    if (!r) return; if (r === "write" && alone()) { V.openVote(G, P()); r = "vote"; } setClock();
    if (r === "vote") sfx.flip(G.choices.length); else if (r === "reveal") { sfx.truth(); if (Object.keys(G.last.fooled).length) setTimeout(sfx.fooled, 700); } else if (r === "write") sfx.curtain();
    broadcast(was + ">" + r);
  }
  function hostTick() { if (!G || !isHost() || G.over || !until) return; const left = Math.round((until - Date.now()) / 1000);
    if (left <= 0) return step(); if (left <= 5 && G.phase !== "reveal") sfx.tick(left <= 2); }
  function startTicking() { stop(); tick = setInterval(() => { if (gone) return stop();
    if (state.inRoom && state.inRoom !== kit.roomId) { gone = true; stop(); if (T) { const t = T; T = null; t.leave(); } return; } if (isHost()) hostTick(); clock(); }, 1000); }
  function act(a) { if (isHost()) hostAct(me(), a); else T.up({ k: "act", act: a }); }

  /* ---------- everyone: what you see ---------- */
  function feedback(r) {
    if (r === "ok") { sfx.seal(); return; }
    sfx.buzz(); const n = $("ff-note"); if (n) n.textContent = r === "truth" ? (kit.truthNear || "That's the truth! Pick a fib instead.") : (kit.badHint || "Pick one of the fibs.");
  }
  let viewLeft = 0, viewAt = 0;
  function clock() { const el = $("ff-clock"); if (!el || !viewAt) return; const left = Math.max(0, viewLeft - Math.round((Date.now() - viewAt) / 1000));
    el.textContent = `⏱ ${left}s`; el.classList.toggle("low", left <= 5); }
  const scoreChips = (v) => { const rows = V.standings(v), top = rows[0] ? rows[0].score : 0;
    return `<div class="ff-score">${rows.map((r) => `<span class="${r.score && r.score === top ? "lead" : ""}">${esc(nameOf(r.id))} · ${r.score}</span>`).join("")}</div>`; };
  const bar = (v) => `<div class="cx-top"><b>🎭 Fact or Fib</b> · card ${v.i + 1} of ${v.n}${V.isFinal(v) ? " · ✨ final round, double points" : ""}<span class="ff-clock" id="ff-clock"></span></div>`;
  const hostBtns = (v) => (isHost() && !v.over ? `<button class="c small" type="button" id="ff-skip">⏭ ${v.phase === "reveal" ? "Next card" : "Skip ahead"}</button>` : "");
  const leaveBtn = `<button class="c small" type="button" id="ff-leave">↩ Leave Fact or Fib</button>`;

  function paint(v, ev = "", left = 0) {
    V_ = v; viewLeft = left; viewAt = Date.now();
    if (!v) return lobby();
    const p = kit.byId(v.prompts[v.i]), phaseChanged = v.phase + v.i !== lastPhase; lastPhase = v.phase + v.i;
    if (v.phase === "write") {
      kit.draw(v, { phase: "write", ev, unroll: ev === "start" }); cap("🎭 Fact or Fib · write a fib");
      if (phaseChanged) say(`${v.i === 0 ? emcee("open") + " " : V.isFinal(v) ? emcee("final") + " " : ""}${emcee("write")}`);
      const seated = v.seats.includes(me()), mine = v.mine;
      ui(`${bar(v)}${kit.ask(p, esc)}
        ${!seated ? `<div class="note">You arrived mid-card, so you're in the audience. You get a seat at the next card.</div>`
          : mine !== null ? `<div class="note">🔒 Your fib is locked in: <b>${esc(String(p.show(mine)))}</b>. Waiting for the others…</div>`
          : kit.input === "pick" ? `<div class="ff-cards ff-pick">${(p.options || []).map((o, k) => `<button class="c" type="button" data-f="${esc(String(o))}" style="--d:${(k * 0.05).toFixed(2)}s">${esc(String(p.show(o)))}</button>`).join("")}</div><div class="note" id="ff-note">${esc(kit.hint)}</div>`
          : `<div class="ff-in"><input id="ff-fib" type="text" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="${esc(kit.placeholder || "")}" aria-label="Your fib"><button class="c main" type="button" id="ff-go">🔒 Lock in</button></div><div class="note" id="ff-note">${esc(kit.hint)}</div>`}
        <div class="note">✍️ ${v.done.length} of ${v.seats.length} fibs in${v.seats.length > v.done.length ? ` · waiting for ${v.seats.filter((id) => !v.done.includes(id)).map((id) => esc(nameOf(id))).join(", ")}` : ""}</div>
        ${v.seats.length > 1 ? scoreChips(v) : ""}<div class="choices">${hostBtns(v)}${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => act({ a: "fib", text: b.dataset.f })));
      const inp = $("ff-fib");
      if (inp) { const go = () => { const t = inp.value.trim(); if (t) act({ a: "fib", text: t }); };
        $("ff-go").onclick = go; inp.onkeydown = (k) => { if (k.key === "Enter") { k.preventDefault(); go(); } }; if (phaseChanged) setTimeout(() => inp.focus(), 50); }
    } else if (v.phase === "vote") {
      kit.draw(v, { phase: "vote", ev }); cap("🎭 Fact or Fib · find the truth");
      if (phaseChanged) say(`${v.i > 0 && V.isFinal(v) && v.seats.length === 1 ? emcee("final") + " " : ""}${emcee("vote")}`);
      const aud = !v.seats.includes(me());
      ui(`${bar(v)}${kit.ask(p, esc)}<div class="ff-cards">${v.choices.map((c, k) => `<button class="c${v.myVote === c.key ? " main mine" : ""}" type="button" data-v="${c.key}" style="--d:${(k * 0.07).toFixed(2)}s"${c.own ? " disabled title=\"Your own fib\"" : ""}>${esc(c.text)}${c.own ? " ✍️" : ""}</button>`).join("")}</div>
        <div class="note">${aud ? "📣 Audience vote: you don't score, but every fib you fall for earns its writer a point, and each truth you find earns you 💎 at the end. " : ""}🗳️ ${v.voted.length} of ${v.seats.length} voted${v.myVote ? " · you can change your vote until time runs out" : ""}</div>
        <div class="choices">${hostBtns(v)}${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { if (!b.disabled) act({ a: "vote", key: b.dataset.v }); }));
    } else if (v.phase === "reveal" || v.phase === "over") {
      const L = v.last || {};
      kit.draw(v, { phase: v.phase, ev, party: v.phase === "over" }); cap(v.over ? "🎭 Fact or Fib · final scores" : "🎭 Fact or Fib · the reveal");
      if (phaseChanged && !v.over) {
        const fooledBy = Object.entries(L.fooled || {}).sort((a, b) => b[1].length - a[1].length)[0];
        say([emcee("truth", { answer: p.truthText }), !L.found || !L.found.length ? emcee("nobody") : "", fooledBy ? emcee("fooled", { name: nameOf(fooledBy[0]), n: fooledBy[1].length }) : ""].filter(Boolean).join(" "));
      }
      const pickers = (key) => Object.entries(v.votes || {}).filter(([, k]) => k === key).map(([id]) => esc(nameOf(id)));
      const audN = (key) => Object.values(v.aud || {}).filter((k) => k === key).length;
      const rows = [...v.choices].sort((a, b) => (a.truth ? -1 : b.truth ? 1 : 0)).map((c, k) => { const who = pickers(c.key), au = audN(c.key);
        return `<div class="ff-row${c.truth ? " truth" : ""}" style="--d:${(k * 0.12).toFixed(2)}s"><b>${esc(c.text)}</b><span class="ff-stamp">${c.truth ? "TRUE" : c.house ? `HOUSE FIB` : "FIB"}</span>
          ${c.truth ? "" : c.by.length ? ` · written by ${c.by.map((id) => esc(nameOf(id))).join(" & ")}` : ""}
          <div class="note">${who.length ? `${c.truth ? "✅ Found by" : "🎣 Fooled"} ${who.join(", ")}` : c.truth ? "Nobody found it" : "Nobody fell for it"}${au ? ` · 📣 ${au} audience` : ""}</div></div>`; }).join("");
      const fact = `<div class="ff-fact">${kit.fact(p, esc)}</div>`;
      if (v.over) return finish(v, rows, fact);
      ui(`${bar(v)}<div class="ff-res">${rows}</div>${fact}${scoreChips(v)}<div class="choices">${hostBtns(v)}${leaveBtn}</div>${!isHost() ? `<div class="note">Next card in a moment…</div>` : ""}`);
    }
    wire(); clock();
  }
  function wire() { if ($("ff-skip")) $("ff-skip").onclick = () => act({ a: "skip" }); if ($("ff-leave")) $("ff-leave").onclick = leave; }

  function finish(v, rows, fact) {
    const players = v.seats.length, rw = V.reward(v, me(), players), au = V.audienceReward(v, me()), top = V.standings(v)[0];
    if (!rewarded) { rewarded = true; const aw = award(rw.xp, rw.essence + au); saveProgress(); showStats(); sfx.fanfare(rw.won || (players === 1 && rw.found >= 3));
      ctx.trophy?.(kit.roomId, 1, { won: players > 1 ? rw.won : rw.perfect, perfect: rw.perfect }); // solo: only a perfect match counts as a win // Trophy Case (trophies.js)
      say(players > 1 && top ? emcee("win", { name: nameOf(top.id) }) : `${rw.found} of ${v.n} truths found. ${rw.found >= 4 ? "A sharp eye for the truth." : "The fibs were good tonight."}${aw.rankUp ? ` You are now ${aw.rankUp}.` : ""}`); }
    ui(`<div class="reward"><div><b>${players > 1 ? (rw.place === 1 ? "🏆 You win!" : `You came ${["", "1st", "2nd", "3rd"][rw.place] || rw.place + "th"}`) : `🎭 ${rw.found} of ${v.n} truths found`}</b> · ${rw.score} points · +${rw.xp} ✦${rw.essence + au ? ` · +${rw.essence + au} 💎` : ""}${au ? ` (📣 ${au} from audience truths)` : ""}</div></div>
      ${scoreChips(v)}<div class="group">The last card</div><div class="ff-res">${rows}</div>${fact}
      <div class="choices">${isHost() ? `<button class="c main" type="button" id="ff-again">🎭 Play again</button>` : `<div class="note">The host can start another match.</div>`}${leaveBtn}</div>`);
    if ($("ff-again")) $("ff-again").onclick = () => hostAct(me(), { a: "start" });
    wire();
  }

  function lobby() {
    kit.draw(null, { phase: "lobby", unroll: true }); cap("🎭 Fact or Fib");
    const who = members().map((m) => `<span>${esc(m.name || nameOf(m.id))}${T && m.id === T.host ? " 👑" : ""}</span>`).join("");
    say(emcee("open"));
    ui(`<div class="cx-top"><b>🎭 Fact or Fib</b> · ${solo ? "solo, against the House's fibs" : `${members().length} at the table`}</div>${T ? `<div class="chips">${who}</div>` : ""}
      <div class="note">${esc(kit.blurb)} ${solo ? "Find the truth among the House's fibs." : "Everyone plants a fib, then everyone hunts for the truth."} Finding the truth: ${V.TRUTH} points. Each player your fib fools: ${V.FOOL} points. Final round counts double.</div>
      ${solo ? `<div class="note">Open Fact or Fib inside a Discord voice call and everyone in the call plays at the same table.</div>` : ""}
      <div class="choices">${isHost() ? `<button class="c main" type="button" id="ff-start">🎭 Start the match</button><button class="c small" type="button" id="ff-long">${long ? "⏱ Long timers: on" : "⏱ Long timers: off"}</button>` : `<div class="note">Waiting for ${esc(nameOf(T.host))} to start…</div>`}${leaveBtn}</div>`);
    if ($("ff-start")) $("ff-start").onclick = () => hostAct(me(), { a: "start" });
    if ($("ff-long")) $("ff-long").onclick = () => { long = !long; lobby(); };
    wire();
  }

  async function connect() {
    if (solo) { startTicking(); return lobby(); }
    say("Pulling up chairs for everyone in the call…");
    let t; try { t = await joinTable(kit.game, state); } catch (e) { say(`The table won't open (${e.message}). You can still play solo.`); T = null; startTicking(); return lobby(); }
    if (gone) return t.leave(); T = t;
    t.on("msg", ({ from, m }) => { if (T !== t || gone) return;
      if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); }
      else if (m && m.k === "st") { G = null; paint(m.st, m.ev, m.left); if (m.ev && m.ev.endsWith(">vote")) sfx.flip(m.st.choices.length); else if (m.ev && m.ev.endsWith(">reveal")) sfx.truth(); else if (m.ev === "start") sfx.curtain(); }
      else if (m && m.k === "res") feedback(m.r); });
    t.on("members", () => { if (T !== t || gone) return; if (t.isHost()) { if (G) for (const m of t.members) V.join(G, m.id); broadcast(); } else if (!V_) lobby(); });
    t.on("host", (snap) => { if (T !== t || gone) return; if (snap && snap.prompts) { G = snap; setClock(); } say("The host left the table. You run Fact or Fib now."); broadcast(); });
    t.on("close", () => { if (T !== t) return; T = null; G = null; say("The table broke up (connection lost)."); lobby(); });
    startTicking(); lobby();
  }
  connect();
  return { leave };
}
