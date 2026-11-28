// Celestial Navigator: a room of the Chamber (Keeper Altair's House, #🔭-observatory). Sail a real voyage home by
// the sky: Polaris for latitude, the noon Sun with the almanac, then the chronometer for longitude.
// Logic in engine.js; this file draws and wires it. Trophy: C.trophy("navigator", level, { won, perfect }).
import { room as NR, ROUNDS, PASS, VOYAGES, voyageOf, sightOf, sightAngle, goodSight, shipOn, starsFor, isOpen, settleRun, latText, lonText } from "./engine.js";
import { GUIDE } from "./guide.js";
import { dailySeed, dailyState, finishDaily, todayKey, dayNumber } from "../daily.js";
import * as S from "../stars/sfx.js";
import { makeRace } from "../obsrace.js";

export const SAILS = [
  { id: "sl-canvas", name: "Canvas sails", price: 0, c: "#efe6cf", note: "Square-rigged ships carried acres of canvas. A big clipper could spread over 3,000 square metres of sail." },
  { id: "sl-mayflower", name: "Mayflower's mainsail", price: 40, c: "#d9c7a0", note: "The Mayflower was a cargo ship about 30 metres long. It carried 102 passengers across the Atlantic in 1620." },
  { id: "sl-endeavour", name: "Endeavour's topsails", price: 60, c: "#f3eee2", note: "James Cook sailed Endeavour to Tahiti to watch the transit of Venus on 3 June 1769, a way to measure the distance to the Sun." },
  { id: "sl-cutty", name: "Cutty Sark's clipper rig", price: 90, c: "#ffffff", note: "Cutty Sark, launched in 1869, was one of the fastest clippers ever built. She is preserved at Greenwich, beside the Prime Meridian." },
  { id: "sl-hokulea", name: "Hōkūleʻa's crab-claw sails", price: 120, c: "#c9783a", crab: true, note: "Polynesian voyaging canoes use the crab-claw sail, an ancient design that is still one of the most efficient ever tested." },
];
export const INSTRUMENTS = [
  { id: "ni-brass", name: "Brass sextant", price: 0, c: "#E2B04A", note: "A sextant's arc is a sixth of a circle, but its two mirrors double the angle, so it measures up to 120°." },
  { id: "ni-kamal", name: "Arab kamal", price: 30, c: "#b98a4a", note: "A kamal is a wooden card on a knotted string. Held at arm's length, it measured Polaris's height for Indian Ocean sailors." },
  { id: "ni-quadrant", name: "Mariner's quadrant", price: 30, c: "#a8b0b8", note: "Portuguese navigators of the 1400s used a simple quadrant with a plumb line to measure Polaris's height." },
  { id: "ni-octant", name: "Hadley's octant", price: 60, c: "#7a5a2a", note: "John Hadley showed his reflecting octant in 1731; Thomas Godfrey invented one independently in Philadelphia. The sextant grew from it." },
  { id: "ni-h4", name: "Harrison's H4", price: 120, c: "#ffd86b", note: "John Harrison finished his H4 sea watch in 1759. It solved longitude at sea and is kept at the Royal Observatory, Greenwich." },
];
const own = (list, kind) => (p) => list.find((t) => t.id === p[kind] && (t.price === 0 || (p.owned || []).includes(t.id))) || list[0];
const sailOf = own(SAILS, "sail"), instOf = own(INSTRUMENTS, "navinst");
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const $id = (id) => document.getElementById(id);

const CSS = `.table.navigator{background:linear-gradient(#0B1530 0%,#14244a 60%,#0d2a3a 100%);pointer-events:auto;overflow:hidden}
.nv-svg{position:absolute;inset:5% 5% 10%;width:90%;height:85%}
.nv-svg .wave{animation:nv-wave 4s ease-in-out infinite alternate}@keyframes nv-wave{to{transform:translateX(-14px)}}
.nv-svg .bob{animation:nv-bob 3s ease-in-out infinite alternate;transform-origin:center}@keyframes nv-bob{from{transform:translateY(-1px) rotate(-1.5deg)}to{transform:translateY(2px) rotate(1.5deg)}}
.nv-svg .ship{transition:transform 1.4s cubic-bezier(.4,.1,.2,1)}.nv-svg .hl{animation:nv-pulse 1.4s ease-in-out infinite}@keyframes nv-pulse{50%{opacity:.4}}
.nv-svg.shake{animation:nv-shake .35s}@keyframes nv-shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.nv-fact{border-left:3px solid #8FB8FF;padding:4px 10px;margin:8px 0;color:#DCE6FF}.nv-dots{letter-spacing:.2em;color:#E2B04A}
.nv-arm{width:100%;accent-color:#E2B04A}
@media (prefers-reduced-motion:reduce){.nv-svg *,.nv-svg{animation:none!important;transition:none!important}}`;
function styleOnce() { if ($id("nv-style")) return; const s = document.createElement("style"); s.id = "nv-style"; s.textContent = CSS; document.head.appendChild(s); }

// ---- drawings (viewBox 400x260) ----
const shipIcon = (sail, x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><g class="bob"><path d="M-14 4 L14 4 L9 10 L-9 10Z" fill="#5a3a1e"/><line x1="0" y1="4" x2="0" y2="-20" stroke="#3a2a14" stroke-width="1.4"/>
  ${sail.crab ? `<path d="M0 2 Q-14 -10 -6 -22 Q-2 -10 0 2Z M0 2 Q12 -8 8 -20 Q4 -8 0 2Z" fill="${sail.c}"/>` : `<path d="M-9 -18 Q-1 -12 -9 -4Z M-10 -3 Q0 3 -10 2Z" fill="${sail.c}"/><path d="M1 -18 Q11 -12 1 -5Z M1 -4 Q12 2 1 2Z" fill="${sail.c}"/>`}</g></g>`;
/** The chart: an equirectangular sea chart round the voyage, with ports and the ship's day-by-day track. */
export function chartSvg(v, day, sail, reveal = false) {
  const lats = [v.from.lat, v.to.lat], lons = [v.from.lon, v.to.lon], la0 = Math.min(...lats) - 8, la1 = Math.max(...lats) + 8, lo0 = Math.min(...lons) - 10, lo1 = Math.max(...lons) + 10;
  const X = (lon) => 20 + ((lon - lo0) / (lo1 - lo0)) * 360, Y = (lat) => 20 + ((la1 - lat) / (la1 - la0)) * 210;
  const grid = []; for (let g = Math.ceil(lo0 / 10) * 10; g <= lo1; g += 10) grid.push(`<line x1="${X(g)}" y1="20" x2="${X(g)}" y2="230" stroke="#2A3F6E" stroke-width=".6"/><text x="${X(g) + 2}" y="242" fill="#8FB8FF" font-size="8">${lonText(g)}</text>`);
  for (let g = Math.ceil(la0 / 10) * 10; g <= la1; g += 10) grid.push(`<line x1="20" y1="${Y(g)}" x2="380" y2="${Y(g)}" stroke="${g === 0 ? "#E2B04A" : "#2A3F6E"}" stroke-width=".6"/><text x="22" y="${Y(g) - 2}" fill="#8FB8FF" font-size="8">${latText(g)}</text>`);
  const track = Array.from({ length: day }, (_, i) => shipOn(v, i)).map((s) => `<circle cx="${X(s.lon).toFixed(1)}" cy="${Y(s.lat).toFixed(1)}" r="2" fill="#E2B04A"/>`).join("");
  const s = day > 0 ? shipOn(v, day - 1) : v.from, port = (p) => `<circle cx="${X(p.lon).toFixed(1)}" cy="${Y(p.lat).toFixed(1)}" r="4" fill="#DCE6FF"/><text x="${X(p.lon).toFixed(1)}" y="${(Y(p.lat) - 7).toFixed(1)}" fill="#DCE6FF" font-size="9" text-anchor="middle">${p.name}</text>`;
  return `<svg class="nv-svg" id="nv-svg" viewBox="0 0 400 260" role="img" aria-label="A sea chart of the voyage"><rect width="400" height="260" fill="#0d2238"/>${grid.join("")}
    <line x1="${X(v.from.lon)}" y1="${Y(v.from.lat)}" x2="${X(v.to.lon)}" y2="${Y(v.to.lat)}" stroke="#8FB8FF" stroke-dasharray="2 5" opacity=".5"/>${port(v.from)}${port(v.to)}${track}
    <g class="ship${reveal ? " hl" : ""}">${shipIcon(sail, X(s.lon), Y(s.lat), 0.9)}</g><g id="nv-fx"></g></svg>`;
}
/** The sextant view: the sea horizon, and the star (or Sun) brought down by the arm. offset = true altitude − arm angle. */
export function sightSvg(sight, angle, inst) {
  const isSun = sight.kind === "noon", off = (sightAngle(sight) ?? 0) - angle, y = 150 - Math.max(-70, Math.min(110, off * 9));
  const body = isSun ? `<circle cx="200" cy="${y.toFixed(1)}" r="12" fill="#ffcf6b"/><circle cx="200" cy="${y.toFixed(1)}" r="18" fill="#ffcf6b" opacity=".2"/>` : `<circle cx="200" cy="${y.toFixed(1)}" r="3" fill="#fff"/><circle cx="200" cy="${y.toFixed(1)}" r="8" fill="#8FB8FF" opacity=".25"/>`;
  return `<svg class="nv-svg" id="nv-svg" viewBox="0 0 400 260" role="img" aria-label="Through the sextant: the ${isSun ? "Sun" : "star"} and the horizon">
    <rect width="400" height="260" fill="${isSun ? "#3f6ea8" : "#0B1530"}"/><rect y="150" width="400" height="110" fill="${isSun ? "#1f4f78" : "#0a1c2e"}"/>
    <path class="wave" d="M-20 162 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#8FB8FF" fill="none" opacity=".35"/>
    <line x1="0" y1="150" x2="400" y2="150" stroke="#DCE6FF" stroke-width="1"/>${body}
    <circle cx="200" cy="140" r="118" fill="none" stroke="${inst.c}" stroke-width="10" opacity=".85"/><line x1="200" y1="22" x2="200" y2="258" stroke="${inst.c}" stroke-width="1" opacity=".5"/>
    <text x="200" y="250" fill="#DCE6FF" font-size="11" text-anchor="middle">Arm: ${angle.toFixed(1)}°</text><g id="nv-fx"></g></svg>`;
}
/** Level 3: the chronometer showing Greenwich time at local noon. */
export function chronoSvg(sight, inst) {
  const [h, m] = sight.gmt.split(":").map(Number), ha = ((h % 12) + m / 60) * 30, ma = m * 6, hand = (a, L, w) => `<line x1="200" y1="130" x2="${(200 + Math.sin(a / 57.3) * L).toFixed(1)}" y2="${(130 - Math.cos(a / 57.3) * L).toFixed(1)}" stroke="#1a1030" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<svg class="nv-svg" id="nv-svg" viewBox="0 0 400 260" role="img" aria-label="The chronometer reads ${sight.gmt} Greenwich time"><rect width="400" height="260" fill="#2a1a0e"/>
    <rect x="90" y="20" width="220" height="220" rx="16" fill="#5a3a1e" stroke="#3a2a14" stroke-width="4"/><circle cx="200" cy="130" r="92" fill="${inst.c}"/><circle cx="200" cy="130" r="84" fill="#f6f0dc"/>
    ${Array.from({ length: 12 }, (_, i) => `<text x="${(200 + Math.sin(((i + 1) * 30) / 57.3) * 70).toFixed(1)}" y="${(134 - Math.cos(((i + 1) * 30) / 57.3) * 70).toFixed(1)}" font-size="12" text-anchor="middle" fill="#1a1030" font-family="serif">${i + 1}</text>`).join("")}
    ${hand(ha, 44, 4)}${hand(ma, 64, 2.5)}<circle cx="200" cy="130" r="4" fill="#1a1030"/><text x="200" y="176" font-size="9" text-anchor="middle" fill="#5a3a1e">GREENWICH · ${sight.gmt}</text>
    <circle cx="340" cy="46" r="16" fill="#ffd86b"/><text x="340" y="78" fill="#ffd86b" font-size="9" text-anchor="middle">local noon</text><g id="nv-fx"></g></svg>`;
}

const prev = (draw) => (id, ctx) => { styleOnce(); ctx.tableEl.className = "table navigator"; ctx.tableEl.innerHTML = draw(id); };
export const shop = {
  kind: "sail", label: "⛵ Sails", items: SAILS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: { open: ["Sails from real ships. Each one crossed an ocean.", "Canvas, cotton, pandanus. Wind doesn't mind which."], tryon: ["The {item}. She'll fly.", "Picture the {item} with a fair wind."], buy: ["The {item} is yours. Your ship wears it now.", "Sold. Fair winds to your {item}."] },
  preview: prev((id) => chartSvg(VOYAGES[0], 2, SAILS.find((x) => x.id === id) || SAILS[0])),
};
export const instShop = {
  kind: "navinst", label: "🧭 Navigator's instruments", items: INSTRUMENTS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: { open: ["Instruments that found the way home.", "From a card on a string to Harrison's watch."], tryon: ["The {item}. Steady hands now.", "Try a sight with the {item}."], buy: ["The {item} is yours. It frames every sight.", "Sold. May the {item} always find the horizon."] },
  preview: prev((id) => sightSvg({ kind: "polaris", alt: 40 }, 40, INSTRUMENTS.find((x) => x.id === id) || INSTRUMENTS[0])),
};

export const celestialNavigator = {
  id: "navigator", label: "Celestial Navigator", emoji: "🧭", shop, shops: [instShop],
  blurb: "Sail a real voyage home by the sky: Polaris for latitude, the noon Sun, then the chronometer for longitude",
  open(C) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, greet, award, tableEl, reduced } = C;
    styleOnce();
    const P = () => state.prog, R = () => NR(P()), save = () => { try { saveProgress(); } catch {} };
    const day = todayKey(), dseed = dailySeed("navigator", day);
    const back = () => `<div class="choices"><button class="c small" type="button" id="nv-lobby">🧭 Back to the chart room</button></div>`;
    const wireBack = () => { const b = $("nv-lobby"); if (b) b.onclick = () => lobby(false); };
    const shake = () => { const s = $id("nv-svg"); if (!s) return; s.classList.remove("shake"); void s.getBoundingClientRect(); s.classList.add("shake"); };
    const LV = [null, ["⭐ 1 · Polaris", "Bring Polaris to the horizon: its height is your latitude"], ["☀️ 2 · The noon Sun", "Shoot the Sun at noon and use the almanac"], ["⏱️ 3 · Longitude", "The chronometer keeps Greenwich time"]];

    const race = makeRace(C, { game: "navigator", title: "Crew race", emoji: "⛵", unit: "★", intro: "Same voyage for every crew, steering by Polaris.", play: (seed, done) => run(1, false, { seed, onDone: done }), back: () => lobby(false), sfx: (w) => S.verdict(w) });
    function lobby(first) {
      clearReading(); cap("🧭 Celestial Navigator"); tableEl.className = "table navigator"; tableEl.innerHTML = chartSvg(VOYAGES[0], 0, sailOf(P()));
      if (first) S.domeOpen();
      say(first ? `No satellites, ${state.name}. Just the sky, a sextant and a good clock. Let's bring a ship home.` : pick(["The sea is wide. The sky is a map.", "Polaris for latitude, the clock for longitude. Ready?", "Every voyage here really happened."]));
      const r = R(), ds = dailyState(P(), "navigator");
      const lv = (n) => `<button class="c level" type="button" id="nv-go${n}"${isOpen(P(), n) ? "" : " disabled"}><b>${LV[n][0]}</b><span>${isOpen(P(), n) ? `${LV[n][1]}${r.best[n] ? ` · best ${r.best[n]}★` : ""}` : `Clear Level ${n - 1} to open`}</span></button>`;
      ui(`<div class="cx-top"><b>🧭 Celestial Navigator</b> · ${r.voyages.length} / ${VOYAGES.length} voyages completed · ${r.cleared.length} / 3 levels cleared</div>
        <div class="levels">${lv(1)}${lv(2)}${lv(3)}</div>
        <div class="choices"><button class="c main" type="button" id="nv-daily">📅 Daily Voyage #${dayNumber(day)}${ds.played ? " ✓" : ""}</button><button class="c small" type="button" id="nv-guide">📖 Navigator's manual</button><button class="c small" type="button" id="nv-race">⛵ Crew race</button><button class="c small" type="button" id="back">✦ Leave</button></div>
        <div class="note">A run is one real voyage: ${ROUNDS} days at sea, one sight a day. Get ${PASS} right to clear a level.</div>`);
      [1, 2, 3].forEach((n) => { const b = $("nv-go" + n); if (b && isOpen(P(), n)) b.onclick = () => run(n, false); });
      $("nv-daily").onclick = () => run(1, true); $("back").onclick = () => { race.leave(); greet(); }; $("nv-race").onclick = () => race.open(); $("nv-guide").onclick = () => (C.study ? C.study("navigator", () => lobby(false)) : null);
    }

    function run(level, daily, opt = {}) {
      const t0 = Date.now();
      const base = opt.seed != null ? opt.seed >>> 0 : daily ? dseed : (Math.random() * 2 ** 31) >>> 0, v = voyageOf(level, base), results = []; let i = 0, settled = -1;
      const dots = () => `<span class="nv-dots">${Array.from({ length: ROUNDS }, (_, k) => (k < results.length ? (results[k] ? "★".repeat(results[k]) : "✗") : "·")).join(" ")}</span>`;
      const next = (stars) => { if (settled === i) return; settled = i; $("ui").querySelectorAll("button:not(#nv-lobby)").forEach((b) => (b.disabled = true)); results.push(stars);
        tableEl.innerHTML = chartSvg(v, i + 1, sailOf(P()), true); i++; setTimeout(() => (i < ROUNDS ? play() : finish()), reduced ? 400 : 1900); };
      clearReading(); tableEl.className = "table navigator"; tableEl.innerHTML = chartSvg(v, 0, sailOf(P()));
      say(`${v.name}: ${v.from.name} to ${v.to.name}. ${v.note}`);
      ui(`<div class="nv-fact">${esc(v.note)}</div><div class="choices"><button class="c main" type="button" id="nv-sail">⛵ Set sail</button></div>${back()}`); wireBack();
      $("nv-sail").onclick = () => play();
      const play = () => {
        clearReading(); cap(`🧭 ${v.name} · day ${i + 1} of ${ROUNDS}`);
        const sight = sightOf(level, v, i, (base + i * 7919) >>> 0); let tries = 0;
        const ask = () => {
          if (level === 3) tableEl.innerHTML = chronoSvg(sight, instOf(P()));
          ui(`<div class="group">Day ${i + 1} ${dots()}</div><div class="nv-fact">${esc(sight.q)}</div><div class="choices">${sight.choices.map((c, k) => `<button class="c small" type="button" data-k="${k}">${esc(c)}</button>`).join("")}</div>${back()}`); wireBack();
          $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
            const c = sight.choices[+b.dataset.k];
            if (c === sight.a) { S.verdict(true); $id("reading-body").innerHTML = `<div class="nv-fact">${esc(sight.why)}</div>`; say(pick(["Position fixed. Mark the chart.", "That's where we are.", "Spot on. The helmsman nods."])); return next(starsFor(tries + 1)); }
            tries++; S.gutter(); shake(); b.disabled = true; const m = C.banter && C.banter("navigator", "mid"); if (m && C.bubble && tries === 1) C.bubble(m, 3000);
            if (tries >= 3) { $id("reading-body").innerHTML = `<div class="nv-fact">It was ${esc(sight.a)}. ${esc(sight.why)}</div>`; next(0); } else say(level === 3 ? "Not quite. Each hour after Greenwich noon is 15° west." : "Not quite. Check your sight again.");
          }));
        };
        if (level === 3) { say(i === 0 ? "Greenwich noon is 12:00 on the chronometer. Our noon comes later: every hour later is 15° further west." : pick(["Noon again. Read the clock.", "The Sun's at its highest. What does Greenwich say?"])); S.ping(3); return ask(); }
        // Levels 1-2: take the sight with the sextant arm first.
        let angle = Math.max(0, Math.round(sightAngle(sight) + (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 10)));
        const draw = () => { tableEl.innerHTML = sightSvg(sight, angle, instOf(P())); };
        draw(); S.ping(level === 1 ? 2 : 1);
        say(level === 1 ? (i === 0 ? "Night falls. Find Polaris and move the arm until it sits right on the horizon." : "Polaris again. Bring it down to the sea.") : (i === 0 ? "Noon. Move the arm until the Sun sits on the horizon." : "Noon sight. Steady now."));
        ui(`<div class="group">Day ${i + 1} ${dots()}</div><input class="nv-arm" id="nv-arm" type="range" min="0" max="90" step="0.1" value="${angle}" aria-label="Sextant arm angle">
          <div class="choices"><button class="c main" type="button" id="nv-take">🎯 Take the sight</button></div>${back()}`); wireBack();
        $("nv-arm").oninput = (e) => { angle = +e.target.value; draw(); };
        $("nv-take").onclick = () => {
          if (!goodSight(sight, angle)) { S.gutter(); shake(); const off = sightAngle(sight) - angle; say(off > 0 ? `It's still ${Math.abs(off).toFixed(1)}° above the horizon. More angle.` : `It's ${Math.abs(off).toFixed(1)}° below the horizon now. Less angle.`); return; }
          S.discover(); angle = sightAngle(sight); draw(); say(`Got it: ${angle.toFixed(1)}° above the horizon.`); setTimeout(ask, reduced ? 100 : 700);
        };
      };
      const finish = () => {
        const res = settleRun(P(), level, v.id, results), stars = res.stars, xp = 3 * stars, es = 2 * stars + (res.first ? 10 : 0) + (res.newVoyage ? 5 : 0);
        let bonus = ""; if (daily) { const d = finishDaily(P(), "navigator", { score: stars * 10, won: res.won, detail: `${stars}★` }, day); if (d.first) bonus = " · 📅 Daily done"; }
        const aw = award(xp, es); save(); showStats(); C.trophy?.("navigator", level, { won: res.won, perfect: res.perfect });
        if (opt.onDone) return opt.onDone({ n: stars, t: Date.now() - t0 });
        S.verdict(res.won); const b = C.banter && C.banter("navigator", res.won ? "win" : "lose"); if (b && C.bubble) C.bubble(b, 3500);
        tableEl.innerHTML = chartSvg(v, ROUNDS, sailOf(P()), res.won);
        say(res.won ? `Land ho! ${v.to.name} off the bow.${res.perfect ? " Not one sight wasted." : ""}` : `We're lost, ${state.name}. Dead reckoning will have to do. Try the voyage again.`);
        ui(`<div class="reward"><div>${res.won ? `⚓ Landfall at ${esc(v.to.name)}` : "Voyage over"} · ${stars}★ ${dots()}</div><div class="up">+${xp} ✦ · +${es} 💎${res.first ? " · level cleared!" : ""}${res.newVoyage ? " · new voyage logged" : ""}${bonus}${aw && aw.rankUp ? ` · 🏅 You are now <b>${esc(aw.rankUp)}</b>` : ""}</div></div>
          <div class="choices"><button class="c main" type="button" id="nv-again">↻ Another voyage</button>${level < 3 && isOpen(P(), level + 1) && !daily ? `<button class="c" type="button" id="nv-next">${LV[level + 1][0]}</button>` : ""}</div>${back()}`);
        $("nv-again").onclick = () => run(level, false); const n = $("nv-next"); if (n) n.onclick = () => run(level + 1, false); wireBack();
      };
    }
    lobby(true);
  },
};

export function navigatorCodex(p, esc) {
  const r = NR(p); if (!r.plays) return "";
  const names = VOYAGES.filter((v) => r.voyages.includes(v.id)).map((v) => esc(v.name)).join(", ");
  return `<div class="bk-room"><h4>🧭 Celestial Navigator</h4><p>${r.cleared.length} / 3 levels cleared · ${r.voyages.length} / ${VOYAGES.length} voyages${names ? `: ${names}` : ""}</p></div>`;
}
export { GUIDE };
