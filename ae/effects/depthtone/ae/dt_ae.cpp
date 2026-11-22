// Frank's Depthtone Brew - After Effects effect (AE SDK glue). Brightness becomes depth:
// contours, terraces or lit relief, with Look / Look B morph, Motion and Depth motion.
#include "AEConfig.h"
#include "entry.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "String_Utils.h"
#include "AE_EffectCBSuites.h"
#include "brew_ae.h"
#include "../dt_params_io.h"
#include "../dt_motion.h"
#include "../dt_presets.h"
#include "brew_ae_version.h"

using namespace brew;
using namespace brewae;

static const int MAX_STOPS = 5;
enum {
  P_INPUT = 0,
  T_LOOK_START, P_LOOK, P_LOOKB, P_MORPH, T_LOOK_END,
  T_DEPTH_START, P_INVERT, P_SMOOTH, P_NEAR, P_FAR, P_LEVELS, T_DEPTH_END,
  T_STYLE_START, P_STYLE, P_OVER, T_STYLE_END,
  T_COL_START, P_STOPS, P_SC1, P_SP1, P_SC2, P_SP2, P_SC3, P_SP3, P_SC4, P_SP4, P_SC5, P_SP5, P_FOG, P_FOGCOL, T_COL_END,
  T_LINES_START, P_LWIDTH, P_EVERY, P_COLORBY, P_LCOLOR, P_FILL, T_LINES_END,
  T_LIGHT_START, P_LANGLE, P_SHADOW, P_LSTR, T_LIGHT_END,
  P_MO_BASE, P_MO_LAST = P_MO_BASE + MO_COUNT - 1,
  T_DM_START, P_DM_FLOW, P_DM_FOGB, P_DM_FOGR, P_DM_RANGE, P_DM_RANGER, T_DM_END,
  P_NUM
};
static const char* STYLES = "Contour lines|Terraces|Relief";

static PF_Err About(PF_InData* in_data, PF_OutData* out_data) {
  PF_SPRINTF(out_data->return_msg, "%s v%d.%d\rDEP-03  Frank's Brew suite\rBrightness as depth: contours, terraces, relief + motion.", "Frank's Depthtone Brew", BREW_MAJOR, BREW_MINOR);
  return PF_Err_NONE;
}
static PF_Err GlobalSetup(PF_InData* in_data, PF_OutData* out_data) {
  out_data->my_version = BREW_VERSION_PACKED; out_data->out_flags = BREW_OUT_FLAGS; out_data->out_flags2 = BREW_OUT_FLAGS2;
  return PF_Err_NONE;
}

static PF_Err ParamsSetup(PF_InData* in_data, PF_OutData* out_data) {
  PF_Err err = PF_Err_NONE; PF_ParamDef def;
  dt::Params D; dt::parseParams(D, dt::LOOKS[0].text);
  static std::string looks = lookMenu(dt::LOOKS, dt::LOOK_COUNT, false), looksB = lookMenu(dt::LOOKS, dt::LOOK_COUNT, true);

  BREW_TOPIC("Look", T_LOOK_START, false);
  AEFX_CLR_STRUCT(def); def.flags = PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY;
  PF_ADD_POPUP("Look", dt::LOOK_COUNT, 1, looks.c_str(), P_LOOK);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Look B (morph to)", dt::LOOK_COUNT + 2, 1, looksB.c_str(), P_LOOKB);
  BREW_FS("Morph to Look B", 0, 100, 0, 100, 0, 1, P_MORPH);
  BREW_ENDTOPIC(T_LOOK_END);

  BREW_TOPIC("Depth", T_DEPTH_START, false);
  AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX("Invert (dark is near)", D.invert, 0, P_INVERT);
  BREW_FS("Smooth (px)", 0, 20, 0, 20, D.smooth, 0, P_SMOOTH);
  BREW_FS("Near (%)", 1, 100, 1, 100, D.near_, 0, P_NEAR);
  BREW_FS("Far (%)", 0, 99, 0, 99, D.far_, 0, P_FAR);
  BREW_FS("Levels", 2, 64, 2, 64, D.levels, 0, P_LEVELS);
  BREW_ENDTOPIC(T_DEPTH_END);

  BREW_TOPIC("Style", T_STYLE_START, false);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Style", 3, D.style + 1, STYLES, P_STYLE);
  AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX("Show original underneath", FALSE, 0, P_OVER);
  BREW_ENDTOPIC(T_STYLE_END);

  BREW_TOPIC("Colour", T_COL_START, true);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Gradient stops", 4, (int)std::max<size_t>(2, std::min<size_t>(MAX_STOPS, D.stops.size())) - 1, "2|3|4|5", P_STOPS);
  for (int s = 0; s < MAX_STOPS; s++) {
    RGB c = { 0, 0, 0 }; double p = s * 100.0 / (MAX_STOPS - 1);
    if (s < (int)D.stops.size()) { c = hexToRgb(D.stops[s].c); p = D.stops[s].p; }
    char cn[32], pn[32]; snprintf(cn, sizeof cn, "Stop %d colour (far)", s + 1); snprintf(pn, sizeof pn, "Stop %d position", s + 1);
    if (s > 0) snprintf(cn, sizeof cn, s == MAX_STOPS - 1 ? "Stop %d colour (near)" : "Stop %d colour", s + 1);
    AEFX_CLR_STRUCT(def); PF_ADD_COLOR(cn, (A_u_char)c.r, (A_u_char)c.g, (A_u_char)c.b, P_SC1 + s * 2);
    BREW_FS(pn, 0, 100, 0, 100, p, 0, P_SP1 + s * 2);
  }
  BREW_FS("Fog (%)", 0, 100, 0, 100, D.fog, 0, P_FOG);
  { RGB c = hexToRgb(D.fogColor); AEFX_CLR_STRUCT(def); PF_ADD_COLOR("Fog colour", (A_u_char)c.r, (A_u_char)c.g, (A_u_char)c.b, P_FOGCOL); }
  BREW_ENDTOPIC(T_COL_END);

  BREW_TOPIC("Contour lines", T_LINES_START, true);
  BREW_FS("Width (px)", 1, 12, 1, 12, D.lineWidth, 0, P_LWIDTH);
  BREW_FS("Every Nth level", 1, 8, 1, 8, D.every, 0, P_EVERY);
  AEFX_CLR_STRUCT(def); PF_ADD_POPUP("Colour by", 2, D.colorByDepth ? 2 : 1, "One colour|Depth gradient", P_COLORBY);
  { RGB c = hexToRgb(D.lineColor); AEFX_CLR_STRUCT(def); PF_ADD_COLOR("Line colour", (A_u_char)c.r, (A_u_char)c.g, (A_u_char)c.b, P_LCOLOR); }
  AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX("Fill bands with gradient", D.fill, 0, P_FILL);
  BREW_ENDTOPIC(T_LINES_END);

  BREW_TOPIC("Light (terraces, relief)", T_LIGHT_START, true);
  AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Light angle", D.lightAngle, P_LANGLE);
  BREW_FS("Shadow length (px)", 1, 40, 1, 40, D.shadow, 0, P_SHADOW);
  BREW_FS("Strength (%)", 0, 100, 0, 100, D.lightStrength, 0, P_LSTR);
  BREW_ENDTOPIC(T_LIGHT_END);

  if (!err) err = addMotion(in_data, P_MO_BASE, "Spin: light orbit (deg/s)", "Drift X: depth slide (px/s)", "Drift Y: depth slide (px/s)");

  BREW_TOPIC("Depth motion", T_DM_START, false);
  BREW_FS("Level flow (levels/s)", -20, 20, -5, 5, 0, 2, P_DM_FLOW);
  BREW_FS("Fog breathe (%)", 0, 100, 0, 100, 0, 0, P_DM_FOGB);
  BREW_FS("Fog breathe rate (Hz)", 0, 10, 0, 2, 0.25, 2, P_DM_FOGR);
  BREW_FS("Depth sweep (%)", 0, 100, 0, 100, 0, 0, P_DM_RANGE);
  BREW_FS("Depth sweep rate (Hz)", 0, 10, 0, 2, 0.25, 2, P_DM_RANGER);
  BREW_ENDTOPIC(T_DM_END);

  out_data->num_params = P_NUM;
  return err;
}

static dt::Params readLook(PF_ParamDef* p[]) {
  dt::Params P;
  P.invert = bv(p, P_INVERT); P.smooth = fv(p, P_SMOOTH); P.near_ = fv(p, P_NEAR); P.far_ = fv(p, P_FAR); P.levels = fv(p, P_LEVELS);
  P.style = iclamp(pv(p, P_STYLE) - 1, 0, 2);
  int n = pv(p, P_STOPS) + 1; P.stops.clear();
  for (int s = 0; s < n; s++) P.stops.push_back({ fv(p, P_SP1 + s * 2), cv(p, P_SC1 + s * 2) });
  P.fog = fv(p, P_FOG); P.fogColor = cv(p, P_FOGCOL);
  P.lineWidth = fv(p, P_LWIDTH); P.every = fv(p, P_EVERY); P.colorByDepth = pv(p, P_COLORBY) == 2; P.lineColor = cv(p, P_LCOLOR); P.fill = bv(p, P_FILL);
  P.lightAngle = std::fmod(av(p, P_LANGLE) + 3600, 360); P.shadow = fv(p, P_SHADOW); P.lightStrength = fv(p, P_LSTR);
  return P;
}
static void applyLook(PF_ParamDef* p[], int idx) {
  dt::Params P; dt::parseParams(P, dt::LOOKS[iclamp(idx, 0, dt::LOOK_COUNT - 1)].text);
  setB(p, P_INVERT, P.invert); setF(p, P_SMOOTH, P.smooth); setF(p, P_NEAR, P.near_); setF(p, P_FAR, P.far_); setF(p, P_LEVELS, P.levels);
  setP(p, P_STYLE, P.style + 1);
  int n = (int)std::max<size_t>(2, std::min<size_t>(MAX_STOPS, P.stops.size()));
  setP(p, P_STOPS, n - 1);
  for (int s = 0; s < n && s < (int)P.stops.size(); s++) { setC(p, P_SC1 + s * 2, P.stops[s].c); setF(p, P_SP1 + s * 2, P.stops[s].p); }
  setF(p, P_FOG, P.fog); setC(p, P_FOGCOL, P.fogColor);
  setF(p, P_LWIDTH, P.lineWidth); setF(p, P_EVERY, P.every); setP(p, P_COLORBY, P.colorByDepth ? 2 : 1); setC(p, P_LCOLOR, P.lineColor); setB(p, P_FILL, P.fill);
  setA(p, P_LANGLE, P.lightAngle); setF(p, P_SHADOW, P.shadow); setF(p, P_LSTR, P.lightStrength);
}
static PF_Err UserChangedParam(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], const PF_UserChangedParamExtra* which) {
  if (which->param_index == P_LOOK) applyLook(params, params[P_LOOK]->u.pd.value - 1);
  return PF_Err_NONE;
}

static PF_Err Render(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output) {
  const int w = output->width, h = output->height;
  Image src; readWorld(&params[P_INPUT]->u.ld, w, h, src);
  const double sc = renderScale(in_data);
  dt::Params A = readLook(params); A.scale = sc; A.fullH = h / std::max(1e-6, sc);
  dt::Params B; const dt::Params* Bp = nullptr;
  int lb = params[P_LOOKB]->u.pd.value;
  if (lb >= 3) { dt::parseParams(B, dt::LOOKS[iclamp(lb - 3, 0, dt::LOOK_COUNT - 1)].text); B.scale = sc; B.fullH = A.fullH; Bp = &B; }
  Motion m = readMotion(params, P_MO_BASE, P_MORPH);
  dt::DtMotion dm; dm.flow = fv(params, P_DM_FLOW); dm.fogBreathe = fv(params, P_DM_FOGB); dm.fogRate = fv(params, P_DM_FOGR);
  dm.rangeWave = fv(params, P_DM_RANGE); dm.rangeRate = fv(params, P_DM_RANGER);
  Clock c = makeClock(in_data, m);
  OutImage out; Prog pr = { in_data };
  if (!dt::renderFrame(src, A, Bp, dm, m, c, bv(params, P_OVER), out, progressCb, &pr)) return PF_Interrupt_CANCEL;
  writeWorld(out, output);
  return PF_Err_NONE;
}

extern "C" DllExport PF_Err PluginDataEntryFunction2(PF_PluginDataPtr inPtr, PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr, const char* inHostName, const char* inHostVersion) {
  PF_Err result = PF_Err_NONE;
  PF_REGISTER_EFFECT_EXT2(inPtr, inPluginDataCallBackPtr, "Frank's Depthtone Brew", "com.franks.depthtone.ae",
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
