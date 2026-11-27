// The Impostor: the Séance's party round (rules in impostor.js). In a Discord call everyone who opens it shares one
// table (net.js joinTable "impostor"; the host's client runs it, and runs the spirit sitters that fill empty chairs).
// Alone, you play with three spirit sitters. The Oracle's séance ghost hosts; masks come from the 🎭 shelf (masks.js).
import { canJoin, joinTable } from "../net.js";
import * as I from "./impostor.js";
import { FIELDS } from "./ghosts.js";
import { ghostBody } from "./ghostlooks.js";
import { maskSvg } from "./masks.js";
import * as sfx from "./sfx.js";
import * as psx from "../party/sfx.js";

const CSS = `
.im-svg *{transform-box:fill-box}
.im-seat{animation:im-bob 3s ease-in-out var(--d) infinite}
.im-ghost{animation:im-float 4s ease-in-out infinite;transform-origin:center}
.im-word{animation:im-drop .5s cubic-bezier(.3,1.5,.5,1) var(--d) both}
.im-caught .im-mask{animation:im-off 1s .3s ease-in both;transform-origin:center}
.im-spot{animation:im-spot 1.2s ease-out both}
@keyframes im-bob{50%{transform:translateY(-2px)}}
@keyframes im-float{50%{transform:translateY(-6px)}}
@keyframes im-drop{from{transform:translateY(-14px);opacity:0}}
@keyframes im-off{40%{transform:rotate(-18deg) translateY(-6px)}to{transform:translate(-20px,50px) rotate(-90deg);opacity:0}}
@keyframes im-spot{from{opacity:0}}
.im-card{padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:rgba(250,222,140,.06);margin:6px 0}
.im-card.imp{border-color:#ff6b8a;background:rgba(255,107,138,.08)}
.im-words{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 0}.im-words .c{padding:8px 4px}
.im-hints{display:grid;gap:4px;margin:6px 0}.im-hints div{padding:5px 10px;border-radius:10px;border:1px solid var(--line);font-size:.9rem}
@media (max-width:520px){.im-words{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (prefers-reduced-motion:reduce){.im-svg *,.im-card{animation:none!important}}
`;
function styleOnce() { if (typeof document === "undefined" || document.getElementById("im-style")) return; const s = document.createElement("style"); s.id = "im-style"; s.textContent = CSS; document.head.append(s); }

/** The table: the host ghost above, sitters in masks around a round table, laid hint words, the reveal. */
export function impostorSvg({ seats = [], names = {}, hints = {}, me = "", mask = "im-domino", ghost = "gh-sheet", caught = null, imp = null, result = "", spot = false } = {}) {
  styleOnce();
  const n = Math.max(1, seats.length), pos = seats.map((id, k) => { const a = Math.PI * (0.15 + (0.7 * k) / Math.max(1, n - 1)); return [200 - Math.cos(a) * 150, 196 + Math.sin(a) * 34]; });
  const chairs = seats.map((id, k) => { const [x, y] = pos[k], words = [1, 2].map((t) => (hints[t] || {})[id]).filter(Boolean), out = id === caught;
    return `<g class="im-seat${out ? " im-caught" : ""}" style="--d:${(k * 0.4).toFixed(1)}s"><circle cx="${x}" cy="${y - 6}" r="18" fill="${id === me ? "#3a2a5e" : "#2a1f40"}" stroke="${id === me ? "#FADE8C" : "#5a4a80"}" stroke-width="1.5"/>
      <g class="im-mask">${maskSvg(id === me ? mask : I.isSpirit(id) ? "im-volto" : "im-domino", x, y - 8, 0.62)}</g>
      ${out && imp ? `<text x="${x}" y="${y - 2}" font-size="15" text-anchor="middle">${id === imp ? "😱" : "😇"}</text>` : ""}
      <text x="${x}" y="${y + 24}" font-size="8.5" fill="#e8e0ff" text-anchor="middle">${String(names[id] || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").slice(0, 16)}</text>
      ${words.map((w, j) => `<g class="im-word" style="--d:${(j * 0.15).toFixed(2)}s"><rect x="${x - 34}" y="${y + 29 + j * 13}" width="68" height="11" rx="3" fill="${w === "?" ? "#3a2a5e" : "#f3ecd8"}"/><text x="${x}" y="${y + 37 + j * 13}" font-size="7" text-anchor="middle" fill="${w === "?" ? "#c9bfff" : "#2a2018"}">${w === "?" ? "face down" : String(w).replace(/&/g, "&amp;")}</text></g>`).join("")}</g>`; }).join("");
  return `<svg class="im-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" role="img" aria-label="The Impostor table">
<defs><radialGradient id="im-room" cx="50%" cy="60%" r="70%"><stop offset="0" stop-color="#3a1f5e"/><stop offset="1" stop-color="#07040f"/></radialGradient>
<linearGradient id="sc-sheet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9c4e6" stop-opacity=".75"/></linearGradient></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="#07040f"/><rect width="400" height="300" fill="url(#im-room)"/>
${spot ? `<path class="im-spot" d="M180 0 L220 0 L300 300 L100 300Z" fill="#FADE8C" opacity=".08"/>` : ""}
<g class="im-ghost" transform="translate(100 -24) scale(.5)"><g class="sc-gb sg-${ghost}">${ghostBody(ghost)}</g></g>
<text x="200" y="24" font-size="13" font-weight="700" fill="#FADE8C" text-anchor="middle" font-family="Cinzel, Georgia, serif" letter-spacing="2">THE IMPOSTOR</text>
<ellipse cx="200" cy="200" rx="120" ry="30" fill="#3a0f22" stroke="#7a2a48" stroke-width="2"/>
${result ? `<text x="200" y="206" font-size="13" text-anchor="middle" fill="${result === "caught" ? "#66E0C8" : "#ff9db3"}" font-family="Cinzel, Georgia, serif">${result === "caught" ? "IMPOSTOR CAUGHT" : result === "stolen" ? "THE IMPOSTOR STOLE IT" : "THE IMPOSTOR ESCAPED"}</text>` : ""}
${chairs}</svg>`;
}

export function openImpostor(ctx, onBack) {
  const { $, esc, say, ui, cap, state, saveProgress, showStats, award, clearReading, tableEl } = ctx;
  styleOnce(); clearReading?.();
  let T = null, G = null, V = null, tick = null, until = 0, viewLeft = 0, viewAt = 0, paid = 0, gone = false, lastKey = "", spiritT = null;
  const solo = !canJoin(state), me = () => (T ? T.me.id : "me");
  const members = () => (T ? T.members : [{ id: "me", name: state.name }]);
  const nameOf = (id) => (I.SPIRITS.find((s) => s.id === id) || {}).name || (T ? T.nameOf(id) : id === "me" ? state.name || "You" : "someone");
  const isHost = () => !T || T.isHost();
  const stop = () => { clearInterval(tick); tick = null; clearTimeout(spiritT); };
  const leave = () => { gone = true; stop(); if (T) { const t = T; T = null; t.leave(); } onBack(); };
  const names = (v) => Object.fromEntries(v.seats.map((id) => [id, id === me() ? "You" : nameOf(id)]));
  const draw = (v, o = {}) => { tableEl.className = "table seance"; tableEl.innerHTML = impostorSvg({ seats: v ? v.seats : [], names: v ? names(v) : {}, hints: v ? v.hints : {}, me: me(), mask: state.prog.seancemask, ghost: state.prog.ghost, ...o }); };

  /* ---------- host ---------- */
  function setClock() { const s = G && !G.over ? I.TIMES[G.phase] || 0 : 0; until = s ? Date.now() + s * 1000 : 0; }
  function broadcast(ev = "") {
    const left = until ? Math.max(0, Math.round((until - Date.now()) / 1000)) : 0;
    if (T) { for (const m of T.members) if (m.id !== me()) T.to(m.id, { k: "st", st: I.gameView(G, m.id), left, ev }); T.snap(G); }
    paint(I.gameView(G, me()), ev, left);
    clearTimeout(spiritT); if (G && !G.over && G.seats.some(I.isSpirit)) spiritT = setTimeout(spirits, 1400 + Math.random() * 1200);
  }
  function spirits() { if (!G || G.over || gone) return; if (I.spiritsAct(G)) { if (ready()) return step(); broadcast("spirit"); } }
  const ready = () => (G.phase === "hint" && I.allHinted(G)) || (G.phase === "vote" && I.allVoted(G)) || G.phase === "over";
  function hostAct(from, a) {
    if (!a) return;
    if (a.a === "start") { if (from !== me()) return; G = I.newGame(members(), Math.random, (G ? G.round : 0) + 1); setClock(); sfx.summon(); return broadcast("start"); }
    if (!G) return;
    let r = null;
    if (a.a === "hint") r = I.hint(G, from, a.w);
    else if (a.a === "vote") r = I.vote(G, from, a.t);
    else if (a.a === "steal") r = I.steal(G, from, a.g);
    else if (a.a === "skip" && from === me()) return step();
    if (!r) return;
    if (r === "over" || ready()) return step();
    broadcast(a.a);
  }
  function step() { const was = G.phase, r = G.phase === "over" ? "over" : I.advance(G); if (!r) return; setClock(); broadcast(was + ">" + G.phase); }
  function hostTick() { if (!G || G.over || !until) return; const left = Math.round((until - Date.now()) / 1000); if (left <= 0) return step(); if (left <= 5) psx.tick(left <= 2); }
  function act(a) { if (isHost()) hostAct(me(), a); else T.up({ k: "act", act: a }); }

  /* ---------- everyone ---------- */
  function clock() { const el = $("im-clock"); if (!el || !viewAt) return; const left = Math.max(0, viewLeft - Math.round((Date.now() - viewAt) / 1000)); el.textContent = `⏱ ${left}s`; }
  const bar = (v, what) => `<div class="cx-top"><b>🎭 The Impostor</b> · ${what}<span class="ff-clock" id="im-clock" style="float:right"></span></div>`;
  const leaveBtn = `<button class="c small" type="button" id="im-leave">↩ Leave the table</button>`;
  const hostBtn = (v, t) => (isHost() && !v.over ? `<button class="c small" type="button" id="im-skip">⏭ ${t}</button>` : "");
  const cardHtml = (c) => { if (!c) return `<div class="note">You're watching this one. You'll get a chair in the next game.</div>`; const g = I.ghost(c.ghost), F = FIELDS[g.field];
    return c.imp ? `<div class="im-card imp"><b>🎭 You are the impostor.</b> The spirits slipped you the wrong ghost: <b>${esc(g.emoji)} ${esc(g.name)}</b>. Everyone else has a different ${esc(F.name.toLowerCase())} ghost. Lay hints that could fit theirs, and don't get caught.</div>`
      : `<div class="im-card"><b>👻 Your ghost: ${esc(g.emoji)} ${esc(g.name)}</b> (${esc(F.name)}, ${esc(g.life)}). One sitter has a different ghost. Lay hints that prove you know yours, but not so plainly that the impostor can work it out.</div>`; };
  const hintRows = (v) => `<div class="im-hints">${v.seats.map((id) => { const w = [1, 2].map((t) => (v.hints[t] || {})[id]).filter(Boolean);
    return `<div><b>${esc(id === me() ? "You" : nameOf(id))}</b>: ${w.length ? w.map((x) => (x === "?" ? "🂠" : `“${esc(x)}”`)).join(" · ") : "…"}</div>`; }).join("")}</div>`;

  function paint(v, ev = "", left = 0) {
    V = v; viewLeft = left; viewAt = Date.now();
    if (!v) return lobby();
    const key = v.round + v.phase + v.turn, fresh = key !== lastKey; lastKey = key;
    const seated = v.seats.includes(me()), c = v.card;
    if (v.phase === "hint") {
      draw(v); cap(`🎭 Hint round ${v.turn} of ${v.rounds}`);
      if (fresh) { sfx.knock(v.turn); say(v.turn === 1 ? "The candles gutter. Everyone at this table was handed a ghost, and one of you was handed the wrong one. Lay a hint word." : "Second round. Choose another word. Watch what the others laid."); }
      const mine = seated && v.hints[v.turn][me()], usedW = [1, 2].map((t) => (v.hints[t] || {})[me()]).filter(Boolean), laid = Object.keys(v.hints[v.turn]).length;
      ui(`${bar(v, `hint round ${v.turn} of ${v.rounds}`)}${cardHtml(c)}
        ${seated ? (mine ? `<div class="note">🂠 You laid <b>“${esc(mine)}”</b> face down. Waiting for the others…</div>` : `<div class="group">Lay one hint word</div><div class="im-words">${v.menu.map((w) => `<button class="c" type="button" data-w="${esc(w)}" ${usedW.includes(w) ? "disabled" : ""}>${esc(w)}</button>`).join("")}</div>`) : ""}
        ${hintRows(v)}<div class="note">🂠 ${laid} of ${v.seats.length} laid</div><div class="choices">${hostBtn(v, "Turn the words over now")}${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { sfx.deal(); act({ a: "hint", w: b.dataset.w }); }));
    } else if (v.phase === "vote") {
      draw(v, { spot: true }); cap("🎭 Who is the impostor?");
      if (fresh) { psx.flip(5); say("All the words are on the table. Now, point at the sitter whose ghost doesn't belong. A tie lets the impostor slip away."); }
      const mine = v.votes[me()], n = Object.keys(v.votes).length;
      ui(`${bar(v, "the vote")}${cardHtml(c)}${hintRows(v)}
        ${seated ? (mine ? `<div class="note">🗳️ You pointed at <b>${esc(nameOf(mine))}</b>. Waiting for the others…</div>` : `<div class="group">Point at the impostor</div><div class="choices">${v.seats.filter((id) => id !== me()).map((id) => `<button class="c" type="button" data-t="${esc(id)}">🫵 ${esc(nameOf(id))}</button>`).join("")}</div>`) : ""}
        <div class="note">🗳️ ${n} of ${v.seats.length} voted</div><div class="choices">${hostBtn(v, "Count the votes now")}${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { psx.seal(); act({ a: "vote", t: b.dataset.t }); }));
    } else if (v.phase === "steal") {
      draw(v, { caught: v.imp, imp: v.imp }); cap("🎭 Caught… or are they?");
      if (fresh) { sfx.wail(true); psx.crash(); say(`The mask comes off: ${v.imp === me() ? "it's you" : nameOf(v.imp)}! But an impostor who can name the real ghost escapes with the win.`); }
      ui(`${bar(v, "last chance")}${v.imp === me() ? `<div class="group">Name the real ghost to steal the win</div><div class="choices col">${(v.steal || []).map((id) => { const g = I.ghost(id); return `<button class="c" type="button" data-g="${id}">${esc(g.emoji)} ${esc(g.name)}</button>`; }).join("")}</div>`
        : `<div class="note">${esc(nameOf(v.imp))} is trying to name your ghost…</div>`}${hintRows(v)}<div class="choices">${hostBtn(v, "Time's up")}${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => act({ a: "steal", g: b.dataset.g })));
    } else if (v.phase === "over") return over(v, fresh);
    wire(); clock();
  }

  function over(v, fresh) {
    const real = I.ghost(v.real), decoy = I.ghost(v.decoy), rw = I.reward(v, me()), seated = v.seats.includes(me());
    draw(v, { caught: v.caught, imp: v.imp, result: v.result }); cap(`🎭 It was ${real.name}`);
    if (fresh && paid !== v.round) { paid = v.round;
      if (rw.won) { sfx.reveal(); psx.fanfare(true); } else { sfx.wrong(); psx.fanfare(false); }
      if (seated) { const aw = award(rw.xp, rw.essence); saveProgress(); showStats(); if (aw.rankUp) say(`🏅 ${aw.rankUp}!`);
        ctx.trophy?.("seance", 3, { won: rw.won, perfect: rw.won && (rw.imp || rw.spotted) }); } // Trophy Case (trophies.js)
      const who = v.imp === me() ? "You were" : `${nameOf(v.imp)} was`;
      say(v.result === "caught" ? `${who} the impostor, holding ${decoy.name}. Caught! The real ghost was ${real.name}.` : v.result === "stolen" ? `${who} caught, but named ${real.name}! The impostor steals the win.`
        : `${who} the impostor, holding ${decoy.name}, and slipped away${v.caught ? ` while the circle accused ${nameOf(v.caught)}` : " in a tied vote"}. The real ghost was ${real.name}.`); }
    const votes = v.seats.map((id) => `<div>${esc(id === me() ? "You" : nameOf(id))} 🫵 ${v.votes[id] ? esc(v.votes[id] === me() ? "you" : nameOf(v.votes[id])) : "nobody"}${v.votes[id] === v.imp ? " ✅" : ""}</div>`).join("");
    ui(`<div class="reward"><div><b>${seated ? (rw.won ? (rw.imp ? "🎭 The impostor wins!" : "👻 The circle wins!") : rw.imp ? "Caught!" : "The impostor got away") : "Game over"}</b>${seated ? ` · +${rw.xp} ✦${rw.essence ? ` · +${rw.essence} 💎` : ""}${rw.spotted ? " · 🔍 you spotted them" : ""}` : ""}</div></div>
      <div class="kit"><div class="kit-row"><b>The real ghost</b><span>${esc(real.emoji)} ${esc(real.name)}: ${esc(real.bio)}</span></div><div class="kit-row"><b>The impostor's ghost</b><span>${esc(decoy.emoji)} ${esc(decoy.name)}: ${esc(decoy.bio)}</span></div></div>
      <div class="group">🗳️ The votes</div><div class="im-hints">${votes}</div>${hintRows(v)}
      <div class="choices">${isHost() ? `<button class="c main" type="button" id="im-again">🎭 Deal again</button>` : `<div class="note">The host can deal again.</div>`}${leaveBtn}</div>`);
    if ($("im-again")) $("im-again").onclick = () => hostAct(me(), { a: "start" });
    wire();
  }

  function lobby() {
    draw(null); cap("🎭 The Impostor");
    say("One ghost for the table, and one sitter holding the wrong one. Lay your hints, point your finger, and watch the masks.");
    const n = members().length;
    ui(`<div class="cx-top"><b>🎭 The Impostor</b> · ${n} at the table${n < I.MIN ? ` + ${I.SEATS - n} spirit sitter${I.SEATS - n > 1 ? "s" : ""}` : ""}</div>
      ${T ? `<div class="chips">${members().map((m) => `<span>${esc(m.name || nameOf(m.id))}${m.id === T.host ? " 👑" : ""}</span>`).join("")}</div>` : ""}
      <div class="note">Everyone is handed the same historical ghost, except one impostor, who gets a different ghost of the same kind. Two rounds: each sitter lays one hint word from the menu. Then vote. Catch the impostor and the circle wins (+${I.CREW}, +${I.SPOT} if you pointed right), unless they can name the real ghost (+${I.STEAL}). Escape and the impostor takes +${I.ESCAPE}.</div>
      ${n < I.MIN ? `<div class="note">Fewer than ${I.MIN} people: spirit sitters fill the empty chairs.${solo ? " Open the Séance inside a Discord voice call to play with friends." : ""}</div>` : ""}
      <div class="choices">${isHost() ? `<button class="c main" type="button" id="im-start">🎭 Deal the ghosts</button>` : `<div class="note">Waiting for ${esc(nameOf(T.host))} to deal…</div>`}${leaveBtn}</div>`);
    if ($("im-start")) $("im-start").onclick = () => hostAct(me(), { a: "start" });
    wire();
  }
  function wire() { if ($("im-skip")) $("im-skip").onclick = () => act({ a: "skip" }); if ($("im-leave")) $("im-leave").onclick = leave; }
  function startTicking() { stop(); tick = setInterval(() => { if (gone) return stop();
    if (state.inRoom && state.inRoom !== "seance") { gone = true; stop(); if (T) { const t = T; T = null; t.leave(); } return; } if (isHost()) hostTick(); clock(); }, 1000); }

  async function connect() {
    if (solo) { startTicking(); return lobby(); }
    say("Setting the table for everyone in the call…");
    let t; try { t = await joinTable("impostor", state); } catch (e) { say(`The table won't set (${e.message}). You can play with the spirit sitters.`); startTicking(); return lobby(); }
    if (gone) return t.leave(); T = t;
    t.on("msg", ({ from, m }) => { if (T !== t || gone) return; if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); } else if (m && m.k === "st") paint(m.st, m.ev, m.left); });
    t.on("members", () => { if (T !== t || gone) return; if (t.isHost()) { if (G) broadcast(); else lobby(); } else if (!V) lobby(); });
    t.on("host", (snap) => { if (T !== t || gone) return; if (snap && snap.seats) { G = snap; setClock(); } say("The host left. You hold the table now."); if (G) broadcast(); else lobby(); });
    t.on("close", () => { if (T !== t) return; T = null; G = null; say("The table lost its connection."); lobby(); });
    startTicking(); lobby();
  }
  connect();
  return { leave };
}
