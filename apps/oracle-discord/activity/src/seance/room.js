// The Séance: Guess the Ghost. A room in the Oracle Chamber. The Oracle summons a ghost; each clue it raps out is one
// real method or fact of what it practised. Level 1: general practices. Level 2: specific techniques. Level 3: real
// historical scientists and magicians. First say magic, science or both, then name it: type it for the real challenge,
// or ask for four to pick from. Rules in logic.js, decks in practices.js and ghosts.js. Mounted via ROOMS (main.js).
import { FIELDS } from "./ghosts.js";
import { shop, candleLook } from "./shop.js";
import { ghostShop, ghostBody } from "./ghostlooks.js";
import { maskShop } from "./masks.js";
import { openImpostor } from "./impostor-room.js";
import * as sfx from "./sfx.js";
import { CANDLES, LEVELS, ALL, keyOf, perCandle, fieldPts, room as seanceOf, solvedCount, titleOf, nextTitle, ghostById, nextGhost, start, guessField, moreClue, usePick, whoIs, choices, guessName, settle, optionById, answersOf, PICK_COST, guessMethod, hintsFor, buyHint, HINT_COST, related, dailyPick, shareLine } from "./logic.js";
import { canJoin, joinTable } from "../net.js";
import { GROUP_LEVELS, groupStart, groupGhost, groupAct, groupReward } from "./group.js";
import { dailySeed, dailyState, finishDaily, postDaily, boardOf, boardHtml, dayNumber } from "../daily.js";

const an = (n) => (/^[aeiou]/i.test(n) ? "an " : "a ") + n.charAt(0).toLowerCase() + n.slice(1);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WRONG = [
  "The ghost sighs. A candle goes out. \"Nobody ever remembers me…\"",
  "Three angry raps. Wrong spirit, and this one is offended.",
  "The planchette slides to NO, then to RUDE. A candle gutters.",
  "A cold draught. \"I'll have you know I was FAMOUS.\" One candle fewer.",
];
const NOT_IN_POOL = "That isn't one of the answers in the pool below. Pick the closest kind of science or magic. No candle lost.";
const UNKNOWN = ["The spirits don't recognise that name. Try a full name, or check the spelling. No candle lost.", "Hmm. Nobody by that name is answering tonight. No candle lost."];

/** The séance table in the Chamber's table pane: candles (lit or out), the ghost, and its reveal. */
// fx: "summon" (ghost rises), "knock" (table jolts), "no" (ghost shakes its head), "nod", "yes" (sparkles),
// "dark" (last candle out). was = candles lit before this draw, so newly snuffed flames animate out.
function sceneSvg(g, run, revealed = false, candle, fx = "", was = null, ghost = "") {
  const fl = candleLook(candle);
  const lit = run ? run.candles : CANDLES, xs = [84, 136, 200, 264, 316];
  const candles = xs.map((x, i) => { const on = i < lit, y = i === 0 || i === 4 ? 214 : i === 2 ? 226 : 221;
    if (!on && was != null && i < was) return `<g class="sc-candle snuffing" style="--d:${((was - 1 - i) * 0.18).toFixed(2)}s"><ellipse cx="${x}" cy="${y + 26}" rx="12" ry="4" fill="#000" opacity=".45"/><rect x="${x - 6}" y="${y}" width="12" height="26" rx="2" fill="#efe3cf" style="fill:var(--cw1,#efe3cf)"/>
      <circle class="sc-halo-out" cx="${x}" cy="${y - 8}" r="18" fill="url(#sc-halo)"/><path class="sc-flame-out" d="M${x} ${y - 20} C${x + 6} ${y - 11} ${x + 5} ${y - 4} ${x} ${y - 1} C${x - 5} ${y - 4} ${x - 6} ${y - 11} ${x} ${y - 20}Z" fill="url(#sc-flame)"/>
      <path class="sc-smoke late" d="M${x} ${y - 2} q-6 -10 0 -18 q6 -8 0 -18 q-5 -8 0 -16" stroke="#b9b2cc" stroke-width="2" fill="none" opacity=".6"/></g>`;
    return `<g class="sc-candle${on ? "" : " out"}"><ellipse cx="${x}" cy="${y + 26}" rx="12" ry="4" fill="#000" opacity=".45"/><rect x="${x - 6}" y="${y}" width="12" height="26" rx="2" fill="#efe3cf" style="fill:var(--cw1,#efe3cf)"/>
      ${on ? `<circle cx="${x}" cy="${y - 8}" r="18" fill="url(#sc-halo)"/><path class="sc-flame" d="M${x} ${y - 20} C${x + 6} ${y - 11} ${x + 5} ${y - 4} ${x} ${y - 1} C${x - 5} ${y - 4} ${x - 6} ${y - 11} ${x} ${y - 20}Z" fill="url(#sc-flame)"/>`
        : `<path class="sc-smoke" d="M${x} ${y - 2} q-6 -10 0 -18 q6 -8 0 -18" stroke="#b9b2cc" stroke-width="2" fill="none" opacity=".5"/>`}</g>`; }).join("");
  const dim = (CANDLES - lit) * 0.11;
  const name = revealed && g ? g.name.replace(/&/g, "&amp;") : "";
  const motes = [[60, 90, 0], [120, 40, 1.3], [300, 70, 2.1], [350, 150, 0.6], [30, 170, 2.8], [250, 30, 3.4]]
    .map(([x, y, d]) => `<circle class="sc-mote" cx="${x}" cy="${y}" r="1.6" fill="#FADE8C" style="--d:${d}s"/>`).join("");
  const sparks = fx === "yes" ? Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, r = 70 + (i % 3) * 18;
    return `<g transform="translate(200 120)"><path class="sc-spark" d="M0 -5 L1.4 -1.4 L5 0 L1.4 1.4 L0 5 L-1.4 1.4 L-5 0 L-1.4 -1.4Z" fill="${i % 2 ? "#FADE8C" : "#66E0C8"}" style="--x:${(Math.cos(a) * r).toFixed(0)}px;--y:${(Math.sin(a) * r * 0.8).toFixed(0)}px;--d:${(0.6 + (i % 4) * 0.08).toFixed(2)}s"/></g>`; }).join("") : "";
  return `<svg class="sc-svg${fx ? " fx-" + fx : ""}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
<defs><radialGradient id="sc-room" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#3a1f5e"/><stop offset="1" stop-color="#07040f"/></radialGradient>
<radialGradient id="sc-cloth" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#5a1830"/><stop offset="1" stop-color="#1e050c"/></radialGradient>
<radialGradient id="sc-halo"><stop offset="0" stop-color="${fl.halo}" stop-opacity=".5"/><stop offset="1" stop-color="${fl.halo}" stop-opacity="0"/></radialGradient>
<radialGradient id="sc-flame" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${fl.mid}"/><stop offset="1" stop-color="${fl.tip}"/></radialGradient>
<linearGradient id="sc-sheet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9c4e6" stop-opacity=".75"/></linearGradient></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="#07040f"/><rect x="-200" width="800" height="300" fill="url(#sc-room)"/>
${motes}
<g class="sc-tbl"><ellipse cx="200" cy="236" rx="168" ry="50" fill="url(#sc-cloth)" stroke="#E2B04A" stroke-width="2"/>
<path d="M40 240 Q200 312 360 240" stroke="#E2B04A" stroke-width="1" fill="none" opacity=".5"/>
${candles}</g>
<g class="sc-prop${revealed ? " show" : ""}"><circle cx="200" cy="120" r="46" fill="#66E0C8" opacity=".14"/><text x="200" y="140" font-size="56" text-anchor="middle">${g ? g.emoji : ""}</text>
  <g transform="translate(200 180)"><g class="sc-stamp"><rect x="-145" y="-17" width="290" height="32" rx="6" fill="#160b2c" stroke="#E2B04A" stroke-width="2"/><text y="6" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="${name.length > 28 ? 11 : name.length > 20 ? 13 : 16}" fill="#FADE8C" text-anchor="middle" letter-spacing="1">${name}</text></g></g></g>
<g class="sc-ghost${revealed ? " gone" : ""}"><g class="sc-gb sg-${ghost || "gh-sheet"}">${ghostBody(ghost)}
  <text class="sc-q" x="250" y="64" font-family="Cinzel, Georgia, serif" font-weight="900" font-size="30" fill="#FADE8C">?</text></g></g>
${sparks}
<rect x="-600" y="-400" width="1600" height="1100" fill="#000" opacity="${dim.toFixed(2)}" pointer-events="none"/>
</svg>`;
}

const KIND = (L) => (L.n === 3 ? { magic: "Magician", science: "Scientist", both: "A bit of both" } : { magic: "Magic", science: "Science", both: "A bit of both" });
const kindLine = (L, g) => g.field === "both" ? (L.n === 3 ? "a bit of both, part scientist and part magician" : "a bit of both, real science with a magical side")
  : L.n === 3 ? (g.field === "magic" ? "a magician" : "a scientist") : (g.field === "magic" ? "a magic practice" : "a science");
const INTRO = {
  1: "This ghost practised a craft its whole life. Each clue is one real method from it.",
  2: "This ghost mastered one very particular technique. Each clue is a real detail of how it works.",
  3: "A famous name is knocking. Each clue is a true fact from their life and work.",
  4: "A famous fake is back, still claiming a power. Each clue is real evidence from the investigation, though some of it is beside the point.",
};

shop.draw = (id, prog) => sceneSvg(null, null, false, id, "", null, prog?.ghost);
ghostShop.draw = (id, prog) => sceneSvg(null, null, false, prog?.[shop.kind], "summon", null, id);
ghostShop.cry = (id) => setTimeout(() => sfx.ghostCry(id), 700);

export const seance = {
  id: "seance", label: "Séance: Guess the Ghost", emoji: "🕯️", shop, shops: [ghostShop, maskShop],
  blurb: "Guess what kind of science or magic the ghost practised",
  open(ctx) {
    const { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl, reduced } = ctx;
    const prog = () => seanceOf(state.prog);
    let lastLit = CANDLES; // candles lit at the last draw, so newly snuffed ones animate out
    const draw = (g, run, rev, fx = "") => { const was = run && run.candles < lastLit ? lastLit : null; lastLit = run ? run.candles : CANDLES;
      tableEl.className = "table seance"; tableEl.innerHTML = sceneSvg(g, run, rev, state.prog[shop.kind], reduced ? "" : fx, was, state.prog.ghost); };
    const stats = () => { const n = solvedCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>🕯️ ${esc(t.name)}</b> · ${n} / ${ALL.length} ghosts named${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };

    function lobby(first) {
      leaveGroup(); clearReading(); cap("🕯️ The Séance"); draw(null, null, false);
      say(first && !prog().plays
        ? `Welcome to the séance, ${state.name}. Every ghost here practised some kind of science or magic, and each one raps out real clues: methods, tools, facts. First you tell me whether it was magic, science or a bit of both. Then you name it. Start at level one if you're new. Level three is for know-it-alls.`
        : solvedCount(state.prog) >= ALL.length ? `Every ghost named, ${state.name}. The spirits are forming a fan club. Summon any again to beat your score.` : `Which circle shall we open tonight, ${state.name}?`);
      const lvl = (L) => { const n = solvedCount(state.prog, L);
        return `<button class="c level" type="button" data-l="${L.n}"><b>${"🕯️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${n} / ${L.deck.length} named · points ×${L.mult}</span></button>`; };
      const known = ALL.filter(({ L, g }) => prog().solved[keyOf(L, g)]);
      const ds = dailyState(state.prog, "seance"), dp = dailyPick(dailySeed("seance"));
      const dailyBtn = `<button class="c level sc-daily" type="button" id="sc-daily"><b>🌙 Daily Ghost #${dayNumber()}</b><span>${ds.played ? `Done today: ${esc(ds.today.detail || "")} · tap for the board` : `Everyone gets the same ghost today · Level ${dp.L.n}`}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button>`;
      ui(`${stats()}<div class="levels">${dailyBtn}${LEVELS.map(lvl).join("")}<button class="c level sc-group" type="button" id="sc-impostor"><b>🎭 The Impostor</b><span>Party round: one sitter holds the wrong ghost. Lay hints, then vote</span></button><button class="c level sc-group" type="button" id="sc-group"><b>👥 Group séance</b><span>Everyone in the call, one ghost, shared candles · first to name it wins</span></button></div>
        <div class="note">5 candles. The first clue is free; each extra clue and each wrong name snuffs one. Stuck? "Show me 4" gives you choices but blows out 3 candles.</div>
        <div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
        ${known.length ? `<div class="group">📖 Ghost journal: tap a ghost to read its page</div><div class="choices">${known.map(({ L, g }) => `<button class="c small" type="button" data-k="${L.n}:${g.id}">${g.emoji} ${esc(g.name)} <span class="note">· L${L.n} · best ${prog().solved[keyOf(L, g)]}</span></button>`).join("")}</div>` : ""}`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; summon(L, nextGhost(state.prog, L, prog().last)); }));
      $("back").onclick = greet;
      $("sc-group").onclick = group;
      $("sc-impostor").onclick = () => { leaveGroup(); openImpostor(ctx, () => lobby(false)); };
      $("sc-daily").onclick = () => (dailyState(state.prog, "seance").played ? dailyBoard() : summon(dp.L, dp.g, true));
      $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { const [n, id] = b.dataset.k.split(":"), L = LEVELS[+n - 1]; journal(L, ghostById(id, L)); }));
    }

    /** A named ghost's journal page: every clue, the real story, how it connects, and a related ghost to try next. */
    function journal(L, g) {
      clearReading(); draw(g, { candles: CANDLES }, true); cap(title(g));
      const nx = related(L, g), seen = prog().solved[keyOf(nx.L, nx.g)];
      const what = L.debunk ? `Exposed by ${answersOf(g, L)[0].name}. ${g.exposed ? "(" + g.exposed + ")" : ""}` : L.pool ? kinds(L, g) : "";
      say(`${g.name}. ${g.link}`);
      ui(`<div class="cx-top"><b>📖 ${esc(g.name)}</b> · Level ${L.n} · best ${prog().solved[keyOf(L, g)] || 0}</div>
        <div class="kit">${L.debunk ? `<div class="kit-row"><b>The claim</b><span>${esc(g.scene.join(" "))}</span></div><div class="kit-row"><b>The real method</b><span>${esc(g.options[g.answer])}</span></div>` : ""}
        <div class="kit-row"><b>${L.debunk ? "How it was exposed" : "The real story"}</b><span>${esc(g.bio)}</span></div>${what ? `<div class="kit-row"><b>${L.debunk ? "The skeptic" : "Counts as"}</b><span>${esc(what)}</span></div>` : ""}
        <div class="kit-row"><b>Why it matters</b><span>${esc(g.link)}</span></div></div>
        ${clueList(g, { shown: g.clues.length }, false, L)}
        <div class="choices"><button class="c main" type="button" id="sc-next">${nx.g.emoji} Try next: ${esc(nx.g.name)} <span class="note">· L${nx.L.n}${seen ? " · named" : ""}</span></button><button class="c" type="button" id="sc-again">↻ Summon this ghost again</button>${L.n === 3 && ctx.go ? `<button class="c" type="button" id="sc-tl">⏳ Find them in the History of Magic</button>` : ""}<button class="c" type="button" id="sc-lobby">📜 Back to the séance</button></div>`);
      if ($("sc-tl")) $("sc-tl").onclick = () => ctx.go("timeline"); $("sc-next").onclick = () => summon(nx.L, nx.g); $("sc-again").onclick = () => summon(L, g); $("sc-lobby").onclick = () => lobby(false);
    }

    const clueList = (g, run, fresh = false, L = null) => `<div class="clues">${g.clues.slice(0, run.shown).map((c, i) => `<div class="clue${fresh && i === run.shown - 1 ? " new" : ""}"><b>${L && L.debunk ? "🔎 Evidence" : "👻 Clue"} ${i + 1}</b><span>${esc(c)}</span></div>`).join("")}</div>`;
    const candleBar = (L, run) => `<div class="cx-top">Level ${L.n} · 🕯️ ${"●".repeat(run.candles)}${"○".repeat(CANDLES - run.candles)} · ${run.candles} candle${run.candles === 1 ? "" : "s"} left${run.field ? ` · naming it now scores ${perCandle(run.mode, L) * run.candles}${run.mode === "pick" ? " (multiple choice)" : ""}` : ""}</div>`;

    /** Today's shared board, with your own result line to paste in chat. */
    async function dailyBoard(line) {
      const ds = dailyState(state.prog, "seance");
      clearReading(); cap(`🌙 Daily Ghost #${dayNumber()}`); draw(null, null, false);
      say(ds.played ? `Today's ghost is laid to rest. 🔥 ${ds.streak}-day streak. A new ghost rises at midnight, UTC.` : "You haven't summoned today's ghost yet.");
      const share = line || ds.today?.share || "";
      const paint = (board) => ui(`${share ? `<div class="group">Share it (no spoilers)</div><textarea class="sc-share" id="sc-share" readonly rows="2">${esc(share)}</textarea><div class="choices"><button class="c small" type="button" id="sc-copy">📋 Copy</button></div>` : ""}
        <div class="group">🏆 Today's board</div>${board === undefined ? `<div class="note">Reading the board…</div>` : boardHtml(board, esc, { unit: "pts", local: ds.today })}
        <div class="choices"><button class="c" type="button" id="sc-lobby">📜 Back to the séance</button></div>`);
      const wire = () => { $("sc-lobby").onclick = () => lobby(false);
        if ($("sc-copy")) $("sc-copy").onclick = async () => { const t = $("sc-share"); t.select(); let ok = false;
          try { await navigator.clipboard.writeText(share); ok = true; } catch { try { ok = document.execCommand("copy"); } catch {} }
          say(ok ? "Copied. Paste it in the channel and see who beats you." : "Select the text and copy it yourself: the spirits can't reach your clipboard here."); }; };
      paint(undefined); wire();
      const board = await boardOf(state, "seance"); if (state.inRoom === "seance" && $("sc-lobby")) { paint(board); wire(); }
    }

    function summon(L, g, daily = false) {
      const run = start(g, L); run.daily = daily;
      lastLit = CANDLES; clearReading(); cap(`🕯️ Level ${L.n} · a ghost is knocking…`); draw(g, run, false, "summon"); sfx.summon(); setTimeout(() => sfx.ghostCry(state.prog.ghost), 900);
      if (L.debunk) return talkThrough([`${pick(["The candles lean. Someone is here.", "Raps, from under the table. Our guest has arrived."])} ${INTRO[4]}`, ...g.scene, `First piece of evidence: “${g.clues[0]}”`], () => askMethod(L, g, run));
      talkThrough([pick(["Hands on the table, please. Spirit, are you there? …Knock once for yes.", "The candles lean. Someone is here.", "Shh. Listen. Raps, from under the table. Our guest has arrived."]) + " " + INTRO[L.n], `First clue: “${g.clues[0]}”`], () => askField(L, g, run));
    }

    function askField(L, g, run) {
      say("First: magic, science, or a bit of both?");
      const K = KIND(L);
      ui(`${candleBar(L, run)}${clueList(g, run)}<div class="choices">${Object.entries(FIELDS).map(([k, f]) => `<button class="c" type="button" data-f="${k}">${f.emoji} ${esc(K[k])}</button>`).join("")}</div>
        <div class="note">+${fieldPts(L)} if you're right. One guess.</div>`);
      $("ui").querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => {
        const ok = guessField(run, g, b.dataset.f);
        if (ok) { chime(1); draw(g, run, false, "nod"); } else { sfx.wrong(); draw(g, run, false, "no"); }
        name(L, g, run, `${ok ? `Yes: ${kindLine(L, g)}. +${fieldPts(L)}.` : `No, this ghost was ${kindLine(L, g)}.`} Now, ${L.ask.charAt(0).toLowerCase() + L.ask.slice(1)}`);
      }));
    }

    /** Level 4, step 1: the real method, from four explanations (one try). */
    function askMethod(L, g, run) {
      say(g.question);
      ui(`${candleBar(L, run)}${clueList(g, run, false, L)}<div class="choices col">${g.options.map((o, i) => `<button class="c" type="button" data-m="${i}">${esc(o)}</button>`).join("")}</div>
        <div class="note">+${fieldPts(L)} if you're right. One guess.</div>`);
      $("ui").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => {
        const ok = guessMethod(run, g, +b.dataset.m);
        if (ok) { chime(1); draw(g, run, false, "nod"); } else { sfx.wrong(); draw(g, run, false, "no"); }
        name(L, g, run, `${ok ? `Exactly: ${g.options[g.answer].charAt(0).toLowerCase() + g.options[g.answer].slice(1)}. +${fieldPts(L)}.` : `No. The real method: ${g.options[g.answer].charAt(0).toLowerCase() + g.options[g.answer].slice(1)}.`} Now, who exposed the trick?`);
      }));
    }

    function name(L, g, run, line, fx = null, fresh = false) {
      if (fx !== null) draw(g, run, false, fx); if (line) say(line);
      const more = run.shown < g.clues.length && run.candles > 1, what = L.debunk ? "Name who exposed it" : L.n === 3 ? "Name the ghost" : L.n === 1 ? "Name the practice" : "Name the technique";
      // No <form>: Discord's Activity iframe has no allow-forms, so submit never fires. Button click + Enter instead.
      const poolHint = L.pool ? `<div class="note sc-pool"><b>${L.debunk ? "The skeptics" : "Answer pool"}:</b> ${L.pool.map((x) => `${x.emoji} ${esc(x.name)}`).join(" · ")}</div>` : "";
      const form = run.mode === "type"
        ? `<div class="form one"><label for="sc-n">${what}<input id="sc-n" type="text" maxlength="60" autocomplete="off" enterkeyhint="go" placeholder="${L.debunk ? "e.g. Houdini, Faraday…" : L.n === 3 ? "Full name or surname" : L.n === 1 ? "e.g. biology, mentalism…" : "e.g. card force, carbon dating…"}"></label></div>${poolHint}
           <div class="choices"><button class="c main" type="button" id="sc-ok">✦ Name it</button>${more ? `<button class="c" type="button" id="sc-more">👻 Another clue (🕯️ 1)</button>` : ""}<button class="c" type="button" id="sc-pick">🎴 Show me 4 (🕯️ ${PICK_COST})</button></div>`
        : `<div class="choices col">${choices(g, L).map((x) => `<button class="c" type="button" data-n="${x.id}" ${run.wrong.includes(x.id) ? "disabled" : ""}>${run.wrong.includes(x.id) ? "✗ " : ""}${L.pool ? x.emoji + " " : ""}${esc(x.name)}</button>`).join("")}</div>
           <div class="choices">${more ? `<button class="c" type="button" id="sc-more">👻 Another clue (🕯️ 1)</button>` : ""}</div>`;
      // Paid hints: each once per séance, for 💎 Essence instead of a candle.
      const hs = hintsFor(L, g), got = hs.filter((h) => (run.hints || []).includes(h.id)), left = hs.filter((h) => !(run.hints || []).includes(h.id)), ess = state.prog.essence || 0;
      const hintBox = `${got.length ? `<div class="sc-hints">${got.map((h) => `<div class="clue sc-hint"><b>${h.label}</b><span>${esc(h.text)}</span></div>`).join("")}</div>` : ""}
        ${left.length ? `<div class="choices sc-buy">${left.map((h) => `<button class="c small" type="button" data-h="${h.id}" ${ess < HINT_COST ? "disabled" : ""}>${h.label} · 💎 ${HINT_COST}</button>`).join("")}</div>` : ""}`;
      ui(`${candleBar(L, run)}${clueList(g, run, fresh, L)}${hintBox}${form}<div class="choices"><button class="c small" type="button" id="sc-leave">End the séance</button></div>`);
      $("ui").querySelectorAll("[data-h]").forEach((b) => (b.onclick = () => { const h = hs.find((x) => x.id === b.dataset.h), r = buyHint(state.prog, run, h.id);
        if (r === "poor") return say("Not enough Essence for that hint. Name a few ghosts and come back.");
        if (r === "ok") { saveProgress(); showStats(); sfx.knock(1); name(L, g, run, `The ghost whispers: ${h.text}`, null); } }));
      if ($("sc-more")) $("sc-more").onclick = () => { if (moreClue(run, g)) { sfx.knock(2); sfx.snuff(1); name(L, g, run, `Rap, rap: “${g.clues[run.shown - 1]}”`, "knock", true); } };
      if ($("sc-pick")) $("sc-pick").onclick = () => { const had = run.candles; if (usePick(run)) { sfx.snuff(had - run.candles); setTimeout(sfx.deal, 500); name(L, g, run, `Whoosh. ${had - run.candles} candle${had - run.candles === 1 ? "" : "s"} gutter out. Very well: one of these four. Choose carefully.`, ""); } };
      $("sc-leave").onclick = () => lobby(false);
      const answer = (who) => {
        const r = guessName(run, g, who);
        if (r === "right") return revealed(L, g, run);
        if (r === "out") return outOfCandles(L, g, run);
        if (r === "wrong") { sfx.wrong(); sfx.snuff(1); name(L, g, run, pick(WRONG), "no"); }
      };
      if ($("sc-ok")) {
        const box = $("sc-n"), go = () => { const v = box.value.trim(); if (!v) { box.focus(); return; }
          const who = whoIs(v, L, g); if (!who) { say(L.pool ? NOT_IN_POOL : pick(UNKNOWN)); box.select(); return; } answer(who); };
        $("sc-ok").onclick = go;
        box.onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); go(); } };
        setTimeout(() => box.isConnected && box.focus(), 50);
      }
      $("ui").querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => answer(optionById(b.dataset.n, L))));
    }

    const kinds = (L, g) => { const a = answersOf(g, L).map((x) => x.name); return a.length > 1 ? `That counts as ${a.join(" or ")}.` : `That's ${a[0]}.`; };
    const title = (g) => `${g.emoji} ${g.name}${g.life ? " · " + g.life : g.year ? " · " + g.year : ""}`;
    function revealed(L, g, run) {
      draw(g, run, true, "yes"); sfx.reveal(); cap(title(g));
      talkThrough([L.debunk ? `Yes! ${answersOf(g, L)[0].name} exposed it. The fake ghost slinks off, caught.` : L.n === 3 ? `Yes! It's ${g.name}. The ghost bows.` : L.pool ? `Yes! The ghost was ${an(g.name)}. ${kinds(L, g)}` : `Yes! ${g.name}. The ghost glows with professional pride.`, g.bio, g.link], () => finish(L, g, run));
    }
    function outOfCandles(L, g, run) {
      sfx.snuff(1); setTimeout(sfx.darkness, 300); draw(g, run, true, "dark"); cap(title(g));
      talkThrough([L.debunk ? `The last candle goes out… It was ${answersOf(g, L)[0].name} who exposed it.` : L.pool ? `The last candle goes out… and the ghost tells you, a little hurt: it was ${an(g.name)}. ${kinds(L, g)}` : `The last candle goes out… and the ghost tells you, a little hurt: ${g.name}.`, g.bio, g.link], () => finish(L, g, run));
    }

    function finish(L, g, run) {
      const before = solvedCount(state.prog), r = settle(state.prog, run);
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("seance", L.n, { won: run.won, perfect: run.won && !run.wrong.length }); // Trophy Case (trophies.js)
      const after = solvedCount(state.prog), t = titleOf(after), titled = titleOf(before).name !== t.name;
      say(run.won && L.debunk ? `${g.name}: exposed. Houdini would be proud.` : run.won ? `${g.name}: named. The spirits are impressed.` : `${g.name} stays a mystery… for now.`);
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      if (run.won) bits.push(`score ${r.score}${r.first ? "" : r.best ? " · new best" : ` · best stays ${prog().solved[keyOf(L, g)]}`}${run.mode === "type" ? " · typed it!" : ""}`);
      else bits.push("not named this time");
      const up = LEVELS[L.n] && solvedCount(state.prog, L) === 3 && run.won && r.first ? `<div class="up">🔓 Ready for Level ${L.n + 1}: ${esc(LEVELS[L.n].what)}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${titled ? `<div class="up">🕯️ Séance title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}${up}</div>
        <div class="choices"><button class="c main" type="button" id="sc-go">🕯️ Another Level ${L.n} ghost</button>${run.won ? "" : `<button class="c" type="button" id="sc-again">↻ Try this ghost again</button>`}<button class="c" type="button" id="sc-page">📖 Journal page</button><button class="c" type="button" id="sc-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("sc-page").onclick = () => journal(L, g);
      if (run.daily) { // Daily Ghost: only the first finished run of the day counts
        const line = shareLine(run, L, dayNumber()), res = finishDaily(state.prog, "seance", { score: run.won ? r.score : 0, won: run.won, detail: line.split(" · ").slice(2).join(" · ") });
        if (res.first) { state.prog.daily.seance.today.share = line; saveProgress(); postDaily(state, "seance", { score: run.won ? r.score : 0, won: run.won, detail: state.prog.daily.seance.today.detail }); }
        $("ui").insertAdjacentHTML("afterbegin", `<div class="up">🌙 Daily Ghost #${dayNumber()} ${res.first ? `done · 🔥 ${res.streak}-day streak` : "(only your first run today counts)"}</div><div class="choices"><button class="c main" type="button" id="sc-board">🏆 Today's board and share</button></div>`);
        $("sc-board").onclick = () => dailyBoard(res.first ? line : undefined);
      }
      if (titled || aw.rankUp) chime(2);
      $("sc-go").onclick = () => summon(L, nextGhost(state.prog, L, g.id));
      if ($("sc-again")) $("sc-again").onclick = () => summon(L, g);
      $("sc-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    /* ---------- Group séance (net.js table; the host's client runs it, see group.js) ---------- */
    let T = null, G = null, paidRound = 0, paidText = ""; // table, shared state, last round this sitter was paid for
    const gone = () => state.inRoom !== "seance" || !T;
    function leaveGroup() { if (T) { const t = T; T = null; G = null; t.leave(); } }
    async function group() {
      if (!canJoin(state)) return say("Group séances need friends: open the Chamber inside a Discord voice call, and everyone who opens the Séance joins the same table.");
      say("Joining the circle…");
      try { T = await joinTable("seance", state); } catch (e) { T = null; return say(`The circle won't form: ${e.message}`); }
      const t = T;
      t.on("msg", ({ from, m }) => { if (T !== t) return; if (state.inRoom !== "seance") return leaveGroup();
        if (t.isHost()) { if (m && m.k === "act") hostAct(from, m.act); } else if (m && m.k === "st") gotState(m.st, m.ev, m.by); });
      t.on("members", () => { if (T !== t) return; if (state.inRoom !== "seance") return leaveGroup(); if (t.isHost()) broadcast(); else gpaint(); });
      t.on("host", (snap) => { if (T !== t) return; if (snap && snap.id) G = snap; say("The host left. You hold the circle now."); broadcast(); });
      t.on("close", () => { if (T !== t) return; T = null; G = null; say("The circle broke (connection lost)."); lobby(false); });
      sfx.summon(); gpaint();
      if (!t.isHost()) say(`You join ${t.nameOf(t.host)}'s circle. Wait for the next ghost.`); else say("You host this circle. Choose a level and the ghost rises for everyone.");
    }
    function broadcast(ev = "", by = "") { if (!T || !T.isHost()) return; T.to("*", { k: "st", st: G, ev, by }); T.snap(G); gpaint(); }
    function hostAct(who, act) {
      if (!G) return; const ev = groupAct(G, who, act, T.members, T.host); if (!ev) return;
      react(ev, who); broadcast(ev, who);
    }
    function act(a) { if (!T) return; if (T.isHost()) hostAct(T.me.id, a); else T.up({ k: "act", act: a }); }
    function gotState(st, ev, by) { const fresh = !G || (st && G.round !== st.round); G = st; if (fresh && G) { lastLit = CANDLES; draw(groupGhost(G).g, G, false, "summon"); sfx.summon(); } else react(ev, by); gpaint(); }
    function react(ev, by) {
      const { g } = groupGhost(G); if (!g) return; const who = T.nameOf(by), mine = T.me && by === T.me.id;
      if (ev === "field") { draw(g, G, false, G.fieldRight ? "nod" : "no"); G.fieldRight ? chime(1) : sfx.wrong(); say(`The circle chose ${FIELDS[G.field].name}. ${G.fieldRight ? "Right!" : `No: it was ${FIELDS[g.field].name}.`} Now anyone may name it.`); }
      else if (ev === "clue") { draw(g, G, false, "knock"); sfx.knock(2); sfx.snuff(1); say(`Rap, rap: “${g.clues[G.shown - 1]}”`); }
      else if (ev === "wrong") { draw(g, G, false, "no"); sfx.wrong(); sfx.snuff(1); say(`${mine ? "You" : who} guessed ${G.log.at(-1).text}. Wrong! A candle goes out.`); }
      else if (ev === "unknown" && mine) say(UNKNOWN_G);
      else if (ev === "right") { draw(g, G, true, "yes"); sfx.reveal(); cap(title(g)); say(`${mine ? "You" : who} named it: ${g.name}! ${g.link}`); }
      else if (ev === "out") { sfx.snuff(1); setTimeout(sfx.darkness, 300); draw(g, G, true, "dark"); cap(title(g)); say(`The last candle goes out… it was ${g.name}. ${g.link}`); }
      if (G.over) payOut();
    }
    const UNKNOWN_G = "The spirits don't recognise that. No candle lost. Check the spelling or pick from the pool.";
    function payOut() {
      if (!G || paidRound === G.round || !T) return; paidRound = G.round;
      const r = groupReward(G, T.me.id);
      if (r.won) { const s = settle(state.prog, r.run), aw = award(s.xp + r.bonus, s.essence + r.bonus); ctx.trophy?.("seance", G.n, { won: true, perfect: G.candles === CANDLES });
        paidText = `+${s.xp + r.bonus} ✦ · +${s.essence + r.bonus} 💎 (first to name it +${r.bonus})${aw.rankUp ? ` · 🏅 ${aw.rankUp}` : ""}`; }
      else { award(r.xp, r.essence); seanceOf(state.prog).plays++; paidText = `+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""} for the circle${G.fieldRight ? " (kind right)" : ""}`; }
      saveProgress(); showStats();
    }
    function gstart(n) { if (!T || !T.isHost()) return; const L = LEVELS[n - 1]; G = groupStart(L, nextGhost(state.prog, L, G && G.id), (G ? G.round : 0) + 1); lastLit = CANDLES;
      const { g } = groupGhost(G); draw(g, G, false, "summon"); sfx.summon(); setTimeout(() => sfx.ghostCry(state.prog.ghost), 900); say(`A Level ${n} ghost knocks for all of you. First clue: “${g.clues[0]}”`); broadcast("start", T.me.id); }
    function gpaint() {
      if (gone()) return; const t = T, host = t.isHost(), who = t.members.map((m) => `<span>${m.id === t.host ? "👑 " : ""}${esc(m.name)}${m.id === t.me.id ? " (you)" : ""}</span>`).join("");
      const head = `<div class="cx-top"><b>👥 Group séance</b> · ${t.members.length} at the table</div><div class="chips sc-circle">${who}</div>`;
      const leave = `<div class="choices"><button class="c small" type="button" id="sc-gleave">Leave the circle</button></div>`;
      const levels = host ? `<div class="levels">${GROUP_LEVELS.map((n) => `<button class="c level" type="button" data-gl="${n}"><b>${"🕯️".repeat(n)} ${G ? "Next ghost · " : ""}Level ${n} · ${esc(LEVELS[n - 1].name)}</b><span>${esc(LEVELS[n - 1].what)}</span></button>`).join("")}</div>` : "";
      const { L, g } = G ? groupGhost(G) : {};
      if (!G || !g) { ui(`${head}${host ? levels : `<div class="note">Waiting for ${esc(t.nameOf(t.host))} to summon a ghost…</div>`}<div class="note">One ghost for everyone. Vote on the kind, ask for clues together (half the circle must ask), and race to name it. Each wrong name snuffs a shared candle.</div>${leave}`); return gwire(); }
      const log = G.log.length ? `<div class="sc-log">${G.log.map((e) => `<div>${e.ok ? "✅" : e.ok === false ? "❌" : "❔"} <b>${esc(e.name)}</b>: ${esc(e.text)}</div>`).join("")}</div>` : "";
      let body;
      if (G.over) body = `<div class="reward"><div><b>${G.winner ? `${G.winner === t.me.id ? "You" : esc(G.winnerName)} named ${esc(g.name)}` : `Nobody named ${esc(g.name)}`}</b></div>${paidText && paidRound === G.round ? `<div>${esc(paidText)}</div>` : ""}</div><div class="kit"><div class="kit-row"><b>The real story</b><span>${esc(g.bio)}</span></div></div>${host ? levels : `<div class="note">Waiting for ${esc(t.nameOf(t.host))} to summon the next ghost…</div>`}`;
      else if (!G.field) { const K = KIND(L), mine = G.votes[t.me.id], n = Object.keys(G.votes).filter((id) => t.members.some((m) => m.id === id)).length;
        body = `${clueList(g, G)}<div class="group">Vote: magic, science, or a bit of both? (${n} / ${t.members.length} voted)</div><div class="choices">${Object.entries(FIELDS).map(([k, f]) => `<button class="c${mine === k ? " main" : ""}" type="button" data-gf="${k}">${f.emoji} ${esc(K[k])}</button>`).join("")}</div>${host && n ? `<div class="choices"><button class="c small" type="button" id="sc-gclose">Close the vote now</button></div>` : ""}<div class="note">Right kind: +${fieldPts(L)} for everyone.</div>`; }
      else { const asks = Object.keys(G.asks).filter((id) => t.members.some((m) => m.id === id)).length, need = Math.ceil(t.members.length / 2), more = G.shown < g.clues.length && G.candles > 1, asked = !!G.asks[t.me.id];
        const pool = L.pool ? `<div class="note sc-pool"><b>Answer pool:</b> ${L.pool.map((x) => `${x.emoji} ${esc(x.name)}`).join(" · ")}</div>` : "";
        body = `${clueList(g, G)}${log}<div class="form one"><label for="sc-gn">Name it first to win<input id="sc-gn" type="text" maxlength="60" autocomplete="off" enterkeyhint="go" placeholder="${L.n === 3 ? "Full name or surname" : L.n === 1 ? "e.g. biology, mentalism…" : "e.g. card force, carbon dating…"}"></label></div>${pool}
          <div class="choices"><button class="c main" type="button" id="sc-gok">✦ Name it</button>${more ? `<button class="c" type="button" id="sc-gask" ${asked ? "disabled" : ""}>👻 Another clue (🕯️ 1) · ${asks} / ${need}</button>` : ""}</div>`; }
      const keep = $("sc-gn"), typed = keep ? keep.value : "", focused = keep && document.activeElement === keep;
      ui(`${head}${G.over ? "" : candleBar(L, G).replace(/ · naming it now.*<\/div>$/, "</div>")}${body}${leave}`);
      if ($("sc-gn")) { $("sc-gn").value = typed; if (focused) $("sc-gn").focus(); } gwire();
    }
    function gwire() {
      if (!$("sc-gleave")) return;
      $("sc-gleave").onclick = () => { leaveGroup(); lobby(false); };
      $("ui").querySelectorAll("[data-gl]").forEach((b) => (b.onclick = () => gstart(+b.dataset.gl)));
      $("ui").querySelectorAll("[data-gf]").forEach((b) => (b.onclick = () => act({ a: "vote", f: b.dataset.gf })));
      if ($("sc-gclose")) $("sc-gclose").onclick = () => act({ a: "close" });
      if ($("sc-gask")) $("sc-gask").onclick = () => act({ a: "ask" });
      if ($("sc-gok")) { const box = $("sc-gn"), go = () => { const v = box.value.trim(); if (!v) return box.focus(); act({ a: "guess", text: v }); box.value = ""; };
        $("sc-gok").onclick = go; box.onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); go(); } }; }
    }

    const asked = ctx.arg && ctx.arg.ghost && ghostById(ctx.arg.ghost, LEVELS[2]); // from another room, e.g. History of Magic
    if (asked) summon(LEVELS[2], asked); else lobby(true);
  },
};

/** For the Codex page: ghosts named, by level. */
export function codexHtml(p, esc) {
  const r = seanceOf(p);
  return LEVELS.map((L) => { const named = L.deck.filter((g) => r.solved[keyOf(L, g)]);
    return `<div class="cx"><div class="cx-h"><span>🕯️ Séance level ${L.n}: ${esc(L.what)}</span><span class="note">${named.length} / ${L.deck.length}</span></div>
    <div class="bar"><i style="width:${(named.length / L.deck.length) * 100}%"></i></div>${named.length ? `<div class="chips">${named.map((g) => `<span>${g.emoji} ${esc(g.name)}</span>`).join("")}</div>` : ""}</div>`; }).join("");
}
