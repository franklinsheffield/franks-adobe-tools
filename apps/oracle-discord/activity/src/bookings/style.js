// Bookings styles, injected once when the room opens.
export const CSS = `
.table.bookings { display:flex; align-items:center; justify-content:center; background:#1a1012; }
.table.bookings svg { width:100%; height:100%; }
.bk-bill { animation: bk-paste .55s ease-out; transform-origin: 160px 30px; }
@keyframes bk-paste { from { transform: rotate(-3deg) scaleY(.2); opacity:0 } }
.bk-glow { animation: bk-glow 2.2s ease-in-out infinite alternate; } @keyframes bk-glow { to { opacity:.32 } }
.bk-bulb { animation: bk-bulb 1s steps(2) infinite; animation-delay: var(--d); } @keyframes bk-bulb { 50% { opacity:.35 } }
.bk-neon { animation: bk-neon 3s infinite; } @keyframes bk-neon { 0%,92%,100% { opacity:1 } 94% { opacity:.3 } 96% { opacity:1 } 97% { opacity:.4 } }
.bk-stamp { animation: bk-stamp .45s cubic-bezier(.4,1.8,.6,1); transform-origin: 160px 127px; }
@keyframes bk-stamp { from { transform: scale(2.4) rotate(-20deg); opacity:0 } }
.bk-slots { display:grid; gap:6px; margin:6px 0; }
.bk-parts { display:flex; gap:6px; flex-wrap:wrap; margin:4px 0; font-size:.85em; }
.bk-parts span { background:#ffffff0c; border-radius:999px; padding:2px 9px; } .bk-parts span.now { outline:1px solid #E2B04A; } .bk-parts span.ok { background:#2c5a3a66; }
.bk-hist { display:grid; gap:4px; font-size:.9em; } .bk-hist div { background:#ffffff0a; border-radius:8px; padding:4px 8px; }
@media (prefers-reduced-motion: reduce) { .bk-bill, .bk-glow, .bk-bulb, .bk-neon, .bk-stamp { animation:none !important; } }
`;
