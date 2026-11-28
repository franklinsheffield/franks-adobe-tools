# Step 2 emoji: levels, classes, Common Grounds, Conch

29 emoji (20 static PNG, 9 animated GIF, 128 px, 24 frames x 80 ms), same v4 style as the House kits.
Source: `../src/art2.mjs` (render with `render2.mjs`, build with `build2.py`). Sheets: `sheet-dark.png`, `chat-size-dark.png` (22 px, chat size).

- Levels: `lv1`-`lv6` (lv6 rim in the five House colours), `lv_half` (hidden half-step), animated `level_up`, `path_sealed`.
- Class crests `cl_*`: one per two-House class in `activity/src/levels.js` CLASSES, split in the two House colours, rim in the class colour.
- Common Grounds: `cg_coin`; animated `cg_portal`, `cg_merchant`, `house_cup`, `table_code`, `great_work`, `stray_token`.
- Conch of Dignity (neutral gold, locked to the Cup-holding House later): `conch`, `conch_held`, animated `conch_blast`.

Uploaded with `.github/workflows/emoji-swap.yml` (kit_dir `brand/houses/emoji/step2`).
