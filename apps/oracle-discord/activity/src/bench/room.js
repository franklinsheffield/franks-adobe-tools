// The Discovery Bench: a room of the Oracle Chamber (step 2 of the Alchemist's House core loop). Combine 1-3 things
// from your shelf with an operation and discover real products. Minerals you name in the Mineral Cabinet join the
// shelf as ingredients, so the Cabinet opens new branches; every product you make joins it too.
import { OPS, RECIPES, PRODUCTS } from "./data.js";
import { room as dbOf, item, shelf, attempt, milestoneAt, madeCount, within, dailyOf, hintFor, NEEDED_MINERALS, MAKE_PAY, MILESTONES } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { benchSvg } from "./scene.js";
import { CSS } from "./style.js";
import { foundMinerals } from "../minerals/logic.js";
import * as ft from "../flametest/sfx.js";
import * as al from "../alchemy/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { host } from "../hosts/index.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("db-style")) return; const s = document.createElement("style"); s.id = "db-style"; s.textContent = CSS; document.head.append(s); };
const NONE = {
  op: "Those belong together, but not like that. Try another operation.",
  more: "You're on to something. It needs one more ingredient.",
  nothing: "Nothing useful happens. (Plenty of real experiments end like this.)",
  empty: "Pick something from the shelf first.",
};

export const bench = {
  id: "bench", label: "Discovery Bench", emoji: "🧫",
  blurb: "Combine real substances and discover what they make",
  shop: { kind: "bench", label: "🧫 Discovery Bench", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table bench";
      tableEl.innerHTML = benchSvg({ items: [item("malachite") || item("charcoal")], op: it.slot === "mortar" ? "grind" : "heat", look: { ...DEFAULT_LOOK, [it.slot]: id } }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => dbOf(P());
    const vell = () => host().id === "alchemist";
    const draw = (o = {}) => { tableEl.className = "table bench"; tableEl.innerHTML = benchSvg({ look: lookOf(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    let sel = [], op = null, daily = null;

    function lobby(first) {
      clearReading(); cap("🧫 The Discovery Bench"); sel = []; op = null; daily = null; draw({});
      const r = R(), ds = dailyState(P(), "bench"), dd = dailyOf(), minerals = foundMinerals(P()).length;
      say(first && !r.plays
        ? (vell() ? `My favourite bench, ${state.name}! Pick up to three things, choose what to do with them, and see what real chemistry gives you. Every rock you name in the Mineral Cabinet lands on this shelf.`
          : `The Discovery Bench, ${state.name}. Combine things from your shelf with an operation and see what real chemistry makes. Minerals you name in the Mineral Cabinet become ingredients here.`)
        : pick(vell() ? ["Back to the bench! What shall we cook up?", "Goggles down. Let's discover something.", "Ooh, I've been saving this crucible for you."] : ["The bench is ready.", "Crucible's clean. What will you try?", "Another experiment?"]));
      ui(`<div class="cx-top"><b>🧫 Discovery Bench</b> · ${madeCount(P())} / ${PRODUCTS.length} discovered · ${minerals} mineral${minerals === 1 ? "" : "s"} on your shelf</div>
        <div class="choices col"><button class="c main level" type="button" id="db-free"><b>🧪 Experiment</b><span>Mix anything on your shelf</span></button>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="db-daily"><b>📅 Daily discovery${ds.played ? " · done ✓" : ""}</b><span>Today's target: ${esc(dd.recipe.name)}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button></div>
        <div class="choices"><button class="c" type="button" id="db-book">📓 Discoveries</button><button class="c" type="button" id="db-shop">🫕 Bench kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("db-free").onclick = () => { al.whoosh(); work(); };
      $("db-daily").onclick = () => { const d = dailyOf(); daily = { ...d, fails: 0 }; al.whoosh(); work(`Today's target: ${d.recipe.name}. ${d.recipe.in.length} ingredient${d.recipe.in.length === 1 ? "" : "s"}, one operation.`); };
      $("db-book").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".db-list"); al.page(); rb.innerHTML = on ? notebookHtml(P(), esc) : ""; $("db-book").textContent = on ? "✕ Close" : "📓 Discoveries"; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("db-shop").onclick = shop; $("back").onclick = greet;
    }

    const jarBtn = (id) => { const it = item(id); return `<button class="c${sel.includes(id) ? " on" : ""}" type="button" data-i="${id}" aria-pressed="${sel.includes(id)}" title="${esc(it.f || "")}"><i style="background:${it.c}"></i>${esc(it.name)}</button>`; };
    function work(line, fx = {}) {
      const have = shelf(P()), groups = [["🧴 Reagents", have.filter((id) => ["base", "raw"].includes(item(id)?.kind))], ["🪨 Minerals", have.filter((id) => item(id)?.kind === "mineral")], ["✨ Your discoveries", have.filter((id) => item(id)?.kind === "product")]];
      const locked = NEEDED_MINERALS.filter((id) => !have.includes(id));
      cap(daily ? `📅 Daily: make ${daily.recipe.name}` : "🧫 Experiment"); draw({ items: sel.map(item), op, ...fx });
      if (line !== " ") say(line || (sel.length ? "Now choose what to do with it." : "Pick up to three things from the shelf."));
      ui(`<div class="cx-top">${daily ? `📅 Target: <b>${esc(daily.recipe.name)}</b> · ` : ""}${madeCount(P())} / ${PRODUCTS.length} discovered</div>
        ${groups.map(([h, ids]) => ids.length ? `<div class="group">${h}</div><div class="db-shelf">${ids.map(jarBtn).join("")}</div>` : "").join("")}
        ${locked.length ? `<div class="group">🔒 Not on your shelf yet</div><div class="db-shelf">${locked.slice(0, 6).map((id) => `<button class="c lock" type="button" disabled title="${esc(hintFor(id))}">❔ ${esc(hintFor(id).split(";")[0])}</button>`).join("")}${locked.length > 6 ? `<span class="note">+${locked.length - 6} more</span>` : ""}</div><div class="note">Name minerals in the 🪨 Mineral Cabinet to put them on this shelf.</div>` : ""}
        <div class="group">Operation</div><div class="db-shelf">${Object.entries(OPS).map(([k, o]) => `<button class="c${op === k ? " on" : ""}" type="button" data-op="${k}" title="${esc(o.what)}">${o.emoji} ${esc(o.name)}</button>`).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="db-go" ${sel.length && op ? "" : "disabled"}>⚗️ Try it</button><button class="c" type="button" id="db-idea">💡 An idea</button><button class="c small" type="button" id="db-clear">Clear</button><button class="c small" type="button" id="db-leave">Leave the bench</button></div>`);
      $("ui").querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => { const id = b.dataset.i; sel = sel.includes(id) ? sel.filter((x) => x !== id) : sel.length < 3 ? [...sel, id] : sel; al.clink(sel.length); work(" "); }));
      $("ui").querySelectorAll("[data-op]").forEach((b) => (b.onclick = () => { op = b.dataset.op; (op === "electro" ? al.zap : op === "mix" || op === "boil" ? al.bubble : op === "grind" ? ft.scratch : al.whoosh)(); work(`${OPS[op].name}: ${OPS[op].what.toLowerCase()}.`); }));
      $("db-go").onclick = go; $("db-clear").onclick = () => { sel = []; op = null; work(); };
      $("db-idea").onclick = () => { const w = daily ? [daily.recipe] : within(P()); const r = w.length ? pick(w) : null; al.page();
        work(r ? `An idea: try something with ${r.in.map((i) => item(i)?.name.toLowerCase() || "a mineral you haven't named").join(" and ")}.` : "Everything on your shelf is used up. Name more minerals in the Cabinet!"); };
      $("db-leave").onclick = () => lobby(false);
    }
    function go() {
      const res = attempt(P(), sel, op); saveProgress();
      if (res.none) { al.fizzle(); if (daily) daily.fails++; ctx.emote?.("think", { quiet: true }); return work(NONE[res.why]); }
      const rec = res.recipe, hz = rec.hz; ctx.banter?.("mid");
      if (hz) (hz.kind === "boom" ? al.boom : hz.kind === "gas" ? al.gas : ft.sizzle)(); else al.transmute();
      draw({ items: sel.map(item), op, result: rec.name, hz });
      let bits = [];
      if (res.fresh) { award(MAKE_PAY, MAKE_PAY); bits.push(`<b>+${MAKE_PAY} ✦ +${MAKE_PAY} 💎</b> · new discovery ${madeCount(P())} / ${PRODUCTS.length}`); spark(); chime(1);
        const lv = milestoneAt(madeCount(P())); if (lv) { ctx.trophy?.("bench", lv, { won: true, perfect: true }); /* Trophy Case: levels 1-3 = 10, 30, every discovery */ bits.push(`🏆 ${MILESTONES[lv - 1]} discoveries!`); } }
      else bits.push("Already in your notebook.");
      let board = "";
      if (daily && rec.id === daily.target) {
        const score = Math.max(1, 10 - daily.fails), fd = finishDaily(P(), "bench", { score, won: true, detail: rec.name }); saveProgress();
        if (fd.first) { award(score, score); bits.push(`📅 Daily done: +${score} ✦ 💎 · streak ${fd.streak}`); postDaily(state, "bench", { score, won: true, detail: rec.name }).then(fill); } else boardOf(state, "bench").then(fill);
        board = `<div class="group">📅 Today's board</div><div id="db-board" class="note">Loading the board…</div>`; daily = null;
        function fill(b) { const el = $("db-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score } }); }
      }
      saveProgress(); showStats(); cap(`✨ ${rec.name}`);
      say(res.fresh ? (vell() ? pick([`${rec.name}! Write that down!`, `Look at that: ${rec.name.toLowerCase()}!`, `Real chemistry, ${state.name}. ${rec.name}.`]) : `You made ${rec.name.toLowerCase()}.`) : `${rec.name} again. Reliable.`);
      ui(`<div class="reward"><div>${bits.join(" · ")}</div></div>${board}<div class="ft-card"><b>✨ ${esc(rec.name)} (${esc(rec.f)})</b><code class="db-eq">${esc(rec.eq)}</code><p>${esc(rec.note)}</p>${hz ? `<p class="note">⚠️ Real hazard: ${esc(hz.what)} Done here safely, on paper.</p>` : ""}</div>
        <div class="choices"><button class="c main" type="button" id="db-more">🧪 Keep experimenting</button><button class="c" type="button" id="db-lobby">🧫 The bench</button></div>`);
      sel = []; op = null;
      $("db-more").onclick = () => work(); $("db-lobby").onclick = () => lobby(false);
    }
    function shop(msg) {
      clearReading(); cap("🫕 Bench kit"); const look = lookOf(P()); draw({ items: [item("charcoal")], op: "smelt" });
      say(typeof msg === "string" ? msg : `Crucibles and mortars for your bench, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="db-lobby">🧫 Back to the bench</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. A few discoveries will fix that.");
        if (r) { saveProgress(); showStats(); r === "bought" ? ft.coins() : al.clink(1); shop(r === "bought" ? "Lovely kit. It's on your bench." : "Swapped in."); } }));
      $("db-lobby").onclick = () => lobby(false);
    }
    lobby(true);
  },
};

/** Your discoveries notebook (reading area). */
export function notebookHtml(p, esc) {
  const made = dbOf(p).made, seen = new Set();
  return `<div class="db-list"><h3>📓 Discoveries · ${made.length} / ${PRODUCTS.length}</h3><p class="note">Every product is a real reaction or craft. Equations show the main products.</p>
    ${RECIPES.filter((r) => made.includes(r.id) && !seen.has(r.id) && seen.add(r.id)).map((r) => `<div class="ft-card"><b>✨ ${esc(r.name)} (${esc(r.f)})</b><code class="db-eq">${esc(r.eq)}</code><p>${esc(r.note)}</p></div>`).join("") || `<p class="bk-empty">Nothing yet. Try heating a mineral.</p>`}</div>`;
}
/** This room's part of the 📜 Codex. */
export function benchCodex(p, esc) {
  const made = dbOf(p).made;
  return `<div class="cx"><div class="cx-h"><span>🧫 Discovery Bench</span><span class="note">${made.length} / ${PRODUCTS.length} discovered</span></div><div class="bar"><i style="width:${(made.length / PRODUCTS.length) * 100}%"></i></div></div>`;
}
