// Herbalist's Grimoire styles, injected once when the room opens (Chamber palette from chamber.css :root).
export const CSS = `
.table.grimoire > svg{position:absolute;inset:0;width:100%;height:100%}
.gr-spec{animation:gr-grow .9s ease-out both;transform-origin:50% 80%;transform-box:fill-box}
@keyframes gr-grow{from{opacity:0;transform:translateY(10px) scale(.94)}}
.gr-spec.turn{animation:gr-turn .7s cubic-bezier(.3,.7,.3,1) both}
@keyframes gr-turn{from{opacity:0;transform:perspective(600px) rotateY(-70deg) translateX(-40px)}}
.gr-sway{transform-box:fill-box;transform-origin:50% 100%;animation:gr-sway 5s ease-in-out infinite}
@keyframes gr-sway{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}
.gr-fall{animation:gr-fall 1.6s cubic-bezier(.4,0,.6,1) forwards;transform-box:fill-box;transform-origin:center}
@keyframes gr-fall{0%{transform:none;opacity:1}30%{transform:translate(14px,40px) rotate(70deg)}60%{transform:translate(-6px,110px) rotate(-30deg);opacity:.9}100%{transform:translate(18px,220px) rotate(120deg);opacity:0}}
.gr-spark circle{opacity:0;animation:gr-spark 1.4s ease-out var(--d) both;transform-box:fill-box;transform-origin:center}
@keyframes gr-spark{0%{opacity:0;transform:translateY(20px) scale(.3)}30%{opacity:1}100%{opacity:0;transform:translateY(-60px) scale(1.2)}}
.table.grimoire.gr-shake > svg{animation:gr-shake .45s ease-in-out}
@keyframes gr-shake{20%{transform:translateX(-7px) rotate(-.6deg)}40%{transform:translateX(6px) rotate(.5deg)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
.gr-claim{animation:gr-unroll .5s ease-out both;transform-origin:top}
@keyframes gr-unroll{from{opacity:0;transform:scaleY(.3)}}
.gr-stamp{animation:gr-stamp .5s .2s cubic-bezier(.2,1.6,.4,1) both;transform-box:fill-box;transform-origin:center}
@keyframes gr-stamp{from{opacity:0;transform:scale(2.2) rotate(-12deg)}}
.gr-page{display:flex;flex-direction:column;gap:8px}
.gr-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}
.gr-head h3{margin:0;font-family:var(--display);color:var(--gold2);font-size:1.05rem}
.gr-head i{color:var(--muted)}
.gr-badges{display:flex;flex-wrap:wrap;gap:6px}
.gr-badge{border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:.78rem;background:var(--deep)}
.gr-badge.poison{border-color:#d2334a;color:#ffb3bf;background:rgba(179,18,42,.18)}
.gr-badge.care{border-color:#e2b04a;color:#ffe2a6}
.gr-badge.gentle{border-color:#6bbf6b;color:#c8f2c0}
.gr-sec{border:1px solid var(--line);border-radius:12px;padding:8px 12px;background:rgba(243,227,195,.05);animation:btnin .35s ease-out both}
.gr-sec b.h{display:block;color:var(--teal);font-size:.86rem;margin-bottom:2px}
.gr-sec.safety{border-color:rgba(226,176,74,.6)}
.gr-sec.safety.poison{border-color:#d2334a;background:rgba(179,18,42,.12)}
.gr-sec:nth-child(3){animation-delay:.12s}.gr-sec:nth-child(4){animation-delay:.24s}.gr-sec:nth-child(5){animation-delay:.36s}
.gr-claim{font-size:1.02rem;padding:10px 12px;border:1px dashed var(--gold);border-radius:12px;background:rgba(226,176,74,.08)}
.gr-warn{font-size:.78rem;color:var(--muted);border-left:3px solid #d2334a;padding:4px 8px}
.gr-notes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gr-note{border:1px solid var(--line);border-radius:12px;padding:8px 12px;background:rgba(243,227,195,.05);animation:btnin .35s ease-out both}
.gr-note b{display:block;color:var(--gold2);font-family:var(--display);margin-bottom:2px}
.gr-note.safe{border-color:#6bbf6b}.gr-note.deadly{border-color:#d2334a}
.gr-tells{margin:4px 0 0 18px;padding:0}.gr-tells li{margin:3px 0}
@media (max-width:560px){.gr-notes{grid-template-columns:1fr}}
.c.main.gr-daily .note,#gr-twins .note{color:inherit;opacity:.72}
.gr-herb{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin:6px 0}
.gr-tile{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;border:1px solid var(--line);border-radius:12px;background:linear-gradient(#f3e6c4,#d2b98a);color:#3a2716;font-size:.74rem;line-height:1.15;text-align:center;cursor:pointer;animation:btnin .3s ease-out both}
.gr-tile.unfound{background:rgba(243,227,195,.06);color:var(--muted);cursor:default}
.gr-tile .gr-thumb{width:100%;height:78px}
.gr-thumb.ghost{filter:brightness(0) invert(.85) opacity(.4)}
.gr-tile:not(.unfound):hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(226,176,74,.35)}
.gr-tile b{font-weight:700}
.gr-tile .note{color:#6b4e2e;opacity:1}.gr-tile.unfound .note{color:inherit}
.gr-tabs{display:flex;flex-wrap:wrap;gap:6px}
.gr-bar{height:8px;border-radius:6px;background:rgba(243,227,195,.12);overflow:hidden;margin:4px 0}.gr-bar i{display:block;height:100%;background:linear-gradient(90deg,#7fbf6a,var(--gold));transition:width .6s ease-out}
.gr-tabs .c.on{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold) inset}
.gr-share{white-space:pre-wrap;font-family:inherit;font-size:.95rem;line-height:1.5;border:1px dashed var(--gold);border-radius:12px;padding:8px 12px;margin:6px 0;background:rgba(226,176,74,.08);user-select:all}
.gr-guide h3{font-family:var(--display);color:var(--gold2);margin:0 0 6px;font-size:1.02rem}
.gr-guide details{border:1px solid var(--line);border-radius:10px;padding:6px 10px;margin:6px 0;background:var(--deep)}
.gr-guide summary{cursor:pointer;color:var(--teal);font-weight:600}
.gr-guide p{margin:6px 0;font-size:.92rem;line-height:1.45}
@media (prefers-reduced-motion: reduce){.gr-spec,.gr-spec.turn,.gr-sway,.gr-stamp,.gr-sec,.gr-claim,.gr-tile,.gr-spark circle,.table.grimoire.gr-shake > svg{animation:none}.gr-fall{display:none}}
`;
