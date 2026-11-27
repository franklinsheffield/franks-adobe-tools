// The Chamber's music player: one <audio> element that loops your playlist endlessly (or the hero tracks in a battle),
// the always-there 🎵 button with on/off and volume, and the record player drawn in the Trophy Case.
import { TRACKS, ALL_TRACKS, trackOf, fileOf, musicOf, hasTrack, playlist, battleList, nextIndex, shopId, togglePlaylist, moveInPlaylist } from "./music.js";

/** Create the player. getProg() returns the member's progress; save() stores it; onChange() redraws any open UI. */
export function createPlayer({ getProg, save, onChange = () => {} }) {
  const audio = new Audio(); audio.preload = "auto";
  let held = false, queue = [], idx = 0, cur = null, started = false, battle = null, fadeT = null, previewT = null;
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
  audio.addEventListener("ended", () => { if (queue.length) { idx = nextIndex(idx, queue.length); load(queue[idx], false); } });

  const api = {
    /** Start after the first tap (browsers need one before sound). */
    start() { if (started) return; started = true; const id = rebuild(false); if (id && m().on) load(id); else onChange(); },
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
      idx = queue.indexOf(t.id); load(t.id); },
    toggle() { if (!cur || audio.paused) { if (!m().on) return api.setOn(true); if (cur) { audio.play().catch(() => {}); onChange(); } else api.start(); } else { audio.pause(); onChange(); } },
    next(d = 1) { if (!queue.length) rebuild(false); if (!queue.length) return; idx = nextIndex(idx, queue.length, d); load(queue[idx]); },
    /** The playlist changed: keep playing the current record if it is still in it. */
    refresh() { if (battle) return onChange(); const p = getProg(), list = playlist(p); queue = list.slice();
      if (cur && !queue.includes(cur) && !audio.paused) { if (queue.length) { idx = 0; load(queue[0]); } else { audio.pause(); cur = null; } }
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
/** deck(track, playing) draws the House's own player (the Oracle's turntable by default); the records and playlist are shared. */
export function recordPlayerHtml(p, pl, esc, { deck = turntableSvg } = {}) {
  const s = musicOf(p), cur = pl.current, list = s.list.filter((id) => hasTrack(p, trackOf(id))), owned = ALL_TRACKS.filter((t) => hasTrack(p, t)).length;
  const sleeve = (t, i) => { const own = hasTrack(p, t), inList = list.includes(t.id), on = cur && cur.id === t.id;
    const state = own ? "" : t.how === "shop" ? `<span class="rp-lock">💎 ${t.price} in the Store</span>` : `<span class="rp-lock">🔒 ${esc(t.task)}</span>`;
    return `<div class="rp-rec${own ? "" : " locked"}${on ? " now" : ""}" style="--lab:${t.label};--ink:${t.ink};--i:${i}">
      <div class="rp-sleeve">${vinylSvg(own ? t : null, 76, "rp-v")}<span class="rp-cover">${t.icon}</span>${t.hero ? `<i class="rp-hero">⚔ Battle</i>` : ""}</div>
      <b>${esc(t.title)}</b>${state}
      ${own ? `<div class="rp-acts"><button class="c small" type="button" data-rp-play="${t.id}">${on && pl.playing ? "♪ Playing" : "▶ Play"}</button><button class="c small${inList ? " on" : ""}" type="button" data-rp-list="${t.id}" aria-pressed="${inList}">${inList ? "✓ In playlist" : "＋ Playlist"}</button></div>`
        : t.how === "shop" ? `<div class="rp-acts"><button class="c small" type="button" data-rp-shop="${shopId(t)}">💎 Visit the Store</button></div>` : ""}</div>`; };
  const pos = pl.position;
  return `<div class="rp">
  <div class="rp-deck">
    <div class="rp-tt">${deck(cur, pl.playing && s.on)}</div>
    <div class="rp-ctl">
      <div class="rp-now"><small>${pl.inBattle ? "⚔ Battle music" : s.on ? (pl.playing ? "Now playing" : "Paused") : "Music is off"}</small><b>${cur ? esc(cur.title) : "No record on"}</b><span class="rp-time">${fmt(pos.t)} / ${fmt(pos.d)}</span></div>
      <div class="rp-btns"><button class="c" type="button" data-mu="prev" aria-label="Previous record">⏮</button><button class="c main" type="button" data-mu="toggle" aria-label="${pl.playing ? "Pause" : "Play"}">${pl.playing ? "⏸" : "▶"}</button><button class="c" type="button" data-mu="next" aria-label="Next record">⏭</button></div>
      ${musicSwitchHtml(s)}
      <div class="rp-list"><small>Your playlist · loops forever${list.length ? "" : " · add a record below"}</small>${list.map((id, i) => { const t = trackOf(id); return `<span class="rp-chip${cur && cur.id === id ? " now" : ""}" style="--lab:${t.label}">${t.icon} ${esc(t.title)}<button type="button" data-rp-up="${id}" aria-label="Move ${esc(t.title)} up" ${i ? "" : "disabled"}>▲</button><button type="button" data-rp-list="${id}" aria-label="Take ${esc(t.title)} off the playlist">✕</button></span>`; }).join("")}</div>
    </div>
  </div>
  <h3 class="rp-h">Your records · ${owned} / ${ALL_TRACKS.length}</h3>
  <div class="rp-crate">${ALL_TRACKS.map(sleeve).join("")}</div>
  <div class="note">Finish tasks to unlock records, or buy them in the Store under The Chamber. ⚔ Battle records play when you face the Oracle in Element Duel or Constellation Rummy.</div>
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
  root.querySelectorAll("[data-rp-shop]").forEach((b) => (b.onclick = () => onOpenStore && onOpenStore()));
}
