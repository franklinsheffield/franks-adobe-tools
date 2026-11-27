// Word filter for typed party answers (Possession first; any free-text round can reuse it). The Chamber runs on a public
// Discord server, so anything a player types that other people will see goes through check() first. It refuses
// slurs, sexual words, strong swearing, links, invites and @mentions, and catches the usual dodges (leetspeak, s p a c e d
// letters, stretched letters, plurals). Mild words a ghost story needs (hell, damn, blood, dead, kill) are allowed.
// The table host can still strike anything that slips through (party/story.js strike()).
// The word lists are stored in ROT13 so the source file doesn't read like a list of insults.

const rot13 = (s) => s.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));
const WORDS = new Set(("shpx shpxre shpxvat shx zbgureshpxre fuvg fuvggl ohyyfuvg phag pbpx pbpxf qvpx qvpxf qvpxurnq chffl chffvrf ovgpu ovgpurf " +
  "juber juberf fyhg fyhgf onfgneq nffubyr nefrubyr gjng jnax jnaxre cravf intvan obbo obbof gvgf gvggl cbea cbeab frk frkl frkhny " +
  "ahqr ahqrf ubeal encr encrq encvfg encrf zbyrfg crqb crqbcuvyr cnrqb anmv anmvf uvgyre xlf fhvpvqr phz wvmm qvyqb nany oybjwbo unaqwbo " +
  "betnfz znfgheongr avttre avttref avttn avttnf arteb snttbg snttbgf snt sntf qlxr genaal genaavrf ergneq ergneqrq fcvp fcvpf puvax " +
  "puvaxf tbbx tbbxf xvxr xvxrf jrgonpx ornare pbba pbbaf cnxv cnxvf enturnq gbjryurnq").split(" ").map(rot13));
/** Stems refused anywhere, even inside a longer word or with the spaces taken out ("f.u.c.k", "xfuckx"). */
const STEMS = "shpx phag avtt sntt crqbcuvy".split(" ").map(rot13);
const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", 9: "g", "@": "a", $: "s", "!": "i", "|": "i", "+": "t" };
const SUFFIX = /(ing|ers|er|ed|es|s)$/;

export const MAX_LEN = 60;

/** Lower case, accents off, leetspeak turned back into letters. */
export function normalise(text) {
  return String(text ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[0134578@$!|+9]/g, (c) => LEET[c] || c);
}
const shapes = (t) => [t, t.replace(/(.)\1{2,}/g, "$1"), t.replace(/(.)\1{2,}/g, "$1$1")];
const base = (s) => { const b = s.replace(SUFFIX, ""); return b.length >= 5 ? b : s; }; // "fuckers" -> "fucker", but "spices" stays "spices"
const bad = (t) => shapes(t).some((s) => WORDS.has(s) || WORDS.has(base(s)));

/** Tidy what someone typed: one line, single spaces, no trailing full stop, at most MAX_LEN characters. */
export function tidy(text) {
  return String(text ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().replace(/[.,;:]+$/, "").slice(0, MAX_LEN).trim();
}

/** Is this fit to show the room? -> { ok: true, text } | { ok: false, why: "empty" | "link" | "mention" | "word" } */
export function check(raw) {
  const text = tidy(raw);
  if (!/[\p{L}\p{N}]/u.test(text)) return { ok: false, why: "empty" };
  if (/https?:|www\.|discord\.(gg|com)|\.(com|net|org|gg|io|ly|xyz)\b/i.test(text)) return { ok: false, why: "link" };
  if (/@|<#|<@/.test(text)) return { ok: false, why: "mention" };
  const n = normalise(text), words = n.split(/[^a-z]+/).filter(Boolean);
  // s p a c e d  letters: join runs of single letters back into one word
  const joined = [], run = []; for (const w of [...words, ""]) { if (w.length === 1) run.push(w); else { if (run.length > 1) joined.push(run.join("")); run.length = 0; if (w) joined.push(w); } }
  if ([...words, ...joined].some(bad)) return { ok: false, why: "word" };
  const squash = n.replace(/[^a-z]/g, "");
  if (shapes(squash).some((q) => STEMS.some((s) => q.includes(s)))) return { ok: false, why: "word" };
  return { ok: true, text };
}

/** What to tell the player when check() says no. */
export const WHY = {
  empty: "Type a few words first.",
  link: "No links here, please. Just words.",
  mention: "No @mentions in the story, please.",
  word: "The spirits won't say that one. Try other words.",
};
