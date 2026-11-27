// Star Party: a room of the Chamber (Keeper Altair's House, #🔭-observatory). The House's community night:
// the Weekly Star Party (one shared target, one shared goal) and the meteor watch (tap the shower meteors, not the
// sporadics; near a real shower peak every meteor joins the channel's shared count). Logic in engine.js + shared.js.
// Trophy: C.trophy("starparty", level, ...) from the meteor watch levels.
import { room as PR, weeklyTarget, targetAlt, observeTarget, observedToday, partyPayDue, PARTY_GOAL, PARTY_SHARDS, activeShower, nextShower, LEVELS, makeWatch, scoreWatch, isOpen, settleWatch, weekKey, SHOWERS } from "./engine.js";
import { GUIDE } from "./guide.js";
import { eyepieceSvg } from "../messier/room.js";
import { logObject } from "../messier/engine.js";
import { placeOf, watchTime } from "../watch/engine.js";
import { observatory } from "../hosts/observatory.js";
import { addTokens } from "../hosts/tokens.js";
import { api } from "../discord.js";
import { dailySeed, dailyState, finishDaily, todayKey, dayNumber } from "../daily.js";
import * as S from "../stars/sfx.js";

export const TRAILS = [
  { id: "mt-iron", name: "Iron yellow", price: 0, c: "#ffe27a", note: "A meteor's colour comes from the metals in it and the air it heats. Iron glows yellow." },
  { id: "mt-sodium", name: "Sodium orange", price: 30, c: "#ffb347", note: "Sodium gives an orange-yellow glow, the same colour as old sodium street lamps." },
  { id: "mt-magnesium", name: "Magnesium blue-green", price: 50, c: "#7affd8", note: "Magnesium burns blue-green. Fast meteors like the Perseids and Leonids often show it." },
  { id: "mt-calcium", name: "Calcium violet", price: 70, c: "#c79bff", note: "Calcium gives a violet tint, harder for the eye to see at night." },
  { id: "mt-air", name: "Air glow red", price: 90, c: "#ff6a6a", note: "Nitrogen and oxygen in the air itself glow red when a meteor slams through at tens of kilometres a second." },
];
const KIND = "meteortrail";
const trailOf = (p) => TRAILS.find((t) => t.id === p[KIND] && (t.price === 0 || (p.owned || []).includes(t.id))) || TRAILS[0];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const $id = (id) => document.getElementById(id);
const fmt = (ms) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

const CSS = `.table.starparty{background:radial-gradient(ellipse at 50% 120%,#14203f 0%,#08102a 55%,#03060f 100%);pointer-events:auto;overflow:hidden}
.sp-svg{position:absolute;inset:4% 4% 8%;width:92%;height:88%;touch-action:manipulation}
.sp-svg .mt{stroke-dasharray:120;stroke-dashoffset:120;animation:sp-streak .45s ease-out forwards}@keyframes sp-streak{to{stroke-dashoffset:0}}
.sp-svg .mt.fade{transition:opacity .4s;opacity:0}.sp-svg .hit{stroke:transparent;stroke-width:26;cursor:pointer}
.sp-svg .tap{animation:sp-ring .5s ease-out forwards}@keyframes sp-ring{from{r:2;opacity:1}to{r:18;opacity:0}}
.sp-svg .rad{animation:sp-pulse 2.4s ease-in-out infinite}@keyframes sp-pulse{50%{opacity:.35}}
.sp-svg .tw{animation:sp-tw 3s ease-in-out infinite}@keyframes sp-tw{50%{opacity:.3}}
.sp-bar{height:10px;border-radius:6px;background:#121a33;border:1px solid #2A3F6E;overflow:hidden;margin:4px 0}.sp-bar i{display:block;height:100%;background:linear-gradient(90deg,#8FB8FF,#E2B04A)}
.sp-fact{border-left:3px solid #8FB8FF;padding:4px 10px;margin:8px 0;color:#DCE6FF}.sp-box{border:1px solid #2A3F6E;border-radius:10px;padding:8px 10px;margin:6px 0}
@media (prefers-reduced-motion:reduce){.sp-svg *{animation:none!important}.sp-svg .mt{stroke-dashoffset:0}}`;
function styleOnce() { if ($id("sp-style")) return; const s = document.createElement("style"); s.id = "sp-style"; s.textContent = CSS; document.head.appendChild(s); }

// ---- drawings (viewBox 400x260) ----
const skyStars = (seed = 7) => { let a = seed; const r = () => ((a = (a * 16807) % 2147483647) / 2147483647); return Array.from({ length: 70 }, (_, i) => `<circle class="${i % 5 ? "" : "tw"}" style="animation-delay:-${(r() * 3).toFixed(1)}s" cx="${(r() * 400).toFixed(1)}" cy="${(r() * 225).toFixed(1)}" r="${(0.4 + r() * 1.1).toFixed(2)}" fill="#eef2ff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`).join(""); };
const ground = `<path d="M0 232 Q60 222 120 230 T240 228 T400 226 V260 H0Z" fill="#05070d"/><g fill="#05070d"><rect x="40" y="214" width="3" height="18"/><path d="M30 216 l12 -14 12 14Z"/><rect x="330" y="210" width="34" height="20" rx="2"/><path d="M326 211 Q347 190 368 211Z"/></g>`;
/** The watch sky: stars, the radiant, and (after) every trail, shower ones traced back to the radiant. */
export function watchSvg(w, shower, trail, { reveal = false, taps = [] } = {}) {
  const set = new Set(taps);
  const trails = reveal ? w.meteors.map((m, i) => `${m.shower ? `<line x1="${m.x1}" y1="${m.y1}" x2="${w.rx}" y2="${w.ry}" stroke="${trail.c}" stroke-dasharray="2 4" opacity=".35"/>` : ""}<line x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}" stroke="${m.shower ? trail.c : "#8FB8FF"}" stroke-width="2" opacity="${set.has(i) ? 1 : 0.45}"/>${set.has(i) ? `<circle cx="${m.x2}" cy="${m.y2}" r="4" fill="none" stroke="${m.shower ? "#7CFF9B" : "#ff6a6a"}"/>` : ""}`).join("") : "";
  return `<svg class="sp-svg" id="sp-svg" viewBox="0 0 400 260" role="img" aria-label="The night sky during a meteor watch"><rect width="400" height="260" fill="#04070f"/>${skyStars()}
    <g class="rad"><circle cx="${w.rx}" cy="${w.ry}" r="${w.level === 3 ? 3 : 6}" fill="none" stroke="#E2B04A" stroke-dasharray="2 2"/><text x="${w.rx}" y="${w.ry - 10}" fill="#E2B04A" font-size="9" text-anchor="middle">${shower ? shower.name.replace(/s$/, "") + " radiant" : "radiant"}</text></g>
    ${trails}<g id="sp-live"></g>${ground}</svg>`;
}
/** The party lawn: telescopes on the grass under the week's sky, one light per helper (up to 30). */
export function lawnSvg(total, goal) {
  const scopes = Array.from({ length: Math.min(total, goal) }, (_, i) => { const x = 20 + (i % 15) * 25, y = 206 + Math.floor(i / 15) * 14; return `<g><path d="M${x} ${y} l-5 10 M${x} ${y} l5 10 M${x} ${y} l0 10" stroke="#3a4a6e"/><rect x="${x - 2}" y="${y - 12}" width="4" height="13" rx="1.5" fill="#8a9bc4" transform="rotate(-30 ${x} ${y})"/><circle cx="${x + 4}" cy="${y + 8}" r="1.3" fill="#ff4040" class="tw"/></g>`; }).join("");
  return `<svg class="sp-svg" id="sp-svg" viewBox="0 0 400 260" role="img" aria-label="The star party: ${total} observations of ${goal}"><rect width="400" height="260" fill="#04070f"/>${skyStars(11)}
    <path d="M0 200 Q100 190 200 198 T400 196 V260 H0Z" fill="#070b14"/>${scopes}<text x="200" y="22" fill="#E2B04A" font-size="12" text-anchor="middle">${Math.min(total, goal)} / ${goal} observations this week</text></svg>`;
}

const preview = (id, ctx) => { styleOnce(); ctx.tableEl.className = "table starparty"; const w = makeWatch(1, 3); ctx.tableEl.innerHTML = watchSvg(w, SHOWERS[3], TRAILS.find((x) => x.id === id) || TRAILS[0], { reveal: true }); };
export const shop = {
  kind: KIND, label: "🌠 Meteor trails", items: TRAILS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: { open: ["Meteor colours. Each one is a real element burning.", "Pick the colour your meteors burn."], tryon: ["{item}. That's a real flame colour.", "Picture a Perseid in {item}."], buy: ["{item}: your meteors burn it now.", "Sold. {item} for every shooting star."] },
  preview,
};

/** The shared counts: GET or POST /api/party/<kind>. null when signed out or offline. */
async function partyApi(state, kind, add) {
  if (!state.token) return null;
  try {
    const r = await fetch(api("/api/party/" + kind), add ? { method: "POST", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify({ add }) } : { headers: { authorization: "Bearer " + state.token } });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

export const starParty = {
  id: "starparty", label: "Star Party", emoji: "🌠", shop,
  blurb: "The channel's night out: one shared target a week, and real meteor showers counted together",
  open(C) {
    const { $, esc, say, ui, cap, clearReading, state, saveProgress, showStats, greet, award, tableEl, reduced } = C;
    styleOnce();
    const P = () => state.prog, R = () => PR(P()), save = () => { try { saveProgress(); } catch {} };
    const day = todayKey(), dseed = dailySeed("starparty", day);
    const back = () => `<div class="choices"><button class="c small" type="button" id="sp-lobby">🌠 Back to the lawn</button></div>`;
    const wireBack = () => { const b = $("sp-lobby"); if (b) b.onclick = () => lobby(false); };
    let timers = [];
    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
    const LV = [null, ["🌠 1 · First watch", "Tap meteors that fly from the radiant"], ["☄️ 2 · Busy sky", "More meteors, more sporadics"], ["🔭 3 · Seasoned counter", "Fast streaks, mostly sporadics"]];
    let party = { total: 0, top: [], you: 0, count: 0 }, meteorBoard = null, view = "lobby";

    function lobby(first) {
      clearTimers(); clearReading(); cap("🌠 Star Party"); tableEl.className = "table starparty"; view = "lobby";
      const place = placeOf(P()), at = watchTime(place).at, tgt = weeklyTarget(), alt = targetAlt(tgt, place, at), up = alt >= 15, seen = observedToday(P());
      const act = activeShower(), nx = nextShower(), r = R(), ds = dailyState(P(), "starparty");
      tableEl.innerHTML = lawnSvg(party.total, PARTY_GOAL);
      if (first) S.domeOpen();
      say(first ? `Welcome to the star party, ${state.name}. The Stellafane star party in Vermont has met on its hilltop since 1926. This week we all look at ${tgt.label}.`
        : pick(["Red torches only, please. White light ruins dark-adapted eyes for half an hour.", act ? `The ${act.name} are on! Every meteor you count joins the channel's tally.` : `Next shower: the ${nx.name}, peaking around ${fmt(nx.peak)}.`, "Look, then let someone else at the eyepiece."]));
      const lv = (n) => `<button class="c level" type="button" id="sp-go${n}"${isOpen(P(), n) ? "" : " disabled"}><b>${LV[n][0]}</b><span>${isOpen(P(), n) ? `${LV[n][1]}${r.best[n] ? ` · best ${r.best[n]}` : ""}` : `Clear Level ${n - 1} to open`}</span></button>`;
      ui(`<div class="cx-top"><b>🌠 Star Party</b> · week ${esc(weekKey().slice(6))} · ${r.meteors} meteors counted by you</div>
        <div class="sp-box"><b>🔭 This week's target: ${esc(tgt.label)}</b> (${esc(tgt.kindName.toLowerCase())} in ${esc(tgt.con)})
          <div class="note">Over ${esc(place.name)} tonight it reaches ${Math.round(alt)}° ${up ? "up: good." : "only: too low tonight, try another night."}</div>
          <div class="sp-bar"><i style="width:${Math.min(100, (party.total / PARTY_GOAL) * 100).toFixed(0)}%"></i></div>
          <div class="note" id="sp-count">${party.total} / ${PARTY_GOAL} observations this week${party.count ? ` from ${party.count} members` : ""}${party.you ? ` · yours: ${party.you}` : ""}. Reach the goal and every helper gets ☄️ ${PARTY_SHARDS}.</div>
          <div class="choices"><button class="c main" type="button" id="sp-observe"${seen || !up ? " disabled" : ""}>${seen ? "✓ Observed today" : "👁️ Observe it"}</button></div></div>
        <div class="sp-box"><b>☄️ Meteor watch</b> · ${act ? `the <b>${esc(act.name)}</b> are active (peak around ${esc(fmt(act.peak))}): your count joins the channel's.` : `practice. Next: the ${esc(nx.name)}, around ${esc(fmt(nx.peak))}.`}${meteorBoard && meteorBoard.key ? ` Channel tally: <b>${meteorBoard.total}</b>.` : ""}
          <div class="levels">${lv(1)}${lv(2)}${lv(3)}</div></div>
        <div class="choices"><button class="c main" type="button" id="sp-daily">📅 Daily Watch #${dayNumber(day)}${ds.played ? " ✓" : ""}</button><button class="c small" type="button" id="sp-guide">📖 Star party notes</button><button class="c small" type="button" id="back">✦ Leave</button></div>`);
      [1, 2, 3].forEach((n) => { const b = $("sp-go" + n); if (b && isOpen(P(), n)) b.onclick = () => watch(n, false); });
      $("sp-daily").onclick = () => watch(2, true); $("back").onclick = greet; $("sp-guide").onclick = () => (C.study ? C.study("starparty", () => lobby(false)) : null);
      const ob = $("sp-observe"); if (ob && !seen && up) ob.onclick = () => observe(tgt);
      if (first) { partyApi(state, "star").then((v) => { if (v) { party = v; refresh(); } }); if (act) partyApi(state, "meteor").then((v) => { if (v) { meteorBoard = v; } }); }
    }
    const refresh = () => {
      const c = $id("sp-count"); if (c) c.textContent = `${party.total} / ${PARTY_GOAL} observations this week${party.count ? ` from ${party.count} members` : ""}${party.you ? ` · yours: ${party.you}` : ""}. Reach the goal and every helper gets ☄️ ${PARTY_SHARDS}.`;
      if (view === "lobby") tableEl.innerHTML = lawnSvg(party.total, PARTY_GOAL);
      if (partyPayDue(P(), party.total)) { addTokens(P(), observatory, PARTY_SHARDS); save(); C.bubble && C.bubble(`Goal reached! ☄️ ${PARTY_SHARDS} for helping the star party.`, 3800, "🌠"); S.shimmer(); }
    };
    function observe(tgt) {
      if (!observeTarget(P())) return; view = "observe";
      const lg = logObject(P(), tgt.m); party.total += 1; party.you += 1;
      const aw = award(8, 5 + (lg.tens ? lg.tens * 50 : 0)); save(); showStats(); S.discover();
      tableEl.innerHTML = eyepieceSvg(tgt, { bg: "#0b0f1a", star: "#eef2ff", glow: "#c9d4ff", ink: "#9fb4ff" }, { logged: lg.first });
      $id("reading-body").innerHTML = `<div class="sp-fact">You observed ${esc(tgt.label)} with the star party. +8 ✦ · +5 💎${lg.first ? " · logged in Messier's Catalogue" : ""}${aw && aw.rankUp ? ` · 🏅 You are now <b>${esc(aw.rankUp)}</b>` : ""}</div>`;
      say(pick(["Lovely. Let the next person have a look.", "Seen. That's one more for the channel.", "Beautiful, isn't it? Now count it in."]));
      partyApi(state, "star", 1).then((v) => { if (v) party = v; refresh(); });
      const b = $("sp-observe"); if (b) { b.disabled = true; b.textContent = "✓ Observed today"; }
      ui(`<div class="choices"><button class="c main" type="button" id="sp-ok">🌠 Back to the lawn</button></div>`); $("sp-ok").onclick = () => lobby(false);
    }

    function watch(level, daily) {
      clearTimers(); clearReading(); view = "watch";
      const act = activeShower(), shower = act || SHOWERS[(dayNumber(day) + level) % SHOWERS.length], w = makeWatch(level, daily ? dseed : (Math.random() * 2 ** 31) >>> 0), trail = trailOf(P()), taps = [];
      cap(`☄️ ${daily ? `Daily Watch #${dayNumber(day)}` : LV[level][0]} · ${shower.name}`); tableEl.className = "table starparty"; tableEl.innerHTML = watchSvg(w, shower, trail);
      say(`${shower.note} Tap only the meteors that fly straight out from the radiant. Ignore the strays.`);
      let left = w.secs;
      ui(`<div class="group">⏳ <span id="sp-left">${left}</span> s · <span id="sp-n">0</span> tapped</div><div class="sp-fact">A shower meteor's trail, traced backwards, points to the radiant. Sporadic meteors come from anywhere.</div>${back()}`); wireBack();
      const live = $id("sp-live");
      w.meteors.forEach((m, i) => timers.push(setTimeout(() => {
        if (!live.isConnected) return;
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.innerHTML = `<line class="mt" x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}" stroke="${trail.c}" stroke-width="2.2" stroke-linecap="round"/><line class="hit" x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}"/>`;
        live.appendChild(g); S.ping(1 + (i % 4));
        const hit = g.querySelector(".hit");
        hit.addEventListener("pointerdown", () => { if (taps.includes(i)) return; taps.push(i); const c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("class", "tap"); c.setAttribute("cx", m.x2); c.setAttribute("cy", m.y2); c.setAttribute("r", 2); c.setAttribute("fill", "none"); c.setAttribute("stroke", "#E2B04A"); g.appendChild(c); const n = $id("sp-n"); if (n) n.textContent = taps.length; });
        timers.push(setTimeout(() => { g.querySelector(".mt").classList.add("fade"); timers.push(setTimeout(() => g.remove(), 300)); }, w.show));
      }, m.t)));
      const tick = () => { left--; const el = $id("sp-left"); if (el) el.textContent = Math.max(0, left); if (left > 0) timers.push(setTimeout(tick, 1000)); else finish(); };
      timers.push(setTimeout(tick, 1000));
      const finish = () => {
        clearTimers();
        const res = scoreWatch(w, taps), { first } = settleWatch(P(), level, res), xp = 2 * res.score, es = res.score + (first ? 10 : 0);
        let bonus = ""; if (daily) { const d = finishDaily(P(), "starparty", { score: res.score * 10, won: res.won, detail: `${res.hits}/${res.max}` }, day); if (d.first) bonus = " · 📅 Daily done"; }
        const aw = award(xp, es); save(); showStats(); C.trophy?.("starparty", level, { won: res.won, perfect: res.perfect });
        if (act && res.hits && !daily) partyApi(state, "meteor", res.hits).then((v) => { if (v) meteorBoard = v; });
        S.verdict(res.won); const b = C.banter && C.banter("starparty", res.won ? "win" : "lose"); if (b && C.bubble) C.bubble(b, 3500);
        tableEl.innerHTML = watchSvg(w, shower, trail, { reveal: true, taps });
        say(res.perfect ? "Every shower meteor, no strays. The IMO would take your counts." : res.won ? `${res.hits} of ${res.max} shower meteors${res.wrong ? `, ${res.wrong} strays` : ""}. A good watch.` : `${res.hits} of ${res.max}, ${res.wrong} strays. Trace each streak back before you tap.`);
        ui(`<div class="reward"><div>${res.won ? "✓ Watch cleared" : "Watch over"} · ${res.hits}/${res.max} shower meteors${res.wrong ? ` · ${res.wrong} sporadic` : ""}</div><div class="up">+${xp} ✦ · +${es} 💎${first ? " · level cleared!" : ""}${act && !daily && res.hits ? ` · ${res.hits} added to the ${esc(act.name)} tally` : ""}${bonus}${aw && aw.rankUp ? ` · 🏅 You are now <b>${esc(aw.rankUp)}</b>` : ""}</div></div>
          <div class="sp-fact">Dashed lines trace the shower meteors back to the radiant. Blue streaks were sporadic. ${esc(shower.name)}: about ${shower.zhr} an hour at best under a perfectly dark sky, from ${esc(shower.parent)}.</div>
          <div class="choices"><button class="c main" type="button" id="sp-again">↻ Watch again</button>${level < 3 && isOpen(P(), level + 1) && !daily ? `<button class="c" type="button" id="sp-next">${LV[level + 1][0]}</button>` : ""}</div>${back()}`);
        $("sp-again").onclick = () => watch(level, false); const n = $("sp-next"); if (n) n.onclick = () => watch(level + 1, false); wireBack();
      };
    }
    lobby(true);
  },
};

export function starPartyCodex(p, esc) {
  const r = PR(p); if (!r.plays && !Object.keys(r.seen).length) return "";
  return `<div class="bk-room"><h4>🌠 Star Party</h4><p>${r.meteors} meteors counted · ${r.paid.length} star-party goals reached · best ${[1, 2, 3].map((l) => r.best[l] || 0).join(" / ")}</p></div>`;
}
export { GUIDE, LEVELS };
