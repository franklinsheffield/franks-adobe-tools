# Frank's Font Brew

Turns lettering layers in Photoshop into an installable OpenType (.otf) font. Part of Frank's Brew suite.

**Phase 1 (this build):** plain (single-colour) fonts. Kerning and ligatures come in phase 2, colour (OpenType-SVG) fonts in phase 3.

## Use

1. Put each character on its own layer and name the layer after the character: `A`, `a`, `7`, `?`. Names like `uni00E9`, `space`, `period`, `ampersand` work too, and Photoshop's `copy` suffixes are ignored.
2. Select the layers (or a group holding them) and press **Map selected layers**. Layers whose names aren't a character go to **Unassigned**: pick one there, then click its cell in the grid.
3. **Metrics**: Auto finds the baseline from capitals that sit flat (H, E, T...). Use **One line** when every letter sits on the same line in your document, **Each layer** when letters are scattered (each layer's bottom is its baseline; g j p q y drop by *Descenders*), or **Guides** (lowest horizontal guide = baseline, highest = cap height). Click a lit cell to nudge that glyph's left/right spacing or shift it up.
4. **Outline**: shape layers keep their exact vector path when it matches the pixels; everything else (pixel, type, smart object layers) is traced. Smoothing 0 keeps straight pixel edges for pixel fonts.
5. Fill in **Export** (family, style, designer, licence) and press **Export .otf font**. Double-click the file to install it.

Font Brew only reads your document; it never changes it. Each layer is read at up to 1000 px on its longest side.

## Notes

- Mappings you make by hand are remembered per document name (plugin data folder).
- The font file is written with [opentype.js](https://github.com/opentypejs/opentype.js) 2.0.0 (MIT, bundled in `js/lib`).
