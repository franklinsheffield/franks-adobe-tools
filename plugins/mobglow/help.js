"use strict";
// Halo Lab 3.0 hover help: one entry per control (tests fail on a missing one).
// Shared controls (preview, looks, output, Colour Deck, Apply) are in core/help-text.js.
module.exports = {
  "tab:Glow": "Glow: the dreamy light that blooms out of the bright parts of the picture.",
  "card:Glow": "The dreamy light that blooms out of the bright parts of the picture.",
  "btn:Render": "Applies the glow to the document, the same as Render under Output. One undo step.",
  "key:image": "Glow source: the flattened image or only the active layer. Click to switch.",
  "key:drop": "Pick the glow colour: click this key, then click a spot in the preview.",
  "key:brush": "Paint the glow away: adds a mask to the Glow layer of the last Render and picks the Brush tool in black.",
  "glow.radius": "How far the glow spreads from bright areas, in pixels. Big values give a soft haze over the whole picture.",
  "glow.strength": "How bright the glow is.",
  "glow.threshold": "Which tones glow. Raise it so only the brightest highlights bloom; lower it so mid-tones glow too.",
  "glow.gamma": "Shapes the glow's falloff. Low values keep a wide gentle haze; high values keep it tight around the lights.",
  "glow.sat": "Colour strength of the glow. 0 gives a white glow; 100 keeps the full colour of the lights.",
  "color.on": "Tints the glow with one colour instead of the colours of the lights.",
  "color.hex": "The tint colour for the glow. Use the dropper key to pick it from the preview.",
  "tab:Finish": "Finish: film grain and a darker background to make the glow stand out.",
  "card:Finish": "Film grain and a darker background to make the glow stand out.",
  "finish.grain": "Fine film-like noise over the result.",
  "finish.darken": "Darkens the picture under the glow so the light pops more."
};
