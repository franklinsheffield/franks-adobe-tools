// Grimoire Memory styles, injected once when the room opens or a card back is tried on in the store (Chamber palette
// from chamber.css :root). The rune, Ogham and hieroglyph fonts are the Decoder's OFL Noto subsets.
import { FONTS } from "../decoder/fonts.gen.js";
export function ensureStyle() {
  if (document.getElementById("gm-style")) return;
  const f = (fam, b64) => `@font-face{font-family:"${fam}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-display:block}`;
  const st = document.createElement("style"); st.id = "gm-style";
  st.textContent = f("dec-runic", FONTS.runic) + f("dec-ogham", FONTS.ogham) + f("dec-egy", FONTS.egy)
    + `.dec-runic{font-family:"dec-runic","Noto Sans Runic",serif}.dec-ogham{font-family:"dec-ogham",serif}.dec-egy{font-family:"dec-egy","Noto Sans Egyptian Hieroglyphs",serif}` + CSS;
  document.head.append(st);
}
export const CSS = `
.gm-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 10px;margin:0 0 6px}
.gm-top{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;font-size:.86rem;color:var(--muted)}.gm-top b{color:var(--gold2)}
.gm-tools{display:flex;gap:6px;flex-wrap:wrap}.gm-tools .c{padding:4px 10px;font-size:.8rem}
.gm-top b{color:var(--gold2)}.gm-combo{color:var(--pink);font-weight:700;animation:gm-pop .4s ease-out}
.gm-board{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:clamp(4px,.8vw,8px);width:100%;max-width:calc(var(--cols) * 112px);margin:4px auto 8px;perspective:900px}
@media (max-width:640px){.gm-board{grid-template-columns:repeat(var(--cols-sm),minmax(0,1fr));max-width:100%;gap:4px}.gm-card{aspect-ratio:4/5}.gm-face{padding:2px;border-radius:7px}.gm-back{border-radius:7px}.gm-face.m small{font-size:.5rem}}
.gm-card{position:relative;aspect-ratio:3/4;border:0;padding:0;background:none;cursor:pointer;font:inherit;color:var(--fg);
  animation:gm-deal .5s cubic-bezier(.2,.9,.3,1.2) calc(var(--i) * 45ms) both;-webkit-tap-highlight-color:transparent}
@keyframes gm-deal{from{opacity:0;transform:translateY(-60px) rotate(calc(var(--i) * 7deg - 20deg)) scale(.6)}}
.gm-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.3,.7,.3,1.2)}
.gm-card.up .gm-in,.gm-card.done .gm-in{transform:rotateY(180deg)}
.gm-face,.gm-back{position:absolute;inset:0;border-radius:9px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.gm-back{background:var(--gm-bg);border:1.5px solid var(--gm-edge);box-shadow:inset 0 0 0 3px rgba(0,0,0,.25),0 3px 8px rgba(0,0,0,.45)}
.gm-back svg{width:52%;height:52%;filter:drop-shadow(0 0 4px rgba(0,0,0,.5))}
.gm-card:hover:not(.up):not(.done) .gm-back{box-shadow:inset 0 0 0 3px rgba(0,0,0,.25),0 0 12px var(--gm-edge)}
.gm-card:focus-visible{outline:2px solid var(--teal);outline-offset:3px;border-radius:10px}
.gm-face{transform:rotateY(180deg);background:linear-gradient(170deg,#f4ead2,#dccba0);color:#2a1a08;border:1.5px solid #8a6a2c;box-shadow:0 3px 8px rgba(0,0,0,.45);padding:4px;text-align:center;gap:2px}
.gm-face.s{background:radial-gradient(circle at 50% 40%,#2e1e68,#120a24 80%);color:var(--gold2);border-color:var(--gold)}
.gm-face.s .gm-g{font-size:clamp(1.5rem,6vw,2.3rem);line-height:1;text-shadow:0 0 10px rgba(226,176,74,.55)}
.gm-face.s svg{width:62%;height:auto;max-height:70%;color:var(--gold2);filter:drop-shadow(0 0 5px rgba(226,176,74,.5))}
.gm-face.s .m-fill{fill:var(--gold2)}.gm-face.s .m-ink{stroke:var(--gold2)}
.gm-face.m b{font-family:var(--display);font-size:clamp(.62rem,2.6vw,.82rem);line-height:1.1;word-break:break-word}
.gm-face.m small{font-size:clamp(.52rem,2.1vw,.64rem);line-height:1.15;color:#5a4320}
.gm-face.m i{font-style:normal;font-size:clamp(.6rem,2.4vw,.74rem);color:#7a2a6a;font-weight:700}
.gm-face.m.maya b{font-size:clamp(1.3rem,5vw,1.9rem)}
.gm-face .gm-tag{position:absolute;top:3px;left:5px;font-size:.6rem;opacity:.75}
.gm-card.done .gm-face{animation:gm-match .7s ease-out both;box-shadow:0 0 0 2px var(--teal),0 0 16px rgba(102,224,200,.55)}
.gm-card.done{cursor:default}
@keyframes gm-match{0%{transform:rotateY(180deg) scale(1)}35%{transform:rotateY(180deg) scale(1.13) translateY(-6px)}100%{transform:rotateY(180deg) scale(1)}}
.gm-card.miss .gm-in{animation:gm-shake .45s ease-in-out}
@keyframes gm-shake{0%,100%{transform:rotateY(180deg)}20%{transform:rotateY(180deg) translateX(-6px) rotate(-3deg)}40%{transform:rotateY(180deg) translateX(5px) rotate(2deg)}60%{transform:rotateY(180deg) translateX(-3px)}}
.gm-card.miss .gm-face{box-shadow:0 0 0 2px var(--pink),0 0 14px rgba(255,79,179,.5)}
.gm-board.won .gm-card{animation:gm-wave .8s ease-in-out calc(var(--i) * 50ms) both}
@keyframes gm-wave{50%{transform:translateY(-10px) rotate(-2deg)}}
.gm-board.peeking .gm-card{cursor:wait}
@keyframes gm-pop{from{transform:scale(1.6);opacity:0}}
.gm-levels{display:flex;flex-direction:column;gap:8px;margin:6px 0}
.gm-levels .c{text-align:left;border-radius:12px;display:flex;flex-direction:column;gap:2px}.gm-levels .c span{font-size:.78rem;color:var(--muted)}
.gm-decks{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:6px 0}
.gm-decks .c{border-radius:12px;text-align:left;display:flex;flex-direction:column;gap:2px}.gm-decks .c span{font-size:.74rem;color:var(--muted)}
.gm-stars{color:var(--gold2);letter-spacing:.1em}.gm-stars .off{opacity:.25}
.gm-result{text-align:center;margin:6px 0}.gm-result .gm-big{font-size:2rem;letter-spacing:.2em}
.gm-big span{display:inline-block;animation:gm-starin .5s cubic-bezier(.2,1.6,.4,1) calc(var(--i) * 350ms + 200ms) both}
@keyframes gm-starin{from{opacity:0;transform:scale(2.4) rotate(-40deg)}}
.gm-log{display:flex;flex-direction:column;gap:6px}
.gm-log h3{margin:0;font-family:var(--display);color:var(--gold);font-size:.9rem}
.gm-pair{display:flex;gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:6px 10px;background:rgba(30,22,64,.6);animation:gm-pop .4s ease-out}
.gm-pair .gm-sym{min-width:44px;font-size:1.7rem;color:var(--gold2);text-align:center;display:flex;justify-content:center}
.gm-pair .gm-sym svg{width:38px;height:auto;color:var(--gold2)}.gm-pair .m-fill{fill:var(--gold2)}.gm-pair .m-ink{stroke:var(--gold2)}
.gm-pair p{margin:0;font-size:.84rem}.gm-pair p b{color:var(--teal)}
.gm-guide h3{font-family:var(--display);color:var(--gold);margin:0 0 6px;font-size:1rem}
.gm-guide details{border:1px solid var(--line);border-radius:10px;padding:6px 10px;margin:6px 0;background:rgba(30,22,64,.5)}
.gm-guide summary{cursor:pointer;color:var(--gold2);font-family:var(--display);font-size:.85rem}
.gm-guide p{font-size:.86rem;margin:6px 0}
.gm-gtable{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:6px}
.gm-gtable>span{display:flex;gap:8px;align-items:center;font-size:.76rem;border-bottom:1px dotted var(--line);padding:3px 0}.gm-gtable em{font-style:normal;color:var(--muted);line-height:1.25}.gm-gtable em b{color:var(--fg)}.gm-gtable u{text-decoration:none;color:var(--teal);font-weight:700}
.gm-gtable i{font-style:normal;font-size:1.6rem;color:var(--gold2);min-width:30px;text-align:center;display:flex;justify-content:center}
.gm-gtable i svg{width:26px;height:auto;color:var(--gold2)}.gm-gtable .m-fill{fill:var(--gold2)}.gm-gtable .m-ink{stroke:var(--gold2)}
/* the reading table during a game: found-pair slots and candles */
.table.gm-table.play{align-items:stretch}
.gm-tbl{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:12px 12px 34px;gap:8px}
.gm-tbl-h{font-family:var(--display);color:var(--gold);font-size:.82rem;letter-spacing:.12em}
.gm-slots{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;width:100%;max-width:440px}
.gm-slot{aspect-ratio:1;border:1.5px dashed rgba(226,176,74,.3);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden;padding:2px}
.gm-slot.got{border:1.5px solid var(--teal);background:rgba(20,40,60,.55);box-shadow:0 0 10px rgba(102,224,200,.25)}
.gm-slot.new{animation:gm-slotin .7s cubic-bezier(.2,1.5,.4,1) both;box-shadow:0 0 18px rgba(102,224,200,.7)}
@keyframes gm-slotin{from{opacity:0;transform:scale(.3) translateY(40px) rotate(-12deg)}}
.gm-slot .gm-sym{font-size:clamp(1.1rem,3.4vw,1.8rem);line-height:1;color:var(--gold2);display:flex;text-shadow:0 0 8px rgba(226,176,74,.5)}
.gm-slot .gm-sym svg{width:clamp(22px,5vw,34px);height:auto;color:var(--gold2)}.gm-slot .m-fill{fill:var(--gold2)}.gm-slot .m-ink{stroke:var(--gold2)}
.gm-slot b{font-size:clamp(.5rem,1.6vw,.66rem);color:var(--teal);text-align:center;line-height:1.05;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gm-candles{display:flex;gap:clamp(4px,1.4vw,12px);align-items:flex-end;justify-content:center;flex-wrap:wrap}
.gm-candle{position:relative;width:clamp(10px,2.2vw,16px);height:clamp(28px,6vw,44px);display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.gm-candle b{display:block;width:100%;height:70%;border-radius:3px 3px 2px 2px;background:linear-gradient(90deg,#d9c9a3,#fff4d8 45%,#c9b68a);box-shadow:0 0 10px rgba(255,190,90,.35)}
.gm-flame{position:absolute;top:0;width:70%;height:34%;border-radius:50% 50% 45% 45%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff 0 18%,#ffd36b 40%,#ff8a1f 75%,transparent 80%);
  filter:drop-shadow(0 0 6px #ffb347);transform-origin:50% 100%;animation:gm-flick 1.4s ease-in-out calc(var(--i) * -170ms) infinite}
@keyframes gm-flick{0%,100%{transform:scale(1) rotate(-2deg)}33%{transform:scale(.92,1.08) rotate(2deg)}66%{transform:scale(1.05,.95) rotate(-1deg)}}
.gm-candle.out .gm-flame{display:none}.gm-candle.out b,.gm-candle.snuff b{box-shadow:none;filter:brightness(.6)}
.gm-candle.snuff .gm-flame{animation:gm-snuff .6s ease-in forwards}
@keyframes gm-snuff{to{transform:scale(.1,.4);opacity:0}}
.gm-candle.snuff::after,.gm-candle.out::after{content:"";position:absolute;top:-4px;left:50%;width:3px;height:3px;border-radius:50%;background:rgba(200,200,220,.6);box-shadow:0 0 6px 3px rgba(180,180,200,.35);animation:gm-smoke 1.6s ease-out forwards}
.gm-candle.out::after{animation:none;opacity:0}
@keyframes gm-smoke{from{opacity:.9;transform:translate(-50%,0) scale(1)}to{opacity:0;transform:translate(-30%,-40px) scale(4)}}
/* the reading table */
.table.gm-table{display:flex;align-items:center;justify-content:center;overflow:hidden}
.gm-fan{position:relative;width:60%;max-width:260px;aspect-ratio:1.4}
.gm-fcard{position:absolute;left:50%;bottom:8%;width:34%;aspect-ratio:3/4;transform-origin:50% 120%;transform:translateX(-50%) rotate(var(--r));animation:gm-fanin .7s cubic-bezier(.2,.9,.3,1.1) calc(var(--i) * 90ms) both}
.gm-fcard .gm-back{transform:none}
@keyframes gm-fanin{from{opacity:0;transform:translateX(-50%) rotate(0) translateY(30px)}}
.gm-fan.breathe{animation:gm-breathe 5s ease-in-out infinite}
@keyframes gm-breathe{50%{transform:translateY(-6px)}}
.gm-show{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;animation:gm-rise .8s cubic-bezier(.2,.9,.3,1.2) both;padding:10px}
.gm-show .gm-sym{font-size:clamp(3rem,12vw,5.5rem);line-height:1;color:var(--gold2);text-shadow:0 0 22px rgba(226,176,74,.7);animation:gm-float 4s ease-in-out .8s infinite;display:flex}
.gm-show .gm-sym svg{width:clamp(70px,16vw,120px);height:auto;color:var(--gold2);filter:drop-shadow(0 0 10px rgba(226,176,74,.6))}
.gm-show .m-fill{fill:var(--gold2)}.gm-show .m-ink{stroke:var(--gold2)}
.gm-show b{font-family:var(--display);color:var(--teal);font-size:1.1rem}.gm-show small{color:var(--muted);font-size:.8rem;max-width:260px}
@keyframes gm-rise{from{opacity:0;transform:translateY(24px) scale(.7)}}
@keyframes gm-float{50%{transform:translateY(-8px)}}
.gm-spark{position:absolute;inset:0;pointer-events:none}
.gm-spark i{position:absolute;left:var(--x);top:60%;width:6px;height:6px;border-radius:50%;background:var(--gold2);box-shadow:0 0 8px var(--gold2);opacity:0;animation:gm-spark 1.3s ease-out var(--d) both}
@keyframes gm-spark{0%{opacity:0;transform:translateY(10px) scale(.4)}25%{opacity:1}100%{opacity:0;transform:translateY(-120px) scale(1.2)}}
.gm-trophy{font-size:clamp(3rem,10vw,4.5rem);animation:gm-rise .8s cubic-bezier(.2,1.6,.4,1) both}
@media (prefers-reduced-motion: reduce){.gm-flame,.gm-slot.new,.gm-candle.snuff .gm-flame,.gm-card,.gm-card.done .gm-face,.gm-card.miss .gm-in,.gm-board.won .gm-card,.gm-fcard,.gm-show,.gm-show .gm-sym,.gm-spark i,.gm-big span{animation:none}.gm-in{transition:none}}
`;
