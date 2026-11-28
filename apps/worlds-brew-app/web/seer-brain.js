// Pixel Scape web build: Surveyor Flint's words. What he says when he pops in (light trash talk about your build), and
// how he answers questions: no AI, a word match over Pixel Scape's own help text (renderer/help-app.js) and the FAQ
// below, which knows where each control lives so he can show you. Plain data + pure functions (tested in the browser).
export const PACK = {
  id: "pixelscape", name: "Surveyor Flint", pron: "he", colour: "#5effc8", icon: "📐",
  voice: { type: "square", base: 200, step: 24, vowel: 60, dur: 0.035, lp: 2400, harm: [2, 0.18], brand: "survey beacon", sting: [[200, 0.08], [267, 0.08]] },
};

// the one-person gimmick: slips from the Houses team (each carries a real fact)
export const SLIPS = [
  "Ask the Oracle— ask the map. Landsat 1 started imaging Earth in 1972. Look it up.",
  "Goggles on— visor on. Sentinel-2 sees in 13 bands. I learned that in a lab. Somewhere.",
  "Every mark means something— every pixel. Sentinel-2's sharpest pixels are 10 m. Tiny.",
  "The candle flickered— the cursor. GPS needs signals from at least 4 satellites. Spooky.",
  "Look up— down. Look DOWN. Everest is 8,849 m high, measured in 2020. Stars are elsewhere.",
  "Darling, that ridge— buddy. Water carved the Grand Canyon over millions of years.",
  "We've never met. I'd remember that hat. Mercator drew his famous map projection in 1569.",
  "Five hats? I wear one. A hard hat. Contour lines first appeared on maps in the 1700s.",
];

// pop-in lines by event; {n} {name} {kind} {place} {range} {km} are filled in
export const LINES = {
  hello: ["Surveyor Flint. I do maps. Tap me if you get lost, and you will.", "Flint, surveyor. I'll be over here, judging your terrain quietly. Mostly quietly."],
  first: ["A {kind}. Bold. Nobody has ever thought of a {kind} before.", "One {kind}. It's a start. A very small start.", "First piece down. The survey begins. Lower your expectations, I have."],
  same: ["{n} {kind}s. Are we building a world or a {kind} collection?", "Another {kind}? I'm starting to see a theme. The theme is {kind}.", "{n} {kind}s. Bold of you to commit."],
  busy: ["{n} things. Your phone fan would like a word.", "This is getting crowded. Even my clipboard is sweating.", "{n} objects. Somebody call the zoning board."],
  floating: ["That {kind} is floating. Magic, or you turned off Stick to ground?", "Gravity called. It says your {kind} owes it money."],
  deleted: ["Deleting is building too. Technically.", "Bye, little things. You were not up to code.", "Clearing the site. Bold strategy."],
  terrain: ["Ooh, dirt. The foundation of every great empire.", "Terrain! Now we're surveying.", "Land ahoy. Mind the edges, it drops off fast."],
  place: ["{place}: {range} m from lowest to highest in this {km} km box. Your build might come second.", "{place}. Real ground, real heights: {range} m of climb. Don't put a sphere on it.", "{place}, {km} km across. I've surveyed worse. Not many."],
  water: ["Water! Everything looks better next to water. Even that.", "Water on. Now it's waterfront property. Price just doubled."],
  night: ["Night time. Mysterious. Or you can't see the mistakes now.", "Lights out. Very moody. Very convenient."],
  render: ["Rendered. Frame it, post it, pretend it took hours.", "Nice render. The lighting is doing a lot of the work, but nice.", "Picture done. Your gran would put it on the fridge."],
  explore: ["A walking tour of your own work. Humble.", "Explore mode. Watch your step, some of this is still under construction."],
  undo: ["Undo, undo, undo. The time traveller's build method.", "Going back in time again? Rewrite history, why don't you."],
  idle: ["Still there? The sky's been the same colour for ages.", "I can wait. Surveyors are patient. Mostly.", "Need an idea? Tap me. I have hundreds, most of them maps."],
  empty: ["It's very... minimalist. Want ideas? Tap me.", "An empty world. Peaceful. Suspiciously peaceful."],
  joined: ["{name} is here. Quick, hide the bad parts.", "{name} joined. Two builders, twice the opinions."],
  ping: ["Someone pinged a spot. Probably wants a tower there. They always want a tower."],
};

// "how do I" answers; show = what to point at: { key } (a control's help key) or { sel } (CSS) + the panel it lives in
export const FAQ = [
  { k: "add shape sphere cube object thing put place new model", a: "Drag a shape or model from Add (Library on the left on a computer) into the view, or tap it to drop it in front of the camera.", show: { key: "card:Add", panel: "lib" } },
  { k: "move drag position shift slide object", a: "Select it, pick Move (W) and drag it in the view. Stick to ground keeps it standing on the land.", show: { key: "view.gizmo", panel: null } },
  { k: "rotate turn spin angle", a: "Select it and pick Rotate (E), then drag the ring handles. On a phone the handles are extra big.", show: { key: "view.gizmo", panel: null } },
  { k: "scale size bigger smaller resize grow shrink", a: "Select it and pick Scale (R), or set a real height in metres in Edit > Scale.", show: { key: "tab:Scale", panel: "insp" } },
  { k: "real place map terrain earth satellite city mountain location", a: "Make > A real place opens Terrain Lab: pick a spot on the map, Preview, then Build and Add to scene.", show: { sel: ".ps-make-btn", panel: null } },
  { k: "buildings city houses real buildings", a: "Make > Real buildings opens Terrain Lab with real building outlines and heights switched on.", show: { sel: ".ps-make-btn", panel: null } },
  { k: "photo picture camera image wrap texture put on cube sphere object onto", a: "Select a thing, then Make > Photo on a thing. On a phone you can take the photo with the camera.", show: { sel: ".ps-make-btn", panel: null } },
  { k: "my photo drone aerial map photo", a: "Make > My photo on the map drapes your own aerial or drone shot over the real ground in Terrain Lab.", show: { sel: ".ps-make-btn", panel: null } },
  { k: "3d library models download tree ship chair free", a: "The 3D library card under Add has thousands of free models. Search, then tap one to add it.", show: { key: "view.kitQ", panel: "lib" } },
  { k: "import upload file glb obj stl gltf my own model", a: "Make > A model file adds your own .glb, .gltf, .obj or .stl.", show: { sel: ".ps-make-btn", panel: null } },
  { k: "render picture screenshot png export image final", a: "Render (or Render PNG) draws the camera view at the output size. Set the size and quality in the render bar.", show: { key: "btn:Render PNG", panel: "bar" } },
  { k: "post share discord channel show friends", a: "In a call, Post render puts your picture in the channel with a Remix button. It carries this week's theme.", show: { sel: ".ps-room-row", panel: null } },
  { k: "save keep library server scene", a: "Save in the room bar keeps the shared scene in this server's library. On your own, File > Save.", show: { sel: ".ps-room-row", panel: null } },
  { k: "undo mistake back oops revert", a: "Undo (Cmd/Ctrl+Z) under File. In a call it only undoes your own edits.", show: { key: "btn:Undo", panel: "menu" } },
  { k: "delete remove erase", a: "Select it and press Delete or Backspace. On a phone: Edit, then Delete.", show: null },
  { k: "camera look around zoom view orbit pan", a: "Drag the view to look around, right-drag (two fingers on a phone) to slide, scroll or pinch to zoom. The ball top right snaps to views.", show: null },
  { k: "explore walk fly first person tour", a: "Explore hides the panels so you can fly or walk: WASD, Q/E, arrows, or the on-screen pad.", show: { sel: ".ps-mode", panel: null } },
  { k: "follow friend view where looking", a: "Tap a builder's name in the room bar to follow their view. Touch the view to stop.", show: { sel: ".ps-room-people", panel: null } },
  { k: "ping mark point spot show friends here", a: "Long-press the ground to ping a spot. Everyone in the call sees it pulse.", show: null },
  { k: "sculpt terrain raise lower hill dig", a: "Select a terrain, pick Sculpt (B) and brush over it. Brush size and strength are in Edit > Shape.", show: { key: "tab:Shape", panel: "insp" } },
  { k: "sky time sunset night clouds fog weather", a: "Edit > Sky sets the sky, haze, clouds and fog; Edit > Light moves the sun.", show: { key: "tab:Sky", panel: "insp" } },
  { k: "water sea lake ocean waves", a: "Edit > Water turns on the water plane: level, waves, foam and colour.", show: { key: "tab:Water", panel: "insp" } },
  { k: "material colour color surface paint", a: "Edit > Material sets the surface: preset, colour, pattern and bump.", show: { key: "tab:Material", panel: "insp" } },
  { k: "together multiplayer friends call join room", a: "Open Pixel Scape in a Discord call and everyone in it builds the same scene, live. Up to 8 builders.", show: null },
  { k: "theme weekly challenge points", a: "This week's build theme is in the room bar. Posted renders carry it so the mods can spot theme builds.", show: { sel: ".ps-room-theme", panel: null } },
  { k: "remix posted render open copy", a: "Every posted render has a Remix button. It opens a copy of that scene in the call.", show: null },
  { k: "new blank start over empty", a: "File > New starts an empty world. In a call that replaces the shared scene for everyone.", show: { key: "btn:New", panel: "menu" } },
  { k: "slow lag stutter quality performance", a: "Auto quality drops the sharpness when the view stutters and brings it back when it can. Fewer big models helps too.", show: null },
  { k: "who are you flint surveyor seer help", a: "Surveyor Flint. I do maps. Ask me how to do anything in Pixel Scape and I'll point at it.", show: null },
];

// Teach mode: what the web build's own controls do (the app's controls use their hover-help text)
export const TEACH = [
  { sel: "#vp", name: "The 3D view", a: "Your world. Drag to look around, right-drag or two fingers to slide, scroll or pinch to zoom. Tap a thing to select it. Long-press the ground to ping." },
  { sel: ".ps-mode", name: "Explore / Build", a: "Explore hides the panels so you can fly or walk through your world. Build brings the panels back." },
  { sel: ".ps-make-btn", name: "Make", a: "Everything that makes something new: a real place, your photo on the map, real buildings, the 3D library, a model file, a photo on a thing." },
  { sel: ".ps-xpad", name: "Move pad", a: "Hold an arrow to move: forward, back, turn, up and down. Fly or Walk switches how you move." },
  { sel: '[data-tab="lib"]', name: "Add", a: "Opens the library: ready-made scenes, shapes, models and the 3D library." },
  { sel: '[data-tab="insp"]', name: "Edit", a: "Opens the Inspector for the selected thing: size, material, surfaces, light, water, sky and camera." },
  { sel: '[data-tab="pad"]', name: "Move", a: "Opens the move pad: nudge, raise, spin and size the selected thing, and steer the camera." },
  { sel: '[data-tab="bar"]', name: "Render", a: "Opens the render bar: picture size, quality and Render." },
  { sel: '[data-tab="menu"]', name: "File", a: "New, Open, Save, Import, Terrain Lab, Undo and Redo." },
  { sel: ".ps-chip[data-sid]", name: "A builder", a: "Someone in your call. Tap their name to follow their view; touch the view to stop." },
  { sel: ".ps-room-theme", name: "Weekly theme", a: "This week's build theme. Posted renders carry it so the mods can spot theme builds." },
  { sel: ".ps-room-row button", name: "Room buttons", a: "Save keeps the shared scene in the server library, Library opens saved scenes and places, Post render puts your picture in the channel." },
  { sel: ".ps-room-lib", name: "Server library", a: "Scenes and real places saved by this server. Open replaces the shared scene; Look opens a place in Terrain Lab." },
];

export const TOPICS = ["Add things", "Real place", "Move it", "Render", "Post", "Explore", "Ping", "Undo"];

const STOP = new Set("a an the i do how can to of in on my it is what where why when this that with for and or me you your does at be get make".split(" "));
const SYN = { colour: "color", photograph: "photo", picture: "photo", image: "photo", pic: "photo", bigger: "scale", smaller: "scale", size: "scale", turn: "rotate", spin: "rotate", drag: "move",
  land: "terrain", dirt: "terrain", share: "post", erase: "delete", remove: "delete", screenshot: "render", export: "render", friends: "friend", models: "model", buildings: "building" };
export const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).map((w) => {
  let x = SYN[w] || w; if (x.length > 4 && x.endsWith("ing")) x = x.slice(0, -3); else if (x.length > 3 && x.endsWith("s") && !x.endsWith("ss")) x = x.slice(0, -1); return SYN[x] || x;
});
const has = (ws, w) => ws.includes(w) || ws.some((x) => x.length > 4 && w.length > 4 && (x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5))));

// question -> ranked answers [{ a, show, from, score }]
export function ask(q, help) {
  const qw = words(q); if (!qw.length) return [];
  const out = [];
  for (const f of FAQ) { const kw = words(f.k), aw = words(f.a); let s = 0; for (const w of qw) s += has(kw, w) ? 3 : has(aw, w) ? 1 : 0; if (s) out.push({ a: f.a, show: f.show, from: "faq", score: s + 0.5 }); }
  for (const key in help || {}) {
    const text = help[key]; if (typeof text !== "string") continue;
    const name = key.replace(/^(btn|card|tab):/, "").replace(/^[a-z]+\./, "").replace(/([a-z])([A-Z])/g, "$1 $2"), nw = words(name), tw = words(text); let s = 0;
    for (const w of qw) s += has(nw, w) ? 2 : has(tw, w) ? 0.7 : 0;
    if (s >= 1.4) out.push({ a: (key.startsWith("btn:") ? name + ": " : key.startsWith("card:") || key.startsWith("tab:") ? name + ": " : "") + text, show: { key, panel: null }, from: "help", score: s });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 4);
}

const pick = (a, rnd) => a[Math.floor((rnd || Math.random)() * a.length) % a.length];
export function line(kind, vars, rnd) {
  const L = LINES[kind]; if (!L) return null;
  return pick(L, rnd).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m));
}
export const slip = (rnd) => pick(SLIPS, rnd);
export const kindName = (o) => (o && (o.type === "model" || o.type === "mesh") ? "model" : (o && o.type) || "thing");
