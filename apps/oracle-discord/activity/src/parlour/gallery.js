// The Rogues' Gallery: 20 pairs, 40 portraits. Each claimant hangs beside the person who exposed them. A claimant's
// portrait lights when you solve their case in the Case Files; the exposer's lights with the same case, or when you
// name them as a ghost in the Séance. A finished pair pays 💎 50 once; the full gallery pays 🗝️ 10 once.
// prog.houses.parlour.gallery = { paid: [pairIds], all: bool }.
import { room as cfRoom } from "../casefiles/logic.js";
import { room as seanceRoom } from "../seance/logic.js";

export const PAIR_PAY = 50, ALL_PAY = 10;
const P = (id, cases, a, b, ghosts = []) => ({ id, cases, ghosts, a, b });
export const PAIRS = [
  P("fox", ["fox"], { name: "The Fox sisters", year: 1848, line: "Raps in Hydesville started modern Spiritualism." }, { name: "Margaret Fox herself", year: 1888, line: "She cracked her toe joint on a New York stage to show how." }),
  P("slade", ["slade"], { name: "Henry Slade", year: 1876, line: "Slates that wrote themselves under the table." }, { name: "Ray Lankester", year: 1876, line: "Snatched the slate before the 'spirit' began. The message was already there." }, ["lankester"]),
  P("davenport", ["davenport"], { name: "The Davenport brothers", year: 1864, line: "Tied in a cabinet while the instruments played." }, { name: "John Nevil Maskelyne", year: 1865, line: "Repeated their whole cabinet act on stage, as a trick." }, ["maskelyne"]),
  P("mumler", ["mumler"], { name: "William Mumler", year: 1862, line: "Sold 'spirit photographs' of the dead beside the living." }, { name: "P. T. Barnum", year: 1869, line: "Testified at Mumler's fraud trial that such pictures were easy to fake." }, ["barnum"]),
  P("hope", ["hope"], { name: "William Hope", year: 1922, line: "Spirit 'extras' on photographic plates." }, { name: "Harry Price", year: 1922, line: "Used secretly X-ray-marked plates; Hope's plate had been switched." }, ["price"]),
  P("margery", ["margery"], { name: "Mina 'Margery' Crandon", year: 1924, line: "A bell box that rang in the dark." }, { name: "Harry Houdini", year: 1924, line: "Felt her ankle move each time the bell rang, and built a box to hold her." }, ["houdini"]),
  P("popoff", ["popoff"], { name: "Peter Popoff", year: 1986, line: "A faith healer who 'knew' strangers' names and illnesses." }, { name: "James Randi", year: 1986, line: "His team recorded the radio messages fed into Popoff's earpiece." }),
  P("palladino", ["palladino"], { name: "Eusapia Palladino", year: 1895, line: "Floating tables in the dark circle." }, { name: "Richard Hodgson", year: 1895, line: "Saw her free one hand while two sitters thought they held both." }, ["hodgson"]),
  P("table", ["table"], { name: "The table-turners", year: 1853, line: "Tables that tipped and spun for spirits." }, { name: "Michael Faraday", year: 1853, line: "His indicator showed the sitters were pushing, without knowing it." }, ["faraday"]),
  P("cook", ["cook"], { name: "Florence Cook", year: 1880, line: "A 'materialised' spirit called Katie King." }, { name: "Sir George Sitwell", year: 1880, line: "Grabbed the spirit and found the medium in her underclothes." }),
  P("cottingley", ["cottingley"], { name: "Elsie Wright and Frances Griffiths", year: 1917, line: "Photographs of fairies at the bottom of the garden." }, { name: "Their own confession", year: 1983, line: "As old women they admitted the fairies were paper cut-outs." }),
  P("bailey", ["bailey"], { name: "Charles Bailey", year: 1910, line: "Live birds 'apported' from nowhere." }, { name: "A Grenoble bird dealer", year: 1910, line: "Recognised the birds as ones he had sold to Bailey." }),
  P("hans", ["hans"], { name: "Clever Hans", year: 1904, line: "A horse that 'counted' by tapping a hoof." }, { name: "Oskar Pfungst", year: 1907, line: "Showed Hans read tiny unconscious cues from the people watching." }),
  P("turk", ["turk"], { name: "Von Kempelen's Turk", year: 1770, line: "A chess-playing machine that beat human players." }, { name: "Silas Weir Mitchell", year: 1857, line: "Published how a human chess player hid inside." }),
  P("nrays", ["nrays"], { name: "René Blondlot", year: 1903, line: "Announced 'N-rays' that only some could see." }, { name: "Robert Wood", year: 1904, line: "Quietly removed the prism; Blondlot still saw the rays." }),
  P("serios", ["serios"], { name: "Ted Serios", year: 1967, line: "'Thought photographs' pressed onto Polaroid film." }, { name: "Reynolds and Eisendrath", year: 1967, line: "Two photographers showed how a small tube, his 'gizmo', could do it." }),
  P("hydrick", ["hydrick"], { name: "James Hydrick", year: 1980, line: "Turned phone-book pages 'with his mind'." }, { name: "James Randi, again", year: 1981, line: "Surrounded the book with packing beads a breath would scatter." }),
  P("geller", ["geller"], { name: "Uri Geller", year: 1973, line: "Spoons that bent by 'psychic power'." }, { name: "Johnny Carson's show", year: 1973, line: "Props were kept away from him before airtime, on a magician's advice, and nothing happened." }),
  P("cocklane", ["cocklane"], { name: "The Cock Lane ghost", year: 1762, line: "Scratching 'Scratching Fanny' in a London house." }, { name: "Samuel Johnson's committee", year: 1762, line: "Investigated, heard nothing when the girl was watched, and called it a fraud." }),
  P("toft", ["toft"], { name: "Mary Toft", year: 1726, line: "Claimed to give birth to rabbits." }, { name: "Sir Richard Manningham", year: 1726, line: "Threatened surgery; she confessed." }),
];
const box = (p) => { p.houses = p.houses && typeof p.houses === "object" ? p.houses : {}; const h = (p.houses.parlour ||= {}); h.gallery ||= { paid: [], all: false }; h.gallery.paid ||= []; return h.gallery; };
const solved = (p, ids) => ids.some((id) => cfRoom(p).solved.includes(id));
const named = (p, ids) => { const s = Object.keys(seanceRoom(p).solved || {}); return ids.some((id) => s.some((k) => k.endsWith(":" + id))); };
/** Which side of a pair is lit: { a, b, done }. */
export function pairState(p, pair) { const a = solved(p, pair.cases), b = a || named(p, pair.ghosts); return { a, b, done: a && b }; }
export const portraitsLit = (p) => PAIRS.reduce((n, x) => { const s = pairState(p, x); return n + (s.a ? 1 : 0) + (s.b ? 1 : 0); }, 0);
export const pairsDone = (p) => PAIRS.filter((x) => pairState(p, x).done).length;
/** Pay any newly finished pairs, and the full gallery once. Returns { gems, keys, fresh: [pairIds] }. */
export function settleGallery(p) {
  const g = box(p), fresh = PAIRS.filter((x) => pairState(p, x).done && !g.paid.includes(x.id)).map((x) => x.id);
  g.paid.push(...fresh); const gems = fresh.length * PAIR_PAY; p.essence = (p.essence || 0) + gems;
  let keys = 0; if (!g.all && g.paid.length >= PAIRS.length) { g.all = true; keys = ALL_PAY; }
  return { gems, keys, fresh };
}
