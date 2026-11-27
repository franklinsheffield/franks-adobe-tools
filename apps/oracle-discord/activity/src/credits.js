// The Chamber's end credits: a starfield scroll timed to "Don't Judge a Space Kid".
// Anyone can roll them from the Trophy Case. Finishing every game on every level rolls them automatically, once,
// and gives the Oracle a permanent Star Crown (prog.credits.done). This file is data and rules only; main.js draws it.
import { TROPHIES } from "./trophies.js";
import { GHOSTS } from "./seance/ghosts.js";
import { TRACKS } from "./music.js";

export const CREDITS_SONG = "dont-judge-a-space-kid";
/** The games (every trophy but the Crystal Eye, which counts readings). */
export const GAMES = TROPHIES.filter((t) => t.id !== "oracle");

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

/** The credits, top to bottom. Each section: a heading and rows of [role, names]. */
export function creditSections() {
  const songs = TRACKS.map((t) => t.title);
  return [
    { h: "Created by", rows: [["Creator, art direction and game design", "Frank Sheffield"], ["For", "Science is Magic"]] },
    { h: "The Oracle", rows: [["Played by", "The Oracle of Science is Magic"], ["Designed by", "Frank Sheffield"], ["Voice, moods and every line of banter", "Written for the Chamber"]] },
    { h: "Music", rows: [["Soundtrack by", "Frank Sheffield"], ["Made with", "Zona"], ["Records", songs.join(" · ")], ["End credits", "Don't Judge a Space Kid"]] },
    { h: "Built with", rows: [["Code, writing and sound effects", "Claude, by Anthropic"], ["Interface kit", "Front End Lab"], ["Home on", "Discord Activities"], ["Served by", "Cloudflare Workers"], ["Built by", "GitHub Actions and esbuild"]] },
    { h: "Rooms", rows: GAMES.map((t) => [t.game, t.name]) },
    { h: "Starring the ghosts of the Séance", rows: [["", GHOSTS.map((g) => g.name).join(" · ")]] },
    { h: "Sky and science", rows: [
      ["Planet and Moon positions", "Astronomy Engine, by Don Cross"],
      ["Star maps", "d3-celestial, by Olaf Frohn"],
      ["Star positions", "The Hipparcos Catalogue, European Space Agency"],
      ["Constellation figures and names", "International Astronomical Union"],
      ["Heats of formation", "CRC Handbook of Chemistry and Physics"],
      ["Birthplaces", "OpenStreetMap contributors and Nominatim"],
      ["Time zones", "tz-lookup"],
      ["Reading images", "resvg, by Yevhenii Reizner"],
    ] },
    { h: "Traditions honoured", rows: [
      ["Tarot", "The Rider-Waite-Smith deck: Pamela Colman Smith and A. E. Waite"],
      ["Lenormand", "After Marie Anne Lenormand"],
      ["Human Design", "After Ra Uru Hu"],
      ["Celtic tree calendar", "After Robert Graves"],
      ["Calendars", "The Maya daykeepers, the Dresden Codex, Egypt's civil year and Censorinus"],
      ["Scripts", "Elder Futhark, Ogham, Egyptian hieroglyphs and Maya numerals"],
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
  line: "For dreaming up the Chamber, the Oracle, every room and every record, and for believing that science is magic.",
};
export const END_LINE = "And thank you, for playing.";
