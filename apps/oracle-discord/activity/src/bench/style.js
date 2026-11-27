// Discovery Bench styles, injected once when the room opens.
export const CSS = `
.table.bench { display:flex; align-items:center; justify-content:center; background:#0d0b09; }
.table.bench svg { width:100%; height:100%; }
.db-jar { animation: db-in .35s ease-out backwards; animation-delay: calc(var(--i) * .08s); }
@keyframes db-in { from { transform: translateY(-14px); opacity:0; } }
.db-fire { animation: db-flick .35s ease-in-out infinite alternate; transform-origin:160px 210px; }
@keyframes db-flick { to { transform: scale(1.06, .9); } }
.db-glow { animation: db-pulse 1s ease-in-out infinite alternate; }
@keyframes db-pulse { from { opacity:.25 } to { opacity:.7 } }
.db-bub { animation: db-bub 1.1s ease-out infinite; animation-delay: var(--d); }
@keyframes db-bub { to { transform: translateY(-40px); opacity:0; } }
.db-zap { animation: db-zap .2s steps(2) infinite; }
@keyframes db-zap { 50% { opacity:.2 } }
.db-pestle { animation: db-grind .6s ease-in-out infinite alternate; transform-origin:204px 126px; }
@keyframes db-grind { to { transform: rotate(-14deg); } }
.db-smoke { animation: db-smoke 1.8s ease-out infinite; }
@keyframes db-smoke { to { transform: translateY(-50px) scale(2); opacity:0; } }
.db-res { animation: db-res .6s cubic-bezier(.4,1.6,.6,1); transform-origin:160px 120px; }
@keyframes db-res { from { transform: scale(.4); opacity:0; } }
.db-hz { animation: db-flash .9s ease-out; }
@keyframes db-flash { 0% { opacity:.0 } 15% { opacity:.6 } 100% { opacity:0 } }
.db-shelf { display:flex; flex-wrap:wrap; gap:6px; margin:4px 0 8px; }
.db-shelf .c { flex:0 1 auto; padding:5px 9px; font-size:.88em; }
.db-shelf .c.on { outline:2px solid #f3d27a; }
.db-shelf .c.lock { opacity:.55; }
.db-shelf i { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:5px; vertical-align:-1px; }
.db-eq { display:block; font-family: ui-monospace, monospace; background:#0006; padding:6px 8px; border-radius:6px; margin:4px 0; white-space:normal; }
.db-list { display:grid; gap:6px; }
@media (prefers-reduced-motion: reduce) { .db-jar, .db-fire, .db-glow, .db-bub, .db-zap, .db-pestle, .db-smoke, .db-res, .db-hz { animation:none !important; } }
`;
