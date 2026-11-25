// Frank's Mobglow Brew 2.0 - After Effects effect (AE SDK glue). Dreamy bloom with
// Look / Look B morph, the shared Motion group and Glow motion.
#include "AEConfig.h"
#include "entry.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "String_Utils.h"
#include "AE_EffectCBSuites.h"
#include "brew_ae.h"
#include "../mob_params_io.h"
#include "../mob_motion.h"
#include "../mob_presets.h"
#include "brew_ae_version.h"
#include "param_order.h"

using namespace brew;
using namespace brewae;

enum {
  P_INPUT = 0,
  T_LOOK_START, P_LOOK, P_LOOKB, P_MORPH, T_LOOK_END,
  T_GLOW_START, P_RADIUS, P_STRENGTH, P_THRESH, P_GAMMA, P_SAT, T_GLOW_END,
  T_COL_START, P_COL_ON, P_COL_HEX, T_COL_END,
  T_FIN_START, P_GRAIN, P_DARKEN, T_FIN_END,
  P_MO_BASE, P_MO_LAST = P_MO_BASE + MO_COUNT - 1,
  T_GM_START, P_GM_BREATHE, P_GM_BREATHER, P_GM_SHIMMER, P_GM_SHIMMERR, T_GM_END,
  P_NUM
};

static PF_Err About(PF_InData* in_data, PF_OutData* out_data) {
  PF_SPRINTF(out_data->return_msg, "%s v%d.%d\rMOB-04  Lab suite\rDreamy bloom + motion.", "Halo Lab", BREW_MAJOR, BREW_MINOR);
  return PF_Err_NONE;
}
static PF_Err GlobalSetup(PF_InData* in_data, PF_OutData* out_data) {
  out_data->my_version = BREW_VERSION_PACKED; out_data->out_flags = BREW_OUT_FLAGS; out_data->out_flags2 = BREW_OUT_FLAGS2;
  return PF_Err_NONE;
}

// Lab 3.0 Effect Controls order: Motion, tool motion, Look + Primary, Advanced, Colour.
static const int BLOCK_ORDER[] = { P_MO_BASE, T_GM_START, T_LOOK_START, T_GLOW_START, T_FIN_START, T_COL_START };
static const brew::ParamOrder PO(BLOCK_ORDER, (int)(sizeof BLOCK_ORDER / sizeof BLOCK_ORDER[0]), P_NUM);

static PF_Err ParamsSetup(PF_InData* in_data, PF_OutData* out_data) {
  PF_Err err = PF_Err_NONE; PF_ParamDef def;
  mob::Params D; mob::parseParams(D, mob::LOOKS[0].text);
  static std::string looks = lookMenu(mob::LOOKS, mob::LOOK_COUNT, false), looksB = lookMenu(mob::LOOKS, mob::LOOK_COUNT, true);

  for (int block : BLOCK_ORDER) switch (block) {
  case P_MO_BASE: {  // Motion
    if (!err) err = addMotion(in_data, P_MO_BASE, "Spin: glow hue (deg/s)", "Drift X: glow trail (px/s)", "Drift Y: glow trail (px/s)");
  } break;
  case T_GM_START: {  // Glow motion
    BREW_TOPIC("Glow motion", T_GM_START, false);
    BREW_FS("Breathe (%)", 0, 100, 0, 100, 0, 0, P_GM_BREATHE);
    BREW_FS("Breathe rate (Hz)", 0, 10, 0, 4, 0.5, 2, P_GM_BREATHER);
    BREW_FS("Shimmer (%)", 0, 100, 0, 100, 0, 0, P_GM_SHIMMER);
    BREW_FS("Shimmer rate (Hz)", 0, 30, 0, 30, 8, 1, P_GM_SHIMMERR);
    BREW_ENDTOPIC(T_GM_END);
  } break;
  case T_LOOK_START: {  // Look
    BREW_TOPIC("Look", T_LOOK_START, false);
    AEFX_CLR_STRUCT(def); def.flags = PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY;
    PF_ADD_POPUP("Look", mob::LOOK_COUNT, 1, looks.c_str(), P_LOOK);
    AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Look B (morph to)", mob::LOOK_COUNT + 2, 1, looksB.c_str(), P_LOOKB);
    BREW_FS("Morph to Look B", 0, 100, 0, 100, 0, 1, P_MORPH);
    BREW_ENDTOPIC(T_LOOK_END);
  } break;
  case T_GLOW_START: {  // Glow
    BREW_TOPIC("Glow", T_GLOW_START, false);
    BREW_FS("Radius (px on 2048)", 1, 1000, 1, 1000, D.radius, 0, P_RADIUS);
    BREW_FS("Strength", 0, 500, 0, 500, D.strength, 0, P_STRENGTH);
    BREW_FS("Threshold", 0, 3, 0, 3, D.threshold, 2, P_THRESH);
    BREW_FS("Gamma", 0.1, 3, 0.1, 3, D.gamma, 2, P_GAMMA);
    BREW_FS("Saturation", 0, 100, 0, 100, D.sat, 0, P_SAT);
    BREW_ENDTOPIC(T_GLOW_END);
  } break;
  case T_FIN_START: {  // Finish
    BREW_TOPIC("Finish", T_FIN_START, false);
    BREW_FS("Grain (%)", 0, 100, 0, 100, D.grain, 0, P_GRAIN);
    BREW_FS("Darken background (%)", 0, 100, 0, 100, D.darken, 0, P_DARKEN);
    BREW_ENDTOPIC(T_FIN_END);
  } break;
  case T_COL_START: {  // Colour
    BREW_TOPIC("Colour", T_COL_START, false);
    AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX("Tint the glow", D.colorOn, 0, P_COL_ON);
    { RGB c = hexToRgb(D.colorHex); AEFX_CLR_STRUCT(def); PF_ADD_COLOR("Glow colour", (A_u_char)c.r, (A_u_char)c.g, (A_u_char)c.b, P_COL_HEX); }
    BREW_ENDTOPIC(T_COL_END);
  } break;
  default: break;
  }

  out_data->num_params = P_NUM;
  return err;
}

static mob::Params readLook(PF_ParamDef* p[]) {
  mob::Params P;
  P.radius = fv(p, P_RADIUS); P.strength = fv(p, P_STRENGTH); P.threshold = fv(p, P_THRESH); P.gamma = fv(p, P_GAMMA); P.sat = fv(p, P_SAT);
  P.colorOn = bv(p, P_COL_ON); P.colorHex = cv(p, P_COL_HEX);
  P.grain = fv(p, P_GRAIN); P.darken = fv(p, P_DARKEN);
  return P;
}
static void applyLook(PF_ParamDef* p[], int idx) {
  mob::Params P; mob::parseParams(P, mob::LOOKS[iclamp(idx, 0, mob::LOOK_COUNT - 1)].text);
  setF(p, P_RADIUS, P.radius); setF(p, P_STRENGTH, P.strength); setF(p, P_THRESH, P.threshold); setF(p, P_GAMMA, P.gamma); setF(p, P_SAT, P.sat);
  setB(p, P_COL_ON, P.colorOn); setC(p, P_COL_HEX, P.colorHex);
  setF(p, P_GRAIN, P.grain); setF(p, P_DARKEN, P.darken);
}
static PF_Err UserChangedParam(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], const PF_UserChangedParamExtra* which) {
  if (which->param_index == PO(P_LOOK)) applyLook(params, params[P_LOOK]->u.pd.value - 1);
  return PF_Err_NONE;
}

static PF_Err Render(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output) {
  const int w = output->width, h = output->height;
  Image src; readWorld(&params[P_INPUT]->u.ld, w, h, src);
  const double sc = renderScale(in_data);
  mob::Params A = readLook(params); A.scale = sc; A.fullW = w / std::max(1e-6, sc); A.fullH = h / std::max(1e-6, sc);
  mob::Params B; const mob::Params* Bp = nullptr;
  int lb = params[P_LOOKB]->u.pd.value;
  if (lb >= 3) { mob::parseParams(B, mob::LOOKS[iclamp(lb - 3, 0, mob::LOOK_COUNT - 1)].text); B.scale = sc; B.fullW = A.fullW; B.fullH = A.fullH; Bp = &B; }
  Motion m = readMotion(params, P_MO_BASE, P_MORPH);
  mob::MobMotion mm; mm.breathe = fv(params, P_GM_BREATHE); mm.breatheRate = fv(params, P_GM_BREATHER); mm.shimmer = fv(params, P_GM_SHIMMER); mm.shimmerRate = fv(params, P_GM_SHIMMERR);
  Clock c = makeClock(in_data, m);
  OutImage out; Prog pr = { in_data };
  if (!mob::renderFrame(src, A, Bp, mm, m, c, out, progressCb, &pr)) return PF_Interrupt_CANCEL;
  writeWorld(out, output);
  return PF_Err_NONE;
}

extern "C" DllExport PF_Err PluginDataEntryFunction2(PF_PluginDataPtr inPtr, PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr, const char* inHostName, const char* inHostVersion) {
  PF_Err result = PF_Err_NONE;
  PF_REGISTER_EFFECT_EXT2(inPtr, inPluginDataCallBackPtr, "Halo Lab", "com.franks.mobglow.ae",
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
