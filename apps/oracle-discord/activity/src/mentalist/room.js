// The Mentalist: a room of the Oracle Chamber (and the Séance Parlour). You play a stage "mind reader" with the real
// methods: card forces and cold reading (Level 1), the Houdinis' two-person word code (Level 2) and billets read one
// ahead (Level 3). Wrong answers cost nerve; lose it all and you're booed off. With friends: the two-person act.
// The face-down cards wear the one shared card back (cardbacks.js). Nobody reads minds: the audience is fooled, kindly.
import { CODE, CARD, LEVELS, FORCES, forceOf } from "./data.js";
import { room as mtOf, start, roundNow, choose, scoreOf, perfect, settle, dailyOf, NERVE, METHOD_IDS, METHOD_NAMES } from "./logic.js";
import { actStart, actMove, actView, actReward, ACT_PASS } from "./group.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { stageSvg } from "./scene.js";
import { CSS } from "./style.js";
import { equippedBack } from "../cardbacks.js";
import * as sfx from "../seance/sfx.js";
import { page, coins, glass } from "../flametest/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { canJoin, joinTable } from "../net.js";
import { host } from "../hosts/index.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("mt-style")) return; const s = document.createElement("style"); s.id = "mt-style"; s.textContent = CSS; document.head.append(s); };
/** The code chart (Pray = 1 … Be quick = 10). */
export const codeChartHtml = (esc) => `<div class="mt-code">${CODE.map(([w, n]) => `<span><b>${esc(w)}</b><br>${n === 10 ? "10 / 0" : n}</span>`).join("")}</div>`;

export const mentalist = {
  id: "mentalist", label: "The Mentalist", emoji: "🎩",
  blurb: "Read minds on stage with forces, codes and billets, and learn how it's done",
  shop: { kind: "mentalist", label: "🎩 Mentalist's stage", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table mentalist";
      tableEl.innerHTML = stageSvg({ look: { ...DEFAULT_LOOK, [it.slot]: id }, mode: "force", card: 7 }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => mtOf(P());
    const rook = () => host().id === "parlour";
    const draw = (o = {}) => { tableEl.className = "table mentalist"; tableEl.innerHTML = stageSvg({ look: lookOf(P()), back: equippedBack(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const codeBtn = () => `<button class="c small" type="button" id="mt-chart">📜 The code</button>`;
    const wireChart = () => { const b = $("mt-chart"); if (b) b.onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".mt-code"); page(); rb.innerHTML = on ? `<div class="ft-card"><b>📜 The Houdinis' word code</b><p>The first word of a question carries the number. Letters too: Pray = A, Answer = B … Be quick = J.</p>${codeChartHtml(esc)}</div>` : ""; }; };

    function lobby(first) {
      clearReading(); cap("🎩 The Mentalist"); draw({ mode: "force" });
      const r = R(), ds = dailyState(P(), "mentalist"), dd = dailyOf();
      say(first && !r.plays
        ? (rook() ? `Mind reading, ${state.name}. I'll teach you the forces, the code and the billets. The only mind you'll read is the audience's habits.` : `Here you play a stage mind reader, ${state.name}, with the real methods: forces, a word code and billets. Wrong answers cost nerve.`)
        : pick(rook() ? ["Blindfold on, darling. Peek down the side of your nose.", "Every mind reader had a method. Most had a partner.", "Think of a card. No, not that one. The one I want."]
          : ["The spotlight is warming up.", "The audience is seated.", "Think of a number between 1 and 10…"]));
      ui(`<div class="cx-top"><b>🎩 Mentalist</b> · ${r.methods.length} / ${METHOD_IDS.length} methods learned</div>
        <div class="levels">${LEVELS.map((L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🎩".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${L.rounds} rounds · points ×${L.mult}${r.best[L.n] ? ` · best ${r.best[L.n]}` : ""}</span></button>`).join("")}</div>
        <div class="note">Three 🎭 of nerve. Each wrong answer makes the audience murmur; lose all three and you're booed off.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="mt-daily"><b>📅 Daily show${ds.played ? " · done ✓" : ""}</b><span>The same show for everyone today · Level ${dd.L.n}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="mt-group">👥 The two-person act (friends)</button><button class="c" type="button" id="mt-book">📒 Methods</button>${codeBtn()}<button class="c" type="button" id="mt-shop">🎭 Stage shop</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => begin(start(LEVELS[+b.dataset.l - 1]))));
      $("mt-daily").onclick = () => { const d = dailyOf(); begin(start(d.L, { seed: d.seed, daily: d.day })); };
      $("mt-book").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".mt-log"); page(); rb.innerHTML = on ? methodsHtml(P(), esc) : ""; $("mt-book").textContent = on ? "✕ Close" : "📒 Methods"; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("mt-group").onclick = group; $("mt-shop").onclick = shop; $("back").onclick = greet; wireChart();
    }
    const begin = (run) => { clearReading(); sfx.summon(); say(run.L.open); show(run); };
    const sceneOf = (run, rd, extra = {}) => ({ mode: rd.kind, card: rd.kind === "hear" ? null : rd.card || null, cue: rd.kind === "hear" ? rd.prompt.match(/“(.+?)”/)?.[1] || "" : "", slips: rd.kind === "billet" ? run.rounds.length - run.i : 0, nerve: run.nerve, ...extra });
    function show(run, fx = {}) {
      const rd = roundNow(run), L = run.L, code = ["send", "hear", "two"].includes(rd.kind);
      cap(`🎩 Level ${L.n} · round ${run.i + 1} of ${run.rounds.length}${run.daily ? " · 📅 daily" : ""}`);
      draw(sceneOf(run, rd, fx));
      const head = { force: "🂠 Force the card", read: "🧠 Read the sitter: pick the line that will hit", send: "📣 Send the card", hear: "🙈 Name the card", two: "📣 Send the number", billet: "✉️ One ahead" }[rd.kind];
      ui(`<div class="cx-top">Level ${L.n} · nerve ${"🎭".repeat(run.nerve)}${"·".repeat(NERVE - run.nerve)} · ${run.pts} pts</div>
        <div class="ft-card"><b>${head}</b><p>${esc(rd.prompt)}</p></div>
        <div class="choices col">${rd.options.map((o) => { const tried = run.tried.includes(o.id); return `<button class="c" type="button" data-o="${esc(o.id)}" ${tried ? "disabled" : ""}>${tried ? "✗ " : ""}${esc(o.text)}</button>`; }).join("")}</div>
        <div class="choices">${code ? codeBtn() : ""}<button class="c small" type="button" id="mt-leave">End the show</button></div>`);
      $("ui").querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => outcome(run, rd, choose(run, b.dataset.o))));
      $("mt-leave").onclick = () => lobby(false); wireChart();
    }
    function outcome(run, rd, res) {
      if (!res) return;
      if (res === "wrong") { sfx.wrong(); ctx.emote?.("surprise", { quiet: true }); say(rook() ? pick(["A murmur in the stalls, darling. Try again, and smile.", "Not that. Keep your nerve."]) : pick(["The audience murmurs. Try again.", "A miss. Keep your nerve."])); return show(run, { state: "miss" }); }
      if (res === "booed") { sfx.darkness(); return finish(run); }
      sfx.reveal(); spark(); ctx.banter?.("mid");
      if (res === "won") { draw(sceneOf(run, rd, { state: "won", slips: 0 })); return setTimeout(() => finish(run, rd), 900); }
      draw(sceneOf(run, rd, { state: "hit", opened: rd.kind === "billet" ? rd.opened : "", slips: rd.kind === "billet" ? run.rounds.length - run.i : 0 }));
      say(pick(["Applause!", "A gasp from the front row.", "They're on their feet!", "How did you know?"]));
      const slip = rd.kind === "billet" ? `<p>You open slip ${run.i} “to check”. It reads:</p><div class="mt-slip">${esc(rd.opened)}</div><p><b>Remember it.</b> It's your next answer.</p>` : "";
      ui(`<div class="cx-top">Level ${run.L.n} · ${run.pts} pts</div><div class="ft-card"><b>💡 How it's done</b><p>${esc(rd.fact)}</p>${slip}</div>
        <div class="choices"><button class="c main" type="button" id="mt-next">🎩 Next round</button></div>`);
      $("mt-next").onclick = () => show(run);
    }
    function finish(run, lastRd = null) {
      const L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("mentalist", L.n, { won: run.won, perfect: perfect(run) }); // Trophy Case (trophies.js)
      draw({ mode: lastRd ? lastRd.kind : null, nerve: run.nerve, state: run.won ? "won" : "booed" });
      cap(run.won ? "🎩 A standing ovation" : "🎩 Booed off");
      if (run.won) chime(perfect(run) ? 2 : 1);
      say(run.won ? (rook() ? "A standing ovation, and not one mind was read. That's the act, darling." : "A standing ovation. And now you know every method you used.")
        : (rook() ? "Booed off! Even Houdini had nights like this, darling. Learn the method and go again." : "Booed off. Look at how each method works, then try again."));
      const bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, run.won ? `score ${r.score}` : "booed off this time"];
      if (r.fresh.length) bits.push(`📒 new methods: ${r.fresh.map((m) => METHOD_NAMES[m]).join(", ")}`); if (perfect(run)) bits.push("✨ not a single murmur");
      let board = "";
      if (run.daily) { const res = { score: r.score, won: run.won, detail: L.name }, fd = finishDaily(P(), "mentalist", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("mt-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: r.score } }); };
        (fd.first ? postDaily(state, "mentalist", res) : boardOf(state, "mentalist")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="mt-board" class="note">Loading the board…</div>`; }
      const plant = run.plant ? `<p>Your plant's slip was the last one in the pile, and it went into your pocket: “${esc(run.plant)}”</p>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}
        <div class="ft-card"><b>How it's done</b>${[...new Set(run.rounds.slice(0, Math.max(run.i, 1)).map((x) => x.method))].map((m) => `<p><b>${esc(METHOD_NAMES[m])}:</b> ${esc(methodLine(m))}</p>`).join("")}${plant}</div>
        <div class="choices"><button class="c main" type="button" id="mt-again">🎩 Another Level ${L.n} show</button><button class="c" type="button" id="mt-lobby">🎩 The stage</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("mt-again").onclick = () => begin(start(L)); $("mt-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }
    function shop(msg) {
      clearReading(); cap("🎭 Stage shop"); const look = lookOf(P()); draw({ mode: "force", card: 7 });
      say(typeof msg === "string" ? msg : rook() ? `Blindfolds, backdrops and props, ${state.name}. The card backs live in the Cards department.` : `Blindfolds, backdrops and props, ${state.name}. Paid in Essence. Card backs are in the store's Cards department.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="mt-lobby">🎩 Back to the stage</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const res = buyOrUse(P(), b.dataset.b);
        if (res === "poor") return shop("Not enough Essence yet. A few more shows first.");
        if (res) { saveProgress(); showStats(); res === "bought" ? coins() : glass(); shop(res === "bought" ? "On stage. Spotlight, please." : "Swapped in."); } }));
      $("mt-lobby").onclick = () => lobby(false);
    }

    /* ---------- The two-person act: mentalist + assistant, others watch (net.js table; host runs group.js) ---------- */
    let T = null, G = null, paid = 0;
    const gone = () => state.inRoom !== "mentalist" || !T;
    function leaveGroup() { if (T) { const t = T; T = null; G = null; t.leave(); } }
    async function group() {
      if (!canJoin(state)) return say("The two-person act needs a partner: open the Chamber inside a Discord voice call, and everyone who opens The Mentalist joins the same stage.");
      say("Setting the stage…");
      try { T = await joinTable("mentalist", state); } catch (e) { T = null; return say(`The stage won't open: ${e.message}`); }
      const t = T;
      t.on("msg", ({ from, m }) => { if (T !== t) return; if (state.inRoom !== "mentalist") return leaveGroup();
        if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); } else if (m && m.k === "st") { G = m.st; gpaint(m.ev); } });
      t.on("members", () => { if (T !== t) return; if (state.inRoom !== "mentalist") return leaveGroup(); if (t.isHost()) broadcast(); else gpaint(); });
      t.on("host", (snap) => { if (T !== t) return; if (snap && snap.cards) G = snap; say("The host left. You run the act now."); broadcast(); });
      t.on("close", () => { if (T !== t) return; T = null; G = null; say("The act broke up (connection lost)."); lobby(false); });
      sfx.summon(); gpaint();
      say(t.isHost() ? "You host the act. Start when your partner is here: roles swap each game." : `You join ${t.nameOf(t.host)}'s act. Wait for the first card.`);
    }
    function broadcast(ev = "") { if (!T || !T.isHost()) return; for (const m of T.members) T.to(m.id, { k: "st", st: G && actView(G, m.id), ev }); T.snap(G); gpaint(ev); }
    function hostAct(who, a) { if (!G) return; const ev = actMove(G, who, a); if (ev) broadcast(ev); }
    function gact(a) { if (!T) return; if (T.isHost()) hostAct(T.me.id, a); else T.up({ k: "act", act: a }); }
    function gpaint(ev = "") {
      if (gone()) return; const t = T, me = t.me.id, nm = (id) => esc(t.nameOf(id));
      const who = t.members.map((m) => `<span>${G && m.id === G.mentalist ? "🙈 " : G && m.id === G.assistant ? "📣 " : m.id === t.host ? "👑 " : ""}${esc(m.name)}${m.id === me ? " (you)" : ""}</span>`).join("");
      const head = `<div class="cx-top"><b>👥 The two-person act</b> · ${t.members.length} here</div><div class="chips">${who}</div>`, leave = `<div class="choices">${codeBtn()}<button class="c small" type="button" id="mt-gleave">Leave the stage</button></div>`;
      if (ev === "round" || ev === "over") { const l = G.log[0]; l.hit ? (sfx.reveal(), spark()) : sfx.wrong(); }
      if (!G) { draw({ mode: "send" }); ui(`${head}${t.isHost() ? (t.members.length >= 2 ? `<div class="choices"><button class="c main" type="button" id="mt-gstart">🎩 Start the act</button></div>` : `<div class="note">Waiting for a partner to join…</div>`) : `<div class="note">Waiting for ${nm(t.host)} to start…</div>`}<div class="note">One player is the blindfolded mentalist, one is the assistant. The assistant sees a card and sends one cue word from the code; the mentalist names the card. ${ACT_PASS} hits out of 5 and the act is a success.</div>${leave}`); return gwire(); }
      const score = `<div class="note">🎯 ${G.hits} hits · card ${Math.min(G.i + 1, G.cards.length)} of ${G.cards.length}</div>`;
      const log = G.log.length ? `<div class="mt-log">${G.log.map((l) => `<div>${l.hit ? "🎯" : "✗"} ${CARD[l.card]}: cue “${esc(l.cue)}”, named ${CARD[l.said]}${l.clean ? "" : " (wrong cue)"}</div>`).join("")}</div>` : "";
      let body; const card = G.cards[G.i];
      if (G.over) { const rw = actReward(G); if (paid !== G.game) { paid = G.game; award(rw.xp, rw.essence); R().plays++; saveProgress(); showStats(); rw.won ? chime(1) : sfx.darkness(); }
        draw({ mode: "send", state: rw.won ? "won" : "booed" });
        body = `<div class="reward"><div><b>${rw.won ? "A standing ovation!" : "Booed off!"}</b> ${G.hits} of ${G.cards.length} hits</div><div>+${rw.xp} ✦ · +${rw.essence} 💎</div></div>${t.isHost() ? `<div class="choices"><button class="c main" type="button" id="mt-gstart">🎩 Next game (swap roles)</button></div>` : ""}`; }
      else if (G.mentalist === me) { draw({ mode: "hear", cue: G.cue ? `“${G.cue}…”` : "" });
        say(G.cue ? `Your partner says: “${G.cue}…” Name the card.` : "You're blindfolded. Wait for your partner's cue.");
        body = `<div class="ft-card"><b>🙈 You're the mentalist</b><p>${G.cue ? `Cue word: <b>${esc(G.cue)}</b>` : "Listening…"}</p></div>${G.cue ? `<div class="choices col">${CARD.slice(1).map((c, k) => `<button class="c" type="button" data-gn="${k + 1}">${c}</button>`).join("")}</div>` : ""}`; }
      else if (G.assistant === me) { draw({ mode: "send", card, cue: G.cue ? `“${G.cue}…”` : "" });
        say(G.cue ? "Cue sent. Watch your partner." : `The spectator shows you the ${CARD[card]}. Send its cue word.`);
        body = `<div class="ft-card"><b>📣 You're the assistant</b><p>The card is the <b>${CARD[card]}</b>.${G.cue ? ` You said “${esc(G.cue)}”.` : ""}</p></div>${G.cue ? "" : `<div class="choices col">${CODE.map(([w, n]) => `<button class="c" type="button" data-gw="${esc(w)}">“${esc(w)}…” <small>(${n})</small></button>`).join("")}</div>`}`; }
      else { draw({ mode: "send", card, cue: G.cue ? `“${G.cue}…”` : "" });
        body = `<div class="ft-card"><b>👀 You're in the audience</b><p>The card is the ${CARD[card]}. ${G.cue ? `${nm(G.assistant)} says “${esc(G.cue)}…”. Will ${nm(G.mentalist)} get it?` : `Watch ${nm(G.assistant)} send it.`}</p></div>`; }
      ui(`${head}${score}${body}${log}${leave}`); gwire();
    }
    function gwire() {
      $("mt-gleave").onclick = () => { leaveGroup(); lobby(false); }; wireChart();
      if ($("mt-gstart")) $("mt-gstart").onclick = () => { if (!T || !T.isHost() || T.members.length < 2) return; G = actStart(T.members, (G ? G.game : 0) + 1); sfx.summon(); broadcast("start"); };
      $("ui").querySelectorAll("[data-gw]").forEach((b) => (b.onclick = () => { glass(); gact({ a: "cue", w: b.dataset.gw }); }));
      $("ui").querySelectorAll("[data-gn]").forEach((b) => (b.onclick = () => { page(); gact({ a: "name", v: +b.dataset.gn }); }));
    }
    lobby(true);
  },
};

/** One line on how a method works, for the end screen and the methods book. */
export function methodLine(m) {
  const f = forceOf(m); if (f) return `${f.how} ${f.fact}`;
  return { barnum: "Say things that are true of nearly everyone; the sitter fills in the rest. In 1948 Bertram Forer's students rated one shared reading 4.26 out of 5.",
    code: "The first word of each question carries a number: Pray 1, Answer 2, Say 3, Now 4, Tell 5, Please 6, Speak 7, Quickly 8, Look 9, Be quick 10.",
    oneahead: "Answer the slip you opened last, open the next one 'to check'. The first answer is your plant's; the last slip you open is theirs." }[m] || "";
}
/** Every method and how it works (reading area). */
export function methodsHtml(p, esc) {
  const r = mtOf(p);
  return `<div class="mt-log"><h3>📒 Methods · ${r.methods.length} / ${METHOD_IDS.length} learned</h3>${METHOD_IDS.map((m) => { const on = r.methods.includes(m), f = FORCES.find((x) => x.id === m);
    return `<div><b>${on ? (f ? f.e : "✅") : "❔"} ${esc(METHOD_NAMES[m])}</b>${on ? `<br><small>${esc(methodLine(m))}</small>` : ""}</div>`; }).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function mentalistCodex(p, esc) {
  const r = mtOf(p);
  return `<div class="cx"><div class="cx-h"><span>🎩 The Mentalist</span><span class="note">${r.methods.length} / ${METHOD_IDS.length} methods · ${Object.values(r.wins).reduce((a, b) => a + b, 0)} ovations</span></div><div class="bar"><i style="width:${(r.methods.length / METHOD_IDS.length) * 100}%"></i></div>
    ${r.methods.length ? `<div class="chips">${r.methods.map((id) => `<span>${esc(METHOD_NAMES[id] || id)}</span>`).join("")}</div>` : ""}</div>`;
}
