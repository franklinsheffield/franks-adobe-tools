// Herbalist's Grimoire: season and moon lore. When the old herbals and village sayings said each plant should be
// gathered. All of it is FOLKLORE: there is no good evidence the Moon changes a plant. Shown on every grimoire page,
// labelled as folklore, never as advice. Seasons are northern-hemisphere.
import { phaseName, moonSvg } from "../scene.js";

/** The old gatherer's rule for each part of a plant: when, and which moon. */
export const PARTS = {
  leaf: { what: "leaves", when: "on a dry morning once the dew has lifted, just before it flowers", moon: "waxing" },
  flower: { what: "flowers", when: "on a sunny late morning, when the flowers have just opened", moon: "waxing" },
  root: { what: "roots", when: "in autumn, after the leaves have died back", moon: "waning" },
  bulb: { what: "bulbs", when: "in midsummer, as the leaves turn yellow", moon: "waning" },
  bark: { what: "bark", when: "in spring, while the sap is rising and the bark slips off", moon: "waning" },
  fruit: { what: "fruit", when: "in late summer or autumn, when it is fully ripe", moon: "full" },
  seed: { what: "seeds", when: "in late summer, as the seed heads turn brown and dry", moon: "full" },
};
export const MOONS = {
  waxing: "a waxing moon, when the old lore says sap rises into leaf and flower",
  waning: "a waning moon, when the old lore says strength sinks into the root",
  full: "the full moon, when the old lore says fruit and seed are fullest",
};

/** part = which part the old herbals gathered; tale = a recorded custom for this plant (optional). */
export const LORE = {
  sage: { part: "leaf" }, rosemary: { part: "leaf", tale: "Sprigs were cut fresh for weddings and funerals alike: rosemary for remembrance." },
  lavender: { part: "flower", tale: "Cut when the first flowers on each spike open; the bundles were laid in linen chests." },
  chamomile: { part: "flower", tale: "Picked on a hot midsummer day, when the flower heads smell most of apples." },
  peppermint: { part: "leaf" }, thyme: { part: "leaf" },
  garlic: { part: "bulb", tale: "An English gardener's saying: plant it on the shortest day and lift it on the longest." },
  ginger: { part: "root" }, fennel: { part: "seed", tale: "Sprays were hung over doors on Midsummer Eve to keep witches out." },
  turmeric: { part: "root" },
  daffodil: { part: "flower", tale: "In Wales, finding the first daffodil of spring meant more gold than silver in the year ahead." },
  lilyvalley: { part: "flower", tale: "In France sprigs are given on May Day (1 May) for luck. A gift to look at, never to eat." },
  rhubarb: { part: "leaf", tale: "Old kitchen gardeners pulled the stalks only until midsummer, then let the plant rest. The leaves were never eaten." },
  basil: { part: "leaf" }, cinnamon: { part: "bark", tale: "Cut in the rainy season, when the wet bark peels most easily from the shoots." },
  parsley: { part: "leaf", tale: "Sown on Good Friday, because its seed 'goes to the Devil nine times' before it comes up." },
  coriander: { part: "seed" }, dill: { part: "seed", tale: "Gathered at Midsummer and hung by the door against witchcraft." },
  lemonbalm: { part: "leaf" }, saffron: { part: "flower", tale: "Picked at dawn in autumn, before the purple flowers open fully, so the three red threads stay fresh." },
  bay: { part: "leaf", tale: "Romans cut it to crown victors and poets; a bay tree by the house was said to keep off lightning." },
  nutmeg: { part: "fruit" }, chilli: { part: "fruit" },
  potato: { part: "root", tale: "In Ireland and Britain seed potatoes were planted on Good Friday for luck." },
  tomato: { part: "fruit" },
  apple: { part: "fruit", tale: "On Twelfth Night orchards were 'wassailed': toasted with cider and song so the trees would bear well." },
  willow: { part: "bark" },
  foxglove: { part: "leaf", tale: "Irish lore said the flowers belonged to the fairies, and picking them could give offence." },
  stjohns: { part: "flower", tale: "Gathered on St John's Eve (23 June) and hung over doors and windows against evil spirits." },
  nettle: { part: "leaf", tale: "Picked young in spring; old lore says not after May Day, when the Devil claims them (the leaves do turn gritty)." },
  elder: { part: "flower", tale: "In England and Denmark you asked the Elder Mother's leave before cutting a single spray." },
  dandelion: { part: "root", tale: "Roots were dug in autumn, when country people said they were sweetest." },
  feverfew: { part: "leaf" }, valerian: { part: "root" },
  calendula: { part: "flower", tale: "Its flowers open with the sun; old herbals said to pick them at noon, when the sun is strongest." },
  comfrey: { part: "root" },
  yarrow: { part: "leaf", tale: "Picked by moonlight and slipped under the pillow to dream of a future love." },
  echinacea: { part: "root" },
  meadowsweet: { part: "flower", tale: "A favourite strewing herb, gathered at midsummer and scattered on floors for weddings." },
  plantain: { part: "leaf", tale: "'Waybread', one of the Nine Herbs of an Anglo-Saxon healing charm, gathered from the roadside." },
  borage: { part: "flower", tale: "'I, borage, bring always courage': the flowers were floated in the stirrup cup before a ride." },
  redclover: { part: "flower", tale: "Finding a four-leaved clover in the meadow meant luck; some said it let you see fairies." },
  marshmallow: { part: "root" },
  hawthorn: { part: "flower", tale: "Blossom was gathered for May Day garlands, but bringing it indoors was thought to bring death." },
  horsetail: { part: "leaf", tale: "Only the green summer shoots were taken, never the brown spring stalks." },
  milkthistle: { part: "seed" },
  wildgarlic: { part: "leaf", tale: "A Welsh rhyme: eat leeks in March and ramsons in May, and all the year after the doctors may play." },
  selfheal: { part: "flower" }, burdock: { part: "root", tale: "Dug in the autumn of its first year, before the burrs come." },
  lungwort: { part: "leaf" },
  mandrake: { part: "root", tale: "Dug only at night: the gatherer stopped his ears with wax and tied the root to a dog, for its scream was said to kill." },
  belladonna: { part: "leaf", tale: "German lore said the Devil tends it all year, so it could only be gathered on Walpurgis Night, while he was away." },
  henbane: { part: "leaf" }, hemlock: { part: "leaf" }, monkshood: { part: "root" }, datura: { part: "seed" },
  yew: { part: "leaf", tale: "Churchyard yews were never to be cut: they belonged to the dead." },
  wormwood: { part: "leaf" },
  mugwort: { part: "leaf", tale: "Gathered on St John's Eve; Roman travellers tucked it into their sandals against weariness." },
  vervain: { part: "leaf", tale: "Pliny wrote it must be dug at the rising of the Dog Star, when neither sun nor moon shines, leaving honey for the earth in return." },
  mistletoe: { part: "fruit", tale: "Pliny wrote that druids cut it with a golden sickle on the sixth day of the moon, catching it in a white cloak." },
  poppy: { part: "seed" },
  periwinkle: { part: "flower", tale: "An Old English herbal says to pick it only when the moon is nine, eleven or thirteen nights old." },
  oleander: { part: "leaf" }, castor: { part: "seed" }, lordsladies: { part: "root" }, waterhemlock: { part: "root" },
  snakeroot: { part: "root" }, rosarypea: { part: "seed" }, laburnum: { part: "seed" },
  hellebore: { part: "root", tale: "Pliny wrote that the digger drew a circle round it with a sword, faced east and prayed, and watched for an eagle." },
  tobacco: { part: "leaf" }, strychnine: { part: "seed" }, calabar: { part: "seed" },
  rowan: { part: "fruit", tale: "'Rowan tree and red thread hold the witches all in dread': twigs were tied in crosses on May Eve." },
  juniper: { part: "fruit", tale: "In Scotland branches were burned at New Year to 'sain' (bless) the house and smoke out ill luck." },
};

/** Which moon the old rule would call "now": waxing, full, waning, or the new moon (rest). */
export function moonNow(at = Date.now()) {
  const name = phaseName(at), kind = name === "Full moon" ? "full" : name === "New moon" ? "new" : /Waxing|First/.test(name) ? "waxing" : "waning";
  return { name, kind };
}

/** The lore for a plant: { part, when, moon, tale, now, match }. now/match compare against tonight's real moon. */
export function loreOf(p, at = Date.now()) {
  const l = LORE[p.id] || { part: "leaf" }, part = PARTS[l.part], now = moonNow(at);
  return { part: l.part, what: part.what, when: part.when, moon: part.moon, moonText: MOONS[part.moon], tale: l.tale || "", now, match: now.kind === part.moon };
}

/** One line for the page, with the folklore tag. poison pages say plainly that this is lore only. */
export function loreHtml(p, esc, at = Date.now(), poison = false) {
  const l = loreOf(p, at);
  return `<div class="gr-sec gr-lore"><b class="h">🌙 Best picked at <span class="gr-tag">folklore</span></b>`
    + `The old herbals gathered its ${esc(l.what)} ${esc(l.when)}, under ${esc(l.moonText)}.`
    + (l.tale ? `<br><i>${esc(l.tale)}</i>` : "")
    + `<div class="gr-moonnow"><svg viewBox="-17 -17 34 34" aria-hidden="true">${moonSvg(at, 11)}</svg>Tonight: ${esc(l.now.name)} · ${l.match ? "by the old rule, a night for its " + esc(l.what) : l.now.kind === "new" ? "the new moon, when the old rule says rest" : "not its moon by the old rule"}</div>`
    + `<div class="note">${poison ? "Lore only: never gather this plant. " : ""}No good evidence shows the Moon changes a plant; this is how people used to think.</div></div>`;
}
