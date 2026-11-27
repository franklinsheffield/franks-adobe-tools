// Grimoire Memory: a room of the Oracle Chamber. A matching card game: every pair is a symbol (a rune, an Ogham
// letter, a hieroglyph, a Maya numeral or an alchemy sign) and its meaning. Turn two cards; a pair stays up and the
// Oracle tells you what it means. Three tiers, six decks, stars for few misses, combos for pairs in a row.
// Mounted via ROOMS (main.js): room.open(ctx), codexHtml, shop.
import { DECKS, deckById, ALL_CARDS, cardByKey, WHERE } from "./deck.js";
import { TIERS, TITLES, keyOf, room as mem, learnedCount, titleOf, nextTitle, starsOf, starsFor, deal, flip, hide, peek, settle, scoreOf } from "./engine.js";
import { HOOKS, TIPS } from "./guide.js";
import { shop, backOf, backStyle, backHtml, fanHtml } from "./shop.js";
import { ensureStyle } from "./style.js";
import { SFX } from "./sfx.js";
import { glyphSvg } from "../alchemy/glyphs.js";
import { mayaSvg } from "../decoder/room.js";

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const MISS = ["Not a pair. They slide back into the dark.", "No match. Remember where they were.", "Those two have never met. Back they go.", "Wrong pair. The cards shuffle their feet.", "Close… but no. Face down again."];
const COMBO = ["", "", "Two in a row!", "Three in a row! The ink glows.", "Four in a row! The grimoire hums.", "Five in a row! Are you peeking?"];

const styleOnce = ensureStyle;

/** The symbol itself, at a size, for cards, the table and the guide. */
export function symHtml(c, size, esc) {
  if (c.kind === "svg") return glyphSvg(c.g, size);
  if (c.kind === "maya") return mayaSvg(c.g, size);
  return `<span class="gm-g ${c.font}">${esc(c.g)}</span>`;
}
const DECK_EMOJI = Object.fromEntries(DECKS.map((d) => [d.id, d.emoji]));
function faceHtml(c, side, esc, mixed) {
  const tag = mixed ? `<span class="gm-tag">${DECK_EMOJI[c.deck]}</span>` : "";
  if (side === "s") return `<div class="gm-face s">${tag}${symHtml(c, 40, esc)}</div>`;
  return `<div class="gm-face m${c.kind === "maya" ? " maya" : ""}">${tag}<b>${esc(c.name)}</b>${c.gloss ? `<small>${esc(c.gloss)}</small>` : ""}${c.sub && c.kind === "glyph" ? `<i>${esc(c.sub)}</i>` : ""}</div>`;
}

export function guideHtml(id, esc) {
  const D = deckById(id), cards = id === "mixed" ? [] : D.cards;
  return `<div class="gm-guide"><h3>📖 ${esc(D.name)}: study guide</h3>
    <details open><summary>About this deck</summary><p>${esc(D.blurb)}</p>${WHERE[id] ? `<p><i>${esc(WHERE[id])}</i></p>` : ""}</details>
    <details open><summary>Memory hooks</summary>${HOOKS[id].map((t) => `<p>${glyphFont(t)}</p>`).join("")}</details>
    ${cards.length ? `<details><summary>All ${cards.length} pairs</summary><div class="gm-gtable">${cards.map((c) => `<span><i>${symHtml(c, 26, esc)}</i><em><b>${esc(c.name)}</b>${c.gloss ? ` ${esc(c.gloss)}` : ""}${c.sub && c.kind === "glyph" ? ` · <u>${esc(c.sub)}</u>` : ""}</em></span>`).join("")}</div></details>` : ""}
    <details><summary>How to remember more</summary>${TIPS.map((t) => `<p>${t}</p>`).join("")}</details></div>`;
}
const glyphFont = (t) => t.replace(/[ᚠ-᛿]+/g, (m) => `<span class="dec-runic">${m}</span>`)
  .replace(/[ -᚟]+/g, (m) => `<span class="dec-ogham">${m}</span>`)
  .replace(/[\u{13000}-\u{1342F}]+/gu, (m) => `<span class="dec-egy">${m}</span>`);
const starStr = (n, of = 3) => `<span class="gm-stars">${"★".repeat(n)}<span class="off">${"★".repeat(of - n)}</span></span>`;

export const room = {
  id: "memory", label: "Grimoire Memory", emoji: "🃏", row: "cards",
  blurb: "A matching card game: pair runes, glyphs and alchemy signs with their meanings",
  shop,
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl, reduced } = ctx;
    styleOnce();
    const prog = () => mem(state.prog);
    const look = () => backOf(state.prog);
    const idleTable = () => { tableEl.className = "table gm-table"; tableEl.innerHTML = fanHtml(look()).replace('class="gm-fan"', 'class="gm-fan breathe"'); };
    const stats = () => { const n = learnedCount(state.prog), t = titleOf(n), nx = nextTitle(n);
      return `<div class="cx-top"><b>🃏 ${esc(t.name)}</b> · ${n} / ${ALL_CARDS.length} signs learned${nx ? ` · ${nx.at - n} more to ${esc(nx.name)}` : ""}</div>`; };
    const toggleGuide = (id, btn) => { const rb = $("reading-body"), on = !rb.querySelector(".gm-guide");
      rb.innerHTML = on ? guideHtml(id, esc) : ""; if (btn) btn.textContent = on ? "📖 Close study guide" : btn.dataset.label;
      if (on) rb.querySelector(".gm-guide").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); };

    function lobby(first) {
      clearReading(); cap("🃏 Grimoire Memory"); idleTable();
      say(first && !prog().plays
        ? `Grimoire Memory, ${state.name}. I deal the cards face down: every symbol has a twin that tells you what it means. Turn two at a time. Find a pair and it stays up, and I'll tell you its story. Every miss snuffs a candle; keep them lit for stars.`
        : pick([`Shall we shuffle, ${state.name}?`, `The cards remember you, ${state.name}. Do you remember them?`, `Pick a tier, ${state.name}. I'll pretend not to look.`]));
      ui(`${stats()}<div class="gm-levels">${TIERS.map((T) => { const got = DECKS.reduce((a, D) => a + starsOf(state.prog, T, D), 0);
          return `<button class="c level" type="button" data-t="${T.n}"><b>${"🃏".repeat(T.n)} ${esc(T.name)}</b><span>${esc(T.what)} · points ×${T.mult} · ${got} / ${DECKS.length * 3} ★</span></button>`; }).join("")}</div>
        <div class="note">Every pair is a real sign and its real meaning, from the Decoder and the Alchemist's Lab. Each miss snuffs a candle. Clear the board with half your candles lit for 3 ★.</div>
        <div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("ui").querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => decks(TIERS[+b.dataset.t - 1])));
      $("back").onclick = greet;
    }

    function decks(T) {
      clearReading(); cap(`🃏 ${T.name}`); idleTable();
      say(T.n === 1 ? "Apprentice. Six pairs, and I'll let you peek for three seconds. Which deck?" : T.n === 2 ? "Adept. Eight pairs, a blink of a peek. Which deck?" : "Master. Ten pairs, no peeking, no mercy. Which deck?");
      ui(`<div class="gm-decks">${DECKS.map((D) => `<button class="c" type="button" data-d="${D.id}"><b>${D.emoji} ${esc(D.name)}</b><span>${starStr(starsOf(state.prog, T, D))} · ${D.id === "mixed" ? "all decks" : `${learnedCount(state.prog, D.id)} / ${D.cards.length} learned`}</span></button>`).join("")}</div>
        <div class="choices">${DECKS.map((D) => `<button class="c small" type="button" data-g="${D.id}" data-label="📖 ${esc(D.name)}">📖 ${esc(D.name)}</button>`).join("")}</div>
        <div class="choices"><button class="c" type="button" id="gm-lobby">↩ Choose a tier</button></div>`);
      $("ui").querySelectorAll("[data-d]").forEach((b) => (b.onclick = () => play(T, deckById(b.dataset.d))));
      $("ui").querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => toggleGuide(b.dataset.g, b)));
      $("gm-lobby").onclick = () => lobby(false);
    }

    // ---- the reading table during a game: found pairs in slots, and the candles ----
    const candleRow = (g, snuff = -1) => `<div class="gm-candles" aria-label="${g.candles} of ${g.of} candles lit">${Array.from({ length: g.of }, (_, i) =>
      `<span class="gm-candle${i >= g.candles ? (i === snuff ? " snuff" : " out") : ""}" style="--i:${i}"><i class="gm-flame"></i><b></b></span>`).join("")}</div>`;
    const slots = (g, fresh) => `<div class="gm-slots" style="--n:${g.pairs.length}">${g.pairs.map((_, i) => { const key = g.found[i]; if (!key) return `<div class="gm-slot"></div>`;
      const c = cardByKey(key); return `<div class="gm-slot got${key === fresh ? " new" : ""}"><span class="gm-sym">${symHtml(c, 34, esc)}</span><b>${esc(c.name)}</b></div>`; }).join("")}</div>`;
    const drawTable = (g, { fresh = null, snuff = -1 } = {}) => { tableEl.className = "table gm-table play";
      tableEl.innerHTML = `<div class="gm-tbl"><div class="gm-tbl-h">Pairs found · ${g.matched} / ${g.pairs.length}</div>${slots(g, fresh)}${candleRow(g, snuff)}</div>
        ${fresh ? `<div class="gm-spark">${Array.from({ length: 10 }, (_, i) => `<i style="--x:${10 + i * 8.5}%;--d:${(i % 5) * 80}ms"></i>`).join("")}</div>` : ""}`; };

    function play(T, D) {
      const g = deal(D, T, prog().learned), mixed = D.id === "mixed";
      let lock = true, timer = null;
      clearReading(); cap(`${D.emoji} ${D.name} · ${T.name}`); drawTable(g);
      const top = () => `<span>🕯️ <b>${g.candles}</b> / ${g.of}</span><span>pairs <b>${g.matched} / ${g.pairs.length}</b></span><span>${starStr(starsFor(g.candles, g.of))}</span>${g.combo > 1 ? `<span class="gm-combo">combo ×${g.combo}</span>` : ""}`;
      ui(`<div class="gm-bar"><div class="gm-top" id="gm-top">${top()}</div><div class="gm-tools"><button class="c small" type="button" id="gm-guide" data-label="📖 Guide">📖 Guide</button><button class="c small" type="button" id="gm-redeal">↻ Deal again</button><button class="c small" type="button" id="gm-leave">✕ Leave</button></div></div>
        <div class="gm-board" id="gm-board" style="--cols:${T.cols};--cols-sm:${T.colsSm}">${g.cards.map((x) => { const c = cardByKey(x.key);
          return `<button class="gm-card" type="button" data-i="${x.i}" style="--i:${x.i};${backStyle(look())}" aria-label="Face-down card"><div class="gm-in"><div class="gm-back">${backHtml(look())}</div>${faceHtml(c, x.side, esc, mixed)}</div></button>`; }).join("")}</div>`);
      const el = (i) => $("gm-board").querySelector(`[data-i="${i}"]`);
      const sync = () => { for (const x of g.cards) { const e = el(x.i); e.classList.toggle("up", x.up); e.classList.toggle("done", x.done);
        e.setAttribute("aria-label", x.up || x.done ? (x.side === "s" ? "Symbol card" : "Meaning: " + cardByKey(x.key).name) : "Face-down card"); }
        $("gm-top").innerHTML = top(); };
      $("gm-guide").onclick = () => toggleGuide(D.id, $("gm-guide"));
      $("gm-redeal").onclick = () => { clearTimeout(timer); play(T, D); };
      $("gm-leave").onclick = () => { clearTimeout(timer); decks(T); };
      SFX.deal(g.cards.length);

      const begin = () => { lock = false; say(pick([`Your turn. Two cards at a time. Every miss snuffs a candle.`, `Turn any two. You have ${g.of} candles.`, `Go on. Find the twins before the candles burn out.`])); };
      const dealt = reduced ? 0 : g.cards.length * 45 + 500;
      if (T.peek) {
        say(`Look closely… you have ${T.peek / 1000} seconds.`);
        timer = setTimeout(() => { $("gm-board").classList.add("peeking"); peek(g, true); sync(); SFX.peek();
          timer = setTimeout(() => { peek(g, false); sync(); $("gm-board").classList.remove("peeking"); timer = setTimeout(begin, 450); }, T.peek); }, dealt);
      } else timer = setTimeout(begin, dealt);

      $("gm-board").onclick = (e) => {
        const b = e.target.closest(".gm-card"); if (!b || lock) return;
        const r = flip(g, +b.dataset.i); if (r === "ignored") return;
        SFX.flip(); sync();
        if (r === "first") return;
        if (r === "miss" || r === "out") {
          const [i, j] = g.open; lock = true; SFX.miss(); setTimeout(() => SFX.snuff(), 150); drawTable(g, { snuff: g.candles });
          for (const k of [i, j]) { const x = el(k); x.classList.remove("miss"); void x.offsetWidth; x.classList.add("miss"); }
          if (r === "out") { say("The last candle gutters out…"); timer = setTimeout(() => finish(T, D, g), 1300); return; }
          say(g.candles <= 2 ? `${g.candles === 1 ? "One candle left" : "Two candles left"}. Careful now.` : pick(MISS));
          timer = setTimeout(() => { for (const k of [i, j]) el(k).classList.remove("miss"); hide(g); sync(); lock = false; }, 1000);
          return;
        }
        // a pair
        const c = cardByKey(g.cards[+b.dataset.i].key);
        setTimeout(() => SFX.match(g.combo), 180);
        drawTable(g, { fresh: c.key });
        say((COMBO[Math.min(g.combo, COMBO.length - 1)] ? COMBO[Math.min(g.combo, COMBO.length - 1)] + " " : "") + c.fact);
        if (r === "won") { lock = true; timer = setTimeout(() => finish(T, D, g), 1100); }
      };
    }

    const logHtml = (g) => `<div class="gm-log"><h3>${g.found.length ? "Pairs you found" : "No pairs this time"}</h3>${g.found.map((key) => { const c = cardByKey(key);
      return `<div class="gm-pair"><div class="gm-sym">${symHtml(c, 38, esc)}</div><p><b>${esc(c.name)}</b>${c.gloss ? ` · ${esc(c.gloss)}` : ""}<br>${esc(c.fact)}</p></div>`; }).join("")}</div>`;

    function finish(T, D, g) {
      const before = learnedCount(state.prog), r = settle(state.prog, g, T, D);
      const aw = award(r.xp, r.essence); saveProgress(); showStats();
      ctx.trophy?.("memory", T.n, { won: !g.lost, perfect: r.stars === 3 }); // Trophy Case (trophies.js)
      const after = learnedCount(state.prog), t = titleOf(after), titled = titleOf(before).name !== t.name;
      const box = $("box"); if (box) box.scrollTop = 0;
      $("reading-body").innerHTML = logHtml(g);
      if (g.lost) {
        peek(g, true); for (const x of g.cards) { const e = $("gm-board").querySelector(`[data-i="${x.i}"]`); e.classList.add("up"); }
        drawTable(g);
        say(pick(["Darkness. The cards keep their secrets this time. Look them over, then relight the candles.", "All the candles are out. Every pair is shown now: study them and try again."]));
      } else {
        $("gm-board").classList.add("won"); SFX.win();
        tableEl.className = "table gm-table"; tableEl.innerHTML = `<div class="gm-show"><div class="gm-trophy">🏆</div><b>${esc(D.name)} · ${esc(T.name)}</b><small>${g.pairs.length} pairs · ${g.candles} of ${g.of} candles still lit · best combo ×${g.bestCombo}</small></div>
          <div class="gm-spark">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${5 + i * 6.6}%;--d:${(i % 7) * 90}ms"></i>`).join("")}</div>`;
        for (let i = 0; i < r.stars; i++) setTimeout(() => SFX.star(i), 550 + i * 350);
        say(r.stars === 3 ? pick(["Three stars, and the candles barely flickered.", "Flawless enough. The scribes of Thebes would hire you.", "Three stars! I may need to start cheating."])
          : r.stars === 2 ? pick(["Two stars. Very respectable. Keep more candles lit next time.", "Well done. The cards are starting to trust you."])
          : pick(["Cleared, by candle stub! One star.", "Done, with the wax running low. One star."]));
      }
      const bits = [`<b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>`];
      if (!g.lost) bits.push(`score ${r.score}`);
      if (r.fresh.length) bits.push(`${r.fresh.length} new sign${r.fresh.length === 1 ? "" : "s"} learned`);
      if (r.newStars && !r.first) bits.push("new best");
      ui(`${g.lost ? "" : `<div class="gm-result"><div class="gm-big">${Array.from({ length: 3 }, (_, i) => `<span style="--i:${i}"${i < r.stars ? "" : ' class="gm-stars"'}>${i < r.stars ? "⭐" : "☆"}</span>`).join("")}</div></div>`}
        <div class="reward"><div>${bits.join(" · ")}</div>${titled ? `<div class="up">🃏 Memory title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="choices"><button class="c main" type="button" id="gm-again">${g.lost ? "🕯️ Relight and deal again" : "🃏 Deal again"}</button>${!g.lost && T.n < 3 ? `<button class="c" type="button" id="gm-up">⬆ Try ${esc(TIERS[T.n].name)}</button>` : ""}<button class="c" type="button" id="gm-decks">📚 Another deck</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
        ${g.lost ? `<div class="gm-board" id="gm-board" style="--cols:${T.cols};--cols-sm:${T.colsSm}">${$("gm-board").innerHTML.replace(/ miss"/g, '"')}</div>` : ""}`);
      if (titled || aw.rankUp) chime(2);
      $("gm-again").onclick = () => play(T, D);
      if ($("gm-up")) $("gm-up").onclick = () => play(TIERS[T.n], D);
      $("gm-decks").onclick = () => decks(T); $("back").onclick = greet;
    }

    lobby(true);
  },
};

/** For the Codex page: signs learned, by deck. */
export function memoryCodex(prog, esc) {
  const r = mem(prog);
  return DECKS.filter((D) => D.id !== "mixed").map((D) => { const got = D.cards.filter((c) => r.learned.includes(c.key));
    return `<div class="cx"><div class="cx-h"><span>🃏 Memory: ${esc(D.name)}</span><span class="note">${got.length} / ${D.cards.length}</span></div>
    <div class="bar"><i style="width:${(got.length / D.cards.length) * 100}%"></i></div></div>`; }).join("");
}
export { TITLES };
