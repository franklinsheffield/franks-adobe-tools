// Alchemist's Lab styles, injected once when the room (or its store preview) opens. Chamber palette from chamber.css.
export const CSS = `
.table.alchemy svg{position:absolute;inset:0;width:100%;height:100%}
.table.alchemy .al-fl{transform-box:fill-box;transform-origin:50% 100%;animation:al-fl 1.1s ease-in-out infinite alternate}
.table.alchemy .al-fl.f1{animation-delay:-.3s}.table.alchemy .al-fl.f2{animation-delay:-.6s}.table.alchemy .al-fl.f3{animation-delay:-.9s}
@keyframes al-fl{from{transform:scale(.9,.95)}to{transform:scale(1.08,1.12)}}
@keyframes al-bub{from{transform:translateY(0);opacity:.7}to{transform:translateY(-26px);opacity:0}}
.table.alchemy .al-liq{transition:fill .8s}
.table.alchemy .al-drip{animation:al-drip 1.8s ease-in infinite}@keyframes al-drip{0%,60%{opacity:0;transform:translateY(0)}70%{opacity:1}100%{opacity:0;transform:translateY(22px)}}
.table.alchemy .al-smoke{animation:al-smoke 2.6s ease-out infinite}@keyframes al-smoke{from{opacity:.6;transform:translateY(0)}to{opacity:0;transform:translateY(-14px)}}
@keyframes al-in{from{opacity:0}}
.table.alchemy .al-won .al-halo{animation:al-glow 1.6s ease-in-out infinite alternate}@keyframes al-glow{from{opacity:.6}to{opacity:1}}
.table.alchemy :is(.al-ember,.al-vap,.al-liq,.al-jar-tilt,.al-drop,.shake,.al-puff,.al-dying,.al-spark,.al-label,.al-scroll,.al-chip,.al-fl){transform-box:fill-box}
.table.alchemy .al-ember{transform-origin:center;animation:al-ember 2.2s linear infinite}
@keyframes al-ember{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx),-70px);opacity:0}}
.table.alchemy .al-vap{animation:al-vap 2.7s ease-out infinite}@keyframes al-vap{0%{opacity:0;transform:translateY(6px)}30%{opacity:.35}100%{opacity:0;transform:translateY(-22px) scaleX(1.6)}}
.table.alchemy .al-bub{animation:al-bub 2.2s ease-in infinite}
.table.alchemy .al-liq.rise{animation:al-rise .9s .45s cubic-bezier(.3,1.4,.5,1) both}@keyframes al-rise{from{transform:translateY(12px)}}
.table.alchemy .al-jar-tilt{transform-origin:0% 100%;animation:al-tilt .9s ease-in-out both}@keyframes al-tilt{0%{transform:rotate(0);opacity:0}20%{opacity:1}45%,75%{transform:rotate(-50deg)}100%{transform:rotate(0);opacity:0}}
.table.alchemy .al-stream{stroke-dasharray:110;stroke-dashoffset:110;animation:al-stream .9s .25s ease-in both}@keyframes al-stream{40%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:-110;opacity:0}}
.table.alchemy .al-drop{opacity:0;animation:al-drop .5s ease-out both}@keyframes al-drop{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--sx),-14px)}}
.table.alchemy .shake{animation:al-shake .5s ease-in-out 2}@keyframes al-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px) rotate(-3deg)}40%{transform:translateX(5px) rotate(3deg)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
.table.alchemy .al-puff{opacity:0;animation:al-puff 1.6s ease-out both}@keyframes al-puff{0%{opacity:.9;transform:translate(0,0) scale(.4)}100%{opacity:0;transform:translate(var(--dx),-90px) scale(2.2)}}
.table.alchemy .al-dying{transform-origin:50% 100%;animation:al-die .8s ease-in both}@keyframes al-die{0%{transform:scale(1)}50%{transform:scale(1.3,.6)}100%{transform:scale(0,0);opacity:0}}
.table.alchemy .al-rays{transform-box:view-box;transform-origin:200px 168px;animation:al-spin 9s linear infinite,al-in 1s ease-out both}@keyframes al-spin{to{transform:rotate(360deg)}}
.table.alchemy .al-spark{opacity:0;transform-origin:center;animation:al-spark 1.4s ease-out both}@keyframes al-spark{0%{opacity:1;transform:translate(0,0) scale(.3)}60%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.2) rotate(90deg)}}
.table.alchemy .al-label{transform-origin:center;animation:al-pop .7s cubic-bezier(.2,1.6,.4,1) both}@keyframes al-pop{from{transform:scale(.2);opacity:0}}
.table.alchemy .al-scroll{transform-origin:50% 0;animation:al-unroll .7s cubic-bezier(.2,1.2,.4,1) both}@keyframes al-unroll{from{transform:scaleY(.08)}}
.table.alchemy .al-scroll.shake{animation:al-shake .5s ease-in-out 2}.table.alchemy .al-won .al-scroll{animation:none}
.table.alchemy .al-ink [stroke]{stroke-dasharray:160;stroke-dashoffset:160;animation:al-draw 1.3s .4s ease-out forwards}.table.alchemy .al-ink [fill="currentColor"]{animation:al-in 1s .9s both}
@keyframes al-draw{to{stroke-dashoffset:0}}
.table.alchemy .al-ink.lit{filter:drop-shadow(0 0 6px #ffd76a)}.table.alchemy .al-ink.lit [stroke]{animation:none;stroke-dashoffset:0}.table.alchemy .al-ink.lit [fill="currentColor"]{animation:none}
.table.alchemy .al-chip{animation:al-chipin .5s cubic-bezier(.2,1.5,.4,1) both}@keyframes al-chipin{from{opacity:0;transform:translateY(-24px)}}
.reward .al-el.on{animation:al-flip .6s cubic-bezier(.2,1.4,.4,1) both}.reward .al-el.on:nth-child(2){animation-delay:.12s}.reward .al-el.on:nth-child(3){animation-delay:.24s}
@keyframes al-flip{from{transform:rotateY(90deg) scale(.6);opacity:0}}
.al-eq{animation:al-in .6s .2s ease-out both}
.table.alchemy :is(.al-fume,.al-fall,.al-heap,.al-shrink,.al-xtal,.al-dripx,.al-glowpulse,.al-fizz,.al-flare,.al-film,.al-spark2,.al-crust){transform-box:fill-box;transform-origin:center}
.table.alchemy .al-swirl{transform-box:view-box;transform-origin:200px 182px;animation:al-swirl 1.6s ease-in both}@keyframes al-swirl{0%{transform:rotate(0) scale(1.4);opacity:1}80%{opacity:.9}100%{transform:rotate(540deg) scale(.1);opacity:0}}
.table.alchemy .al-fume{opacity:0;animation:al-fume 2.6s ease-out both}@keyframes al-fume{0%{opacity:.85;transform:translate(0,0) scale(.4)}100%{opacity:0;transform:translate(var(--dx),-100px) scale(2.6)}}
.table.alchemy .al-crust{opacity:0;animation:al-in .8s 1.8s ease-out forwards}
.table.alchemy .al-fall{opacity:0;animation:al-fall .9s ease-in both}@keyframes al-fall{0%{opacity:1;transform:translateY(0)}100%{opacity:1;transform:translateY(42px)}}
.table.alchemy .al-heap{transform-origin:50% 100%;animation:al-heap 1.4s 1.6s ease-out both}@keyframes al-heap{from{transform:scale(.1,.1)}}
.table.alchemy .al-shrink{animation:al-shrink 2.6s .9s ease-in both}@keyframes al-shrink{0%{transform:scale(1)}100%{transform:scale(0);opacity:0}}
.table.alchemy .al-xtal{opacity:0;animation:al-xtal .5s cubic-bezier(.2,1.6,.4,1) both}@keyframes al-xtal{from{opacity:1;transform:scale(0)}to{opacity:1;transform:scale(1)}}
.table.alchemy .al-branch{stroke-dasharray:60;stroke-dashoffset:60;animation:al-draw 1.6s ease-out forwards}
.table.alchemy .al-dripx{opacity:0;animation:al-dripx .6s ease-in both}@keyframes al-dripx{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(30px)}}
.table.alchemy .al-glowpulse{opacity:0;mix-blend-mode:screen;animation:al-gp 1.4s 1.2s ease-in-out infinite alternate}@keyframes al-gp{from{opacity:.15;transform:scale(.8)}to{opacity:.6;transform:scale(1.15)}}
.table.alchemy .al-fizz{opacity:0;animation:al-fizz 1s ease-in infinite}@keyframes al-fizz{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-60px)}}
.table.alchemy .al-flare{opacity:0;animation:al-flare 1.6s 1.3s ease-out both}@keyframes al-flare{0%{opacity:0;transform:scale(.2) rotate(0)}30%{opacity:1;transform:scale(2) rotate(45deg)}100%{opacity:.7;transform:scale(1.2) rotate(90deg)}}
.table.alchemy .al-film{transform-origin:50% 50%;animation:al-film 1.6s 1.2s ease-out both}@keyframes al-film{from{transform:scaleX(0)}}
.table.alchemy .al-spark2{opacity:0;animation:al-spark2 1s ease-out both}@keyframes al-spark2{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--x),var(--y))}}
.table.alchemy :is(.al-fireball,.al-ring,.al-shard,.al-soot,.al-cloud,.al-skull){transform-box:fill-box;transform-origin:center}
.table.alchemy .al-vessel.gone{animation:al-gone .15s ease-in forwards}@keyframes al-gone{to{opacity:0;transform:scale(1.3)}}
.table.alchemy .al-fireball{animation:al-fireball 1.4s ease-out both}@keyframes al-fireball{0%{transform:scale(.1);opacity:1}30%{transform:scale(1.6);opacity:1}100%{transform:scale(2.4);opacity:0}}
.table.alchemy .al-ring{opacity:0;animation:al-ring 1s ease-out both}@keyframes al-ring{0%{opacity:1;transform:scale(.3)}100%{opacity:0;transform:scale(6)}}
.table.alchemy .al-shard{animation:al-shard 1.1s cubic-bezier(.1,.8,.3,1) both}@keyframes al-shard{0%{transform:translate(0,0) rotate(0)}100%{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:.15}}
.table.alchemy .al-soot{opacity:0;animation:al-soot 3s ease-out forwards}@keyframes al-soot{0%{opacity:.95;transform:translate(0,0) scale(.3)}60%{opacity:.85}100%{opacity:.55;transform:translate(var(--dx),-70px) scale(2.2)}}
.table.alchemy .al-flash{opacity:0;pointer-events:none;animation:al-flash .7s ease-out both}@keyframes al-flash{0%{opacity:.95}100%{opacity:0}}
.table.alchemy .al-crack{stroke-dasharray:80;stroke-dashoffset:80;animation:al-draw .4s .2s ease-out forwards}
.table.alchemy .al-exploded .al-fl,.table.alchemy .al-exploded .al-ember{display:none}
.table.alchemy.quake{animation:al-quake .6s cubic-bezier(.36,.07,.19,.97) both}@keyframes al-quake{10%,90%{transform:translate(-2px,1px)}20%,80%{transform:translate(5px,-3px)}30%,50%,70%{transform:translate(-8px,4px) rotate(-1deg)}40%,60%{transform:translate(8px,-4px) rotate(1deg)}}
.al-boomcard{margin:8px 0;padding:10px 12px;border:1px solid #ff7a3c;border-radius:10px;background:linear-gradient(90deg,rgba(255,90,31,.18),rgba(40,20,30,.6));animation:al-in .5s ease-out both}
.al-boomcard b{color:#ffb36b;font-family:var(--display);letter-spacing:.05em}.al-boomcard p{margin:6px 0 0;font-size:.88rem}
.table.alchemy .al-cloud{opacity:0;animation:al-cloud 3.2s ease-out forwards}@keyframes al-cloud{0%{opacity:.9;transform:translate(0,0) scale(.3)}50%{opacity:.75}100%{opacity:.6;transform:translate(var(--dx),var(--dy)) scale(2.6)}}
.table.alchemy .al-cloud.small{animation-duration:1.6s}
.table.alchemy .al-tint{opacity:0;animation:al-tint 3s ease-in forwards}@keyframes al-tint{to{opacity:.28}}
.table.alchemy .al-skull{opacity:0;animation:al-skull 1.2s 1.4s ease-out forwards}@keyframes al-skull{0%{opacity:0;transform:scale(.4)}70%{opacity:1;transform:scale(1.15)}100%{opacity:.95;transform:scale(1)}}
.table.alchemy .al-gassed .al-vessel{animation:al-shake .5s 3}
.table.alchemy .al-gear.lit{filter:drop-shadow(0 0 6px #9fd8ff);animation:al-gearlit 1.2s ease-in-out 2}@keyframes al-gearlit{50%{filter:drop-shadow(0 0 14px #fff)}}
.table.alchemy.choke{animation:al-choke 2.4s ease-in-out both}@keyframes al-choke{0%,100%{filter:none}40%{filter:blur(1px) saturate(1.4)}70%{filter:blur(.5px)}}
.al-boomcard.gas{border-color:#b6e35a;background:linear-gradient(90deg,rgba(150,210,60,.18),rgba(20,30,20,.6))}.al-boomcard.gas b{color:#d4f58a}
.al-boomcard.saved{border-color:#9fd8ff;background:linear-gradient(90deg,rgba(120,190,255,.18),rgba(20,24,40,.6))}.al-boomcard.saved b{color:#cfeaff}
.al-grid h3{margin:4px 0;font-family:var(--display);color:#FADE8C}.al-finds{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px;margin:4px 0 10px}
.al-find{display:flex;flex-direction:column;gap:2px;padding:8px;border:1px dashed rgba(226,176,74,.35);border-radius:8px;font-size:.82rem;opacity:.55}.al-find.on{opacity:1;border-style:solid;border-color:#E2B04A;background:rgba(226,176,74,.08)}
.al-find b{font-size:1.1rem}.al-find small{opacity:.75;font-size:.72rem;word-break:break-word}
button.al-find{font:inherit;color:inherit;text-align:left;cursor:pointer}button.al-find:hover{box-shadow:0 0 10px rgba(250,222,140,.45)}
.al-seal{border:1px solid #E2B04A;border-radius:8px;padding:6px 10px;background:linear-gradient(90deg,rgba(226,176,74,.25),rgba(226,176,74,.05));animation:al-in .6s ease-out both}
.c.level.al-daily{border-color:#7fd1ff}.c.level.al-daily.done{opacity:.7}
.al-race h3{margin:4px 0;font-family:var(--display);color:#FADE8C}.al-race ol{list-style:none;padding:0;margin:6px 0}.al-race li{padding:6px 10px;border:1px solid rgba(226,176,74,.3);border-radius:8px;margin:4px 0}.al-race li.me{border-color:#E2B04A;background:rgba(226,176,74,.12)}
@media (prefers-reduced-motion:reduce){.table.alchemy *{animation:none!important}.table.alchemy .al-swirl{display:none}.table.alchemy :is(.al-shard,.al-flash,.al-ring){display:none}.table.alchemy .al-soot{opacity:.7}.table.alchemy .al-vessel.gone{opacity:0}.table.alchemy .al-cloud{opacity:.5}.table.alchemy .al-skull{opacity:.95}.table.alchemy .al-tint{opacity:.22}}
.al-shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;margin:4px 0 6px}
.c.al-jar{display:flex;align-items:center;gap:8px;text-align:left;border-radius:10px;padding:6px 10px}
.c.al-jar i{flex:none;width:24px;height:24px;border-radius:6px;background:var(--jc);display:grid;place-items:center;color:#160b2c;box-shadow:inset 0 -6px 0 rgba(0,0,0,.18)}
.c.al-jar span{display:flex;flex-direction:column;line-height:1.15}.c.al-jar small{color:var(--muted);font-size:.7rem}
.c.al-jar.on,.c.al-op.on,.c.al-buy.on{border-color:var(--gold2);background:rgba(226,176,74,.18);box-shadow:0 0 10px rgba(250,222,140,.35)}
.al-ops{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}
.al-fb{margin:4px 0}
.al-eq{margin:8px 0;padding:8px 12px;border:1px solid rgba(102,224,200,.5);border-radius:10px;background:rgba(22,16,48,.6);display:flex;flex-direction:column;gap:4px}
.al-eq b{color:var(--gold2);font-family:var(--display);letter-spacing:.04em}.al-eq code{font-family:ui-monospace,Menlo,monospace;color:var(--teal,#66E0C8);font-size:.92rem;white-space:normal}
.c.al-buy{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;text-align:left;border-radius:10px}.c.al-buy small{width:100%;color:var(--muted);font-size:.74rem}
.al-book h3,.al-table h3{font-family:var(--display);color:var(--gold2);margin:4px 0 8px;font-size:1rem}
.al-book details{border:1px solid var(--line);border-radius:10px;padding:6px 10px;margin:6px 0;background:rgba(22,16,48,.5)}
.al-book summary{cursor:pointer;color:var(--gold2);font-weight:600}.al-book p{margin:6px 0;font-size:.88rem;line-height:1.45}
.al-gtable{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;margin-top:6px}
.al-gtable span{display:flex;flex-direction:column;align-items:center;text-align:center;padding:6px 4px;border:1px solid var(--line);border-radius:8px;color:var(--gold)}
.al-gtable b{font-size:.78rem;color:var(--gold2)}.al-gtable small{font-size:.66rem;color:var(--muted)}
.al-pt{display:grid;grid-template-columns:repeat(18,minmax(0,1fr));gap:2px;margin-top:6px;max-width:620px}
.al-el{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:1;border:1px solid var(--line);border-radius:4px;font-size:clamp(.5rem,1.6vw,.78rem);font-weight:700;color:var(--muted);background:rgba(22,16,48,.6);min-width:0}
.al-el small{font-size:.6em;font-weight:400;opacity:.8}
.al-el.blank{opacity:.25}.al-el.on{color:#160b2c;background:var(--gold2);border-color:var(--gold);box-shadow:0 0 8px rgba(250,222,140,.5)}
.reward .al-el{width:34px;font-size:.8rem}
.al-g{vertical-align:middle}
`;
