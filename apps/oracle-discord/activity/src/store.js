// The Essence store: Essence is earned in the Chamber (every ✦ of a reading also gives 💎 Essence) and spent here on
// the Oracle's clothing, alternate avatars, reading tools and voices. Cosmetic only, never real money.
// Daily readings in the Chamber grow with rank (1, 3, 5, then unlimited) and an Essence day pass adds one more today.
// The slash commands in chat are never limited.
const today = (d = new Date()) => d.toLocaleDateString("en-CA");

export const DAILY = [{ rank: "Seeker", n: 1 }, { rank: "Initiate", n: 3 }, { rank: "Adept", n: 5 }, { rank: "Magus", n: Infinity }, { rank: "Oracle-touched", n: Infinity }];
export const DAY_PASS = 40;
export const dailyLimit = (rankName) => (DAILY.find((d) => d.rank === rankName) || DAILY[0]).n;
export function readsLeft(p, rankName, now = new Date()) {
  const lim = dailyLimit(rankName); if (lim === Infinity) return Infinity;
  const d = p.day && p.day.d === today(now) ? p.day : { used: 0, extra: 0 };
  return Math.max(0, lim + d.extra - d.used);
}
function dayOf(p, now) { if (!p.day || p.day.d !== today(now)) p.day = { d: today(now), used: 0, extra: 0 }; return p.day; }
export function useRead(p, now = new Date()) { dayOf(p, now).used++; }
export function buyDayPass(p, now = new Date()) { if ((p.essence || 0) < DAY_PASS) return false; p.essence -= DAY_PASS; dayOf(p, now).extra++; return true; }

const G = "#E2B04A";
/** Everything for sale. kind: outfit | avatar | cloth | orb | flame | voice. price 0 = owned from the start. */
export const STORE = [
  // Oracle clothing: the hood's colours and its trim
  { id: "midnight", kind: "outfit", name: "Midnight hood", price: 0, hood: ["#2a1748", "#0d0718", "#030107"], trim: G },
  { id: "crimson", kind: "outfit", name: "Crimson robe", price: 80, hood: ["#7a1630", "#3a0816", "#120206"], trim: G },
  { id: "emerald", kind: "outfit", name: "Emerald mantle", price: 80, hood: ["#17604a", "#0a2e24", "#03100c"], trim: "#FADE8C" },
  { id: "labcoat", kind: "outfit", name: "Science is Magic lab coat", price: 200, hood: ["#f4f1ea", "#c9c4d6", "#6d6880"], trim: "#66E0C8" },
  { id: "starcloak", kind: "outfit", name: "Starfield cloak", price: 150, hood: ["#1d3a8e", "#0b1640", "#02040f"], trim: "#c9d4ff" },
  { id: "vestments", kind: "outfit", name: "Golden vestments", price: 250, hood: ["#e9b947", "#8c5e17", "#2a1a05"], trim: "#FFF3C4" },
  // Alternate avatars: a new face and extras on the hood
  { id: "classic", kind: "avatar", name: "The Classic", price: 0 },
  { id: "cat", kind: "avatar", name: "Cat Oracle", price: 120,
    back: `<g fill="#1a0d2e" stroke="${G}" stroke-width="2.5" stroke-linejoin="round"><path d="M193 46 L156 4 L176 88Z"/><path d="M207 46 L244 4 L224 88Z"/></g><path d="M188 52 L164 20 L178 76Z M212 52 L236 20 L222 76Z" fill="#FF4FB3" opacity=".7"/>` },
  { id: "horned", kind: "avatar", name: "Horned Oracle", price: 150,
    back: `<g fill="#E9B947" stroke="#7a4f12" stroke-width="2"><path d="M182 104 C150 92 130 60 150 28 C148 58 166 80 190 86Z"/><path d="M218 104 C250 92 270 60 250 28 C252 58 234 80 210 86Z"/></g>` },
  { id: "moon", kind: "avatar", name: "Moon Oracle", price: 150, face: ["#F4F6FF", "#B9C2D9", "#5d6580"], iris: ["#c8fff3", "#66E0C8", "#1f7f6e"],
    front: `<path d="M214 2 A18 18 0 1 0 226 30 A14 14 0 1 1 214 2Z" fill="#F4F6FF" stroke="#B9C2D9" stroke-width="1.5"/>` },
  { id: "sphinx", kind: "avatar", name: "Sphinx Oracle", price: 200,
    hood: `<g clip-path="url(#t-hoodclip)" opacity=".6"><rect x="0" y="0" width="400" height="400" fill="url(#t-nemes)"/></g>`,
    front: `<path d="M200 70 C192 62 192 50 200 46 C208 50 208 62 200 70Z" fill="${G}" stroke="#7a4f12" stroke-width="1.5"/>` },
  { id: "cosmic", kind: "avatar", name: "Cosmic Oracle", price: 300, face: ["#9aa8ff", "#2a2f8a", "#0a0b30"], iris: ["#fff6c8", "#FADE8C", "#b8862a"],
    face2: Array.from({ length: 26 }, (_, i) => `<circle cx="${130 + ((i * 53) % 140)}" cy="${80 + ((i * 37) % 150)}" r="${(i % 3) * 0.6 + 0.8}" fill="#fff" opacity=".85"/>`).join("") },
  // Reading tools: table cloths, crystal balls and candle flames
  { id: "silk", kind: "cloth", name: "Crimson silk", price: 60, c: ["#8a1f3a", "#560f24", "#1e050c"] },
  { id: "ocean", kind: "cloth", name: "Deep ocean", price: 60, c: ["#14607a", "#0b3a4e", "#03141c"] },
  { id: "void", kind: "orb", name: "Void glass", price: 80, f: "grayscale(1) brightness(.55) contrast(1.6)" },
  { id: "opal", kind: "orb", name: "Opal", price: 100, f: "saturate(.4) brightness(1.35)" },
  { id: "goldflame", kind: "flame", name: "Golden flame", price: 0, f: "none" },
  { id: "blueflame", kind: "flame", name: "Spirit-blue flame", price: 50, f: "hue-rotate(170deg) saturate(1.4)" },
  { id: "greenflame", kind: "flame", name: "Alchemist green flame", price: 50, f: "hue-rotate(80deg) saturate(1.5)" },
  { id: "pinkflame", kind: "flame", name: "Third-eye pink flame", price: 70, f: "hue-rotate(-60deg) saturate(1.6)" },
  // Voices: how the Oracle's talk blips sound
  { id: "classic-voice", kind: "voice", name: "Classic blips", price: 0, v: { type: "square", base: 330, step: 28, vowel: 60, dur: 0.045, lp: 2600 } },
  { id: "whisper", kind: "voice", name: "Whisper", price: 60, v: { type: "triangle", base: 520, step: 30, vowel: 40, dur: 0.03, lp: 4200 } },
  { id: "deep", kind: "voice", name: "Deep temple voice", price: 60, v: { type: "sawtooth", base: 130, step: 14, vowel: 30, dur: 0.07, lp: 900 } },
  { id: "bell", kind: "voice", name: "Glass bell", price: 90, v: { type: "sine", base: 660, step: 55, vowel: 110, dur: 0.08, lp: 6000 } },
  { id: "robot", kind: "voice", name: "Lab robot", price: 120, v: { type: "square", base: 220, step: 110, vowel: 0, dur: 0.035, lp: 1800 } },
];
export const KINDS = [["outfit", "👘 Clothing"], ["avatar", "🎭 Avatars"], ["cloth", "🧵 Table cloths"], ["orb", "🔮 Crystal balls"], ["flame", "🕯️ Candles"], ["voice", "🗣️ Voices"]];
export const FREE = STORE.filter((s) => s.price === 0).map((s) => s.id);
export const item = (id) => STORE.find((s) => s.id === id);
export function buy(p, id) {
  const it = item(id); if (!it || p.owned.includes(id) || (p.essence || 0) < it.price) return false;
  p.essence -= it.price; p.owned.push(id); return true;
}
