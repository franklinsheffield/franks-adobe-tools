# Frank's Brew Console (After Effects panel)

CEP 12 panel for After Effects 2027 (works back to AE 2024). Pick a Brew effect, click a look to apply it to the
selected layers (or set it as Look B), add motion with one click, link a control to the music, and keep saved looks
in the same JSON format as the Photoshop Brews (Export / Import both ways).

- Install (free): Mac `ae/tools/install-console-mac.command`, Windows `ae/tools/install-console-win.bat`.
  Both copy this folder into the user CEP extensions folder and turn on Adobe's PlayerDebugMode so the unsigned panel loads.
- Open: Window > Extensions > Frank's Brew Console.
- Regenerate after changing an effect's params or looks: `node ae/tools/gen-console-map.js && node ae/tools/gen-console-thumbs.js`.
- Saved looks live in `~/Library/Application Support/Franks Brew/ae-saved-looks.json` (Windows: `%APPDATA%\Franks Brew`).
