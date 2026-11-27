// The Oracle Chamber (Discord Activity): pick a system, give the Oracle your details, and she reveals the reading.
// Readings run here in the browser with the same modules the /oracle bot uses (src/modules), so results match.
import { bookPoke } from "./library.js";
import { recordShop, checkUnlocks, trackOf, musicOf, togglePlaylist, BATTLE_ROOMS, TRACKS, hasTrack } from "./music.js";
import { createPlayer, recordPlayerHtml, musicSwitchHtml, wireMusic, vinylSvg } from "./player.js";
import { homeItems, homeHtml, wireHome, savedTab, gateHtml } from "./home.js";
import { ghostBody } from "./seance/ghostlooks.js";
import { figureSvg, sigilRingSvg } from "../../src/oracle/figure.js";
import { makeTable, fitSvg, setTableDecor } from "./table.js";
import { unlockVoice, blip, isMuted, setMuted } from "./voice-sfx.js";
import { available, systemByKey, optionsFor } from "../../src/oracle/systems.js";
import { greeting, askLine, speech } from "../../src/oracle/voice.js";
import { fieldsFor } from "../../src/profiles.js";
import { MODULES } from "../../src/registry.js";
import { MODS } from "./modules.gen.js";
import { startDiscord, inDiscord, api } from "./discord.js";
import { CODEX, UNLOCKS, RANKS, rankOf, nextRank, fresh, record, codexNotes, liveStreak, merge, loadLocal, saveLocal } from "./game.js";
import { chime, trance, deepen } from "./voice-sfx.js";
import { answer, quip, deeperPages } from "./answer.js";
import { CARD_BACK, cardBackSvg } from "./cardbacks.js";
import { STORE, KINDS, SHOP_TALK, registerShelf, shelf, departments, deptOf, kindLabel, goodsOf, ensureFree, item, buy, readsLeft, useRead, buyDayPass, DAY_PASS, DAILY, dailyLimit } from "./store.js";
import { setVoiceStyle, sampleVoice, checkout, rimshot, cardDeal, sting } from "./voice-sfx.js";
import { seance, codexHtml as seanceCodex } from "./seance/room.js";
import { room as decoder, decoderCodex } from "./decoder/room.js";
import { room as memory, memoryCodex } from "./memory/room.js";
import { alchemy, alchemyCodex } from "./alchemy/room.js";
import { flametest, flametestCodex } from "./flametest/room.js";
import { inscriptions, inscriptionsCodex } from "./inscriptions/room.js";
import { cipherdesk, cipherdeskCodex } from "./cipherdesk/room.js";
import { minerals, mineralsCodex } from "./minerals/room.js";
import { casefiles, casefilesCodex } from "./casefiles/room.js";
import { workshop, workshopCodex } from "./workshop/room.js";
import { bookings, bookingsCodex } from "./bookings/room.js";
import { darkseance, darkseanceCodex } from "./darkseance/room.js";
import { mentalist, mentalistCodex } from "./mentalist/room.js";
import { bench, benchCodex } from "./bench/room.js";
import { commissions, commissionsCodex } from "./commissions/room.js";
import { fireworks, fireworksCodex } from "./fireworks/room.js";
import { timeline, codexHtml as timelineCodex } from "./timeline/room.js";
import { room as calendar, codexHtml as calendarCodex } from "./calendar/room.js";
import { room as grimoire, grimoireCodex } from "./grimoire/room.js";
import { stars as starLore, starsCodex } from "./stars/room.js";
import { room as duel, duelCodex } from "./duel/room.js";
import { rummy, rummyCodex } from "./rummy/room.js";
import { watch, watchCodex } from "./watch/room.js";
import { comet, cometCodex } from "./comet/room.js";
import { eclipse, eclipseCodex } from "./eclipse/room.js";
import { messier, messierCodex } from "./messier/room.js";
import { starParty, starPartyCodex } from "./starparty/room.js";
import { celestialNavigator, navigatorCodex } from "./navigator/room.js";
import { robeFx, AVATAR_LOOK, STAR_PUPIL, CLOTH_DESIGN } from "./looks.js";
import { vibeFx, CLOTH_FX, clothTrim, orbFx } from "./fx.js";
import { persona, line, personaQuip, deliver } from "./personas.js";
import { IDLE_AFTER, idleLine } from "./idle.js";
import { headline } from "../../src/oracle/voice.js";
import { TROPHIES, TIERS, SETS, LINES, CASE_LEVELS, recordWin, recordReading, recordClues, tierOf, points, caseLevel, earned, togglePin, trophyArt } from "./trophies.js";
import { trophyWin } from "./voice-sfx.js";
import { prosody, whoosh, puff, ignite, emoteSfx } from "./voice-sfx.js";
import { banter } from "./banter.js";
import { checkCollect, collectHtml } from "./collect.js";
import { RELICS, ownsRelic, moonLeft, buyRelic, relicsHtml, relicThumb, levelTokens, FAMILIAR_TOKENS, buyFamiliar } from "./moonrelics.js";
import { ALL_EMOTES, emoteAny, owned as emotesOwned, useEmote, emoteBookHtml, emoteFxHtml, slots as emoteSlots, toggleSlot, SLOTS as EMO_SLOTS } from "./emotes.js";
import { CODES, BOOK_CODES, broken as cdBroken, tryCode, spot as cdSpot, codesOn, scrapHtml, glyphLayer } from "./codes.js";
import { SECRETS, secretOf, found as gsFound, findSecret, INK, inkLit, CIPHER, toRunes, cipherSolved, diary, calendarPage, CREED, monthGrid, weekRecap, recapLine, searchLog } from "./secrets.js";
import { ALL as HERBS, keyOf as herbKey } from "./grimoire/logic.js";
import { thumbSvg as herbSvg } from "./grimoire/sketch.js";
import { joinTable, canJoin } from "./net.js";
import { gemShop, gemSvg } from "./gems.js";
import { giftState, claimGift, giftHtml, eventNow, eventBanner, boost as eventBoost, profileOf, profileHtml, profileLines, inviteSent, INVITE_REWARD } from "./pullin.js";
import { sceneHtml, CINE, cineHtml, readingCardHtml, orbsFor, orbHtml, markCard, markStore } from "./scene.js";
import { CREATOR, lookOf, withCreator, familiarShop, familiarSvg, FAMILIARS, EMOTES, emoteOf, SEASONS, seasonNow, seasonOpens, SEASONAL, onSale } from "./character.js";
import { featured, rareOf, weekEnds, FEATURED_OFF, priceNow, buyNow, SETS as LOOK_SETS, setProgress, wornSet, BOXES, TIERS as BOX_TIERS, boxPool, openBox, REFUND } from "./featured.js";
import { BOOKS, bookOf, coverSvg, emblemSvg, bookShop, bookPreviewHtml, emblemInner, addLog, byDay, dayKey, dayLabel, timeOf, LOG_KINDS, fullWhen, topDrawn, hoursOf, bookSfx } from "./book.js";
import { EXPLAIN } from "../../src/modules/magicdeck/explain.js";
import { DECK as MAGIC_DECK, SUITS as MAGIC_SUITS } from "../../src/modules/magicdeck/data.js";
import { BOOST_THANKS, BOOSTER_HELLO } from "./boost.js";
import { CREDITS_SONG, creditSections, SPECIAL_THANKS, END_LINE, checkMastery, hasCrown, masteryCount, GAMES } from "./credits.js";
import { initMood, moodForOutcome, moodForTone, flickFor, MOOD_EMOJI } from "./mood.js";
import { STUDY, studyFor, studyHtml, STUDY_CSS } from "./study.js";
import * as CU from "./curio-ui.js"; // the Cabinet of Curiosities: hidden finds all over the interface
import { cabinetHtml } from "./curios.js";
import { dmy } from "../../src/birthplace.js";
import { chartData, chartsHtml, storedRows } from "./mycharts.js"; // "My charts": the member's personal data, storage and delete
import { findSecret as findHouseSecret, secretsPanelHtml, secretCount, secretsOf, tapCount, payLabel } from "./hosts/secrets.js";
import { clueEvent, clueCount, dossierHtml, leftBehindHtml, CLUES, PAYOFF } from "./hosts/disguise.js";
import { HOSTS, host as HOST, hostFor, setHost, hasRoom, rename, hostLine, hostBanter, hostShelves, dressHouse, paintHost, houseChip, hostScene, hostReact, hostEmote, tokenIcon } from "./hosts/index.js";
import { houseLevelTokens, dailyVisit, strayFind, strayLine, relicPanelHtml, buyHouseRelic, tokensLeft } from "./hosts/tokens.js"; // each House's luxury token + strays sent home // the Houses engine: one host per channel

const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const PREVIEW = window.ORACLE_PREVIEW || null; // set only by the standalone preview page (build-preview.mjs)
const state = { name: "traveller", userId: "guest", token: null, profile: PREVIEW ? PREVIEW.profile : null, last: null, prog: fresh() };

// ---- the Oracle and her sky ----
$("teller").innerHTML = `<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${sigilRingSvg({ cx: 200, cy: 200, r: 196, id: "t" })}${figureSvg({ id: "t" })}</svg>`;
const table = makeTable($("table"), { reduced });
// Layers the Essence store draws into: elemental effects behind, on and in front of the Oracle; avatar extras
// behind the hood, on the hood, on the face and in front; and a slot in the iris for a star-shaped pupil.
(() => {
  const svg = $("teller").querySelector("svg"), body = svg.querySelector(".o-body"), NS = "http://www.w3.org/2000/svg";
  const g = (id, attrs = {}) => { const e = document.createElementNS(NS, "g"); e.id = id; for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const defs = document.createElementNS(NS, "defs");
  defs.innerHTML = `<clipPath id="t-hoodclip"><path d="M200 14 C214 60 252 150 290 236 C316 296 340 348 368 400 L32 400 C60 348 84 296 110 236 C148 150 186 60 200 14Z"/></clipPath>
    <pattern id="t-nemes" width="400" height="22" patternUnits="userSpaceOnUse"><rect width="400" height="11" fill="#E2B04A"/><rect y="11" width="400" height="11" fill="#1d3a8e"/></pattern>
    <linearGradient id="fx-firegrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a1a"/><stop offset="1" stop-color="#ff3b1a" stop-opacity="0"/></linearGradient>
    <linearGradient id="fx-flamegrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4a1a"/><stop offset=".55" stop-color="#ffa63d"/><stop offset="1" stop-color="#fff3b0" stop-opacity=".9"/></linearGradient>`;
  svg.prepend(defs);
  body.before(g("fx-back"));
  body.prepend(g("av-back")); body.children[2].after(g("av-hood")); $("av-hood").after(g("fx-robe", { "clip-path": "url(#t-hoodclip)" }));
  svg.querySelector('[clip-path="url(#t-faceclip)"]').append(g("av-face")); body.append(g("av-front"));
  svg.querySelector(".o-iris").append(g("av-pupil"));
  svg.append(g("fx-front"));
  // Crystal ball: tint only the glass (not the stand), add an effects layer inside and a glass rim on top.
  const ball = svg.querySelector(".o-ball"), clip = ball.querySelector('[clip-path="url(#t-orbclip)"]');
  const bodyC = ball.querySelector('circle[fill="url(#t-orb)"]'); bodyC.classList.add("o-glass", "o-glassbody"); clip.classList.add("o-glass");
  clip.after(g("orb-fx", { "clip-path": "url(#t-orbclip)" }));
  defs.innerHTML += `<radialGradient id="t-fresnel" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset=".92" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></radialGradient>
    <radialGradient id="t-caustic" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
  const rim = g("orb-rim"); rim.innerHTML = `<circle cx="200" cy="304" r="47" fill="url(#t-fresnel)"/><path d="M166 320 A36 36 0 0 0 214 340" fill="none" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/><ellipse class="o-caustic" cx="200" cy="351" rx="16" ry="3" fill="url(#t-caustic)"/>`;
  $("orb-fx").after(rim);
  // Remember which parts of the hands are skin, edge and nail, so avatars can recolour them.
  svg.querySelectorAll('.o-hands [fill="#3a2a5c"]').forEach((e) => (e.dataset.skin = "fill"));
  svg.querySelectorAll('.o-hands [stroke="#3a2a5c"]').forEach((e) => (e.dataset.skin = "stroke"));
  svg.querySelectorAll('.o-hands [stroke="#E2B04A"]').forEach((e) => (e.dataset.edge = "1"));
  svg.querySelectorAll(".o-hands .o-nail").forEach((e) => (e.dataset.r = e.getAttribute("r")));
})();
const CAST = {
  tarot: "I shuffle the deck… cut… and deal…", lenormand: "Thirty-six small pictures… shuffled… laid out in a row…",
  magicdeck: "Atoms, moons, potions, stars… shuffled… dealt like an experiment…",
  iching: "Six coins leave my hand… spinning… falling…", runes: "I loosen the pouch. Let the stones choose themselves…",
  oraclebones: "The bronze rod is hot. Listen… the shell answers with a crack…", ifa: "The chain falls. Eight seeds, open or closed…",
  astrology: "I turn the heavens back to the hour you arrived…", humandesign: "Your centres are lighting, one by one…",
  numerology: "Your numbers gather, and reduce, and reveal…", chinesezodiac: "The great wheel of twelve is turning…",
  mayan: "Thirteen and twenty, the sacred gears, interlock…", egyptian: "Ra rises over the pyramids for you…", celtic: "Your tree is growing out of the old calendar…",
};
let starColors = ["#FADE8C", "#66E0C8"];
const cv = $("stars"), cx = cv.getContext("2d"); let stars = [];
function sizeSky() { const r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio;
  stars = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 })); }
function drawSky(t) { cx.clearRect(0, 0, cv.width, cv.height);
  for (const s of stars) { cx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 900 + s.p); cx.fillStyle = s.p > 5 ? starColors[1] : starColors[0]; cx.beginPath(); cx.arc(s.x * cv.width, s.y * cv.height, s.r * devicePixelRatio, 0, 7); cx.fill(); }
  if (!reduced) requestAnimationFrame(drawSky); }
sizeSky(); addEventListener("resize", sizeSky); requestAnimationFrame(drawSky);

// The Oracle talks: letters appear at speaking pace (pausing on punctuation), each few letters a retro blip,
// and the creature's eye and face pulse while it speaks.
let typing = null;
const bused = []; // banter lines already said this visit (banter.js)
const mood = initMood($("teller"), { reduced, name: () => state.name, onChange: (m) => { refreshEnergy(); const sp = document.querySelector(".speaker"); if (sp) sp.dataset.emo = MOOD_EMOJI[m] || ""; },
  onPoke: (zone, count) => { secretEvent("poke", { zone, count }); const hr = hostReact("poke-" + zone, reactCtx()); if (hr && count < 5 && Math.random() < 0.6) return hr; return (count < 5 && Math.random() < 0.5 ? hostBanter("", "poke", state.name, bused) || banter("", state.prog.persona || "mystic", "poke", state.name, bused) : null); } });
/** What a House host needs to react on the figure: the teller, the backdrop (for the fume hood) and her gestures. */
/** A House's hidden finds (hosts/secrets.js): pass an event to the House; a find pays once, chimes and says why. */
function secretEvent(kind, data = {}) {
  disguiseEvent(kind, data);
  const H = HOST(); if (!H.secrets || !H.secrets.event || !state.prog) return;
  const api = { prog: state.prog, at: Date.now(), say: (line) => line && mood.bubble(String(line), 5200), found: (id) => (((state.prog.houses || {})[H.id] || {}).sec || []).includes(id),
    find: (id, line = "") => { const r = findHouseSecret(state.prog, H, id); if (!r) return false; logEvent("secret", r.s.e, `${H.house}: found ${r.s.name}`, null, [["House", H.house], ["Find", r.s.name], ["Reward", payLabel(H, r.pay)]]); saveProgress(); showStats(); chime(2); mood.emote("wow", { quiet: true });
      setTimeout(() => mood.bubble(`${r.s.e} ${H.secrets.label.replace(/^\S+\s/, "")}: ${r.s.name}! ${line} ${payLabel(H, r.pay)}`.trim(), 5200, r.s.e), reduced ? 0 : 500);
      if (r.all) setTimeout(() => mood.bubble(`Every secret in ${H.house} found! ${payLabel(H, { gem: 200, token: 5 })}`, 5200, "🏆"), reduced ? 0 : 6200);
      CU.event?.("house-secret", id); return true; } };
  try { H.secrets.event(kind, data, api); } catch (e) { console.warn("secret", e); }
}
// ---- the one-person gimmick (hosts/disguise.js): every host is secretly the same person, and slips ----
function disguiseEvent(kind, data) {
  if (!state.prog) return; const r = clueEvent(kind, data, { p: state.prog, host: HOST() }); if (!r) return;
  logEvent("secret", r.clue.e, `Dossier: ${r.clue.name}`, null, [["Clue", r.clue.name], ["Found", `${r.n} of ${CLUES.length}`], ["Reward", "💎 15"]]); saveProgress(); showStats();
  if (r.clue.id === "quickchange" && !reduced) { document.body.classList.add("dg-quick"); setTimeout(() => document.body.classList.remove("dg-quick"), 950); }
  const wait = kind === "home" ? (reduced ? 0 : 4200) : (reduced ? 0 : 300);
  setTimeout(() => { mood.emote("flinch", { quiet: true }); mood.bubble(`${r.line} 🎭 Dossier clue ${r.n}/${CLUES.length}. 💎 15`, 6400, "🎭"); chime(2); }, wait);
  if (r.all) setTimeout(() => mood.bubble(PAYOFF, 8000, "🎭"), wait + 6800);
  trophyNews(recordClues(state.prog, r.n));
  const b = $("hm-dossier"); if (b) b.querySelector("small").textContent = `${r.n}/${CLUES.length}`;
}
function openDossier() {
  state.inRoom = null; delete document.body.dataset.room; clearReading(); table.idle(); cap("🎭 The Dossier");
  say(clueCount(state.prog) === CLUES.length ? "All right. You've got the whole file. Five Houses, one face. Please stop telling people." : "A Dossier? On me? There's nothing to find. We are five completely different people.");
  ui(dossierHtml(state.prog, esc)); $("dg-back").onclick = greet;
}
document.addEventListener("click", (e) => { const t = e.target && e.target.closest && e.target.closest("[data-tap]"); if (t) secretEvent("tap", { tap: t.dataset.tap, count: tapCount(t.dataset.tap) }); });
function openHouseSecrets() {
  const H = HOST(); state.inRoom = null; delete document.body.dataset.room; clearReading(); table.idle(); cap(H.secrets.label);
  say(`${secretCount(state.prog, H)} of ${secretsOf(H).length} found. Every riddle points at something real in here.`); ui(secretsPanelHtml(state.prog, H, esc));
  $("sec-back").onclick = greet;
}
function reactCtx() { return { teller: $("teller"), scene: $("scene"), gesture: (g) => mood.gesture(g), reduced }; }
// Commentary while a game is being played: every few moves, in the chosen personality's voice, about that game.
const chat = { n: 0, next: 3, at: 0 };
function roomBanter(event = "mid") {
  const l = state.inRoom && (hostBanter(state.inRoom, event, state.name, bused) || banter(state.inRoom, state.prog.persona || "mystic", event, state.name, bused)); if (!l) return;
  chat.n = 0; chat.next = 5 + Math.floor(Math.random() * 4); chat.at = Date.now();
  mood.emote(["wink", "curious", "think", "smug"][Math.floor(Math.random() * 4)], { quiet: true, say: l });
  if (state.prog.persona === "standup") setTimeout(rimshot, 900);
}
$("ui").addEventListener("click", (e) => { if (!state.inRoom || !e.target.closest("button") || mood.mood()) return;
  if (++chat.n >= chat.next && Date.now() - chat.at > 22000 && !document.body.classList.contains("talking")) roomBanter("mid"); });
// Everything the store sells reacts to her: robe effects, the crystal ball, avatar extras and the vibe speed up when
// she is excited or talking and slow when she is low (candles and colours follow in chamber.css via body[data-mood]).
const ENERGY = { joy: 2, cheer: 3, love: 1.7, laugh: 2.3, wow: 3, curious: 1.4, angry: 3.6, think: 0.8, sad: 0.45, sulk: 0.5, sleepy: 0.3 };
const FX_LAYERS = ["fx-back", "fx-robe", "fx-front", "orb-fx", "av-back", "av-front", "vfx-o", "vfx-t"];
function refreshEnergy() {
  const b = document.body.classList, rate = b.contains("trance") ? 2.6 : ENERGY[mood.mood()] || (b.contains("talking") ? 1.35 : 1);
  for (const id of FX_LAYERS) { const g = $(id); try { g && g.getAnimations && g.getAnimations({ subtree: true }).forEach((a) => { a.playbackRate = rate; }); } catch {} }
  $("teller").classList.toggle("fx-hot", rate >= 1.7); $("teller").classList.toggle("fx-cold", rate < 0.7);
}
/** A flourish when a look is put on or tried: the robe swirls, the ball flares, candles relight, the cloth ripples. */
function flourish(kind) {
  if (reduced) return;
  const cls = { outfit: "fl-robe", avatar: "fl-avatar", orb: "orb-flare", flame: "fl-flame", cloth: "fl-cloth", vibe: "fl-vibe", persona: "fl-avatar" }[kind]; if (!cls) return;
  const el = kind === "flame" || kind === "cloth" ? $("table-pane") : kind === "vibe" ? document.body : $("teller");
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 1100);
  if (kind === "outfit") setTimeout(() => mood.emote("dizzy", { quiet: true }), 500); // the twirl leaves her seeing stars
  if (kind === "outfit" || kind === "cloth" || kind === "vibe") whoosh(); else if (kind === "flame") ignite(); else if (kind === "orb") emoteSfx("orb");
}
// Blow out a candle on the table: it smokes, she notices, and it relights itself.
$("table").addEventListener("click", (e) => {
  const c = e.target.closest?.(".t-candle"); if (!c || c.classList.contains("out")) return;
  c.classList.add("out"); puff(); mood.emote("wow", { quiet: true, say: pickLine(["Hey! I need those to see.", "Who blew that out? …It was you.", "Ooo, spooky. Relight it.", "A draught from the beyond. Or from {name}."], {}) });
  setTimeout(() => { if (c.isConnected) { c.classList.remove("out"); c.classList.add("relit"); ignite(); setTimeout(() => c.classList.remove("relit"), 700); } }, 3200);
});
const PAUSE = { ",": 160, ";": 200, ":": 200, ".": 320, "…": 380, "?": 340, "!": 320, "—": 220 };
/** Keep the line that was just spoken on screen, above the next one, so a reading can be read back. */
function keepLine() { const t = $("say").textContent.trim(); if (!t || t === "…") return; const p = document.createElement("p"); p.textContent = t; $("said").append(p); }
/** Speak a line. With keep, earlier lines of the same reading stay above it; without, the box starts clean. */
function say(text, done, { keep = false } = {}) {
  text = rename(text);
  clearTimeout(typing); const el = $("say"), box = $("feed"), teller = $("teller");
  if (!keep) $("said").innerHTML = "";
  /** Long text scrolls: keep the line being spoken in view. */
  const follow = () => { box.scrollTop = box.scrollHeight; };
  const plain = text.replace(/\*\*/g, ""); $("sr").textContent = plain;
  if (mood.mood() === "sleepy") mood.clear();
  const stop = () => { box.classList.remove("typing"); document.body.classList.remove("talking", "syl"); teller.classList.remove("syl"); refreshEnergy(); };
  const pros = prosody(plain);
  say.finish = null;
  const sm = speechMode(), pace = sm === "slow" ? 1.7 : sm === "fast" ? 0.45 : 1;
  if (reduced || sm === "off") { el.textContent = plain; stop(); follow(); done && done(); return; }
  /** Skip: show the whole line now (no more typing or blips), then carry on as if it finished. */
  say.finish = () => { say.finish = null; clearTimeout(typing); el.textContent = plain; stop(); follow(); done && done(); };
  let i = 0, n = 0; el.textContent = ""; box.classList.add("typing"); document.body.classList.add("talking"); refreshEnergy();
  const step = () => {
    const ch = plain[i++]; el.textContent = plain.slice(0, i); follow();
    mood.flick(flickFor(ch));
    if (/[\p{L}\p{N}]/u.test(ch)) { if (n++ % 2 === 0) { blip(ch, { ...pros[i - 1], wordEnd: !/[\p{L}\p{N}]/u.test(plain[i + 1] || " ") }); teller.classList.toggle("syl"); document.body.classList.toggle("syl"); } }
    if (i >= plain.length) { say.finish = null; blip("o", { final: true }); stop(); done && done(); return; }
    typing = setTimeout(step, (PAUSE[ch] || (ch === " " ? 34 : 26)) * pace);
  };
  step();
}
const P = () => persona(state.prog.persona), pid = () => state.prog.persona || "mystic";
const joke = (key) => hostLine("joke", state.name, heard()) || personaQuip(pid(), state.name, heard()) || quip(key, state.name, heard());
const heard = () => (state.prog.heard ||= []);
/** The scrolling area under the Oracle's words. Setting it clears the fixed control bar. */
const ui = (html) => { $("ctl").innerHTML = ""; $("ui").classList.remove("has-mbg"); $("ui").innerHTML = rename(html); };
/** The fixed control bar above the Oracle's words: it stays put while the text runs on below. */
const ctl = (html) => { $("ctl").innerHTML = rename(html); };
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
function poof() { const p = $("poof"); p.innerHTML = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * 6.28; return `<i style="--x:${Math.cos(a) * 110}px;--y:${Math.sin(a) * 70}px"></i>`; }).join("");
  p.classList.remove("go"); void p.offsetWidth; p.classList.add("go"); }

// ---- the conversation ----
const cap = (t) => { $("table-cap").textContent = rename(t || ""); };
const clearReading = () => { $("reading-body").innerHTML = ""; $("box").scrollTop = 0; };
// ---- pull-in (pullin.js): the daily gift ladder, the profile card, invite a friend ----
function modal(id, html) { $(id)?.remove(); const el = document.createElement("div"); el.id = id; el.className = "pull-modal"; el.innerHTML = html; document.body.append(el);
  const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), reduced ? 0 : 300); }; el.onclick = (e) => { if (e.target === el) close(); }; return { el, close }; }
function showGift() {
  if (!giftState(state.prog).ready || $("gift")) return;
  const m = modal("gift", giftHtml(state.prog, esc)); $("gift-take").focus();
  $("gift-take").onclick = () => { const g = claimGift(state.prog); if (!g) return m.close();
    saveProgress(); showStats(); chime(2); mood.emote(g.step === 6 ? "cheer" : "joy", { quiet: true });
    const box = m.el.querySelector(".gl.now"); box?.classList.add("open"); $("gift-take").disabled = true; $("gift-take").textContent = `+💎 ${g.amount}`;
    logEvent("gift", "🎁", `Daily gift, day ${g.step + 1}: 💎 ${g.amount}`, null, [["Ladder day", `${g.step + 1} of 7`], ["Essence", `💎 ${g.amount}${g.doubled ? " (doubled by the weekend event)" : ""}`], ["Essence after", `💎 ${state.prog.essence}`], ["Next gift", g.step === 6 ? "The ladder starts again at day 1" : `Day ${g.step + 2}, tomorrow`]]);
    mood.bubble(g.step === 6 ? `Seven days straight! 💎 ${g.amount}. The ladder starts again tomorrow.` : `💎 ${g.amount}. Same time tomorrow?`, 3600, "🎁");
    setTimeout(m.close, reduced ? 600 : 1500); };
}
function showProfile() {
  const recs = TRACKS.filter((t) => hasTrack(state.prog, t)).length, names = Object.fromEntries(available(MODULES).map((s) => [s.key, s.label]));
  const x = profileOf(state.prog, { name: state.name, records: recs, systems: names });
  const art = ($("teller").querySelector("svg")?.outerHTML || "").replace(/id="t-/g, 'id="pf-').replace(/#t-/g, "#pf-").replace(/\sid="(?!pf-)[^"]*"/g, "");
  const m = modal("profile", `<div class="pf-in" role="dialog" aria-label="Your profile card">${profileHtml(x, esc, art)}<div class="choices"><button class="c main" type="button" id="pf-share">📤 Share in the channel</button><button class="c" type="button" id="pf-x">Close</button></div><p class="pf-msg" id="pf-msg" aria-live="polite"></p></div>`);
  $("pf-x").onclick = m.close; $("pf-x").focus();
  $("pf-share").onclick = () => { const lines = profileLines(x), msg = (t) => { $("pf-msg").textContent = t; };
    if (state.token && state.channelId) fetch(api("/api/share"), { method: "POST", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify({ channelId: state.channelId, kind: "profile", title: `${state.name}'s card`, lines, color: "#E2B04A" }) })
      .then((r) => r.json()).then((r) => msg(r.ok ? "📤 Shared in the channel" : `Not shared: ${r.error || "try again"}`)).catch(() => msg("Not shared: offline"));
    else { try { navigator.clipboard.writeText(`🪪 ${state.name}'s card\n${lines.join("\n")}`).then(() => msg("📋 Card copied. Paste it in the chat."), () => msg("Sharing works inside Discord")); } catch { msg("Sharing works inside Discord"); } } };
}
function inviteFriend() {
  const paid = () => { const n = inviteSent(state.prog); if (n) { saveProgress(); showStats(); chime(1); mood.bubble(`Thank you! 💎 ${n} for spreading the word.`, 3200, "💌"); greet(); } else mood.bubble("Invite sent. The more the merrier.", 2600, "💌"); };
  if (state.sdk && state.sdk.commands && state.sdk.commands.openInviteDialog) state.sdk.commands.openInviteDialog().then(paid).catch(() => mood.bubble("The invite window didn't open. Try the + button in the Activity bar.", 3200, "💌"));
  else { try { navigator.clipboard.writeText("Come and sit at the Oracle Chamber with me: open the Activities menu in our voice channel and pick Science is Magic Oracle.").then(paid, () => mood.bubble("Invites work inside Discord.", 2600, "💌")); } catch { mood.bubble("Invites work inside Discord.", 2600, "💌"); } }
}
// ---- the living Chamber: a window on the real sky now (local hour, the Moon's true phase), shelves, herbs and dust ----
function paintScene() { let el = $("scene"); if (!el) { el = document.createElement("div"); el.id = "scene"; el.className = "scene"; el.setAttribute("aria-hidden", "true"); $("teller").before(el); }
  el.innerHTML = (hostScene(Date.now(), { prog: state.prog || {}, motes: reduced ? 0 : 14 }) || sceneHtml(Date.now(), { motes: reduced ? 0 : 14 })) + `<div class="mr-layer">${state.prog ? relicsHtml(state.prog) : ""}</div>` + leftBehindHtml(HOST().id); CU.paint(); }
paintScene(); setInterval(paintScene, 10 * 60e3);
/** A short cinematic wipe over the stage while the content changes underneath (door, smoke, shimmer, page). */
/** Two beats: the cover closes over the stage, fn swaps the view while it is shut, then the cover opens on the new view. */
function cine(kind, fn = () => {}) {
  if (reduced || !kind || cine.mid) { cine.mid = true; try { return fn(); } finally { cine.mid = false; } }
  document.querySelector(".cine")?.remove();
  const el = document.createElement("div"); el.className = "cine in cn-" + kind; el.setAttribute("aria-hidden", "true"); el.innerHTML = cineHtml(kind); $("stage").append(el);
  setTimeout(() => { cine.mid = true; try { fn(); } finally { cine.mid = false; } el.classList.replace("in", "out"); setTimeout(() => el.remove(), 700); }, 520);
}
/** Notification orbs on the menu: today's card, each game's daily, a new store week. */
function paintOrbs() {
  const o = orbsFor(state.prog), sb = $("store-btn"); sb.querySelector(".orb")?.remove(); if (o.store) sb.insertAdjacentHTML("beforeend", orbHtml(1, "New picks this week"));
  const ui_ = $("ui"); if (!ui_.querySelector(".home")) return;
  if (o.card) $("hm-daily")?.insertAdjacentHTML("beforeend", orbHtml(1, "Today's card is waiting"));
  for (const id of o.games) ui_.querySelector(`.hm-card[data-room="${id}"]`)?.insertAdjacentHTML("beforeend", orbHtml(1, "Today's daily challenge is open"));
  ui_.querySelectorAll(".hm-tab").forEach((t) => { const n = ui_.querySelectorAll(`[data-panel="${t.dataset.hm}"] .orb`).length; if (n) t.insertAdjacentHTML("beforeend", orbHtml(n, `${n} waiting`)); });
}
/** Discord's Activity iframe blocks <form> submission, so forms are plain divs: the #go button and Enter in a field run the div's onsubmit. */
function bindGo(id) {
  const box = $(id), run = () => { const bad = [...box.querySelectorAll("input[required]")].find((i) => !i.value.trim());
    if (bad) { bad.focus(); bad.reportValidity?.(); return; } box.onsubmit?.({ preventDefault() {} }); };
  $("go").onclick = run;
  box.querySelectorAll("input").forEach((i) => (i.onkeydown = (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); run(); } }));
}
// ---- idle chatter: after 30 s with no click or key, the chosen personality pipes up (first 3 lines chained, then shuffled) ----
const idle = { t: null, step: 0, used: [], on: false };
function idleReset() { clearTimeout(idle.t); idle.step = 0; mood.wake(); if (idle.on) idle.t = setTimeout(idleTick, IDLE_AFTER); }
function idleTick() {
  const b = document.body.classList, busy = state.inRoom || b.contains("talking") || b.contains("trance") || $("more") || document.hidden;
  if (!busy && idle.step >= 4) return mood.sleep(); // after four unanswered remarks she dozes off until you come back
  if (!busy) { idle.step++; say(hostLine("idle", state.name, idle.used) || idleLine(pid(), idle.step - 1, idle.used, state.name)); }
  idle.t = setTimeout(idleTick, IDLE_AFTER);
}
["pointerdown", "keydown", "wheel", "input"].forEach((ev) => addEventListener(ev, idleReset, { capture: true, passive: true }));

function greet() {
  if (!cine.mid && (state.inRoom || $("ui").querySelector(".depts"))) return cine(CINE.home, greet);
  state.inRoom = null; delete document.body.dataset.room; player.room(null); idle.on = true; idleReset();
  clearReading(); table.idle(); cap("");
  const roomBtn = (r) => `<button class="c room" type="button" data-room="${r.id}" title="${esc(r.blurb || "")}">${r.emoji} ${esc(r.label)}</button>`; // a room with row: "cards" sits in the By the cards row
  const sys = HOST().readings ? available(MODULES) : [], btn = (s) => `<button class="c" type="button" data-k="${s.key}">${s.emoji} ${esc(s.label)}</button>`;
  const st = liveStreak(state.prog), rk = rankOf(state.prog.xp).name;
  say((hostLine("greet", state.name) || line(P(), "greet", { name: state.name }) || greeting(state.name)) + (state.prog.readings ? ` Welcome back, ${rk}.` + (st > 1 ? ` ${st} days in a row now… the stars notice.` : "") : ""));
  showStats();
  const items = homeItems(sys, ROOMS.filter((r) => hasRoom(HOST(), r.id)), STUDY);
  ui(homeHtml(items, savedTab(), esc)); wireHome($("ui"), { reduced });
  $("ui").querySelector(".hm-quick")?.insertAdjacentHTML("beforebegin", eventBanner(esc));
  $("ui").querySelector(".hm-quick")?.insertAdjacentHTML("beforeend", `<button class="c" type="button" id="hm-card">🪪 My card</button><button class="c" type="button" id="hm-invite">💌 Invite a friend${state.prog.invited ? "" : ` <small>+💎${INVITE_REWARD}</small>`}</button>`);
  $("hm-card").onclick = showProfile; $("hm-invite").onclick = inviteFriend;
  { const dv = dailyVisit(state.prog, HOST(), new Date().toISOString().slice(0, 10)); if (dv) { saveProgress(); showStats(); setTimeout(() => mood.bubble(`First visit today: +${HOST().token.emoji} 1 ${HOST().token.name}.`, 3600, HOST().token.emoji), reduced ? 0 : 2600); } }
  if (HOST().relics) { $("ui").querySelector(".hm-quick")?.insertAdjacentHTML("beforeend", `<button class="c" type="button" id="hm-relics">${HOST().relicLabel} <small>${tokenIcon(HOST().token)} ${tokensLeft(state.prog, HOST())}</small></button>`); $("hm-relics").onclick = openHouseRelics; }
  if (HOST().secrets) { $("ui").querySelector(".hm-quick")?.insertAdjacentHTML("beforeend", `<button class="c" type="button" id="hm-secrets">${HOST().secrets.label} <small>${secretCount(state.prog, HOST())}/${secretsOf(HOST()).length}</small></button>`); $("hm-secrets").onclick = openHouseSecrets; }
  if (clueCount(state.prog)) { $("ui").querySelector(".hm-quick")?.insertAdjacentHTML("beforeend", `<button class="c" type="button" id="hm-dossier">🎭 Dossier <small>${clueCount(state.prog)}/${CLUES.length}</small></button>`); $("hm-dossier").onclick = openDossier; }
  if (HOST().menuBg) { $("ui").classList.add("has-mbg"); $("ui").insertAdjacentHTML("afterbegin", HOST().menuBg.html(Date.now(), { prog: state.prog })); }
  secretEvent("home", { at: Date.now() });
  $("hm-daily").onclick = () => (HOST().daily ? openRoom(HOST().daily) : choose(systemByKey("tarot")));
  $("hm-surprise").onclick = () => { const all = [...items.question, ...items.cards, ...items.birth, ...items.play], it = all[Math.floor(Math.random() * all.length)];
    mood.emote("wink", { quiet: true }); it.kind === "sys" ? choose(systemByKey(it.id)) : openRoom(it.id); };
  $("ui").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => choose(systemByKey(b.dataset.k))));
  $("ui").querySelectorAll("[data-room]").forEach((b) => (b.onclick = () => openRoom(b.dataset.room)));
  $("ui").querySelectorAll("[data-study]").forEach((b) => (b.onclick = () => openStudy(b.dataset.study)));
  paintOrbs();
}

// ---- House tokens (hosts/tokens.js): a stray token from another House sometimes turns up and is sent home ----
function strayCheck() {
  const home = strayFind(state.prog, HOST(), HOSTS, new Date().toISOString().slice(0, 10)); if (!home) return;
  saveProgress(); showStats(); setTimeout(() => { mood.emote("wow", { quiet: true }); mood.bubble(strayLine(HOST(), home), 6000, home.token.emoji); }, reduced ? 0 : 2200);
}
function openHouseRelics(note) {
  const H = HOST(); state.inRoom = null; delete document.body.dataset.room; clearReading(); table.idle(); cap(H.relicLabel);
  say(typeof note === "string" ? note : H.relicBlurb); ui(relicPanelHtml(state.prog, H, esc));
  $("ui").querySelectorAll("[data-hrelic]").forEach((b) => (b.onclick = () => { const r = buyHouseRelic(state.prog, H, b.dataset.hrelic); if (!r) return; logEvent("buy", r.e, `${H.house}: placed ${r.name}`, null, [["House", H.house], ["Relic", r.name], ["Price", `${H.token.emoji} ${r.price}`]]);
    saveProgress(); showStats(); applyLook(); chime(2); mood.emote("cheer"); openHouseRelics(`${r.name}. It stays in my House now, for good. Look behind me.`); }));
  $("hr-back").onclick = greet;
}

// ---- Study: every game's study guides, one tap from the main menu (study.js). Rooms can send players here with ctx.study(id). ----
function openStudy(roomId, back) {
  const x = studyFor(roomId); if (!x) return greet();
  if (!document.getElementById("study-style")) { const st = document.createElement("style"); st.id = "study-style"; st.textContent = STUDY_CSS; document.head.appendChild(st); }
  state.inRoom = null; delete document.body.dataset.room; clearReading(); table.idle(); cap(`📖 Study: ${x.name}`);
  const show = (g) => { const rb = $("reading-body"); rb.innerHTML = studyHtml(g); rb.querySelector(".sh-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
    $("ui").querySelectorAll("[data-guide]").forEach((b) => b.classList.toggle("main", b.dataset.guide === g.id)); };
  say(x.guides.length > 1 ? `The ${x.name} library. ${x.guides.length} guides: pick one and read at your own pace.` : `Everything ${x.name} asks is in here. Read at your own pace.`);
  ui(`<div class="choices">${x.guides.map((g) => `<button class="c small" type="button" data-guide="${g.id}">${g.emoji} ${esc(g.title.replace(/ study guide$/i, ""))}</button>`).join("")}</div>
    <div class="choices"><button class="c main" type="button" id="study-play">▶ Play ${esc(x.name)}</button><button class="c" type="button" id="study-back">${back ? "↩ Back" : "✦ Back to the Oracle"}</button></div>`);
  $("ui").querySelectorAll("[data-guide]").forEach((b) => (b.onclick = () => show(x.guides.find((g) => g.id === b.dataset.guide))));
  $("study-play").onclick = () => openRoom(roomId);
  $("study-back").onclick = () => (back ? back() : greet());
  show(x.guides[0]);
}

// ---- rooms: games inside the Chamber (src/<room>/). Each exports { id, label, emoji, blurb, open(ctx), codexHtml? }
// and keeps its progress in state.prog.rooms[id] (with a plays counter, so merge() counts it). ----
const ROOMS = [{ ...seance, codexHtml: seanceCodex }, { ...decoder, codexHtml: decoderCodex }, { ...timeline, codexHtml: timelineCodex }, { ...alchemy, codexHtml: alchemyCodex }, { ...calendar, codexHtml: calendarCodex }, { ...grimoire, codexHtml: grimoireCodex }, { ...starLore, codexHtml: starsCodex }, { ...duel, codexHtml: duelCodex }, { ...memory, codexHtml: memoryCodex }, { ...rummy, codexHtml: rummyCodex }, { ...flametest, codexHtml: flametestCodex }, { ...minerals, codexHtml: mineralsCodex }, { ...watch, codexHtml: watchCodex }, { ...inscriptions, codexHtml: inscriptionsCodex }, { ...bench, codexHtml: benchCodex }, { ...casefiles, codexHtml: casefilesCodex }, { ...comet, codexHtml: cometCodex }, { ...commissions, codexHtml: commissionsCodex }, { ...fireworks, codexHtml: fireworksCodex }, { ...cipherdesk, codexHtml: cipherdeskCodex }, { ...workshop, codexHtml: workshopCodex }, { ...bookings, codexHtml: bookingsCodex }, { ...darkseance, codexHtml: darkseanceCodex }, { ...mentalist, codexHtml: mentalistCodex }, { ...eclipse, codexHtml: eclipseCodex }, { ...celestialNavigator, codexHtml: navigatorCodex }, { ...messier, codexHtml: messierCodex }, { ...starParty, codexHtml: starPartyCodex }];
for (const r of ROOMS) [r.shop, ...(r.shops || [])].forEach(registerShelf);
bookShop.preview = (id, ctx) => { const b = BOOKS.find((x) => x.id === id); if (!b) return; ctx.tableEl.className = "table bkp-show"; ctx.tableEl.innerHTML = bookPreviewHtml(b); ctx.cap("📖 " + b.name); bookSfx("cover"); setTimeout(() => bookSfx("page"), 1300); };
hostShelves().forEach(registerShelf); registerShelf(recordShop); registerShelf(bookShop); registerShelf(familiarShop); registerShelf(gemShop); // the 🎵 Records shelf (music.js) // each room may export shop = { kind, label, items, talk, preview } (see store.js)
/** Add ✦ and 💎 from a room, keeping ranks in step. Returns { rankUp } (the new rank's name or null). */
function award(xp = 0, essence = 0) {
  const p = state.prog, before = rankOf(p.xp).name;
  p.xp += xp; p.essence = (p.essence || 0) + essence;
  const after = rankOf(p.xp).name, rankUp = after !== before ? after : null;
  if (rankUp) p.essence += 25;
  return { rankUp };
}
function openRoom(id, arg = null) {
  const r = ROOMS.find((x) => x.id === id); if (!r) return greet();
  if (state.inRoom !== id && !cine.mid) return cine(CINE.room, () => openRoom(id, arg));
  state.inRoom = id; document.body.dataset.room = id; chat.n = 0; chat.next = 3; chat.at = Date.now() - 12000; player.room(id);
  const roomAward = (xp, es) => { const eb = eventBoost(id, xp, es); xp = eb.xp; es = eb.es; const r = award(xp, es); if (!mood.mood() && (xp || es)) mood.emote(r.rankUp ? "cheer" : "joy", { quiet: true }); if (xp || es) strayCheck(); return r; };
  r.open({ $, esc, say, ui, talkThrough, cap, clearReading, table, tableEl: $("table"), state, saveProgress, showStats, chime, applyLook, greet, wait, reduced, award: roomAward, trophy, emote: mood.emote, bubble: mood.bubble, banter: roomBanter, study: (rid = id, back) => openStudy(rid, back),
    arg, go: (rid, a) => openRoom(rid, a), reading: (k) => { const sys = systemByKey(k); if (sys) choose(sys); } }); // reading: open one of the Oracle's readings (e.g. "astrology") // arg: optional entry hint from another room (e.g. { ghost } or { script }); go: jump to another room
}

function choose(sys) {
  if (readsLeft(state.prog, rankOf(state.prog.xp).name) <= 0) return outOfReadings(sys);
  clearReading(); table.rest(sys.key); cap(sys.emoji + " " + sys.label);
  say(line(P(), "ask", { name: state.name, system: sys.label }) || askLine(sys, state.name));
  if (sys.kind === "cast") {
    const spreadSel = sys.spreads ? `<label for="sp">Spread<select id="sp">${sys.spreads.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></label>` : "";
    ui(`<div class="form one" id="f"><label for="q">Your question (optional)<input id="q" maxlength="200" autocomplete="off" placeholder="What do I need to know about…"></label>${spreadSel}</div>
      <div class="choices"><button class="c main" type="button" id="go">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>`);
    $("f").onsubmit = (e) => { e.preventDefault(); const q = $("q").value.trim(), extra = q ? { [sys.ask || "question"]: q } : {};
      if ($("sp")) extra.spread = $("sp").value;
      reveal(sys, optionsFor(sys, extra), q); };
    setTimeout(() => $("q").focus(), 50);
  } else {
    const p = state.profile || {}, o0 = optionsFor(sys), f = fieldsFor(sys.command, o0), need = f.need || ["date", "place", "time"];
    const field = (id, label, ph, val, req) => `<label for="${id}">${label}<input id="${id}" ${req ? "required" : ""} placeholder="${ph}" value="${esc(val)}" autocomplete="off"></label>`;
    const rows = [field("d", "Birth date (DD/MM/YYYY)", "09/04/1990", dmy(p.date || ""), true)];
    if (need.includes("time")) rows.push(field("t", "Time (blank if unknown)", "14:30", p.time && p.time !== "unknown" ? p.time : "", false));
    if (need.includes("place")) rows.push(field("p", "Town or city, country", "Phoenix, USA", p.place, true));
    if (need.includes("name")) rows.push(field("n", "Full birth name", "Mary Ann Smith", p.name, true));
    const opt = f.opt || []; // optional extras: asked for, never required
    if (opt.includes("time")) rows.push(field("t", "Birth time (optional, adds depth)", "14:30", p.time && p.time !== "unknown" ? p.time : "", false));
    if (opt.includes("place")) rows.push(field("p", "Birth town or city (optional)", "Phoenix, USA", p.place, false));
    rows.push(field("bq", "Your question (optional)", "What should I focus on this year?", "", false));
    ui(`<div class="form" id="f">${rows.join("")}</div>
      <div class="choices"><button class="c main" type="button" id="go">✦ Reveal</button><button class="c" type="button" id="back">Choose another</button></div>
      <div class="note">${PREVIEW ? PREVIEW.note + " " : state.profile ? "Filled in from your saved /profile. " : ""}Your details stay in this reading; nothing is posted to the channel.</div>`);
    $("f").onsubmit = (e) => { e.preventDefault();
      const o = optionsFor(sys), v = (id) => ($(id) ? $(id).value.trim() : "");
      o[f.date] = v("d");
      if (need.includes("place")) o[f.place] = v("p");
      if (need.includes("name")) o[f.name] = v("n");
      if (need.includes("time")) { if (v("t")) o[f.time] = v("t"); else o.time_unknown = true; }
      for (const [k, id] of [["time", "t"], ["place", "p"]]) if (opt.includes(k) && v(id)) o[f[k]] = v(id);
      reveal(sys, o, v("bq")); };
  }
  bindGo("f");
  $("back").onclick = greet;
}

async function reveal(sys, options, question = "") {
  if (readsLeft(state.prog, rankOf(state.prog.xp).name) <= 0) return outOfReadings(sys);
  ui(""); clearReading(); state.q = question; markCard(state.prog);
  { const mw = CU.event("ask", question); if (mw) setTimeout(() => mood.bubble(mw, 4600, "🪄"), 300); }
  // The trance: the Oracle closes her eye and raises her hands for 3 seconds, humming, while the table casts.
  document.body.classList.add("trance"); mood.clear(); refreshEnergy(); cap(sys.emoji + " " + (line(P(), "cast", { system: sys.label }) || CAST[sys.key] || "The mist is moving…"));
  clearTimeout(typing); $("say").textContent = "…"; $("sr").textContent = "The Oracle closes her eye and raises her hands.";
  trance(3);
  let r, err;
  try {
    const mod = MODS[sys.command];
    if (sys.row === "cards") { const n = (sys.spreads ? ({ one: 1, pair: 2, three: 3, line: 3, five: 5, square: 9, celtic: 10 }[options.spread] || 3) : 3); cardDeal(n, n > 5 ? 0.13 : 0.2); }
    [r] = await Promise.all([mod.run(options, { user: state.name, birthDetail: true }), table.cast(sys.key, options), wait((sys.key === "tarot" && options.spread === "celtic") || (sys.key === "lenormand" && options.spread === "square") ? 3600 : 3000)]);
  } catch (e) { err = e; }
  document.body.classList.remove("trance"); refreshEnergy(); cap(sys.emoji + " " + sys.label);
  if (err) {
    table.rest(sys.key);
    mood.emote("nervous");
    say("The glass clouds over. " + (err.message || "Something went wrong."));
    ui(`<div class="choices"><button class="c main" type="button" id="again">Try again</button><button class="c" type="button" id="back">Choose another</button></div>`);
    $("again").onclick = () => choose(sys); $("back").onclick = greet; return;
  }
  $("table").classList.add("fade"); mood.gesture("snap"); await wait(450);
  poof(); await wait(250);
  const files = (r.files || []).map(svgOf).filter(Boolean);
  layArt(files);
  { const rb = $("reading-body"); rb.innerHTML = readingCardHtml(sys, r, headline(r.embeds[0], r.headline), esc); const rc = $("rc");
    setTimeout(() => rc && rc.classList.add("flip"), reduced ? 0 : 350);
    rc.onclick = () => { const d = document.querySelector("details.written"); if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); } else rc.classList.toggle("flip"); }; }
  const words = line(P(), "reveal", { name: state.name, system: sys.label, result: headline(r.embeds[0], r.headline) }) || speech(sys.command, state.name, r.embeds[0], Math.random, r.headline);
  const text = r.embeds.map((e) => [e.description, ...(e.fields || []).map((f) => f.name + ": " + f.value)].join(" ")).join(" ");
  const lore = codexNotes(state.prog, sys.key, r);
  state.last = { sys, r, words, files, text, deeper: deeperPages(r, question, lore), di: 0, quips: 0 };
  logEvent("reading", sys.emoji, `${sys.label}${question ? ` · “${question.slice(0, 80)}”` : ""}: ${headline(r.embeds[0], r.headline)}`, null,
    [["System", sys.label], ["Your question", question || ""], ["Headline", headline(r.embeds[0], r.headline)], ["The Oracle said", words], ...r.embeds.flatMap((e) => [[e.title || "Reading", e.description || ""], ...(e.fields || []).map((f) => [f.name, f.value])])]);
  useRead(state.prog); const gain = record(state.prog, sys.key, r); musicNews(); setTimeout(collectNews, reduced ? 0 : 4200); saveProgress(); showStats(); trophyNews(recordReading(state.prog, available(MODULES).length));
  const a = answer(question, text, state.name, r.analysis);
  const pages = [{ text: words, mood: "wow" }, { text: deliver(pid(), a.line, { name: state.name }), mood: question ? moodForTone(a.tone) : "think" },
    ...(lore.length > 1 ? [{ text: `Your Codex adds this, ${state.name}. ${lore.slice(1, 3).join(" ")}`, mood: "think" }] : []), { text: joke(sys.key), after: "laugh" }];
  if (pid() === "standup") setTimeout(rimshot, 400);
  talkThrough(pages, () => { afterReading(); reward(gain, sys); });
}

/** Out of Chamber readings for today: say so with style, and offer a day pass, the store, or the chat commands. */
function outOfReadings(sys) {
  const p = state.prog, rk = rankOf(p.xp).name, nx = nextRank(p.xp), lim = dailyLimit(rk);
  table.rest(sys.key);
  mood.emote("sad");
  say(`The glass is resting, ${state.name}. A ${rk} gets ${lim} reading${lim === 1 ? "" : "s"} a day in the Chamber. Union rules for crystal balls. ${nx ? `Reach ${nx.name} for more.` : ""} A day pass buys one more, or ask me with /oracle in chat, where the line never closes.`);
  ui(`<div class="choices"><button class="c main" type="button" id="pass" ${p.essence >= DAY_PASS ? "" : "disabled"}>🎟️ Day pass: +1 reading (💎 ${DAY_PASS}, you have ${p.essence})</button><button class="c" type="button" id="shop">💎 Store</button><button class="c" type="button" id="back">✦ Back</button></div>`);
  $("pass").onclick = () => { if (buyDayPass(p)) { saveProgress(); chime(1); showStats(); choose(sys); } };
  $("shop").onclick = () => showStore(); $("back").onclick = greet;
}

/** The menu once the Oracle has answered: go deeper, ask another question, save, or start again. */
function afterReading() {
  const L = state.last, more = L.di < L.deeper.length;
  ui(`<details class="written"><summary>📜 The full written reading</summary><div id="written"></div></details>`);
  ctl(`<div class="choices"><button class="c main" type="button" id="deeper" ${more ? "" : "disabled"}>🔮 ${more ? "Go deeper" : "That's the bottom of the well"}</button><button class="c" type="button" id="askq">❓ Ask another question</button><button class="c" type="button" id="save">📖 Save to journal</button><button class="c" type="button" id="back">✦ Another reading</button>${L.files.length ? `<button class="c" type="button" id="big">🔍 Enlarge the art</button>` : ""}</div>`);
  $("deeper").onclick = goDeeper;
  $("askq").onclick = askAgain;
  $("save").onclick = (e) => { saveJournal(L); e.target.textContent = "✓ Saved"; e.target.disabled = true; };
  $("back").onclick = greet;
  if ($("big")) $("big").onclick = () => zoom(L.files[0]);
  showReading(L, $("written"));
}

/** Go deeper: the Oracle keeps talking about the same reading, two parts at a time, with the odd aside. */
function goDeeper() {
  const L = state.last; deepen();
  const pages = L.deeper.slice(L.di, L.di + 2); L.di += pages.length;
  if (state.q && L.di <= 2) pages.push(`Hold your question close: “${state.q}”. This is the part that touches it.`);
  if (L.di >= L.deeper.length) pages.push(`That's everything the glass will show me, ${state.name}. Any more and I'd be making it up, and I have standards.`);
  else pages.push(joke(L.sys.key));
  talkThrough(pages, afterReading, { keep: true });
}

/** Ask another question: cast systems cast again; birth systems answer from the same chart. */
function askAgain() {
  const L = state.last;
  ui(""); ctl(`<div class="form one" id="qf"><label for="q2">What else would you like to know?<input id="q2" maxlength="200" autocomplete="off" placeholder="Should I…, When will…, What do I need to…"></label></div>
    <div class="choices"><button class="c main" type="button" id="go">✦ Ask</button><button class="c" type="button" id="cancel">Never mind</button></div>`);
  setTimeout(() => $("q2").focus(), 50);
  $("cancel").onclick = afterReading;
  $("qf").onsubmit = (e) => { e.preventDefault(); const q = $("q2").value.trim(); if (!q) return;
    if (L.sys.kind === "cast") { reveal(L.sys, optionsFor(L.sys, { [L.sys.ask || "question"]: q }), q); return; }
    clearTimeout(typing); state.q = q; document.body.classList.add("trance"); trance(2); keepLine(); $("say").textContent = "…"; ui("");
    setTimeout(() => { document.body.classList.remove("trance");
      talkThrough([deliver(pid(), answer(q, L.text, state.name, L.r.analysis).line, { name: state.name }), joke(L.sys.key)], afterReading, { keep: true }); }, reduced ? 0 : 2000);
  };
  bindGo("qf");
}

let talkKey = null;
/** Speak pages one after another. Each page stays on screen above the next; keep also holds what was said before this run. */
function talkThrough(pages, done, { keep = false } = {}) {
  let i = 0;
  const next = () => {
    if (i >= pages.length) { removeEventListener("keydown", talkKey); talkKey = null; done(); return; }
    const raw = pages[i++], page = raw.text ?? raw, last = i >= pages.length;
    if (raw.mood) mood.emote(raw.mood);
    if (i > 1 || keep) keepLine(); else $("said").innerHTML = "";
    ui(""); ctl(`<div class="talkbar"><button class="c small" type="button" id="skip">Skip ⏭</button></div>`);
    $("skip").onclick = () => say.finish && say.finish(); // Skip only skips the typing effect: the full text shows at once
    say(page, () => {
      if (raw.after) mood.emote(raw.after);
      ctl(`<div class="talkbar"><button class="c main" type="button" id="more">${last ? "✦ Done" : "▸ Continue"}</button><span class="note">or press Space</span></div>`);
      $("more").onclick = next;
    }, { keep: true });
  };
  if (talkKey) removeEventListener("keydown", talkKey);
  talkKey = (e) => { if ((e.key === " " || e.key === "Enter") && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) {
    if ($("more")) { e.preventDefault(); $("more").click(); } else if (say.finish) { e.preventDefault(); say.finish(); } } };
  addEventListener("keydown", talkKey);
  next();
}

// ---- the game layer: rewards, stats, Codex and wardrobe ----
function reward(g, sys) {
  const bits = [`<b>+${g.xp} ✦ · +${g.essence} 💎</b>`];
  if (g.firstSystem) bits.push(`first ${esc(sys.label)} reading`);
  if (g.newItems.length) bits.push(`new in your Codex: ${g.newItems.map(esc).join(", ")}`);
  if (g.firstToday) bits.push(`🌙 moon token · 🔥 ${g.streak}-day streak`);
  const el = document.createElement("div"); el.className = "reward";
  el.innerHTML = `<div>${bits.join(" · ")}</div>` + (g.rankUp ? `<div class="up">🏅 You are now <b>${esc(g.rankUp)}</b></div>` : "") +
    g.unlocked.map((u) => `<div class="up">✨ Unlocked ${u.kind === "cloth" ? "table cloth" : "crystal ball"}: <b>${esc(u.name)}</b> <button class="c small" type="button" data-wear="${u.id}">Use it</button></div>`).join("");
  $("ui").appendChild(el);
  el.querySelectorAll("[data-wear]").forEach((b) => (b.onclick = () => { wear(b.dataset.wear); b.textContent = "✓ On"; b.disabled = true; }));
  if (g.rankUp) mood.emote("cheer", { quiet: true }); else if (g.essence) mood.emote("joy", { quiet: true });
  if (g.rankUp || g.unlocked.length || g.newItems.length) { chime(g.rankUp || g.unlocked.length ? 2 : 1); $("table-pane").classList.remove("sparkle"); void $("table-pane").offsetWidth; $("table-pane").classList.add("sparkle"); }
}

function showStats() {
  const p = state.prog, rk = rankOf(p.xp), nx = nextRank(p.xp);
  const pct = nx ? Math.round(((p.xp - rk.at) / (nx.at - rk.at)) * 100) : 100;
  $("stats").innerHTML = `<span class="rank" title="${nx ? `${nx.at - p.xp} ✦ to ${esc(nx.name)}` : "The highest rank"}">🏅 ${esc(rk.name)} <i style="--p:${pct}%"></i></span><span title="Day streak">🔥 ${liveStreak(p)}</span><span title="Moon tokens to spend on Moon relics. Earn them with your first reading each day and by beating game levels.">🌙 ${moonLeft(p)}</span><span title="Essence">💎 ${p.essence || 0}</span><span title="Chamber readings left today">🔮 ${(() => { const l = readsLeft(p, rk.name); return l === Infinity ? "∞" : l + " left"; })()}</span>${state.booster ? `<span class="booster" title="Boosting the Science is Magic server. Thank you!">💜 Booster</span>` : ""}${showcaseHtml(p)}`; $("stats").insertAdjacentHTML("beforeend", houseChip(p));
  setTimeout(() => { try { musicNews(); } catch {} }, 0); // Essence-based records (Coin Drop Groove) unlock as the total changes
}

const EARNED_DESIGN = { velvet: "", starchart: "constellations", goldleaf: "filigree", moonlit: "moonphases", obsidian: "obsidian" };
const EARNED_INK = { starchart: "#c9d4ff", goldleaf: "#FFF3C4", moonlit: "#e9f0ff", obsidian: "#b06cff" };
const owns = (id) => state.prog.unlocked.includes(id) || (state.prog.owned || []).includes(id);
const lookItem = (id) => UNLOCKS.find((x) => x.id === id) || item(id);
function wear(id) {
  const u = lookItem(id); if (!u || !owns(id)) return;
  if (u.kind === "record") { const t = trackOf(id), L = musicOf(state.prog).list; if (t && !L.includes(t.id)) togglePlaylist(state.prog, t.id); saveProgress(); player.refresh(); player.play(t.id); return; }
  const changed = state.prog[u.kind] !== id; state.prog[u.kind] = id; saveProgress(); applyLook(); if (changed) flourish(u.kind);
}
function applyLook(over = {}) {
  const p = { ...state.prog, ...over }, svg = $("teller").querySelector("svg"), root = document.documentElement;
  const c = lookItem(p.cloth) || UNLOCKS[0], o = lookItem(p.orb), fl = item(p.flame) || item("goldflame"), out = item(p.outfit) || item("midnight"), av = item(p.avatar) || item("classic");
  const vibe = item(p.vibe) || item("chamber"), LK = lookOf(p), A = withCreator(AVATAR_LOOK[av.id] || AVATAR_LOOK.classic, LK);
  // table: cloth colours and design, candles
  const t = $("table"); c.c.forEach((v, i) => t.style.setProperty(`--cloth${i + 1}`, v));
  const design = c.design || EARNED_DESIGN[c.id] || "", ink = c.ink || EARNED_INK[c.id] || "#E2B04A";
  setTableDecor({ cardback: p.cardback && p.cardback !== "cb-deck" ? p.cardback : "", design: design && CLOTH_DESIGN[design] ? CLOTH_DESIGN[design](ink) : "", ink, wax: fl.wax, flame: fl.flame, halo: fl.halo, detail: fl.detail || "",
    fx: (CLOTH_FX[design] || CLOTH_FX[""])(ink), trim: clothTrim(ink), gem: gemSvg(p.gem || "gem-quartz") });
  table.refresh();
  root.style.setProperty("--orb-filter", o ? o.f : "none");
  const O = orbFx(o ? o.id : "amethyst");
  svg.querySelector(".o-glassbody").setAttribute("fill-opacity", O.glass);
  svg.querySelector('[clip-path="url(#t-orbclip)"].o-glass').style.display = O.swirl ? "" : "none";
  $("orb-fx").innerHTML = O.fx;
  // robe: colours, trim and its element
  const stops = (id, cols) => svg.querySelectorAll(`#${id} stop`).forEach((s, i) => cols[i] && s.setAttribute("stop-color", cols[i]));
  stops("t-hood", out.hood);
  svg.querySelectorAll('.o-body [stroke="#E2B04A"], .o-body [data-trim], .o-sleeves, .o-sleeves [data-trim]').forEach((e) => { if (e.closest(".o-hands")) return; e.dataset.trim = "1"; e.setAttribute("stroke", LK.trim || out.trim); });
  const fx = robeFx(out.element); $("fx-back").innerHTML = fx.back; $("fx-robe").innerHTML = fx.robe; $("fx-front").innerHTML = fx.front;
  // avatar: face, eye, pupil, hands and extras
  stops("t-face", A.face); stops("t-iris", A.iris);
  const lid = svg.querySelector(".o-lid path"); lid.setAttribute("fill", A.white);
  const pupil = svg.querySelector(".o-iris ellipse"); pupil.setAttribute("rx", A.pupil[0]); pupil.setAttribute("ry", A.pupil[1]);
  $("av-pupil").innerHTML = A.star ? STAR_PUPIL : "";
  svg.querySelectorAll(".o-ppupil").forEach((e) => { e.setAttribute("rx", (A.pupil[0] * 0.42).toFixed(2)); e.setAttribute("ry", (A.pupil[1] * 0.42).toFixed(2)); e.setAttribute("fill", A.star ? "#fff6c8" : "#2a0420"); });
  svg.querySelectorAll(".o-pe-white").forEach((e) => e.setAttribute("fill", A.white));
  svg.querySelectorAll("[data-skin]").forEach((e) => e.setAttribute(e.dataset.skin, A.hands.skin));
  svg.querySelectorAll(".o-hands [data-edge]").forEach((e) => e.setAttribute("stroke", A.hands.edge));
  svg.querySelectorAll(".o-hands .o-nail").forEach((e) => { e.setAttribute("fill", A.hands.nail); e.setAttribute("r", (e.dataset.r * A.hands.nailR).toFixed(1)); });
  $("teller").dataset.hands = A.handFx || ""; $("teller").dataset.element = out.element || "";
  $("av-back").innerHTML = av.back || ""; $("av-hood").innerHTML = av.hood || ""; $("av-face").innerHTML = av.face2 || ""; $("av-front").innerHTML = (av.front || "") + (A.eye || "");
  // vibe: theme, fonts, background, star colours
  { const pane = $("teller").parentElement, fid = p.familiar && p.familiar !== "fam-none" ? p.familiar : ""; let fe = $("familiar");
    if (fid) { if (!fe) { fe = document.createElement("div"); fe.id = "familiar"; fe.setAttribute("aria-hidden", "true"); pane.append(fe); } if (fe.dataset.id !== fid) { fe.dataset.id = fid; fe.className = "familiar " + fid; fe.innerHTML = familiarSvg(fid); } }
    else if (fe) fe.remove(); }
  { const ws = wornSet(p), pane = $("teller").parentElement; pane.dataset.set = ws ? ws.id : ""; let au = $("set-aura");
    if (ws && (!au || au.dataset.id !== ws.id)) { if (!au) { au = document.createElement("div"); au.id = "set-aura"; au.className = "set-aura"; au.setAttribute("aria-hidden", "true"); pane.prepend(au); } au.dataset.id = ws.id; au.innerHTML = setAuraHtml(ws.id); }
    else if (!ws && au) au.remove(); }
  root.dataset.vibe = vibe.id; starColors = vibe.stars || starColors;
  if (applyLook.vibe !== vibe.id) { applyLook.vibe = vibe.id; $("vfx-o").innerHTML = vibeFx(vibe.id, "o"); $("vfx-t").innerHTML = vibeFx(vibe.id, "t"); }
  const v = item(p.voice); setVoiceStyle(HOST().voice || (v ? v.v : null));
  paintHost(svg, p, "t");
  // every candle in the Chamber (Memory's candle row, the séance wax) burns in the equipped candles
  root.style.setProperty("--cw1", fl.wax[0]); root.style.setProperty("--cw2", fl.wax[1]);
  root.style.setProperty("--cf1", fl.flame[1]); root.style.setProperty("--cf2", fl.flame[2]); root.style.setProperty("--ch", fl.halo);
  applyCrown(svg, p);
  refreshEnergy();
}
/** The Star Crown: the Oracle's permanent reward once a member has finished every game on every level. */
function applyCrown(svg, p) {
  const old = svg.querySelector(".o-crown"); if (!hasCrown(p)) { if (old) old.remove(); return; } if (old) return;
  const st = (x, y, r, d) => `<path class="cr-star" style="--d:${d}s" d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z"/>`;
  const pts = [[132, 40, 7], [154, 26, 9], [178, 18, 10], [200, 12, 14], [222, 18, 10], [246, 26, 9], [268, 40, 7]];
  svg.insertAdjacentHTML("beforeend", `<g class="o-crown" aria-hidden="true"><ellipse class="cr-halo" cx="200" cy="34" rx="78" ry="16" fill="none" stroke="#FADE8C" stroke-width="3" opacity=".75"/>
    <ellipse cx="200" cy="34" rx="78" ry="16" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="2 9" opacity=".8"/>
    <g fill="#FADE8C" stroke="#fff" stroke-width="1.2">${pts.map(([x, y, r], i) => st(x, y, r, (i * 0.3).toFixed(1))).join("")}</g></g>`);
}

// ---- the Essence store ----
let trying = null; // a store item being tried on: { kind, id }
const pickLine = (pool, vars) => { const opts = pool.filter((l) => l !== pickLine.last); const l = opts[Math.floor(Math.random() * opts.length)] || pool[0]; pickLine.last = l; return l.replace(/\{item\}/g, vars.item || "").replace(/\{name\}/g, state.name); };
const emojiOf = (kind) => kindLabel(kind).split(" ")[0];
/** A small picture of a store item for its card: the real card back, or swatches made from the item's own colours. */
function thumb(it) {
  const k = it.kind;
  if (k === "cardback") return it.id === "cb-deck" ? `<span class="th">🂠</span>` : `<span class="th th-card">${cardBackSvg(it.id)}</span>`;
  if (k === "outfit" && it.hood) return `<span class="th th-robe" style="--a:${it.hood[0]};--b:${it.hood[1]};--t:${it.trim}"></span>`;
  if (k === "cloth" && it.c) return `<span class="th th-cloth" style="--a:${it.c[0]};--b:${it.c[2]};--t:${it.ink || EARNED_INK[it.id] || "#E2B04A"}"></span>`;
  if (k === "book") { const b = BOOKS.find((x) => x.id === it.id); if (b) return `<span class="th th-book">${coverSvg(b, "", "th")}</span>`; }
  if (k === "record") return `<span class="th th-rec">${vinylSvg(trackOf(it.id), 46)}</span>`;
  if (k === "ghost") return `<span class="th th-ghost"><svg viewBox="110 0 180 210" aria-hidden="true"><defs><linearGradient id="sc-sheet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c9c4e6" stop-opacity=".75"/></linearGradient></defs><g class="sc-gb sg-${it.id}">${ghostBody(it.id)}</g></svg></span>`;
  if (k === "orb") return `<span class="th th-orb" style="filter:${it.f || "none"}"></span>`;
  if (k === "flame" && it.wax) return `<span class="th th-flame" style="--w:${it.wax[0]};--f:${it.flame[1]};--h:${it.halo}"></span>`;
  if (k === "vibe" && it.stars) return `<span class="th th-vibe" style="--a:${it.stars[0]};--b:${it.stars[1]}"></span>`;
  return `<span class="th">${emojiOf(k)}</span>`;
}
const ACTIVE_KINDS = ["voice", "vibe", "persona"]; // "Active" reads better than "Wearing" for these
/** The store: five departments, each with its shelves; `tab` is the open shelf (a kind, or "haunted"). */
function showStore(tab = "outfit", opener = null) {
  if (!$("ui").querySelector(".depts") && !cine.mid) return cine(CINE.store, () => showStore(tab, opener));
  markStore(state.prog); $("store-btn").querySelector(".orb")?.remove();
  clearReading(); cap(trying ? "👁 Trying on: " + (trying.set ? `the ${LOOK_SETS.find((x) => x.id === trying.set).name} set` : lookItem(trying.id)?.name || "") : "💎 The Essence store"); table.idle();
  const p = state.prog, depts = departments(), dept = deptOf(tab);
  say(opener || (p.essence ? `Ah, a customer. You have ${p.essence} Essence, ${state.name}. Everything here is cosmetic. Destiny is not for sale. Lip gloss for the crystal ball, however…` : "Essence comes from readings, traveller. Every ✦ you earn is a drop of 💎 Essence. Come back with a full pocket."));
  const earnedOf = (k) => (k === "cloth" || k === "orb" ? UNLOCKS.filter((u) => u.kind === k).map((u) => ({ ...u, earned: true })) : []);
  const goodsFor = (k) => (k === "creator" ? [] : k === "seasonal" ? SEASONAL : k === "featured" ? [...featured(), rareOf()].filter(Boolean) : k === "sets" ? STORE.filter((x) => x.set) : k === "boxes" || k === "moon" ? [] : [...earnedOf(k), ...goodsOf(k)]);
  const deptBtns = depts.filter((d) => d.kinds.length).map((d) => { const all = d.kinds.filter((k) => k !== "haunted").flatMap(goodsFor), have = all.filter((it) => owns(it.id)).length;
    return `<button class="dept${d.id === dept.id ? " on" : ""}" type="button" data-tab="${d.kinds[0]}" title="${esc(d.blurb)}"><b>${d.label}</b><small>${have} / ${all.length} owned</small></button>`; }).join("");
  const tabs = dept.kinds.length > 1 ? `<div class="choices tabs">${dept.kinds.map((k) => `<button class="c small${k === tab ? " on" : ""}" type="button" data-tab="${k}">${kindLabel(k)}</button>`).join("")}</div>` : "";
  const cardOf = (it, i) => { const k = it.kind, own = owns(it.id), on = p[k] === it.id, tri = trying && trying.id === it.id;
    const act = on ? `<button class="c small" type="button" disabled>✓ ${ACTIVE_KINDS.includes(k) ? "Active" : "Wearing"}</button>`
      : own ? `<button class="c small" type="button" data-w="${it.id}">${k === "record" ? "▶ Play" : "Use"}</button>`
      : it.earned ? `<span class="note">🔒 ${esc(it.how)}</span>`
      : (() => { const pr = priceNow(it.id); return pr == null ? `<span class="note">Not on sale this week</span>` : `<button class="c small main" type="button" data-buy="${it.id}" ${p.essence >= pr ? "" : "disabled"}>${pr < it.price ? `<s>${it.price}</s> ` : ""}💎 ${pr}</button>`; })();
    const tryBtn = k === "record" ? `<button class="c small" type="button" data-listen="${it.id}">▶ Listen</button>` : k === "voice" ? `<button class="c small" type="button" data-hear="${it.id}">▶ Hear</button>` : k === "persona" ? `<button class="c small" type="button" data-hearp="${it.id}">▶ Hear</button>` : on ? "" : `<button class="c small${tri ? " on" : ""}" type="button" data-try="${it.id}">${tri ? "✓ Trying on" : "👁 Try on"}</button>`;
    return `<div class="shop-card${on ? " on" : ""}${tri ? " try" : ""}${it.rare ? " rare" : ""}" style="--i:${i}">${thumb(it)}<div class="sc-body"><b>${esc(it.name)}</b>${tab === "haunted" ? `<span class="sc-tag">${kindLabel(k)}</span>` : ""}${it.note ? `<span class="note">${esc(it.note)}</span>` : ""}<div class="sc-acts">${tryBtn}${act}</div></div></div>`; };
  let cards;
  if (tab === "featured") { const F = featured(), R = rareOf(), left = weekEnds() - Date.now(), d = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5);
    cards = `<div class="feat-head"><b>🗓️ This week's picks, ${Math.round(FEATURED_OFF * 100)}% off</b><span class="feat-clock">⏳ New picks in ${d}d ${h}h</span></div>${F.map(cardOf).join("")}`
      + (R ? `<div class="feat-head rare"><b>💠 Rare find</b><span class="feat-clock">Only sold this week</span></div>${cardOf(R, 4)}` : `<div class="feat-head"><span class="note">No rare find this week. Rare items show up two weeks in three.</span></div>`); }
  else if (tab === "seasonal") { const sn = seasonNow();
    cards = SEASONS.map((se) => { const on = sn && sn.id === se.id, its = SEASONAL.filter((x) => x.season === se.id), days = Math.ceil((seasonOpens(se.id) - Date.now()) / 864e5);
      return `<div class="feat-head${on ? " rare" : ""}"><b>${se.e} ${esc(se.name)}</b><span class="feat-clock">${on ? "On sale now" : `Returns in ${days} day${days === 1 ? "" : "s"}`}</span></div>${its.map(cardOf).join("")}`; }).join(""); }
  else if (tab === "creator") { const L = lookOf(p);
    cards = `<div class="creator">${Object.entries(CREATOR).map(([k, c]) => `<div class="cr-row"><b>${esc(c.label)}</b><div class="cr-opts">${c.opts.map(([v, l]) => `<button type="button" class="cr-sw${L[k] === v ? " on" : ""}${v ? "" : " auto"}" data-cr="${k}" data-v="${v}" title="${esc(l)}" aria-label="${esc(c.label)}: ${esc(l)}" aria-pressed="${L[k] === v}" style="${v && v.startsWith("#") ? `--sw:${v}` : ""}">${v && !v.startsWith("#") ? esc(l) : v ? "" : "Auto"}</button>`).join("")}</div></div>`).join("")}
      <p class="note">Free, and on top of any avatar or robe. "Auto" uses the avatar's or robe's own colours.</p><button class="c small" type="button" data-cr-reset="1">↺ Reset to Auto</button></div>`
      + emoteBookHtml(p, esc, (id) => (item(id) || {}).name || id, { modal: false, skin: hostEmote }); }
  else if (tab === "sets") cards = LOOK_SETS.map((st, si) => { const pr = setProgress(p, st), items = Object.values(st.kinds).map((id) => STORE.find((x) => x.id === id)).filter(Boolean), worn = pr.worn === pr.of;
    return `<div class="set-head${worn ? " worn" : ""}" data-set-id="${st.id}"><b>${st.e} ${esc(st.name)}</b><span class="note">${esc(st.blurb)} when all four are worn.</span><span class="set-prog">${pr.own}/${pr.of} owned</span>${pr.own === pr.of ? `<button class="c small${worn ? "" : " main"}" type="button" data-wearset="${st.id}" ${worn ? "disabled" : ""}>${worn ? "✓ Set worn" : "Wear the set"}</button>` : ""}<button class="c small" type="button" data-tryset="${st.id}">👁 Try the set</button></div>${items.map((it, i) => cardOf(it, si * 4 + i)).join("")}`; }).join("");
  else if (tab === "moon") cards = `<div class="note box-note">🌙 ${moonLeft(p)} moon tokens to spend. Moon relics stay in the Oracle's chamber for good, all at once. Earn them with your first reading each day and the first time you beat each game level: Level 1 🌙2, Level 2 🌙4, Level 3 🌙6, and 🌙3 more for beating all three. One game's full series is about one good relic.</div>`
    + RELICS.map((r, i) => { const own = ownsRelic(p, r.id); return `<div class="shop-card mr-card${own ? " owned" : ""}" style="--i:${i}"><span class="th th-relic">${relicThumb(r)}</span><div class="sc-body"><b>${r.e} ${esc(r.name)}</b><span class="note">${esc(r.note)}</span>
      <div class="sc-acts">${own ? `<span class="note">✓ In your chamber</span>` : `<button class="c small main" type="button" data-relic="${r.id}" ${moonLeft(p) >= r.price ? "" : "disabled"}>Place it · 🌙 ${r.price}</button>`}</div></div></div>`; }).join("")
    + `<h4 class="mr-h">🐾 Familiars <small class="note">One keeps the Oracle company at a time. Swap them any time for free.</small></h4>`
    + FAMILIARS.map((f, i) => { const own = f.price === 0 || owns(f.id), on = (p.familiar || "fam-none") === f.id, n = FAMILIAR_TOKENS[f.id];
      return `<div class="shop-card mr-card${on ? " owned" : ""}" style="--i:${i}"><span class="th th-relic">${f.id === "fam-none" ? "✖" : familiarSvg(f.id)}</span><div class="sc-body"><b>${esc(f.name)}</b><span class="note">${esc(f.note)}</span>
      <div class="sc-acts">${on ? `<span class="note">✓ With the Oracle</span>` : own ? `<button class="c small" type="button" data-famwear="${f.id}">${f.id === "fam-none" ? "Send them off" : "Bring along"}</button>` : `<button class="c small main" type="button" data-fambuy="${f.id}" ${moonLeft(p) >= n ? "" : "disabled"}>Adopt · 🌙 ${n}</button>`}</div></div></div>`; }).join("");
  else if (tab === "boxes") cards = BOXES.map((bx, i) => { const P = boxPool();
    return `<div class="shop-card box-card" style="--i:${i}"><span class="th th-box">${bx.e}</span><div class="sc-body"><b>${esc(bx.name)}</b><span class="note">One item from the store. A duplicate gives back ${Math.round(REFUND * 100)}% (💎 ${Math.round(bx.price * REFUND)}).</span>
      <table class="odds">${BOX_TIERS.map((t) => `<tr><td>${t.name}</td><td>${bx.odds[t.id]}%</td><td class="note">${P[t.id].length} items${t.max === Infinity ? ", over 200" : `, up to ${t.max}`} 💎</td></tr>`).join("")}</table>
      <div class="sc-acts"><button class="c small main" type="button" data-box="${bx.id}" ${p.essence >= bx.price ? "" : "disabled"}>Open · 💎 ${bx.price}</button></div></div></div>`; }).join("") + `<div class="note box-note">Boxes use Essence only, which you earn by playing. Nothing in the Chamber is sold for real money.</div>`;
  else cards = goodsFor(tab).map(cardOf).join("");
  const left = readsLeft(p, rankOf(p.xp).name);
  ui(`<div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
    <div class="cx-top"><b>💎 ${p.essence} Essence</b> · readings left today: ${left === Infinity ? "unlimited" : left}
      ${left === Infinity ? "" : `<button class="c small" type="button" id="pass" ${p.essence >= DAY_PASS ? "" : "disabled"}>🎟️ Day pass: +1 reading today (💎 ${DAY_PASS})</button>`}</div>
    <div class="note">Daily readings by rank: ${DAILY.filter((d, i) => i < 4).map((d) => `${d.rank} ${d.n === Infinity ? "unlimited" : d.n}`).join(" · ")}. The /oracle commands in chat are always unlimited.</div>
    <div class="depts">${deptBtns}</div><div class="dept-blurb">${dept.label}: ${esc(dept.blurb)}.${tab === "cardback" ? " The back you pick is dealt in tarot, Lenormand, the Science is Magic deck, Grimoire Memory, Constellation Rummy and Element Duel." : ""}</div>
    ${tabs}<div class="shop grid">${cards}</div>`);
  const talk = (kind, act, it) => pickLine(((SHOP_TALK[kind] || SHOP_TALK.outfit)[act]) || SHOP_TALK.outfit[act], { item: it ? it.name : "" });
  $("back").onclick = () => { trying = null; $("teller").parentElement.classList.remove("showroom"); applyLook(); greet(); };
  applyLook(trying ? (trying.set ? { ...LOOK_SETS.find((x) => x.id === trying.set).kinds } : { [trying.kind]: trying.id }) : {});
  { const pane = $("teller").parentElement, show = (!!trying && ["outfit", "avatar", "set", "familiar"].includes(trying.kind)) || tab === "creator"; pane.classList.toggle("showroom", show); }
  if (tab === "cardback") { const bid = trying && trying.kind === "cardback" ? trying.id : p.cardback;
    if (CARD_BACK[bid]) { const t = $("table"); t.className = "table cb-show"; t.innerHTML = `<div class="cb-fan">${[-2, -1, 0, 1, 2].map((r, i) => `<i style="--r:${r * 13}deg;--i:${i}">${cardBackSvg(bid)}</i>`).join("")}</div>`; } // the back, fanned out
    else { showStore.deck = showStore.deck || ["tarot", "lenormand", "magicdeck"][Math.floor(Math.random() * 3)]; table.rest(showStore.deck); } }
  const sh = trying ? shelf(trying.kind) : null; if (sh && sh.preview) sh.preview(trying.id, { table, tableEl: $("table"), cap, esc, prog: state.prog });
  else if (tab === "book") bookShop.preview(bookOf(state.prog).id, { table, tableEl: $("table"), cap: () => {}, esc, prog: state.prog }); // the binding you own, on the table
  $("ui").querySelectorAll("[data-try]").forEach((b) => (b.onclick = () => { const it = lookItem(b.dataset.try);
    const off = trying && trying.id === it.id; trying = off ? null : { kind: it.kind, id: it.id }; if (!off) mood.emote("curious"); showStore(tab, off ? talk(tab, "open") : talk(it.kind, "tryon", it)); if (!off) flourish(it.kind); }));
  if ($("pass")) $("pass").onclick = () => { if (buyDayPass(p)) { saveProgress(); checkout(); showStats(); showStore(tab, "One more reading, coming right up. The glass thanks you for your patronage."); } };
  $("ui").querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { trying = null; showStore.deck = null; showStore(b.dataset.tab, talk(b.dataset.tab, "open")); }));
  $("ui").querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { trying = null; wear(b.dataset.w); const it = lookItem(b.dataset.w); showStore(tab, talk(it.kind, "tryon", it)); }));
  $("ui").querySelectorAll("[data-listen]").forEach((b) => (b.onclick = () => { const it = item(b.dataset.listen); player.preview(b.dataset.listen); say(talk("record", "tryon", it)); }));
  $("ui").querySelectorAll("[data-hearp]").forEach((b) => (b.onclick = () => { const it = item(b.dataset.hearp), Q = persona(it.id);
    say(`${talk("persona", "tryon", it)} ${line(Q, "greet", { name: state.name }) || greeting(state.name)} ${personaQuip(it.id, state.name, []) || quip("iching", state.name, [])}`); }));
  $("ui").querySelectorAll("[data-hear]").forEach((b) => (b.onclick = () => { const cur = item(p.voice); setVoiceStyle(item(b.dataset.hear).v); say(talk("voice", "tryon", item(b.dataset.hear)), () => setVoiceStyle(cur ? cur.v : null)); }));
  $("ui").querySelectorAll("[data-cr]").forEach((b) => (b.onclick = () => { const L = (p.look ||= {}); L[b.dataset.cr] = b.dataset.v; saveProgress(); applyLook(); flourish("avatar"); mood.emote(b.dataset.cr === "iris" || b.dataset.cr === "pupil" ? "wink" : "joy", { quiet: true }); showStore("creator", "Ooh. Let me see in the glass."); }));
  $("ui").querySelectorAll("[data-slot]").forEach((b) => (b.onclick = () => slotTap(b.dataset.slot)));
  $("ui").querySelectorAll("[data-cr-reset]").forEach((b) => (b.onclick = () => { p.look = {}; saveProgress(); applyLook(); showStore("creator", "Back to my natural look. Classic."); }));
  $("ui").querySelectorAll("[data-wearset]").forEach((b) => (b.onclick = () => { const st = LOOK_SETS.find((x) => x.id === b.dataset.wearset); trying = null;
    for (const [k, id] of Object.entries(st.kinds)) if (owns(id)) state.prog[k] = id; saveProgress(); applyLook(); flourish("outfit"); mood.emote("joy"); showStore("sets", `The full ${st.name} set. ${st.blurb}. Now that is a look.`); }));
  $("ui").querySelectorAll("[data-tryset]").forEach((b) => (b.onclick = () => { const st = LOOK_SETS.find((x) => x.id === b.dataset.tryset), off = trying && trying.set === st.id;
    trying = off ? null : { set: st.id, kind: "set", id: st.id }; if (!off) { mood.emote("wow"); flourish("outfit"); } showStore("sets", off ? null : `The ${st.name} set, all four pieces. ${st.blurb}.`); }));
  $("ui").querySelectorAll("[data-relic]").forEach((b) => (b.onclick = () => { const r = buyRelic(p, b.dataset.relic); if (!r) return;
    saveProgress(); showStats(); paintScene(); chime(3); burst(); mood.emote("wow");
    logEvent("buy", "🌙", `Placed a Moon relic: ${r.name}`, null, [["Relic", `${r.e} ${r.name}`], ["Price", `🌙 ${r.price}`], ["Moon tokens left", `🌙 ${moonLeft(p)}`], ["Where", "In the Oracle's chamber, for good"]]);
    showStore("moon", `${r.name}. It stays in my chamber now, for good. Look behind me.`); }));
  $("ui").querySelectorAll("[data-fambuy]").forEach((b) => (b.onclick = () => { const id = b.dataset.fambuy, f = FAMILIARS.find((x) => x.id === id); if (!buyFamiliar(p, id)) return;
    logEvent("buy", "🐾", `Adopted a familiar: ${f.name}`, null, [["Familiar", f.name], ["Price", `🌙 ${FAMILIAR_TOKENS[id]}`], ["Moon tokens left", `🌙 ${moonLeft(p)}`]]);
    saveProgress(); showStats(); chime(2); wear(id); mood.emote("love"); showStore("moon", `${f.name} moves in. Say hello.`); }));
  $("ui").querySelectorAll("[data-famwear]").forEach((b) => (b.onclick = () => { wear(b.dataset.famwear); showStore("moon"); }));
  $("ui").querySelectorAll("[data-box]").forEach((b) => (b.onclick = () => { const bx = BOXES.find((x) => x.id === b.dataset.box), r = openBox(p, bx.id); if (!r) return;
    saveProgress(); showStats(); checkout(); trying = null; logEvent("buy", bx.e, `Opened a ${bx.name}: ${r.item.name} (${r.tier})${r.dupe ? `, a duplicate, ${r.refund} Essence back` : ""}`, null, [["Box", bx.name], ["Price", `💎 ${bx.price}`], ["Inside", r.item.name], ["Rarity", r.tier], ["Duplicate", r.dupe ? `Yes, 💎 ${r.refund} back` : "No, it is new"], ["Essence after", `💎 ${p.essence}`]]);
    const t = $("table"); t.className = "table box-show"; t.innerHTML = `<div class="box-open tier-${r.tier}"><div class="box-rays"></div><div class="box-lid">${bx.e}</div><div class="box-prize">${thumb(r.item)}<b>${esc(r.item.name)}</b><small>${esc(r.tier)}${r.dupe ? ` · duplicate · +${r.refund} 💎` : " · new!"}</small></div></div>`;
    mood.emote(r.tier === "epic" ? "wow" : r.dupe ? "sulk" : "joy"); if (!reduced) bookSfx("cover");
    setTimeout(() => { chime(r.tier === "common" ? 1 : 2); if (!r.dupe) burst(); }, 1100);
    setTimeout(() => showStore("boxes", r.dupe ? `${r.item.name} again. You already own it, so ${r.refund} Essence goes back in your pocket.` : `${r.tier === "epic" ? "EPIC! " : ""}${r.item.name}! It's yours. Find it on its own shelf to put it on.`), reduced ? 0 : 3200); }));
  $("ui").querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => { const it = item(b.dataset.buy); const pr = priceNow(it.id); if (buyNow(p, it.id)) { logEvent("buy", "💎", `Bought ${it.name} for ${pr} Essence`, null, [["Item", it.name], ["Price", `💎 ${pr}`], ["Essence after", `💎 ${p.essence}`]]); trying = null; checkout(); wear(it.id); saveProgress(); showStats(); burst(); mood.emote("love", { quiet: true }); showStore(tab, talk(it.kind, "buy", it)); } }));
  if (PREVIEW) { const t = document.createElement("div"); t.className = "note"; t.innerHTML = `Preview only: <button class="c small" type="button" id="tester">🧪 +500 💎 and reset today's readings</button>`; $("ui").appendChild(t);
    $("tester").onclick = () => { p.essence += 500; p.day = null; saveProgress(); showStats(); showStore(tab); }; }
}
function burst() { const tp = $("table-pane"); tp.classList.remove("sparkle"); void tp.offsetWidth; tp.classList.add("sparkle"); }
$("store-btn").onclick = () => showStore();

function showCodex() { return openBook("codex"); }
/** A Science is Magic card's page from the Codex: meaning, fact, and the explainer behind it. */
function explainCard(name) {
  const c = MAGIC_DECK.find((x) => x.n === name), x = EXPLAIN[name]; if (!c || !x) return;
  const su = MAGIC_SUITS.find((q) => q.key === c.suit); chime(1);
  cap(`🔬 ${name}`); say(`${name}. ${x.link}`);
  ui(`<div class="choices"><button class="c" type="button" id="mx-back">◂ Back to the Codex</button></div>
    <article class="emb teal mx-page"><h2>✦ ${esc(name)} · ${esc(su.n)} ${c.num === "K" ? "Keeper" : c.num}</h2><p><i>${esc(c.kw.join(", "))}</i></p>
      <h3>The card</h3><p>${esc(c.up)}</p><h3>🔬 The fact</h3><p>${esc(c.fact)}</p><h3>The science</h3><p>${esc(x.sci)}</p><h3>Why it fits</h3><p>${esc(x.link)}</p></article>`);
  $("mx-back").onclick = () => openBook("codex");
}
// ---- Your Grimoire (book.js): the member's book, holding the Codex, the Journal (a log by day, timestamped) and Patterns ----
const logKey = () => "oracle-log:" + state.userId;
const loadLog = () => { try { const L = JSON.parse(localStorage.getItem(logKey()) || "null"); if (Array.isArray(L)) return L; } catch { /* none */ }
  // first open: bring in the readings saved before the Journal kept a log
  return loadJournal().map((e) => ({ at: e.at, k: "save", e: "📖", t: `Saved a ${e.label} reading: ${String(e.title).replace(/^\P{L}+/u, "")}`, ref: e.at })); };
function logEvent(k, e, t, ref = null, d = null) { try { localStorage.setItem(logKey(), JSON.stringify(addLog(loadLog(), k, e, t, ref, Date.now(), d))); } catch { /* storage full or blocked */ } }
const BK = { sec: "codex", sys: null, entry: null, day: null, busy: false };
function closeBook() { const el = $("book"); if (!el) return; el.classList.add("closing"); bookSfx("close"); setTimeout(() => el.remove(), reduced ? 0 : 450); }
function openBook(sec = "codex") {
  const old = $("book"); if (old) old.remove();
  const b = bookOf(state.prog); BK.sec = sec; BK.entry = null; BK.li = null;
  const el = document.createElement("div"); el.id = "book"; el.className = "book-ov"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Your Grimoire");
  el.innerHTML = `<div class="bk-stage" data-page="${b.page}" data-fx="${b.fx || ""}" style="--cv1:${b.cover[0]};--cv2:${b.cover[1]};--foil:${b.foil}">
    <div class="bk-top"><nav class="bk-tabs" role="tablist">${[["codex", "📜 Codex"], ["journal", "🗓️ Journal"], ["patterns", "📊 Patterns"], ["charts", "🔭 My charts"], ["secrets", "🗝️ Secrets"]].map(([k, l]) => `<button type="button" class="bk-tab" role="tab" data-bsec="${k}">${l}</button>`).join("")}</nav>
      <button type="button" class="bk-sigil" id="bk-sigil" aria-label="The sigil on the spine">${emblemSvg(b)}</button><button class="c small" type="button" id="bk-share">📤 Share page</button><button class="c small" type="button" id="bk-store">💎 Bindings</button><button class="c small" type="button" id="bk-x" aria-label="Close Your Grimoire">✕ Close</button></div>
    <div class="bk-book"><div class="bk-pages"><div class="bk-endpaper" aria-hidden="true"></div><div class="bk-page bk-left" id="bk-left"></div><div class="bk-page bk-right" id="bk-right"></div>
      <div class="bk-leaves" id="bk-leaves" aria-hidden="true"></div></div><div class="bk-ribbons" id="bk-ribbons"></div>
      <div class="bk-cover" id="bk-cover" aria-hidden="true"><div class="bk-cv-front">${coverSvg(b, "Your Grimoire")}</div></div></div></div>`;
  document.body.append(el); drawBook();
  $("bk-x").onclick = closeBook; $("bk-store").onclick = () => { closeBook(); showStore("book"); }; $("bk-share").onclick = sharePageNow;
  let taps = []; $("bk-sigil").onclick = () => { const now = Date.now(); taps = [...taps.filter((t) => now - t < 3000), now]; const g = $("bk-sigil"); g.classList.remove("poke"); void g.offsetWidth; g.classList.add("poke"); bookSfx("page");
    if (taps.length >= 7) { taps = []; revealSecret("diary"); turnTo(() => { BK.sec = "diary"; }, false, 6); } };
  el.querySelectorAll("[data-bsec]").forEach((t) => (t.onclick = () => { if (t.dataset.bsec === BK.sec) return; const order = ["codex", "journal", "patterns", "charts", "secrets"], back = order.indexOf(t.dataset.bsec) < order.indexOf(BK.sec);
    turnTo(() => { BK.sec = t.dataset.bsec; BK.entry = null; BK.li = null; }, back, 6); }));
  el.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBook(); });
  bookSfx("cover"); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open"))); setTimeout(() => el.classList.add("ready"), reduced ? 0 : 1500); $("bk-x").focus();
}
/** Turn a page: the leaf sweeps over, and the new pages are drawn under it halfway through. */
/** Turn the pages: n leaves riffle over in a quick stagger (more for a jump to another section); the view changes under them. */
function turnTo(change, back = false, n = 3) {
  if (BK.busy) return; const box = $("bk-leaves"); if (!box) return;
  if (reduced) { change(); drawBook(); return; }
  const STEP = 75, DUR = 640; BK.busy = true; bookSfx(n > 3 ? "riffle" : "page"); if (n > 1 && n <= 3) setTimeout(() => bookSfx("page", { gain: 0.7 }), STEP * (n - 1));
  box.innerHTML = Array.from({ length: n }, (_, i) => `<i class="bk-lf${back ? " back" : ""}" style="--i:${i};--n:${n}"></i>`).join("");
  setTimeout(() => { change(); drawBook(); }, Math.floor((n - 1) / 2) * STEP + DUR * 0.5);
  setTimeout(() => { box.innerHTML = ""; BK.busy = false; }, (n - 1) * STEP + DUR + 40);
}
function drawBook() {
  const p = state.prog, L = $("bk-left"), R = $("bk-right"); if (!L) return;
  document.querySelectorAll("#book [data-bsec]").forEach((t) => { t.classList.toggle("on", t.dataset.bsec === BK.sec); t.setAttribute("aria-selected", String(t.dataset.bsec === BK.sec)); });
  const sys = available(MODULES), [lh, rh] = BK.sec === "journal" ? journalPages(p) : BK.sec === "patterns" ? patternPages(p, sys) : BK.sec === "secrets" ? secretPages(p) : BK.sec === "charts" ? chartsPages(p) : BK.sec === "diary" ? diaryPages(p) : BK.sec === "cabinet" ? cabinetPages(p) : codexPages(p, sys);
  const mg = CIPHER.find((c) => c.sec === BK.sec);
  L.innerHTML = lh + (INK[BK.sec] ? inkHtml(BK.sec) : ""); R.innerHTML = rh + (mg ? `<div class="bk-margin" aria-label="Runes in the margin">${mg.n} · ${toRunes(mg.w)}</div>` : ""); R.scrollTop = 0;
  bookCodes(p, L, R);
  bookExtras(p);
  const on = (sel, fn) => document.querySelectorAll("#book " + sel).forEach((b) => (b.onclick = () => fn(b)));
  on("[data-bs]", (b) => turnTo(() => { BK.sys = b.dataset.bs; BK.entry = null; }));
  on("[data-be]", (b) => turnTo(() => { BK.entry = b.dataset.be; }));
  on("[data-bback]", () => turnTo(() => { BK.entry = null; }, true));
  on("[data-day]", (b) => { const older = BK.day && b.dataset.day < BK.day; turnTo(() => { BK.day = b.dataset.day; BK.li = null; }, !older); });
  document.querySelectorAll("#book [data-li]").forEach((li) => { const go = (e) => { if (e.target.closest("button")) return; turnTo(() => { BK.li = +li.dataset.li; }, false, 1); };
    li.onclick = go; li.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(e); } }; });
  on("[data-liback]", () => turnTo(() => { BK.li = null; }, true, 1));
  on("[data-li-go]", (b) => turnTo(() => { BK.li = +b.dataset.liGo; }, b.dataset.dir === "back", 1));
  on("[data-open]", (b) => openSaved(+b.dataset.open));
  on("[data-w]", (b) => { wear(b.dataset.w); drawBook(); });
  on("[data-jview]", (b) => { BK.view = b.dataset.jview; drawBook(); });
  on("[data-mon]", (b) => turnTo(() => { const [y, m] = BK.ym || [new Date().getFullYear(), new Date().getMonth()], d = new Date(y, m + +b.dataset.mon, 1); BK.ym = [d.getFullYear(), d.getMonth()]; }, +b.dataset.mon < 0));
  on("[data-mark]", (b) => { toggleMark(b.dataset.mark, b.dataset.label); drawBook(); });
  on("[data-wb]", (b) => wearBook(b.dataset.wb));
  on("[data-secret-go]", (b) => turnTo(() => { BK.sec = b.dataset.secretGo; }, false, 6));
  on("[data-seal]", () => breakSeal());
  if (BK.sec === "charts") bindCharts();
}
// ---- My charts (mycharts.js): every chart's data from the saved birth details, what is stored where, and the delete controls ----
const profKey = (pr) => JSON.stringify(pr || null);
function chartsPages(p) {
  const pr = state.profile, rows = storedRows(p, { hasProfile: !!pr, signedIn: !!state.token });
  const saved = pr ? `<dl class="mc-dl"><dt>Birth date</dt><dd>${esc(dmy(pr.date || ""))}</dd><dt>Birth time</dt><dd>${esc(pr.time && pr.time !== "unknown" ? pr.time : "unknown")}</dd><dt>Birth place</dt><dd>${esc(pr.place || "not saved")}</dd><dt>Birth name</dt><dd>${esc(pr.name || "not saved")}</dd>${pr.saved ? `<dt>Saved</dt><dd>${new Date(pr.saved).toLocaleDateString()}</dd>` : ""}</dl>` : `<p class="bk-empty">No birth details saved.</p>`;
  const left = pageHead("🔭 My charts", "Your personal data: what is kept, where, and how to remove it") + saved
    + `<div class="mc-store">${rows.map(([k, what, from, where, del]) => `<div class="mc-row"><b>${k}</b><span>${esc(what)}</span><small>From: ${esc(from)} · Kept: ${esc(where)} · Remove: ${esc(del)}</small></div>`).join("")}</div>
    <div class="choices"><button class="c small" type="button" id="mc-del" ${pr ? "" : "disabled"}>🗑️ Delete my saved birth details</button><button class="c small" type="button" id="mc-clear">🧹 Clear this device's Journal</button></div>
    <p class="bk-note" id="mc-msg" role="status">Nothing here is posted to the channel. Your charts are worked out on this page and never stored.</p>`;
  const cached = BK.charts && BK.charts.key === profKey(pr) ? BK.charts.list : pr ? null : [];
  return [left, pageHead("📐 Your chart data", "The data first. Tap a chart to open a reading of what it may mean.") + `<div id="mc-out">${chartsHtml(cached, esc)}</div>`];
}
function bindCharts() {
  const pr = state.profile, k = profKey(pr), out = $("mc-out");
  const bindRead = () => document.querySelectorAll("#book [data-mc-read]").forEach((b) => (b.onclick = () => { const sys = systemByKey(b.dataset.mcRead); if (!sys) return; closeBook(); clearReading(); choose(sys); }));
  bindRead();
  if (pr && !(BK.charts && BK.charts.key === k)) chartData(pr).then((list) => { BK.charts = { key: k, list }; const o = $("mc-out"); if (o && BK.sec === "charts") { o.innerHTML = chartsHtml(list, esc); bindRead(); } })
    .catch(() => { if (out) out.innerHTML = `<p class="bk-empty">These charts could not be worked out right now.</p>`; });
  const msg = (t) => { const m = $("mc-msg"); if (m) m.textContent = t; };
  const twoStep = (id, ask, act) => { const b = $(id); if (!b) return; b.onclick = () => { if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = ask; msg("Tap again to confirm. This cannot be undone."); return; } act(); }; };
  twoStep("mc-del", "⚠️ Tap again to delete", async () => {
    if (state.token) { const r = await fetch(api("/api/profile"), { method: "DELETE", headers: { authorization: "Bearer " + state.token } }).catch(() => null); if (!r || !r.ok) { msg("The delete did not go through. Try again, or use /profile delete in Discord."); return; } }
    state.profile = null; BK.charts = null; bookSfx("page"); drawBook(); msg(state.token ? "Deleted. Your birth details are gone from storage." : "Cleared for this visit (preview: nothing was saved)."); logEvent("data", "🗑️", "Deleted my saved birth details");
  });
  twoStep("mc-clear", "⚠️ Tap again to clear", () => { try { localStorage.removeItem(logKey()); localStorage.removeItem(jKey()); } catch { /* blocked */ } bookSfx("page"); drawBook(); msg("This device's Journal and saved readings are cleared."); });
}
const pageHead = (t, sub = "") => `<h3 class="bk-h">${t}</h3>${sub ? `<div class="bk-sub">${sub}</div>` : ""}`;
/** One book for every House: each House's host, purse, relics, hidden finds and looks, all in the same Grimoire. */
function housesPage(p) {
  const card = (h) => { const hp = ((p.houses || {})[h.id]) || {}, sec = secretsOf(h), found = sec.filter((s) => (hp.sec || []).includes(s.id)), rel = h.relics || [];
    const tok = h.token.id === "moon" ? `🌙 ${p.tokens || 0} moon tokens` : `${tokenIcon(h.token)} ${tokensLeft(p, h)} ${esc(h.token.plural)}`;
    const placed = h.token.id === "moon" ? "" : `<p>🏛️ ${rel.filter((r) => (hp.relics || []).includes(r.id)).length} of ${rel.length} relics placed${(hp.relics || []).length ? `: ${rel.filter((r) => (hp.relics || []).includes(r.id)).map((r) => esc(r.name)).join(", ")}` : ""}</p>`;
    const secrets = sec.length ? `<p>🔍 ${esc(h.secrets.label)}: ${found.length} of ${sec.length}${found.length ? ` · ${found.map((s) => s.e + " " + esc(s.name)).join(", ")}` : ""}</p>` : "";
    return `<div class="bk-house" style="border-left:3px solid ${h.accent};padding-left:8px;margin:8px 0"><h4>${h.emoji} ${esc(h.house)} <small>· ${esc(h.name)}</small></h4><p>${tok}${hp.rounds ? ` · ${hp.rounds} rounds played here` : ""}</p>${placed}${secrets}</div>`; };
  return pageHead("🏠 The Houses", "One Grimoire for every House: your progress in each, kept in the same book") + HOSTS.map(card).join("");
}
function codexPages(p, sys) {
  const rk = rankOf(p.xp), nx = nextRank(p.xp);
  if (!BK.sys) BK.sys = (sys.find((s) => (p.codex[s.key] || []).length) || sys[0] || {}).key || "rooms";
  const row = (k, label, n, t) => `<button type="button" class="bk-row${BK.sys === k ? " on" : ""}" data-bs="${k}"><span>${label}</span>${t ? `<small>${n} / ${t}</small><i style="--p:${t ? Math.min(100, (n / t) * 100) : 0}%"></i>` : ""}</button>`;
  const left = pageHead("📜 The Codex", `🏅 ${esc(rk.name)} · ${p.xp} ✦${nx ? ` · ${nx.at - p.xp} ✦ to ${esc(nx.name)}` : ""} · ${p.readings} readings`)
    + `<div class="bk-list">${sys.map((s) => { const d = CODEX[s.key]; return row(s.key, `${s.emoji} ${esc(s.label)}`, (p.codex[s.key] || []).length, d ? d.total : 0); }).join("")}
      ${row("rooms", "🎲 Game rooms")}${row("houses", "🏠 The Houses")}${row("looks", "🏅 Ranks and earned looks")}${row("sealed", hasCrown(p) ? "👑 The sealed chapter" : "🔒 The sealed chapter")}</div>`;
  let right = "";
  if (BK.sys === "sealed") right = sealedPage(p);
  else if (BK.sys === "houses") right = housesPage(p);
  else if (BK.sys === "rooms") right = pageHead("🎲 Game rooms") + `<div class="bk-rooms">${ROOMS.filter((r) => r.codexHtml).map((r) => r.codexHtml(p, esc)).join("") || `<p class="bk-empty">Play a game room to fill these pages.</p>`}</div>`;
  else if (BK.sys === "looks") {
    const look = (kind) => UNLOCKS.filter((u) => u.kind === kind).map((u) => { const own = p.unlocked.includes(u.id), on = p[kind] === u.id;
      return `<button class="c small wear${on ? " on" : ""}" type="button" data-w="${u.id}" ${own ? "" : "disabled"} title="${esc(u.how)}">${own ? (on ? "✓ " : "") : "🔒 "}${esc(u.name)}</button>`; }).join("");
    right = pageHead("🏅 Ranks and earned looks") + `<p class="bk-note">${RANKS.map((r) => `${r.name} ${r.at}✦`).join(" → ")}</p><h4>Table cloths</h4><div class="choices">${look("cloth")}</div><h4>Crystal balls</h4><div class="choices">${look("orb")}</div>`;
  } else {
    const s = sys.find((x) => x.key === BK.sys), d = CODEX[BK.sys], have = p.codex[BK.sys] || [], seen = (p.seen || {})[BK.sys] || {};
    if (BK.entry && s) {
      const n = BK.entry, c = BK.sys === "magicdeck" ? MAGIC_DECK.find((x) => x.n === n) : null, x = c ? EXPLAIN[n] : null;
      right = `<button type="button" class="bk-back" data-bback="1">◂ ${esc(s.label)}</button>${markBtn(`entry|${BK.sys}|${n}`, `${s.emoji} ${n}`)}` + pageHead(`${s.emoji} ${esc(n)}`, `Drawn ${seen[n] || 1} time${(seen[n] || 1) === 1 ? "" : "s"} in your readings`)
        + (c ? `<p><i>${esc(c.kw.join(", "))}</i></p><h4>The card</h4><p>${esc(c.up)}</p><h4>🔬 The fact</h4><p>${esc(c.fact)}</p>${x ? `<h4>The science</h4><p>${esc(x.sci)}</p><h4>Why it fits</h4><p>${esc(x.link)}</p>` : ""}`
          : `<p class="bk-note">Part of your ${esc(s.label)} collection. Draw it again in a reading to read its full meaning.</p>`);
    } else if (s) {
      const t = d ? d.total : have.length, lock = Math.max(0, t - have.length), shown = Math.min(lock, 48), gild = t > 0 && have.length >= t;
      if (gild) revealSecret("gilded");
      right = (gild ? `<div class="bk-gild" aria-hidden="true"></div><div class="bk-plate">🏵️ Gilded plate · every ${d ? esc(d.label) : "entry"} collected</div>` : "") + pageHead(`${s.emoji} ${esc(s.label)}`, `${have.length} of ${t} ${d ? esc(d.label) : ""} collected`)
        + `<div class="bk-grid">${have.map((n) => `<button type="button" class="bk-entry" data-be="${esc(n)}"><b>${esc(n)}</b>${seen[n] > 1 ? `<small>×${seen[n]}</small>` : ""}</button>`).join("")}${Array.from({ length: shown }, () => `<span class="bk-entry locked" aria-hidden="true">?</span>`).join("")}</div>
        ${lock > shown ? `<p class="bk-note">…and ${lock - shown} more still hidden.</p>` : ""}${have.length ? "" : `<p class="bk-empty">Nothing yet. A ${esc(s.label)} reading writes its first page.</p>`}`;
    }
  }
  return [left, right];
}
function journalPages() {
  const log = loadLog(), days = byDay(log), cal = calendarPage(), now = new Date();
  if (cal) revealSecret("calendar", cal);
  if (!BK.day || (BK.day !== "cal" && !days.some((d) => d.day === BK.day))) BK.day = cal && !days.length ? "cal" : days[0] ? days[0].day : null;
  const view = BK.view || "list", [y, m] = BK.ym || [now.getFullYear(), now.getMonth()];
  const top = pageHead("🗓️ The Journal", `${days.length} day${days.length === 1 ? "" : "s"} written`)
    + `<input class="bk-search" id="bk-q" type="search" placeholder="🔍 Search the Journal" aria-label="Search the Journal" value="${esc(BK.q || "")}">
      <div class="bk-views"><button type="button" class="${view === "list" ? "on" : ""}" data-jview="list">📜 Days</button><button type="button" class="${view === "month" ? "on" : ""}" data-jview="month">📅 Month</button></div>`
    + (cal ? `<button type="button" class="bk-row bk-calrow${BK.day === "cal" ? " on" : ""}" data-day="cal"><span>${cal.e} ${esc(cal.t)} page</span><small>today only</small></button>` : "");
  let list;
  if (view === "month") {
    const cells = monthGrid(log, y, m), title = new Date(y, m, 1).toLocaleDateString([], { month: "long", year: "numeric" }), today = dayKey(Date.now());
    list = `<div class="bk-month"><div class="bk-mhead"><button type="button" data-mon="-1" aria-label="Previous month">◂</button><b>${esc(title)}</b><button type="button" data-mon="1" aria-label="Next month">▸</button></div>
      <div class="bk-mgrid">${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<i>${d}</i>`).join("")}${cells.map((c) => !c ? `<span></span>` : c.n ? `<button type="button" class="${c.k === BK.day ? "on " : ""}${c.k === today ? "today" : ""}" style="--g:${Math.min(1, c.n / 6)}" data-day="${c.k}" title="${c.n} entr${c.n === 1 ? "y" : "ies"}">${c.d}</button>` : `<span class="${c.k === today ? "today" : ""}">${c.d}</span>`).join("")}</div></div>`;
  } else list = days.length ? `<div class="bk-list">${days.slice(0, 60).map((d) => `<button type="button" class="bk-row${d.day === BK.day ? " on" : ""}" data-day="${d.day}"><span>${esc(dayLabel(d.day))}</span><small>${d.entries.length} entr${d.entries.length === 1 ? "y" : "ies"}</small></button>`).join("")}</div>` : `<p class="bk-empty">Blank pages. Every reading, game, trophy and saved reading is written here by day, with the time.</p>`;
  return [top + list, journalRight(days, cal)];
}
function journalRight(days, cal = calendarPage()) {
  if (BK.q) { const hits = searchLog(loadLog(), BK.q);
    return pageHead(`🔍 “${esc(BK.q)}”`, `${hits.length} match${hits.length === 1 ? "" : "es"}`) + (hits.length ? `<ol class="bk-log">${hits.map((x) => `<li><time>${esc(dayLabel(dayKey(x.at)))} · ${esc(timeOf(x.at))}</time><span class="e">${x.e}</span><span class="t">${esc(x.t)} <button type="button" class="c small" data-day="${dayKey(x.at)}">Go to day</button></span></li>`).join("")}</ol>` : `<p class="bk-empty">Nothing in the Journal matches that yet.</p>`); }
  if (BK.day === "cal" && cal) return `<div class="bk-calpage">${pageHead(`${cal.e} ${esc(cal.t)}`, "A page that only appears today")}<p>${esc(cal.body)}</p></div>`;
  const D = days.find((d) => d.day === BK.day); if (!D) return pageHead("🗓️ Today") + `<p class="bk-empty">Nothing written today yet.</p>`;
  if (BK.li != null) { const i = D.entries.findIndex((x) => x.at === BK.li); if (i >= 0) return entryPage(D, i); BK.li = null; }
  const notes = lsGet(notesKey(), {});
  return markBtn(`day|${D.day}`, `🗓️ ${dayLabel(D.day)}`) + pageHead(esc(dayLabel(D.day)), D.day) + `<ol class="bk-log">${D.entries.map((x) => `<li class="k-${x.k} bk-li" data-li="${x.at}" role="button" tabindex="0" title="Open the full log"><time datetime="${new Date(x.at).toISOString()}">${esc(timeOf(x.at))}</time><span class="e">${x.e}</span><span class="t">${esc(x.t)}${x.k === "save" && x.ref ? ` <button type="button" class="c small" data-open="${x.ref}">Open</button>` : ""}</span><i class="bk-li-go" aria-hidden="true">›</i></li>`).join("")}</ol>
    ${pressedHtml(D.day)}<label class="bk-notes"><span>✎ My note for this day</span><textarea id="bk-note" rows="3" maxlength="600" placeholder="What did you notice?">${esc(notes[D.day] || "")}</textarea></label>`;
}
/** One Journal entry in full: when, what kind, every detail kept for it, and steps to the entries either side. */
function entryPage(D, i) {
  const x = D.entries[i], prev = D.entries[i + 1], next = D.entries[i - 1], rows = x.d || [];
  const step = (y, dir, label) => y ? `<button type="button" class="c small" data-li-go="${y.at}" data-dir="${dir}">${label}</button>` : `<span></span>`;
  return `<div class="bk-entrypg"><button type="button" class="bk-back" data-liback>◂ ${esc(dayLabel(D.day))}</button>
    ${pageHead(`${x.e} ${esc(LOG_KINDS[x.k] || "Entry")}`, fullWhen(x.at))}<p class="bk-entry-t">${esc(x.t)}</p>
    ${rows.length ? `<dl class="bk-dl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : `<p class="bk-note">This entry was written before the Journal kept full details, so the line above is all of it.</p>`}
    ${x.k === "save" && x.ref ? `<button type="button" class="c" data-open="${x.ref}">📖 Open the saved reading</button>` : ""}
    <div class="bk-entry-nav">${step(prev, "back", "◂ Earlier")}<small>${D.entries.length - i} of ${D.entries.length} that day</small>${step(next, "fwd", "Later ▸")}</div></div>`;
}
function patternPages(p, sys) {
  const log = loadLog(), top = topDrawn(p), hrs = hoursOf(log), hmax = Math.max(1, ...Object.values(hrs));
  const used = sys.filter((s) => (p.systems || {})[s.key]).sort((a, b) => p.systems[b.key] - p.systems[a.key]), smax = Math.max(1, ...used.map((s) => p.systems[s.key]));
  const bar = (label, n, max) => `<div class="bk-bar"><span>${label}</span><i style="--p:${(n / max) * 100}%"></i><b>${n}</b></div>`;
  const left = pageHead("📊 Patterns", "What your own data shows") + `<p class="bk-note">${p.readings} reading${p.readings === 1 ? "" : "s"} · ${Object.keys(p.codex || {}).reduce((n, k) => n + (p.codex[k] || []).length, 0)} Codex entries · ${byDay(log).length} day${byDay(log).length === 1 ? "" : "s"} in the Journal · best streak ${p.best} day${p.best === 1 ? "" : "s"}</p>
    <h4>🗓️ This week</h4>${(() => { const r = weekRecap(log); return `<div class="bk-recap"><span><b>${r.readings}</b> readings</span><span><b>${r.won}</b> games won</span><span><b>${r.lost}</b> lost</span><span><b>${r.days}</b> days</span><span><b>${r.trophies}</b> trophies</span></div><button type="button" class="c small" id="bk-recap">🔮 Hear my week from the Oracle</button>`; })()}
    <h4>Systems you read most</h4>${used.length ? used.slice(0, 8).map((s) => bar(`${s.emoji} ${esc(s.label)}`, p.systems[s.key], smax)).join("") : `<p class="bk-empty">No readings yet.</p>`}`;
  const right = `<h4>Drawn most often</h4>${top.length ? top.map((t) => { const s = sys.find((x) => x.key === t.sys); return bar(`${s ? s.emoji : "✦"} ${esc(t.name)}`, t.c, top[0].c); }).join("") : `<p class="bk-empty">Repeats show up here once you have a few readings.</p>`}
    <h4>When you read</h4>${Object.entries(hrs).map(([k, n]) => bar(k, n, hmax)).join("")}
    <p class="bk-note">Random draws repeat by chance. A card that comes up often is a pattern in your data, which can be read as meaningful or as luck. Your Grimoire shows both counts.</p>`;
  return [left, right];
}
/** The aura a full set adds behind the Oracle. */
function setAuraHtml(id) {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i)).join("");
  if (id === "deepsea") return n(14, (i) => `<i class="sa-bub" style="--x:${(i * 37) % 100}%;--d:${(i * 0.7) % 6}s;--s:${6 + (i % 4) * 4}px"></i>`) + n(3, (i) => `<i class="sa-jelly" style="--x:${15 + i * 32}%;--d:${i * 2.5}s"></i>`);
  if (id === "clockwork") return n(4, (i) => `<i class="sa-gear" style="--x:${[8, 78, 20, 66][i]}%;--y:${[12, 18, 70, 64][i]}%;--s:${[90, 120, 70, 100][i]}px;--r:${i % 2 ? -1 : 1}"></i>`);
  if (id === "aurora") return n(3, (i) => `<i class="sa-band" style="--d:${i * 2}s;--h:${[150, 190, 280][i]}"></i>`);
  return "";
}
// ---- Grimoire extras: secrets (secrets.js), ribbons, notes, search, share ----
const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked */ } };
const notesKey = () => "oracle-notes:" + state.userId, marksKey = () => "oracle-marks:" + state.userId;
const markBtn = (id, label) => { const on = lsGet(marksKey(), []).some((m) => m.id === id); return `<button type="button" class="bk-markbtn${on ? " on" : ""}" data-mark="${esc(id)}" data-label="${esc(label)}">🎀 ${on ? "Bookmarked" : "Bookmark"}</button>`; };
function toggleMark(id, label) { let M = lsGet(marksKey(), []); M = M.some((m) => m.id === id) ? M.filter((m) => m.id !== id) : [...M, { id, label }].slice(-8); lsSet(marksKey(), M); bookSfx("page"); }
function bkToast(msg) { const st = document.querySelector("#book .bk-stage"); if (!st) return; const t = document.createElement("div"); t.className = "bk-toast"; t.textContent = msg; st.append(t); setTimeout(() => t.remove(), 3800); }
/** A secret found: pay once, say so in the book and in the Oracle's bubble, write it in the Journal. */
/** Collect-everything rewards: announce and log anything just completed. */
function collectNews() {
  const p = state.prog, got = checkCollect(p); if (!got.length) return; saveProgress(); showStats(); chime(3);
  const sysName = (k) => (available(MODULES).find((m) => m.key === k) || {}).label || k;
  for (const g of got) logEvent("trophy", g.kind === "sys" ? "📜" : g.kind === "codex" ? "🏛️" : "🗝️", g.kind === "sys" ? `Finished the ${sysName(g.key)} Codex` : g.kind === "codex" ? "Finished the whole Codex" : "Found every secret in Your Grimoire", null,
    [["Collection", g.kind === "sys" ? `${sysName(g.key)}: every entry` : g.kind === "codex" ? "Every system in the Codex" : "All 7 Grimoire secrets"], ["Reward", `💎 ${g.pay}`], ["Bonus", g.kind === "codex" ? "The Archivist's tome binding and the Archivist's flourish emote" : g.kind === "secrets" ? "The Keeper's sigil emote" : ""]]);
  const big = got.find((g) => g.kind !== "sys"), g = big || got[0];
  mood.emote("cheer"); burst();
  mood.bubble(g.kind === "codex" ? `The whole Codex! 💎 ${g.pay}, and the Archivist's tome is yours.` : g.kind === "secrets" ? `Every secret in my book. 💎 ${g.pay} and the Keeper's sigil.` : `The ${sysName(g.key)} Codex is complete! 💎 ${g.pay}.`, 4200, g.kind === "codex" ? "🏛️" : g.kind === "secrets" ? "🗝️" : "📜");
}
function revealSecret(id, extra = null) {
  const p = state.prog, s = secretOf(id); if (!s) return false;
  if (id === "calendar" && extra) { p.gcal = Array.isArray(p.gcal) ? p.gcal : []; if (!p.gcal.includes(extra.id)) { p.gcal.push(extra.id); saveProgress(); } }
  if (gsFound(p, id)) return false;
  const pay = findSecret(p, id); saveProgress(); showStats(); chime(2);
  setTimeout(collectNews, reduced ? 0 : 1800);
  logEvent("secret", "🗝️", `Found a secret in Your Grimoire: ${s.name}`, null, [["Secret", `${s.e} ${s.name}`], ["The clue", s.hint], ["Reward", pay ? `💎 ${pay}` : "A binding and a page"], ["Secrets found", `${(p.gs || []).length} of ${SECRETS.length}`]]);
  setTimeout(() => { bkToast(`🗝️ Secret found: ${s.name}${pay ? ` · +${pay} 💎` : ""}`); mood.bubble(`You found ${s.name}. I hid that one myself.`, 3600, "🗝️"); }, 60);
  return true;
}
const inkHtml = (sec) => `<div class="bk-ink${gsFound(state.prog, "ink") ? " lit" : ""}" data-ink="${sec}" aria-label="A page that looks blank"><p>${esc(INK[sec])}</p><span class="bk-ink-hint" aria-hidden="true">🕯️</span></div>`;
function pressedHtml(day) {
  const r = ((state.prog.rooms || {}).grimoire || {}).solved || {}, got = HERBS.filter((x) => r[herbKey(x.L, x.p)]); if (!got.length) return "";
  const h = [...day].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), x = got[h % got.length]; revealSecret("pressed");
  return `<figure class="bk-pressed" style="--tilt:${(h % 11) - 5}deg">${herbSvg(x.p)}<figcaption>${esc(x.p.name)}<small>${esc(x.p.latin || "")}</small></figcaption></figure>`;
}
function wearBook(id) { const p = state.prog, b = BOOKS.find((x) => x.id === id); if (!b || !owns(id)) return; p.book = id; saveProgress(); flourish("book"); openBook(BK.sec); }
function secretPages(p) {
  const n = SECRETS.filter((s) => gsFound(p, s.id)).length;
  const left = pageHead("🗝️ Secrets", `${n} of ${SECRETS.length} found`) + `<div class="bk-list">${SECRETS.map((s) => { const f = gsFound(p, s.id);
    return `<div class="bk-secret${f ? " found" : ""}"><span class="bk-seal">${f ? s.e : "?"}</span><div><b>${f ? esc(s.name) : "An unfound secret"}</b><small>${esc(f ? (s.id === "diary" ? "Tap the sigil seven times to read it again." : s.hint) : s.hint)}</small></div>${f && s.id === "diary" ? `<button type="button" class="c small" data-secret-go="diary">Read</button>` : ""}</div>`; }).join("")}</div>`;
  const solved = gsFound(p, "cipher"), secretBooks = BOOKS.filter((b) => b.secret && owns(b.id)), cal = (p.gcal || []).length;
  const right = pageHead("ᚱ The margin cipher", "Three margins, three words, one phrase") + `<div class="bk-cipher">${CIPHER.map((c) => `<span>${c.n} · ${toRunes(c.w)}</span>`).join("")}</div>`
    + (solved ? `<p class="bk-note">✓ Broken: <b>${CIPHER.map((c) => c.w).join(" ")}</b>.</p>` : `<div class="bk-speak"><input id="bk-cipher" type="text" autocomplete="off" placeholder="Write the phrase in letters" aria-label="The phrase from the margins"><button type="button" class="c small" id="bk-speak">Speak it</button></div><p class="bk-note" id="bk-cipher-r">Each rune stands for one letter. A few letters share a rune.</p>`)
    + `<h4>Secret bindings</h4>${secretBooks.length ? `<div class="choices">${secretBooks.map((b) => `<button type="button" class="c small${p.book === b.id ? " on" : ""}" data-wb="${b.id}">${p.book === b.id ? "✓ " : ""}${esc(b.name)}</button>`).join("")}</div>` : `<p class="bk-empty">Four bindings are never sold. They are earned inside this book.</p>`}
    <p class="bk-note">🌙 Calendar pages seen: ${cal}</p><button type="button" class="c small cu-open" data-secret-go="cabinet">🏺 Open the Cabinet of Curiosities</button>` + codebreakerHtml(p);
  return [left + collectHtml(p, esc, { codes: [CODES.filter((c) => cdBroken(p, c.id)).length, CODES.length], labels: Object.fromEntries(available(MODULES).map((m) => [m.key, m.label])) }), right];
}
function cabinetPages(p) {
  const [L, R] = cabinetHtml(p, esc);
  return [pageHead("🏺 The Cabinet of Curiosities", "Things hidden all over the Chamber") + L, R + `<button type="button" class="bk-back" data-secret-go="secrets">◂ Close the Cabinet</button>`];
}
function diaryPages(p) {
  const D = diary(p, state.name), half = Math.ceil(D.length / 2), page = (xs) => `<ol class="bk-diary">${xs.map(([t, x]) => `<li><time>${esc(t)}</time><p>${esc(x)}</p></li>`).join("")}</ol>`;
  return [pageHead("👁️ The Oracle's diary", "Private. Obviously.") + page(D.slice(0, half)), page(D.slice(half)) + `<button type="button" class="bk-back" data-secret-go="secrets">◂ Close the diary</button>`];
}
function sealedPage(p) {
  if (!hasCrown(p)) { const m = masteryCount(p); return pageHead("🔒 The sealed chapter") + `<div class="bk-wax" aria-hidden="true">✦</div><p class="bk-note">A wax seal holds these pages shut. ${esc(secretOf("sealed").hint)}</p><p class="bk-note">Games finished on every level: ${m.done} of ${m.of}.</p>`; }
  if (!gsFound(p, "sealed")) return pageHead("👑 The sealed chapter") + `<button type="button" class="bk-wax crown" data-seal="1" aria-label="Break the seal">👑</button><p class="bk-note">Your Star Crown fits the seal. Press it to break it.</p>`;
  return pageHead("👑 The sealed chapter", "The Science is Magic creed") + `<ol class="bk-creed">${CREED.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>${owns("bk-crown") ? `<button type="button" class="c small${p.book === "bk-crown" ? " on" : ""}" data-wb="bk-crown">${p.book === "bk-crown" ? "✓ Bound in stars" : "👑 Bind this book in stars"}</button>` : ""}`;
}
function breakSeal() {
  const w = document.querySelector("#book .bk-wax"); if (w) w.classList.add("break"); bookSfx("thump");
  setTimeout(() => { const p = state.prog; p.owned = p.owned || []; if (!p.owned.includes("bk-crown")) p.owned.push("bk-crown"); revealSecret("sealed"); drawBook(); }, reduced ? 0 : 700);
}
function sharePageNow() {
  const R = $("bk-right"), L = $("bk-left"); if (!R) return;
  const title = ((R.querySelector(".bk-h") || L.querySelector(".bk-h") || {}).textContent || "Your Grimoire").trim();
  const lines = (R.innerText || "").split("\n").map((x) => x.trim()).filter((x) => x && x !== title && !/^(Open|Go to day|🎀 Bookmark(ed)?|✎ My note for this day)$/.test(x)).slice(0, 12);
  const b = bookOf(state.prog);
  if (state.token && state.channelId) fetch(api("/api/share"), { method: "POST", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify({ channelId: state.channelId, title, lines, color: b.foil }) })
    .then((r) => r.json()).then((r) => bkToast(r.ok ? "📤 Shared in the channel" : `Not shared: ${r.error || "try again"}`)).catch(() => bkToast("Not shared: offline"));
  else { const txt = `📖 ${title}\n${lines.join("\n")}`; try { navigator.clipboard.writeText(txt).then(() => bkToast("📋 Page copied. Paste it in the chat."), () => bkToast("Sharing works inside Discord")); } catch { bkToast("Sharing works inside Discord"); } }
}
/** Coded messages and the binding's own glyphs, written into the margins of the open pages. */
function bookCodes(p, L, R) {
  const bk = bookOf(p), here = codesOn(BK.sec, bk.id);
  for (const [side, el] of [["left", L], ["right", R]]) {
    el.insertAdjacentHTML("afterbegin", glyphLayer(bk.id, BK.sec, side, side === "right" ? emblemInner(bk) : ""));
    const mine = here.filter((c) => c.side === side); if (mine.length) el.insertAdjacentHTML("beforeend", mine.map((c) => scrapHtml(c, esc)).join(""));
  }
  const fresh = here.length ? cdSpot(p, here.map((c) => c.id)) : []; if (!fresh.length) return; saveProgress();
  if (fresh.some((id) => CODES.find((c) => c.id === id).book)) setTimeout(() => bkToast(`✦ Something is written here that only the ${bk.name} shows`), 400);
}
function codebreakerHtml(p) {
  const n = CODES.filter((c) => cdBroken(p, c.id)).length, seen = p.cdSeen || [], SEC = { codex: "the Codex", journal: "the Journal", patterns: "Patterns", secrets: "the Secrets pages", diary: "the Oracle's diary" };
  return `<h4>🔐 The Codebreaker's page</h4><p class="bk-note">${n} of ${CODES.length} coded messages broken. ${BOOK_CODES} of them only show in a certain binding. Write a decoded message here any time.</p>
    <div class="bk-speak"><input id="cd-in" type="text" autocomplete="off" placeholder="Write a decoded message" aria-label="A decoded message"><button type="button" class="c small" id="cd-go">Try it</button></div><p class="bk-note" id="cd-r"></p>
    <ol class="cd-list">${CODES.map((c) => { const b = c.book && BOOKS.find((x) => x.id === c.book);
      if (cdBroken(p, c.id)) return `<li class="ok"><b>✓ ${esc(c.name)}</b><span>${esc(c.plain)}</span></li>`;
      if (seen.includes(c.id)) return `<li class="seen"><b>${esc(c.name)}</b><small>Spotted in ${SEC[c.sec]}${b ? `, in the ${esc(b.name)}` : ""}</small><details><summary>How it works</summary><p>${esc(c.how)}</p></details></li>`;
      return `<li class="un"><b>?</b><small>${b ? `Only shows in the ${esc(b.name)}` : "Somewhere in this book"}</small></li>`; }).join("")}</ol>`;
}
function breakCode() {
  const p = state.prog, inp = $("cd-in"), out = $("cd-r"); if (!inp) return;
  const c = tryCode(p, inp.value); if (!c) { out.textContent = "Nothing in the book unlocks with that. Check every letter."; mood.emote("shake"); return; }
  const all = CODES.every((x) => cdBroken(p, x.id)); if (all) { p.owned = p.owned || []; if (!p.owned.includes("bk-cipher")) p.owned.push("bk-cipher"); }
  saveProgress(); showStats(); chime(2); mood.emote(all ? "cheer" : "wow", { quiet: true });
  logEvent("secret", "🔐", `Broke a coded message: ${c.name}`, null, [["Message", c.name], ["It said", c.plain], ["Method", c.how], ["Reward", `💎 ${c.pay}`], ["Broken so far", `${(p.cd || []).length} of ${CODES.length}`], ["Bonus", all ? "Every code broken: the Codebreaker's folio binding" : ""]]);
  drawBook(); setTimeout(() => { bkToast(all ? "🔐 Every code broken! The Codebreaker's folio is yours" : `🔐 Broken: ${c.name} · +${c.pay} 💎`); mood.bubble(all ? "Every code in my book, broken. I'm impressed and a little worried." : `“${c.plain}.” You read my margins.`, 3600, "🔐"); }, 60);
}
/** Wire the parts drawBook doesn't: ribbons, the ink pages, search, notes, the cipher and the weekly recap. */
function bookExtras(p) {
  const rb = $("bk-ribbons"); if (rb) { const M = lsGet(marksKey(), []); rb.innerHTML = M.map((m, i) => `<button type="button" style="--i:${i}" data-rib="${i}" title="${esc(m.label)}"><span>${esc(m.label)}</span></button>`).join("");
    rb.querySelectorAll("[data-rib]").forEach((x) => (x.onclick = () => { const m = M[+x.dataset.rib], [t, a, c] = m.id.split("|");
      turnTo(() => { if (t === "day") { BK.sec = "journal"; BK.day = a; BK.q = ""; BK.li = null; } else { BK.sec = "codex"; BK.sys = a; BK.entry = c; } }); })); }
  document.querySelectorAll("#book [data-ink]").forEach((el) => { if (el.classList.contains("lit")) return; const cells = [];
    el.onpointermove = (e) => { const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; el.style.setProperty("--x", x + "px"); el.style.setProperty("--y", y + "px"); el.classList.add("warm");
      cells.push(`${Math.floor((x / r.width) * 6)}-${Math.floor((y / r.height) * 4)}`); if (inkLit(cells) >= 0.5) { el.classList.add("lit"); el.onpointermove = null; revealSecret("ink"); } };
    el.onpointerleave = () => el.classList.remove("warm"); });
  const q = $("bk-q"); if (q) q.oninput = () => { BK.q = q.value.trim(); const R = $("bk-right"); R.innerHTML = journalRight(byDay(loadLog())) + `<div class="bk-margin">${CIPHER[1].n} · ${toRunes(CIPHER[1].w)}</div>`;
    R.querySelectorAll("[data-day]").forEach((b) => (b.onclick = () => { BK.q = ""; turnTo(() => { BK.day = b.dataset.day; }); })); bookExtrasNote(); };
  bookExtrasNote();
  const cg = $("cd-go"); if (cg) { cg.onclick = breakCode; $("cd-in").onkeydown = (e) => { if (e.key === "Enter") breakCode(); }; }
  const sp = $("bk-speak"); if (sp) { const go = () => { const v = $("bk-cipher").value; if (cipherSolved(v)) { p.owned = p.owned || []; if (!p.owned.includes("bk-rune")) p.owned.push("bk-rune"); revealSecret("cipher"); drawBook(); } else { $("bk-cipher-r").textContent = "The runes stay dark. Check each margin again."; mood.emote("shake"); } };
    sp.onclick = go; $("bk-cipher").onkeydown = (e) => { if (e.key === "Enter") go(); }; }
  const rc = $("bk-recap"); if (rc) rc.onclick = () => { const line = recapLine(weekRecap(loadLog()), state.name); closeBook(); clearReading(); cap("🗓️ Your week"); say(line); mood.emote("think"); ui(`<div class="choices"><button class="c" type="button" id="back">✦ Back to the Oracle</button><button class="c" type="button" id="bk-again">📖 Back to Your Grimoire</button></div>`); $("back").onclick = greet; $("bk-again").onclick = () => openBook("patterns"); };
}
function bookExtrasNote() { const t = $("bk-note"); if (!t) return; let tm = null; t.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { const N = lsGet(notesKey(), {}); if (t.value.trim()) N[BK.day] = t.value.slice(0, 600); else delete N[BK.day]; lsSet(notesKey(), N); }, 400); }; }
// ---- the emote wheel: make the Oracle wave, laugh, dance…; in a Discord call everyone in the Chamber sees it ----
const EMO = { last: 0, lobby: null };
function doEmote(id, by = null) {
  const e = hostEmote(emoteAny(id)); if (!e) return; const t = $("teller");
  mood.emote(e.mood); if (!by) secretEvent("emote", { id });
  if (!reduced && e.fx) { const fx = document.createElement("div"); fx.className = "efx-layer"; fx.innerHTML = emoteFxHtml(e); t.parentElement.append(fx); setTimeout(() => fx.remove(), 2600); } mood.bubble(by ? `${by} made me ${e.name.toLowerCase()}! ${e.say}` : e.say, 2200, e.e);
  t.classList.remove("em-wave", "em-dance", "em-spook"); void t.offsetWidth; if (["wave", "dance", "spook"].includes(id)) { t.classList.add("em-" + id); setTimeout(() => t.classList.remove("em-" + id), 2400); }
  const f = $("familiar"); if (f) { f.classList.remove("react"); void f.offsetWidth; f.classList.add("react"); }
}
function sendEmote(id) {
  if (Date.now() - EMO.last < 1500 || !emoteSlots(state.prog).includes(id)) return; EMO.last = Date.now(); doEmote(id); CU.event("emote-out", id);
  const u = useEmote(state.prog, id); if (u.dayBonus) { showStats(); } saveProgress();
  if (u.levelUp || u.dayBonus || u.unlocked.length) setTimeout(() => mood.bubble(u.unlocked.length ? `New emote: ${u.unlocked[0].e} ${u.unlocked[0].name}! Find it in your emotes.` : u.dayBonus ? `Emote of the day! +💎 ${u.dayBonus}` : `${hostEmote(emoteAny(id)).name} reached ${u.levelUp}!`, 3000, u.unlocked.length ? u.unlocked[0].e : u.dayBonus ? "⭐" : "🏅"), 2300);
  const L = EMO.lobby; if (!L) return; const m = { emote: id, by: state.name, byId: L.me && L.me.id };
  if (L.isHost()) L.to("*", m); else L.up(m);
}
(function emoteWheel() {
  const pane = $("teller").parentElement, btn = document.createElement("button"), wheel = document.createElement("div");
  btn.type = "button"; btn.id = "emote-btn"; btn.className = "emote-btn"; btn.textContent = "😀"; btn.title = "Emotes: make the Oracle react"; btn.setAttribute("aria-label", "Emotes"); btn.setAttribute("aria-expanded", "false");
  wheel.id = "emote-wheel"; wheel.className = "emote-wheel"; wheel.hidden = true; wheel.setAttribute("role", "menu");
  // the ring: your 7 most-used emotes, plus the emote book with all of them
  const ring = () => { const p = state.prog, mine = emoteSlots(p).map(emoteAny).map(hostEmote), all = [...mine, { id: "_book", e: "🔁", name: `Swap emotes (${emotesOwned(p).length} of ${ALL_EMOTES.length} collected)` }];
    wheel.innerHTML = all.map((e, i) => `<button type="button" role="menuitem" style="--a:${(i / all.length) * 360 - 90}deg" data-emote="${e.id}" title="${e.name}" aria-label="${e.name}">${e.e}</button>`).join("");
    wheel.querySelectorAll("[data-emote]").forEach((b) => (b.onclick = (ev) => { ev.stopPropagation(); close(); if (b.dataset.emote === "_book") showStore("creator"); else sendEmote(b.dataset.emote); })); };
  pane.append(wheel, btn);
  const close = () => { wheel.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.onclick = (ev) => { ev.stopPropagation(); if (wheel.hidden) ring(); wheel.hidden = !wheel.hidden; btn.setAttribute("aria-expanded", String(!wheel.hidden)); };
  document.addEventListener("click", (ev) => { if (!wheel.hidden && !wheel.contains(ev.target)) close(); });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !wheel.hidden) { close(); btn.focus(); } });
})();
/** Equip or take off an emote from the creator's emote grid. */
CU.init({ state, mood, save: saveProgress, stats: showStats, chime, logEvent, modal, esc, reduced });
if (PREVIEW) window.__curTest = CU.test;
function slotTap(id) {
  const r = toggleSlot(state.prog, id), e = emoteAny(id); if (!r || !e) return;
  if (r === "full") return mood.bubble(`All ${EMO_SLOTS} slots are full. Take one off first.`, 2600, "🔁");
  if (r === "last") return mood.bubble("Keep at least one emote. I need to express myself.", 2600, "😶");
  saveProgress(); if (r === "on") doEmote(id); const y = $("box").scrollTop; showStore("creator"); $("box").scrollTop = y;
}
/** The Chamber lobby: one shared table per call, used only to pass emotes around. Quietly off when it can't start. */
function joinLobby() {
  if (EMO.lobby || !canJoin(state)) return;
  joinTable("lobby", state).then((L) => { EMO.lobby = L;
    L.on("msg", ({ from, m }) => { if (!m || !emoteAny(m.emote)) return;
      if (L.isHost() && from !== L.me.id && !m.fwd) L.to("*", { ...m, fwd: true });
      if (m.byId && L.me && m.byId === L.me.id) return; CU.event("emote-in", m.emote); doEmote(m.emote, String(m.by || L.nameOf(from)).slice(0, 32)); });
    L.on("close", () => { EMO.lobby = null; }); }).catch(() => { /* not in a call */ });
}
// ---- palm eyes: the lines on the Oracle's palms open now and then, and with big moods ----
(function palmEyes() {
  const t = $("teller"), next = () => setTimeout(open, 25000 + Math.random() * 25000); // a rare peek: the palm eyes stay shut except for expressions
  function open() {
    if (document.hidden || reduced) return next();
    const hands = [...t.querySelectorAll(".o-hand")], h = Math.random() < 0.25 ? hands : [hands[Math.floor(Math.random() * hands.length)]];
    h.forEach((x) => x && x.classList.add("peek")); setTimeout(() => h.forEach((x) => x && x.classList.remove("peek")), 1000 + Math.random() * 600); next();
  }
  next();
})();
$("grimoire-btn").onclick = () => openBook("codex");
if (PREVIEW) window.__relicTest = (ids) => { state.prog.relics = ids || RELICS.map((r) => r.id); paintScene(); };
if (PREVIEW) window.__bookTest = (sec, book) => { if (book) { const p = state.prog; p.owned = [...new Set([...(p.owned || []), book])]; p.book = book; } openBook(sec); };

// Progress: this device always; the member's Discord account too when signed in (newest by reading count wins).
let pushT = null;
function saveProgress() {
  saveLocal(state.userId, state.prog);
  if (!state.token) return;
  clearTimeout(pushT);
  pushT = setTimeout(() => fetch(api("/api/progress"), { method: "PUT", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify(state.prog) }).catch(() => {}), 400);
}
async function loadProgress() {
  let p = loadLocal(state.userId);
  if (state.token) {
    const j = await fetch(api("/api/progress"), { headers: { authorization: "Bearer " + state.token } }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    if (j && j.progress && j.progress.v === 1) p = merge(p, { ...fresh(), ...j.progress });
  }
  state.prog = p || fresh(); ensureFree(state.prog); applyLook(); showStats();
}

function layArt(files) {
  const card = table.reveal(files.map(fitSvg));
  if (card) card.onclick = () => zoom(files[0]);
}
function zoom(svg) { $("zoom-art").innerHTML = fitSvg(svg); $("zoom").hidden = false; $("zoom-close").focus(); }
$("zoom-close").onclick = () => { $("zoom").hidden = true; $("zoom-art").innerHTML = ""; };
$("zoom").onclick = (e) => { if (e.target === $("zoom")) $("zoom-close").click(); };

// ---- the reading scroll ----
function md(s) {
  return esc(s).split("\n").map((l) => (l.startsWith("&gt; ") ? `<blockquote>${l.slice(5)}</blockquote>` : l)).join("<br>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<u>$1</u>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/<br><blockquote>/g, "<blockquote>").replace(/<\/blockquote><br>/g, "</blockquote>");
}
const svgOf = (f) => { const t = f.svg || (f.data ? new TextDecoder().decode(f.data) : ""); return /^\s*(<\?xml|<svg)/.test(t) ? t.replace(/<script[\s\S]*?<\/script>/gi, "") : null; };
function showReading({ r }, el = $("reading-body")) {
  el.innerHTML = r.embeds.map((e) => `<article class="emb${e.color === 0x66E0C8 ? " teal" : ""}">${e.title ? `<h2>${md(e.title)}</h2>` : ""}${e.description ? `<p>${md(e.description)}</p>` : ""}
      ${(e.fields || []).map((f) => `<h3>${md(f.name)}</h3><p>${md(f.value)}</p>`).join("")}${e.footer ? `<footer>${esc(e.footer.text)}</footer>` : ""}</article>`).join("");
}

// ---- journal (this device, per member) ----
const jKey = () => "oracle-journal:" + state.userId;
const loadJournal = () => { try { return JSON.parse(localStorage.getItem(jKey()) || "[]"); } catch { return []; } };
function saveJournal({ sys, r, words }) {
  const entry = { at: Date.now(), key: sys.key, label: sys.label, emoji: sys.emoji, title: r.embeds[0].title || sys.label, words,
    embeds: r.embeds, files: (r.files || []).map(svgOf).filter(Boolean) };
  try { localStorage.setItem(jKey(), JSON.stringify([entry, ...loadJournal()].slice(0, 60))); } catch {}
  logEvent("save", "📖", `Saved a ${sys.label} reading: ${String(entry.title).replace(/^\P{L}+/u, "")}`, entry.at, [["System", sys.label], ["Title", String(entry.title).replace(/^\P{L}+/u, "")], ["The Oracle said", words]]);
}
/** Open a saved reading (from the Grimoire's Journal) in the reading pane. */
function openSaved(at) {
  const e = loadJournal().find((x) => x.at === at); if (!e) return; closeBook();
  cap(e.emoji + " " + e.label); layArt(e.files || []); say(e.words); ui(`<div class="choices"><button class="c" type="button" id="back">✦ Another reading</button><button class="c" type="button" id="bk-again">📖 Back to Your Grimoire</button></div>`);
  $("back").onclick = greet; $("bk-again").onclick = () => openBook("journal"); showReading({ r: { embeds: e.embeds } });
}
// ---- voice: unlock on the first click; mute toggle ----
addEventListener("pointerdown", unlockVoice, { capture: true });
addEventListener("keydown", unlockVoice, { capture: true });
// ---- speech: three speeds, or off (the words appear at once, no voice) ----
const SPEECH = [["slow", "🐢", "Slow speech"], ["normal", "🗣️", "Normal speech"], ["fast", "🐇", "Fast speech"], ["off", "🔇", "Speech off: words appear at once, no voice"]];
function speechMode() { try { const v = localStorage.getItem("oracle-speech"); if (SPEECH.some(([k]) => k === v)) return v; } catch { /* blocked */ } return isMuted() ? "off" : "normal"; }
function showSpeech() { const m = speechMode(); $("speech-ctl").innerHTML = SPEECH.map(([k, e, l]) => `<button type="button" class="${k === m ? "on" : ""}" data-sp="${k}" aria-pressed="${k === m}" title="${l}" aria-label="${l}">${e}</button>`).join("");
  $("speech-ctl").querySelectorAll("[data-sp]").forEach((b) => (b.onclick = () => { try { localStorage.setItem("oracle-speech", b.dataset.sp); } catch { /* blocked */ } setMuted(b.dataset.sp === "off"); if (b.dataset.sp === "off") CU.event("mute"); showSpeech(); if (say.finish && b.dataset.sp === "off") say.finish(); })); }
showSpeech();

// ---- start ----
(async () => {
  say("…");
  if (inDiscord()) {
    try {
      const d = await startDiscord();
      if (d.user) { state.name = d.user.global_name || d.user.username; state.userId = d.user.id; state.token = d.token; state.guildId = d.guildId; }
      state.sdk = d.sdk || null; state.instance = d.sdk && d.sdk.instanceId; state.channelId = d.sdk && d.sdk.channelId; // the call: multiplayer tables (net.js) are per call
      if (d.token) {
        const p = await fetch(api("/api/profile"), { headers: { authorization: "Bearer " + d.token } }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
        if (p && p.profile) state.profile = p.profile;
      }
    } catch (e) { console.warn("Discord SDK failed to start", e); }
  }
  setHost(hostFor({ channelId: state.channelId, search: location.search })); dressHouse();
  await loadProgress();
  await checkBoost();
  joinLobby();
  // the door: its tap is the gesture browsers need before sound, so the Oracle's first line is spoken aloud
  const gate = $("gate"), p = state.prog;
  gate.innerHTML = rename(gateHtml({ name: state.name === "traveller" ? "" : state.name, rank: rankOf(p.xp).name, streak: liveStreak(p), back: !!p.readings, esc, art: `<svg viewBox="0 0 400 400">${figureSvg({ id: "g" })}</svg>` })); paintHost(gate.querySelector(".gate-sigil svg"), p, "g");
  gate.hidden = false; say("");
  const enter = () => { unlockVoice(); sting(HOST().voice && HOST().voice.sting); paintScene(); CU.enter(); musicNews(true); player.start(); gate.classList.add("open"); setTimeout(() => { gate.hidden = true; }, reduced ? 0 : 650); greet(); boostThanks(); setTimeout(showGift, reduced ? 300 : 1400); };
  $("enter").onclick = enter; $("enter").focus();
  if (!reduced) gate.onpointermove = (e) => { gate.style.setProperty("--px", ((e.clientX / innerWidth) - 0.5).toFixed(3)); gate.style.setProperty("--py", ((e.clientY / innerHeight) - 0.5).toFixed(3)); };
})();

// ---- server boosts (boost.js): the Worker checks the boost with the bot and pays each one once; the Oracle says thank you ----
async function checkBoost() {
  if (!state.token || !state.guildId) return;
  const b = await fetch(api("/api/boost"), { method: "POST", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify({ guildId: state.guildId }) }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
  if (!b) return; state.booster = !!b.boosting;
  if (b.fresh && b.reward > 0) { award(0, b.reward); state.prog.boosts = (state.prog.boosts || 0) + 1; saveProgress(); state.boostNews = "thanks"; }
  else if (b.boosting) state.boostNews = Math.random() < 0.35 ? "hello" : null;
  showStats();
}
/** After the door opens: thank a new booster (big), or now and then greet a returning one. */
function boostThanks() {
  const kind = state.boostNews; state.boostNews = null; if (!kind) return;
  const line = pickLine(kind === "thanks" ? BOOST_THANKS : BOOSTER_HELLO, {});
  setTimeout(() => { if (kind === "thanks") { chime(3); mood.gesture("snap"); } mood.emote(kind === "thanks" ? "love" : "joy", { say: line }); }, reduced ? 0 : 3200);
}
if (PREVIEW) window.__boostTest = () => { state.booster = true; award(0, 500); state.boostNews = "thanks"; showStats(); boostThanks(); };

// ---- the Trophy Case (trophies.js): full-screen cabinet, the collect moment, showcase pins ----
const tq = []; let tShowing = false;
function tierKey(n) { return TIERS[n].key; }
function showcaseHtml(p) { return (p.showcase || []).length ? `<button type="button" class="tr-pins" id="tr-pins" title="Your showcase: open the Trophy Case">${p.showcase.map((id) => { const t = TROPHIES.find((x) => x.id === id); return t ? `<span class="tr-pin">${trophyArt(t.art, tierKey(tierOf(p, id)), { plinth: false })}</span>` : ""; }).join("")}</button>` : ""; }
document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest("#tr-pins")) openCase(); });
/** A room finished a round: C.trophy(roomId, level 1-3, { won, perfect }). */
function trophy(id, level, o) { const ev = o && o.won ? (o.perfect ? "perfect" : "win") : "lose"; chat.at = Date.now();
  if (HOST().id !== "oracle" && hasRoom(HOST(), id)) { const hs = (state.prog.houses ||= {}), h = (hs[HOST().id] ||= {}); h.rounds = (h.rounds || 0) + 1; } // rounds played in this House (House record tasks)
  { const g = TROPHIES.find((x) => x.id === id); if (g) logEvent("game", o && o.won ? "⭐" : "🎲", `${g.game}, Level ${level}: ${o && o.won ? (o.perfect ? "a perfect win" : "won") : "lost to the Oracle"}`, null, [["Game", g.game], ["Level", level], ["Result", o && o.won ? (o.perfect ? "A perfect win" : "Won") : "Lost to the Oracle"], ["Trophy", g.name]]); }
  mood.emote(moodForOutcome(id, o || {}), { say: (ev === "lose" && bookPoke(HOST().id, id, state.name)) || hostBanter(id, ev, state.name, bused) || banter(id, pid(), ev, state.name, bused) }); // sometimes a lost round earns a book from the server's library hostReact(ev, reactCtx()); secretEvent("result", { room: id, won: !!(o && o.won), perfect: !!(o && o.perfect), level });
  { const T = HOST().token, moon = T.id === "moon", mt = moon ? levelTokens(state.prog, id, level, o && o.won) : houseLevelTokens(state.prog, HOST(), id, level, o && o.won); if (mt.n) { saveProgress(); showStats(); setTimeout(() => mood.bubble(mt.series ? `Every level beaten! +${T.emoji} ${mt.n}, series bonus included.${moon ? " That's a Moon relic." : ""}` : `First win at Level ${level}! +${T.emoji} ${mt.n} for ${moon ? "Moon relics" : HOST().relicLabel.replace(/^\S+\s/, "")}.`, 3400, T.emoji), reduced ? 0 : 3400); } } if (pid() === "standup") setTimeout(rimshot, 900);
  try { trophyNews(recordWin(state.prog, id, level, o)); } catch (e) { console.warn("trophy", e); }
  if (!(o && o.won) && BATTLE_ROOMS.includes(id)) musicOf(state.prog).lost = true;
  if (o && o.won && checkMastery(state.prog)) { saveProgress(); creditsDue = true; if (!tShowing && !tq.length) setTimeout(() => rollCredits(true), reduced ? 0 : 2600); }
  setTimeout(musicNews, reduced ? 0 : 2600); }
function trophyNews(n) {
  if (!n) return; { const t = TROPHIES.find((x) => x.id === n.id); if (t) logEvent("trophy", "🏆", `${n.from ? "Upgraded" : "Won"} the ${t.name}: ${TIERS[n.tier].name}`, null, [["Trophy", t.name], ["Game", t.game], ["Tier", TIERS[n.tier].name], ["Before", n.from ? TIERS[n.from].name : "Not yet won"], ["Reward", n.pay ? `💎 ${n.pay}` : ""]]); }
  if (n.pay) award(0, n.pay); saveProgress(); showStats();
  tq.push(n); if (!tShowing) setTimeout(nextCollect, reduced ? 0 : 1200);
}
function nextCollect() {
  const n = tq.shift(), el = $("tcollect"); if (!n) { tShowing = false; if (creditsDue) setTimeout(() => rollCredits(true), reduced ? 0 : 700); return; }
  tShowing = true; mood.emote("cheer", { quiet: true });
  const t = TROPHIES.find((x) => x.id === n.id), T = TIERS[n.tier], up = n.from > 0;
  const kicker = n.tier === 4 ? "Fully mastered" : up ? "Trophy upgraded" : "New trophy";
  const rays = Array.from({ length: 16 }, (_, i) => `<i style="--a:${i * 22.5}deg"></i>`).join("");
  const motes = Array.from({ length: 14 }, (_, i) => `<b style="--x:${(i * 37) % 100}%;--d:${(i * 0.23).toFixed(2)}s;--s:${0.6 + (i % 4) * 0.25}"></b>`).join("");
  el.className = `tcollect t-${T.key}${up ? " up" : ""}`;
  el.innerHTML = `<div class="tc-rays">${rays}</div><div class="tc-motes">${motes}</div>
    <div class="tc-card" role="dialog" aria-label="${esc(kicker)}: ${esc(t.name)}">
      <div class="tc-kicker">✦ ${esc(kicker)} ✦</div>
      <div class="tc-art">${up ? `<div class="tc-old">${trophyArt(t.art, tierKey(n.from))}</div>` : ""}<div class="tc-new">${trophyArt(t.art, T.key)}</div></div>
      <h2 class="tc-name">${esc(t.name)}</h2>
      <div class="tc-tier">${esc(T.name)} · ${esc(t.game)}</div>
      <p class="tc-line">“${esc(LINES[t.id] || "")}”</p>
      <div class="tc-pay">+💎 <span id="tc-count">0</span> Essence</div>
      ${n.sets.map((s) => `<div class="tc-set">🏆 ${esc(s.name)} complete: Gold on ${s.ids.length} games · bonus 💎 ${s.bonus}</div>`).join("")}
      <div class="choices"><button class="c main" type="button" id="tc-ok">✦ Collect</button><button class="c" type="button" id="tc-case">🏆 Open the case</button></div>
    </div>`;
  el.hidden = false; trophyWin(n.tier, up);
  const cnt = $("tc-count"), t0 = performance.now(), dur = reduced ? 0 : 1200;
  const tick = (now) => { const k = dur ? Math.min(1, (now - t0 - 700) / dur) : 1; cnt.textContent = Math.max(0, Math.round(n.pay * k)); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  $("tc-ok").focus();
  const done = (open) => { checkout(); el.classList.add("out"); setTimeout(() => { el.hidden = true; el.innerHTML = ""; if (open) openCase(); else nextCollect(); }, reduced ? 0 : 350); };
  $("tc-ok").onclick = () => done(false); $("tc-case").onclick = () => { tq.length = 0; done(true); };
}
let caseView = "trophies";
function openCase(focus = null, view = null) {
  if (view) caseView = view; if (caseView === "music") return openRecords();
  const p = state.prog, el = $("tcase"), pts = points(p), lv = caseLevel(p), nextLv = CASE_LEVELS.find((l) => l.at > pts);
  const got = TROPHIES.filter((t) => tierOf(p, t.id) > 0).length;
  const bay = (t) => { const n = tierOf(p, t.id), T = TIERS[n], pinned = (p.showcase || []).includes(t.id);
    const motes = n >= 3 ? Array.from({ length: 5 }, (_, k) => `<span class="mote" style="left:${18 + k * 15}%;animation-delay:${(k * 0.6).toFixed(1)}s"></span>`).join("") : "";
    return `<button type="button" class="bay t-${T.key}${focus === t.id ? " sel" : ""}" data-tr="${t.id}" aria-label="${esc(t.name)}, ${T.name}"><span class="glow">${motes}</span>${pinned ? `<span class="pinmark" title="In your showcase">📌</span>` : ""}${trophyArt(t.art, T.key)}<span class="nm">${esc(t.name)}</span><span class="tr-tier">${T.name}</span><span class="pips">${[1, 2, 3].map((k) => `<i class="${n >= k ? "on" : ""}"></i>`).join("")}${n >= 4 ? `<i class="on pr"></i>` : ""}</span></button>`; };
  const sets = SETS.map((s) => { const have = s.ids.filter((x) => tierOf(p, x) >= 3).length, done = (p.trophySets || []).includes(s.id);
    return `<div class="tset${done ? " done" : ""}"><b>${done ? "🏆" : "◇"} ${esc(s.name)}</b><span>Gold on ${s.ids.map((x) => esc(TROPHIES.find((t) => t.id === x).name)).join(", ")} · ${have} / ${s.ids.length} · bonus 💎 ${s.bonus}</span></div>`; }).join("");
  const sel = focus && TROPHIES.find((t) => t.id === focus);
  const detail = sel ? (() => { const n = tierOf(p, sel.id), pinned = (p.showcase || []).includes(sel.id);
    return `<div class="tdetail"><div class="td-art t-${TIERS[n].key}">${trophyArt(sel.art, TIERS[n].key)}</div><div class="td-txt"><h3>${esc(sel.name)}</h3><div class="td-game">${esc(sel.game)} · ${TIERS[n].name}</div>
      <ol>${sel.how.map((h, i) => `<li class="${n > i ? "ok" : ""}"><b>${TIERS[i + 1].name}</b> ${esc(h)} · 💎 ${TIERS[i + 1].pay}${n > i ? " ✓" : ""}</li>`).join("")}</ol>
      ${n ? `<button class="c small" type="button" id="td-pin">${pinned ? "📌 Unpin from showcase" : "📌 Pin to showcase"}</button>` : `<div class="note">Win it to pin it beside your name.</div>`}</div></div>`; })() : `<div class="tdetail hint">Tap a trophy to see how to upgrade it. Pin up to three to show beside your name.</div>`;
  el.innerHTML = `<div class="tcase-in" role="dialog" aria-label="The Trophy Case">
    <header><div class="tc-brand"><span class="tc-sig">⚛</span><div><h2>The Trophy Case</h2><small>Science is Magic · Oracle Chamber</small></div></div>
      <div class="tc-stats"><span><b>${got}/${TROPHIES.length}</b> trophies</span><span><b>${esc(lv.name)}</b> case level${nextLv ? ` · ${nextLv.at - pts} pts to ${esc(nextLv.name)}` : ""}</span><span><b>💎 ${earned(p)}</b> earned</span></div>
      ${caseTabs()}<button class="c small" type="button" id="tcase-x" aria-label="Close the Trophy Case">✕ Close</button></header>
    ${(() => { const t = player.current, own = TRACKS.filter((x) => hasTrack(p, x)).length;
      return `<button type="button" class="rp-banner" data-cv="music" aria-label="Open the record player">${vinylSvg(t || TRACKS[0], 64, player.playing ? "spin" : "")}<span class="rp-b-txt"><b>🎵 The Record Player</b><small>${player.playing && t ? `Now playing: ${esc(t.title)}` : "Your records, your playlist, music on/off and volume"} · ${own} / ${TRACKS.length} records</small></span><span class="c small main rp-b-go">Open ▸</span></button>`; })()}
    <div class="shelf">${TROPHIES.map(bay).join("")}</div>
    ${detail}
    <div class="tsets">${sets}${(() => { const m = masteryCount(p), c = hasCrown(p);
      return `<div class="tset tmaster${c ? " done" : ""}"><b>${c ? "👑" : "◇"} The Star Crown</b><span>${c ? "Every game finished on every level. The Oracle wears the Star Crown for good." : `Finish all ${GAMES.length} games on every level to roll the credits and crown the Oracle forever · ${m.done} / ${m.of} levels`}</span><button class="c small" type="button" data-credits="1">🎬 Roll the credits</button></div>`; })()}</div>
    <div class="note">Bronze, Silver and Gold come from finishing Levels 1, 2 and 3. Prismatic needs a perfect round on every level. Each tier pays its Essence once.</div></div>`;
  if (HOST().rename) el.innerHTML = rename(el.innerHTML);
  el.hidden = false; el.scrollTop = 0; wireCaseTabs();
  $("tcase-x").onclick = () => { el.hidden = true; el.innerHTML = ""; $("trophy-btn").focus(); };
  el.querySelectorAll("[data-tr]").forEach((b) => (b.onclick = () => { chime(1); openCase(b.dataset.tr); }));
  if ($("td-pin")) $("td-pin").onclick = () => { togglePin(p, focus); saveProgress(); showStats(); openCase(focus); };
}
$("trophy-btn").onclick = () => openCase(null, "trophies");
const caseTabs = () => `<div class="tc-views" role="tablist"><button class="c small${caseView === "trophies" ? " on" : ""}" type="button" role="tab" aria-selected="${caseView === "trophies"}" data-cv="trophies">🏆 Trophies</button><button class="c small${caseView === "music" ? " on" : ""}" type="button" role="tab" aria-selected="${caseView === "music"}" data-cv="music">🎵 Record player</button></div>`;
function wireCaseTabs() { $("tcase").querySelectorAll("[data-cv]").forEach((b) => (b.onclick = () => { chime(1); openCase(null, b.dataset.cv); }));
  $("tcase").querySelectorAll("[data-credits]").forEach((b) => (b.onclick = () => rollCredits(false))); }

// ---- music (music.js data, player.js audio + record player): always-there 🎵 button, the record player in the Trophy Case ----
const player = createPlayer({ getProg: () => state.prog, save: saveProgress, onChange: () => musicUi() });
const musicDeps = () => ({ getProg: () => state.prog, save: saveProgress, onOpenStore: () => { $("tcase").hidden = true; $("tcase").innerHTML = ""; showStore("record"); }, redraw: musicUi });
/** The record player view of the Trophy Case. */
function openRecords() {
  const el = $("tcase"), p = state.prog;
  el.innerHTML = `<div class="tcase-in" role="dialog" aria-label="The record player">
    <header><div class="tc-brand"><span class="tc-sig">♫</span><div><h2>The Record Player</h2><small>Science is Magic · Oracle Chamber</small></div></div>${caseTabs()}
      <button class="c small" type="button" id="tcase-x" aria-label="Close the record player">✕ Close</button></header>${recordPlayerHtml(p, player, esc, { deck: HOST().player.deck })}</div>`;
  if (HOST().rename) el.innerHTML = rename(el.innerHTML);
  const wasHidden = el.hidden; el.hidden = false; if (wasHidden) el.scrollTop = 0; wireCaseTabs(); wireMusic(el, player, musicDeps());
  $("tcase-x").onclick = () => { el.hidden = true; el.innerHTML = ""; $("trophy-btn").focus(); };
}
/** Redraw whatever music UI is open, and the header music bar (on/off, skip, volume). */
function musicUi() {
  const s = musicOf(state.prog), t = player.current, bar = $("music-bar"), playing = player.playing;
  const label = s.on ? `Music on${t ? `: ${t.title}` : ""}. Turn it off` : "Music off. Turn it on";
  const want = `${s.on}|${playing}|${t ? t.id : ""}`;
  if (bar.dataset.k !== want) { bar.dataset.k = want; const vol = bar.querySelector("input") ? bar.querySelector("input").value : Math.round(s.vol * 100);
    bar.innerHTML = `<button type="button" class="${s.on ? "on" : ""}${playing ? " playing" : ""}" data-mb="power" aria-pressed="${s.on}" title="${esc(label)}" aria-label="${esc(label)}">${s.on ? "🎵" : "🔇"}</button><button type="button" data-mb="skip" title="Skip to the next record" aria-label="Skip to the next record" ${s.on ? "" : "disabled"}>⏭</button><input type="range" min="0" max="100" step="1" value="${vol}" aria-label="Music volume" title="Volume">`;
    bar.querySelector('[data-mb="power"]').onclick = () => { player.setOn(!musicOf(state.prog).on); musicUi(); };
    bar.querySelector('[data-mb="skip"]').onclick = () => { player.next(1); musicUi(); };
    bar.querySelector("input").oninput = (e) => { player.setVolume(e.target.value / 100); if (!musicOf(state.prog).on && +e.target.value > 0) { player.setOn(true); musicUi(); } }; }
  if (!$("tcase").hidden && caseView === "music" && $("tcase").querySelector(".rp")) { const y = $("tcase").scrollTop; openRecords(); $("tcase").scrollTop = y; }
}
setInterval(() => { const tm = document.querySelector(".rp-time"); if (tm && player.current) { const { t, d } = player.position, f = (x) => (isFinite(x) && x > 0 ? `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}` : "0:00"); tm.textContent = `${f(t)} / ${f(d)}`; } }, 1000);
/** Check the record tasks; announce any record unlocked just now. */
function musicNews(silent = false) {
  const fresh = checkUnlocks(state.prog); if (!fresh.length) return; saveProgress(); player.refresh(); if (silent) return;
  for (const x of fresh) logEvent("record", "🎵", `New record: ${x.title}`, null, [["Record", `${x.icon || ""} ${x.title}`], ["How it unlocked", x.task || ""], ["Where", "The record player in the Trophy Case"]]);
  chime(2); const t = fresh[0]; mood.bubble(`New record: ${t.title}! ${fresh.length > 1 ? `And ${fresh.length - 1} more. ` : ""}Find it in the record player.`, 4200, "🎵");
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("tcase").hidden && $("tcollect").hidden) $("tcase-x").click(); });
if (PREVIEW) window.__trophyTest = (id = "seance", level = 1, perfect = false) => trophy(id, level, { won: true, perfect });
if (PREVIEW) window.__masterAll = () => { const p = state.prog; p.trophies = p.trophies || {}; for (const t of GAMES) { const r = (p.trophies[t.id] ||= { tier: 0, wins: {}, perfect: {} }); r.wins = { 1: t.need, 2: t.need, 3: t.need }; r.tier = Math.max(r.tier, 2); } const last = GAMES[GAMES.length - 1]; p.trophies[last.id].wins[3] = last.need - 1; trophy(last.id, 3, { won: true }); };

// ---- the end credits (credits.js): a starfield scroll timed to the credits song ----
let creditsDue = false;
function rollCredits(auto) {
  creditsDue = false; if (document.getElementById("credits")) return;
  const tc = $("tcase"); tc.hidden = true; tc.innerHTML = ""; $("music-pop").hidden = true;
  const p = state.prog, c = (p.credits ||= { rolls: 0 }); c.rolls = (c.rolls || 0) + 1; saveProgress();
  const rows = creditSections().map((s) => `<section class="cr-sec"><h3>${esc(s.h)}</h3>${s.rows.map(([r, n]) => `<div class="cr-row${r ? "" : " solo"}">${r ? `<span>${esc(r)}</span>` : ""}<b>${esc(n)}</b></div>`).join("")}</section>`).join("");
  const stars = Array.from({ length: 70 }, (_, i) => `<i style="left:${(i * 53) % 100}%;top:${(i * 37) % 100}%;--d:${((i % 9) * 0.4).toFixed(1)}s;--s:${1 + (i % 3)}px"></i>`).join("");
  const el = document.createElement("div"); el.id = "credits"; el.className = "credits"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "End credits");
  el.innerHTML = `<div class="cr-stars" aria-hidden="true">${stars}</div><button class="c small cr-x" type="button" id="cr-x" aria-label="Close the credits">✕ Close</button>
    <div class="cr-roll" id="cr-roll">
      <div class="cr-title"><small>${auto ? "Every game. Every level. You did it." : "Science is Magic presents"}</small><h2>The Oracle Chamber</h2><div class="cr-song">♫ Don't Judge a Space Kid</div></div>
      ${rows}
      <section class="cr-sec cr-thanks"><h3>Special thanks</h3><div class="cr-big">${esc(SPECIAL_THANKS.name)}</div><p>${esc(SPECIAL_THANKS.line)}</p></section>
      <section class="cr-end"><div class="cr-sig">⚛</div><h2>The End</h2><p>${esc(END_LINE)}</p>
        ${hasCrown(p) ? `<div class="cr-crown">👑 <b>The Star Crown</b><span>${auto ? "Is the Oracle's now, forever. And your new record, Don't Judge a Space Kid, is in the record player." : "The Oracle wears it, for good."}</span></div>` : ""}
        <button class="c main" type="button" id="cr-done">✦ Back to the Chamber</button></section>
    </div>`;
  document.body.append(el);
  const roll = $("cr-roll"), song = new Audio(`music/${CREDITS_SONG}.mp3`), m = musicOf(p), t0 = performance.now();
  el.song = song; song.volume = Math.max(0.2, m.vol || 0.45); player.hold(true); song.play().catch(() => {});
  let raf = 0, over = false;
  const frame = () => { const d = isFinite(song.duration) && song.duration > 0 ? song.duration : 151.6, t = song.currentTime > 0 ? song.currentTime : (performance.now() - t0) / 1000;
    const k = Math.min(1, t / (d - 4)), vh = el.clientHeight, H = roll.scrollHeight, y = vh * 0.72 - k * (vh * 0.72 + H - vh * 0.92);
    roll.style.transform = `translateY(${y.toFixed(1)}px)`; if (k >= 1 && !over) { over = true; el.classList.add("over"); } raf = requestAnimationFrame(frame); };
  if (reduced) { roll.style.position = "relative"; el.classList.add("still"); } else raf = requestAnimationFrame(frame);
  const close = () => { cancelAnimationFrame(raf); song.pause(); el.classList.add("out"); setTimeout(() => el.remove(), reduced ? 0 : 400); player.hold(false); document.removeEventListener("keydown", esc_);
    if (auto) setTimeout(() => { mood.gesture("snap"); mood.emote("cheer", { say: `${state.name}, you finished every game on every level. The whole Chamber! Look: a crown of stars, and it's mine forever. Thank you.` }); }, reduced ? 0 : 500); };
  const esc_ = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", esc_); $("cr-x").onclick = close; $("cr-done").onclick = close; $("cr-x").focus();
  song.addEventListener("ended", () => { el.classList.add("over"); });
  if (auto) { applyLook(); musicNews(true); }
}
