// The Rogues' Gallery: the Séance Parlour's progression room. Three parts: the Gallery (20 pairs of claimant and
// exposer), the Final Séance (earn B-E-L-I-E-V-E, then decode "Rosabelle, believe" in the Houdinis' code: the
// House's Star Crown) and the Method Book (everything you've uncovered in the Parlour, in one book).
import { PAIRS, pairState, portraitsLit, pairsDone, settleGallery, PAIR_PAY, ALL_PAY } from "./gallery.js";
import { MILESTONES, lettersEarned, allEarned, finaleDone, solveFinale, encodeLetter, CROWN_PAY, CURTAIN_CALL } from "./finale.js";
import { PARLOUR_SECRETS } from "./secrets.js";
import { CLASSES, METHODS, CASES } from "../casefiles/data.js";
import { room as cfRoom } from "../casefiles/logic.js";
import { trickOf } from "../workshop/data.js";
import { repertoire } from "../workshop/logic.js";
import { room as bkRoom, billing } from "../bookings/logic.js";
import { venueOf } from "../bookings/bill.js";
import { CODE } from "../mentalist/data.js";
import { addTokens } from "../hosts/tokens.js";
import { host } from "../hosts/index.js";
import * as sfx from "../seance/sfx.js";
import { page, coins } from "../flametest/sfx.js";

const CSS = `
.table.gallery { display:flex; align-items:center; justify-content:center; background:#12040d; } .table.gallery svg { width:100%; height:100%; }
.gl-lit { animation: gl-lit 1.2s ease-out both; } @keyframes gl-lit { from { opacity:0 } }
.gl-candle { animation: gl-flick 1.1s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; } @keyframes gl-flick { to { transform: scale(.9,1.1); opacity:.8 } }
.gl-letter { animation: gl-letter 2.4s ease-in-out infinite; } @keyframes gl-letter { 50% { opacity:.6 } }
.gl-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap:8px; margin:8px 0; }
.gl-pair { display:grid; grid-template-columns: 1fr 1fr; gap:6px; border:1px solid #ffffff22; border-radius:12px; padding:8px; background:#00000033; } .gl-pair.done { border-color:#E2B04A; box-shadow:0 0 10px #E2B04A55 }
.gl-pair div { font-size:.82em; line-height:1.3 } .gl-pair b { display:block } .gl-pair .off { opacity:.4 }
.gl-code { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; } .gl-code span { background:#ffffff10; border-radius:8px; padding:4px 8px; font-family:Georgia,serif }
.gl-book h4 { margin:10px 0 4px } .gl-book div { font-size:.88em }
.gl-credits div { margin:4px 0 } .gl-credits { animation: gl-roll 1s ease-out both } @keyframes gl-roll { from { transform: translateY(30px); opacity:0 } }
@media (prefers-reduced-motion: reduce) { .gl-lit, .gl-candle, .gl-letter, .gl-credits { animation:none !important } }`;
const styleOnce = () => { if (document.getElementById("gl-style")) return; const s = document.createElement("style"); s.id = "gl-style"; s.textContent = CSS; document.head.append(s); };

/** The gallery wall: 40 frames in 4 rows; lit frames glow gold, dark ones are empty. */
export function wallSvg(p) {
  const frames = PAIRS.flatMap((x, i) => { const s = pairState(p, x), col = (i % 5) * 62 + 12, row = Math.floor(i / 5) * 56 + 14;
    return [[s.a, col], [s.b, col + 28]].map(([on, cx]) => `<g><rect x="${cx}" y="${row}" width="24" height="32" rx="2" fill="${on ? "#2a1a10" : "#0c0610"}" stroke="${on ? "#E2B04A" : "#4a2a40"}" stroke-width="2"/>${on ? `<g class="gl-lit"><circle cx="${cx + 12}" cy="${row + 12}" r="5" fill="#d9b8a0"/><path d="M${cx + 4} ${row + 30}q0 -10 8 -10q8 0 8 10z" fill="#3a2040"/></g>` : `<text x="${cx + 12}" y="${row + 21}" font-size="9" text-anchor="middle" fill="#4a2a40">?</text>`}</g>`); }).join("");
  return `<svg viewBox="0 0 320 240" role="img" aria-label="The Rogues' Gallery wall"><rect width="320" height="240" fill="#1a0814"/><rect y="226" width="320" height="14" fill="#2a1208"/>${frames}</svg>`;
}
/** The Final Séance table: one candle, and the seven letters, lit as they're earned. */
export function finaleSvg(p, solved = false) {
  const got = lettersEarned(p);
  return `<svg viewBox="0 0 320 240" role="img" aria-label="The Final Séance"><rect width="320" height="240" fill="#0a0410"/><ellipse cx="160" cy="170" rx="130" ry="36" fill="#3a1a10" stroke="#5a2a14" stroke-width="3"/>
  <rect x="153" y="118" width="14" height="40" rx="2" fill="#efe6d2"/><path class="gl-candle" d="M160 92c10 12 8 22 0 24c-8 -2 -10 -12 0 -24z" fill="#FFB347"/>
  ${"BELIEVE".split("").map((c, i) => `<text class="${got[i] ? "gl-letter" : ""}" style="animation-delay:${i * 0.3}s" x="${52 + i * 36}" y="190" font-size="26" text-anchor="middle" font-family="Georgia,serif" fill="${got[i] ? "#FFE3A3" : "#3a2040"}">${got[i] ? c : "·"}</text>`).join("")}
  ${solved ? `<text x="160" y="56" font-size="22" text-anchor="middle" font-family="Georgia,serif" fill="#FFE3A3" class="gl-lit">Rosabelle, believe</text><text x="160" y="80" font-size="11" text-anchor="middle" fill="#cfc6d8" font-style="italic" font-family="Georgia,serif">a message in a code, decoded by you</text>` : ""}</svg>`;
}

export const roguesgallery = {
  id: "roguesgallery", label: "The Rogues' Gallery", emoji: "🖼️",
  blurb: "Claimants and the people who caught them, the Final Séance, and your Method Book",
  open(ctx) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, chime, greet, tableEl } = ctx;
    styleOnce(); const P = () => state.prog, rook = () => host().id === "parlour";
    const draw = (svg) => { tableEl.className = "table gallery"; tableEl.innerHTML = svg; };
    function payout() { const r = settleGallery(P()); if (r.keys) addTokens(P(), host(), r.keys);
      if (r.fresh.length) ctx.trophy?.("roguesgallery", 1, { won: true, perfect: false }); // Trophy Case: a pair
      if (r.keys) ctx.trophy?.("roguesgallery", 2, { won: true, perfect: true }); // the whole wall
      if (r.gems || r.keys) { saveProgress(); showStats(); coins(); } return r; }
    function lobby(first) {
      clearReading(); cap("🖼️ The Rogues' Gallery"); draw(wallSvg(P())); const r = payout(), n = pairsDone(P());
      say(r.fresh.length ? `${r.fresh.length} new pair${r.fresh.length > 1 ? "s" : ""} on the wall! +💎 ${r.gems}${r.keys ? ` and 🗝️ ${r.keys} for the whole gallery` : ""}.`
        : first ? (rook() ? `My old colleagues, ${state.name}, each beside the person who caught them. I knew some of them. Don't ask which.` : `Every claimant here hangs beside the person who exposed them. Solve their cases to light the portraits.`)
        : "The portraits watch you. Politely.");
      ui(`<div class="cx-top"><b>🖼️ Rogues' Gallery</b> · ${portraitsLit(P())} / ${PAIRS.length * 2} portraits · ${n} / ${PAIRS.length} pairs</div>
        <div class="note">A claimant lights when you solve their case in the Case Files; the exposer lights too, or when you name them in the Séance. Each finished pair pays 💎 ${PAIR_PAY}; the whole gallery pays 🗝️ ${ALL_PAY}.</div>
        <div class="choices"><button class="c main" type="button" id="gl-wall">🖼️ See the pairs</button><button class="c" type="button" id="gl-final">🕯️ The Final Séance${finaleDone(P()) ? " 👑" : ""}</button><button class="c" type="button" id="gl-book">📕 The Method Book</button><button class="c" type="button" id="back">✦ Back</button></div>`);
      $("gl-wall").onclick = wall; $("gl-final").onclick = () => finale(); $("gl-book").onclick = book; $("back").onclick = greet;
    }
    function wall() {
      page(); clearReading(); draw(wallSvg(P()));
      ui(`<div class="cx-top"><b>🖼️ The pairs</b> · ${pairsDone(P())} / ${PAIRS.length}</div><div class="gl-grid">${PAIRS.map((x) => { const s = pairState(P(), x), side = (on, v) => `<div class="${on ? "" : "off"}"><b>${on ? esc(v.name) : "?"}</b>${on ? `${v.year} · ${esc(v.line)}` : "Not yet on the wall"}</div>`;
        return `<div class="gl-pair${s.done ? " done" : ""}">${side(s.a, x.a)}${side(s.b, x.b)}</div>`; }).join("")}</div>
        <div class="choices"><button class="c" type="button" id="gl-back">🖼️ Back</button></div>`);
      $("gl-back").onclick = () => lobby(false);
    }
    function finale(msg) {
      clearReading(); const p = P(), got = lettersEarned(p), done = finaleDone(p); draw(finaleSvg(p, done)); cap("🕯️ The Final Séance");
      say(msg || (done ? "Rosabelle, believe. You decoded it yourself. That was always the point, darling." : rook() ? "Houdini and Bess agreed on a message, in the code from their old act. Earn its letters, then read it yourself. It's a puzzle, darling, not a visit." : "Houdini and Bess agreed that a true message would come in the code from their stage act. Earn the letters, then decode it."));
      const codeRow = MILESTONES.map((m, i) => `<span>${got[i] ? `${encodeLetter(m.ch).join("… ")}` : "· · ·"}</span>`).join("");
      ui(`<div class="cx-top"><b>🕯️ The Final Séance</b> · ${got.filter(Boolean).length} / 7 letters${done ? " · 👑 crowned" : ""}</div>
        <div class="ft-card"><b>The message</b><p>“Rosabelle…” then seven letters, each sent as code words:</p><div class="gl-code">${codeRow}</div>
        <p class="note">The code: ${CODE.map(([w, n]) => `${esc(w)} = ${n % 10}`).join(", ")}. A to J are 1 to 10; later letters are their number spelled in two words.</p></div>
        <div class="group">The letters</div><div class="ds-log">${MILESTONES.map((m, i) => `<div>${got[i] ? "✅" : "⬜"} <b>${m.ch}</b> · ${esc(m.name)}</div>`).join("")}</div>
        ${done ? `<div class="choices"><button class="c main" type="button" id="gl-credits">🎬 Curtain call</button></div>` : allEarned(p) ? `<div class="ft-card"><b>Decode it</b><p>Type the word the seven letters spell.</p><input id="gl-ans" class="c" style="width:100%" maxlength="20" autocomplete="off" aria-label="The decoded word"></div><div class="choices"><button class="c main" type="button" id="gl-try">🕯️ Read the message</button></div>` : ""}
        <div class="choices"><button class="c" type="button" id="gl-back">🖼️ Back</button></div>`);
      $("gl-back").onclick = () => lobby(false); if ($("gl-credits")) $("gl-credits").onclick = credits;
      if ($("gl-try")) $("gl-try").onclick = () => { const res = solveFinale(p, $("gl-ans").value);
        if (res === "wrong") { sfx.wrong(); return finale("Not quite. Count it out: Answer is 2, so B. Tell is 5, so E."); }
        if (res === "solved") { addTokens(p, host(), CROWN_PAY.keys); ctx.trophy?.("roguesgallery", 3, { won: true, perfect: true }); saveProgress(); showStats(); sfx.reveal(); chime(2); return credits(true); } };
    }
    function credits(fresh = false) {
      clearReading(); draw(finaleSvg(P(), true)); cap("🎬 Curtain call");
      say(fresh ? `Rosabelle, believe. The Star Crown of the Parlour is yours, ${state.name}: +💎 ${CROWN_PAY.gem} and 🗝️ ${CROWN_PAY.keys}. Bow, darling.` : "Curtain call. Take a bow.");
      ui(`<div class="ft-card gl-credits"><b>🎬 Curtain call</b>${CURTAIN_CALL.map(([n, l]) => `<div><b>${esc(n)}</b><br><small>${esc(l)}</small></div>`).join("")}<div><i>…and ${esc(state.name)}, who read the code.</i></div></div>
        <div class="choices"><button class="c" type="button" id="gl-back">🖼️ Back</button></div>`); $("gl-back").onclick = () => lobby(false);
    }
    function book() { page(); clearReading(); cap("📕 The Method Book"); const rb = $("reading-body"); rb.innerHTML = methodBookHtml(P(), esc); rb.firstElementChild.scrollIntoView({ behavior: "smooth", block: "start" }); }
    lobby(true);
  },
};

/** Margin notes in the two-person code: four words, one letter per group (decode with the Mentalist's code). */
export const MARGIN_WORDS = ["ROOK", "FOX", "HUSH", "BESS"];
export const MARGIN = MARGIN_WORDS.map((w) => w.split("").map((c) => encodeLetter(c).join(" ")).join(" · "));
/** The Method Book: cases by method class, tricks, bookings, the gallery, Hidden Parlour finds and the margin notes. */
export function methodBookHtml(p, esc) {
  const cf = cfRoom(p), rep = repertoire(p), bk = bkRoom(p), sec = ((p.houses || {}).parlour || {}).sec || [];
  const cls = CLASSES.map(([id, name]) => { const cases = CASES.filter((c) => cf.solved.includes(c.id) && (METHODS.find((m) => m.id === c.method) || {}).cls === id);
    return `<div><b>${esc(name)}</b> · ${cases.length ? cases.map((c) => esc(c.name)).join(", ") : "<i>nothing filed yet</i>"}</div>`; }).join("");
  return `<div class="gl-book ds-log"><h3>📕 The Method Book</h3>
    <h4>🗂️ Case Files · ${cf.solved.length} / ${CASES.length}</h4>${cls}
    <h4>🎩 Workshop tricks · ${rep.length}</h4><div>${rep.length ? rep.map((id) => esc((trickOf(id) || {}).name || id)).join(", ") : "<i>no tricks learned yet</i>"}</div>
    <h4>🎟️ Bookings · ${bk.shows} shows · ${esc(billing(p).name)}</h4>${(bk.hist || []).slice(0, 8).map((h) => `<div>${h.won ? "⭐" : "✗"} ${esc((venueOf(h.venue) || {}).name || h.venue)} · Level ${h.lv} · ${h.day}</div>`).join("") || "<div><i>no shows yet</i></div>"}
    <h4>🖼️ Rogues' Gallery · ${pairsDone(p)} / ${PAIRS.length} pairs</h4>
    <h4>🕯️ Hidden Parlour · ${sec.length} / ${PARLOUR_SECRETS.items.length}</h4>${PARLOUR_SECRETS.items.filter((s) => sec.includes(s.id)).map((s) => `<div>${s.e} ${esc(s.name)}</div>`).join("") || "<div><i>nothing found yet</i></div>"}
    <h4>✒️ In the margins</h4><div><small>Four notes in the Houdinis' code. Decode them yourself.</small></div>${MARGIN.map((m) => `<div><i>${esc(m)}</i></div>`).join("")}</div>`;
}
/** This room's part of the 📜 Codex. */
export function galleryCodex(p, esc) {
  const n = pairsDone(p), lit = portraitsLit(p), got = lettersEarned(p).filter(Boolean).length;
  return `<div class="cx"><div class="cx-h"><span>🖼️ The Rogues' Gallery</span><span class="note">${n} / ${PAIRS.length} pairs · ${got} / 7 letters${finaleDone(p) ? " · 👑" : ""}</span></div><div class="bar"><i style="width:${(lit / (PAIRS.length * 2)) * 100}%"></i></div></div>`;
}
