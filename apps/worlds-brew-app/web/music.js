// Pixel Scape web build: its music (Frank 2026-11-27). The app opens with its opening song, New World (its most
// on-brand record), then shuffles through Pixel Scape's own records from the brand map. A small 🎵 button turns it
// off or skips; the choice is remembered in this browser. Browsers only play sound after a tap, so it starts on the
// first tap or key. build.js copies the records into dist/music/ and writes dist/music/list.json.
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };

/** Play order: the opener first, then the rest shuffled (rand is injectable for tests). */
export function order(list, opener, rand = Math.random) {
  const rest = list.filter((t) => t.id !== opener).map((t) => [rand(), t]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const first = list.find((t) => t.id === opener); return first ? [first, ...rest] : rest;
}

export async function startMusic({ base = "music/", doc = document, AudioCtor = window.Audio } = {}) {
  let data; try { data = await (await fetch(base + "list.json")).json(); } catch (e) { return null; }
  if (!data || !data.tracks || !data.tracks.length) return null;
  const queue = order(data.tracks, data.opener), audio = new AudioCtor(); let i = 0, on = store.get("ps-music") !== "off", begun = false;
  audio.volume = 0.35;
  const btn = doc.createElement("button"); btn.type = "button"; btn.className = "ps-music";
  const skip = doc.createElement("button"); skip.type = "button"; skip.className = "ps-music ps-music-skip"; skip.textContent = "⏭"; skip.setAttribute("aria-label", "Next song");
  const info = doc.createElement("button"); info.type = "button"; info.className = "ps-music"; info.textContent = "ⓘ"; info.setAttribute("aria-label", "Music credits");
  const panel = doc.createElement("div"); panel.className = "ps-music-credits"; panel.hidden = true;
  const credited = data.tracks.filter((t) => t.credit || (t.licence && t.licence !== "Original"));
  panel.innerHTML = "<b>Music</b><p>Orbit Mode, Render Farm and New World were made for Pixel Scape. The rest is free game music, used under its licence:</p><ul></ul>";
  for (const t of credited) { const li = doc.createElement("li"); li.textContent = `${t.title} (${t.licence})${t.credit ? ": " + t.credit : ""}`; panel.querySelector("ul").append(li); }
  info.onclick = (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; };
  const label = () => { const t = queue[i]; btn.textContent = on ? "🎵" : "🔇"; btn.title = on ? `Music on: ${t.title}${t.credit ? " · " + t.credit : ""}. Tap to turn it off.` : "Music off. Tap to turn it on."; btn.setAttribute("aria-label", btn.title); skip.hidden = !on; };
  const load = () => { audio.src = base + queue[i].id + ".mp3"; label(); if (on && begun) audio.play().catch(() => {}); };
  audio.addEventListener("ended", () => { i = (i + 1) % queue.length; load(); });
  btn.onclick = (e) => { e.stopPropagation(); on = !on; store.set("ps-music", on ? "on" : "off"); begun = true; if (on) { if (!audio.src) load(); else audio.play().catch(() => {}); } else audio.pause(); label(); };
  skip.onclick = (e) => { e.stopPropagation(); i = (i + 1) % queue.length; load(); };
  const wrap = doc.createElement("div"); wrap.className = "ps-music-bar"; wrap.append(btn, skip, info); doc.body.append(wrap, panel); label();
  const first = () => { if (begun) return; begun = true; if (on) load(); };
  doc.addEventListener("pointerdown", first, { once: true, capture: true }); doc.addEventListener("keydown", first, { once: true, capture: true });
  return { audio, queue, get on() { return on; }, get index() { return i; }, btn, skip, info, panel, begin: first };
}
