// Case Files styles, injected once when the room opens.
export const CSS = `
.table.casefiles { display:flex; align-items:center; justify-content:center; background:#140812; }
.table.casefiles svg { width:100%; height:100%; }
.cf-folder { animation: cf-in .5s ease-out; transform-origin:160px 110px; }
@keyframes cf-in { from { transform: translateY(18px) rotate(-4deg); opacity:0; } }
.cf-flame { transform-box: fill-box; transform-origin: center bottom; animation: cf-flick .35s ease-in-out infinite alternate; }
@keyframes cf-flick { to { transform: scaleY(1.18) skewX(5deg); } }
.cf-smoke { animation: cf-smoke 2.6s ease-out infinite; }
@keyframes cf-smoke { from { transform: translateY(0); opacity:.55 } to { transform: translate(6px,-30px); opacity:0 } }
.cf-tool { animation: cf-tool .5s ease-out; }
@keyframes cf-tool { from { transform: translate(24px,-18px); opacity:0; } }
.cf-glide { animation: cf-glide 3.2s ease-in-out infinite alternate; }
@keyframes cf-glide { from { transform: translate(-18px,4px); } to { transform: translate(22px,-6px); } }
.cf-wash { animation: cf-wash 1.2s ease-out forwards; }
@keyframes cf-wash { from { opacity:.75 } to { opacity:.18 } }
.cf-bub { animation: cf-bub 1.3s ease-out infinite; animation-delay: var(--d); }
@keyframes cf-bub { from { transform: translateY(0); opacity:.9 } to { transform: translateY(-22px); opacity:0 } }
.cf-spark { animation: cf-spark 1.1s ease-in-out infinite; animation-delay: var(--d); }
@keyframes cf-spark { 0%,100% { opacity:0; transform:scale(.4) } 50% { opacity:1; transform:scale(1) } }
.cf-stamp { animation: cf-stamp .45s cubic-bezier(.4,1.8,.6,1); transform-origin: 236px 70px; }
@keyframes cf-stamp { from { transform: scale(2.4) rotate(-20deg); opacity:0 } }
.cf-ev { display:grid; gap:4px; margin:6px 0; }
.cf-ev div { background:#ffffff0c; border-radius:8px; padding:5px 8px; font-size:.92em; }
.cf-ev div.dud { opacity:.65; font-style:italic; }
.cf-tools { display:flex; flex-wrap:wrap; gap:6px; }
.cf-book { display:grid; gap:10px; }
.cf-book h4 { margin:4px 0; }
.cf-cells { display:flex; flex-wrap:wrap; gap:6px; }
.cf-cell { display:flex; flex-direction:column; align-items:center; width:84px; padding:4px; border-radius:8px; background:#ffffff0a; font-size:.75em; text-align:center; }
.cf-cell b { font-size:1.6em; line-height:1.2; }
.cf-cell.off { opacity:.4; }
@media (prefers-reduced-motion: reduce) { .cf-folder, .cf-flame, .cf-smoke, .cf-tool, .cf-glide, .cf-wash, .cf-bub, .cf-spark, .cf-stamp { animation:none !important; } }
`;
