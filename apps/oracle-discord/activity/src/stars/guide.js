// Star Lore Navigator study guide: everything the three levels ask, plus how to find things in the real sky.
// Original text for Science is Magic. Markup limited to <b> and <i>; rendered by room.js.
export const GUIDE = {
  title: "Star Lore study guide",
  sections: [
    { h: "How to play", p: [
      "The Oracle asks you to <b>find and draw</b> a constellation. The sky starts somewhere else, so you have to look for it: drag the <b>sky ball</b> in the corner to turn the whole sky, and <b>pinch, scroll or tap + and -</b> to zoom. A <b>timer</b> runs: if dawn comes before you finish, the stars fade and you lose the round (you still hear the story).",
      "When you find it, <b>drag from star to star</b> (or tap one star, then the next) to draw each line of its figure. The little shape in the corner shows what to draw. Finish the figure and your reward is its <b>lore</b>: a fable picked from a pool of stories from different cultures, then the real astronomy. If time runs out, the story stays sealed: study this guide and try again.",
      "<b>🌙 Tonight's real sky</b> shows the sky as it really is from where you are tonight, with the ground and the horizon. Pick your city (or share your location), slide the hour from dusk to dawn, and the Oracle asks only for constellations that are up, telling you how high and which way to face. After you draw one, she tells you when it rises, when it is highest and when it sets: then step outside and find it for real.",
      "A line that is not in the figure is a <b>mistake</b>. Finish with 0 or 1 mistakes for 3 stars, up to 4 for 2 stars. <b>Hint</b> points the way or flashes the next line, and counts as a mistake. Then one question on the real astronomy earns a bonus.",
      "<b>Level 1</b> draws every constellation's figure on the sky, so you look for the right shape. <b>Level 2</b> hides all figures: find the pattern in the stars themselves. <b>Level 3</b> is a photo-real sky with the Milky Way and thousands of faint stars, as it looks from a dark site.",
      "The sky is drawn the way it looks when you face it overhead: <b>north up and east to the left</b>. That is why it looks flipped compared with a map of Earth.",
    ] },
    { h: "What a constellation is", p: [
      "A <b>constellation</b> is an area of the sky. In 1922 the International Astronomical Union fixed the list at <b>88</b>, and in 1930 drew official borders, so every star belongs to exactly one.",
      "An <b>asterism</b> is a famous pattern that is not an official constellation, such as the Big Dipper (part of Ursa Major), the Summer Triangle or Orion's belt.",
      "The stars of a constellation are usually <b>not near each other</b>. They only line up from where we stand. Orion's belt stars are hundreds of light-years apart.",
      "Many of the 88 come from Greek astronomy, which drew on <b>Babylonian</b> star lists. The far-southern ones were named by European navigators and astronomers in the 1500s to 1700s.",
    ] },
    { h: "Every culture has its own sky", p: [
      "People everywhere grouped stars into figures that mattered to them: hunters, animals, canoes, sages, calendars. The same stars become Orion in Greece, Sah in Egypt and the Hand to the Lakota.",
      "Some peoples, such as the <b>Inca</b> and many <b>Aboriginal Australian</b> nations, also saw <b>dark constellations</b>: shapes made by the dust clouds of the Milky Way, like the Emu in the Sky and the llama Yacana.",
      "Star lore was practical. The sky was a <b>calendar</b> (Matariki, Sopdet, Beidou's handle), a <b>compass</b> (Polaris, the Southern Cross, Polynesian star paths) and a way to keep stories and laws alive.",
    ] },
    { h: "Star names", p: [
      "Most bright stars have names from <b>Arabic</b>, because medieval Islamic astronomers preserved and improved Greek astronomy. Betelgeuse, Rigel, Aldebaran, Altair, Vega and Deneb are all Arabic in origin.",
      "In 1603 Johann Bayer labelled stars with <b>Greek letters</b> in each constellation, roughly by brightness: Alpha Orionis is Betelgeuse. It is only rough: Beta Orionis, Rigel, is usually brighter.",
    ] },
    { h: "Brightness and magnitude", p: [
      "Astronomers measure brightness in <b>magnitudes</b>, a system going back to Hipparchus in ancient Greece. <b>Smaller numbers are brighter.</b> Sirius is -1.46; the faintest stars you can see from a dark site are about 6.",
      "Each step of 5 magnitudes is <b>100 times</b> in brightness. On the chart, bigger dots are brighter stars.",
      "How bright a star looks depends on how luminous it really is <b>and</b> how far away it is. Sirius is bright mostly because it is close; Deneb is bright despite being very far away.",
    ] },
    { h: "Light-years: looking back in time", p: [
      "A <b>light-year</b> is the distance light travels in a year, about 9.5 trillion km. It is a distance, not a time.",
      "Light from a star 550 light-years away left it 550 years ago, so you see Betelgeuse as it was then. The nearest star system, <b>Alpha Centauri</b>, is 4.4 light-years away.",
      "Distances to far-off supergiants such as Betelgeuse and Deneb are still uncertain, which is why this game says 'about' and gives ranges.",
    ] },
    { h: "Star colours are temperatures", p: [
      "A star's colour tells you how hot its surface is. <b>Red</b> stars like Betelgeuse and Antares are cool, about 3,000 °C. <b>Yellow</b> stars like the Sun are about 5,500 °C. <b>Blue-white</b> stars like Rigel and Spica are hotter than 10,000 °C.",
      "The chart colours each star by its measured colour index (B-V) from the Hipparcos satellite.",
    ] },
    { h: "Why the sky turns, and the seasons of stars", p: [
      "Earth spins once a day, so the stars rise in the east and set in the west, turning around the <b>celestial poles</b>. Polaris sits less than a degree from the north pole of the sky.",
      "Stars rise about <b>4 minutes earlier</b> each night as Earth orbits the Sun. Over a year the whole sky turns past, so each constellation has its season: Orion in January evenings, Scorpius in July.",
      "What you can see depends on your latitude. Stars near the north pole never set for northern skywatchers but never rise for people far south, and the other way round for the Southern Cross.",
      "Your latitude equals the height of the celestial pole above your horizon. That is how navigators used Polaris to find their latitude.",
    ] },
    { h: "Precession: the wandering pole", p: [
      "Earth's axis wobbles like a spinning top, tracing a circle every <b>26,000 years</b>. Hipparchus discovered it around 130 BCE by comparing Spica's position with older records.",
      "So the pole star changes: <b>Thuban</b> in Draco when the pyramids were built, <b>Polaris</b> now, and <b>Vega</b> roughly 12,000 years from now.",
      "Precession also explains why the Southern Cross, once seen from ancient Greece, is now hidden there, and why Sirius's rising no longer matches the Nile flood.",
    ] },
    { h: "Star-hopping", p: [
      "Astronomers find faint things by <b>hopping</b> from bright patterns they know. From the Big Dipper: follow the Pointers to <b>Polaris</b>; arc along the handle to <b>Arcturus</b>, then speed on to <b>Spica</b>; follow the Pointers the other way to <b>Regulus</b>.",
      "From Orion: follow the belt down to <b>Sirius</b> and up to <b>Aldebaran</b> and the Pleiades.",
      "In summer, the <b>Summer Triangle</b> of Vega, Deneb and Altair spans the Milky Way. In the south, the two Pointers lead to the Southern Cross.",
    ] },
    { h: "Astronomy and astrology", p: [
      "The <b>zodiac</b> is the band of constellations along the <b>ecliptic</b>, the Sun's yearly path. Babylonian astronomers split it into 12 equal signs of 30 degrees about 2,500 years ago.",
      "Real constellations are not equal in size, and the Sun also passes through <b>Ophiuchus</b>. Because of precession, the signs used in Western astrology have drifted almost one whole constellation away from the stars they were named after.",
      "Astronomy is the science of what stars are and how they move. Astrology is a tradition of meaning. This game teaches the stories as stories and the science as science.",
    ] },
  ],
};
