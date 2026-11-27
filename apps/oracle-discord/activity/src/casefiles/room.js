// The Case Files: a room of the Oracle Chamber, and step 1 of the Séance Parlour's core loop. A real claim of the
// supernatural arrives; you test it with an investigator's kit (magnifier, lights, controls, a magician, the lab,
// the record), each tool burning one of 5 candles, then name the method really behind it. Solved cases go into your
// casebook by method class, and each method you uncover becomes a trick to rehearse in the Workshop.
export const allLevel3 = (p) => LEVELS[2].pool.every((id) => cfOf(p).solved.includes(id));
import { CASES, CLASSES, LEVELS, METHODS, TOOLS, TOOL_KEYS, caseOf, method, findingOf } from "./data.js";
import { openFactFib } from "../party/factfib-ui.js";
import { kit as fibKit } from "./factfib.js";
import { room as cfOf, start, nextOf, useTool, accuse, scoreOf, perfect, settle, dailyOf, useful, CANDLES } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { deskSvg } from "./scene.js";
import { CSS } from "./style.js";
import * as sfx from "../seance/sfx.js";
import { page, coins, glass } from "../flametest/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { grantDebunker } from "../hosts/parlour-room.js";
import { host } from "../hosts/index.js";
import { TRICKS } from "../workshop/data.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("cf-style")) return; const s = document.createElement("style"); s.id = "cf-style"; s.textContent = CSS; document.head.append(s); };
const clsName = (k) => (CLASSES.find(([id]) => id === k) || [k, k])[1];
const TOOL_SFX = { look: page, lights: () => sfx.reveal(), control: () => sfx.knock(1), magician: () => sfx.summon(), lab: glass, record: page };

export const casefiles = {
  id: "casefiles", label: "Case Files", emoji: "🗂️",
  blurb: "Investigate real ghost claims and name the trick behind them",
  shop: { kind: "casefiles", label: "🗂️ Case Files desk", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table casefiles";
      tableEl.innerHTML = deskSvg(caseOf("fox"), { look: { ...DEFAULT_LOOK, [it.slot]: id }, tool: it.slot === "lens" ? "look" : null }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => cfOf(P());
    const draw = (c, o = {}) => { tableEl.className = "table casefiles"; tableEl.innerHTML = deskSvg(c, { look: lookOf(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const rook = () => host().id === "parlour"; // each House speaks in its own voice

    function lobby(first) {
      clearReading(); cap("🗂️ The Case Files"); draw(null);
      const r = R(), ds = dailyState(P(), "casefiles"), dd = dailyOf();
      say(first && !r.plays
        ? (rook() ? `Sit down, ${state.name}. Every one of these files is a real claim: raps, ghosts, floating tables. Every one had a method. Find it, and I'll teach it to you in the Workshop.`
          : `These are the Case Files, ${state.name}. Each one is a real claim of the supernatural from history. Test it the way investigators did, then name the trick behind it.`)
        : pick(rook() ? ["Another file landed on my desk. Something knocked in Ohio, apparently.", "Candles lit. Let's see who was fibbing.", `A fresh mystery for you, ${state.name}. It has a method. They all do.`]
          : ["A new case has arrived.", "The files are open. Pick a drawer.", "Another claim to test. Your move."]));
      const lvl = (L) => { const got = L.pool.filter((id) => r.solved.includes(id)).length;
        return `<button class="c level" type="button" data-l="${L.n}"><b>${"🕯️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${got} / ${L.pool.length} solved · points ×${L.mult}</span></button>`; };
      ui(`<div class="cx-top"><b>🗂️ Case Files</b> · ${r.solved.length} / ${CASES.length} solved · ${r.methods.length} / ${METHODS.length} methods learned</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${CANDLES} candles per case. Each tool burns one, and so does a wrong answer. Reading the claim is free.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="cf-daily"><b>📅 Daily case${ds.played ? " · done ✓" : ""}</b><span>The same file for everyone today · Level ${dd.L.n}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="cf-book">📒 My casebook</button><button class="c" type="button" id="cf-shop">🔍 Investigator's desk</button><button class="c" type="button" id="ff-open">🎭 Fact or Fib (party)</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; begin(start(L, nextOf(P(), L))); }));
      $("cf-daily").onclick = () => { const d = dailyOf(); begin(start(d.L, d.id, { seed: d.seed, daily: d.day })); };
      $("cf-book").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".cf-book"); page(); rb.innerHTML = on ? casebookHtml(P(), esc) : ""; $("cf-book").textContent = on ? "✕ Close" : "📒 My casebook"; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("cf-shop").onclick = shop; $("back").onclick = greet; $("ff-open").onclick = () => openFactFib(ctx, fibKit(tableEl), () => lobby(false));
    }

    const begin = (run) => { clearReading(); sfx.knock(3); show(run); };
    function show(run, line, last = null) {
      const c = caseOf(run.id), L = run.L;
      cap(`🗂️ Level ${L.n} · ${c.name}${run.daily ? " · 📅 daily" : ""}`); draw(c, { candles: run.candles, tool: last });
      say(line || `${c.year}, ${c.place}. ${c.scene}`);
      const ev = run.tools.map((k) => `<div class="${useful(run.id, k) ? "" : "dud"}"><b>${TOOLS[k].emoji} ${esc(TOOLS[k].name)}:</b> ${esc(findingOf(c, k))}</div>`).join("");
      ui(`<div class="cx-top">Level ${L.n} · candles ${"🕯️".repeat(run.candles)}${"·".repeat(CANDLES - run.candles)} · worth ${Math.round((run.candles + 1) * L.mult)}</div>
        <div class="cf-ev"><div><b>📁 The claim:</b> ${esc(c.who)}. ${esc(c.scene)}</div>${ev}</div>
        <div class="group">Investigate (one candle each)</div><div class="cf-tools">${TOOL_KEYS.map((k) => `<button class="c small" type="button" data-t="${k}" title="${esc(TOOLS[k].what)}" ${run.tools.includes(k) || run.candles <= 1 ? "disabled" : ""}>${TOOLS[k].emoji} ${esc(TOOLS[k].name)}</button>`).join("")}</div>
        <div class="group">What was the method?</div><div class="choices col">${run.options.map((id) => `<button class="c" type="button" data-m="${id}" ${run.wrong.includes(id) ? "disabled" : ""}>${run.wrong.includes(id) ? "✗ " : ""}${esc(method(id).name)}</button>`).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="cf-leave">Close the file</button></div>`);
      $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { const k = b.dataset.t; if (!useTool(run, k)) return;
        sfx.snuff(1); setTimeout(() => TOOL_SFX[k](), 220);
        show(run, useful(run.id, k) ? findingOf(c, k) : pick(["Nothing there. That candle is gone, darling.", "A dead end. Try another angle.", "Nothing useful. The trick is somewhere else."].map((s) => (rook() ? s : s.replace(", darling", "")))), k); }));
      $("ui").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { const res = accuse(run, b.dataset.m);
        if (res === "wrong") { sfx.wrong(); sfx.snuff(1); ctx.emote?.("think", { quiet: true }); return show(run, pick(["Not that method. Look at the evidence again.", "No. The evidence points elsewhere.", "Close, but the facts disagree."]), null); }
        if (res === "right") { sfx.reveal(); spark(); ctx.banter?.("mid"); } else { sfx.wrong(); sfx.darkness(); }
        finish(run); }));
      $("cf-leave").onclick = () => lobby(false);
    }
    function finish(run) {
      const c = caseOf(run.id), m = method(c.method), L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence);
      if (allLevel3(P())) grantDebunker(P()); // every Level 3 case solved: the Debunker's cloak (hosts/parlour-room.js)
      saveProgress(); showStats();
      ctx.trophy?.("casefiles", L.n, { won: run.won, perfect: perfect(run) }); // Trophy Case (trophies.js)
      draw(c, { candles: run.candles, solved: run.won }); cap(`🗂️ ${c.name}`);
      say(run.won ? (rook() ? `${m.name}! Exposed. Write it down, darling: we'll rehearse it in the Workshop.` : `${m.name}. Case closed.`) : `It was ${m.name.toLowerCase()}. The file stays open for now.`);
      const bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, run.won ? `score ${r.score}` : "not solved this time"];
      if (r.first) bits.push(`📒 new in your casebook (+5 💎)`); if (r.learned) bits.push(`🎩 method learned: ${esc(m.name)}`); if (perfect(run)) bits.push("✨ perfect");
      let board = "";
      if (run.daily) { const res = { score: r.score, won: run.won, detail: c.name }, fd = finishDaily(P(), "casefiles", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("cf-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: r.score } }); };
        (fd.first ? postDaily(state, "casefiles", res) : boardOf(state, "casefiles")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="cf-board" class="note">Loading the board…</div>`; }
      if (r.first) chime(1);
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}${cardHtml(c, esc)}
        <div class="choices"><button class="c main" type="button" id="cf-next">🗂️ Next Level ${L.n} case</button>${r.learned ? `<button class="c" type="button" id="cf-ws">🎩 Rehearse it in the Workshop</button>` : ""}<button class="c" type="button" id="cf-lobby">📁 The files</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("cf-next").onclick = () => begin(start(L, nextOf(P(), L))); if (r.learned) $("cf-ws").onclick = () => ctx.go?.("workshop", { trick: (TRICKS.find((t) => t.lv === 1 && t.needs[0] === r.learned) || {}).id }); $("cf-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }
    function shop(msg) {
      clearReading(); cap("🔍 The investigator's desk"); const look = lookOf(P()); draw(caseOf("fox"));
      say(typeof msg === "string" ? msg : rook() ? `Lamps, folders and lenses for your desk, ${state.name}. Paid in Essence, naturally.` : `Lamps, folders and lenses for your case desk, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="cf-lobby">📁 Back to the files</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const res = buyOrUse(P(), b.dataset.b);
        if (res === "poor") return shop("Not enough Essence yet. Close a few more cases first.");
        if (res) { saveProgress(); showStats(); res === "bought" ? coins() : glass(); shop(res === "bought" ? "A fine addition to the desk." : "Swapped in."); } }));
      $("cf-lobby").onclick = () => lobby(false);
    }
    lobby(true);
  },
};

/** A solved case's full file: the claim, the method, who exposed it, and the fact. */
export function cardHtml(c, esc) {
  const m = method(c.method);
  return `<div class="ft-card"><b>${c.emoji} ${esc(c.name)} · ${c.year} · ${esc(c.place)}</b>
    <p><b>Method:</b> ${esc(m.name)} (${esc(clsName(m.cls))}). ${esc(m.how)}</p>
    <p><b>Exposed by:</b> ${esc(c.by)}</p><p>${esc(c.fact)}</p></div>`;
}
/** Your casebook, by method class (reading area). */
export function casebookHtml(p, esc) {
  const r = cfOf(p);
  return `<div class="cf-book"><h3>📒 My casebook · ${r.solved.length} / ${CASES.length}</h3><p class="note">Cases are filed by how the trick worked. Every method you learn becomes a trick in the Workshop.</p>
    ${CLASSES.map(([k, label]) => { const cs = CASES.filter((c) => method(c.method).cls === k); if (!cs.length) return "";
      return `<div><h4>${esc(label)} (${cs.filter((c) => r.solved.includes(c.id)).length} / ${cs.length})</h4><div class="cf-cells">${cs.map((c) => { const on = r.solved.includes(c.id);
        return `<span class="cf-cell${on ? "" : " off"}" title="${on ? esc(c.name + " · " + method(c.method).name) : "not solved yet"}"><b>${on ? c.emoji : "❔"}</b>${on ? esc(c.name) : "?"}${on ? `<small>${c.year}</small>` : ""}</span>`; }).join("")}</div></div>`; }).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function casefilesCodex(p, esc) {
  const r = cfOf(p);
  return `<div class="cx"><div class="cx-h"><span>🗂️ Case Files</span><span class="note">${r.solved.length} / ${CASES.length} solved · ${r.methods.length} methods learned</span></div><div class="bar"><i style="width:${(r.solved.length / CASES.length) * 100}%"></i></div>
    ${r.methods.length ? `<div class="chips">${r.methods.map((id) => `<span>${esc(method(id)?.name || id)}</span>`).join("")}</div>` : ""}</div>`;
}
