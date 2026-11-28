// Fact guides for the rooms that had no guide of their own, built straight from each room's own (fact-checked) data,
// so nothing is copied and a fix in a room's data shows here too. Read by the Study hall (study.js).
import { SAMPLES, SPECTRA } from "./flametest/data.js";
import { MINERALS, CLASSES as MIN_CLASSES, TESTS as MIN_TESTS, LUSTRE } from "./minerals/data.js";
import { TYPES as SCRIPT_TYPES, SCRIPTS } from "./inscriptions/data.js";
import { OPS, RECIPES } from "./bench/data.js";
import { TIERS, JOBS } from "./commissions/data.js";
import { COLOURANTS, OXIDISERS, DONOR, TAILS, PATTERNS, SIZES, HISTORY as FW_HISTORY } from "./fireworks/data.js";
import { CHAINS, ROUTES, HISTORY as LG_HISTORY } from "./leadgold/data.js";
import { CLASSES as CASE_CLASSES, METHODS as CASE_METHODS, CASES, TOOLS as CASE_TOOLS } from "./casefiles/data.js";
import { TRICKS } from "./workshop/data.js";
import { BILLINGS, VENUES, CLIENTS } from "./bookings/bill.js";
import { EFFECTS as DS_EFFECTS, CONTROLS as DS_CONTROLS, METHODS as DS_METHODS } from "./darkseance/data.js";
import { FORCES, BARNUM, FORER, CODE, CODE_FACTS, BILLET_FACTS } from "./mentalist/data.js";
import { LANTERN_FACTS, PEPPER_FACTS, SHOW_FACTS } from "./phantasmagoria/data.js";
import { RIVALS as BC_RIVALS, LEVELS as BC_LEVELS } from "./blackchamber/data.js";
import { STEPS as IL_STEPS, PIGMENTS as IL_PIGMENTS, PAGES as IL_PAGES } from "./illuminator/data.js";
import { METHODS as CIPHERS, FORGERIES, INSCRIPTIONS as CD_INSCRIPTIONS } from "./cipherdesk/data.js";
import { PAIRS } from "./parlour/gallery.js";
import { MILESTONES } from "./parlour/finale.js";
import { TRUE_TALES } from "./possession/true.js";

const e = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const sec = (h, p) => ({ h, p: p.filter(Boolean) });
const LV = ["", "Level 1", "Level 2", "Level 3"];

const productName = (id) => (RECIPES.find((r) => r.id === id) || { name: id }).name;
const caseMethod = (id) => (CASE_METHODS.find((m) => m.id === id) || { name: id }).name;

/** room id -> [{ id, emoji, title, sections }] */
export const FACTS = {
  flametest: [{ id: "flames", emoji: "🔥", title: "Flame colours and spectra", sections: [
    sec("Why a flame changes colour", [
      "Heat lifts an atom's electrons to higher energy levels. When they drop back they give out light of exact wavelengths, different for every element. That is why each metal salt colours a flame its own way.",
      "A <b>spectroscope</b> spreads that light out so you see the separate bright lines. Bunsen and Kirchhoff built one in Heidelberg in 1859 to 1860.",
    ]),
    sec("The eight flames", SAMPLES.map((s) => `<b>${e(s.name)}</b> (${e(s.salt)}): ${e(s.colour)}${s.cobalt ? `; through cobalt glass, ${e(s.cobalt)}` : ""}. ${e(s.fact)} <i>${e(s.use)}</i>`)),
    sec("The spectroscope's discoveries", SPECTRA.map((s) => `<b>${e(s.name)}</b>, ${e(s.who)}, ${e(s.when)}: ${e(s.story)} <i>Clue: ${e(s.clue)}.</i>`)),
  ] }],

  minerals: [{ id: "rocks", emoji: "🪨", title: "Mineral field guide", sections: [
    sec("The tests", Object.values(MIN_TESTS).map((t) => `${t.emoji} <b>${e(t.name)}</b>: ${e(t.what)}.`)),
    sec("Lustre words", Object.values(LUSTRE).map((l) => e(l[0].toUpperCase() + l.slice(1)))),
    ...MIN_CLASSES.map(([cls, name]) => sec(name, MINERALS.filter((m) => m.cls === cls).map((m) =>
      `<b>${e(m.name)}</b> (${e(m.f)}): hardness ${m.hard}, ${e(m.streak)} streak, ${e((LUSTRE[m.lustre] || m.lustre).split(" (")[0])}, density ${m.sg}${m.fizz === "yes" ? ", fizzes in acid" : ""}${m.mag === "yes" ? ", magnetic" : ""}. ${e(m.fact)}`))).filter((s) => s.p.length),
  ] }],

  inscriptions: [{ id: "scripts", emoji: "🔎", title: "The world's scripts", sections: [
    sec("Kinds of script", SCRIPT_TYPES.map((t) => `<b>${e(t.name)}</b>: ${e(t.note)}`)),
    ...SCRIPT_TYPES.map((t) => sec(t.name, SCRIPTS.filter((s) => s.type === t.id).map((s) =>
      `<b>${e(s.name)}</b> (${e(s.where)}, ${e(s.when)}). ${e(s.dir)} ${e(s.signs)} ${e(s.fact)}`))).filter((s) => s.p.length),
  ] }],

  bench: [{ id: "reactions", emoji: "🧫", title: "The Bench's reactions", sections: [
    sec("The operations", Object.values(OPS).map((o) => `${o.emoji} <b>${e(o.name)}</b>: ${e(o.what)}.`)),
    ...Object.entries(OPS).map(([op, o]) => sec(`${o.emoji} ${o.name}`, RECIPES.filter((r) => r.op === op).map((r) =>
      `<b>${e(r.name)}</b> (${e(r.f)}) from ${r.in.map((x) => e(productName(x))).join(" + ")}: <i>${e(r.eq)}</i>. ${e(r.note)}${r.hz ? ` ⚠️ ${e(r.hz.what)}` : ""}`))).filter((s) => s.p.length),
  ] }],

  commissions: [{ id: "clients", emoji: "📋", title: "Clients and why they needed it", sections: [
    sec("Reputation", TIERS.map((t) => `${t.emoji} <b>${e(t.name)}</b> from ${t.at} reputation: each job pays 💎 ${t.pay} and ${t.stones} stone${t.stones > 1 ? "s" : ""}.`)),
    ...TIERS.map((t) => sec(`${t.emoji} ${t.name} clients`, JOBS.filter((j) => j.tier === t.n).map((j) => `${j.e} <b>${e(j.who)}</b> wants ${e(productName(j.wants)).toLowerCase()}. ${e(j.why)}`))),
  ] }],

  fireworks: [{ id: "pyro", emoji: "🎆", title: "The chemistry of fireworks", sections: [
    sec("Colours", COLOURANTS.map((c) => `<b>${e(c.name)}</b> (${e(c.f)}), ${e(c.colour)}: ${e(c.note)}`)),
    sec("Oxidisers and the chlorine donor", [...OXIDISERS.map((o) => `<b>${e(o.name)}</b> (${e(o.f)}): ${e(o.note)}`), `<b>${e(DONOR.name)}</b>: ${e(DONOR.note)}`]),
    sec("Tails and patterns", [...TAILS.map((t) => `<b>${e(t.name)}</b> (${e(t.effect)}): ${e(t.note)}`), ...PATTERNS.map((p) => `<b>${e(p.name)}</b>: ${e(p.note)}`)]),
    sec("Shell sizes", SIZES.map((s) => e(s.note))),
    sec("History", FW_HISTORY.map(e)),
    sec("Safety", ["Real fireworks are explosives. Making them needs a licence in most countries. This is a game: never mix these chemicals yourself."]),
  ] }],

  leadgold: [{ id: "nuclear", emoji: "⚛️", title: "Transmutation, for real", sections: [
    sec("Alpha and beta", [
      "<b>Alpha decay</b>: the nucleus throws out an alpha particle (2 protons + 2 neutrons, a helium nucleus). Atomic number −2, mass number −4.",
      "<b>Beta decay</b>: a neutron turns into a proton and throws out an electron. Atomic number +1, mass number unchanged.",
      "<b>Half-life</b>: the time for half of a sample's nuclei to decay. It is fixed for each isotope.",
    ]),
    sec("The decay chains", CHAINS.map((c) => `<b>${e(c.name)}</b>, ${e(c.start)} → ${e(c.end)}: ${c.steps.length - 1} steps. ${e(c.note)}`)),
    sec("Routes to gold-197", ROUTES.map((r) => `<b>${e(r.who)}</b>: ${e(r.note)}`)),
    sec("History", LG_HISTORY.map(e)),
  ] }],

  casefiles: [
    { id: "methods", emoji: "🗂️", title: "The methods behind the claims", sections: [
      sec("The investigator's kit", Object.values(CASE_TOOLS).map((t) => `${t.emoji} <b>${e(t.name)}</b>: ${e(t.what)}.`)),
      ...CASE_CLASSES.map(([cls, name]) => sec(name, CASE_METHODS.filter((m) => m.cls === cls).map((m) => `<b>${e(m.name)}</b>: ${e(m.how)}`))).filter((s) => s.p.length),
    ] },
    ...[1, 2, 3].map((lv) => ({ id: "cases" + lv, emoji: "📁", title: `The cases, ${LV[lv]}`, sections: [
      sec("Case by case", CASES.filter((c) => c.lv === lv).map((c) => `${c.emoji || "📁"} <b>${e(c.name)}</b> (${e(c.place)}, ${c.year}). Method: ${e(caseMethod(c.method))}. Exposed by ${e(c.by)}. ${e(c.fact)}`)),
    ] })),
  ],

  workshop: [1, 2, 3].map((lv) => ({ id: "tricks" + lv, emoji: "🎩", title: `Tricks, ${LV[lv]}`, sections: [
    sec("The repertoire", TRICKS.filter((t) => t.lv === lv).map((t) => `${t.emoji} <b>${e(t.name)}</b>: ${t.steps.map(e).join(", then ")}. <i>The tell: ${e(t.tell)}.</i> ${e(t.fact)}`)),
  ] })),

  bookings: [{ id: "bill", emoji: "🎟️", title: "The playbill and the venues", sections: [
    sec("Clients", Object.values(CLIENTS).map((c) => `${c.e} <b>${e(c.name)}</b> ${e(c.ask)}.`)),
    sec("Billing", BILLINGS.map((b) => `<b>${e(b.name)}</b>${b.shows ? ` after ${b.shows} shows` : ""}: pay ×${b.mult}.`)),
    sec("The venues", VENUES.map((v) => `${v.e} <b>${e(v.name)}</b>: ${e(v.fact)}`)),
  ] }],

  darkseance: [{ id: "dark", emoji: "🕯️", title: "Methods and the controls that beat them", sections: [
    sec("What the sitters ask for", Object.values(DS_EFFECTS).map((x) => `${x.e} <b>${e(x.name)}</b>`)),
    sec("The controls", Object.values(DS_CONTROLS).map((c) => `${c.e} <b>${e(c.name)}</b>: ${e(c.what)}.`)),
    sec("The methods, and how each was caught", DS_METHODS.map((m) => `${m.e} <b>${e(m.name)}</b> makes ${m.makes.map((k) => e((DS_EFFECTS[k] || { name: k }).name).toLowerCase()).join(", ")}; beaten by ${m.beaten.map((k) => e((DS_CONTROLS[k] || { name: k }).name).toLowerCase()).join(" or ")}. ${e(m.caught)}`)),
  ] }],

  mentalist: [{ id: "mind", emoji: "🎩", title: "How stage mind reading works", sections: [
    sec("Card forces", FORCES.map((f) => `${f.e} <b>${e(f.name)}</b>: ${e(f.how)} ${e(f.fact)}`)),
    sec("Cold reading and the Forer effect", [e(FORER), ...BARNUM.map((b) => `<i>"${e(b)}"</i>`), "Statements like these fit almost anyone, so almost anyone feels read."]),
    sec("The Houdinis' word code", [CODE.map(([w, n]) => `<b>${e(w)}</b> = ${n}`).join(" · "), ...CODE_FACTS.map(e)]),
    sec("Billets, one ahead", BILLET_FACTS.map(e)),
  ] }],

  phantasmagoria: [{ id: "optics", emoji: "🏮", title: "The optics of a ghost show", sections: [
    sec("The magic lantern", LANTERN_FACTS.map(e)),
    sec("Pepper's ghost", PEPPER_FACTS.map(e)),
    sec("Running the show", SHOW_FACTS.map(e)),
  ] }],

  roguesgallery: [{ id: "gallery", emoji: "🖼️", title: "Claimants and the people who caught them", sections: [
    sec("The 20 pairs", PAIRS.map((x) => `<b>${e(x.a.name)}</b> (${x.a.year}): ${e(x.a.line)} ↔ <b>${e(x.b.name)}</b> (${x.b.year}): ${e(x.b.line)}`)),
    sec("The Final Séance", ["Harry Houdini and his wife Bess agreed a secret message, so that whoever died first could try to send it back through a medium. The message was 'Rosabelle, believe', written in their own word code.",
      ...MILESTONES.map((m) => `<b>${e(m.ch)}</b>: ${e(m.name)}.`)]),
  ] }],

  cipherdesk: [
    { id: "ciphers", emoji: "🗝️", title: "The 16 ciphers", sections: [1, 2, 3].map((lv) => sec(LV[lv], CIPHERS.filter((m) => m.lvl === lv).map((m) => `${m.e} <b>${e(m.name)}</b>: ${e(m.how)}`))).filter((s) => s.p.length) },
    { id: "forgeries", emoji: "🔏", title: "Inscriptions and forgeries", sections: [
      sec("Real inscriptions", CD_INSCRIPTIONS.map((x) => `<b>${e(x.name)}</b> (${e(x.where)}): "${e(x.meaning)}". ${e(x.fact)}`)),
      sec("Famous forgeries, and how they were caught", FORGERIES.map((f) => `<b>${e(f.name)}</b>: ${e(f.claim)} <i>Caught: ${e(f.clue)}</i> ${e(f.fact)}`)),
    ] },
  ],

  blackchamber: [{ id: "rivals", emoji: "🕵️", title: "The codebreakers you race", sections: [
    sec("The rivals", BC_RIVALS.map((r) => `${r.e} <b>${e(r.name)}</b> (${e(r.when)}): ${e(r.fact)}`)),
    sec("The three rooms", BC_LEVELS.map((l) => `<b>Level ${l.n}, ${e(l.name)}</b>: ${e(l.what)}.`)),
  ] }],

  illuminator: [
    { id: "order", emoji: "📏", title: "The order of work", sections: [sec("Stages, in order", IL_STEPS.map((s, i) => `${i + 1}. ${s.e} <b>${e(s.name)}</b>: ${e(s.fact)}`))] },
    { id: "pigments", emoji: "🎨", title: "The pigments", sections: [...new Set(IL_PIGMENTS.map((x) => x.fam))].map((f) => sec(f[0].toUpperCase() + f.slice(1), IL_PIGMENTS.filter((x) => x.fam === f).map((x) => `<b>${e(x.name)}</b>: ${e(x.clue)} ${e(x.fact)}`))) },
    { id: "pages", emoji: "📖", title: "The manuscripts", sections: [sec("Pages to work", IL_PAGES.map((p) => `<b>${e(p.name)}</b> (${e(p.when)}): ${e(p.fact)}`))] },
  ],

  possession: [{ id: "tales", emoji: "👻", title: "The true tales", sections: Object.values(TRUE_TALES).flat().map((t) =>
    sec(`${t.name} (${t.kind.replace(/^True tale · /, "")})`, [...t.beats.map((b) => `${e(b.narr)} <i>${e(b.truth)}</i>`), ...[].concat(t.real || []).map((r, i) => `${i ? "" : "<b>What really happened:</b> "}${e(r)}`)])) }],
};
