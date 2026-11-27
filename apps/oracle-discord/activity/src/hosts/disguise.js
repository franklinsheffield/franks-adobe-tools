// The running gimmick (Frank, 2026-11-27): every host is secretly the same person, hiding it badly. Each House keeps
// its own voice and look; this layer adds the slips. Players collect clues across all five Houses in the Dossier:
//   ring-<host>   the same crescent ring on every pair of hands (tap it)
//   left-<host>   another host's costume piece left behind in the wrong House (tap it in the scene)
//   slip-<host>   a host greets you with another host's catchphrase, then corrects themselves
//   nevermet      after visiting all five Houses: "we've never met"
//   quickchange   stare a host down (poke the eye 7 times in a row): a quick change goes wrong
// Clues fill an Atbash-coded note and raise Fregoli's Mask (trophies.js). Progress: prog.alias = { clues, seen, greets }.
// Every line carries a real fact. Leopoldo Fregoli (1867-1936) was a real quick-change artist, and the Fregoli
// delusion (the belief that different people are one person in disguise) was named after him in 1927.

export const HOST_IDS = ["oracle", "alchemist", "observatory", "parlour", "scriptorium"];
// \u2060 (word joiner, invisible) inside "Oracle" keeps each House's rename() from turning her name into its own host's.
const NAME = { oracle: "the Ora\u2060cle", alchemist: "Magister Vell", observatory: "Keeper Altair", parlour: "Madame Rook", scriptorium: "Archivist Wren" };
const HOUSE = { oracle: "the Ora\u2060cle Chamber", alchemist: "the Alchemist's House", observatory: "the Observatory", parlour: "the Séance Parlour", scriptorium: "the Scriptorium" };

/** What each House has left lying around that belongs to someone else. owner = whose it really is. */
export const LEFT = {
  oracle: { e: "🪶", what: "a scribe's quill", owner: "scriptorium", say: "A quill? Scribes cut them from goose flight feathers. Not mine. I've never held a pen. Or a goose." },
  alchemist: { e: "🧤", what: "a pair of long opera gloves", owner: "parlour", say: "Opera gloves? Lab gloves are nitrile now, which spares latex allergies. These are... somebody's. Not a medium's. Nobody's." },
  observatory: { e: "🥽", what: "chemistry goggles", owner: "alchemist", say: "Goggles? Never look at the Sun through anything but a certified solar filter. These aren't mine. I don't do chemistry." },
  parlour: { e: "🔦", what: "a red torch", owner: "observatory", say: "A red torch, darling? Astronomers use red light because it spares night vision. I have never been an astronomer. Never." },
  scriptorium: { e: "🔮", what: "a crystal ball", owner: "oracle", say: "A crystal ball? John Dee scried with an obsidian mirror, now in the British Museum. This isn't mine. I read, I don't scry." },
};
/** Tapping the ring: each host insists it is theirs alone. */
export const RING = {
  oracle: "My ring? A crescent, for the Moon. The Moon only ever shows us one face. Like me. One face. Mine.",
  alchemist: "The ring? Silver. Silver tarnishes black from sulphur in the air. It is not the same ring as anyone's. Why would you ask?",
  observatory: "A crescent? Venus has phases too. Galileo saw them in 1610. It's an astronomer's ring. Only astronomers have it.",
  parlour: "This ring, darling? Mediums smuggled in rings and called them 'apports' from the spirits. Mine is my own. Only mine.",
  scriptorium: "A signet? Scribes pressed seals into wax to prove who wrote a letter. This one proves I'm me. Only me. Obviously.",
};
/** The greeting slip: another host's catchphrase, then a correction. */
export const SLIP = {
  oracle: { from: "parlour", say: "Welcome, darling— seeker. Welcome, seeker. The Pythia at Delphi spoke with one voice. So do I. Only one. Mine." },
  alchemist: { from: "observatory", say: "Give your eyes 20 minutes in the dark— no. Goggles on! Dark adaptation really takes about 20 minutes. Someone told me. Someone else." },
  observatory: { from: "scriptorium", say: "Every mark means something— every star. Every star means something. Mostly hydrogen. That's an astronomer's line. Mine." },
  parlour: { from: "alchemist", say: "Goggles on, gloves on— ah. Gloves. Henry Slade hid chalk under a fingernail to fake spirit slates. Not my fingernail." },
  scriptorium: { from: "oracle", say: "The cards have spoken— the ink. The ink has spoken. Tarot began as a card game in 15th-century Italy. I read that. In a book. As a scribe." },
};
/** After visiting all five Houses. */
export const NEVERMET = {
  oracle: "Five Houses, five hosts, and you think we look alike? The Fregoli delusion is a real diagnosis, named in 1927. Just saying.",
  alchemist: "We've never met. Never. Your brain reads faces in a spot called the fusiform face area. Yours must be tired.",
  observatory: "We've never met, traveller. Different person. Different telescope. Sunlight is 8 minutes old when it lands. My memory is fresher.",
  parlour: "Never met you, darling. Mediums 'cold read' strangers to seem to know them. I genuinely don't know you. At all. Ever.",
  scriptorium: "We've never met. I'd have written it down. Medieval scribes signed their colophons, and no other host's name is in mine.",
};
export const QUICK = {
  oracle: "Stop staring! I'm just... adjusting the hood. Arturo Brachetti changes costume in seconds on stage. I'm slower. And not changing.",
  alchemist: "Don't look! Stage quick changes rely on snaps and tear-away seams. I'm just... rinsing a beaker. In a cape.",
  observatory: "Eyes on the sky, not me! Fregoli played every role in his own shows, changing in seconds. I play one role. This one.",
  parlour: "Stop that, darling! A quick change is a magician's trick, not a medium's. I wasn't wearing goggles a second ago.",
  scriptorium: "Don't stare! Fregoli changed costumes in seconds behind a screen. I'm only turning a page. In a different hat.",
};
export const PAYOFF = "Fine. FINE. It's me. It was always me, all five of us. Fregoli played dozens of roles in one show; I only manage five. Tell no one.";

const HINT = {
  ring: (h) => `What does ${NAME[h]} wear on one finger? Ask about it.`,
  left: (h) => `Something in ${HOUSE[h]} doesn't belong to ${NAME[h]}.`,
  slip: (h) => `Listen closely to ${NAME[h]}'s welcome. More than once.`,
};
/** All 17 clues, in Dossier order. */
export const CLUES = [
  ...HOST_IDS.map((h) => ({ id: "ring-" + h, e: "💍", name: `${NAME[h]}'s ring`, hint: HINT.ring(h), host: h })),
  ...HOST_IDS.map((h) => ({ id: "left-" + h, e: LEFT[h].e, name: `${LEFT[h].what[0].toUpperCase() + LEFT[h].what.slice(1)} in ${HOUSE[h]}`, hint: HINT.left(h), host: h })),
  ...HOST_IDS.map((h) => ({ id: "slip-" + h, e: "🗣️", name: `${NAME[h]} slipped into ${NAME[SLIP[h].from]}'s line`, hint: HINT.slip(h), host: h })),
  { id: "nevermet", e: "🤝", name: "\"We've never met\"", hint: "Visit every House. See who claims not to know you." },
  { id: "quickchange", e: "🎭", name: "A quick change gone wrong", hint: "Stare a host straight in the eye. Keep staring." },
];
export const CLUE_PAY = 15;
export const SLIP_CHANCE = 0.35;

/** The coded note: Atbash (A<->Z, B<->Y), an old Hebrew cipher. Clues reveal it letter by letter. */
export const NOTE = "ONE FACE FIVE HATS";
export const atbash = (s) => s.replace(/[A-Z]/g, (c) => String.fromCharCode(155 - c.charCodeAt(0)));
/** The note as the player sees it: plain letters for the share of clues found, cipher for the rest. */
export function noteShown(n, total = CLUES.length) {
  const letters = [...NOTE].map((c, i) => [c, i]).filter(([c]) => /[A-Z]/.test(c)), k = Math.floor((letters.length * n) / total);
  const open = new Set(letters.slice(0, k).map(([, i]) => i));
  return [...NOTE].map((c, i) => (/[A-Z]/.test(c) && !open.has(i) ? atbash(c) : c)).join("");
}

export function aliasOf(p) {
  const a = (p.alias = p.alias && typeof p.alias === "object" ? p.alias : {});
  a.clues = Array.isArray(a.clues) ? a.clues : []; a.seen = Array.isArray(a.seen) ? a.seen : []; a.greets = a.greets && typeof a.greets === "object" ? a.greets : {};
  return a;
}
export const clueCount = (p) => aliasOf(p).clues.filter((id) => CLUES.some((c) => c.id === id)).length;
export const hasClue = (p, id) => aliasOf(p).clues.includes(id);

/** Record a clue. Returns null if unknown or already found, else { clue, n, all }. Pays CLUE_PAY Essence. */
export function findClue(p, id) {
  const c = CLUES.find((x) => x.id === id), a = aliasOf(p); if (!c || a.clues.includes(id)) return null;
  a.clues.push(id); p.essence = (p.essence || 0) + CLUE_PAY; const n = clueCount(p);
  return { clue: c, n, all: n === CLUES.length };
}

/** The engine's events, as the Houses' secrets see them. Returns { clue, n, all, line } or null. */
export function clueEvent(kind, data, { p, host, rand = Math.random }) {
  const h = host && HOST_IDS.includes(host.id) ? host.id : "oracle", a = aliasOf(p);
  const hit = (id, line) => { const r = findClue(p, id); return r ? { ...r, line } : null; };
  if (kind === "home") {
    if (!a.seen.includes(h)) a.seen.push(h);
    a.greets[h] = (a.greets[h] || 0) + 1;
    if (a.seen.length >= HOST_IDS.length && !hasClue(p, "nevermet")) return hit("nevermet", NEVERMET[h]);
    if (a.seen.length >= 2 && !hasClue(p, "slip-" + h) && (a.greets[h] >= 3 || rand() < SLIP_CHANCE)) return hit("slip-" + h, SLIP[h].say);
    return null;
  }
  if (kind === "tap" && data && data.tap === "ring") return hit("ring-" + h, RING[h]);
  if (kind === "tap" && data && data.tap === "leftbehind") return hit("left-" + h, LEFT[h].say);
  if (kind === "poke" && data && data.zone === "eye" && data.count === 7) return hit("quickchange", QUICK[h]);
  return null;
}

/** The crescent ring, drawn on the left hand's ring finger (finger 3 runs from 137,302 to 140,264). */
export const RING_SVG = `<g class="dg-ring" data-tap="ring"><title>A silver ring with a crescent moon</title><ellipse cx="137.4" cy="291" rx="6.4" ry="2.8" fill="none" stroke="#1b1530" stroke-width="4.4"/><ellipse cx="137.4" cy="291" rx="6.4" ry="2.8" fill="none" stroke="#e6eaf2" stroke-width="2.2"/><circle cx="137.4" cy="287" r="4" fill="#1b1530"/><path d="M135.2 284.6 a3.3 3.3 0 1 0 5.4 3.2 a2.6 2.6 0 1 1 -5.4 -3.2Z" fill="#fff6c8"/>`;
export function addRing(svg) {
  const f = svg && svg.querySelector(".o-handL .o-f3"); if (!f || f.querySelector(".dg-ring")) return;
  f.insertAdjacentHTML("beforeend", RING_SVG);
}
/** The stray costume piece in this House's scene. */
export const leftBehindHtml = (hostId) => { const L = LEFT[hostId] || LEFT.oracle; return `<button type="button" class="dg-left mb-hot" data-tap="leftbehind" title="${L.what}" aria-label="${L.what}">${L.e}</button>`; };

/** The Dossier: clues found and riddles for the rest, plus the coded note. */
export function dossierHtml(p, esc) {
  const n = clueCount(p), all = n === CLUES.length;
  return `<div class="note box-note">🎭 The Dossier: ${n} of ${CLUES.length} clues. Each pays 💎 ${CLUE_PAY}. The hosts insist they are five different people.</div>
  <div class="dg-note"><b>A note found under a hat:</b> <code>${esc(noteShown(n))}</code><small>${all ? "Decoded. They can't deny it now." : "Atbash cipher: A↔Z, B↔Y, C↔X. Every clue decodes a little more."}</small></div>
  <div class="sec-grid">${CLUES.map((c) => { const got = hasClue(p, c.id);
    return `<div class="sec-card${got ? " got" : ""}"><span class="sec-e" aria-hidden="true">${got ? c.e : "❔"}</span><b>${got ? esc(c.name) : "Not found yet"}</b><small>${esc(c.hint)}</small></div>`; }).join("")}</div>
  <div class="choices"><button class="c" type="button" id="dg-back">✦ Back</button></div>`;
}

export const DISGUISE_CSS = `.dg-ring{cursor:pointer;pointer-events:auto}.dg-ring ellipse{filter:drop-shadow(0 0 1.5px #fff)}
.scene .dg-left{position:absolute;left:3%;bottom:14%;z-index:2;pointer-events:auto;cursor:pointer;background:none;border:0;padding:4px;font-size:clamp(16px,3.4vw,24px);opacity:.8;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6));transform:rotate(-14deg);animation:dg-wob 6s ease-in-out infinite}
.scene .dg-left:hover,.scene .dg-left:focus-visible{opacity:1;outline:1px solid var(--house-accent,#E2B04A);border-radius:8px}
@keyframes dg-wob{0%,90%,100%{transform:rotate(-14deg)}94%{transform:rotate(-4deg)}97%{transform:rotate(-20deg)}}
body.dg-quick #teller svg{animation:dg-qc .9s steps(5) 1}
@keyframes dg-qc{0%{filter:hue-rotate(0)}20%{filter:hue-rotate(70deg) brightness(1.3)}40%{filter:hue-rotate(150deg)}60%{filter:hue-rotate(220deg) brightness(1.3)}80%{filter:hue-rotate(300deg)}100%{filter:none}}
.dg-note{margin:8px 0;padding:10px;border:1px solid var(--house-accent,#E2B04A);border-radius:12px;background:rgba(0,0,0,.3);display:flex;flex-direction:column;gap:4px}
.dg-note code{font-size:1.15em;letter-spacing:.18em;color:var(--house-accent,#E2B04A)}.dg-note small{opacity:.75}
@media (prefers-reduced-motion: reduce){.scene .dg-left,body.dg-quick #teller svg{animation:none}}`;
