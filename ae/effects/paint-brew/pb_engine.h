// Frank's Paint Brew 1.1 - C++ port of plugins/paint-brew/js/engine.js + styles2.js.
// Oil, Watercolour, Impressionism, Alcohol Ink, Spray Paint and Pastel from a photo.
// Same rules as the other ports: math in double, Float32Array planes as float,
// Uint8Array stores truncate, Math.round only where the JS rounds. Bit-exact with the JS engine.
#pragma once
#include "../../core/brew_layers.h"
#include <cstdint>

namespace pb {

enum Style { ST_OIL = 0, ST_WATER, ST_IMPRESS, ST_INK, ST_SPRAY, ST_PASTEL };
enum BlendP { PB_NORMAL = 0, PB_SCREEN, PB_MULTIPLY, PB_LIGHTEN, PB_LINEARDODGE, PB_LINEARBURN, PB_HARDLIGHT, PB_OVERLAY, PB_SOFTLIGHT };

struct Params {
  int style = ST_OIL;
  double seed = 1;
  // brush
  double bSize = 40, bLength = 1, bDetail = 3, bRandomness = 30, bFollow = 70; std::string bTool = "brush"; double bMix = 30;
  // colour
  double cSimplify = 50, cSaturation = 15, cWarmth = 0, cJitter = 20, cPalette = 0;
  // texture
  double tImpasto = 55, tLight = 135, tBristle = 50, tCanvas = 30, tCanvasScale = 7, tLift = 0, tThickLights = 45;
  // water
  std::string wPaper = "#F7F2E6"; double wDensity = 85, wWetEdge = 60, wGranulation = 45, wBleed = 14, wPaperTexture = 45, wPencil = 40, wSplashes = 0, wSplashSize = 70, wFade = 45;
  // alcohol ink
  double iFlow = 55, iRim = 60, iCells = 45, iBlend = 40, iVeins = 35; std::string iMetal = "gold";
  // spray
  double sCans = 5, sSoft = 40, sOverspray = 50, sSpeckle = 40, sHalftone = 0, sDrips = 30, sDripLength = 50, sOutline = 30, sHighlight = 0;
  std::string sWall = "concrete", sWallColour = "#A8A49C"; double sRelief = 50, sBare = 0;
  std::string sBlend = "normal"; double sPaintOpacity = 100, sGrime = 20, sCracks = 0;
  std::string sBrickPattern = "running"; double sBrickSize = 100, sMortar = 45; std::string sMortarColour = "#CFC8BA"; double sBrickVariation = 50;
  std::string sWoodDir = "vertical", sWoodFinish = "raw"; double sPlankWidth = 100, sGrain = 60, sKnots = 30;
  // pastel
  std::string pPaper = "#8E8D88"; double pTooth = 60, pSmudge = 35, pPressure = 65; std::string pHatch = "follow"; double pAngle = 45; bool pOil = false;
  // focus (the AE effect has no subject mask: focus is always "none")
  double fFalloff = 120, fOutside = 40;
  double scale = 1, fullW = 0, fullH = 0;
  // motion inputs (neutral = the Photoshop result)
  double paperLight = 135;    // watercolour paper texture light (fixed 135 in Photoshop)
  double ox = 0, oy = 0;      // surface slide in px (canvas weave, wall, paper tooth / texture)
  double reveal = 1;          // paint-on: share of strokes painted (stroke styles) or of layers shown (others)
};

struct PLayer { std::vector<uint8_t> rgba; int blend = PB_NORMAL; double opacity = 100; };
struct Result { int w = 0, h = 0; std::vector<PLayer> layers; bool hasPaper = false; brew::RGB paper{ 0, 0, 0 }; };

bool render(const brew::Image& src, const Params& P, Result& res, brew::ProgressFn pf = nullptr, void* ctx = nullptr);
// engine.js composite(result, {type: "white"}): paper (if any) under the layers, RGB as the Uint8Array holds it
void compositeWhite(const Result& r, std::vector<uint8_t>& rgb);
// After Effects output: the flattened painting, opaque
bool renderOut(const brew::Image& src, const Params& P, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr);

extern const char* const STYLE_IDS[6];
extern const char* const STYLE_NAMES[6];

}
