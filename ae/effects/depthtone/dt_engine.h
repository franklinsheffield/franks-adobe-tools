// Frank's Depthtone Brew - C++ port of plugins/depthtone/js/engine.js
// (brightness -> depth -> contour lines, terraces or lit relief).
#pragma once
#include "../../core/brew_layers.h"

namespace dt {

enum Style { CONTOURS = 0, TERRACES, RELIEF };

struct Params {
  bool invert = false; double smooth = 3, near_ = 100, far_ = 0, levels = 12;
  int style = TERRACES;
  std::vector<brew::Stop> stops = { {0, "#1B1F3B"}, {50, "#4F7CAC"}, {100, "#F2E8CF"} };
  double fog = 0; std::string fogColor = "#C9D6DF";
  double lineWidth = 2, every = 1; bool colorByDepth = false; std::string lineColor = "#111111"; bool fill = false;
  double lightAngle = 135, shadow = 6, lightStrength = 60;
  double scale = 1, fullH = 0;
  // motion inputs (neutral = the Photoshop result)
  double depthPhase = 0;      // 0..1 of a level: contours / terraces march near <-> far
  double shiftX = 0, shiftY = 0;   // depth field offset, px at full resolution
};

bool render(const brew::Image& src, const Params& P, std::vector<brew::Layer>& layers, brew::ProgressFn pf = nullptr, void* ctx = nullptr);

}
