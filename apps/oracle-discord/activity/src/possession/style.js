// Possession styles: the Story book on the table, the answer cards and the possessed host.
export const CSS = `
.table.possession{display:flex;align-items:center;justify-content:center;padding:10px}
.pz-book{position:relative;width:min(100%,520px);max-height:100%;overflow:hidden auto;padding:16px 18px 18px;border-radius:6px 14px 14px 6px;color:var(--ink);
  background:radial-gradient(120% 90% at 30% 20%,var(--p1),var(--p2));box-shadow:inset 6px 0 14px rgba(0,0,0,.25),0 10px 30px rgba(0,0,0,.5);font-family:Georgia,"Times New Roman",serif;animation:pz-open .6s cubic-bezier(.3,1.3,.5,1) both}
.pz-title{font-family:var(--display),Georgia,serif;font-size:1.15rem;text-align:center;letter-spacing:.04em;border-bottom:1px solid rgba(0,0,0,.18);padding-bottom:6px;margin-bottom:8px}
.pz-lines{display:flex;flex-direction:column;gap:6px}
.pz-l{margin:0;font-size:1rem;line-height:1.35;font-style:italic}.pz-l.pz-empty{opacity:.45;text-align:center}
.pz-l.new{animation:pz-write 1.8s steps(28) both,pz-glow 2.4s ease-out 1.8s both}
.pz-l.pz-narr{font-style:normal;font-size:.82rem;opacity:.75}.pz-l.pz-ghost{color:color-mix(in srgb,var(--ink) 70%,#3a7fa0)}
.pz-l.pz-truth{font-style:normal;font-size:.86rem;border-left:3px solid rgba(0,0,0,.25);padding-left:6px}.pz-l.pz-truth.new{animation:pz-in .6s ease-out 4.6s both}.pz-l.pz-narr.new{animation:none}
.pz-real{padding:8px 10px;border:1px solid var(--gold);border-radius:10px;margin:6px 0;background:rgba(226,176,74,.08);animation:pz-in .5s ease-out both}.pz-real ul{margin:4px 0 0;padding-left:18px}.pz-real li{margin:2px 0}
.pz-who{padding:8px 10px;border:1px dashed #b8f0ff;border-radius:10px;animation:pz-in .5s ease-out both}
.pz-ask{margin-top:10px;padding:6px 8px;border:1px dashed rgba(0,0,0,.3);border-radius:8px;font-size:.92rem;animation:pz-in .5s ease-out both}
.pz-pl{position:absolute;width:44px;bottom:14px;left:6%;animation:pz-glide 1.8s ease-in-out both;filter:drop-shadow(0 4px 4px rgba(0,0,0,.35))}
.pz-book.done{animation:pz-open .6s both,pz-done 1.6s ease-in-out .6s 2 alternate}
.pz-wisp{position:absolute;width:70px;height:28px;border-radius:50%;background:radial-gradient(closest-side,rgba(184,240,255,.55),transparent);filter:blur(3px);pointer-events:none;animation:pz-wisp 7s ease-in-out infinite}
.pz-wisp.w1{top:12%;left:-10%}.pz-wisp.w2{top:48%;left:-20%;animation-delay:2.3s;animation-duration:9s}.pz-wisp.w3{top:78%;left:-15%;animation-delay:4.6s}
.pz-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0}
.pz-cards .pz-c{display:flex;flex-direction:column;gap:4px}
.pz-cards .c{text-align:left;font-style:italic;animation:pz-flip .45s cubic-bezier(.3,1.3,.5,1) var(--d) both}
.pz-cards .c[disabled]{opacity:.45}.pz-cards .c.mine{outline:2px solid var(--teal)}.pz-cards .struck .c{text-decoration:line-through;opacity:.35}
.pz-cards .pz-x{align-self:flex-start;font-size:.75rem;padding:2px 8px}
.pz-in{display:flex;gap:8px;margin:8px 0}.pz-in input{flex:1;min-width:0;font:inherit;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:rgba(0,0,0,.35);color:inherit}
.pz-clock{float:right;font-variant-numeric:tabular-nums;color:var(--gold2)}.pz-clock.low{color:#ff6b8a;animation:pz-pulse .5s ease-in-out infinite alternate}
.pz-win{padding:8px 10px;border:1px solid #b8f0ff;border-radius:10px;background:rgba(184,240,255,.1);animation:pz-in .5s ease-out both}
.pz-score{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.pz-score span{padding:3px 9px;border:1px solid var(--line);border-radius:999px;font-size:.8rem}.pz-score span.lead{border-color:var(--gold);color:var(--gold2)}
.pz-tale{padding:8px 10px;border:1px solid var(--line);border-radius:10px;margin:6px 0}.pz-tale p{margin:2px 0;font-style:italic}
body.pz-possessed #teller{animation:pz-shudder .11s linear infinite alternate;filter:drop-shadow(0 0 16px rgba(184,240,255,.9)) saturate(.6) brightness(1.15)}
body.pz-possessed .speech,body.pz-possessed #say{text-shadow:0 0 8px rgba(184,240,255,.8)}
@keyframes pz-open{from{transform:perspective(600px) rotateY(-35deg) scale(.9);opacity:0}}
@keyframes pz-write{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes pz-glow{from{text-shadow:0 0 10px rgba(184,240,255,.95)}to{text-shadow:none}}
@keyframes pz-glide{0%{transform:translate(0,0) rotate(-8deg);opacity:0}15%{opacity:1}50%{transform:translate(160px,-14px) rotate(6deg)}100%{transform:translate(320px,0) rotate(-4deg);opacity:0}}
@keyframes pz-wisp{0%{transform:translateX(0);opacity:0}20%{opacity:.8}100%{transform:translateX(640px);opacity:0}}
@keyframes pz-done{to{box-shadow:inset 6px 0 14px rgba(0,0,0,.25),0 0 34px rgba(184,240,255,.7)}}
@keyframes pz-flip{from{transform:rotateY(90deg);opacity:0}}
@keyframes pz-in{from{transform:translateY(-8px);opacity:0}}
@keyframes pz-pulse{to{opacity:.5}}
@keyframes pz-shudder{from{transform:translate(-1px,0) rotate(-.6deg)}to{transform:translate(1px,-1px) rotate(.6deg)}}
@media (prefers-reduced-motion:reduce){.pz-book,.pz-l.new,.pz-pl,.pz-wisp,.pz-cards .c,.pz-ask,.pz-win,.pz-clock,.pz-real,.pz-who{animation:none!important}body.pz-possessed #teller{animation:none}.pz-pl{display:none}}
@media (max-width:520px){.pz-cards{grid-template-columns:1fr}}
`;
