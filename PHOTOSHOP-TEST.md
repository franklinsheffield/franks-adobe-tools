# Dithers Brew: first Photoshop test

Nothing in the suite has run in real Photoshop yet. This checks the three risky spots: the preview image, the RGBA layer write, and the layer group. It takes about 10 minutes.

**Load it:** UXP Developer Tool > Add Plugin > `franks-adobe-tools/plugins/dithers-brew/manifest.json` > Load (Photoshop open). Keep the tool's **Debug** console open and copy any red text.

| # | Do this | Expect | Result |
|---|---|---|---|
| 1 | Open the panel with no document open | Panel opens and a demo halftone image shows in Preview | |
| 2 | Open any photo at 300 PPI and click **Refresh** | Preview shows your photo as dots. The status line says "Preview ... ms" | |
| 3 | Move the **Screen (LPI)** slider | Preview updates by itself | |
| 4 | Click **Apply to document** | Group `Brew - Round Dot 35 LPI` with one ink layer. Dots sit on transparent paper (checkerboard). Your photo is hidden | |
| 5 | Press Cmd+Z once | All of it is undone in one step | |
| 6 | Preset > `Colour - CMYK rosette / 55 LPI`, then Apply | 4 layers (Yellow, Magenta, Cyan, Black) set to Multiply, inside one group | |
| 7 | Library: type a name > **Save look** > close and reopen the panel | Your look is under "Mine" | |
| 8 | **Export all**, then **Import** that file | Saves and loads a .json file | |
| 9 | Drag `legacy/Franks_Dithers_Brew_Lite.jsx` onto Photoshop | Lite version still runs | |

**What to send back:** the step numbers that failed, the red text from the Debug console, and a screenshot of the Layers panel after steps 4 and 6.
