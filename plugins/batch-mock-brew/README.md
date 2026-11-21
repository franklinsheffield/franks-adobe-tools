# Frank's Batch Mock Brew

Batch Smart Object mockups. Choose a Mockups folder (.psd/.psb), an Artwork folder (JPG, PNG, PSD, PDF page 1, TIFF, GIF, BMP) and an Export folder, then press **Brew Batch**. Every artwork goes into every mockup's target Smart Objects and the result is exported as JPG, PNG, PSD or MP4.

- Smart Object name is yours (default `artwork`), matched Exact / Starts with / Contains. All matching Smart Objects are filled; with Numbered slots, `artwork_1`, `artwork_2` take `name_1`, `name_2` from the artwork folder.
- Placement: Fit, Fill (crop), Stretch, Center; optional fill colour for gaps.
- Export: JPG quality 1 to 12, PNG with or without transparency, layered PSD, MP4 (mockups with a Video Timeline only). Organise by mockup, by artwork or one folder. Name = any order of mockup, artwork and suffix with `_ - .` or space.
- Settings and folders are remembered. Setups (no folder paths) can be saved, exported and shared.
- Test first job renders one result and leaves it open without exporting.
- A run log `batch-mock-brew-log.txt` is written to the Export folder. Mockup files are never saved; linked-file Smart Objects are left alone.
