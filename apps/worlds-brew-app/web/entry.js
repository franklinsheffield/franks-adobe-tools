// Pixel Scape web build: entry. Sets up the browser host (window.require, file system), then starts the same app.js
// the desktop window runs. In a Discord call (or with ?room= for local tests) it then joins the call's shared room.
import { start } from "./host.js";
import { wantsRoom, startMulti } from "./multi.js";
import { startPhone } from "./phone.js";
await start();
await import("../renderer/app.js");
startPhone();
if (wantsRoom()) startMulti().catch((e) => console.error("[multi]", e));
