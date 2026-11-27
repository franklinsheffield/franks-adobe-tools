// Split Key: the Cipher Desk's two-team race (rules in splitkey.js). In a Discord call everyone who opens it shares one
// table (net.js joinTable "splitkey"; the host's client runs it). The chat splits: each team's messages go only to that
// team's people. Alone, you race Wren's apprentices. Team banners come from the Desk kit (shop.js slot "banner").
import { canJoin, joinTable } from "../net.js";
import * as K from "./splitkey.js";
import { current, cipherText, preview, lineOf } from "./logic.js";
import { methodOf, INK } from "./data.js";
import { deskHtml, cipherHtml } from "./scene.js";
import { lookOf } from "./shop.js";
import { WHY } from "../party/filter.js";
import * as sfx from "./sfx.js";
import * as psx from "../party/sfx.js";

const BANNERS = { "cd-pennant": "", "cd-cabinet": "⚜️", "cd-hut": "🛖" };
const CSS = `
.sk-race{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0}.sk-team{padding:6px 10px;border-radius:10px;border:1px solid var(--line);font-size:.88rem}
.sk-team.mine{box-shadow:0 0 0 2px var(--tc) inset}.sk-team b{color:var(--tc)}.sk-bar{height:6px;border-radius:3px;background:#0006;margin-top:4px;overflow:hidden}.sk-bar i{display:block;height:100%;background:var(--tc);transition:width .6s}
.sk-chat{max-height:150px;overflow-y:auto;padding:6px 8px;border-radius:10px;border:1px dashed var(--tc);margin:6px 0;font-size:.88rem}.sk-chat div{animation:sk-in .3s ease-out both}
.sk-say{display:flex;gap:6px}.sk-say input{flex:1;min-width:0}
.sk-flag{position:absolute;top:6px;left:8px;padding:4px 10px 4px 8px;border-radius:2px 10px 10px 2px;color:#fff;font-weight:700;font-size:.85rem;background:var(--tc);box-shadow:0 2px 8px #0008;animation:sk-wave 2.4s ease-in-out infinite;transform-origin:left center;z-index:3}
@keyframes sk-wave{50%{transform:skewY(-3deg) scaleX(.97)}}@keyframes sk-in{from{opacity:0;transform:translateY(4px)}}
@media (prefers-reduced-motion:reduce){.sk-flag,.sk-chat div{animation:none!important}}
`;
function styleOnce() { if (document.getElementById("sk-style")) return; const s = document.createElement("style"); s.id = "sk-style"; s.textContent = CSS; document.head.append(s); }
const drops = (n) => "●".repeat(Math.max(0, n)) + "○".repeat(Math.max(0, INK - n));

export function openSplitKey(ctx, onBack) {
  const { $, esc, say, ui, cap, state, saveProgress, showStats, award, clearReading, tableEl } = ctx;
  styleOnce(); clearReading?.();
  let T = null, G = null, V = null, tick = null, until = 0, viewLeft = 0, viewAt = 0, paid = 0, gone = false, shift = 0, shiftFor = "", lastI = -1, level = 1;
  const solo = !canJoin(state), me = () => (T ? T.me.id : "me");
  const members = () => (T ? T.members : [{ id: "me", name: state.name }]);
  const nameOf = (id) => (id === K.BOT ? K.BOT_NAME : T ? T.nameOf(id) : id === "me" ? state.name || "You" : "someone");
  const isHost = () => !T || T.isHost();
  const stop = () => { clearInterval(tick); tick = null; };
  const leave = () => { gone = true; stop(); if (T) { const t = T; T = null; t.leave(); } onBack(); };
  const flag = (k) => (k ? `<div class="sk-flag" style="--tc:${K.TEAMS[k].colour}">${K.TEAMS[k].e} ${K.TEAMS[k].name} ${BANNERS[lookOf(state.prog).banner] || ""}</div>` : "");
  const draw = (k, o = {}) => { tableEl.className = "table cipherdesk"; tableEl.style.position = "relative"; tableEl.innerHTML = flag(k) + deskHtml({ look: lookOf(state.prog), ...o }); };

  /* ---------- host ---------- */
  function broadcast(ev = "") {
    const left = until ? Math.max(0, Math.round((until - Date.now()) / 1000)) : 0;
    if (T) { for (const m of T.members) if (m.id !== me()) T.to(m.id, { k: "st", st: K.raceView(G, m.id), left, ev }); T.snap(G); }
    paint(K.raceView(G, me()), ev, left);
  }
  function hostAct(from, a) {
    if (!a) return;
    if (a.a === "start") { if (from !== me()) return; G = K.newRace(members(), a.n || level); G.round = (V && V.round || 0) + 1; until = Date.now() + K.TIME * 1000; sfx.unfold(); return broadcast("start"); }
    if (!G || G.over) return;
    if (a.a === "say") { const r = K.say(G, from, String(a.text || ""), nameOf(from)); if (!r.ok) { if (from === me()) say(WHY[r.why] || "That can't go in the chat."); else T && T.to(from, { k: "no", why: r.why }); return; }
      return broadcast("chat:" + r.team); }
    if (a.a === "end" && from === me()) { K.timeUp(G); return broadcast("over"); }
    const r = K.play(G, from, a); if (!r) return;
    broadcast(`${K.teamOf(G, from)}:${r}`);
  }
  function hostTick() { if (!G || G.over) return; if (K.botStep(G)) broadcast(`${K.teamOf(G, K.BOT)}:bot`);
    const left = Math.round((until - Date.now()) / 1000); if (left <= 0 && !G.over) { K.timeUp(G); broadcast("over"); } else if (left <= 10 && left > 0) psx.tick(left <= 3); }
  function act(a) { if (isHost()) hostAct(me(), a); else T.up({ k: "act", act: a }); }

  /* ---------- everyone ---------- */
  function clock() { const el = $("sk-clock"); if (!el || !viewAt) return; const left = Math.max(0, viewLeft - Math.round((Date.now() - viewAt) / 1000)); el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; }
  const race = (v) => `<div class="sk-race">${Object.entries(v.teams).map(([k, t]) => { const n = t.run.items ? t.run.items.length : t.run.n, at = t.done ? n : t.run.i, T0 = K.TEAMS[k];
    return `<div class="sk-team${k === v.mine ? " mine" : ""}" style="--tc:${T0.colour}"><b>${T0.e} ${T0.name}</b>${t.done ? " 🏁" : ""} · ${t.run.score + t.bonus} pts<br><span class="note">${t.ids.map((id) => esc(id === me() ? "you" : nameOf(id))).join(", ")}</span><div class="sk-bar"><i style="width:${(at / n) * 100}%"></i></div></div>`; }).join("")}</div>`;
  const chatBox = (v) => { const t = v.teams[v.mine]; if (!t) return ""; const c = K.TEAMS[v.mine].colour;
    return `<div style="width:100%"><div class="group">💬 ${K.TEAMS[v.mine].name} chat (only your team sees this)</div><div class="sk-chat" id="sk-log" style="--tc:${c}">${t.chat.length ? t.chat.map((l) => `<div><b>${esc(l.who === me() ? "You" : l.name)}</b>: ${esc(l.text)}</div>`).join("") : `<div class="note">Nothing yet. Plan your attack.</div>`}</div>
      <div class="sk-say"><input id="sk-in" type="text" maxlength="60" autocomplete="off" enterkeyhint="send" placeholder="Message your team"><button class="c small" type="button" id="sk-send">Send</button></div>
      <div class="choices">${K.QUICK.slice(0, 5).map((q) => `<button class="c small" type="button" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div></div>`; };
  const leaveBtn = `<button class="c small" type="button" id="sk-leave">↩ Leave the race</button>`;

  function paint(v, ev = "", left = 0) {
    V = v; viewLeft = left; viewAt = Date.now();
    if (!v) return lobby();
    if (v.over) return over(v, ev);
    const k = v.mine, t = v.teams[k];
    if (ev === "start") { psx.curtain(); say(`The bundle is split. You're on ${K.TEAMS[k] ? K.TEAMS[k].name : "the bench"}. Same documents for both teams: first through gets +${K.RACE_BONUS}. Talk in your team chat, the others can't hear you.`); }
    else if (ev.startsWith(k + ":")) { const r = ev.split(":")[1]; if (r === "right") { sfx.decode(); setTimeout(sfx.seal, 250); } else if (r === "wrong") sfx.wrong(); else if (r === "out") sfx.crack(); else if (r === "key") sfx.click(); }
    else if (ev.startsWith("chat:") && ev.endsWith(k)) sfx.scratch();
    else if (ev && !ev.startsWith("chat")) { const other = ev.split(":")[0]; if (other !== k && v.teams[other] && v.teams[other].done) psx.buzz(); }
    if (!t) { draw(null, { doc: `<div class="cd-claim"><b>Split Key</b>A race is on. You'll join a team in a moment.</div>` }); ui(`${race(v)}<div class="choices">${leaveBtn}</div>`); return wire(); }
    const keepIn = $("sk-in"), typed = keepIn ? keepIn.value : "", focused = keepIn && document.activeElement === keepIn;
    if (t.done) {
      draw(k, { doc: `<div class="cd-claim"><b>${K.TEAMS[k].name}: bundle done</b>${t.at === 1 ? `First through! +${K.RACE_BONUS}` : "Through, second."}</div>`, state: "solved" });
      ui(`<div class="cx-top"><b>🗝️ Split Key</b> · waiting for the other team<span class="ff-clock" id="sk-clock" style="float:right"></span></div>${race(v)}${chatBox(v)}<div class="choices">${isHost() ? `<button class="c small" type="button" id="sk-end">🏁 Call it now</button>` : ""}${leaveBtn}</div>`);
    } else {
      const it = current(t.run), ln = lineOf(it.id), text = cipherText(it), M = (id) => methodOf(id), key = `${v.round}:${t.run.i}`;
      if (key !== shiftFor) { shiftFor = key; shift = 0; if (t.run.i !== lastI) sfx.unfold(); lastI = t.run.i; }
      draw(k, { doc: cipherHtml(it.m, text, ln.plain), label: `Document ${t.run.i + 1} of ${t.run.items.length}` }); cap(`🗝️ ${K.TEAMS[k].name} · document ${t.run.i + 1}`);
      const lastNote = t.last && t.last.i === t.run.i - 1 ? `<div class="note">${t.last.right ? "✅" : "💧"} Last one was ${esc(M(t.last.m).name)}${t.last.key ? ` (key ${esc(t.last.key)})` : ""}: “${esc(lineOf(t.last.id).plain)}”</div>` : "";
      let work;
      if (it.stage === "key" && it.m === "caesar") work = `<div class="note">Caesar it is. Turn the wheel (only you see your wheel), then commit the shift for the team.</div><div class="cd-wheelui"><button class="c small" type="button" id="sk-dn">◀</button><b id="sk-shift">shift ${shift}</b><button class="c small" type="button" id="sk-up">▶</button></div><div class="cd-preview" id="sk-prev">${esc(preview(it, shift))}</div><div class="choices"><button class="c main" type="button" id="sk-read">✒️ Commit this shift</button></div>`;
      else if (it.stage === "key") work = `<div class="note">Vigenère. One of the pinned words is the key: ${it.kws.map(esc).join(" · ")}</div><div class="choices col">${it.kws.map((w) => `<button class="c" type="button" data-k="${esc(w)}" ${it.tried.includes(w) ? "disabled" : ""}>${it.tried.includes(w) ? "✗ " : "🗝️ "}${esc(w)}</button>`).join("")}</div>`;
      else work = `${it.kws ? `<div class="note">📌 Pinned: <i>${it.kws.map(esc).join(" · ")}</i></div>` : ""}<div class="choices col">${it.choices.map((m) => { const bad = it.tried.includes(m); return `<button class="c" type="button" data-m="${m}" title="${esc(M(m).how)}" ${bad ? "disabled" : ""}>${bad ? "✗ " : ""}${M(m).e} ${esc(M(m).name)}</button>`; }).join("")}</div>`;
      ui(`<div class="cx-top"><b>🗝️ Split Key</b> · doc ${t.run.i + 1}/${t.run.items.length} · team ink ${drops(it.drops)}<span class="ff-clock" id="sk-clock" style="float:right"></span></div>${race(v)}${lastNote}<div style="width:100%">${work}</div>${chatBox(v)}
        <div class="choices">${isHost() ? `<button class="c small" type="button" id="sk-end">🏁 Call it now</button>` : ""}${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => act({ a: "method", m: b.dataset.m })));
      $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => act({ a: "key", k: b.dataset.k })));
      const wheel = (d) => { shift = (shift + d + 26) % 26; sfx.click(d > 0); $("sk-shift").textContent = `shift ${shift}`; $("sk-prev").textContent = preview(it, shift); };
      if ($("sk-dn")) { $("sk-dn").onclick = () => wheel(-1); $("sk-up").onclick = () => wheel(1); $("sk-read").onclick = () => act({ a: "key", k: shift }); }
    }
    if ($("sk-in")) { $("sk-in").value = typed; if (focused) $("sk-in").focus(); const lg = $("sk-log"); if (lg) lg.scrollTop = lg.scrollHeight; }
    wire(); clock();
  }

  function over(v, ev) {
    const rw = K.reward(v, me()), k = v.mine, W = v.winner;
    draw(k, { doc: `<div class="cd-claim"><b>${W === "draw" ? "A dead heat" : `${K.TEAMS[W].e} ${K.TEAMS[W].name} wins`}</b>${K.TEAMS.quill.name} ${K.scoreOf(v.teams.quill)} · ${K.TEAMS.seal.name} ${K.scoreOf(v.teams.seal)}</div>`, state: rw.won ? "solved" : "" });
    cap("🏁 Split Key");
    if (paid !== v.round && k) { paid = v.round; psx.fanfare(rw.won); sfx.finale(rw.won);
      const aw = award(rw.xp, rw.essence); saveProgress(); showStats();
      ctx.trophy?.("cipherdesk", v.n, { won: rw.won, perfect: rw.won && rw.perfect }); // Trophy Case (trophies.js)
      say(`${W === "draw" ? "A dead heat! Both teams read the same secrets." : W === k ? `${K.TEAMS[k].name} takes it! Every key turned, every seal pressed.` : `${K.TEAMS[W].name} takes this one. Rematch?`}${aw.rankUp ? ` You're now ${aw.rankUp}.` : ""}`); }
    const docs = (v.teams[k] || v.teams.quill).run.items.map((it, i) => `<div>${i + 1}. ${methodOf(it.m).e} ${esc(methodOf(it.m).name)}: “${esc(lineOf(it.id).plain)}”</div>`).join("");
    ui(`<div class="reward"><div><b>${!k ? "Race over" : rw.won ? "🏆 Your team wins!" : rw.draw ? "🤝 A draw" : "Your team lost this one"}</b>${k ? ` · ${rw.read} read · +${rw.xp} ✦ · +${rw.essence} 💎` : ""}</div></div>${race(v)}
      <div class="group">📜 The bundle</div><div class="note">${docs}</div>
      <div class="choices">${isHost() ? `<button class="c main" type="button" id="sk-again">🔀 Shuffle teams and race again</button>` : `<div class="note">The host can start a rematch (teams are shuffled).</div>`}${leaveBtn}</div>`);
    if ($("sk-again")) $("sk-again").onclick = () => hostAct(me(), { a: "start", n: v.n });
    wire(); void ev;
  }

  function lobby() {
    draw(null, { doc: `<div class="cd-claim"><b>Split Key</b>Two teams, one bundle, a split chat.</div>` }); cap("🗝️ Split Key");
    say("Split Key: everyone is split at random into two teams. Same coded bundle for both, a team chat the other side can't read, and a race to the last seal.");
    const n = members().length;
    ui(`<div class="cx-top"><b>🗝️ Split Key</b> · ${n} at the table${n < 2 ? " · you race Wren's apprentices" : ""}</div>
      ${T ? `<div class="chips">${members().map((m) => `<span>${esc(m.name || nameOf(m.id))}${m.id === T.host ? " 👑" : ""}</span>`).join("")}</div>` : ""}
      <div class="note">Teams are drawn at random. Anyone on a team can name the method or commit the key for the team's current document, and the ink is shared, so talk it over first in your team chat. ${K.TIME / 60} minutes. First team through gets +${K.RACE_BONUS}; the higher score wins.</div>
      ${solo ? `<div class="note">Open the Cipher Desk inside a Discord voice call to race friends.</div>` : ""}
      ${isHost() ? `<div class="levels">${[1, 2, 3].map((l) => `<button class="c level" type="button" data-sl="${l}"><b>${"🗝️".repeat(l)} Race at Level ${l}</b><span>${["Simple substitutions", "Signals and grids", "Keys and keywords"][l - 1]}</span></button>`).join("")}</div>` : `<div class="note">Waiting for ${esc(nameOf(T.host))} to split the teams…</div>`}
      <div class="choices">${leaveBtn}</div>`);
    $("ui").querySelectorAll("[data-sl]").forEach((b) => (b.onclick = () => { level = +b.dataset.sl; hostAct(me(), { a: "start", n: level }); }));
    wire();
  }
  function wire() {
    if ($("sk-leave")) $("sk-leave").onclick = leave;
    if ($("sk-end")) $("sk-end").onclick = () => act({ a: "end" });
    if ($("sk-send")) { const box = $("sk-in"), go = () => { const v = box.value.trim(); if (!v) return box.focus(); box.value = ""; act({ a: "say", text: v }); };
      $("sk-send").onclick = go; box.onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); go(); } }; }
    $("ui").querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => act({ a: "say", text: b.dataset.q })));
  }
  function startTicking() { stop(); tick = setInterval(() => { if (gone) return stop();
    if (state.inRoom && state.inRoom !== "cipherdesk") { gone = true; stop(); if (T) { const t = T; T = null; t.leave(); } return; } if (isHost()) hostTick(); clock(); }, 1000); }

  async function connect() {
    if (solo) { startTicking(); return lobby(); }
    say("Setting out two desks for everyone in the call…");
    let t; try { t = await joinTable("splitkey", state); } catch (e) { say(`The desks won't set (${e.message}). You can race Wren's apprentices.`); startTicking(); return lobby(); }
    if (gone) return t.leave(); T = t;
    t.on("msg", ({ from, m }) => { if (T !== t || gone) return; if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); }
      else if (m && m.k === "st") paint(m.st, m.ev, m.left); else if (m && m.k === "no") say(WHY[m.why] || "That can't go in the chat."); });
    t.on("members", () => { if (T !== t || gone) return; if (t.isHost()) { if (G && !G.over) { for (const m of t.members) K.join(G, m.id); broadcast(); } else if (!G) lobby(); } else if (!V) lobby(); });
    t.on("host", (snap) => { if (T !== t || gone) return; if (snap && snap.teams) { G = snap; until = Date.now() + 60000; } say("The host left. You're running the race now."); if (G) broadcast(); else lobby(); });
    t.on("close", () => { if (T !== t) return; T = null; G = null; say("The race lost its connection."); lobby(); });
    startTicking(); lobby();
  }
  connect();
  return { leave };
}
