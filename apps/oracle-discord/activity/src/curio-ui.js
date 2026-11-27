// The hotspots for the Cabinet of Curiosities (curios.js): small hidden things all over the interface. main.js calls
// init(ctx) once, paint() after the scene repaints, enter() when the Chamber opens, and event(kind, data) from a few
// places (a question asked, an emote sent or received, speech turned off). Everything else is watched from here:
// the store, the Trophy Case, the record player and the door screen are found with MutationObservers.
import { CURIOS, liveCurios, freshWeek, WEEK_SET_PAY, timedMore, repdigit, newMoon, curioOf, curFound, curCount, findCurio, payText, magicWord, hearWord, timedNow, fullMoon, eclipseOn, meeting, SKULL_JOKES, ATTIC, BACKMASK, KNOCK, BACKROOM, GATE_STARS, TEN_EMOTE } from "./curios.js";

let C = null; const queued = [];
const $ = (id) => document.getElementById(id);
const P = () => C && C.state.prog;
const now = () => Date.now();

/** Pay a find and say so. Safe to call before the player's progress has loaded (it waits). */
export function hit(id, line = "") {
  const p = P(); if (!p) { if (!queued.includes(id)) queued.push(id); return false; }
  if (!liveCurios().some((c) => c.id === id)) return false; // not hidden yet: its week has not opened
  const r = findCurio(p, id); if (!r) { if (line) C.mood.bubble(line, 3200, curioOf(id)?.e || "✦"); return false; }
  C.save(); C.stats(); C.chime(2);
  C.logEvent("secret", r.c.e, `Found a curiosity: ${r.c.name}`, null, [["Curiosity", `${r.c.e} ${r.c.name}`], ["The riddle", r.c.hint], ["Reward", payText(r.pay)], ["Cabinet", `${curCount(p)} of ${liveCurios().length} drawers filled`]]);
  C.mood.emote(r.c.rare ? "wow" : "joy", { quiet: true });
  C.mood.bubble(`${line ? line + " " : ""}🏺 Curiosity found: ${r.c.name} · ${payText(r.pay)}`, 4200, r.c.e);
  toast(`${r.c.e} ${r.c.name}`, r.c.rare);
  if (r.week) setTimeout(() => { C.stats(); C.mood.bubble(`Week ${r.week} of the Cabinet, every drawer! +${payText(WEEK_SET_PAY)}`, 4200, "🗓️"); }, 4400);
  if (r.ten) setTimeout(() => { C.mood.bubble("Ten curiosities! The Curator's lens emote is yours. Equip it from your emotes.", 4200, "🔍"); C.logEvent("trophy", "🔍", "Ten curiosities found", null, [["Reward", `The ${TEN_EMOTE === "curator" ? "Curator's lens" : TEN_EMOTE} emote`]]); }, 4400);
  if (r.all) setTimeout(() => { C.stats(); C.mood.emote("cheer"); C.mood.bubble("The whole Cabinet! 💎 300, 🌙 10 and the Wonder emote. Nothing in here can hide from you now.", 5200, "🏺"); C.logEvent("trophy", "🏺", "Filled the whole Cabinet of Curiosities", null, [["Reward", "💎 300 + 🌙 10 and the Wonder emote"]]); }, 4400);
  return true;
}
function toast(t, rare) {
  const el = document.createElement("div"); el.className = "cu-toast" + (rare ? " rare" : ""); el.setAttribute("role", "status");
  el.innerHTML = `<small>🏺 Cabinet of Curiosities</small><b></b>`; el.querySelector("b").textContent = t; document.body.append(el); setTimeout(() => el.remove(), 4200);
}
/** Count taps; true on the nth within ms. */
function taps(key, n, ms) { const T = (taps[key] ||= []), t = now(); T.push(t); while (T.length && t - T[0] > ms) T.shift(); if (T.length >= n) { T.length = 0; return true; } return false; }

// ---- the scene layer: hotspots over the window, the shelf skull, the herbs, plus the golden mote, visitors, the crack ----
function layer() {
  const pane = $("teller")?.parentElement; if (!pane) return null; let L = $("cu-layer");
  if (!L) { L = document.createElement("div"); L.id = "cu-layer"; L.className = "cu-layer"; pane.append(L); }
  return L;
}
export function paint() {
  if (!C) return; const L = layer(); if (!L) return; const p = P() || {};
  const crack = (p.readings || 0) >= 50;
  L.innerHTML = `<button type="button" class="cu-hs cu-win" aria-label="The window" tabindex="-1"></button>
  <div class="cu-shelf"><button type="button" class="cu-hs cu-skull" aria-label="A skull on the shelf" tabindex="-1"></button></div>
  <div class="cu-herbs">${[6, 16, 27, 35].map((x, i) => `<button type="button" class="cu-hs cu-herb" data-i="${i}" style="left:${((x - 4) / 40) * 100}%;top:${i % 2 ? 40 : 25}%" aria-label="Drying herbs" tabindex="-1"></button>`).join("")}</div>
  ${crack ? `<button type="button" class="cu-crack" aria-label="A crack in the wall"><svg viewBox="0 0 20 60" aria-hidden="true"><path d="M10 0 L7 9 L12 17 L6 27 L11 36 L8 46 L12 60" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.6"/><path d="M12 17 L16 21 M6 27 L2 31 M8 46 L4 49" stroke="#000" stroke-opacity=".4" stroke-width="1"/></svg></button>` : ""}`;
  L.querySelector(".cu-win").onclick = (e) => { e.stopPropagation(); if (!taps("win", 3, 2200)) return knockSfx();
    if (newMoon() && liveCurios().some((c) => c.id === "newmoon") && !curFound(P() || {}, "newmoon")) { sight("🐈‍⬛", "cat"); hit("newmoon", "Two gold eyes blink on the sill. A black cat, on the darkest night."); }
    else if (fullMoon()) { sight("🐺", "wolf"); hit("wolf", "Awoooo! Something howls at the full moon outside."); }
    else { sight("🦉", "owl"); hit("window", "Hoo! An owl was sitting on the sill the whole time."); } };
  L.querySelector(".cu-skull").onclick = (e) => { e.stopPropagation(); const p2 = P() || {}, heard = (p2.curSk = Array.isArray(p2.curSk) ? p2.curSk : []);
    const left = SKULL_JOKES.map((_, i) => i).filter((i) => !heard.includes(i)), i = left.length ? left[Math.floor(Math.random() * left.length)] : Math.floor(Math.random() * SKULL_JOKES.length);
    if (!heard.includes(i)) heard.push(i); C.mood.bubble(`💀 ${SKULL_JOKES[i]}`, 3600, "💀"); C.mood.emote("laugh", { quiet: true });
    const sk = e.currentTarget; sk.classList.remove("chatter"); void sk.offsetWidth; sk.classList.add("chatter");
    if (heard.length >= 5) setTimeout(() => hit("skull", "The skull bows. That was its whole act."), 3700); else C.save(); };
  L.querySelectorAll(".cu-herb").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); if (Math.random() < 0.5 || L.querySelector(".cu-leaf")) return;
    const lf = document.createElement("button"); lf.type = "button"; lf.className = "cu-leaf"; lf.textContent = "🍃"; lf.setAttribute("aria-label", "A falling leaf");
    const r = b.getBoundingClientRect(), pr = L.getBoundingClientRect(); lf.style.left = `${r.left - pr.left}px`; lf.style.top = `${r.top - pr.top + 10}px`; L.append(lf);
    lf.onclick = (ev) => { ev.stopPropagation(); lf.remove(); hit("leaf", "Caught it! A leaf pressed flat for the Cabinet."); };
    setTimeout(() => lf.remove(), 3600); }));
  const ck = L.querySelector(".cu-crack"); if (ck) ck.onclick = (e) => { e.stopPropagation(); attic(); };
  if (!C.reduced && Math.random() < 0.25) mote(L);
}
function sight(e, k) { const L = layer(); if (!L) return; const s = document.createElement("span"); s.className = "cu-sight cu-" + k; s.textContent = e; L.append(s); setTimeout(() => s.remove(), 3200); }
function knockSfx() { try { C.chime(0); } catch { /* no sound */ } }
function mote(L, wait = 8000 + Math.random() * 60000) {
  setTimeout(() => { if (L.querySelector(".cu-mote")) return; const m = document.createElement("button"); m.type = "button"; m.className = "cu-mote"; m.setAttribute("aria-label", "A golden speck of dust");
    m.style.left = `${10 + Math.random() * 70}%`; m.style.top = `${30 + Math.random() * 50}%`; L.append(m);
    m.onclick = (e) => { e.stopPropagation(); m.remove(); hit("mote", "A speck of gold! It hums in your hand."); }; setTimeout(() => m.remove(), 7000); }, wait);
}
/** A rare visitor walks across the floor: about 1 chance in 200 each minute the Chamber is open. */
function visitor(force = false) {
  const L = layer(); if (!L || L.querySelector(".cu-visitor") || (!force && (C.reduced || Math.random() > 1 / 200))) return;
  const v = document.createElement("button"), kinds = [["🐈‍⬛", "a black cat"], ["🦔", "a hedgehog"], ["👻", "a small ghost"], ["🛸", "a very small spaceship"], ["🐌", "a snail in a hurry"]], [e, who] = kinds[Math.floor(Math.random() * kinds.length)];
  v.type = "button"; v.className = "cu-visitor"; v.textContent = e; v.setAttribute("aria-label", `A visitor: ${who}`); L.append(v);
  v.onclick = (ev) => { ev.stopPropagation(); v.remove(); hit("visitor", `You spotted ${who}! It doesn't come by often.`); }; setTimeout(() => v.remove(), 14000);
}
function attic() {
  const p = P(); if (!p) return; const m = C.modal("cu-attic", `<div class="gift-in cu-attic" role="dialog" aria-label="The Oracle's attic"><h2>🏚️ The Oracle's attic</h2><p class="note">Behind the crack: a low room under the roof, full of things she hasn't shown anyone.</p>
    <div class="cu-attic-grid">${ATTIC.map(([e, n], i) => `<button type="button" class="cu-obj" data-at="${i}"><span>${e}</span><small>${C.esc(n)}</small></button>`).join("")}</div>
    <p class="cu-attic-say" id="cu-attic-say" aria-live="polite">Tap anything. Carefully.</p><button type="button" class="c" id="cu-attic-x">Climb back down</button></div>`);
  m.el.querySelectorAll("[data-at]").forEach((b) => (b.onclick = () => { $("cu-attic-say").textContent = ATTIC[+b.dataset.at][2]; b.classList.add("seen"); C.chime(1); }));
  $("cu-attic-x").onclick = m.close; hit("attic", "You squeezed through the crack into my attic. Mind the dust.");
}

// ---- the Oracle herself: a staring contest with her eye, stirring the crystal ball ----
function wireOracle() {
  const T = $("teller"); if (!T) return; // delegated: the Oracle's svg is redrawn when her look changes
  let st = null, inEye = false; const stareOff = () => { clearTimeout(st); st = null; inEye = false; };
  const stareOn = () => { if (inEye) return; inEye = true; clearTimeout(st); st = setTimeout(() => { inEye = false; C.mood.emote("dizzy"); hit("stare", "I blinked. You win. Nobody out-stares me. Usually."); }, 7000); };
  let last = null, turn = 0, t0 = 0;
  T.addEventListener("pointermove", (e) => {
    if (e.target.closest?.(".o-eye")) stareOn(); else if (inEye) stareOff();
    const ball = T.querySelector(".o-ball"); if (!ball) return; const r = ball.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) { last = null; return; }
    const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    if (last === null || now() - t0 > 6000) { last = a; turn = 0; t0 = now(); return; }
    let d = a - last; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; turn += d; last = a;
    if (Math.abs(turn) >= 6 * Math.PI) { last = null; T.classList.add("cu-galaxy"); setTimeout(() => T.classList.remove("cu-galaxy"), 3000); hit("spin", "A whole galaxy is swirling in the glass now. Thank you, I think."); } });
  T.addEventListener("pointerdown", (e) => { if (e.target.closest?.(".o-eye")) stareOn(); });
  // a good shake: the pointer swept side to side across her fast, 8 turns in 1.5 s
  let sx = null, sdir = 0, flips = []; T.addEventListener("pointermove", (e) => { if (sx === null) { sx = e.clientX; return; } const dx = e.clientX - sx; if (Math.abs(dx) < 12) return; sx = e.clientX;
    const dir = Math.sign(dx); if (dir !== sdir) { sdir = dir; const t = now(); flips.push(t); flips = flips.filter((x) => t - x < 1500); if (flips.length >= 8) { flips = []; C.mood.emote("dizzy"); hit("shake", "Whoa, whoa! Stop shaking the Chamber. Everything's spinning."); } } });
  // caught napping: she dozed off from waiting; the tap that wakes her counts
  T.addEventListener("click", () => { if (C.mood.mood() === "sleepy" && !curFound(P() || {}, "nap")) setTimeout(() => hit("nap", "I was not asleep. I was… consulting the inside of my eyelid."), 1200); }, true);
  T.addEventListener("pointerup", stareOff); T.addEventListener("pointerleave", () => { stareOff(); last = null; }); T.addEventListener("pointercancel", stareOff);
}

// ---- elsewhere in the interface: the store's price tag, the Trophy Case glass, the record player, the door ----
function watch(id, fn) { const el = $(id); if (!el) return; const mo = new MutationObserver(() => fn(el)); mo.observe(el, { childList: true }); fn(el); }
function storeTag(ui) {
  const d = ui.querySelector(".depts"); if (!d || d.querySelector(".cu-tag")) return;
  const t = document.createElement("button"); t.type = "button"; t.className = "cu-tag"; t.setAttribute("aria-label", "A loose price tag"); t.innerHTML = `<span>🏷️</span>`; d.append(t);
  t.onclick = (e) => { e.stopPropagation(); t.classList.remove("tug"); void t.offsetWidth; t.classList.add("tug"); if (!taps("tag", 3, 2500)) return;
    const m = C.modal("cu-back", `<div class="gift-in cu-backroom" role="dialog" aria-label="The back room"><h2>🏷️ The back room</h2><p class="note">${C.esc(BACKROOM)}</p><button type="button" class="c" id="cu-back-x">Back to the shop floor</button></div>`);
    $("cu-back-x").onclick = m.close; hit("backroom", "The tag came off. Behind it, a door."); };
}
function extras() {
  document.addEventListener("click", (e) => { if (e.target.closest?.("#familiar") && taps("fam", 5, 3000)) { const f = $("familiar"); f?.classList.add("cu-trick"); setTimeout(() => f?.classList.remove("cu-trick"), 1600); hit("familiar", "A backflip! I didn't know they could do that."); } }, true);
  const K = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]; let ki = 0;
  document.addEventListener("keydown", (e) => { if (e.target.closest?.("input,textarea,select")) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; ki = k === K[ki] ? ki + 1 : k === K[0] ? 1 : 0;
    if (ki === K.length) { ki = 0; document.body.classList.add("cu-8bit"); setTimeout(() => document.body.classList.remove("cu-8bit"), 3000); hit("konami", "+30 lives. Kidding. Old cheat codes still work in here, though."); } });
}
function polish(tc) {
  const sh = tc.querySelector(".shelf"); if (!sh || sh.dataset.cup) return; sh.dataset.cup = 1; let x = null, dir = 0, flips = [], bay = null;
  sh.addEventListener("pointermove", (e) => { const b = e.target.closest?.(".bay"); if (!b) { x = null; return; } if (b !== bay) { bay = b; x = e.clientX; flips = []; return; } const dx = e.clientX - x; if (Math.abs(dx) < 8) return; x = e.clientX;
    const d = Math.sign(dx); if (d !== dir) { dir = d; const t = now(); flips.push(t); flips = flips.filter((v) => t - v < 2500); if (flips.length >= 6) { flips = []; b.classList.add("cu-shine"); setTimeout(() => b.classList.remove("cu-shine"), 1800); hit("polish", "Squeaky clean. You can see your face in it."); } } });
}
function trophyCase(tc) {
  polish(tc);
  const shelf = tc.querySelector(".shelf"), brand = tc.querySelector(".tc-brand");
  const k = (e) => { if (e.target.closest(".bay,button:not(.tc-brand)")) return; if (taps("knock", 3, 2000)) { let i = 0; const next = () => { if (i < KNOCK.length) { C.mood.bubble(`🚪 ${KNOCK[i++]}`, 1400, "🚪"); setTimeout(next, 1500); } else hit("knock"); }; next(); } else knockSfx(); };
  if (shelf && !shelf.dataset.cu) { shelf.dataset.cu = 1; shelf.addEventListener("click", k); }
  if (brand && !brand.dataset.cu) { brand.dataset.cu = 1; brand.addEventListener("click", k); }
  const tt = tc.querySelector(".rp-tt"); if (tt && !tt.dataset.cu) { tt.dataset.cu = 1; let x0 = null, dx = 0;
    tt.addEventListener("pointerdown", (e) => { x0 = e.clientX; dx = 0; try { tt.setPointerCapture(e.pointerId); } catch { /* fine */ } });
    tt.addEventListener("pointermove", (e) => { if (x0 === null) return; dx = e.clientX - x0; if (dx < -90) { x0 = null; tt.classList.add("cu-rev"); setTimeout(() => tt.classList.remove("cu-rev"), 2400);
      let i = 0; const next = () => { if (i < BACKMASK.length) { C.mood.bubble(`⏪ ${BACKMASK[i++]}`, 2000, "⏪"); setTimeout(next, 2100); } else hit("backmask"); }; next(); } });
    const up = () => { x0 = null; }; tt.addEventListener("pointerup", up); tt.addEventListener("pointercancel", up); }
}
function gateStars(g) {
  if (g.hidden || g.querySelector(".cu-gate") || !g.querySelector(".gate-bg")) return;
  const w = document.createElement("div"); w.className = "cu-gate"; let at = 0;
  w.innerHTML = GATE_STARS.map(([l, x, y], i) => `<button type="button" class="cu-gs" data-i="${i}" style="left:${x}%;top:${y}%" aria-label="A star"><b>${l}</b></button>`).join(""); g.append(w);
  w.querySelectorAll(".cu-gs").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const i = +b.dataset.i;
    if (i !== at) { at = 0; w.querySelectorAll(".cu-gs").forEach((x) => x.classList.remove("lit")); return; }
    b.classList.add("lit"); at++; if (at === GATE_STARS.length) { w.classList.add("done"); hit("gate"); } }));
}

// ---- events from main.js ----
const EM = { seq: [], mine: null, theirs: null };
/** kind: "ask" (question text; returns a line to say, or null), "emote-out" / "emote-in" (emote id), "mute". */
export function event(kind, data) {
  if (!C) return null;
  if (kind === "ask") { const q = String(data || "").trim().toLowerCase();
    if (q && /\belcaro\b/.test(q)) { setTimeout(() => hit("mirror", "Elcaro! That's me, in the mirror. Hello, me."), 900); return "Elcaro? …Oh. Oh, that's clever."; }
    if (q && q === EM.lastQ) { EM.lastQ = q; setTimeout(() => hit("echo", "You asked that already. I heard you the first time. …the first time."), 900); } EM.lastQ = q;
    const w = magicWord(data); if (!w) return null; const p = P(); if (!p) return w[1]; const r = hearWord(p, w[0]); C.save();
    setTimeout(() => { hit("word"); if (r.all) setTimeout(() => hit("lexicon", "Eight words, eight spells. You know all my party tricks."), 4600); }, 900); return w[1]; }
  if (kind === "emote-out") { EM.seq = [...EM.seq, [data, now()]].slice(-3); const s = EM.seq;
    if (s.length === 3 && s[0][0] === "wave" && s[1][0] === "dance" && s[2][0] === "wave" && s[2][1] - s[0][1] < 9000) { EM.seq = []; setTimeout(() => hit("combo", "Wave, dance, wave! That's the conjurer's knot. A new emote is yours."), 2400); }
    EM.mine = [data, now()]; if (EM.theirs && EM.theirs[0] === data && now() - EM.theirs[1] < 2500) setTimeout(() => hit("sync", "You two are in sync!"), 2400); return null; }
  if (kind === "emote-in") { EM.theirs = [data, now()]; if (EM.mine && EM.mine[0] === data && now() - EM.mine[1] < 2500) setTimeout(() => hit("sync", "You two are in sync!"), 2400); return null; }
  if (kind === "mute") { const n = (EM.mutes = (EM.mutes || 0) + 1); if (n === 6) C.mood.bubble("Again? Fine.", 2000, "😒"); if (n >= 10) { EM.mutes = 0; C.mood.emote("sulk"); hit("sulk", "Fine. I'll just mouth the words. Dramatically."); } return null; }
  return null;
}
/** The timed finds: checked when the Chamber opens and once a minute after. */
function clock() {
  const p = P(); if (!p) return; const d = new Date();
  for (const id of timedNow(d, (C.state.profile || {}).date)) if (!curFound(p, id)) hit(id, id === "witch" ? `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}. The witching minute. The candles flicker.` : id === "fri13" ? "Friday the 13th. The cat crossed my path twice, to be sure." : id === "leap" ? "A leap day! It only comes once every four years." : "Happy birthday! The stars came out early for you.");
  const day = d.toDateString();
  if (clock.day !== day) { clock.day = day;
    const ec = eclipseOn(d); if (ec && !curFound(p, "eclipse")) hit("eclipse", `Today there is a ${ec.type} ${ec.kind} eclipse somewhere on Earth.`);
    const mt = meeting(+d); document.body.classList.toggle("cu-aligned", !!mt);
    if (mt && !curFound(p, "align")) hit("align", `${mt.a} and ${mt.b} are ${mt.sep}° apart in the sky right now. The orrery hums.`); }
  for (const [id, x] of timedMore(d)) if (!curFound(p, id)) hit(id, id === "meteor" ? `Tonight is the peak of the ${x} meteor shower. Look up after dark.` : id === "solstice" ? `Today is the ${x}. The seasons turn.` : id === "midnight" ? "Midnight! The clock strikes twelve and every candle leans in." : id === "pi" ? "3.14159… Pi time. I made a pie. It's circular reasoning." : id === "twins" ? `${x}: the day matches the month.` : "Happy New Year! A fresh calendar, every page blank.");
  if ((p.readings || 0) >= 100 && !curFound(p, "hundred")) hit("hundred", "One hundred readings! I baked a cake. It's mostly candle.");
  if (repdigit(p.essence) && !curFound(p, "jackpot")) hit("jackpot", `💎 ${p.essence}. Every digit matches. The Chamber goes ding-ding-ding.`);
  const fw = freshWeek(d); if (fw && (p.curWk || 0) < fw.n) { p.curWk = fw.n; C.save(); setTimeout(() => C.mood.bubble(`I hid ${fw.items.length} new curiosities this week. The Cabinet has new drawers in Your Grimoire.`, 5200, "🏺"), 6000); }
  visitor();
}
export function enter() { if (!C) return; while (queued.length) hit(queued.shift()); clock(); if (!enter.t) enter.t = setInterval(clock, 60e3); }
/** Wire everything once. ctx: { state, mood, save, stats, chime, logEvent, modal, esc, reduced }. */
export function init(ctx) {
  C = ctx; wireOracle(); extras(); paint();
  watch("ui", storeTag); watch("tcase", trophyCase); watch("gate", gateStars);
  const g = $("gate"); if (g) new MutationObserver(() => gateStars(g)).observe(g, { attributes: true, attributeFilter: ["hidden"] });
}
/** Preview hooks for screenshots. */
export const test = { found: () => (P() || {}).cur, visitor: () => visitor(true), attic, mote: () => { const L = layer(); if (L) mote(L, 0); } };
