// Phantasmagoria: you run a ghost show with the real optics. Level 1: a magic lantern projecting on smoke, rolled
// back to make the ghost grow (Robertson's Fantasmagorie, Paris, 1798). Level 2: Pepper's ghost, a hidden actor
// reflected in a tilted sheet of glass (London, 1862). Level 3: a timed show, every cue on the beat of the music.
// Every ghost is a picture of light, and the game shows exactly how it was made.

/** Lantern: the ghost's height grows in step with the lantern's distance from the smoke. */
export const SCALE = 0.5; // metres of ghost per metre of distance, for our slide and lens
export const DIST = { min: 1, max: 8, step: 0.1 }, LANTERN_TOL = 0.1;
export const ghostHeight = (d) => Math.round(d * SCALE * 100) / 100;
export const LANTERN_ASKS = [
  { h: 0.6, ask: "A tiny imp, 0.6 m tall, perched on the smoke." }, { h: 1.0, ask: "A child's ghost, 1 m tall." },
  { h: 1.7, ask: "Life size: a spectre 1.7 m tall." }, { h: 2.5, ask: "A tall shade, 2.5 m, looming over the front row." },
  { h: 3.5, ask: "A giant, 3.5 m, rushing at the audience!" }, { h: 1.2, ask: "A floating head and shoulders, 1.2 m." },
  { h: 2.0, ask: "A knight in armour, 2 m tall." }, { h: 0.8, ask: "An owl with burning eyes, 0.8 m across." },
];
export const LANTERN_FACTS = [
  "Twice the distance makes the ghost twice as tall, and four times dimmer: the same light spread over four times the area.",
  "Robertson's Fantasmagorie opened in Paris in 1798. His lantern ran on wheels behind the screen, so the ghost grew as it rolled back.",
  "Paul Philidor showed a 'Phantasmagorie' in Paris in the early 1790s, a few years before Robertson.",
  "Slides were painted on glass with a black background, so only the figure lit up the smoke.",
  "Phantasmagoria shows projected on smoke or on a thin screen between the lantern and the audience, so nobody saw the lantern.",
  "Robertson's shows used the eerie sound of a glass harmonica, the instrument Benjamin Franklin invented in 1761.",
];

/** Pepper's ghost: an actor lying below the stage, reflected in glass tilted θ from the floor, appears tilted 2θ. */
export const ANGLE = { min: 20, max: 70, step: 1 }, PEPPER_TOL = 3;
export const ghostTilt = (glass) => glass * 2;
export const PEPPER_ASKS = [
  { tilt: 90, ask: "The ghost must stand upright, like a living person." }, { tilt: 80, ask: "A weary ghost, leaning back a little (80°)." },
  { tilt: 100, ask: "A ghost bending toward the audience (100°)." }, { tilt: 70, ask: "A drunken spectre, leaning well back (70°)." },
  { tilt: 110, ask: "A ghost lunging at the front row (110°)." }, { tilt: 60, ask: "A ghost reclining on the air (60°)." },
];
export const PEPPER_FACTS = [
  "A mirror reflects at equal angles, so tilting the glass by θ turns the reflected actor by 2θ. 45° makes a lying actor stand up.",
  "Henry Dircks invented the illusion in 1858; John Henry Pepper made it work in a real theatre.",
  "Pepper showed it at the Royal Polytechnic Institution in London at Christmas 1862, in a scene from Dickens's The Haunted Man.",
  "The actor below the stage is lit brightly; the stage behind the glass is kept dim, so the reflection looks solid.",
  "Turn the hidden actor's light down and the ghost fades away. Turn it up and it appears from nowhere.",
  "Disney's Haunted Mansion (1969) uses Pepper's ghost for its dancing ballroom ghosts.",
];

/** The timed show: a cue sheet played against the music. */
export const CUE_KINDS = [
  { id: "appear", e: "👻", name: "Ghost appears" }, { id: "grow", e: "🔍", name: "Lantern rolls back" }, { id: "thunder", e: "⛈️", name: "Thunder sheet" },
  { id: "fade", e: "🌫️", name: "Fade out" }, { id: "skull", e: "💀", name: "Skull slide" }, { id: "dissolve", e: "🎞️", name: "Dissolving view" },
];
export const SHOW = { acts: 3, cues: 6, len: 9000, perfect: 120, good: 280, pass: 4 };
export const SHOW_FACTS = [
  "Showmen ran from a cue sheet: every slide change and sound effect was timed to the music.",
  "A 'thunder sheet' is a large hanging sheet of metal; shake it and the hall fills with thunder.",
  "Dissolving views, one lantern image fading into another, were popular in London from around 1840.",
];

/** Levels. */
export const LEVELS = [
  { n: 1, name: "Lantern on smoke", what: "Roll the magic lantern to make each ghost the right size", mult: 1, rounds: 5, kind: "lantern",
    open: "Paris, 1798. The candles go out, smoke rises from a brazier, and behind it your lantern waits on its wheels." },
  { n: 2, name: "Pepper's ghost", what: "Tilt the hidden glass so the actor below appears as a ghost", mult: 1.5, rounds: 5, kind: "pepper",
    open: "London, Christmas 1862. A sheet of glass leans across the stage. Your actor lies in the pit below, waiting for the light." },
  { n: 3, name: "The timed show", what: "Fire every cue on the beat, in three acts", mult: 2, rounds: SHOW.acts, kind: "show",
    open: "Tonight the whole show runs to music. Watch the cue sheet and fire each effect as the needle reaches it." },
];

/** Show night (multiplayer): the ghost slides and effects players stage for the vote. */
export const SLIDES = [
  { id: "spectre", e: "👻", name: "The pale spectre" }, { id: "skeleton", e: "💀", name: "The dancing skeleton" }, { id: "nun", e: "🕯️", name: "The Bleeding Nun" },
  { id: "owl", e: "🦉", name: "The owl with burning eyes" }, { id: "devil", e: "😈", name: "The little devil" },
];
export const EFFECTS = [
  { id: "grow", e: "🔍", name: "Grow from nothing", how: "The lantern rolls back on its wheels" }, { id: "rush", e: "💨", name: "Rush at the crowd", how: "Roll back fast and refocus" },
  { id: "fade", e: "🌫️", name: "Fade in from smoke", how: "Open the lantern's shutter slowly" }, { id: "pepper", e: "🪞", name: "Step out of the glass", how: "Raise the light on the hidden actor" },
];
