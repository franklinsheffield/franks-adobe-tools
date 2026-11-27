// Pick-a-fib prompts for Fact or Fib: instead of typing, each player chooses their fib from a short menu of real,
// plausible wrong answers (other elements, plants, constellations, methods). No free text ever reaches the room.
// The menu is seeded by the prompt id, so the host and every player see the same one.

export const OPTIONS = 6;
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export function seeded(seed) { let s = hash(seed) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32); }
const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** A pick prompt. truth = the true answer (a string); pool = wrong answers to draw fibs from (the truth is removed).
 * extra fields (ev, ask text, fact…) are kept for the room's kit. */
export function pickPrompt({ id, truth, pool, ...extra }) {
  const wrong = [...new Set(pool.filter((x) => x && x !== truth))], r = seeded(id), options = shuffle(wrong, r).slice(0, OPTIONS);
  return {
    ...extra, id, truth, truthText: truth, options,
    parse: (t) => (t === truth || options.includes(t) ? t : null),
    show: (v) => v, near: () => false,
    house: (rand = Math.random) => shuffle(wrong, rand),
  };
}

/** Deal n items for a match, unseen ones first. */
export function dealPick(items, n, seen = {}, rand = Math.random, key = (x) => x.id) {
  const fresh = shuffle(items.filter((x) => !seen[key(x)]), rand), old = shuffle(items.filter((x) => seen[key(x)]), rand);
  return [...fresh, ...old].slice(0, n);
}
