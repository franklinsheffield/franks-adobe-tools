// Vell's Hazardous Guess Show: the Flame Test Lab's party game. Rules in show.js, stage in show-scene.js.
// In a Discord call everyone who opens the show shares one table (net.js joinTable "flameshow"; the host's client runs
// it). Alone, it's you against the bottles. Magister Vell always hosts: it's his show.
import { SAMPLES, sample } from "./data.js";
import { lookOf } from "./shop.js";
import { canJoin, joinTable } from "../net.js";
import * as S from "./show.js";
import { showSvg } from "./show-scene.js";
import * as fsx from "./sfx.js";
import * as psx from "../party/sfx.js";

const CSS = `
.hs-ans{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:8px 0}.hs-ans .c{padding:8px 4px}
.hs-ans .c.mine{outline:2px solid var(--teal)}
.hs-note{padding:8px 12px;border-radius:12px;border:1px dashed #ff9800;background:rgba(255,152,0,.1);margin:6px 0;animation:hs-in .4s ease-out both}
.hs-claim{font-family:ui-monospace,Menlo,monospace;font-size:.82rem;padding:12px 14px;border-radius:6px;background:#f3ecd8;color:#2a2018;margin:8px 0;transform:rotate(-.6deg);box-shadow:0 6px 18px #0008;animation:hs-in .6s cubic-bezier(.3,1.3,.5,1) both}
.hs-claim h4{margin:0 0 6px;font-family:Cinzel,Georgia,serif;letter-spacing:.06em}.hs-claim .stamp{display:inline-block;border:2px solid #b0002a;color:#b0002a;padding:0 6px;transform:rotate(-8deg);font-weight:700}
.hs-row{padding:6px 10px;border-radius:10px;border:1px solid var(--line);margin:4px 0;font-size:.9rem;animation:hs-in .4s ease-out var(--d) both}.hs-row.ok{border-color:#66E0C8;background:rgba(102,224,200,.1)}.hs-row.bad{border-color:#ff6b8a;background:rgba(255,107,138,.08)}
@keyframes hs-in{from{transform:translateY(-8px);opacity:0}}
@media (max-width:520px){.hs-ans{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (prefers-reduced-motion:reduce){.hs-note,.hs-claim,.hs-row{animation:none!important}}
`;
function styleOnce() { if (document.getElementById("hsr-style")) return; const s = document.createElement("style"); s.id = "hsr-style"; s.textContent = CSS; document.head.append(s); }

export function openShow(ctx, onBack) {
  const { $, esc, say, ui, cap, state, saveProgress, showStats, award, clearReading, tableEl } = ctx;
  styleOnce(); clearReading?.();
  let T = null, G = null, V = null, tick = null, until = 0, viewLeft = 0, viewAt = 0, done = false, gone = false, lastKey = "", saving = null;
  const solo = !canJoin(state), me = () => (T ? T.me.id : "me");
  const members = () => (T ? T.members : [{ id: "me", name: state.name }]);
  const nameOf = (id) => (T ? T.nameOf(id) : id === "me" ? state.name : "someone");
  const isHost = () => !T || T.isHost();
  const stop = () => { clearInterval(tick); tick = null; };
  const leave = () => { gone = true; stop(); if (T) { const t = T; T = null; t.leave(); } onBack(); };
  const draw = (o) => { tableEl.className = "table flametest"; tableEl.innerHTML = showSvg({ look: lookOf(state.prog), podium: lookOf(state.prog).podium, ...o }); };

  /* ---------- host ---------- */
  function setClock() { const s = G ? S.TIMES[G.phase] || 0 : 0; until = s ? Date.now() + s * 1000 : 0; }
  function broadcast(ev = "") {
    const left = until ? Math.max(0, Math.round((until - Date.now()) / 1000)) : 0;
    if (T) { for (const m of T.members) if (m.id !== me()) T.to(m.id, { k: "st", st: S.showView(G, m.id), left, ev }); T.snap(G); }
    paint(S.showView(G, me()), ev, left);
  }
  function hostAct(from, a) {
    if (!a) return;
    if (a.a === "start") { if (from !== me()) return; G = S.newShow(members()); done = false; setClock(); fsx.ignite(); return broadcast("start"); }
    if (!G) return;
    let r = null;
    if (a.a === "pick") r = S.answer(G, from, a.s);
    else if (a.a === "swap" || a.a === "fog") { r = S.sabotage(G, from, a.a, a.target); if (r && T && a.target !== me()) T.to(a.target, { k: "sab", card: r, by: from }); if (r && a.target === me()) sabbed(r, from); }
    else if (a.a === "bet") r = S.bet(G, from, a.k);
    else if (a.a === "firework") { r = S.nameFirework(G, from, a.id, false); if (r) return finale(); }
    else if (a.a === "skip" && from === me()) return step();
    if (!r) return;
    if (G.phase === "burn" && S.allAnswered(G)) return step();
    broadcast(a.a);
  }
  function step() { const was = G.phase, r = S.advance(G, members(), nameOf); if (!r) return; setClock(); if (r === "over") return finale(); broadcast(was + ">" + r); }
  function finale() { setClock(); broadcast("over"); }
  function hostTick() { if (!G || G.over || !until) return; const left = Math.round((until - Date.now()) / 1000);
    if (left <= 0) return step(); if (left <= 5 && G.phase === "burn") fsx.tick(left <= 2); }
  function act(a) { if (isHost()) hostAct(me(), a); else T.up({ k: "act", act: a }); }

  /* ---------- everyone ---------- */
  function sabbed(card, by) { psx.pop(); say(card === "swap" ? `${nameOf(by)} swapped your bottle! Read YOUR flame, it's a different salt now.` : `${nameOf(by)} fogged your goggles! Squint harder.`); }
  function clock() { const el = $("hs-clock"); if (!el || !viewAt) return; const left = Math.max(0, viewLeft - Math.round((Date.now() - viewAt) / 1000)); el.textContent = `⏱ ${left}s`; }
  const chips = (v) => `<div class="ff-score">${S.standings(v).map((r) => `<span>${esc(nameOf(r.id))} · ${r.score}</span>`).join("")}</div>`;
  const bar = (v) => `<div class="cx-top"><b>🎙️ Vell's Hazardous Guess Show</b> · bottle ${Math.min(v.i + 1, v.n)} of ${v.n} · Vell's damage ${"🩹".repeat(Math.min(5, v.mishap)) || "none yet"}<span class="ff-clock" id="hs-clock" style="float:right"></span></div>`;
  const leaveBtn = `<button class="c small" type="button" id="hs-leave">↩ Leave the show</button>`;
  const hostBtn = (v, t) => (isHost() && !v.over ? `<button class="c small" type="button" id="hs-skip">⏭ ${t}</button>` : "");

  function paint(v, ev = "", left = 0) {
    V = v; viewLeft = left; viewAt = Date.now();
    if (!v) return lobby();
    const B = v.bottles[Math.min(v.i, v.n - 1)], seated = v.seats.includes(me()), key = v.phase + v.i, fresh = key !== lastKey; lastKey = key;
    if (v.phase === "burn") {
      const mine = (v.swap || {})[me()] || B.id, fog = !!(v.fog || {})[me()], ans = (v.answers || {})[me()];
      draw({ flame: seated ? mine : B.id, mishap: v.mishap, label: B.label, shelf: B.shelf, fog });
      cap(`🎙️ Bottle ${v.i + 1}: “${B.label}”`);
      if (fresh) { fsx.sizzle(v.i); say(v.i === 0 ? `Welcome, welcome, to the Hazardous Guess Show! I'm your host, Magister Vell, and I am fully insured. Mostly. Bottle one: “${B.label}”. Name that flame!`
        : v.i === v.n - 1 ? `Last bottle, folks! “${B.label}”. My eyebrows are counting on you.` : `Bottle ${v.i + 1}: “${B.label}”. Into the flame it goes. Stand back. Further. Bit further.`); }
      const others = v.seats.filter((id) => id !== me() && !(v.answers || {})[id] || false), cards = (v.cards || {})[me()] || {};
      const sab = seated && !ans && others.length && (cards.swap || cards.fog)
        ? `<div class="group">🃏 Sabotage (one of each per show)</div><div class="choices">${others.map((id) => `${cards.swap ? `<button class="c small" type="button" data-sab="swap" data-t="${id}">🔄 Swap ${esc(nameOf(id))}'s bottle</button>` : ""}${cards.fog ? `<button class="c small" type="button" data-sab="fog" data-t="${id}">🌫️ Fog ${esc(nameOf(id))}'s goggles</button>` : ""}`).join("")}</div>` : "";
      const bets = !seated ? `<div class="group">🎲 Audience bet: which bottle does Vell knock over next?</div><div class="choices">${B.shelf.map((l, k) => `<button class="c small${(v.bets || {})[me()] === k ? " main" : ""}" type="button" data-bet="${k}">🧪 “${esc(l)}”</button>`).join("")}</div><div class="note">A right bet is 1 💎 at the end (up to ${S.AUD_GEMS}). You get a seat at the next bottle.</div>` : "";
      ui(`${bar(v)}${(v.swap || {})[me()] ? `<div class="hs-note">🔄 Someone swapped your bottle! Name the salt in <b>your</b> flame.</div>` : ""}${fog ? `<div class="hs-note">🌫️ Your goggles are fogged. Guess bravely.</div>` : ""}
        ${seated ? (ans ? `<div class="note">🔒 Locked in: <b>${esc(sample(ans.s).name)}</b>. Waiting for the others…</div>` : `<div class="note">Which element is burning? Right: ${S.RIGHT} points, fastest right answer +${S.FIRST}.</div><div class="hs-ans">${SAMPLES.map((s) => `<button class="c" type="button" data-s="${s.id}">${esc(s.sym)} · ${esc(s.name)}</button>`).join("")}</div>`) : ""}
        ${sab}${bets}<div class="note">🔒 ${Object.keys(v.answers || {}).length} of ${v.seats.length} locked in</div>${v.seats.length > 1 ? chips(v) : ""}<div class="choices">${hostBtn(v, "Light it up now")}${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => { fsx.glass(); act({ a: "pick", s: b.dataset.s }); }));
      $("ui").querySelectorAll("[data-sab]").forEach((b) => (b.onclick = () => { psx.pop(); act({ a: b.dataset.sab, target: b.dataset.t }); }));
      $("ui").querySelectorAll("[data-bet]").forEach((b) => (b.onclick = () => act({ a: "bet", k: +b.dataset.bet })));
    } else if (v.phase === "reveal") {
      const L = v.last, s = sample(L.id), hurt = L.wrong.length > 0, harm = S.harmAt(L.mishap);
      draw({ flame: L.id, mishap: v.mishap, hit: hurt, label: B.label, shelf: B.shelf, drop: L.drop });
      cap(`🎙️ “${B.label}” was ${s.name}!`);
      if (fresh) { setTimeout(psx.crash, 1150); if (hurt) { fsx.wrong(); if (harm && harm.id === "alarm") setTimeout(psx.siren, 300); } else fsx.right();
        const w = L.wrong[0], c = (v.claims || []).find((x) => x.bottle === v.i + 1 && x.who === w);
        say([hurt ? S.roastLine({ guess: c ? c.guess : "That", real: c ? c.real : s.name, name: nameOf(w) }) : L.right.length ? S.cheerLine({ name: nameOf(L.first || L.right[0]), real: s.name }) : `Nobody? It was ${s.name}!`,
          hurt && harm ? harm.line : "", `“${B.shelf[L.drop]}” just fell off the shelf. Don't worry about it.`].filter(Boolean).join(" ")); }
      const rows = v.seats.map((id, k) => { const a = (v.answers || {})[id], real = (L.swaps || {})[id] || L.id, ok = L.right.includes(id);
        return `<div class="hs-row ${ok ? "ok" : "bad"}" style="--d:${(k * 0.1).toFixed(1)}s">${ok ? "✅" : a ? "💥" : "⌛"} <b>${esc(nameOf(id))}</b> ${a ? `said ${esc(sample(a.s).name)}` : "didn't answer"}${(L.swaps || {})[id] ? ` (their bottle was swapped to ${esc(sample(real).name)})` : ""}${L.gain[id] ? ` · +${L.gain[id]}` : ""}${L.first === id ? " ⚡ fastest" : ""}</div>`; }).join("");
      const myBet = (v.bets || {})[me()];
      ui(`${bar(v)}<div class="ff-fact"><b>🔥 ${esc(s.name)} (${esc(s.sym)}) burns ${esc(s.colour)}</b><br>${esc(s.fact)}<br><span class="note">${esc(s.use)}</span></div>${rows}
        ${myBet !== undefined ? `<div class="note">${myBet === L.drop ? "🎲 Your bet was right! +1 💎 at the end." : "🎲 Your bet missed. Vell is unpredictable."}</div>` : ""}${chips(v)}
        <div class="choices">${hostBtn(v, v.i >= v.n - 1 ? "To the finale" : "Next bottle")}${leaveBtn}</div>`);
    } else if (v.phase === "final") {
      draw({ flame: null, mishap: v.mishap, label: "", shelf: [] });
      cap("🎆 The finale");
      if (fresh) say(`What a show! Our winner is ${nameOf(v.winner)}! As tradition demands, which I just invented, the winner names the closing firework.`);
      ui(`${bar(v)}${v.winner === me() ? `<div class="group">🎆 Name the closing firework</div><div class="choices col">${S.FIREWORKS.map((f) => `<button class="c" type="button" data-fw="${f.id}">${esc(f.name)}</button>`).join("")}</div>`
        : `<div class="note">${esc(nameOf(v.winner))} is naming the closing firework…</div>`}${chips(v)}<div class="choices">${hostBtn(v, "Pick one for them")}${leaveBtn}</div>`);
      $("ui").querySelectorAll("[data-fw]").forEach((b) => (b.onclick = () => act({ a: "firework", id: b.dataset.fw })));
    } else if (v.phase === "over") return over(v);
    wire(); clock();
  }

  function over(v) {
    const fw = S.fireworkOf(v.firework), claim = S.claimOf(v, nameOf), players = v.seats.length, rw = S.reward(v, me(), players);
    draw({ flame: null, mishap: v.mishap, label: "", shelf: [], firework: v.firework }); cap(`🎆 ${fw ? fw.name : "Fireworks"}`);
    if (!done) { done = true; psx.firework(); setTimeout(psx.firework, 700); psx.fanfare(rw.won || (players === 1 && rw.perfect));
      const aw = award(rw.xp, rw.essence); saveProgress(); showStats();
      ctx.trophy?.("flametest", 1, { won: players > 1 ? rw.won : rw.perfect, perfect: rw.perfect }); // Trophy Case (trophies.js); solo only a perfect show wins
      saving = claim; ctx.logEvent?.("save", "📋", `Vell's insurance claim #${claim.no}`, null, [["Show", "Vell's Hazardous Guess Show"], ["Winner", claim.winner], ["Parties responsible", claim.losers.join(", ") || "none, somehow"], ["Damages", claim.damages.join(" ") || "None! A miracle."], ["Closing firework", claim.firework]]);
      say(`${fw ? `Ladies and gentlemen: ${fw.name}!` : "Fireworks!"} ${v.mishap ? "I'll be filing the paperwork from the burns unit. Kidding! It's soot. It's just soot." : "Not a single singe! Is this a record? This is a record."}${aw.rankUp ? ` And you're now ${aw.rankUp}.` : ""}`); }
    ui(`<div class="reward"><div><b>${players > 1 ? (rw.place === 1 ? "🏆 You win the show!" : `You came ${["", "1st", "2nd", "3rd"][rw.place] || rw.place + "th"}`) : `🔥 ${rw.correct} of ${v.n} flames named`}</b> · ${rw.score} points · +${rw.xp} ✦${rw.essence ? ` · +${rw.essence} 💎` : ""}</div></div>
      <div class="hs-claim"><h4>📋 INSURANCE CLAIM #${claim.no}</h4>Claimant: Magister Vell, Alchemist (registered)<br>Event: The Hazardous Guess Show<br>Winner: ${esc(claim.winner)}<br>Parties responsible: <b>${esc(claim.losers.join(", ") || "none, somehow")}</b><br><br>${claim.damages.map((d) => `• ${esc(d)}`).join("<br>") || "• No damages. Vell is suspicious."}<br><br>Closing firework: ${esc(claim.firework)} <span class="stamp">FILED</span></div>
      <div class="note">📖 A copy of the claim is saved in your Grimoire's Journal.</div>${chips(v)}
      <div class="choices">${isHost() ? `<button class="c main" type="button" id="hs-again">🎙️ Another show</button>` : `<div class="note">The host can start another show.</div>`}${leaveBtn}</div>`);
    if ($("hs-again")) $("hs-again").onclick = () => hostAct(me(), { a: "start" });
    wire(); void saving;
  }

  function lobby() {
    draw({ flame: "na", mishap: 0, label: "Probably Not Soup", shelf: ["Do Not Shake", "Totally Fine", "Mostly Harmless"] }); cap("🎙️ Vell's Hazardous Guess Show");
    say("Welcome to the Hazardous Guess Show! Real salts, real flames, real chemistry, and one very brave host. Every wrong answer costs me something. Usually eyebrows.");
    ui(`<div class="cx-top"><b>🎙️ Vell's Hazardous Guess Show</b> · ${solo ? "solo: you against the bottles" : `${members().length} contestants`}</div>
      ${T ? `<div class="chips">${members().map((m) => `<span>${esc(m.name || nameOf(m.id))}${m.id === T.host ? " 👑" : ""}</span>`).join("")}</div>` : ""}
      <div class="note">${S.BOTTLES} Mystery Bottles, each a real salt. Name the element from its flame: ${S.RIGHT} points, +${S.FIRST} for the fastest. Each wrong answer sets off Vell's next mishap and goes on his insurance claim. One 🔄 Swap and one 🌫️ Fog card each to sabotage rivals. Watchers bet on which bottle Vell knocks over. The winner names the closing firework.</div>
      ${solo ? `<div class="note">Open the show inside a Discord voice call and everyone in the call plays together.</div>` : ""}
      <div class="choices">${isHost() ? `<button class="c main" type="button" id="hs-start">🎙️ Start the show</button>` : `<div class="note">Waiting for ${esc(nameOf(T.host))} to start…</div>`}${leaveBtn}</div>`);
    if ($("hs-start")) $("hs-start").onclick = () => hostAct(me(), { a: "start" });
    wire();
  }
  function wire() { if ($("hs-skip")) $("hs-skip").onclick = () => act({ a: "skip" }); if ($("hs-leave")) $("hs-leave").onclick = leave; }
  function startTicking() { stop(); tick = setInterval(() => { if (gone) return stop();
    if (state.inRoom && state.inRoom !== "flametest") { gone = true; stop(); if (T) { const t = T; T = null; t.leave(); } return; } if (isHost()) hostTick(); clock(); }, 1000); }

  async function connect() {
    if (solo) { startTicking(); return lobby(); }
    say("Setting up the studio for everyone in the call…");
    let t; try { t = await joinTable("flameshow", state); } catch (e) { say(`The studio won't open (${e.message}). You can still play solo.`); startTicking(); return lobby(); }
    if (gone) return t.leave(); T = t;
    t.on("msg", ({ from, m }) => { if (T !== t || gone) return;
      if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); }
      else if (m && m.k === "st") paint(m.st, m.ev, m.left);
      else if (m && m.k === "sab") sabbed(m.card, m.by); });
    t.on("members", () => { if (T !== t || gone) return; if (t.isHost()) { if (G) for (const m of t.members) S.join(G, m.id); if (G) broadcast(); else lobby(); } else if (!V) lobby(); });
    t.on("host", (snap) => { if (T !== t || gone) return; if (snap && snap.bottles) { G = snap; setClock(); } say("The host left. You're running the show now!"); if (G) broadcast(); else lobby(); });
    t.on("close", () => { if (T !== t) return; T = null; G = null; say("The studio lost its connection."); lobby(); });
    startTicking(); lobby();
  }
  connect();
  return { leave };
}
