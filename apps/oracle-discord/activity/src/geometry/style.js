// Sacred Geometry Builder styles, injected once when the room (or its store preview) first draws.
export const CSS = `
.table.geometry{background:var(--geo-bg)}
.table.geometry>svg.geo-svg{position:absolute;inset:0 0 22px;width:100%;height:calc(100% - 22px);touch-action:none;user-select:none;-webkit-user-select:none}
.geo-svg.tool-compass,.geo-svg.tool-ruler{cursor:crosshair}
.geo-svg circle.o,.geo-svg line.o{fill:none;vector-effect:non-scaling-stroke}
.geo-svg .giv{stroke:var(--geo-given);stroke-width:1.4;opacity:.85}
.geo-svg .drw{stroke:var(--geo-ink);stroke-width:2;animation:geo-draw .45s ease-out both}
.geo-svg .drw.jewel{fill-opacity:.0}
.geo-svg.done .hit{stroke:var(--geo-done);stroke-width:3;filter:drop-shadow(0 0 4px var(--geo-done))}
.geo-svg.done.jewels .hit.jewel{fill-opacity:.18}
.geo-svg.glow .drw{filter:drop-shadow(0 0 3px var(--geo-ink))}
.geo-svg.chalk .drw,.geo-svg.chalk .giv{stroke-dasharray:14 1.5 6 1;stroke-linecap:round}
.geo-svg .goal{stroke:var(--geo-given);stroke-width:1.2;stroke-dasharray:3 5;opacity:.35}
.geo-svg .ghost{stroke:#FF4FB3;stroke-width:2;stroke-dasharray:6 5;animation:geo-dash 1s linear infinite;opacity:.95}
.geo-svg .ghost-pt{fill:none;stroke:#FF4FB3;stroke-width:2;vector-effect:non-scaling-stroke;animation:geo-pulse 1s ease-in-out infinite}
.geo-svg .rubber{stroke:var(--geo-ink);stroke-width:1.4;stroke-dasharray:4 4;opacity:.7}
.geo-svg .pt{fill:var(--geo-pt)}
.geo-svg .pt.giv-pt{stroke:#000;stroke-width:.8;vector-effect:non-scaling-stroke}
.geo-svg .sel{fill:none;stroke:var(--geo-ink);stroke-width:2.5;vector-effect:non-scaling-stroke;animation:geo-pulse .9s ease-in-out infinite}
.geo-svg text.lbl{fill:var(--geo-pt);font:700 11px var(--display);paint-order:stroke;stroke:#000a;stroke-width:3px}
.geo-svg .edge,.geo-svg .geo-edge{stroke:var(--geo-ink);stroke-width:2;vector-effect:non-scaling-stroke;stroke-linecap:round}
.geo-svg .geo-corner{fill:var(--geo-pt)}
.geo-svg .bigstar{fill:#fff}
@keyframes geo-draw{from{opacity:0}}
@keyframes geo-dash{to{stroke-dashoffset:-22}}
@keyframes geo-pulse{50%{opacity:.35}}
.geo-tools .c.on{border-color:var(--teal);background:#14324a;box-shadow:0 0 12px rgba(102,224,200,.35)}
.geo-goal{font-size:.8rem;color:var(--muted);margin:2px 0 4px}.geo-goal b{color:var(--gold2)}
.geo-how{margin:0;padding-left:1.2em;font-size:.88rem}.geo-how li{margin:2px 0}
.geo-card{background:var(--navy);border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:8px;padding:10px 12px;margin:0 0 10px}
.geo-card h3{font-family:var(--display);color:var(--gold2);font-size:1rem;margin:0 0 4px}
.geo-card p{margin:4px 0;font-size:.88rem}.geo-card small{color:var(--muted)}
.geo-stars{color:var(--gold);letter-spacing:2px}.geo-stars i{color:var(--line);font-style:normal}
.geo-lv{display:flex;justify-content:space-between;gap:10px;min-width:min(100%,300px)}
.geo-levels{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin:6px 0}
.geo-guide h3{font-family:var(--display);color:var(--gold2);font-size:1rem;margin:0 0 6px}
.geo-guide details{border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin:0 0 6px;background:rgba(22,16,48,.6)}
.geo-guide summary{cursor:pointer;color:var(--gold2);font-family:var(--display);font-size:.85rem;letter-spacing:.04em}
.geo-guide p{font-size:.86rem;margin:6px 0}
.geo-solid-info{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin:6px 0}
.geo-solid-info span{border:1px solid var(--line);border-radius:8px;padding:4px 8px;font-size:.78rem}.geo-solid-info b{color:var(--gold2)}
.geo-svg .drw.fresh{stroke-dasharray:1;stroke-dashoffset:1;animation:geo-trace .6s ease-in-out forwards}
.geo-svg.chalk .drw.fresh{stroke-dasharray:1}
.geo-svg.bloom .drw{stroke-dasharray:1;stroke-dashoffset:1;animation:geo-trace 1s ease-in-out forwards;animation-delay:calc(var(--i,0) * .11s)}
.geo-svg .geo-rot{animation:geo-rot 120s linear infinite}
@keyframes geo-trace{to{stroke-dashoffset:0}}
@keyframes geo-rot{to{transform:rotate(360deg)}}
.geo-svg .geo-arm line{stroke:var(--geo-pt);stroke-width:2;vector-effect:non-scaling-stroke;opacity:.8}
.geo-svg .geo-pin{fill:var(--geo-given)}.geo-svg .geo-lead{fill:var(--geo-pt);filter:drop-shadow(0 0 4px var(--geo-pt))}
.geo-svg .geo-rulerbar line{stroke:var(--geo-given);stroke-width:12;stroke-linecap:round;opacity:.28;vector-effect:non-scaling-stroke}
.geo-svg .pt.pop{transform-box:fill-box;transform-origin:center;animation:geo-pop .5s .45s both}
@keyframes geo-pop{0%{transform:scale(0)}60%{transform:scale(2.2)}100%{transform:scale(1)}}
.geo-svg.cele .hit{animation:geo-glow 1.2s ease-in-out 2}
@keyframes geo-glow{50%{stroke-width:6;filter:drop-shadow(0 0 10px var(--geo-done))}}
.geo-svg .geo-burst path{fill:var(--geo-done);animation:geo-fly 1.3s cubic-bezier(.2,.7,.3,1) both}
@keyframes geo-fly{0%{opacity:0;translate:0 0;scale:.3}20%{opacity:1}100%{opacity:0;translate:var(--dx) var(--dy);scale:1.2}}
#geo-solid.enter{animation:geo-enter .6s cubic-bezier(.2,.8,.3,1.3)}
@keyframes geo-enter{from{transform:scale(.2) rotate(-90deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.geo-svg *{animation:none!important}}
`;
