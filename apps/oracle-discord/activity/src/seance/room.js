// The Séance: Guess the Ghost. A room in the Oracle Chamber. The Oracle summons the ghost of a famous magician or
// scientist; it raps out clues about its life. First say what kind of ghost it is, then name it: type the name for the
// real challenge, or ask for four names to pick from. Rules in logic.js, ghosts in ghosts.js. Mounted via ROOMS (main.js).
import { GHOSTS, FIELDS } from "./ghosts.js";
import { CANDLES, FIELD_PTS, perCandle, room as seanceOf, solvedCount, titleOf, nextTitle, ghostById, nextGhost, start, guessField, moreClue, usePick, whoIs, choices, guessName, scoreOf, settle } from "./logic.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WRONG = [
  "The ghost sighs. A candle goes out. \"Nobody ever remembers me…\"",
  "Three angry raps. Wrong spirit, and this one is offended.",
  "The planchette slides to NO, then to RUDE. A candle gutters.",
  "A cold draught. \"I'll have you know I was FAMOUS.\" One candle fewer.",
];
const UNKNOWN = ["The spirits don't recognise that name. Try a full name, or check the spelling. No candle lost.", "Hmm. Nobody by that name is answering tonight. No candle lost."];

/** The séance table in the Chamber's table pane: candles (lit or out), the ghost, and its reveal. */
function sceneSvg(g, run, revealed = false) {
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
<radialGradient id="sc-halo"><stop offset="0" stop-color="#FADE8C" stop-opacity=".5"/><stop offset="1" stop-color="#FADE8C" stop-opacity="0"/></radialGradient>
<radialGradient id="sc-flame" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#FADE8C"/><stop offset="1" stop-color="#ff8a3d"/></radialGradient>
<linearGradient id="sc-sheet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9c4e6" stop-opacity=".75"/></linearGradient></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="#07040f"/><rect x="-200" width="800" height="300" fill="url(#sc-room)"/>
<ellipse cx="200" cy="236" rx="168" ry="50" fill="url(#sc-cloth)" stroke="#E2B04A" stroke-width="2"/>
<path d="M40 240 Q200 312 360 240" stroke="#E2B04A" stroke-width="1" fill="none" opacity=".5"/>
${candles}
<g class="sc-prop${revealed ? " show" : ""}"><circle cx="200" cy="120" r="46" fill="#66E0C8" opacity=".14"/><text x="200" y="140" font-size="56" text-anchor="middle">${g ? g.emoji : ""}</text>
  <g transform="translate(200 180)"><g class="sc-stamp"><rect x="-120" y="-17" width="240" height="32" rx="6" fill="#160b2c" stroke="#E2B04A" stroke-width="2"/><text y="6" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="${name.length > 20 ? 13 : 16}" fill="#FADE8C" text-anchor="middle" letter-spacing="1">${name}</text></g></g></g>
<g class="sc-ghost${revealed ? " gone" : ""}"><path d="M200 46 C236 46 252 76 252 114 L252 180 L240 170 L228 182 L214 170 L200 182 L186 170 L172 182 L160 170 L148 180 L148 114 C148 76 164 46 200 46Z" fill="url(#sc-sheet)" stroke="#fff" stroke-width="1.2" opacity=".9"/>
  <ellipse cx="184" cy="106" rx="7" ry="10" fill="#160b2c"/><ellipse cx="216" cy="106" rx="7" ry="10" fill="#160b2c"/><ellipse cx="200" cy="134" rx="9" ry="7" fill="#160b2c"/>
  <text x="250" y="64" font-family="Cinzel, Georgia, serif" font-weight="900" font-size="30" fill="#FADE8C">?</text></g>
<rect x="-600" y="-400" width="1600" height="1100" fill="#000" opacity="${dim.toFixed(2)}" pointer-events="none"/>
</svg>`;
}

export const seance = {
  id: "seance", label: "Séance: Guess the Ghost", emoji: "🕯️",
  blurb: "A famous magician or scientist is knocking. Who is it?",
  open(ctx) {
    const { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    const prog = () => seanceOf(state.prog);
    const draw = (g, run, rev) => { tableEl.className = "table seance"; tableEl.innerHTML = sceneSvg(g, run, rev); };
    const stats = () => { const n = solvedCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>🕯️ ${esc(t.name)}</b> · ${n} / ${GHOSTS.length} ghosts named${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };

    function lobby(first) {
      clearReading(); cap("🕯️ The Séance"); draw(null, null, false);
      const n = solvedCount(state.prog);
      say(first && !prog().plays
        ? `Welcome to the séance, ${state.name}. Tonight I'm summoning the great magicians and scientists of history, and they love a guessing game. Each ghost raps out clues about its life. First, tell me what kind of ghost it is. Then name it. Type the name for the real challenge, or ask me for four names to pick from.`
        : n >= GHOSTS.length ? `You've named every ghost in my circle, ${state.name}. They're honoured. Some of them are insufferable about it. Summon one again to beat your score.` : `Shall we summon someone, ${state.name}? The candles are lit, and somebody famous is knocking.`);
      const known = GHOSTS.filter((g) => prog().solved[g.id]);
      ui(`${stats()}<div class="choices"><button class="c main" type="button" id="sc-go">🕯️ Summon a ghost</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
        <div class="note">5 candles. The first clue is free; more clues and wrong names each snuff a candle. Typed names score double.</div>
        ${known.length ? `<div class="group">Ghosts you've named</div><div class="choices">${known.map((g) => `<button class="c" type="button" data-g="${g.id}">${g.emoji} ${esc(g.name)} <span class="note">· best ${prog().solved[g.id]}</span></button>`).join("")}</div>` : ""}`);
      $("sc-go").onclick = () => summon(nextGhost(state.prog, prog().last));
      $("back").onclick = greet;
      $("ui").querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => summon(ghostById(b.dataset.g))));
    }

    const clueList = (g, run) => `<div class="clues">${g.clues.slice(0, run.shown).map((c, i) => `<div class="clue"><b>👻 Clue ${i + 1}</b><span>${esc(c)}</span></div>`).join("")}</div>`;
    const candleBar = (run) => `<div class="cx-top">🕯️ ${"●".repeat(run.candles)}${"○".repeat(CANDLES - run.candles)} · ${run.candles} candle${run.candles === 1 ? "" : "s"} left${run.field ? ` · naming it now scores ${perCandle(run.mode) * run.candles}${run.mode === "pick" ? " (multiple choice)" : ""}` : ""}</div>`;

    function summon(g) {
      const run = start(g);
      clearReading(); cap("🕯️ A ghost is knocking…"); draw(g, run, false);
      talkThrough([pick(["Hands on the table, please. Spirit, are you there? …Knock once for yes.", "The candles lean. Someone is here. Someone who used to be quite famous…", "Shh. Listen. Raps, from under the table. Our guest has arrived."]), `The ghost raps out its first clue: “${g.clues[0]}”`], () => askField(g, run));
    }

    function askField(g, run) {
      say("First, what kind of ghost is this?");
      ui(`${candleBar(run)}${clueList(g, run)}<div class="choices">${Object.entries(FIELDS).map(([k, f]) => `<button class="c" type="button" data-f="${k}">${f.emoji} ${esc(f.name)}</button>`).join("")}</div>
        <div class="note">+${FIELD_PTS} if you're right. One guess.</div>`);
      $("ui").querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => {
        const ok = guessField(run, g, b.dataset.f), f = FIELDS[g.field];
        chime(ok ? 1 : 0);
        name(g, run, ok ? `Yes, a ${f.name.toLowerCase()}${g.field === "both" ? ": part magician, part scientist" : ""}. +${FIELD_PTS}. Now, who am I talking to?` : `No… this ghost was ${g.field === "both" ? "a bit of both, part magician and part scientist" : "a " + f.name.toLowerCase()}. Now, who is it?`);
      }));
    }

    function name(g, run, line) {
      draw(g, run, false); if (line) say(line);
      const more = run.shown < g.clues.length && run.candles > 1;
      const form = run.mode === "type"
        ? `<form class="form one" id="sc-f"><label for="sc-n">Name the ghost<input id="sc-n" maxlength="60" autocomplete="off" placeholder="Full name or surname"></label></form>
           <div class="choices"><button class="c main" type="submit" form="sc-f">✦ Name it</button>${more ? `<button class="c" type="button" id="sc-more">👻 Another clue (🕯️ 1)</button>` : ""}<button class="c" type="button" id="sc-pick">🎴 Show me 4 names (half points)</button></div>`
        : `<div class="choices col">${choices(g).map((x) => `<button class="c" type="button" data-n="${x.id}" ${run.wrong.includes(x.id) ? "disabled" : ""}>${run.wrong.includes(x.id) ? "✗ " : ""}${esc(x.name)}</button>`).join("")}</div>
           <div class="choices">${more ? `<button class="c" type="button" id="sc-more">👻 Another clue (🕯️ 1)</button>` : ""}</div>`;
      ui(`${candleBar(run)}${clueList(g, run)}${form}<div class="choices"><button class="c small" type="button" id="sc-leave">End the séance</button></div>`);
      if ($("sc-more")) $("sc-more").onclick = () => { if (moreClue(run, g)) { chime(1); name(g, run, `Rap, rap: “${g.clues[run.shown - 1]}”`); } };
      if ($("sc-pick")) $("sc-pick").onclick = () => { usePick(run); name(g, run, "Very well. One of these four. Choose carefully."); };
      $("sc-leave").onclick = () => lobby(false);
      const answer = (who) => {
        const r = guessName(run, g, who);
        if (r === "right") return revealed(g, run);
        if (r === "out") return outOfCandles(g, run);
        if (r === "wrong") name(g, run, pick(WRONG));
      };
      if ($("sc-f")) { setTimeout(() => $("sc-n") && $("sc-n").focus(), 50);
        $("sc-f").onsubmit = (e) => { e.preventDefault(); const v = $("sc-n").value.trim(); if (!v) return;
          const who = whoIs(v); if (!who) { say(pick(UNKNOWN)); return; } answer(who); }; }
      $("ui").querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => answer(ghostById(b.dataset.n))));
    }

    function revealed(g, run) {
      draw(g, run, true); chime(2); cap(`${g.emoji} ${g.name} · ${g.life}`);
      talkThrough([`Yes! It's ${g.name}. The ghost bows.`, g.bio, g.link], () => finish(g, run));
    }
    function outOfCandles(g, run) {
      draw(g, run, true); cap(`${g.emoji} ${g.name} · ${g.life}`);
      talkThrough([`The last candle goes out… and the ghost introduces itself, a little hurt: ${g.name}.`, g.bio, g.link], () => finish(g, run));
    }

    function finish(g, run) {
      const before = solvedCount(state.prog), r = settle(state.prog, run);
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      const after = solvedCount(state.prog), t = titleOf(after), titled = titleOf(before).name !== t.name;
      say(run.won ? `${g.name} has been named. The spirits are impressed.` : `${g.name} stays a mystery… for now. Summon them again.`);
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      if (run.won) bits.push(`score ${r.score}${r.first ? "" : r.best ? " · new best" : ` · best stays ${prog().solved[g.id]}`}${run.mode === "type" ? " · typed it!" : ""}`);
      else bits.push("not named this time");
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${titled ? `<div class="up">🕯️ Séance title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="choices"><button class="c main" type="button" id="sc-go">🕯️ Summon another</button>${run.won ? "" : `<button class="c" type="button" id="sc-again">↻ Summon ${esc(g.name)} again</button>`}<button class="c" type="button" id="sc-lobby">📜 Séance room</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp) chime(2);
      $("sc-go").onclick = () => summon(nextGhost(state.prog, g.id));
      if ($("sc-again")) $("sc-again").onclick = () => summon(g);
      $("sc-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    lobby(true);
  },
};

/** For the Codex page: ghosts named. */
export function codexHtml(p, esc) {
  const r = seanceOf(p), named = GHOSTS.filter((g) => r.solved[g.id]);
  return `<div class="cx"><div class="cx-h"><span>🕯️ Ghosts named</span><span class="note">${named.length} / ${GHOSTS.length} magicians and scientists</span></div>
    <div class="bar"><i style="width:${(named.length / GHOSTS.length) * 100}%"></i></div>${named.length ? `<div class="chips">${named.map((g) => `<span>${g.emoji} ${esc(g.name)}</span>`).join("")}</div>` : ""}</div>`;
}
