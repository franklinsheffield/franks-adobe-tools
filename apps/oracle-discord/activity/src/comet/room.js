// Comet Hunter: a room of the Chamber (Keeper Altair's House, #🔭-observatory). Blink plates, catch what moved, tell
// comets from Messier objects, and predict returns like Halley. Logic in engine.js; this file draws and wires it.
// Trophy levels: C.trophy("comet", level, { won, perfect }) at the end of each run. Daily: one Level 1 run a day.
import { room as CR, ROUNDS, PASS, roundOf, pickAt, hopOf, PLUTO_ROUND, starsFor, isOpen, settleRun, catchComet, COMETS } from "./engine.js";
import { GUIDE } from "./guide.js";
import { dailySeed, dailyState, finishDaily, todayKey, dayNumber } from "../daily.js";
import { observatory } from "../hosts/observatory.js";
import { addTokens } from "../hosts/tokens.js";
import * as S from "../stars/sfx.js";
import { makeRace } from "../obsrace.js";

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
.ch-plate .pa,.ch-plate .pb{transition:opacity .05s}.ch-plate.blink .pb{animation:ch-blink var(--bl,1.1s) steps(1) infinite}.ch-plate.blink .pa{animation:ch-blink var(--bl,1.1s) steps(1) infinite reverse}
.ch-plate.bp:not(.blink) .pb{opacity:0}.ch-plate.bp.showb:not(.blink) .pb{opacity:1}.ch-plate.bp.showb:not(.blink) .pa{opacity:0}
.ch-plate.bp{cursor:crosshair;touch-action:manipulation}.ch-plate.neg .sky{filter:invert(1)}
#ch-loupe{pointer-events:none}.ch-ctl{display:flex;gap:6px;flex-wrap:wrap}.ch-ctl .c{flex:1 1 0;min-width:0}
.ch-plate .arrow{stroke:#E2B04A;stroke-width:1.6;fill:none;stroke-dasharray:60;stroke-dashoffset:60;animation:ch-draw .8s ease-out forwards}@keyframes ch-draw{to{stroke-dashoffset:0}}
@keyframes ch-blink{0%{opacity:1}50%{opacity:0}}
.ch-plate .hit{cursor:crosshair}.ch-plate .ring{fill:none;stroke:#E2B04A;stroke-width:2;animation:ch-ring .9s ease-out forwards}
@keyframes ch-ring{from{r:4;opacity:1}to{r:34;opacity:0}}
.ch-plate .streak{animation:ch-streak 2.4s cubic-bezier(.3,.1,.2,1) forwards}@keyframes ch-streak{from{transform:translate(-90px,40px);opacity:0}20%{opacity:1}to{transform:translate(90px,-40px);opacity:0}}
.ch-plate.shake{animation:ch-shake .35s}@keyframes ch-shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.ch-fact{border-left:3px solid #8FB8FF;padding:4px 10px;margin:8px 0;color:#DCE6FF}
.ch-dots{letter-spacing:.2em;color:#E2B04A}
@media (prefers-reduced-motion:reduce){.ch-plate *,.ch-plate{animation:none!important}.ch-plate.blink .pb{opacity:.5}.ch-plate .arrow{stroke-dashoffset:0}}`;
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
/** Level 1 plate: a photographic plate pair. Stars on both, the mover in two places, decoys on one plate, and a loupe. */
export function blinkSvg(pair, { neg = false, pluto = false } = {}) {
  const m = pair.mover, f = pair.flaw, v = pair.variable, t = pair.trail, n = (q) => q.toFixed(1);
  const dot = (q, k) => `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${(m.s * 2.6).toFixed(2)}" fill="#dfe8ff" opacity=".18"/><circle class="hit" data-k="${k}" cx="${n(q.x)}" cy="${n(q.y)}" r="${m.s.toFixed(2)}" fill="#fff"/>`;
  const flaw = (on) => (f && f.on === on ? `<path class="hit" data-k="flaw" d="M${n(f.x - 2)} ${n(f.y - 1)} q2 -2 4 0 q1 2 -1 3 q-3 1 -3 -3z" fill="#cfd6e6"/>` : "");
  const varStar = (on) => (v ? `<circle cx="${n(v.x)}" cy="${n(v.y)}" r="${v.bright === on ? v.sa * 2.6 : v.sb * 2.6}" fill="#dfe8ff" opacity=".2"/><circle class="hit" data-k="variable" cx="${n(v.x)}" cy="${n(v.y)}" r="${v.bright === on ? v.sa : v.sb}" fill="#fff"/>` : "");
  const trail = (on) => (t && t.on === on ? `<line class="hit" data-k="trail" x1="${t.x1}" y1="${n(t.y1)}" x2="${t.x2}" y2="${n(t.y2)}" stroke="#eef3ff" stroke-width=".9" opacity=".75"/>` : "");
  const glow = pair.stars.filter((q) => q.s > 1.3).map((q) => `<circle cx="${n(q.x)}" cy="${n(q.y)}" r="${(q.s * 2.8).toFixed(2)}" fill="#dfe8ff" opacity=".16"/>`).join("");
  const la = pluto ? "Plate A · 23 Jan 1930" : "Plate A · night 1", lb = pluto ? "Plate B · 29 Jan 1930" : "Plate B · night 7";
  const sky = `<rect width="400" height="260" fill="#05070f"/><rect width="400" height="260" filter="url(#ch-grain)"/>${glow}${field(pair.stars)}
    <g class="pa">${dot(m.a, "mover")}${varStar("a")}${flaw("a")}${trail("a")}<text x="10" y="252" fill="#8FB8FF" font-size="10">${la}</text></g>
    <g class="pb">${dot(m.b, "mover")}${varStar("b")}${flaw("b")}${trail("b")}<text x="390" y="252" fill="#8FB8FF" font-size="10" text-anchor="end">${lb}</text></g>
    <rect width="400" height="260" fill="url(#ch-vig)" pointer-events="none"/>`;
  return `<svg class="ch-plate bp blink${neg ? " neg" : ""}" id="ch-plate" viewBox="0 0 400 260" role="img" aria-label="Two photographic plates of the same sky, blinking">
    <defs><filter id="ch-grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .8  0 0 0 0 .85  0 0 0 0 1  0 0 0 .09 0"/></filter>
    <radialGradient id="ch-vig"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient><clipPath id="ch-lc"><circle id="ch-lcc" cx="-99" cy="-99" r="38"/></clipPath></defs>
    <g class="sky">${sky}</g>
    <g id="ch-loupe" style="display:none"><g clip-path="url(#ch-lc)"><g id="ch-lu"><g class="sky">${sky.replace(/ class="hit" data-k="[^"]*"/g, "")}</g></g></g><circle id="ch-lr" cx="-99" cy="-99" r="38" fill="none" stroke="#E2B04A" stroke-width="2"/><circle id="ch-lx" cx="-99" cy="-99" r="2" fill="none" stroke="#E2B04A" stroke-width=".8"/></g><g id="ch-fx"></g></svg>`;
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
    const LV = [null, ["🔭 1 · Spot the mover", "Blink two plates, tap what moved, dodge the decoys"], ["🌫️ 2 · Comet or Messier object", "Did the fuzzy patch move? If not, name it"], ["🪐 3 · Predict a return", "When does a real comet come back?"]];

    const race = makeRace(C, { game: "comet", title: "Plate race", emoji: "☄️", unit: "★", intro: "Same plate pairs for everyone: find what moved.", play: (seed, done) => run(1, false, { seed, onDone: done }), back: () => lobby(false), sfx: (w) => S.verdict(w) });
    function lobby(first) {
      clearReading(); cap("☄️ Comet Hunter"); tableEl.className = "table comet";
      tableEl.innerHTML = `<svg class="ch-plate" viewBox="0 0 400 260" role="img" aria-label="A comet"><rect width="400" height="260" fill="#05070f"/>${cometSvg(tailOf(P()), 120, 170, reduced ? "" : "streak")}</svg>`;
      if (first) S.domeOpen();
      say(first ? `Two plates of the same sky, nights apart. Something moved, ${state.name}. Let's find it.` : pick([`Comets don't announce themselves, ${state.name}. We blink and we wait.`, "Messier hunted comets for 50 years. He found 13. Let's beat that.", "Fresh plates in from last night. Shall we?"]));
      const r = R(), ds = dailyState(P(), "comet");
      const lv = (n) => `<button class="c level" type="button" id="ch-go${n}"${isOpen(P(), n) ? "" : " disabled"}><b>${LV[n][0]}</b><span>${isOpen(P(), n) ? `${LV[n][1]}${r.best[n] ? ` · best ${r.best[n]}★` : ""}` : `Clear Level ${n - 1} to open`}</span></button>`;
      ui(`<div class="cx-top"><b>☄️ Comet Hunter</b> · ${r.caught.length} / ${COMETS.length} comets caught · ${r.cleared.length} / 3 levels cleared</div>
        <div class="levels">${lv(1)}${lv(2)}${lv(3)}</div>
        <div class="choices"><button class="c main" type="button" id="ch-daily">📅 Daily Blink #${dayNumber(day)}${ds.played ? " ✓" : ""}</button><button class="c small" type="button" id="ch-guide">📖 Handbook</button><button class="c small" type="button" id="ch-race">⚔️ Plate race</button><button class="c small" type="button" id="back">✦ Leave</button></div>
        <div class="note">${ROUNDS} plates a run. Get ${PASS} right to clear a level. First try 3★, second 2★, third 1★.</div>`);
      [1, 2, 3].forEach((n) => { const b = $("ch-go" + n); if (b && isOpen(P(), n)) b.onclick = () => run(n, false); });
      $("ch-daily").onclick = () => run(1, true); $("back").onclick = () => { race.leave(); greet(); }; $("ch-race").onclick = () => race.open(); $("ch-guide").onclick = () => (C.study ? C.study("comet", () => lobby(false)) : null);
    }

    function run(level, daily, opt = {}) {
      const t0 = Date.now();
      const results = [], base = opt.seed != null ? opt.seed >>> 0 : daily ? dseed : (Math.random() * 2 ** 31) >>> 0; let i = 0;
      const dots = () => `<span class="ch-dots">${Array.from({ length: ROUNDS }, (_, k) => (k < results.length ? (results[k] ? "★".repeat(results[k]) : "✗") : "·")).join(" ")}</span>`;
      let settled = -1;
      const next = (stars) => { if (settled === i) return; settled = i; $("ui").querySelectorAll("button:not(#ch-lobby)").forEach((b) => (b.disabled = true)); results.push(stars); i++; setTimeout(() => (i < ROUNDS ? play() : finish()), reduced ? 300 : level === 1 ? 2600 : 1300); };
      const play = () => {
        clearReading(); cap(`☄️ ${daily ? `Daily Blink #${dayNumber(day)}` : LV[level][0]} · plate ${i + 1} of ${ROUNDS}`); tableEl.className = "table comet";
        const seed = (base + i * 7919) >>> 0, rd = roundOf(level, seed, i); let tries = 0;
        if (level === 1) {
          const pluto = i === PLUTO_ROUND, look = R(); let speed = look.blink || 1.1;
          tableEl.innerHTML = blinkSvg(rd, { neg: !!look.neg, pluto }); S.ping(2);
          const svg = $id("ch-plate"); svg.style.setProperty("--bl", speed + "s");
          say(pluto ? "Last plate: a pair modelled on Tombaugh's, Gemini, January 1930. Something faint moved a tiny bit." : i === 0 ? "Watch the blink. Stars stay still. Tap the one that jumps. The loupe follows your finger." : i === 1 ? "One of these stars changes brightness. Brightening isn't moving." : i === 2 ? "Careful: dust shows on one plate only. A real mover is on both." : i === 3 ? "A satellite may streak across one plate. Streaks aren't movers." : pick(["Blink, and tap what moved.", "Somewhere in there, something's wandering.", "Same sky, a few nights apart. What's different?"]));
          const ctl = () => ui(`<div class="group">Plate ${i + 1} ${dots()}</div><div class="ch-ctl"><button class="c small" type="button" id="ch-flip">${svg.classList.contains("blink") ? "⏸ Stop and flip by hand" : "🔁 Flip plates"}</button><button class="c small" type="button" id="ch-auto">${svg.classList.contains("blink") ? `⏱ Blink: ${speed < 1 ? "fast" : speed > 1.4 ? "slow" : "medium"}` : "▶ Auto blink"}</button><button class="c small" type="button" id="ch-neg">${svg.classList.contains("neg") ? "🎞 Positive" : "🎞 Negative"}</button></div>${back()}`);
          const wire = () => {
            ctl(); wireBack();
            $("ch-flip").onclick = () => { if (svg.classList.contains("blink")) svg.classList.remove("blink"); else svg.classList.toggle("showb"); S.ping(svg.classList.contains("showb") ? 4 : 2); wire(); };
            $("ch-auto").onclick = () => { if (svg.classList.contains("blink")) { speed = speed > 1.4 ? 0.7 : speed < 1 ? 1.1 : 1.6; look.blink = speed; save(); svg.style.setProperty("--bl", speed + "s"); } else svg.classList.add("blink"); S.ping(3); wire(); };
            $("ch-neg").onclick = () => { svg.classList.toggle("neg"); look.neg = svg.classList.contains("neg"); save(); S.ping(1); wire(); };
          };
          wire();
          const pt = (e) => { const ctm = svg.getScreenCTM(); if (!ctm) return null; const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()); return { x: q.x, y: q.y }; };
          const loupe = $id("ch-loupe"); let hide = 0;
          const showLoupe = (q) => {
            if (!q) return; clearTimeout(hide); const lx = Math.min(360, Math.max(40, q.x)), ly = q.y > 90 ? q.y - 52 : q.y + 52, Z = 3;
            loupe.style.display = ""; $id("ch-lu").setAttribute("transform", `translate(${lx} ${ly}) scale(${Z}) translate(${-q.x} ${-q.y})`);
            for (const id of ["ch-lcc", "ch-lr", "ch-lx"]) { $id(id).setAttribute("cx", lx); $id(id).setAttribute("cy", ly); }
          };
          svg.onpointermove = (e) => showLoupe(pt(e)); svg.onpointerdown = (e) => showLoupe(pt(e));
          svg.onpointerleave = () => { hide = setTimeout(() => (loupe.style.display = "none"), 200); };
          svg.onpointerup = (e) => { if (e.pointerType !== "mouse") hide = setTimeout(() => (loupe.style.display = "none"), 700); };
          let over = false;
          svg.onclick = (e) => {
            if (over) return; const q = pt(e); if (!q) return; const k = pickAt(rd, q.x, q.y);
            if (k === null) { say("Empty sky there. Tap right on a star or speck."); return; }
            if (k === "mover") {
              over = true; S.discover(); const h = hopOf(rd), A = rd.mover.a, B = rd.mover.b;
              fx(`<circle class="ring" cx="${A.x}" cy="${A.y}" r="4"/><circle class="ring" cx="${B.x}" cy="${B.y}" r="4"/><line class="arrow" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" marker-end="url(#ch-ah)"/><defs><marker id="ch-ah" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L6 3L0 6z" fill="#E2B04A"/></marker></defs>`);
              say(pluto ? "Caught! That's the hop that found Pluto." : pick(["Got it. A wanderer among the stars.", "There! It moved. Blinking is how Tombaugh found Pluto.", "Caught. The stars never move like that."]));
              $id("reading-body").innerHTML = `<div class="ch-fact"><b>${esc(h.label)}</b> · hopped ${h.d} plate units. ${esc(h.note)}</div>`;
              return next(starsFor(tries + 1));
            }
            tries++; S.gutter(); shake();
            const why = { variable: "That star changed brightness but stayed put: a variable star. Real, but not a mover.", flaw: "That's on one plate only: a speck of dust. A real mover shows on both plates.", trail: "That streak is on one plate only: a satellite crossing during the exposure.", star: "That one stayed still. Keep watching the blink." }[k];
            if (tries >= 3) { over = true; say(`${why} It got away. Here's the mover.`); fx(`<circle class="ring" cx="${rd.mover.a.x}" cy="${rd.mover.a.y}" r="4"/><circle class="ring" cx="${rd.mover.b.x}" cy="${rd.mover.b.y}" r="4"/>`); $id("reading-body").innerHTML = `<div class="ch-fact">${esc(hopOf(rd).note)}</div>`; return next(0); }
            say(why); const m = mid(); if (m && C.bubble && tries === 1) C.bubble(m, 3000);
          };
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
        if (opt.onDone) return opt.onDone({ n: stars, t: Date.now() - t0 });
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
