// House 1: the Oracle's Chamber. The Oracle is the engine's default host: every reading system, every room,
// the personalities and lines already in main.js / personas.js / banter.js, and the turntable record player.
import { turntableSvg } from "../player.js";

export const oracle = {
  id: "oracle", name: "The Oracle", house: "The Oracle Chamber", emoji: "🔮", accent: "#FF4FB3",
  channelIds: ["1575683489712439467"], // #🔮-oracle (also the fallback for any channel without a House)
  readings: true, rooms: "all",
  player: { name: "The Record Player", deck: turntableSvg },
};
