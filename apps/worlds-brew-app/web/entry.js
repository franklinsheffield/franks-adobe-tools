// Pixel Scape web build: entry. Sets up the browser host (window.require, file system), then starts the same app.js
// the desktop window runs.
import { start } from "./host.js";
await start();
await import("../renderer/app.js");
