// Frank's Chrometone Brew 1.1 - After Effects effect (AE SDK glue). Liquid chrome with
// Look / Look B morph, outline bevels, extrusion, glow stack, shine FX, the shared Motion group
// and Chrome motion.
#include "AEConfig.h"
#include "entry.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "String_Utils.h"
#include "AE_EffectCBSuites.h"
#include "brew_ae.h"
#include "../ct_params_io.h"
#include "../ct_motion.h"
#include "../ct_presets.h"
#include "brew_ae_version.h"
#include "param_order.h"

using namespace brew;
using namespace brewae;

static const int MAX_STOPS = 6;
enum {
  P_INPUT = 0,
  T_LOOK_START, P_LOOK, P_LOOKB, P_MORPH, T_LOOK_END,
  T_METAL_START, P_STOPS, P_SC1, P_SP1, P_SC2, P_SP2, P_SC3, P_SP3, P_SC4, P_SP4, P_SC5, P_SP5, P_SC6, P_SP6, P_INVERT, T_METAL_END,
  T_TONE_START, P_BLUR, P_CONTRAST, P_MID, P_BCOUNT, P_BPHASE, P_BSHAPE, P_BSOFT, P_BMIX, T_TONE_END,
  T_REL_START, P_DEPTH, P_ANGLE, P_GLOSS, P_SPEC, P_RSOFT, T_REL_END,
  T_FIN_START, P_GRAIN, P_BLOOM, P_MIX, T_FIN_END,
  T_SURF_START, P_FROM, P_KEY, P_BEVEL, P_PROFILE, P_REFLECT, P_HORIZON, P_WAVE, P_WAVESIZE,
  P_SKC1, P_SKP1, P_SKC2, P_SKP2, P_SKC3, P_SKP3, P_GRC1, P_GRP1, P_GRC2, P_GRP2, P_GRC3, P_GRP3, T_SURF_END,
  T_EX_START, P_EX_ON, P_EX_DEPTH, P_EX_ANGLE, P_EX_PERSP, P_EX_FRONT, P_EX_BACK, P_EX_SHADE, P_EX_LINES, P_EX_SHADOW, T_EX_END,
  T_G1_START, P_G1_ON, P_G1_TYPE, P_G1_COL, P_G1_SIZE, P_G1_STR, T_G1_END,
  T_G2_START, P_G2_ON, P_G2_TYPE, P_G2_COL, P_G2_SIZE, P_G2_STR, T_G2_END,
  T_G3_START, P_G3_ON, P_G3_TYPE, P_G3_COL, P_G3_SIZE, P_G3_STR, T_G3_END,
  T_G4_START, P_G4_ON, P_G4_TYPE, P_G4_COL, P_G4_SIZE, P_G4_STR, T_G4_END,
  T_SHINE_START, P_GL_ON, P_GL_COUNT, P_GL_SIZE, P_GL_RAYS, P_GL_ROT, P_GL_COL,
  P_SW_ON, P_SW_ANGLE, P_SW_POS, P_SW_WIDTH, P_SW_STR, P_RIM_ON, P_RIM_COL, P_RIM_WIDTH,
  P_ARC_ON, P_ARC_COUNT, P_ARC_COL, P_ARC_SPREAD, T_SHINE_END,
  P_MO_BASE, P_MO_LAST = P_MO_BASE + MO_COUNT - 1,
  T_CM_START, P_CM_FLOW, P_CM_SWEEP, P_CM_TWINKLE, P_CM_TWINKLER, T_CM_END,
  P_NUM
};
static const int GSTRIDE = T_G2_START - T_G1_START;
static const char* SHAPES = "Sine|Triangle|Hard";
static const char* FROMS = "Brightness (classic)|Auto|Outline (shape)";
static const char* PROFILES = "Chamfer|Round|Rim";
static const char* REFLECTS = "Metal gradient|Horizon (sky + ground)";
static const char* GTYPES = "Dreamy|Halo|Neon|Bloom|Inner";

static PF_Err About(PF_InData* in_data, PF_OutData* out_data) {
  PF_SPRINTF(out_data->return_msg, "%s v%d.%d\rCT-02  Lab suite\rLiquid chrome + motion.", "Chroma Lab", BREW_MAJOR, BREW_MINOR);
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
static const int BLOCK_ORDER[] = { P_MO_BASE, T_CM_START, T_LOOK_START, T_METAL_START, T_TONE_START, T_REL_START, T_FIN_START, T_SURF_START, T_EX_START, T_SHINE_START };
static const brew::ParamOrder PO(BLOCK_ORDER, (int)(sizeof BLOCK_ORDER / sizeof BLOCK_ORDER[0]), P_NUM);

static PF_Err ParamsSetup(PF_InData* in_data, PF_OutData* out_data) {
  PF_Err err = PF_Err_NONE; PF_ParamDef def;
  ct::Params D; ct::parseParams(D, ct::LOOKS[0].text);
  static std::string looks = lookMenu(ct::LOOKS, ct::LOOK_COUNT, false), looksB = lookMenu(ct::LOOKS, ct::LOOK_COUNT, true);

  for (int block : BLOCK_ORDER) switch (block) {
  case P_MO_BASE: {  // Motion
    if (!err) err = addMotion(in_data, P_MO_BASE, "Spin: light orbit (deg/s)", "Drift X: reflection scroll (px/s)", "Drift Y: horizon rise (px/s)");
  } break;
  case T_CM_START: {  // Chrome motion
    BREW_TOPIC("Chrome motion", T_CM_START, false);
    BREW_FS("Band flow (deg/s)", -720, 720, -180, 180, 0, 1, P_CM_FLOW);
    BREW_FS("Sweep travel (%/s)", -400, 400, -100, 100, 0, 1, P_CM_SWEEP);
    BREW_FS("Glint twinkle (%)", 0, 100, 0, 100, 0, 0, P_CM_TWINKLE);
    BREW_FS("Twinkle rate (Hz)", 0, 20, 0, 10, 3, 2, P_CM_TWINKLER);
    BREW_ENDTOPIC(T_CM_END);
  } break;
  case T_LOOK_START: {  // Look
    BREW_TOPIC("Look", T_LOOK_START, false);
    AEFX_CLR_STRUCT(def); def.flags = PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY;
    PF_ADD_POPUP("Look", ct::LOOK_COUNT, 1, looks.c_str(), P_LOOK);
    POPUP("Look B (morph to)", ct::LOOK_COUNT + 2, 1, looksB.c_str(), P_LOOKB);
    BREW_FS("Morph to Look B", 0, 100, 0, 100, 0, 1, P_MORPH);
    BREW_ENDTOPIC(T_LOOK_END);
  } break;
  case T_METAL_START: {  // Metal
    BREW_TOPIC("Metal", T_METAL_START, false);
    POPUP("Gradient stops", 5, (int)std::max<size_t>(2, std::min<size_t>(MAX_STOPS, D.stops.size())) - 1, "2|3|4|5|6", P_STOPS);
    for (int s = 0; s < MAX_STOPS; s++) {
      std::string hex = "#808080"; double p = s * 100.0 / (MAX_STOPS - 1);
      if (s < (int)D.stops.size()) { hex = D.stops[s].c; p = D.stops[s].p; }
      char cn[32], pn[32]; snprintf(cn, sizeof cn, "Stop %d colour", s + 1); snprintf(pn, sizeof pn, "Stop %d position", s + 1);
      COLOR(cn, hex, P_SC1 + s * 2);
      BREW_FS(pn, 0, 100, 0, 100, p, 0, P_SP1 + s * 2);
    }
    CHECK("Invert", D.invert, P_INVERT);
    BREW_ENDTOPIC(T_METAL_END);
  } break;
  case T_TONE_START: {  // Tone + bands
    BREW_TOPIC("Tone + bands", T_TONE_START, true);
    BREW_FS("Pre-blur (px)", 0, 40, 0, 20, D.blur, 1, P_BLUR);
    BREW_FS("Contrast (%)", 10, 400, 10, 300, D.contrast, 0, P_CONTRAST);
    BREW_FS("Midpoint (%)", 0, 100, 0, 100, D.mid, 0, P_MID);
    BREW_FS("Bands", 0, 12, 0, 12, D.bandCount, 0, P_BCOUNT);
    BREW_FS("Band phase (deg)", -3600, 3600, 0, 360, D.bandPhase, 0, P_BPHASE);
    POPUP("Band shape", 3, D.bandShape + 1, SHAPES, P_BSHAPE);
    BREW_FS("Band softness (%)", 0, 100, 0, 100, D.bandSoft, 0, P_BSOFT);
    BREW_FS("Band mix (%)", 0, 100, 0, 100, D.bandMix, 0, P_BMIX);
    BREW_ENDTOPIC(T_TONE_END);
  } break;
  case T_REL_START: {  // Relief + light
    BREW_TOPIC("Relief + light", T_REL_START, true);
    BREW_FS("Depth (%)", 0, 100, 0, 100, D.depth, 0, P_DEPTH);
    AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Light angle", D.angle, P_ANGLE);
    BREW_FS("Gloss", 0, 100, 0, 100, D.gloss, 0, P_GLOSS);
    BREW_FS("Specular (%)", 0, 100, 0, 100, D.spec, 0, P_SPEC);
    BREW_FS("Softness (px)", 0, 20, 0, 20, D.reliefSoft, 1, P_RSOFT);
    BREW_ENDTOPIC(T_REL_END);
  } break;
  case T_FIN_START: {  // Finish
    BREW_TOPIC("Finish", T_FIN_START, true);
    BREW_FS("Grain (%)", 0, 100, 0, 100, D.grain, 0, P_GRAIN);
    BREW_FS("Bloom (%)", 0, 100, 0, 100, D.bloom, 0, P_BLOOM);
    BREW_FS("Mix with original (%)", 0, 100, 0, 100, D.mix, 0, P_MIX);
    BREW_ENDTOPIC(T_FIN_END);
  } break;
  case T_SURF_START: {  // Surface
    BREW_TOPIC("Surface", T_SURF_START, true);
    POPUP("Build from", 3, D.from + 1, FROMS, P_FROM);
    BREW_FS("Dark key (%)", 0, 95, 0, 60, D.key, 0, P_KEY);
    BREW_FS("Bevel (px)", 1, 200, 1, 120, D.bevel, 0, P_BEVEL);
    POPUP("Profile", 3, D.profile + 1, PROFILES, P_PROFILE);
    POPUP("Reflection", 2, D.reflect + 1, REFLECTS, P_REFLECT);
    BREW_FS("Horizon (%)", 0, 100, 0, 100, D.horizon, 0, P_HORIZON);
    BREW_FS("Horizon wave (%)", 0, 100, 0, 100, D.wave, 0, P_WAVE);
    BREW_FS("Wave size (%)", 0, 100, 0, 100, D.waveSize, 0, P_WAVESIZE);
    for (int s = 0; s < 3; s++) {
      char cn[32], pn[32]; snprintf(cn, sizeof cn, "Sky %d colour", s + 1); snprintf(pn, sizeof pn, "Sky %d position", s + 1);
      COLOR(cn, D.sky[s].c, P_SKC1 + s * 2); BREW_FS(pn, 0, 100, 0, 100, D.sky[s].p, 0, P_SKP1 + s * 2);
    }
    for (int s = 0; s < 3; s++) {
      char cn[32], pn[32]; snprintf(cn, sizeof cn, "Ground %d colour", s + 1); snprintf(pn, sizeof pn, "Ground %d position", s + 1);
      COLOR(cn, D.ground[s].c, P_GRC1 + s * 2); BREW_FS(pn, 0, 100, 0, 100, D.ground[s].p, 0, P_GRP1 + s * 2);
    }
    BREW_ENDTOPIC(T_SURF_END);
  } break;
  case T_EX_START: {  // Extrusion
    BREW_TOPIC("Extrusion", T_EX_START, true);
    CHECK("Extrude", D.exOn, P_EX_ON);
    BREW_FS("Depth (px)", 0, 400, 0, 200, D.exDepth, 0, P_EX_DEPTH);
    BREW_FS("Direction (deg)", 0, 360, 0, 360, D.exAngle, 0, P_EX_ANGLE);
    BREW_FS("Perspective (%)", 0, 100, 0, 100, D.exPersp, 0, P_EX_PERSP);
    COLOR("Wall front", D.exStops.front().c, P_EX_FRONT);
    COLOR("Wall back", D.exStops.back().c, P_EX_BACK);
    BREW_FS("Shading (%)", 0, 100, 0, 100, D.exShade, 0, P_EX_SHADE);
    BREW_FS("Edge lines (%)", 0, 100, 0, 100, D.exLines, 0, P_EX_LINES);
    BREW_FS("Long shadow (%)", 0, 100, 0, 100, D.exShadow, 0, P_EX_SHADOW);
    BREW_ENDTOPIC(T_EX_END);

    for (int g = 0; g < 4; g++) {
      const int b = g * GSTRIDE; char tn[16]; snprintf(tn, sizeof tn, "Glow %d", g + 1);
      BREW_TOPIC(tn, T_G1_START + b, true);
      CHECK("On", D.glow[g].on, P_G1_ON + b);
      POPUP("Type", 5, D.glow[g].type + 1, GTYPES, P_G1_TYPE + b);
      COLOR("Colour", D.glow[g].color, P_G1_COL + b);
      BREW_FS("Size (px)", 1, 300, 1, 150, D.glow[g].size, 0, P_G1_SIZE + b);
      BREW_FS("Strength (%)", 0, 100, 0, 100, D.glow[g].strength, 0, P_G1_STR + b);
      BREW_ENDTOPIC(T_G1_END + b);
    }
  } break;
  case T_SHINE_START: {  // Shine
    BREW_TOPIC("Shine", T_SHINE_START, true);
    CHECK("Glints", D.glOn, P_GL_ON);
    BREW_FS("Glint count", 0, 20, 0, 12, D.glCount, 0, P_GL_COUNT);
    BREW_FS("Glint size (px)", 2, 400, 2, 200, D.glSize, 0, P_GL_SIZE);
    BREW_FS("Glint rays", 2, 16, 2, 16, D.glRays, 0, P_GL_RAYS);
    BREW_FS("Glint rotation (deg)", -180, 180, -180, 180, D.glRot, 0, P_GL_ROT);
    COLOR("Glint colour", D.glColor, P_GL_COL);
    CHECK("Sweep", D.swOn, P_SW_ON);
    BREW_FS("Sweep angle (deg)", 0, 180, 0, 180, D.swAngle, 0, P_SW_ANGLE);
    BREW_FS("Sweep position (%)", -20, 120, 0, 100, D.swPos, 0, P_SW_POS);
    BREW_FS("Sweep width (%)", 1, 100, 1, 100, D.swWidth, 0, P_SW_WIDTH);
    BREW_FS("Sweep strength (%)", 0, 100, 0, 100, D.swStrength, 0, P_SW_STR);
    CHECK("Rim light", D.rimOn, P_RIM_ON);
    COLOR("Rim colour", D.rimColor, P_RIM_COL);
    BREW_FS("Rim width (px)", 1, 60, 1, 40, D.rimWidth, 0, P_RIM_WIDTH);
    CHECK("Electric arcs", D.arcOn, P_ARC_ON);
    BREW_FS("Arc count", 0, 20, 0, 12, D.arcCount, 0, P_ARC_COUNT);
    COLOR("Arc colour", D.arcColor, P_ARC_COL);
    BREW_FS("Arc spread (%)", 0, 100, 0, 100, D.arcSpread, 0, P_ARC_SPREAD);
    BREW_ENDTOPIC(T_SHINE_END);
  } break;
  default: break;
  }

  out_data->num_params = P_NUM;
  return err;
}

static ct::Params readLook(PF_ParamDef* p[]) {
  ct::Params P;
  int n = iclamp(pv(p, P_STOPS) + 1, 2, MAX_STOPS); P.stops.clear();
  for (int s = 0; s < n; s++) P.stops.push_back({ fv(p, P_SP1 + s * 2), cv(p, P_SC1 + s * 2) });
  P.invert = bv(p, P_INVERT);
  P.blur = fv(p, P_BLUR); P.contrast = fv(p, P_CONTRAST); P.mid = fv(p, P_MID);
  P.bandCount = std::round(fv(p, P_BCOUNT)); P.bandPhase = fv(p, P_BPHASE); P.bandShape = iclamp(pv(p, P_BSHAPE) - 1, 0, 2);
  P.bandSoft = fv(p, P_BSOFT); P.bandMix = fv(p, P_BMIX);
  P.depth = fv(p, P_DEPTH); P.angle = std::fmod(av(p, P_ANGLE) + 3600, 360); P.gloss = fv(p, P_GLOSS); P.spec = fv(p, P_SPEC); P.reliefSoft = fv(p, P_RSOFT);
  P.grain = fv(p, P_GRAIN); P.bloom = fv(p, P_BLOOM); P.mix = fv(p, P_MIX);
  P.from = iclamp(pv(p, P_FROM) - 1, 0, 2); P.key = fv(p, P_KEY); P.bevel = fv(p, P_BEVEL);
  P.profile = iclamp(pv(p, P_PROFILE) - 1, 0, 2); P.reflect = iclamp(pv(p, P_REFLECT) - 1, 0, 1);
  P.horizon = fv(p, P_HORIZON); P.wave = fv(p, P_WAVE); P.waveSize = fv(p, P_WAVESIZE);
  P.sky.clear(); P.ground.clear();
  for (int s = 0; s < 3; s++) { P.sky.push_back({ fv(p, P_SKP1 + s * 2), cv(p, P_SKC1 + s * 2) }); P.ground.push_back({ fv(p, P_GRP1 + s * 2), cv(p, P_GRC1 + s * 2) }); }
  P.exOn = bv(p, P_EX_ON); P.exDepth = fv(p, P_EX_DEPTH); P.exAngle = fv(p, P_EX_ANGLE); P.exPersp = fv(p, P_EX_PERSP);
  P.exStops = { { 0, cv(p, P_EX_FRONT) }, { 100, cv(p, P_EX_BACK) } };
  P.exShade = fv(p, P_EX_SHADE); P.exLines = fv(p, P_EX_LINES); P.exShadow = fv(p, P_EX_SHADOW);
  for (int g = 0; g < 4; g++) {
    const int b = g * GSTRIDE; ct::GlowMod& m = P.glow[g];
    m.on = bv(p, P_G1_ON + b); m.type = iclamp(pv(p, P_G1_TYPE + b) - 1, 0, 4); m.color = cv(p, P_G1_COL + b);
    m.size = fv(p, P_G1_SIZE + b); m.strength = fv(p, P_G1_STR + b);
  }
  P.glOn = bv(p, P_GL_ON); P.glCount = std::round(fv(p, P_GL_COUNT)); P.glSize = fv(p, P_GL_SIZE); P.glRays = std::round(fv(p, P_GL_RAYS)); P.glRot = fv(p, P_GL_ROT); P.glColor = cv(p, P_GL_COL);
  P.swOn = bv(p, P_SW_ON); P.swAngle = fv(p, P_SW_ANGLE); P.swPos = fv(p, P_SW_POS); P.swWidth = fv(p, P_SW_WIDTH); P.swStrength = fv(p, P_SW_STR);
  P.rimOn = bv(p, P_RIM_ON); P.rimColor = cv(p, P_RIM_COL); P.rimWidth = fv(p, P_RIM_WIDTH);
  P.arcOn = bv(p, P_ARC_ON); P.arcCount = std::round(fv(p, P_ARC_COUNT)); P.arcColor = cv(p, P_ARC_COL); P.arcSpread = fv(p, P_ARC_SPREAD);
  return P;
}
static void applyLook(PF_ParamDef* p[], int idx) {
  ct::Params P; ct::parseParams(P, ct::LOOKS[iclamp(idx, 0, ct::LOOK_COUNT - 1)].text);
  int n = (int)std::max<size_t>(2, std::min<size_t>(MAX_STOPS, P.stops.size()));
  setP(p, P_STOPS, n - 1);
  for (int s = 0; s < n && s < (int)P.stops.size(); s++) { setC(p, P_SC1 + s * 2, P.stops[s].c); setF(p, P_SP1 + s * 2, P.stops[s].p); }
  setB(p, P_INVERT, P.invert);
  setF(p, P_BLUR, P.blur); setF(p, P_CONTRAST, P.contrast); setF(p, P_MID, P.mid);
  setF(p, P_BCOUNT, P.bandCount); setF(p, P_BPHASE, P.bandPhase); setP(p, P_BSHAPE, P.bandShape + 1); setF(p, P_BSOFT, P.bandSoft); setF(p, P_BMIX, P.bandMix);
  setF(p, P_DEPTH, P.depth); setA(p, P_ANGLE, P.angle); setF(p, P_GLOSS, P.gloss); setF(p, P_SPEC, P.spec); setF(p, P_RSOFT, P.reliefSoft);
  setF(p, P_GRAIN, P.grain); setF(p, P_BLOOM, P.bloom); setF(p, P_MIX, P.mix);
  setP(p, P_FROM, P.from + 1); setF(p, P_KEY, P.key); setF(p, P_BEVEL, P.bevel); setP(p, P_PROFILE, P.profile + 1); setP(p, P_REFLECT, P.reflect + 1);
  setF(p, P_HORIZON, P.horizon); setF(p, P_WAVE, P.wave); setF(p, P_WAVESIZE, P.waveSize);
  for (int s = 0; s < 3; s++) {
    if (s < (int)P.sky.size()) { setC(p, P_SKC1 + s * 2, P.sky[s].c); setF(p, P_SKP1 + s * 2, P.sky[s].p); }
    if (s < (int)P.ground.size()) { setC(p, P_GRC1 + s * 2, P.ground[s].c); setF(p, P_GRP1 + s * 2, P.ground[s].p); }
  }
  setB(p, P_EX_ON, P.exOn); setF(p, P_EX_DEPTH, P.exDepth); setF(p, P_EX_ANGLE, P.exAngle); setF(p, P_EX_PERSP, P.exPersp);
  setC(p, P_EX_FRONT, P.exStops.front().c); setC(p, P_EX_BACK, P.exStops.back().c);
  setF(p, P_EX_SHADE, P.exShade); setF(p, P_EX_LINES, P.exLines); setF(p, P_EX_SHADOW, P.exShadow);
  for (int g = 0; g < 4; g++) {
    const int b = g * GSTRIDE; const ct::GlowMod& m = P.glow[g];
    setB(p, P_G1_ON + b, m.on); setP(p, P_G1_TYPE + b, m.type + 1); setC(p, P_G1_COL + b, m.color); setF(p, P_G1_SIZE + b, m.size); setF(p, P_G1_STR + b, m.strength);
  }
  setB(p, P_GL_ON, P.glOn); setF(p, P_GL_COUNT, P.glCount); setF(p, P_GL_SIZE, P.glSize); setF(p, P_GL_RAYS, P.glRays); setF(p, P_GL_ROT, P.glRot); setC(p, P_GL_COL, P.glColor);
  setB(p, P_SW_ON, P.swOn); setF(p, P_SW_ANGLE, P.swAngle); setF(p, P_SW_POS, P.swPos); setF(p, P_SW_WIDTH, P.swWidth); setF(p, P_SW_STR, P.swStrength);
  setB(p, P_RIM_ON, P.rimOn); setC(p, P_RIM_COL, P.rimColor); setF(p, P_RIM_WIDTH, P.rimWidth);
  setB(p, P_ARC_ON, P.arcOn); setF(p, P_ARC_COUNT, P.arcCount); setC(p, P_ARC_COL, P.arcColor); setF(p, P_ARC_SPREAD, P.arcSpread);
}
static PF_Err UserChangedParam(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], const PF_UserChangedParamExtra* which) {
  if (which->param_index == PO(P_LOOK)) applyLook(params, params[P_LOOK]->u.pd.value - 1);
  return PF_Err_NONE;
}

static PF_Err Render(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output) {
  const int w = output->width, h = output->height;
  Image src; readWorld(&params[P_INPUT]->u.ld, w, h, src);
  const double sc = renderScale(in_data);
  ct::Params A = readLook(params); A.scale = sc;
  ct::Params B; const ct::Params* Bp = nullptr;
  int lb = params[P_LOOKB]->u.pd.value;
  if (lb >= 3) { ct::parseParams(B, ct::LOOKS[iclamp(lb - 3, 0, ct::LOOK_COUNT - 1)].text); B.scale = sc; Bp = &B; }
  Motion m = readMotion(params, P_MO_BASE, P_MORPH);
  ct::CtMotion cm; cm.bandFlow = fv(params, P_CM_FLOW); cm.sweepTravel = fv(params, P_CM_SWEEP); cm.twinkle = fv(params, P_CM_TWINKLE); cm.twinkleRate = fv(params, P_CM_TWINKLER);
  Clock c = makeClock(in_data, m);
  OutImage out; Prog pr = { in_data };
  if (!ct::renderFrame(src, A, Bp, cm, m, c, out, progressCb, &pr)) return PF_Interrupt_CANCEL;
  writeWorld(out, output);
  return PF_Err_NONE;
}

extern "C" DllExport PF_Err PluginDataEntryFunction2(PF_PluginDataPtr inPtr, PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr, const char* inHostName, const char* inHostVersion) {
  PF_Err result = PF_Err_NONE;
  PF_REGISTER_EFFECT_EXT2(inPtr, inPluginDataCallBackPtr, "Chroma Lab", "com.franks.chrometone.ae",
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
