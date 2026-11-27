// Inscription Tray styles, injected once when the room opens (with the bundled script fonts).
import { fontCss } from "./scene.js";
export const CSS = () => fontCss() + `
.table.inscriptions { display:flex; align-items:center; justify-content:center; background:#1C1710; }
.table.inscriptions .in-tray { width:100%; height:100%; max-height:100%; }
.in-slide { animation: in-slide .55s cubic-bezier(.2,.8,.3,1); }
@keyframes in-slide { from { transform: translateY(-40px); opacity:0; } }
.in-ink { animation: in-ink 1.2s ease-out; }
@keyframes in-ink { from { opacity:0; } }
.in-glow { animation: in-flick 2.6s ease-in-out infinite alternate; }
@keyframes in-flick { from { opacity:.8 } to { opacity:1 } }
.in-scan { animation: in-scan 1.1s ease-in-out; }
@keyframes in-scan { to { transform: translateX(380px); } }
.in-led { animation: in-led 1.6s ease-in-out infinite alternate; }
@keyframes in-led { from { opacity:.3 } to { opacity:1 } }
.in-copy { animation: in-pin .5s ease-out; }
@keyframes in-pin { from { opacity:0; transform: translate(260px,170px) scale(.6); } }
.in-stamp { animation: in-stamp .45s cubic-bezier(.3,1.6,.5,1); transform-origin:70px 170px; transform-box:view-box; }
@keyframes in-stamp { from { transform: scale(2.2); opacity:0; } }
.in-card { border:1px solid #4A3A2C; border-radius:10px; padding:8px 10px; margin:6px 0; background:#241c12; }
.in-card b { display:block; margin-bottom:4px; color:#F1E4C6; }
.in-sample { font-size:1.5em; line-height:1.3; margin:4px 0; color:#F1E4C6; }
.in-drawer { border-left:3px solid #E8483B; padding-left:8px; margin:10px 0; }
.in-drawer h4 { margin:0 0 4px; color:#E8483B; }
.in-chips { display:flex; flex-wrap:wrap; gap:6px; }
.in-chips span { padding:2px 8px; border-radius:10px; background:#ffffff10; font-size:.85em; }
.in-chips span.no { opacity:.35; }
.in-timer { font-variant-numeric: tabular-nums; } .in-timer.low { color:#ff8a7a; }
@media (prefers-reduced-motion: reduce) { .in-slide, .in-ink, .in-glow, .in-scan, .in-led, .in-copy, .in-stamp { animation:none !important; } }
`;
