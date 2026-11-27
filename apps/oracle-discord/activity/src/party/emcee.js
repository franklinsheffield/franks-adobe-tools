// The party-round emcee: every House hosts Fact or Fib (party/factfib-ui.js) in its own voice.
import { host } from "../hosts/index.js";

/* ---------- The emcee: each House hosts the round in its own voice. No facts in these lines: the facts come from
   the cards. {name} = a player, {n} = a number, {answer} = the truth. ---------- */
const L = (open, write, vote, truth, nobody, fooled, final, win) => ({ open, write, vote, truth, nobody, fooled, final, win });
export const EMCEE = {
  oracle: L(
    ["Gather round the crystal, seekers. I'll show you something true; you whisper me something false.", "Fact or Fib! I know the truth. You know how to lie. Let's see who wins."],
    ["Give me a fib that sounds true. The best lies wear a convincing hat.", "Shh. Choose your fib. I won't peek. Much."],
    ["One of these is real. The rest are your friends being sneaky.", "The crystal holds the truth. Which one is it?"],
    ["The truth: {answer}. The crystal never lies. Your friends, however…", "There it is: {answer}. Unmasked."],
    ["Nobody found the truth. I'm proud of you all as liars and worried about you as historians.", "Not one of you saw it. The fibs win this round."],
    ["{name} fooled {n}! A natural. I'd hire you, but you'd lie about your references.", "{name} tricked {n} of you. Very mysterious. Very rude."],
    ["Final round! Double points. Lie like your crown depends on it.", "The last card, and every point counts twice. Make it beautiful."],
    ["{name} wins Fact or Fib! The greatest liar and the sharpest eye at this table.", "The crystal crowns {name}. Truth-finder, fib-weaver, champion."]),
  alchemist: L(
    ["Into the crucible, colleagues. A true sample, its label scraped off. Bring me your most plausible impurities.", "Fact or Fib, my apprentices. Truth is the gold; your fibs are the lead."],
    ["Mix me a false answer. Precise. Confident. Utterly wrong.", "Write your fib. A good forgery needs the right weight in the hand."],
    ["Assay the samples. Only one is pure.", "Test each one. Only one will ring true when struck."],
    ["The pure sample: {answer}. Everything else was base metal.", "{answer}. The crucible has spoken, and it smells faintly of sulphur."],
    ["Nobody found it! A perfect batch of lead. I'm almost impressed.", "Not one assay right. Back to the bench, all of you."],
    ["{name} fooled {n}! A forger of rare talent. Keep away from my notes.", "{name}'s fib passed for gold {n} times. Shameless. Excellent."],
    ["The final transmutation: double points. Turn your lies to gold.", "Last round. Twice the points, twice the heat."],
    ["{name} wins! The Great Work belongs to you, at least until the next round.", "{name} takes the crucible. Gold, at last."]),
  observatory: L(
    ["Dim the lamps, observers. One true star among the false ones. Let's find it.", "Fact or Fib, from the dome. I'll show you the truth with a piece missing; you plot a false one."],
    ["Chart a false answer. Make it look like it belongs on the map.", "Write your fib. A good false star sits just where a real one might."],
    ["Take your sightings. Only one point on this chart is real.", "Sweep the sky. One of these is a true star."],
    ["The true position: {answer}. Everything else was a smudge on the lens.", "There: {answer}. Fixed and catalogued."],
    ["No one found it. A whole sky of decoys tonight.", "Clouds over the truth this round. Nobody sighted it."],
    ["{name} fooled {n}! A decoy so bright it pulled the whole telescope off course.", "{name} led {n} of you astray. A fine false star."],
    ["The final sighting, double points. Steady hands on the eyepiece.", "Last plate of the night. Everything counts twice."],
    ["{name} wins the night's watch! Sharpest eye in the dome.", "{name} takes the Fact or Fib crown. The log will remember."]),
  parlour: L(
    ["Take your seats, dear sitters. A true case, a hidden answer, and a table full of liars. My favourite kind of evening.", "Fact or Fib in the Parlour. Tonight, you're all mediums. Let's see who's honest."],
    ["Give me a fib, darling. Say it like you believe it. Every good medium does.", "Your fib, please. Confidence is half of any trick."],
    ["One of these is the truth. The rest are table-rapping. Choose.", "Lights low. Which one is real, and which is a toe under the table?"],
    ["The truth: {answer}. Exposed, like a cheesecloth ghost.", "{answer}. The committee confirms it. The rest were humbug."],
    ["Not one of you found it! The whole séance was a sham. I'm so proud.", "Nobody saw through it. Fooled, every one of you. Delicious."],
    ["{name} fooled {n}! Darling, the music halls would have adored you.", "{name}'s fib took in {n} sitters. A born showman."],
    ["The final act, double points. Star Turn, everyone.", "Last trick of the night. Every point counts twice."],
    ["{name} wins! Top of the bill, and the best liar in the house.", "{name} takes the night. Bow, darling, they're applauding."]),
  scriptorium: L(
    ["Settle at your desks, scribes. A true entry from the record, one word scraped off. Supply a forgery.", "Fact or Fib in the Scriptorium. I'll show you the record; you forge the margin."],
    ["Ink me a false answer. Neat hand, no blots, no tells.", "Write your fib. A good forgery copies the style, not just the words."],
    ["Compare the copies. Only one matches the original.", "Read each one closely. Only one is genuine."],
    ["The original reads {answer}. The rest go in the forgeries drawer.", "{answer}, in the true hand. Well read, those who found it."],
    ["No one found the original. A drawer full of forgeries today.", "Every copy was false, and every one of you believed one. Remarkable."],
    ["{name} fooled {n}! A forger worthy of the archive. I'm keeping an eye on you.", "{name}'s copy fooled {n} readers. Steady hand."],
    ["The final page, double points. Your best hand, please.", "Last entry. It counts twice in the ledger."],
    ["{name} wins! Master of the true record, and of the false one.", "{name} takes the ledger. Sign it in your best hand."]),
};
/** An emcee line for the current House (falls back to the Oracle's). */
export function emcee(kind, vars = {}, rand = Math.random) {
  const E = EMCEE[(host() || {}).id] || EMCEE.oracle, pool = E[kind] || EMCEE.oracle[kind] || [""];
  return pool[Math.floor(rand() * pool.length)].replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}
