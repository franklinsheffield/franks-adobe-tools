// Flame Test Lab: a room of the Oracle Chamber (and of the Alchemist's House). Level 1, name the element from its
// flame colour; level 2, a dirty wire's sodium yellow hides the metal, so look through cobalt glass; level 3, read the
// lines in a spectroscope like Bunsen and Kirchhoff, including the elements they discovered that way.
// Content in data.js, rules in logic.js, bench drawing in scene.js, shelf in shop.js, sounds in sfx.js.
import { SAMPLES, SPECTRA, LEVELS, ROUND, TRIES, SPEED_SECS, sample, spectrum } from "./data.js";
import { room as ftOf, start, current, hint, guess, next, rightCount, won, perfect, settle, itemOf, maxScore, speedDeck, logSpeed, raceRank, dailyOf, WIN_AT, RACE_WIN, SPEED_PAY } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { benchSvg, spectrumSvg } from "./scene.js";
import { showSvg } from "./show-scene.js";
import { openShow } from "./show-room.js";
import { CSS } from "./style.js";
import * as sfx from "./sfx.js";
import { joinTable } from "../net.js";
import { host } from "../hosts/index.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState, todayKey } from "../daily.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("ft-style")) return; const s = document.createElement("style"); s.id = "ft-style"; s.textContent = CSS; document.head.append(s); };
const NA = sample("na");
const nameOf = (L, id) => itemOf(L, id).name;

export const flametest = {
  id: "flametest", label: "Flame Test Lab", emoji: "🔥",
  blurb: "Name elements from the colour of their flame",
  shop: { kind: "flametest", label: "🔥 Flame Test Lab", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table flametest";
      tableEl.innerHTML = it.slot === "podium" ? showSvg({ look: DEFAULT_LOOK, flame: "cu", podium: id, label: "Probably Not Soup", shelf: ["Do Not Shake", "Totally Fine", "Mostly Harmless"] })
        : benchSvg({ look: { ...DEFAULT_LOOK, [it.slot]: id }, flame: sample("cu").flame, spectrum: it.slot === "scope" ? sample("na") : null }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => ftOf(P());
    const alive = () => tableEl.classList.contains("flametest");
    const draw = (s = {}) => { tableEl.className = "table flametest"; tableEl.innerHTML = benchSvg({ look: lookOf(P()), ...s }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const sw = (s) => `<i class="ft-sw" style="background:${s.flame[1]};color:${s.flame[1]}"></i>`;
    let table = null, race = null, timer = null;
    const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };

    // ---- lobby ----
    function lobby(first) {
      stopTimer(); clearReading(); cap("🔥 The Flame Test Lab"); draw({}); sfx.roar(alive);
      const vell = host().id === "alchemist"; // each House greets in its own voice (Frank 2026-11-27)
      say(first && !R().plays && vell
        ? `Goggles on, ${state.name}! This is my flame bench. Hold a salt in a hot flame and its metal paints the flame its own colour. Bunsen and Kirchhoff found two brand-new elements this way, in Heidelberg, in 1860 and 1861. Let's set things on fire, scientifically.`
        : vell ? pick([`Burner's lit, ${state.name}. Pick a test and mind your sleeves.`, "Wire's clean, flame's blue. Bring me a sample!", "Ooh, a visitor. Let's burn something educational."])
        : first && !R().plays
        ? `Welcome to the flame test bench, ${state.name}. Every metal paints a flame its own colour, because its atoms give off light at exact wavelengths. Chemists have used this since the 1800s to tell metals apart, and Bunsen and Kirchhoff discovered new elements with it.`
        : pick([`The burner's lit, ${state.name}. Which test today?`, "Wire loop's clean. What shall we burn?", "Flame's steady and blue. Ready for a sample."]));
      const r = R(), dd = dailyOf(), ds = dailyState(P(), "flametest");
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"🔥".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${r.wins[L.n] || 0} round${(r.wins[L.n] || 0) === 1 ? "" : "s"} won · best ${r.best[L.n] || 0} / ${maxScore(L)} · points ×${L.mult}</span></button>`;
      ui(`<div class="cx-top"><b>🔥 Flame Test Lab</b> · ${r.seen.length} / ${SAMPLES.length + SPECTRA.length} elements identified · speed best ${r.speed}</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${ROUND} samples a round, ${TRIES} tries each. Get ${WIN_AT} right to win the round.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="ft-daily"><b>📅 Daily Flame Test${ds.played ? " · done ✓" : ""}</b><span>Today: Level ${dd.L.n}, the same ${ROUND} samples for everyone${ds.streak ? ` · 🔥 ${ds.streak}-day streak` : ""}${ds.played ? " · come back tomorrow" : ""}</span></button>
        <div class="choices"><button class="c main" type="button" id="ft-speed">⏱ Speed round (${SPEED_SECS}s)</button><button class="c" type="button" id="ft-race">⚔️ Race friends</button></div>
        <div class="choices"><button class="c main" type="button" id="ft-show">🎙️ Vell's Hazardous Guess Show</button></div>
        <div class="choices"><button class="c" type="button" id="ft-book">📓 Flame chart</button><button class="c" type="button" id="ft-shop">🧰 Bench kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { sfx.hiss(); begin(start(LEVELS[+b.dataset.l - 1])); }));
      $("ft-daily").onclick = () => { sfx.hiss(); const d = dailyOf(); begin(start(d.L, { seed: d.seed, daily: d.day })); };
      $("ft-speed").onclick = () => speed();
      $("ft-race").onclick = () => raceRoom();
      $("ft-show").onclick = () => { stopTimer(); if (table) { table.leave(); table = null; race = null; } openShow(ctx, () => lobby(false)); };
      $("ft-book").onclick = () => chart($("ft-book"));
      $("ft-shop").onclick = shop;
      $("back").onclick = () => { if (table) { table.leave(); table = null; race = null; } stopTimer(); greet(); };
    }
    function chart(btn) {
      const rb = $("reading-body"), on = !rb.querySelector(".ft-chart"); sfx.page();
      rb.innerHTML = on ? chartHtml(P(), esc) : ""; if (btn) btn.textContent = on ? "✕ Close" : "📓 Flame chart";
      if (on) rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // ---- a round ----
    const begin = (run) => { clearReading(); sfx.ignite(); show(run); };
    function bar(run) { const it = current(run);
      return `<div class="cx-top">Level ${run.L.n} · sample ${run.i + 1} / ${run.items.length} · tries ${"●".repeat(it.tries)}${"○".repeat(TRIES - it.tries)} · score ${run.score}${run.daily ? " · 📅 daily" : ""}</div>`; }
    function show(run, line, view = {}) {
      const L = run.L, it = current(run), x = itemOf(L, it.id);
      cap(`🔥 Level ${L.n} · sample ${run.i + 1}`);
      const flame = L.n === 1 ? x.flame : L.n === 2 ? NA.flame : null;
      const spec = L.n === 3 ? x : view.scope ? { lines: [...NA.lines, ...x.lines], bands: x.bands || [] } : null;
      draw({ flame, dip: !line, cobalt: view.cobalt ? { hex: x.cobaltHex } : null, spectrum: spec });
      if (!line) sfx.sizzle(SAMPLES.indexOf(x));
      const ask = L.n === 1 ? pick(["A salt on the loop, into the flame. Which element colours it?", "Watch the colour. Which element is it?", "Dip, flame, colour. Name the element."])
        : L.n === 2 ? "This wire wasn't cleaned properly. Sodium's yellow swamps everything. Something else is in there. What is it?"
        : `The spectroscope shows these lines. ${pick(["Which element made them?", "Whose fingerprint is this?", "Which element is it?"])}`;
      say(line || ask);
      const clue = L.n === 2 && view.cobalt ? `<div class="clue"><b>🔵 Through cobalt glass</b><span>The sodium yellow vanishes (cobalt glass absorbs it). What's left looks <b>${esc(x.cobalt)}</b>.</span></div>` : "";
      const hintTxt = it.hint ? (L.n === 3 ? `<div class="clue"><b>📜 Notebook</b><span>${esc(x.clue)}. Discovered or measured by ${esc(x.who)}, ${esc(x.when)}.</span></div>` : `<div class="clue"><b>🔭 Spectroscope</b><span>Sodium's yellow pair at 589 nm, plus the hidden metal's own lines.</span></div>`) : "";
      const specCard = L.n === 3 ? spectrumSvg(x) : view.scope ? spectrumSvg(spec) : "";
      ui(`${bar(run)}<div class="clues">${clue}${hintTxt}</div>${specCard}
        <div class="choices col">${it.choices.map((id) => `<button class="c" type="button" data-g="${id}" ${it.wrong.includes(id) ? "disabled" : ""}>${it.wrong.includes(id) ? "✗ " : ""}${esc(nameOf(L, id))}</button>`).join("")}</div>
        <div class="choices">${L.n === 2 && !view.cobalt ? `<button class="c" type="button" id="ft-cobalt">🔵 Hold up cobalt glass (free)</button>` : ""}${L.n === 2 && !it.hint && it.tries > 1 ? `<button class="c" type="button" id="ft-scope">🔭 Spectroscope (1 try)</button>` : ""}${L.n === 3 && !it.hint && it.tries > 1 ? `<button class="c" type="button" id="ft-hint">📜 Notebook clue (1 try)</button>` : ""}<button class="c small" type="button" id="ft-leave">Leave the bench</button></div>`);
      if ($("ft-cobalt")) $("ft-cobalt").onclick = () => { sfx.glass(); show(run, "You hold the blue glass up to the flame…", { ...view, cobalt: true }); };
      if ($("ft-scope")) $("ft-scope").onclick = () => { if (hint(run)) { sfx.scope(); show(run, "Through the spectroscope, the light splits into lines.", { ...view, scope: true }); } };
      if ($("ft-hint")) $("ft-hint").onclick = () => { if (hint(run)) { sfx.page(); show(run, "A note in Bunsen's hand…", view); } };
      $("ft-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => {
        const r = guess(run, b.dataset.g);
        if (r === "wrong") { sfx.wrong(); ctx.emote?.("think", { quiet: true }); return show(run, pick(["Not that one. Look again.", "No. The colour says otherwise.", "Close, but no."]), view); }
        if (r === "right") { sfx.right(); spark(); ctx.banter?.("mid"); }
        else sfx.wrong();
        reveal(run, r === "right", view);
      }));
    }
    function reveal(run, ok, view) {
      const L = run.L, it = current(run), x = itemOf(L, it.id);
      draw({ flame: L.n === 3 ? (SAMPLES.find((m) => m.sym === x.sym) || {}).flame || null : x.flame, cobalt: null, spectrum: L.n === 1 ? null : x });
      cap(`${x.sym} · ${x.name}`);
      const facts = L.n === 3 ? [x.story] : [`${x.name} burns ${x.colour}.`, x.fact];
      say(ok ? `Yes: ${x.name.toLowerCase()}.` : `It was ${x.name.toLowerCase()}.`);
      const last = run.i >= run.items.length - 1;
      ui(`${bar(run)}<div class="ft-card"><b>${L.n === 3 ? "🔭" : sw(x)} ${esc(x.name)} (${esc(x.sym)})${ok ? " ✓" : ""}</b>${facts.map((f) => `<p>${esc(f)}</p>`).join("")}${L.n < 3 ? `<p class="note">${esc(x.use)}</p>` : `<p class="note">${esc(x.who)}, ${esc(x.when)}</p>`}${L.n > 1 ? spectrumSvg(x) : ""}</div>
        <div class="choices"><button class="c main" type="button" id="ft-next">${last ? "🏁 Finish the round" : "🔥 Next sample"}</button></div>`);
      $("ft-next").onclick = () => { if (next(run)) { sfx.hiss(); show(run); } else finish(run); };
    }
    function finish(run) {
      const L = run.L, r = settle(P(), run), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("flametest", L.n, { won: r.won, perfect: r.won && perfect(run) }); // Trophy Case (trophies.js)
      sfx.finale(r.won); if (r.won) { spark(); chime(perfect(run) ? 3 : 1); }
      const n = rightCount(run), bits = [`<b>+${r.xp} ✦ · +${r.essence} 💎</b>`, `${n} / ${run.items.length} right`, `score ${run.score} / ${maxScore(L)}${r.best ? " · new best" : ""}`];
      if (perfect(run)) bits.push("✨ perfect round");
      let board = "";
      if (run.daily) { const res = { score: run.score, won: r.won, detail: `Level ${L.n} · ${n}/${run.items.length}` }, fd = finishDaily(P(), "flametest", res, run.daily); saveProgress();
        const fill = (b) => { const el = $("ft-board"); if (el) el.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: run.score } }); };
        (fd.first ? postDaily(state, "flametest", res) : boardOf(state, "flametest")).then(fill);
        if (fd.first) bits.push(`📅 daily streak ${fd.streak}`);
        board = `<div class="group">📅 Today's board</div><div id="ft-board" class="note">Loading the board…</div>`; }
      say(r.won ? pick(["The flame never lies.", "Bunsen would sign your notebook.", "Every colour, read correctly."]) : `${n} right. The colours take practice; the flame chart helps.`);
      const fresh = r.newSeen.length ? `<div class="up">🧪 New in your flame chart: ${r.newSeen.map((id) => esc(nameOf(L, id))).join(", ")}</div>` : "";
      ui(`<div class="reward"><div>${bits.join(" · ")}</div>${fresh}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>${board}
        <div class="ft-swatches">${run.items.map((it) => { const x = itemOf(L, it.id); return `<span>${L.n === 3 ? "🔭" : sw(x)}${esc(x.sym)} ${it.right ? "✓" : "✗"}</span>`; }).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="ft-again">🔥 Another Level ${L.n} round</button><button class="c" type="button" id="ft-lobby">📜 Choose a test</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ft-again").onclick = () => begin(start(L)); $("ft-lobby").onclick = () => lobby(false); $("back").onclick = greet;
    }

    // ---- speed round (also the race) ----
    function speed(seed = null, onDone = null) {
      stopTimer(); clearReading(); const deck = speedDeck(seed), L = LEVELS[0]; let i = 0, n = 0, left = SPEED_SECS, lock = false; const t0 = Date.now();
      cap("⏱ Speed round"); say(`Name as many flames as you can in ${SPEED_SECS} seconds. Go!`); sfx.ignite();
      const card = () => { const d = deck[i % deck.length], x = sample(d.id); draw({ flame: x.flame, dip: true }); sfx.sizzle(i);
        ui(`<div class="cx-top ft-timer${left <= 10 ? " low" : ""}" id="ft-t">⏱ ${left}s · ✓ ${n}</div><div class="choices col">${d.choices.map((id) => `<button class="c" type="button" data-s="${id}">${esc(sample(id).name)}</button>`).join("")}</div>`);
        $("ui").querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => { if (lock || left <= 0) return;
          if (b.dataset.s === d.id) { n++; sfx.right(); i++; card(); } else { sfx.wrong(); lock = true; b.disabled = true; setTimeout(() => { lock = false; i++; if (left > 0) card(); }, 700); } })); };
      card();
      timer = setInterval(() => { if (!alive()) return stopTimer(); left--; const el = $("ft-t"); if (el) { el.textContent = `⏱ ${left}s · ✓ ${n}`; el.classList.toggle("low", left <= 10); } if (left <= 5 && left > 0) sfx.tick(left <= 3);
        if (left <= 0) { stopTimer(); sfx.finale(n >= 10); const res = { n, t: Date.now() - t0 }; return onDone ? onDone(res) : speedDone(n); } }, 1000);
    }
    function speedDone(n) {
      const lg = logSpeed(P(), n); award(lg.pay, lg.pay); saveProgress(); showStats(); if (lg.best) { spark(); chime(2); }
      ctx.banter?.(n >= 10 ? "win" : "mid");
      say(lg.best ? `${n} flames! A new personal best.` : `${n} flames in ${SPEED_SECS} seconds.`);
      ui(`<div class="reward"><div><b>+${lg.pay} ✦ · +${lg.pay} 💎</b> · ${n} named · best ${R().speed}</div></div>
        <div class="choices"><button class="c main" type="button" id="ft-again">⏱ Again</button><button class="c" type="button" id="ft-lobby">📜 Choose a test</button></div>`);
      $("ft-again").onclick = () => speed(); $("ft-lobby").onclick = () => lobby(false);
    }

    // ---- race friends in the call: everyone gets the same speed deck; the host collects the counts ----
    const raceTop = () => `<div class="cx-top">⚔️ Flame race · ${table ? table.members.length : 0} in the call${table && table.host ? ` · host ${esc(table.nameOf(table.host))}` : ""}</div>`;
    async function raceRoom(line) {
      if (!table) {
        say("Lighting the race burners…"); ui(`<div class="note">Joining the call's table…</div>`);
        try { table = await joinTable("flametest", state); wire(); }
        catch (e) { say(e.message || "Racing needs a Discord voice call."); ui(`<div class="choices"><button class="c" type="button" id="ft-lobby">📜 Back to the bench</button></div>`); $("ft-lobby").onclick = () => lobby(false); return; }
      }
      const host = table.isHost();
      say(line || (host ? `You're hosting, ${state.name}. Start when everyone is in. Same flames for everyone, ${SPEED_SECS} seconds.` : `Waiting for ${table.nameOf(table.host)} to start the race.`));
      ui(`${raceTop()}<div class="chips">${table.members.map((m) => `<span>${m.id === table.me.id ? "🧑‍🔬 " : ""}${esc(m.name)}</span>`).join("")}</div>
        <div class="choices">${host ? `<button class="c main" type="button" id="ft-go" ${table.members.length < 2 ? "disabled" : ""}>🔥 Start the race</button>` : ""}<button class="c" type="button" id="ft-rleave">Leave the race</button></div>`);
      if ($("ft-go")) $("ft-go").onclick = () => { const seed = (Math.random() * 2 ** 31) >>> 0; table.to("*", { k: "go", seed }); startRace(seed); };
      $("ft-rleave").onclick = () => { table.leave(); table = null; race = null; lobby(false); };
    }
    function wire() {
      table.on("members", () => { if (race && !race.over) { if (table.isHost()) maybeEnd(); } else if (alive() && $("ft-rleave")) raceRoom(); });
      table.on("host", () => { if (race && !race.over) maybeEnd(); else if ($("ft-rleave")) raceRoom(); });
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
    function maybeEnd() { if (!table || !race) return; const here = table.members.map((m) => m.id); if (here.every((id) => race.results[id])) finishRace(); }
    function finishRace() { if (!race || race.over || !table) return; const rows = raceRank(race.results); table.to("*", { k: "result", rows }); showResult(rows); }
    function showResult(rows) {
      if (!race || race.over) { if (!race) race = { over: false }; else return; } race.over = true;
      const me = table && rows.find((r) => r.id === table.me.id), win = me && me.place === 1 && rows.length >= 2;
      if (me) { const lg = logSpeed(P(), me.n); award(lg.pay + (win ? RACE_WIN : 0), lg.pay + (win ? RACE_WIN : 0)); saveProgress(); showStats(); }
      if (win) { spark(); chime(2); }
      say(win ? `You won the flame race, ${state.name}!` : me ? `You placed ${me.place} of ${rows.length}.` : "The race is over.");
      ui(`${raceTop()}<ol class="ft-rank">${rows.map((r) => `<li>${esc(r.name)} · ${r.n} flame${r.n === 1 ? "" : "s"}${r.place === 1 ? " 🏆" : ""}</li>`).join("")}</ol>
        ${me ? `<div class="reward"><div><b>+${me.n * SPEED_PAY + (win ? RACE_WIN : 0)} ✦ 💎</b>${win ? ` · +${RACE_WIN} for the win` : ""}</div></div>` : ""}
        <div class="choices"><button class="c main" type="button" id="ft-rroom">⚔️ Race again</button><button class="c" type="button" id="ft-lobby">📜 Back to the bench</button></div>`);
      $("ft-rroom").onclick = () => { race = null; raceRoom(); }; $("ft-lobby").onclick = () => lobby(false);
    }

    // ---- the bench kit shelf ----
    function shop(msg) {
      clearReading(); cap("🧰 Bench kit"); const look = lookOf(P()); draw({ flame: sample("sr").flame });
      say(typeof msg === "string" ? msg : `Burners, wire loops and spectroscopes, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="ft-lobby">🔥 Back to the bench</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. A few rounds at the burner will fix that.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.glass(); shop(r === "bought" ? "Good kit. It's on your bench." : "Swapped in."); } }));
      $("ft-lobby").onclick = () => lobby(false);
    }

    lobby(true);
  },
};

/** The flame chart (reading area): every flame colour and spectrum, the ones you have identified marked. */
export function chartHtml(p, esc) {
  const r = ftOf(p), seen = (k) => r.seen.includes(k);
  return `<div class="ft-chart"><h3>📓 Flame chart</h3><p class="note">A salt on a clean wire, held in a hot, nearly colourless flame. The heat excites the metal's atoms (or small molecules made in the flame), and they give off light at their own wavelengths.</p>
    ${SAMPLES.map((s) => `<div class="ft-card"><b><i class="ft-sw" style="background:${s.flame[1]};color:${s.flame[1]}"></i>${esc(s.name)} (${esc(s.sym)}) · ${esc(s.colour)}${seen("f:" + s.id) ? " ✓" : ""}</b><p>${esc(s.fact)}</p>${s.cobalt ? `<p class="note">Through cobalt glass: ${esc(s.cobalt)}.</p>` : ""}${spectrumSvg(s, { h: 30 })}</div>`).join("")}
    <h3>🔭 Lines that found new elements</h3>${SPECTRA.filter((s) => !SAMPLES.some((x) => x.sym === s.sym)).map((s) => `<div class="ft-card"><b>${esc(s.name)} (${esc(s.sym)}) · ${esc(s.who)}, ${esc(s.when)}${seen("s:" + s.id) ? " ✓" : ""}</b><p>${esc(s.story)}</p>${spectrumSvg(s, { h: 30 })}</div>`).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function flametestCodex(p, esc) {
  const r = ftOf(p), all = SAMPLES.length + SPECTRA.length;
  return `<div class="cx"><div class="cx-h"><span>🔥 Flame Test Lab</span><span class="note">${r.seen.length} / ${all} identified · speed best ${r.speed}</span></div><div class="bar"><i style="width:${(r.seen.length / all) * 100}%"></i></div>
    <div class="chips">${LEVELS.map((L) => `<span>Level ${L.n}: ${r.wins[L.n] || 0} won · best ${r.best[L.n] || 0}</span>`).join("")}</div></div>`;
}
