// The Mineral Cabinet: a room of the Oracle Chamber (and part of the Alchemist's House core loop). An unlabelled rock
// arrives; you test it like a field geologist (scratch, streak, magnet, acid, heft, flame, spectroscope, UV) and name
// it. Named minerals go into your drawers by mineral class, and each becomes an ingredient on the Discovery Bench.
// The flame test uses Flame Test Lab's burner and data, so a mineral burns with the real colour of its metal.
import { MINERALS, CLASSES, LEVELS, TESTS, LUSTRE, mineral, testResult } from "./data.js";
import { room as mcOf, start, nextOf, testsFor, runTest, name as nameIt, scoreOf, perfect, settle, dailyOf, CHIPS } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse, hasUv } from "./shop.js";
import { cabinetSvg, rockIcon, streakHex } from "./scene.js";
import { CSS } from "./style.js";
import { sample } from "../flametest/data.js";
import { spectrumSvg } from "../flametest/scene.js";
import * as sfx from "../flametest/sfx.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";
import { host } from "../hosts/index.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("mc-style")) return; const s = document.createElement("style"); s.id = "mc-style"; s.textContent = CSS; document.head.append(s); };
const flameName = (id) => sample(id)?.colour || id;
const flameHex = (m) => (m.flame === "pb" ? "#bcd8ff" : m.flame === "s" ? "#4a6aff" : m.flame ? sample(m.flame)?.flame[1] : null);
const clsName = (k) => (CLASSES.find(([id]) => id === k) || [k, k])[1];

export const minerals = {
  id: "minerals", label: "Mineral Cabinet", emoji: "🪨",
  blurb: "Test real rocks like a geologist and name them",
  shop: { kind: "minerals", label: "🪨 Mineral Cabinet", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table minerals";
      tableEl.innerHTML = cabinetSvg(mineral("fluorite"), { look: { ...DEFAULT_LOOK, [it.slot]: id }, test: it.id === "mc-uv" ? "uv" : null, unknown: false }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => mcOf(P());
    const draw = (m, o = {}) => { tableEl.className = "table minerals"; tableEl.innerHTML = cabinetSvg(m, { look: lookOf(P()), ...o }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const vell = () => host().id === "alchemist"; // each House greets in its own voice

    function lobby(first) {
      clearReading(); cap("🪨 The Mineral Cabinet"); draw(mineral("quartz"), { unknown: false });
      const r = R(), ds = dailyState(P(), "minerals"), dd = dailyOf();
      say(first && !r.plays
        ? (vell() ? `A parcel of rocks just arrived, ${state.name}! No labels, naturally. Scratch them, streak them, burn a crumb in the flame, and tell me what they are. Every one you name goes on my bench as an ingredient.`
          : `This is the Mineral Cabinet, ${state.name}. Rocks arrive without labels. Test them the way geologists do, with a scratch, a streak, a magnet, a drop of acid and a flame, and name them for your drawers.`)
        : pick(vell() ? ["More rocks! The post never stops.", "Goggles on. Let's see what this one is.", `Another mystery stone for you, ${state.name}.`] : ["Another specimen has arrived.", "The cabinet is open. Pick a drawer.", "A fresh rock, no label. Your move."]));
      const lvl = (L) => { const got = L.pool.filter((id) => r.found.includes(id)).length;
        return `<button class="c level" type="button" data-l="${L.n}"><b>${"🪨".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${got} / ${L.pool.length} named · points ×${L.mult}</span></button>`; };
      ui(`<div class="cx-top"><b>🪨 Mineral Cabinet</b> · ${r.found.length} / ${MINERALS.length} in your drawers · ${r.flamed.length} flame-tested</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${CHIPS} sample chips per rock. Each test uses one, and so does a wrong name. Colour and lustre are free to look at.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="mc-daily"><b>📅 Daily specimen${ds.played ? " · done ✓" : ""}</b><span>The same rock for everyone today · Level ${dd.L.n}${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="mc-drawers">🗄 My drawers</button><button class="c" type="button" id="mc-shop">🔍 Collector's kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; begin(start(L, nextOf(P(), L), { uv: hasUv(P()) })); }));
      $("mc-daily").onclick = () => { const d = dailyOf(); begin(start(d.L, d.id, { seed: d.seed, daily: d.day, uv: hasUv(P()) })); };
      $("mc-drawers").onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".mc-drawers"); sfx.page(); rb.innerHTML = on ? drawersHtml(P(), esc) : ""; $("mc-drawers").textContent = on ? "✕ Close" : "🗄 My drawers"; if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); };
      $("mc-shop").onclick = shop; $("back").onclick = greet;
    }

    const begin = (run) => { clearReading(); sfx.tap(true); show(run); };
    function show(run, line, last = null) {
      const m = mineral(run.id), L = run.L;
      cap(`🪨 Level ${L.n} · unknown specimen${run.daily ? " · 📅 daily" : ""}`); draw(m, { test: last });
      say(line || pick(["Here's the specimen. What will you test first?", "No label. Look closely, then test.", "A new rock for the cabinet. Which test?"]));
      const res = run.tests.map((k) => `<div><b>${TESTS[k].emoji} ${esc(TESTS[k].name)}:</b> ${esc(testResult(m, k, flameName))}${k === "streak" ? ` <i class="ft-sw" style="background:${streakHex(m.streak)};color:${streakHex(m.streak)}"></i>` : ""}${k === "flame" && flameHex(m) ? ` <i class="ft-sw" style="background:${flameHex(m)};color:${flameHex(m)}"></i>` : ""}${k === "scope" && m.flame && sample(m.flame) ? spectrumSvg(sample(m.flame), { h: 30 }) : ""}</div>`).join("");
      ui(`<div class="cx-top">Level ${L.n} · chips ${"●".repeat(run.chips)}${"○".repeat(CHIPS - run.chips)} · worth ${Math.round((run.chips + 1) * L.mult)}</div>
        <div class="mc-results"><div><b>👁 Look:</b> ${esc(LUSTRE[m.lustre] || m.lustre)} lustre</div>${res}</div>
        <div class="group">Tests (one chip each)</div><div class="mc-tests">${testsFor(run).map((k) => `<button class="c small" type="button" data-t="${k}" title="${esc(TESTS[k].what)}" ${run.tests.includes(k) || run.chips <= 1 ? "disabled" : ""}>${TESTS[k].emoji} ${esc(TESTS[k].name)}</button>`).join("")}</div>
        <div class="group">What is it?</div><div class="choices col">${run.options.map((id) => `<button class="c" type="button" data-n="${id}" ${run.wrong.includes(id) ? "disabled" : ""}>${run.wrong.includes(id) ? "✗ " : ""}${esc(mineral(id).name)}</button>`).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="mc-leave">Put it back</button></div>`);
      $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { const k = b.dataset.t; if (!runTest(run, k)) return;
        ({ scratch: sfx.scratch, streak: sfx.scratch, magnet: () => (m.mag === "no" ? sfx.tap() : sfx.clunk()), acid: () => (m.fizz === "no" ? sfx.tap() : sfx.fizz(m.fizz === "yes" ? 16 : 5)), heft: () => sfx.tap(m.sg >= 4), flame: () => { sfx.ignite(); setTimeout(() => sfx.sizzle(3), 250); }, scope: sfx.scope, uv: sfx.hum })[k]();
        show(run, testResult(m, k, flameName), k); }));
      $("ui").querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => { const r = nameIt(run, b.dataset.n);
        if (r === "wrong") { sfx.wrong(); ctx.emote?.("think", { quiet: true }); return show(run, pick(["Not that one. Another test might help.", "No. Look at the evidence again.", "Close, but the tests disagree."]), null); }
        if (r === "right") { sfx.right(); spark(); ctx.banter?.("mid"); } else sfx.wrong();
        finish(run); }));
      $("mc-leave").onclick = () => lobby(false);
    }
    function finish(run) {
      const m = mineral(run.id), L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("minerals", L.n, { won: run.won, perfect: perfect(run) }); // Trophy Case (trophies.js)
      sfx.finale(run.won); draw(m, { unknown: false, label: `${m.name} · ${m.f}` }); cap(`🪨 ${m.name}`);
      say(run.won ? (vell() ? `${m.name}! Into the drawer, and onto my bench.` : `${m.name}. Well tested.`) : `It was ${m.name.toLowerCase()}. The drawers will wait for it.`);
      const bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, run.won ? `score ${r.score}` : "not named this time"];
      if (r.first) bits.push(`🗄 new in your drawers (+5 💎)`); if (r.flamed) bits.push("🔥 flame colour recorded"); if (perfect(run)) bits.push("✨ perfect");
      let board = "";
      if (run.daily) { const res = { score: r.score, won: run.won, detail: m.name }, fd = finishDaily(P(), "minerals", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("mc-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: r.score } }); };
        (fd.first ? postDaily(state, "minerals", res) : boardOf(state, "minerals")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="mc-board" class="note">Loading the board…</div>`; }
      if (r.first) chime(1);
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}${cardHtml(m, esc)}
        <div class="choices"><button class="c main" type="button" id="mc-next">🪨 Next Level ${L.n} rock</button><button class="c" type="button" id="mc-lobby">🗄 The cabinet</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("mc-next").onclick = () => begin(start(L, nextOf(P(), L), { uv: hasUv(P()) })); $("mc-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }
    function shop(msg) {
      clearReading(); cap("🔍 Collector's kit"); const look = lookOf(P()); draw(mineral("fluorite"), { unknown: false });
      say(typeof msg === "string" ? msg : `Lenses, cases and lamps for your collection, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="mc-lobby">🗄 Back to the cabinet</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. Name a few more rocks first.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.glass(); shop(r === "bought" ? "A fine addition to the cabinet." : "Swapped in."); } }));
      $("mc-lobby").onclick = () => lobby(false);
    }
    lobby(true);
  },
};

/** A mineral's full label card: every property a geologist records, plus its fact. */
export function cardHtml(m, esc) {
  const fh = flameHex(m);
  return `<div class="ft-card"><b>${esc(m.name)} · ${esc(m.f)} · ${esc(clsName(m.cls))}</b>
    <p>Hardness ${m.hard} · streak ${esc(m.streak)} · ${esc(m.lustre)} lustre · density ${m.sg} g/cm³${m.mag !== "no" ? ` · ${m.mag === "weak" ? "weakly " : ""}magnetic` : ""}${m.fizz !== "no" ? ` · fizzes in acid${m.fizz === "powder" ? " (powdered or warm)" : ""}` : ""}</p>
    <p>${fh ? `<i class="ft-sw" style="background:${fh};color:${fh}"></i>` : ""}Flame test: ${esc(testResult(m, "flame", flameName))}${m.uv ? ` · under UV it glows ${esc(m.uv)}` : ""}</p>
    <p>${esc(m.fact)}</p><p class="note">Elements: ${m.el.join(", ")}</p></div>`;
}
/** Your drawers, by mineral class (reading area). */
export function drawersHtml(p, esc) {
  const r = mcOf(p);
  return `<div class="mc-drawers"><h3>🗄 My drawers · ${r.found.length} / ${MINERALS.length}</h3><p class="note">Minerals are filed by chemistry: what the metal is bonded to. A 🔥 swatch shows a flame test you have run.</p>
    ${CLASSES.map(([k, label]) => { const ms = MINERALS.filter((m) => m.cls === k); if (!ms.length) return "";
      return `<div class="mc-drawer"><h4>${esc(label)} (${ms.filter((m) => r.found.includes(m.id)).length} / ${ms.length})</h4><div class="mc-cells">${ms.map((m) => { const on = r.found.includes(m.id), fh = r.flamed.includes(m.id) && flameHex(m);
        return `<span class="mc-cell${on ? "" : " off"}" title="${on ? esc(m.name + " · " + m.f) : "not named yet"}">${on ? rockIcon(m) : "❔"}${on ? esc(m.name) : "?"}${fh ? `<i class="ft-sw" style="background:${fh};color:${fh}"></i>` : ""}</span>`; }).join("")}</div></div>`; }).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function mineralsCodex(p, esc) {
  const r = mcOf(p);
  return `<div class="cx"><div class="cx-h"><span>🪨 Mineral Cabinet</span><span class="note">${r.found.length} / ${MINERALS.length} named · ${r.flamed.length} flame-tested</span></div><div class="bar"><i style="width:${(r.found.length / MINERALS.length) * 100}%"></i></div>
    ${r.found.length ? `<div class="chips">${r.found.map((id) => `<span>${esc(mineral(id)?.name || id)}</span>`).join("")}</div>` : ""}</div>`;
}
