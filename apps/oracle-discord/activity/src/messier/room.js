// Messier's Catalogue: a room of the Chamber (Keeper Altair's House, #🔭-observatory). Fill all 110 Messier objects:
// name each one's kind, its constellation, and which stands highest over your city tonight. Logic in engine.js.
// Trophy: C.trophy("messier", level, ...). Every 10 objects pays 💎 50; all 110 pays ☄️ 10 and Messier's seal.
import { room as MR, ROUNDS, PASS, TOTAL, TEN_PAY, SEAL_SHARDS, MESSIER, byM, roundOf, starsFor, isOpen, settleRun, logObject, payouts, loggedSet, loggedCount, kindCounts, rng } from "./engine.js";
import { GUIDE } from "./guide.js";
import { placeOf, watchTime } from "../watch/engine.js";
import { houseRank, claimHarmony, progressHtml, RANKS } from "../obsprog.js";
import { observatory } from "../hosts/observatory.js";
import { addTokens } from "../hosts/tokens.js";
import { grantRoyal } from "../hosts/observatory-dome.js";
import { dailySeed, dailyState, finishDaily, todayKey, dayNumber } from "../daily.js";
import * as S from "../stars/sfx.js";

export const SKETCHES = [
  { id: "sk-pencil", name: "Pencil at the eyepiece", price: 0, bg: "#0b0f1a", star: "#eef2ff", glow: "#c9d4ff", ink: "#9fb4ff", note: "Observers still sketch at the eyepiece in pencil. A sketch trains the eye to see faint detail a quick look misses." },
  { id: "sk-messier", name: "Messier's 1781 list", price: 40, bg: "#2a2114", star: "#f3e3bd", glow: "#e2c27a", ink: "#c99a4a", note: "Messier's final list appeared in the Connaissance des Temps for 1784, printed in 1781: 103 objects. Later astronomers added M104 to M110 from his and Méchain's notes." },
  { id: "sk-rosse", name: "Lord Rosse's spiral", price: 60, bg: "#f2ecdf", star: "#1c1a16", glow: "#5a524a", ink: "#3a342c", invert: true, note: "In 1845 Lord Rosse saw spiral arms in M51 with his 72-inch Leviathan of Parsonstown, in Ireland. It was the first galaxy known to be a spiral." },
  { id: "sk-roberts", name: "Isaac Roberts' plate", price: 80, bg: "#cfd2d6", star: "#0a0a0a", glow: "#3a3a3a", ink: "#1a1a1a", invert: true, note: "On 29 December 1888 Isaac Roberts photographed M31 with a four-hour exposure and showed its spiral structure for the first time." },
  { id: "sk-hubble", name: "Space telescope colour", price: 110, bg: "#03040a", star: "#ffffff", glow: "#ffb36b", ink: "#ff6ad5", colour: true, note: "The Hubble Space Telescope was launched on 24 April 1990. Its 2.4-metre mirror sees from above the air, so stars don't twinkle in its images." },
];
const KIND = "mesketch";
const sketchOf = (p) => SKETCHES.find((t) => t.id === p[KIND] && (t.price === 0 || (p.owned || []).includes(t.id))) || SKETCHES[0];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const $id = (id) => document.getElementById(id);
const KCOL = { gc: "#ffd86b", oc: "#8FB8FF", sg: "#ff9ad5", eg: "#ffb36b", ig: "#ff7a7a", neb: "#ff6a8a", rn: "#6aa8ff", pn: "#6affd5", snr: "#c88aff", grp: "#DCE6FF" };

const CSS = `.table.messier{background:radial-gradient(ellipse at 50% 120%,#16213f 0%,#0a1024 55%,#04070f 100%);pointer-events:auto;overflow:hidden}
.me-svg{position:absolute;inset:5% 5% 10%;width:90%;height:85%}
.me-svg .field{animation:me-drift 40s linear infinite alternate}@keyframes me-drift{to{transform:translate(-10px,4px)}}
.me-svg .obj{opacity:0;animation:me-in 1.6s .2s ease-out forwards}@keyframes me-in{to{opacity:1}}
.me-svg .stamp{opacity:0;transform-origin:320px 60px;animation:me-stamp .6s ease-out forwards}@keyframes me-stamp{from{opacity:0;transform:scale(2) rotate(-20deg)}to{opacity:.9;transform:scale(1) rotate(-12deg)}}
.me-svg .tile.new{animation:me-pulse 1.2s ease-in-out 3}@keyframes me-pulse{50%{opacity:.3}}
.me-svg.shake{animation:me-shake .35s}@keyframes me-shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.me-fact{border-left:3px solid #8FB8FF;padding:4px 10px;margin:8px 0;color:#DCE6FF}.me-dots{letter-spacing:.2em;color:#E2B04A}
.op-panel{margin:6px 0;color:#DCE6FF;font-size:.92em}.op-stages{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.op-stage{border:1px solid #2A3F6E;border-radius:10px;padding:1px 8px;opacity:.7}.op-stage.on{border-color:#E2B04A;color:#E2B04A;opacity:1}
.me-kinds{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:.85em;color:#9fb4ff;margin:4px 0}
@media (prefers-reduced-motion:reduce){.me-svg *,.me-svg{animation:none!important}.me-svg .obj{opacity:1}.me-svg .stamp{opacity:.9}}`;
function styleOnce() { if ($id("me-style")) return; const s = document.createElement("style"); s.id = "me-style"; s.textContent = CSS; document.head.appendChild(s); }

// ---- drawings (viewBox 400x260) ----
/** The eyepiece view of one object, drawn by its kind in the chosen sketch style. Same object, same drawing. */
export function eyepieceSvg(o, sk, { logged = false, label = true } = {}) {
  const r = rng(o.m * 7919), cx = 200, cy = 128, col = sk.colour ? KCOL[o.kind] : sk.glow, dot = (x, y, s, c = sk.star, op = 1) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(2)}" fill="${c}" opacity="${op.toFixed(2)}"/>`;
  const field = Array.from({ length: 26 }, () => { const a = r() * 6.283, d = Math.sqrt(r()) * 105; return dot(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.5 + r() * 1.1, sk.star, 0.4 + r() * 0.6); }).join("");
  const tilt = Math.round(r() * 180), g = (n, sd, size) => Array.from({ length: n }, () => { const u = r() + r() + r() - 1.5, v = r() + r() + r() - 1.5; return dot(cx + u * sd, cy + v * sd, size * (0.4 + r() * 0.8), sk.star, 0.5 + r() * 0.5); }).join("");
  let obj = "";
  if (o.kind === "gc") obj = `<circle cx="${cx}" cy="${cy}" r="26" fill="url(#me-glow)"/>${g(150, 14, 0.9)}`;
  else if (o.kind === "oc") obj = Array.from({ length: 18 + Math.floor(r() * 14) }, () => dot(cx + (r() - 0.5) * 120, cy + (r() - 0.5) * 90, 1 + r() * 1.8)).join("");
  else if (o.kind === "sg") { const arm = (k) => { let d = ""; for (let t = 0; t <= 3.6; t += 0.2) { const rr = 6 * Math.exp(0.42 * t), a = t + k * Math.PI; d += `${t ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr * 0.45).toFixed(1)}`; } return `<path d="${d}" fill="none" stroke="${col}" stroke-width="5" opacity=".35" stroke-linecap="round"/>`; };
    obj = `<g transform="rotate(${tilt} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="52" ry="22" fill="url(#me-glow)"/>${arm(0)}${arm(1)}<ellipse cx="${cx}" cy="${cy}" rx="7" ry="4" fill="${sk.star}" opacity=".9"/></g>`; }
  else if (o.kind === "eg") obj = `<g transform="rotate(${tilt} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${24 + r() * 16}" ry="${16 + r() * 8}" fill="url(#me-glow)"/><ellipse cx="${cx}" cy="${cy}" rx="5" ry="4" fill="${sk.star}" opacity=".85"/></g>`;
  else if (o.kind === "ig") obj = `<g transform="rotate(${tilt} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="58" ry="11" fill="url(#me-glow)"/><path d="M${cx - 20} ${cy - 6} q10 12 22 0 t20 4" stroke="${sk.bg}" stroke-width="3" fill="none" opacity=".8"/><path d="M${cx - 6} ${cy - 10} l4 -16 M${cx + 6} ${cy - 9} l8 -14" stroke="${col}" stroke-width="2" opacity=".4"/></g>`;
  else if (o.kind === "neb" || o.kind === "rn") obj = `<g filter="url(#me-soft)">${Array.from({ length: 7 }, () => `<ellipse cx="${(cx + (r() - 0.5) * 80).toFixed(0)}" cy="${(cy + (r() - 0.5) * 60).toFixed(0)}" rx="${(20 + r() * 30).toFixed(0)}" ry="${(14 + r() * 20).toFixed(0)}" fill="${o.kind === "rn" && sk.colour ? "#6aa8ff" : col}" opacity="${(0.15 + r() * 0.2).toFixed(2)}"/>`).join("")}</g>${g(8, 18, 1.6)}`;
  else if (o.kind === "pn") obj = `<circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="${col}" stroke-width="6" opacity=".7" filter="url(#me-soft)"/><circle cx="${cx}" cy="${cy}" r="1.4" fill="${sk.star}"/>`;
  else if (o.kind === "snr") obj = `<g filter="url(#me-soft)"><ellipse cx="${cx}" cy="${cy}" rx="36" ry="24" fill="${col}" opacity=".25"/></g>${Array.from({ length: 14 }, () => { const a = r() * 6.283; return `<path d="M${(cx + Math.cos(a) * 8).toFixed(1)} ${(cy + Math.sin(a) * 6).toFixed(1)} Q${(cx + Math.cos(a + 0.4) * 24).toFixed(1)} ${(cy + Math.sin(a + 0.4) * 16).toFixed(1)} ${(cx + Math.cos(a) * 36).toFixed(1)} ${(cy + Math.sin(a) * 24).toFixed(1)}" stroke="${sk.colour ? "#ff7a5a" : col}" fill="none" opacity=".6"/>`; }).join("")}`;
  else obj = Array.from({ length: o.m === 40 ? 2 : o.m === 73 ? 4 : 40 }, () => dot(cx + (r() - 0.5) * (o.m === 24 ? 200 : 30), cy + (r() - 0.5) * (o.m === 24 ? 150 : 24), 1 + r() * 1.4)).join("");
  return `<svg class="me-svg" id="me-svg" viewBox="0 0 400 260" role="img" aria-label="Eyepiece view of M${o.m}"><defs><radialGradient id="me-glow"><stop offset="0" stop-color="${col}" stop-opacity=".85"/><stop offset=".5" stop-color="${col}" stop-opacity=".3"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
    <filter id="me-soft"><feGaussianBlur stdDeviation="3"/></filter><clipPath id="me-ep"><circle cx="${cx}" cy="${cy}" r="112"/></clipPath></defs>
    <rect width="400" height="260" fill="#000"/><g clip-path="url(#me-ep)"><circle cx="${cx}" cy="${cy}" r="112" fill="${sk.bg}"/><g class="field">${field}<g class="obj">${obj}</g></g></g>
    <circle cx="${cx}" cy="${cy}" r="112" fill="none" stroke="#2A3F6E" stroke-width="3"/>
    ${label ? `<text x="200" y="254" fill="#8FB8FF" font-size="10" text-anchor="middle">M${o.m}${o.name ? ` · ${o.name}` : ""}</text>` : ""}
    ${logged ? `<g class="stamp"><rect x="282" y="44" width="80" height="30" rx="4" fill="none" stroke="#E2B04A" stroke-width="2.5"/><text x="322" y="64" fill="#E2B04A" font-size="13" text-anchor="middle" font-weight="700">LOGGED</text></g>` : ""}<g id="me-fx"></g></svg>`;
}
/** The catalogue: 110 tiles, 11 × 10, logged ones lit in their kind's colour. */
export function catalogueSvg(have, fresh = 0) {
  const set = new Set(have);
  return `<svg class="me-svg" id="me-svg" viewBox="0 0 400 260" role="img" aria-label="Messier catalogue: ${set.size} of ${TOTAL} logged"><rect width="400" height="260" fill="#070b18"/>
    ${MESSIER.map((o, i) => { const x = 14 + (i % 11) * 34, y = 10 + Math.floor(i / 11) * 23, on = set.has(o.m);
      return `<g class="tile${o.m === fresh ? " new" : ""}"><rect x="${x}" y="${y}" width="30" height="19" rx="3" fill="${on ? KCOL[o.kind] : "#121a33"}" opacity="${on ? 0.85 : 1}" stroke="#2A3F6E"/><text x="${x + 15}" y="${y + 13}" font-size="8.5" text-anchor="middle" fill="${on ? "#05070f" : "#4a5f8e"}">M${o.m}</text></g>`; }).join("")}<g id="me-fx"></g></svg>`;
}

const preview = (id, ctx) => { styleOnce(); ctx.tableEl.className = "table messier"; ctx.tableEl.innerHTML = eyepieceSvg(byM(51), SKETCHES.find((x) => x.id === id) || SKETCHES[0]); };
export const shop = {
  kind: KIND, label: "📓 Messier sketchbook", items: SKETCHES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: { open: ["Ways to record a fuzzy patch. Every one is a real way it was done.", "Pencil, plates or pixels. Pick how your catalogue looks."], tryon: ["M51 in {item}. Rosse would approve.", "The {item}. Look how the arms come out."], buy: ["The {item} is yours. Your eyepiece views use it now.", "Sold: {item}. Messier would have killed for this."] },
  preview,
};

export const messier = {
  id: "messier", label: "Messier's Catalogue", emoji: "🌌", shop,
  blurb: "Fill all 110 Messier objects: name their kind, find their constellation, catch them high tonight",
  open(C) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, greet, award, tableEl, reduced } = C;
    styleOnce();
    const P = () => state.prog, R = () => MR(P()), save = () => { try { saveProgress(); } catch {} };
    const day = todayKey(), dseed = dailySeed("messier", day);
    const back = () => `<div class="choices"><button class="c small" type="button" id="me-lobby">🌌 Back to the catalogue</button></div>`;
    const wireBack = () => { const b = $("me-lobby"); if (b) b.onclick = () => lobby(false); };
    const shake = () => { const s = $id("me-svg"); if (!s) return; s.classList.remove("shake"); void s.getBoundingClientRect(); s.classList.add("shake"); };
    const LV = [null, ["🔭 1 · What is it?", "Name the kind from the eyepiece view"], ["🗺️ 2 · Where is it?", "Name its constellation"], ["🌙 3 · Tonight", "Which stands highest over your city?"]];
    /** Pay what's due: 💎 per 10, the seal, Harmony stages, and the coat at Astronomer Royal. Returns a reward line. */
    const settle = () => {
      const out = [], pay = payouts(P());
      if (pay.tens) { award(0, pay.tens * TEN_PAY); out.push(`+${pay.tens * TEN_PAY} 💎 for ${Math.floor(loggedCount(P()) / 10) * 10} objects`); }
      if (pay.sealed) { addTokens(P(), observatory, SEAL_SHARDS); out.push(`☄️ ${SEAL_SHARDS} and Messier's seal: the whole catalogue!`); }
      for (const s of claimHarmony(P(), observatory)) out.push(`☄️ 5 · Harmony stage: ${esc(s.name)}`);
      if (houseRank(P()).name === RANKS[RANKS.length - 1].name) grantRoyal(P());
      return out;
    };

    function lobby(first) {
      clearReading(); cap("🌌 Messier's Catalogue"); tableEl.className = "table messier";
      const have = loggedSet(P()), paid = settle(); if (paid.length) save();
      tableEl.innerHTML = catalogueSvg(have);
      if (first) S.domeOpen();
      say(first ? `Charles Messier hunted comets, ${state.name}, and kept a list of fuzzy things that were not comets so he wouldn't be fooled twice. That list made him famous. ${have.length} of ${TOTAL} so far.`
        : pick(["Louis XV called Messier the ferret of comets. Let's ferret.", "Every spring some observers try to see all 110 in one night: the Messier Marathon.", `${TOTAL - have.length} still to find.`]));
      const r = R(), ds = dailyState(P(), "messier"), kc = kindCounts(P());
      const lv = (n) => `<button class="c level" type="button" id="me-go${n}"${isOpen(P(), n) ? "" : " disabled"}><b>${LV[n][0]}</b><span>${isOpen(P(), n) ? `${LV[n][1]}${r.best[n] ? ` · best ${r.best[n]}★` : ""}` : `Clear Level ${n - 1} to open`}</span></button>`;
      ui(`<div class="cx-top"><b>🌌 Messier's Catalogue</b> · ${have.length} / ${TOTAL} logged${r.sealed ? " · 🔏 sealed" : ""} · ${r.cleared.length} / 3 levels cleared</div>
        ${progressHtml(P(), esc)}
        <div class="me-kinds">${Object.entries(kc).map(([k, v]) => `<span>${esc(k)} ${v.have}/${v.all}</span>`).join("")}</div>
        ${paid.length ? `<div class="reward"><div class="up">${paid.join(" · ")}</div></div>` : ""}
        <div class="levels">${lv(1)}${lv(2)}${lv(3)}</div>
        <div class="choices"><button class="c main" type="button" id="me-daily">📅 Daily Messier #${dayNumber(day)}${ds.played ? " ✓" : ""}</button><button class="c small" type="button" id="me-guide">📖 Messier notes</button><button class="c small" type="button" id="back">✦ Leave</button></div>
        <div class="note">${ROUNDS} objects a run; ${PASS} right clears a level. A right answer logs the object. Night Watch logs count too. Every 10 objects pays ${TEN_PAY} 💎.</div>`);
      [1, 2, 3].forEach((n) => { const b = $("me-go" + n); if (b && isOpen(P(), n)) b.onclick = () => run(n, false); });
      $("me-daily").onclick = () => run(1, true); $("back").onclick = greet; $("me-guide").onclick = () => (C.study ? C.study("messier", () => lobby(false)) : null);
    }

    function run(level, daily) {
      const results = [], base = daily ? dseed : (Math.random() * 2 ** 31) >>> 0, place = placeOf(P()), at = watchTime(place).at, fresh = []; let i = 0, settled = -1;
      const dots = () => `<span class="me-dots">${Array.from({ length: ROUNDS }, (_, k) => (k < results.length ? (results[k] ? "★".repeat(results[k]) : "✗") : "·")).join(" ")}</span>`;
      const next = (stars, wait = 1600) => { if (settled === i) return; settled = i; $("ui").querySelectorAll("button:not(#me-lobby)").forEach((b) => (b.disabled = true)); results.push(stars); i++; setTimeout(() => (i < ROUNDS ? play() : finish()), reduced ? 400 : wait); };
      const play = () => {
        clearReading(); cap(`🌌 ${daily ? `Daily Messier #${dayNumber(day)}` : LV[level][0]} · ${i + 1} of ${ROUNDS}`); tableEl.className = "table messier";
        const rd = roundOf(level, (base + i * 7919) >>> 0, daily ? null : P(), place, at); let tries = 0;
        tableEl.innerHTML = eyepieceSvg(rd.o, sketchOf(P()), { label: level !== 1 && !rd.opts });
        if (rd.opts) tableEl.innerHTML = catalogueSvg(loggedSet(P()));
        S.ping(2 + (i % 3));
        say(i === 0 ? (level === 1 ? "Look at the shape. A ball of stars, a scatter, a smudge, a cloud, a ring?" : level === 2 ? "Messier gave each object's position among the stars. Where is this one?" : `Tonight over ${place.name}. The higher an object, the less air you look through.`) : pick(["Next.", "Another fuzzy patch.", "Steady at the eyepiece.", "Have a look."]));
        ui(`<div class="group">${i + 1} of ${ROUNDS} ${dots()}</div><div class="me-fact">${esc(rd.q)}</div><div class="choices">${rd.choices.map((c, k) => `<button class="c small" type="button" data-k="${k}">${esc(c)}</button>`).join("")}</div>${back()}`); wireBack();
        $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
          const c = rd.choices[+b.dataset.k];
          if (c === rd.a) {
            const lg = logObject(P(), rd.o.m); if (lg.first) fresh.push(rd.o.m);
            S.verdict(true); if (lg.first) setTimeout(S.discover, 300);
            tableEl.innerHTML = eyepieceSvg(rd.o, sketchOf(P()), { logged: true });
            $id("reading-body").innerHTML = `<div class="me-fact">${esc(rd.why)}${lg.first ? " Logged in your catalogue." : ""}</div>`;
            say(pick(["Logged. Messier would be pleased.", "That's it. Into the book.", "Exactly right.", "Spot on."])); save(); return next(starsFor(tries + 1), 2200);
          }
          tries++; S.gutter(); shake(); b.disabled = true; const m = C.banter && C.banter("messier", "mid"); if (m && C.bubble && tries === 1) C.bubble(m, 3000);
          if (tries >= 3 || rd.choices.length - tries <= 1) { $id("reading-body").innerHTML = `<div class="me-fact">It was: ${esc(rd.a)}. ${esc(rd.why)}</div>`; next(0, 2600); } else say("Not that one. Look again.");
        }));
      };
      const finish = () => {
        const res = settleRun(P(), level, results), stars = res.stars, xp = 3 * stars, es = 2 * stars + (res.first ? 10 : 0), before = houseRank(P()).name;
        let bonus = ""; if (daily) { const d = finishDaily(P(), "messier", { score: stars * 10, won: res.won, detail: `${stars}★` }, day); if (d.first) bonus = " · 📅 Daily done"; }
        const aw = award(xp, es); C.trophy?.("messier", level, { won: res.won, perfect: res.perfect });
        const paid = settle(), rank = houseRank(P()).name; save(); showStats();
        S.verdict(res.won); const b = C.banter && C.banter("messier", res.won ? "win" : "lose"); if (b && C.bubble) C.bubble(b, 3500);
        tableEl.innerHTML = catalogueSvg(loggedSet(P()), fresh[fresh.length - 1] || 0);
        say(res.won ? (res.perfect ? "Five for five. Messier took decades; you took minutes." : `${res.right} of ${ROUNDS}, and ${fresh.length} new in the book.`) : `${res.right} of ${ROUNDS}. Fuzzy patches are tricky. Again?`);
        ui(`<div class="reward"><div>${res.won ? "✓ Run cleared" : "Run over"} · ${stars}★ ${dots()}</div><div class="up">+${xp} ✦ · +${es} 💎${res.first ? " · level cleared!" : ""}${fresh.length ? ` · ${fresh.length} new: ${fresh.map((m) => "M" + m).join(", ")}` : ""}${bonus}${rank !== before ? ` · 🔭 House rank: <b>${esc(rank)}</b>` : ""}${aw && aw.rankUp ? ` · 🏅 You are now <b>${esc(aw.rankUp)}</b>` : ""}</div>${paid.length ? `<div class="up">${paid.join(" · ")}</div>` : ""}</div>
          <div class="choices"><button class="c main" type="button" id="me-again">↻ Again</button>${level < 3 && isOpen(P(), level + 1) && !daily ? `<button class="c" type="button" id="me-next">${LV[level + 1][0]}</button>` : ""}</div>${back()}`);
        $("me-again").onclick = () => run(level, false); const n = $("me-next"); if (n) n.onclick = () => run(level + 1, false); wireBack();
      };
      play();
    }
    lobby(true);
  },
};

export function messierCodex(p, esc) {
  const r = MR(p), n = loggedCount(p); if (!r.plays && !n) return "";
  return `<div class="bk-room"><h4>🌌 Messier's Catalogue</h4><p>${n} / ${TOTAL} logged${r.sealed ? " · 🔏 sealed" : ""} · ${esc(houseRank(p).name)} · best ${[1, 2, 3].map((l) => `${r.best[l] || 0}★`).join(" / ")}</p></div>`;
}
export { GUIDE };
