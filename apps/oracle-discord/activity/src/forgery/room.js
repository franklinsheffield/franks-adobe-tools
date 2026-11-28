// The Forgery Desk: a room of the Oracle Chamber (Scriptorium game). Documents arrive claiming a date. Test their ink,
// paper and words with UV lamp, loupe and dictionary (tests are limited), then flag the feature too new for the date,
// or call the document genuine. Every feature's first date is real; the documents are made up for the game.
import { DOCS, CASES, LEVELS, ROUND, REP, TOOLS, featureOf } from "./data.js";
import { room as foOf, start, doc, test, judge, next, perfect, settle, maxScore, docOf, dailyOf } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { deskHtml, CSS } from "./scene.js";
import * as sfx from "../cipherdesk/sfx.js";
import { host } from "../hosts/index.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("fo-style")) return; const s = document.createElement("style"); s.id = "fo-style"; s.textContent = CSS(); document.head.append(s); };
const stars = (n) => "★".repeat(Math.max(0, n)) + "☆".repeat(Math.max(0, REP - n));
const caseOf = (id) => CASES.find((c) => c.id === id);

export const forgery = {
  id: "forgery", label: "Forgery Desk", emoji: "🔏",
  blurb: "Test ink, paper and words to catch documents too new for their date",
  shop: { kind: "forgery", label: "🔏 Forgery Desk", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table forgery";
      tableEl.innerHTML = deskHtml({ look: { ...DEFAULT_LOOK, [it.slot]: id }, year: "1863", tool: it.slot === "lamp" ? "uv" : it.slot === "lens" ? "lens" : "" }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => foOf(P());
    const draw = (s) => { tableEl.className = "table forgery"; tableEl.innerHTML = deskHtml({ look: lookOf(P()), ...s }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const wren = () => host().id === "scriptorium";

    function lobby(first) {
      clearReading(); cap("🔏 The Forgery Desk"); draw({ year: "18??", label: `${R().caught} forgeries caught` }); sfx.unfold();
      say(first && !R().plays
        ? (wren() ? `The forgery desk, ${state.name}. Every forger slips somewhere: a dye, a word, a stamp that didn't exist yet. Test what looks off, then name the slip. Or, now and then, admit the thing is real.`
          : `Welcome to the Forgery Desk, ${state.name}. Catch the feature too new for the document's date.`)
        : pick([`More documents in, ${state.name}. Some of them are lying.`, "The UV lamp's warm. Let's see who glows.", "Dates are easy to write. Ink is harder to fake."]));
      const r = R(), dd = dailyOf(), ds = dailyState(P(), "forgery");
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🔏".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${L.tests} tests a round${r.best[L.n] ? ` · best ${r.best[L.n]}` : ""}</span></button>`;
      ui(`<div class="cx-top"><b>🔏 Forgery Desk</b> · ${r.caught} caught · ${r.cleared} cleared</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${ROUND} documents a round and ${REP} stars of reputation. A wrong call costs a star.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="fo-daily"><b>📅 Daily Case${ds.played ? " · done ✓" : ""}</b><span>Today: Level ${dd.L.n}, the same documents for everyone${ds.streak ? ` · streak ${ds.streak}` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="fo-shop">🧰 Examiner's kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => examine(start(LEVELS[+b.dataset.l - 1]))));
      $("fo-daily").onclick = () => { const d = dailyOf(); examine(start(d.L, { seed: d.seed, daily: d.day })); };
      $("fo-shop").onclick = shop;
      $("back").onclick = greet;
    }
    const bar = (g) => `<div class="cx-top">Level ${g.L.n} · document ${g.di + 1} / ${g.docs.length} · tests ${g.tests} · ${stars(g.rep)}${g.daily ? " · 📅 daily" : ""}</div>`;

    function examine(g, line, tool = "") {
      const d = doc(g), D = docOf(d.id); clearReading(); cap(`🔏 ${D.name}`);
      draw({ year: `dated ${d.year}`, tool, label: D.name });
      if (!line && !tool) sfx.unfold();
      say(line || `${D.name}, dated ${d.year}. What looks off?`);
      ui(`${bar(g)}<div class="group">Clues · tap a tool to test one</div><div class="choices col fo-feats">${d.feats.map((id) => { const f = featureOf(id), t = TOOLS[f.tool], done = d.tested.includes(id);
          return `<div class="c${done ? (f.year > d.year ? " new" : " old") : ""}"><b>${esc(f.seen)}</b>${done ? `<small>${t.e} ${esc(f.found)}</small>` : ` <button class="c small" type="button" data-t="${id}" ${g.tests <= 0 ? "disabled" : ""}>${t.e} ${t.name}</button>`}</div>`; }).join("")}</div>
        <div class="group">Your verdict</div><div class="choices col">${d.feats.map((id) => `<button class="c" type="button" data-v="${id}">❌ Forged: ${esc(featureOf(id).seen)}</button>`).join("")}${g.L.genuine ? `<button class="c" type="button" data-v="genuine">✅ Genuine</button>` : ""}</div>
        <div class="choices"><button class="c small" type="button" id="fo-leave">Leave the desk</button></div>`);
      $("fo-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { const f = test(g, b.dataset.t); if (!f) return;
        f.tool === "dict" ? sfx.unfold() : f.tool === "lens" ? sfx.click() : sfx.decode(5);
        examine(g, `${TOOLS[f.tool].name}: ${f.found}${f.year > d.year ? " That's after the date on the page..." : ""}`, f.tool); }));
      $("ui").querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => verdict(g, b.dataset.v)));
    }

    function verdict(g, call) {
      const d = doc(g), D = docOf(d.id), r = judge(g, call), slip = d.fake && featureOf(d.fake);
      if (r === "right") { d.fake ? sfx.crack() : sfx.seal(); sfx.right(); if (g.di === 1 || g.di === 3) ctx.banter?.("mid"); } else { sfx.wrong(); ctx.emote?.("think", { quiet: true }); }
      draw({ year: `dated ${d.year}`, label: D.name, state: r === "right" ? (d.fake ? "forged" : "genuine") : "wrong" });
      const what = d.fake ? `Forged. ${slip.seen}: ${slip.found} The page claims ${d.year}.` : `Genuine. Every clue is older than ${d.year}.`;
      say(r === "right" ? pick(["Well spotted.", "That's the one.", "Good eye."]) + " " + what : "Not quite. " + what);
      if (r === "lost") return done(g);
      ui(`${bar(g)}<div class="in-card"><b>${r === "right" ? "✓" : "✗"} ${esc(D.name)}, dated ${d.year}</b><p>${esc(what)}</p></div>
        <div class="choices"><button class="c main" type="button" id="fo-next">${g.di + 1 < g.docs.length ? "📄 Next document" : "🗂 Close the file"}</button></div>`);
      $("fo-next").onclick = () => { next(g); g.over ? done(g) : examine(g); };
    }

    function done(g) {
      const c = caseOf(g.caseId), r = settle(P(), g), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("forgery", g.L.n, { won: r.won, perfect: perfect(g) }); // Trophy Case (trophies.js)
      draw({ year: "", label: g.won ? "file closed" : "off the case", state: g.won ? "forged" : "wrong" });
      sfx.finale(g.won); if (g.won) { spark(); chime(perfect(g) ? 3 : 1); ctx.banter?.("win"); } else ctx.banter?.("lose");
      say(g.won ? pick(["File closed. The forgers can try again next week.", "Every call checked. A tidy morning's work.", "That's the pile done."]) : "Three wrong calls, and the archive has taken you off the case. Every examiner has a bad day.");
      let board = "";
      if (g.daily) { const res = { score: g.score, won: g.won, detail: `Level ${g.L.n}` }, fd = finishDaily(P(), "forgery", res, g.daily); saveProgress();
        const fill = (b) => { const e = $("fo-board"); if (e) e.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: g.score } }); };
        (fd.first ? postDaily(state, "forgery", res) : boardOf(state, "forgery")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="fo-board" class="note">Loading the board…</div>`; }
      const right = g.docs.filter((d) => d.right).length;
      ui(`<div class="reward"><div><b>+${r.xp} ✦ · +${r.essence} 💎</b> · ${right} / ${g.docs.length} right · score ${g.score} / ${maxScore(g.L)}${perfect(g) ? " · ✨ not a call wrong" : ""}</div>${r.newCase ? `<div class="up">🗂 New case file: ${esc(c.name)}</div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="in-card"><b>🗂 A real case: ${esc(c.name)}</b><p>${esc(c.fact)}</p></div>${board}
        <div class="choices"><button class="c main" type="button" id="fo-again">🔏 Another Level ${g.L.n} round</button><button class="c" type="button" id="fo-lobby">🗂 Choose a level</button></div>`);
      $("fo-again").onclick = () => examine(start(g.L)); $("fo-lobby").onclick = () => lobby(false);
    }

    function shop(msg) {
      clearReading(); cap("🧰 Examiner's kit"); const look = lookOf(P()); draw({ year: "18??", label: "the kit" });
      say(typeof msg === "string" ? msg : `Lamps, lenses and case files, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><br><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="fo-lobby">🔏 Back to the desk</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. Close a file or two.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.click(); shop(r === "bought" ? "It's on your desk." : "Swapped in."); } }));
      $("fo-lobby").onclick = () => lobby(false);
    }

    lobby(true);
  },
};

/** Codex page: forgeries caught, genuine documents cleared, case files seen. */
export function forgeryCodex(p, esc) {
  const r = foOf(p);
  return `<div class="note">🔏 Forgery Desk: ${r.caught} forgeries caught · ${r.cleared} genuine cleared · best ${LEVELS.map((L) => `L${L.n} ${r.best[L.n] || 0}`).join(", ")}</div>
    <div class="chips">${CASES.map((x) => `<span>${r.seen.includes(x.id) ? "✓" : "·"} ${esc(x.name)}</span>`).join("")}</div>`;
}
export { DOCS };
