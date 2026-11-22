# Frank's Dithers Brew 1.1

A Photoshop panel for dither, halftone, ASCII and print-separation looks. Your artwork is never touched: results are written as new layers (transparent paper, one layer per ink) inside a single layer group, with one undo step.

## New in 1.1

- **Line Art algorithms (8):** Wave Scan, Wave Amplitude, Line Weight engraving, Contour Lines, Spiral, Ripple, Stipple (blue noise), Crosswave. Pick them under Dither.
- **Algorithm strip:** thumbnails of every algorithm for the current engine, rendered on a sphere. Click to pick.
- **Tune card:** Threshold (all engines except Grade), Strength (error diffusion, ordered, wave bend), Direction, Spacing, Weight, Jitter. Threshold 50 / Strength 100 is the 1.0 look.
- **Scale:** one Scale slider for Dither and ASCII.
- **Image card (always on screen):** 3-handle Levels (black / mid / white), Sharpen to 200% with Radius, Noise -/+ (minus smooths), Haze, Invert amount; Brightness, Contrast, Blur under More. Bypass switches the card off. Replaces the Pre-process pill.
- **Pickers:** tone maps as colour strips; Look browser renders every built-in look on your image.
- **Print row:** DTF toggle and a DPI override (changes LPI / mm maths only, never resamples).
- **Live drag:** while a slider is held the preview renders half-size frames from the cached source; the full preview follows on release.
- **40 built-in looks** (8 new Line Art). Every 1.0 look and saved look renders exactly as before.

## Install

**Developer load (most reliable for an unsigned plugin)**
1. Install *UXP Developer Tool* from Creative Cloud Desktop (Apps > All apps > Developer tools).
2. Open it, choose **Add Plugin**, and pick `manifest.json` from the unzipped `franks-dithers-brew` folder.
3. Start Photoshop (24.4 or newer), click **Load** next to the plugin in the UXP tool.
4. The panel appears under **Plugins > Frank's Dithers Brew**.

**Double-click install:** `franks-dithers-brew.ccx` is the same folder zipped. Double-clicking it hands it to Creative Cloud; some setups refuse unsigned packages, in which case use the developer load above.

## First-run checklist (I could not run Photoshop while building this)

1. The panel opens and shows a **demo image preview** with no document open.
2. Open any image. Click **Refresh**. The preview now shows your artwork as a halftone.
3. Click **Apply to document**. A group named `Brew - Round Dot 35 LPI` appears with an ink layer.

If something misbehaves, open the UXP Developer Tool's **Debug** console and send me the red error text. The three spots I would check first: the preview image (it is a PNG data URL), the RGBA layer write (there is an automatic Multiply fallback), and layer-group creation (there is a fallback that moves layers in one by one).

## What it does

**Effect type buttons** (exclusive): Halftone / Dither / ASCII
**Colour mode buttons** (exclusive): Mono / Tonal / Grade / RGB / CMYK
**Effect stack pills** (each switches on/off and reveals its controls): Pre-process, Edge lines, DTF film, Dot gain, Misregister, Clean specks, Distress

| Engine | What you get |
|---|---|
| Halftone | Round, Ellipse, Diamond, Square, Line, Cross-hatch, Hex, Concentric Rings, Wavy Line, Checker, Xerox Grain. Real LPI at your document PPI, any angle, optional smooth edges. Tone is exact (a 50% grey prints 50% ink). |
| Dither | Floyd-Steinberg (plus jittered), Atkinson, Jarvis, Stucki, Burkes, Sierra, Sierra Two-Row, Sierra Lite, Bayer 2/4/8/16, clustered dot, diamond cluster, line cluster, gradient noise, white noise, threshold. Dot/pixel size 1-16. |
| ASCII | 12 character sets from a built-in 5x7 pixel font (identical on every machine), Edge glyphs that follow outlines, "Text halftone" tiling your own words, your own character set. |

| Colour mode | Output |
|---|---|
| Mono | One ink colour, optional paper colour. |
| Tonal | 2 to 5 inks stacked as tone bands (a gradient map made of dots). 16 tone maps built in, fully editable. |
| Grade | Reduces the image to a palette: 28 built-in palettes, pull N colours from your image, paste a hex list, click swatches to cut colours, Merge closest. One layer per colour, named by hex. |
| RGB | Red/green/blue channels dithered separately with their own angle and strength, added together over black. |
| CMYK | Real C/M/Y/K plates at 15/75/0/45 (each editable), black-generation control, plates switch on/off. Multiply layers give true rosettes. |

**Effect stack**
- **Pre-process:** brightness, contrast, gamma, black/white point, blur, sharpen, grain, invert.
- **Edge lines:** Sobel outlines laid over the tone (thickness and strength).
- **DTF film:** garment colour, fuzziness, feather; colours near the garment become transparent and soft edges are converted into printable dots.
- **Dot gain:** grow or shrink the ink to compensate for press spread.
- **Misregister:** offsets plates 2+ like a worn press.
- **Clean specks:** deletes dots smaller than N mm (0.5 mm is a safe DTF floor).
- **Distress:** knocks out ink like a worn screen.

**Library:** 32 built-in presets, save your own looks, Export / Import a JSON file so the whole team shares the same looks.
**Source:** flattened document, active layer, or every selected layer (batch).
**Warnings:** shows cell size in mm and px, warns under 300 PPI, cells under 6 px, DTF dots under 0.5 mm.

## Tips

- Halftones are measured in real inches, so work at **300 PPI**. At 72 PPI a 35 LPI cell is only 2 px.
- **Detail 1:1** preview shows true dot size; **Whole** is only an approximation.
- Big error-diffusion jobs are quick (a 1500x1500 plane takes about 0.1 s in Node), but CMYK on huge files uses a lot of memory. The panel asks you to confirm very large jobs.
- For DTF: pick a transparent-friendly look, switch on **DTF film** and **Clean specks**, set the garment colour, and keep paper empty.

## Project layout

```
plugins/dithers-brew/
  manifest.json        UXP manifest v5, Photoshop 24.4+
  index.html, styles.css, main.js     panel UI (built from the shared kit)
  js/engine.js         pixel engine (pure JS, tested in Node)
  js/ascii.js          5x7 font + ASCII renderer
  js/palettes.js       palettes and tone maps
  js/state.js          defaults and presets
  core/                copy of the suite's /shared folder (do not edit here)
  legacy/Franks_Dithers_Brew_Lite.jsx   drag-and-drop script version
```

## Ideas not built yet

Live on-canvas preview layer, Timeline frame batching, selection-aware rendering, GIF/MP4 export of dithered animation, custom bitmap fonts from a font file, more tone maps and palettes.
