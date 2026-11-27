// Lead into Gold: a room of the Oracle Chamber (Alchemist's House game). The alchemists' dream, done with real physics.
// Level 1 alpha or beta: what a nucleus becomes. Level 2 walk a natural decay chain (uranium or thorium) to stable lead.
// Level 3 make gold-197 with a beam or a reactor: Seaborg's bismuth (1980), CERN's lead (2025), mercury (1941).
// Co-op chain: everyone in the call takes turns stepping one chain together.
import { CHAINS, ROUTES, MOVES, LEVELS, HISTORY, TRIES, EL, label, longName } from "./data.js";
import { room as lgOf, quiz, decay, hintFor, fewest, apply, isGold, goldPoints, routesFor, chainOf, settle, dailyOf, turnOf } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { CSS, benchSvg, alphaFx, betaFx, beamFx } from "./scene.js";
import * as sfx from "./sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { joinTable } from "../net.js";
import { host } from "../hosts/index.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("lg-style")) return; const s = document.createElement("style"); s.id = "lg-style"; s.textContent = CSS; document.head.append(s); };

export const leadgold = {
  id: "leadgold", label: "Lead into Gold", emoji: "⚛️",
  blurb: "Real transmutation: decay chains down to lead, then knock lead and bismuth into gold",
  shop: { kind: "leadgold", label: "⚛️ Lead into Gold", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table leadgold"; tableEl.innerHTML = benchSvg({ z: 79, a: 197, gold: true, look: { ...DEFAULT_LOOK, [it.slot]: id } }); cap && cap(`⚛️ ${it.name}`); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => lgOf(P()), vell = () => host().id === "alchemist", alive = () => document.body.dataset.room === "leadgold";
    const bench = (o = {}) => { tableEl.className = "table leadgold"; tableEl.innerHTML = benchSvg({ look: lookOf(P()), ...o }); };
    const fx = (h) => { const g = document.getElementById("lg-fx"); if (g) g.insertAdjacentHTML("beforeend", h); };
    const shake = () => { const s = document.getElementById("lg-svg"); if (s && s.animate) s.animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], { duration: 300 }); };
    const reading = (h) => { const rb = $("reading-body"); if (rb) rb.innerHTML = h; };
    let run = null, table = null, co = null;
    const dots = () => run ? `<span class="lg-dots">${run.marks.map((m) => (m ? "★" : "✗")).join(" ")}${" ·".repeat(Math.max(0, run.total - run.marks.length))}</span>` : "";

    function lobby(first) {
      clearReading(); cap("⚛️ Lead into Gold"); run = null; bench({ z: 82, a: 208, path: [{ z: 83, a: 209 }, { z: 82, a: 208 }] });
      if (first) sfx.geiger(10, 1.2);
      const r = R(), ds = dailyState(P(), "leadgold");
      say(first && !r.plays ? (vell() ? `Lead into gold, ${state.name}! The old alchemists never managed it. Physicists did, in the 20th century. We'll do it their way: protons and neutrons.` : `Lead into gold, ${state.name}. Not with potions: with real nuclear physics.`)
        : pick(vell() ? ["The Geiger counter's ticking. Let's transmute something.", "Every element on that chart is a number of protons. Change it, change the element.", pick(HISTORY)] : ["The transmutation bench is warm.", pick(HISTORY)]));
      ui(`<div class="cx-top"><b>⚛️ Lead into Gold</b>${r.gold ? ` · ${r.gold} gold atoms made` : ""}${r.wins ? ` · ${r.wins} runs won` : ""}</div>
        <div class="levels">${LEVELS.map((L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"⚛️".repeat(L.n)} ${L.n} · ${esc(L.name)}</b><span>${esc(L.sub)}${r.best[L.n] ? ` · best ${r.best[L.n]}` : ""}</span></button>`).join("")}
        <button class="c level" type="button" id="lg-daily"><b>📅 Daily decays${ds.played ? " ✓" : ""}</b><span>Five decays, the same for everyone today${ds.streak ? ` · 🔥 ${ds.streak}` : ""}</span></button></div>
        <div class="choices"><button class="c" type="button" id="lg-co">🤝 Co-op chain</button><button class="c" type="button" id="lg-shop">💡 Kit</button><button class="c" type="button" id="lg-guide">📖 Handbook</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const n = +b.dataset.l; n === 1 ? quizRun(false) : n === 2 ? chainPick() : goldRun(); }));
      $("lg-daily").onclick = () => quizRun(true); $("lg-co").onclick = () => coRoom(); $("lg-shop").onclick = () => shop(); $("lg-guide").onclick = () => { reading(guideHtml(esc)); };
      $("back").onclick = () => { if (table) { table.leave(); table = null; } greet(); };
    }

    // ---- Level 1: alpha or beta ----
    function quizRun(daily) {
      const d = daily ? dailyOf() : null, rounds = d ? d.rounds : quiz((Math.random() * 2 ** 31) >>> 0);
      run = { level: 1, daily, rounds, i: 0, tries: 0, score: 0, max: rounds.length * 10, marks: [], total: rounds.length }; ask();
    }
    function ask() {
      const q = run.rounds[run.i]; clearReading(); cap(`${run.daily ? "📅 Daily decays" : "⚛️ 1 · Alpha or beta"} · ${run.i + 1} of ${run.total}`);
      bench({ z: q.n.z, a: q.n.a, path: [{ z: q.n.z, a: q.n.a }] }); sfx.geiger(4, 0.6); say(q.q);
      ui(`<div class="group">Decay ${run.i + 1} ${dots()}</div><div class="choices">${q.choices.map((c) => `<button class="c" type="button" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="choices"><button class="c small" type="button" id="lg-lobby">⚛️ Leave</button></div>`);
      $("lg-lobby").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => {
        if (b.dataset.c === q.a) {
          const to = decay(q.n.z, q.n.a, q.n.d), pts = run.tries ? 5 : 10; run.score += pts; run.marks.push(true);
          q.n.d === "a" ? sfx.alpha() : sfx.beta(); fx(q.n.d === "a" ? alphaFx() : betaFx()); sfx.right();
          setTimeout(() => alive() && run && bench({ z: to.z, a: to.a, path: [{ z: q.n.z, a: q.n.a }, to] }), 700);
          say(`Yes. +${pts}`); reading(`<div class="lg-card">${esc(q.why)}</div>`); return nextQ();
        }
        run.tries++; sfx.wrong(); shake(); b.disabled = true;
        if (run.tries >= TRIES) { run.marks.push(false); say(`It was ${q.a}.`); reading(`<div class="lg-card">${esc(q.why)}</div>`); return nextQ(); }
        say(q.n.d === "a" ? "Not that one. Alpha takes away 2 protons AND 2 neutrons: mass drops by 4." : "Not that one. Beta keeps the mass the same and adds one proton.");
      }));
    }
    function nextQ() {
      $("ui").querySelectorAll("[data-c]").forEach((x) => (x.disabled = true)); run.i++; run.tries = 0;
      setTimeout(() => { if (!alive() || !run) return; if (run.i < run.total) ask(); else run.daily ? dailyDone() : finish(); }, 2400);
    }

    // ---- Level 2: walk a decay chain ----
    function chainPick() {
      clearReading(); cap("⚛️ 2 · Walk a decay chain"); bench({ z: 92, a: 238, path: [{ z: 92, a: 238 }] });
      say(vell() ? "Pick a series. Every one of them ends in lead. Nature's been turning uranium into lead for billions of years." : "Pick a natural decay series. Each one ends in stable lead.");
      ui(`<div class="levels">${CHAINS.map((c) => `<button class="c level" type="button" data-ch="${c.id}"><b>${esc(c.name)}</b><span>${esc(c.start)} → ${esc(c.end)} · ${c.steps.length - 1} steps</span></button>`).join("")}</div><div class="choices"><button class="c small" type="button" id="lg-lobby">⚛️ Leave</button></div>`);
      $("lg-lobby").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-ch]").forEach((b) => (b.onclick = () => { const c = chainOf(b.dataset.ch); run = { level: 2, chain: c, i: 0, tries: 0, score: 0, max: c.steps.length - 1, marks: [], total: c.steps.length - 1, path: [{ z: c.steps[0][0], a: c.steps[0][1] }] }; step(); }));
    }
    function step(line) {
      const c = run.chain, [z, a, d] = c.steps[run.i]; cap(`⚛️ ${c.name} · step ${run.i + 1} of ${run.total}`);
      bench({ z, a, path: run.path }); say(line || `${longName(z, a)}. Alpha or beta?`);
      ui(`<div class="group">${esc(label(z, a))} ${dots()}</div><div class="choices"><button class="c" type="button" data-d="a">α Alpha</button><button class="c" type="button" data-d="b">β Beta</button><button class="c small" type="button" id="lg-hint">💡 Why?</button></div><div class="choices"><button class="c small" type="button" id="lg-lobby">⚛️ Leave</button></div>`);
      $("lg-lobby").onclick = () => lobby(false); $("lg-hint").onclick = () => { run.tries = Math.max(run.tries, 1); say(hintFor(z, a, d)); };
      $("ui").querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => {
        if (b.dataset.d !== d) { run.tries++; sfx.wrong(); shake(); b.disabled = true; return say(hintFor(z, a, d)); }
        const ok = run.tries === 0, to = decay(z, a, d); run.marks.push(ok); if (ok) run.score++; run.tries = 0; run.path.push(to); run.i++;
        d === "a" ? sfx.alpha() : sfx.beta(); fx(d === "a" ? alphaFx() : betaFx()); sfx.geiger(3, 0.4);
        const h = c.steps[run.i - 1][3]; $("ui").querySelectorAll("[data-d]").forEach((x) => (x.disabled = true));
        setTimeout(() => { if (!alive() || !run) return;
          if (!c.steps[run.i][2]) { bench({ z: to.z, a: to.a, path: run.path, gold: false }); sfx.right(); reading(`<div class="lg-card">${esc(c.note)}</div>`); return finish(`${label(to.z, to.a)}: stable lead. The chain is done.`); }
          step(`${label(z, a)} → ${label(to.z, to.a)} (half-life ${h}). ${pick(["Next?", "And now?", "Keep going."])}`); }, 900);
      }));
    }

    // ---- Level 3: make gold ----
    function goldRun() { const routes = routesFor((Math.random() * 2 ** 31) >>> 0); run = { level: 3, routes, i: 0, score: 0, max: routes.length * 10, marks: [], total: routes.length }; route(); }
    function route() {
      const rt = run.routes[run.i]; run.st = { z: rt.z, a: rt.a }; run.used = 0; run.best = fewest(rt.z, rt.a); run.path = [{ ...run.st }]; run.hist = [];
      say(`${rt.who}: ${longName(rt.z, rt.a)} into gold-197. 79 protons, 118 neutrons.`); beamUi();
    }
    function beamUi(line) {
      const rt = run.routes[run.i], st = run.st; cap(`⚛️ 3 · ${rt.who} · ${run.i + 1} of ${run.total}`);
      bench({ z: st.z, a: st.a, path: run.path, gold: isGold(st) }); if (line) say(line);
      const need = `Need ${st.z - 79 >= 0 ? `${st.z - 79} fewer protons` : `${79 - st.z} more protons`}, ${st.a - st.z - 118 >= 0 ? `${st.a - st.z - 118} fewer neutrons` : `${118 - (st.a - st.z)} more neutrons`}`;
      ui(`<div class="group">${esc(label(st.z, st.a))} · ${run.used} pulses ${dots()}</div><div class="note">${esc(need)}</div>
        <div class="lg-ctl">${MOVES.map((m) => `<button class="c small" type="button" data-m="${m.id}">${m.e} ${esc(m.label)}</button>`).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="lg-undo" ${run.hist.length ? "" : "disabled"}>↶ Undo</button><button class="c small" type="button" id="lg-lobby">⚛️ Leave</button></div>`);
      $("lg-lobby").onclick = () => lobby(false);
      $("lg-undo").onclick = () => { run.st = run.hist.pop(); run.path.pop(); run.used++; beamUi("Undone. That pulse still counts."); };
      $("ui").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => {
        run.hist.push(run.st); run.st = apply(run.st, b.dataset.m); run.used++; run.path.push({ ...run.st }); sfx.beam(); fx(beamFx());
        if (!EL[run.st.z] || run.st.z < 78) { run.st = run.hist.pop(); run.path.pop(); return beamUi("Too far: that's past platinum. Undo, or try another move."); }
        if (isGold(run.st)) return gotGold();
        if (run.used > run.best + 8) return outOfBeam();
        beamUi(" ");
      }));
    }
    function gotGold() {
      const rt = run.routes[run.i], pts = goldPoints(run.used, run.best); run.score += pts; run.marks.push(true); R().gold++; saveProgress();
      bench({ z: 79, a: 197, path: run.path, gold: true }); sfx.gold(); chime(1);
      say(`Gold-197! ${run.used} pulses${run.used <= run.best ? ", the fewest possible" : `; it can be done in ${run.best}`}. +${pts}`); reading(`<div class="lg-card">${esc(rt.note)}</div>`);
      nextRoute();
    }
    function outOfBeam() { const rt = run.routes[run.i]; run.marks.push(false); sfx.wrong(); say(`Beam time's up. It takes ${run.best} moves.`); reading(`<div class="lg-card">${esc(rt.note)}</div>`); nextRoute(); }
    function nextRoute() {
      ui(`<div class="choices"><button class="c main" type="button" id="lg-next">${run.i + 1 < run.total ? "⚛️ Next target" : "🏁 Finish"}</button></div>`);
      $("lg-next").onclick = () => { run.i++; run.i < run.total ? route() : finish(); };
    }

    function finish(line) {
      const L = run.level, st = settle(P(), L, run.score, run.max), pay = Math.round(run.score * (L === 2 ? 3 : L === 3 ? 1.5 : 1));
      award(pay, pay); ctx.trophy?.("leadgold", L, { won: st.won, perfect: st.perfect }); ctx.banter?.(st.won ? "win" : "lose"); saveProgress(); showStats();
      if (st.won) { sfx.gold(); chime(2); }
      cap(`⚛️ Level ${L} · ${run.score} / ${run.max}`);
      say(`${line ? line + " " : ""}${st.perfect ? (vell() ? "Flawless! The alchemists would weep with envy." : "Flawless.") : st.won ? (vell() ? "Well transmuted, {name}.".replace("{name}", state.name) : "Well done.") : "The nuclei won this time. Try again."}`);
      ui(`<div class="reward"><div><b>+${pay} ✦ · +${pay} 💎</b> · ${run.score} / ${run.max} ${dots()}${st.best ? " · new best!" : ""}</div></div>
        <div class="choices"><button class="c main" type="button" id="lg-again">⚛️ Again</button><button class="c" type="button" id="lg-lobby">⚗️ The bench</button></div>`);
      $("lg-again").onclick = () => (L === 1 ? quizRun(false) : L === 2 ? chainPick() : goldRun()); $("lg-lobby").onclick = () => lobby(false); run = null;
    }
    function dailyDone() {
      const score = run.score, detail = `${run.marks.filter(Boolean).length}/${run.total}`, fd = finishDaily(P(), "leadgold", { score, won: score > 0, detail }); saveProgress();
      if (fd.first) { award(score, score); postDaily(state, "leadgold", { score, won: score > 0, detail }).then(fill); } else boardOf(state, "leadgold").then(fill);
      function fill(bd) { const el = $("lg-board"); if (el) el.innerHTML = boardHtml(bd, esc, { unit: "pts", local: { score } }); }
      showStats(); say(`${score} points today.`);
      ui(`<div class="reward"><div>${fd.first ? `<b>📅 Daily decays: +${score} ✦ 💎</b> · streak ${fd.streak}` : "Already counted today."} ${dots()}</div></div><div class="group">📅 Today's board</div><div id="lg-board" class="note">Loading the board…</div>
        <div class="choices"><button class="c" type="button" id="lg-lobby">⚗️ The bench</button></div>`);
      $("lg-lobby").onclick = () => lobby(false); run = null;
    }

    // ---- Co-op chain: one chain, everyone in the call takes turns ----
    async function coRoom() {
      if (!table) {
        say("Calling the lab together…"); ui(`<div class="note">Joining the call's table…</div>`);
        try { table = await joinTable("leadgold", state); wireCo(); }
        catch (e) { say(e.message || "Co-op needs a Discord voice call."); ui(`<div class="choices"><button class="c" type="button" id="lg-lobby">⚗️ The bench</button></div>`); $("lg-lobby").onclick = () => lobby(false); return; }
      }
      coDraw();
    }
    const order = () => table.members.map((m) => m.id);
    function coDraw(line) {
      if (!table) return lobby(false);
      const top = `<div class="cx-top">🤝 Co-op chain · ${table.members.length} in the call${table.host ? ` · host ${esc(table.nameOf(table.host))}` : ""}</div>`;
      if (!co || co.done) {
        bench({ z: 92, a: 238, path: [] }); cap("🤝 Co-op chain");
        if (co && co.done) say(line || `Stable lead! ${co.mistakes ? `${co.mistakes} wrong turns` : "Not one wrong turn"}. Team transmutation.`); else say(line || (table.isHost() ? "Pick a series. Everyone takes turns, one decay each." : `Waiting for ${table.nameOf(table.host)} to pick a series.`));
        ui(`${top}${table.isHost() ? `<div class="levels">${CHAINS.map((c) => `<button class="c level" type="button" data-co="${c.id}"><b>${esc(c.name)}</b><span>${esc(c.start)} → ${esc(c.end)}</span></button>`).join("")}</div>` : ""}<div class="choices"><button class="c small" type="button" id="lg-coleave">⚗️ Leave the table</button></div>`);
        $("ui").querySelectorAll("[data-co]").forEach((b) => (b.onclick = () => { co = { chain: b.dataset.co, i: 0, mistakes: 0, done: false, msg: "" }; push(); }));
        $("lg-coleave").onclick = () => { table.leave(); table = null; co = null; lobby(false); }; return;
      }
      const c = chainOf(co.chain), [z, a] = c.steps[co.i], ids = order(), who = turnOf(ids, co.i), mine = who === table.me.id;
      const path = c.steps.slice(0, co.i + 1).map(([zz, aa]) => ({ z: zz, a: aa }));
      cap(`🤝 ${c.name} · step ${co.i + 1} of ${c.steps.length - 1}`); bench({ z, a, path });
      say(line || co.msg || (mine ? `Your turn, ${state.name}: ${label(z, a)}. Alpha or beta?` : `${table.nameOf(who)}'s turn: ${label(z, a)}.`));
      ui(`${top}<div class="chips">${ids.map((id) => `<span>${id === who ? "👉 " : ""}${esc(table.nameOf(id))}</span>`).join("")}</div>
        ${mine ? `<div class="choices"><button class="c" type="button" data-cd="a">α Alpha</button><button class="c" type="button" data-cd="b">β Beta</button></div>` : ""}<div class="choices"><button class="c small" type="button" id="lg-coleave">⚗️ Leave the table</button></div>`);
      $("ui").querySelectorAll("[data-cd]").forEach((b) => (b.onclick = () => { if (table.isHost()) coPick(table.me.id, b.dataset.cd); else table.up({ k: "pick", d: b.dataset.cd }); }));
      $("lg-coleave").onclick = () => { table.leave(); table = null; co = null; lobby(false); };
    }
    function push() { if (!table) return; table.to("*", { k: "co", co }); coDraw(); }
    function coPick(from, d) {
      if (!co || co.done) return; const c = chainOf(co.chain), [z, a, real] = c.steps[co.i];
      if (from !== turnOf(order(), co.i) || (d !== "a" && d !== "b")) return;
      if (d !== real) { co.mistakes++; co.msg = `Not ${d === "a" ? "alpha" : "beta"}. ${hintFor(z, a, real)}`; return push(); }
      const to = decay(z, a, d); co.i++; co.msg = `${table.nameOf(from)}: ${label(z, a)} → ${label(to.z, to.a)}.`;
      if (!c.steps[co.i][2]) { co.done = true; co.msg = ""; reward(); }
      push();
    }
    function reward() { const pay = 5 + (co.mistakes <= 2 ? 10 : 0); award(pay, pay); R().plays++; saveProgress(); showStats(); sfx.gold(); }
    function wireCo() {
      table.on("members", () => { if (alive()) coDraw(); });
      table.on("msg", ({ from, m }) => {
        if (!m || typeof m !== "object") return;
        if (m.k === "pick" && table.isHost()) coPick(from, m.d);
        else if (m.k === "co" && from === table.host && m.co) { const was = co; co = m.co; if (co.done && !(was && was.done)) reward(); if (co.msg && /→/.test(co.msg)) { sfx.geiger(3, 0.4); } coDraw(); }
      });
      table.on("close", () => { table = null; co = null; });
    }

    function shop(msg) {
      clearReading(); cap("💡 Bench kit"); const look = lookOf(P()); bench({ z: 79, a: 197, gold: true });
      say(typeof msg === "string" ? msg : `Lamps and charms, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, lbl]) => `<div class="group">${lbl}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="lg-lobby">⚗️ Back to the bench</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. Transmute a little more first.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.right(); shop(r === "bought" ? "It's on the bench now." : "Swapped in."); } }));
      $("lg-lobby").onclick = () => lobby(false);
    }
    lobby(true);
  },
};

/** The handbook (reading area). */
export function guideHtml(esc) {
  return `<div class="lg-guide"><h3>📖 Transmutation handbook</h3>
    <p><b>Alpha (α):</b> the nucleus throws out 2 protons and 2 neutrons. It becomes the element two places down, 4 lighter.</p>
    <p><b>Beta (β⁻):</b> a neutron turns into a proton and an electron flies out. It becomes the element one place up, same mass.</p>
    <p><b>Gold-197:</b> 79 protons and 118 neutrons, the only stable gold.</p>
    ${CHAINS.map((c) => `<p><b>${esc(c.name)}:</b> ${esc(c.start)} → ${esc(c.end)}. ${esc(c.note)}</p>`).join("")}
    ${ROUTES.map((r) => `<p><b>${esc(r.who)}:</b> ${esc(r.note)}</p>`).join("")}
    ${HISTORY.map((h) => `<p>${esc(h)}</p>`).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function leadgoldCodex(p, esc) {
  const r = lgOf(p), done = [1, 2, 3].filter((n) => r.best[n]).length; if (!r.plays && !r.gold) return "";
  return `<div class="cx"><div class="cx-h"><span>⚛️ Lead into Gold</span><span class="note">${r.gold} gold atoms · ${done} / 3 levels</span></div><div class="bar"><i style="width:${(done / 3) * 100}%"></i></div></div>`;
}
