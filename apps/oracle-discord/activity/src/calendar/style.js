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
@media (max-width:560px){.form.cal-two{grid-template-columns:1fr 1fr}}
@media (prefers-reduced-motion:reduce){.cal-g{transition:none}.cal-spin,.cal-tw,.cal-ember,.cal-smoke,.cal-sirius{animation:none}}
`;
