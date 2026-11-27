// The Dark Sky: the Observatory's hidden finds (House 3), in the Houses engine's shared secrets shape (hosts/secrets.js).
// The engine pays, tracks finds in prog.houses.observatory.sec and draws the drawer; this file only says what can be found
// and when. Every find carries a real fact. Finds come from taps on the menu background (menubg.js data-tap names),
// real dates and sky states on the home screen, pokes at Keeper Altair, and Night Watch results.
import { moonLight } from "../scene.js";
import { showerTonight, isNight } from "./menubg.js";

const md = (at) => { const d = new Date(at); return [d.getMonth() + 1, d.getDate()]; };
const on = (at, m, days) => { const [M, D] = md(at); return M === m && days.includes(D); };
/** Solstice or equinox (their real date range in the Gregorian calendar, local date). */
export const turningPoint = (at) => on(at, 3, [19, 20, 21]) || on(at, 6, [20, 21]) || on(at, 9, [22, 23]) || on(at, 12, [21, 22]);

export const ITEMS = [
  // taps on the menu background
  { id: "polaris", e: "⭐", name: "The still point", hint: "One star in the sky never moves. Find it.", pay: { token: 1 },
    line: "Polaris sits less than 1° from the north celestial pole, so the whole northern sky turns round it." },
  { id: "milkyway", e: "🌌", name: "Our own galaxy", hint: "Touch the faint river of light.", pay: { token: 1 },
    line: "That band is the Milky Way seen edge-on from inside it: some 100 to 400 billion stars." },
  { id: "meteor", e: "🌠", name: "Caught a falling star", hint: "Catch a shooting star before it fades.", pay: { token: 2 },
    line: "Most meteors are specks smaller than a grain of sand, burning up about 100 km above the ground." },
  { id: "fullmoon", e: "🌕", name: "Full Moon", hint: "Touch the Moon when it is full.", pay: { token: 2 },
    line: "Even a full Moon is about 400,000 times fainter than the Sun." },
  { id: "earthshine", e: "🌒", name: "Earthshine", hint: "Touch a thin crescent Moon and look at its dark part.", pay: { token: 2 },
    line: "The dark part of a crescent Moon glows with sunlight reflected off Earth. Leonardo da Vinci explained it around 1510." },
  { id: "dome", e: "🔭", name: "Turn the dome", hint: "The dome turns if you keep at it.", pay: { token: 1 },
    line: "Domes rotate so the slit faces the target. The dome of the 200-inch Hale Telescope at Palomar weighs about 1,000 tons." },
  { id: "sunsafe", e: "🕶️", name: "Shut by day", hint: "Knock on the dome while it's closed.", pay: { token: 1 },
    line: "The slit stays shut by day for a reason: a telescope pointed at the Sun without a proper solar filter can blind you instantly." },
  // the real sky and calendar, on the home screen
  { id: "darkhours", e: "🌑", name: "The small hours", hint: "Visit when almost everyone is asleep.", pay: { token: 2 },
    line: "Astronomical night begins when the Sun is 18° below the horizon: no twilight left in the sky at all." },
  { id: "shower", e: "☄️", name: "Shower night", hint: "Visit on the peak of a real meteor shower.", pay: { token: 3 },
    line: "Meteor showers come when Earth crosses a trail of dust left by a comet, or for the Geminids, the asteroid 3200 Phaethon." },
  { id: "perihelion", e: "☀️", name: "Closest to the Sun", hint: "Visit in the first days of January.", pay: { token: 2 },
    line: "Earth is closest to the Sun in early January, about 147 million km away. Seasons come from the tilt, not the distance." },
  { id: "turning", e: "🌗", name: "A turning point", hint: "Visit on a solstice or an equinox.", pay: { token: 2 },
    line: "Solstices and equinoxes mark where the Sun's yearly path crosses or turns: Stonehenge lines up with the midsummer sunrise." },
  { id: "galileo", e: "🪐", name: "Galileo's night", hint: "Visit on 7 January.", pay: { token: 2 },
    line: "On 7 January 1610 Galileo saw three 'stars' beside Jupiter. Within a week he found a fourth and knew they were moons." },
  { id: "pluto", e: "🧊", name: "The ninth find", hint: "Visit on 18 February.", pay: { token: 2 },
    line: "On 18 February 1930 Clyde Tombaugh found Pluto by blinking two photographic plates, as you do in the Plate Room." },
  { id: "hubble", e: "🛰️", name: "Above the air", hint: "Visit on 24 April.", pay: { token: 2 },
    line: "The Hubble Space Telescope launched on 24 April 1990, above the air that makes stars twinkle." },
  { id: "apollo", e: "👣", name: "One small step", hint: "Visit on 20 July.", pay: { token: 2 },
    line: "Apollo 11 landed on the Moon on 20 July 1969. Its crew left a mirror there that lasers still bounce off today." },
  { id: "sagan", e: "📺", name: "Pale blue dot", hint: "Visit on 9 November.", pay: { token: 2 },
    line: "Carl Sagan was born on 9 November 1934. He asked for Voyager 1's 1990 photo of Earth from 6 billion km away." },
  { id: "leapday", e: "📜", name: "The extra day", hint: "A day that comes once in four years.", pay: { gem: 25 }, rare: true,
    line: "29 February exists because a year is about 365.2422 days. The Gregorian rule of 1582 keeps the calendar within a day in 3,000 years." },
  // Keeper Altair and the Night Watch
  { id: "altair", e: "💫", name: "A squashed star", hint: "Keep poking the Keeper.", pay: { token: 2 },
    line: "The real Altair spins so fast, about 286 km/s at its equator, that it is roughly a fifth wider than it is tall." },
  { id: "almanac", e: "📖", name: "Paid in starlight", hint: "Deliver a hard job at the Almanac Desk.", pay: { token: 3 },
    line: "Almanacs paid real astronomers' bills: Benjamin Franklin's Poor Richard's Almanack sold for 25 years from 1732." },
  { id: "mauna", e: "🏔️", name: "Above the clouds", hint: "Have a perfect night in the Night Watch.", pay: { gem: 25 }, rare: true,
    line: "The best observatories sit above the weather: Mauna Kea's summit is 4,207 m, above about 40% of Earth's atmosphere." },
];

/** The engine's secrets object for The Observatory. */
export const secrets = {
  label: "🌌 Dark Sky",
  items: ITEMS.map(({ line, ...it }) => it),
  event(kind, data = {}, api) {
    const find = (id) => api.find(id, ITEMS.find((i) => i.id === id).line);
    const at = data.at ?? Date.now();
    if (kind === "tap") {
      if (data.tap === "polaris") find("polaris");
      if (data.tap === "milkyway") find("milkyway");
      if (data.tap === "meteor") find("meteor");
      if (data.tap === "moon") { const { lit } = moonLight(at); if (lit > 0.97) find("fullmoon"); else if (lit > 0.03 && lit < 0.3) find("earthshine"); }
      if (data.tap === "dome") { if (!isNight(at)) find("sunsafe"); if ((data.count || 0) >= 5) find("dome"); }
    }
    if (kind === "home") {
      const [M, D] = md(at), h = new Date(at).getHours();
      if (h >= 2 && h < 5) find("darkhours");
      if (showerTonight(at)) find("shower");
      if (M === 1 && D >= 2 && D <= 5) find("perihelion");
      if (turningPoint(at)) find("turning");
      const dated = { "1-7": "galileo", "2-18": "pluto", "4-24": "hubble", "7-20": "apollo", "11-9": "sagan", "2-29": "leapday" }[`${M}-${D}`];
      if (dated) find(dated);
    }
    if (kind === "poke" && (data.count || 0) >= 7) find("altair");
    if (kind === "result" && data.room === "watch") {
      if (data.won && data.level === 3) find("almanac");
      if (data.perfect) find("mauna");
    }
  },
};
