// Comet Hunter: a room of the Chamber (Keeper Altair's House, #🔭-observatory). Blink plates, catch what moved, tell
// comets from Messier objects, and predict returns like Halley. Logic in engine.js; this file draws and wires it.
// Trophy levels: C.trophy("comet", level, { won, perfect }) at the end of each run. Daily: one Level 1 run a day.
import { room as CR, ROUNDS, PASS, roundOf, hitMover, hitFlaw, starsFor, isOpen, settleRun, catchComet, COMETS } from "./engine.js";
import { GUIDE } from "./guide.js";
import { dailySeed, dailyState, finishDaily, todayKey, dayNumber } from "../daily.js";
import { observatory } from "../hosts/observatory.js";
import { addTokens } from "../hosts/tokens.js";
import * as S from "../stars/sfx.js";

const KIND = "comettail";
export const TAILS = [
  { id: "ct-dust", name: "Dust tail", price: 0, c1: "#fff3d6", c2: "#e9c98a", curve: 0.5, note: "Dust tails curve gently and shine yellow-white: sunlight reflecting off grains pushed out by the Sun's light." },
  { id: "ct-ion", name: "Blue ion tail", price: 40, c1: "#d6e6ff", c2: "#5f8dff", curve: 0, note: "Ion tails are straight and blue, glowing from carbon monoxide ions blown directly away from the Sun by the solar wind." },
  { id: "ct-green", name: "Green coma", price: 60, c1: "#d9ffe0", c2: "#45d06a", curve: 0.3, note: "A green glow round a comet's head comes from diatomic carbon, two carbon atoms bound together, lit by sunlight." },
  { id: "ct-halebopp", name: "Hale-Bopp's twin tails", price: 90, c1: "#fff6e0", c2: "#7aa2ff", curve: 0.6, twin: true, note: "Hale-Bopp showed a curved dust tail and a straight blue ion tail side by side, and stayed visible to the naked eye for about 18 months." },
  { id: "ct-neowise", name: "NEOWISE 2020", price: 120, c1: "#fff8ea", c2: "#ffd27a", curve: 0.7, twin: true, note: "Comet NEOWISE was a naked-eye comet in July 2020, found that March by a space telescope hunting near-Earth objects." },
];
const tailOf = (p) => TAILS.find((t) => t.id === p[KIND] && (t.price === 0 || (p.owned || []).includes(t.id))) || TAILS[0];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const $id = (id) => document.getElementById(id);

const CSS = `.table.comet{background:radial-gradient(ellipse at 50% 120%,#1a2b55 0%,#0B1530 55%,#050a18 100%);pointer-events:auto;overflow:hidden}
.ch-plate{position:absolute;inset:6% 6% 10%;width:88%;height:84%;border-radius:10px;box-shadow:0 0 0 3px #9fb4d8,0 10px 30px #000a;background:#05070f}
.ch-plate .pa,.ch-plate .pb{transition:opacity .05s}.ch-plate.blink .pb{animation:ch-blink 1.1s steps(1) infinite}.ch-plate.blink .pa{animation:ch-blink 1.1s steps(1) infinite reverse}
@keyframes ch-blink{0%{opacity:1}50%{opacity:0}}
.ch-plate .hit{cursor:crosshair}.ch-plate .ring{fill:none;stroke:#E2B04A;stroke-width:2;animation:ch-ring .9s ease-out forwards}
@keyframes ch-ring{from{r:4;opacity:1}to{r:34;opacity:0}}
.ch-plate .streak{animation:ch-streak 2.4s cubic-bezier(.3,.1,.2,1) forwards}@keyframes ch-streak{from{transform:translate(-90px,40px);opacity:0}20%{opacity:1}to{transform:translate(90px,-40px);opacity:0}}
.ch-plate.shake{animation:ch-shake .35s}@keyframes ch-shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.ch-fact{border-left:3px solid #8FB8FF;padding:4px 10px;margin:8px 0;color:#DCE6FF}
.ch-dots{letter-spacing:.2em;color:#E2B04A}
@media (prefers-reduced-motion:reduce){.ch-plate *,.ch-plate{animation:none!important}.ch-plate.blink .pb{opacity:.5}}`;
function styleOnce() { if ($id("ch-style")) return; const s = document.createElement("style"); s.id = "ch-style"; s.textContent = CSS; document.head.appendChild(s); }

// ---- drawings ----
const fuzzy = (x, y, shape, k) => {
  const id = `ch-g${k}`, g = `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#eef3ff" stop-opacity=".95"/><stop offset=".45" stop-color="#b8c8ff" stop-opacity=".45"/><stop offset="1" stop-color="#8FB8FF" stop-opacity="0"/></radialGradient></defs>`;
  if (shape === "galaxy") return `${g}<ellipse cx="${x}" cy="${y}" rx="22" ry="8" transform="rotate(-28 ${x} ${y})" fill="url(#${id})"/>`;
  if (shape === "globular") return `${g}<circle cx="${x}" cy="${y}" r="12" fill="url(#${id})"/>${Array.from({ length: 14 }, (_, i) => `<circle cx="${(x + Math.cos(i * 2.4) * (3 + (i % 4) * 2.6)).toFixed(1)}" cy="${(y + Math.sin(i * 2.4) * (3 + (i % 4) * 2.6)).toFixed(1)}" r=".9" fill="#fff"/>`).join("")}`;
  if (shape === "open") return Array.from({ length: 9 }, (_, i) => `<circle cx="${(x + Math.cos(i * 2.1) * (6 + (i % 3) * 7)).toFixed(1)}" cy="${(y + Math.sin(i * 2.1) * (6 + (i % 3) * 7)).toFixed(1)}" r="${(1.6 + (i % 2) * 0.8).toFixed(1)}" fill="#eef3ff"/><circle cx="${(x + Math.cos(i * 2.1) * (6 + (i % 3) * 7)).toFixed(1)}" cy="${(y + Math.sin(i * 2.1) * (6 + (i % 3) * 7)).toFixed(1)}" r="4" fill="#8FB8FF" opacity=".18"/>`).join("");
  if (shape === "ring") return `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#b9d6ff" stroke-width="3" opacity=".85"/>`;
  if (shape === "crab") return `${g}<path d="M${x - 14} ${y - 4} q6 -10 14 -6 q10 -2 13 8 q-2 10 -12 9 q-11 3 -15 -11z" fill="url(#${id})"/>`;
  return `${g}<circle cx="${x}" cy="${y}" r="9" fill="url(#${id})"/>`; // a nebula, or a comet's coma far from the Sun
};
const field = (stars) => stars.map((s, i) => `<circle class="hit" data-k="s${i}" cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.s.toFixed(2)}" fill="#dfe8ff"/>`).join("");
/** Level 1 plate: stars on both plates, the mover in two places, a flaw on one plate. */
export function blinkSvg(pair) {
  const m = pair.mover, f = pair.flaw, dot = (q, k) => `<circle class="hit" data-k="${k}" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${m.s.toFixed(2)}" fill="#fff"/>`;
  const flaw = (on) => (f && f.on === on ? `<circle class="hit" data-k="flaw" cx="${f.x.toFixed(1)}" cy="${f.y.toFixed(1)}" r="1.6" fill="#cfd6e6"/>` : "");
  return `<svg class="ch-plate blink" id="ch-plate" viewBox="0 0 400 260" role="img" aria-label="Two plates of the same sky, blinking">
    <rect width="400" height="260" fill="#05070f"/>${field(pair.stars)}
    <g class="pa">${dot(m.a, "mover")}${flaw("a")}<text x="10" y="252" fill="#8FB8FF" font-size="10">Plate A · night 1</text></g>
    <g class="pb">${dot(m.b, "mover")}${flaw("b")}<text x="390" y="252" fill="#8FB8FF" font-size="10" text-anchor="end">Plate B · night 8</text></g><g id="ch-fx"></g></svg>`;
}
/** Level 2 plate: a fuzzy patch, moved (a comet) or not (a Messier object). */
export function fuzzySvg(rd, seed) {
  let s = seed % 2147483647 || 1; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const stars = Array.from({ length: 60 }, () => ({ x: 10 + r() * 380, y: 10 + r() * 240, s: 0.5 + r() * r() * 1.8 })), x = 150 + r() * 100, y = 100 + r() * 60;
  const shape = rd.messier ? rd.messier.shape : "nebula", dx = rd.moved ? 26 : 0, dy = rd.moved ? -12 : 0;
  return `<svg class="ch-plate blink" id="ch-plate" viewBox="0 0 400 260" role="img" aria-label="A fuzzy patch on two plates a week apart"><rect width="400" height="260" fill="#05070f"/>
    ${stars.map((q) => `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${q.s.toFixed(2)}" fill="#dfe8ff"/>`).join("")}
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="34" fill="none" stroke="#E2B04A" stroke-width="1" stroke-dasharray="4 4" opacity=".6"/>
    <g class="pa">${fuzzy(x, y, shape, "a")}<text x="10" y="252" fill="#8FB8FF" font-size="10">Plate A · night 1</text></g>
    <g class="pb">${fuzzy(x + dx, y + dy, shape, "b")}<text x="390" y="252" fill="#8FB8FF" font-size="10" text-anchor="end">Plate B · night 8</text></g><g id="ch-fx"></g></svg>`;
}
/** A comet with the player's tail style, pointing away from a Sun on the left. */
export function cometSvg(tail, x = 200, y = 130, cls = "") {
  const t = tail, c = 50 * t.curve, id = "ch-tl" + t.id, L = 210;
  const fan = (w, bend, col, k, op) => `<defs><linearGradient id="${id}${k}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y}" x2="${x + L}" y2="${y - 40 - bend}"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    <path d="M${x} ${y - 3} Q${x + L * 0.5} ${y - 20 - bend - w * 0.4} ${x + L} ${y - 40 - bend - w} L${x + L} ${y - 40 - bend + w} Q${x + L * 0.5} ${y - 20 - bend + w * 0.4} ${x} ${y + 3}Z" fill="url(#${id}${k})" filter="url(#${id}b)"/>`;
  return `<g class="${cls}"><defs><filter id="${id}b" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3"/></filter><radialGradient id="${id}h"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${t.c1}" stop-opacity=".85"/><stop offset="1" stop-color="${t.c2}" stop-opacity="0"/></radialGradient></defs>
    ${fan(26, c, t.c1, "d", 0.75)}${t.twin ? fan(6, -c - 20, t.c2, "i", 0.9) : fan(10, c * 0.4, t.c2, "i", 0.5)}<circle cx="${x}" cy="${y}" r="18" fill="url(#${id}h)"/><circle cx="${x}" cy="${y}" r="3" fill="#fff"/></g>`;
}
/** Level 3: an orbit, the Sun at one focus, the comet on its way back. */
export function orbitSvg(tail, frac = 0.7) {
  const a = 160, b = 52, cx = 210, cy = 130, fx = cx - Math.sqrt(a * a - b * b), ang = Math.PI * 2 * frac, px = cx + a * Math.cos(ang), py = cy + b * Math.sin(ang);
  return `<svg class="ch-plate" id="ch-plate" viewBox="0 0 400 260" role="img" aria-label="A comet's long orbit round the Sun"><rect width="400" height="260" fill="#05070f"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" fill="none" stroke="#2A3F6E" stroke-dasharray="3 5"/><circle cx="${fx.toFixed(1)}" cy="${cy}" r="9" fill="#ffd86b"/><circle cx="${fx.toFixed(1)}" cy="${cy}" r="16" fill="#ffd86b" opacity=".15"/>
    <circle cx="${fx.toFixed(1)}" cy="${cy}" r="28" fill="none" stroke="#5f8dff" opacity=".5"/><text x="${(fx - 6).toFixed(1)}" y="${cy + 42}" fill="#8FB8FF" font-size="10">Earth's orbit</text>
    <g transform="scale(.35) translate(${(px / 0.35 - 200).toFixed(1)} ${(py / 0.35 - 130).toFixed(1)})">${cometSvg(tail)}</g><g id="ch-fx"></g></svg>`;
}

export const shop = {
  kind: KIND, label: "☄️ Comet tails", items: TAILS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["Comet tails. Every one of them points away from the Sun.", "Tails for your comets. They only grow near the Sun, so enjoy them while they last."],
    tryon: ["The {item}. A comet worth getting up at 4 AM for.", "Picture the {item} streaking over the dome."],
    buy: ["The {item} is yours. Your next catch wears it.", "Sold. May the {item} never point at you."],
  },
  preview(id, ctx) { styleOnce(); const t = TAILS.find((x) => x.id === id) || TAILS[0]; ctx.tableEl.className = "table comet"; ctx.tableEl.innerHTML = `<svg class="ch-plate" viewBox="0 0 400 260"><rect width="400" height="260" fill="#05070f"/>${cometSvg(t, 110, 160)}</svg>`; ctx.cap && ctx.cap("☄️ " + t.name); },
};

export const comet = {
  id: "comet", label: "Comet Hunter", emoji: "☄️", shop,
  blurb: "Blink two plates, catch what moved, tell comets from Messier objects and predict a comet's return like Halley",
  open(C) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, greet, award, tableEl, reduced } = C;
    styleOnce();
    const P = () => state.prog, R = () => CR(P()), save = () => { try { saveProgress(); } catch {} };
    const day = todayKey(), dseed = dailySeed("comet", day);
    const back = () => `<div class="choices"><button class="c small" type="button" id="ch-lobby">☄️ Back to the plates</button></div>`;
    const wireBack = () => { const b = $("ch-lobby"); if (b) b.onclick = () => lobby(false); };
    const fx = (html) => { const g = $id("ch-fx"); if (g) g.insertAdjacentHTML("beforeend", html); };
    const shake = () => { const s = $id("ch-plate"); if (!s) return; s.classList.remove("shake"); void s.getBoundingClientRect(); s.classList.add("shake"); };
    const mid = () => C.banter && C.banter("comet", "mid");
    const LV = [null, ["🔭 1 · Spot the mover", "Blink two plates a week apart and tap what moved"], ["🌫️ 2 · Comet or Messier object", "Did the fuzzy patch move? If not, name it"], ["🪐 3 · Predict a return", "When does a real comet come back?"]];

    function lobby(first) {
      clearReading(); cap("☄️ Comet Hunter"); tableEl.className = "table comet";
      tableEl.innerHTML = `<svg class="ch-plate" viewBox="0 0 400 260" role="img" aria-label="A comet"><rect width="400" height="260" fill="#05070f"/>${cometSvg(tailOf(P()), 120, 170, reduced ? "" : "streak")}</svg>`;
      if (first) S.domeOpen();
      say(first ? `Two plates, one week apart. Something moved, ${state.name}. Let's find it.` : pick([`Comets don't announce themselves, ${state.name}. We blink and we wait.`, "Messier hunted comets for 50 years. He found 13. Let's beat that.", "Fresh plates in from last night. Shall we?"]));
      const r = R(), ds = dailyState(P(), "comet");
      const lv = (n) => `<button class="c level" type="button" id="ch-go${n}"${isOpen(P(), n) ? "" : " disabled"}><b>${LV[n][0]}</b><span>${isOpen(P(), n) ? `${LV[n][1]}${r.best[n] ? ` · best ${r.best[n]}★` : ""}` : `Clear Level ${n - 1} to open`}</span></button>`;
      ui(`<div class="cx-top"><b>☄️ Comet Hunter</b> · ${r.caught.length} / ${COMETS.length} comets caught · ${r.cleared.length} / 3 levels cleared</div>
        <div class="levels">${lv(1)}${lv(2)}${lv(3)}</div>
        <div class="choices"><button class="c main" type="button" id="ch-daily">📅 Daily Blink #${dayNumber(day)}${ds.played ? " ✓" : ""}</button><button class="c small" type="button" id="ch-guide">📖 Handbook</button><button class="c small" type="button" id="back">✦ Leave</button></div>
        <div class="note">${ROUNDS} plates a run. Get ${PASS} right to clear a level. First try 3★, second 2★, third 1★.</div>`);
      [1, 2, 3].forEach((n) => { const b = $("ch-go" + n); if (b && isOpen(P(), n)) b.onclick = () => run(n, false); });
      $("ch-daily").onclick = () => run(1, true); $("back").onclick = greet; $("ch-guide").onclick = () => (C.study ? C.study("comet", () => lobby(false)) : null);
    }

    function run(level, daily) {
      const results = [], base = daily ? dseed : (Math.random() * 2 ** 31) >>> 0; let i = 0;
      const dots = () => `<span class="ch-dots">${Array.from({ length: ROUNDS }, (_, k) => (k < results.length ? (results[k] ? "★".repeat(results[k]) : "✗") : "·")).join(" ")}</span>`;
      let settled = -1;
      const next = (stars) => { if (settled === i) return; settled = i; $("ui").querySelectorAll("button:not(#ch-lobby)").forEach((b) => (b.disabled = true)); results.push(stars); i++; setTimeout(() => (i < ROUNDS ? play() : finish()), reduced ? 300 : 1300); };
      const play = () => {
        clearReading(); cap(`☄️ ${daily ? `Daily Blink #${dayNumber(day)}` : LV[level][0]} · plate ${i + 1} of ${ROUNDS}`); tableEl.className = "table comet";
        const seed = (base + i * 7919) >>> 0, rd = roundOf(level, seed, i); let tries = 0;
        if (level === 1) {
          tableEl.innerHTML = blinkSvg(rd); S.ping(2);
          say(i === 0 ? "Watch the blink. Stars stay still. Tap the one that jumps." : rd.flaw && i === 2 ? "Careful: dust and scratches show on one plate only. A real mover is on both." : pick(["Blink, and tap what moved.", "Somewhere in there, something's wandering.", "Same sky, a week apart. What's different?"]));
          ui(`<div class="group">Plate ${i + 1} ${dots()}</div><div class="choices"><button class="c small" type="button" id="ch-pause">⏸ Hold the blink</button></div>${back()}`); wireBack();
          $("ch-pause").onclick = () => { const s = $id("ch-plate"); s.classList.toggle("blink"); $("ch-pause").textContent = s.classList.contains("blink") ? "⏸ Hold the blink" : "▶ Blink again"; S.ping(3); };
          tableEl.querySelectorAll(".hit").forEach((el) => (el.onclick = () => {
            const k = el.dataset.k, x = +el.getAttribute("cx"), y = +el.getAttribute("cy");
            if (k === "mover" || hitMover(rd, x, y, 4)) {
              S.discover(); fx(`<circle class="ring" cx="${rd.mover.a.x}" cy="${rd.mover.a.y}" r="4"/><circle class="ring" cx="${rd.mover.b.x}" cy="${rd.mover.b.y}" r="4"/>`);
              tableEl.querySelectorAll(".hit").forEach((h) => (h.onclick = null)); say(pick(["Got it. That's a wanderer: an asteroid or a comet.", "There! It moved. That's how Tombaugh found Pluto.", "Caught. The stars never move like that."])); return next(starsFor(tries + 1));
            }
            tries++; S.gutter(); shake();
            if (k === "flaw" || hitFlaw(rd, x, y, 4)) say("That's a flaw on one plate only: a speck of dust. A real mover shows on both plates.");
            else { say(tries >= 3 ? "It got away. It was this one." : "That one stayed still. Keep watching the blink."); const m = mid(); if (m && C.bubble && tries === 1) C.bubble(m, 3000); }
            if (tries >= 3) { fx(`<circle class="ring" cx="${rd.mover.a.x}" cy="${rd.mover.a.y}" r="4"/>`); tableEl.querySelectorAll(".hit").forEach((h) => (h.onclick = null)); next(0); }
          }));
        } else if (level === 2) {
          tableEl.innerHTML = fuzzySvg(rd, seed); S.ping(4);
          say(pick(["A fuzzy patch. Comet, or one of Messier's?", "Messier's whole list exists because of patches like this.", "Blink it. Did it move?"]));
          const ask1 = () => {
            ui(`<div class="group">Plate ${i + 1} ${dots()}</div><div class="choices"><button class="c" type="button" data-c="comet">☄️ It moved: a comet</button><button class="c" type="button" data-c="messier">🌫️ It stayed put: a Messier object</button></div>${back()}`); wireBack();
            $("ui").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => {
              if (b.dataset.c !== rd.a) { tries++; S.gutter(); shake(); say(rd.moved ? "Look again: it jumps between plates. Messier objects never move." : "Look again: it sits still while the plates blink. Comets move."); return tries >= 2 ? done(false) : null; }
              if (rd.comet) return caught(); ask2();
            }));
          };
          const ask2 = () => {
            say(`Right: it stayed put. So which of Messier's is it? It's ${/^[aeiou]/i.test(rd.messier.kind) ? "an" : "a"} ${rd.messier.kind.toLowerCase()}.`);
            ui(`<div class="group">Name it ${dots()}</div><div class="choices">${rd.choices.map((n) => `<button class="c small" type="button" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>${back()}`); wireBack();
            $("ui").querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => {
              if (b.dataset.n === rd.name) { S.verdict(true); clearReading(); $id("reading-body").innerHTML = `<div class="ch-fact">${esc(rd.messier.note)}</div>`; return next(starsFor(tries + 1)); }
              tries++; S.gutter(); b.disabled = true; if (tries >= 3) done(false);
            }));
          };
          const caught = () => {
            S.discover(); const first = catchComet(P(), rd.comet.id); if (first) addTokens(P(), observatory, 1); save();
            fx(cometSvg(tailOf(P()), 120, 170, reduced ? "" : "streak"));
            say(`A comet! ${rd.comet.name}.${first ? " First time you've caught it: +1 ☄️ comet shard." : ""}`);
            $id("reading-body").innerHTML = `<div class="ch-fact">${esc(rd.comet.note)}</div>`; next(starsFor(tries + 1));
          };
          const done = (ok) => { if (!ok) { say(rd.comet ? `It was a comet: ${rd.comet.name}.` : `It was ${rd.messier.name}.`); next(0); } };
          ask1();
        } else {
          tableEl.innerHTML = orbitSvg(tailOf(P()), 0.55 + (seed % 30) / 100); S.ping(1);
          say(i === 0 ? "Halley's trick: a comet that came before will come again. Add its period." : pick(["Where in its long orbit is it now?", "Add the period, then allow for the planets' tugs.", "Every periodic comet keeps an appointment."]));
          ui(`<div class="group">Comet ${i + 1} ${dots()}</div><div class="ch-fact">${esc(rd.q)}</div><div class="choices">${rd.choices.map((y) => `<button class="c small" type="button" data-y="${y}">${y}</button>`).join("")}</div>${back()}`); wireBack();
          $("ui").querySelectorAll("[data-y]").forEach((b) => (b.onclick = () => {
            if (b.dataset.y === rd.a) { S.verdict(true); $id("reading-body").innerHTML = `<div class="ch-fact">${esc(rd.why)}</div>`; ui(`<div class="group">✓ ${rd.a} ${dots()}</div>`); return next(starsFor(tries + 1)); }
            tries++; S.gutter(); shake(); b.disabled = true;
            if (tries >= 3) { $id("reading-body").innerHTML = `<div class="ch-fact">It returns in ${esc(rd.a)}. ${esc(rd.why)}</div>`; next(0); } else say("Not quite. Add the period to the last pass, and round sensibly.");
          }));
        }
      };
      const finish = () => {
        const res = settleRun(P(), level, results), stars = res.stars, xp = 3 * stars, es = 2 * stars + (res.first ? 10 : 0);
        let bonus = "";
        if (daily) { const d = finishDaily(P(), "comet", { score: stars * 10, won: res.won, detail: `${stars}★` }, day); if (d.first) bonus = " · 📅 Daily done"; }
        const aw = award(xp, es); save(); showStats(); C.trophy?.("comet", level, { won: res.won, perfect: res.perfect });
        S.verdict(res.won); const b = C.banter && C.banter("comet", res.won ? "win" : "lose"); if (b && C.bubble) C.bubble(b, 3500);
        say(res.won ? (res.perfect ? "Every plate on the first try. Messier would have hired you." : `${res.right} of ${ROUNDS}. A good night's hunting.`) : `${res.right} of ${ROUNDS}. The sky's patient. Try again.`);
        ui(`<div class="reward"><div>${res.won ? "✓ Run cleared" : "Run over"} · ${stars}★ ${dots()}</div><div class="up">+${xp} ✦ · +${es} 💎${res.first ? " · level cleared!" : ""}${bonus}${aw && aw.rankUp ? ` · 🏅 You are now <b>${esc(aw.rankUp)}</b>` : ""}</div></div>
          <div class="choices"><button class="c main" type="button" id="ch-again">↻ Again</button>${level < 3 && isOpen(P(), level + 1) && !daily ? `<button class="c" type="button" id="ch-next">${LV[level + 1][0]}</button>` : ""}</div>${back()}`);
        $("ch-again").onclick = () => run(level, false); const n = $("ch-next"); if (n) n.onclick = () => run(level + 1, false); wireBack();
      };
      play();
    }
    lobby(true);
  },
};

export function cometCodex(p, esc) {
  const r = CR(p); if (!r.plays && !r.caught.length) return "";
  const names = COMETS.filter((c) => r.caught.includes(c.id)).map((c) => esc(c.name)).join(", ");
  return `<div class="bk-room"><h4>☄️ Comet Hunter</h4><p>${r.cleared.length} / 3 levels cleared · ${r.caught.length} / ${COMETS.length} comets caught${names ? `: ${names}` : ""}</p></div>`;
}
export { GUIDE };
