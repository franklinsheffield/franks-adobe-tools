// Turn the desk by hand: drag the Tzolk'in gears, the Egyptian needle or the Sun on the Celtic wheel.
// Every day turned is one ratchet click. The desk was drawn for day j0; `n` is how many days the player has turned.
import * as E from "./engine.js";

const TZ = 360 / 13, BIG = 18, YEAR = 360 / 365, SUN = 360 / 365.2422;
// Hub centres in desk coordinates (see deskSvg in room.js).
export const HUBS = { small: [238, 128], big: [388, 128], egypt: [130, 292], celtic: [385, 292] };

/** Rotation (degrees) of each dial when the desk shows day j0 + n. Matches deskSvg exactly at n = 0. */
export function turnAngles(j0, n) {
  const d = j0 + n - E.GMT;
  return { small: -d * TZ, big: d * BIG, needle: ((E.egyptCivil(j0).doy + 0.5) / 365) * 360 - 90 + n * YEAR, sun: -E.sunLon(j0) - n * SUN };
}
/** Degrees of drag per day, and the sign that turns time forward, for each hub. */
const STEP = { small: -TZ, big: BIG, egypt: YEAR, celtic: -SUN };

/** Which hub a desk point grabs, or null. */
export function hubAt(x, y) {
  let best = null, bd = Infinity;
  for (const [k, [cx, cy]] of Object.entries(HUBS)) { const r = Math.hypot(x - cx, y - cy), lim = k === "big" ? 92 : 80; if (r > 14 && r < lim && r < bd) { best = k; bd = r; } }
  return best;
}
/** Days from the Tzolk'in day at j0 to the given {tone, sign}: 0-259. */
export const daysToTz = (j0, t) => { const m = E.maya(j0); for (let n = 0; n < 260; n++) { const v = E.tzAdd(m.tone, m.sign, n); if (v.tone === t.tone && v.sign === t.sign) return n; } return 0; };
/** Days from the Egyptian civil date at j0 to {month, day}: 0-364. */
export const daysToEgy = (j0, e) => E.mod(e.month * 30 + e.day - 1 - E.egyptCivil(j0).doy, 365);

/**
 * Make the desk in `tableEl` draggable. onTurn(n, fwd) fires on each new day (n = days turned from j0).
 * Returns { set(n) } to move the dials from outside (e.g. when the player picks from the dropdowns).
 */
export function attachDrag(tableEl, j0, onTurn) {
  const svg = tableEl && tableEl.querySelector("svg.cal-desk"); if (!svg) return { set() {} };
  const els = {}; svg.querySelectorAll(".cal-g[data-k]").forEach((g) => (els[g.dataset.k] = g));
  let badge = svg.querySelector(".cal-turned");
  if (!badge) { badge = document.createElementNS("http://www.w3.org/2000/svg", "text"); badge.setAttribute("class", "cal-turned"); badge.setAttribute("x", "260"); badge.setAttribute("y", "50"); badge.setAttribute("text-anchor", "middle"); badge.setAttribute("font-size", "12"); svg.append(badge); }
  let n = 0, drag = null;
  const paint = () => { const a = turnAngles(j0, n); for (const k in els) els[k].style.transform = `rotate(${a[k]}deg)`; if (badge) badge.textContent = n ? `Turned ${n > 0 ? "+" : "−"}${Math.abs(n)} day${Math.abs(n) === 1 ? "" : "s"}` : "Drag a gear to turn the days"; };
  const toDesk = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : p; };
  const ang = (k, p) => (Math.atan2(p.y - HUBS[k][1], p.x - HUBS[k][0]) * 180) / Math.PI;
  svg.classList.add("cal-drag");
  svg.addEventListener("pointerdown", (e) => {
    const p = toDesk(e), k = hubAt(p.x, p.y); if (!k) return;
    e.preventDefault(); svg.setPointerCapture?.(e.pointerId);
    drag = { k, last: ang(k, p), acc: 0, n0: n }; svg.classList.add("dragging");
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return; const a = ang(drag.k, toDesk(e)); let da = a - drag.last; if (da > 180) da -= 360; if (da < -180) da += 360;
    drag.last = a; drag.acc += da;
    const want = drag.n0 + Math.round(drag.acc / STEP[drag.k]);
    if (want === n) return;
    const fwd = want > n; n = want; paint(); onTurn && onTurn(n, fwd);
  });
  const end = () => { if (!drag) return; drag = null; svg.classList.remove("dragging"); };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  paint();
  return { set(v) { n = v; paint(); }, get n() { return n; } };
}
