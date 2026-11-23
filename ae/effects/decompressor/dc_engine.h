// Frank's Decompressor Brew - C++ port of plugins/decompressor/js/engine.js
// (JPEG generations, chroma subsampling, bit crush, block datamosh, glitch slices)
// + a real temporal datamosh for After Effects (motion vectors applied to a stale frame).
#pragma once
#include "../../core/brew_layers.h"

namespace dc {

enum Chroma { C444 = 0, C420, C411 };

struct Params {
  bool jpegOn = true; double quality = 12, generations = 3; int chroma = C420;
  double bits = 8;
  double moshAmount = 0, moshDir = 0, moshBlock = 16;
  double slices = 0, offset = 40, seed = 1;
  double mix = 100;
  double scale = 1, fullH = 0;
  // motion inputs (neutral = the Photoshop result)
  double gridX = 0, gridY = 0;     // 8x8 grid offset, px (blocks crawl)
  double sliceRoll = 0;            // px at full res: glitch slices move down
};

bool render(const brew::Image& src, const Params& P, brew::Layer& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr);

// Temporal datamosh: frames[0] is the last clean ("I") frame, frames.back() the current
// frame. Block motion between each pair of neighbours is applied to the stale picture,
// so old colours ride on new motion. bleed = 0..1 of the real frame let back in per step.
void temporalMosh(const std::vector<const brew::Image*>& frames, int block, int search, double bleed, brew::Image& out);

}
