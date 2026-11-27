// Pixel Scape web build: entry. Sets up the browser host (window.require, file system), then starts the same app.js
// the desktop window runs. In a Discord call (or with ?room= for local tests) it then joins the call's shared room.
// extras.js adds the start screen, Explore mode, pings, auto quality and the first-time tips (add ?nostart to skip
// the start screen and tips, as the automated tests do).
import { start } from "./host.js";
import { wantsRoom, startMulti } from "./multi.js";
import { startPhone } from "./phone.js";
import { startExtras } from "./extras.js";
await start();
await import("../renderer/app.js");
const phone = startPhone();
if (wantsRoom()) startMulti().catch((e) => console.error("[multi]", e));
startExtras(phone).catch((e) => console.error("[extras]", e));
