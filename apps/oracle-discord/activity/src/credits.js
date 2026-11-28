// The end credits: a starfield scroll timed to "Don't Judge a Space Kid", the same song in every House (Frank 2026-11-28).
// Anyone can roll them from the Trophy Case or the 🎬 Credits tile in any House's menu; each House gets its own title
// card and lists its own host and games first. Finishing every game on every level rolls them automatically, once,
// and gives the Oracle a permanent Star Crown (prog.credits.done). This file is data and rules only; main.js draws it.
import { TROPHIES } from "./trophies.js";
import { GHOSTS } from "./seance/ghosts.js";
import { TRACKS, OPENER, HOUSE_TRACKS } from "./music.js";
import { RECORDS } from "./hosts/house-records.gen.js";
import { HOSTS } from "./hosts/index.js";

export const CREDITS_SONG = "dont-judge-a-space-kid";
/** The games (every trophy but the Crystal Eye, which counts readings). */
export const GAMES = TROPHIES.filter((t) => t.id !== "oracle" && !t.meta);

/** Levels (1-3) of a game the member has finished. */
export function levelsDone(p, id) {
  const t = TROPHIES.find((x) => x.id === id), r = ((p.trophies || {})[id] || {}).wins || {};
  return t ? [1, 2, 3].filter((L) => (r[L] || 0) >= t.need) : [];
}
/** Has the member finished every game on every level? */
export const mastered = (p) => GAMES.every((t) => levelsDone(p, t.id).length === 3);
/** How far along: finished levels out of all of them. */
export const masteryCount = (p) => ({ done: GAMES.reduce((n, t) => n + levelsDone(p, t.id).length, 0), of: GAMES.length * 3 });
export const creditsOf = (p) => (p.credits ||= { rolls: 0 });
/** The Oracle's permanent reward for mastering the Chamber. */
export const hasCrown = (p) => !!(p.credits && p.credits.done);
/** Call after a win: true the first time everything is finished (the credits should roll now). */
export function checkMastery(p) {
  const c = creditsOf(p); if (c.done || !mastered(p)) return false;
  c.done = Date.now(); return true;
}

/** Each House's title card and close button. The song is the same everywhere: CREDITS_SONG. */
export const CREDITS_TITLES = {
  oracle: { kicker: "Science is Magic presents", title: "The Oracle Chamber", back: "✦ Back to the Chamber" },
  alchemist: { kicker: "Science is Magic presents", title: "The Alchemist's House", back: "⚗️ Back to the lab" },
  observatory: { kicker: "Science is Magic presents", title: "The Observatory", back: "🔭 Back to the dome" },
  parlour: { kicker: "Science is Magic presents", title: "The Séance Parlour", back: "🕯️ Back to the Parlour" },
  scriptorium: { kicker: "Science is Magic presents", title: "The Scriptorium", back: "🪶 Back to the desk" },
};
export const creditsTitle = (houseId) => CREDITS_TITLES[houseId] || CREDITS_TITLES.oracle;

/** The House toys (no scores): the "Just for fun" tab. */
const TOYS = [["Magister Vell", "Your element · Potion mixer · Wall of curiosities"], ["Archivist Wren", "Name in runes · Ex libris · The reading nook"]];
/** The party games and modes for friends playing together. */
const PARTY = [
  ["Possession", "Possess the House host and tell a story together, with True tales mode"],
  ["Fact or Fib", "Write a believable wrong answer, then vote for the truth"],
  ["Vell's Hazardous Guess Show", "The Flame Test Lab's party mode"],
  ["The Impostor", "The Séance party round"],
  ["Split Key", "The Cipher Desk's team race"],
  ["Group séance · Duel a friend · Race friends", "Tables for two to four players, and an audience lane for everyone watching"],
];
/** Pack uploaders shown by the name their tracks are credited to. */
const WHO = { aroldv: "Arold Valda", MrJoshuaMcLean: "Retro Indie Josh", josepharaoh99: "josepharaoh99 (collections)" };
/** Composers named in the records' own credit lines (the record player shows each line in full). */
export const COMPOSERS = ["Alex McCulloch", "Arold Valda", "Aila Scott", "The Cynic Project", "Retro Indie Josh", "Julie Damsgaard (Spring Spring)", "Cal McEachern", "hernandack", "Zane Little", "Haley Halcyon (after Elgar)", "tcarisland", "Philly (Kentaro)"];
/** Every composer and pack behind the House records that came from free music libraries (CC0 and CC BY). */
export function libraryCredits(records = RECORDS) {
  const by = new Map();
  for (const r of records) { if (!r.pack) continue; const i = r.pack.lastIndexOf(" - "); let who = i > 0 ? r.pack.slice(i + 3).trim() : r.pack; const pack = (i > 0 ? r.pack.slice(0, i) : r.pack).replace(/\s+-?\s*$/, "").trim();
    who = WHO[who] || who; if (!by.has(who)) by.set(who, new Set()); by.get(who).add(pack); }
  return [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([who, packs]) => [who, [...packs].join(" · ")]);
}
const titleOf = (id) => (RECORDS.find((r) => r.id === id) || TRACKS.find((t) => t.id === id) || { title: id }).title;

/** The credits, top to bottom, for one House (its host and games come first). Each section: a heading and rows of [role, names]. */
export function creditSections(houseId = "oracle") {
  const songs = TRACKS.map((t) => t.title);
  const H = HOSTS.find((h) => h.id === houseId) || HOSTS[0], order = [H, ...HOSTS.filter((h) => h !== H)];
  const gameOf = (id) => (GAMES.find((t) => t.id === id) || {}).game;
  const mine = H.rooms === "all" ? [] : H.rooms.map(gameOf).filter(Boolean);
  const others = GAMES.filter((t) => !mine.includes(t.game));
  const houseRecs = HOUSE_TRACKS.filter((t) => t.house !== "pixelscape").length, pixel = HOUSE_TRACKS.filter((t) => t.house === "pixelscape").length;
  return [
    { h: "Created by", rows: [["Creator, art direction and game design", "Frank Sheffield"], ["For", "Science is Magic"]] },
    { h: "The Houses", rows: order.map((h) => [`${h.emoji} ${h.house}`, h.name]) },
    { h: "The hosts", rows: [["Designed by", "Frank Sheffield"], ["Voices, moods, hands and every line of banter", "Written for each House"], ["Ten personalities", "Each with its own lines in every House"]] },
    ...(mine.length ? [{ h: `Games in ${H.house}`, rows: mine.map((g) => ["", g]) }] : []),
    { h: mine.length ? "And every other game" : "Rooms", rows: others.map((t) => [t.game, t.name]) },
    { h: "Party games", rows: PARTY },
    { h: "Just for fun", rows: TOYS },
    { h: "Library and study", rows: [["House libraries", "A bookshelf in every House: its handbook, a book for each game, and a reading list"], ["Reading lists", "Real books from the Science is Magic 📚 forums"], ["Study hall", "How to play, tips and fact guides for every game"]] },
    { h: "Music", rows: [["Soundtrack by", "Frank Sheffield"], ["Made with", "Zona"], ["The Chamber's records", songs.join(" · ")],
      ["House opening songs", ["oracle", "alchemist", "observatory", "parlour", "scriptorium"].filter((k) => OPENER[k]).map((k) => titleOf(OPENER[k])).join(" · ")],
      ["House records", `${houseRecs} records across the Houses, ${pixel} more in Pixel Scape`], ["End credits, in every House", "Don't Judge a Space Kid"]] },
    { h: "Music from free libraries", rows: [...libraryCredits(), ["Composers", COMPOSERS.join(" · ")], ["Every record's own credit", "In the record player's Music credits"]] },
    { h: "Art", rows: [["Art direction", "Frank Sheffield"], ["Hosts, rooms, doors and menu backdrops", "Drawn in code for each House"], ["Emoji art", "The Science is Magic emoji and badge set, and the House kit emoji"]] },
    { h: "Built with", rows: [["Code, writing and sound effects", "Claude, by Anthropic"], ["Interface kit", "Front End Lab"], ["Home on", "Discord Activities"], ["Served by", "Cloudflare Workers"], ["Built by", "GitHub Actions and esbuild"]] },
    { h: "Also from Science is Magic", rows: [["Pixel Scape", "Satellite photos into 3D worlds, with Surveyor Flint as your guide"]] },
    { h: "Starring the ghosts of the Séance", rows: [["", GHOSTS.map((g) => g.name).join(" · ")]] },
    { h: "Sky and science", rows: [
      ["Planet and Moon positions", "Astronomy Engine, by Don Cross"],
      ["Star maps and the Messier objects", "d3-celestial, by Olaf Frohn"],
      ["Star positions", "The Hipparcos Catalogue, European Space Agency"],
      ["Constellation figures and names", "International Astronomical Union"],
      ["Meteor counts", "After the International Meteor Organization"],
      ["Heats of formation", "CRC Handbook of Chemistry and Physics"],
      ["Birthplaces", "OpenStreetMap contributors and Nominatim"],
      ["Time zones", "tz-lookup"],
      ["Reading images", "resvg, by Yevhenii Reizner"],
    ] },
    { h: "History honoured", rows: [
      ["Codebreaking", "Al-Kindi's letter counts, the black chambers and Bletchley Park"],
      ["Manuscripts", "The medieval scriptoria and their illuminators"],
      ["Stage magic", "Robertson's Fantasmagorie, Pepper's ghost and the Houdinis"],
    ] },
    { h: "Traditions honoured", rows: [
      ["Tarot", "The Rider-Waite-Smith deck: Pamela Colman Smith and A. E. Waite"],
      ["Lenormand", "After Marie Anne Lenormand"],
      ["Human Design", "After Ra Uru Hu"],
      ["Celtic tree calendar", "After Robert Graves"],
      ["Calendars", "The Maya daykeepers, the Dresden Codex, Egypt's civil year and Censorinus"],
      ["Scripts", "Elder Futhark, Ogham, Egyptian hieroglyphs, Maya numerals and the Inscription Tray's 40 scripts"],
      ["Also", "The I Ching, Ifá, Shang oracle bones, numerology, astrology and the Chinese zodiac"],
      ["Star lore", "Greek, Chinese, Egyptian, Lakota, Mi'kmaq, Hindu, Babylonian, Māori, Aboriginal Australian, Inca and Hawaiian storytellers"],
    ] },
    { h: "Typefaces", rows: [
      ["Cinzel", "Natanael Gama"], ["Cormorant Garamond", "Christian Thalmann, Catharsis Fonts"], ["IM Fell English", "Igino Marini"],
      ["Metamorphous", "Sorkin Type"], ["Orbitron", "Matt McInerney, The League of Moveable Type"], ["Uncial Antiqua", "Astigmatic"],
      ["VT323", "Peter Hull"], ["Glyphs", "Noto, by Google"],
    ] },
    { h: "Playtesting", rows: [["", "The Science is Magic Discord community"]] },
  ];
}
/** The special thanks, last before the end card. */
export const SPECIAL_THANKS = {
  name: "Frank Sheffield",
  line: "For dreaming up the Chamber, five Houses and their hosts, every room and every record, and for believing that science is magic.",
};
export const END_LINE = "And thank you, for playing.";
