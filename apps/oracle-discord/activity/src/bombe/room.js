// The Bombe Room: a room of the Oracle Chamber (Scriptorium game). Break a real Enigma message the Bletchley way:
// slide the crib until no letter sits on itself, run the bombe over the wheel orders until it stops, then read the
// German. The Enigma here is a true Enigma I without its plugboard, so the bombe's search is real and quick.
import { MESSAGES, LEVELS, HOURS, FACTS } from "./data.js";
import { room as boOf, start, slide, place, run, read, plain, clashes, perfect, settle, maxScore, msgOf, dailyOf } from "./logic.js";
import { SHOP, SLOTS, SHELF_TALK, DEFAULT_LOOK, shopItem, owns, lookOf, buyOrUse } from "./shop.js";
import { hutHtml, stripHtml, CSS } from "./scene.js";
import * as sfx from "../cipherdesk/sfx.js";
import { host } from "../hosts/index.js";
import { finishDaily, postDaily, boardOf, boardHtml, dailyState } from "../daily.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const styleOnce = () => { if (document.getElementById("bo-style")) return; const s = document.createElement("style"); s.id = "bo-style"; s.textContent = CSS(); document.head.append(s); };
const clock = (n) => "🕐".repeat(Math.max(0, n)) + "▫️".repeat(Math.max(0, HOURS - n));
const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export const bombe = {
  id: "bombe", label: "Bombe Room", emoji: "⚙️",
  blurb: "Break a real Enigma message with a crib and a bombe",
  shop: { kind: "bombe", label: "⚙️ Bombe Room", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })), talk: SHELF_TALK,
    preview(id, { tableEl, cap }) { const it = shopItem(id); if (!it) return; styleOnce(); tableEl.className = "table bombe";
      tableEl.innerHTML = hutHtml({ look: { ...DEFAULT_LOOK, [it.slot]: id } }); cap && cap("👁 " + it.name); } },
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl } = ctx;
    styleOnce();
    const P = () => state.prog, R = () => boOf(P());
    const draw = (s) => { tableEl.className = "table bombe"; tableEl.innerHTML = hutHtml({ look: lookOf(P()), ...s }); };
    const spark = () => { const tp = $("table-pane"); if (tp) { tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); } };
    const wren = () => host().id === "scriptorium";
    let busy = false;

    function lobby(first) {
      busy = false; clearReading(); cap("⚙️ The Bombe Room"); draw({ label: `${R().read.length} / ${MESSAGES.length} messages read` }); sfx.unfold();
      say(first && !R().plays
        ? (wren() ? `Hut 6, ${state.name}, and tonight's intercepts. Enigma never turns a letter into itself, and that one flaw is our way in. Slide your guess along the cipher, then let the bombe do the rest.`
          : `Welcome to the Bombe Room, ${state.name}. Break a real Enigma message: place the crib, run the bombe, read the German.`)
        : pick([`Fresh intercepts, ${state.name}. The key changed at midnight.`, "The bombes are warm. Find me a crib.", "Weather report or nothing to report? Let's see."]));
      const r = R(), dd = dailyOf(), ds = dailyState(P(), "bombe");
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"⚙️".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)}${r.best[L.n] ? ` · best ${r.best[L.n]}` : ""}</span></button>`;
      ui(`<div class="cx-top"><b>⚙️ Bombe Room</b> · ${r.read.length} / ${MESSAGES.length} messages read</div><div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="note">${HOURS} hours before the key goes stale. A crib in the wrong place, a wheel order with no stop or a misread message costs an hour.</div>
        <button class="c level${ds.played ? " done" : ""}" type="button" id="bo-daily"><b>📅 Daily Intercept${ds.played ? " · done ✓" : ""}</b><span>Today: Level ${dd.L.n}, the same message for everyone${ds.streak ? ` · streak ${ds.streak}` : ""}</span></button>
        <div class="choices"><button class="c" type="button" id="bo-shop">🧰 Hut stores</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => crib(start(LEVELS[+b.dataset.l - 1]))));
      $("bo-daily").onclick = () => { const d = dailyOf(); crib(start(d.L, { seed: d.seed, daily: d.day })); };
      $("bo-shop").onclick = shop;
      $("back").onclick = greet;
    }
    const bar = (g) => `<div class="cx-top">Level ${g.L.n} · hours ${clock(g.hours)}${g.daily ? " · 📅 daily" : ""}</div>`;

    function crib(g, line) {
      clearReading(); cap("⚙️ Place the crib"); draw({ label: "the crib" });
      const n = clashes(g.cipher, g.crib, g.slide).length;
      say(line || `The crib is ${g.crib}. Slide it along. ${FACTS.self}`);
      ui(`${bar(g)}<div class="note">Crib: <b>${esc(g.crib)}</b> at position ${g.slide + 1} · ${n ? `<b style="color:#e8483b">${n} letter${n > 1 ? "s" : ""} on ${n > 1 ? "themselves" : "itself"}</b>` : "no letter on itself"}</div>
        ${stripHtml(g.cipher, g.crib, g.slide, { lo: g.lo, hi: g.hi })}
        <div class="choices"><button class="c" type="button" id="bo-l" ${g.slide <= g.lo ? "disabled" : ""}>◀ Slide</button><button class="c main" type="button" id="bo-place">📌 Place the crib here</button><button class="c" type="button" id="bo-r" ${g.slide >= g.hi ? "disabled" : ""}>Slide ▶</button></div>
        <div class="choices"><button class="c small" type="button" id="bo-leave">Leave the hut</button></div>`);
      $("bo-l").onclick = () => { slide(g, -1); sfx.click(false); crib(g, " "); };
      $("bo-r").onclick = () => { slide(g, 1); sfx.click(true); crib(g, " "); };
      $("bo-leave").onclick = () => lobby(false);
      $("bo-place").onclick = () => { const r = place(g);
        if (r === "right") { sfx.scratch(); ctx.banter?.("mid"); return wheels(g, `Crib placed. Now the bombe. ${g.L.orders > 1 ? "Which wheel order? Each run takes an hour if it finds nothing." : "The wheel order came in from Hut 6: run it."}`); }
        sfx.wrong(); ctx.emote?.("think", { quiet: true }); if (r === "lost") return done(g);
        crib(g, "Look at the red letters. Enigma can't do that, so the crib can't go there."); };
    }

    function wheels(g, line, drums) {
      clearReading(); cap("⚙️ Run the bombe"); draw({ label: "the bombe", drums: drums || ["A", "A", "A"] });
      say(line || "Choose a wheel order and run the bombe.");
      const shown = g.L.orders === 1 ? [g.order] : g.orders;
      ui(`${bar(g)}${stripHtml(g.cipher, g.crib, g.at, { lo: g.at, hi: g.at })}
        <div class="group">Wheel order (left · middle · right)</div><div class="bo-wheels">${shown.map((o) => `<button class="c" type="button" data-o="${o}" ${g.tried.includes(o) ? "disabled" : ""}>${g.tried.includes(o) ? "✗ " : "▶ "}${o.replace(/-/g, " · ")}</button>`).join("")}</div>
        <div class="note">${esc(FACTS.bombe)}</div>
        <div class="choices"><button class="c small" type="button" id="bo-leave">Leave the hut</button></div>`);
      $("bo-leave").onclick = () => lobby(false);
      $("ui").querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => {
        if (busy) return; busy = true; const o = b.dataset.o, res = run(g, o);
        $("ui").querySelectorAll("[data-o]").forEach((x) => (x.disabled = true));
        draw({ label: `running ${o}`, spin: true, drums: ["?", "?", "?"] }); sfx.decode(14);
        setTimeout(() => { busy = false;
          if (res.result === "stop") { sfx.right(); spark(); ctx.banter?.("mid"); return message(g, `Stop! The drums read ${g.stop}. ${FACTS.turing}`); }
          sfx.wrong(); if (res.result === "lost") return done(g);
          wheels(g, `${o.replace(/-/g, " ")}: all 17,576 positions, no stop. Wrong wheel order. ${FACTS.orders}`, ["–", "–", "–"]);
        }, reduced() ? 200 : 1600);
      }));
    }

    function message(g, line) {
      const pt = plain(g); clearReading(); cap("⚙️ Read the German"); draw({ label: "stop", state: "stop", drums: [...g.stop] });
      say(line || "What does it say?");
      ui(`${bar(g)}<div class="note">Key: wheels ${esc(g.order.replace(/-/g, " "))}, start <b>${esc(g.stop)}</b></div>
        <div class="in-card"><p><b>${esc(pt.replace(/X/g, " "))}</b></p></div>
        <div class="group">What does the message say?</div><div class="choices col">${g.meanings.map((id) => { const bad = g.wrongMeaning.includes(id); return `<button class="c" type="button" data-m="${id}" ${bad ? "disabled" : ""}>${bad ? "✗ " : ""}${esc(msgOf(id).en)}</button>`; }).join("")}</div>`);
      $("ui").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { const r = read(g, b.dataset.m);
        if (r === "right") return done(g);
        sfx.wrong(); if (r === "lost") return done(g);
        message(g, "Not quite. Look for WETTER (weather), KEINE (no) and the place names."); }));
    }

    function done(g) {
      const m = msgOf(g.msg), r = settle(P(), g), aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("bombe", g.L.n, { won: r.won, perfect: perfect(g) }); // Trophy Case (trophies.js)
      draw({ label: g.won ? "broken" : "the key went stale", state: g.won ? "won" : "lost", drums: g.won ? [...g.key] : ["–", "–", "–"] });
      sfx.finale(g.won); if (g.won) { spark(); chime(perfect(g) ? 3 : 1); ctx.banter?.("win"); } else ctx.banter?.("lose");
      say(g.won ? pick(["Broken. Send it up to Hut 3 for translation.", "That's the day's key. Every message on it is ours now.", "Another one read before breakfast."]) : "Out of time. The key changes at midnight, and we start again.");
      let board = "";
      if (g.daily) { const res = { score: g.score, won: g.won, detail: `Level ${g.L.n}` }, fd = finishDaily(P(), "bombe", res, g.daily); saveProgress();
        const fill = (b) => { const e = $("bo-board"); if (e) e.innerHTML = boardHtml(b, esc, { unit: "pts", local: { score: g.score } }); };
        (fd.first ? postDaily(state, "bombe", res) : boardOf(state, "bombe")).then(fill);
        board = `<div class="group">📅 Today's board</div><div id="bo-board" class="note">Loading the board…</div>`; }
      ui(`<div class="reward"><div><b>+${r.xp} ✦ · +${r.essence} 💎</b> · score ${g.score} / ${maxScore(g.L)}${perfect(g) ? " · ✨ not an hour wasted" : ""}</div>${r.newMsg ? `<div class="up">📨 New message read</div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="in-card"><b>📨 ${esc(m.text.replace(/X/g, " "))}</b><p>${esc(m.en)}</p><p>${esc(m.fact)}</p><p class="note">Key: wheels ${esc(g.order.replace(/-/g, " "))}, start ${esc(g.key)}. ${esc(FACTS.plug)}</p></div>${board}
        <div class="choices"><button class="c main" type="button" id="bo-again">⚙️ Another Level ${g.L.n} intercept</button><button class="c" type="button" id="bo-lobby">🗂 Choose a level</button></div>`);
      $("bo-again").onclick = () => crib(start(g.L)); $("bo-lobby").onclick = () => lobby(false);
    }

    function shop(msg) {
      clearReading(); cap("🧰 Hut stores"); const look = lookOf(P()); draw({ label: "stores" });
      say(typeof msg === "string" ? msg : `Machines, bombes and huts, ${state.name}. Paid in Essence.`);
      ui(`<div class="cx-top">💎 ${P().essence || 0} Essence</div>${SLOTS.map(([k, label]) => `<div class="group">${label}</div><div class="choices col">${SHOP.filter((s) => s.slot === k).map((s) => {
        const have = owns(P(), s.id), on = look[k] === s.id;
        return `<button class="c al-buy${on ? " on" : ""}" type="button" data-b="${s.id}" ${on ? "disabled" : ""}><b>${esc(s.name)}</b> <span class="note">${on ? "✓ in use" : have ? "owned · use it" : `💎 ${s.price}`}</span><br><small>${esc(s.note)}</small></button>`; }).join("")}</div>`).join("")}
        <div class="choices"><button class="c" type="button" id="bo-lobby">⚙️ Back to the hut</button></div>`);
      $("ui").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => { const r = buyOrUse(P(), b.dataset.b);
        if (r === "poor") return shop("Not enough Essence yet. Break a message or two.");
        if (r) { saveProgress(); showStats(); r === "bought" ? sfx.coins() : sfx.click(); shop(r === "bought" ? "It's in the hut." : "Swapped in."); } }));
      $("bo-lobby").onclick = () => lobby(false);
    }

    lobby(true);
  },
};

/** Codex page: messages read and best scores. */
export function bombeCodex(p, esc) {
  const r = boOf(p);
  return `<div class="note">⚙️ Bombe Room: ${r.read.length} / ${MESSAGES.length} messages read · best ${LEVELS.map((L) => `L${L.n} ${r.best[L.n] || 0}`).join(", ")}</div>
    <div class="chips">${MESSAGES.map((x) => `<span>${r.read.includes(x.id) ? "✓" : "·"} ${esc(x.en.split(":")[0])}</span>`).join("")}</div>`;
}
