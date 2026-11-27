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
import { LEVELS, ALL, FLAMES, keyOf, room as labOf, solvedCount, titleOf, nextTitle, byId, nextOf, start, options, moreClue, readSymbol, transmute, hintOf, nameIt, settle, opsFor, PER_FLAME, NAME_PTS } from "./logic.js";

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
    const flameBar = (run, L) => `<div class="cx-top">Level ${L.n} · 🔥 ${"●".repeat(run.flames)}${"○".repeat(FLAMES - run.flames)} · worth ${Math.round(run.flames * PER_FLAME * L.mult)}${L.n === 3 && run.stage !== "done" ? ` + ${NAME_PTS * L.mult} for naming the find` : ""}</div>`;
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
        <div class="choices"><button class="c" type="button" id="al-book">📓 Alchemist's notebook</button><button class="c" type="button" id="al-music">${sfx.musicOn() ? "🎵 Music on" : "🔇 Music off"}</button><button class="c" type="button" id="al-table">🧪 My periodic table</button><button class="c" type="button" id="al-shop">🏺 Apothecary</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; begin(L, nextOf(P(), L, lab().last)); }));
      $("al-book").onclick = () => toggle("book", $("al-book"), "📓 Alchemist's notebook"); $("al-table").onclick = () => toggle("table", $("al-table"), "🧪 My periodic table");
      $("al-shop").onclick = shop; $("back").onclick = greet;
      setTimeout(() => sfx.startMusic(() => tableEl.classList.contains("alchemy")), 50);
      $("al-music").onclick = () => { const on = !sfx.musicOn(); sfx.setMusic(on); $("al-music").textContent = on ? "🎵 Music on" : "🔇 Music off"; if (on) sfx.startMusic(() => tableEl.classList.contains("alchemy")); };
    }
    function toggle(what, btn, label) {
      const rb = $("reading-body"), on = !rb.querySelector(".al-" + what); sfx.page();
      rb.innerHTML = on ? (what === "book" ? notebookHtml(esc) : periodicHtml(P(), esc)) : "";
      if (btn) btn.textContent = on ? "✕ Close" : label;
      if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const begin = (L, x) => { sfx.whoosh(); const run = start(x, L); run.guard = (shopItem(lookOf(P()).gear) || {}).guards || [];
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
      const intro = L.n === 3 ? `${x.who}, ${x.when}` : "From the old books";
      if (!line && !run.tries && !run.hints.length) clearReading();
      cap(`⚗️ Level ${L.n} · ${L.n === 3 ? x.who : "a recipe"}`); draw({ flames: run.flames, shelf: x.shelf, chips: sel, liquid: sel.length ? REAGENTS[sel[sel.length - 1]].c : null, ...fx });
      say(line || (L.n === 3 ? `It is ${x.when}. You are ${x.who}. Your task: ${x.goal.toLowerCase()}.` : `The recipe: ${x.goal.toLowerCase()}. Pick the reagents and the operation.`));
      ui(`${flameBar(run, L)}<div class="clues"><div class="clue"><b>${L.n === 3 ? "🧑‍🔬" : "📜"} ${esc(intro)}</b><span>${esc(x.goal)}</span></div>${hintText(x, run)}</div>${feedback(run.last)}
        <div class="group">Reagents (choose up to 3)</div><div class="al-shelf">${x.shelf.map((id) => reagentBtn(id, sel.includes(id))).join("")}</div>
        <div class="group">Operation</div><div class="al-ops">${opsFor(L).map((k) => `<button class="c al-op${op === k ? " on" : ""}" type="button" data-op="${k}" title="${esc(OPS[k].what)}" aria-pressed="${op === k}">${OPS[k].emoji} ${esc(OPS[k].name)}</button>`).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="al-go" ${sel.length && op ? "" : "disabled"}>⚗️ Transmute</button>${run.flames > 1 ? `<button class="c" type="button" id="al-hint">📓 Notebook hint (🔥 1)</button>` : ""}<button class="c small" type="button" id="al-leave">Leave the bench</button></div>`);
      $("ui").querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => { const id = b.dataset.r, s = sel.includes(id) ? sel.filter((i) => i !== id) : sel.length < 3 ? [...sel, id] : sel, added = s.length > sel.length;
        sfx.clink(x.shelf.indexOf(id)); if (added) sfx.pour(); bench(L, x, run, s, op, " ", added ? { pour: REAGENTS[id].c } : {}); }));
      $("ui").querySelectorAll("[data-op]").forEach((b) => (b.onclick = () => { const k = b.dataset.op; (k === "dissolve" ? sfx.bubble : k === "electrolyse" ? sfx.zap : sfx.whoosh)(); bench(L, x, run, sel, k, `${OPS[k].name}: ${OPS[k].what}`); }));
      $("al-leave").onclick = () => lobby(false);
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
    function gassed(L, x, run, hz, sel) {
      sfx.gas(); cap("☠️ " + hz.name);
      draw({ flames: run.flames, shelf: x.shelf, chips: sel, gas: hz.col, label: "☠️ " + hz.name });
      tableEl.classList.remove("choke"); void tableEl.offsetWidth; tableEl.classList.add("choke");
      say(pick(["*cough* *cough* A poison cloud pours out of the flask. Get out! The experiment is over.", "The air turns thick and stinging. You stagger out of the Lab, eyes streaming. Experiment over.", "A deadly gas fills the room. Out, now! This experiment is finished."]));
      ui(`<div class="al-boomcard gas"><b>☠️ ${esc(hz.name)}</b><p>${esc(hz.what)}</p><p class="note">${esc(hz.lesson)}</p></div>
        <div class="choices"><button class="c main" type="button" id="al-ok">🪟 Open the windows and get out</button></div>`);
      $("al-ok").onclick = () => finish(L, x, run, hz);
    }
    function explode(L, x, run, hz, sel) {
      if (hz.kind === "gas") return gassed(L, x, run, hz, sel);
      sfx.boom(); cap("💥 " + hz.name);
      draw({ flames: 0, shelf: x.shelf, chips: sel, boom: true, label: "💥 " + hz.name });
      tableEl.classList.remove("quake"); void tableEl.offsetWidth; tableEl.classList.add("quake");
      say(pick(["KABOOM! Glass everywhere. The experiment is over.", "BANG! The flask is gone, and so are your eyebrows. Experiment over.", "A blinding flash, a bang, and soot on the ceiling. That's the end of this experiment."]));
      ui(`<div class="al-boomcard"><b>💥 ${esc(hz.name)}</b><p>${esc(hz.what)}</p><p class="note">${esc(hz.lesson)}</p></div>
        <div class="choices"><button class="c main" type="button" id="al-ok">🧹 Sweep up the glass</button></div>`);
      $("al-ok").onclick = () => finish(L, x, run, hz);
    }
    const eqCard = (x) => `<div class="al-eq"><b>${esc(x.product)}</b><code>${esc(x.eq)}</code></div>`;
    function success(L, x, run) {
      sfx.transmute(); spark(); cap(`✨ ${x.product}`);
      draw({ flames: run.flames, shelf: x.shelf, chips: x.make, liquid: x.colour, glow: true, label: x.product,
        react: { from: x.make.map((i) => REAGENTS[i].c), to: x.colour, fx: x.fx, fxc: x.fxc } }); sfx.react(x.fx);
      if (L.n === 3) return talkThrough([`It works! ${x.story}`], () => askFind(L, x, run));
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
      const after = solvedCount(P()), t = titleOf(after), titled = titleOf(before).name !== t.name;
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      if (r.boom) bits.push(`${hz.kind === "gas" ? "☠️ poisoned by" : "💥 exploded:"} ${esc(hz.name)} · lesson added to your Codex`); else bits.push(run.won ? `score ${r.score}${r.first ? "" : r.best ? " · new best" : ` · best stays ${lab().solved[keyOf(L, x)]}`}` : "not done this time");
      if (r.boom) say(hz.kind === "gas" ? "Lesson learned, with streaming eyes. Air the room and try again." : "Lesson learned the loud way. Try again with a steadier hand."); else say(run.won ? pick(["Into the notebook it goes.", "The Great Work advances.", "Another secret of matter, written down."]) : "Even Newton had bad days at the furnace.");
      const els = r.newEls.length ? `<div class="up">🧪 New on your periodic table: ${r.newEls.map((e) => `<span class="al-el on">${e}<small>${ELEMENTS[e][2]}</small></span>`).join(" ")}</div>` : "";
      const up = LEVELS[L.n] && run.won && r.first && solvedCount(P(), L) === 4 ? `<div class="up">🔓 Ready for Level ${L.n + 1}: ${esc(LEVELS[L.n].what)}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${els}${titled ? `<div class="up">⚗️ Lab title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}${up}</div>
        ${L.n > 1 ? eqCard(x) : `<div class="al-eq"><b>${esc(x.name)}</b><code>${esc(x.modern)}</code></div>`}
        <div class="choices"><button class="c main" type="button" id="al-next">⚗️ Next Level ${L.n} work</button>${run.won ? "" : `<button class="c" type="button" id="al-again">↻ Try again</button>`}<button class="c" type="button" id="al-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp || r.newEls.length) spark(); if (titled || aw.rankUp) chime(2);
      $("al-next").onclick = () => begin(L, nextOf(P(), L, x.id));
      if ($("al-again")) $("al-again").onclick = () => begin(L, x);
      $("al-lobby").onclick = () => lobby(false); $("back").onclick = greet;
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
  for (let per = 1; per <= 6; per++) for (let grp = 1; grp <= 18; grp++) {
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
    + (() => { const acc = r.accidents || []; return `<div class="cx"><div class="cx-h"><span>⚠️ Lab accidents (lessons learned)</span><span class="note">${acc.length} / ${HAZARDS.length}${r.booms ? ` · ${r.booms} explosion${r.booms === 1 ? "" : "s"}` : ""}</span></div>${acc.length ? `<div class="chips">${acc.map((id) => `<span>${esc(HAZARDS.find((h) => h.id === id)?.name || id)}</span>`).join("")}</div>` : ""}</div>`; })()
    + `<div class="cx"><div class="cx-h"><span>🧪 Elements found in the Lab</span><span class="note">${n} / ${of}</span></div><div class="bar"><i style="width:${(n / of) * 100}%"></i></div>${n ? `<div class="chips">${r.elements.map((e) => `<span>${esc(e)}</span>`).join("")}</div>` : ""}</div>`;
}
