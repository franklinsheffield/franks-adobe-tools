// The Workshop: a room of the Oracle Chamber, and step 2 of the Séance Parlour's core loop. Every method you uncover
// in the Case Files opens tricks here. Rehearse one: tap its steps in the right order, then name the tell, the slip
// an investigator would catch. 3 spotlights; each mistake dims one. A clean rehearsal puts the trick in your
// repertoire, ready to perform at a Booking. Locked tricks show which case would open them.
import { TRICKS, LEVELS, trickOf, hintFor } from "./data.js";
import { method } from "../casefiles/data.js";
import { room as wsOf, start, nextOf, tapStep, pickTell, scoreOf, perfect, settle, dailyOf, isOpen, missing, openAt, LIGHTS, learned } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { stageSvg } from "./scene.js";
import { CSS } from "./style.js";
import * as sfx from "../seance/sfx.js";
import { page, coins, glass } from "../flametest/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { host } from "../hosts/index.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("ws-style")) return; const s = document.createElement("style"); s.id = "ws-style"; s.textContent = CSS; document.head.append(s); };

export const workshop = {
  id: "workshop", label: "The Workshop", emoji: "🎩",
  blurb: "Rehearse the real tricks behind the ghost claims you exposed",
  shop: { kind: "workshop", label: "🎩 Workshop stage", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table workshop";
      tableEl.innerHTML = stageSvg(trickOf("w-coin"), { look: { ...DEFAULT_LOOK, [it.slot]: id } }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => wsOf(P());
    const draw = (t, o = {}) => { tableEl.className = "table workshop"; tableEl.innerHTML = stageSvg(t, { look: lookOf(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const rook = () => host().id === "parlour";

    function lobby(first) {
      clearReading(); cap("🎩 The Workshop"); draw(null);
      const r = R(), ds = dailyState(P(), "workshop"), dd = dailyOf(), nLearned = learned(P()).length;
      say(first && !r.plays
        ? (rook() ? `Every method you exposed is a trick you can do, ${state.name}. That's the whole secret of this House. Pick one and rehearse it.`
          : `This is the Workshop, ${state.name}. Each method uncovered in the Case Files becomes a trick to rehearse here: steps in order, then the tell to avoid.`)
        : !nLearned ? "The stage is bare until you've exposed something. Open a Case File first."
        : pick(rook() ? ["Places, darling. The audience never sees the rehearsal.", "Again, from the top. Slower hands, faster patter.", `Every great medium rehearsed, ${state.name}. They just never said so.`]
          : ["The stage is set.", "Back to the bench. Which trick today?", "Rehearsal time."]));
      const lvl = (L) => { const all = TRICKS.filter((t) => t.lv === L.n), open = openAt(P(), L).length, got = all.filter((t) => r.rep.includes(t.id)).length;
        return `<button class="c level${open ? "" : " done"}" type="button" data-l="${L.n}"><b>${"🎩".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${got} learned · ${open} / ${all.length} open · points ×${L.mult}</span></button>`; };
      ui(`<div class="cx-top"><b>🎩 Workshop</b> · ${r.rep.length} / ${TRICKS.length} tricks in your repertoire · ${nLearned} methods known</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${LIGHTS} spotlights per rehearsal. A wrong step or a wrong tell dims one. Tricks open as you learn their methods in the Case Files.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="ws-daily"><b>📅 Daily trick${ds.played ? " · done ✓" : ""}</b><span>The same trick for everyone today, lent if you haven't opened it · Level ${dd.L.n}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="ws-book">🎴 My repertoire</button><button class="c" type="button" id="ws-cf">🗂️ Case Files</button><button class="c" type="button" id="ws-shop">🎭 Stage dressing</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1], id = nextOf(P(), L);
        if (!id) { const t = TRICKS.find((x) => x.lv === L.n && missing(P(), x).length === Math.min(...TRICKS.filter((y) => y.lv === L.n).map((y) => missing(P(), y).length)));
          sfx.knock(1); return say(`Nothing open at Level ${L.n} yet. Try this: ${hintFor(missing(P(), t)[0])}. That opens "${t.name}".`); }
        begin(start(id)); }));
      $("ws-daily").onclick = () => { const d = dailyOf(); begin(start(d.id, { seed: d.seed, daily: d.day, lent: !isOpen(P(), trickOf(d.id)) })); };
      $("ws-book").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".ws-book"); page(); rb.innerHTML = on ? repertoireHtml(P(), esc) : ""; $("ws-book").textContent = on ? "✕ Close" : "🎴 My repertoire"; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("ws-cf").onclick = () => ctx.go?.("casefiles"); $("ws-shop").onclick = shop; $("back").onclick = greet;
    }

    const begin = (run) => { clearReading(); sfx.summon(); show(run); };
    function show(run, line, slipAt = null) {
      const t = trickOf(run.id), L = run.L;
      cap(`🎩 Level ${L.n} · ${t.name}${run.daily ? " · 📅 daily" : ""}${run.lent ? " · lent" : ""}`); draw(t, { lights: run.lights });
      const needs = t.needs.map((m) => method(m).name).join(" + ");
      const top = `<div class="cx-top">Level ${L.n} · spotlights ${"💡".repeat(run.lights)}${"·".repeat(LIGHTS - run.lights)} · worth ${Math.round((run.lights + 1) * L.mult)}</div>`;
      const order = run.done.length ? `<div class="ws-order">${run.done.map((i, n) => `<div>${n + 1}. ${esc(t.steps[i])}</div>`).join("")}</div>` : "";
      if (run.phase === "steps") {
        say(line || (run.done.length ? "Next step?" : rook() ? `${t.name}. The method: ${needs.toLowerCase()}. Show me the steps, in order.` : `${t.name}, using ${needs.toLowerCase()}. Put the steps in order.`));
        ui(`${top}${order}<div class="group">Step ${run.done.length + 1} of ${t.steps.length}: tap what comes next</div>
          <div class="ws-steps">${run.order.filter((i) => !run.done.includes(i)).map((i) => `<button class="c${slipAt === i ? " slip" : ""}" type="button" data-s="${i}">${esc(t.steps[i])}</button>`).join("")}</div>
          <div class="choices"><button class="c small" type="button" id="ws-leave">Leave the stage</button></div>`);
        $("ui").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => { const i = +b.dataset.s, res = tapStep(run, i);
          if (res === "next") { page(); return show(run); }
          if (res === "slip") { sfx.wrong(); ctx.emote?.("think", { quiet: true }); return show(run, pick(["Not yet. What has to happen first?", "Out of order. The audience would see it.", "Slow down. Think it through from the start."]), i); }
          if (res === "steps-done") { sfx.reveal(); ctx.banter?.("mid"); return show(run, rook() ? "Lovely. Now the hard part: what would a sharp investigator catch?" : "Steps in order. Now: what would an investigator catch?"); }
          if (res === "flop") { sfx.darkness(); finish(run); } }));
      } else {
        say(line || "What gives this trick away?");
        ui(`${top}${order}<div class="group">The tell: what would an investigator catch?</div>
          <div class="choices col">${run.tells.map((x, n) => `<button class="c" type="button" data-t="${n}" ${run.wrongTells.includes(x) ? "disabled" : ""}>${run.wrongTells.includes(x) ? "✗ " : ""}${esc(x)}</button>`).join("")}</div>
          <div class="choices"><button class="c small" type="button" id="ws-leave">Leave the stage</button></div>`);
        $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { const res = pickTell(run, run.tells[+b.dataset.t]);
          if (res === "wrong") { sfx.wrong(); return show(run, pick(["That's another trick's weak spot. Look again.", "No. Think about this method.", "Not that one."])); }
          if (res === "right") { sfx.reveal(); spark(); } else sfx.darkness();
          finish(run); }));
      }
      $("ws-leave").onclick = () => lobby(false);
    }
    function finish(run) {
      const t = trickOf(run.id), L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("workshop", L.n, { won: run.won, perfect: perfect(run) }); // Trophy Case (trophies.js)
      draw(t, { lights: run.lights, state: run.won ? "bow" : "flop" }); cap(`🎩 ${t.name}`);
      if (run.won) chime(perfect(run) ? 2 : 1);
      say(run.won ? (rook() ? pick([`Bravo! ${t.name}, and not a seam showing.`, "Curtain call, darling. Take the bow.", "That would have fooled a committee."]) : `${t.name}: rehearsed.`)
        : (rook() ? "The curtain came down early. Every act flops in rehearsal. That's what rehearsals are for." : "The rehearsal flopped. Try it again."));
      const bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, run.won ? `score ${r.score}` : "not this time"];
      if (r.learned) bits.push("🎴 new in your repertoire (+4 💎)"); if (run.won && run.lent) bits.push("lent for today: open it in the Case Files to keep it"); if (perfect(run)) bits.push("✨ perfect");
      let board = "";
      if (run.daily) { const res = { score: r.score, won: run.won, detail: t.name }, fd = finishDaily(P(), "workshop", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("ws-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: r.score } }); };
        (fd.first ? postDaily(state, "workshop", res) : boardOf(state, "workshop")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="ws-board" class="note">Loading the board…</div>`; }
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}${trickCardHtml(t, esc)}
        <div class="choices"><button class="c main" type="button" id="ws-next">🎩 Next Level ${L.n} trick</button><button class="c" type="button" id="ws-again">↺ Again</button><button class="c" type="button" id="ws-bk">🎟️ Bookings</button><button class="c" type="button" id="ws-lobby">🎭 The Workshop</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ws-next").onclick = () => { const id = nextOf(P(), L); id ? begin(start(id)) : lobby(false); };
      $("ws-again").onclick = () => begin(start(run.id, { lent: run.lent })); $("ws-bk").onclick = () => ctx.go?.("bookings");
      $("ws-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }
    function shop(msg) {
      clearReading(); cap("🎭 Stage dressing"); const look = lookOf(P()); draw(trickOf("w-coin"));
      say(typeof msg === "string" ? msg : rook() ? `Curtains, benches and lights, ${state.name}. Paid in Essence, naturally.` : `Curtains, benches and lights for the Workshop stage, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="ws-lobby">🎩 Back to the Workshop</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const res = buyOrUse(P(), b.dataset.b);
        if (res === "poor") return shop("Not enough Essence yet. Rehearse a few more tricks first.");
        if (res) { saveProgress(); showStats(); res === "bought" ? coins() : glass(); shop(res === "bought" ? "A fine addition to the stage." : "Swapped in."); } }));
      $("ws-lobby").onclick = () => lobby(false);
    }
    // Arriving from the Case Files with a freshly learned method: go straight to its trick.
    const want = ctx.arg && ctx.arg.trick && trickOf(ctx.arg.trick);
    if (want && isOpen(P(), want)) { lobby(true); begin(start(want.id)); } else lobby(true);
  },
};

/** A trick's card: its methods, the steps and the documented fact. */
export function trickCardHtml(t, esc) {
  return `<div class="ft-card"><b>${t.emoji} ${esc(t.name)}</b>
    <p><b>Method:</b> ${t.needs.map((m) => esc(method(m).name)).join(" + ")}</p>
    <p>${t.steps.map((s, i) => `${i + 1}. ${esc(s)}`).join("<br>")}</p>
    <p><b>The tell:</b> ${esc(t.tell)}</p><p>${esc(t.fact)}</p></div>`;
}
/** Your repertoire, by level, with locked tricks hinting where to look (reading area). */
export function repertoireHtml(p, esc) {
  const r = wsOf(p);
  return `<div class="ws-book"><h3>🎴 My repertoire · ${r.rep.length} / ${TRICKS.length}</h3><p class="note">Dashed tricks are open to rehearse. Faded ones need a method from the Case Files.</p>
    ${LEVELS.map((L) => { const ts = TRICKS.filter((t) => t.lv === L.n);
      return `<div><h4>Level ${L.n} · ${esc(L.name)} (${ts.filter((t) => r.rep.includes(t.id)).length} / ${ts.length})</h4><div class="ws-cells">${ts.map((t) => { const on = r.rep.includes(t.id), open = isOpen(p, t);
        return `<span class="ws-cell${on ? "" : open ? " open" : " off"}" title="${on || open ? esc(t.name) : esc(hintFor(missing(p, t)[0]))}"><b>${on || open ? t.emoji : "🔒"}</b>${on || open ? esc(t.name) : esc(hintFor(missing(p, t)[0]).replace("Solve a case like ", "Solve: ").replace(" in the Case Files", ""))}</span>`; }).join("")}</div></div>`; }).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function workshopCodex(p, esc) {
  const r = wsOf(p);
  return `<div class="cx"><div class="cx-h"><span>🎩 The Workshop</span><span class="note">${r.rep.length} / ${TRICKS.length} tricks learned</span></div><div class="bar"><i style="width:${(r.rep.length / TRICKS.length) * 100}%"></i></div>
    ${r.rep.length ? `<div class="chips">${r.rep.map((id) => `<span>${esc(trickOf(id)?.name || id)}</span>`).join("")}</div>` : ""}</div>`;
}
