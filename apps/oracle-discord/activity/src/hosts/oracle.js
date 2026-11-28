// House 1: the Oracle's Chamber. The Oracle is the engine's default host: every reading system, every room,
// the personalities and lines already in main.js / personas.js / banter.js, and the turntable record player.
import { turntableSvg } from "../player.js";

export const oracle = {
  id: "oracle", name: "The Oracle", house: "The Oracle Chamber", emoji: "🔮", accent: "#FF4FB3",
  channelIds: ["1575683489712439467", "1576066679820124261", "1576066681636388954", "1534951390969987253"], // #🔮-oracle (also the fallback for any channel without a House); then its Wing (Frank 2026-11-28): #🔮-oracle-common, Oracle Wing Voice, #🧪-spiritual. The game channel stays first (Play cards post there)
  readings: true, rooms: "all",
  player: { name: "The Record Player", deck: turntableSvg },
  token: { id: "moon", emoji: "🌙", name: "moon token", plural: "moon tokens", purse: "Moon purse" }, // spent on Moon relics (moonrelics.js)
  strayIntro: "Something rolled out of my crystal ball:",
};
