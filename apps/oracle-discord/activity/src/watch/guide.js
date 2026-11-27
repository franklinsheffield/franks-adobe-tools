// The Night Watch study guide: how the three steps work and the real methods behind them.
// Original text for Science is Magic. Markup limited to <b> and <i>; read by study.js.
export const GUIDE = {
  title: "The Night Watch study guide",
  sections: [
    { h: "How to play", p: [
      "<b>1. Night Watch.</b> The dome shows tonight's real sky over your city: the zenith in the middle, the horizon at the rim, north up and east on the left, as you see it looking up. Pick a target, then choose the eyepiece that shows it best. Three tries. A good log goes in your <b>Observing Log</b>.",
      "<b>2. Plate Room.</b> Every logged object becomes a glass plate. Measure it with a real method. First try earns 3 stars, second 2, after that 1.",
      "<b>3. Almanac Desk.</b> Three clients a day, the same for everyone in the channel. <b>Hard jobs</b> need a Plate Room result, so they chain the whole loop.",
      "<b>Tonight's Target</b> changes every day. Log it for a bonus. Anything not up tonight can still be logged from the <b>Archive</b> at half pay.",
      "Only your nearest <b>city</b> is used for the sky. Nothing more precise is asked for or saved.",
    ] },
    { h: "Finding things in the sky", p: [
      "A fist held at arm's length covers about <b>10 degrees</b> of sky. The horizon is 0°, straight up is 90°.",
      "Eyes need about <b>20 to 30 minutes</b> in the dark to see faint things. A <b>red torch</b> keeps that, because the rods that see in the dark barely respond to red light.",
      "<b>Magnification</b> = the telescope's focal length ÷ the eyepiece's. On a 1,000 mm telescope a 32 mm eyepiece gives 31×, 12 mm gives 83× and 6 mm gives 167×.",
      "Low power for big, faint things (clusters, the Andromeda Galaxy, the Moon whole). High power for small, bright things (planets, close doubles). Too much power spreads a faint object's light until it vanishes.",
    ] },
    { h: "The Plate Room's methods", p: [
      "<b>Spectra:</b> a star's light spread into a rainbow shows dark lines. Their pattern sorts stars into the classes <b>O B A F G K M</b>, hottest to coolest. Annie Jump Cannon set this order at Harvard and classified about 350,000 stars.",
      "<b>Light curves:</b> Algol fades every 2 days 21 hours when a dimmer companion passes in front of it. Delta Cephei pulses every 5.37 days. <b>Henrietta Leavitt</b> found in 1912 that a Cepheid's period tells its true brightness, so its distance.",
      "<b>Parallax:</b> a near star shifts against far ones as Earth goes round the Sun. <b>Friedrich Bessel</b> measured 61 Cygni's shift in 1838, the first distance to a star.",
      "<b>Blinking:</b> flip between two plates of the same field taken nights apart. What moves is in the Solar System. Clyde Tombaugh found Pluto this way in February 1930.",
      "<b>Messier objects:</b> Charles Messier listed fuzzy things that are <i>not</i> comets so comet hunters wouldn't be fooled. His final list has 110: clusters, nebulae and galaxies.",
    ] },
    { h: "The Almanac Desk's sky facts", p: [
      "In the north, <b>Polaris's height</b> above the horizon is roughly your latitude.",
      "<b>Earth turns 15° an hour</b>, so each hour between your noon and Greenwich's is 15° of longitude. John Harrison's H4 chronometer made that work at sea.",
      "A <b>sundial and a clock</b> can differ by up to about 16 minutes: the equation of time, from Earth's tilt and oval orbit.",
      "<b>Leap years:</b> every 4th year, except century years that don't divide by 400 (the Gregorian rule of 1582).",
      "<b>The saros:</b> eclipses repeat after about 18 years 11 days 8 hours. <b>The Metonic cycle:</b> the Moon's phases repeat on the same dates every 19 years.",
    ] },
  ],
};
