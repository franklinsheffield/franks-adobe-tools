// Frank's Dithers Brew 1.1 - After Effects effect (AE SDK glue). Halftone screens, dithers,
// line art and ASCII with mono / tonal / palette / RGB / CMYK inks, print FX, Look / Look B
// morph, the shared Motion group and Dither motion.
#include "AEConfig.h"
#include "entry.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "String_Utils.h"
#include "AE_EffectCBSuites.h"
#include "brew_ae.h"
#include "../di_params_io.h"
#include "../di_motion.h"
#include "../di_presets.h"
#include "brew_ae_version.h"
#include "param_order.h"

using namespace brew;
using namespace brewae;

static const int MAX_TONAL = 5, MAX_PAL = 16;
enum {
  P_INPUT = 0,
  T_LOOK_START, P_LOOK, P_LOOKB, P_MORPH, T_LOOK_END,
  T_SCR_START, P_ENGINE, P_SCREEN, P_DITHER, P_ASCII, P_PPI, P_LPI, P_ANGLE, P_PIXEL, P_AA, T_SCR_END,
  T_TUNE_START, P_THRESH, P_STRENGTH, P_DIR, P_WEIGHT, P_SPACING, P_JITTER, T_TUNE_END,
  T_ASC_START, P_ASIZE, P_AEDGE, P_AKEEP, P_ATEXT, T_ASC_END,
  T_INK_START, P_MODE, P_MONO_INK, P_MONO_PAPER_ON, P_MONO_PAPER, T_INK_END,
  T_TON_START, P_TN_COUNT, P_TN1, P_TA1, P_TN2, P_TA2, P_TN3, P_TA3, P_TN4, P_TA4, P_TN5, P_TA5, P_TN_PAPER_ON, P_TN_PAPER, T_TON_END,
  T_PAL_START, P_PAL_COUNT, P_PC1, P_PC2, P_PC3, P_PC4, P_PC5, P_PC6, P_PC7, P_PC8, P_PC9, P_PC10, P_PC11, P_PC12, P_PC13, P_PC14, P_PC15, P_PC16,
  P_SPREAD, P_SKIP, T_PAL_END,
  T_CMYK_START, P_C_ON, P_C_ANG, P_M_ON, P_M_ANG, P_Y_ON, P_Y_ANG, P_K_ON, P_K_ANG, P_GCR, T_CMYK_END,
  T_RGB_START, P_R_ON, P_R_ANG, P_R_STR, P_G_ON, P_G_ANG, P_G_STR, P_B_ON, P_B_ANG, P_B_STR, T_RGB_END,
  T_IMG_START, P_PRE_ON, P_BRIGHT, P_CONTRAST, P_GAMMA, P_BLACK, P_WHITE, P_BLUR, P_SHARPEN, P_RADIUS, P_NOISE, P_HAZE, P_INVERT,
  P_EDGE_ON, P_EDGE_STR, P_EDGE_THICK, T_IMG_END,
  T_DTF_START, P_DTF_ON, P_GARMENT, P_FUZZ, P_FEATHER, P_DOTS, T_DTF_END,
  T_PFX_START, P_GAIN_ON, P_GAIN, P_MIS_ON, P_MIS, P_CLEAN_ON, P_CLEAN, P_DIS_ON, P_DIS, P_BG, T_PFX_END,
  P_MO_BASE, P_MO_LAST = P_MO_BASE + MO_COUNT - 1,
  T_DM_START, P_DM_BREATHE, P_DM_BREATHER, P_DM_TONE, P_DM_TONER, T_DM_END,
  P_NUM
};
static const char* ENGINES = "Halftone screen|Dither|ASCII";
static const char* MODES = "Mono (one ink)|Tonal (stacked inks)|Palette (colour grade)|RGB split|CMYK separation";
static const char* DIRS = "Horizontal|Vertical|Diagonal|Radial";
static const char* DIR_IDS = "hvdr";
static const char* BGS = "Paper (white if none)|Transparent (ink only)";
static const char* TONAL_COUNTS = "1|2|3|4|5";
static const char* PAL_COUNTS = "2|3|4|5|6|7|8|9|10|11|12|13|14|15|16";

template <int N> static std::string menuOf(const char* const (&names)[N]) { std::string s; for (int i = 0; i < N; i++) { if (i) s += "|"; s += names[i]; } return s; }
template <int N> static int indexOf(const char* const (&ids)[N], const std::string& v) { for (int i = 0; i < N; i++) if (v == ids[i]) return i; return 0; }

static PF_Err About(PF_InData* in_data, PF_OutData* out_data) {
  PF_SPRINTF(out_data->return_msg, "%s v%d.%d\rDB-01  Lab suite\rHalftones, dithers, line art + ASCII with motion.", "Dithers Lab", BREW_MAJOR, BREW_MINOR);
  return PF_Err_NONE;
}
static PF_Err GlobalSetup(PF_InData* in_data, PF_OutData* out_data) {
  out_data->my_version = BREW_VERSION_PACKED; out_data->out_flags = BREW_OUT_FLAGS; out_data->out_flags2 = BREW_OUT_FLAGS2;
  return PF_Err_NONE;
}
#define COLOR(NAME, HEX, ID) { RGB c_ = hexToRgb(isHex(HEX) ? HEX : std::string("#000000")); AEFX_CLR_STRUCT(def); PF_ADD_COLOR(NAME, (A_u_char)c_.r, (A_u_char)c_.g, (A_u_char)c_.b, ID); }
#define CHECK(NAME, V, ID) AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX(NAME, (V) ? 1 : 0, 0, ID);
#define POPUP(NAME, N, V, MENU, ID) AEFX_CLR_STRUCT(def); PF_ADD_POPUP(NAME, N, V, MENU, ID);

// Lab 3.0 Effect Controls order: Motion, tool motion, Look + Primary, Advanced, Colour.
static const int BLOCK_ORDER[] = { P_MO_BASE, T_DM_START, T_LOOK_START, T_SCR_START, T_TUNE_START, T_ASC_START, T_IMG_START, T_DTF_START, T_PFX_START, T_INK_START, T_TON_START, T_PAL_START, T_CMYK_START, T_RGB_START };
static const brew::ParamOrder PO(BLOCK_ORDER, (int)(sizeof BLOCK_ORDER / sizeof BLOCK_ORDER[0]), P_NUM);

static PF_Err ParamsSetup(PF_InData* in_data, PF_OutData* out_data) {
  PF_Err err = PF_Err_NONE; PF_ParamDef def;
  di::Params D; di::parseParams(D, di::LOOKS[0].text);
  static std::string looks = lookMenu(di::LOOKS, di::LOOK_COUNT, false), looksB = lookMenu(di::LOOKS, di::LOOK_COUNT, true);
  static std::string screens = menuOf(di::SCREEN_NAMES), dithers = menuOf(di::DITHER_NAMES), ascii = menuOf(di::ASCII_NAMES);

  for (int block : BLOCK_ORDER) switch (block) {
  case P_MO_BASE: {  // Motion
    if (!err) err = addMotion(in_data, P_MO_BASE, "Spin: screen angle (deg/s)", "Drift X: pattern scroll (px/s)", "Drift Y: pattern scroll (px/s)");
  } break;
  case T_DM_START: {  // Dither motion
    BREW_TOPIC("Dither motion", T_DM_START, false);
    BREW_FS("Screen breathe (%)", 0, 100, 0, 100, 0, 0, P_DM_BREATHE);
    BREW_FS("Breathe rate (Hz)", 0, 10, 0, 4, 0.5, 2, P_DM_BREATHER);
    BREW_FS("Tone sweep (%)", 0, 100, 0, 100, 0, 0, P_DM_TONE);
    BREW_FS("Tone rate (Hz)", 0, 10, 0, 4, 0.5, 2, P_DM_TONER);
    BREW_ENDTOPIC(T_DM_END);
  } break;
  case T_LOOK_START: {  // Look
    BREW_TOPIC("Look", T_LOOK_START, false);
    AEFX_CLR_STRUCT(def); def.flags = PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY;
    PF_ADD_POPUP("Look", di::LOOK_COUNT, 1, looks.c_str(), P_LOOK);
    POPUP("Look B (morph to)", di::LOOK_COUNT + 2, 1, looksB.c_str(), P_LOOKB);
    BREW_FS("Morph to Look B", 0, 100, 0, 100, 0, 1, P_MORPH);
    BREW_ENDTOPIC(T_LOOK_END);
  } break;
  case T_SCR_START: {  // Screen
    BREW_TOPIC("Screen", T_SCR_START, false);
    POPUP("Engine", 3, D.engine + 1, ENGINES, P_ENGINE);
    POPUP("Halftone screen", 11, indexOf(di::SCREEN_IDS, D.algoHalftone) + 1, screens.c_str(), P_SCREEN);
    POPUP("Dither", 28, indexOf(di::DITHER_IDS, D.algoDither) + 1, dithers.c_str(), P_DITHER);
    POPUP("ASCII glyphs", 12, indexOf(di::ASCII_IDS, D.algoAscii) + 1, ascii.c_str(), P_ASCII);
    BREW_FS("Resolution (PPI)", 36, 1200, 72, 600, 300, 0, P_PPI);
    BREW_FS("Screen (LPI)", 3, 300, 10, 120, D.lpi, 0, P_LPI);
    AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Screen angle", D.angle, P_ANGLE);
    BREW_FS("Pixel scale", 1, 16, 1, 16, D.pixel, 1, P_PIXEL);
    CHECK("Smooth dot edges", D.aa, P_AA);
    BREW_ENDTOPIC(T_SCR_END);
  } break;
  case T_TUNE_START: {  // Tune
    BREW_TOPIC("Tune", T_TUNE_START, true);
    BREW_FS("Threshold", 0, 100, 0, 100, D.tThreshold, 0, P_THRESH);
    BREW_FS("Strength (%)", 0, 100, 0, 100, D.tStrength, 0, P_STRENGTH);
    POPUP("Line direction", 4, (int)std::string(DIR_IDS).find(D.tDirection.empty() ? 'h' : D.tDirection[0]) % 4 + 1, DIRS, P_DIR);
    BREW_FS("Line weight", 1, 8, 1, 8, D.tWeight, 0, P_WEIGHT);
    BREW_FS("Line spacing (px)", 2, 48, 2, 24, D.tSpacing, 0, P_SPACING);
    BREW_FS("Jitter (%)", 0, 100, 0, 100, D.tJitter, 0, P_JITTER);
    BREW_ENDTOPIC(T_TUNE_END);
  } break;
  case T_ASC_START: {  // ASCII
    BREW_TOPIC("ASCII", T_ASC_START, true);
    BREW_FS("Glyph scale", 1, 16, 1, 16, D.aSize, 0, P_ASIZE);
    BREW_FS("Edge glyphs (%)", 0, 100, 0, 100, D.aEdge, 0, P_AEDGE);
    CHECK("Keep my character order", D.aKeepOrder, P_AKEEP);
    CHECK("Text halftone", D.aTextMode, P_ATEXT);
    BREW_ENDTOPIC(T_ASC_END);
  } break;
  case T_IMG_START: {  // Image
    BREW_TOPIC("Image", T_IMG_START, true);
    CHECK("Adjust image", D.preOn, P_PRE_ON);
    BREW_FS("Brightness", -100, 100, -100, 100, D.brightness, 0, P_BRIGHT);
    BREW_FS("Contrast", -100, 100, -100, 100, D.contrast, 0, P_CONTRAST);
    BREW_FS("Gamma", 0.1, 4, 0.2, 3, D.gamma, 2, P_GAMMA);
    BREW_FS("Black point", 0, 250, 0, 250, D.black, 0, P_BLACK);
    BREW_FS("White point", 1, 255, 1, 255, D.white, 0, P_WHITE);
    BREW_FS("Blur (px)", 0, 8, 0, 8, D.blur, 1, P_BLUR);
    BREW_FS("Sharpen (%)", 0, 200, 0, 200, D.sharpen, 0, P_SHARPEN);
    BREW_FS("Sharpen radius (px)", 0.5, 30, 0.5, 30, D.radius, 1, P_RADIUS);
    BREW_FS("Noise -/+", -100, 100, -100, 100, D.noise, 0, P_NOISE);
    BREW_FS("Haze (%)", 0, 100, 0, 100, D.haze, 0, P_HAZE);
    BREW_FS("Invert (%)", 0, 100, 0, 100, D.invert, 0, P_INVERT);
    CHECK("Edge lines", D.edgesOn, P_EDGE_ON);
    BREW_FS("Edge strength (%)", 0, 100, 0, 100, D.edgeStrength, 0, P_EDGE_STR);
    BREW_FS("Edge thickness (px)", 1, 6, 1, 6, D.edgeThick, 0, P_EDGE_THICK);
    BREW_ENDTOPIC(T_IMG_END);
  } break;
  case T_DTF_START: {  // DTF knock-out
    BREW_TOPIC("DTF knock-out", T_DTF_START, true);
    CHECK("Knock out garment", D.dtfOn, P_DTF_ON);
    COLOR("Garment colour", D.garment, P_GARMENT);
    BREW_FS("Fuzziness (%)", 0, 100, 0, 100, D.fuzz, 0, P_FUZZ);
    BREW_FS("Feather (%)", 0, 100, 0, 100, D.feather, 0, P_FEATHER);
    CHECK("Soft edges as dots", D.dots, P_DOTS);
    BREW_ENDTOPIC(T_DTF_END);
  } break;
  case T_PFX_START: {  // Print FX
    BREW_TOPIC("Print FX", T_PFX_START, true);
    CHECK("Dot gain", D.gainOn, P_GAIN_ON);
    BREW_FS("Dot gain (px)", -4, 4, -4, 4, D.gainAmount, 0, P_GAIN);
    CHECK("Misregistration", D.misregOn, P_MIS_ON);
    BREW_FS("Misregistration (px)", 1, 12, 1, 12, D.misregAmount, 0, P_MIS);
    CHECK("Remove specks", D.cleanOn, P_CLEAN_ON);
    BREW_FS("Smallest dot (mm)", 0.1, 3, 0.1, 3, D.cleanMm, 1, P_CLEAN);
    CHECK("Distress", D.distressOn, P_DIS_ON);
    BREW_FS("Distress (%)", 0, 100, 0, 100, D.distressAmount, 0, P_DIS);
    POPUP("Background", 2, 1, BGS, P_BG);
    BREW_ENDTOPIC(T_PFX_END);
  } break;
  case T_INK_START: {  // Inks
    BREW_TOPIC("Inks", T_INK_START, false);
    POPUP("Colour mode", 5, D.mode + 1, MODES, P_MODE);
    COLOR("Mono ink", D.monoInk, P_MONO_INK);
    CHECK("Mono paper", !D.monoPaper.empty(), P_MONO_PAPER_ON);
    COLOR("Mono paper colour", D.monoPaper.empty() ? std::string("#FFFFFF") : D.monoPaper, P_MONO_PAPER);
    BREW_ENDTOPIC(T_INK_END);
  } break;
  case T_TON_START: {  // Tonal inks
    BREW_TOPIC("Tonal inks", T_TON_START, true);
    POPUP("Inks", MAX_TONAL, iclamp((int)D.tonalInks.size(), 1, MAX_TONAL), TONAL_COUNTS, P_TN_COUNT);
    for (int k = 0; k < MAX_TONAL; k++) {
      char cn[24], an[24]; snprintf(cn, sizeof cn, "Ink %d", k + 1); snprintf(an, sizeof an, "Ink %d angle", k + 1);
      COLOR(cn, k < (int)D.tonalInks.size() ? D.tonalInks[k] : std::string("#808080"), P_TN1 + k * 2);
      AEFX_CLR_STRUCT(def); PF_ADD_ANGLE(an, k < (int)D.tonalAngles.size() ? D.tonalAngles[k] : 45, P_TA1 + k * 2);
    }
    CHECK("Tonal paper", !D.tonalPaper.empty(), P_TN_PAPER_ON);
    COLOR("Tonal paper colour", D.tonalPaper.empty() ? std::string("#FFFFFF") : D.tonalPaper, P_TN_PAPER);
    BREW_ENDTOPIC(T_TON_END);
  } break;
  case T_PAL_START: {  // Palette
    BREW_TOPIC("Palette", T_PAL_START, true);
    POPUP("Colours", MAX_PAL - 1, iclamp((int)D.gradeColors.size(), 2, MAX_PAL) - 1, PAL_COUNTS, P_PAL_COUNT);
    for (int k = 0; k < MAX_PAL; k++) {
      char cn[24]; snprintf(cn, sizeof cn, "Colour %d", k + 1);
      COLOR(cn, k < (int)D.gradeColors.size() ? D.gradeColors[k] : std::string("#808080"), P_PC1 + k);
    }
    BREW_FS("Dither spread (%)", 0, 100, 0, 100, D.gradeSpread, 0, P_SPREAD);
    CHECK("Leave lightest as paper", D.skipLightest, P_SKIP);
    BREW_ENDTOPIC(T_PAL_END);
  } break;
  case T_CMYK_START: {  // CMYK
    BREW_TOPIC("CMYK", T_CMYK_START, true);
    const char* cmy[4] = { "Cyan", "Magenta", "Yellow", "Black" };
    for (int k = 0; k < 4; k++) {
      char on[24], an[24]; snprintf(on, sizeof on, "%s", cmy[k]); snprintf(an, sizeof an, "%s angle", cmy[k]);
      CHECK(on, D.cmykOn[k], P_C_ON + k * 2);
      AEFX_CLR_STRUCT(def); PF_ADD_ANGLE(an, D.cmykAngles[k], P_C_ANG + k * 2);
    }
    BREW_FS("Black generation (%)", 0, 100, 0, 100, D.gcr, 0, P_GCR);
    BREW_ENDTOPIC(T_CMYK_END);
  } break;
  case T_RGB_START: {  // RGB split
    BREW_TOPIC("RGB split", T_RGB_START, true);
    const char* rgbn[3] = { "Red", "Green", "Blue" };
    for (int k = 0; k < 3; k++) {
      char on[24], an[24], sn[24]; snprintf(on, sizeof on, "%s", rgbn[k]); snprintf(an, sizeof an, "%s angle", rgbn[k]); snprintf(sn, sizeof sn, "%s strength (%%)", rgbn[k]);
      CHECK(on, D.rgbOn[k], P_R_ON + k * 3);
      AEFX_CLR_STRUCT(def); PF_ADD_ANGLE(an, D.rgbAngles[k], P_R_ANG + k * 3);
      BREW_FS(sn, 0, 200, 0, 200, D.rgbStrength[k], 0, P_R_STR + k * 3);
    }
    BREW_ENDTOPIC(T_RGB_END);
  } break;
  default: break;
  }

  out_data->num_params = P_NUM;
  return err;
}

// the selected Look supplies the text fields (custom glyphs, halftone text); controls override the rest
static di::Params readLook(PF_ParamDef* p[]) {
  di::Params P; di::parseParams(P, di::LOOKS[iclamp(pv(p, P_LOOK) - 1, 0, di::LOOK_COUNT - 1)].text);
  P.engine = iclamp(pv(p, P_ENGINE) - 1, 0, 2);
  P.algoHalftone = di::SCREEN_IDS[iclamp(pv(p, P_SCREEN) - 1, 0, 10)];
  P.algoDither = di::DITHER_IDS[iclamp(pv(p, P_DITHER) - 1, 0, 27)];
  P.algoAscii = di::ASCII_IDS[iclamp(pv(p, P_ASCII) - 1, 0, 11)];
  P.ppi = fv(p, P_PPI); P.lpi = fv(p, P_LPI); P.angle = av(p, P_ANGLE); P.pixel = fv(p, P_PIXEL); P.aa = bv(p, P_AA);
  P.tThreshold = fv(p, P_THRESH); P.tStrength = fv(p, P_STRENGTH); P.tDirection = std::string(1, DIR_IDS[iclamp(pv(p, P_DIR) - 1, 0, 3)]);
  P.tWeight = fv(p, P_WEIGHT); P.tSpacing = fv(p, P_SPACING); P.tJitter = fv(p, P_JITTER);
  P.aSize = fv(p, P_ASIZE); P.aEdge = fv(p, P_AEDGE); P.aKeepOrder = bv(p, P_AKEEP); P.aTextMode = bv(p, P_ATEXT);
  P.mode = iclamp(pv(p, P_MODE) - 1, 0, 4);
  P.monoInk = cv(p, P_MONO_INK); P.monoPaper = bv(p, P_MONO_PAPER_ON) ? cv(p, P_MONO_PAPER) : std::string();
  const int nt = iclamp(pv(p, P_TN_COUNT), 1, MAX_TONAL);
  P.tonalInks.clear(); P.tonalAngles.clear();
  for (int k = 0; k < MAX_TONAL; k++) { if (k < nt) P.tonalInks.push_back(cv(p, P_TN1 + k * 2)); P.tonalAngles.push_back(av(p, P_TA1 + k * 2)); }
  P.tonalPaper = bv(p, P_TN_PAPER_ON) ? cv(p, P_TN_PAPER) : std::string();
  const int np = iclamp(pv(p, P_PAL_COUNT) + 1, 2, MAX_PAL);
  P.gradeColors.clear(); for (int k = 0; k < np; k++) P.gradeColors.push_back(cv(p, P_PC1 + k));
  P.gradeSpread = fv(p, P_SPREAD); P.skipLightest = bv(p, P_SKIP);
  for (int k = 0; k < 4; k++) { P.cmykOn[k] = bv(p, P_C_ON + k * 2); P.cmykAngles[k] = av(p, P_C_ANG + k * 2); }
  P.gcr = fv(p, P_GCR);
  for (int k = 0; k < 3; k++) { P.rgbOn[k] = bv(p, P_R_ON + k * 3); P.rgbAngles[k] = av(p, P_R_ANG + k * 3); P.rgbStrength[k] = fv(p, P_R_STR + k * 3); }
  P.preOn = bv(p, P_PRE_ON); P.brightness = fv(p, P_BRIGHT); P.contrast = fv(p, P_CONTRAST); P.gamma = fv(p, P_GAMMA);
  P.black = fv(p, P_BLACK); P.white = fv(p, P_WHITE); P.blur = fv(p, P_BLUR); P.sharpen = fv(p, P_SHARPEN); P.radius = fv(p, P_RADIUS);
  P.noise = fv(p, P_NOISE); P.haze = fv(p, P_HAZE); P.invert = fv(p, P_INVERT);
  P.edgesOn = bv(p, P_EDGE_ON); P.edgeStrength = fv(p, P_EDGE_STR); P.edgeThick = fv(p, P_EDGE_THICK);
  P.dtfOn = bv(p, P_DTF_ON); P.garment = cv(p, P_GARMENT); P.fuzz = fv(p, P_FUZZ); P.feather = fv(p, P_FEATHER); P.dots = bv(p, P_DOTS);
  P.gainOn = bv(p, P_GAIN_ON); P.gainAmount = fv(p, P_GAIN); P.misregOn = bv(p, P_MIS_ON); P.misregAmount = fv(p, P_MIS);
  P.cleanOn = bv(p, P_CLEAN_ON); P.cleanMm = fv(p, P_CLEAN); P.distressOn = bv(p, P_DIS_ON); P.distressAmount = fv(p, P_DIS);
  return P;
}
static void applyLook(PF_ParamDef* p[], int idx) {
  di::Params P; di::parseParams(P, di::LOOKS[iclamp(idx, 0, di::LOOK_COUNT - 1)].text);
  setP(p, P_ENGINE, P.engine + 1);
  setP(p, P_SCREEN, indexOf(di::SCREEN_IDS, P.algoHalftone) + 1); setP(p, P_DITHER, indexOf(di::DITHER_IDS, P.algoDither) + 1);
  setP(p, P_ASCII, indexOf(di::ASCII_IDS, P.algoAscii) + 1);
  setF(p, P_LPI, P.lpi); setA(p, P_ANGLE, P.angle); setF(p, P_PIXEL, P.pixel); setB(p, P_AA, P.aa);
  setF(p, P_THRESH, P.tThreshold); setF(p, P_STRENGTH, P.tStrength);
  setP(p, P_DIR, (int)std::string(DIR_IDS).find(P.tDirection.empty() ? 'h' : P.tDirection[0]) % 4 + 1);
  setF(p, P_WEIGHT, P.tWeight); setF(p, P_SPACING, P.tSpacing); setF(p, P_JITTER, P.tJitter);
  setF(p, P_ASIZE, P.aSize); setF(p, P_AEDGE, P.aEdge); setB(p, P_AKEEP, P.aKeepOrder); setB(p, P_ATEXT, P.aTextMode);
  setP(p, P_MODE, P.mode + 1); setC(p, P_MONO_INK, P.monoInk); setB(p, P_MONO_PAPER_ON, !P.monoPaper.empty());
  if (!P.monoPaper.empty()) setC(p, P_MONO_PAPER, P.monoPaper);
  setP(p, P_TN_COUNT, iclamp((int)P.tonalInks.size(), 1, MAX_TONAL));
  for (int k = 0; k < MAX_TONAL; k++) {
    if (k < (int)P.tonalInks.size()) setC(p, P_TN1 + k * 2, P.tonalInks[k]);
    if (k < (int)P.tonalAngles.size()) setA(p, P_TA1 + k * 2, P.tonalAngles[k]);
  }
  setB(p, P_TN_PAPER_ON, !P.tonalPaper.empty()); if (!P.tonalPaper.empty()) setC(p, P_TN_PAPER, P.tonalPaper);
  setP(p, P_PAL_COUNT, iclamp((int)P.gradeColors.size(), 2, MAX_PAL) - 1);
  for (int k = 0; k < MAX_PAL && k < (int)P.gradeColors.size(); k++) setC(p, P_PC1 + k, P.gradeColors[k]);
  setF(p, P_SPREAD, P.gradeSpread); setB(p, P_SKIP, P.skipLightest);
  for (int k = 0; k < 4; k++) { setB(p, P_C_ON + k * 2, P.cmykOn[k]); setA(p, P_C_ANG + k * 2, P.cmykAngles[k]); }
  setF(p, P_GCR, P.gcr);
  for (int k = 0; k < 3; k++) { setB(p, P_R_ON + k * 3, P.rgbOn[k]); setA(p, P_R_ANG + k * 3, P.rgbAngles[k]); setF(p, P_R_STR + k * 3, P.rgbStrength[k]); }
  setB(p, P_PRE_ON, P.preOn); setF(p, P_BRIGHT, P.brightness); setF(p, P_CONTRAST, P.contrast); setF(p, P_GAMMA, P.gamma);
  setF(p, P_BLACK, P.black); setF(p, P_WHITE, P.white); setF(p, P_BLUR, P.blur); setF(p, P_SHARPEN, P.sharpen); setF(p, P_RADIUS, P.radius);
  setF(p, P_NOISE, P.noise); setF(p, P_HAZE, P.haze); setF(p, P_INVERT, P.invert);
  setB(p, P_EDGE_ON, P.edgesOn); setF(p, P_EDGE_STR, P.edgeStrength); setF(p, P_EDGE_THICK, P.edgeThick);
  setB(p, P_DTF_ON, P.dtfOn); setC(p, P_GARMENT, P.garment); setF(p, P_FUZZ, P.fuzz); setF(p, P_FEATHER, P.feather); setB(p, P_DOTS, P.dots);
  setB(p, P_GAIN_ON, P.gainOn); setF(p, P_GAIN, P.gainAmount); setB(p, P_MIS_ON, P.misregOn); setF(p, P_MIS, P.misregAmount);
  setB(p, P_CLEAN_ON, P.cleanOn); setF(p, P_CLEAN, P.cleanMm); setB(p, P_DIS_ON, P.distressOn); setF(p, P_DIS, P.distressAmount);
}
static PF_Err UserChangedParam(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], const PF_UserChangedParamExtra* which) {
  if (which->param_index == PO(P_LOOK)) applyLook(params, params[P_LOOK]->u.pd.value - 1);
  return PF_Err_NONE;
}

static PF_Err Render(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output) {
  const int w = output->width, h = output->height;
  Image src; readWorld(&params[P_INPUT]->u.ld, w, h, src);
  const double sc = renderScale(in_data);
  di::Params A = readLook(params); A.scale = sc;
  di::Params B; const di::Params* Bp = nullptr;
  int lb = params[P_LOOKB]->u.pd.value;
  if (lb >= 3) { di::parseParams(B, di::LOOKS[iclamp(lb - 3, 0, di::LOOK_COUNT - 1)].text); B.scale = sc; B.ppi = A.ppi; Bp = &B; }
  Motion m = readMotion(params, P_MO_BASE, P_MORPH);
  di::DiMotion dm; dm.breathe = fv(params, P_DM_BREATHE); dm.breatheRate = fv(params, P_DM_BREATHER); dm.tone = fv(params, P_DM_TONE); dm.toneRate = fv(params, P_DM_TONER);
  Clock c = makeClock(in_data, m);
  OutImage out; Prog pr = { in_data };
  if (!di::renderFrame(src, A, Bp, pv(params, P_BG) == 2, dm, m, c, out, progressCb, &pr)) return PF_Interrupt_CANCEL;
  writeWorld(out, output);
  return PF_Err_NONE;
}

extern "C" DllExport PF_Err PluginDataEntryFunction2(PF_PluginDataPtr inPtr, PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr, const char* inHostName, const char* inHostVersion) {
  PF_Err result = PF_Err_NONE;
  PF_REGISTER_EFFECT_EXT2(inPtr, inPluginDataCallBackPtr, "Dithers Lab", "com.franks.dithers.ae",
                          "Lab", AE_RESERVED_INFO, "EffectMain", "https://github.com/franklinsheffield/franks-adobe-tools");
  return result;
}

extern "C" DllExport PF_Err EffectMain(PF_Cmd cmd, PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output, void* extra) {
  PF_Err err = PF_Err_NONE;
  PF_ParamDef* PB[P_NUM];                     // params by id (see param_order.h)
  try {
    switch (cmd) {
      case PF_Cmd_ABOUT: err = About(in_data, out_data); break;
      case PF_Cmd_GLOBAL_SETUP: err = GlobalSetup(in_data, out_data); break;
      case PF_Cmd_PARAMS_SETUP: err = ParamsSetup(in_data, out_data); break;
      case PF_Cmd_USER_CHANGED_PARAM: err = UserChangedParam(in_data, out_data, PO.byId(params, PB), (const PF_UserChangedParamExtra*)extra); break;
      case PF_Cmd_RENDER: err = Render(in_data, out_data, PO.byId(params, PB), output); break;
      default: break;
    }
  } catch (PF_Err& thrown) { err = thrown; }
  catch (...) { err = PF_Err_OUT_OF_MEMORY; }
  return err;
}
