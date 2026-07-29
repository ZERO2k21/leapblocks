"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/creova/apk/build-worker.ts
var import_path = __toESM(require("path"));
process.on("message", async (msg) => {
  if (msg.type !== "build") return;
  console.log("[BUILD-WORKER] ==================== WORKER STARTED ====================");
  console.log("[BUILD-WORKER] appRoot:", msg.appRoot);
  console.log("[BUILD-WORKER] appState.appName:", msg.appState?.appName);
  console.log("[BUILD-WORKER] appState.packageName:", msg.appState?.packageName);
  console.log("[BUILD-WORKER] appState.screens:", msg.appState?.screens?.length);
  console.log("[BUILD-WORKER] msg.appState.media:", {
    type: typeof msg.appState?.media,
    isArray: Array.isArray(msg.appState?.media),
    length: msg.appState?.media?.length ?? "undefined/null"
  });
  if (Array.isArray(msg.appState?.media) && msg.appState.media.length > 0) {
    for (let i = 0; i < msg.appState.media.length; i++) {
      const item = msg.appState.media[i];
      const dataStr = item.data ? String(item.data) : "";
      console.log(`[BUILD-WORKER] media[${i}]: filename="${item.filename}" type="${item.type || "?"}" hasData=${!!item.data} dataLen=${dataStr.length} dataPrefix=${dataStr.substring(0, 40)}`);
    }
  } else {
    console.log("[BUILD-WORKER] No media items");
  }
  try {
    const bridgePath = import_path.default.join(
      msg.appRoot,
      "src",
      "creova",
      "apk",
      "electron-bridge.js"
    );
    console.log("[BUILD-WORKER] Bridge path:", bridgePath);
    const buildApk = require(bridgePath);
    const outputPath = await buildApk(msg.appState, msg.appRoot, (logMsg) => {
      console.log("[BUILD-WORKER] Log:", logMsg);
      process.send({ type: "log", message: logMsg });
    });
    console.log("[BUILD-WORKER] Build complete, output:", outputPath);
    process.send({ type: "done", outputPath });
  } catch (err) {
    console.error("[BUILD-WORKER] Build error:", err);
    process.send({ type: "error", message: err.message || String(err) });
  }
});
