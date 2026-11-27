// Alchemist's Lab: a room of the Oracle Chamber. Level 1, read the old symbols; level 2, follow real alchemical
// recipes at the furnace; level 3, repeat the experiments that turned alchemy into chemistry. Every answer reveals the
// real history and the modern chemistry (with a balanced equation), and lights elements on your own periodic table.
// Rules in logic.js, content in lab.js, study guide in guide.js, workbench drawing in scene.js, apothecary in shop.js.
import { SYMBOLS, REAGENTS, OPS, ELEMENTS, HAZARDS } from "./lab.js";
import { glyphSvg } from "./glyphs.js";
import { NOTEBOOK } from "./guide.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { sceneSvg } from "./scene.js";
import { CSS } from "./style.js";
import * as sfx from "./sfx.js";
import { LEVELS, ALL, FLAMES, keyOf, room as labOf, solvedCount, titleOf, nextTitle, byId, nextOf, start, options, moreClue, readSymbol, transmute, hintOf, nameIt, settle, opsFor, PER_FLAME, NAME_PTS, experiment, logPlay, gridOf, FIND_PTS, sealOf, SEAL_PTS, dayKey, dailyOf, logDaily, RACE_POOL, RACE_WIN, raceRank, raceLevel } from "./logic.js";
import { joinTable } from "../net.js";
import { finishDaily, postDaily, boardOf, boardHtml } from "../daily.js";

const rot = (a, id) => { const k = [...id].reduce((n, c) => n + c.charCodeAt(0), 0) % a.length; return [...a.slice(k), ...a.slice(0, k)]; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FIZZLE = ["The flask hisses and goes murky. Not quite.", "A puff of foul smoke. The furnace dims.", "Something bubbles… then nothing. Back to the notebook?", "The alembic coughs. That was not the Great Work."];
const styleOnce = () => { if (document.getElementById("al-style")) return; const s = document.createElement("style"); s.id = "al-style"; s.textContent = CSS; document.head.append(s); };

export const alchemy = {
  id: "alchemy", label: "Alchemist's Lab", emoji: "⚗️",
  blurb: "Mix real alchemy and learn the chemistry behind it",
  shop: { kind: "alchemy", label: "⚗️ Alchemist's Lab", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table alchemy";
      tableEl.innerHTML = sceneSvg({ look: { ...DEFAULT_LOOK, [it.slot]: id }, shelf: ["mercury", "sulfur", "salt", "aquafortis", "vitriol", "gold"], liquid: "#c8361e", glow: it.slot === "fire" }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, lab = () => labOf(P());
    const draw = (s = {}) => { tableEl.className = "table alchemy"; tableEl.innerHTML = sceneSvg({ look: lookOf(P()), ...s }); };
    const stats = () => { const n = solvedCount(P()), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>⚗️ ${esc(t.name)}</b> · ${n} / ${ALL.length} works done · ${lab().elements.length} elements found${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };
    const flameBar = (run, L) => `<div class="cx-top">Level ${L.n} · 🔥 ${"●".repeat(run.flames)}${"○".repeat(FLAMES - run.flames)} · worth ${Math.round(run.flames * PER_FLAME * L.mult)}${L.n >= 3 && run.stage !== "done" ? ` + ${NAME_PTS * L.mult} for naming the find` : ""}</div>`;
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };

    // ---- lobby ----
    function lobby(first) {
      const alive = () => tableEl.classList.contains("alchemy"); sfx.ambience(alive); clearReading(); cap("⚗️ The Alchemist's Lab"); draw({ shelf: ["mercury", "sulfur", "salt", "aquafortis", "vitriol", "gold"] });
      say(first && !lab().plays
        ? `Welcome to the laboratory, ${state.name}. Alchemists hunted for the philosopher's stone and never found it, but they invented the lab, and their recipes became chemistry. Start at level one to learn their symbols. Then light the furnace and follow their real recipes. Everything you mix here is true history.`
        : `The furnace is warm, ${state.name}. What shall we work on?`);
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"⚗️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${solvedCount(P(), L)} / ${L.deck.length} done · points ×${L.mult}</span></button>`;
      ui(`${stats()}<div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">4 flames in the furnace. A wrong answer, a failed mix or a notebook hint puts one out.</div>
        ${(() => { const k = dayKey(), dd = dailyOf(k), d = lab().daily || {}, done = d.last === k, live = done || d.last === new Date(Date.parse(k + "T12:00:00Z") - 864e5).toISOString().slice(0, 10);
          return `<button class="c level al-daily${done ? " done" : ""}" type="button" id="al-daily"><b>📅 Daily Experiment${done ? " · done ✓" : ""}</b><span>${esc(dd.x.goal)} · Level ${dd.L.n}${live && d.streak ? ` · 🔥 ${d.streak}-day streak` : ""}${done ? " · come back tomorrow for a new one" : " · bonus Essence, grows with your streak"}</span></button>`; })()}
        <div class="choices"><button class="c main" type="button" id="al-free">🧪 Free play (${gridOf(P()).got} / ${gridOf(P()).total})</button></div>
        <div class="choices"><button class="c" type="button" id="al-book">📓 Alchemist's notebook</button><button class="c" type="button" id="al-music">${sfx.musicOn() ? "🎵 Music on" : "🔇 Music off"}</button><button class="c" type="button" id="al-table">🧪 My periodic table</button><button class="c" type="button" id="al-race">⚔️ Race friends</button><button class="c" type="button" id="al-shop">🏺 Apothecary</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; begin(L, nextOf(P(), L, lab().last)); }));
      $("al-book").onclick = () => toggle("book", $("al-book"), "📓 Alchemist's notebook"); $("al-table").onclick = () => toggle("table", $("al-table"), "🧪 My periodic table");
      $("al-shop").onclick = shop; $("back").onclick = () => { if (table) { table.leave(); table = null; race = null; } greet(); }; $("al-free").onclick = () => { sfx.whoosh(); freeplay(); };
      $("al-race").onclick = () => { sfx.whoosh(); raceRoom(); };
      $("al-daily").onclick = () => { const k = dayKey(), dd = dailyOf(k); begin(dd.L, dd.x, k); };
      setTimeout(() => sfx.startMusic(() => tableEl.classList.contains("alchemy")), 50);
      $("al-music").onclick = () => { const on = !sfx.musicOn(); sfx.setMusic(on); $("al-music").textContent = on ? "🎵 Music on" : "🔇 Music off"; if (on) sfx.startMusic(() => tableEl.classList.contains("alchemy")); };
    }
    function toggle(what, btn, label) {
      const rb = $("reading-body"), on = !rb.querySelector(".al-" + what); sfx.page();
      rb.innerHTML = on ? (what === "book" ? notebookHtml(esc) : periodicHtml(P(), esc)) : "";
      if (btn) btn.textContent = on ? "✕ Close" : label;
      if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const begin = (L, x, daily) => { sfx.whoosh(); const run = start(x, L); run.guard = (shopItem(lookOf(P()).gear) || {}).guards || []; if (daily) run.daily = daily;
      return L.n === 1 ? read(L, x, run) : bench(L, x, run, [], null); };

    // ---- level 1: read the symbol ----
    function read(L, x, run, line, fx = {}) {
      clearReading(); cap(`⚗️ Level 1 · what is this symbol?`); draw({ glyph: x.glyph, flames: run.flames, ...fx });
      say(line || pick(["An old page from a recipe book. What does this symbol stand for?", "The margin of a 16th-century manuscript. Which substance is this?", "Every alchemist knew this sign. Do you?"]));
      ui(`${flameBar(run, L)}<div class="clues">${x.clues.slice(0, run.clues).map((c, i) => `<div class="clue"><b>📜 Clue ${i + 1}</b><span>${esc(c)}</span></div>`).join("")}</div>
        <div class="choices col">${options(x).map((o) => `<button class="c" type="button" data-o="${o.id}" ${run.wrong.includes(o.id) ? "disabled" : ""}>${run.wrong.includes(o.id) ? "✗ " : ""}${esc(o.name)}</button>`).join("")}</div>
        <div class="choices">${run.clues < x.clues.length && run.flames > 1 ? `<button class="c" type="button" id="al-clue">📜 Another clue (🔥 1)</button>` : ""}<button class="c small" type="button" id="al-leave">Leave the bench</button></div>`);
      if ($("al-clue")) $("al-clue").onclick = () => { if (moreClue(run, x)) { sfx.page(); sfx.snuff(); read(L, x, run, "Here, another line from the margin.", { snuff: true }); } };
      $("al-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => {
        const r = readSymbol(run, x, b.dataset.o);
        if (r === "right") { sfx.transmute(); spark(); draw({ glyph: x.glyph, flames: run.flames, glow: true, liquid: "#FADE8C", label: `${x.name} · ${x.modern}` }); cap(`${x.name} · ${x.modern}`);
          talkThrough([`Yes! That is ${x.name.toLowerCase()}${x.tag ? `, the sign of ${x.tag === "Element" ? "one of the four elements" : x.tag}` : ""}.`, x.fact], () => finish(L, x, run)); }
        else if (r === "out") { sfx.wrong(); sfx.snuff(); draw({ glyph: x.glyph, flames: 0, label: x.name, snuff: true, fizzle: true });
          talkThrough([`The furnace goes cold. This was ${x.name.toLowerCase()}.`, x.fact], () => finish(L, x, run)); }
        else if (r === "wrong") { sfx.wrong(); sfx.snuff(); read(L, x, run, pick(FIZZLE), { snuff: true, fizzle: true }); }
      }));
    }

    // ---- levels 2 and 3: the bench ----
    const reagentBtn = (id, on) => { const r = REAGENTS[id];
      return `<button class="c al-jar${on ? " on" : ""}" type="button" data-r="${id}" aria-pressed="${on}"><i style="--jc:${r.c}">${r.glyph ? glyphSvg(r.glyph, 18) : ""}</i><span>${esc(r.name)}<small>${esc(r.f)}</small></span></button>`; };
    function hintText(x, run) {
      return run.hints.map((h) => h === "line" ? `📓 ${esc(x.hint)}` : h.startsWith("op:") ? `📓 The operation: ${OPS[h.slice(3)].emoji} ${esc(OPS[h.slice(3)].name)}` : `📓 You will need: ${esc(REAGENTS[h].name)}`).map((t) => `<div class="clue"><span>${t}</span></div>`).join("");
    }
    function feedback(j) {
      if (!j) return "";
      const bits = [`${j.right} of your reagents belong`];
      if (j.extra) bits.push(`${j.extra} ${j.extra === 1 ? "doesn't" : "don't"}`);
      if (j.missing) bits.push(`${j.missing} still missing`);
      bits.push(j.opRight ? "the operation is right" : "the operation is wrong");
      return `<div class="note al-fb">🔍 Last try: ${bits.join(" · ")}.</div>`;
    }
    function bench(L, x, run, sel, op, line, fx = {}) {
      const intro = L.n >= 3 ? `${x.who}, ${x.when}` : "From the old books";
      if (!line && !run.tries && !run.hints.length) clearReading();
      cap(`⚗️ Level ${L.n} · ${L.n >= 3 ? x.who : "a recipe"}`); draw({ flames: run.flames, shelf: x.shelf, chips: sel, liquid: sel.length ? REAGENTS[sel[sel.length - 1]].c : null, ...fx });
      say(line || (L.n >= 3 ? `It is ${x.when}. You are ${x.who}. Your task: ${x.goal.toLowerCase()}.` : `The recipe: ${x.goal.toLowerCase()}. Pick the reagents and the operation.`));
      ui(`${flameBar(run, L)}<div class="clues"><div class="clue"><b>${L.n >= 3 ? "🧑‍🔬" : "📜"} ${esc(intro)}</b><span>${esc(x.goal)}</span></div>${hintText(x, run)}</div>${feedback(run.last)}
        <div class="group">Reagents (choose up to 3)</div><div class="al-shelf">${x.shelf.map((id) => reagentBtn(id, sel.includes(id))).join("")}</div>
        <div class="group">Operation</div><div class="al-ops">${opsFor(L).map((k) => `<button class="c al-op${op === k ? " on" : ""}" type="button" data-op="${k}" title="${esc(OPS[k].what)}" aria-pressed="${op === k}">${OPS[k].emoji} ${esc(OPS[k].name)}</button>`).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="al-go" ${sel.length && op ? "" : "disabled"}>⚗️ Transmute</button>${run.flames > 1 ? `<button class="c" type="button" id="al-hint">📓 Notebook hint (🔥 1)</button>` : ""}<button class="c small" type="button" id="al-leave">Leave the bench</button></div>`);
      $("ui").querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => { const id = b.dataset.r, s = sel.includes(id) ? sel.filter((i) => i !== id) : sel.length < 3 ? [...sel, id] : sel, added = s.length > sel.length;
        sfx.clink(x.shelf.indexOf(id)); if (added) sfx.pour(); bench(L, x, run, s, op, " ", added ? { pour: REAGENTS[id].c } : {}); }));
      $("ui").querySelectorAll("[data-op]").forEach((b) => (b.onclick = () => { const k = b.dataset.op; (k === "dissolve" ? sfx.bubble : k === "electrolyse" ? sfx.zap : sfx.whoosh)(); bench(L, x, run, sel, k, `${OPS[k].name}: ${OPS[k].what}`); }));
      $("al-leave").onclick = () => (run.race ? (run.done = true, run.won = false, finish(L, x, run)) : lobby(false));
      if ($("al-hint")) $("al-hint").onclick = () => { if (hintOf(run, x)) { sfx.page(); sfx.snuff(); bench(L, x, run, sel, op, "You flip through the notebook…", { snuff: true }); } };
      $("al-go").onclick = () => {
        const r = transmute(run, x, sel, op);
        if (r === "right") return success(L, x, run);
        if (r === "boom") return explode(L, x, run, HAZARDS.find((h) => h.id === run.boom), sel);
        if (r === "saved") return rescued(L, x, run, HAZARDS.find((h) => h.id === run.saved), sel, op);
        if (r === "out") { sfx.fizzle(); sfx.snuff(); draw({ flames: 0, shelf: x.shelf, liquid: "#3a3a3a", label: x.product, fizzle: true, snuff: true });
          return talkThrough([`The last flame dies. Here is how it was really done: ${x.make.map((i) => REAGENTS[i].name.toLowerCase()).join(" with ")}, then ${OPS[x.op].name.toLowerCase()}.`, x.story, x.science], () => finish(L, x, run)); }
        if (r === "wrong") { sfx.fizzle(); sfx.snuff(); bench(L, x, run, sel, op, pick(FIZZLE), { fizzle: true, snuff: true }); }
      };
    }
    const ICON = { gas: "☠️", boom: "💥", splash: "💥" };
    function rescued(L, x, run, hz, sel, op) {
      const gear = shopItem(lookOf(P()).gear); sfx.saved(); cap("🛡 " + hz.name);
      draw({ flames: run.flames, shelf: x.shelf, chips: sel, saved: hz.col || "#9fd8ff", fizzle: true, label: `🛡 ${gear.name} saved you` });
      say(pick([`That was close. Your ${gear.name.toLowerCase()} just saved you.`, `${ICON[hz.kind]} ${hz.name}! Good thing you had your ${gear.name.toLowerCase()}.`]));
      ui(`<div class="al-boomcard saved"><b>🛡 ${esc(hz.name)}: stopped by your ${esc(gear.name.toLowerCase())}</b><p>${esc(hz.what)}</p><p class="note">${esc(hz.lesson)}</p><p class="note">It cost a flame, and your gear only saves you once per experiment.</p></div>
        <div class="choices"><button class="c main" type="button" id="al-ok">${run.done ? "Finish" : "⚗️ Back to the bench"}</button></div>`);
      $("al-ok").onclick = () => (run.done ? finish(L, x, run) : bench(L, x, run, [], op, "Steady now. Try a safer mix."));
    }
    /** Play an accident (explosion or poison gas) on the bench and show its lesson card. `end` = the experiment is over. */
    function accident(hz, { flames = 0, shelf, sel, end = true, btn, done, note }) {
      const gas = hz.kind === "gas", tail = note ?? (end ? "" : " Luckily this is free play, so nobody gets hurt.");
      if (gas) { sfx.gas(); cap("☠️ " + hz.name); draw({ flames, shelf, chips: sel, gas: hz.col, label: "☠️ " + hz.name });
        tableEl.classList.remove("choke"); void tableEl.offsetWidth; tableEl.classList.add("choke");
        say(pick(end ? ["*cough* *cough* A poison cloud pours out of the flask. Get out! The experiment is over.", "The air turns thick and stinging. You stagger out of the Lab, eyes streaming. Experiment over.", "A deadly gas fills the room. Out, now! This experiment is finished."]
          : ["*cough* *cough* A poison cloud pours out of the flask!", "The air turns thick and stinging. Out, quickly!"]) + tail); }
      else { sfx.boom(); cap("💥 " + hz.name); draw({ flames: 0, shelf, chips: sel, boom: true, label: "💥 " + hz.name });
        tableEl.classList.remove("quake"); void tableEl.offsetWidth; tableEl.classList.add("quake");
        say(pick(end ? ["KABOOM! Glass everywhere. The experiment is over.", "BANG! The flask is gone, and so are your eyebrows. Experiment over.", "A blinding flash, a bang, and soot on the ceiling. That's the end of this experiment."]
          : ["KABOOM! Glass everywhere.", "BANG! The flask is gone, and so are your eyebrows."]) + tail); }
      ui(`<div class="al-boomcard${gas ? " gas" : ""}"><b>${gas ? "☠️" : "💥"} ${esc(hz.name)}</b><p>${esc(hz.what)}</p><p class="note">${esc(hz.lesson)}</p></div>
        <div class="choices"><button class="c main" type="button" id="al-ok">${btn || (gas ? "🪟 Open the windows and get out" : "🧹 Sweep up the glass")}</button></div>`);
      $("al-ok").onclick = done;
    }
    const explode = (L, x, run, hz, sel) => accident(hz, { flames: hz.kind === "gas" ? run.flames : 0, shelf: x.shelf, sel, done: () => finish(L, x, run, hz) });
    const eqCard = (x) => `<div class="al-eq"><b>${esc(x.product)}</b><code>${esc(x.eq)}</code></div>`;
    function success(L, x, run) {
      sfx.transmute(); spark(); cap(`✨ ${x.product}`);
      draw({ flames: run.flames, shelf: x.shelf, chips: x.make, liquid: x.colour, glow: true, label: x.product,
        react: { from: x.make.map((i) => REAGENTS[i].c), to: x.colour, fx: x.fx, fxc: x.fxc } }); sfx.react(x.fx);
      if (L.n >= 3) return talkThrough([`It works! ${x.story}`], () => askFind(L, x, run));
      talkThrough([`It works! ${x.product}.`, x.story, x.science], () => finish(L, x, run));
    }
    function askFind(L, x, run) {
      say(`So, ${state.name}: what had ${x.who} really found?`);
      ui(`${flameBar(run, L)}<div class="choices col">${rot(x.options, x.id).map((o) => `<button class="c" type="button" data-a="${x.options.indexOf(o)}">${esc(o)}</button>`).join("")}</div><div class="note">One try · +${NAME_PTS * L.mult} if you're right.</div>`);
      $("ui").querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => { const ok = nameIt(run, x, x.options[+b.dataset.a]); ok ? sfx.transmute() : sfx.wrong();
        talkThrough([ok ? `Exactly: ${x.answer.toLowerCase()}.` : `Not quite. It was ${x.answer.toLowerCase()}.`, x.science], () => finish(L, x, run)); }));
    }

    // ---- results ----
    function finish(L, x, run, hz) {
      const before = solvedCount(P()), r = settle(P(), run, x), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("alchemy", L.n, { won: run.won, perfect: run.won && !run.wrong.length && !r.boom }); // Trophy Case (trophies.js)
      const after = solvedCount(P()), t = titleOf(after), titled = titleOf(before).name !== t.name;
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      const dl = run.daily ? logDaily(P(), run.daily, run.won) : null; if (dl) { award(dl.bonus, dl.bonus); saveProgress(); showStats(); bits.push(`📅 Daily Experiment done: <b>+${dl.bonus} ✦ +${dl.bonus} 💎</b> · streak ${dl.streak} day${dl.streak === 1 ? "" : "s"}`); }
      const sealHtml = sealUp();
      if (run.race) return raceDone(run, r, bits.concat(sealHtml ? [sealHtml] : []));
      let board = "";
      if (run.daily) { const fd = finishDaily(P(), "alchemy", { score: r.score, won: run.won, detail: x.product }, run.daily); saveProgress();
        if (fd.first) postDaily(state, "alchemy", { score: r.score, won: run.won, detail: x.product }).then((b) => { const el = $("al-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: r.score } }); });
        else boardOf(state, "alchemy").then((b) => { const el = $("al-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: r.score } }); });
        board = `<div class="group">📅 Today's board</div><div id="al-board" class="note">Loading the board…</div>`; }
      if (r.boom) bits.push(`${hz.kind === "gas" ? "☠️ poisoned by" : "💥 exploded:"} ${esc(hz.name)} · lesson added to your Codex`); else bits.push(run.won ? `score ${r.score}${r.first ? "" : r.best ? " · new best" : ` · best stays ${lab().solved[keyOf(L, x)]}`}` : "not done this time");
      if (r.boom) say(hz.kind === "gas" ? "Lesson learned, with streaming eyes. Air the room and try again." : "Lesson learned the loud way. Try again with a steadier hand."); else say(run.won ? pick(["Into the notebook it goes.", "The Great Work advances.", "Another secret of matter, written down."]) : "Even Newton had bad days at the furnace.");
      const els = r.newEls.length ? `<div class="up">🧪 New on your periodic table: ${r.newEls.map((e) => `<span class="al-el on">${e}<small>${ELEMENTS[e][2]}</small></span>`).join(" ")}</div>` : "";
      const up = LEVELS[L.n] && run.won && r.first && solvedCount(P(), L) === 4 ? `<div class="up">🔓 Ready for Level ${L.n + 1}: ${esc(LEVELS[L.n].what)}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${els}${titled ? `<div class="up">⚗️ Lab title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}${up}${sealHtml}</div>${board}
        ${L.n > 1 ? eqCard(x) : `<div class="al-eq"><b>${esc(x.name)}</b><code>${esc(x.modern)}</code></div>`}
        <div class="choices"><button class="c main" type="button" id="al-next">⚗️ Next Level ${L.n} work</button>${run.won ? "" : `<button class="c" type="button" id="al-again">↻ Try again</button>`}<button class="c" type="button" id="al-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp || r.newEls.length) spark(); if (titled || aw.rankUp) chime(2);
      $("al-next").onclick = () => begin(L, nextOf(P(), L, x.id));
      if ($("al-again")) $("al-again").onclick = () => begin(L, x, run.daily);
      $("al-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    /** Pays and announces the gold seal the first time all accidents are learned. */
    function sealUp() { if (!sealOf(P())) return ""; award(SEAL_PTS, SEAL_PTS); saveProgress(); showStats(); chime(3); spark();
      return `<div class="up al-seal">🏅 Gold seal: <b>Safety Officer</b>. You've learned all ${HAZARDS.length} lab accidents · +${SEAL_PTS} ✦ +${SEAL_PTS} 💎</div>`; }
    /** The Discoveries grid in the reading area; tap a learned accident to replay it. */
    function showGrid() { const rb = $("reading-body"); sfx.page(); rb.innerHTML = gridHtml(P(), esc);
      rb.querySelectorAll("[data-replay]").forEach((b) => (b.onclick = () => replay(b.dataset.replay))); rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); }
    function replay(id) { const hz = HAZARDS.find((h) => h.id === id); if (!hz) return;
      accident(hz, { flames: 4, shelf: freeShelf([...hz.all, ...(hz.any ? [hz.any[0]] : [])].slice(0, 3)), sel: [...hz.all, ...(hz.any ? [hz.any[0]] : [])].slice(0, 3), end: false, note: " (A replay from your accident files.)",
        btn: "🗂 Back to Discoveries", done: () => { lobby(false); showGrid(); } }); }

    // ---- free play: every reagent, every operation, no target ----
    const ALL_IDS = Object.keys(REAGENTS);
    const freeShelf = (sel) => [...sel, ...["mercury", "sulfur", "salt", "aquafortis", "vitriol", "gold"].filter((i) => !sel.includes(i))].slice(0, 6);
    function freeplay(sel = [], op = null, line, fx = {}) {
      const g = gridOf(P()); if (!line) clearReading();
      cap("🧪 Free play"); draw({ shelf: freeShelf(sel), chips: sel, liquid: sel.length ? REAGENTS[sel[sel.length - 1]].c : null, ...fx });
      say(line || `The whole shelf is yours, ${state.name}. Mix anything you like and see what you make. You've found ${g.got} of ${g.total} discoveries. Careful: some mixtures explode or give off deadly gas.`);
      ui(`<div class="cx-top">🧪 Free play · ${g.got} / ${g.total} discoveries · first find of each product +${FIND_PTS} ✦ +${FIND_PTS} 💎</div>
        <div class="group">Reagents (choose up to 3)</div><div class="al-shelf">${ALL_IDS.map((id) => reagentBtn(id, sel.includes(id))).join("")}</div>
        <div class="group">Operation</div><div class="al-ops">${Object.keys(OPS).map((k) => `<button class="c al-op${op === k ? " on" : ""}" type="button" data-op="${k}" title="${esc(OPS[k].what)}" aria-pressed="${op === k}">${OPS[k].emoji} ${esc(OPS[k].name)}</button>`).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="al-go" ${sel.length && op ? "" : "disabled"}>⚗️ Mix</button><button class="c" type="button" id="al-grid">🗂 Discoveries</button><button class="c small" type="button" id="al-leave">Leave the bench</button></div>`);
      $("ui").querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => { const id = b.dataset.r, s2 = sel.includes(id) ? sel.filter((i) => i !== id) : sel.length < 3 ? [...sel, id] : sel, added = s2.length > sel.length;
        sfx.clink(ALL_IDS.indexOf(id) % 6); if (added) sfx.pour(); freeplay(s2, op, " ", added ? { pour: REAGENTS[id].c } : {}); }));
      $("ui").querySelectorAll("[data-op]").forEach((b) => (b.onclick = () => { const k = b.dataset.op; (k === "dissolve" ? sfx.bubble : k === "electrolyse" ? sfx.zap : sfx.whoosh)(); freeplay(sel, k, `${OPS[k].name}: ${OPS[k].what}`); }));
      $("al-leave").onclick = () => lobby(false);
      $("al-grid").onclick = showGrid;
      $("al-go").onclick = () => {
        const res = experiment(sel, op); if (!res) return;
        const lg = logPlay(P(), res), aw = award(lg.xp, lg.essence); saveProgress(); showStats(); const seal = sealUp();
        const again = () => freeplay([], op, "Clean flask. What next?");
        if (res.hazard) { const hz = res.hazard, gear = shopItem(lookOf(P()).gear);
          if ((gear?.guards || []).includes(hz.kind)) { sfx.saved(); cap("🛡 " + hz.name); draw({ shelf: freeShelf(sel), chips: sel, saved: hz.col || "#9fd8ff", fizzle: true, label: `🛡 ${gear.name} saved you` });
            say(`${hz.kind === "gas" ? "☠️" : "💥"} ${hz.name}! Your ${gear.name.toLowerCase()} kept you safe.`);
            ui(`<div class="al-boomcard saved"><b>🛡 ${esc(hz.name)}${lg.first ? " · new in your Discoveries" : ""}</b><p>${esc(hz.what)}</p><p class="note">${esc(hz.lesson)}</p></div>${seal}<div class="choices"><button class="c main" type="button" id="al-ok">⚗️ Mix again</button></div>`);
            $("al-ok").onclick = again; return; }
          if (seal) say(`${hz.name}! And that's every accident in the book: the gold seal is yours.`);
          return accident(hz, { flames: 4, shelf: freeShelf(sel), sel, end: false, note: seal ? " That's all of them: the gold seal is yours. 🏅" : undefined, btn: hz.kind === "gas" ? "🪟 Air the room and mix again" : "🧹 Sweep up and mix again", done: again }); }
        if (res.find) { const x = res.find; sfx.transmute(); spark(); cap(`✨ ${x.product}`);
          draw({ shelf: freeShelf(sel), chips: x.make, liquid: x.colour, glow: true, label: x.product, react: { from: x.make.map((i) => REAGENTS[i].c), to: x.colour, fx: x.fx, fxc: x.fxc } }); sfx.react(x.fx);
          const els = lg.newEls.length ? `<div class="up">🧪 New on your periodic table: ${lg.newEls.map((e) => `<span class="al-el on">${e}<small>${ELEMENTS[e][2]}</small></span>`).join(" ")}</div>` : "";
          return talkThrough([lg.first ? `A discovery! ${x.product}.` : `${x.product} again. You found this one before.`, x.story, x.science], () => {
            ui(`<div class="reward"><div>${lg.first ? `<b>+${lg.xp} ✦ · +${lg.essence} 💎</b> · new in your Discoveries` : "Already in your Discoveries"}</div>${els}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${eqCard(x)}
              <div class="choices"><button class="c main" type="button" id="al-ok">⚗️ Mix again</button><button class="c" type="button" id="al-grid2">🗂 Discoveries</button></div>`);
            $("al-ok").onclick = again; $("al-grid2").onclick = showGrid; }); }
        sfx.fizzle(); freeplay(sel, op, pick(["Nothing much happens. A little warmth, a little smell. No discovery here.", "It bubbles, then settles. Nothing new.", "A murky mess. No alchemist wrote this one down."]), { fizzle: true });
      };
    }

    // ---- head-to-head race: everyone in the Discord call gets the same experiment; most flames left wins ----
    let table = null, race = null;
    const raceTop = () => `<div class="cx-top">⚔️ Lab race · ${table ? table.members.length : 0} in the call${table && table.host ? ` · host ${esc(table.nameOf(table.host))}` : ""}</div>`;
    async function raceRoom(line) {
      clearReading(); cap("⚔️ Lab race"); draw({ shelf: ["mercury", "sulfur", "salt", "aquafortis", "vitriol", "gold"] });
      if (!table) {
        say("Joining the race table…"); ui(`<div class="note">Connecting…</div>`);
        try { table = await joinTable("alchemy", state); wire(); }
        catch (e) { say(`${e.message} Open the Lab together in a Discord voice call, then race: everyone gets the same experiment, and the most flames left wins.`);
          ui(`<div class="choices"><button class="c" type="button" id="al-lobby">⚗️ Back to the Lab</button></div>`); $("al-lobby").onclick = () => lobby(false); return; }
      }
      race = race && !race.over ? race : null;
      const host = table.isHost(), n = table.members.length;
      say(line || (host ? `You're hosting, ${state.name}. When everyone is here, start the race. Everyone gets the same experiment from levels 2 to 4.` : `Waiting for ${table.nameOf(table.host)} to start the race.`));
      ui(`${raceTop()}<div class="chips">${table.members.map((m) => `<span>${m.id === table.me.id ? "🧑‍🔬 " : ""}${esc(m.name)}</span>`).join("")}</div>
        <div class="note">Same experiment for everyone. Finish with the most flames left to win (ties go to the fastest). An explosion knocks you out. Winner gets +${RACE_WIN} ✦ +${RACE_WIN} 💎.</div>
        <div class="choices">${host ? `<button class="c main" type="button" id="al-rgo" ${n >= 2 ? "" : "disabled"}>⚔️ Start the race${n >= 2 ? "" : " (needs 2 players)"}</button>` : ""}<button class="c" type="button" id="al-rleave">Leave the race</button></div>`);
      if ($("al-rgo")) $("al-rgo").onclick = () => { const x = RACE_POOL[Math.floor(Math.random() * RACE_POOL.length)]; table.to("*", { k: "go", id: x.id }); startRace(x.id); };
      $("al-rleave").onclick = () => { table.leave(); table = null; race = null; lobby(false); };
    }
    function wire() {
      table.on("members", () => { if (race && !race.over) { if (table.isHost()) maybeEnd(); } else if (tableEl.classList.contains("alchemy") && $("al-rleave")) raceRoom(); });
      table.on("host", () => { if (race && !race.over) maybeEnd(); else if ($("al-rleave")) raceRoom(); });
      table.on("msg", ({ from, m }) => {
        if (!m || typeof m !== "object") return;
        if (m.k === "go" && from === table.host) startRace(m.id);
        else if (m.k === "done" && table.isHost()) record(from, m.r);
        else if (m.k === "status" && race && race.waiting) say(`${m.name} ${m.won ? `finished with ${m.flames} flame${m.flames === 1 ? "" : "s"} left` : m.boom ? "blew up their flask" : "is out"}.`);
        else if (m.k === "result" && from === table.host) showResult(m.rows);
      });
      table.on("close", () => { table = null; if (race && !race.over) { race.over = true; say("The race table closed. Back to the Lab."); } });
    }
    function startRace(id) {
      const x = RACE_POOL.find((f) => f.id === id); if (!x) return; const L = raceLevel(x);
      race = { id, t0: Date.now(), results: {}, over: false, waiting: false };
      const run = start(x, L); run.guard = (shopItem(lookOf(P()).gear) || {}).guards || []; run.race = true; sfx.whoosh(); chime(1);
      bench(L, x, run, [], null, `⚔️ Race! Level ${L.n}: ${x.goal.toLowerCase()}. Go!`);
    }
    function raceDone(run, r, bits) {
      if (!race) return lobby(false);
      const res = { won: !!run.won, flames: run.won ? run.flames : 0, ms: Date.now() - race.t0, boom: !!r.boom };
      race.waiting = true; race.mine = res;
      if (table && table.isHost()) record(table.me.id, res); else if (table) table.up({ k: "done", r: res });
      say(res.won ? `Done, with ${res.flames} flame${res.flames === 1 ? "" : "s"} left. Waiting for the others…` : r.boom ? "Your flask is in pieces. You're out of this race. Waiting for the others…" : "Out of this race. Waiting for the others…");
      ui(`${raceTop()}<div class="reward"><div>${bits.join(" · ")}</div></div><div class="note" id="al-rwait">Waiting for everyone to finish…</div>
        <div class="choices"><button class="c" type="button" id="al-rleave">Leave the race</button></div>`);
      $("al-rleave").onclick = () => { table && table.leave(); table = null; race = null; lobby(false); };
    }
    function record(id, res) {
      if (!race || race.over || !res) return;
      race.results[id] = { id, name: table.nameOf(id), won: !!res.won, flames: Math.max(0, Math.min(FLAMES, +res.flames || 0)), ms: Math.max(0, +res.ms || 0), boom: !!res.boom };
      const st = race.results[id]; table.to("*", { k: "status", name: st.name, won: st.won, flames: st.flames, boom: st.boom });
      if (id !== table.me.id && race.waiting) say(`${st.name} ${st.won ? `finished with ${st.flames} flame${st.flames === 1 ? "" : "s"} left` : st.boom ? "blew up their flask" : "is out"}.`);
      maybeEnd();
    }
    function maybeEnd() {
      if (!race || race.over || !table) return;
      const here = table.members.map((m) => m.id); if (!here.every((id) => race.results[id])) return;
      const rows = raceRank(Object.values(race.results).filter((r) => here.includes(r.id)));
      table.to("*", { k: "result", rows }); showResult(rows);
    }
    function showResult(rows) {
      if (!race) race = {}; if (race.over) return; race.over = true;
      const me = table && rows.find((r) => r.id === table.me.id), won = me && me.place === 1 && me.won && rows.length >= 2;
      if (won) { award(RACE_WIN, RACE_WIN); saveProgress(); showStats(); sfx.transmute(); spark(); chime(2); }
      const t = (ms) => `${Math.floor(ms / 60000)}:${String(Math.round(ms / 1000) % 60).padStart(2, "0")}`;
      say(won ? `You win the race, ${state.name}!` : me ? `You came ${me.place}${["st", "nd", "rd"][me.place - 1] || "th"}.` : "The race is over.");
      ui(`${raceTop()}<div class="al-race"><h3>⚔️ Race results</h3><ol>${rows.map((r) => `<li${me && r.id === me.id ? ' class="me"' : ""}><b>${r.place === 1 && r.won ? "🏆" : r.place + "."}</b> ${esc(r.name)} · ${r.won ? `🔥 ${r.flames} left · ${t(r.ms)}` : r.boom ? "💥 blew up" : "out"}</li>`).join("")}</ol>${won ? `<div class="up">+${RACE_WIN} ✦ +${RACE_WIN} 💎 for the win</div>` : ""}</div>
        <div class="choices">${table && table.isHost() ? `<button class="c main" type="button" id="al-ragain">⚔️ Race again</button>` : ""}<button class="c" type="button" id="al-rroom">Race room</button><button class="c" type="button" id="al-lobby">⚗️ Back to the Lab</button></div>`);
      if ($("al-ragain")) $("al-ragain").onclick = () => { race = null; const x = RACE_POOL[Math.floor(Math.random() * RACE_POOL.length)]; table.to("*", { k: "go", id: x.id }); startRace(x.id); };
      $("al-rroom").onclick = () => { race = null; raceRoom(); }; $("al-lobby").onclick = () => lobby(false);
    }

    // ---- the apothecary ----
    function shop(msg) {
      clearReading(); cap("🏺 The Apothecary"); const look = lookOf(P()); draw({ shelf: ["gold", "silver", "copper", "mercury", "sulfur", "salt"] });
      say(typeof msg === "string" ? msg : `Fine glassware, coloured fires and curios for your bench, ${state.name}. Paid in Essence, of course.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="al-lobby">⚗️ Back to the bench</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. Finish a few works at the furnace and come back.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.clink(2); shop(r === "bought" ? "A fine purchase. It's on your bench." : "Swapped in."); } }));
      $("al-lobby").onclick = () => lobby(false);
    }

    lobby(true);
  },
};

/** The Discoveries grid: every product you can make and every accident you can have, found or still a mystery. */
export function gridHtml(p, esc) {
  const g = gridOf(p);
  const cell = (on, icon, name, sub, id) => on && id ? `<button class="al-find on" type="button" data-replay="${id}" title="Replay this accident"><b>${icon} ↻</b>${esc(name)}<small>${esc(sub)} · tap to replay</small></button>`
    : `<span class="al-find${on ? " on" : ""}"><b>${on ? icon : "❔"}</b>${on ? `${esc(name)}<small>${esc(sub)}</small>` : "<small>not found yet</small>"}</span>`;
  return `<div class="al-grid"><h3>🗂 Discoveries · ${g.got} / ${g.total}</h3><p class="note">Free play lets you mix anything. Each product and each accident you find is filled in here.</p>
    <div class="group">✨ Products (${g.finds.filter((f) => f.on).length} / ${g.finds.length})</div><div class="al-finds">${g.finds.map(({ x, on }) => cell(on, "✨", x.product, x.eq)).join("")}</div>
    <div class="group">⚠️ Accidents (${g.hazards.filter((f) => f.on).length} / ${g.hazards.length})</div><div class="al-finds">${g.hazards.map(({ h, on }) => cell(on, h.kind === "gas" ? "☠️" : "💥", h.name, h.kind === "gas" ? "poison gas" : h.kind === "splash" ? "acid eruption" : "explosion", h.id)).join("")}</div>
    ${labOf(p).seal ? `<div class="up al-seal">🏅 Gold seal: <b>Safety Officer</b> · all ${g.hazards.length} accidents learned</div>` : `<p class="note">Learn all ${g.hazards.length} accidents for the 🏅 gold seal (+50 ✦ +50 💎).</p>`}</div>`;
}
/** The notebook (study guide) shown in the reading area. */
export function notebookHtml(esc) {
  return `<div class="al-book"><h3>📓 The Alchemist's Notebook</h3>${NOTEBOOK.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(s.h)}</summary>${s.p.map((t) => `<p>${esc(t)}</p>`).join("")}</details>`).join("")}
    <details><summary>All the symbols</summary><div class="al-gtable">${SYMBOLS.map((s) => `<span>${glyphSvg(s.glyph, 30)}<b>${esc(s.name)}</b><small>${esc(s.modern)}</small></span>`).join("")}</div><p class="note">Symbols varied between books; these are the commonest forms.</p></details></div>`;
}
/** Your periodic table: every element the Lab teaches, lit once you've worked with it. */
export function periodicHtml(p, esc) {
  const got = labOf(p).elements, cells = [];
  const real = (per, grp) => per === 1 ? grp === 1 || grp === 18 : per <= 3 ? grp <= 2 || grp >= 13 : true;
  const at = Object.fromEntries(Object.entries(ELEMENTS).map(([s, [per, grp]]) => [per + ":" + grp, s]));
  for (let per = 1; per <= 7; per++) for (let grp = 1; grp <= 18; grp++) {
    const s = at[per + ":" + grp];
    cells.push(s ? `<span class="al-el${got.includes(s) ? " on" : ""}" style="grid-row:${per};grid-column:${grp}" title="${esc(s)} · element ${ELEMENTS[s][2]}">${s}<small>${ELEMENTS[s][2]}</small></span>`
      : real(per, grp) ? `<span class="al-el blank" style="grid-row:${per};grid-column:${grp}"></span>` : "");
  }
  return `<div class="al-table"><h3>🧪 My periodic table</h3><p class="note">${got.filter((e) => ELEMENTS[e]).length} of ${Object.keys(ELEMENTS).length} Lab elements found. Mendeleev published the first periodic table in 1869; the gaps he left were filled by elements discovered later.</p><div class="al-pt">${cells.join("")}</div></div>`;
}
/** This room's part of the 📜 Codex. */
export function alchemyCodex(p, esc) {
  const r = labOf(p), n = r.elements.length, of = Object.keys(ELEMENTS).length;
  return LEVELS.map((L) => { const done = L.deck.filter((x) => r.solved[keyOf(L, x)]);
    return `<div class="cx"><div class="cx-h"><span>⚗️ Lab level ${L.n}: ${esc(L.what)}</span><span class="note">${done.length} / ${L.deck.length}</span></div>
      <div class="bar"><i style="width:${(done.length / L.deck.length) * 100}%"></i></div>${done.length ? `<div class="chips">${done.map((x) => `<span>${esc(x.name || x.product)}</span>`).join("")}</div>` : ""}</div>`; }).join("")
    + (() => { const acc = r.accidents || []; return `<div class="cx"><div class="cx-h"><span>⚠️ Lab accidents (lessons learned)${r.seal ? " · 🏅 gold seal" : ""}</span><span class="note">${acc.length} / ${HAZARDS.length}${r.booms ? ` · ${r.booms} explosion${r.booms === 1 ? "" : "s"}` : ""}</span></div>${acc.length ? `<div class="chips">${acc.map((id) => `<span>${esc(HAZARDS.find((h) => h.id === id)?.name || id)}</span>`).join("")}</div>` : ""}</div>`; })()
    + (() => { const g = gridOf(p); return `<div class="cx"><div class="cx-h"><span>🗂 Free-play discoveries</span><span class="note">${g.got} / ${g.total}</span></div><div class="bar"><i style="width:${(g.got / g.total) * 100}%"></i></div></div>`; })()
    + `<div class="cx"><div class="cx-h"><span>🧪 Elements found in the Lab</span><span class="note">${n} / ${of}</span></div><div class="bar"><i style="width:${(n / of) * 100}%"></i></div>${n ? `<div class="chips">${r.elements.map((e) => `<span>${esc(e)}</span>`).join("")}</div>` : ""}</div>`;
}
