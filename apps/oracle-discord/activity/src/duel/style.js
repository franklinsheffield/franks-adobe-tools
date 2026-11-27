// Element Duel styles, injected once when the room opens (Chamber palette from chamber.css :root).
export const CSS = `
.table.duel svg{position:absolute;inset:0;width:100%;height:100%}
.du-oback{animation:du-deal .45s cubic-bezier(.2,.8,.3,1) calc(var(--i) * .05s) both}
@keyframes du-deal{from{opacity:0;transform:translateY(-30px) rotate(-8deg)}}
.du-cond{animation:du-flipin .6s cubic-bezier(.3,.7,.3,1) both;transform-box:fill-box;transform-origin:center}
@keyframes du-flipin{from{opacity:0;transform:perspective(400px) rotateY(90deg)}}
.du-bonus{animation:du-flipin .6s .15s cubic-bezier(.3,.7,.3,1) both;transform-box:fill-box;transform-origin:center}
.du-idle{animation:du-bob 3s ease-in-out infinite}
@keyframes du-bob{50%{transform:translateY(-3px)}}
.du-fill{transition:width .6s ease}
.du-shield{animation:du-pulse 1.6s ease-in-out infinite}
@keyframes du-pulse{50%{opacity:.55}}
.du-glow{animation:du-pulse 2.4s ease-in-out infinite}
.du-fan{animation:du-deal .5s cubic-bezier(.2,.8,.3,1) calc(var(--i) * .08s) both}
.du-atom{transform-box:fill-box;transform-origin:center}
.du-rx .du-atom{animation:du-fly .55s cubic-bezier(.2,.8,.3,1.2) calc(var(--i) * .06s) both}
.du-rx.from-you .du-atom{--fy:120px}.du-rx.from-oracle .du-atom{--fy:-120px}
@keyframes du-fly{from{opacity:0;transform:translateY(var(--fy)) scale(.4)}}
.du-mol{animation:du-spin 2.6s .7s ease-in-out both;transform-box:fill-box;transform-origin:center}
@keyframes du-spin{0%{transform:none}50%{transform:rotate(8deg) scale(1.05)}100%{transform:none}}
.du-flash{opacity:0;animation:du-flash .8s .55s ease-out both;transform-box:fill-box;transform-origin:center}
@keyframes du-flash{0%{opacity:0;transform:scale(.2)}25%{opacity:1}100%{opacity:0;transform:scale(1.6)}}
.du-name{animation:du-up .4s .7s ease-out both}
@keyframes du-up{from{opacity:0;transform:translateY(8px)}}
.du-dmg{opacity:0;animation:du-dmg 1.4s .85s ease-out both}
@keyframes du-dmg{0%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(1.25)}70%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
.du-hit-oracle .du-o,.du-hit-you .du-y{animation:du-shake .5s .9s ease-in-out both}
@keyframes du-shake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.du-wob{animation:du-wob .25s ease-in-out calc(var(--i) * .05s) 4 alternate;transform-box:fill-box;transform-origin:center}
@keyframes du-wob{to{transform:translateY(-4px) rotate(10deg)}}
.du-smoke{opacity:0;animation:du-smoke 1.4s .4s ease-out both}
@keyframes du-smoke{0%{opacity:0;transform:none}30%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),-60px) scale(2)}}
.du-end text{animation:du-up .6s ease-out both}
.du-conf{animation:du-conf 1.4s var(--d) ease-out both;transform-box:view-box;transform-origin:200px 130px}
@keyframes du-conf{from{transform:rotate(var(--a)) translateX(0)}to{transform:rotate(var(--a)) translateX(150px);opacity:0}}
.du-stats{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.85rem;color:var(--muted)}
.du-stats b{color:var(--gold2)}
.du-bench{min-height:58px;border:1px dashed var(--gold);border-radius:12px;padding:6px;margin:6px 0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:rgba(226,176,74,.06)}
.du-bench .empty{color:var(--muted);font-size:.86rem;padding:0 6px}
.du-bench .formula{margin-left:auto;font-size:1.15rem;font-weight:700;color:var(--gold2);padding:0 8px}
.du-bench .formula.ok{color:#9ff0c8}
.du-hand{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.du-card{position:relative;width:62px;height:80px;border-radius:9px;border:1.5px solid var(--fam,#888);background:linear-gradient(160deg,#fbf6ea,#e9dfc6);color:#1b1430;cursor:pointer;padding:3px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--body);animation:du-cardin .35s cubic-bezier(.2,.8,.3,1.2) both;transition:transform .15s,box-shadow .15s}
.du-card:hover{transform:translateY(-3px)}
.du-card:focus-visible{outline:2px solid var(--teal);outline-offset:2px}
.du-card .z{position:absolute;top:2px;left:5px;font-size:.62rem;opacity:.7}
.du-card .ox{position:absolute;top:2px;right:4px;font-size:.58rem;opacity:.75}
.du-card .sym{font-size:1.45rem;font-weight:800;line-height:1;color:var(--fam,#333);text-shadow:0 1px 0 rgba(0,0,0,.35)}
.du-card .nm{font-size:.6rem;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.du-card .fam{position:absolute;bottom:0;left:0;right:0;height:5px;border-radius:0 0 8px 8px;background:var(--fam,#888)}
.du-card.glow{box-shadow:0 0 0 2px var(--teal),0 0 14px rgba(102,224,200,.8);animation:du-cardin .35s cubic-bezier(.2,.8,.3,1.2) both,du-glowc 1.6s ease-in-out infinite}
@keyframes du-glowc{50%{box-shadow:0 0 0 2px var(--teal),0 0 4px rgba(102,224,200,.4)}}
.du-card.hint{box-shadow:0 0 0 3px var(--gold2),0 0 16px rgba(250,222,140,.9)}
.du-card.small{width:50px;height:64px}.du-card.small .sym{font-size:1.15rem}
@keyframes du-cardin{from{opacity:0;transform:translateY(16px) scale(.85)}}
.du-cond-line{font-size:.85rem;border-left:3px solid var(--gold);padding:2px 8px;margin:4px 0;color:var(--fg)}
.du-cond-line i{color:var(--muted)}
.du-page{display:flex;flex-direction:column;gap:6px;animation:btnin .35s ease-out both}
.du-page h3{margin:0;font-family:var(--display);color:var(--gold2);font-size:1.02rem}
.du-tags{display:flex;flex-wrap:wrap;gap:6px}
.du-tag{border:1px solid var(--line);border-radius:999px;padding:1px 9px;font-size:.76rem;background:var(--deep)}
.du-tag.hot{border-color:#ff9a3c;color:#ffd0a6}.du-tag.cold{border-color:#5fb4ff;color:#cfe6ff}.du-tag.new{border-color:var(--teal);color:#c8fff2}
.du-sec{border:1px solid var(--line);border-radius:12px;padding:7px 11px;background:rgba(243,227,195,.05);font-size:.92rem}
.du-sec b.h{display:block;color:var(--teal);font-size:.84rem;margin-bottom:2px}
.du-guide details{border:1px solid var(--line);border-radius:10px;padding:6px 10px;margin:6px 0;background:var(--deep)}
.du-guide summary{cursor:pointer;color:var(--teal);font-weight:600}
.du-guide p,.du-guide li{margin:5px 0;font-size:.9rem;line-height:1.45}
.du-log{font-size:.84rem;color:var(--muted);margin:4px 0}
.du-chips{display:flex;flex-wrap:wrap;gap:5px}
.du-chips span{border:1px solid var(--line);border-radius:8px;padding:1px 7px;font-size:.8rem;background:var(--deep)}
@media (prefers-reduced-motion: reduce){.du-oback,.du-cond,.du-bonus,.du-idle,.du-shield,.du-glow,.du-fan,.du-rx .du-atom,.du-mol,.du-name,.du-wob,.du-smoke,.du-end text,.du-conf,.du-card,.du-card.glow,.du-hit-oracle .du-o,.du-hit-you .du-y{animation:none}.du-flash{display:none}.du-dmg{opacity:1;animation:none}}
`;
