// Skeptic's Séance: a room in the Oracle Chamber. The Oracle hosts famous historical séances and the member
// investigates: examine clues by candlelight, name the method, then pick the Skeptic's Toolkit idea that cracked it.
// Rules in logic.js, cases in cases.js. Mounted through the Chamber's ROOMS registry (main.js).
import { CASES, TOOLS } from "./cases.js";
import { CANDLES, room as seanceOf, solvedCount, titleOf, nextTitle, caseById, start, examine, guess, toolChoices, settle, nextCase } from "./logic.js";

const WRONG = [
  "The table rattles with ghostly laughter. Wrong, and the spirits know it. A candle gutters out.",
  "Ooooh, says the medium, delighted. That's not it. One candle fewer.",
  "A cold draught, a snuffed candle. The spirits enjoy a wrong guess almost as much as a paying customer.",
  "Close, but the medium's smile says you've missed it. The dark creeps in a little.",
  "The tambourine shakes mockingly. Think about what the clues actually showed you.",
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/** The séance table, drawn into the Chamber's table pane: candles (lit or out), a sheet ghost, and clue cards. */
function sceneSvg(c, run, exposed = false) {
  const lit = run ? run.candles : CANDLES, xs = [92, 152, 248, 308];
  const candles = xs.map((x, i) => { const on = i < lit, y = i === 0 || i === 3 ? 214 : 222;
    return `<g class="sc-candle${on ? "" : " out"}"><ellipse cx="${x}" cy="${y + 26}" rx="12" ry="4" fill="#000" opacity=".45"/><rect x="${x - 6}" y="${y}" width="12" height="26" rx="2" fill="#efe3cf"/>
      ${on ? `<circle cx="${x}" cy="${y - 8}" r="18" fill="url(#sc-halo)"/><path class="sc-flame" d="M${x} ${y - 20} C${x + 6} ${y - 11} ${x + 5} ${y - 4} ${x} ${y - 1} C${x - 5} ${y - 4} ${x - 6} ${y - 11} ${x} ${y - 20}Z" fill="url(#sc-flame)"/>`
        : `<path class="sc-smoke" d="M${x} ${y - 2} q-6 -10 0 -18 q6 -8 0 -18" stroke="#b9b2cc" stroke-width="2" fill="none" opacity=".5"/>`}</g>`; }).join("");
  const cards = run ? run.seen.map((k, i) => `<g transform="translate(${150 + i * 34} ${246}) rotate(${(i - 1) * 7})"><g class="sc-card" style="--d:${i * 0.08}s"><rect x="-14" y="-10" width="28" height="20" rx="2" fill="#f3e3c3" stroke="#7a4f12"/><path d="M-9 -4 h18 M-9 1 h14 M-9 6 h10" stroke="#7a4f12" stroke-width="1.2"/></g></g>`).join("") : "";
  const dim = (CANDLES - lit) * 0.14;
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
<defs><radialGradient id="sc-room" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#3a1f5e"/><stop offset="1" stop-color="#07040f"/></radialGradient>
<radialGradient id="sc-cloth" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#5a1830"/><stop offset="1" stop-color="#1e050c"/></radialGradient>
<radialGradient id="sc-halo"><stop offset="0" stop-color="#FADE8C" stop-opacity=".5"/><stop offset="1" stop-color="#FADE8C" stop-opacity="0"/></radialGradient>
<radialGradient id="sc-flame" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#FADE8C"/><stop offset="1" stop-color="#ff8a3d"/></radialGradient>
<linearGradient id="sc-sheet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9c4e6" stop-opacity=".75"/></linearGradient></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="#07040f"/><rect x="-200" width="800" height="300" fill="url(#sc-room)"/>
<ellipse cx="200" cy="236" rx="168" ry="50" fill="url(#sc-cloth)" stroke="#E2B04A" stroke-width="2"/>
<path d="M40 240 Q200 312 360 240" stroke="#E2B04A" stroke-width="1" fill="none" opacity=".5"/>
${candles}${cards}
<g class="sc-prop${exposed ? " show" : ""}"><circle cx="200" cy="138" r="44" fill="#66E0C8" opacity=".14"/><text x="200" y="156" font-size="54" text-anchor="middle">${c.prop}</text>
  <g transform="translate(200 196) rotate(-8)"><g class="sc-stamp"><rect x="-66" y="-15" width="132" height="30" rx="4" fill="none" stroke="#FF4FB3" stroke-width="3"/><text y="8" font-family="Cinzel, Georgia, serif" font-weight="900" font-size="20" fill="#FF4FB3" text-anchor="middle" letter-spacing="3">EXPOSED</text></g></g></g>
<g class="sc-ghost${exposed ? " gone" : ""}"><path d="M200 52 C236 52 252 82 252 120 L252 186 L240 176 L228 188 L214 176 L200 188 L186 176 L172 188 L160 176 L148 186 L148 120 C148 82 164 52 200 52Z" fill="url(#sc-sheet)" stroke="#fff" stroke-width="1.2" opacity=".9"/>
  <ellipse cx="184" cy="112" rx="7" ry="10" fill="#160b2c"/><ellipse cx="216" cy="112" rx="7" ry="10" fill="#160b2c"/><ellipse cx="200" cy="140" rx="9" ry="7" fill="#160b2c"/>
  <text x="248" y="70" font-size="26">${c.emoji}</text></g>
<rect x="-600" y="-400" width="1600" height="1100" fill="#000" opacity="${dim.toFixed(2)}" pointer-events="none"/>
</svg>`;
}

export const seance = {
  id: "seance", label: "Skeptic's Séance", emoji: "🕯️",
  blurb: "Expose famous historical hoaxes",
  open(ctx) {
    const { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    const prog = () => seanceOf(state.prog);
    const draw = (c, run, exposed) => { tableEl.className = "table seance"; tableEl.innerHTML = sceneSvg(c, run, exposed); };
    const stats = () => { const n = solvedCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>🕯️ ${esc(t.name)}</b> · ${n} / ${CASES.length} hoaxes exposed${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""} · 🧰 ${prog().tools.length} / ${Object.keys(TOOLS).length} tools</div>`; };

    function lobby(first) {
      clearReading(); cap("🕯️ Skeptic's Séance"); draw(nextCase(state.prog), null, false);
      const n = solvedCount(state.prog);
      say(first && !prog().plays
        ? `Welcome to the Séance room, ${state.name}. I'm a professional, so amateurs who fake it annoy me. Tonight we sit with history's famous mediums, and you work out how they did it. Four candles per case. Each clue you examine burns one, and so does each wrong guess.`
        : n >= CASES.length ? `Every case closed, ${state.name}. Houdini would buy you a drink. Replay any case to beat your score.` : `Pick a case file, ${state.name}. The candles are lit, and the mediums are… very confident.`);
      const btn = (c) => { const s = prog().solved[c.id];
        return `<button class="c${s ? "" : " case-new"}" type="button" data-case="${c.id}">${s ? "✓" : c.emoji} ${esc(c.title)} <span class="note">· ${c.year}${s ? ` · best ${s}` : ""}</span></button>`; };
      ui(`${stats()}<div class="choices"><button class="c main" type="button" id="sc-next">🕯️ ${n ? "Next case" : "Begin the first case"}</button><button class="c" type="button" id="sc-kit">🧰 Skeptic's Toolkit</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
        <div class="group">Case files</div><div class="choices">${CASES.map(btn).join("")}</div>
        <div class="note">Real history, 1848 to 1948. Séance cases don't use your daily readings.</div>`);
      $("sc-next").onclick = () => openCase(nextCase(state.prog));
      $("sc-kit").onclick = toolkit; $("back").onclick = greet;
      $("ui").querySelectorAll("[data-case]").forEach((b) => (b.onclick = () => openCase(caseById(b.dataset.case))));
    }

    function toolkit() {
      clearReading(); cap("🧰 Skeptic's Toolkit");
      const have = prog().tools;
      say(have.length ? `Your toolkit, ${state.name}. Real skeptics carry these everywhere. Even into my Chamber, which is rude, but fair.` : "Your toolkit is empty. Crack a case and name the idea that cracked it to collect a tool.");
      ui(`<div class="choices"><button class="c" type="button" id="sc-back">🕯️ Back to the case files</button></div>
        <div class="kit">${Object.entries(TOOLS).map(([id, t]) => have.includes(id)
          ? `<div class="kit-row"><b>${t.emoji} ${esc(t.name)}</b><span>${esc(t.line)}</span></div>`
          : `<div class="kit-row locked"><b>🔒 ${esc(t.name)}</b><span class="note">Found in: ${esc(CASES.filter((c) => c.tool === id).map((c) => c.title).join(", "))}</span></div>`).join("")}</div>`);
      $("sc-back").onclick = () => lobby(false);
    }

    function openCase(c) {
      const run = start(c);
      clearReading(); cap(`${c.emoji} ${c.title} · ${c.place}, ${c.year}`); draw(c, run, false);
      talkThrough([...c.scene, `Tonight's medium: ${c.medium}. ${c.question} Examine the evidence, ${state.name}. Some clues are true but beside the point.`], () => investigate(c, run));
    }

    function investigate(c, run, line) {
      draw(c, run, false);
      if (line) say(line);
      const clue = (k, i) => run.seen.includes(i)
        ? `<div class="clue"><b>🔎 ${esc(k.label)}</b><span>${esc(k.text)}</span></div>`
        : `<button class="c" type="button" data-clue="${i}" ${run.candles <= 1 ? "disabled" : ""}>🔎 ${esc(k.label)} <span class="note">· 🕯️ 1</span></button>`;
      ui(`<div class="cx-top">🕯️ ${"●".repeat(run.candles)}${"○".repeat(CANDLES - run.candles)} · ${run.candles} candle${run.candles === 1 ? "" : "s"} left · solving now scores ${10 + 5 * run.candles}</div>
        <div class="clues">${c.clues.map(clue).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="sc-name">✦ Name the method</button><button class="c" type="button" id="sc-leave">Leave the séance</button></div>
        ${run.candles <= 1 ? `<div class="note">One candle left. You can't examine more; name the method.</div>` : ""}`);
      $("ui").querySelectorAll("[data-clue]").forEach((b) => (b.onclick = () => { const i = +b.dataset.clue;
        if (!examine(run, i)) return; chime(1); const k = c.clues[i];
        investigate(c, run, k.text); }));
      $("sc-name").onclick = () => accuse(c, run);
      $("sc-leave").onclick = () => lobby(false);
    }

    function accuse(c, run) {
      say(c.question);
      ui(`<div class="choices col">${c.options.map((o, i) => `<button class="c" type="button" data-opt="${i}" ${run.wrong.includes(i) ? "disabled" : ""}>${run.wrong.includes(i) ? "✗ " : ""}${esc(o)}</button>`).join("")}</div>
        <div class="choices"><button class="c" type="button" id="sc-more">🔎 Back to the clues</button></div>`);
      $("sc-more").onclick = () => investigate(c, run);
      $("ui").querySelectorAll("[data-opt]").forEach((b) => (b.onclick = () => {
        const r = guess(run, c, +b.dataset.opt);
        if (r === "right") return exposed(c, run);
        if (r === "out") return closedUnsolved(c, run);
        if (r === "wrong") { draw(c, run, false); investigate(c, run, pick(WRONG)); }
      }));
    }

    function exposed(c, run) {
      draw(c, run, true); chime(2);
      talkThrough([`Exposed! ${c.options[c.answer]}.`, c.reveal, `Who caught it: ${c.exposed}.`], () => toolQuestion(c, run));
    }

    function closedUnsolved(c, run) {
      draw(c, run, true);
      talkThrough([`The last candle gutters out. The medium takes a bow. The spirits win this round… but history didn't let them win for long.`, `It was: ${c.options[c.answer]}.`, c.reveal], () => finish(c, run, null));
    }

    function toolQuestion(c, run) {
      say("One more, for the toolkit: which idea cracked this case?");
      const ids = toolChoices(c);
      ui(`<div class="choices col">${ids.map((id) => `<button class="c" type="button" data-tool="${id}">${TOOLS[id].emoji} ${esc(TOOLS[id].name)}</button>`).join("")}</div>`);
      $("ui").querySelectorAll("[data-tool]").forEach((b) => (b.onclick = () => {
        const id = b.dataset.tool, t = TOOLS[c.tool];
        talkThrough([id === c.tool ? `Yes. ${t.name}: ${t.line}` : `Not quite. This one was ${t.name}: ${t.line}`], () => finish(c, run, id));
      }));
    }

    function finish(c, run, toolPick) {
      const before = solvedCount(state.prog), g = settle(state.prog, run, toolPick);
      const aw = award(g.xp, g.essence); saveProgress(); showStats();
      say(run.won ? `Case closed: ${c.title}. Another medium unmasked.` : `Case still open: ${c.title}. The medium is smug about it.`);
      const after = solvedCount(state.prog), t = titleOf(after), titled = titleOf(before).name !== t.name;
      const bits = [`<b>+${g.xp} ✦${g.essence ? ` · +${g.essence} 💎` : ""}</b>`];
      if (run.won) bits.push(g.first ? `case solved with ${run.candles} candle${run.candles === 1 ? "" : "s"} left` : g.best ? `new best: ${g.score}` : `best stays ${prog().solved[c.id]}`);
      else bits.push("unsolved, so try it again");
      if (g.newTool) bits.push(`🧰 new tool: ${esc(g.newTool.name)}`);
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${titled ? `<div class="up">🕯️ Séance title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="note">💡 ${esc(c.fact)}</div>
        <div class="choices"><button class="c main" type="button" id="sc-next">🕯️ Next case</button>${run.won ? "" : `<button class="c" type="button" id="sc-again">↻ Try again</button>`}<button class="c" type="button" id="sc-files">📂 Case files</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp || g.newTool) chime(2);
      const nx = nextCase(state.prog);
      $("sc-next").onclick = () => openCase(nx.id === c.id ? CASES[(CASES.indexOf(c) + 1) % CASES.length] : nx);
      if ($("sc-again")) $("sc-again").onclick = () => openCase(c);
      $("sc-files").onclick = () => lobby(false); $("back").onclick = greet;
    }

    lobby(true);
  },
};

/** For the Codex page: the séance's collection rows. */
export function codexHtml(p, esc) {
  const r = seanceOf(p), solved = CASES.filter((c) => r.solved[c.id]);
  return `<div class="cx"><div class="cx-h"><span>🕯️ Hoaxes exposed</span><span class="note">${solved.length} / ${CASES.length} cases</span></div>
    <div class="bar"><i style="width:${(solved.length / CASES.length) * 100}%"></i></div>${solved.length ? `<div class="chips">${solved.map((c) => `<span>${esc(c.title)}</span>`).join("")}</div>` : ""}</div>
    <div class="cx"><div class="cx-h"><span>🧰 Skeptic's Toolkit</span><span class="note">${r.tools.length} / ${Object.keys(TOOLS).length} tools</span></div>
    <div class="bar"><i style="width:${(r.tools.length / Object.keys(TOOLS).length) * 100}%"></i></div>${r.tools.length ? `<div class="chips">${r.tools.map((id) => `<span>${TOOLS[id].emoji} ${esc(TOOLS[id].name)}</span>`).join("")}</div>` : ""}</div>`;
}
