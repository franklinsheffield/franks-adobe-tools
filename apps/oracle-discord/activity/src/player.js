// The Chamber's music player: one <audio> element that loops your playlist endlessly (or the hero tracks in a battle),
// the always-there 🎵 button with on/off and volume, and the record player drawn in the Trophy Case.
import { HOUSE_NAMES, TOKEN_EMOJI, crateOf } from "./hosts/house-music.js";
import { TRACKS, ALL_TRACKS, trackOf, fileOf, musicOf, hasTrack, playlist, battleList, nextIndex, shopId, togglePlaylist, moveInPlaylist } from "./music.js";

/** Create the player. getProg() returns the member's progress; save() stores it; onChange() redraws any open UI. */
export function createPlayer({ getProg, save, onChange = () => {} }) {
  const audio = new Audio(); audio.preload = "auto";
  let held = false, queue = [], idx = 0, cur = null, started = false, battle = null, fadeT = null, previewT = null, opening = null; // opening: the House's opening song, playing first
  const m = () => musicOf(getProg());
  const setVol = (v) => { audio.volume = Math.max(0, Math.min(1, v)); };
  function fade(to, ms, done) {
    clearInterval(fadeT); const from = audio.volume, t0 = performance.now();
    fadeT = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); setVol(from + (to - from) * k); if (k >= 1) { clearInterval(fadeT); done && done(); } }, 30);
  }
  function load(id, fadeIn = true) {
    const t = trackOf(id); if (!t) return;
    cur = t.id; audio.src = fileOf(t); audio.currentTime = 0;
    if (!m().on || held) { onChange(); return; }
    setVol(fadeIn ? 0 : m().vol); audio.play().then(() => fadeIn && fade(m().vol, 900)).catch(() => {}); onChange();
  }
  function rebuild(keep = true) {
    const p = getProg(), list = battle || playlist(p);
    const was = cur; queue = list.slice(); idx = keep && was ? Math.max(0, queue.indexOf(was)) : 0;
    return queue.length ? queue[idx] : null;
  }
  audio.addEventListener("ended", () => {
    if (opening && cur === opening) { const o = opening; opening = null; if (!queue.length) return load(o, false); if (!queue.includes(o)) { idx = 0; return load(queue[0], false); } }
    if (queue.length) { idx = nextIndex(idx, queue.length); load(queue[idx], false); } });

  const api = {
    /** Start after the first tap (browsers need one before sound). */
    start(first = null) { if (started) return; started = true; const id = rebuild(false), o = first && trackOf(first);
      if (o && m().on) { opening = o.id; idx = Math.max(0, queue.indexOf(o.id)); return load(o.id); }
      if (id && m().on) load(id); else onChange(); },
    /** The opening song now playing (or null). */
    get opening() { return opening; },
    get playing() { return !audio.paused && !!cur; }, get current() { return cur ? trackOf(cur) : null; }, get inBattle() { return !!battle; },
    get position() { return { t: audio.currentTime || 0, d: audio.duration || 0 }; },
    /** The music switch: off stops it, on picks up your playlist. */
    setOn(on) { const s = m(); s.on = !!on; save();
      if (!on) { clearTimeout(previewT); fade(0, 350, () => audio.pause()); onChange(); return; }
      started = true; const id = cur && queue.includes(cur) ? cur : rebuild(false); if (id) { if (cur === id && audio.src) { setVol(0); audio.play().then(() => fade(s.vol, 600)).catch(() => {}); onChange(); } else load(id); } else onChange(); },
    setVolume(v) { const s = m(); s.vol = Math.max(0, Math.min(1, +v)); clearInterval(fadeT); setVol(s.vol); save(); },
    /** Play a record now (it must be owned). */
    play(id) { const t = trackOf(id); if (!t || !hasTrack(getProg(), t)) return; clearTimeout(previewT); started = true;
      if (!m().on) { m().on = true; save(); }
      if (!queue.includes(t.id)) { queue = [...(battle || playlist(getProg()))]; if (!queue.includes(t.id)) queue.unshift(t.id); }
      idx = queue.indexOf(t.id); opening = null; load(t.id); },
    toggle() { if (!cur || audio.paused) { if (!m().on) return api.setOn(true); if (cur) { audio.play().catch(() => {}); onChange(); } else api.start(); } else { audio.pause(); onChange(); } },
    next(d = 1) { if (!queue.length) rebuild(false); if (!queue.length) return; if (opening && cur === opening && !queue.includes(cur)) idx = d > 0 ? -1 : 0; opening = null; idx = nextIndex(idx, queue.length, d); load(queue[idx]); },
    /** The playlist changed: keep playing the current record if it is still in it. */
    refresh() { if (battle) return onChange(); const p = getProg(), list = playlist(p); queue = list.slice();
      if (cur && cur !== opening && !queue.includes(cur) && !audio.paused) { if (queue.length) { idx = 0; load(queue[0]); } else { audio.pause(); cur = null; } }
      else idx = Math.max(0, queue.indexOf(cur)); onChange(); },
    /** Entering or leaving a room: battle rooms switch to the hero tracks you own. */
    room(roomId) { const b = roomId ? battleList(getProg(), roomId) : null, nb = b && b.length ? b : null;
      if (JSON.stringify(nb) === JSON.stringify(battle)) return; battle = nb; if (!started || !m().on) { rebuild(false); return onChange(); }
      const id = rebuild(false); fade(0, 400, () => (id ? load(id) : audio.pause())); },
    /** Hold the music while something else plays (the end credits), then pick it back up. */
    hold(on) { held = !!on; clearTimeout(previewT);
      if (held) { fade(0, 500, () => { audio.pause(); onChange(); }); return; }
      if (started && m().on && cur) { setVol(0); audio.play().then(() => fade(m().vol, 900)).catch(() => {}); } onChange(); },
    /** Listen to a record from the store before buying: 25 seconds from its middle, then back to your music. */
    preview(id) { const t = trackOf(id); if (!t) return; clearTimeout(previewT); started = true; const back = cur;
      audio.src = fileOf(t); cur = t.id; setVol(0); audio.addEventListener("loadedmetadata", () => { audio.currentTime = Math.max(0, (audio.duration || 60) * 0.35); }, { once: true });
      audio.play().then(() => fade(Math.max(0.25, m().vol), 600)).catch(() => {}); onChange();
      previewT = setTimeout(() => fade(0, 800, () => { const id = back && queue.includes(back) ? back : rebuild(false); if (id && m().on) load(id); else { audio.pause(); onChange(); } }), 25000); },
  };
  return api;
}

const fmt = (s) => (isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/** A record (vinyl) in SVG: black grooves, a coloured centre label with the track's icon. */
export function vinylSvg(t, size = 100, cls = "") {
  const grooves = [44, 40, 36, 32, 28, 24].map((r) => `<circle cx="50" cy="50" r="${r}" fill="none" stroke="#2c2c34" stroke-width=".7"/>`).join("");
  return `<svg class="vinyl ${cls}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#0d0d12"/>${grooves}
    <path d="M18 30 A38 38 0 0 1 40 13" stroke="#fff" stroke-opacity=".16" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="17" fill="${t ? t.label : "#444"}"/><circle cx="50" cy="50" r="17" fill="none" stroke="#000" stroke-opacity=".35"/>
    <text x="50" y="56" text-anchor="middle" font-size="15">${t ? t.icon : "🎵"}</text><circle cx="50" cy="50" r="1.8" fill="#000"/></svg>`;
}
/** The turntable: plinth, platter, the current record spinning while it plays, and the tone arm swinging on. */
export function turntableSvg(t, playing) {
  return `<svg class="tt${playing ? " playing" : ""}" viewBox="0 0 260 190" aria-hidden="true">
  <defs><linearGradient id="tt-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b3f22"/><stop offset="1" stop-color="#2e180b"/></linearGradient></defs>
  <rect x="6" y="10" width="248" height="170" rx="14" fill="url(#tt-wood)" stroke="#E2B04A" stroke-width="2"/>
  <rect x="14" y="18" width="232" height="154" rx="10" fill="none" stroke="#000" stroke-opacity=".35"/>
  <circle cx="104" cy="95" r="74" fill="#1a1a1f" stroke="#555" stroke-width="2"/>
  <g class="tt-disc" style="transform-origin:104px 95px">${t ? `<g transform="translate(36 27) scale(1.36)">${vinylSvg(t, 100).replace(/<svg[^>]*>|<\/svg>/g, "")}</g>` : `<circle cx="104" cy="95" r="66" fill="#26262c"/>`}</g>
  <circle cx="104" cy="95" r="4" fill="#ccc"/>
  <g class="tt-arm" style="transform-origin:216px 42px"><circle cx="216" cy="42" r="12" fill="#333" stroke="#E2B04A"/><path d="M216 42 L206 128 L188 148" stroke="#ddd" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="178" y="143" width="16" height="10" rx="2" fill="#E2B04A" transform="rotate(-35 186 148)"/></g>
  <circle class="tt-led" cx="232" cy="160" r="4" fill="${playing ? "#66E0C8" : "#3a3a3a"}"/>
</svg>`;
}

/** The record player view inside the Trophy Case. */
/** deck(track, playing, prog) draws the House's own player (the Oracle's turntable by default); the records and playlist are shared. */
let rpHouse = null; // the record player's House filter (null: the House you're in)
const houseOf = (t) => t.house || "oracle";
export function recordPlayerHtml(p, pl, esc, { deck = turntableSvg, house = "oracle" } = {}) {
  const s = musicOf(p), cur = pl.current, list = s.list.filter((id) => hasTrack(p, trackOf(id)));
  const shown = ALL_TRACKS.filter((t) => !t.hidden || hasTrack(p, t)), owned = shown.filter((t) => hasTrack(p, t)).length; // hidden records appear once found
  const hs = [...new Set(ALL_TRACKS.map(houseOf))], fh = rpHouse && hs.includes(rpHouse) ? rpHouse : hs.includes(house) ? house : "oracle";
  const inH = shown.filter((t) => houseOf(t) === fh), hid = ALL_TRACKS.filter((t) => houseOf(t) === fh && t.hidden && !hasTrack(p, t)).length;
  const sleeve = (t, i) => { const own = hasTrack(p, t), inList = list.includes(t.id), on = cur && cur.id === t.id;
    const state = own ? (t.credit ? `<small class="rp-credit">${esc(t.credit)}</small>` : "") : t.how === "shop" ? `<span class="rp-lock">💎 ${t.price} in the Store</span>` : t.how === "crate" ? `<span class="rp-lock">${TOKEN_EMOJI[t.house]} ${t.price} in the record crate</span>` : `<span class="rp-lock">🔒 ${esc(t.task)}</span>`;
    return `<div class="rp-rec${own ? "" : " locked"}${on ? " now" : ""}" style="--lab:${t.label};--ink:${t.ink};--i:${i}">
      <div class="rp-sleeve">${vinylSvg(own ? t : null, 76, "rp-v")}<span class="rp-cover">${t.icon}</span>${t.hero ? `<i class="rp-hero">⚔ Battle</i>` : ""}</div>
      <b>${esc(t.title)}</b>${t.opener ? `<i class="rp-open">🚪 Opening song</i>` : ""}${t.hidden && own ? `<i class="rp-open">❔ Hidden, from ${esc(HOUSE_NAMES[t.from] || "another House")}</i>` : ""}${state}
      ${own ? `<div class="rp-acts"><button class="c small" type="button" data-rp-play="${t.id}">${on && pl.playing ? "♪ Playing" : "▶ Play"}</button><button class="c small${inList ? " on" : ""}" type="button" data-rp-list="${t.id}" aria-pressed="${inList}">${inList ? "✓ In playlist" : "＋ Playlist"}</button></div>`
        : t.how === "shop" ? `<div class="rp-acts"><button class="c small" type="button" data-rp-shop="${shopId(t)}">💎 Visit the Store</button></div>` : ""}</div>`; };
  const pos = pl.position;
  return `<div class="rp">
  <div class="rp-deck">
    <div class="rp-tt">${deck(cur, pl.playing && s.on, p)}</div>
    <div class="rp-ctl">
      <div class="rp-now"><small>${pl.inBattle ? "⚔ Battle music" : s.on ? (pl.playing ? "Now playing" : "Paused") : "Music is off"}</small><b>${cur ? esc(cur.title) : "No record on"}</b><span class="rp-time">${fmt(pos.t)} / ${fmt(pos.d)}</span></div>
      <div class="rp-btns"><button class="c" type="button" data-mu="prev" aria-label="Previous record">⏮</button><button class="c main" type="button" data-mu="toggle" aria-label="${pl.playing ? "Pause" : "Play"}">${pl.playing ? "⏸" : "▶"}</button><button class="c" type="button" data-mu="next" aria-label="Next record">⏭</button></div>
      ${musicSwitchHtml(s)}
      <div class="rp-list"><small>Your playlist · loops forever${list.length ? "" : " · add a record below"}</small>${list.map((id, i) => { const t = trackOf(id); return `<span class="rp-chip${cur && cur.id === id ? " now" : ""}" style="--lab:${t.label}">${t.icon} ${esc(t.title)}<button type="button" data-rp-up="${id}" aria-label="Move ${esc(t.title)} up" ${i ? "" : "disabled"}>▲</button><button type="button" data-rp-list="${id}" aria-label="Take ${esc(t.title)} off the playlist">✕</button></span>`; }).join("")}</div>
    </div>
  </div>
  <h3 class="rp-h">Your records · ${owned} / ${shown.length}</h3>
  <div class="rp-houses" role="tablist">${hs.map((h) => { const n = ALL_TRACKS.filter((t) => houseOf(t) === h && hasTrack(p, t)).length; return `<button class="c small${h === fh ? " on" : ""}" type="button" role="tab" aria-selected="${h === fh}" data-rp-house="${h}">${esc(HOUSE_NAMES[h].replace(/^the /, "The "))} <small>${n}</small></button>`; }).join("")}</div>
  <div class="rp-crate">${inH.map(sleeve).join("")}</div>
  ${hid ? `<div class="note">❔ ${hid} hidden record${hid > 1 ? "s" : ""} from other Houses ${hid > 1 ? "are" : "is"} tucked away in ${esc(HOUSE_NAMES[fh])}. Its record crate has the riddles.</div>` : ""}
  <div class="note">Finish tasks to unlock records, buy them in each House's record crate with its own tokens, or in the Store. Every House opens with its own song. ⚔ Battle records play when you face the Oracle in Element Duel or Constellation Rummy.</div>
  <details class="rp-credits"><summary>🎼 Music credits</summary><p>The Chamber's 16 records and the House songs marked Original were made for Science is Magic. The rest are free game music, used under their licences:</p><ul>${shown.filter((t) => t.credit || (t.licence && t.licence !== "Original")).map((t) => `<li><b>${esc(t.title)}</b>${t.licence ? ` <small>(${esc(t.licence)})</small>` : ""}${t.credit ? ` · ${esc(t.credit)}` : ""}</li>`).join("")}</ul></details>
</div>`;
}
/** On/off switch and volume slider (used in the header pop-up and the record player). */
export function musicSwitchHtml(s) {
  return `<div class="mu-sw"><button class="c small${s.on ? " on" : ""}" type="button" data-mu="power" aria-pressed="${s.on}">${s.on ? "🎵 Music on" : "🔇 Music off"}</button>
    <label class="mu-vol"><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" step="1" value="${Math.round(s.vol * 100)}" data-mu-vol aria-label="Music volume"><span aria-hidden="true">🔊</span></label></div>`;
}
/** Wire the music controls inside a container. */
export function wireMusic(root, pl, { onOpenStore = null, redraw = null, getProg, save } = {}) {
  root.querySelectorAll("[data-mu]").forEach((b) => (b.onclick = () => { const k = b.dataset.mu;
    if (k === "power") pl.setOn(!musicOf(getProg()).on); else if (k === "toggle") pl.toggle(); else if (k === "next") pl.next(1); else if (k === "prev") pl.next(-1); redraw && redraw(); }));
  root.querySelectorAll("[data-mu-vol]").forEach((r) => (r.oninput = () => pl.setVolume(r.value / 100)));
  root.querySelectorAll("[data-rp-play]").forEach((b) => (b.onclick = () => { pl.play(b.dataset.rpPlay); redraw && redraw(); }));
  root.querySelectorAll("[data-rp-list]").forEach((b) => (b.onclick = () => { togglePlaylist(getProg(), b.dataset.rpList); save(); pl.refresh(); redraw && redraw(); }));
  root.querySelectorAll("[data-rp-up]").forEach((b) => (b.onclick = () => { moveInPlaylist(getProg(), b.dataset.rpUp, -1); save(); pl.refresh(); redraw && redraw(); }));
  root.querySelectorAll("[data-rp-house]").forEach((b) => (b.onclick = () => { rpHouse = b.dataset.rpHouse; redraw && redraw(); }));
  root.querySelectorAll("[data-rp-shop]").forEach((b) => (b.onclick = () => onOpenStore && onOpenStore()));
}

/** A House's record crate: its records for sale (pay with any House's tokens: a pay chip picks which) and the riddles
 *  for its hidden records. wallet.left(houseId) = tokens you hold. */
export function crateHtml(p, house, pay, wallet, esc) {
  const C = crateOf(house), sale = C.filter((t) => t.how === "crate"), hidden = C.filter((t) => t.hidden), cur = TOKEN_EMOJI[pay] ? pay : house;
  const chips = Object.keys(TOKEN_EMOJI).map((h) => `<button class="c small${h === cur ? " on" : ""}" type="button" data-crate-pay="${h}" aria-pressed="${h === cur}">${TOKEN_EMOJI[h]} ${wallet.left(h)}</button>`).join("");
  const rec = (t, i) => { const own = hasTrack(p, t), can = wallet.left(cur) >= t.price;
    return `<div class="rp-rec${own ? "" : " locked"}" style="--lab:${t.label};--ink:${t.ink};--i:${i}"><div class="rp-sleeve">${vinylSvg(own ? t : null, 76, "rp-v")}<span class="rp-cover">${t.icon}</span></div><b>${esc(t.title)}</b>
      ${own ? `<span class="rp-lock">✓ Yours</span>` : `<div class="rp-acts"><button class="c small" type="button" data-crate-listen="${t.id}">🎧 Listen</button><button class="c small main" type="button" data-crate-buy="${t.id}" ${can ? "" : "disabled"}>${TOKEN_EMOJI[cur]} ${t.price}</button></div>`}</div>`; };
  return `<div class="note box-note">The record crate of ${esc(HOUSE_NAMES[house])}. Prices are in ${TOKEN_EMOJI[house]}, but any House's tokens spend here, one for one. Pay with:</div>
  <div class="rp-houses">${chips}</div>
  <div class="rp-crate">${sale.length ? sale.map(rec).join("") : `<div class="note">Nothing for sale here. Records in this House are earned by playing.</div>`}</div>
  ${hidden.length ? `<h3 class="rp-h">❔ Hidden records · ${hidden.filter((t) => hasTrack(p, t)).length} / ${hidden.length}</h3><div class="sec-grid">${hidden.map((t) => { const own = hasTrack(p, t);
    return `<div class="sec-card${own ? " got" : ""}"><span class="sec-e" aria-hidden="true">${own ? t.icon : "❔"}</span><b>${own ? esc(t.title) : "A hidden record"}</b><small>${esc(t.hint)}</small><i>${own ? `From ${esc(HOUSE_NAMES[t.from] || "another House")}` : t.hidden === "find" ? "🔍 Find it" : t.hidden === "task" ? "🎯 Earn it" : "🪙 Pay for it, oddly"}</i></div>`; }).join("")}</div>` : ""}
  <div class="choices"><button class="c" type="button" id="crate-back">✦ Back</button></div>`;
}
