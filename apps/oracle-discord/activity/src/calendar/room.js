// Calendar Keeper: a room of the Oracle Chamber. The reading table becomes the Keeper's desk: the Maya Tzolk'in gears,
// the Egyptian civil year and the Celtic wheel of the year, all turning to the same day. Three levels of puzzles
// (cycles, festivals, eclipses), a free desk to turn to any date, study guides, Codex rows and an Essence store shelf.
// Plugs into main.js ROOMS: open(ctx) with ctx = { $, esc, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl }.
import * as E from "./engine.js";
import { LEVELS, ALL, keyOf } from "./puzzles.js";
import { STARS, room as cal, starsOf, doneCount, titleOf, nextTitle, isOpen, nextPuzzle, start, useHint, check, settle, SHOP, lookOf } from "./logic.js";
import { GUIDES, GUIDE_ORDER } from "./guide.js";
import { CSS } from "./style.js";
import * as S from "./sfx.js";
import { attachDrag, daysToTz, daysToEgy } from "./drag.js";
import { dailyState, finishDaily, postDaily, boardOf, boardHtml, dayNumber } from "../daily.js";
import { GAME, dailySet, dailyScore, dailyReward } from "./daily-sky.js";
import { birthdayOf } from "./birthday.js";

const escH = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const RIGHT = ["The wheels click into place. Exactly right.", "Yes! The gears agree with you.", "Correct. A daykeeper couldn't have counted it better.", "Right on the day. The calendars bow."];
const WRONG = ["The gears grind. Not that one.", "Hmm. Count again, Keeper.", "The wheels won't line up on that. Try again.", "Close, perhaps, but the sky disagrees."];

function styleOnce() { if (document.getElementById("cal-style")) return; const st = document.createElement("style"); st.id = "cal-style"; st.textContent = CSS; document.head.append(st); }

// ---------------- the Keeper's desk (SVG) ----------------
const R = (a) => (a * Math.PI) / 180;
const pt = (cx, cy, r, a) => [cx + r * Math.cos(R(a)), cy + r * Math.sin(R(a))].map((v) => v.toFixed(1));
function gearPath(cx, cy, r, teeth, depth = 5) {
  let d = ""; const n = teeth * 2;
  for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * 360, rr = Math.floor(i / 2) % 2 ? r - depth : r; const [x, y] = pt(cx, cy, rr, a); d += (i ? "L" : "M") + x + " " + y; }
  return d + "Z";
}
const arc = (cx, cy, r, a0, a1) => { const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1); return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
function moonSvg(cx, cy, r, ph, L) {
  const waxing = ph < 180, c = Math.cos(R(ph)), rx = Math.abs(c * r).toFixed(1), top = `${cx} ${cy - r}`, bot = `${cx} ${cy + r}`;
  const outer = waxing ? 1 : 0, term = waxing ? (ph < 90 ? 0 : 1) : (ph > 270 ? 1 : 0);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${L.ink}" stroke="${L.gear2}" stroke-width="1"/><path d="M${top} A${r} ${r} 0 0 ${outer} ${bot} A${rx} ${r} 0 0 ${term} ${top}Z" fill="#f4f1ea"/>`;
}
const PHASE = (ph) => ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"][Math.round(ph / 45) % 8];
const SEASON_C = { Akhet: "#3d8fd1", Peret: "#4caf6a", Shemu: "#E2B04A", "Heriu-renpet": "#FF4FB3" };
const fxLayer = (fx, L) => {
  if (fx === "stars") return Array.from({ length: 40 }, (_, i) => `<circle class="cal-tw" style="animation-delay:${(i % 7) * 0.4}s" cx="${(i * 97) % 520}" cy="${(i * 53) % 470}" r="${(i % 3) * 0.5 + 0.6}" fill="#fff"/>`).join("");
  if (fx === "embers") return Array.from({ length: 16 }, (_, i) => `<circle class="cal-ember" style="animation-delay:${(i % 8) * 0.55}s" cx="${20 + ((i * 61) % 480)}" cy="470" r="${1.4 + (i % 3) * 0.6}" fill="${L.ring}"/>`).join("");
  if (fx === "smoke") return [0, 1, 2].map((i) => `<path class="cal-smoke" style="animation-delay:${i * 2}s" d="M${100 + i * 160} 470 q-30 -90 0 -180 q30 -90 0 -180" stroke="#cfe" stroke-width="10" fill="none" opacity=".08"/>`).join("");
  if (fx === "sirius") return `<g class="cal-sirius"><circle cx="34" cy="34" r="10" fill="#bfe3ff" opacity=".25"/><path d="M34 22 L36 32 L46 34 L36 36 L34 46 L32 36 L22 34 L32 32Z" fill="#fff"/></g><path d="M0 462 Q130 450 260 462 T520 462" stroke="#3d8fd1" stroke-width="3" fill="none" opacity=".5"/>`;
  return "";
};

/** The desk for day j. `from` (a JDN) lets the gears turn from that day to this one. */
export function deskSvg(j, look, from = j, scene = null) {
  const L = look, m = E.maya(j), e = E.egyptCivil(j), c = E.copticOf(j), nf = E.nextFestival(j), sun = E.sunLon(j), ph = E.moonPhase(j);
  const days = (x) => x - E.GMT, rot = (x) => ({ small: -days(x) * (360 / 13), big: days(x) * 18 });
  const mode = j === from ? "enter" : Math.abs(j - from) <= 40 ? "turn" : "whirl", dir = j >= from ? 1 : -1, r1 = rot(j);
  const r0 = mode === "turn" ? rot(from) : mode === "whirl" ? { small: r1.small + 720 * dir, big: r1.big - 1080 * dir } : r1, spin = L.fx === "spin" ? " cal-spin" : "";
  // Tzolk'in: the 13 gear and the 20 gear mesh at x≈106. Tone k sits at angle (k-1)·360/13 offset so tone 1 starts at the contact point.
  const sCx = 238, bCx = 388, cy = 128, sR = 67, bR = 83, cy2 = 292;
  // tone label n+1 sits at toneAt(n); the gear's rotation brings today's tone to angle 0 (the contact point)
  const toneAt = (n) => (E.mod(n - (E.maya(E.GMT).tone - 1), 13)) * (360 / 13); // angle of tone n (0-based) when rotation is 0 at day 0
  const signAt = (s) => 180 - E.mod(s - E.maya(E.GMT).sign, 20) * 18;
  const tl = Array.from({ length: 13 }, (_, n) => { const [x, y] = pt(sCx, cy, 49, toneAt(n)); return `<text x="${x}" y="${(+y + 5.5).toFixed(1)}" font-size="16" font-weight="700" text-anchor="middle" fill="${L.ink}" transform="rotate(${toneAt(n)} ${x} ${y})">${n + 1}</text>`; }).join("");
  const sl = E.SIGNS.map((nm, s) => { const a = signAt(s), [x, y] = pt(bCx, cy, 63, a); return `<text x="${x}" y="${(+y + 3.5).toFixed(1)}" font-size="10" text-anchor="middle" fill="${L.ink}" transform="rotate(${a - 180} ${x} ${y})">${escH(nm)}</text>`; }).join("");
  // Egypt: 12 × 30 days + 5 around a ring, needle at the day of the year
  const eCx = 130, d2a = (d) => (d / 365) * 360 - 90;
  const months = Array.from({ length: 13 }, (_, i) => { const a0 = d2a(i * 30) + 0.6, a1 = d2a(Math.min(365, i * 30 + (i === 12 ? 5 : 30))) - 0.6;
    return `<path d="${arc(eCx, cy2, 62, a0, a1)}" stroke="${SEASON_C[E.EGY_SEASON[i]]}" stroke-width="15" fill="none" opacity="${i === e.month ? 1 : 0.55}"/>`; }).join("");
  const needle = d2a(e.doy + 0.5), needle0 = mode === "whirl" ? needle - 360 * dir : d2a(E.egyptCivil(from).doy + 0.5);
  // Celtic: wheel of the year by the Sun's ecliptic longitude (June solstice at the top)
  const kCx = 385, ca = (lon) => -lon, sun0 = mode === "whirl" ? sun + 360 * dir : E.sunLon(from);
  const ticks = [0, 90, 180, 270].map((l) => { const [x0, y0] = pt(kCx, cy2, 52, ca(l)), [x1, y1] = pt(kCx, cy2, 68, ca(l)); return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${L.gear2}" stroke-width="2"/>`; }).join("");
  const fests = E.FESTIVALS.map((f) => { const [x, y] = pt(kCx, cy2, 60, ca(f.lon)), [tx, ty] = pt(kCx, cy2, 82, ca(f.lon)), on = nf && nf.f.id === f.id;
    return `<circle cx="${x}" cy="${y}" r="${on ? 6 : 4}" fill="${on ? L.ring : L.gear}"/><text x="${tx}" y="${(+ty + 3).toFixed(1)}" font-size="10" text-anchor="middle" fill="${L.text}" opacity=".85">${escH(f.name.split(" ")[0])}</text>`; }).join("");
  const [sx, sy] = pt(kCx, cy2, 60, 0);
  const row = (x, y0, lines) => lines.map((t, i) => `<text x="${x}" y="${y0 + i * 19}" font-size="${i === 0 ? 12 : 11.5}" text-anchor="middle" fill="${i === 0 ? L.ring : L.text}" ${i === 1 ? 'font-weight="700"' : ""}>${escH(t)}</text>`).join("");
  const ndays = nf ? nf.jdn - j : 0;
  return `<svg class="cal-desk ${mode}" viewBox="0 0 520 470" preserveAspectRatio="xMidYMid meet" role="img" aria-label="The calendars on ${escH(E.fmt(j, true))}">
<defs><radialGradient id="cal-corona"><stop offset=".55" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="#9ad7ff" stop-opacity="0"/></radialGradient><radialGradient id="cal-flame" cx="50%" cy="80%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#FADE8C"/><stop offset="1" stop-color="#ff5a1f"/></radialGradient><radialGradient id="cal-bg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${L.bg[0]}"/><stop offset="1" stop-color="${L.bg[1]}"/></radialGradient></defs>
<rect x="-400" y="-300" width="1320" height="900" fill="${L.bg[1]}"/><rect width="520" height="470" fill="url(#cal-bg)"/>${fxLayer(L.fx, L)}
<text x="260" y="28" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="18" text-anchor="middle" fill="${L.text}" letter-spacing="1">${escH(E.fmt(j, true))}</text>
<g class="cal-dial d1"><g class="cal-g" data-k="small" style="transform:rotate(${r0.small}deg);transform-origin:${sCx}px ${cy}px" data-to="${r1.small}"><g class="cal-inner${spin}" style="transform-origin:${sCx}px ${cy}px"><path d="${gearPath(sCx, cy, sR, 13, 9)}" fill="${L.gear}" stroke="${L.gear2}" stroke-width="1.5"/><circle cx="${sCx}" cy="${cy}" r="30" fill="${L.gear2}"/>${tl}</g></g>
<g class="cal-g" data-k="big" style="transform:rotate(${r0.big}deg);transform-origin:${bCx}px ${cy}px" data-to="${r1.big}"><g class="cal-inner${spin} rev" style="transform-origin:${bCx}px ${cy}px"><path d="${gearPath(bCx, cy, bR, 20, 9)}" fill="${L.gear}" stroke="${L.gear2}" stroke-width="1.5"/><circle cx="${bCx}" cy="${cy}" r="40" fill="${L.gear2}"/>${sl}</g></g>
</g><rect class="cal-win" x="${sCx + sR - 42}" y="${cy - 17}" width="84" height="34" rx="7" fill="none" stroke="${L.ring}" stroke-width="2.5"/>
<g class="cal-dial d2">${months}<circle cx="${eCx}" cy="${cy2}" r="50" fill="${L.bg[1]}" opacity=".7"/>
<line class="cal-g" data-k="needle" x1="${eCx}" y1="${cy2}" x2="${eCx + 70}" y2="${cy2}" stroke="${L.ring}" stroke-width="2.5" stroke-linecap="round" style="transform:rotate(${needle0}deg);transform-origin:${eCx}px ${cy2}px" data-to="${needle}"/>
<circle cx="${eCx}" cy="${cy2}" r="6" fill="${L.ring}"/><text x="${eCx}" y="${cy2 - 24}" font-size="11" text-anchor="middle" fill="${L.text}">${escH(e.season)}</text></g>
<g class="cal-dial d3"><circle cx="${kCx}" cy="${cy2}" r="68" fill="none" stroke="${L.gear}" stroke-width="2.5" opacity=".8"/><circle cx="${kCx}" cy="${cy2}" r="52" fill="none" stroke="${L.gear2}" stroke-width="1"/>${ticks}${fests}
<g class="cal-g" data-k="sun" style="transform:rotate(${ca(sun0)}deg);transform-origin:${kCx}px ${cy2}px" data-to="${ca(sun)}"><circle cx="${sx}" cy="${sy}" r="9" fill="#FADE8C" stroke="#fff" stroke-width="1.2"/></g>
${moonSvg(kCx, cy2, 20, ph, L)}</g>${sceneSvg(scene, L, { sCx, sR, cy, kCx, cy2 })}
${row(76, 98, ["Maya", m.tz, `Haab' ${m.haabName}`, `Long Count ${m.lc}`])}
${row(130, 402, ["Egypt (civil year)", e.short, `Season: ${e.season}`, `Coptic: ${c.text}`])}
${row(385, 402, ["Celtic year", nf ? `${nf.f.name.split(" ")[0]} ${ndays ? `in ${ndays} day${ndays === 1 ? "" : "s"}` : "today"}` : "", `Sun at ${Math.round(sun)}°`, PHASE(ph)])}
</svg>`;
}

/** Animated overlays on the desk: a burst at the gears' window, a solar or lunar eclipse, or bonfire flames. */
function sceneSvg(scene, L, g) {
  if (!scene) return "";
  if (scene === "right") return `<g class="cal-burst" style="transform-origin:${g.sCx + g.sR}px ${g.cy}px"><circle cx="${g.sCx + g.sR}" cy="${g.cy}" r="30" fill="none" stroke="${L.ring}" stroke-width="4"/>${Array.from({ length: 10 }, (_, i) => { const a = i * 36, [x, y] = pt(g.sCx + g.sR, g.cy, 70, a); return `<path class="cal-spark" style="--x:${(x - g.sCx - g.sR).toFixed(0)}px;--y:${(y - g.cy).toFixed(0)}px;animation-delay:${(i % 3) * 0.05}s" d="M${g.sCx + g.sR} ${g.cy - 7} L${g.sCx + g.sR + 2} ${g.cy - 2} L${g.sCx + g.sR + 7} ${g.cy} L${g.sCx + g.sR + 2} ${g.cy + 2} L${g.sCx + g.sR} ${g.cy + 7} L${g.sCx + g.sR - 2} ${g.cy + 2} L${g.sCx + g.sR - 7} ${g.cy} L${g.sCx + g.sR - 2} ${g.cy - 2}Z" fill="#FADE8C"/>`; }).join("")}</g>`;
  if (scene === "solar") return `<g class="cal-ecl"><rect x="-400" y="-300" width="1320" height="900" class="cal-dark" fill="#000"/><g transform="translate(260 235)">
    <circle r="92" fill="url(#cal-corona)" class="cal-corona"/><circle r="56" fill="#FFE9A8"/><circle r="56" fill="#FFF7D6" opacity=".6"/>
    <circle r="57" fill="#05030c" class="cal-moon-slide"/><text y="118" font-family="Cinzel, Georgia, serif" font-size="15" text-anchor="middle" fill="#FADE8C" class="cal-ecl-t">Solar eclipse</text></g></g>`;
  if (scene === "lunar") return `<g class="cal-ecl"><rect x="-400" y="-300" width="1320" height="900" class="cal-dark" fill="#000"/><g transform="translate(260 235)">
    <circle r="78" fill="#b8402a" opacity=".18" class="cal-corona"/><circle r="56" fill="#efeae0" class="cal-blood"/><circle r="70" fill="#000" opacity=".55" class="cal-umbra"/>
    <text y="118" font-family="Cinzel, Georgia, serif" font-size="15" text-anchor="middle" fill="#FADE8C" class="cal-ecl-t">Lunar eclipse</text></g></g>`;
  if (scene === "fire") return `<g class="cal-fire">${[-46, -16, 16, 46].map((dx, i) => `<path class="cal-flame" style="animation-delay:${i * 0.13}s;transform-origin:${g.kCx + dx}px ${g.cy2 + 86}px" d="M${g.kCx + dx} ${g.cy2 + 40} C${g.kCx + dx + 14} ${g.cy2 + 62} ${g.kCx + dx + 12} ${g.cy2 + 80} ${g.kCx + dx} ${g.cy2 + 86} C${g.kCx + dx - 12} ${g.cy2 + 80} ${g.kCx + dx - 14} ${g.cy2 + 62} ${g.kCx + dx} ${g.cy2 + 40}Z" fill="url(#cal-flame)"/>`).join("")}</g>`;
  return "";
}

/** Draw the desk on the table and let the gears turn from `from` to `j` (with their ratchet sound). */
function drawDesk(el, j, look, from, scene = null, quiet = false) {
  el.className = "table calendar"; el.innerHTML = `<div class="cal-wrap">${deskSvg(j, look, from, scene)}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll(".cal-g[data-to]").forEach((g) => { g.style.transform = `rotate(${g.dataset.to}deg)`; })));
  if (quiet) return;
  const d = Math.abs(j - from);
  if (d > 40) S.whirl(2.2); else if (d > 0) S.gears(d, 1.3); else S.clunk();
  if (scene === "solar" || scene === "lunar") setTimeout(S.eclipse, d > 40 ? 1600 : 900);
  if (scene === "fire") setTimeout(S.fire, d > 40 ? 1600 : 900);
}
/** Shake the desk (a wrong answer). */
function shake(el) { const w = el && el.querySelector(".cal-wrap"); if (!w) return; w.classList.remove("shake"); void w.offsetWidth; w.classList.add("shake"); }

// ---------------- study guides ----------------
export function guideHtml(k) {
  const g = GUIDES[k];
  return `<div class="cal-guide"><h3>${g.emoji} ${escH(g.title)}</h3>${g.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${escH(s.h)}</summary>${s.p.map((t) => `<p>${t}</p>`).join("")}</details>`).join("")}</div>`;
}

// ---------------- the room ----------------
export const room = { id: "calendar", label: "Calendar Keeper", emoji: "🗓️", blurb: "Run the Maya, Egyptian and Celtic calendars and predict festivals and eclipses", open,
  shop: {
    kind: "calendar", label: "🗓️ Calendar Keeper", items: SHOP.map(({ id, name, note, price }) => ({ id, name, note, price })),
    talk: {
      open: ["Desks for the Calendar Keeper. Every gear here is a real calendar, whatever it's made of.", "Time is free. The furniture for measuring it is not."],
      tryon: ["The {item}. Watch the gears turn.", "Picture your calendars on the {item}. Very scholarly."],
      buy: ["The {item} is yours. The days will look better on it.", "Sold! May the {item} keep perfect time."],
    },
    preview(id, ctx) { drawDesk(ctx.tableEl, E.todayJdn(), lookOf({}, id), E.todayJdn() - 6, null); S.gears(6, 1.3); ctx.cap && ctx.cap("🗓️ " + (SHOP.find((s) => s.id === id) || SHOP[0]).name); },
  } };

let C = null;
const $ = (id) => document.getElementById(id);
const look = () => lookOf(C.state.prog);
let shown = null; // JDN on the desk
let D = null; // the Daily Sky run in progress
let hand = null; // the draggable desk during a tz / egy puzzle
const desk = (j, from = shown ?? j, scene = null) => { hand = null; drawDesk(C.tableEl || $("table"), j, look(), from, scene); shown = j; };
const starRow = (n, of = STARS) => `<span class="cal-stars" aria-label="${n} of ${of} stars">${"★".repeat(n)}<i>${"★".repeat(of - n)}</i></span>`;
const save = () => { try { C.saveProgress(); } catch {} };
const onEnter = (id, fn) => { const el = $(id); if (el) el.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); fn(); } }; };

function open(ctx) { C = ctx; styleOnce(); shown = null; lobby(true); }

function stats() { const n = starsOf(C.state.prog), t = titleOf(n), nx = nextTitle(n);
  return `<div class="cx-top"><b>🗓️ ${C.esc(t.name)}</b> · ${n} / ${ALL.length * STARS} ★${nx ? ` · ${nx.at - n} more to ${C.esc(nx.name)}` : ""}</div>`; }
const guideRow = () => `<div class="group">Study guides</div><div class="choices">${GUIDE_ORDER.map((k) => `<button class="c small" type="button" data-g="${k}">${GUIDES[k].emoji} ${C.esc(GUIDES[k].title.replace(" study guide", ""))}</button>`).join("")}</div>`;
function wireGuides() {
  $("ui").querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => {
    const rb = $("reading-body"), k = b.dataset.g, on = !(rb.querySelector(".cal-guide") && rb.dataset.g === k);
    rb.innerHTML = on ? guideHtml(k) : ""; rb.dataset.g = on ? k : ""; S.page();
    if (on) rb.querySelector(".cal-guide").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

function lobby(first) {
  D = null; const p = C.state.prog; C.clearReading(); C.cap("🗓️ Calendar Keeper"); desk(E.todayJdn(), shown ?? E.todayJdn() - 8);
  C.say(first && !cal(p).plays
    ? `Welcome to the Keeper's desk, ${C.state.name}. Three real calendars turn here together: the Maya sacred count, Egypt's 365-day civil year and the Celtic wheel of the year. Learn how each one turns, then predict their festivals, and finally the eclipses. Every answer is worked out from the real calendars and the real sky.`
    : pick([`The wheels are oiled, ${C.state.name}. What shall we count today?`, `Back at the desk, ${C.state.name}. Time waits for no one, but it does wait for you.`, `Which calendar shall we turn, ${C.state.name}?`]));
  const lvl = (L) => { const on = isOpen(p, L), n = doneCount(p, L);
    return `<button class="c level" type="button" data-l="${L.n}" ${on ? "" : "disabled"}><b>${"🗓️".repeat(L.n)} Level ${L.n} · ${C.esc(L.name)}</b><span>${C.esc(L.what)} · ${n} / ${L.deck.length} solved · ${starsOf(p, L)} ★ · rewards ×${L.mult}${on ? "" : ` · solve 4 in Level ${L.n - 1} to open`}</span></button>`; };
  C.ui(`${stats()}<div class="levels">${LEVELS.map(lvl).join("")}</div>
    <div class="note">3 stars a puzzle. Each hint or wrong answer costs one. Answers come from the real calendars and the real sky, and change every time you play.</div>
    ${dailyBtn(p)}<div class="choices"><button class="c" type="button" id="cal-desk">🗓️ Keeper's desk: turn to any date</button><button class="c" type="button" id="cal-bday">🎂 Your birthday in every calendar</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>${guideRow()}`);
  $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { const L = LEVELS[+b.dataset.l - 1]; play(L, nextPuzzle(p, L, cal(p).last)); }));
  $("cal-desk").onclick = () => freeDesk(shown ?? E.todayJdn()); $("cal-daily").onclick = dailyStart; $("cal-bday").onclick = () => birthday(); $("back").onclick = C.greet; wireGuides();
}

// ---- 🎂 Your birthday in every calendar (from the saved /profile, or a date typed here; the date itself is not saved) ----
function birthday(v) {
  const prof = C.state.profile && C.state.profile.date, j = v ?? (prof ? E.parseYmd(prof) : null), today = E.todayJdn();
  C.clearReading(); C.cap("🎂 Your birthday in every calendar");
  const form = (val) => `<div class="form one"><label for="cal-b">Birth date (year-month-day)<input id="cal-b" value="${C.esc(val)}" maxlength="11" autocomplete="off" inputmode="numeric" placeholder="1990-04-09"></label></div>
    <div class="choices"><button class="c main" type="button" id="cal-bgo">✦ Turn the wheels to my birthday</button><button class="c small" type="button" id="cal-lobby">📜 Back to the levels</button></div>
    <div class="note">${prof ? "Filled in from your saved /profile. " : ""}Your birth date stays on this screen; only the calendar names go in your Codex.</div>`;
  const wire = () => { const go = () => { const b = E.parseYmd($("cal-b").value); if (b == null || b > today) { C.say("That date won't turn the wheels. Try year-month-day, like 1990-04-09."); return; } birthday(b); };
    $("cal-bgo").onclick = go; onEnter("cal-b", go); $("cal-lobby").onclick = () => lobby(false); };
  if (j == null) { desk(today); C.say("Tell me the day you were born and I'll find it in all three calendars."); C.ui(form("")); wire(); return; }
  const B = birthdayOf(j, today), g = E.dateOf(j), ymd = `${g.year}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}`, k = B.celtic;
  desk(j, shown ?? today);
  const r = cal(C.state.prog), firstPage = !r.bday;
  r.bday = { tz: B.maya.tz, meaning: B.maya.meaning, egy: B.egypt.short, celtic: `after ${k.after.name.split(" ")[0]}` };
  let gain = ""; if (firstPage) { const aw = C.award(10, 6); gain = `<div class="up">📜 New Codex page · <b>+10 ✦ · +6 💎</b>${aw.rankUp ? ` · 🏅 You are now <b>${C.esc(aw.rankUp)}</b>` : ""}</div>`; setTimeout(S.fanfare, 600); }
  save(); C.showStats();
  const when = (d) => d === 0 ? "today!" : `in ${d} day${d === 1 ? "" : "s"} (${E.fmt(today + d)})`;
  C.say(`Born on ${B.maya.tz}. The day sign ${E.SIGNS[B.maya.sign]} is ${B.maya.meaning}. ${B.nextTz.days === 0 ? "And today is your sacred birthday!" : ""}`);
  $("reading-body").innerHTML = `<div class="cal-report"><h3>🎂 ${C.esc(E.fmt(j, true))}</h3><ul>
    <li><b>Maya Tzolk'in:</b> ${C.esc(B.maya.tz)}, the day sign of ${C.esc(B.maya.meaning)}. Haab' ${C.esc(B.maya.haab)}. Long Count ${C.esc(B.maya.lc)}.</li>
    <li><b>Egyptian civil year:</b> ${C.esc(B.egypt.name)}, season of ${C.esc(B.egypt.season)}.${B.egypt.god ? ` You share a birthday with ${C.esc(B.egypt.god)}.` : ""} Coptic: ${C.esc(B.coptic)}.</li>
    <li><b>Celtic year:</b> ${k.onDay ? `born on ${C.esc(k.after.name)} itself` : `born in the quarter after ${C.esc(k.after.name)}, before ${C.esc(k.next.name)}`}, in ${k.half}.</li></ul></div>`;
  C.ui(`<div class="reward"><div>🌽 Next 260-day sacred birthday: <b>${C.esc(when(B.nextTz.days))}</b></div><div class="note">You have lived ${B.lived.toLocaleString("en")} days: ${B.rounds} full turns of the Tzolk'in.</div>
    <div>🏺 Next Egyptian civil birthday: <b>${C.esc(when(B.nextEgy.days))}</b></div><div class="note">The civil year has no leap day, so this birthday drifts about one day every four years against ours.</div>${gain}</div>
    ${form(ymd).replace("✦ Turn the wheels to my birthday", "✦ Try another date")}
    <div class="choices"><button class="c" type="button" id="cal-btz">🌽 Turn to my next sacred birthday</button></div>`);
  wire(); $("cal-btz").onclick = () => { desk(B.nextTz.jdn); C.say(`On ${E.fmt(B.nextTz.jdn, true)} the Tzolk'in comes round to ${B.maya.tz} again.`); };
}

// ---- Daily Sky: the same three puzzles for everyone today (a cycle, a festival, an eclipse), a streak and a shared board ----
function dailyBtn(p) {
  const st = dailyState(p, GAME), t = st.today;
  return `<div class="levels"><button class="c level cal-daily" type="button" id="cal-daily"><b>☀️ Daily Sky #${dayNumber()}</b><span>${t ? `Done today: ${t.score} / 9 ★ · play again for practice` : "Three puzzles from today's real sky, the same for everyone"} · streak ${st.streak} day${st.streak === 1 ? "" : "s"}${st.best > 1 ? ` · best ${st.best}` : ""}</span></button></div>`;
}
function dailyStart() { D = { set: dailySet(), i: 0, stars: [], practice: dailyState(C.state.prog, GAME).played }; S.page(); dailyPlay(); }
function dailyPlay() {
  const { L, p, g } = D.set[D.i], run = start(L, p, g);
  C.clearReading(); C.cap(`☀️ Daily Sky #${dayNumber()} · ${D.i + 1} of 3 · ${p.title}`); desk(g.desk ?? E.todayJdn());
  const byHand = (g.kind === "tz" || g.kind === "egy") && g.desk != null; if (byHand) handDesk(g);
  ask(L, p, run, `${["First, a cycle", "Next, a festival", "Last, the sky itself"][D.i]}: ${p.title}.${byHand ? " Drag the gears to count, or pick below." : ""}`);
}
function dailyNext(run) { D.stars.push(run.won ? run.stars : 0); D.i++; if (D.i < D.set.length) dailyPlay(); else dailyEnd(); }
function dailyEnd() {
  const prog = C.state.prog, score = dailyScore(D.stars), won = D.stars.every((n) => n > 0), detail = D.stars.map((n) => n + "★").join(" ");
  let line = "Practice round done. Only your first run of the day counts.", gain = "";
  if (!D.practice) {
    const res = finishDaily(prog, GAME, { score, won, detail });
    if (res.first) {
      const r = dailyReward(score, res.streak), aw = C.award(r.xp, r.essence); save(); C.showStats(); postDaily(C.state, GAME, { score, won, detail });
      gain = `<b>+${r.xp} ✦ · +${r.essence} 💎</b>${res.streak > 1 ? ` · streak bonus` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${C.esc(aw.rankUp)}</b></div>` : ""}`;
      line = res.streak > 1 ? `${res.streak} days in a row at the desk. The sky-watchers would approve.` : "Today's sky is logged. Come back tomorrow to start a streak.";
    }
  }
  const st = dailyState(prog, GAME); C.say(line);
  C.ui(`<div class="reward"><div>☀️ Daily Sky #${dayNumber()}: <span class="cal-pop">${D.stars.map((n) => starRow(n)).join(" ")}</span> <b>${score} / 9</b></div><div>${gain}</div><div class="note">Streak ${st.streak} · best ${st.best}</div></div>
    <div class="group">Today's board</div><div id="cal-board"><div class="note">Loading the board…</div></div>
    <div class="choices"><button class="c" type="button" id="cal-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
  if (score) setTimeout(() => S.stars(Math.min(3, Math.ceil(score / 3))), 150);
  if (!D.practice && won) setTimeout(S.fanfare, 700);
  const mine = { score }; D = null;
  boardOf(C.state, GAME).then((b) => { const el = $("cal-board"); if (el) el.innerHTML = boardHtml(b, C.esc, { unit: "★", local: mine }); });
  $("cal-lobby").onclick = () => lobby(false); $("back").onclick = C.greet;
}

// ---- free desk: any date, step the gears, jump to the next festival or eclipse ----
function deskReport(j) {
  const d = E.desk(j), s = E.nextSolar(j), l = E.nextLunar(j, true), nt = E.nextThoth(j), np = E.nextHaab(j, 0, 0);
  const li = (a, b) => `<li><b>${C.esc(a)}</b> ${C.esc(b)}</li>`;
  return `<div class="cal-report"><h3>🗓️ ${C.esc(d.date)}</h3><ul>
    ${li("Tzolk'in", `${d.maya.tz} (day ${d.maya.kin} of 260)`)}${li("Haab'", d.maya.haabName)}${li("Long Count", d.maya.lc)}
    ${li("Egyptian civil year", `${d.egypt.name}, season of ${d.egypt.season}`)}${li("Coptic", `${d.coptic.text}, year ${d.coptic.year}`)}
    ${li("Next fire festival", `${d.festival.f.name}, ${E.fmt(d.festival.jdn)} (from sunset ${E.fmt(d.festival.jdn - 1)})`)}
    ${li("Next Maya New Year (0 Pop)", E.fmt(np))}${li("Next 1 Thoth (wandering year)", E.fmt(nt))}
    ${li("Next solar eclipse", `${s.kind}, ${E.fmt(s.jdn)}`)}${li("Next lunar eclipse", `${l.kind}, ${E.fmt(l.jdn)}`)}
    ${li("Moon", `${PHASE(d.moon)} · Sun at ${Math.round(d.sun)}° on the ecliptic`)}</ul></div>`;
}
function freeDesk(j) {
  C.cap("🗓️ Keeper's desk"); desk(j); $("reading-body").innerHTML = deskReport(j);
  C.say(pick(["Turn the wheels. Watch the 13 and the 20 slide past each other.", "Step a day at a time, or leap to the next festival or eclipse.", "Any date you like. The calendars don't mind."]));
  const g = E.dateOf(j), ymd = `${g.year}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}`;
  C.ui(`<div class="form one"><label for="cal-d">Date (year-month-day)<input id="cal-d" value="${ymd}" maxlength="11" autocomplete="off" inputmode="numeric"></label></div>
    <div class="choices cal-steps">${[[-1, "◀ 1 day"], [1, "1 day ▶"], [13, "+13"], [20, "+20"], [260, "+260"], [365, "+365"]].map(([n, t]) => `<button class="c small" type="button" data-n="${n}">${t}</button>`).join("")}</div>
    <div class="choices"><button class="c main" type="button" id="cal-go">✦ Turn the wheels</button><button class="c" type="button" id="cal-today">Today</button><button class="c" type="button" id="cal-fest">🔥 Next festival</button><button class="c" type="button" id="cal-ecl">🌘 Next eclipse</button></div>
    <div class="choices"><button class="c small" type="button" id="cal-lobby">📜 Back to the levels</button></div>`);
  const go = () => { const v = E.parseYmd($("cal-d").value); if (v == null) { C.say("That date doesn't turn the wheels. Try year-month-day, like 2012-12-21."); return; } freeDesk(v); };
  $("cal-go").onclick = go; onEnter("cal-d", go);
  $("ui").querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => freeDesk(j + +b.dataset.n)));
  $("cal-today").onclick = () => freeDesk(E.todayJdn());
  $("cal-fest").onclick = () => freeDesk(E.nextFestival(j + 1).jdn);
  $("cal-ecl").onclick = () => freeDesk(E.nextEclipse(j + 1, true).jdn);
  $("cal-lobby").onclick = () => lobby(false);
}

// ---- a puzzle ----
const ansText = (g) => g.kind === "tz" ? E.tzName(g.answer.tone, g.answer.sign) : g.kind === "egy" ? E.egyName(g.answer.month, g.answer.day)
  : g.kind === "num" ? Number(g.answer).toLocaleString("en") : String(g.answer);
const opt = (vals, sel) => vals.map(([v, t]) => `<option value="${v}"${String(v) === String(sel) ? " selected" : ""}>${C.esc(t)}</option>`).join("");

function play(L, p) {
  const g = p.gen(Math.random, E.todayJdn()), run = start(L, p, g);
  C.clearReading(); C.cap(`🗓️ Level ${L.n} · ${p.title}`); desk(g.desk ?? E.todayJdn());
  if ((g.kind === "tz" || g.kind === "egy") && g.desk != null) handDesk(g);
  const byHand = (g.kind === "tz" || g.kind === "egy") && g.desk != null;
  ask(L, p, run, byHand ? pick([`${p.title}. Drag the gears to count the days, or pick below.`, `${p.title}. Turn the wheels by hand. Each click is one day.`])
    : pick([`${p.title}. Study the desk, then answer below.`, `${p.title}. The wheels are set. Your move, Keeper.`, `${p.title}. Count carefully.`]));
}
/** Let the player turn the gears by hand: each day is one click, and the answer pickers follow the dials. */
function handDesk(g) {
  const j0 = g.desk, el = C.tableEl || $("table");
  setTimeout(() => { if (shown !== j0) return; hand = attachDrag(el, j0, (n, fwd) => { S.tick(fwd); pickersFrom(g, n); }); }, 900);
}
function pickersFrom(g, n) {
  const j = g.desk + n;
  if (g.kind === "tz" && $("cal-t")) { const m = E.maya(j); $("cal-t").value = m.tone; $("cal-s").value = m.sign; }
  if (g.kind === "egy" && $("cal-m")) { const e = E.egyptCivil(j); $("cal-m").value = e.month; $("cal-dd").value = e.day; }
}
function dialsFrom(g) {
  if (!hand) return;
  if (g.kind === "tz") hand.set(daysToTz(g.desk, { tone: +$("cal-t").value, sign: +$("cal-s").value }));
  if (g.kind === "egy") hand.set(daysToEgy(g.desk, { month: +$("cal-m").value, day: +$("cal-dd").value }));
  S.gears(3, 0.4);
}
function widget(g, run) {
  const q = `<div class="cal-q">${C.esc(g.q)}</div>`;
  if (g.kind === "choice") return `${q}<div class="choices col">${g.choices.map((c, i) => `<button class="c" type="button" data-c="${i}"${run.tried?.includes(c) ? " disabled" : ""}>${run.tried?.includes(c) ? "✗ " : ""}${C.esc(c)}</button>`).join("")}</div>`;
  const go = `<button class="c main" type="button" id="cal-ans">✦ Answer</button>`;
  if (g.kind === "num") return `${q}<div class="form one"><label for="cal-n">Your answer<input id="cal-n" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="a number"></label></div><div class="choices">${go}</div>`;
  if (g.kind === "tz") return `${q}<div class="form cal-two"><label for="cal-t">Number<select id="cal-t">${opt(Array.from({ length: 13 }, (_, i) => [i + 1, String(i + 1)]), 1)}</select></label><label for="cal-s">Day sign<select id="cal-s">${opt(E.SIGNS.map((s, i) => [i, s]), 0)}</select></label></div><div class="choices">${go}</div>`;
  if (g.kind === "egy") return `${q}<div class="form cal-two"><label for="cal-dd">Day<select id="cal-dd">${opt(Array.from({ length: 30 }, (_, i) => [i + 1, String(i + 1)]), 1)}</select></label><label for="cal-m">Month<select id="cal-m">${opt(E.EGY_MONTHS.slice(0, 12).map((m, i) => [i, `${m} (${E.EGY_SEASON[i]})`]).concat([[12, "Epagomenal days"]]), 0)}</select></label></div><div class="choices">${go}</div>`;
  return q;
}
function ask(L, p, run, line) {
  const g = run.g; if (line) C.say(line);
  const more = run.hints < g.hints.length && run.stars > 1;
  const hints = g.hints.slice(0, run.hints).map((h, i) => `<div class="clue"><b>💡 Hint ${i + 1}</b><span>${C.esc(h)}</span></div>`).join("");
  C.ui(`<div class="cx-top">${D ? `☀️ Daily ${D.i + 1} / 3` : `Level ${L.n}`} · ${starRow(run.stars)} · ${run.stars} star${run.stars === 1 ? "" : "s"} to win</div>${hints ? `<div class="clues">${hints}</div>` : ""}${widget(g, run)}
    <div class="choices">${more ? `<button class="c" type="button" id="cal-hint">💡 Hint (costs ★)</button>` : ""}<button class="c small" type="button" id="cal-leave">Leave the puzzle</button></div>${guideRow()}`);
  const answer = (a, label) => {
    const r = check(run, a);
    if (r === "right") return solved(L, p, run);
    if (r === "out") return outOf(L, p, run);
    if (label != null) (run.tried ||= []).push(label);
    S.wrong(); shake(C.tableEl || $("table")); ask(L, p, run, pick(WRONG) + (run.stars === 1 ? " One star left." : ""));
  };
  $("ui").querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { const c = g.choices[+b.dataset.c]; answer(c, c); }));
  const go = () => {
    if (g.kind === "num") { const v = $("cal-n").value.trim(); if (!/^[\d,\s]+$/.test(v)) { C.say("A whole number, please. The gears only take digits."); return; } answer(v); }
    else if (g.kind === "tz") answer({ tone: +$("cal-t").value, sign: +$("cal-s").value });
    else if (g.kind === "egy") { const m = +$("cal-m").value, d = +$("cal-dd").value; if (m === 12 && d > 5) { C.say("There are only five epagomenal days."); return; } answer({ month: m, day: d }); }
  };
  if (hand && (g.kind === "tz" || g.kind === "egy")) pickersFrom(g, hand.n);
  ["cal-t", "cal-s", "cal-m", "cal-dd"].forEach((id) => { if ($(id)) $(id).onchange = () => dialsFrom(g); });
  if ($("cal-ans")) { $("cal-ans").onclick = go; onEnter("cal-n", go); setTimeout(() => $("cal-n") && $("cal-n").focus(), 50); }
  if ($("cal-hint")) $("cal-hint").onclick = () => { const h = useHint(run); if (h) { S.hint(); ask(L, p, run, h); } };
  $("cal-leave").onclick = () => lobby(false); wireGuides();
}
function solved(L, p, run) {
  S.right();
  if (run.g.after != null && run.g.after !== shown) desk(run.g.after, shown, run.g.scene || "right"); else desk(shown, shown, run.g.scene || "right");
  C.talkThrough([`${pick(RIGHT)} ${ansText(run.g)}.`, run.g.explain], () => (D ? dailyNext(run) : finish(L, p, run)));
}
function outOf(L, p, run) {
  S.wrong(); if (run.g.after != null) desk(run.g.after, shown, run.g.scene || null);
  C.talkThrough([`Out of stars. The Keeper turns the wheels for you: the answer is ${ansText(run.g)}.`, run.g.explain], () => (D ? dailyNext(run) : finish(L, p, run)));
}
function finish(L, p, run) {
  const prog = C.state.prog, before = titleOf(starsOf(prog)).name, r = settle(prog, run), aw = C.award(r.xp, r.essence);
  C.trophy?.("calendar", L.n, { won: run.won, perfect: run.won && r.stars === 3 }); // Trophy Case (trophies.js)
  save(); C.showStats();
  const t = titleOf(r.total), titled = t.name !== before, nextL = LEVELS[L.n], unlocked = nextL && r.first && doneCount(prog, L) === 4;
  C.say(run.won ? pick(["Logged in the Keeper's book.", "Another day well counted.", "The calendars thank you."]) : "We'll count that one again another day.");
  C.ui(`<div class="reward"><div><span class="cal-pop">${starRow(r.stars)}</span> <b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>${r.first ? " · first solve" : r.best ? " · new best" : run.won ? ` · best stays ${cal(prog).stars[run.key]} ★` : ""}</div>
    ${titled ? `<div class="up">🗓️ Keeper title: <b>${C.esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${C.esc(aw.rankUp)}</b></div>` : ""}${unlocked ? `<div class="up">🔓 Level ${nextL.n} is open: ${C.esc(nextL.what)}</div>` : ""}</div>
    <div class="choices"><button class="c main" type="button" id="cal-next">🗓️ Next Level ${L.n} puzzle</button><button class="c" type="button" id="cal-again">↻ Play this one again</button><button class="c" type="button" id="cal-lobby">📜 Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
  if (r.stars) setTimeout(() => S.stars(r.stars), 150);
  if (titled || aw.rankUp || unlocked) setTimeout(S.fanfare, 700);
  $("cal-next").onclick = () => play(L, nextPuzzle(prog, L, p.id)); $("cal-again").onclick = () => play(L, p);
  $("cal-lobby").onclick = () => lobby(false); $("back").onclick = C.greet;
}

/** This room's part of the 📜 Codex: stars per level and the puzzles solved. */
export function codexHtml(prog, esc = escH) {
  const r = cal(prog), b = r.bday;
  const bday = b ? `<div class="cx"><div class="cx-h"><span>🎂 Your birthday in every calendar</span><span class="note">Calendar Keeper</span></div><div class="chips"><span>🌽 ${esc(b.tz)} (${esc(b.meaning)})</span><span>🏺 ${esc(b.egy)}</span><span>🔥 ${esc(b.celtic)}</span></div></div>` : "";
  return bday + LEVELS.map((L) => { const got = L.deck.filter((x) => r.stars[keyOf(L, x)]), st = starsOf(prog, L), of = L.deck.length * STARS;
    return `<div class="cx"><div class="cx-h"><span>🗓️ Calendar Keeper ${L.n}: ${esc(L.what)}</span><span class="note">${st} / ${of} ★</span></div>
      <div class="bar"><i style="width:${(st / of) * 100}%"></i></div>${got.length ? `<div class="chips">${got.map((x) => `<span>${esc(x.title)} ${"★".repeat(r.stars[keyOf(L, x)])}</span>`).join("")}</div>` : ""}</div>`; }).join("");
}
