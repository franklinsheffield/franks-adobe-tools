// Alchemist's Lab styles, injected once when the room (or its store preview) opens. Chamber palette from chamber.css.
export const CSS = `
.table.alchemy svg{position:absolute;inset:0;width:100%;height:100%}
.table.alchemy .al-fl{transform-box:fill-box;transform-origin:50% 100%;animation:al-fl 1.1s ease-in-out infinite alternate}
.table.alchemy .al-fl.f1{animation-delay:-.3s}.table.alchemy .al-fl.f2{animation-delay:-.6s}.table.alchemy .al-fl.f3{animation-delay:-.9s}
@keyframes al-fl{from{transform:scale(.9,.95)}to{transform:scale(1.08,1.12)}}
.table.alchemy .al-bub{animation:al-bub 2.4s ease-in infinite}.table.alchemy .al-bub.b2{animation-delay:-1.1s}
@keyframes al-bub{from{transform:translateY(0);opacity:.7}to{transform:translateY(-26px);opacity:0}}
.table.alchemy .al-liq{transition:fill .8s}
.table.alchemy .al-drip{animation:al-drip 1.8s ease-in infinite}@keyframes al-drip{0%,60%{opacity:0;transform:translateY(0)}70%{opacity:1}100%{opacity:0;transform:translateY(22px)}}
.table.alchemy .al-smoke{animation:al-smoke 2.6s ease-out infinite}@keyframes al-smoke{from{opacity:.6;transform:translateY(0)}to{opacity:0;transform:translateY(-14px)}}
.table.alchemy .al-chip{animation:al-in .35s ease-out both}@keyframes al-in{from{opacity:0}}
.table.alchemy .al-won .al-halo{animation:al-glow 1.6s ease-in-out infinite alternate}@keyframes al-glow{from{opacity:.6}to{opacity:1}}
.table.alchemy .al-label{animation:al-in .6s ease-out both}
@media (prefers-reduced-motion:reduce){.table.alchemy *{animation:none!important}}
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
