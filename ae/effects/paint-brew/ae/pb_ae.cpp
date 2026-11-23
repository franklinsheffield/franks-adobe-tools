// Frank's Paint Brew 1.1 - After Effects effect (AE SDK glue). Oil, Watercolour, Impressionism,
// Alcohol Ink, Spray Paint and Pastel from the layer, Look / Look B morph, the shared Motion group
// and Paint motion (paint-on, brush breathe).
#include "AEConfig.h"
#include "entry.h"
#include "AE_Effect.h"
#include "AE_EffectCB.h"
#include "AE_Macros.h"
#include "Param_Utils.h"
#include "String_Utils.h"
#include "AE_EffectCBSuites.h"
#include "brew_ae.h"
#include "../pb_params_io.h"
#include "../pb_motion.h"
#include "../pb_presets.h"
#include "brew_ae_version.h"

using namespace brew;
using namespace brewae;

enum {
  P_INPUT = 0,
  T_LOOK_START, P_LOOK, P_LOOKB, P_MORPH, T_LOOK_END,
  T_STY_START, P_STYLE, P_SEED, T_STY_END,
  T_BR_START, P_SIZE, P_LENGTH, P_DETAIL, P_RANDOM, P_FOLLOW, P_TOOL, P_MIX, T_BR_END,
  T_COL_START, P_SIMPLIFY, P_SAT, P_WARMTH, P_JITTER, P_PALETTE, T_COL_END,
  T_TEX_START, P_IMPASTO, P_THICK, P_LIGHT, P_BRISTLE, P_WEAVE, P_WEAVE_SZ, P_LIFT, T_TEX_END,
  T_WAT_START, P_W_PAPER, P_W_DENS, P_W_WET, P_W_GRAN, P_W_BLEED, P_W_TEXT, P_W_PENCIL, P_W_SPL, P_W_SPLSZ, P_W_FADE, T_WAT_END,
  T_INK_START, P_I_FLOW, P_I_RIM, P_I_CELLS, P_I_BLEND, P_I_VEINS, P_I_METAL, T_INK_END,
  T_SPR_START, P_S_CANS, P_S_SOFT, P_S_OVER, P_S_SPECK, P_S_HALF, P_S_DRIPS, P_S_DRIPLEN, P_S_OUTLINE, P_S_HIGH, T_SPR_END,
  T_WALL_START, P_S_WALL, P_S_WALLC, P_S_BLEND, P_S_OPAC, P_S_RELIEF, P_S_BARE, P_S_GRIME, P_S_CRACKS,
  P_S_BOND, P_S_BRSIZE, P_S_MORTAR, P_S_BRVAR, P_S_MORTARC, P_S_WDIR, P_S_WFIN, P_S_PLANK, P_S_GRAIN, P_S_KNOTS, T_WALL_END,
  T_PAS_START, P_P_PAPER, P_P_TOOTH, P_P_SMUDGE, P_P_PRESS, P_P_HATCH, P_P_ANGLE, P_P_OIL, T_PAS_END,
  P_MO_BASE, P_MO_LAST = P_MO_BASE + MO_COUNT - 1,
  T_PM_START, P_PM_PAINTON, P_PM_BREATHE, P_PM_BREATHER, T_PM_END,
  P_NUM
};
static const char* STYLES = "Oil|Watercolour|Impressionism|Alcohol Ink|Spray Paint|Pastel";
static const char* TOOLS = "Brush|Palette knife";
static const char* const METAL_IDS[3] = { "gold", "silver", "copper" };
static const char* METALS = "Gold|Silver|Copper";
static const char* const WALL_IDS[7] = { "plain", "concrete", "stucco", "brick", "block", "metal", "wood" };
static const char* WALLS = "Plain|Concrete|Stucco|Brick|Block|Metal shutter|Wood";
static const char* const WALL_COLOURS[7] = { "#E8E6E1", "#A8A49C", "#D8CCB4", "#9C4A36", "#9A9A96", "#7D848C", "#8A6A48" };
static const char* const BLEND_IDS[6] = { "normal", "multiply", "linearburn", "overlay", "softlight", "hardlight" };
static const char* BLENDS = "Normal|Multiply|Linear burn|Overlay|Soft light|Hard light";
static const char* const BOND_IDS[4] = { "running", "stack", "flemish", "basket" };
static const char* BONDS = "Running|Stack|Flemish|Basket";
static const char* const WDIR_IDS[2] = { "vertical", "horizontal" };
static const char* WDIRS = "Vertical|Horizontal";
static const char* const WFIN_IDS[3] = { "raw", "weathered", "painted" };
static const char* WFINS = "Raw|Weathered|Painted";
static const char* const HATCH_IDS[2] = { "follow", "fixed" };
static const char* HATCHES = "Follow image|Fixed angle";

template <int N> static int indexOf(const char* const (&ids)[N], const std::string& v) { for (int i = 0; i < N; i++) if (v == ids[i]) return i; return 0; }
template <int N> static std::string idAt(const char* const (&ids)[N], int popupValue) { return ids[iclamp(popupValue - 1, 0, N - 1)]; }

static PF_Err About(PF_InData* in_data, PF_OutData* out_data) {
  PF_SPRINTF(out_data->return_msg, "%s v%d.%d\rPB-09  Frank's Brew suite\rPainterly looks with paint-on motion.", "Frank's Paint Brew", BREW_MAJOR, BREW_MINOR);
  return PF_Err_NONE;
}
static PF_Err GlobalSetup(PF_InData* in_data, PF_OutData* out_data) {
  out_data->my_version = BREW_VERSION_PACKED; out_data->out_flags = BREW_OUT_FLAGS; out_data->out_flags2 = BREW_OUT_FLAGS2;
  return PF_Err_NONE;
}
#define COLOR(NAME, HEX, ID) { RGB c_ = hexToRgb(isHex(HEX) ? HEX : std::string("#000000")); AEFX_CLR_STRUCT(def); PF_ADD_COLOR(NAME, (A_u_char)c_.r, (A_u_char)c_.g, (A_u_char)c_.b, ID); }
#define CHECK(NAME, V, ID) AEFX_CLR_STRUCT(def); PF_ADD_CHECKBOXX(NAME, (V) ? 1 : 0, 0, ID);
#define POPUP(NAME, N, V, MENU, ID) AEFX_CLR_STRUCT(def); PF_ADD_POPUP(NAME, N, V, MENU, ID);

static PF_Err ParamsSetup(PF_InData* in_data, PF_OutData* out_data) {
  PF_Err err = PF_Err_NONE; PF_ParamDef def;
  pb::Params D; pb::parseParams(D, pb::LOOKS[0].text);
  static std::string looks = lookMenu(pb::LOOKS, pb::LOOK_COUNT, false), looksB = lookMenu(pb::LOOKS, pb::LOOK_COUNT, true);

  BREW_TOPIC("Look", T_LOOK_START, false);
  AEFX_CLR_STRUCT(def); def.flags = PF_ParamFlag_SUPERVISE | PF_ParamFlag_CANNOT_TIME_VARY;
  PF_ADD_POPUP("Look", pb::LOOK_COUNT, 1, looks.c_str(), P_LOOK);
  POPUP("Look B (morph to)", pb::LOOK_COUNT + 2, 1, looksB.c_str(), P_LOOKB);
  BREW_FS("Morph to Look B", 0, 100, 0, 100, 0, 1, P_MORPH);
  BREW_ENDTOPIC(T_LOOK_END);

  BREW_TOPIC("Style", T_STY_START, false);
  POPUP("Style", 6, D.style + 1, STYLES, P_STYLE);
  BREW_FS("Variation", 1, 99, 1, 99, D.seed, 0, P_SEED);
  BREW_ENDTOPIC(T_STY_END);

  BREW_TOPIC("Brush", T_BR_START, false);
  BREW_FS("Stroke size (px)", 4, 120, 4, 120, D.bSize, 0, P_SIZE);
  BREW_FS("Stroke length (x)", 0.4, 2.5, 0.4, 2.5, D.bLength, 1, P_LENGTH);
  BREW_FS("Detail passes", 1, 4, 1, 4, D.bDetail, 0, P_DETAIL);
  BREW_FS("Randomness (%)", 0, 100, 0, 100, D.bRandomness, 0, P_RANDOM);
  BREW_FS("Follow edges (%)", 0, 100, 0, 100, D.bFollow, 0, P_FOLLOW);
  POPUP("Tool (oil)", 2, D.bTool == "knife" ? 2 : 1, TOOLS, P_TOOL);
  BREW_FS("Paint mixing (%)", 0, 100, 0, 100, D.bMix, 0, P_MIX);
  BREW_ENDTOPIC(T_BR_END);

  BREW_TOPIC("Colour", T_COL_START, false);
  BREW_FS("Simplify (%)", 0, 100, 0, 100, D.cSimplify, 0, P_SIMPLIFY);
  BREW_FS("Saturation (%)", -50, 100, -50, 100, D.cSaturation, 0, P_SAT);
  BREW_FS("Warmth", -50, 50, -50, 50, D.cWarmth, 0, P_WARMTH);
  BREW_FS("Broken colour (%)", 0, 100, 0, 100, D.cJitter, 0, P_JITTER);
  BREW_FS("Palette limit (colours)", 0, 24, 0, 24, D.cPalette, 0, P_PALETTE);
  BREW_ENDTOPIC(T_COL_END);

  BREW_TOPIC("Texture (oil + impressionism)", T_TEX_START, true);
  BREW_FS("Impasto depth (%)", 0, 100, 0, 100, D.tImpasto, 0, P_IMPASTO);
  BREW_FS("Thick lights (%)", 0, 100, 0, 100, D.tThickLights, 0, P_THICK);
  AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Light angle", D.tLight, P_LIGHT);
  BREW_FS("Bristle streaks (%)", 0, 100, 0, 100, D.tBristle, 0, P_BRISTLE);
  BREW_FS("Canvas weave (%)", 0, 100, 0, 100, D.tCanvas, 0, P_WEAVE);
  BREW_FS("Weave size (px)", 3, 16, 3, 16, D.tCanvasScale, 0, P_WEAVE_SZ);
  BREW_FS("Light and colour lift (%)", 0, 100, 0, 100, D.tLift, 0, P_LIFT);
  BREW_ENDTOPIC(T_TEX_END);

  BREW_TOPIC("Watercolour", T_WAT_START, true);
  COLOR("Paper colour", D.wPaper, P_W_PAPER);
  BREW_FS("Pigment (%)", 20, 100, 20, 100, D.wDensity, 0, P_W_DENS);
  BREW_FS("Wet edges (%)", 0, 100, 0, 100, D.wWetEdge, 0, P_W_WET);
  BREW_FS("Granulation (%)", 0, 100, 0, 100, D.wGranulation, 0, P_W_GRAN);
  BREW_FS("Bleed (px)", 0, 60, 0, 60, D.wBleed, 0, P_W_BLEED);
  BREW_FS("Paper texture (%)", 0, 100, 0, 100, D.wPaperTexture, 0, P_W_TEXT);
  BREW_FS("Pencil (%)", 0, 100, 0, 100, D.wPencil, 0, P_W_PENCIL);
  BREW_FS("Splashes", 0, 20, 0, 20, D.wSplashes, 0, P_W_SPL);
  BREW_FS("Splash size (px)", 10, 200, 10, 200, D.wSplashSize, 0, P_W_SPLSZ);
  BREW_FS("Fade to paper (%)", 0, 100, 0, 100, D.wFade, 0, P_W_FADE);
  BREW_ENDTOPIC(T_WAT_END);

  BREW_TOPIC("Alcohol ink", T_INK_START, true);
  BREW_FS("Flow (%)", 0, 100, 0, 100, D.iFlow, 0, P_I_FLOW);
  BREW_FS("Rim strength (%)", 0, 100, 0, 100, D.iRim, 0, P_I_RIM);
  BREW_FS("Cells (%)", 0, 100, 0, 100, D.iCells, 0, P_I_CELLS);
  BREW_FS("Blend (%)", 0, 100, 0, 100, D.iBlend, 0, P_I_BLEND);
  BREW_FS("Veins (%)", 0, 100, 0, 100, D.iVeins, 0, P_I_VEINS);
  POPUP("Vein metal", 3, indexOf(METAL_IDS, D.iMetal) + 1, METALS, P_I_METAL);
  BREW_ENDTOPIC(T_INK_END);

  BREW_TOPIC("Spray paint", T_SPR_START, true);
  BREW_FS("Cans (colours)", 3, 8, 3, 8, D.sCans, 0, P_S_CANS);
  BREW_FS("Soft edges (%)", 0, 100, 0, 100, D.sSoft, 0, P_S_SOFT);
  BREW_FS("Overspray (%)", 0, 100, 0, 100, D.sOverspray, 0, P_S_OVER);
  BREW_FS("Speckle and splats (%)", 0, 100, 0, 100, D.sSpeckle, 0, P_S_SPECK);
  BREW_FS("Halftone (%)", 0, 100, 0, 100, D.sHalftone, 0, P_S_HALF);
  BREW_FS("Drips (%)", 0, 100, 0, 100, D.sDrips, 0, P_S_DRIPS);
  BREW_FS("Drip length (%)", 0, 100, 0, 100, D.sDripLength, 0, P_S_DRIPLEN);
  BREW_FS("Outline (%)", 0, 100, 0, 100, D.sOutline, 0, P_S_OUTLINE);
  BREW_FS("Highlight edge (%)", 0, 100, 0, 100, D.sHighlight, 0, P_S_HIGH);
  BREW_ENDTOPIC(T_SPR_END);

  BREW_TOPIC("Wall (spray paint)", T_WALL_START, true);
  AEFX_CLR_STRUCT(def); def.flags = PF_ParamFlag_SUPERVISE;
  PF_ADD_POPUP("Wall", 7, indexOf(WALL_IDS, D.sWall) + 1, WALLS, P_S_WALL);
  COLOR("Wall colour", D.sWallColour, P_S_WALLC);
  POPUP("Paint blend", 6, indexOf(BLEND_IDS, D.sBlend) + 1, BLENDS, P_S_BLEND);
  BREW_FS("Paint opacity (%)", 10, 100, 10, 100, D.sPaintOpacity, 0, P_S_OPAC);
  BREW_FS("Wall relief (%)", 0, 100, 0, 100, D.sRelief, 0, P_S_RELIEF);
  BREW_FS("Bare wall (%)", 0, 100, 0, 100, D.sBare, 0, P_S_BARE);
  BREW_FS("Grime (%)", 0, 100, 0, 100, D.sGrime, 0, P_S_GRIME);
  BREW_FS("Cracks (%)", 0, 100, 0, 100, D.sCracks, 0, P_S_CRACKS);
  POPUP("Brick bond", 4, indexOf(BOND_IDS, D.sBrickPattern) + 1, BONDS, P_S_BOND);
  BREW_FS("Brick size (%)", 50, 200, 50, 200, D.sBrickSize, 0, P_S_BRSIZE);
  BREW_FS("Mortar width (%)", 0, 100, 0, 100, D.sMortar, 0, P_S_MORTAR);
  BREW_FS("Brick colour mix (%)", 0, 100, 0, 100, D.sBrickVariation, 0, P_S_BRVAR);
  COLOR("Mortar colour", D.sMortarColour, P_S_MORTARC);
  POPUP("Planks", 2, indexOf(WDIR_IDS, D.sWoodDir) + 1, WDIRS, P_S_WDIR);
  POPUP("Wood finish", 3, indexOf(WFIN_IDS, D.sWoodFinish) + 1, WFINS, P_S_WFIN);
  BREW_FS("Plank width (%)", 50, 200, 50, 200, D.sPlankWidth, 0, P_S_PLANK);
  BREW_FS("Grain (%)", 0, 100, 0, 100, D.sGrain, 0, P_S_GRAIN);
  BREW_FS("Knots (%)", 0, 100, 0, 100, D.sKnots, 0, P_S_KNOTS);
  BREW_ENDTOPIC(T_WALL_END);

  BREW_TOPIC("Pastel", T_PAS_START, true);
  COLOR("Paper", D.pPaper, P_P_PAPER);
  BREW_FS("Tooth (%)", 0, 100, 0, 100, D.pTooth, 0, P_P_TOOTH);
  BREW_FS("Smudge (%)", 0, 100, 0, 100, D.pSmudge, 0, P_P_SMUDGE);
  BREW_FS("Pressure (%)", 0, 100, 0, 100, D.pPressure, 0, P_P_PRESS);
  POPUP("Hatch", 2, indexOf(HATCH_IDS, D.pHatch) + 1, HATCHES, P_P_HATCH);
  AEFX_CLR_STRUCT(def); PF_ADD_ANGLE("Hatch angle", D.pAngle, P_P_ANGLE);
  CHECK("Oil pastel", D.pOil, P_P_OIL);
  BREW_ENDTOPIC(T_PAS_END);

  if (!err) err = addMotion(in_data, P_MO_BASE, "Spin: light orbit (deg/s)", "Drift X: surface slide (px/s)", "Drift Y: surface slide (px/s)");

  BREW_TOPIC("Paint motion", T_PM_START, false);
  BREW_FS("Paint on over (s)", 0, 60, 0, 10, 0, 1, P_PM_PAINTON);
  BREW_FS("Brush breathe (%)", 0, 100, 0, 100, 0, 0, P_PM_BREATHE);
  BREW_FS("Breathe rate (Hz)", 0, 10, 0, 4, 0.5, 2, P_PM_BREATHER);
  BREW_ENDTOPIC(T_PM_END);

  out_data->num_params = P_NUM;
  return err;
}

// the selected Look supplies what has no control (focus); controls override the rest
static pb::Params readLook(PF_ParamDef* p[]) {
  pb::Params P; pb::parseParams(P, pb::LOOKS[iclamp(pv(p, P_LOOK) - 1, 0, pb::LOOK_COUNT - 1)].text);
  P.style = iclamp(pv(p, P_STYLE) - 1, 0, 5); P.seed = std::round(fv(p, P_SEED));
  P.bSize = fv(p, P_SIZE); P.bLength = fv(p, P_LENGTH); P.bDetail = std::round(fv(p, P_DETAIL)); P.bRandomness = fv(p, P_RANDOM); P.bFollow = fv(p, P_FOLLOW);
  P.bTool = pv(p, P_TOOL) == 2 ? "knife" : "brush"; P.bMix = fv(p, P_MIX);
  P.cSimplify = fv(p, P_SIMPLIFY); P.cSaturation = fv(p, P_SAT); P.cWarmth = fv(p, P_WARMTH); P.cJitter = fv(p, P_JITTER); P.cPalette = std::round(fv(p, P_PALETTE));
  P.tImpasto = fv(p, P_IMPASTO); P.tThickLights = fv(p, P_THICK); P.tLight = std::fmod(av(p, P_LIGHT) + 3600, 360); P.tBristle = fv(p, P_BRISTLE);
  P.tCanvas = fv(p, P_WEAVE); P.tCanvasScale = fv(p, P_WEAVE_SZ); P.tLift = fv(p, P_LIFT);
  P.wPaper = cv(p, P_W_PAPER); P.wDensity = fv(p, P_W_DENS); P.wWetEdge = fv(p, P_W_WET); P.wGranulation = fv(p, P_W_GRAN); P.wBleed = fv(p, P_W_BLEED);
  P.wPaperTexture = fv(p, P_W_TEXT); P.wPencil = fv(p, P_W_PENCIL); P.wSplashes = std::round(fv(p, P_W_SPL)); P.wSplashSize = fv(p, P_W_SPLSZ); P.wFade = fv(p, P_W_FADE);
  P.iFlow = fv(p, P_I_FLOW); P.iRim = fv(p, P_I_RIM); P.iCells = fv(p, P_I_CELLS); P.iBlend = fv(p, P_I_BLEND); P.iVeins = fv(p, P_I_VEINS); P.iMetal = idAt(METAL_IDS, pv(p, P_I_METAL));
  P.sCans = std::round(fv(p, P_S_CANS)); P.sSoft = fv(p, P_S_SOFT); P.sOverspray = fv(p, P_S_OVER); P.sSpeckle = fv(p, P_S_SPECK); P.sHalftone = fv(p, P_S_HALF);
  P.sDrips = fv(p, P_S_DRIPS); P.sDripLength = fv(p, P_S_DRIPLEN); P.sOutline = fv(p, P_S_OUTLINE); P.sHighlight = fv(p, P_S_HIGH);
  P.sWall = idAt(WALL_IDS, pv(p, P_S_WALL)); P.sWallColour = cv(p, P_S_WALLC); P.sBlend = idAt(BLEND_IDS, pv(p, P_S_BLEND)); P.sPaintOpacity = fv(p, P_S_OPAC);
  P.sRelief = fv(p, P_S_RELIEF); P.sBare = fv(p, P_S_BARE); P.sGrime = fv(p, P_S_GRIME); P.sCracks = fv(p, P_S_CRACKS);
  P.sBrickPattern = idAt(BOND_IDS, pv(p, P_S_BOND)); P.sBrickSize = fv(p, P_S_BRSIZE); P.sMortar = fv(p, P_S_MORTAR); P.sBrickVariation = fv(p, P_S_BRVAR);
  P.sMortarColour = cv(p, P_S_MORTARC); P.sWoodDir = idAt(WDIR_IDS, pv(p, P_S_WDIR)); P.sWoodFinish = idAt(WFIN_IDS, pv(p, P_S_WFIN));
  P.sPlankWidth = fv(p, P_S_PLANK); P.sGrain = fv(p, P_S_GRAIN); P.sKnots = fv(p, P_S_KNOTS);
  P.pPaper = cv(p, P_P_PAPER); P.pTooth = fv(p, P_P_TOOTH); P.pSmudge = fv(p, P_P_SMUDGE); P.pPressure = fv(p, P_P_PRESS);
  P.pHatch = idAt(HATCH_IDS, pv(p, P_P_HATCH)); P.pAngle = std::fmod(av(p, P_P_ANGLE) + 3600, 360); P.pOil = bv(p, P_P_OIL);
  return P;
}
static void applyLook(PF_ParamDef* p[], int idx) {
  pb::Params P; pb::parseParams(P, pb::LOOKS[iclamp(idx, 0, pb::LOOK_COUNT - 1)].text);
  setP(p, P_STYLE, P.style + 1); setF(p, P_SEED, P.seed);
  setF(p, P_SIZE, P.bSize); setF(p, P_LENGTH, P.bLength); setF(p, P_DETAIL, P.bDetail); setF(p, P_RANDOM, P.bRandomness); setF(p, P_FOLLOW, P.bFollow);
  setP(p, P_TOOL, P.bTool == "knife" ? 2 : 1); setF(p, P_MIX, P.bMix);
  setF(p, P_SIMPLIFY, P.cSimplify); setF(p, P_SAT, P.cSaturation); setF(p, P_WARMTH, P.cWarmth); setF(p, P_JITTER, P.cJitter); setF(p, P_PALETTE, P.cPalette);
  setF(p, P_IMPASTO, P.tImpasto); setF(p, P_THICK, P.tThickLights); setA(p, P_LIGHT, P.tLight); setF(p, P_BRISTLE, P.tBristle);
  setF(p, P_WEAVE, P.tCanvas); setF(p, P_WEAVE_SZ, P.tCanvasScale); setF(p, P_LIFT, P.tLift);
  setC(p, P_W_PAPER, P.wPaper); setF(p, P_W_DENS, P.wDensity); setF(p, P_W_WET, P.wWetEdge); setF(p, P_W_GRAN, P.wGranulation); setF(p, P_W_BLEED, P.wBleed);
  setF(p, P_W_TEXT, P.wPaperTexture); setF(p, P_W_PENCIL, P.wPencil); setF(p, P_W_SPL, P.wSplashes); setF(p, P_W_SPLSZ, P.wSplashSize); setF(p, P_W_FADE, P.wFade);
  setF(p, P_I_FLOW, P.iFlow); setF(p, P_I_RIM, P.iRim); setF(p, P_I_CELLS, P.iCells); setF(p, P_I_BLEND, P.iBlend); setF(p, P_I_VEINS, P.iVeins);
  setP(p, P_I_METAL, indexOf(METAL_IDS, P.iMetal) + 1);
  setF(p, P_S_CANS, P.sCans); setF(p, P_S_SOFT, P.sSoft); setF(p, P_S_OVER, P.sOverspray); setF(p, P_S_SPECK, P.sSpeckle); setF(p, P_S_HALF, P.sHalftone);
  setF(p, P_S_DRIPS, P.sDrips); setF(p, P_S_DRIPLEN, P.sDripLength); setF(p, P_S_OUTLINE, P.sOutline); setF(p, P_S_HIGH, P.sHighlight);
  setP(p, P_S_WALL, indexOf(WALL_IDS, P.sWall) + 1); setC(p, P_S_WALLC, P.sWallColour); setP(p, P_S_BLEND, indexOf(BLEND_IDS, P.sBlend) + 1);
  setF(p, P_S_OPAC, P.sPaintOpacity); setF(p, P_S_RELIEF, P.sRelief); setF(p, P_S_BARE, P.sBare); setF(p, P_S_GRIME, P.sGrime); setF(p, P_S_CRACKS, P.sCracks);
  setP(p, P_S_BOND, indexOf(BOND_IDS, P.sBrickPattern) + 1); setF(p, P_S_BRSIZE, P.sBrickSize); setF(p, P_S_MORTAR, P.sMortar); setF(p, P_S_BRVAR, P.sBrickVariation);
  setC(p, P_S_MORTARC, P.sMortarColour); setP(p, P_S_WDIR, indexOf(WDIR_IDS, P.sWoodDir) + 1); setP(p, P_S_WFIN, indexOf(WFIN_IDS, P.sWoodFinish) + 1);
  setF(p, P_S_PLANK, P.sPlankWidth); setF(p, P_S_GRAIN, P.sGrain); setF(p, P_S_KNOTS, P.sKnots);
  setC(p, P_P_PAPER, P.pPaper); setF(p, P_P_TOOTH, P.pTooth); setF(p, P_P_SMUDGE, P.pSmudge); setF(p, P_P_PRESS, P.pPressure);
  setP(p, P_P_HATCH, indexOf(HATCH_IDS, P.pHatch) + 1); setA(p, P_P_ANGLE, P.pAngle); setB(p, P_P_OIL, P.pOil);
}
static PF_Err UserChangedParam(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], const PF_UserChangedParamExtra* which) {
  if (which->param_index == P_LOOK) applyLook(params, params[P_LOOK]->u.pd.value - 1);
  // picking a wall type also picks its usual colour (as in Photoshop); a colour picked after that wins
  if (which->param_index == P_S_WALL) setC(params, P_S_WALLC, WALL_COLOURS[iclamp(params[P_S_WALL]->u.pd.value - 1, 0, 6)]);
  return PF_Err_NONE;
}

static PF_Err Render(PF_InData* in_data, PF_OutData* out_data, PF_ParamDef* params[], PF_LayerDef* output) {
  const int w = output->width, h = output->height;
  Image src; readWorld(&params[P_INPUT]->u.ld, w, h, src);
  const double sc = renderScale(in_data);
  pb::Params A = readLook(params); A.scale = sc;
  pb::Params B; const pb::Params* Bp = nullptr;
  int lb = params[P_LOOKB]->u.pd.value;
  if (lb >= 3) { pb::parseParams(B, pb::LOOKS[iclamp(lb - 3, 0, pb::LOOK_COUNT - 1)].text); B.scale = sc; Bp = &B; }
  Motion m = readMotion(params, P_MO_BASE, P_MORPH);
  pb::PbMotion pm; pm.paintOn = fv(params, P_PM_PAINTON); pm.breathe = fv(params, P_PM_BREATHE); pm.breatheRate = fv(params, P_PM_BREATHER);
  Clock c = makeClock(in_data, m);
  OutImage out; Prog pr = { in_data };
  if (!pb::renderFrame(src, A, Bp, pm, m, c, out, progressCb, &pr)) return PF_Interrupt_CANCEL;
  writeWorld(out, output);
  return PF_Err_NONE;
}

extern "C" DllExport PF_Err PluginDataEntryFunction2(PF_PluginDataPtr inPtr, PF_PluginDataCB2 inPluginDataCallBackPtr,
    SPBasicSuite* inSPBasicSuitePtr, const char* inHostName, const char* inHostVersion) {
  PF_Err result = PF_Err_NONE;
  PF_REGISTER_EFFECT_EXT2(inPtr, inPluginDataCallBackPtr, "Frank's Paint Brew", "com.franks.paint.ae",
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
