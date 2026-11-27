// Fireworks Workshop styles, injected once when the room opens.
export const CSS = `
.table.fireworks { display:flex; align-items:center; justify-content:center; background:#06061a; }
.table.fireworks svg { width:100%; height:100%; }
.fw-rise { animation: fw-rise var(--t) cubic-bezier(.2,.6,.4,1) var(--d) both; }
@keyframes fw-rise { from { transform: translateY(0); opacity:1; } 92% { opacity:1; } to { transform: translateY(var(--y)); opacity:0; } }
.fw-st { fill: var(--c1); transform: translate(0,0); opacity:0; animation: fw-fly 2.2s cubic-bezier(.15,.7,.35,1) var(--d) both, fw-col 2.2s linear var(--d) both; }
.fw-burst.willow .fw-st { animation-duration: 3.2s, 3.2s; }
.fw-st.tl { animation-timing-function: cubic-bezier(.2,.6,.4,1), linear; }
@keyframes fw-fly { 0% { transform: translate(0,0); opacity:0; } 4% { opacity:1; } 70% { opacity:1; } 100% { transform: translate(var(--dx), calc(var(--dy) + var(--fall))); opacity:0; } }
@keyframes fw-col { 0%, 42% { fill: var(--c1); } 58%, 100% { fill: var(--c2); } }
.fw-flash { opacity:0; animation: fw-flash .35s ease-out var(--d) both; }
@keyframes fw-flash { 0% { opacity:0; transform: scale(.2); } 30% { opacity:.9; } 100% { opacity:0; transform: scale(2.2); } }
.fw-lbl { font-size:10px; fill:#f3e6c8; opacity:0; animation: fw-lbl 2.6s ease-out var(--d) both; }
@keyframes fw-lbl { 10% { opacity:1; } 80% { opacity:1; } 100% { opacity:0; } }
.fw-shell { animation: fw-pop .35s cubic-bezier(.4,1.6,.6,1); transform-box: fill-box; transform-origin: center; }
@keyframes fw-pop { from { transform: scale(.6); opacity:0; } }
.fw-build { display:grid; grid-template-columns:max-content 1fr; gap:4px 10px; align-items:center; margin:4px 0; }
.fw-build .group { margin:0; width:auto; }
@media (max-width:560px){ .fw-build { grid-template-columns:1fr; gap:2px; } }
#fw-light, .fw-cues span { animation:none !important; }
.fw-chips { display:flex; flex-wrap:wrap; gap:4px; }
.fw-chips .c { display:inline-flex; align-items:center; gap:6px; }
.fw-chips .c i { width:12px; height:12px; border-radius:50%; display:inline-block; box-shadow:0 0 6px currentColor; }
.fw-target { border:1px dashed var(--gold); border-radius:10px; padding:8px 12px; margin:6px 0; }
.fw-cues { display:flex; gap:6px; flex-wrap:wrap; } .fw-cues span { padding:3px 8px; border-radius:8px; background:#ffffff10; font-size:.85rem; } .fw-cues span.on { outline:1px solid var(--gold); }
.fw-meter { position:relative; height:16px; border-radius:8px; background:#ffffff12; overflow:hidden; margin:6px 0; }
.fw-meter i { position:absolute; top:0; bottom:0; width:3px; background:#ffcf6a; } .fw-meter b { position:absolute; top:0; bottom:0; left:0; background:#ffffff30; }
@media (prefers-reduced-motion: reduce) { .fw-st, .fw-rise, .fw-flash, .fw-lbl { animation-duration: .01s !important; } .fw-st { opacity:1; transform: translate(var(--dx), var(--dy)); } }
`;
