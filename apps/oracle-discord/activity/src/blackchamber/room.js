// The Black Chamber: a room of the Oracle Chamber (the Scriptorium's cipher duel). A real line, hidden in a
// substitution cipher, against a real codebreaker's clock. Tap a cipher letter, then the letter you think it hides.
// Count letters (al-Kindi's method), spot short words, break it before the rival does. Duel friends in a call.
import { LEVELS, RIVALS, HINT_COST, ETAOIN, rivalOf } from "./data.js";
import { room as bcOf, start, assign, wrongOnes, solved, hint, left, finishDuel, settle, counts, duelRank, dailyOf } from "./logic.js";
import { lineOf } from "../cipherdesk/logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { chamberHtml, boardHtml, countsHtml, keysHtml, CSS } from "./scene.js";
import * as sfx from "../cipherdesk/sfx.js";
import { tick } from "../inscriptions/sfx.js";
import { joinTable } from "../net.js";
import { host } from "../hosts/index.js";
import { finishDaily, postDaily, boardOf, boardHtml as dailyBoard, dailyState } from "../daily.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("bc-style")) return; const s = document.createElement("style"); s.id = "bc-style"; s.textContent = CSS(); document.head.append(s); };

export const blackchamber = {
  id: "blackchamber", label: "Black Chamber", emoji: "🕯️",
  blurb: "Break substitution ciphers against history's codebreakers",
  shop: { kind: "blackchamber", label: "🕯️ Black Chamber", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table blackchamber";
      tableEl.innerHTML = chamberHtml({ look: { ...DEFAULT_LOOK, [it.slot]: id }, rival: RIVALS[0], frac: 0.6 }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => bcOf(P());
    const alive = () => tableEl.classList.contains("blackchamber");
    const draw = (s) => { tableEl.className = "table blackchamber"; tableEl.innerHTML = chamberHtml({ look: lookOf(P()), ...s }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const wren = () => host().id === "scriptorium";
    let timer = null, table = null, duel = null;
    const stop = () => { if (timer) clearInterval(timer); timer = null; };

    // ---- lobby ----
    function lobby(first) {
      stop(); clearReading(); cap("🕯️ The Black Chamber"); draw({ rival: RIVALS[R().beaten.length % RIVALS.length], label: `${R().beaten.length} / ${RIVALS.length} rivals beaten` }); sfx.unfold();
      say(first && !R().plays
        ? (wren() ? `The Black Chamber, ${state.name}. Every state in Europe had one: a room where the post was opened, copied, resealed and read. Here, the letters use a substitution cipher. Count the letters, guess the short words, and beat the codebreaker's clock.`
          : `Welcome to the Black Chamber, ${state.name}. A real line, hidden by swapping every letter for another. Break it before a famous codebreaker does.`)
        : pick([`Fresh post from the embassy, ${state.name}. Kettle's on for the seals.`, "Another intercept. Who wants to race Phelippes?", "The knife's warm. Let's read someone's letters."]));
      const r = R(), dd = dailyOf(), ds = dailyState(P(), "blackchamber");
      const lvl = (L) => { const pair = RIVALS.filter((x) => x.lvl === L.n);
        return `<button class="c level" type="button" data-l="${L.n}"><b>${"🕯️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · rivals: ${pair.map((x) => `${r.beaten.includes(x.id) ? "✓ " : ""}${esc(x.name)} (${Math.floor(x.secs / 60)}:${String(x.secs % 60).padStart(2, "0")})`).join(", ")}</span></button>`; };
      ui(`<div class="cx-top"><b>🕯️ Black Chamber</b> · ${r.beaten.length} / ${RIVALS.length} rivals beaten · ${r.broken.length} ciphers broken</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">Tap a cipher letter, then the plain letter you think it hides. A hint fixes the commonest unsolved letter and costs ${HINT_COST} seconds.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="bc-daily"><b>📅 Daily Intercept${ds.played ? " · done ✓" : ""}</b><span>Today: Level ${dd.L.n}, the same cipher for everyone${ds.streak ? ` · streak ${ds.streak}` : ""}</span></button>
        <div class="choices"><button class="c main" type="button" id="bc-duel">⚔️ Duel friends</button><button class="c" type="button" id="bc-shop">🧰 Chamber kit</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => play(start(LEVELS[+b.dataset.l - 1], { beaten: R().beaten }))));
      $("bc-daily").onclick = () => { const d = dailyOf(); play(start(d.L, { seed: d.seed, daily: d.day })); };
      $("bc-duel").onclick = () => duelRoom();
      $("bc-shop").onclick = shop;
      $("back").onclick = () => { if (table) { table.leave(); table = null; duel = null; } stop(); greet(); };
    }

    // ---- a duel against the clock (also used for friend duels, with onDone) ----
    function play(d, onDone = null) {
      stop(); clearReading(); const rv = rivalOf(d.rival), t0 = Date.now(); let sel = null;
      const el = () => (Date.now() - t0) / 1000;
      cap(`🕯️ ${onDone ? "Duel" : rv.name}`); sfx.unfold();
      say(onDone ? "Same intercept for everyone. First to break it wins." : `${rv.name} is on the same letter. ${rv.line}`);
      const paint = () => {
        const tl = onDone ? null : left(d, el());
        draw({ rival: rv, frac: onDone ? 1 : tl / d.secs });
        const used = Object.values(d.guess);
        ui(`<div class="cx-top bc-tbar${tl !== null && tl <= 20 ? " low" : ""}"><span>Level ${d.L.n}${d.daily ? " · 📅 daily" : ""}${d.hints ? ` · ${d.hints} hint${d.hints === 1 ? "" : "s"}` : ""}</span><b id="bc-t">${tl === null ? "⚔️ race" : `⏳ ${tl}s`}</b></div>
          ${boardHtml(d, sel, lookOf(P()))}${keysHtml(used)}${countsHtml(counts(d.text), ETAOIN)}
          <div class="choices"><button class="c small" type="button" id="bc-hint">💡 Hint (−${HINT_COST}s)</button><button class="c small" type="button" id="bc-quit">Give up</button></div>`);
        $("ui").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { sel = b.dataset.c; sfx.click(); paint(); }));
        $("ui").querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => {
          if (!sel) return say("Tap a cipher letter on the sheet first.");
          if (assign(d, sel, b.dataset.p)) { sfx.scratch(); if (solved(d)) return done(); const k = [...new Set(d.text.replace(/[^A-Z]/g, ""))]; sel = k.find((c) => !d.guess[c] && c !== sel) || sel; paint(); }
          else say("That letter's already pinned down.");
        }));
        $("bc-hint").onclick = () => { const c = hint(d); if (c) { sfx.decode(3); say(`${c} is ${d.guess[c]}. That cost you ${HINT_COST} seconds.`); if (solved(d)) return done(); paint(); } };
        $("bc-quit").onclick = () => done(true);
      };
      const done = (quit = false) => { stop(); finishDuel(d, quit ? d.secs + 999 : el()); if (quit) d.won = false; onDone ? onDone(d) : result(d); };
      paint();
      timer = setInterval(() => { if (!alive()) return stop(); if (onDone) return; const tl = left(d, el()), t = $("bc-t");
        if (t) { t.textContent = `⏳ ${tl}s`; t.parentElement.classList.toggle("low", tl <= 20); }
        if (tl <= 10 && tl > 0) tick(tl <= 3);
        if (tl <= 0) done(); }, 1000);
    }
    function result(d) {
      const rv = rivalOf(d.rival), ln = lineOf(d.line), r = settle(P(), d), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("blackchamber", d.L.n, { won: r.won, perfect: r.won && !d.hints }); // Trophy Case (trophies.js)
      draw({ rival: rv, frac: d.won ? left(d, d.used) / d.secs : 0, state: d.won ? "won" : "lost", label: d.won ? "broken" : `${rv.name} got there first` });
      sfx.finale(d.won); if (d.won) { spark(); chime(d.hints ? 1 : 3); ctx.banter?.("win"); } else ctx.banter?.("lose");
      say(d.won ? pick([`Broken, with ${left(d, d.used)} seconds to spare. ${rv.name} tips their hat.`, "Read before the rival. The chamber is yours today.", "Plain words again. Reseal it and send it on."]) : `${rv.name} broke it first. ${rv.line}`);
      let board = "";
      if (d.daily) { const res = { score: d.score, won: d.won, detail: `Level ${d.L.n} · ${Math.round(d.used)}s` }, fd = finishDaily(P(), "blackchamber", res, d.daily); saveProgress();
        const fill = (b) => { const e = $("bc-board"); if (e) e.innerHTML = dailyBoard(b, esc, { unit: "pts", local: { score: d.score } }); };
        (fd.first ? postDaily(state, "blackchamber", res) : boardOf(state, "blackchamber")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="bc-board" class="note">Loading the board…</div>`; }
      ui(`<div class="reward"><div><b>+${r.xp} ✦ · +${r.essence} 💎</b>${d.won ? ` · ${Math.round(d.used)}s` : ""}${d.hints ? "" : d.won ? " · ✨ no hints" : ""}</div>${r.newRival ? `<div class="up">🏅 First win over ${esc(rv.name)}</div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="in-card"><b>“${esc(ln.plain)}”</b><p>${esc(ln.fact)}</p><p class="note">${rv.e} ${esc(rv.name)}, ${esc(rv.when)}: ${esc(rv.fact)}</p></div>${board}
        <div class="choices"><button class="c main" type="button" id="bc-again">🕯️ Another Level ${d.L.n} intercept</button><button class="c" type="button" id="bc-lobby">🗂 Choose a level</button></div>`);
      $("bc-again").onclick = () => play(start(d.L, { beaten: R().beaten })); $("bc-lobby").onclick = () => lobby(false);
    }

    // ---- duel friends in the call: same cipher, fastest break wins; the host collects ----
    const top = () => `<div class="cx-top">⚔️ Cipher duel · ${table ? table.members.length : 0} in the call${table && table.host ? ` · host ${esc(table.nameOf(table.host))}` : ""}</div>`;
    async function duelRoom(line) {
      if (!table) {
        say("Setting out the intercepts…"); ui(`<div class="note">Joining the call's table…</div>`);
        try { table = await joinTable("blackchamber", state); wire(); }
        catch (e) { say(e.message || "Duels need a Discord voice call."); ui(`<div class="choices"><button class="c" type="button" id="bc-lobby">🕯️ Back to the chamber</button></div>`); $("bc-lobby").onclick = () => lobby(false); return; }
      }
      const isHost = table.isHost();
      say(line || (isHost ? `You're hosting, ${state.name}. Start when everyone's in. Same cipher for all, Level 2 help.` : `Waiting for ${table.nameOf(table.host)} to start.`));
      ui(`${top()}<div class="chips">${table.members.map((m) => `<span>${m.id === table.me.id ? "🕯️ " : ""}${esc(m.name)}</span>`).join("")}</div>
        <div class="choices">${isHost ? `<button class="c main" type="button" id="bc-go" ${table.members.length < 2 ? "disabled" : ""}>⚔️ Start the duel</button>` : ""}<button class="c" type="button" id="bc-dleave">Leave</button></div>`);
      if ($("bc-go")) $("bc-go").onclick = () => { const seed = (Math.random() * 2 ** 31) >>> 0; table.to("*", { k: "go", seed }); startDuel(seed); };
      $("bc-dleave").onclick = () => { table.leave(); table = null; duel = null; lobby(false); };
    }
    function wire() {
      table.on("members", () => { if (duel && !duel.over) { if (table.isHost()) maybeEnd(); } else if (alive() && $("bc-dleave")) duelRoom(); });
      table.on("host", () => { if (duel && !duel.over) maybeEnd(); });
      table.on("msg", ({ from, m }) => {
        if (!m || typeof m !== "object") return;
        if (m.k === "go" && from === table.host && (!duel || duel.over)) startDuel(m.seed >>> 0);
        else if (m.k === "done" && table.isHost() && duel) record(from, m.r);
        else if (m.k === "result" && from === table.host) showDuel(m.rows);
      });
      table.on("close", () => { table = null; if (duel && !duel.over) { duel.over = true; say("The duel table closed."); } });
    }
    function startDuel(seed) {
      duel = { results: {}, over: false };
      play(start(LEVELS[1], { seed }), (d) => { if (!table) return lobby(false);
        const res = { ok: d.won || solved(d), t: Math.round(d.used), right: Object.keys(d.guess).length - wrongOnes(d).length };
        say("Done! Waiting for the others…"); ui(`${top()}<div class="note">${res.ok ? `Broken in ${res.t}s.` : "Not broken."} Waiting for everyone…</div>`);
        if (table.isHost()) record(table.me.id, res); else table.up({ k: "done", r: res }); });
      if (table && table.isHost()) setTimeout(() => { if (duel && !duel.over) finishAll(); }, 6 * 60 * 1000);
    }
    function record(id, r) { if (!duel || duel.over || !r) return; duel.results[id] = { ok: !!r.ok, t: Math.max(0, +r.t || 0), right: +r.right || 0, name: table.nameOf(id) }; maybeEnd(); }
    function maybeEnd() { if (table && duel && table.members.every((m) => duel.results[m.id])) finishAll(); }
    function finishAll() { if (!duel || duel.over || !table) return; const rows = duelRank(duel.results); table.to("*", { k: "result", rows }); showDuel(rows); }
    function showDuel(rows) {
      if (!duel) duel = { over: false }; else if (duel.over) return; duel.over = true;
      const me = table && rows.find((x) => x.id === table.me.id), win = me && me.place === 1 && me.ok && rows.length >= 2, pay = win ? 30 : me && me.ok ? 10 : 2;
      if (me) { award(pay, pay); saveProgress(); showStats(); }
      if (win) { spark(); chime(2); sfx.finale(true); }
      say(win ? `You broke it first, ${state.name}!` : me ? `You placed ${me.place} of ${rows.length}.` : "The duel is over.");
      ui(`${top()}<ol class="in-rank">${rows.map((x) => `<li>${esc(x.name)} · ${x.ok ? `broken in ${x.t}s` : "not broken"}${x.place === 1 && x.ok ? " 🏆" : ""}</li>`).join("")}</ol>
        ${me ? `<div class="reward"><div><b>+${pay} ✦ 💎</b></div></div>` : ""}
        <div class="choices"><button class="c main" type="button" id="bc-dagain">⚔️ Duel again</button><button class="c" type="button" id="bc-lobby">🕯️ Back to the chamber</button></div>`);
      $("bc-dagain").onclick = () => { duel = null; duelRoom(); }; $("bc-lobby").onclick = () => lobby(false);
    }

    // ---- the chamber kit shelf ----
    function shop(msg) {
      stop(); clearReading(); cap("🧰 Chamber kit"); const look = lookOf(P()); draw({ rival: RIVALS[0], frac: 0.6 });
      say(typeof msg === "string" ? msg : `Worksheets, tiles and timers, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><br><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="bc-lobby">🕯️ Back to the chamber</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. Beat a rival or two.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.click(); shop(r === "bought" ? "Good kit. It's on your table." : "Swapped in."); } }));
      $("bc-lobby").onclick = () => lobby(false);
    }

    lobby(true);
  },
};

/** Codex page: rivals beaten and ciphers broken. */
export function blackchamberCodex(p, esc) {
  const r = bcOf(p);
  return `<div class="note">🕯️ Black Chamber: ${r.beaten.length} / ${RIVALS.length} rivals beaten · ${r.broken.length} ciphers broken · best ${LEVELS.map((L) => `L${L.n} ${r.best[L.n] || 0}`).join(", ")}</div>
    <div class="chips">${RIVALS.map((x) => `<span>${r.beaten.includes(x.id) ? "✓" : "·"} ${x.e} ${esc(x.name)} (${esc(x.when)})</span>`).join("")}</div>`;
}
