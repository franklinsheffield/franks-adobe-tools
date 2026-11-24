// Frank's Dithers Brew 1.1 - C++ port of plugins/dithers-brew/js/engine.js + lineart.js + ascii.js.
// Halftone screens, error diffusion / ordered dithers, line art and the 5x7 ASCII engine;
// mono / tonal / palette (grade) / RGB / CMYK separations, print FX. Bit-exact with the JS engine.
#pragma once
#include "../../core/brew_layers.h"
#include <cstdint>

namespace di {

enum Engine { ENG_HALFTONE = 0, ENG_DITHER, ENG_ASCII };
enum Mode { MODE_MONO = 0, MODE_TONAL, MODE_GRADE, MODE_RGB, MODE_CMYK };
enum BlendD { BD_NORMAL = 0, BD_MULTIPLY, BD_LINEARDODGE };

struct Params {
  int engine = ENG_HALFTONE;
  std::string algoHalftone = "round", algoDither = "fs", algoAscii = "classic";
  int mode = MODE_MONO;
  double lpi = 35, angle = 45, pixel = 1; bool aa = false;
  // 1.1 tune
  double tThreshold = 50, tStrength = 100; std::string tDirection = "h"; double tWeight = 2, tSpacing = 6, tJitter = 0;
  // ascii
  double aSize = 4; std::string aCustom = "FRANK"; bool aKeepOrder = false; double aEdge = 0; bool aTextMode = false; std::string aText = "FRANK";
  std::string monoInk = "#000000", monoPaper = "";
  std::vector<std::string> tonalInks = { "#7FA6C9", "#1B2A49" }; std::string tonalPaper = "#F4EBD0";
  std::vector<double> tonalAngles = { 45, 15, 75, 0, 60 };
  std::vector<std::string> gradeColors = { "#000000", "#1D2B53", "#7E2553", "#008751", "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8",
                                           "#FF004D", "#FFA300", "#FFEC27", "#00E436", "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA" };
  std::vector<int> gradeOff; double gradeSpread = 50; bool skipLightest = false;
  double cmykAngles[4] = { 15, 75, 0, 45 }; bool cmykOn[4] = { true, true, true, true }; double gcr = 100;
  double rgbAngles[3] = { 15, 75, 45 }; bool rgbOn[3] = { true, true, true }; double rgbStrength[3] = { 100, 100, 100 };
  // fx
  bool preOn = false; double brightness = 0, contrast = 0, gamma = 1, black = 0, white = 255, blur = 0, sharpen = 0, radius = 1.5, noise = 0, haze = 0, invert = 0;
  bool edgesOn = false; double edgeStrength = 60, edgeThick = 1;
  bool dtfOn = false; std::string garment = "#1A1A1A"; double fuzz = 15, feather = 20; bool dots = true;
  bool gainOn = false; double gainAmount = 0;
  bool misregOn = false; double misregAmount = 3;
  bool cleanOn = false; double cleanMm = 0.5;
  bool distressOn = false; double distressAmount = 30;
  double ppi = 300, scale = 1;
  // motion inputs (neutral = the Photoshop result)
  double mox = 0, moy = 0;     // pattern scroll in px
  int seedOff = 0;             // re-roll of the random parts (grain, noise, distress, jitter)
};

struct DLayer { std::vector<uint8_t> mask; brew::RGB color; int blend = BD_NORMAL; };
struct Result { int w = 0, h = 0; std::vector<DLayer> layers; bool hasPaper = false; brew::RGB paper{ 0, 0, 0 }; };

bool render(const brew::Image& src, const Params& P, Result& res, brew::ProgressFn pf = nullptr, void* ctx = nullptr);
// engine.js composite(result, {type: "white"}) - RGB as the Uint8Array holds it
void compositeWhite(const Result& r, std::vector<uint8_t>& rgb);
// After Effects output: paper/white background, or transparent (ink only)
bool renderOut(const brew::Image& src, const Params& P, bool transparent, brew::OutImage& out, brew::ProgressFn pf = nullptr, void* ctx = nullptr);

// catalogues (order = the AE popups)
extern const char* const SCREEN_IDS[11];
extern const char* const SCREEN_NAMES[11];
extern const char* const DITHER_IDS[28];
extern const char* const DITHER_NAMES[28];
extern const char* const ASCII_IDS[12];
extern const char* const ASCII_NAMES[12];

}
