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
];
export const DEFAULT_BOOK = "bk-notebook";
export const bookOf = (p) => BOOKS.find((b) => b.id === (p && p.book)) || BOOKS[0];

const EMBLEM = {
  eye: (c) => `<path d="M-30 0 Q0 -24 30 0 Q0 24 -30 0Z" fill="none" stroke="${c}" stroke-width="3"/><circle r="9" fill="${c}"/><circle r="3.5" fill="#000" opacity=".6"/>`,
  moon: (c) => `<path d="M6 -26 A26 26 0 1 0 6 26 A19 26 0 1 1 6 -26Z" fill="${c}"/>`,
  flask: (c) => `<path d="M-7 -26 H7 V-8 L22 20 Q24 26 16 26 H-16 Q-24 26 -22 20 L-7 -8Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/><path d="M-15 12 H15 L19 21 H-19Z" fill="${c}"/>`,
  star: (c) => { let d = ""; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 11 : 27; d += `${k ? "L" : "M"}${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`; } return `<path d="${d}Z" fill="${c}"/>`; },
  skull: (c) => `<path d="M-20 4 Q-22 -24 0 -24 Q22 -24 20 4 Q20 12 12 14 V22 H-12 V14 Q-20 12 -20 4Z" fill="${c}"/><circle cx="-8" cy="-2" r="5" fill="#0b090d"/><circle cx="8" cy="-2" r="5" fill="#0b090d"/>`,
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
  items: BOOKS.map(({ id, name, note, price, ghost }) => ({ id, name, note, price, ...(ghost ? { ghost } : {}) })),
  talk: {
    open: ["A book for everything the Chamber shows you. Pick the binding; the secrets are free.", "Every seeker needs a grimoire. Leather, velvet, brass… or something that shimmers."],
    tryon: ["{item}. Run a hand over the cover. Feel that? That's craftsmanship. And a little dust.", "{item}. Your Codex will look very serious in that."],
    buy: ["{item} is yours. Your Codex and your Journal live inside it now.", "Sold! {item}. Open it from the 📖 Grimoire button."],
  },
};

// ---- the Journal: a log of days, every entry timestamped ----
export const LOG_CAP = 500;
/** Add an entry ({ at, k, e, t, ref? }) to the front of the log, newest first, capped. */
export function addLog(log, k, e, t, ref = null, at = Date.now()) {
  const L = Array.isArray(log) ? log : []; L.unshift({ at, k, e, t: String(t).slice(0, 220), ...(ref != null ? { ref } : {}) }); if (L.length > LOG_CAP) L.length = LOG_CAP; return L;
}
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
export function bookSfx(kind = "page") {
  try {
    AC ||= new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime, dur = kind === "cover" ? 0.5 : 0.32;
    const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * dur), AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, kind === "cover" ? 3 : 1.5);
    const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); src.buffer = buf;
    f.type = "bandpass"; f.frequency.setValueAtTime(kind === "cover" ? 300 : 2400, t); f.frequency.exponentialRampToValueAtTime(kind === "cover" ? 120 : 900, t + dur); f.Q.value = 0.8;
    g.gain.setValueAtTime(kind === "cover" ? 0.5 : 0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(AC.destination); src.start(t);
  } catch { /* no audio */ }
}
