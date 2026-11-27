// The Night Watch catalogue: what Keeper Altair can send you to observe, and what each one's plate can teach.
// Positions are J2000 right ascension and declination in degrees (good to a fraction of a degree, plenty for the
// naked eye and a small telescope). Every note is a real, checkable fact. The Moon and planets come from planets.js.
//
// kind   what it is (shown on the plate and in the Observing Log)
// eye    the eyepiece that shows it best on the dome's 1,000 mm telescope: low 32 mm (31x), mid 12 mm (83x), high 6 mm (167x)
// plate  the Plate Room test: "spectrum" (sort into O B A F G K M), "light" (time a variable star), "count" (how many
//        stars a double really is), "parallax" (a near star's distance), "type" (what a fuzzy Messier object is),
//        "blink" (spot the planet that moved), "phase" (name the Moon's phase), "moons" (Jupiter's four big moons)

export const TELESCOPE_MM = 1000;
export const EYEPIECES = [
  { id: "low", mm: 32, name: "32 mm wide-field", note: "Low power, wide view: for big clusters, the Moon whole and anything faint and spread out." },
  { id: "mid", mm: 12, name: "12 mm", note: "Middle power: for small nebulae and tight star clusters." },
  { id: "high", mm: 6, name: "6 mm", note: "High power: for planets and close double stars. It magnifies the shimmer of the air too." },
];
export const magnification = (ep) => Math.round(TELESCOPE_MM / ep.mm);

export const CLASSES = ["O", "B", "A", "F", "G", "K", "M"];
/** What each class looks like in a spectroscope (the Harvard scheme, ordered hot to cool). */
export const CLASS_INFO = {
  O: { temp: "above 30,000 K", colour: "blue", lines: "Lines of ionised helium; weak hydrogen lines." },
  B: { temp: "10,000 to 30,000 K", colour: "blue-white", lines: "Neutral helium lines, hydrogen lines growing." },
  A: { temp: "7,500 to 10,000 K", colour: "white", lines: "The strongest hydrogen lines of any class." },
  F: { temp: "6,000 to 7,500 K", colour: "yellow-white", lines: "Hydrogen weaker; lines of ionised calcium growing." },
  G: { temp: "5,200 to 6,000 K", colour: "yellow", lines: "Strong calcium lines and many metal lines. The Sun is a G star." },
  K: { temp: "3,700 to 5,200 K", colour: "orange", lines: "Metal lines dominate; hydrogen lines faint." },
  M: { temp: "below 3,700 K", colour: "red", lines: "Broad dark bands of titanium oxide." },
};
export const SPECTRUM_FACT = "Annie Jump Cannon put the classes in the order O B A F G K M at Harvard and classified about 350,000 stars by hand.";

export const TYPES = ["Open cluster", "Globular cluster", "Galaxy", "Nebula", "Planetary nebula", "Supernova remnant"];

export const TARGETS = [
  // ---- bright stars: spectra ----
  { id: "sirius", name: "Sirius", ra: 101.29, dec: -16.72, mag: -1.46, kind: "Star", eye: "high", plate: "spectrum", cls: "A", ly: 8.6,
    note: "The brightest star in the night sky, 8.6 light-years away. In ancient Egypt its first dawn rising marked the Nile flood." },
  { id: "vega", name: "Vega", ra: 279.23, dec: 38.78, mag: 0.03, kind: "Star", eye: "high", plate: "spectrum", cls: "A", ly: 25,
    note: "In July 1850 Vega became the first star other than the Sun to be photographed, at Harvard." },
  { id: "betelgeuse", name: "Betelgeuse", ra: 88.79, dec: 7.41, mag: 0.5, kind: "Red supergiant", eye: "high", plate: "spectrum", cls: "M", ly: 550,
    note: "A red supergiant so large that, put where the Sun is, it would reach past the orbit of Mars. It dimmed sharply in early 2020." },
  { id: "rigel", name: "Rigel", ra: 78.63, dec: -8.2, mag: 0.13, kind: "Blue supergiant", eye: "high", plate: "spectrum", cls: "B", ly: 860,
    note: "Orion's blue-white foot. Its name comes from the Arabic for 'the foot'." },
  { id: "arcturus", name: "Arcturus", ra: 213.92, dec: 19.18, mag: -0.05, kind: "Orange giant", eye: "high", plate: "spectrum", cls: "K", ly: 37,
    note: "Light from Arcturus was used to switch on the lights of the 1933 Chicago World's Fair." },
  { id: "capella", name: "Capella", ra: 79.17, dec: 46.0, mag: 0.08, kind: "Pair of yellow giants", eye: "high", plate: "spectrum", cls: "G", ly: 43,
    note: "Two yellow giant stars orbiting each other every 104 days, too close to split in a telescope." },
  { id: "procyon", name: "Procyon", ra: 114.83, dec: 5.22, mag: 0.34, kind: "Star", eye: "high", plate: "spectrum", cls: "F", ly: 11.5,
    note: "Its name is Greek for 'before the dog': it rises just before Sirius, the Dog Star." },
  { id: "antares", name: "Antares", ra: 247.35, dec: -26.43, mag: 1.0, kind: "Red supergiant", eye: "high", plate: "spectrum", cls: "M", ly: 550,
    note: "The name means 'rival of Mars', for its red colour." },
  { id: "aldebaran", name: "Aldebaran", ra: 68.98, dec: 16.51, mag: 0.86, kind: "Orange giant", eye: "high", plate: "spectrum", cls: "K", ly: 65,
    note: "Arabic for 'the follower': it rises after the Pleiades." },
  { id: "alnitak", name: "Alnitak", ra: 85.19, dec: -1.94, mag: 1.77, kind: "Blue supergiant", eye: "high", plate: "spectrum", cls: "O", ly: 1260,
    note: "The eastern star of Orion's belt, one of the hottest stars you can see without a telescope." },
  { id: "altair", name: "Altair", ra: 297.7, dec: 8.87, mag: 0.76, kind: "Star", eye: "high", plate: "spectrum", cls: "A", ly: 16.7,
    note: "It spins about once every nine hours, so fast that it bulges at the middle. Keeper Altair is named after it." },
  { id: "spica", name: "Spica", ra: 201.3, dec: -11.16, mag: 0.98, kind: "Blue giant pair", eye: "high", plate: "spectrum", cls: "B", ly: 250,
    note: "Hipparchus noticed the precession of the equinoxes around 130 BC by comparing Spica's position with older records." },
  { id: "polaris", name: "Polaris", ra: 37.95, dec: 89.26, mag: 1.98, kind: "Supergiant", eye: "high", plate: "spectrum", cls: "F", ly: 430,
    note: "Less than a degree from the north celestial pole, so it hardly moves all night. Its height above the horizon is roughly your latitude." },
  { id: "acen", name: "Alpha Centauri", ra: 219.9, dec: -60.83, mag: -0.27, kind: "Triple star", eye: "high", plate: "spectrum", cls: "G", ly: 4.37,
    note: "The nearest star system to the Sun, 4.37 light-years away. Its brightest star is a G star, like the Sun." },
  // ---- variable stars: light curves ----
  { id: "algol", name: "Algol", ra: 47.04, dec: 40.96, mag: 2.1, kind: "Eclipsing binary", eye: "low", plate: "light", period: 2.867, periodText: "2 days 21 hours",
    note: "Every 2 days 21 hours a dimmer companion passes in front of it and it fades for about 10 hours. John Goodricke suggested the eclipse in 1783." },
  { id: "delcep", name: "Delta Cephei", ra: 337.29, dec: 58.42, mag: 3.5, kind: "Cepheid variable", eye: "low", plate: "light", period: 5.366, periodText: "5 days 9 hours", ly: 890,
    note: "It swells and shrinks every 5.37 days. Henrietta Leavitt found in 1912 that a Cepheid's period gives its true brightness, and so its distance." },
  // ---- double stars: counting ----
  { id: "mizar", name: "Mizar and Alcor", ra: 200.98, dec: 54.93, mag: 2.2, kind: "Double star", eye: "low", plate: "count", count: 3,
    note: "Alcor sits beside Mizar, a test of good eyesight. A telescope splits Mizar itself in two; in 1889 Mizar A became the first star found to be double by its spectrum." },
  { id: "albireo", name: "Albireo", ra: 292.68, dec: 27.96, mag: 3.1, kind: "Double star", eye: "low", plate: "count", count: 2,
    note: "A gold star and a blue one, easy to split in a small telescope: the gold is a K giant, the blue a hotter B star." },
  // ---- a near star: parallax ----
  { id: "61cyg", name: "61 Cygni", ra: 316.72, dec: 38.75, mag: 5.2, kind: "Double star", eye: "low", plate: "parallax", ly: 11.4,
    note: "In 1838 Friedrich Bessel measured its yearly shift, the first parallax of a star: the first true distance to a star beyond the Sun." },
  // ---- Messier objects: what is it? ----
  { id: "m45", name: "The Pleiades (M45)", ra: 56.75, dec: 24.12, mag: 1.6, kind: "Open cluster", eye: "low", plate: "type", ly: 444, messier: 45,
    note: "A young cluster of hot blue stars, about 444 light-years away. Most people see six or seven without a telescope." },
  { id: "m42", name: "The Orion Nebula (M42)", ra: 83.82, dec: -5.39, mag: 4.0, kind: "Nebula", eye: "low", plate: "type", ly: 1340, messier: 42,
    note: "A cloud where stars are being born, about 1,340 light-years away, visible as a fuzzy patch in Orion's sword." },
  { id: "m31", name: "The Andromeda Galaxy (M31)", ra: 10.68, dec: 41.27, mag: 3.4, kind: "Galaxy", eye: "low", plate: "type", ly: 2.5e6, messier: 31,
    note: "About 2.5 million light-years away, the farthest thing most people can see without a telescope. In 1923 Edwin Hubble found a Cepheid in it and proved it was a separate galaxy." },
  { id: "m13", name: "The Hercules Cluster (M13)", ra: 250.42, dec: 36.46, mag: 5.8, kind: "Globular cluster", eye: "mid", plate: "type", ly: 22200, messier: 13,
    note: "Several hundred thousand old stars packed into a ball. In 1974 the Arecibo message was beamed towards it." },
  { id: "m44", name: "The Beehive (M44)", ra: 130.1, dec: 19.67, mag: 3.7, kind: "Open cluster", eye: "low", plate: "type", ly: 577, messier: 44,
    note: "Galileo turned his telescope on it in 1609 or 1610 and counted dozens of stars where the eye sees a smudge." },
  { id: "m57", name: "The Ring Nebula (M57)", ra: 283.4, dec: 33.03, mag: 8.8, kind: "Planetary nebula", eye: "mid", plate: "type", ly: 2300, messier: 57,
    note: "A shell of gas blown off by a dying star. 'Planetary' is an old name: through early telescopes they looked like planets' discs." },
  { id: "m1", name: "The Crab Nebula (M1)", ra: 83.63, dec: 22.01, mag: 8.4, kind: "Supernova remnant", eye: "mid", plate: "type", ly: 6500, messier: 1,
    note: "What is left of a star that Chinese astronomers saw explode in 1054. Charles Messier mistook it for a comet in 1758, which set him making his list." },
  { id: "m8", name: "The Lagoon Nebula (M8)", ra: 270.9, dec: -24.38, mag: 6.0, kind: "Nebula", eye: "low", plate: "type", ly: 4100, messier: 8,
    note: "A star-forming cloud in Sagittarius, towards the centre of the Milky Way." },
  { id: "m7", name: "Ptolemy's Cluster (M7)", ra: 268.46, dec: -34.79, mag: 3.3, kind: "Open cluster", eye: "low", plate: "type", ly: 980, messier: 7,
    note: "Ptolemy described it as a nebula around 130 AD, one of the earliest deep-sky objects on record." },
  { id: "m22", name: "M22", ra: 279.1, dec: -23.9, mag: 5.1, kind: "Globular cluster", eye: "mid", plate: "type", ly: 10600, messier: 22,
    note: "One of the nearest globular clusters, about 10,600 light-years away, in Sagittarius." },
  { id: "m81", name: "Bode's Galaxy (M81)", ra: 148.89, dec: 69.07, mag: 6.9, kind: "Galaxy", eye: "low", plate: "type", ly: 1.2e7, messier: 81,
    note: "A spiral galaxy about 12 million light-years away, found by Johann Bode in 1774." },
];

/** The Moon and planets the Night Watch uses (ids from planets.js), with their plate test. */
export const WANDERERS = [
  { id: "moon", name: "The Moon", kind: "Moon", eye: "low", plate: "phase",
    note: "Galileo's 1609 drawings showed mountains and craters, proof the Moon was a rough world, not a perfect sphere." },
  { id: "venus", name: "Venus", kind: "Planet", eye: "high", plate: "blink",
    note: "Galileo saw Venus go through phases like the Moon in 1610, evidence that it goes round the Sun." },
  { id: "mars", name: "Mars", kind: "Planet", eye: "high", plate: "blink",
    note: "Kepler used Tycho Brahe's records of Mars to show, in 1609, that planets move in ellipses." },
  { id: "jupiter", name: "Jupiter", kind: "Planet", eye: "high", plate: "moons", count: 4,
    note: "Galileo found its four big moons in January 1610. Ole Rømer timed Io's eclipses to show, in 1676, that light takes time to travel." },
  { id: "saturn", name: "Saturn", kind: "Planet", eye: "high", plate: "blink",
    note: "Christiaan Huygens worked out in 1659 that Saturn's odd 'ears' were a thin flat ring." },
];

export const targetById = (id) => TARGETS.find((t) => t.id === id) || WANDERERS.find((t) => t.id === id) || null;
export const ALL_IDS = [...TARGETS, ...WANDERERS].map((t) => t.id);
export const MESSIER_COUNT = 110;
