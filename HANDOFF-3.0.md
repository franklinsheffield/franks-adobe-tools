# Lab suite 3.0 - handoff (2026-11-25)

## Done (branch claude/project-thread-u4eer7, PR #5)
- All approved Photoshop upgrades built + tested: Auto Tone, Scanline (Photo mix, Background calm, flare anchoring, display sizes), Halo, Decompressor, Chroma (Photo chrome, Subject cut-out, Shape badge, Prism Foil retune), Paint (Subject focus, subject-centred wash), Depth waves, Batch Mock 3.0 (colour variants, CSV text, extra sizes + WebP, preview sheet, re-run failed, record as Action).
- Colour 3.0 (12 tools, 6-mode grid) is on every pixel tool. Dithers was still on the old Colour Deck; fixed (v3: true in plugins/dithers-brew/main.js).
- New build copied to Frank's Mac (~/Downloads/franks-adobe-tools). Photoshop must reload the plugins in UXP Developer Tool to show it.

## Next
1. Re-run tests/run.js: 1 failure after the Dithers colour change (likely a Dithers panel test expecting the old Colour Deck layout). Fix the test or layout.
2. Reload plugins in Photoshop on the Mac and smoke test the new features (close test docs without saving; a stuck "Progress" window was open, ask Frank before cancelling it).
3. Update PR #5 title/body with update notes and merge into main (Frank approved), then restart the branch from main.
4. Next milestones: Dithers + Batch Mock to the 3.0 layout, playbook update, gate 3, then After Effects, Premiere Pro, Worlds Lab.
