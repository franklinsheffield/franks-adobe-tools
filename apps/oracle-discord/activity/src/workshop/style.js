// Workshop styles, injected once when the room opens.
export const CSS = `
.table.workshop { display:flex; align-items:center; justify-content:center; background:#120a10; }
.table.workshop svg { width:100%; height:100%; }
.ws-cl { animation: ws-open-l .9s ease-out; } .ws-cr { animation: ws-open-r .9s ease-out; }
@keyframes ws-open-l { from { transform: translateX(90px); } } @keyframes ws-open-r { from { transform: translateX(-90px); } }
.ws-beam { animation: ws-beam 2.4s ease-in-out infinite alternate; } @keyframes ws-beam { to { opacity:.18 } }
.ws-prop { animation: ws-prop 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
@keyframes ws-prop { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
.ws-roses text { animation: ws-rose 1.6s ease-in forwards; animation-delay: var(--d); opacity:0; }
@keyframes ws-rose { 0% { opacity:0; transform: translateY(-20px) } 20% { opacity:1 } 100% { opacity:1; transform: translateY(120px) rotate(40deg) } }
.ws-drop { animation: ws-drop .8s ease-in forwards; transform: translateY(-240px); } @keyframes ws-drop { to { transform: translateY(0) } }
.ws-steps { display:grid; gap:6px; margin:6px 0; }
.ws-steps .c.done { background:#2c5a3a55; border-color:#7fd8a0; }
.ws-steps .c.slip { animation: ws-shake .35s; border-color:#ff7a7a; }
@keyframes ws-shake { 25% { transform: translateX(-5px) } 75% { transform: translateX(5px) } }
.ws-order { display:grid; gap:3px; margin:6px 0; font-size:.9em; counter-reset: ws; }
.ws-order div { background:#ffffff0c; border-radius:8px; padding:4px 8px; }
.ws-book { display:grid; gap:10px; } .ws-book h4 { margin:4px 0; }
.ws-cells { display:flex; flex-wrap:wrap; gap:6px; }
.ws-cell { display:flex; flex-direction:column; align-items:center; width:96px; padding:4px; border-radius:8px; background:#ffffff0a; font-size:.75em; text-align:center; }
.ws-cell b { font-size:1.6em; line-height:1.2; } .ws-cell.off { opacity:.4; } .ws-cell.open { outline:1px dashed #E2B04A88; }
@media (prefers-reduced-motion: reduce) { .ws-cl, .ws-cr, .ws-beam, .ws-prop, .ws-roses text, .ws-drop, .ws-steps .c.slip { animation:none !important; } .ws-roses text { opacity:1 } .ws-drop { transform:none } }
`;
