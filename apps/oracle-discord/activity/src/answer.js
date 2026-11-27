import { GENERAL, BY_SYSTEM } from "./jokes.js";
// The Oracle answers: reads the tone of a reading, gives a straight answer to the member's question in her voice,
// adds a branded Science is Magic aside, and keeps a store of deeper material for "Go deeper".
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

const VERDICT = {
  3: ["Yes. Loudly, and with sparkles.", "Yes. The ball is practically waving at you.", "A clear yes. I checked twice, then once more for fun."],
  2: ["Yes.", "Yes, and the timing favours you.", "The answer leans hard towards yes."],
  1: ["Yes, but gently. Don't sprint.", "A quiet yes, with conditions.", "Mostly yes. Read the fine print below."],
  0: ["Neither yes nor no. It depends on what you do next.", "The glass shows both roads. Your choice tips it.", "Undecided, which means it's still yours to decide."],
  "-1": ["Not yet.", "Wait a little. The door is not locked, just sticky.", "Hold off. Ask me again after some small steps."],
  "-2": ["No, not like this.", "Not now. The conditions aren't ripe.", "The answer leans towards no, for the moment."],
  "-3": ["No. Firmly. Put the kettle on instead.", "A clear no. The ball went foggy out of politeness.", "No. Even my one eye can see that."],
};
const WHEN = {
  pos: ["Sooner than you think. Watch the next few weeks.", "Soon. The pieces are already moving.", "When you stop waiting and make the first move."],
  mid: ["When the small things are in place. Not before.", "After one more step you've been putting off.", "Later than you want, earlier than you fear."],
  neg: ["Not soon. Let this season finish first.", "After a pause. Rest, then return to it.", "When the current obstacle clears, and it will."],
};

const YESNO = /^(should|shall|will|would|is|are|am|can|could|do|does|did|was|were|has|have|had|may|might|must)\b/i;

/** Pick the most useful sentence of the reading: advice (a sentence that tells you to do something) first, else the first. */
export function coreLine(text) {
  const all = sentences(text);
  const advice = all.find((s) => /^(work|let|do|don'?t|be|keep|trust|test|try|take|give|stay|wait|move|speak|listen|rest|refine|act|begin|start|choose|use|go|watch|notice|focus|build|hold|release|seek|follow)\b/i.test(s.replace(/^[^:]*:\s*/, "")));
  const line = (advice || all[0] || "").replace(/^[^:]{0,40}:\s*/, "");
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** The Oracle's straight answer to a question, from the reading's own text. */
export function answer(question, text, name = "traveller") {
  const q = String(question || "").trim().replace(/\s+/g, " "), t = tone(text), seed = hash(q + text.length);
  const core = coreLine(text);
  if (!q) return { tone: t, line: core ? `Here is what matters most, ${name}: ${core}` : `Sit with it, ${name}. The meaning ripens slowly.` };
  const body = q.replace(/[?.!]+$/, "");
  const or = body.split(/\s+or\s+/i);
  if (or.length === 2 && YESNO.test(or[0])) {
    const a = or[0].replace(YESNO, "").replace(/^\s*(i|we|you|they|it|he|she)\s+/i, "").trim(), b = or[1].trim();
    const choice = t >= 0 ? a : b;
    return { tone: t, line: `Of the two? **${choice.charAt(0).toUpperCase() + choice.slice(1)}**. ${t >= 0 ? "The reading favours the bolder road." : "The reading favours the steadier road."} ${core}` };
  }
  if (/^when\b/i.test(body)) {
    const w = pick(t > 0 ? WHEN.pos : t < 0 ? WHEN.neg : WHEN.mid, seed);
    return { tone: t, line: `When? ${w} ${core}` };
  }
  if (YESNO.test(body)) return { tone: t, line: `My answer: **${pick(VERDICT[t], seed)}** ${core}` };
  return { tone: t, line: `You asked, so here it is, straight from the glass: ${core || "look at what you already know and act on the smallest true part of it."}` };
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
/** Everything the Oracle can say when asked to go deeper, as short pages, one part of the reading at a time. */
export function deeperPages(r, question) {
  const out = []; let n = 0;
  const chunk = (txt, max = 300) => { const res = []; let cur = ""; for (const s of sentences(txt)) { if ((cur + " " + s).length > max && cur) { res.push(cur); cur = ""; } cur = cur ? cur + " " + s : s; } if (cur) res.push(cur); return res; };
  for (const e of r.embeds) {
    const desc = plain(e.description).replace(/^Question:\s*[^.?!]*[.?!]?\s*/i, "");
    if (desc && !(question && desc.includes(question))) chunk(desc).forEach((c) => out.push(`${DEEPER_LEADS[n++ % DEEPER_LEADS.length]} ${c}`));
    for (const f of e.fields || []) {
      const name = plain(f.name).replace(/^[^\p{L}\p{N}]+/u, "").trim(), parts = chunk(f.value);
      if (!parts.length) continue;
      out.push(`${DEEPER_LEADS[n++ % DEEPER_LEADS.length]} ${name}: ${parts[0]}`);
      parts.slice(1).forEach((c) => out.push(c));
    }
  }
  return out;
}
