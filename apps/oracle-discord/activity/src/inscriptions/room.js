// The Inscription Tray: a room of the Oracle Chamber and the Scriptorium's core loop, step 1 (identify). Unlabelled
// finds arrive in the tray; tests (direction, sign count, tool, word breaks, telltale mark) narrow the list, and each
// test or wrong name costs an ink drop. Named scripts are filed in drawers by type; the Cipher Desk reads them.
// Content in data.js, rules in logic.js, tray drawing in scene.js, shelf in shop.js, sounds in sfx.js.
import { SCRIPTS, LEVELS, ROUND, DROPS, TESTS, TYPES, SPEED_SECS, script } from "./data.js";
import { room as inOf, start, current, test, guess, next, rightCount, perfect, settle, maxScore, speedDeck, logSpeed, raceRank, dailyOf, drawers, file, WIN_AT, RACE_WIN, SPEED_PAY } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { traySvg, familyOf } from "./scene.js";
import { CSS } from "./style.js";
import * as sfx from "./sfx.js";
import { joinTable } from "../net.js";
import { host } from "../hosts/index.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("in-style")) return; const s = document.createElement("style"); s.id = "in-style"; s.textContent = CSS(); document.head.append(s); };
const heavy = (id) => ["stone", "clay"].includes(script(id).find);
const drops = (n) => "●".repeat(Math.max(0, n)) + "○".repeat(Math.max(0, DROPS - n));

export const inscriptions = {
  id: "inscriptions", label: "Inscription Tray", emoji: "🔎",
  blurb: "Identify 40 real scripts from unlabelled finds",
  shop: { kind: "inscriptions", label: "🔎 Inscription Tray", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table inscriptions";
      tableEl.innerHTML = traySvg({ look: { ...DEFAULT_LOOK, [it.slot]: id }, id: "futhark" }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => inOf(P());
    const alive = () => tableEl.classList.contains("inscriptions");
    const draw = (s = {}) => { tableEl.className = "table inscriptions"; tableEl.innerHTML = traySvg({ look: lookOf(P()), ...s }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    let table = null, race = null, timer = null;
    const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };

    // ---- lobby ----
    function lobby(first) {
      stopTimer(); clearReading(); cap("🔎 The Inscription Tray"); draw({}); sfx.drawer();
      const wren = host().id === "scriptorium"; // each House greets in its own voice (Frank 2026-11-27)
      say(first && !R().plays && wren
        ? `Ah, ${state.name}, the finds tray. Rubbings, tablets, scraps of letters, all unlabelled. Every mark means something. We test them the way decipherers do: which way the writing runs, how many signs it has, what it was written with. Name the script and I'll file it in the drawers.`
        : wren ? pick([`Something new in the tray, ${state.name}. Shall we look?`, "Gloves on. Well, mine are already inky.", "The post brought a rubbing. Unlabelled, naturally."])
        : first && !R().plays
        ? `Welcome to the Inscription Tray, ${state.name}. Unlabelled finds come in: stones, clay tablets, old letters. Test them like a decipherer, by direction, sign count, tools and marks, and name the script. 40 real scripts, from 3200 BC to 1949.`
        : pick([`Another find in the tray, ${state.name}.`, "Something unlabelled just arrived. Shall we test it?", "The tray's ready. Which shelf today?"]));
      const r = R(), dd = dailyOf(), ds = dailyState(P(), "inscriptions");
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🔎".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${r.wins[L.n] || 0} round${(r.wins[L.n] || 0) === 1 ? "" : "s"} won · best ${r.best[L.n] || 0} / ${maxScore(L)} · points ×${L.mult}</span></button>`;
      ui(`<div class="cx-top"><b>🔎 Inscription Tray</b> · ${r.found.length} / ${SCRIPTS.length} scripts filed · speed best ${r.speed}</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${ROUND} finds a round, ${DROPS} ink drops each. A test costs a drop, and so does a wrong name. Name ${WIN_AT} to win.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="in-daily"><b>📅 Daily Find${ds.played ? " · done ✓" : ""}</b><span>Today: Level ${dd.L.n}, the same ${ROUND} finds for everyone${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}${ds.played ? " · come back tomorrow" : ""}</span></button>
        <div class="choices"><button class="c main" type="button" id="in-speed">⏱ Speed round (${SPEED_SECS}s)</button><button class="c" type="button" id="in-race">⚔️ Race friends</button></div>
        <div class="choices"><button class="c" type="button" id="in-book">🗄 The drawers</button><button class="c" type="button" id="in-shop">🧰 Tray kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => begin(start(LEVELS[+b.dataset.l - 1]))));
      $("in-daily").onclick = () => { const d = dailyOf(); begin(start(d.L, { seed: d.seed, daily: d.day })); };
      $("in-speed").onclick = () => speed();
      $("in-race").onclick = () => raceRoom();
      $("in-book").onclick = () => chart($("in-book"));
      $("in-shop").onclick = shop;
      $("back").onclick = () => { if (table) { table.leave(); table = null; race = null; } stopTimer(); greet(); };
    }
    function chart(btn) {
      const rb = $("reading-body"), on = !rb.querySelector(".in-drawers"); sfx.drawer();
      rb.innerHTML = on ? drawersHtml(P(), esc) : ""; if (btn) btn.textContent = on ? "✕ Close" : "🗄 The drawers";
      if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // ---- a round ----
    const begin = (run) => { clearReading(); show(run); };
    const bar = (run) => { const it = current(run);
      return `<div class="cx-top">Level ${run.L.n} · find ${run.i + 1} / ${run.items.length} · ink ${drops(it.drops)} · score ${run.score}${run.daily ? " · 📅 daily" : ""}</div>`; };
    function show(run, line, scan = false) {
      const it = current(run), s = script(it.id);
      cap(`🔎 Find ${run.i + 1} · ${esc(s.find)}`);
      draw({ id: it.id, scan });
      if (!line) sfx.setDown(heavy(it.id));
      say(line || pick([`A ${s.find === "clay" ? "clay tablet" : s.find} with writing on it. Which script is it?`, "No label, of course. Test it, or name it.", "Look closely first. Then test what you're unsure of."]));
      const clues = it.tests.map((k) => { const T = TESTS.find((t) => t.k === k); return `<div class="clue"><b>${T.e} ${esc(T.name)}</b><span>${esc(s[k])}</span></div>`; }).join("");
      ui(`${bar(run)}<div class="clues">${clues}</div>
        <div class="choices">${TESTS.filter((t) => !it.tests.includes(t.k)).map((t) => `<button class="c small" type="button" data-t="${t.k}" ${it.drops <= 1 ? "disabled" : ""}>${t.e} ${esc(t.name)}</button>`).join("")}</div>
        <div class="choices col">${it.choices.map((id) => `<button class="c" type="button" data-g="${id}" ${it.wrong.includes(id) ? "disabled" : ""}>${it.wrong.includes(id) ? "✗ " : ""}${esc(script(id).name)}</button>`).join("")}</div>
        <div class="choices"><button class="c small" type="button" id="in-leave">Leave the tray</button></div>`);
      $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => { const c = test(run, b.dataset.t); if (c) { sfx.scratch(); show(run, pick(["Noted.", "Hm. Interesting.", "I'll write that down."]), true); } }));
      $("in-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => {
        const r = guess(run, b.dataset.g);
        if (r === "wrong") { sfx.wrong(); ctx.emote?.("think", { quiet: true }); return show(run, pick(["Not that one. Look again.", "No. The signs say otherwise.", "Close, but no."])); }
        if (r === "right") { sfx.right(); spark(); ctx.banter?.("mid"); } else sfx.wrong();
        reveal(run, r === "right");
      }));
    }
    function reveal(run, ok) {
      const it = current(run), s = script(it.id), T = TYPES.find((t) => t.id === s.type), last = run.i >= run.items.length - 1;
      draw({ id: it.id, label: s.name, filed: ok }); if (ok) setTimeout(() => sfx.seal(), 250);
      cap(`${s.name} · ${s.when}`);
      say(ok ? `Yes: ${s.name}.${s.type === "undeciphered" ? " Nobody can read it yet, and that's the honest answer." : ""}` : `It was ${s.name}.`);
      ui(`${bar(run)}<div class="in-card"><b>${esc(s.name)}${ok ? " ✓" : ""} · ${esc(T.name.replace(/s$/, ""))}</b>${s.sample ? `<div class="in-sample" style='font-family:${familyOf(s)}'${s.vertical ? ' lang="mn"' : ""}>${esc(s.sample)}</div>` : ""}
        <p>${esc(s.fact)}</p><p class="note">${esc(s.when)} · ${esc(s.where)} · ${esc(s.dir)}</p></div>
        <div class="choices"><button class="c main" type="button" id="in-next">${last ? "🏁 Finish the round" : "🔎 Next find"}</button></div>`);
      $("in-next").onclick = () => { if (next(run)) show(run); else finish(run); };
    }
    function finish(run) {
      const L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("inscriptions", L.n, { won: r.won, perfect: r.won && perfect(run) }); // Trophy Case (trophies.js)
      sfx.finale(r.won); if (r.won) { spark(); chime(perfect(run) ? 3 : 1); }
      const n = rightCount(run), bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, `${n} / ${run.items.length} named`, `score ${run.score} / ${maxScore(L)}${r.best ? " · new best" : ""}`];
      if (perfect(run)) bits.push("✨ perfect round");
      let board = "";
      if (run.daily) { const res = { score: run.score, won: r.won, detail: `Level ${L.n} · ${n}/${run.items.length}` }, fd = finishDaily(P(), "inscriptions", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("in-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: run.score } }); };
        (fd.first ? postDaily(state, "inscriptions", res) : boardOf(state, "inscriptions")).then(fill);
        if (fd.first) bits.push(`📅 daily streak ${fd.streak}`);
        board = `<div class="group">📅 Today's board</div><div id="in-board" class="note">Loading the board…</div>`; }
      draw({});
      say(r.won ? pick(["Every mark means something, and you read them.", "Filed and sealed. A good day in the archive.", "Champollion would nod. Briefly. He was busy."]) : `${n} named. The drawers help: every script you file is there to study.`);
      const fresh = r.newFound.length ? `<div class="up">🗄 Filed in the drawers: ${r.newFound.map((id) => esc(script(id).name)).join(", ")}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${fresh}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}
        <div class="in-chips">${run.items.map((it) => `<span>${esc(script(it.id).name)} ${it.right ? "✓" : "✗"}</span>`).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="in-again">🔎 Another Level ${L.n} round</button><button class="c" type="button" id="in-lobby">🗃 Choose a shelf</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("in-again").onclick = () => begin(start(L)); $("in-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    // ---- speed round (also the race): name the script from the find alone ----
    function speed(seed = null, onDone = null) {
      stopTimer(); clearReading(); const deck = speedDeck(seed); let i = 0, n = 0, left = SPEED_SECS, lock = false; const t0 = Date.now();
      cap("⏱ Speed round"); say(`Name as many scripts as you can in ${SPEED_SECS} seconds. Go!`); sfx.drawer();
      const card = () => { const d = deck[i % deck.length]; draw({ id: d.id }); sfx.setDown(heavy(d.id));
        ui(`<div class="cx-top in-timer${left <= 10 ? " low" : ""}" id="in-t">⏱ ${left}s · ✓ ${n}</div><div class="choices col">${d.choices.map((id) => `<button class="c" type="button" data-s="${id}">${esc(script(id).name)}</button>`).join("")}</div>`);
        $("ui").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => { if (lock || left <= 0) return;
          if (b.dataset.s === d.id) { n++; sfx.right(); if (!onDone) file(P(), [d.id]); i++; card(); } else { sfx.wrong(); lock = true; b.disabled = true; setTimeout(() => { lock = false; i++; if (left > 0) card(); }, 700); } })); };
      card();
      timer = setInterval(() => { if (!alive()) return stopTimer(); left--; const el = $("in-t"); if (el) { el.textContent = `⏱ ${left}s · ✓ ${n}`; el.classList.toggle("low", left <= 10); } if (left <= 5 && left > 0) sfx.tick(left <= 3);
        if (left <= 0) { stopTimer(); sfx.finale(n >= 10); const res = { n, t: Date.now() - t0 }; return onDone ? onDone(res) : speedDone(n); } }, 1000);
    }
    function speedDone(n) {
      const lg = logSpeed(P(), n); award(lg.pay, lg.pay); saveProgress(); showStats(); if (lg.best) { spark(); chime(2); }
      ctx.banter?.(n >= 10 ? "win" : "mid"); draw({});
      say(lg.best ? `${n} scripts! A new personal best.` : `${n} scripts in ${SPEED_SECS} seconds.`);
      ui(`<div class="reward"><div><b>+${lg.pay} ✦ · +${lg.pay} 💎</b> · ${n} named · best ${R().speed}</div></div>
        <div class="choices"><button class="c main" type="button" id="in-again">⏱ Again</button><button class="c" type="button" id="in-lobby">🗃 Choose a shelf</button></div>`);
      $("in-again").onclick = () => speed(); $("in-lobby").onclick = () => lobby(false);
    }

    // ---- race friends in the call: everyone gets the same speed deck; the host collects the counts ----
    const raceTop = () => `<div class="cx-top">⚔️ Script race · ${table ? table.members.length : 0} in the call${table && table.host ? ` · host ${esc(table.nameOf(table.host))}` : ""}</div>`;
    async function raceRoom(line) {
      if (!table) {
        say("Setting out the race trays…"); ui(`<div class="note">Joining the call's table…</div>`);
        try { table = await joinTable("inscriptions", state); wire(); }
        catch (e) { say(e.message || "Racing needs a Discord voice call."); ui(`<div class="choices"><button class="c" type="button" id="in-lobby">🗃 Back to the tray</button></div>`); $("in-lobby").onclick = () => lobby(false); return; }
      }
      const isHost = table.isHost();
      say(line || (isHost ? `You're hosting, ${state.name}. Start when everyone is in. Same finds for everyone, ${SPEED_SECS} seconds.` : `Waiting for ${table.nameOf(table.host)} to start the race.`));
      ui(`${raceTop()}<div class="chips">${table.members.map((m) => `<span>${m.id === table.me.id ? "🪶 " : ""}${esc(m.name)}</span>`).join("")}</div>
        <div class="choices">${isHost ? `<button class="c main" type="button" id="in-go" ${table.members.length < 2 ? "disabled" : ""}>🔎 Start the race</button>` : ""}<button class="c" type="button" id="in-rleave">Leave the race</button></div>`);
      if ($("in-go")) $("in-go").onclick = () => { const seed = (Math.random() * 2 ** 31) >>> 0; table.to("*", { k: "go", seed }); startRace(seed); };
      $("in-rleave").onclick = () => { table.leave(); table = null; race = null; lobby(false); };
    }
    function wire() {
      table.on("members", () => { if (race && !race.over) { if (table.isHost()) maybeEnd(); } else if (alive() && $("in-rleave")) raceRoom(); });
      table.on("host", () => { if (race && !race.over) maybeEnd(); else if ($("in-rleave")) raceRoom(); });
      table.on("msg", ({ from, m }) => {
        if (!m || typeof m !== "object") return;
        if (m.k === "go" && from === table.host && (!race || race.over)) startRace(m.seed >>> 0);
        else if (m.k === "done" && table.isHost() && race) record(from, m.r);
        else if (m.k === "result" && from === table.host) showResult(m.rows);
      });
      table.on("close", () => { table = null; if (race && !race.over) { race.over = true; say("The race table closed."); } });
    }
    function startRace(seed) {
      race = { seed, results: {}, over: false };
      speed(seed, (res) => { if (!table) return lobby(false); say("Done! Waiting for the others…"); ui(`${raceTop()}<div class="note">You named ${res.n}. Waiting for everyone to finish…</div>`);
        if (table.isHost()) record(table.me.id, res); else table.up({ k: "done", r: res }); });
      if (table && table.isHost()) setTimeout(() => { if (race && !race.over) finishRace(); }, (SPEED_SECS + 15) * 1000);
    }
    function record(id, r) { if (!race || race.over || !r) return; race.results[id] = { n: Math.max(0, Math.min(200, +r.n || 0)), t: +r.t || 0, name: table.nameOf(id) }; maybeEnd(); }
    function maybeEnd() { if (!table || !race) return; if (table.members.map((m) => m.id).every((id) => race.results[id])) finishRace(); }
    function finishRace() { if (!race || race.over || !table) return; const rows = raceRank(race.results); table.to("*", { k: "result", rows }); showResult(rows); }
    function showResult(rows) {
      if (!race) race = { over: false }; else if (race.over) return; race.over = true;
      const me = table && rows.find((r) => r.id === table.me.id), win = me && me.place === 1 && rows.length >= 2;
      if (me) { const lg = logSpeed(P(), me.n); award(lg.pay + (win ? RACE_WIN : 0), lg.pay + (win ? RACE_WIN : 0)); saveProgress(); showStats(); }
      if (win) { spark(); chime(2); }
      say(win ? `You won the script race, ${state.name}!` : me ? `You placed ${me.place} of ${rows.length}.` : "The race is over.");
      ui(`${raceTop()}<ol class="in-rank">${rows.map((r) => `<li>${esc(r.name)} · ${r.n} script${r.n === 1 ? "" : "s"}${r.place === 1 ? " 🏆" : ""}</li>`).join("")}</ol>
        ${me ? `<div class="reward"><div><b>+${me.n * SPEED_PAY + (win ? RACE_WIN : 0)} ✦ 💎</b>${win ? ` · +${RACE_WIN} for the win` : ""}</div></div>` : ""}
        <div class="choices"><button class="c main" type="button" id="in-rroom">⚔️ Race again</button><button class="c" type="button" id="in-lobby">🗃 Back to the tray</button></div>`);
      $("in-rroom").onclick = () => { race = null; raceRoom(); }; $("in-lobby").onclick = () => lobby(false);
    }

    // ---- the tray kit shelf ----
    function shop(msg) {
      clearReading(); cap("🧰 Tray kit"); const look = lookOf(P()); draw({ id: "cuneiform" });
      say(typeof msg === "string" ? msg : `Lights, copies and trays, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="in-lobby">🔎 Back to the tray</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. A few rounds at the tray will fix that.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.page(); shop(r === "bought" ? "Good kit. It's on your tray." : "Swapped in."); } }));
      $("in-lobby").onclick = () => lobby(false);
    }

    lobby(true);
  },
};

/** The drawers (reading area): every script type, with the scripts you have filed and their facts. */
export function drawersHtml(p, esc) {
  return `<div class="in-drawers"><h3>🗄 The drawers</h3><p class="note">Scripts are filed by how they write sounds. Name a script in the tray to file it here.</p>
    ${drawers(p).map((d) => `<div class="in-drawer"><h4>${esc(d.name)} · ${d.got.length} / ${d.all.length}</h4><p class="note">${esc(d.note)}</p>
      <div class="in-chips">${d.all.map((s) => `<span class="${d.got.includes(s) ? "" : "no"}">${d.got.includes(s) ? esc(s.name) : "?"}</span>`).join("")}</div>
      ${d.got.map((s) => `<div class="in-card"><b>${esc(s.name)} · ${esc(s.when)} · ${esc(s.where)}</b>${s.sample ? `<div class="in-sample" style='font-family:${familyOf(s)}'>${esc(s.sample)}</div>` : ""}<p>${esc(s.fact)}</p></div>`).join("")}</div>`).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function inscriptionsCodex(p, esc) {
  const r = inOf(p);
  return `<div class="cx"><div class="cx-h"><span>🔎 Inscription Tray</span><span class="note">${r.found.length} / ${SCRIPTS.length} scripts filed · speed best ${r.speed}</span></div><div class="bar"><i style="width:${(r.found.length / SCRIPTS.length) * 100}%"></i></div>
    <div class="chips">${LEVELS.map((L) => `<span>Level ${L.n}: ${r.wins[L.n] || 0} won · best ${r.best[L.n] || 0}</span>`).join("")}</div></div>`;
}
