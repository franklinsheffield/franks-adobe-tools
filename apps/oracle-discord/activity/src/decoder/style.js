// Decoder room styles, injected once when the room opens (Chamber palette from chamber.css :root).
export const CSS = `
.dec-runic{font-family:"dec-runic","Noto Sans Runic",serif}.dec-ogham{font-family:"dec-ogham",serif}.dec-egy{font-family:"dec-egy","Noto Sans Egyptian Hieroglyphs",serif}
.table.decoder{background:radial-gradient(70% 60% at 50% 45%,rgba(46,30,104,.55),transparent 75%)}
.dec-board{position:absolute;inset:0 0 22px;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;padding:10px 12px;text-align:center}
.dec-board>:first-child{margin-top:auto}.dec-board>:last-child{margin-bottom:auto}
.dec-home{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:min(100%,460px)}
.dec-medal{border:1px solid var(--line);border-radius:12px;background:rgba(22,16,48,.75);padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:2px}
.dec-medal b{font-family:var(--display);font-size:.78rem;color:var(--gold2);letter-spacing:.06em}.dec-medal small{color:var(--muted);font-size:.72rem}
.dec-glyph{font-size:1.9rem;line-height:1.2;color:var(--gold);min-height:44px;display:flex;align-items:center;text-shadow:0 0 12px rgba(226,176,74,.45)}
.dec-intro p{margin:6px auto;max-width:440px;font-size:.9rem}.dec-intro small{color:var(--muted)}
.dec-big{font-size:2.6rem;color:var(--gold);text-shadow:0 0 16px rgba(226,176,74,.5);display:flex;justify-content:center;gap:8px;align-items:flex-end}
.dec-learn{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:560px}
.dec-card{width:92px;border:1px solid var(--gold);border-radius:10px;background:rgba(22,16,48,.85);padding:6px 4px;display:flex;flex-direction:column;align-items:center;animation:dec-in .4s both}
.dec-card span{font-size:2.1rem;line-height:1.15;color:var(--gold2)}.dec-card b{color:var(--teal);font-size:1.05rem}.dec-card small{color:var(--muted);font-size:.66rem;line-height:1.25}
.dec-card:nth-child(2){animation-delay:.06s}.dec-card:nth-child(3){animation-delay:.12s}.dec-card:nth-child(4){animation-delay:.18s}.dec-card:nth-child(5){animation-delay:.24s}.dec-card:nth-child(n+6){animation-delay:.3s}
@keyframes dec-in{from{opacity:0;transform:translateY(8px) scale(.95)}}
.dec-lc-key{width:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 12px;font-size:.72rem;color:var(--muted)}.dec-lc-key b{color:var(--gold2)}
.dec-note{color:var(--muted);font-style:italic}
.dec-strip{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;max-width:100%;padding:8px 10px}
.dec-strip.ogham{gap:0}.dec-strip.futhark,.dec-strip.egyptian{gap:2px}.dec-strip.maya{gap:12px}
.dec-strip.cartouche{border:3px solid var(--gold);border-radius:999px;padding:8px 22px;box-shadow:inset 0 0 14px rgba(226,176,74,.25),0 0 14px rgba(226,176,74,.2);position:relative}
.dec-strip.cartouche::after{content:"";position:absolute;right:-9px;top:15%;bottom:15%;width:4px;background:var(--gold);border-radius:2px}
.dec-strip.lc{flex-direction:column;align-items:center;gap:2px}.dec-strip.lc .dec-cell{flex-direction:row;gap:10px;min-width:220px;justify-content:space-between}
.dec-strip.lc em{font-style:normal;font-family:var(--display);color:var(--muted);font-size:.72rem;width:70px;text-align:left}
.dec-cell{display:flex;flex-direction:column;align-items:center;min-width:26px;border-radius:6px;padding:0 1px;transition:background .2s}
.dec-cell span,.dec-cell.sep{font-size:2.5rem;line-height:1.15;color:var(--gold2)}.dec-strip.egyptian .dec-cell span{font-size:2.7rem}.dec-strip.long .dec-cell span{font-size:1.9rem}.dec-strip.egyptian.long .dec-cell span{font-size:2.1rem}.dec-strip.long .dec-cell b{font-size:.8rem}
.dec-cell.sep{color:var(--muted)}.dec-strip.ogham .dec-cell{min-width:0}.dec-strip.ogham .dec-cell span,.dec-strip.ogham .dec-cell.sep{font-size:2.4rem}
.dec-cell b{min-width:18px;border-top:2px solid var(--line);color:var(--teal);font-size:.95rem;line-height:1.5}
.dec-cell b i{color:var(--muted);font-style:normal;opacity:.75}
.dec-cell.now{background:rgba(102,224,200,.12)}.dec-cell.now b{border-color:var(--teal)}
.dec-cell.bad{animation:dec-shake .35s}.dec-cell.bad b{border-color:var(--pink)}
@keyframes dec-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.m-fill{fill:var(--gold)}.m-ink{stroke:var(--gold)}.m-num{filter:drop-shadow(0 0 6px rgba(226,176,74,.35))}
.dec-round{font-family:var(--display);color:var(--gold2);letter-spacing:.08em}
.dec-progress{color:var(--muted);font-size:.78rem}
.dec-book{border:1px dashed var(--gold);border-radius:10px;padding:6px 10px;background:rgba(7,5,15,.85);font-size:.8rem;max-width:540px}
.dec-book b{font-family:var(--display);color:var(--gold);letter-spacing:.1em;font-size:.72rem}
.dec-book div{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;margin-top:4px}.dec-book span{white-space:nowrap;color:var(--teal)}
.dec-book i{font-style:normal;font-size:1.35rem;color:var(--gold2);margin-right:3px;vertical-align:-3px}
.dec-done{font-size:.95rem}.dec-done b{color:var(--gold2);letter-spacing:.04em}
.dec-stars{color:var(--gold);letter-spacing:2px;font-size:1rem}.dec-stars i{font-style:normal;color:var(--line)}
.dec-reward{border:1px solid var(--gold);border-radius:12px;background:rgba(22,16,48,.9);padding:8px 14px;display:flex;flex-direction:column;gap:2px;animation:dec-in .5s both;font-size:.88rem}
.dec-reward small{color:var(--muted);font-size:.7rem}.dec-reward .dec-stars{font-size:1.5rem}
.dec-levels{display:flex;flex-direction:column;gap:6px;margin:6px 0}
.dec-lv{display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left}.dec-lv[disabled]{opacity:.5}
.dec-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:6px;margin:6px 0}
.dec-tiles.nums{grid-template-columns:repeat(10,minmax(0,1fr))}
.dec-tile{padding:8px 2px;font-size:1rem;font-weight:700;min-width:0}
.dec-q p{margin:4px 0 8px;font-weight:600}.dec-q{display:flex;flex-direction:column;gap:6px}.dec-q .c{text-align:left}
.dec-write{font-size:2.6rem;color:var(--gold2);text-shadow:0 0 14px rgba(226,176,74,.5);padding:8px 24px;word-break:break-all;max-width:100%}
.dec-write.cartouche{border:3px solid var(--gold);border-radius:999px}.dec-write small{font-size:.9rem;color:var(--muted);font-family:var(--body)}
@media (max-width:560px){.dec-cell span,.dec-cell.sep,.dec-strip.long .dec-cell span,.dec-strip.egyptian .dec-cell span{font-size:1.6rem}.dec-tiles.nums{grid-template-columns:repeat(5,minmax(0,1fr))}.dec-card{width:78px}}
`;
