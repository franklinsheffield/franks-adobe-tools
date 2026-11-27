// The Séance: Guess the Ghost. A room in the Oracle Chamber. The Oracle summons a ghost; each clue it raps out is one
// real method or fact of what it practised. Level 1: general practices. Level 2: specific techniques. Level 3: real
// historical scientists and magicians. First say magic, science or both, then name it: type it for the real challenge,
// or ask for four to pick from. Rules in logic.js, decks in practices.js and ghosts.js. Mounted via ROOMS (main.js).
import { FIELDS } from "./ghosts.js";
import { shop, candleLook } from "./shop.js";
import { CANDLES, LEVELS, ALL, keyOf, perCandle, fieldPts, room as seanceOf, solvedCount, titleOf, nextTitle, ghostById, nextGhost, start, guessField, moreClue, usePick, whoIs, choices, guessName, settle, optionById, answersOf, PICK_COST } from "./logic.js";

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
function sceneSvg(g, run, revealed = false, candle) {
  const fl = candleLook(candle);
  const lit = run ? run.candles : CANDLES, xs = [84, 136, 200, 264, 316];
  const candles = xs.map((x, i) => { const on = i < lit, y = i === 0 || i === 4 ? 214 : i === 2 ? 226 : 221;
    return `<g class="sc-candle${on ? "" : " out"}"><ellipse cx="${x}" cy="${y + 26}" rx="12" ry="4" fill="#000" opacity=".45"/><rect x="${x - 6}" y="${y}" width="12" height="26" rx="2" fill="#efe3cf"/>
      ${on ? `<circle cx="${x}" cy="${y - 8}" r="18" fill="url(#sc-halo)"/><path class="sc-flame" d="M${x} ${y - 20} C${x + 6} ${y - 11} ${x + 5} ${y - 4} ${x} ${y - 1} C${x - 5} ${y - 4} ${x - 6} ${y - 11} ${x} ${y - 20}Z" fill="url(#sc-flame)"/>`
        : `<path class="sc-smoke" d="M${x} ${y - 2} q-6 -10 0 -18 q6 -8 0 -18" stroke="#b9b2cc" stroke-width="2" fill="none" opacity=".5"/>`}</g>`; }).join("");
  const dim = (CANDLES - lit) * 0.11;
  const name = revealed && g ? g.name.replace(/&/g, "&amp;") : "";
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
<defs><radialGradient id="sc-room" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#3a1f5e"/><stop offset="1" stop-color="#07040f"/></radialGradient>
<radialGradient id="sc-cloth" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#5a1830"/><stop offset="1" stop-color="#1e050c"/></radialGradient>
<radialGradient id="sc-halo"><stop offset="0" stop-color="${fl.halo}" stop-opacity=".5"/><stop offset="1" stop-color="${fl.halo}" stop-opacity="0"/></radialGradient>
<radialGradient id="sc-flame" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${fl.mid}"/><stop offset="1" stop-color="${fl.tip}"/></radialGradient>
<linearGradient id="sc-sheet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9c4e6" stop-opacity=".75"/></linearGradient></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="#07040f"/><rect x="-200" width="800" height="300" fill="url(#sc-room)"/>
<ellipse cx="200" cy="236" rx="168" ry="50" fill="url(#sc-cloth)" stroke="#E2B04A" stroke-width="2"/>
<path d="M40 240 Q200 312 360 240" stroke="#E2B04A" stroke-width="1" fill="none" opacity=".5"/>
${candles}
<g class="sc-prop${revealed ? " show" : ""}"><circle cx="200" cy="120" r="46" fill="#66E0C8" opacity=".14"/><text x="200" y="140" font-size="56" text-anchor="middle">${g ? g.emoji : ""}</text>
  <g transform="translate(200 180)"><g class="sc-stamp"><rect x="-145" y="-17" width="290" height="32" rx="6" fill="#160b2c" stroke="#E2B04A" stroke-width="2"/><text y="6" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="${name.length > 28 ? 11 : name.length > 20 ? 13 : 16}" fill="#FADE8C" text-anchor="middle" letter-spacing="1">${name}</text></g></g></g>
<g class="sc-ghost${revealed ? " gone" : ""}"><path d="M200 46 C236 46 252 76 252 114 L252 180 L240 170 L228 182 L214 170 L200 182 L186 170 L172 182 L160 170 L148 180 L148 114 C148 76 164 46 200 46Z" fill="url(#sc-sheet)" stroke="#fff" stroke-width="1.2" opacity=".9"/>
  <ellipse cx="184" cy="106" rx="7" ry="10" fill="#160b2c"/><ellipse cx="216" cy="106" rx="7" ry="10" fill="#160b2c"/><ellipse cx="200" cy="134" rx="9" ry="7" fill="#160b2c"/>
  <text x="250" y="64" font-family="Cinzel, Georgia, serif" font-weight="900" font-size="30" fill="#FADE8C">?</text></g>
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
};

shop.draw = (id) => sceneSvg(null, null, false, id);

export const seance = {
  id: "seance", label: "Séance: Guess the Ghost", emoji: "🕯️", shop,
  blurb: "Guess what kind of science or magic the ghost practised",
  open(ctx) {
    const { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    const prog = () => seanceOf(state.prog);
    const draw = (g, run, rev) => { tableEl.className = "table seance"; tableEl.innerHTML = sceneSvg(g, run, rev, state.prog[shop.kind]); };
    const stats = () => { const n = solvedCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>🕯️ ${esc(t.name)}</b> · ${n} / ${ALL.length} ghosts named${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };

    function lobby(first) {
      clearReading(); cap("🕯️ The Séance"); draw(null, null, false);
      say(first && !prog().plays
        ? `Welcome to the séance, ${state.name}. Every ghost here practised some kind of science or magic, and each one raps out real clues: methods, tools, facts. First you tell me whether it was magic, science or a bit of both. Then you name it. Start at level one if you're new. Level three is for know-it-alls.`
        : solvedCount(state.prog) >= ALL.length ? `Every ghost named, ${state.name}. The spirits are forming a fan club. Summon any again to beat your score.` : `Which circle shall we open tonight, ${state.name}?`);
      const lvl = (L) => { const n = solvedCount(state.prog, L);
        return `<button class="c level" type="button" data-l="${L.n}"><b>${"🕯️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${n} / ${L.deck.length} named · points ×${L.mult}</span></button>`; };
      const known = ALL.filter(({ L, g }) => prog().solved[keyOf(L, g)]);
      ui(`${stats()}<div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">5 candles. The first clue is free; each extra clue and each wrong name snuffs one. Stuck? "Show me 4" gives you choices but blows out 3 candles.</div>
        <div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
        ${known.length ? `<div class="group">Ghosts you've named</div><div class="choices">${known.map(({ L, g }) => `<button class="c small" type="button" data-k="${L.n}:${g.id}">${g.emoji} ${esc(g.name)} <span class="note">· L${L.n} · best ${prog().solved[keyOf(L, g)]}</span></button>`).join("")}</div>` : ""}`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; summon(L, nextGhost(state.prog, L, prog().last)); }));
      $("back").onclick = greet;
      $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { const [n, id] = b.dataset.k.split(":"), L = LEVELS[+n - 1]; summon(L, ghostById(id, L)); }));
    }

    const clueList = (g, run) => `<div class="clues">${g.clues.slice(0, run.shown).map((c, i) => `<div class="clue"><b>👻 Clue ${i + 1}</b><span>${esc(c)}</span></div>`).join("")}</div>`;
    const candleBar = (L, run) => `<div class="cx-top">Level ${L.n} · 🕯️ ${"●".repeat(run.candles)}${"○".repeat(CANDLES - run.candles)} · ${run.candles} candle${run.candles === 1 ? "" : "s"} left${run.field ? ` · naming it now scores ${perCandle(run.mode, L) * run.candles}${run.mode === "pick" ? " (multiple choice)" : ""}` : ""}</div>`;

    function summon(L, g) {
      const run = start(g, L);
      clearReading(); cap(`🕯️ Level ${L.n} · a ghost is knocking…`); draw(g, run, false);
      talkThrough([pick(["Hands on the table, please. Spirit, are you there? …Knock once for yes.", "The candles lean. Someone is here.", "Shh. Listen. Raps, from under the table. Our guest has arrived."]) + " " + INTRO[L.n], `First clue: “${g.clues[0]}”`], () => askField(L, g, run));
    }

    function askField(L, g, run) {
      say("First: magic, science, or a bit of both?");
      const K = KIND(L);
      ui(`${candleBar(L, run)}${clueList(g, run)}<div class="choices">${Object.entries(FIELDS).map(([k, f]) => `<button class="c" type="button" data-f="${k}">${f.emoji} ${esc(K[k])}</button>`).join("")}</div>
        <div class="note">+${fieldPts(L)} if you're right. One guess.</div>`);
      $("ui").querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => {
        const ok = guessField(run, g, b.dataset.f);
        chime(ok ? 1 : 0);
        name(L, g, run, `${ok ? `Yes: ${kindLine(L, g)}. +${fieldPts(L)}.` : `No, this ghost was ${kindLine(L, g)}.`} Now, ${L.ask.charAt(0).toLowerCase() + L.ask.slice(1)}`);
      }));
    }

    function name(L, g, run, line) {
      draw(g, run, false); if (line) say(line);
      const more = run.shown < g.clues.length && run.candles > 1, what = L.n === 3 ? "Name the ghost" : L.n === 1 ? "Name the practice" : "Name the technique";
      // No <form>: Discord's Activity iframe has no allow-forms, so submit never fires. Button click + Enter instead.
      const poolHint = L.pool ? `<div class="note sc-pool"><b>Answer pool:</b> ${L.pool.map((x) => `${x.emoji} ${esc(x.name)}`).join(" · ")}</div>` : "";
      const form = run.mode === "type"
        ? `<div class="form one"><label for="sc-n">${what}<input id="sc-n" type="text" maxlength="60" autocomplete="off" enterkeyhint="go" placeholder="${L.n === 3 ? "Full name or surname" : L.n === 1 ? "e.g. biology, mentalism…" : "e.g. card force, carbon dating…"}"></label></div>${poolHint}
           <div class="choices"><button class="c main" type="button" id="sc-ok">✦ Name it</button>${more ? `<button class="c" type="button" id="sc-more">👻 Another clue (🕯️ 1)</button>` : ""}<button class="c" type="button" id="sc-pick">🎴 Show me 4 (🕯️ ${PICK_COST})</button></div>`
        : `<div class="choices col">${choices(g, L).map((x) => `<button class="c" type="button" data-n="${x.id}" ${run.wrong.includes(x.id) ? "disabled" : ""}>${run.wrong.includes(x.id) ? "✗ " : ""}${L.pool ? x.emoji + " " : ""}${esc(x.name)}</button>`).join("")}</div>
           <div class="choices">${more ? `<button class="c" type="button" id="sc-more">👻 Another clue (🕯️ 1)</button>` : ""}</div>`;
      ui(`${candleBar(L, run)}${clueList(g, run)}${form}<div class="choices"><button class="c small" type="button" id="sc-leave">End the séance</button></div>`);
      if ($("sc-more")) $("sc-more").onclick = () => { if (moreClue(run, g)) { chime(1); name(L, g, run, `Rap, rap: “${g.clues[run.shown - 1]}”`); } };
      if ($("sc-pick")) $("sc-pick").onclick = () => { if (usePick(run)) { chime(0); name(L, g, run, `Whoosh. ${PICK_COST} candles gutter out. Very well: one of these four. Choose carefully.`); } };
      $("sc-leave").onclick = () => lobby(false);
      const answer = (who) => {
        const r = guessName(run, g, who);
        if (r === "right") return revealed(L, g, run);
        if (r === "out") return outOfCandles(L, g, run);
        if (r === "wrong") name(L, g, run, pick(WRONG));
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
    const title = (g) => `${g.emoji} ${g.name}${g.life ? " · " + g.life : ""}`;
    function revealed(L, g, run) {
      draw(g, run, true); chime(2); cap(title(g));
      talkThrough([L.n === 3 ? `Yes! It's ${g.name}. The ghost bows.` : L.pool ? `Yes! The ghost was ${an(g.name)}. ${kinds(L, g)}` : `Yes! ${g.name}. The ghost glows with professional pride.`, g.bio, g.link], () => finish(L, g, run));
    }
    function outOfCandles(L, g, run) {
      draw(g, run, true); cap(title(g));
      talkThrough([L.pool ? `The last candle goes out… and the ghost tells you, a little hurt: it was ${an(g.name)}. ${kinds(L, g)}` : `The last candle goes out… and the ghost tells you, a little hurt: ${g.name}.`, g.bio, g.link], () => finish(L, g, run));
    }

    function finish(L, g, run) {
      const before = solvedCount(state.prog), r = settle(state.prog, run);
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      const after = solvedCount(state.prog), t = titleOf(after), titled = titleOf(before).name !== t.name;
      say(run.won ? `${g.name}: named. The spirits are impressed.` : `${g.name} stays a mystery… for now.`);
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      if (run.won) bits.push(`score ${r.score}${r.first ? "" : r.best ? " · new best" : ` · best stays ${prog().solved[keyOf(L, g)]}`}${run.mode === "type" ? " · typed it!" : ""}`);
      else bits.push("not named this time");
      const up = LEVELS[L.n] && solvedCount(state.prog, L) === 3 && run.won && r.first ? `<div class="up">🔓 Ready for Level ${L.n + 1}: ${esc(LEVELS[L.n].what)}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${titled ? `<div class="up">🕯️ Séance title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}${up}</div>
        <div class="choices"><button class="c main" type="button" id="sc-go">🕯️ Another Level ${L.n} ghost</button>${run.won ? "" : `<button class="c" type="button" id="sc-again">↻ Try this ghost again</button>`}<button class="c" type="button" id="sc-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp) chime(2);
      $("sc-go").onclick = () => summon(L, nextGhost(state.prog, L, g.id));
      if ($("sc-again")) $("sc-again").onclick = () => summon(L, g);
      $("sc-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    lobby(true);
  },
};

/** For the Codex page: ghosts named, by level. */
export function codexHtml(p, esc) {
  const r = seanceOf(p);
  return LEVELS.map((L) => { const named = L.deck.filter((g) => r.solved[keyOf(L, g)]);
    return `<div class="cx"><div class="cx-h"><span>🕯️ Séance level ${L.n}: ${esc(L.what)}</span><span class="note">${named.length} / ${L.deck.length}</span></div>
    <div class="bar"><i style="width:${(named.length / L.deck.length) * 100}%"></i></div>${named.length ? `<div class="chips">${named.map((g) => `<span>${g.emoji} ${esc(g.name)}</span>`).join("")}</div>` : ""}</div>`; }).join("");
}
