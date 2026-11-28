// Styles for the House toys (Scriptorium and Alchemist's House). Animations stop under prefers-reduced-motion.
export const TOY_CSS = `
.toy-table{display:flex;align-items:center;justify-content:center;padding:8px;overflow:hidden}
.ty-sheet{width:100%;max-height:100%}
.ty-sheet.done .ty-ink,.ty-sheet.done .ty-uncial{animation:none;stroke-dashoffset:0;opacity:1;clip-path:none}
.ty-sheet .ty-lbl{font:700 7px var(--display);letter-spacing:2px;fill:#8a6a3c}
.ty-ink{fill:none;stroke:#2b1d12;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;animation:ty-draw .32s ease-out var(--d,0s) forwards}
.ty-stem{stroke-width:1.6;animation-duration:.6s}
@keyframes ty-draw{to{stroke-dashoffset:0}}
.ty-uncial{opacity:0;clip-path:inset(0 100% 0 0);animation:ty-wipe 1.2s ease-out var(--d,0s) forwards}
@keyframes ty-wipe{to{opacity:1;clip-path:inset(0 0 0 0)}}
.ty-seal.on{animation:ty-press .55s cubic-bezier(.3,1.6,.5,1) both;transform-box:fill-box;transform-origin:center}
@keyframes ty-press{0%{transform:translateY(-40px) scale(1.4);opacity:0}60%{transform:translateY(0) scale(.92,1.06);opacity:1}100%{transform:scale(1)}}
.ty-sw{display:inline-block;width:.9em;height:.9em;border-radius:50%;margin-right:.35em;vertical-align:-.1em;border:1px solid #0006}
.ty-read b{font-size:1.25em;letter-spacing:.08em;font-family:"Noto Sans Runic","Segoe UI Historic","Segoe UI Symbol",sans-serif}
.ty-opt{margin:.2rem 0}.ty-opt>b{display:block;font:600 .78rem var(--display);letter-spacing:.08em;color:var(--muted)}
.ty-plate-wrap{height:100%;display:flex;align-items:center;justify-content:center}.ty-plate{height:100%;max-height:300px;filter:drop-shadow(0 6px 14px #0008)}
.ty-plate-wrap.pop .ty-plate{animation:ty-pop .45s ease-out}@keyframes ty-pop{0%{transform:scale(.94) rotate(-1.5deg)}100%{transform:none}}
.ty-motif{transform-box:fill-box}
.pf-plate{display:flex;align-items:center;gap:10px;margin-top:10px}.pf-plate svg{width:84px;height:auto;flex:none}.pf-plate small{color:var(--muted)}
/* the reading nook */
.ty-nook{position:relative;width:100%;height:100%;border-radius:10px;background:radial-gradient(circle at 70% 78%,#5a3a1888,transparent 55%),linear-gradient(#1a120c,#0b0705);overflow:hidden}
.toy-nook.dark .ty-nook{filter:brightness(.38)}
.ty-win{position:absolute;left:8%;top:8%;width:22%;height:44%;border-radius:50% 50% 4px 4px/30% 30% 4px 4px;background:linear-gradient(#0d1636,#24306a);border:4px solid #3a2a18;overflow:hidden}
.ty-win b{position:absolute;right:20%;top:18%;width:16px;height:16px;border-radius:50%;background:#f3ecd0;box-shadow:0 0 14px #f3ecd0}
.ty-win:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 47%,#3a2a18 47% 53%,transparent 53%)}
.ty-book{position:absolute;left:32%;right:26%;bottom:10%;height:46%;display:flex;perspective:600px}
.ty-pg{flex:1;background:linear-gradient(90deg,#e8d6ae,#f6ead0);padding:6px 8px;font:italic 11px/1.35 "IM Fell English",serif;color:#2b1d12;overflow:hidden;box-shadow:inset -8px 0 10px -8px #0006;border-radius:3px 0 0 3px}
.ty-pg.r{background:linear-gradient(270deg,#e8d6ae,#f6ead0);border-radius:0 3px 3px 0;box-shadow:inset 8px 0 10px -8px #0006;font-style:normal;font-size:10px}
.ty-pg p{margin:0 0 4px}.ty-pg small{font-size:9px;color:#7a5a30}
.ty-book.flip .ty-pg.r{animation:ty-flip .6s ease-in-out;transform-origin:left center}@keyframes ty-flip{0%{transform:rotateY(-170deg)}100%{transform:none}}
.ty-candle{position:absolute;right:10%;bottom:10%;width:18px;height:70px}
.ty-cwax{position:absolute;bottom:0;left:0;right:0;height:48px;background:linear-gradient(90deg,#d8cdb0,#f4ecd8,#cbbf9e);border-radius:3px 3px 2px 2px}
.ty-fl{position:absolute;left:3px;bottom:46px;width:12px;height:22px;border-radius:50% 50% 50% 50%/65% 65% 35% 35%;background:radial-gradient(circle at 50% 75%,#fff 0 20%,#ffd27a 40%,#ff8a2a 75%,transparent 80%);animation:ty-flick 1.6s infinite alternate ease-in-out;transform-origin:50% 100%}
.ty-glow{position:absolute;left:-60px;bottom:10px;width:140px;height:140px;border-radius:50%;background:radial-gradient(#ffb85a44,transparent 65%);animation:ty-glw 2.3s infinite alternate}
.toy-nook.dark .ty-fl,.toy-nook.dark .ty-glow{display:none}
@keyframes ty-flick{0%{transform:scale(1,1) rotate(-2deg)}50%{transform:scale(.92,1.08) rotate(2deg)}100%{transform:scale(1.05,.95) rotate(-1deg)}}
@keyframes ty-glw{to{opacity:.6;transform:scale(1.08)}}
.ty-motes i{position:absolute;bottom:-4px;width:2px;height:2px;border-radius:50%;background:#ffe9b8;opacity:.6;animation:ty-mote var(--t,10s) linear var(--d,0s) infinite}
@keyframes ty-mote{0%{transform:translateY(0)}100%{transform:translate(30px,-260px);opacity:0}}
.ty-quote{background:#1c140c;border:1px solid #6a4a22;border-radius:10px;padding:10px 12px}.ty-quote p{margin:.2rem 0}
.ty-orig{font:italic 1.05em "IM Fell English",serif;color:#f1dfb4}.ty-src{font-size:.85em;color:var(--muted)}
/* the Alchemist's toys */
.ty-pair{display:flex;align-items:center;justify-content:center;gap:6%;height:100%;width:100%}.ty-pair svg{height:88%;max-height:240px}
.ty-tile.glow{filter:drop-shadow(0 0 14px var(--c));animation:ty-pulse 2.4s ease-in-out infinite}
@keyframes ty-pulse{50%{filter:drop-shadow(0 0 26px var(--c))}}
.ty-pair.on .ty-tile{animation:ty-in .6s cubic-bezier(.3,1.5,.5,1),ty-pulse 2.4s ease-in-out .6s infinite}@keyframes ty-in{0%{transform:scale(.6) rotate(-8deg);opacity:0}}
.ty-burner .ty-fls{transform-origin:40px 88px;animation:ty-burn .18s infinite alternate}@keyframes ty-burn{to{transform:scale(.94,1.07)}}
.ty-burner.lit .ty-fo{filter:drop-shadow(0 0 10px var(--c))}.ty-burner .ty-fo{opacity:.9}
.ty-burner.lit .ty-fls{animation:ty-ignite .5s ease-out,ty-burn .18s .5s infinite alternate}@keyframes ty-ignite{0%{transform:scale(.2,.1)}}
.ty-tube .ty-gas{opacity:.85;filter:drop-shadow(0 0 8px var(--c));animation:ty-hum .12s infinite alternate}@keyframes ty-hum{to{opacity:.7}}
.ty-tube.lit .ty-gas{animation:ty-strike .6s steps(4),ty-hum .12s .6s infinite alternate}@keyframes ty-strike{0%,50%{opacity:0}25%,75%{opacity:1}}
.ty-atom{animation:ty-atom 1.6s ease-in-out infinite alternate}@keyframes ty-atom{to{transform:translateY(-30px);opacity:.3}}
.ty-lab{display:flex;align-items:flex-end;justify-content:center;gap:4%;height:100%;width:100%;position:relative}
.ty-flask{height:92%;max-height:260px;transition:filter .2s}.ty-flask.hot{filter:drop-shadow(0 0 12px #66E0C8)}
.ty-liq{transition:y .4s,height .4s,fill .6s}
.ty-bub{fill:#fff;opacity:0;animation:ty-bub 2.4s ease-in var(--d,0s) infinite}@keyframes ty-bub{0%{opacity:0;transform:translateY(0)}20%{opacity:.7}100%{opacity:0;transform:translateY(-70px)}}
.ty-lab.plop .ty-flask{animation:ty-plop .4s}@keyframes ty-plop{40%{transform:translateY(3px) scale(1.02,.98)}}
.ty-lab.swirl .ty-liq{animation:ty-swirl .9s ease-in-out}@keyframes ty-swirl{25%{transform:skewX(8deg)}75%{transform:skewX(-8deg)}}
.ty-lab.swirl .ty-bub{animation-duration:.9s}
.ty-lab.drain .ty-liq{animation:ty-drain .6s ease-in}@keyframes ty-drain{to{transform:translateY(90px)}}
.ty-lab .ty-burner{height:70%;max-height:200px}
.ty-cobalt{position:absolute;right:6%;top:8%;width:30%;height:70%;border-radius:8px;background:#1d2bbf55;border:2px solid #6a7cff;box-shadow:0 0 18px #3a4cff88;animation:ty-in .35s ease-out}
.ty-shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px;margin:.3rem 0}
.ty-jar{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 4px;border-radius:10px 10px 6px 6px;border:1px solid #8c86a6;background:#151024;color:var(--fg);cursor:grab;touch-action:none;font:inherit}
.ty-jar i{width:26px;height:14px;border-radius:4px 4px 8px 8px;background:#f2f2f2;box-shadow:0 0 0 2px #2a2440,0 0 10px var(--c)}
.ty-jar b{font:700 1.05rem Georgia,serif}.ty-jar small{font-size:.66rem;color:var(--muted);text-align:center;line-height:1.1}
.ty-jar:hover,.ty-jar:focus-visible{border-color:var(--c);box-shadow:0 0 10px var(--c)}
.ty-ghost{position:fixed;z-index:99;pointer-events:none;transform:translate(-50%,-50%) rotate(-8deg) scale(1.08);opacity:.9;width:74px}
.ty-wall{display:grid;grid-template-columns:repeat(18,34px);justify-content:safe center;grid-template-rows:repeat(11,auto);gap:2px;overflow-x:auto;padding:2px 0 6px}
.ty-cell{position:relative;width:34px;height:34px;padding:0;border:1px solid var(--c);border-radius:4px;background:#120c1c;color:#fff;font:700 .8rem Georgia,serif;cursor:pointer;line-height:1}
.ty-cell small{position:absolute;left:2px;top:1px;font:400 .45rem var(--body);opacity:.7}
.ty-cell.seen{background:color-mix(in srgb,var(--c) 30%,#120c1c)}.ty-cell:hover,.ty-cell:focus-visible{box-shadow:0 0 8px var(--c);z-index:1}
.ty-cell.ping{animation:ty-ping .7s ease-out}@keyframes ty-ping{0%{transform:scale(1.5);box-shadow:0 0 16px var(--c)}}
.ty-legend{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:.7rem;color:var(--muted)}.ty-legend i{display:inline-block;width:.7em;height:.7em;border-radius:2px;margin-right:4px}
.ty-talk{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;height:100%}.ty-talk .ty-pair{height:58%}
.ty-bubble{position:relative;margin:0;max-width:94%;padding:6px 10px;border-radius:12px;background:#f6f1ff;color:#1a1326;font-size:.82rem;line-height:1.3;min-height:2.6em;box-shadow:0 0 0 2px var(--c),0 4px 14px #0007;animation:ty-in .35s ease-out}
.ty-bubble:before{content:"";position:absolute;top:-7px;left:30%;border:7px solid transparent;border-top:0;border-bottom-color:#f6f1ff}
.ty-danger{display:flex;align-items:center;gap:3px;font-size:.72rem;color:var(--fg)}.ty-danger i{width:14px;height:8px;border-radius:2px;background:#2a2440}.ty-danger i.on{background:var(--dc);box-shadow:0 0 6px var(--dc)}.ty-danger b{color:var(--dc);margin-left:4px}
.ty-gh{background:none;border:0;color:var(--muted);font:600 .62rem var(--body);cursor:pointer;align-self:end;padding:0 0 1px}.ty-gh:hover,.ty-gh:focus-visible{color:var(--fg)}
.ty-wall.tour .ty-cell{opacity:.22;transition:opacity .3s}.ty-wall.tour .ty-cell.hi{opacity:1;box-shadow:0 0 9px var(--c)}
.ty-card{background:#140f22;border:1px solid var(--line);border-radius:10px;padding:8px 12px}.ty-card p{margin:.25rem 0}
@media (prefers-reduced-motion:reduce){.ty-ink,.ty-uncial{animation:none;stroke-dashoffset:0;opacity:1;clip-path:none}
  .ty-seal.on,.ty-fl,.ty-glow,.ty-motes i,.ty-tile,.ty-fls,.ty-gas,.ty-atom,.ty-bub,.ty-lab *,.ty-cell,.ty-book .ty-pg,.ty-plate{animation:none!important}}
`;
