import { GENERAL, BY_SYSTEM } from "./jokes.js";
// The Oracle answers: reads the tone of a reading and tells the member what the data shows and what it may mean,
// in her voice. House rule: she interprets, she does not instruct. No yes/no verdicts and no advice; she says how
// the reading leans, what may be concluded, and what it leaves open. Jokes (quip) are separate and untouched.
// No network and no AI: everything comes from the reading itself, so the answer always matches what was drawn.

export const plain = (s) => String(s || "").replace(/\*\*|__|\*|`/g, "").replace(/^>\s?/gm, "").replace(/\s*\n+\s*/g, " ").trim();
const sentences = (t) => (plain(t).match(/[^.!?…]+[.!?…]+["”’)]*|[^.!?…]+$/g) || []).map((s) => s.trim()).filter((s) => s.length > 2);

// Small word lists for the tone of a reading. Each hit counts once per word.
const GOOD = ["success", "succeed", "fortune", "favourable", "favorable", "auspicious", "growth", "grow", "prosper", "gain", "joy", "harmony",
  "open", "opening", "breakthrough", "supreme", "blessing", "abundance", "clear", "flourish", "rise", "rising", "victory", "creative",
  "strength", "progress", "advance", "reward", "peace", "union", "yes", "begin", "start", "ignition", "luck", "light", "bright", "fertile", "momentum"];
const BAD = ["danger", "obstruction", "obstacle", "wait", "waiting", "misfortune", "restrain", "restraint", "decline", "loss", "lose",
  "stagnation", "conflict", "careful", "caution", "difficult", "difficulty", "trouble", "retreat", "darkness", "dark", "delay", "not yet",
  "harm", "stuck", "blocked", "struggle", "patience", "patient", "limit", "danger", "storm", "burden", "pause", "hold back", "no rain"];

/** Tone of a reading, -3..3: positive means go, negative means wait. */
export function tone(text) {
  const t = " " + plain(text).toLowerCase() + " ";
  const hits = (list) => new Set(list.filter((w) => t.includes(" " + w) || t.includes(w + " "))).size;
  const s = hits(GOOD) - hits(BAD);
  return Math.max(-3, Math.min(3, Math.round(s / 2)));
}

const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (arr, seed) => arr[seed % arr.length];

/** How a reading leans, in words. Never a verdict: a description of the evidence. */
export const lean = (t) => (t >= 2 ? "leans toward openness and movement" : t === 1 ? "leans gently toward movement" : t === 0 ? "is evenly balanced, with no clear lean" : t === -1 ? "leans gently toward caution" : "leans toward caution and delay");

const YESNO = /^(should|shall|will|would|is|are|am|can|could|do|does|did|was|were|has|have|had|may|might|must)\b/i;

/** The first full sentence of the reading's own text (used when a reading carries no analysis). */
export function coreLine(text) {
  const line = (sentences(text)[0] || "").replace(/^[^:]{0,40}:\s*/, "");
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/**
 * The Oracle's reply to a question: how the reading leans, one thing that may be concluded, and one open question.
 * analysis is the reading's { data, patterns, conclusions, questions, method } (src/insight.js) when it has one.
 */
export function answer(question, text, name = "traveller", analysis = null) {
  const q = String(question || "").trim().replace(/\s+/g, " "), t = tone(text), seed = hash(q + text.length);
  const concl = analysis?.conclusions || [], open = analysis?.questions || [], pats = analysis?.patterns || [];
  const c = concl.length ? pick(q ? concl : concl.slice(0, 1), seed) : coreLine(text), ask = open.length ? pick(open, seed) : "";
  const tail = [pats[0] ? `The data: ${pats[0]}` : "", c, ask ? `It leaves this open: ${ask}` : ""].filter(Boolean).join(" ");
  if (!q) return { tone: t, line: tail ? `Here is what the reading shows, ${name}. ${tail}` : `Sit with it, ${name}. The meaning ripens slowly.` };
  const body = q.replace(/[?.!]+$/, "");
  const or = body.split(/\s+or\s+/i);
  if (or.length === 2 && YESNO.test(or[0])) {
    const a = or[0].replace(YESNO, "").replace(/^\s*(i|we|you|they|it|he|she)\s+/i, "").trim(), b = or[1].trim();
    const choice = t >= 0 ? a : b;
    return { tone: t, line: `Of the two? The choosing stays with you, ${name}. This reading ${lean(t)}, which sits nearer **${choice.charAt(0).toUpperCase() + choice.slice(1)}** than the other. ${tail}` };
  }
  if (/^when\b/i.test(body)) return { tone: t, line: `When? No reading keeps a calendar, ${name}. What this one shows is that it ${lean(t)}. ${tail}` };
  if (YESNO.test(body)) return { tone: t, line: `I read evidence, not verdicts, ${name}. This reading **${lean(t)}**. ${tail}` };
  return { tone: t, line: `You asked, so here is what the reading supports: ${tail || "less than you hoped, which is also data."}` };
}

// Branded asides (jokes.js). A member hears every joke before any repeat: `heard` is their list of joke ids.
export function quip(key, name, heard = []) {
  const ids = [...(BY_SYSTEM[key] || []).map((_, i) => key + i), ...GENERAL.map((_, i) => "g" + i)];
  let fresh = ids.filter((id) => !heard.includes(id));
  if (!fresh.length) { for (const id of ids) { const i = heard.indexOf(id); if (i >= 0) heard.splice(i, 1); } fresh = ids; }
  // Favour this system's own jokes a little, then anything new.
  const own = fresh.filter((id) => id.startsWith(key)), pool = own.length && Math.random() < 0.35 ? own : fresh;
  const id = pool[Math.floor(Math.random() * pool.length)];
  heard.push(id);
  const text = id.startsWith("g") && !id.startsWith(key) && /^g\d+$/.test(id) ? GENERAL[+id.slice(1)] : BY_SYSTEM[key][+id.slice(key.length)];
  return text.replace(/\{name\}/g, name);
}

const DEEPER_LEADS = ["Look closer.", "There's more.", "Listen.", "Deeper still…", "Now this part.", "Mark this.", "Hmm… and here."];
const long = (txt, max = 300) => { if (txt.length <= max) return [txt]; const res = []; let cur = ""; for (const part of txt.split(" · ")) { if (cur && (cur + " · " + part).length > max) { res.push(cur); cur = ""; } cur = cur ? cur + " · " + part : part; } if (cur) res.push(cur); return res; };
/**
 * Everything the Oracle can say when asked to go deeper, as short pages. The evidence comes first (the member's own
 * Codex history in `lore`, then the reading's data, patterns, possible conclusions, open questions and method),
 * then the written reading field by field.
 */
export function deeperPages(r, question, lore = []) {
  const out = []; let n = 0;
  const chunk = (txt, max = 300) => { const res = []; let cur = ""; for (const s of sentences(txt)) { if ((cur + " " + s).length > max && cur) { res.push(cur); cur = ""; } cur = cur ? cur + " " + s : s; } if (cur) res.push(cur); return res; };
  lore.forEach((l) => out.push(l)); // personal examinations first, one per "Go deeper" (out.exams)
  const A = r.analysis;
  if (A) {
    (A.data || []).forEach((d, i) => long(d).forEach((c, j) => out.push(!i && !j ? `The data first. ${c}` : c)));
    (A.patterns || []).forEach((d, i) => out.push(i ? d : `Patterns in it. ${d}`));
    (A.conclusions || []).forEach((d, i) => out.push(i ? d : `What may be concluded. ${d}`));
    (A.questions || []).forEach((d, i) => out.push(i ? d : `What it leaves open. ${d}`));
    (A.method || []).forEach((d, i) => out.push(i ? d : `How this was produced. ${d}`));
  }
  for (const e of r.embeds) {
    if (A && /Reading the data/.test(e.title || "")) continue;
    const desc = plain(e.description).replace(/^Question:\s*[^.?!]*[.?!]?\s*/i, "");
    if (desc && !(question && desc.includes(question))) chunk(desc).forEach((c) => out.push(`${DEEPER_LEADS[n++ % DEEPER_LEADS.length]} ${c}`));
    for (const f of e.fields || []) {
      const name = plain(f.name).replace(/^[^\p{L}\p{N}]+/u, "").trim(), parts = chunk(f.value);
      if (!parts.length) continue;
      out.push(`${DEEPER_LEADS[n++ % DEEPER_LEADS.length]} ${name}: ${parts[0]}`);
      parts.slice(1).forEach((c) => out.push(c));
    }
  }
  out.exams = lore.length;
  return out;
}
