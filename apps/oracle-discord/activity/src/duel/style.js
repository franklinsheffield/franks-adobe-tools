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
.du-rx .du-atom{animation:du-fly .5s cubic-bezier(.2,.8,.3,1.2) calc(.45s + var(--i) * .05s) both}
.du-rx.from-you .du-atom{--fy:120px}.du-rx.from-oracle .du-atom{--fy:-120px}
@keyframes du-fly{from{opacity:0;transform:translateY(var(--fy)) scale(.4)}}
.du-mol{animation:du-spin 2.6s 1s ease-in-out both;transform-box:fill-box;transform-origin:center}
@keyframes du-spin{0%{transform:none}50%{transform:rotate(8deg) scale(1.05)}100%{transform:none}}
.du-flash{opacity:0;animation:du-flash .8s .8s ease-out both;transform-box:fill-box;transform-origin:center}
@keyframes du-flash{0%{opacity:0;transform:scale(.2)}25%{opacity:1}100%{opacity:0;transform:scale(1.6)}}
.du-name{animation:du-up .4s 1s ease-out both}
@keyframes du-up{from{opacity:0;transform:translateY(8px)}}
.du-dmg{opacity:0;animation:du-dmg 1.4s 1.55s ease-out both}
@keyframes du-dmg{0%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(1.25)}70%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
.du-hit-oracle .du-o,.du-hit-you .du-y{animation:du-shake .55s 1.45s ease-in-out both}
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

/* damage phase: cards fly in, the reaction plays its own effect, an orb flies to the target and bursts */
.du-k-card{opacity:0;animation:du-kcard .55s cubic-bezier(.3,.7,.3,1) calc(var(--i) * .05s) both;transform-box:fill-box;transform-origin:center}
@keyframes du-kcard{0%{opacity:0;transform:translate(var(--sx),var(--sy)) rotate(-12deg) scale(.8)}35%{opacity:1}80%{opacity:1;transform:none}100%{opacity:0;transform:scale(.3)}}
.du-kfx>*{transform-box:view-box;transform-origin:200px 138px}
.du-rx .du-kfx,.du-rx .du-flash{transform-box:view-box;transform-origin:200px 138px}
.du-rx.p-small .du-kfx,.du-rx.p-small .du-flash{transform:scale(.7)}.du-rx.p-small .du-kfx{opacity:.8}
.du-rx.p-big .du-kfx,.du-rx.p-big .du-flash{transform:scale(1.3)}
.du-rx.p-huge .du-kfx,.du-rx.p-huge .du-flash{transform:scale(1.65)}
.du-rx.p-huge .du-impact{r:5}
.du-tier{opacity:0;animation:du-tier 1.6s .85s ease-out both;transform-box:view-box;transform-origin:200px 100px}
@keyframes du-tier{0%{opacity:0;transform:scale(.5)}15%{opacity:1;transform:scale(1.15)}30%{transform:scale(1)}80%{opacity:1}100%{opacity:0}}
.table.duel.du-quake>svg{animation:du-quake .7s .8s ease-in-out both}
.table.duel.du-quake.big>svg{animation-duration:.45s}
@keyframes du-quake{10%{transform:translate(-5px,3px)}25%{transform:translate(6px,-4px)}40%{transform:translate(-4px,-2px)}55%{transform:translate(4px,3px)}70%{transform:translate(-2px,1px)}85%{transform:translate(1px,-1px)}}
.du-k-ring{opacity:0;animation:du-kring 1s .8s ease-out both}
@keyframes du-kring{0%{opacity:0;transform:scale(.2)}30%{opacity:1}100%{opacity:0;transform:scale(1.9)}}
.du-k-flame{opacity:0;animation:du-kflame 1.1s calc(.8s + var(--i) * .03s) ease-out both}
@keyframes du-kflame{0%{opacity:0;transform:rotate(var(--a)) scale(.2)}30%{opacity:.95;transform:rotate(var(--a)) scale(1.3)}100%{opacity:0;transform:rotate(var(--a)) translateY(-30px) scale(1.6)}}
.du-k-ice{opacity:0;animation:du-kice 1.3s calc(.8s + var(--i) * .05s) ease-out both}
@keyframes du-kice{0%{opacity:0;transform:rotate(var(--a)) scale(.1)}40%{opacity:1;transform:rotate(var(--a)) scale(1)}80%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) scale(1.1)}}
.du-k-bolt{opacity:0;animation:du-kbolt .9s calc(.8s + var(--i) * .06s) steps(2) both}
@keyframes du-kbolt{0%{opacity:0;transform:rotate(var(--a)) scale(.5)}20%,60%{opacity:1;transform:rotate(var(--a)) scale(1.6)}40%,80%{opacity:.2;transform:rotate(var(--a)) scale(1.7)}100%{opacity:0;transform:rotate(var(--a)) scale(1.8)}}
.du-k-drop{opacity:0;animation:du-kdrop 1.1s calc(.85s + var(--i) * .05s) cubic-bezier(.5,0,1,1) both}
@keyframes du-kdrop{0%{opacity:0;transform:none}20%{opacity:1}100%{opacity:.2;transform:translate(var(--dx),60px)}}
.du-k-pool{opacity:0;animation:du-kpool 1.4s 1.2s ease-out both;transform-box:fill-box;transform-origin:center}
@keyframes du-kpool{0%{opacity:0;transform:scaleX(.2)}40%{opacity:.6}100%{opacity:0;transform:scaleX(1.3)}}
.du-k-bub{opacity:0;animation:du-kbub 1.5s calc(.8s + var(--i) * .06s) ease-out both}
@keyframes du-kbub{0%{opacity:0;transform:none}20%{opacity:1}90%{opacity:1;transform:translate(var(--dx),-90px) scale(1.4)}100%{opacity:0;transform:translate(var(--dx),-95px) scale(2)}}
.du-k-gear{opacity:0;animation:du-kgear 1.5s .8s ease-out both}
@keyframes du-kgear{0%{opacity:0;transform:rotate(0) scale(.5)}30%{opacity:1}100%{opacity:0;transform:rotate(240deg) scale(1.2)}}
.du-k-orbit{opacity:0;animation:du-korbit 1.5s .8s linear both}
@keyframes du-korbit{0%{opacity:0;transform:rotate(var(--a))}20%{opacity:1}100%{opacity:0;transform:rotate(calc(var(--a) + 360deg))}}
.du-k-cloud{opacity:0;animation:du-kcloud 1.6s calc(.8s + var(--i) * .05s) ease-out both}
@keyframes du-kcloud{0%{opacity:0;transform:scale(.3)}30%{opacity:.45}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(2)}}
.du-k-shard{opacity:0;animation:du-kshard 1s calc(.8s + var(--i) * .03s) cubic-bezier(.2,.8,.3,1) both}
@keyframes du-kshard{0%{opacity:0;transform:rotate(var(--a)) scale(.2)}30%{opacity:1;transform:rotate(var(--a)) translateY(-6px) scale(1.2)}100%{opacity:0;transform:rotate(var(--a)) translateY(-40px) scale(.8)}}
.du-beam{opacity:0;animation:du-beam .45s 1.25s ease-out both}
@keyframes du-beam{0%{opacity:0}40%{opacity:.8}100%{opacity:0}}
.du-orb{opacity:0;animation:du-orb .4s 1.15s cubic-bezier(.5,0,1,1) forwards;transform-box:view-box}
@keyframes du-orb{0%{opacity:1;transform:none}88%{opacity:1;transform:translateY(var(--ty))}100%{opacity:0;transform:translateY(var(--ty)) scale(1.5)}}
.du-impact{opacity:0;animation:du-impact .7s 1.5s ease-out both;transform-box:fill-box;transform-origin:center}
@keyframes du-impact{0%{opacity:1;transform:rotate(var(--a)) translateX(0)}100%{opacity:0;transform:rotate(var(--a)) translateX(46px) scale(.4)}}
.du-block{opacity:0;animation:du-kring .8s 1.45s ease-out both;transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion: reduce){.table.duel.du-quake>svg{animation:none}.du-tier{opacity:1;animation:none}.du-k-card,.du-kfx,.du-beam,.du-orb,.du-impact,.du-block{display:none}.du-oback,.du-cond,.du-bonus,.du-idle,.du-shield,.du-glow,.du-fan,.du-rx .du-atom,.du-mol,.du-name,.du-wob,.du-smoke,.du-end text,.du-conf,.du-card,.du-card.glow,.du-hit-oracle .du-o,.du-hit-you .du-y{animation:none}.du-flash{display:none}.du-dmg{opacity:1;animation:none}}
`;
