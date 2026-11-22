// Frank's Mobglow Brew 2.0 - C++ port of plugins/mobglow/js/engine.js (dreamy bloom).
#pragma once
#include "../../core/brew_layers.h"

namespace mob {

struct Params {
  // look (same names as the Photoshop state)
  double radius = 431, strength = 299, threshold = 1.45, gamma = 0.63, sat = 52;
  bool colorOn = false; std::string colorHex = "#E0305A";
  double grain = 0, darken = 0;
  double scale = 1, fullW = 0, fullH = 0;
  // motion inputs (all neutral by default = the Photoshop result)
  double grainSeed = 7;       // hashNoise seed of the grain
  double hueShift = 0;        // deg, rotates the glow colour
  double shiftX = 0, shiftY = 0;   // glow offset in px at full resolution
  double gain = 1;            // glow strength multiplier
};

// Photoshop parity: the layer stack (Background darken + Screen glow) over the source.
bool render(const brew::Image& src, const Params& P, std::vector<brew::Layer>& layers, brew::ProgressFn pf = nullptr, void* ctx = nullptr);
// AE output: flattened, straight alpha (the glow also lights transparent areas).
bool renderOut(const brew::Image& src, const Params& P, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr);

}
