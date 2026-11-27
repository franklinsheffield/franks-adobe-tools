// Flame Test Lab styles, injected once when the room opens.
export const CSS = `
.table.flametest { display:flex; align-items:center; justify-content:center; background:#0d0b09; }
.table.flametest .ft-bench { width:100%; height:100%; max-height:100%; }
.ft-flame path { transform-origin:110px 140px; transform-box:view-box; }
.ft-f1 { animation: ft-flick 0.9s ease-in-out infinite alternate; }
.ft-f2 { animation: ft-flick 0.6s ease-in-out infinite alternate-reverse; }
.ft-f3 { animation: ft-flick 0.45s ease-in-out infinite alternate; }
.ft-flame.lit .ft-f1, .ft-flame.lit .ft-f2 { animation-duration:.35s; }
@keyframes ft-flick { from { transform: scale(1, 1) skewX(0deg); } to { transform: scale(.94, 1.06) skewX(2deg); } }
.ft-glow { transition: r .4s; animation: ft-pulse 1.4s ease-in-out infinite alternate; }
@keyframes ft-pulse { from { opacity:.65 } to { opacity:1 } }
.ft-wire { transition: transform .4s; }
.ft-wire.dip { animation: ft-dip .5s ease-out; }
@keyframes ft-dip { from { transform: translate(70px,-12px); } to { transform: none; } }
.ft-puff circle { animation: ft-rise 1.6s ease-out forwards; }
@keyframes ft-rise { to { transform: translateY(-30px); opacity:0; } }
.ft-cobalt { animation: ft-in .35s ease-out; }
@keyframes ft-in { from { opacity:0; transform: translateY(16px); } }
.ft-line { animation: ft-in .5s ease-out; }
.ft-spec { width:100%; max-width:420px; display:block; margin:6px auto; border-radius:6px; border:1px solid #7a5a1a; }
.ft-sw { display:inline-block; width:14px; height:14px; border-radius:50%; vertical-align:-2px; margin-right:6px; box-shadow:0 0 6px currentColor; }
.ft-timer { font-variant-numeric: tabular-nums; }
.ft-timer.low { color:#ff8a7a; }
.ft-swatches { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0; }
.ft-swatches span { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:10px; background:#ffffff10; font-size:.85em; }
.ft-card { border:1px solid #7a5a1a; border-radius:10px; padding:8px 10px; margin:6px 0; background:#1a140c; }
.ft-card b { display:block; margin-bottom:4px; }
@media (prefers-reduced-motion: reduce) { .ft-flame path, .ft-glow, .ft-wire.dip, .ft-puff circle, .ft-cobalt, .ft-line { animation:none !important; } }
`;
