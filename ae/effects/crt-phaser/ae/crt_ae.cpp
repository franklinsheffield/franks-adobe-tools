// Frank's CRT Phaser Brew - After Effects effect (AE SDK glue).
// Params live in topics that mirror the Photoshop panel cards, plus Motion and
// CRT Motion. Rendering is the shared C++ engine (crt_engine.cpp) at 8 and 16 bpc.
#include "AEConfig.h"
#include "entry.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "String_Utils.h"
#include "AE_EffectCBSuites.h"
#include "../crt_params_io.h"
#include "../crt_motion.h"
#include "../crt_presets.h"
#include "brew_ae_version.h"
#include <string>
#include <cstring>

using namespace brew;

// ---------------------------------------------------------------- param ids
enum {
  P_INPUT = 0,
  // Look
  T_LOOK_START, P_LOOK, P_LOOKB, P_MORPH, T_LOOK_END,
  // Phase FX
  T_PHASE_START, P_PH_MODE, P_PH_LINES, P_PH_AMP, P_PH_SMOOTH, P_PH_ANGLE, P_PH_WARP, P_PH_DETAIL, P_PH_WIDTH, P_PH_THRESH, P_PH_DOTS, T_PHASE_END,
  T_PHLOOK_START, P_PH_GLOW, P_PH_FRINGE, P_PH_DEBRIS, P_PH_FLARE, P_PH_GRAIN, P_PH_SEED, T_PHLOOK_END,
  T_PHCOL_START, P_PH_COLOR, P_PH_STOPS,
  P_RC1, P_RP1, P_RC2, P_RP2, P_RC3, P_RP3, P_RC4, P_RP4, P_RC5, P_RP5, P_RC6, P_RP6, P_RC7, P_RP7,
  P_PH_BASE, T_PHCOL_END,
  // Tube
  T_SCREEN_START, P_SCREEN_LINES, P_CONV_X, P_CONV_Y, P_MASK_TYPE, P_MASK_SCALE, P_MASK_STR, P_SCAN_STR, P_SCAN_W, T_SCREEN_END,
  T_TUBE_START, P_BLOOM, P_CURVE, P_CORNER, P_VIGNETTE, P_NOISE, P_ROLL, P_ROLL_STR, P_BRIGHT, P_CONTRAST, P_TINT, T_TUBE_END,
  // Motion (shared)
  T_MO_START, P_MO_ANIMATE, P_MO_SPEED, P_MO_LOOP, P_MO_SEED, P_MO_BOIL, P_MO_DRIFTX, P_MO_DRIFTY, P_MO_SPIN,
  P_MO_PULSE, P_MO_PULSER, P_MO_FLICK, P_MO_FLICKR, P_MO_JIT, P_MO_JITR, P_MO_REVEAL, P_MO_REVMODE, P_MO_REVANG, T_MO_END,
  // CRT motion
  T_CM_START, P_CM_ROLL, P_CM_HOLD, P_CM_SNOW, P_CM_FLICK, P_CM_GRATE, P_CM_GLEN, P_CM_GAMT, P_CM_WOBBLE, P_CM_FLOW, P_CM_WARP, T_CM_END,
  P_NUM
};

static const char* MASKS = "None|Grille|Shadow|Slot|Dots";
static const char* TINTS_S = "Full colour|Green mono|Amber mono|White mono";
static const char* MODES = "Off (classic tube)|Waveform|Linear|Flux|Flux Dots";
static const char* BOILS = "Off|Every frame|On 2s|On 3s|On 4s|On 6s|On 12s";
static const int BOIL_N[] = { 0, 1, 2, 3, 4, 6, 12 };
static const char* REVEALS = "Fade|Wipe|Dissolve|Scan down";

static std::string lookMenu(bool withNone) {
  std::string s = withNone ? "None|(-|" : "";
  for (int i = 0; i < crt::LOOK_COUNT; i++) { if (i) s += "|"; s += crt::LOOKS[i].name; }
  return s;
}

// ------------------------------------------------------------- helpers
#define FS(NAME, VMIN, VMAX, SMIN, SMAX, DFLT, PREC, ID) \
  AEFX_CLR_STRUCT(def); PF_ADD_FLOAT_SLIDERX(NAME, VMIN, VMAX, SMIN, SMAX, DFLT, PREC, 0, 0, ID);
#define TOPIC(NAME, ID, COLLAPSED) \
  AEFX_CLR_STRUCT(def); def.flags = (COLLAPSED) ? PF_ParamFlag_START_COLLAPSED : 0; PF_ADD_TOPIC(NAME, ID);
#define ENDTOPIC(ID) AEFX_CLR_STRUCT(def); PF_END_TOPIC(ID);

static PF_Err About(PF_InData* in_data, PF_OutData* out_data) {
  PF_SPRINTF(out_data->return_msg, "%s v%d.%d\rCRT-06  Frank's Brew suite\rScanlines, phosphor, tube, Phase FX + motion.",
             "Frank's CRT Phaser Brew", BREW_MAJOR, BREW_MINOR);
  return PF_Err_NONE;
}

static PF_Err GlobalSetup(PF_InData* in_data, PF_OutData* out_data) {
  out_data->my_version = BREW_VERSION_PACKED;
  out_data->out_flags = BREW_OUT_FLAGS;
  out_data->out_flags2 = BREW_OUT_FLAGS2;
  return PF_Err_NONE;
}

static PF_Err ParamsSetup(PF_InData* in_data, PF_OutData* out_data) {
  PF_Err err = PF_Err_NONE;
  PF_ParamDef def;
  crt::Params D;                                  // defaults = first look (Arcade Cabinet)
  crt::parseParams(D, crt::LOOKS[0].text);
  static std::string looks = lookMenu(false), looksB = lookMenu(true);

  TOPIC("Look", T_LOOK_START, false);
  AEFX_CLR_STRUCT(def); def.flags = PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY;
  PF_ADD_POPUP("Look", crt::LOOK_COUNT, 1, looks.c_str(), P_LOOK);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Look B (morph to)", crt::LOOK_COUNT + 2, 1, looksB.c_str(), P_LOOKB);
  FS("Morph to Look B", 0, 100, 0, 100, 0, 1, P_MORPH);
  ENDTOPIC(T_LOOK_END);

  TOPIC("Phase FX", T_PHASE_START, true);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Mode", 5, D.phaseMode + 1, MODES, P_PH_MODE);
  FS("Lines (full image)", 20, 600, 20, 600, D.phLines, 0, P_PH_LINES);
  FS("Bend", 0, 100, 0, 100, D.phAmp, 0, P_PH_AMP);
  FS("Smoothness", 0, 100, 0, 100, D.phSmooth, 0, P_PH_SMOOTH);
  AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Line angle", D.phAngle, P_PH_ANGLE);
  FS("Flow warp", 0, 100, 0, 100, D.phWarp, 0, P_PH_WARP);
  FS("Detail", 0, 100, 0, 100, D.phDetail, 0, P_PH_DETAIL);
  FS("Beam width", 5, 100, 5, 100, D.phWidth, 0, P_PH_WIDTH);
  FS("Threshold", 0, 90, 0, 90, D.phThreshold, 0, P_PH_THRESH);
  FS("Dot break-up / size", 0, 100, 0, 100, D.phDots, 0, P_PH_DOTS);
  ENDTOPIC(T_PHASE_END);

  TOPIC("Phase look", T_PHLOOK_START, true);
  FS("Glow", 0, 100, 0, 100, D.phGlow, 0, P_PH_GLOW);
  FS("Colour fringe", 0, 100, 0, 100, D.phFringe, 0, P_PH_FRINGE);
  FS("Signal debris", 0, 100, 0, 100, D.phDebris, 0, P_PH_DEBRIS);
  FS("Prism flare", 0, 100, 0, 100, D.phFlare, 0, P_PH_FLARE);
  FS("Grain", 0, 100, 0, 100, D.phGrain, 0, P_PH_GRAIN);
  FS("Seed", 1, 99, 1, 99, D.phSeed, 0, P_PH_SEED);
  ENDTOPIC(T_PHLOOK_END);

  TOPIC("Phase colour", T_PHCOL_START, true);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Colour", 2, D.phColorFull ? 2 : 1, "Phosphor ramp|Photo's own colours", P_PH_COLOR);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Ramp stops", 6, 4, "2|3|4|5|6|7", P_PH_STOPS);
  for (int s = 0; s < 7; s++) {
    RGB c = { 0, 0, 0 }; double p = s * 100.0 / 6;
    if (s < (int)D.phRamp.size()) { c = hexToRgb(D.phRamp[s].c); p = D.phRamp[s].p; }
    char cn[32], pn[32]; snprintf(cn, sizeof cn, "Stop %d colour", s + 1); snprintf(pn, sizeof pn, "Stop %d position", s + 1);
    AEFX_CLR_STRUCT(def); PF_ADD_COLOR(cn, (A_u_char)c.r, (A_u_char)c.g, (A_u_char)c.b, P_RC1 + s * 2);
    FS(pn, 0, 100, 0, 100, p, 0, P_RP1 + s * 2);
  }
  { RGB b = hexToRgb(D.phBase); AEFX_CLR_STRUCT(def); PF_ADD_COLOR("Screen base", (A_u_char)b.r, (A_u_char)b.g, (A_u_char)b.b, P_PH_BASE); }
  ENDTOPIC(T_PHCOL_END);

  TOPIC("Screen", T_SCREEN_START, false);
  FS("Lines (full image)", 60, 1200, 60, 1200, D.screenLines, 0, P_SCREEN_LINES);
  FS("Red / blue shift X", -10, 10, -10, 10, D.convX, 1, P_CONV_X);
  FS("Red / blue shift Y", -10, 10, -10, 10, D.convY, 1, P_CONV_Y);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Phosphor mask", 5, D.maskType + 1, MASKS, P_MASK_TYPE);
  FS("Mask scale", 1, 8, 1, 8, D.maskScale, 0, P_MASK_SCALE);
  FS("Mask strength", 0, 100, 0, 100, D.maskStrength, 0, P_MASK_STR);
  FS("Scanline strength", 0, 100, 0, 100, D.scanStrength, 0, P_SCAN_STR);
  FS("Scanline beam width", 10, 100, 10, 100, D.scanWidth, 0, P_SCAN_W);
  ENDTOPIC(T_SCREEN_END);

  TOPIC("Tube and finish", T_TUBE_START, false);
  FS("Bloom", 0, 100, 0, 100, D.bloom, 0, P_BLOOM);
  FS("Curvature", 0, 100, 0, 100, D.curve, 0, P_CURVE);
  FS("Corner radius", 0, 100, 0, 100, D.corner, 0, P_CORNER);
  FS("Vignette", 0, 100, 0, 100, D.vignette, 0, P_VIGNETTE);
  FS("Noise", 0, 100, 0, 100, D.noise, 0, P_NOISE);
  FS("Roll band position", 0, 100, 0, 100, D.roll, 0, P_ROLL);
  FS("Roll band strength", 0, 100, 0, 100, D.rollStrength, 0, P_ROLL_STR);
  FS("Brightness", 50, 200, 50, 200, D.brightness, 0, P_BRIGHT);
  FS("Contrast", 50, 200, 50, 200, D.contrast, 0, P_CONTRAST);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Phosphor colour", 4, D.tint + 1, TINTS_S, P_TINT);
  ENDTOPIC(T_TUBE_END);

  TOPIC("Motion", T_MO_START, false);
  AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX("Animate", 0, 0, P_MO_ANIMATE);
  FS("Speed (%)", 0, 400, 0, 400, 100, 0, P_MO_SPEED);
  FS("Loop (frames, 0 = endless)", 0, 600, 0, 600, 0, 0, P_MO_LOOP);
  FS("Seed", 0, 9999, 0, 999, 0, 0, P_MO_SEED);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Boil", 7, 1, BOILS, P_MO_BOIL);
  FS("Drift X (px/s)", -500, 500, -200, 200, 0, 1, P_MO_DRIFTX);
  FS("Drift Y (px/s)", -500, 500, -200, 200, 0, 1, P_MO_DRIFTY);
  FS("Spin (deg/s)", -360, 360, -90, 90, 0, 1, P_MO_SPIN);
  FS("Pulse (%)", 0, 100, 0, 100, 0, 0, P_MO_PULSE);
  FS("Pulse rate (Hz)", 0, 10, 0, 4, 1, 2, P_MO_PULSER);
  FS("Flicker (%)", 0, 100, 0, 100, 0, 0, P_MO_FLICK);
  FS("Flicker rate (Hz)", 0, 30, 0, 30, 12, 1, P_MO_FLICKR);
  FS("Jitter (px)", 0, 50, 0, 20, 0, 1, P_MO_JIT);
  FS("Jitter rate (Hz)", 0, 30, 0, 30, 12, 1, P_MO_JITR);
  FS("Reveal (%)", 0, 100, 0, 100, 100, 1, P_MO_REVEAL);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Reveal mode", 4, 1, REVEALS, P_MO_REVMODE);
  AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Wipe angle", 0, P_MO_REVANG);
  ENDTOPIC(T_MO_END);

  TOPIC("CRT motion", T_CM_START, false);
  FS("Scanline roll (lines/s)", -60, 60, -20, 20, 0, 1, P_CM_ROLL);
  FS("Vertical hold (screens/s)", -4, 4, -1, 1, 0, 2, P_CM_HOLD);
  FS("Signal snow (%)", 0, 100, 0, 100, 0, 0, P_CM_SNOW);
  FS("Tube flicker (%)", 0, 100, 0, 100, 0, 0, P_CM_FLICK);
  FS("Channel glitch (bursts/s)", 0, 5, 0, 2, 0, 2, P_CM_GRATE);
  FS("Glitch length (frames)", 1, 30, 1, 12, 6, 0, P_CM_GLEN);
  FS("Glitch amount (%)", 0, 100, 0, 100, 60, 0, P_CM_GAMT);
  FS("Convergence wobble (px)", 0, 10, 0, 5, 0, 1, P_CM_WOBBLE);
  FS("Phase flow (lines/s)", -10, 10, -2, 2, 0, 2, P_CM_FLOW);
  FS("Warp drift (px/s)", -500, 500, -200, 200, 0, 1, P_CM_WARP);
  ENDTOPIC(T_CM_END);

  out_data->num_params = P_NUM;
  return err;
}

// ---------------------------------------------------------- params -> engine
static double fv(PF_ParamDef* p[], int i) { return p[i]->u.fs_d.value; }
static int pv(PF_ParamDef* p[], int i) { return p[i]->u.pd.value; }
static double av(PF_ParamDef* p[], int i) { return FIX_2_FLOAT(p[i]->u.ad.value); }
static std::string hexOf(const PF_Pixel& c) { char b[8]; snprintf(b, sizeof b, "#%02X%02X%02X", c.red, c.green, c.blue); return b; }

static crt::Params readLook(PF_ParamDef* p[]) {
  crt::Params P;
  P.phaseMode = pv(p, P_PH_MODE) - 1;
  P.phLines = fv(p, P_PH_LINES); P.phAmp = fv(p, P_PH_AMP); P.phSmooth = fv(p, P_PH_SMOOTH);
  P.phAngle = std::fmod(av(p, P_PH_ANGLE) + 3600, 180);
  P.phWarp = fv(p, P_PH_WARP); P.phDetail = fv(p, P_PH_DETAIL); P.phWidth = fv(p, P_PH_WIDTH);
  P.phThreshold = fv(p, P_PH_THRESH); P.phDots = fv(p, P_PH_DOTS);
  P.phGlow = fv(p, P_PH_GLOW); P.phFringe = fv(p, P_PH_FRINGE); P.phDebris = fv(p, P_PH_DEBRIS);
  P.phFlare = fv(p, P_PH_FLARE); P.phGrain = fv(p, P_PH_GRAIN); P.phSeed = std::round(fv(p, P_PH_SEED));
  P.phColorFull = pv(p, P_PH_COLOR) == 2;
  int stops = pv(p, P_PH_STOPS) + 1;
  P.phRamp.clear();
  for (int s = 0; s < stops; s++) P.phRamp.push_back({ fv(p, P_RP1 + s * 2), hexOf(p[P_RC1 + s * 2]->u.cd.value) });
  P.phBase = hexOf(p[P_PH_BASE]->u.cd.value);
  P.screenLines = fv(p, P_SCREEN_LINES); P.convX = fv(p, P_CONV_X); P.convY = fv(p, P_CONV_Y);
  P.maskType = pv(p, P_MASK_TYPE) - 1; P.maskScale = std::round(fv(p, P_MASK_SCALE)); P.maskStrength = fv(p, P_MASK_STR);
  P.scanStrength = fv(p, P_SCAN_STR); P.scanWidth = fv(p, P_SCAN_W);
  P.bloom = fv(p, P_BLOOM); P.curve = fv(p, P_CURVE); P.corner = fv(p, P_CORNER); P.vignette = fv(p, P_VIGNETTE);
  P.noise = fv(p, P_NOISE); P.roll = fv(p, P_ROLL); P.rollStrength = fv(p, P_ROLL_STR);
  P.brightness = fv(p, P_BRIGHT); P.contrast = fv(p, P_CONTRAST); P.tint = pv(p, P_TINT) - 1;
  return P;
}
static Motion readMotion(PF_ParamDef* p[]) {
  Motion m;
  m.animate = p[P_MO_ANIMATE]->u.bd.value != 0; m.speed = fv(p, P_MO_SPEED); m.loopFrames = std::round(fv(p, P_MO_LOOP));
  m.seed = std::round(fv(p, P_MO_SEED)); m.boil = BOIL_N[iclamp(pv(p, P_MO_BOIL) - 1, 0, 6)];
  m.driftX = fv(p, P_MO_DRIFTX); m.driftY = fv(p, P_MO_DRIFTY); m.spin = fv(p, P_MO_SPIN);
  m.pulse = fv(p, P_MO_PULSE); m.pulseRate = fv(p, P_MO_PULSER); m.flicker = fv(p, P_MO_FLICK); m.flickerRate = fv(p, P_MO_FLICKR);
  m.jitter = fv(p, P_MO_JIT); m.jitterRate = fv(p, P_MO_JITR);
  m.reveal = fv(p, P_MO_REVEAL); m.revealMode = pv(p, P_MO_REVMODE) - 1; m.revealAngle = av(p, P_MO_REVANG);
  m.morph = fv(p, P_MORPH);
  return m;
}
static crt::CrtMotion readCrtMotion(PF_ParamDef* p[]) {
  crt::CrtMotion c;
  c.rollSpeed = fv(p, P_CM_ROLL); c.holdSpeed = fv(p, P_CM_HOLD); c.snow = fv(p, P_CM_SNOW); c.tubeFlicker = fv(p, P_CM_FLICK);
  c.glitchRate = fv(p, P_CM_GRATE); c.glitchLength = fv(p, P_CM_GLEN); c.glitchAmount = fv(p, P_CM_GAMT);
  c.convWobble = fv(p, P_CM_WOBBLE); c.fieldFlow = fv(p, P_CM_FLOW); c.warpFlow = fv(p, P_CM_WARP);
  return c;
}

// --------------------------------------------- Look popup fills every control
static void setF(PF_ParamDef* p[], int i, double v) { p[i]->u.fs_d.value = v; p[i]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE; }
static void setP(PF_ParamDef* p[], int i, int v) { p[i]->u.pd.value = v; p[i]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE; }
static void setC(PF_ParamDef* p[], int i, const std::string& hex) {
  RGB c = hexToRgb(isHex(hex) ? hex : "#000000");
  p[i]->u.cd.value.red = (A_u_char)c.r; p[i]->u.cd.value.green = (A_u_char)c.g; p[i]->u.cd.value.blue = (A_u_char)c.b; p[i]->u.cd.value.alpha = 255;
  p[i]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE;
}
static void applyLook(PF_ParamDef* p[], int lookIndex) {
  crt::Params P; crt::parseParams(P, crt::LOOKS[iclamp(lookIndex, 0, crt::LOOK_COUNT - 1)].text);
  setP(p, P_PH_MODE, P.phaseMode + 1);
  setF(p, P_PH_LINES, P.phLines); setF(p, P_PH_AMP, P.phAmp); setF(p, P_PH_SMOOTH, P.phSmooth);
  p[P_PH_ANGLE]->u.ad.value = FLOAT2FIX(P.phAngle); p[P_PH_ANGLE]->uu.change_flags = PF_ChangeFlag_CHANGED_VALUE;
  setF(p, P_PH_WARP, P.phWarp); setF(p, P_PH_DETAIL, P.phDetail); setF(p, P_PH_WIDTH, P.phWidth);
  setF(p, P_PH_THRESH, P.phThreshold); setF(p, P_PH_DOTS, P.phDots);
  setF(p, P_PH_GLOW, P.phGlow); setF(p, P_PH_FRINGE, P.phFringe); setF(p, P_PH_DEBRIS, P.phDebris);
  setF(p, P_PH_FLARE, P.phFlare); setF(p, P_PH_GRAIN, P.phGrain); setF(p, P_PH_SEED, P.phSeed);
  setP(p, P_PH_COLOR, P.phColorFull ? 2 : 1);
  int n = (int)std::min<size_t>(7, std::max<size_t>(2, P.phRamp.size()));
  setP(p, P_PH_STOPS, n - 1);
  for (int s = 0; s < 7; s++) {
    if (s < (int)P.phRamp.size()) { setC(p, P_RC1 + s * 2, P.phRamp[s].c); setF(p, P_RP1 + s * 2, P.phRamp[s].p); }
  }
  setC(p, P_PH_BASE, P.phBase);
  setF(p, P_SCREEN_LINES, P.screenLines); setF(p, P_CONV_X, P.convX); setF(p, P_CONV_Y, P.convY);
  setP(p, P_MASK_TYPE, P.maskType + 1); setF(p, P_MASK_SCALE, P.maskScale); setF(p, P_MASK_STR, P.maskStrength);
  setF(p, P_SCAN_STR, P.scanStrength); setF(p, P_SCAN_W, P.scanWidth);
  setF(p, P_BLOOM, P.bloom); setF(p, P_CURVE, P.curve); setF(p, P_CORNER, P.corner); setF(p, P_VIGNETTE, P.vignette);
  setF(p, P_NOISE, P.noise); setF(p, P_ROLL, P.roll); setF(p, P_ROLL_STR, P.rollStrength);
  setF(p, P_BRIGHT, P.brightness); setF(p, P_CONTRAST, P.contrast); setP(p, P_TINT, P.tint + 1);
}

static PF_Err UserChangedParam(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], const PF_UserChangedParamExtra* which) {
  if (which->param_index == P_LOOK) applyLook(params, params[P_LOOK]->u.pd.value - 1);
  return PF_Err_NONE;
}

// --------------------------------------------------------------- render
struct Prog { PF_InData* in_data; };
static bool progressCb(void* ctx, int done, int total) {
  PF_InData* in_data = ((Prog*)ctx)->in_data;
  if (PF_ABORT(in_data)) return false;
  PF_PROGRESS(in_data, done, total);
  return true;
}

static PF_Err Render(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output) {
  PF_EffectWorld* input = &params[P_INPUT]->u.ld;
  const int w = output->width, h = output->height;
  const bool deep = PF_WORLD_IS_DEEP(output);
  // input -> 0..255 float planes
  Image src; src.resize(w, h);
  const int iw = std::min(w, (int)input->width), ih = std::min(h, (int)input->height);
  for (int y = 0; y < ih; y++) {
    if (deep) {
      PF_Pixel16* row = (PF_Pixel16*)((char*)input->data + (size_t)y * input->rowbytes);
      for (int x = 0; x < iw; x++) { size_t i = (size_t)y * w + x; const float k = 255.f / PF_MAX_CHAN16;
        src.R[i] = row[x].red * k; src.G[i] = row[x].green * k; src.B[i] = row[x].blue * k; src.A[i] = row[x].alpha * k; }
    } else {
      PF_Pixel8* row = (PF_Pixel8*)((char*)input->data + (size_t)y * input->rowbytes);
      for (int x = 0; x < iw; x++) { size_t i = (size_t)y * w + x;
        src.R[i] = row[x].red; src.G[i] = row[x].green; src.B[i] = row[x].blue; src.A[i] = row[x].alpha; }
    }
  }
  crt::Params A = readLook(params);
  const double sc = (double)in_data->downsample_y.num / std::max(1, (int)in_data->downsample_y.den);
  A.scale = sc; A.fullH = h / std::max(1e-6, sc);
  crt::Params B; const crt::Params* Bp = nullptr;
  int lb = params[P_LOOKB]->u.pd.value;          // 1 = None, 2 = separator, 3.. = looks
  if (lb >= 3) { crt::parseParams(B, crt::LOOKS[iclamp(lb - 3, 0, crt::LOOK_COUNT - 1)].text); B.scale = A.scale; B.fullH = A.fullH; Bp = &B; }
  Motion m = readMotion(params);
  crt::CrtMotion cm = readCrtMotion(params);
  const double tsec = in_data->time_scale ? (double)in_data->current_time / in_data->time_scale : 0;
  const double step = in_data->local_time_step ? std::fabs((double)in_data->local_time_step) : (double)in_data->time_step;
  const double fps = step > 0 ? (double)in_data->time_scale / step : 30;
  Clock c = Clock::make(m, tsec, fps);
  OutImage out; Prog pr = { in_data };
  if (!crt::renderFrame(src, A, Bp, cm, m, c, out, progressCb, &pr)) return PF_Interrupt_CANCEL;
  // engine output -> world (8-bit truncates like the Photoshop engine)
  for (int y = 0; y < h; y++) {
    const float* o = &out.px[(size_t)y * w * 4];
    if (deep) {
      PF_Pixel16* row = (PF_Pixel16*)((char*)output->data + (size_t)y * output->rowbytes);
      for (int x = 0; x < w; x++) { const double k = PF_MAX_CHAN16 / 255.0;
        row[x].red = (A_u_short)clamp(o[x * 4] * k + 0.5, 0, PF_MAX_CHAN16); row[x].green = (A_u_short)clamp(o[x * 4 + 1] * k + 0.5, 0, PF_MAX_CHAN16);
        row[x].blue = (A_u_short)clamp(o[x * 4 + 2] * k + 0.5, 0, PF_MAX_CHAN16); row[x].alpha = (A_u_short)clamp(o[x * 4 + 3] * k + 0.5, 0, PF_MAX_CHAN16); }
    } else {
      PF_Pixel8* row = (PF_Pixel8*)((char*)output->data + (size_t)y * output->rowbytes);
      for (int x = 0; x < w; x++) {
        row[x].red = (A_u_char)(int)clamp(o[x * 4], 0, 255); row[x].green = (A_u_char)(int)clamp(o[x * 4 + 1], 0, 255);
        row[x].blue = (A_u_char)(int)clamp(o[x * 4 + 2], 0, 255); row[x].alpha = (A_u_char)(int)clamp(o[x * 4 + 3], 0, 255); }
    }
  }
  return PF_Err_NONE;
}

// --------------------------------------------------------------- entry
extern "C" DllExport PF_Err PluginDataEntryFunction2(PF_PluginDataPtr inPtr, PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr, const char* inHostName, const char* inHostVersion) {
  PF_Err result = PF_Err_NONE;               // the SDK macro assigns `result`
  PF_REGISTER_EFFECT_EXT2(inPtr, inPluginDataCallBackPtr, "Frank's CRT Phaser Brew", "com.franks.crtphaser.ae",
                          "Frank's Brew", AE_RESERVED_INFO, "EffectMain", "https://github.com/franklinsheffield/franks-adobe-tools");
  return result;
}

extern "C" DllExport PF_Err EffectMain(PF_Cmd cmd, PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output, void* extra) {
  PF_Err err = PF_Err_NONE;
  try {
    switch (cmd) {
      case PF_Cmd_ABOUT: err = About(in_data, out_data); break;
      case PF_Cmd_GLOBAL_SETUP: err = GlobalSetup(in_data, out_data); break;
      case PF_Cmd_PARAMS_SETUP: err = ParamsSetup(in_data, out_data); break;
      case PF_Cmd_USER_CHANGED_PARAM: err = UserChangedParam(in_data, out_data, params, (const PF_UserChangedParamExtra*)extra); break;
      case PF_Cmd_RENDER: err = Render(in_data, out_data, params, output); break;
      default: break;
    }
  } catch (PF_Err& thrown) { err = thrown; }
  catch (...) { err = PF_Err_OUT_OF_MEMORY; }
  return err;
}
