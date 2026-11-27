// The Night Watch: the Observatory's core loop, a room of the Chamber (Keeper Altair's House, #🔭-observatory).
// 1. Night Watch: tonight's real sky over the player's city (city only). Pick a target, find it, choose the eyepiece, log it.
// 2. Plate Room: every logged object becomes a glass plate to measure with a real method (spectra, light curves, blinking).
// 3. Almanac Desk: 3 jobs a day, the same for everyone. Hard jobs need a Plate Room result.
// Trophy levels: 1 = a logged observation, 2 = a measured plate, 3 = a delivered job (C.trophy("watch", level, ...)).
// Mounted via ROOMS (main.js): watch.open(ctx), watchCodex, shop.
import * as A from "astronomy-engine";
import { EYEPIECES, CLASS_INFO, SPECTRUM_FACT, TARGETS, WANDERERS, magnification, targetById, MESSIER_COUNT } from "./catalog.js";
import { room as W, placeOf, upNow, watchTime, tonightsTarget, eyeVerdict, needsDark, observe, logged, logCount, loggedTargets, messierLogged,
  plateQuestion, settlePlate, measured, plateCount, repOf, nextRep, PAY } from "./engine.js";
import { jobsFor, jobById, unlocked, questionFor, deskToday, deliver } from "./desk.js";
import { PLACES, cityOf, clock } from "../stars/tonight.js";
import { dailySeed, dailyState, finishDaily, todayKey, dayNumber } from "../daily.js";
import { GUIDE } from "./guide.js";
import * as S from "../stars/sfx.js";
import { grantRoyal } from "../hosts/observatory-dome.js";

const KIND = "plateframe";
export const FRAMES = [
  { id: "pf-glass", name: "Plain glass plate", price: 0, rim: "#9fb4d8", note: "Astronomers photographed the sky on glass plates for about a century, until electronic cameras took over." },
  { id: "pf-harvard", name: "Harvard plate envelope", price: 40, rim: "#c9b48a", note: "Harvard College Observatory keeps more than 500,000 glass plates of the sky, in paper envelopes." },
  { id: "pf-carte", name: "Carte du Ciel plate", price: 60, rim: "#8FB8FF", note: "In 1887 observatories round the world agreed to photograph the whole sky together for the Carte du Ciel." },
  { id: "pf-yerkes", name: "Yerkes brass frame", price: 80, rim: "#E2B04A", note: "Yerkes Observatory's 40-inch telescope, opened in 1897, is the largest refracting telescope ever used for astronomy." },
  { id: "pf-palomar", name: "Palomar gilt frame", price: 120, rim: "#ffd86b", note: "The 200-inch Hale Telescope at Palomar saw first light in 1949 and was the largest in the world until 1975." },
];
const frameOf = (p) => FRAMES.find((f) => f.id === p[KIND] && (f.price === 0 || (p.owned || []).includes(f.id))) || FRAMES[0];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const $id = (id) => document.getElementById(id);
const fmtLy = (ly) => (ly >= 1e6 ? `${(ly / 1e6).toLocaleString("en", { maximumFractionDigits: 1 })} million` : ly.toLocaleString("en"));

// ---- styles ----
const CSS = `.table.watch{background:radial-gradient(ellipse at 50% 120%,#1a2b55 0%,#0B1530 55%,#050a18 100%);pointer-events:auto;overflow:hidden}
.nw-dome{position:absolute;inset:4% 6% 12%;width:88%;height:84%}
.nw-dome .tw{animation:nw-tw 3s ease-in-out infinite}.nw-dome .tw:nth-child(3n){animation-delay:-1.1s}.nw-dome .tw:nth-child(4n){animation-delay:-2.2s}
@keyframes nw-tw{0%,100%{opacity:.95}50%{opacity:.45}}
.nw-dome .tgt{cursor:pointer}.nw-dome .tgt.sel circle.ring{stroke:#E2B04A;stroke-width:2;animation:nw-pulse 1.2s ease-in-out infinite}
@keyframes nw-pulse{0%,100%{r:9}50%{r:13}}
.nw-dome .scope{transition:transform 1.2s cubic-bezier(.4,.1,.2,1);transform-origin:200px 200px}
.nw-plate{position:absolute;inset:8% 10% 14%;width:80%;height:78%;border-radius:10px;box-shadow:0 0 0 3px var(--rim,#9fb4d8),0 10px 30px #000a}
.nw-blink .b2{animation:nw-blink 1.2s steps(1) infinite}.nw-blink .b1{animation:nw-blink 1.2s steps(1) infinite reverse}
@keyframes nw-blink{0%{opacity:1}50%{opacity:0}}
.nw-dark{position:absolute;inset:0;background:#000;opacity:0;transition:opacity 1.5s;pointer-events:none}.nw-dark.on{opacity:.75}
.nw-jobs{display:grid;gap:8px;margin:6px 0}.nw-job{border:1px solid #2A3F6E;border-radius:10px;padding:8px 10px;background:#0B1530cc}
.nw-job b{color:#DCE6FF}.nw-job.done{opacity:.6}.nw-job.lock{border-style:dashed}
.nw-list{display:flex;flex-wrap:wrap;gap:6px}.nw-list .c small{opacity:.7}
.nw-log h3{font-family:var(--display);color:#8FB8FF;letter-spacing:.06em;margin:0 0 6px}.nw-log li{margin:3px 0}
.nw-fact{border-left:3px solid #8FB8FF;padding:4px 10px;margin:8px 0;color:#DCE6FF}`;
function styleOnce() { if ($id("nw-style")) return; const s = document.createElement("style"); s.id = "nw-style"; s.textContent = CSS; document.head.appendChild(s); }

// ---- drawings ----
/** The dome's view: a polar sky as you see it looking up (zenith in the middle, horizon at the rim, north up, east on the left), real targets as glints. */
export function domeSvg(up, { sel = null, logged: isLogged = () => false } = {}) {
  const R = 170, xy = (alt, az) => { const r = R * (1 - alt / 90), a = (270 - az) * Math.PI / 180; return [200 + r * Math.cos(a), 200 + r * Math.sin(a)]; };
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const field = Array.from({ length: 90 }, () => { const a = rnd() * 360, r = Math.sqrt(rnd()) * R; return `<circle class="tw" cx="${(200 + r * Math.cos(a)).toFixed(1)}" cy="${(200 + r * Math.sin(a)).toFixed(1)}" r="${(0.4 + rnd() * 0.9).toFixed(2)}" fill="#DCE6FF"/>`; }).join("");
  const s = up.find((o) => o.t.id === sel), ang = s ? s.az : 180;
  const glints = up.map((o) => { const [x, y] = xy(o.alt, o.az), on = o.t.id === sel, c = o.t.plate === "spectrum" ? ({ O: "#9bb0ff", B: "#aabfff", A: "#ffffff", F: "#f8f7ff", G: "#fff4e8", K: "#ffd2a1", M: "#ffad6b" })[o.t.cls] : o.t.kind === "Planet" || o.t.kind === "Moon" ? "#ffe9a8" : "#b8d0ff";
    return `<g class="tgt${on ? " sel" : ""}" data-t="${o.t.id}"><circle class="ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="${isLogged(o.t.id) ? "#7be0a0" : "#2A3F6E"}" stroke-width="1"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${o.t.messier ? 3.2 : 2.6}" fill="${c}"${o.t.messier ? ' opacity=".7"' : ""}/></g>`; }).join("");
  return `<svg class="nw-dome" viewBox="0 0 400 400" role="img" aria-label="Tonight's sky from the dome"><defs><radialGradient id="nw-sky" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0d1a3d"/><stop offset=".85" stop-color="#0B1530"/><stop offset="1" stop-color="#1d2f5c"/></radialGradient></defs>
    <circle cx="200" cy="200" r="${R}" fill="url(#nw-sky)" stroke="#2A3F6E" stroke-width="2"/>${[30, 60].map((a) => `<circle cx="200" cy="200" r="${R * (1 - a / 90)}" fill="none" stroke="#2A3F6E" stroke-dasharray="2 5"/>`).join("")}
    ${field}<g class="scope" style="transform:rotate(${180 - ang}deg)"><rect x="196" y="200" width="8" height="60" rx="4" fill="#E2B04A" opacity=".45"/><path d="M200 262 L176 ${R + 200} L224 ${R + 200}Z" fill="#E2B04A" opacity=".06"/><circle cx="200" cy="200" r="8" fill="#2A3F6E" stroke="#E2B04A"/></g>${glints}
    ${[["N", 200, 22], ["W", 384, 204], ["S", 200, 392], ["E", 14, 204]].map(([l, x, y]) => `<text x="${x}" y="${y}" fill="#8FB8FF" font-size="13" text-anchor="middle" font-family="serif">${l}</text>`).join("")}
    <text x="200" y="204" fill="#8FB8FF" font-size="9" text-anchor="middle" opacity=".5">zenith</text></svg>`;
}
/** Dark lines of a class at wavelengths (nm), drawn on a 380-700 nm rainbow. Strengths 0-1 follow the Harvard sequence. */
const LINES = { H: [656, 486, 434, 410], He: [447, 471, 502, 588], HeII: [469, 541], CaHK: [393, 397], Na: [589], Fe: [527, 438, 496], TiO: [476, 496, 517, 545, 616, 666] };
const STRENGTH = { O: { HeII: 0.9, He: 0.5, H: 0.3 }, B: { He: 0.8, H: 0.55 }, A: { H: 1, CaHK: 0.3 }, F: { H: 0.6, CaHK: 0.7, Fe: 0.3 }, G: { CaHK: 1, Fe: 0.7, H: 0.35, Na: 0.5 }, K: { CaHK: 1, Fe: 0.9, Na: 0.7, H: 0.15 }, M: { TiO: 1, Fe: 0.6, Na: 0.8, CaHK: 0.6 } };
export function spectrumSvg(cls, rim) {
  const x = (nm) => 20 + ((nm - 380) / 320) * 360, st = STRENGTH[cls] || {};
  const lines = Object.entries(st).flatMap(([el, s]) => LINES[el].map((nm) => el === "TiO" ? `<rect x="${x(nm).toFixed(1)}" y="70" width="14" height="80" fill="#000" opacity="${(0.25 + s * 0.45).toFixed(2)}"/>` : `<rect x="${(x(nm) - 0.5 - s).toFixed(1)}" y="70" width="${(1 + s * 2.4).toFixed(1)}" height="80" fill="#000" opacity="${(0.35 + s * 0.6).toFixed(2)}"/>`)).join("");
  return `<svg class="nw-plate" style="--rim:${rim}" viewBox="0 0 400 220" role="img" aria-label="A star's spectrum"><rect width="400" height="220" fill="#05070f"/>
    <defs><linearGradient id="nw-rb" x1="0" x2="1"><stop offset="0" stop-color="#6a3cff"/><stop offset=".2" stop-color="#2b6bff"/><stop offset=".38" stop-color="#21d0c8"/><stop offset=".55" stop-color="#7ce23a"/><stop offset=".68" stop-color="#ffe03a"/><stop offset=".82" stop-color="#ff8a2a"/><stop offset="1" stop-color="#d81e1e"/></linearGradient></defs>
    <rect x="20" y="70" width="360" height="80" fill="url(#nw-rb)"/>${lines}
    ${[400, 450, 500, 550, 600, 650, 700].map((nm) => `<text x="${x(nm)}" y="168" fill="#8FB8FF" font-size="10" text-anchor="middle">${nm}</text>`).join("")}<text x="200" y="190" fill="#8FB8FF" font-size="10" text-anchor="middle">wavelength (nm): violet to red</text>
    <text x="200" y="44" fill="#DCE6FF" font-size="13" text-anchor="middle" font-family="serif">Spectroscope: where are the dark lines?</text></svg>`;
}
export function lightSvg(t, rim) {
  const days = 15, X = (d) => 30 + (d / days) * 340, pts = [];
  for (let i = 0; i <= 300; i++) { const d = (i / 300) * days, ph = (d / t.period) % 1;
    const b = t.id === "algol" ? (Math.min(Math.abs(ph - 0.3), 1 - Math.abs(ph - 0.3)) < 0.07 ? 1 - 0.7 * Math.cos((Math.min(Math.abs(ph - 0.3), 1 - Math.abs(ph - 0.3)) / 0.07) * Math.PI / 2) : 1) : 0.55 + 0.45 * Math.sin(ph * 2 * Math.PI);
    pts.push(`${X(d).toFixed(1)},${(150 - b * 90).toFixed(1)}`); }
  return `<svg class="nw-plate" style="--rim:${rim}" viewBox="0 0 400 220" role="img" aria-label="Light curve of ${t.name}"><rect width="400" height="220" fill="#05070f"/>
    ${Array.from({ length: days + 1 }, (_, d) => `<line x1="${X(d)}" x2="${X(d)}" y1="50" y2="160" stroke="#2A3F6E" stroke-width="${d % 5 ? 0.5 : 1}"/>${d % 5 ? "" : `<text x="${X(d)}" y="176" fill="#8FB8FF" font-size="10" text-anchor="middle">day ${d}</text>`}`).join("")}
    <polyline points="${pts.join(" ")}" fill="none" stroke="#DCE6FF" stroke-width="2"/><text x="200" y="36" fill="#DCE6FF" font-size="13" text-anchor="middle" font-family="serif">${t.name}: brightness over ${days} nights</text>
    <text x="16" y="56" fill="#8FB8FF" font-size="9">bright</text><text x="16" y="158" fill="#8FB8FF" font-size="9">dim</text></svg>`;
}
export function plateSvg(t, rim, moonDeg = 0) {
  let seed = [...t.id].reduce((h, c) => h * 31 + c.charCodeAt(0), 11) % 2147483647 || 1; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const bg = Array.from({ length: 60 }, () => `<circle cx="${(r() * 400).toFixed(1)}" cy="${(r() * 260).toFixed(1)}" r="${(0.4 + r()).toFixed(2)}" fill="#cfd9ff" opacity=".7"/>`).join("");
  let body = "";
  if (t.plate === "count") body = t.count === 3 ? `<circle cx="170" cy="130" r="7" fill="#fff"/><circle cx="186" cy="124" r="4.5" fill="#fff"/><circle cx="262" cy="96" r="4" fill="#e8eeff"/>` : `<circle cx="180" cy="130" r="7" fill="#ffd27a"/><circle cx="222" cy="122" r="4.5" fill="#8fb4ff"/>`;
  else if (t.plate === "parallax") body = `<g opacity=".9"><circle cx="190" cy="130" r="5" fill="#ffd2a1"/><text x="190" y="152" fill="#8FB8FF" font-size="10" text-anchor="middle">January</text></g><g><circle cx="216" cy="130" r="5" fill="#ffd2a1" opacity=".6"/><text x="216" y="114" fill="#8FB8FF" font-size="10" text-anchor="middle">July</text></g><line x1="190" y1="140" x2="216" y2="140" stroke="#E2B04A" stroke-dasharray="2 2"/>`;
  else if (t.plate === "blink") body = `<g class="b1"><circle cx="150" cy="110" r="4" fill="#fff"/><circle cx="210" cy="140" r="5" fill="#ffe9a8"/><circle cx="270" cy="96" r="3.5" fill="#fff"/><circle cx="240" cy="190" r="3" fill="#fff"/></g><g class="b2"><circle cx="150" cy="110" r="4" fill="#fff"/><circle cx="232" cy="134" r="5" fill="#ffe9a8"/><circle cx="270" cy="96" r="3.5" fill="#fff"/><circle cx="240" cy="190" r="3" fill="#fff"/></g>
    ${[["A", 150, 98], ["B", 222, 124], ["C", 270, 84], ["D", 240, 178]].map(([l, x, y]) => `<text x="${x}" y="${y}" fill="#E2B04A" font-size="12" text-anchor="middle">${l}</text>`).join("")}`;
  else if (t.plate === "moons") body = `<circle cx="200" cy="130" r="14" fill="#f6dfb3"/><path d="M186 126h28M187 134h26" stroke="#c9a77a" stroke-width="2"/>${[130, 168, 238, 286].map((x) => `<circle cx="${x}" cy="${130 + ((x * 7) % 5) - 2}" r="2.6" fill="#fff"/>`).join("")}`;
  else if (t.plate === "phase") { const k = (1 - Math.cos(moonDeg * Math.PI / 180)) / 2, wax = moonDeg % 360 < 180, rx = Math.abs(1 - 2 * k) * 60;
    body = `<circle cx="200" cy="130" r="60" fill="#1b1f2e"/><path d="M200 70 A60 60 0 0 ${wax ? 1 : 0} 200 190 A${rx.toFixed(1)} 60 0 0 ${(k > 0.5) === wax ? 0 : 1} 200 70Z" fill="#f4f1e6"/>`; }
  else if (t.plate === "type") { const k = t.kind;
    body = k === "Open cluster" ? Array.from({ length: 14 }, () => `<circle cx="${(150 + r() * 100).toFixed(1)}" cy="${(90 + r() * 80).toFixed(1)}" r="${(1.5 + r() * 2.5).toFixed(1)}" fill="#cfe0ff"/>`).join("")
      : k === "Globular cluster" ? `<circle cx="200" cy="130" r="34" fill="#fff6d8" opacity=".18"/>` + Array.from({ length: 160 }, () => { const a = r() * 6.283, d = Math.pow(r(), 1.8) * 40; return `<circle cx="${(200 + d * Math.cos(a)).toFixed(1)}" cy="${(130 + d * Math.sin(a)).toFixed(1)}" r=".9" fill="#fff4d0"/>`; }).join("")
      : k === "Galaxy" ? `<ellipse cx="200" cy="130" rx="110" ry="28" fill="#dfe6ff" opacity=".12" transform="rotate(-28 200 130)"/><ellipse cx="200" cy="130" rx="55" ry="14" fill="#f2f0ff" opacity=".25" transform="rotate(-28 200 130)"/><circle cx="200" cy="130" r="7" fill="#fffbe8" opacity=".85"/>`
      : k === "Nebula" ? `<path d="M120 150 C140 80 220 70 260 110 C300 150 250 200 200 180 C160 200 110 190 120 150Z" fill="#ff7aa8" opacity=".28"/><path d="M150 140 C170 100 230 100 240 130 C230 165 180 170 150 140Z" fill="#9be0ff" opacity=".25"/><circle cx="196" cy="134" r="3" fill="#fff"/>`
      : k === "Planetary nebula" ? `<circle cx="200" cy="130" r="26" fill="none" stroke="#8fe6c8" stroke-width="9" opacity=".55"/><circle cx="200" cy="130" r="2" fill="#fff"/>`
      : `${Array.from({ length: 22 }, () => { const a = r() * 6.283, d = 20 + r() * 45; return `<path d="M${200 + 12 * Math.cos(a)} ${130 + 12 * Math.sin(a)} Q${(200 + d * 0.6 * Math.cos(a + 0.4)).toFixed(1)} ${(130 + d * 0.6 * Math.sin(a + 0.4)).toFixed(1)} ${(200 + d * Math.cos(a)).toFixed(1)} ${(130 + d * Math.sin(a)).toFixed(1)}" stroke="#ff9a6a" fill="none" opacity=".55"/>`; }).join("")}<ellipse cx="200" cy="130" rx="40" ry="28" fill="#a8c8ff" opacity=".15"/>`; }
  return `<svg class="nw-plate${t.plate === "blink" ? " nw-blink" : ""}" style="--rim:${rim}" viewBox="0 0 400 260" role="img" aria-label="Glass plate of ${t.name}"><rect width="400" height="260" fill="#04060d"/>${bg}${body}
    <text x="12" y="248" fill="#8FB8FF" font-size="10" font-family="serif">${t.plate === "blink" ? "Blink comparator: two plates a few nights apart" : t.name}</text></svg>`;
}

// ---- the room ----
export const shop = {
  kind: KIND, label: "🔭 Night Watch plates", items: FRAMES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["Glass plates! Every one is a night of sky that someone stayed up for.", "Frames for your plates. The stars don't mind, but the archivists do."],
    tryon: ["The {item}. Your Pleiades look rather distinguished in it.", "Picture your next plate in the {item}."],
    buy: ["The {item} is yours. Take it to the Plate Room.", "Sold! May the {item} hold many clear nights."],
  },
  preview(id, ctx) { styleOnce(); const f = FRAMES.find((x) => x.id === id) || FRAMES[0]; ctx.tableEl.className = "table watch"; ctx.tableEl.innerHTML = plateSvg(targetById("m45"), f.rim); ctx.cap && ctx.cap("🔭 " + f.name); },
};

export const watch = {
  id: "watch", label: "The Night Watch", emoji: "🔭", shop,
  blurb: "Observe tonight's real sky from your city, measure your plates, then answer the Almanac Desk's clients",
  open(C) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, greet, award, tableEl, reduced } = C;
    styleOnce();
    const P = () => state.prog, R = () => W(P()), save = () => { try { saveProgress(); } catch {} };
    const day = todayKey(), seed = dailySeed("watch", day);
    let adapted = false, view = null; // dark-adapted eyes last for this visit; view = { place, at, up }
    const moonDeg = () => { try { return A.MoonPhase(new Date()); } catch { return 0; } };
    const gain = (xp, es, extra = "") => { const aw = award(xp, es); save(); showStats(); return `<div class="up">+${xp} ✦ · +${es} 💎${extra}${aw.rankUp ? ` · 🏅 You are now <b>${esc(aw.rankUp)}</b>` : ""}</div>`; };
    const back = (id = "nw-lobby") => `<div class="choices"><button class="c small" type="button" id="${id}">🔭 Back to the dome</button></div>`;
    const wireBack = (id = "nw-lobby") => { const b = $(id); if (b) b.onclick = () => lobby(false); };
    const mid = () => C.banter && C.banter("watch", "mid");
    const sky = (sel = null) => { tableEl.className = "table watch"; tableEl.innerHTML = domeSvg(view ? view.up : [], { sel, logged: (id) => logged(P(), id) }) + `<div class="nw-dark${adapted ? " on" : ""}" id="nw-dark"></div>`;
      tableEl.querySelectorAll(".tgt").forEach((g) => (g.onclick = () => target(g.dataset.t))); };
    const loadView = () => { const place = placeOf(P()), { at, night } = watchTime(place); view = { place, at, night, up: upNow(place, at) }; return view; };
    const stats = () => { const rep = repOf(P()), nx = nextRep(P()); if (rep.name === "Astronomer Royal") grantRoyal(P());
      return `<div class="cx-top"><b>🔭 ${esc(rep.name)}</b> · ${logCount(P())} logged · ${plateCount(P())} plates · ${messierLogged(P())} / ${MESSIER_COUNT} Messier${nx ? ` · ${nx.at - R().jobsDone} jobs to ${esc(nx.name)}` : ""}</div>`; };

    function lobby(first) {
      clearReading(); cap("🔭 The Night Watch"); loadView(); sky(); R().plays = R().plays || 0;
      const v = view, dark = Date.now() >= v.night.start && Date.now() <= v.night.end, tt = tonightsTarget(v.place, v.at, seed);
      if (first) S.domeOpen();
      say(first && !logCount(P()) ? `The dome is open over ${v.place.name}, ${state.name}. We observe, we measure, and then we answer the clients who knock. Start with tonight's target.`
        : pick([`Clear skies over ${v.place.name} tonight, ${state.name}. Or near enough.`, `The telescope is cooled and ready, ${state.name}.`, `What shall we look at, ${state.name}? ${v.up.length} things are up over ${v.place.name}.`]));
      const desk = deskToday(P(), day), open = jobsFor(seed).filter((j) => !desk.done.includes(j.id)).length, ds = dailyState(P(), "watch");
      ui(`${stats()}<div class="cx-top">From <select id="nw-city" aria-label="Your nearest city">${PLACES.map((p) => `<option${p.name === v.place.name ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select> ${dark ? "now" : `tonight from ${esc(clock(v.at, v.place))}`}</div>
        ${tt ? `<div class="nw-fact">🎯 Tonight's Target #${dayNumber(day)}: <b>${esc(tt.t.name)}</b>, ${tt.fists} fist${tt.fists > 1 ? "s" : ""} above the ${esc(tt.dir)} horizon${ds.played ? " · logged today ✓" : ""}</div>` : ""}
        <div class="levels"><button class="c level" type="button" id="nw-go1"><b>🔭 1 · Night Watch</b><span>Find something in tonight's real sky and log it · ${logCount(P())} logged</span></button>
        <button class="c level" type="button" id="nw-go2"><b>🧪 2 · Plate Room</b><span>Measure your plates with real methods · ${plateCount(P())} measured</span></button>
        <button class="c level" type="button" id="nw-go3"><b>📜 3 · Almanac Desk</b><span>${open} of 3 jobs waiting today · ${R().jobsDone} delivered</span></button></div>
        <div class="choices"><button class="c small" type="button" id="nw-log">📓 Observing Log</button><button class="c small" type="button" id="nw-guide">📖 Study guide</button><button class="c small" type="button" id="back">✦ Leave the dome</button></div>
        <div class="note">City only: pick the nearest one. The sky is computed for it, nothing more precise is used or saved.</div>`);
      $("nw-city").onchange = (e) => { const p = cityOf({ name: e.target.value }); if (!p) return; R().place = { name: p.name }; save(); lobby(false); };
      $("nw-go1").onclick = watchList; $("nw-go2").onclick = plates; $("nw-go3").onclick = almanac; $("nw-log").onclick = logbook; $("back").onclick = greet;
      $("nw-guide").onclick = () => (C.study ? C.study("watch", () => lobby(false)) : null);
    }

    // ---- 1. Night Watch ----
    function watchList() {
      clearReading(); cap("🔭 Night Watch · " + view.place.name); sky(); const tt = tonightsTarget(view.place, view.at, seed);
      say(view.up.length ? `Tap a glint on the dome, or pick from the list. Green rings are already in your log.` : `Nothing is high enough over ${view.place.name} right now. The Archive has plates of everything.`);
      const btn = (o) => `<button class="c small" type="button" data-t="${o.t.id}">${o.t.id === (tt && tt.t.id) ? "🎯 " : ""}${logged(P(), o.t.id) ? "✓ " : ""}${esc(o.t.name)} <small>${esc(o.dir)} · ${o.fists}✊</small></button>`;
      ui(`<div class="group">Up over ${esc(view.place.name)} ${Date.now() >= view.night.start ? "now" : "tonight"}</div><div class="nw-list">${view.up.map(btn).join("") || "<span class='note'>Nothing up yet.</span>"}</div>
        <div class="choices"><button class="c small" type="button" id="nw-arch">📦 Archive plates (anything not up)</button></div>${back()}`);
      $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => target(b.dataset.t))); $("nw-arch").onclick = archive; wireBack();
    }
    function archive() {
      const upIds = new Set(view.up.map((o) => o.t.id)), rest = [...TARGETS, ...WANDERERS].filter((t) => !upIds.has(t.id) && !logged(P(), t.id));
      say("Old plates from the archive. They log at half pay, and you can measure them like any other.");
      ui(`<div class="group">📦 Archive plates</div><div class="nw-list">${rest.map((t) => `<button class="c small" type="button" data-a="${t.id}">${esc(t.name)}</button>`).join("") || "<span class='note'>You've logged everything!</span>"}</div>${back()}`);
      $("ui").querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => target(b.dataset.a, true))); wireBack();
    }
    function target(id, arch = false) {
      const t = targetById(id), o = view.up.find((x) => x.t.id === id); if (!t) return;
      if (!o && !arch) return archive();
      sky(o ? id : null); S.ping(t.mag ?? 2); cap("🔭 " + t.name);
      let tries = 0;
      const ask = () => {
        const where = o ? `Look ${o.dir}, about ${o.fists} fist${o.fists > 1 ? "s" : ""} up (${Math.round(o.alt)}°). ` : "From the archive. ";
        say(`${where}${t.name}: ${t.kind.toLowerCase()}. Which eyepiece?`);
        ui(`<div class="group">Choose an eyepiece for the 1,000 mm telescope · ${3 - tries} tr${3 - tries === 1 ? "y" : "ies"} left</div><div class="choices">${EYEPIECES.map((e) => `<button class="c" type="button" data-e="${e.id}">${esc(e.name)} <small>${magnification(e)}×</small></button>`).join("")}</div>
          <div class="note">Magnification = telescope focal length ÷ eyepiece focal length. ${EYEPIECES.map((e) => esc(e.note)).join(" ")}</div>${back()}`);
        $("ui").querySelectorAll("[data-e]").forEach((b) => (b.onclick = () => look(b.dataset.e))); wireBack();
      };
      const look = (ep) => {
        tries++; const why = eyeVerdict(t, ep);
        if (why) { S.gutter(); if (tries >= 3) { C.trophy?.("watch", 1, { won: false }); say(`${why} The view's gone for now. Try another target.`); ui(back()); wireBack(); return; } say(why); const m = mid(); if (m && C.bubble) C.bubble(m, 3200); return ask(); }
        observe(P(), t, ep, { at: Date.now(), city: view.place.name, alt: o ? o.alt : 0, arch });
        const tt = tonightsTarget(view.place, view.at, seed); let bonus = "";
        if (!arch && tt && tt.t.id === t.id) { const res = finishDaily(P(), "watch", { score: 100, won: true, detail: t.name }, day); if (res.first) bonus = " · 🎯 Tonight's Target +10 💎"; }
        const [xp, es] = arch ? PAY.archive : PAY.log; const g = gain(xp, es + (bonus ? 10 : 0), bonus);
        S.discover(); C.trophy?.("watch", 1, { won: true, perfect: tries === 1 });
        say(pick([`Logged. ${t.name}, ${t.kind.toLowerCase()}.`, `There it is: ${t.name}. Into the log it goes.`, `${t.name}, clear as anything. Logged.`]));
        $id("reading-body").innerHTML = `<div class="nw-fact">${esc(t.note)}${t.ly ? ` Distance: about ${fmtLy(t.ly)} light-years.` : ""}</div>`;
        ui(`<div class="reward"><div>📓 ${esc(t.name)} is in your Observing Log${o ? ` (${Math.round(o.alt)}° up over ${esc(view.place.name)})` : " (archive plate)"}.</div>${g}</div>
          <div class="choices"><button class="c main" type="button" id="nw-measure">🧪 Measure its plate</button><button class="c small" type="button" id="nw-more">🔭 Observe another</button></div>${back()}`);
        $("nw-measure").onclick = () => measure(t.id); $("nw-more").onclick = watchList; wireBack();
      };
      if (needsDark(t) && !adapted) {
        say(`${t.name} is faint, magnitude ${t.mag}. Your eyes need the dark first: about 20 to 30 minutes for real. I'll keep the red torch on, since red light barely touches the rods that see in the dark.`);
        ui(`<div class="choices"><button class="c main" type="button" id="nw-wait">🔴 Wait in the dark</button></div>${back()}`); wireBack();
        $("nw-wait").onclick = () => { adapted = true; const d = $id("nw-dark"); if (d) d.classList.add("on"); S.darkness(); ui(`<div class="note">Letting your eyes adjust…</div>`);
          setTimeout(() => { if (d) d.classList.remove("on"); S.shimmer(); say("There. Your eyes are dark-adapted for the rest of this visit."); ask(); }, reduced ? 200 : 4000); };
        return;
      }
      ask();
    }

    // ---- 2. Plate Room ----
    function plates() {
      clearReading(); cap("🧪 Plate Room"); const list = loggedTargets(P());
      say(list.length ? "Every plate here is one of your nights. Pick one to measure." : "No plates yet. Log something in the Night Watch first, or take one from the archive.");
      const btn = (t) => `<button class="c small" type="button" data-p="${t.id}">${measured(P(), t.id) ? "★".repeat(R().plates[t.id]) + " " : ""}${esc(t.name)}</button>`;
      ui(`<div class="group">Your plates</div><div class="nw-list">${[...list.filter((t) => !measured(P(), t.id)), ...list.filter((t) => measured(P(), t.id))].map(btn).join("") || ""}</div>${back()}`);
      $("ui").querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => measure(b.dataset.p))); wireBack();
    }
    function measure(id) {
      const t = targetById(id), rim = frameOf(P()).rim, md = moonDeg(), q = plateQuestion(t, Math.random, md); if (!q) return plates();
      clearReading(); tableEl.className = "table watch"; tableEl.innerHTML = t.plate === "spectrum" ? spectrumSvg(t.cls, rim) : t.plate === "light" ? lightSvg(t, rim) : plateSvg(t, rim, md);
      cap("🧪 " + t.name); let tries = 0;
      const help = t.plate === "spectrum" ? `<details class="nw-fact"><summary>Spectroscope notes</summary>${Object.entries(CLASS_INFO).map(([k, v]) => `<div><b>${k}</b> ${esc(v.colour)}, ${esc(v.temp)}: ${esc(v.lines)}</div>`).join("")}<div>${esc(SPECTRUM_FACT)}</div></details>` : "";
      const ask = () => { say(q.q);
        ui(`<div class="group">${3 - tries} tr${3 - tries === 1 ? "y" : "ies"} for full marks</div><div class="choices">${q.choices.map((c) => `<button class="c" type="button" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>${help}${back()}`);
        $("ui").querySelectorAll("[data-c]").forEach((x) => (x.onclick = () => answer(x.dataset.c, x))); wireBack(); };
      const answer = (c, b) => {
        tries++;
        if (c !== q.a) { S.verdict(false); b.disabled = true; if (tries >= 3) { C.trophy?.("watch", 2, { won: false }); say(`Not this time. It was ${q.a}. ${q.why}`); ui(`<div class="choices"><button class="c" type="button" id="nw-again">🧪 Try the plate again</button></div>${back()}`); $("nw-again").onclick = () => measure(id); wireBack(); return; }
          say(pick(["Look again at the plate.", "Not quite. The plate doesn't lie.", "Close. Measure twice."])); return; }
        const res = settlePlate(P(), id, tries), [xp, es] = res.first || res.better ? PAY.plate(res.stars) : [2, 1];
        S.verdict(true); setTimeout(S.discover, 300); C.trophy?.("watch", 2, { won: true, perfect: tries === 1 });
        say(`${q.a}. ${q.why}`);
        ui(`<div class="reward"><div>🧪 ${esc(t.name)} measured: ${"★".repeat(res.stars)}</div>${gain(xp, es)}</div>
          <div class="choices"><button class="c main" type="button" id="nw-desk">📜 See the Almanac Desk</button><button class="c small" type="button" id="nw-pl">🧪 Another plate</button></div>${back()}`);
        $("nw-desk").onclick = almanac; $("nw-pl").onclick = plates; wireBack();
      };
      ask();
    }

    // ---- 3. Almanac Desk ----
    function almanac() {
      clearReading(); cap("📜 Almanac Desk"); const d = deskToday(P(), day), jobs = jobsFor(seed);
      say(pick(["Three knocks at the door today. Everyone in the channel gets the same three, so compare notes.", "Clients! Astronomers paid for their telescopes this way for centuries.", "The post brought three letters. Let's earn our keep."]));
      const card = (j) => { const done = d.done.includes(j.id), open = unlocked(P(), j);
        return `<div class="nw-job${done ? " done" : ""}${open ? "" : " lock"}">${j.emoji} <b>${esc(j.client)}</b>${j.needs ? " · hard job" : ""}<div>${done ? "Delivered ✓" : open ? `<button class="c small" type="button" data-j="${j.id}">Take the job</button>` : `🔒 ${esc(j.hint)}`}</div></div>`; };
      ui(`${stats()}<div class="nw-jobs">${jobs.map(card).join("")}</div><div class="note">New jobs every day at midnight UTC. Hard jobs pay more and need a result from the Plate Room.</div>
        <div class="choices"><button class="c small" type="button" id="nw-pl">🧪 Plate Room</button></div>${back()}`);
      $("ui").querySelectorAll("[data-j]").forEach((b) => (b.onclick = () => job(jobById(b.dataset.j)))); $("nw-pl").onclick = plates; wireBack();
    }
    function job(j) {
      const q = questionFor(j, seed); cap("📜 " + j.client);
      say(`${j.client}: ${q.q}`);
      ui(`<div class="choices">${q.choices.map((c) => `<button class="c" type="button" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>${back()}`); wireBack();
      $("ui").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => {
        const ok = b.dataset.c === q.a, before = repOf(P()).name, res = deliver(P(), day, j, ok); if (repOf(P()).name === "Astronomer Royal") grantRoyal(P());
        S.verdict(ok); C.trophy?.("watch", 3, { won: ok, perfect: ok && !!j.needs });
        let g = "";
        if (res.paid) { const [xp, es] = res.hard ? PAY.hard : PAY.job, up = repOf(P()).name !== before ? ` · 🎖️ Reputation: <b>${esc(repOf(P()).name)}</b>` : ""; g = gain(xp, es, up); if (up) setTimeout(S.discover, 400); }
        say(ok ? `Right: ${q.a}. ${q.why}` : `Not quite. The answer was ${q.a}. ${q.why} The client will come back tomorrow with a new job.`);
        if (!ok) deskToday(P(), day).done.push(j.id), save();
        ui(`<div class="reward"><div>${ok ? "📜 Delivered." : "📜 The client leaves, unconvinced."}</div>${g}</div><div class="choices"><button class="c main" type="button" id="nw-dk">📜 Back to the Desk</button></div>${back()}`);
        $("nw-dk").onclick = almanac; wireBack();
      }));
    }

    // ---- the Observing Log ----
    function logbook() {
      clearReading(); cap("📓 Observing Log"); const r = R(), ids = Object.keys(r.log);
      say(ids.length ? `${ids.length} nights in the log, ${state.name}. Every one of them real.` : "A fresh logbook. Its first page is waiting for tonight.");
      $id("reading-body").innerHTML = `<div class="nw-log"><h3>📓 Observing Log</h3><ul>${ids.map((id) => { const t = targetById(id), e = r.log[id]; if (!t) return "";
        return `<li><b>${esc(t.name)}</b> · ${esc(t.kind)} · ${e.arch ? "archive plate" : `${e.alt}° up over ${esc(e.city)}`} · ${esc(new Date(e.at).toLocaleDateString())}${r.plates[id] ? ` · 🧪 ${"★".repeat(r.plates[id])}` : ""}</li>`; }).join("") || "<li>No entries yet.</li>"}</ul>
        <div class="note">Messier objects: ${messierLogged(P())} of ${MESSIER_COUNT}. Desk jobs delivered: ${r.jobsDone}. Reputation: ${esc(repOf(P()).name)}.</div></div>`;
      ui(back());
      wireBack();
    }

    lobby(true);
  },
};

/** The Night Watch's page in Your Grimoire's Game rooms section. */
export function watchCodex(p, esc) {
  const r = W(p), n = Object.keys(r.log).length; if (!n && !r.jobsDone) return "";
  return `<div class="bk-room"><h4>🔭 The Night Watch</h4><p>${esc(repOf(p).name)} · ${n} logged · ${Object.keys(r.plates).length} plates measured · ${r.jobsDone} jobs delivered · ${messierLogged(p)} / ${MESSIER_COUNT} Messier</p></div>`;
}
export { GUIDE };
