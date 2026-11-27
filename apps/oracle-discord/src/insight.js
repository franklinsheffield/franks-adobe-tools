// "Reading the data": the evidence layer every reading shares. The facts of the cast or chart come first (what was
// drawn, counted and measured, and how likely it was), then the patterns in them, then what those patterns MAY mean.
// House rule: the Oracle interprets, she does not instruct. Conclusions are possibilities ("may", "tends to",
// "tradition reads this as"), never orders, and they end in open questions rather than advice.
// No imports: this file runs in the slash-command job and in the Chamber alike.

const TEAL = 0x66E0C8;
const FOOT = "Science is Magic · for reflection, not prediction";

/** Pack lines into as few embed fields as fit (Discord: 1024 characters per field value). */
function fieldsOf(name, lines, max = 1000) {
  const out = []; let cur = "";
  for (const raw of lines.filter(Boolean)) {
    const l = raw.length > max ? raw.slice(0, max - 1) + "…" : raw;
    if (cur && (cur + "\n" + l).length > max) { out.push(cur); cur = ""; }
    cur = cur ? cur + "\n" + l : l;
  }
  if (cur) out.push(cur);
  return out.map((value, i) => ({ name: i ? `${name} (continued)` : name, value }));
}

const strip = (s) => String(s).replace(/\*\*|__|\*|`/g, "");

/**
 * Build the analysis of a reading.
 * data:        [[label, value], ...] the plain facts, nothing interpreted
 * patterns:    [string] relationships found in the data (counts, balances, repeats, links between parts)
 * conclusions: [string] what those patterns may mean, worded as possibilities
 * questions:   [string] what the reading leaves open (these replace advice)
 * method:      [string] how the result was produced and how likely it was
 * Returns { embed, analysis }: a Discord embed, and the same content as plain strings for the Chamber.
 */
export function insight(parts = {}) {
  const clean = (a) => (a || []).filter(Boolean);
  const data = clean(parts.data), patterns = clean(parts.patterns), conclusions = clean(parts.conclusions), questions = clean(parts.questions), method = clean(parts.method), who = parts.who || "";
  const embed = {
    title: "🔬 Reading the data", color: TEAL,
    description: "*The facts first, then what they may mean. These are possible readings of the evidence, not instructions.*",
    fields: [
      ...fieldsOf("📊 The data", data.map(([k, v]) => `**${k}:** ${v}`)),
      ...fieldsOf("🧩 Patterns in it", patterns.map((p) => `• ${p}`)),
      ...fieldsOf("💡 What may be concluded", conclusions.map((p) => `• ${p}`)),
      ...fieldsOf("❓ What it leaves open", questions.map((p) => `• ${p}`)),
      ...fieldsOf("📐 Method and odds", method.map((p) => `• ${p}`)),
    ].slice(0, 25),
    footer: { text: who ? `${FOOT} · reading for ${who}` : FOOT },
  };
  const analysis = { data: data.map(([k, v]) => strip(`${k}: ${v}`)), patterns: patterns.map(strip), conclusions: conclusions.map(strip), questions: questions.map(strip), method: method.map(strip) };
  return { embed, analysis };
}

/** Put the analysis right after the main embed, so the data comes before the longer interpretation. */
export function withInsight(embeds, ins) { return [embeds[0], ins.embed, ...embeds.slice(1)]; }

// Small maths helpers for the odds lines.
export const choose = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
/** Chance of exactly k hits in n independent tries of probability p. */
export const binom = (n, k, p) => choose(n, k) * p ** k * (1 - p) ** (n - k);
/** Chance of exactly k "marked" cards when drawing n from a deck of N that holds K marked ones. */
export const hyper = (N, K, n, k) => (choose(K, k) * choose(N - K, n - k)) / choose(N, n);
/** A probability as readable text: "about 1 in 12 (8.3%)". */
export function odds(p) {
  if (!(p > 0)) return "not possible";
  if (p >= 0.995) return "certain";
  const pct = p * 100, pc = pct >= 10 ? pct.toFixed(0) : pct >= 1 ? pct.toFixed(1) : pct >= 0.01 ? pct.toFixed(2) : pct.toPrecision(1);
  return p > 0.5 ? `${pc}%` : `about 1 in ${Math.round(1 / p).toLocaleString("en-US")} (${pc}%)`;
}
export const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
export const pct = (x) => `${Math.round(x * 100)}%`;
/** "A", "A and B", "A, B and C". */
export const list = (a) => (a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
