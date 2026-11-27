// Decoder room styles, injected once when the room opens (Chamber palette from chamber.css :root).
export const CSS = `
.dec-runic{font-family:"dec-runic","Noto Sans Runic",serif}.dec-ogham{font-family:"dec-ogham",serif}.dec-egy{font-family:"dec-egy","Noto Sans Egyptian Hieroglyphs",serif}
.table.decoder{background:radial-gradient(70% 60% at 50% 45%,rgba(46,30,104,.55),transparent 75%)}
.dec-board{position:absolute;inset:0 0 22px;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;padding:10px 12px;text-align:center}
.dec-board>:first-child{margin-top:auto}.dec-board>:last-child{margin-bottom:auto}
.dec-home{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:min(100%,460px)}
.dec-medal{border:1px solid var(--line);border-radius:12px;background:var(--dcard,rgba(22,16,48,.75));padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:2px}
.dec-medal b{font-family:var(--display);font-size:.78rem;color:var(--gold2);letter-spacing:.06em}.dec-medal small{color:var(--muted);font-size:.72rem}
.dec-glyph{font-size:1.9rem;line-height:1.2;color:var(--dink2,var(--gold));min-height:44px;display:flex;align-items:center;text-shadow:0 0 12px rgba(226,176,74,.45)}
.dec-intro p{margin:6px auto;max-width:440px;font-size:.9rem}.dec-intro small{color:var(--muted)}
.dec-big{font-size:2.6rem;color:var(--dink2,var(--gold));text-shadow:0 0 16px rgba(226,176,74,.5);display:flex;justify-content:center;gap:8px;align-items:flex-end}
.dec-learn{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:560px}
.dec-card{width:92px;border:1px solid var(--dink2,var(--gold));border-radius:10px;background:var(--dcard,rgba(22,16,48,.85));padding:6px 4px;display:flex;flex-direction:column;align-items:center;animation:dec-in .4s both}
.dec-card span{font-size:2.1rem;line-height:1.15;color:var(--dink,var(--gold2))}.dec-card b{color:var(--teal);font-size:1.05rem}.dec-card small{color:var(--muted);font-size:.66rem;line-height:1.25}
.dec-card:nth-child(2){animation-delay:.06s}.dec-card:nth-child(3){animation-delay:.12s}.dec-card:nth-child(4){animation-delay:.18s}.dec-card:nth-child(5){animation-delay:.24s}.dec-card:nth-child(n+6){animation-delay:.3s}
@keyframes dec-in{from{opacity:0;transform:translateY(8px) scale(.95)}}
.dec-lc-key{width:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 12px;font-size:.72rem;color:var(--muted)}.dec-lc-key b{color:var(--gold2)}
.dec-note{color:var(--muted);font-style:italic}
.dec-strip{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;max-width:100%;padding:8px 10px}
.dec-strip.ogham{gap:0}.dec-strip.futhark,.dec-strip.egyptian{gap:2px}.dec-strip.maya{gap:12px}
.dec-strip.cartouche{border:3px solid var(--dink2,var(--gold));border-radius:999px;padding:8px 22px;box-shadow:inset 0 0 14px rgba(226,176,74,.25),0 0 14px rgba(226,176,74,.2);position:relative}
.dec-strip.cartouche::after{content:"";position:absolute;right:-9px;top:15%;bottom:15%;width:4px;background:var(--dink2,var(--gold));border-radius:2px}
.dec-strip.lc{flex-direction:column;align-items:center;gap:2px}.dec-strip.lc .dec-cell{flex-direction:row;gap:10px;min-width:220px;justify-content:space-between}
.dec-strip.lc em{font-style:normal;font-family:var(--display);color:var(--muted);font-size:.72rem;width:70px;text-align:left}
.dec-cell{display:flex;flex-direction:column;align-items:center;min-width:26px;border-radius:6px;padding:0 1px;transition:background .2s}
.dec-cell span,.dec-cell.sep{font-size:2.5rem;line-height:1.15;color:var(--dink,var(--gold2));text-shadow:0 0 10px var(--dglow,transparent)}.dec-strip.egyptian .dec-cell span{font-size:2.7rem}.dec-strip.long .dec-cell span{font-size:1.9rem}.dec-strip.egyptian.long .dec-cell span{font-size:2.1rem}.dec-strip.long .dec-cell b{font-size:.8rem}
.dec-cell.sep{color:var(--muted)}.dec-strip.ogham .dec-cell{min-width:0}.dec-strip.ogham .dec-cell span,.dec-strip.ogham .dec-cell.sep{font-size:2.4rem}
.dec-cell b{min-width:18px;border-top:2px solid var(--line);color:var(--dsnd,var(--teal));font-size:.95rem;line-height:1.5}
.dec-cell b i{color:var(--muted);font-style:normal;opacity:.75}
.dec-cell.now{background:rgba(102,224,200,.12)}.dec-cell.now b{border-color:var(--teal)}
.dec-cell.bad{animation:dec-shake .35s}.dec-cell.bad b{border-color:var(--pink)}
@keyframes dec-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.m-fill{fill:var(--dink2,var(--gold))}.m-ink{stroke:var(--dink2,var(--gold))}.m-num{filter:drop-shadow(0 0 6px rgba(226,176,74,.35))}
.dec-round{font-family:var(--display);color:var(--gold2);letter-spacing:.08em}
.dec-progress{color:var(--dtext,var(--muted));font-size:.78rem}
.dec-book{border:1px dashed var(--gold);border-radius:10px;padding:6px 10px;background:rgba(7,5,15,.85);font-size:.8rem;max-width:540px}
.dec-book b{font-family:var(--display);color:var(--gold);letter-spacing:.1em;font-size:.72rem}
.dec-book div{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;margin-top:4px}.dec-book span{white-space:nowrap;color:var(--teal)}
.dec-book i{font-style:normal;font-size:1.35rem;color:var(--gold2);margin-right:3px;vertical-align:-3px}
.dec-done{font-size:.95rem}.dec-done b{color:var(--gold2);letter-spacing:.04em}
.dec-stars{color:var(--gold);letter-spacing:2px;font-size:1rem}.dec-stars i{font-style:normal;color:var(--line)}
.dec-reward{border:1px solid var(--gold);border-radius:12px;background:var(--dcard,rgba(22,16,48,.9));padding:8px 14px;display:flex;flex-direction:column;gap:2px;animation:dec-in .5s both;font-size:.88rem}
.dec-reward small{color:var(--muted);font-size:.7rem}.dec-reward .dec-stars{font-size:1.5rem}
.dec-levels{display:flex;flex-direction:column;gap:6px;margin:6px 0}
.dec-lv{display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left}.dec-lv[disabled]{opacity:.5}
.dec-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:6px;margin:6px 0}
.dec-tiles.nums{grid-template-columns:repeat(10,minmax(0,1fr))}
.dec-tile{padding:8px 2px;font-size:1rem;font-weight:700;min-width:0}
.dec-q p{margin:4px 0 8px;font-weight:600}.dec-q{display:flex;flex-direction:column;gap:6px}.dec-q .c{text-align:left}
.dec-write{font-size:2.6rem;color:var(--dink,var(--gold2));text-shadow:0 0 14px rgba(226,176,74,.5);padding:8px 24px;word-break:break-all;max-width:100%}
.dec-write.cartouche{border:3px solid var(--dink2,var(--gold));border-radius:999px}.dec-write small{font-size:.9rem;color:var(--muted);font-family:var(--body)}
@media (max-width:560px){.dec-cell span,.dec-cell.sep,.dec-strip.long .dec-cell span,.dec-strip.egyptian .dec-cell span{font-size:1.6rem}.dec-tiles.nums{grid-template-columns:repeat(5,minmax(0,1fr))}.dec-card{width:78px}}
.dec-in{font-size:1.25em;color:var(--gold2);vertical-align:-.12em}
.dec-guide h3{font-family:var(--display);color:var(--gold);letter-spacing:.08em;font-size:1rem;margin:0 0 8px}
.dec-guide details{border:1px solid var(--line);border-radius:10px;margin:6px 0;background:rgba(22,16,48,.55)}
.dec-guide summary{cursor:pointer;padding:8px 12px;font-weight:700;color:var(--gold2);list-style-position:inside}
.dec-guide details[open] summary{border-bottom:1px solid var(--line)}
.dec-guide p{margin:8px 12px;font-size:.9rem;line-height:1.55}.dec-guide b{color:var(--teal)}
.dec-gtable{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;padding:8px}
.dec-gtable span{display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center;border:1px solid var(--line);border-radius:8px;padding:4px 8px}
.dec-gtable i{font-style:normal;font-size:1.7rem;color:var(--gold2);grid-row:span 2}.dec-gtable small{color:var(--muted);font-size:.68rem;line-height:1.2}
.dec-gtable.maya{grid-template-columns:repeat(auto-fill,minmax(58px,1fr))}.dec-gtable.maya span{display:flex;flex-direction:column;gap:0}
.dec-card,.dec-reward{cursor:zoom-in;transition:transform .15s,box-shadow .15s}.dec-card:hover,.dec-reward:hover{transform:translateY(-2px);box-shadow:0 0 14px rgba(226,176,74,.35)}
.dec-medal{cursor:pointer}.dec-medal:hover{border-color:var(--gold)}
#zoom-art:has(.dec-zoom){display:flex;align-items:center;justify-content:center}
.dec-zoom{margin:auto;width:fit-content;min-width:min(80vw,300px);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;max-width:min(92vw,520px);padding:28px 32px;border:2px solid var(--gold);border-radius:18px;background:radial-gradient(80% 70% at 50% 30%,#2E1E68,#161030);box-shadow:0 0 40px rgba(226,176,74,.35);animation:dec-in .3s both}
.dec-zoom>span{font-size:min(38vw,9rem);line-height:1.1;color:var(--gold2);text-shadow:0 0 24px rgba(226,176,74,.6)}
.dec-zoom>b{font-size:2rem;color:var(--teal)}.dec-zoom>small{font-size:1.1rem;color:var(--fg);line-height:1.4}.dec-zoom>div{font-size:1.15rem}
.dec-zoom .m-num{width:min(40vw,180px)!important;height:auto!important}.dec-zoom .dec-stars{font-size:2.4rem}
/* ---- Decoder tablets (Essence store shelf, shop.js): the surface the inscription is laid on ---- */
.table.decoder[data-tablet="birch"]{--dsnd:#0f5a4e;--dtext:#4a2a10;background:repeating-linear-gradient(90deg,#e3d3b0 0 7px,#d6c49c 7px 9px,#e8dabb 9px 21px,#cdb88d 21px 22px),#dcc9a2;--dink:#4a1f0c;--dink2:#7a3412;--dglow:rgba(255,240,200,.4);--dcard:rgba(40,22,8,.86)}
.table.decoder[data-tablet="ochre"]{background:radial-gradient(circle at 20% 30%,rgba(255,255,255,.08) 0 2px,transparent 3px) 0 0/23px 19px,radial-gradient(circle at 60% 70%,rgba(0,0,0,.25) 0 2px,transparent 3px) 0 0/17px 29px,linear-gradient(160deg,#7a7d82,#4a4d52 60%,#33363a);--dink:#d4462a;--dink2:#e98a52;--dglow:rgba(212,70,42,.45);--dcard:rgba(30,30,34,.85)}
.table.decoder[data-tablet="ogham"]{background:radial-gradient(circle at 15% 20%,rgba(184,201,122,.45) 0 3px,transparent 4px) 0 0/97px 71px,radial-gradient(circle at 70% 60%,rgba(217,208,160,.35) 0 2px,transparent 3px) 0 0/61px 83px,linear-gradient(180deg,#f3b77a 0%,#6a7469 22%,#4a554c 60%,#2a332d);--dink:#f2f6ea;--dink2:#c9e08a;--dglow:rgba(242,246,234,.35);--dcard:rgba(26,32,28,.85)}
.table.decoder[data-tablet="papyrus"]{--dsnd:#0f5a4e;--dtext:#4a3410;background:repeating-linear-gradient(90deg,rgba(120,90,30,.18) 0 1px,transparent 1px 6px),repeating-linear-gradient(0deg,rgba(120,90,30,.14) 0 1px,transparent 1px 9px),linear-gradient(180deg,#ecd9a2,#d8bd78);--dink:#141210;--dink2:#b0281e;--dglow:rgba(255,250,220,.5);--dcard:rgba(42,30,12,.86)}
.table.decoder[data-tablet="lapis"]{background:radial-gradient(circle,#ffd86a 0 1px,transparent 1.5px) 0 0/31px 23px,radial-gradient(circle,#e2b04a 0 1px,transparent 1.5px) 11px 9px/19px 27px,linear-gradient(160deg,#2449a8,#13266a 60%,#08113a);--dink:#ffe08a;--dink2:#e2b04a;--dglow:rgba(255,216,106,.45);--dcard:rgba(8,16,50,.85)}
.table.decoder[data-tablet="jade"]{background:radial-gradient(60% 50% at 30% 30%,rgba(255,255,255,.18),transparent 70%),radial-gradient(40% 30% at 75% 70%,rgba(0,0,0,.25),transparent 70%),linear-gradient(150deg,#2a9a72,#13664a 55%,#0a3a2a);--dink:#f0fff7;--dink2:#9ff0c8;--dglow:rgba(160,255,210,.4);--dcard:rgba(6,40,28,.85)}
.table.decoder[data-tablet="bracteate"]{--dsnd:#3a2205;--dtext:#3a2205;background:repeating-radial-gradient(circle at 50% 45%,transparent 0 22px,rgba(90,58,10,.25) 22px 24px),radial-gradient(circle at 50% 40%,#ffe08a,#e2a93a 45%,#8c5e17 85%);--dink:#3a2205;--dink2:#5a3608;--dglow:rgba(255,240,180,.55);--dcard:rgba(48,30,4,.86)}
.table.decoder[data-tablet="birch"]~.table-cap,.table.decoder[data-tablet="papyrus"]~.table-cap,.table.decoder[data-tablet="bracteate"]~.table-cap{color:#3a2205;text-shadow:0 1px 2px rgba(255,240,200,.7)}

/* ---- motion: carve-in, live cell, solved wave and shimmer, star pops, sparks, medals (all off for reduced motion) ---- */
.dec-cell.just>span,.dec-cell.just>svg{animation:dec-carve .55s ease-out}
.dec-cell.just>b{animation:dec-pop .4s ease-out}
@keyframes dec-carve{0%{transform:scale(1.45);filter:drop-shadow(0 0 0 transparent) brightness(2)}35%{filter:drop-shadow(0 0 10px var(--dglow,rgba(250,222,140,.9))) brightness(1.5)}100%{transform:none;filter:none}}
@keyframes dec-pop{0%{transform:translateY(-8px) scale(1.5);opacity:0}100%{transform:none;opacity:1}}
.dec-cell.now>b{animation:dec-live 1.2s ease-in-out infinite}
@keyframes dec-live{50%{border-color:var(--teal);box-shadow:0 3px 8px -3px var(--teal)}}
.dec-strip{position:relative}
.dec-strip.won .dec-cell{animation:dec-wave .6s ease-in-out both;animation-delay:calc(var(--i,0) * 55ms)}
@keyframes dec-wave{40%{transform:translateY(-9px);filter:drop-shadow(0 0 8px var(--dglow,rgba(250,222,140,.8)))}}
.dec-strip.won::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 30%,rgba(255,240,190,.45) 50%,transparent 70%) no-repeat;background-size:40% 100%;animation:dec-shine 1.1s .25s ease-in-out both;mix-blend-mode:screen}
@keyframes dec-shine{from{background-position:-60% 0}to{background-position:160% 0}}
.dec-stars.pop b{display:inline-block;font-weight:inherit;animation:dec-star .45s cubic-bezier(.3,1.8,.5,1) both;animation-delay:calc(.35s + var(--i,0) * .22s)}
@keyframes dec-star{0%{transform:scale(0) rotate(-90deg);opacity:0}100%{transform:none;opacity:1}}
.dec-reward{position:relative;overflow:visible}
.dec-sparks{position:absolute;left:50%;top:30%;width:0;height:0;pointer-events:none}
.dec-sparks i{position:absolute;width:6px;height:6px;margin:-3px;border-radius:50%;background:var(--gold2);box-shadow:0 0 8px var(--gold);opacity:0;animation:dec-spark .9s ease-out both;animation-delay:calc(.3s + var(--d,0s))}
.dec-sparks i:nth-child(3n){background:var(--teal);box-shadow:0 0 8px var(--teal)}.dec-sparks i:nth-child(4n){background:var(--pink);box-shadow:0 0 8px var(--pink)}
@keyframes dec-spark{0%{opacity:1;transform:rotate(var(--a)) translateX(0) scale(1.2)}100%{opacity:0;transform:rotate(var(--a)) translateX(90px) scale(.3)}}
.dec-medal{animation:dec-in .4s both,dec-bob 4s ease-in-out infinite;animation-delay:calc(var(--i,0) * .08s),calc(var(--i,0) * -1s);transition:transform .2s,box-shadow .2s,border-color .2s}
.dec-medal:hover{transform:translateY(-4px) scale(1.04);box-shadow:0 0 18px rgba(226,176,74,.35)}
.dec-medal .dec-glyph{animation:dec-glow 3s ease-in-out infinite;animation-delay:calc(var(--i,0) * -.7s)}
@keyframes dec-bob{50%{translate:0 -4px}}
@keyframes dec-glow{50%{filter:drop-shadow(0 0 6px var(--dglow,rgba(250,222,140,.6)))}}
.dec-intro .dec-big{animation:dec-rise .8s ease-out both}
@keyframes dec-rise{from{opacity:0;transform:translateY(14px);filter:blur(3px)}}
.dec-tile{transition:transform .08s}.dec-tile:active{transform:scale(.9)}
.c.dec-no{animation:dec-shake .35s}

/* ---- the card game: glyph cards on the table, the hand, the deck, ink ---- */
.dec-cardtable{display:flex;flex-direction:column;align-items:center;max-width:100%}
.dec-cardtable .dec-cell:not(.sep){border:1px solid var(--dink2,var(--gold));border-radius:8px;background:var(--dcard,rgba(22,16,48,.85));margin:3px;padding:6px 5px 2px;box-shadow:0 3px 8px rgba(0,0,0,.35)}
.dec-cardtable .dec-cell.now{border-color:var(--teal);box-shadow:0 0 0 2px rgba(102,224,200,.35),0 0 16px rgba(102,224,200,.35);transform:translateY(-4px)}
.dec-cardtable .dec-strip.cartouche{border:none}.dec-cardtable .dec-strip.cartouche::before,.dec-cardtable .dec-strip.cartouche::after{display:none}
.dec-cardtable.deal .dec-cell{animation:dec-dealin .45s cubic-bezier(.2,.9,.3,1.2) both;animation-delay:calc(var(--n,0) * 40ms)}
@keyframes dec-dealin{from{opacity:0;transform:translate(-40px,-60px) rotate(-14deg) scale(.7)}}
.dec-play{display:flex;align-items:flex-end;gap:10px;margin:4px 0 2px}
.dec-deck{position:relative;flex:0 0 66px;height:92px;border:0;background:none;padding:0;cursor:pointer;color:var(--fg)}
.dec-deck .dec-back{position:absolute;inset:0;border:1px solid var(--gold);border-radius:9px;background:repeating-linear-gradient(45deg,rgba(226,176,74,.18) 0 4px,transparent 4px 9px),radial-gradient(circle at 50% 45%,#3a2a80,#161030);box-shadow:0 2px 6px rgba(0,0,0,.5)}
.dec-deck .dec-back.cb{background:none;overflow:hidden}
.dec-deck .dec-back:first-child{transform:translate(3px,-3px) rotate(3deg)}
.dec-deck b{position:absolute;top:28px;left:0;right:0;font-family:var(--display);font-size:1.3rem;color:var(--gold2);text-shadow:0 1px 3px #000}
.dec-deck small{position:absolute;bottom:-17px;left:-6px;right:-6px;font-size:.66rem;color:var(--muted);white-space:nowrap}
.dec-deck:hover:not(:disabled) .dec-back:last-of-type{transform:translateY(-5px)}.dec-deck .dec-back{transition:transform .15s}
.dec-deck:disabled{opacity:.45;cursor:default}
.dec-hand{display:flex;flex:1;min-width:0;gap:6px;overflow-x:auto;padding:10px 4px 6px}
.dec-hcard{flex:0 0 58px;height:84px;border:1px solid var(--gold);border-radius:9px;background:linear-gradient(170deg,#fff8e4,#ecd9a8);color:#2a1a08;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.45);transition:transform .15s,box-shadow .15s;transform:rotate(calc((var(--i,0) - 2) * 2deg))}
.dec-hcard b{line-height:1;font-family:inherit;font-weight:800;font-size:1.6rem;letter-spacing:.02em;text-transform:none}.dec-hcard.num b{font-size:1.7rem}
.dec-hcard:hover,.dec-hcard:focus-visible{transform:translateY(-10px) rotate(0);box-shadow:0 8px 16px rgba(0,0,0,.5),0 0 12px rgba(250,222,140,.5)}
.dec-hcard.fresh{animation:dec-draw .4s cubic-bezier(.2,.9,.3,1.2) both;animation-delay:calc(var(--i,0) * 50ms)}
@keyframes dec-draw{from{opacity:0;transform:translateX(-70px) rotate(-20deg) scale(.7)}}
.dec-hcard.hinted{box-shadow:0 0 0 3px var(--teal),0 0 18px var(--teal);transform:translateY(-10px)}
.dec-flying{position:fixed;z-index:50;margin:0;pointer-events:none;transition:transform .3s cubic-bezier(.5,0,.6,1),opacity .3s;transform:none}
.dec-inkbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:24px 0 4px}
.dec-ink{display:inline-flex;gap:3px}.dec-ink i{width:10px;height:14px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:rgba(255,255,255,.12);border:1px solid var(--line);transition:background .3s}
.dec-ink i.on{background:radial-gradient(circle at 35% 30%,#7fb8ff,#1d3f9a);border-color:#7fb8ff;box-shadow:0 0 5px rgba(127,184,255,.6)}
@media (max-width:560px){.dec-hcard{flex-basis:48px;height:70px}.dec-hcard b{font-size:1.2rem}.dec-deck{flex-basis:54px;height:76px}.dec-deck b{top:22px}}
@media (prefers-reduced-motion:reduce){.dec-board *,.dec-board *::after,.dec-hand *{animation:none!important;transition:none!important}}
`;
