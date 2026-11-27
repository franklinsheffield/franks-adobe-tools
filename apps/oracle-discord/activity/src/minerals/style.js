// Mineral Cabinet styles, injected once when the room opens.
export const CSS = `
.table.minerals { display:flex; align-items:center; justify-content:center; background:#0d0b09; }
.table.minerals svg { width:100%; height:100%; }
.mc-rock { animation: mc-in .5s ease-out; transform-origin:160px 120px; }
@keyframes mc-in { from { transform: scale(.8) rotate(-6deg); opacity:0; } }
.mc-glint { animation: mc-glint 2.4s ease-in-out infinite; }
@keyframes mc-glint { 0%,100% { opacity:.2 } 50% { opacity:1 } }
.mc-tool { animation: mc-tool .45s ease-out; }
@keyframes mc-tool { from { transform: translate(20px,-20px); opacity:0; } }
.mc-tool.snap { animation: mc-snap .5s cubic-bezier(.5,1.8,.6,1); }
@keyframes mc-snap { from { transform: translate(40px,-30px); } to { transform: translate(-50px,30px); } }
.mc-tool.snap, .mc-tool.tug { transform: translate(-50px,30px); }
.mc-tool.tug { animation: mc-tug 1s ease-in-out infinite alternate; }
@keyframes mc-tug { from { transform: translate(-40px,22px); } to { transform: translate(-46px,26px); } }
.mc-streak { stroke-dasharray: 80; animation: mc-draw .8s ease-out forwards; }
@keyframes mc-draw { from { stroke-dashoffset: 80; } to { stroke-dashoffset: 0; } }
.mc-bub { animation: mc-bub 1.2s ease-out infinite; animation-delay: var(--d); }
@keyframes mc-bub { from { transform: translateY(0); opacity:.9 } to { transform: translateY(-26px); opacity:0 } }
.mc-drop { animation: mc-drop .6s ease-in forwards; }
@keyframes mc-drop { to { transform: translateY(26px); opacity:0; } }
.mc-uvglow { animation: mc-pulse 1.6s ease-in-out infinite alternate; }
@keyframes mc-pulse { from { opacity:.12 } to { opacity:.4 } }
.mc-results { display:grid; gap:4px; margin:6px 0; }
.mc-results div { background:#ffffff0c; border-radius:8px; padding:5px 8px; font-size:.92em; }
.mc-tests { display:flex; flex-wrap:wrap; gap:6px; }
.mc-drawers { display:grid; gap:10px; }
.mc-drawer h4 { margin:4px 0; }
.mc-cells { display:flex; flex-wrap:wrap; gap:6px; }
.mc-cell { display:flex; flex-direction:column; align-items:center; width:76px; padding:4px; border-radius:8px; background:#ffffff0a; font-size:.75em; text-align:center; }
.mc-cell.off { opacity:.4; }
.mc-cell .ft-sw { margin:2px 0 0; }
@media (prefers-reduced-motion: reduce) { .mc-rock, .mc-glint, .mc-tool, .mc-streak, .mc-bub, .mc-drop, .mc-uvglow { animation:none !important; } }
`;
