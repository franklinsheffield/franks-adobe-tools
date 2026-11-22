// Frank's CRT Phaser Brew for After Effects - engine (C++ port of
// plugins/crt-phaser/js/engine.js + phase.js, CRT Phaser 1.1).
// With every motion field at its default, render() matches the Photoshop
// engine's merged output for the same look.
#pragma once
#include "../../core/brew_math.h"

namespace crt {

enum MaskType { MASK_NONE = 0, MASK_GRILLE, MASK_SHADOW, MASK_SLOT, MASK_DOTS };
enum Tint { TINT_NONE = 0, TINT_GREEN, TINT_AMBER, TINT_WHITE };
enum PhaseMode { PH_OFF = 0, PH_WAVEFORM, PH_LINEAR, PH_FLUX, PH_FLUXDOTS };

struct Params {
  // ---- look (same names and units as the Photoshop panel)
  double screenLines = 240;
  double convX = 1, convY = 0;
  int maskType = MASK_GRILLE; double maskScale = 1, maskStrength = 45;
  double scanStrength = 55, scanWidth = 45;
  double bloom = 35, curve = 25, corner = 30, vignette = 35;
  double noise = 6, roll = 30, rollStrength = 0;
  double brightness = 115, contrast = 105; int tint = TINT_NONE;
  int phaseMode = PH_OFF;
  double phLines = 150, phAmp = 40, phSmooth = 40, phWidth = 45, phThreshold = 10, phAngle = 0, phWarp = 15, phDetail = 50;
  double phDots = 35, phGlow = 55, phFringe = 30, phDebris = 0, phFlare = 0, phGrain = 25, phSeed = 7;
  bool phColorFull = false;
  std::vector<brew::Stop> phRamp = { {0, "#000000"}, {20, "#3A0A00"}, {50, "#D2400C"}, {75, "#FF9A2E"}, {100, "#FFF3D6"} };
  std::string phBase = "#000000";

  // ---- render context (AE downsampled previews: scale < 1, fullH = full-res height)
  double scale = 1, fullH = 0;

  // ---- per-frame motion inputs (all 0 / 1 = still frame, identical to Photoshop)
  double scanShift = 0;        // scanline + mask pattern shift down, px at full res
  double maskShiftX = 0;       // phosphor mask shift right, px at full res
  double holdRoll = 0;         // vertical hold: picture rolls by this fraction of the height (0..1)
  double noiseSeed = 0;        // added to every noise/grain seed (boil, snow)
  double snow = 0;             // extra animated signal snow, 0..100
  double fieldShift = 0;       // Phase: added to the field, so lines flow (1 = one line spacing)
  double flowX = 0, flowY = 0; // Phase: warp-noise offset, px at full res
  double gain = 1;             // brightness multiplier (flicker / pulse)
  double glitch = 0;           // channel-change burst amount 0..1
  double glitchSeed = 0;
};

// Renders `src` into `out` (same size). Returns false if aborted by progress.
bool render(const brew::Image& src, const Params& P, brew::OutImage& out,
            brew::ProgressFn progress = nullptr, void* ctx = nullptr);

} // namespace crt
