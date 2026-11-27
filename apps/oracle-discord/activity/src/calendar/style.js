// Calendar Keeper styles, injected once when the room opens (Chamber palette from chamber.css :root).
export const CSS = `
.table.calendar{background:#07040f}
.cal-wrap{position:absolute;inset:0 0 26px;display:flex;align-items:center;justify-content:center}
.cal-desk{width:100%;height:100%}
.cal-g{transition:transform 1.4s cubic-bezier(.3,.9,.3,1)}
.cal-spin{animation:cal-spin 40s linear infinite}.cal-spin.rev{animation-direction:reverse;animation-duration:61.5s}
@keyframes cal-spin{to{transform:rotate(360deg)}}
.cal-tw{animation:cal-tw 2.8s ease-in-out infinite}@keyframes cal-tw{50%{opacity:.15}}
.cal-ember{animation:cal-ember 4.4s linear infinite;opacity:0}@keyframes cal-ember{0%{opacity:0;transform:translateY(0)}15%{opacity:.9}100%{opacity:0;transform:translateY(-420px)}}
.cal-smoke{animation:cal-smoke 7s ease-in-out infinite}@keyframes cal-smoke{50%{transform:translateX(18px);opacity:.14}}
.cal-sirius{animation:cal-tw 3.4s ease-in-out infinite}
.cal-q{font-weight:600;margin:6px 0 8px;line-height:1.45}
.form.cal-two{grid-template-columns:repeat(2,minmax(0,1fr))}
.form select{background:#0b0818;border:1px solid var(--line);border-radius:6px;color:var(--fg);padding:8px;font:inherit;min-width:0}
.cal-stars{color:var(--gold);letter-spacing:2px}.cal-stars i{font-style:normal;color:var(--line)}
.cal-steps .c{min-width:64px}
.cal-guide h3,.cal-report h3{font-family:var(--display);color:var(--gold);letter-spacing:.08em;font-size:1rem;margin:0 0 8px}
.cal-guide details{border:1px solid var(--line);border-radius:10px;margin:6px 0;background:rgba(22,16,48,.55)}
.cal-guide summary{cursor:pointer;padding:8px 12px;font-weight:700;color:var(--gold2)}
.cal-guide details[open] summary{border-bottom:1px solid var(--line)}
.cal-guide p{margin:8px 12px;font-size:.9rem;line-height:1.55}.cal-guide b,.cal-report b{color:var(--teal)}
.cal-report ul{margin:0;padding-left:18px;font-size:.9rem;line-height:1.6}
.cal-desk.whirl .cal-g{transition:transform 2.3s cubic-bezier(.25,.8,.25,1)}
.cal-desk.enter .cal-dial{animation:cal-enter .7s cubic-bezier(.2,1.3,.4,1) both;transform-box:fill-box;transform-origin:center}
.cal-desk.enter .d2{animation-delay:.12s}.cal-desk.enter .d3{animation-delay:.24s}
@keyframes cal-enter{from{opacity:0;transform:scale(.6) rotate(-25deg)}}
.cal-win{animation:cal-win 2.4s ease-in-out infinite}@keyframes cal-win{50%{stroke-opacity:.45;stroke-width:4}}
.cal-wrap.shake{animation:cal-shake .45s}@keyframes cal-shake{20%{transform:translateX(-7px) rotate(-.6deg)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.cal-burst circle{animation:cal-ring 1.1s 1.2s ease-out both;transform-box:fill-box;transform-origin:center}@keyframes cal-ring{from{opacity:1;transform:scale(.4)}to{opacity:0;transform:scale(3)}}
.cal-spark{opacity:0;animation:cal-spark 1.2s 1.25s ease-out both}@keyframes cal-spark{0%{opacity:1;transform:translate(0,0) scale(.4)}70%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.3) rotate(90deg)}}
.cal-dark{opacity:0;animation:cal-dark 4.6s 1s ease-in-out both}@keyframes cal-dark{0%{opacity:0}35%,70%{opacity:.72}100%{opacity:0}}
.cal-ecl>g{opacity:0;animation:cal-inout 5.2s 1s both}@keyframes cal-inout{0%{opacity:0}10%,85%{opacity:1}100%{opacity:0}}@keyframes cal-fadein{to{opacity:1}}
.cal-moon-slide{animation:cal-slide 3.6s 1.1s ease-in-out both}@keyframes cal-slide{0%{transform:translateX(-150px)}50%,62%{transform:translateX(0)}100%{transform:translateX(150px)}}
.cal-corona{opacity:0;animation:cal-corona 3.6s 1.1s both;transform-box:fill-box;transform-origin:center}@keyframes cal-corona{40%{opacity:0;transform:scale(.8)}52%,64%{opacity:1;transform:scale(1.15)}100%{opacity:0}}
.cal-umbra{animation:cal-slide 3.8s 1.1s ease-in-out both}
.cal-blood{animation:cal-blood 3.8s 1.1s both}@keyframes cal-blood{0%{fill:#efeae0}45%,65%{fill:#a8321e}100%{fill:#efeae0}}
.cal-ecl-t{opacity:0;animation:cal-fadein .6s 2.6s both}.cal-ecl{pointer-events:none}
.cal-flame{opacity:0;animation:cal-flame .5s 1.2s ease-in-out infinite alternate both}@keyframes cal-flame{from{opacity:.85;transform:scaleY(.8) scaleX(1.05)}to{opacity:1;transform:scaleY(1.2) scaleX(.9)}}
.cal-pop .cal-stars{display:inline-block;animation:cal-pop .6s cubic-bezier(.2,1.6,.4,1) both}@keyframes cal-pop{from{transform:scale(0) rotate(-30deg)}}
@media (max-width:560px){.form.cal-two{grid-template-columns:1fr 1fr}}
@media (prefers-reduced-motion:reduce){.cal-g{transition:none}.cal-spin,.cal-tw,.cal-ember,.cal-smoke,.cal-sirius,.cal-win,.cal-dial,.cal-wrap.shake{animation:none}.cal-desk.whirl .cal-g{transition:none}}
`;
