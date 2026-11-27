// Character options for the Oracle: the creator (free tweaks on top of the avatar and robe), familiars (a small companion
// beside her, sold on its own shelf), the emote wheel, and seasonal looks (sold only in their season).
// Rules and drawing only; main.js applies them.

// ---- the Oracle creator: prog.look = { iris, pupil, trim, nail, skin } ("" = the avatar's or robe's own) ----
export const CREATOR = {
  iris: { label: "Eye colour", opts: [["", "Avatar's own"], ["#FF4FB3", "Magenta"], ["#66E0C8", "Teal"], ["#8fd14f", "Cat green"], ["#ffb347", "Amber"], ["#7a9cff", "Sapphire"], ["#ff4040", "Ruby"], ["#e8e8ff", "Ghost white"], ["#b06cff", "Violet"]] },
  pupil: { label: "Pupil", opts: [["", "Avatar's own"], ["slit", "Slit"], ["round", "Round"], ["bar", "Goat bar"], ["dot", "Pinpoint"], ["star", "Star"]] },
  trim: { label: "Hood trim", opts: [["", "Robe's own"], ["#E2B04A", "Gold"], ["#c7cfdd", "Silver"], ["#ff8fc8", "Rose"], ["#66E0C8", "Teal"], ["#b06cff", "Violet"], ["#ff5a3d", "Ember"], ["#ffffff", "White"]] },
  nail: { label: "Nails", opts: [["", "Avatar's own"], ["#FF4FB3", "Pink"], ["#1a0505", "Black"], ["#E2B04A", "Gold"], ["#66E0C8", "Teal"], ["#ff4040", "Red"], ["#ffffff", "White"], ["#7a9cff", "Blue"]] },
  skin: { label: "Hands", opts: [["", "Avatar's own"], ["#3a2a5c", "Shadow violet"], ["#1d1426", "Ink"], ["#5a1020", "Crimson"], ["#9aa3bd", "Moon grey"], ["#c8932e", "Gilded"], ["#232a7a", "Night blue"], ["#2f6e4a", "Moss"]] },
};
export const PUPILS = { slit: [2.6, 10], round: [5, 5], bar: [11, 2.4], dot: [1.8, 1.8], star: [0, 0] };
/** The creator's choices, with only known values kept. */
export function lookOf(p) {
  const L = (p && p.look) || {}, out = {};
  for (const [k, c] of Object.entries(CREATOR)) out[k] = c.opts.some(([v]) => v === L[k]) ? L[k] : "";
  return out;
}
/** Apply creator choices over an avatar look (looks.js AVATAR_LOOK entry); returns a new look. */
export function withCreator(A, look) {
  const B = { ...A, hands: { ...A.hands } };
  if (look.iris) B.iris = [shade(look.iris, 0.45), look.iris, shade(look.iris, -0.45)];
  if (look.pupil) { B.pupil = PUPILS[look.pupil]; B.star = look.pupil === "star"; }
  if (look.nail) B.hands.nail = look.nail;
  if (look.skin) B.hands.skin = look.skin;
  return B;
}
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)));
  return "#" + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

// ---- familiars: prog.familiar ----
export const FAMILIARS = [
  { id: "fam-none", name: "No familiar", note: "The Oracle works alone", price: 0 },
  { id: "fam-cat", name: "Shadow cat", note: "A black cat with gold eyes. Purrs at good news, hisses at pokes", price: 140 },
  { id: "fam-owl", name: "Barn owl", note: "Blinks slowly, turns its head, hoots on the hour", price: 140 },
  { id: "fam-moth", name: "Luna moth", note: "Pale green wings that flutter round the candle light", price: 120 },
  { id: "fam-bot", name: "Tiny lab robot", note: "Science is Magic: beeps, spins its antenna, takes notes", price: 180 },
  { id: "fam-toad", ghost: true, name: "Graveyard toad", note: "A warty toad with a candle stub on its head", price: 120 },
];
/** A familiar in SVG (100 x 100), parts classed for the CSS that animates them. */
export function familiarSvg(id) {
  const svg = (inner) => `<svg viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
  if (id === "fam-cat") return svg(`<g class="fm-body"><path class="fm-tail" d="M70 86 Q92 80 88 58 Q86 46 92 40" fill="none" stroke="#120c1a" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="50" cy="78" rx="24" ry="16" fill="#120c1a"/><circle cx="50" cy="50" r="18" fill="#120c1a"/><path d="M35 40 L33 22 L46 34Z M65 40 L67 22 L54 34Z" fill="#120c1a"/>
    <g class="fm-eyes"><ellipse cx="43" cy="49" rx="4.5" ry="5" fill="#ffd34a"/><ellipse cx="57" cy="49" rx="4.5" ry="5" fill="#ffd34a"/><ellipse class="fm-pup" cx="43" cy="49" rx="1.2" ry="4" fill="#000"/><ellipse class="fm-pup" cx="57" cy="49" rx="1.2" ry="4" fill="#000"/></g>
    <path d="M47 57 L50 59 L53 57" fill="none" stroke="#ff8fc8" stroke-width="1.5"/></g>`);
  if (id === "fam-owl") return svg(`<g class="fm-body"><ellipse cx="50" cy="66" rx="24" ry="28" fill="#c8a070"/><ellipse cx="50" cy="72" rx="15" ry="18" fill="#f4e6c8"/>
    <g class="fm-head"><path d="M28 44 Q50 18 72 44 Q72 60 50 62 Q28 60 28 44Z" fill="#e8d0a8"/><path d="M50 30 Q38 32 34 46 Q42 56 50 50 Q58 56 66 46 Q62 32 50 30Z" fill="#fff8ea"/>
    <g class="fm-eyes"><circle cx="42" cy="44" r="6" fill="#1a0f05"/><circle cx="58" cy="44" r="6" fill="#1a0f05"/><circle cx="40" cy="42" r="1.6" fill="#fff"/><circle cx="56" cy="42" r="1.6" fill="#fff"/></g><path d="M50 48 L47 53 L50 56 L53 53Z" fill="#d88a2a"/></g>
    <path d="M40 94 l-3 4 M44 94 v5 M56 94 v5 M60 94 l3 4" stroke="#d88a2a" stroke-width="2"/></g>`);
  if (id === "fam-moth") return svg(`<g class="fm-body"><g class="fm-wingL"><path d="M50 50 Q20 20 12 40 Q8 62 50 56Z" fill="#b8f0c8" opacity=".9"/><circle cx="28" cy="42" r="5" fill="none" stroke="#ffd34a" stroke-width="1.6"/><path d="M50 56 Q30 72 30 92 Q42 84 50 60Z" fill="#9ee6b2"/></g>
    <g class="fm-wingR"><path d="M50 50 Q80 20 88 40 Q92 62 50 56Z" fill="#b8f0c8" opacity=".9"/><circle cx="72" cy="42" r="5" fill="none" stroke="#ffd34a" stroke-width="1.6"/><path d="M50 56 Q70 72 70 92 Q58 84 50 60Z" fill="#9ee6b2"/></g>
    <ellipse cx="50" cy="56" rx="4" ry="14" fill="#f4f8e8"/><path d="M48 43 Q42 30 36 28 M52 43 Q58 30 64 28" fill="none" stroke="#f4f8e8" stroke-width="1.4"/></g>`);
  if (id === "fam-bot") return svg(`<g class="fm-body"><g class="fm-ant"><line x1="50" y1="30" x2="50" y2="16" stroke="#8fa3ad" stroke-width="2.5"/><circle class="fm-led" cx="50" cy="14" r="4" fill="#66E0C8"/></g>
    <rect x="30" y="30" width="40" height="30" rx="8" fill="#d8e2e8" stroke="#8fa3ad" stroke-width="2"/><rect x="36" y="37" width="28" height="15" rx="5" fill="#0f2a33"/>
    <g class="fm-eyes"><circle cx="44" cy="44.5" r="3.2" fill="#66E0C8"/><circle cx="56" cy="44.5" r="3.2" fill="#66E0C8"/></g>
    <rect x="34" y="62" width="32" height="22" rx="5" fill="#c9d4dc" stroke="#8fa3ad" stroke-width="2"/><circle cx="50" cy="72" r="4" fill="#FF4FB3"/><rect x="38" y="86" width="9" height="8" rx="2" fill="#8fa3ad"/><rect x="53" y="86" width="9" height="8" rx="2" fill="#8fa3ad"/></g>`);
  if (id === "fam-toad") return svg(`<g class="fm-body"><ellipse cx="50" cy="76" rx="30" ry="16" fill="#4a6a2a"/><ellipse cx="50" cy="80" rx="18" ry="8" fill="#a8b870"/>
    <g class="fm-eyes"><circle cx="36" cy="62" r="8" fill="#4a6a2a"/><circle cx="64" cy="62" r="8" fill="#4a6a2a"/><circle cx="36" cy="61" r="4.5" fill="#ffd34a"/><circle cx="64" cy="61" r="4.5" fill="#ffd34a"/><rect x="34" y="60" width="4" height="2" fill="#000"/><rect x="62" y="60" width="4" height="2" fill="#000"/></g>
    <rect x="45" y="38" width="10" height="16" rx="2" fill="#efe3cf"/><path class="fm-flame" d="M50 26 Q55 33 50 38 Q45 33 50 26Z" fill="#ffb347"/><circle cx="40" cy="74" r="2" fill="#3a5220"/><circle cx="60" cy="72" r="2.4" fill="#3a5220"/></g>`);
  return "";
}
export const familiarShop = {
  kind: "familiar",
  label: "🐾 Familiars",
  items: FAMILIARS.map(({ id, name, note, price, ghost }) => ({ id, name, note, price, ...(ghost ? { ghost } : {}) })),
  talk: {
    open: ["Every oracle needs a familiar. Someone has to judge your questions silently.", "Cats, owls, moths… and one very small robot. Pick a friend."],
    tryon: ["{item}. Look, it likes you. Or it's hungry. Hard to tell.", "{item}. We'd make a good team. I'll do the talking."],
    buy: ["{item} moves in. I'll clear a shelf.", "{item} is yours! Say hello. It won't say it back, but still."],
  },
};

// ---- the emote wheel: what members can make the Oracle do ----
export const EMOTES = [
  { id: "wave", e: "👋", name: "Wave", mood: "joy", say: "Hello, hello!" },
  { id: "laugh", e: "😂", name: "Laugh", mood: "laugh", say: "Ha! Good one." },
  { id: "gasp", e: "😲", name: "Gasp", mood: "wow", say: "No way!" },
  { id: "dance", e: "💃", name: "Dance", mood: "cheer", say: "The stars have rhythm." },
  { id: "love", e: "😍", name: "Love", mood: "love", say: "Aww." },
  { id: "wink", e: "😉", name: "Wink", mood: "wink", say: "Our secret." },
  { id: "think", e: "🤔", name: "Ponder", mood: "think", say: "Hmm…" },
  { id: "spook", e: "👻", name: "Spook", mood: "nervous", say: "Did you hear that?" },
];
export const emoteOf = (id) => EMOTES.find((x) => x.id === id) || null;

// ---- seasonal looks: sold only in their window (local date) ----
export const SEASONS = [
  { id: "halloween", name: "Hallowtide", e: "🎃", from: [10, 1], to: [11, 7] },
  { id: "winter", name: "Midwinter", e: "❄️", from: [11, 20], to: [1, 15] },
  { id: "spring", name: "Spring equinox", e: "🌸", from: [3, 15], to: [4, 30] },
];
const md = (d) => (d.getMonth() + 1) * 100 + d.getDate();
export function seasonNow(at = Date.now()) {
  const n = md(new Date(at));
  return SEASONS.find((s) => { const a = s.from[0] * 100 + s.from[1], b = s.to[0] * 100 + s.to[1]; return a <= b ? n >= a && n <= b : n >= a || n <= b; }) || null;
}
/** When a season next opens (ms), for "returns in…". */
export function seasonOpens(id, at = Date.now()) {
  const s = SEASONS.find((x) => x.id === id), d = new Date(at); let t = new Date(d.getFullYear(), s.from[0] - 1, s.from[1]).getTime();
  if (t <= at) t = new Date(d.getFullYear() + 1, s.from[0] - 1, s.from[1]).getTime(); return t;
}
export const SEASONAL = [
  { id: "sea-pumpkin", season: "halloween", kind: "outfit", name: "Pumpkin hex robe", note: "Hallowtide: orange and black, the hem smoulders like a jack-o'-lantern", price: 130, element: "fire", hood: ["#e0701a", "#6a2a08", "#120502"], trim: "#1a0f05" },
  { id: "sea-pumpkin-c", season: "halloween", kind: "flame", name: "Jack-o'-lantern candles", note: "Hallowtide: candles in carved pumpkins", price: 70, wax: ["#ff9a3a", "#c85a10"], flame: ["#fff", "#ffe08a", "#ff7a1a"], halo: "#ffc27a", detail: "eye" },
  { id: "sea-frost", season: "winter", kind: "outfit", name: "Frost queen robe", note: "Midwinter: ice-blue hood, silver trim, snow on the wind", price: 140, element: "air", hood: ["#cfeaff", "#6a9cc8", "#14304a"], trim: "#ffffff" },
  { id: "sea-frost-c", season: "winter", kind: "flame", name: "Icicle candles", note: "Midwinter: frosted wax and pale blue flames", price: 70, wax: ["#f4fbff", "#cfe3f2"], flame: ["#fff", "#e0f4ff", "#7ab8ff"], halo: "#e0f4ff", detail: "drips" },
  { id: "sea-blossom", season: "spring", kind: "outfit", name: "Blossom robe", note: "Spring: pink and leaf green, vines and falling petals", price: 130, element: "earth", hood: ["#ff9fc8", "#6a8a3a", "#1a2a0a"], trim: "#fff0f6" },
  { id: "sea-blossom-c", season: "spring", kind: "flame", name: "Petal candles", note: "Spring: rose wax with blossom-pink flames", price: 70, wax: ["#ffd0e2", "#f0a8c4"], flame: ["#fff", "#ffd6ec", "#ff6aa8"], halo: "#ffd6ec", detail: "sigil" },
];
export const onSale = (it, at = Date.now()) => !it.season || (seasonNow(at) || {}).id === it.season;
