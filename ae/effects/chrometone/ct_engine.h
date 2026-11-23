// Frank's Chrometone Brew 1.1 - C++ port of plugins/chrometone/js/engine.js + fx.js (liquid chrome).
#pragma once
#include "../../core/brew_layers.h"

namespace ct {

enum Shape { SH_SINE = 0, SH_TRIANGLE, SH_HARD };
enum From { FROM_BRIGHTNESS = 0, FROM_AUTO, FROM_OUTLINE };
enum Profile { PR_CHAMFER = 0, PR_ROUND, PR_RIM };
enum Reflect { RF_GRADIENT = 0, RF_HORIZON };
enum GlowType { GT_DREAMY = 0, GT_HALO, GT_NEON, GT_BLOOM, GT_INNER };

struct GlowMod { bool on = false; int type = GT_DREAMY; std::string color = "#FFFFFF"; double size = 30, strength = 50; };

struct Params {
  std::vector<brew::Stop> stops = { { 0, "#0A0C10" }, { 30, "#5A6270" }, { 55, "#F4F7FA" }, { 70, "#8C95A3" }, { 100, "#FFFFFF" } };
  bool invert = false;
  double blur = 2, contrast = 140, mid = 50;
  double bandCount = 3, bandPhase = 0; int bandShape = SH_SINE; double bandSoft = 50, bandMix = 60;
  double depth = 45, angle = 135, gloss = 40, spec = 60, reliefSoft = 3;
  double grain = 0, bloom = 20, mix = 0;
  // 1.1 surface
  int from = FROM_BRIGHTNESS; double key = 12, bevel = 30; int profile = PR_CHAMFER; int reflect = RF_GRADIENT;
  double horizon = 52, wave = 35, waveSize = 40;
  std::vector<brew::Stop> sky = { { 0, "#FFFFFF" }, { 55, "#BFD9FF" }, { 100, "#7FA8E8" } };
  std::vector<brew::Stop> ground = { { 0, "#3A2418" }, { 45, "#B86A3C" }, { 100, "#FFF1DC" } };
  // extrusion
  bool exOn = false; double exDepth = 80, exAngle = 290, exPersp = 0;
  std::vector<brew::Stop> exStops = { { 0, "#E8EEF6" }, { 100, "#20242C" } };
  double exShade = 60, exLines = 50, exShadow = 0;
  GlowMod glow[4];
  // shine
  bool glOn = false; double glCount = 4, glSize = 80, glRays = 4, glRot = 0; std::string glColor = "#FFFFFF";
  bool swOn = false; double swAngle = 60, swPos = 40, swWidth = 20, swStrength = 60;
  bool rimOn = false; std::string rimColor = "#FFD9A8"; double rimWidth = 8;
  bool arcOn = false; double arcCount = 4; std::string arcColor = "#D9A8FF"; double arcSpread = 50;
  double scale = 1;
  // motion inputs (neutral = the Photoshop result)
  double grainX = 0, grainY = 0;       // grain hash offset (re-roll)
  double horizonX = 0, horizonY = 0;   // reflection scroll in px (full res)
  Params() {
    glow[0] = { false, GT_DREAMY, "#BFD8FF", 60, 50 }; glow[1] = { false, GT_HALO, "#FFFFFF", 25, 50 };
    glow[2] = { false, GT_NEON, "#00E5FF", 12, 60 }; glow[3] = { false, GT_BLOOM, "#FFFFFF", 30, 50 };
  }
};

// Photoshop parity: the merged "Chrome colour" layer (out.layers = "merged"), RGBA 0..255.
bool render(const brew::Image& src, const Params& P, brew::Layer& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr);
// AE output: straight alpha.
bool renderOut(const brew::Image& src, const Params& P, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr);

}
