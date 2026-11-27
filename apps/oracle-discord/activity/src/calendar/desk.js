// The Keeper's desk as an SVG string: Tzolk'in gears, the Egyptian civil-year dial and the Celtic wheel for one day.
// Pure (no DOM), so the /calendar chat card can draw the same desk (src/modules/calendar).
import * as E from "./engine.js";

const escH = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
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
export const PHASE = (ph) => ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"][Math.round(ph / 45) % 8];
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
<text x="260" y="28" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="18" text-anchor="middle" fill="${L.text}" letter-spacing="1">${escH(j < E.GREGORIAN_START ? E.fmtJ(j, true) + " (Julian)" : E.fmt(j, true))}</text>
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
export function sceneSvg(scene, L, g) {
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

