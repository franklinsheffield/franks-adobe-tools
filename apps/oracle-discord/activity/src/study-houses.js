// House handbooks for the Study tab: one per House, written in its host's own voice (INITIAL VOICE RULE: every House
// sounds like itself). The running gimmick is kept: every host is secretly the same person and hides it badly, so each
// handbook's sign-off slips. Facts here are plain, checkable ones; game rules come from the rooms themselves.
// houseStudy(H, rooms) builds the House's Study entry: the handbook first, then a "Games in this House" page.
// Markup limited to <b> and <i>.

const COMMON = (H) => [
  `<b>${H.token.emoji} ${H.token.plural}</b> are this House's own currency. Your first visit each day pays one, and beating game levels here pays more. Spend them on ${H.relicLabel ? `<b>${H.relicLabel.replace(/^\S+\s/, "")}</b>` : "<b>moon relics</b>"}, which stay in the House for good.`,
  "<b>✦ and 💎 Essence</b> come from every game in every House. ✦ raises your rank; 💎 buys looks, records, card backs and more in the store.",
  "The <b>Trophy Case</b> has one trophy per game: Bronze, Silver and Gold for finishing levels 1 to 3, and Prismatic for a perfect run of every level.",
  "Every game has a <b>Study</b> card, like this one. Read it before a hard level, or after a loss: the answers you missed are in here.",
];

export const HOUSE_BOOKS = {
  oracle: {
    title: "The Oracle's handbook",
    voice: "Every reading starts with the facts, then what they may mean, then a question for you. The answer is yours.",
    sections: [
      { h: "Welcome to the Chamber", p: [
        "Come in, seeker. The Chamber holds every reading and every game in all the Houses, under one hood.",
        "My readings never give orders and never say yes or no. First the data (the card, the coins, the sky), then what it <i>may</i> mean, then questions for you to sit with.",
      ] },
      { h: "Readings", p: [
        "<b>🃏 Cards</b>: tarot, Lenormand and the Science is Magic deck, plus card games. <b>❓ Ask a question</b>: coins, runes, bones and more. <b>🌌 Your birth</b>: readings from the day you were born, in DD/MM/YYYY.",
        "<b>✦ Draw today's card</b> starts your daily reading. Your history goes into your <b>Codex</b> and your 📖 <b>Grimoire</b>, and I read it back to you as patterns over time.",
        "Ranks rise with ✦: <b>Seeker</b>, <b>Initiate</b> (60), <b>Adept</b> (200), <b>Magus</b> (500), <b>Oracle-touched</b> (1,200).",
      ] },
      { h: "Your Chamber", p: COMMON },
      { h: "The other Houses", p: [
        "Four more Houses keep their own channels: the Alchemist's House, the Observatory, the Séance Parlour and the Scriptorium. Each has its own host, games and tokens.",
        "If a stray token from another House rolls out of my crystal ball, I send it home. I have never visited those Houses myself. Never.",
      ] },
    ],
    sign: "The Oracle. <i>I have never set foot in a laboratory. Or an observatory. Or a parlour. Or a library. Why do you ask?</i>",
    lines: { open: ["The stars keep notes, {name}. So should you.", "Study first, {name}. The cards are kinder to the prepared."], pick: ["{game}. Read slowly. The page will wait."] },
  },
  alchemist: {
    title: "Magister Vell's lab manual",
    voice: "Goggles on. Read the method twice, then do it once.",
    sections: [
      { h: "Welcome to the lab", p: [
        "Right. Goggles, gloves, curiosity. This House does real chemistry: real minerals, real reactions, real products for real clients. Nothing here is magic. It only looks like it.",
        "First rule of any lab: <b>add acid to water, never water to acid</b>. Pouring water into strong acid can boil and spit.",
      ] },
      { h: "The core loop", p: [
        "<b>1. 🪨 Mineral Cabinet</b>: test unlabelled rocks and name them. Every mineral you name goes on your shelf.",
        "<b>2. 🧫 Discovery Bench</b>: heat, smelt, mix and electrolyse what's on your shelf to discover real products. Each product joins the shelf.",
        "<b>3. 📋 Commissions</b>: three jobs a day, the same for everyone. Deliver products for 💎, stones and reputation: Village, Guild, Royal Society.",
        "The <b>🔥 Flame Test Lab</b> feeds the Cabinet: a mineral burns with the real colour of its metal.",
      ] },
      { h: "The rest of the lab", p: [
        "<b>⚗️ Alchemist's Lab</b> (behind the ✦ daily button), <b>🎆 Fireworks Workshop</b>, <b>⚛️ Lead into Gold</b>, <b>⚛️ Element Duel</b>, <b>🌿 Herbalist's Grimoire</b>, and the party game <b>👻 Possession</b>.",
        "<b>🎭 Fact or Fib</b> party rounds run in Element Duel and the Herbalist's Grimoire: write a believable wrong answer, then vote for the truth.",
      ] },
      { h: "Your bench", p: COMMON },
      { h: "Safety", p: ["Every reaction here is real, and some are dangerous. Learn them here. Don't try them at home."] },
    ],
    sign: "Magister Vell, Master of the Lab. <i>Not the Oracle. Completely different person. Taller, for a start.</i>",
    lines: { open: ["Method first, {name}. Then the fun part.", "Lab manual open, {name}. Read the safety notes. Twice."], pick: ["{game}. Note the method. Note the result. Write it down."] },
  },
  observatory: {
    title: "Keeper Altair's observing notes",
    voice: "Patience is the best telescope. Notes are the second best.",
    sections: [
      { h: "Welcome to the dome", p: [
        "Good evening. This House watches the real sky: real stars, comets, eclipses and voyages, worked out the way astronomers and navigators really did it.",
        "For tonight's sky I only ever ask for your nearest <b>city</b>. Nothing more precise is needed, and nothing more is kept.",
      ] },
      { h: "The core loop", p: [
        "<b>1. 🔭 The Night Watch</b>: tonight's sky over your city. Pick a target, pick an eyepiece, log it.",
        "<b>2. The Plate Room</b>: measure your logged objects with real methods: spectra, light curves, parallax.",
        "<b>3. The Almanac Desk</b>: three clients a day, shared with the channel. Hard jobs need a Plate Room result.",
      ] },
      { h: "The rest of the Observatory", p: [
        "<b>☄️ Comet Hunter</b>, <b>🌑 Eclipse Chaser</b>, <b>🧭 Celestial Navigator</b>, <b>🌌 Messier's Catalogue</b>, <b>🌠 Star Party</b>, <b>🔭 Star Lore Navigator</b> (behind the ✦ daily button), <b>🗓️ Calendar Keeper</b>, <b>🃏 Constellation Rummy</b>, and the party game <b>👻 Possession</b>.",
        "<b>🎭 Fact or Fib</b> runs in Star Lore Navigator.",
        "Your Observatory rank climbs from <b>Stargazer</b> to <b>Observer</b>, <b>Fellow</b> and <b>Astronomer Royal</b> as you win games and log the sky. The milestones are named after Kepler's laws.",
      ] },
      { h: "Your dome", p: COMMON },
      { h: "Safety", p: ["Never look at the Sun through a telescope, binoculars or any lens unless it has a certified solar filter. It can blind you in an instant."] },
    ],
    sign: "Keeper Altair. <i>P.S. The crescent ring on my hand is an astronomer's ring. Only astronomers wear them. I checked.</i>",
    lines: { open: ["Notes before the night, {name}. Your eyes will thank you.", "Twenty minutes for dark eyes, {name}. Twenty more for reading."], pick: ["{game}. Read it the way you'd scan a sky: slowly, edge to edge."] },
  },
  parlour: {
    title: "Madame Rook's book of methods",
    voice: "Every ghost has a method, darling. This book has most of them.",
    sections: [
      { h: "Welcome to the Parlour", p: [
        "Do sit down, darling. Mind the table, it tilts. In this House we expose the real methods behind famous ghost claims, and then we perform them, openly, as tricks.",
        "Nobody in this House contacts the dead. The medium is always the trick.",
      ] },
      { h: "The core loop", p: [
        "<b>1. 🗂️ Case Files</b>: investigate a real claim with an investigator's kit, then name the method behind it.",
        "<b>2. 🎩 The Workshop</b>: every method you uncover opens tricks. Rehearse them until you spot the tell.",
        "<b>3. 🎟️ Bookings</b>: three bookings a day, the same for everyone: expose, perform, explain. Climb the bill from Bottom of the Bill to Star Turn.",
      ] },
      { h: "The rest of the Parlour", p: [
        "<b>🕯️ The Dark Séance</b>, <b>🎩 The Mentalist</b>, <b>🏮 Phantasmagoria</b>, <b>🖼️ The Rogues' Gallery</b>, <b>🕯️ Séance: Guess the Ghost</b>, <b>⏳ History of Magic</b> (behind the ✦ daily button), and the party game <b>👻 Possession</b>.",
        "<b>🎭 Fact or Fib</b> runs in the Case Files and History of Magic.",
        "The House's crown is the <b>Final Séance</b> in the Rogues' Gallery: 'Rosabelle, believe', the secret message Harry and Bess Houdini agreed so that whoever died first could try to send it back. A medium claimed to receive it in 1929, but the code had been printed in a Houdini biography the year before.",
      ] },
      { h: "Your parlour", p: COMMON },
    ],
    sign: "Yours in the dark, Madame Rook. <i>Not to be confused with any fortune teller, alchemist, astronomer or archivist you may have met. The resemblance is a trick of the candlelight.</i>",
    lines: { open: ["Read the method, darling, and the ghost loses its power.", "Study, {name}. Houdini read everything the mediums wrote."], pick: ["{game}. Watch the hands, darling. Even on the page."] },
  },
  scriptorium: {
    title: "Archivist Wren's commonplace book",
    voice: "Every mark means something. Strictly speaking, most of them mean several things.",
    sections: [
      { h: "Welcome to the Scriptorium", p: [
        "Hello. Quietly, please. This House reads the world's real scripts, ciphers and inscriptions, and catches the forgeries.",
        "A commonplace book was a notebook for copying out passages worth keeping. Scholars kept them for centuries. This is mine. Borrow it.",
      ] },
      { h: "The core loop", p: [
        "<b>1. 🔎 Inscription Tray</b>: identify unlabelled scripts from direction, sign count, tool and telltale marks, and file them by type.",
        "<b>2. 🗝️ Cipher Desk</b>: break 100 real ciphers, inscriptions and forgeries. Inscriptions open once you've filed their script at the Tray.",
      ] },
      { h: "The rest of the Scriptorium", p: [
        "<b>🗝️ Rune & Glyph Decoder</b> (the card game Scribe's Hand, today's daily), <b>🃏 Grimoire Memory</b>, and the party game <b>👻 Possession</b>.",
        "Look in the margins of the menu. Scribes left notes there, and so did I.",
      ] },
      { h: "Your desk", p: COMMON },
    ],
    sign: "Archivist Wren. <i>Footnote 1: any likeness between this hand and the Oracle's is a well-known scribal coincidence. Footnote 2: so is the ring.</i>",
    lines: { open: ["Footnote: the reading room is open, {name}.", "Strictly speaking, {name}, nobody ever regretted reading the guide."], pick: ["{game}. Mind the ink, it's still wet."] },
  },
};

const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];
/** A line in the current host's voice for the Study tab. kind: "open" (the House handbook) | "pick" (a game's guides). */
export function studyLine(hostId, kind, vars = {}, rand = Math.random) {
  const L = (HOUSE_BOOKS[hostId] || HOUSE_BOOKS.oracle).lines[kind] || HOUSE_BOOKS.oracle.lines[kind];
  return fill(pick(L, rand), vars);
}

/** The House's Study entry. H: the host pack. rooms: [{ id, emoji, name }] of the games this House offers that have a Study entry. */
export function houseStudy(H, rooms) {
  const B = HOUSE_BOOKS[H.id] || HOUSE_BOOKS.oracle;
  const sections = B.sections.map((s) => ({ h: s.h, p: typeof s.p === "function" ? s.p(H) : s.p }));
  sections.push({ h: "Signed", p: [`<i>${B.voice}</i>`, `— ${B.sign}`] });
  const games = { id: "house-games", emoji: "📚", title: `Games in ${H.house}`, sections: [
    { h: `${rooms.length} games, each with its own guides`, p: rooms.map((r) => `${r.emoji} <b>${r.name}</b>`) },
    { h: "How to study", p: ["Open a game's Study card from this tab. Each one starts with <b>How to play</b> and <b>Tips</b>, then the real facts the game is built on."] },
  ] };
  return { room: "house", emoji: H.emoji, name: H.house, guides: [{ id: "handbook", emoji: "📖", title: B.title, sections }, games] };
}
