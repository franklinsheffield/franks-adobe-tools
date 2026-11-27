// Constellation Rummy study guide: the rules, the scoring, star classes and every card in the deck.
// Original text for Science is Magic. Markup limited to <b> and <i>; rendered by room.js.
import { CARDS, CONS, CLASSES, CLASS_ORDER, LEVELS, pts } from "./deck.js";

const deckRows = () => Object.values(CONS).map((c) => {
  const cs = CARDS.filter((x) => x.con === c.con), lv = LEVELS.find((L) => L.cons.includes(c.con)).n;
  return `${c.emoji} <b>${c.name}</b> <i>(from Level ${lv})</i>: ${cs.map((x) => `${x.name} (${x.cls}, ${"★".repeat(pts(x.hip))})`).join(", ")}`;
});

export const GUIDE = {
  title: "Constellation Rummy study guide",
  sections: [
    { h: "How to play", p: [
      "You play against the Oracle. Each turn has three steps: <b>draw</b> one card (from the deck, or the top card of the discard pile), <b>lay down</b> any sets you can, then <b>discard</b> one card.",
      "Tap cards in your hand to pick them, then press a button. You can't throw back the card you just took from the discard pile.",
      "You can also <b>add</b> a single card to any set already on the table, yours or the Oracle's. The points go to whoever played the card.",
      "Empty your hand to <b>go out</b> and end the game. If the deck runs out, the discards are shuffled into a new night's deck once; when that runs out too, dawn ends the game.",
    ] },
    { h: "Ways to play", p: [
      "<b>Against an Oracle</b>: pick your opponent in the lobby. 🔮 <b>The Oracle</b> plays a steady game. 🐦‍⬛ <b>Magpie</b> grabs almost every discard, so think before you throw a card it can use. 💰 <b>Hoarder</b> keeps the bright stars and throws away dim ones. 🃏 <b>Trickster</b> hides its sets until it can go out all at once, and sometimes throws away a star it wants, as bait. Your first win against Magpie, Hoarder or Trickster pays extra 💎.",
      "<b>📅 Daily deal</b>: everyone gets the same shuffle each day, at a level and against an Oracle that change daily. Only your first game of the day goes on the shared board.",
      "<b>👥 Play together</b>: inside a Discord call, everyone who taps Play together sits at one table (2 to 4 players; Oracles fill empty seats, and play for anyone who leaves until they come back). With more players, extra constellations join the deck so everyone gets a full hand.",
      "<b>Drag and drop</b>: drag a card onto a set on the table to add it, onto the discard pile to discard it, or drag a picked set onto the table to lay it down.",
    ] },
    { h: "Sets", p: [
      "<b>Constellation set</b>: 3 or 4 stars of the same constellation. Each constellation has exactly 4 cards, so a set of 4 completes it and the Oracle tells its myths.",
      "<b>Colour set</b> (Levels 2 and 3): 3 or more stars of the same <b>spectral class</b>, every one from a <b>different</b> constellation. Example: Rigel (Orion), Regulus (Leo) and Navi (Cassiopeia) are all class B.",
      "On <b>Level 3</b> the cards show only the star, not its constellation. A set that isn't one costs you 1 point, so study the deck list below.",
    ] },
    { h: "Scoring and brightness", p: [
      "Cards score by how bright the star looks, its <b>apparent magnitude</b>. Smaller numbers are brighter: Sirius is -1.46, Polaris about 2.",
      "<b>★★★ = magnitude below 1</b> (the brightest stars, like Sirius, Vega, Rigel and Betelgeuse). <b>★★ = magnitude 1 to 2</b>. <b>★ = fainter than 2</b>.",
      "Your score is the stars you laid down, minus the stars still in your hand, plus 5 for going out. Bright cards are worth a lot on the table and cost a lot if you're caught holding them.",
      "Points are multiplied by the level (×1, ×1.5, ×2) for ✦. Wins pay 💎, more for a first win at a level and for every constellation you complete yourself.",
    ] },
    { h: "Star colours and classes", p: [
      "A star's colour tells its surface temperature. Astronomers sort stars into <b>spectral classes</b> O, B, A, F, G, K, M, from hottest to coolest. A classic way to remember them: <i>Oh Be A Fine Girl/Guy, Kiss Me</i>.",
      ...CLASS_ORDER.map((k) => `<b>${k} · ${CLASSES[k].name}</b>, about ${CLASSES[k].temp}. ${CLASSES[k].fact}`),
      "The system was built at Harvard around 1900, largely by <b>Annie Jump Cannon</b>, who classified hundreds of thousands of stars by eye from their spectra.",
    ] },
    { h: "Why the stars of a constellation belong together", p: [
      "A constellation is an official <b>area</b> of the sky: the International Astronomical Union fixed 88 of them and drew their borders in 1930. Every star belongs to exactly one.",
      "Stars in one constellation are usually not near each other in space. They only line up as seen from Earth. Five of the Big Dipper's stars are a real moving group, which is rare.",
    ] },
    { h: "The deck: 12 constellations, 48 stars", p: deckRows() },
  ],
};
