// Smoothness on phones (2026-11-28, "it's kind of laggy"). Two things, both invisible on a fast desktop:
// 1. Lite mode on phones and small/slow devices: <html class="lite">. chamber.css thins the looping particles and
//    star twinkles, drops animated blur filters, and the starfield canvas draws fewer stars at a lower frame rate.
//    The look stays; there is simply less of it moving at once.
// 2. Covered = paused: while a full-screen layer (the House door, Trophy Case, credits, zoom) hides the Chamber,
//    <html class="covered"> pauses every animation behind it, so the phone only animates what is on screen.
// A member can force it either way: localStorage "oracle-lite" = "1" (on) or "0" (off).

const pref = (() => { try { return localStorage.getItem("oracle-lite"); } catch { return null; } })();
const mq = (q) => { try { return matchMedia(q).matches; } catch { return false; } };
const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 8;
const phone = mq("(pointer: coarse)") || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || "");

/** True on phones, tablets and low-power machines (or when the member turned it on). */
export const LITE = pref === "1" ? true : pref === "0" ? false : phone || cores <= 4 || mem <= 4;
if (LITE) document.documentElement.classList.add("lite");

/** The Chamber behind is fully hidden: by the door (until it starts opening) or by an opaque full-screen layer. */
function covered() {
  const g = document.getElementById("gate");
  if (g && !g.hidden && !g.classList.contains("open")) return true;
  for (const id of ["tcase", "tcollect", "zoom"]) { const el = document.getElementById(id); if (el && !el.hidden) return true; }
  return !!document.querySelector(".credits");
}
let isCovered = false;
const listeners = new Set();
/** Is the Chamber hidden right now (or the page in the background)? The starfield checks this every frame. */
export const chamberHidden = () => isCovered || document.hidden;
/** Call fn when the Chamber comes back into view (to restart a paused loop). */
export const onShow = (fn) => listeners.add(fn);
function check() {
  const c = covered(); if (c === isCovered) return;
  isCovered = c; document.documentElement.classList.toggle("covered", c);
  if (!c) for (const fn of listeners) try { fn(); } catch { /* keep going */ }
}
// A cheap poll (a few id lookups, 4 times a second) instead of watching the whole document for changes.
setInterval(check, 250);
document.addEventListener("visibilitychange", () => { if (!document.hidden) for (const fn of listeners) try { fn(); } catch { /* keep going */ } });
document.addEventListener("click", () => setTimeout(check, 0), true);

// Kept here rather than in chamber.css so phone-layout work there never collides with it.
const CSS = `
html.covered #stage *,html.covered #stage *::before,html.covered #stage *::after{animation-play-state:paused!important}
html.lite .vx-rise:nth-child(2n),html.lite .vx-tw:nth-child(2n),html.lite .vx-fall:nth-child(2n),html.lite .vx-fallt:nth-child(2n),html.lite .vx-fly:nth-child(2n){display:none}
html.lite .gb-stars i:not(:nth-child(3n)){animation:none;opacity:.6}
html.lite .sc-dust i:nth-child(2n),html.lite .sc-star:nth-child(2n),html.lite .gm-mote:nth-child(2n),html.lite .fx-rise:nth-child(2n){display:none}
html.lite .gb-neb{animation-name:gb-neb-lite}
@keyframes gb-neb-lite{0%{transform:translate(0,0) scale(1)}50%{transform:translate(6vmax,4vmax) scale(1.15)}100%{transform:translate(-4vmax,7vmax) scale(.95)}}
html.lite .gate,html.lite .pull-modal{backdrop-filter:none;-webkit-backdrop-filter:none}
`;
{ const st = document.createElement("style"); st.id = "perf-style"; st.textContent = CSS; document.head.append(st); }
