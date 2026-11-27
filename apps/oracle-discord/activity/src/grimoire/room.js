// Herbalist's Grimoire: a room of the Oracle Chamber. A pressed specimen is laid on the reading table; the Oracle reads
// out clues (how it looks, where it grows, its folklore, its history, its chemistry). Name the plant, say whether it is
// gentle, handle-with-care or poison, then judge one claim: science or folklore? Each plant earns a grimoire page with
// its folklore, what science says and a safety note. For learning only: never medical advice.
// Mounted via ROOMS (main.js): room.open(ctx), codexHtml, shop.
import { DANGER, EVIDENCE } from "./plants.js";
import { LEVELS, ALL, LEAVES, keyOf, perLeaf, safetyPts, claimPts, room as grim, solvedCount, titleOf, nextTitle, plantById, nextPlant, start, moreClue, usePick, whichPlant, choices, guessName, guessSafety, guessClaim, settle } from "./logic.js";
import { pageSvg } from "./sketch.js";
import { GUIDES, NOT_ADVICE, POISON_HELP } from "./guide.js";
import { shop, themeOf } from "./shop.js";
import { CSS } from "./style.js";
import { SFX } from "./sfx.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WRONG = [
  "The specimen rustles, unimpressed. A leaf drops off the page.",
  "Not that one. A leaf withers. Somewhere, a botanist sighs.",
  "Close in spirit, wrong in species. One leaf fewer.",
  "The page curls at the corner. A leaf crumbles to dust.",
];
const WRONG_PICK_LINES = [
  "Wrong pick from the four. Three leaves fall from the page.",
  "Not that one. A wrong pick costs three leaves, and down they flutter.",
  "The specimen shakes its head. Three leaves drop away.",
];
const UNKNOWN = ["No plant by that name grows in this garden. Try its common name, or check the spelling. No leaf lost.", "Hmm, that's not on this level's list. Try another name. No leaf lost."];
const INTRO = {
  1: "A specimen from the kitchen garden. Each clue is a true fact about it: how it looks, its lore, its chemistry.",
  2: "A specimen from the apothecary's meadow, a plant folk healers swore by. Each clue is true.",
  3: "A specimen from the poison garden. Look, don't touch. Each clue is true, and some are grim.",
};
const NUM = new Map(ALL.map(({ p }, i) => [p.id, i + 1]));

function styleOnce() {
  if (document.getElementById("gr-style")) return;
  const st = document.createElement("style"); st.id = "gr-style"; st.textContent = CSS; document.head.append(st);
}

/** The grimoire page for a plant, shown in the reading area under the Oracle's text. */
export function pageHtml(p, esc) {
  const d = DANGER[p.danger[0]], e = EVIDENCE[p.evidence], poison = p.danger[0] === "poison";
  return `<div class="gr-page"><div class="gr-head"><h3>${esc(p.emoji)} ${esc(p.name)}</h3><i>${esc(p.latin)} · ${esc(p.family)}</i></div>
    <div class="gr-badges"><span class="gr-badge ${p.danger[0]}">${d.emoji} ${esc(d.name)}</span><span class="gr-badge">${e.emoji} ${esc(e.name)}</span></div>
    <div class="gr-sec"><b class="h">📜 Folklore</b>${esc(p.folklore)}</div>
    <div class="gr-sec"><b class="h">🔬 What science says</b>${esc(p.science)}</div>
    <div class="gr-sec safety${poison ? " poison" : ""}"><b class="h">${d.emoji} Safety</b>${esc(p.safety)}${poison ? `<br><br>${esc(POISON_HELP)}` : ""}</div>
    <div class="gr-warn">${esc(NOT_ADVICE)}</div></div>`;
}
export function guideHtml(n, esc) {
  const g = GUIDES[n];
  return `<div class="gr-guide"><h3>📖 ${esc(g.title)}</h3>${g.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(s.h)}</summary>${s.p.map((t) => `<p>${t}</p>`).join("")}</details>`).join("")}</div>`;
}

export const room = {
  id: "grimoire", label: "Herbalist's Grimoire", emoji: "🌿",
  blurb: "Identify plants, their folklore and what science says about them",
  shop,
  open(ctx) {
    const { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const prog = () => grim(state.prog);
    let shown = LEAVES; // leaves on the page last time it was drawn, so a lost one can fall
    const draw = (p, run, revealed = false, fx = {}) => { tableEl.className = "table grimoire";
      const leaves = run ? run.leaves : LEAVES, fell = leaves < shown ? leaves : -1, fellTo = shown; shown = leaves;
      tableEl.innerHTML = pageSvg(p, { leaves, revealed, no: p ? NUM.get(p.id) : 0, theme: themeOf(state.prog), poison: p && revealed && p.danger[0] === "poison", fell, fellTo, ...fx });
      if (fell >= 0) SFX.leaf();
      if (fx.shake) { void tableEl.offsetWidth; tableEl.classList.add("gr-shake"); } };
    const stats = () => { const n = solvedCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>🌿 ${esc(t.name)}</b> · ${n} / ${ALL.length} plants in your grimoire${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };
    const showPage = (p) => { $("reading-body").innerHTML = pageHtml(p, esc); };
    const toggleGuide = (n, btn) => { const rb = $("reading-body"), on = !rb.querySelector(".gr-guide");
      rb.innerHTML = on ? guideHtml(n, esc) : ""; if (btn) btn.textContent = on ? "📖 Close study guide" : btn.dataset.label;
      if (on) rb.querySelector(".gr-guide").scrollIntoView({ behavior: "smooth", block: "start" }); };

    function lobby(first) {
      clearReading(); cap("🌿 Herbalist's Grimoire"); draw(null, null, false);
      say(first && !prog().plays
        ? `Welcome to the Grimoire, ${state.name}. I lay a pressed plant on the table and read you its clues: how it looks, its folklore, its history, its chemistry. Name it, tell me whether it's gentle, handle-with-care or poison, then judge one claim: science or folklore? Every plant you name gets a page in your grimoire.`
        : solvedCount(state.prog) >= ALL.length ? `Every page filled, ${state.name}. A Master Herbalist. Press any plant again to beat your score.` : `Which garden shall we walk today, ${state.name}?`);
      const lvl = (L) => { const n = solvedCount(state.prog, L);
        return `<button class="c level" type="button" data-l="${L.n}"><b>${"🌿".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${n} / ${L.deck.length} identified · points ×${L.mult}</span></button>`; };
      const known = ALL.filter(({ L, p }) => prog().solved[keyOf(L, p)]);
      ui(`${stats()}<div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="choices">${LEVELS.map((L) => `<button class="c small" type="button" data-g="${L.n}" data-label="📖 Study guide: ${esc(L.name)}">📖 Study guide: ${esc(L.name)}</button>`).join("")}</div>
        <div class="note">5 leaves per plant. The first clue is free; each extra clue and each wrong typed name costs a leaf; a wrong pick from four costs 3. Typing the name scores double. For learning only: never eat or use a plant because of a game.</div>
        <div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
        ${known.length ? `<div class="group">Your grimoire</div><div class="choices">${known.map(({ L, p }) => `<button class="c small" type="button" data-k="${p.id}">${p.emoji} ${esc(p.name)} <span class="note">· L${L.n} · best ${prog().solved[keyOf(L, p)]}</span></button>`).join("")}</div>` : ""}`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; identify(L, nextPlant(state.prog, L, prog().last)); }));
      $("ui").querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => toggleGuide(+b.dataset.g, b)));
      $("back").onclick = greet;
      $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => study(plantById(b.dataset.k))));
    }

    /** Read a page you've already earned. */
    function study(p) {
      const L = LEVELS.find((x) => x.deck.includes(p));
      draw(p, null, true, { turn: true }); SFX.page(); cap(`${p.emoji} ${p.name}`); say(`${p.name}, from your grimoire. ${p.latin}.`); showPage(p);
      ui(`<div class="choices"><button class="c main" type="button" id="gr-again">🌿 Identify it again</button><button class="c" type="button" id="gr-lobby">📜 Choose a garden</button></div>`);
      $("gr-again").onclick = () => identify(L, p); $("gr-lobby").onclick = () => lobby(false);
    }

    const clueList = (p, run) => `<div class="clues">${p.clues.slice(0, run.shown).map((c, i) => `<div class="clue"><b>🍃 Clue ${i + 1}</b><span>${esc(c)}</span></div>`).join("")}</div>`;
    const leafBar = (L, run) => `<div class="cx-top">Level ${L.n} · 🍃 ${"●".repeat(run.leaves)}${"○".repeat(LEAVES - run.leaves)} · ${run.leaves} lea${run.leaves === 1 ? "f" : "ves"} left · naming it now scores ${perLeaf(run.mode, L) * run.leaves}${run.mode === "pick" ? " (multiple choice)" : ""}</div>`;

    function identify(L, p) {
      const run = start(p, L);
      clearReading(); cap(`🌿 Level ${L.n} · Specimen Nº ${String(NUM.get(p.id)).padStart(2, "0")}`); shown = LEAVES; draw(p, run, false, { turn: true }); SFX.page();
      talkThrough([pick(["I open the grimoire. A pressed plant, its label smudged.", "A specimen slides out from between the pages.", "The book falls open at an unlabelled page."]) + " " + INTRO[L.n], `First clue: “${p.clues[0]}”`], () => name(L, p, run));
    }

    function name(L, p, run, line, fx = {}) {
      draw(p, run, false, fx); if (line) say(line);
      const more = run.shown < p.clues.length && run.leaves > 1;
      const form = run.mode === "type"
        ? `<div class="form one" id="gr-f"><label for="gr-n">Name the plant<input id="gr-n" maxlength="60" autocomplete="off" placeholder="Its common name, e.g. lavender"></label></div>
           <div class="choices"><button class="c main" type="button" id="gr-go">✦ Name it</button>${more ? `<button class="c" type="button" id="gr-more">🍃 Another clue (1 leaf)</button>` : ""}<button class="c" type="button" id="gr-pick">🎴 Show me 4 (half points, wrong pick = 3 leaves)</button></div>`
        : `<div class="choices col">${choices(p, L).map((x) => `<button class="c" type="button" data-n="${x.id}" ${run.wrong.includes(x.id) ? "disabled" : ""}>${run.wrong.includes(x.id) ? "✗ " : ""}${esc(x.name)}</button>`).join("")}</div>
           <div class="choices">${more ? `<button class="c" type="button" id="gr-more">🍃 Another clue (1 leaf)</button>` : ""}</div>`;
      ui(`${leafBar(L, run)}${clueList(p, run)}${form}<div class="choices"><button class="c small" type="button" id="gr-leave">Close the grimoire</button></div>`);
      if ($("gr-more")) $("gr-more").onclick = () => { if (moreClue(run, p)) { SFX.quill(); name(L, p, run, `Next clue: “${p.clues[run.shown - 1]}”`); } };
      if ($("gr-pick")) $("gr-pick").onclick = () => { usePick(run); name(L, p, run, "Very well. It's one of these four. Choose carefully: a wrong pick costs three leaves."); };
      $("gr-leave").onclick = () => lobby(false);
      const answer = (who) => { const r = guessName(run, p, who);
        if (r === "right") return named(L, p, run, true);
        if (r === "out") return named(L, p, run, false);
        if (r === "wrong") { SFX.wrong(); name(L, p, run, pick(run.mode === "pick" ? WRONG_PICK_LINES : WRONG), { shake: true }); } };
      // Discord's Activity iframe blocks <form> submit: a button and the Enter key do it instead.
      if ($("gr-n")) { const go = () => { const v = $("gr-n").value.trim(); if (!v) return; const who = whichPlant(v, L); if (!who) { SFX.wrong(); say(pick(UNKNOWN)); return; } answer(who); };
        setTimeout(() => $("gr-n") && $("gr-n").focus(), 50);
        $("gr-go").onclick = go; $("gr-n").onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); go(); } }; }
      $("ui").querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => answer(plantById(b.dataset.n, L))));
    }

    function named(L, p, run, won) {
      draw(p, run, true, { sparkle: won }); cap(`${p.emoji} ${p.name} · ${p.latin}`); if (won) { SFX.right(); SFX.sparkle(); } else { SFX.leaf(); chime(0); }
      if (p.danger[0] === "poison") SFX.stamp();
      say(won ? `Yes! ${p.name}, ${p.latin}. Now the herbalist's question: is it gentle, handle with care, or poison?`
        : `The last leaf falls… It was ${p.name}, ${p.latin}. You can still score: is it gentle, handle with care, or poison?`);
      ui(`<div class="choices col">${Object.entries(DANGER).map(([k, d]) => `<button class="c" type="button" data-d="${k}">${d.emoji} <b>${esc(d.name)}</b> <span class="note">· ${esc(d.what)}</span></button>`).join("")}</div>
        <div class="note">+${safetyPts(L)} if you're right. One answer.</div>`);
      $("ui").querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => {
        const ok = guessSafety(run, p, b.dataset.d), d = DANGER[p.danger[0]];
        ok ? SFX.right() : SFX.wrong(); SFX.page(); showPage(p);
        say(`${ok ? `Right. +${safetyPts(L)}.` : "Not quite."} ${p.name}: ${d.emoji} ${d.name.toLowerCase()}. ${p.safety.split(". ")[0].replace(/\.$/, "")}. Its full page is open below.`);
        ui(`<div class="choices"><button class="c main" type="button" id="gr-claim">🔬 Last test: science or folklore?</button></div>`);
        $("gr-claim").onclick = () => claim(L, p, run);
      }));
    }

    function claim(L, p, run) {
      say("One last test. Does science back this up, or is it just folklore?");
      ui(`<div class="gr-claim">“${esc(p.claim.t)}”</div>
        <div class="choices"><button class="c" type="button" data-c="1">🔬 Science backs it</button><button class="c" type="button" data-c="0">🌀 Just folklore</button></div>
        <div class="note">+${claimPts(L)} if you're right. The page below may help.</div>`);
      $("ui").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => {
        const ok = guessClaim(run, p, b.dataset.c === "1"); ok ? SFX.right() : SFX.wrong();
        say(`${ok ? `Correct! +${claimPts(L)}.` : "Not this time."} ${p.claim.fact ? "Science backs it." : "That one's folklore."} ${p.claim.why}`, () => finish(L, p, run));
      }));
    }

    function finish(L, p, run) {
      const before = solvedCount(state.prog), r = settle(state.prog, run);
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("grimoire", L.n, { won: run.won, perfect: run.won && !run.wrong.length }); // Trophy Case (trophies.js)
      const after = solvedCount(state.prog), t = titleOf(after), titled = titleOf(before).name !== t.name;
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      if (run.won) bits.push(`score ${r.score}${r.first ? " · new page in your grimoire" : r.best ? " · new best" : ` · best stays ${prog().solved[keyOf(L, p)]}`}${run.mode === "type" ? " · typed it!" : ""}`);
      else bits.push("not named this time");
      const up = LEVELS[L.n] && solvedCount(state.prog, L) === 3 && run.won && r.first ? `<div class="up">🔓 Ready for Level ${L.n + 1}: ${esc(LEVELS[L.n].name)}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${titled ? `<div class="up">🌿 Grimoire title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}${up}</div>
        <div class="choices"><button class="c main" type="button" id="gr-go">🌿 Another Level ${L.n} plant</button>${run.won ? "" : `<button class="c" type="button" id="gr-again">↻ Try this plant again</button>`}<button class="c" type="button" id="gr-lobby">📜 Choose a garden</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (run.won && (r.first || r.best)) SFX.sparkle(); if (titled || aw.rankUp) chime(2);
      $("gr-go").onclick = () => identify(L, nextPlant(state.prog, L, p.id));
      if ($("gr-again")) $("gr-again").onclick = () => identify(L, p);
      $("gr-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    lobby(true);
  },
};

/** For the Codex page: plants identified, by level. */
export function grimoireCodex(prog, esc) {
  const r = grim(prog);
  return LEVELS.map((L) => { const got = L.deck.filter((p) => r.solved[keyOf(L, p)]);
    return `<div class="cx"><div class="cx-h"><span>🌿 Grimoire: ${esc(L.name)}</span><span class="note">${got.length} / ${L.deck.length}</span></div>
    <div class="bar"><i style="width:${(got.length / L.deck.length) * 100}%"></i></div>${got.length ? `<div class="chips">${got.map((p) => `<span>${p.emoji} ${esc(p.name)}</span>`).join("")}</div>` : ""}</div>`; }).join("");
}
