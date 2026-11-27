// Alchemist's Lab: a room of the Oracle Chamber. Level 1, read the old symbols; level 2, follow real alchemical
// recipes at the furnace; level 3, repeat the experiments that turned alchemy into chemistry. Every answer reveals the
// real history and the modern chemistry (with a balanced equation), and lights elements on your own periodic table.
// Rules in logic.js, content in lab.js, study guide in guide.js, workbench drawing in scene.js, apothecary in shop.js.
import { SYMBOLS, REAGENTS, OPS, ELEMENTS } from "./lab.js";
import { glyphSvg } from "./glyphs.js";
import { NOTEBOOK } from "./guide.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { sceneSvg } from "./scene.js";
import { CSS } from "./style.js";
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
      clearReading(); cap("⚗️ The Alchemist's Lab"); draw({ shelf: ["mercury", "sulfur", "salt", "aquafortis", "vitriol", "gold"] });
      say(first && !lab().plays
        ? `Welcome to the laboratory, ${state.name}. Alchemists hunted for the philosopher's stone and never found it, but they invented the lab, and their recipes became chemistry. Start at level one to learn their symbols. Then light the furnace and follow their real recipes. Everything you mix here is true history.`
        : `The furnace is warm, ${state.name}. What shall we work on?`);
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"⚗️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${solvedCount(P(), L)} / ${L.deck.length} done · points ×${L.mult}</span></button>`;
      ui(`${stats()}<div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">4 flames in the furnace. A wrong answer, a failed mix or a notebook hint puts one out.</div>
        <div class="choices"><button class="c" type="button" id="al-book">📓 Alchemist's notebook</button><button class="c" type="button" id="al-table">🧪 My periodic table</button><button class="c" type="button" id="al-shop">🏺 Apothecary</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; begin(L, nextOf(P(), L, lab().last)); }));
      $("al-book").onclick = () => toggle("book", $("al-book"), "📓 Alchemist's notebook"); $("al-table").onclick = () => toggle("table", $("al-table"), "🧪 My periodic table");
      $("al-shop").onclick = shop; $("back").onclick = greet;
    }
    function toggle(what, btn, label) {
      const rb = $("reading-body"), on = !rb.querySelector(".al-" + what);
      rb.innerHTML = on ? (what === "book" ? notebookHtml(esc) : periodicHtml(P(), esc)) : "";
      if (btn) btn.textContent = on ? "✕ Close" : label;
      if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const begin = (L, x) => (L.n === 1 ? read(L, x, start(x, L)) : bench(L, x, start(x, L), [], null));

    // ---- level 1: read the symbol ----
    function read(L, x, run, line) {
      clearReading(); cap(`⚗️ Level 1 · what is this symbol?`); draw({ glyph: x.glyph, flames: run.flames });
      say(line || pick(["An old page from a recipe book. What does this symbol stand for?", "The margin of a 16th-century manuscript. Which substance is this?", "Every alchemist knew this sign. Do you?"]));
      ui(`${flameBar(run, L)}<div class="clues">${x.clues.slice(0, run.clues).map((c, i) => `<div class="clue"><b>📜 Clue ${i + 1}</b><span>${esc(c)}</span></div>`).join("")}</div>
        <div class="choices col">${options(x).map((o) => `<button class="c" type="button" data-o="${o.id}" ${run.wrong.includes(o.id) ? "disabled" : ""}>${run.wrong.includes(o.id) ? "✗ " : ""}${esc(o.name)}</button>`).join("")}</div>
        <div class="choices">${run.clues < x.clues.length && run.flames > 1 ? `<button class="c" type="button" id="al-clue">📜 Another clue (🔥 1)</button>` : ""}<button class="c small" type="button" id="al-leave">Leave the bench</button></div>`);
      if ($("al-clue")) $("al-clue").onclick = () => { if (moreClue(run, x)) read(L, x, run, "Here, another line from the margin."); };
      $("al-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => {
        const r = readSymbol(run, x, b.dataset.o);
        if (r === "right") { chime(2); spark(); draw({ glyph: x.glyph, flames: run.flames, glow: true, liquid: "#FADE8C", label: `${x.name} · ${x.modern}` }); cap(`${x.name} · ${x.modern}`);
          talkThrough([`Yes! That is ${x.name.toLowerCase()}${x.tag ? `, the sign of ${x.tag === "Element" ? "one of the four elements" : x.tag}` : ""}.`, x.fact], () => finish(L, x, run)); }
        else if (r === "out") { chime(0); draw({ glyph: x.glyph, flames: 0, label: x.name });
          talkThrough([`The furnace goes cold. This was ${x.name.toLowerCase()}.`, x.fact], () => finish(L, x, run)); }
        else if (r === "wrong") { chime(0); read(L, x, run, pick(FIZZLE)); }
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
    function bench(L, x, run, sel, op, line) {
      const intro = L.n === 3 ? `${x.who}, ${x.when}` : "From the old books";
      if (!line && !run.tries && !run.hints.length) clearReading();
      cap(`⚗️ Level ${L.n} · ${L.n === 3 ? x.who : "a recipe"}`); draw({ flames: run.flames, shelf: x.shelf, chips: sel, liquid: sel.length ? REAGENTS[sel[sel.length - 1]].c : null });
      say(line || (L.n === 3 ? `It is ${x.when}. You are ${x.who}. Your task: ${x.goal.toLowerCase()}.` : `The recipe: ${x.goal.toLowerCase()}. Pick the reagents and the operation.`));
      ui(`${flameBar(run, L)}<div class="clues"><div class="clue"><b>${L.n === 3 ? "🧑‍🔬" : "📜"} ${esc(intro)}</b><span>${esc(x.goal)}</span></div>${hintText(x, run)}</div>${feedback(run.last)}
        <div class="group">Reagents (choose up to 3)</div><div class="al-shelf">${x.shelf.map((id) => reagentBtn(id, sel.includes(id))).join("")}</div>
        <div class="group">Operation</div><div class="al-ops">${opsFor(L).map((k) => `<button class="c al-op${op === k ? " on" : ""}" type="button" data-op="${k}" title="${esc(OPS[k].what)}" aria-pressed="${op === k}">${OPS[k].emoji} ${esc(OPS[k].name)}</button>`).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="al-go" ${sel.length && op ? "" : "disabled"}>⚗️ Transmute</button>${run.flames > 1 ? `<button class="c" type="button" id="al-hint">📓 Notebook hint (🔥 1)</button>` : ""}<button class="c small" type="button" id="al-leave">Leave the bench</button></div>`);
      $("ui").querySelectorAll("[data-r]").forEach((b) => (b.onclick = () => { const id = b.dataset.r, s = sel.includes(id) ? sel.filter((i) => i !== id) : sel.length < 3 ? [...sel, id] : sel; bench(L, x, run, s, op, " "); }));
      $("ui").querySelectorAll("[data-op]").forEach((b) => (b.onclick = () => bench(L, x, run, sel, b.dataset.op, `${OPS[b.dataset.op].name}: ${OPS[b.dataset.op].what}`)));
      $("al-leave").onclick = () => lobby(false);
      if ($("al-hint")) $("al-hint").onclick = () => { if (hintOf(run, x)) { chime(1); bench(L, x, run, sel, op, "You flip through the notebook…"); } };
      $("al-go").onclick = () => {
        const r = transmute(run, x, sel, op);
        if (r === "right") return success(L, x, run);
        if (r === "out") { chime(0); draw({ flames: 0, shelf: x.shelf, liquid: "#3a3a3a", label: x.product });
          return talkThrough([`The last flame dies. Here is how it was really done: ${x.make.map((i) => REAGENTS[i].name.toLowerCase()).join(" with ")}, then ${OPS[x.op].name.toLowerCase()}.`, x.story, x.science], () => finish(L, x, run)); }
        if (r === "wrong") { chime(0); bench(L, x, run, sel, op, pick(FIZZLE)); }
      };
    }
    const eqCard = (x) => `<div class="al-eq"><b>${esc(x.product)}</b><code>${esc(x.eq)}</code></div>`;
    function success(L, x, run) {
      chime(2); spark(); cap(`✨ ${x.product}`);
      draw({ flames: run.flames, shelf: x.shelf, chips: x.make, liquid: x.colour, glow: true, label: x.product });
      if (L.n === 3) return talkThrough([`It works! ${x.story}`], () => askFind(L, x, run));
      talkThrough([`It works! ${x.product}.`, x.story, x.science], () => finish(L, x, run));
    }
    function askFind(L, x, run) {
      say(`So, ${state.name}: what had ${x.who} really found?`);
      ui(`${flameBar(run, L)}<div class="choices col">${rot(x.options, x.id).map((o) => `<button class="c" type="button" data-a="${x.options.indexOf(o)}">${esc(o)}</button>`).join("")}</div><div class="note">One try · +${NAME_PTS * L.mult} if you're right.</div>`);
      $("ui").querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => { const ok = nameIt(run, x, x.options[+b.dataset.a]); chime(ok ? 2 : 0);
        talkThrough([ok ? `Exactly: ${x.answer.toLowerCase()}.` : `Not quite. It was ${x.answer.toLowerCase()}.`, x.science], () => finish(L, x, run)); }));
    }

    // ---- results ----
    function finish(L, x, run) {
      const before = solvedCount(P()), r = settle(P(), run, x), aw = award(r.xp, r.essence); saveProgress(); showStats();
      const after = solvedCount(P()), t = titleOf(after), titled = titleOf(before).name !== t.name;
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      bits.push(run.won ? `score ${r.score}${r.first ? "" : r.best ? " · new best" : ` · best stays ${lab().solved[keyOf(L, x)]}`}` : "not done this time");
      say(run.won ? pick(["Into the notebook it goes.", "The Great Work advances.", "Another secret of matter, written down."]) : "Even Newton had bad days at the furnace.");
      const els = r.newEls.length ? `<div class="up">🧪 New on your periodic table: ${r.newEls.map((e) => `<span class="al-el on">${e}<small>${ELEMENTS[e][2]}</small></span>`).join(" ")}</div>` : "";
      const up = LEVELS[L.n] && run.won && r.first && solvedCount(P(), L) === 4 ? `<div class="up">🔓 Ready for Level ${L.n + 1}: ${esc(LEVELS[L.n].what)}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${els}${titled ? `<div class="up">⚗️ Lab title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}${up}</div>
        ${L.n > 1 ? eqCard(x) : `<div class="al-eq"><b>${esc(x.name)}</b><code>${esc(x.modern)}</code></div>`}
        <div class="choices"><button class="c main" type="button" id="al-next">⚗️ Next Level ${L.n} work</button>${run.won ? "" : `<button class="c" type="button" id="al-again">↻ Try again</button>`}<button class="c" type="button" id="al-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (titled || aw.rankUp || r.newEls.length) spark();
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
        if (r) { saveProgress(); showStats(); chime(r === "bought" ? 2 : 1); shop(r === "bought" ? "A fine purchase. It's on your bench." : "Swapped in."); } }));
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
    + `<div class="cx"><div class="cx-h"><span>🧪 Elements found in the Lab</span><span class="note">${n} / ${of}</span></div><div class="bar"><i style="width:${(n / of) * 100}%"></i></div>${n ? `<div class="chips">${r.elements.map((e) => `<span>${esc(e)}</span>`).join("")}</div>` : ""}</div>`;
}
