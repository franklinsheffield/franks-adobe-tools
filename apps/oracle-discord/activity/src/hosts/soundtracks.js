// The soundtrack library: one branded set of records per House (and Pixel Scape), each played on that House's own
// device. Frank supplies the audio (music/<id>.mp3); a record joins the shared pool (music.js) once its file is in.
// Data only. unlock: when the record is earned (the same task style as music.js TRACKS).
import { HOUSE_RECORDS } from "./alchemist-lab.js";

const visit = (h) => (p) => !!(((p && p.houses) || {})[h] || {}).day;
const lvl3 = (h) => (p) => ((((p && p.houses) || {})[h] || {}).lv || []).some((k) => /-3$/.test(k));
const rounds = (h, n) => (p) => ((((p && p.houses) || {})[h] || {}).rounds || 0) >= n;
const relics = (h, n) => (p) => ((((p && p.houses) || {})[h] || {}).relics || []).length >= n;
const set = (house, rows) => rows.map(([id, title, mood, task, test]) => ({ id, title, mood, how: "task", house, task, test }));

export const LIBRARY = [
  { house: "oracle", name: "The Oracle Chamber", player: "The Record Player", device: "a gold-trimmed turntable", have: 16, tracks: [] , note: "Frank's 16 soundtracks (music.js TRACKS), already in." },
  { house: "alchemist", name: "The Alchemist's House", player: "The Brass Phonograph", device: "a brass horn phonograph with a bubbling flask", have: 0,
    tracks: HOUSE_RECORDS.map((r, i) => ({ ...r, mood: ["Bright and bubbly, the lab waking up", "Low and simmering, a furnace that never goes out", "A swirling 3/4 waltz, things changing shape", "Grand and golden, the Great Work finished"][i] })) },
  { house: "observatory", name: "The Observatory", player: "The Orrery Music Box", device: "a wind-up orrery whose planets turn as it plays", have: 0,
    tracks: set("observatory", [
      ["first-light", "First Light", "Calm music-box opening, a telescope's first look", "Visit the Observatory", visit("observatory")],
      ["dome-opens-at-dusk", "Dome Opens at Dusk", "Slow and airy, the slit rolling open", "Beat a Level 3 game in the Observatory", lvl3("observatory")],
      ["star-hop-nocturne", "Star-Hop Nocturne", "Gentle bells, hopping star to star", "Play 100 rounds in the Observatory", rounds("observatory", 100)],
      ["music-of-the-spheres", "Music of the Spheres", "Big and celestial (Kepler gave each planet a tune in 1619)", "Place all 8 Observatory relics", relics("observatory", 8)],
    ]) },
  { house: "parlour", name: "The Séance Parlour", player: "The Spirit Trumpet Gramophone", device: "a gramophone whose horn is a séance trumpet", have: 0,
    tracks: set("parlour", [
      ["lights-down", "Lights Down, Hands on the Table", "Hushed and candlelit", "Visit the Séance Parlour", visit("parlour")],
      ["knock-once-for-yes", "Knock Once for Yes", "Playful and spooky, knocks in the rhythm", "Beat a Level 3 game in the Parlour", lvl3("parlour")],
      ["the-mediums-waltz", "The Medium's Waltz", "An eerie 3/4 with a wobbly organ", "Play 100 rounds in the Parlour", rounds("parlour", 100)],
      ["exposed", "Exposed!", "Triumphant reveal, the trick uncovered", "Place all 8 Parlour relics", relics("parlour", 8)],
    ]) },
  { house: "scriptorium", name: "The Scriptorium", player: "The Hurdy-Gurdy", device: "a hand-cranked hurdy-gurdy on the writing desk", have: 0,
    tracks: set("scriptorium", [
      ["vespers-at-the-desk", "Vespers at the Desk", "Quiet and chant-like, evening light", "Visit the Scriptorium", visit("scriptorium")],
      ["quill-and-candle", "Quill and Candle", "Steady and focused, a pen scratching", "Beat a Level 3 game in the Scriptorium", lvl3("scriptorium")],
      ["the-cipher-dance", "The Cipher Dance", "A lively medieval estampie", "Play 100 rounds in the Scriptorium", rounds("scriptorium", 100)],
      ["illuminated", "Illuminated", "Grand and golden, a finished manuscript", "Place all 8 Scriptorium relics", relics("scriptorium", 8)],
    ]) },
  { house: "pixelscape", name: "Pixel Scape", player: "The Satellite Jukebox", device: "a jukebox shaped like a satellite dish", have: 0, app: "Pixel Scape (its own Activity)",
    tracks: set("pixelscape", [
      ["orbit-mode", "Orbit Mode", "Ambient synth, looking down from orbit", "Open Pixel Scape", null],
      ["contour-lines", "Contour Lines", "Steady and curious, mapping the hills", "Build your first terrain", null],
      ["render-farm", "Render Farm", "Driving and busy, the world being built", "Build 25 terrains", null],
      ["new-world", "New World", "Big finale, a world finished", "Share a terrain to Discord", null],
    ]) },
];
/** How many tracks Frank still needs to send, per House. */
export const toSend = () => LIBRARY.filter((L) => L.tracks.length).map((L) => ({ house: L.house, player: L.player, n: L.tracks.length - L.have }));
