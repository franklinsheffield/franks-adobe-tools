// Your Grimoire: the member's own book. It holds the Codex (everything collected), the Journal (a day-by-day log,
// every entry timestamped, with saved readings) and Patterns (what the data shows). The book's look is sold on the
// "📖 Grimoire books" shelf (kind "book", prog.book). Rules and drawing only; main.js opens it and turns the pages.
// Not to be confused with the Herbalist's Grimoire room or Grimoire Memory: this one is "Your Grimoire".

/** The book looks. cover: two leather colours; foil: tooling colour; page: paper style; emblem: the cover sigil. */
export const BOOKS = [
  { id: "bk-notebook", name: "Apprentice's notebook", note: "Brown calf leather, brass corners, cream parchment", price: 0, cover: ["#7a4a24", "#4a2a12"], foil: "#E2B04A", page: "parchment", emblem: "eye", clasp: "brass" },
  { id: "bk-velvet", name: "Midnight velvet", note: "Violet velvet sewn with gold stars, pages that glow faintly", price: 90, cover: ["#3a1d6e", "#170a33"], foil: "#FADE8C", page: "night", emblem: "moon", clasp: "gold", fx: "stars" },
  { id: "bk-brass", name: "Alchemist's casebook", note: "Green leather, riveted brass plates, a turning brass seal", price: 120, cover: ["#24553a", "#0f2a1c"], foil: "#d9a441", page: "vellum", emblem: "flask", clasp: "gear", fx: "gear" },
  { id: "bk-atlas", name: "Star atlas", note: "Navy cloth with foil constellations that twinkle, star-chart pages", price: 150, cover: ["#14285e", "#070f2b"], foil: "#cfe3ff", page: "chart", emblem: "star", clasp: "silver", fx: "twinkle" },
  { id: "bk-bone", ghost: true, name: "Bone and ink", note: "Black leather, a bone clasp, ink that creeps across grey pages", price: 140, cover: ["#26222b", "#0b090d"], foil: "#e8e0cc", page: "ash", emblem: "skull", clasp: "bone", fx: "ink" },
  { id: "bk-lab", name: "Science is Magic lab book", note: "Teal hard cover with a spinning atom, gridded lab pages", price: 180, cover: ["#0f6b63", "#063a35"], foil: "#66E0C8", page: "grid", emblem: "atom", clasp: "steel", fx: "atom" },
  { id: "bk-prism", name: "Prismatic codex", note: "Holographic cover that shifts colour as it turns, pearl pages", price: 260, cover: ["#ff4fb3", "#3d8bff"], foil: "#ffffff", page: "pearl", emblem: "eye", clasp: "prism", fx: "holo" },
  { id: "bk-abyss", set: "deepsea", name: "Abyssal log", note: "Deep Sea set: sharkskin teal with glowing lure-lights, deep-water pages", price: 90, cover: ["#0d4a5a", "#021218"], foil: "#5ff6ff", page: "night", emblem: "eye", clasp: "silver", fx: "twinkle" },
  { id: "bk-clock", set: "clockwork", name: "Clockwork ledger", note: "Clockwork set: oxblood leather, a ticking brass gear, ledger pages", price: 90, cover: ["#6b2a1e", "#2a0c06"], foil: "#f0c060", page: "vellum", emblem: "gear", clasp: "gear", fx: "gear" },
  { id: "bk-aurora", set: "aurora", name: "Aurora diary", note: "Aurora set: a cover that ripples green to violet, starlit pages", price: 110, cover: ["#2f9a7a", "#3a1d6e"], foil: "#c8ffe8", page: "chart", emblem: "star", clasp: "silver", fx: "holo" },
  // secret bindings: never sold, earned inside the book (secrets.js)
  { id: "bk-rune", secret: "cipher", name: "Runebound codex", note: "Slate stone covers cut with glowing runes. Earned by breaking the margin cipher.", price: 0, cover: ["#4a4f57", "#1b1e23"], foil: "#7fe3ff", page: "vellum", emblem: "rune", clasp: "steel", fx: "twinkle" },
  { id: "bk-cipher", secret: "codes", name: "Codebreaker's folio", note: "Ink-black cloth stamped with a silver key, cipher-grid pages. Earned by breaking every coded message in the book.", price: 0, cover: ["#1f2a33", "#070b0f"], foil: "#c9d6e3", page: "grid", emblem: "key", clasp: "steel", fx: "ink" },
  { id: "bk-crown", secret: "sealed", name: "Star-crowned grimoire", note: "Black and gold, crowned with stars. Earned by opening the sealed chapter.", price: 0, cover: ["#1a1426", "#05030a"], foil: "#FADE8C", page: "night", emblem: "crown", clasp: "gold", fx: "stars" },
];
export const DEFAULT_BOOK = "bk-notebook";
export const bookOf = (p) => BOOKS.find((b) => b.id === (p && p.book)) || BOOKS[0];

const EMBLEM = {
  eye: (c) => `<path d="M-30 0 Q0 -24 30 0 Q0 24 -30 0Z" fill="none" stroke="${c}" stroke-width="3"/><circle r="9" fill="${c}"/><circle r="3.5" fill="#000" opacity=".6"/>`,
  moon: (c) => `<path d="M6 -26 A26 26 0 1 0 6 26 A19 26 0 1 1 6 -26Z" fill="${c}"/>`,
  flask: (c) => `<path d="M-7 -26 H7 V-8 L22 20 Q24 26 16 26 H-16 Q-24 26 -22 20 L-7 -8Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><path d="M-15 12 H15 L19 21 H-19Z" fill="${c}"/>`,
  star: (c) => { let d = ""; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 11 : 27; d += `${k ? "L" : "M"}${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`; } return `<path d="${d}Z" fill="${c}"/>`; },
  skull: (c) => `<path d="M-20 4 Q-22 -24 0 -24 Q22 -24 20 4 Q20 12 12 14 V22 H-12 V14 Q-20 12 -20 4Z" fill="${c}"/><circle cx="-8" cy="-2" r="5" fill="#0b090d"/><circle cx="8" cy="-2" r="5" fill="#0b090d"/>`,
  gear: (c) => { let d = ""; for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, r = k % 2 ? 22 : 28; d += `${k ? "L" : "M"}${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`; } return `<g class="bk-spin"><path d="${d}Z" fill="${c}"/><circle r="10" fill="#000" opacity=".45"/></g>`; },
  rune: (c) => `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"><path d="M-14 -26 V26 M-14 -26 L10 -12 L-14 2 L12 26"/><circle r="30" stroke-width="1.4" opacity=".7"/></g>`,
  crown: (c) => `<path d="M-26 14 L-30 -16 L-14 -2 L0 -26 L14 -2 L30 -16 L26 14Z" fill="${c}"/><rect x="-26" y="16" width="52" height="7" rx="2" fill="${c}"/><circle cy="-26" r="3.5" fill="#fff"/>`,
  key: (c) => `<g fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"><circle cx="-12" cy="0" r="11"/><circle cx="-12" cy="0" r="4"/><path d="M-1 0 H28 M18 0 V9 M24 0 V7"/></g>`,
  atom: (c) => `<g class="bk-spin" fill="none" stroke="${c}" stroke-width="3"><ellipse rx="28" ry="10"/><ellipse rx="28" ry="10" transform="rotate(60)"/><ellipse rx="28" ry="10" transform="rotate(-60)"/></g><circle r="5" fill="${c}"/>`,
};
/** The cover, drawn 200 x 280. */
export function coverSvg(b, title = "Your Grimoire", uid = "bk") {
  const id = `${uid}-${b.id}`, f = b.foil;
  const stars = b.fx === "stars" || b.fx === "twinkle" ? Array.from({ length: 14 }, (_, i) => `<circle class="bk-tw" style="--d:${(i * 0.37).toFixed(2)}s" cx="${20 + ((i * 53) % 160)}" cy="${24 + ((i * 89) % 230)}" r="${1 + (i % 3) * 0.6}" fill="${f}"/>`).join("") : "";
  return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
    <linearGradient id="${id}-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b.cover[0]}"/><stop offset="1" stop-color="${b.cover[1]}"/></linearGradient></defs>
    <rect x="2" y="2" width="196" height="276" rx="10" fill="url(#${id}-c)" class="${b.fx === "holo" ? "bk-holo" : ""}"/>
    <rect x="2" y="2" width="18" height="276" rx="6" fill="#000" opacity=".28"/>
    <rect x="30" y="16" width="156" height="248" rx="6" fill="none" stroke="${f}" stroke-width="1.6" opacity=".85"/>
    <rect x="38" y="24" width="140" height="232" rx="4" fill="none" stroke="${f}" stroke-width=".8" stroke-dasharray="2 4" opacity=".7"/>
    ${stars}
    <g transform="translate(108 112)">${(EMBLEM[b.emblem] || EMBLEM.eye)(f)}</g>
    <text x="108" y="182" text-anchor="middle" font-family="Cinzel,serif" font-size="15" font-weight="700" fill="${f}" letter-spacing="1.5">${title.toUpperCase()}</text>
    <path d="M70 194 H146" stroke="${f}" stroke-width="1"/>
    ${b.fx === "ink" ? `<path class="bk-ink" d="M150 250 q-14 -10 -6 -24 q8 -12 -4 -22" fill="none" stroke="${f}" stroke-width="1.4" opacity=".6"/>` : ""}
    <rect x="188" y="124" width="12" height="32" rx="3" fill="${{ brass: "#b8862f", gold: "#E2B04A", gear: "#d9a441", silver: "#c7cfdd", bone: "#e8e0cc", steel: "#8fa3ad", prism: "#ffffff" }[b.clasp] || f}"/>
  </svg>`;
}
/** The shelf in the Essence store (store.js registerShelf). */
export const bookShop = {
  kind: "book",
  label: "📖 Grimoire books",
  items: BOOKS.filter((b) => !b.secret).map(({ id, name, note, price, ghost, set }) => ({ id, name, note, price, ...(ghost ? { ghost } : {}), ...(set ? { set } : {}) })),
  talk: {
    open: ["A book for everything the Chamber shows you. Pick the binding; the secrets are free.", "Every seeker needs a grimoire. Leather, velvet, brass… or something that shimmers."],
    tryon: ["{item}. Run a hand over the cover. Feel that? That's craftsmanship. And a little dust.", "{item}. Your Codex will look very serious in that."],
    buy: ["{item} is yours. Your Codex and your Journal live inside it now.", "Sold! {item}. Open it from the 📖 Grimoire button."],
  },
};

// ---- the Journal: a log of days, every entry timestamped ----
export const LOG_CAP = 500;
/** Add an entry ({ at, k, e, t, ref? }) to the front of the log, newest first, capped. */
export function addLog(log, k, e, t, ref = null, at = Date.now(), d = null) {
  const L = Array.isArray(log) ? log : [], rows = cleanRows(d);
  L.unshift({ at, k, e, t: String(t).slice(0, 220), ...(ref != null ? { ref } : {}), ...(rows.length ? { d: rows } : {}) });
  if (L.length > LOG_CAP) L.length = LOG_CAP;
  for (let i = DETAIL_KEEP; i < L.length; i++) if (L[i] && L[i].d) delete L[i].d; // full details for the newest entries only, to keep storage small
  return L;
}
/** Full details are kept for this many of the newest entries. */
export const DETAIL_KEEP = 150;
/** Detail rows [[label, value], ...]: strings only, empty values dropped, capped in count and length. */
export function cleanRows(d) {
  if (!Array.isArray(d)) return [];
  return d.filter((r) => Array.isArray(r) && r[1] != null && String(r[1]).trim() !== "").slice(0, 14)
    .map(([k, v]) => [String(k).slice(0, 60), String(v).replace(/\*\*|__/g, "").slice(0, 600)]);
}
/** What kind of entry it is, for the full log page. */
export const LOG_KINDS = { reading: "Reading", save: "Saved reading", game: "Game", trophy: "Trophy", buy: "Store", gift: "Daily gift", secret: "Secret", record: "Record" };
/** Full date and time: "Friday, 27 November 2026 · 10:42 AM". */
export const fullWhen = (at) => `${new Date(at).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${timeOf(at)}`;
const pad = (n) => String(n).padStart(2, "0");
/** The local calendar day of a time, as YYYY-MM-DD. */
export const dayKey = (at) => { const d = new Date(at); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
/** "10:42 AM" in the member's own time zone. */
export const timeOf = (at) => new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
/** "Friday, 27 November 2026" (or "Today" / "Yesterday"). */
export function dayLabel(key, now = Date.now()) {
  if (key === dayKey(now)) return "Today"; if (key === dayKey(now - 864e5)) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
/** Group the log by day, newest day first, entries within a day newest first. */
export function byDay(log) {
  const days = new Map();
  for (const x of [...(log || [])].sort((a, b) => b.at - a.at)) { const k = dayKey(x.at); if (!days.has(k)) days.set(k, []); days.get(k).push(x); }
  return [...days.entries()].map(([day, entries]) => ({ day, entries }));
}

// ---- Patterns: what the member's own data shows ----
/** Most-drawn items across every system (p.seen = { system: { item: count } }), top n. */
export function topDrawn(p, n = 8) {
  const all = [];
  for (const [sys, items] of Object.entries(p.seen || {})) for (const [name, c] of Object.entries(items || {})) all.push({ sys, name, c });
  return all.sort((a, b) => b.c - a.c || a.name.localeCompare(b.name)).slice(0, n);
}
/** When the member reads: counts of log entries by part of day. */
export function hoursOf(log) {
  const parts = { Night: 0, Morning: 0, Afternoon: 0, Evening: 0 };
  for (const x of log || []) { if (x.k !== "reading") continue; const h = new Date(x.at).getHours(); parts[h < 5 ? "Night" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : h < 22 ? "Evening" : "Night"]++; }
  return parts;
}

// ---- sound: a paper page turn (noise swept through a filter) and a heavy cover thump ----
let AC = null;
/** Book sounds, made from shaped noise (no files): "page" a dry paper swish with crackle, "cover" the leather spine
 *  creaking open, "thump" the board landing, "close" a creak then a thump. */
export function bookSfx(kind = "page", { gain = 1 } = {}) {
  try {
    AC ||= new (window.AudioContext || window.webkitAudioContext)(); const t0 = AC.currentTime;
    const noise = (dur, shape) => { const b = AC.createBuffer(1, Math.max(1, Math.floor(AC.sampleRate * dur)), AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = shape(i / d.length, Math.random() * 2 - 1); const s = AC.createBufferSource(); s.buffer = b; return s; };
    const out = (node, at, peak, dur, attack = 0.012) => { const g = AC.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak * gain, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); node.connect(g).connect(AC.destination); };
    const filt = (type, f, q = 0.7) => { const x = AC.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };
    const page = (at, level = 0.32) => { // paper: a bright swish that rises and falls, with sparse crackles in it
      const dur = 0.26, s = noise(dur, (p, n) => n * Math.sin(Math.PI * Math.min(1, p * 1.6)) * (Math.random() < 0.035 ? 3.2 : 0.55));
      const hp = filt("highpass", 1400), bp = filt("bandpass", 4200, 0.6); bp.frequency.setValueAtTime(5200, at); bp.frequency.exponentialRampToValueAtTime(2200, at + dur);
      s.connect(hp).connect(bp); out(bp, at, level, dur, 0.03); s.start(at); };
    const creak = (at, dur = 0.42, level = 0.18) => { // leather spine: low, grainy friction that wavers in pitch
      const s = noise(dur, (p, n) => n * (0.4 + 0.6 * Math.abs(Math.sin(p * 46 + Math.sin(p * 9) * 3))));
      const bp = filt("bandpass", 420, 6); bp.frequency.setValueAtTime(520, at); bp.frequency.linearRampToValueAtTime(300, at + dur);
      s.connect(bp); out(bp, at, level, dur, 0.06); s.start(at); };
    const thump = (at, level = 0.55) => { // a heavy board meeting the table: a short low body plus a soft knock
      const o = AC.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(140, at); o.frequency.exponentialRampToValueAtTime(52, at + 0.16); out(o, at, level, 0.2, 0.004); o.start(at); o.stop(at + 0.22);
      const s = noise(0.09, (p, n) => n * (1 - p) * (1 - p)), lp = filt("lowpass", 700); s.connect(lp); out(lp, at, level * 0.5, 0.09, 0.002); s.start(at); };
    if (kind === "page") page(t0);
    else if (kind === "riffle") { for (let i = 0; i < 5; i++) page(t0 + i * 0.07 + Math.random() * 0.02, 0.2 - i * 0.02); }
    else if (kind === "cover") { creak(t0 + 0.3, 0.5); thump(t0 + 1.12, 0.35); page(t0 + 1.1, 0.16); }
    else if (kind === "close") { creak(t0, 0.25, 0.14); thump(t0 + 0.22, 0.5); }
    else if (kind === "thump") thump(t0);
  } catch { /* no audio */ }
}

/** The store try-on: the binding closed, then opening on a sample spread in its own paper (drawn in the table box). */
export function bookPreviewHtml(b) {
  const tiles = ["The Star", "The Moon", "?", "The Atom", "?", "Fehu"].map((n, i) => `<span class="bkp-tile${n === "?" ? " lock" : ""}" style="--i:${i}">${n}</span>`).join("");
  const lines = [["9:12 AM", "🃏", "Tarot: The Star, The Moon"], ["1:40 PM", "⭐", "Séance, Level 2: won"], ["8:05 PM", "📖", "Saved a reading"]]
    .map(([t, e, x], i) => `<div class="bkp-line" style="--i:${i}"><i>${t}</i><span>${e} ${x}</span></div>`).join("");
  return `<div class="bk-stage bkp" data-page="${b.page}" data-fx="${b.fx || ""}" style="--cv1:${b.cover[0]};--cv2:${b.cover[1]};--foil:${b.foil}">
    <div class="bkp-book"><div class="bkp-pages">
      <div class="bkp-pg"><h4>📜 The Codex</h4><div class="bkp-tiles">${tiles}</div></div>
      <div class="bkp-pg"><h4>🗓️ Today</h4>${lines}</div>
      <div class="bkp-leaf"></div></div>
      <div class="bkp-cover">${coverSvg(b, "Your Grimoire", "bkp")}</div></div></div>`;
}
/** The emblem's drawing alone (for faded margin sketches). */
export const emblemInner = (b, c = "currentColor") => (EMBLEM[b.emblem] || EMBLEM.eye)(c);
export const emblemSvg = (b) => `<svg viewBox="-34 -34 68 68" aria-hidden="true">${(EMBLEM[b.emblem] || EMBLEM.eye)(b.foil)}</svg>`;
