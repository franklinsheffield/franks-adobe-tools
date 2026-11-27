// The Mentalist's styles, injected once when the room opens.
export const CSS = `
.table.mentalist { display:flex; align-items:center; justify-content:center; background:#07050a; }
.table.mentalist svg { width:100%; height:100%; }
.mt-beam { animation: mt-beam 4s ease-in-out infinite; transform-origin: 160px 0; } @keyframes mt-beam { 50% { opacity:.7; transform: rotate(1.5deg) } }
.mt-glow { animation: mt-glow 2s ease-in-out infinite alternate; } @keyframes mt-glow { to { opacity:.85 } }
.mt-deal { animation: mt-deal .5s ease-out both; animation-delay: var(--d); } @keyframes mt-deal { from { transform: translateY(60px); opacity:0 } }
.mt-flip { animation: mt-flip .45s ease-out; transform-box: fill-box; transform-origin: center; } @keyframes mt-flip { from { transform: scaleX(0) } }
.mt-cue { animation: mt-pop .35s cubic-bezier(.4,1.8,.6,1); transform-box: fill-box; transform-origin: bottom center; } @keyframes mt-pop { from { transform: scale(.3); opacity:0 } }
.mt-held { animation: mt-held 2.4s ease-in-out infinite; } @keyframes mt-held { 50% { transform: translateY(-3px) } }
.mt-open { animation: mt-pop .4s ease-out; transform-box: fill-box; transform-origin: center; }
.mt-q { animation: mt-q 1.4s ease-in-out infinite; } @keyframes mt-q { 50% { transform: translateY(-5px); opacity:.5 } }
.mt-clap { animation: mt-clap .9s ease-out both; animation-delay: var(--d); } @keyframes mt-clap { from { transform: translateY(20px); opacity:0 } 60% { opacity:1 } }
.mt-stamp { animation: mt-stamp .45s cubic-bezier(.4,1.8,.6,1); transform-origin:160px 113px; } @keyframes mt-stamp { from { transform: scale(2.4); opacity:0 } }
.mt-hmm { animation: mt-hmm 1.6s ease-in-out infinite; } @keyframes mt-hmm { 50% { opacity:.3 } }
.mt-code { display:grid; grid-template-columns: repeat(5, 1fr); gap:4px; font-size:.82em; margin:6px 0; } .mt-code span { background:#ffffff10; border-radius:8px; padding:3px 4px; text-align:center; }
.mt-log { display:grid; gap:4px; font-size:.9em; } .mt-log div { background:#ffffff0a; border-radius:8px; padding:4px 8px; }
.mt-slip { font-family: Georgia, serif; font-style: italic; background:#f4ecd8; color:#3a0a0a; border-radius:6px; padding:8px 10px; margin:6px 0; }
@media (prefers-reduced-motion: reduce) { .mt-beam, .mt-glow, .mt-deal, .mt-flip, .mt-cue, .mt-held, .mt-open, .mt-q, .mt-clap, .mt-stamp, .mt-hmm { animation:none !important; } }
`;
