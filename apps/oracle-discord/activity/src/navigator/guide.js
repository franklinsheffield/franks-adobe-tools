// The Navigator's manual: everything the three levels ask, with real history. Read by study.js.
export const GUIDE = {
  title: "The Navigator's manual",
  sections: [
    { h: "Latitude by Polaris", p: [
      "Polaris sits less than 1° from the north celestial pole. At the North Pole it is overhead; at the equator it sits on the horizon. In between, <b>its height above the horizon is your latitude</b>.",
      "A sextant's mirrors bring the star down to the horizon in the eyepiece. Read the arm and you have the angle.",
      "South of the equator Polaris is below the horizon, so southern navigators used other stars, such as the Southern Cross pointing towards the south pole." ] },
    { h: "The noon Sun", p: [
      "At local noon the Sun is at its highest. Measure that altitude with the sextant.",
      "The almanac gives the Sun's <b>declination</b> for the day: how far north or south of the celestial equator it is (up to about 23.4° either way).",
      "With the Sun to the south: latitude = declination + (90° − altitude). With the Sun to the north: latitude = declination − (90° − altitude). Navigators did this sum every day at noon." ] },
    { h: "Longitude by chronometer", p: [
      "Earth turns 360° in 24 hours: <b>15° an hour</b>. If local noon comes when a clock set to Greenwich reads 14:00, you are 2 hours behind Greenwich: 30° west.",
      "The Sun's noon wanders a little through the year (the equation of time, up to about 16 minutes), so navigators corrected for it from the almanac.",
      "A clock that keeps time at sea was the hard part. John Harrison's H4 (1759) did it: on the 1761 voyage to Jamaica it lost only about 5 seconds." ] },
    { h: "Navigating without instruments", p: [
      "Polynesian navigators crossed thousands of kilometres of Pacific by reading where stars rise and set, the ocean swells and the birds.",
      "In 1976 the voyaging canoe Hōkūleʻa sailed from Hawaiʻi to Tahiti this way, with navigator Mau Piailug, and showed such voyages could be made on purpose." ] },
  ],
};
