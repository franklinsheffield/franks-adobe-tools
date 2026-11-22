# Frank's Paint Brew

Turns a photo into an editable oil painting, watercolour or impressionist painting. Part of Frank's Brew suite (UXP panel, Photoshop 24.4+).

## Styles and layers

| Style | Layers (bottom to top) |
| --- | --- |
| Oil | Underpainting, Broad strokes, Detail strokes, Impasto light (Overlay), Canvas weave (Overlay) |
| Watercolour | Paper colour, Washes, Wet edges, Granulation, Pencil, Splashes (when on), Paper texture (Overlay); all Multiply unless noted |
| Impressionism | Ground, Large dabs, Medium dabs, Fine detail, Light and colour lift (Soft Light), Canvas weave (Overlay) |

Strokes follow the edges in the photo (structure-tensor flow field) and are laid coarse to fine, each pass only where the canvas still differs from the photo. Everything is seeded, so the same settings always give the same painting. Change **Variation** for a different stroke layout.

## Size and print

Brush sizes are in px for a 3000 px image and scale with yours, so the preview and the result match.
With **Print-ready copy** on, a photo whose long side is under the minimum (2500 px for Oil and Impressionism, 3000 px for Watercolour) is duplicated, upscaled (Preserve Details), set to 300 ppi 8-bit RGB, and painted there. The original is never changed.

## Focus

Make a selection, or put a mask on the source layer, and pick it under **Focus > Subject**. Strokes stay small and detailed inside; outside, paint gets looser and watercolour fades to paper.

## Files

`js/engine.js` (pure JS, no Photoshop calls), `js/state.js` (defaults + 9 looks), `js/paintps.js` (print copy, focus reading), `main.js` (panel on `core/toolpanel.js`).
