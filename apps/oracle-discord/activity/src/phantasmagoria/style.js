// Phantasmagoria styles, injected once when the room opens.
export const CSS = `
.table.phantasmagoria { display:flex; align-items:center; justify-content:center; background:#07050a; }
.table.phantasmagoria svg { width:100%; height:100%; }
.ph-puff { animation: ph-puff 5s ease-in-out infinite; animation-delay: var(--d); transform-box: fill-box; transform-origin: center; } @keyframes ph-puff { 0% { transform: translateY(0) scale(.8); opacity:0 } 30% { opacity:.25 } 100% { transform: translateY(-170px) scale(2.6); opacity:0 } }
.ph-lamp, .ph-ember { animation: ph-flick .9s ease-in-out infinite alternate; } @keyframes ph-flick { to { opacity:.55 } }
.ph-beam { animation: ph-beam 3s ease-in-out infinite; } @keyframes ph-beam { 50% { opacity:.2 } }
.ph-ghost { animation: ph-hover 3s ease-in-out infinite; } @keyframes ph-hover { 50% { translate: 0 -4px } }
.ph-fadein { animation: ph-fadein 1.4s ease-out both, ph-hover 3s ease-in-out 1.4s infinite; } @keyframes ph-fadein { from { opacity:0 } }
.ph-fadeout { animation: ph-fadeout 1.6s ease-in both; } @keyframes ph-fadeout { to { opacity:0 } }
.ph-grow { animation: ph-grow 1.2s ease-out both; transform-box: fill-box; transform-origin: bottom center; } @keyframes ph-grow { from { scale: .2; opacity:0 } }
.ph-flash { animation: ph-flash .8s ease-out forwards; } @keyframes ph-flash { from { opacity:.85 } to { opacity:0 } }
.ph-clap { animation: ph-clap .9s ease-out both; animation-delay: var(--d); } @keyframes ph-clap { from { transform: translateY(20px); opacity:0 } }
.ph-stamp { animation: ph-stamp .45s cubic-bezier(.4,1.8,.6,1); transform-origin:160px 113px; } @keyframes ph-stamp { from { transform: scale(2.4); opacity:0 } }
.ph-ctl { display:flex; align-items:center; gap:10px; margin:8px 0; } .ph-ctl input { flex:1; accent-color:#E2B04A; } .ph-ctl b { min-width:64px; text-align:right; }
.ph-track { position:relative; height:54px; border-radius:10px; background:#ffffff0c; margin:8px 0; overflow:hidden; }
.ph-track .cue { position:absolute; top:6px; transform:translateX(-50%); font-size:22px; transition: opacity .3s, transform .3s; } .ph-track .cue.hit { opacity:.25; transform:translateX(-50%) scale(1.5) } .ph-track .cue.miss { opacity:.25; filter: grayscale(1) }
.ph-track .needle { position:absolute; top:0; bottom:0; width:3px; background:#FFE3A3; box-shadow:0 0 8px #FFE3A3; left:0; }
.ph-cue { font-size:1.2em; padding:14px; }
.ph-log { display:grid; gap:4px; font-size:.9em; } .ph-log div { background:#ffffff0a; border-radius:8px; padding:4px 8px; }
@media (prefers-reduced-motion: reduce) { .ph-puff, .ph-lamp, .ph-ember, .ph-beam, .ph-ghost, .ph-fadein, .ph-fadeout, .ph-grow, .ph-flash, .ph-clap, .ph-stamp { animation:none !important; } .ph-flash { opacity:0 } }
`;
