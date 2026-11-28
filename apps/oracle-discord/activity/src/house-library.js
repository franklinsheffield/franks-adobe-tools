// The House library (Frank 2026-11-28: "can each house have a book section?"). One bookshelf per House, branded to it:
//  - the House handbook (study-houses.js), always on the shelf
//  - one book per game in the House: shelved once you've played it, its foil set by your trophy tier (trophies.js)
//  - the House's reading list: real books the Science is Magic server keeps in its 📚 forums (library.js), chosen by
//    the House's games
// Tapping a book opens its Study pages. Pure HTML builders here; main.js wires taps, sounds and the host's lines.
import { BOOKS as FORUM_BOOKS, ROOM_BOOKS, FORUMS } from "./library.js";
import { tierOf } from "./trophies.js";

/** Each House's shelf: wood, trim and a name for the bookcase, in the House's own style. */
export const SHELVES = {
  oracle: { name: "The Oracle's moonlit shelf", wood: ["#2a1648", "#140a26"], trim: "#FF4FB3", plaque: "Readings, records and every game" },
  alchemist: { name: "Vell's lab bookcase", wood: ["#5a3a1e", "#2c1a0c"], trim: "#E89A55", plaque: "Methods, results, and what went bang" },
  observatory: { name: "Altair's chart cabinet", wood: ["#1a2a4a", "#0a1226"], trim: "#8FB8FF", plaque: "Observing notes and sky charts" },
  parlour: { name: "Madame Rook's locked bookcase", wood: ["#3a1830", "#1a0a16"], trim: "#C3A6FF", plaque: "Methods the mediums hoped you'd never read" },
  scriptorium: { name: "Wren's chained library", wood: ["#4a2a18", "#20100a"], trim: "#E8483B", plaque: "Chained, like the old libraries, so nobody walks off" },
};
/** What each host says in the library. {name}, {n} (books shelved), {total}. */
export const LIB_LINES = {
  oracle: ["My shelf, {name}. {n} of {total} books glow for you. The rest are waiting to be read into being.", "Every book here was a question once, {name}."],
  alchemist: ["The lab library, {name}: {n} of {total} on the shelf. Play a game and its book appears. Cause, then effect.", "Read the method before the experiment, {name}. Always."],
  observatory: ["The chart cabinet, {name}. {n} of {total} charts filled in. Clear skies fill the rest.", "Every chart here was drawn by someone patient, {name}."],
  parlour: ["My locked bookcase, darling. You've opened {n} of {total}. Mediums hated people reading.", "Houdini owned one of the great libraries on magic and spiritualism, {name}. Start yours."],
  scriptorium: ["The chained library, {name}: {n} of {total} books unchained for you. Old libraries chained books to the shelves so nobody walked off with them.", "Mind the chains, {name}. And the ink. It's still wet."],
};

const TIER = ["", "bronze", "silver", "gold", "prism"];
const played = (p, id) => ((p.rooms || {})[id] || {}).plays > 0 || tierOf(p, id) > 0;

/** The House's shelf as data: { handbook, games: [{ room, emoji, name, on, tier }], reading: [{ id, title, forum }] }. */
export function libraryOf(H, p, study) {
  const mine = study.filter((x) => H.rooms === "all" || H.rooms.includes(x.room));
  const games = mine.map((x) => ({ room: x.room, emoji: x.emoji, name: x.name, on: played(p, x.room), tier: TIER[Math.min(tierOf(p, x.room), 4)] }));
  const ids = [...new Set(mine.flatMap((x) => ROOM_BOOKS[x.room] || []))].concat(H.rooms === "all" ? ["kybalion", "hall", "crystal", "tealeaves"] : []);
  const reading = [...new Set(ids)].filter((id) => FORUM_BOOKS[id]).map((id) => ({ id, title: FORUM_BOOKS[id].short, forum: FORUMS[FORUM_BOOKS[id].forum].name }));
  return { games, reading };
}

const spine = (cls, data, emoji, title, i, extra = "") =>
  `<button type="button" class="lb-spine ${cls}" ${data} style="--i:${i}" title="${title}" aria-label="${title}"><i class="lb-band"></i><span class="lb-e">${emoji}</span><b>${title}</b>${extra}</button>`;

/** The whole library panel. handbookTitle from study-houses.js. */
export function libraryHtml(H, p, study, handbookTitle, esc) {
  const S = SHELVES[H.id] || SHELVES.oracle, L = libraryOf(H, p, study), n = L.games.filter((g) => g.on).length;
  const books = [spine("hb", 'data-lib="house"', "📖", esc(handbookTitle), 0),
    ...L.games.map((g, i) => g.on ? spine(`on ${g.tier}`, `data-lib="${g.room}"`, g.emoji, esc(g.name), i + 1)
      : spine("off", `data-lib="${g.room}"`, "🔒", esc(g.name), i + 1, `<small>Play it to shelve this book</small>`))];
  return `<div class="lib" style="--lb-w1:${S.wood[0]};--lb-w2:${S.wood[1]};--lb-trim:${S.trim}">
  <div class="lb-head"><b>📚 ${esc(S.name)}</b><span>${esc(S.plaque)} · ${n} of ${L.games.length} game books shelved</span></div>
  <div class="lb-case"><div class="lb-row">${books.join("")}</div><div class="lb-plank"></div></div>
  <p class="lb-key">🥉 🥈 🥇 The foil on a game's book matches your trophy: bronze, silver, gold, and a prismatic shimmer for a perfect run.</p>
  <div class="lb-read"><b>📜 Reading list</b><span>Real books on this House's subjects, kept in the Science is Magic server's library forums.</span>
    <ul>${L.reading.map((r) => `<li><i>${esc(r.title)}</i> <small>#${esc(r.forum)}</small></li>`).join("")}</ul></div>
  <div class="choices"><button class="c" type="button" id="lib-back">${H.emoji} Back to ${esc(H.name)}</button></div></div>`;
}

export const LIBRARY_CSS = `.lib{display:flex;flex-direction:column;gap:10px}
.lb-head{display:flex;flex-direction:column;gap:2px}.lb-head b{font-family:var(--display);color:var(--lb-trim);letter-spacing:.08em}.lb-head span{font-size:.82rem;opacity:.8}
.lb-case{position:relative;padding:14px 12px 0;border-radius:12px;background:linear-gradient(180deg,var(--lb-w1),var(--lb-w2));border:2px solid color-mix(in srgb,var(--lb-trim) 55%,transparent);box-shadow:inset 0 0 24px rgba(0,0,0,.6)}
.lb-row{display:flex;gap:6px;align-items:flex-end;overflow-x:auto;padding:4px 2px 0;min-height:176px}
.lb-plank{height:12px;margin:0 -12px;border-radius:0 0 10px 10px;background:linear-gradient(180deg,color-mix(in srgb,var(--lb-trim) 35%,#000),#000);box-shadow:0 4px 10px rgba(0,0,0,.6)}
.lb-spine{flex:0 0 46px;height:168px;position:relative;border:0;border-radius:4px 4px 2px 2px;cursor:pointer;color:#fff;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:6px;
  background:linear-gradient(90deg,rgba(0,0,0,.35),transparent 30%,rgba(255,255,255,.12) 50%,transparent 70%,rgba(0,0,0,.4)),hsl(calc(var(--i)*47) 45% 30%);
  box-shadow:0 2px 0 rgba(0,0,0,.5);transform-origin:50% 100%;animation:lb-in .5s cubic-bezier(.2,.8,.3,1.2) both;animation-delay:calc(var(--i)*45ms);transition:transform .18s ease}
.lb-spine:nth-child(3n){height:154px}.lb-spine:nth-child(4n+1){height:160px}
.lb-spine b{writing-mode:vertical-rl;font-size:.72rem;letter-spacing:.04em;line-height:1.1;max-height:118px;overflow:hidden;text-overflow:ellipsis}
.lb-spine .lb-e{font-size:1rem}.lb-spine .lb-band{position:absolute;left:0;right:0;top:26px;height:3px;background:var(--lb-trim);opacity:.7}
.lb-spine small{display:none}
.lb-spine:hover,.lb-spine:focus-visible{transform:translateY(-14px) rotate(-2deg)}
.lb-spine.pull{animation:lb-pull .45s ease-in both}
.lb-spine.hb{flex-basis:56px;background:linear-gradient(90deg,rgba(0,0,0,.35),transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%,rgba(0,0,0,.4)),color-mix(in srgb,var(--lb-trim) 70%,#000)}
.lb-spine.off{filter:grayscale(.9) brightness(.55)}.lb-spine.off:hover{transform:translateY(-4px)}
.lb-spine.bronze .lb-band{background:#c98a4b;opacity:1}.lb-spine.silver .lb-band{background:#dfe6ee;opacity:1}.lb-spine.gold .lb-band{background:#ffd34d;opacity:1;box-shadow:0 0 6px #ffd34d}
.lb-spine.prism .lb-band{opacity:1;background:linear-gradient(90deg,#ff4fb3,#ffd34d,#5cff7a,#3d8bff,#c063ff);background-size:200% 100%;animation:lb-shim 2.4s linear infinite}
.lb-key{font-size:.78rem;opacity:.75;margin:0}
.lb-read{border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:rgba(22,16,48,.55)}.lb-read b{color:var(--lb-trim)}.lb-read span{display:block;font-size:.8rem;opacity:.8}
.lb-read ul{margin:6px 0 0;padding-left:18px}.lb-read li{margin:3px 0;font-size:.86rem}.lb-read small{opacity:.7}
@keyframes lb-in{from{opacity:0;transform:translateY(-30px) rotate(-6deg)}to{opacity:1;transform:none}}
@keyframes lb-pull{to{transform:translateY(-22px) scale(1.06);opacity:.2}}
@keyframes lb-shim{to{background-position:200% 0}}
@media (prefers-reduced-motion:reduce){.lb-spine,.lb-spine.pull,.lb-spine.prism .lb-band{animation:none}.lb-spine:hover{transform:none}}`;
