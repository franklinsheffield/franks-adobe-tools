// Commissions styles, injected once when the room opens.
export const CSS = `
.table.commissions { display:flex; align-items:center; justify-content:center; background:#0d0b09; }
.table.commissions svg { width:100%; height:100%; }
.cm-letter { animation: cm-pin .45s cubic-bezier(.4,1.5,.6,1) backwards; animation-delay: calc(var(--i) * .12s); transform-box: fill-box; transform-origin: 50% 0; }
@keyframes cm-pin { from { transform: translateY(-30px) rotate(-6deg); opacity:0; } }
.cm-letter.on { animation: cm-sway 1.6s ease-in-out infinite alternate; }
@keyframes cm-sway { from { transform: rotate(-2deg); } to { transform: rotate(2deg); } }
.cm-stamp { animation: cm-stamp .5s cubic-bezier(.3,1.8,.5,1); transform-box: fill-box; transform-origin: center; }
@keyframes cm-stamp { from { transform: scale(2.4); opacity:0; } }
.cm-crate { animation: cm-crate .7s ease-out; }
@keyframes cm-crate { from { transform: translateX(-200px); } }
.cm-job { display:flex; flex-direction:column; align-items:flex-start; text-align:left; gap:2px; }
.cm-job small { opacity:.75; }
.cm-rep { height:8px; border-radius:4px; background:#0003; overflow:hidden; margin:4px 0 8px; } .cm-rep i { display:block; height:100%; background:linear-gradient(90deg,#d8a838,#ffe08a); }
@media (prefers-reduced-motion: reduce) { .cm-letter, .cm-letter.on, .cm-stamp, .cm-crate { animation: none; } }
`;
