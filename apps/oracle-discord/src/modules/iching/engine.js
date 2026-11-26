// Science is Magic I Ching engine. Platform-agnostic (Node / browser / Worker).
// 6 coins shown, one per line; each line is cast with the classic 3-coin odds:
//   6 old yin (1/8, changing)  7 young yang (3/8)  8 young yin (3/8)  9 old yang (1/8, changing)


// Trigrams, lines listed bottom -> top (1 = yang).
const TRIGRAMS = {
  qian: { bits: '111', hz: '☰', name: 'Heaven', py: 'Qián', quality: 'creative force, strength, initiative' },
  dui:  { bits: '110', hz: '☱', name: 'Lake',   py: 'Duì',  quality: 'joy, openness, exchange' },
  li:   { bits: '101', hz: '☲', name: 'Fire',   py: 'Lí',   quality: 'clarity, insight, attachment' },
  zhen: { bits: '100', hz: '☳', name: 'Thunder',py: 'Zhèn', quality: 'arousal, shock, new movement' },
  xun:  { bits: '011', hz: '☴', name: 'Wind',   py: 'Xùn',  quality: 'gentle penetration, influence' },
  kan:  { bits: '010', hz: '☵', name: 'Water',  py: 'Kǎn',  quality: 'danger, depth, flow' },
  gen:  { bits: '001', hz: '☶', name: 'Mountain',py:'Gèn',  quality: 'stillness, limits, rest' },
  kun:  { bits: '000', hz: '☷', name: 'Earth',  py: 'Kūn',  quality: 'receptivity, devotion, support' },
};
const BY_BITS = Object.fromEntries(Object.entries(TRIGRAMS).map(([k, t]) => [t.bits, k]));

// King Wen number lookup: KW[lower][upper].
const ORDER = ['qian', 'zhen', 'kan', 'gen', 'kun', 'xun', 'li', 'dui'];
const KW_ROWS = [
  [1, 34, 5, 26, 11, 9, 14, 43],
  [25, 51, 3, 27, 24, 42, 21, 17],
  [6, 40, 29, 4, 7, 59, 64, 47],
  [33, 62, 39, 52, 15, 53, 56, 31],
  [12, 16, 8, 23, 2, 20, 35, 45],
  [44, 32, 48, 18, 46, 57, 50, 28],
  [13, 55, 63, 22, 36, 37, 30, 49],
  [10, 54, 60, 41, 19, 61, 38, 58],
];
const KW = {};
ORDER.forEach((lo, r) => ORDER.forEach((up, c) => { (KW[lo] ||= {})[up] = KW_ROWS[r][c]; }));

function rng() {
  if (globalThis.crypto?.getRandomValues) { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] / 2 ** 32; }
  return Math.random();
}

// One line = three coin tosses (heads 3, tails 2). Returns 6..9 plus the toss detail.
function castLine(rand = rng) {
  const tosses = [0, 1, 2].map(() => (rand() < 0.5 ? 3 : 2));
  return { value: tosses.reduce((a, b) => a + b, 0), tosses };
}

function castHexagram(rand = rng) {
  return Array.from({ length: 6 }, () => castLine(rand)); // index 0 = bottom line
}

const isYang = v => v === 7 || v === 9;
const isChanging = v => v === 6 || v === 9;

function hexFromBits(bits) { // bits: 6-char string bottom -> top
  const lower = BY_BITS[bits.slice(0, 3)], upper = BY_BITS[bits.slice(3)];
  return { number: KW[lower][upper], lower, upper, bits };
}

// Which texts carry the weight of the reading (Zhu Xi's traditional rules).
function focus(values, primaryN) {
  const ch = values.map((v, i) => (isChanging(v) ? i : -1)).filter(i => i >= 0);
  const still = [0, 1, 2, 3, 4, 5].filter(i => !ch.includes(i));
  switch (ch.length) {
    case 0: return { rule: 'No changing lines: the primary judgment is the answer.', primary: ['judgment'], relating: [] };
    case 1: return { rule: 'One changing line: it is the heart of the reading.', primary: [`line${ch[0] + 1}`], relating: [] };
    case 2: return { rule: 'Two changing lines: both speak, the upper one leads.', primary: [`line${ch[1] + 1}`, `line${ch[0] + 1}`], relating: [] };
    case 3: return { rule: 'Three changing lines: read both judgments; the situation is in full transition.', primary: ['judgment'], relating: ['judgment'] };
    case 4: return { rule: 'Four changing lines: the two steady lines of the relating hexagram guide you, the lower one leads.', primary: [], relating: still.map(i => `line${i + 1}`) };
    case 5: return { rule: 'Five changing lines: the one steady line of the relating hexagram guides you.', primary: [], relating: still.map(i => `line${i + 1}`) };
    default: return { rule: 'All six lines change: the relating hexagram\'s judgment is the answer.', primary: (primaryN === 1 || primaryN === 2) ? ['allChange'] : [], relating: ['judgment'] };
  }
}

// data: array/map of 64 hexagram entries keyed by number (see data/*.js).
function read(question, data, rand = rng) {
  const lines = castHexagram(rand);
  const values = lines.map(l => l.value);
  const pBits = values.map(v => (isYang(v) ? '1' : '0')).join('');
  const rBits = values.map(v => (isChanging(v) ? (isYang(v) ? '0' : '1') : (isYang(v) ? '1' : '0'))).join('');
  const nBits = pBits.slice(1, 4) + pBits.slice(2, 5); // nuclear: lines 2-4 under 3-5
  const primary = hexFromBits(pBits);
  const changing = values.map((v, i) => (isChanging(v) ? i + 1 : 0)).filter(Boolean);
  const relating = changing.length ? hexFromBits(rBits) : null;
  const nuclear = hexFromBits(nBits);
  const get = n => (Array.isArray(data) ? data.find(h => h.n === n) : data[n]);
  return {
    question, castAt: new Date().toISOString(), lines, values, changing,
    primary: { ...primary, text: get(primary.number) },
    relating: relating && { ...relating, text: get(relating.number) },
    nuclear: { ...nuclear, text: get(nuclear.number) },
    trigrams: { lower: TRIGRAMS[primary.lower], upper: TRIGRAMS[primary.upper] },
    focus: focus(values, primary.number),
  };
}

export { TRIGRAMS, KW, castLine, castHexagram, hexFromBits, focus, read, isYang, isChanging };
