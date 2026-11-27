// Dark Séance styles, injected once when the room opens.
export const CSS = `
.table.darkseance { display:flex; align-items:center; justify-content:center; background:#07050a; }
.table.darkseance svg { width:100%; height:100%; }
.ds-glow { animation: ds-glow 1.8s ease-in-out infinite alternate; } @keyframes ds-glow { to { opacity:.45 } }
.ds-tilt { animation: ds-tilt 1.4s ease-in-out 2; transform-origin: 160px 160px; } @keyframes ds-tilt { 50% { transform: rotate(-7deg) translateY(-4px) } }
.ds-ring { animation: ds-ring 1.1s ease-out infinite; animation-delay: var(--d); transform-box: fill-box; transform-origin: center; } @keyframes ds-ring { from { transform: scale(.4); opacity:.9 } to { transform: scale(3.4); opacity:0 } }
.ds-wind { animation: ds-wind 1.6s ease-in-out infinite; animation-delay: var(--d); } @keyframes ds-wind { 50% { transform: translateX(14px); opacity:.2 } }
.ds-float { animation: ds-float 2.2s ease-in-out infinite; } @keyframes ds-float { 50% { transform: translateY(-10px) rotate(-6deg) } }
.ds-ring2 { animation: ds-ring2 .25s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: top center; } @keyframes ds-ring2 { to { transform: rotate(14deg) } }
.ds-shake { animation: ds-shake .18s linear infinite alternate; } @keyframes ds-shake { to { transform: translate(3px,-2px) } }
.ds-ghost { animation: ds-ghost 3s ease-in-out infinite; } @keyframes ds-ghost { 0% { opacity:0; transform: translateY(14px) } 40%,100% { opacity:.75; transform:none } }
.ds-drop { animation: ds-drop 1s ease-in both; animation-delay: var(--d); } @keyframes ds-drop { from { transform: translateY(-70px); opacity:0 } }
.ds-flash { animation: ds-flash .7s ease-out forwards; } @keyframes ds-flash { from { opacity:.9 } to { opacity:0 } }
.ds-stamp { animation: ds-stamp .45s cubic-bezier(.4,1.8,.6,1); transform-origin:160px 113px; } @keyframes ds-stamp { from { transform: scale(2.4); opacity:0 } }
.ds-ctl { display:flex; flex-wrap:wrap; gap:6px; margin:4px 0; } .ds-ctl span { background:#ffffff10; border-radius:999px; padding:2px 9px; font-size:.85em; }
.ds-act { font-size:1.15em; padding:14px; }
.ds-log { display:grid; gap:4px; font-size:.9em; } .ds-log div { background:#ffffff0a; border-radius:8px; padding:4px 8px; }
@media (prefers-reduced-motion: reduce) { .ds-glow, .ds-tilt, .ds-ring, .ds-wind, .ds-float, .ds-ring2, .ds-shake, .ds-ghost, .ds-drop, .ds-flash, .ds-stamp { animation:none !important; } .ds-flash { opacity:0 } }
`;
