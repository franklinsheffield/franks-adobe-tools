// Eclipse Chaser: a room of the Chamber (Keeper Altair's House, #🔭-observatory). Line up Sun, Moon and nodes, then
// predict real eclipses. Logic in engine.js; this file draws and wires it. Trophy: C.trophy("eclipse", level, ...).
import { room as ER, ROUNDS, PASS, roundOf, starsFor, isOpen, settleRun, PHASES, TILT, nextSolar, fmtDate } from "./engine.js";
import { GUIDE } from "./guide.js";
import { dailySeed, dailyState, finishDaily, todayKey, dayNumber } from "../daily.js";
import * as S from "../stars/sfx.js";

export const CORONAE = [
  { id: "co-pearl", name: "Pearly corona", price: 0, c1: "#f4f6ff", c2: "#9fb4ff", rays: 10, note: "The corona is the Sun's outer atmosphere, over a million degrees, and only shows to the eye during totality." },
  { id: "co-1868", name: "1868: the helium eclipse", price: 50, c1: "#fff6c8", c2: "#ffd24a", rays: 12, note: "At the eclipse of 18 August 1868 Jules Janssen saw a yellow line in the Sun's spectrum that matched no known element. It was helium, found on the Sun before Earth." },
  { id: "co-1919", name: "1919: Eddington's plates", price: 70, c1: "#ffffff", c2: "#c9d4ff", rays: 14, note: "On 29 May 1919 expeditions to Príncipe and Sobral photographed stars beside the eclipsed Sun. Their light was bent by the Sun's gravity, as Einstein predicted." },
  { id: "co-2017", name: "2017: coast to coast", price: 90, c1: "#f0f6ff", c2: "#7fb2ff", rays: 16, note: "On 21 August 2017 totality crossed the whole United States from Oregon to South Carolina, the first coast-to-coast path since 1918." },
  { id: "co-2024", name: "2024: prominences in pink", price: 110, c1: "#fff0f4", c2: "#ff7aa8", rays: 16, prom: true, note: "On 8 April 2024 totality crossed Mexico, the US and Canada, lasting up to 4 minutes 28 seconds, with bright pink prominences at the Sun's edge." },
];
export const GLASSES = [
  { id: "eg-card", name: "Card eclipse glasses", price: 0, frame: "#2b2b2b", note: "Safe eclipse glasses meet the ISO 12312-2 standard. Sunglasses, even very dark ones, are not safe." },
  { id: "eg-pinhole", name: "Pinhole projector", price: 30, frame: "#8a6420", note: "A pinhole projects an image of the Sun onto card, so you never look at the Sun at all. Gaps between leaves do it too: watch for crescents on the ground." },
  { id: "eg-welder", name: "Welder's glass, shade 14", price: 50, frame: "#355b3a", note: "Only very dark welding glass is safe for the Sun: shade 12 or darker, and shade 14 is the usual pick. Most welding glass is too light." },
  { id: "eg-scope", name: "Telescope solar filter", price: 80, frame: "#E2B04A", note: "A telescope needs its own solar filter over the front of the tube. Never use a filter at the eyepiece end: the focused sunlight can crack it." },
];
const KIND = "corona", GKIND = "eclipseglasses";
const owned = (list, kind) => (p) => list.find((t) => t.id === p[kind] && (t.price === 0 || (p.owned || []).includes(t.id))) || list[0];
const coronaOf = owned(CORONAE, KIND), glassesOf = owned(GLASSES, GKIND);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const $id = (id) => document.getElementById(id);

const CSS = `.table.eclipse{background:radial-gradient(ellipse at 50% 120%,#1a2b55 0%,#0B1530 55%,#050a18 100%);pointer-events:auto;overflow:hidden}
.ec-svg{position:absolute;inset:5% 5% 10%;width:90%;height:85%}
.ec-svg .moon-slide{animation:ec-slide 6s cubic-bezier(.4,0,.6,1) forwards}@keyframes ec-slide{from{transform:translateX(-150px)}to{transform:translateX(0)}}
.ec-svg .corona{opacity:0;animation:ec-show 1.4s 5.2s forwards}@keyframes ec-show{to{opacity:1}}
.ec-svg .rays{transform-origin:200px 130px;animation:ec-spin 60s linear infinite}@keyframes ec-spin{to{transform:rotate(360deg)}}
.ec-svg .sky{animation:ec-dark 6s forwards}@keyframes ec-dark{to{fill:#03050c}}
.ec-svg .glasses{animation:ec-off 1s 4.8s forwards}@keyframes ec-off{to{opacity:0}}
.ec-svg .hl{animation:ec-pulse 1.4s ease-in-out infinite}@keyframes ec-pulse{50%{opacity:.35}}
.ec-svg.shake{animation:ec-shake .35s}@keyframes ec-shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.ec-fact{border-left:3px solid #8FB8FF;padding:4px 10px;margin:8px 0;color:#DCE6FF}.ec-dots{letter-spacing:.2em;color:#E2B04A}
@media (prefers-reduced-motion:reduce){.ec-svg *,.ec-svg{animation:none!important}.ec-svg .corona{opacity:1}.ec-svg .glasses{opacity:0}}`;
function styleOnce() { if ($id("ec-style")) return; const s = document.createElement("style"); s.id = "ec-style"; s.textContent = CSS; document.head.appendChild(s); }

// ---- drawings (viewBox 400x260) ----
/** Totality: the Moon slides over the Sun (seen through the chosen glasses), then the corona appears. */
export function totalitySvg(co, gl, { annular = false } = {}) {
  const rays = Array.from({ length: co.rays }, (_, i) => { const a = (i / co.rays) * Math.PI * 2, L = 60 + ((i * 37) % 5) * 14; return `<path d="M${200 + Math.cos(a) * 30} ${130 + Math.sin(a) * 30} L${(200 + Math.cos(a + 0.06) * L).toFixed(1)} ${(130 + Math.sin(a + 0.06) * L).toFixed(1)} L${(200 + Math.cos(a - 0.06) * L).toFixed(1)} ${(130 + Math.sin(a - 0.06) * L).toFixed(1)}Z" fill="${co.c1}" opacity=".35"/>`; }).join("");
  const prom = co.prom ? [0.6, 2.3, 4.1].map((a) => `<ellipse cx="${(200 + Math.cos(a) * 31).toFixed(1)}" cy="${(130 + Math.sin(a) * 31).toFixed(1)}" rx="4" ry="2.4" transform="rotate(${(a * 57.3).toFixed(0)} ${(200 + Math.cos(a) * 31).toFixed(1)} ${(130 + Math.sin(a) * 31).toFixed(1)})" fill="#ff6a9a"/>`).join("") : "";
  const moonR = annular ? 26 : 31;
  return `<svg class="ec-svg" id="ec-svg" viewBox="0 0 400 260" role="img" aria-label="An eclipse of the Sun"><defs><radialGradient id="ec-co"><stop offset=".3" stop-color="${co.c1}" stop-opacity=".95"/><stop offset=".55" stop-color="${co.c2}" stop-opacity=".35"/><stop offset="1" stop-color="${co.c2}" stop-opacity="0"/></radialGradient></defs>
    <rect class="sky" width="400" height="260" fill="#1d3570"/>
    ${annular ? "" : `<g class="corona"><circle cx="200" cy="130" r="95" fill="url(#ec-co)"/><g class="rays">${rays}</g>${prom}</g>`}
    <circle cx="200" cy="130" r="30" fill="${annular ? "#ffcf6b" : "#fff3c4"}"/>
    <g class="moon-slide"><circle cx="200" cy="130" r="${moonR}" fill="#05070f"/></g>
    <g class="glasses"><rect width="400" height="260" fill="#000" opacity=".55"/><rect x="95" y="62" width="210" height="136" rx="40" fill="none" stroke="${gl.frame}" stroke-width="18"/><text x="200" y="230" fill="#DCE6FF" font-size="11" text-anchor="middle">Through ${gl.name.toLowerCase()} until totality</text></g><g id="ec-fx"></g></svg>`;
}
/** Level 1: a top view (Sun, Earth, Moon's orbit) and a side view (the Moon above or below Earth's orbital plane). */
export function lineUpSvg(cfg) {
  const a = (cfg.ph * Math.PI) / 180, R = cfg.near ? 46 : 58, mx = 150 - Math.cos(a) * R, my = 110 - Math.sin(a) * R, lit = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#2a2f45"/><path d="M${x} ${y - 7} A7 7 0 0 0 ${x} ${y + 7}Z" fill="#f4f1e6"/>`;
  const sy = 200 - cfg.lat * 9;
  return `<svg class="ec-svg" id="ec-svg" viewBox="0 0 400 260" role="img" aria-label="Sun, Earth and Moon from above and from the side"><rect width="400" height="260" fill="#05070f"/>
    <text x="10" y="18" fill="#8FB8FF" font-size="10">From above</text><circle cx="34" cy="110" r="18" fill="#ffd86b"/><text x="34" y="142" fill="#ffd86b" font-size="9" text-anchor="middle">Sun</text>
    <line x1="54" y1="110" x2="390" y2="110" stroke="#ffd86b" stroke-dasharray="2 6" opacity=".35"/>
    <circle cx="150" cy="110" r="${R}" fill="none" stroke="#2A3F6E" stroke-dasharray="3 4"/><circle cx="150" cy="110" r="11" fill="#3b7bd8"/><text x="150" y="${110 + R + 14}" fill="#8FB8FF" font-size="9" text-anchor="middle">${cfg.near ? "near (perigee)" : "far (apogee)"}</text>
    ${lit(mx.toFixed(1), my.toFixed(1))}<text x="${mx.toFixed(1)}" y="${(my - 11).toFixed(1)}" fill="#DCE6FF" font-size="9" text-anchor="middle">Moon</text>
    <text x="250" y="18" fill="#8FB8FF" font-size="10">From the side</text><line x1="230" y1="200" x2="395" y2="200" stroke="#ffd86b" opacity=".5"/><text x="395" y="214" fill="#ffd86b" font-size="8" text-anchor="end">Earth's orbital plane</text>
    <line x1="250" y1="${200 + 40 * Math.sin(TILT / 57.3) * 9}" x2="380" y2="${200 - 40 * Math.sin(TILT / 57.3) * 9}" stroke="#8FB8FF" stroke-dasharray="3 3" opacity=".5"/>
    <circle cx="300" cy="200" r="6" fill="#3b7bd8"/><circle cx="345" cy="${sy.toFixed(1)}" r="4" fill="#f4f1e6"/><text x="352" y="${(sy + 3).toFixed(1)}" fill="#DCE6FF" font-size="9">${cfg.lat > 0 ? "+" : ""}${cfg.lat}°</text><g id="ec-fx"></g></svg>`;
}
/** Level 2: four real Moons of a year, by date across and height above Earth's orbital plane up and down. */
export function nodesSvg(rd, reveal = false) {
  const x = (ms) => 30 + ((ms - Date.UTC(rd.year, 0, 1)) / (365.25 * 864e5)) * 340, y = (lat) => 130 - lat * 20;
  return `<svg class="ec-svg" id="ec-svg" viewBox="0 0 400 260" role="img" aria-label="The Moon's height above Earth's orbit at four ${rd.solar ? "New" : "Full"} Moons"><rect width="400" height="260" fill="#05070f"/>
    ${reveal ? `<rect x="20" y="${y(rd.solar ? 1.5 : 1)}" width="360" height="${(rd.solar ? 3 : 2) * 20}" fill="#E2B04A" opacity=".12"/>` : ""}
    <line x1="20" y1="130" x2="380" y2="130" stroke="#ffd86b" opacity=".6"/><text x="380" y="124" fill="#ffd86b" font-size="9" text-anchor="end">Earth's orbital plane (the ecliptic)</text>
    ${[5, -5].map((l) => `<line x1="20" y1="${y(l)}" x2="380" y2="${y(l)}" stroke="#2A3F6E" stroke-dasharray="2 5"/><text x="22" y="${y(l) - 3}" fill="#8FB8FF" font-size="8">${l > 0 ? "+" : ""}${l}°</text>`).join("")}
    ${["Jan", "Apr", "Jul", "Oct"].map((m, i) => `<text x="${30 + i * 85}" y="234" fill="#8FB8FF" font-size="9">${m} ${rd.year}</text>`).join("")}
    ${rd.opts.map((o, i) => `<g${reveal && o.date === rd.a ? ' class="hl"' : ""}><circle cx="${x(o.ms).toFixed(1)}" cy="${y(o.lat).toFixed(1)}" r="6" fill="${rd.solar ? "#2a2f45" : "#f4f1e6"}" stroke="#DCE6FF"/><text x="${x(o.ms).toFixed(1)}" y="${(y(o.lat) + (o.lat > 0 ? -10 : 18)).toFixed(1)}" fill="#DCE6FF" font-size="9" text-anchor="middle">${"ABCD"[i]}</text></g>`).join("")}<g id="ec-fx"></g></svg>`;
}

const preview = (draw) => (id, ctx) => { styleOnce(); ctx.tableEl.className = "table eclipse"; ctx.tableEl.innerHTML = draw(id); };
export const shop = {
  kind: KIND, label: "🌑 Eclipse coronae", items: CORONAE.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: { open: ["Coronae from real eclipses. Each one lasted only minutes.", "The Sun's crown. You only see it when the Moon covers the rest."], tryon: ["The {item}. Worth travelling across the world for.", "Picture the {item} over your next totality."], buy: ["The {item} is yours. It appears at totality.", "Sold. Clear skies for your {item}."] },
  preview: preview((id) => totalitySvg(CORONAE.find((x) => x.id === id) || CORONAE[0], GLASSES[0])),
};
export const glassesShop = {
  kind: GKIND, label: "🕶️ Eclipse glasses", items: GLASSES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: { open: ["Safe ways to watch the Sun. Never look without one.", "Everything here keeps your eyes. Sunglasses don't."], tryon: ["The {item}. Safe and rather smart.", "Try the {item} for the partial phase."], buy: ["The {item} is yours. Use it until totality, and straight after.", "Sold. Your retinas thank you."] },
  preview: preview((id) => totalitySvg(CORONAE[0], GLASSES.find((x) => x.id === id) || GLASSES[0])),
};

export const eclipse = {
  id: "eclipse", label: "Eclipse Chaser", emoji: "🌑", shop, shops: [glassesShop],
  blurb: "Line up the Sun, Moon and nodes, then predict real eclipses and where to see them",
  open(C) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, greet, award, tableEl, reduced } = C;
    styleOnce();
    const P = () => state.prog, R = () => ER(P()), save = () => { try { saveProgress(); } catch {} };
    const day = todayKey(), dseed = dailySeed("eclipse", day);
    const back = () => `<div class="choices"><button class="c small" type="button" id="ec-lobby">🌑 Back to the chart table</button></div>`;
    const wireBack = () => { const b = $("ec-lobby"); if (b) b.onclick = () => lobby(false); };
    const shake = () => { const s = $id("ec-svg"); if (!s) return; s.classList.remove("shake"); void s.getBoundingClientRect(); s.classList.add("shake"); };
    const LV = [null, ["☀️ 1 · Line them up", "Where is the Moon? Say what happens"], ["🌗 2 · The nodes", "Which real New or Full Moon makes the eclipse?"], ["🗺️ 3 · Saros and paths", "Predict real eclipses ahead"]];

    function lobby(first) {
      clearReading(); cap("🌑 Eclipse Chaser"); tableEl.className = "table eclipse"; tableEl.innerHTML = totalitySvg(coronaOf(P()), glassesOf(P()));
      const nx = nextSolar();
      if (first) S.domeOpen();
      say(first ? `The Moon is 400 times smaller than the Sun and about 400 times closer, ${state.name}. That coincidence is why eclipses exist. Shall we chase one?`
        : pick([`The next solar eclipse on Earth is ${nx.kind}, on ${fmtDate(nx.ms)}.`, "Babylonians predicted eclipses with clay tablets. We have this table.", "Sun, Moon, node: line them up."]));
      const r = R(), ds = dailyState(P(), "eclipse");
      const lv = (n) => `<button class="c level" type="button" id="ec-go${n}"${isOpen(P(), n) ? "" : " disabled"}><b>${LV[n][0]}</b><span>${isOpen(P(), n) ? `${LV[n][1]}${r.best[n] ? ` · best ${r.best[n]}★` : ""}` : `Clear Level ${n - 1} to open`}</span></button>`;
      ui(`<div class="cx-top"><b>🌑 Eclipse Chaser</b> · ${r.cleared.length} / 3 levels cleared · next on Earth: ${esc(nx.kind)} solar eclipse, ${esc(fmtDate(nx.ms))}</div>
        <div class="levels">${lv(1)}${lv(2)}${lv(3)}</div>
        <div class="choices"><button class="c main" type="button" id="ec-daily">📅 Daily Eclipse #${dayNumber(day)}${ds.played ? " ✓" : ""}</button><button class="c small" type="button" id="ec-guide">📖 Eclipse notes</button><button class="c small" type="button" id="back">✦ Leave</button></div>
        <div class="note">${ROUNDS} questions a run. Get ${PASS} right to clear a level. Never look at the Sun without proper eclipse glasses.</div>`);
      [1, 2, 3].forEach((n) => { const b = $("ec-go" + n); if (b && isOpen(P(), n)) b.onclick = () => run(n, false); });
      $("ec-daily").onclick = () => run(1, true); $("back").onclick = greet; $("ec-guide").onclick = () => (C.study ? C.study("eclipse", () => lobby(false)) : null);
    }

    function run(level, daily) {
      const results = [], base = daily ? dseed : (Math.random() * 2 ** 31) >>> 0; let i = 0, settled = -1;
      const dots = () => `<span class="ec-dots">${Array.from({ length: ROUNDS }, (_, k) => (k < results.length ? (results[k] ? "★".repeat(results[k]) : "✗") : "·")).join(" ")}</span>`;
      const next = (stars, wait = 1400) => { if (settled === i) return; settled = i; $("ui").querySelectorAll("button:not(#ec-lobby)").forEach((b) => (b.disabled = true)); results.push(stars); i++; setTimeout(() => (i < ROUNDS ? play() : finish()), reduced ? 400 : wait); };
      const play = () => {
        clearReading(); cap(`🌑 ${daily ? `Daily Eclipse #${dayNumber(day)}` : LV[level][0]} · ${i + 1} of ${ROUNDS}`); tableEl.className = "table eclipse";
        const seed = (base + i * 7919) >>> 0, rd = roundOf(level, seed); let tries = 0;
        let q, choices, a, after;
        if (level === 1) { tableEl.innerHTML = lineUpSvg(rd.cfg); q = `${PHASES[rd.cfg.ph]}, ${Math.abs(rd.cfg.lat)}° ${rd.cfg.lat >= 0 ? "above" : "below"} Earth's orbital plane, ${rd.cfg.near ? "near" : "far"}. What happens?`; choices = rd.choices; a = rd.a;
          after = () => { if (a !== "No eclipse" && a.includes("solar")) { tableEl.innerHTML = totalitySvg(coronaOf(P()), glassesOf(P()), { annular: a.startsWith("Annular") }); return 6200; } return 1400; }; }
        else if (level === 2) { tableEl.innerHTML = nodesSvg(rd); q = `Four ${rd.solar ? "New" : "Full"} Moons of ${rd.year}. Only one made a ${rd.solar ? "solar" : "lunar"} eclipse. Which?`; choices = rd.opts.map((o, k) => `${"ABCD"[k]} · ${o.date} (${o.lat > 0 ? "+" : ""}${o.lat}°)`); a = choices[rd.opts.findIndex((o) => o.date === rd.a)];
          after = () => { tableEl.innerHTML = nodesSvg(rd, true); return 1800; }; }
        else { tableEl.innerHTML = totalitySvg(coronaOf(P()), glassesOf(P())); q = rd.q; choices = rd.choices; a = rd.a; after = () => 1600; }
        S.ping(2 + (i % 3));
        say(i === 0 ? (level === 1 ? "Solar eclipses need a New Moon, lunar ones a Full Moon. And the Moon must be on the plane." : level === 2 ? "The Moon's orbit is tilted about 5°. It crosses Earth's orbital plane at two nodes. Eclipses happen only near them." : "The Babylonians spotted the saros. Halley named it. Let's use it.") : pick(["Next one.", "Line it up.", "Think: phase, height, distance."]));
        ui(`<div class="group">${i + 1} of ${ROUNDS} ${dots()}</div><div class="ec-fact">${esc(q)}</div><div class="choices">${choices.map((c, k) => `<button class="c small" type="button" data-k="${k}">${esc(c)}</button>`).join("")}</div>${back()}`); wireBack();
        $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
          const c = choices[+b.dataset.k];
          if (c === a) { S.verdict(true); $id("reading-body").innerHTML = `<div class="ec-fact">${esc(rd.why)}</div>`; say(pick(["Exactly right.", "That's the one.", "Spot on."])); return next(starsFor(tries + 1), after()); }
          tries++; S.gutter(); shake(); b.disabled = true; const m = C.banter && C.banter("eclipse", "mid"); if (m && C.bubble && tries === 1) C.bubble(m, 3000);
          if (tries >= 3 || choices.length - tries <= 1) { $id("reading-body").innerHTML = `<div class="ec-fact">It was: ${esc(a)}. ${esc(rd.why)}</div>`; next(0, after() + 600); } else say(level === 1 ? "Not quite. Check the phase first, then the height." : "Not that one. Try again.");
        }));
      };
      const finish = () => {
        const res = settleRun(P(), level, results), stars = res.stars, xp = 3 * stars, es = 2 * stars + (res.first ? 10 : 0);
        let bonus = ""; if (daily) { const d = finishDaily(P(), "eclipse", { score: stars * 10, won: res.won, detail: `${stars}★` }, day); if (d.first) bonus = " · 📅 Daily done"; }
        const aw = award(xp, es); save(); showStats(); C.trophy?.("eclipse", level, { won: res.won, perfect: res.perfect });
        S.verdict(res.won); const b = C.banter && C.banter("eclipse", res.won ? "win" : "lose"); if (b && C.bubble) C.bubble(b, 3500);
        if (res.won) tableEl.innerHTML = totalitySvg(coronaOf(P()), glassesOf(P()));
        say(res.won ? (res.perfect ? "Every one first time. The Babylonians would have made you chief scribe." : `${res.right} of ${ROUNDS}. A good chase.`) : `${res.right} of ${ROUNDS}. Eclipses are patient. Try again.`);
        ui(`<div class="reward"><div>${res.won ? "✓ Run cleared" : "Run over"} · ${stars}★ ${dots()}</div><div class="up">+${xp} ✦ · +${es} 💎${res.first ? " · level cleared!" : ""}${bonus}${aw && aw.rankUp ? ` · 🏅 You are now <b>${esc(aw.rankUp)}</b>` : ""}</div></div>
          <div class="choices"><button class="c main" type="button" id="ec-again">↻ Again</button>${level < 3 && isOpen(P(), level + 1) && !daily ? `<button class="c" type="button" id="ec-next">${LV[level + 1][0]}</button>` : ""}</div>${back()}`);
        $("ec-again").onclick = () => run(level, false); const n = $("ec-next"); if (n) n.onclick = () => run(level + 1, false); wireBack();
      };
      play();
    }
    lobby(true);
  },
};

export function eclipseCodex(p, esc) {
  const r = ER(p); if (!r.plays) return "";
  return `<div class="bk-room"><h4>🌑 Eclipse Chaser</h4><p>${r.cleared.length} / 3 levels cleared · best ${[1, 2, 3].map((l) => `${r.best[l] || 0}★`).join(" / ")}</p></div>`;
}
export { GUIDE };
