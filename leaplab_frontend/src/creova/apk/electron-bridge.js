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

// src/creova/apk/electron-bridge.ts
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
async function buildApk(appState, appRoot, onLog) {
  try {
    console.log("[ELECTRON-BRIDGE] ==================== BRIDGE STARTED ====================");
    console.log("[ELECTRON-BRIDGE] appRoot:", appRoot);
    console.log("[ELECTRON-BRIDGE] appState keys:", appState ? Object.keys(appState) : "null");
    console.log("[ELECTRON-BRIDGE] appState.appName:", appState?.appName);
    console.log("[ELECTRON-BRIDGE] appState.packageName:", appState?.packageName);
    console.log("[ELECTRON-BRIDGE] appState.screens:", appState?.screens?.length, "| media:", appState?.media?.length);
    console.log("[ELECTRON-BRIDGE] appState.media:", {
      type: typeof appState?.media,
      isArray: Array.isArray(appState?.media),
      length: appState?.media?.length ?? "undefined/null"
    });
    if (appState?.media?.length) {
      for (let i = 0; i < appState.media.length; i++) {
        const item = appState.media[i];
        const dataStr = item.data ? String(item.data) : "";
        console.log(`[ELECTRON-BRIDGE] media[${i}]: filename="${item.filename}" type="${item.type || "?"}" hasData=${!!item.data} dataLen=${dataStr.length} dataPrefix=${dataStr.substring(0, 40)}`);
      }
    }
    onLog("[BRIDGE] Initializing build process...");
    const candidates = [
      import_path.default.join(appRoot, "src", "creova", "apk", "buildAPK.js"),
      import_path.default.join(appRoot, "src", "creova", "apk", "buildAPK.ts")
    ];
    const resolvedBuilder = candidates.find((p) => import_fs.default.existsSync(p));
    if (!resolvedBuilder) {
      throw new Error(`APK builder module not found. Checked:
${candidates.join("\n")}`);
    }
    console.log("[ELECTRON-BRIDGE] Resolved builder path:", resolvedBuilder);
    const Builder = require(resolvedBuilder);
    const builder = new Builder();
    console.log("[ELECTRON-BRIDGE] Builder instance created");
    onLog("[BRIDGE] Starting APK injection build...");
    const outputPath = await builder.build(appState, ({ stage, progress, message }) => {
      const logMsg = `[${progress}%] ${message}`;
      console.log(`[ELECTRON-BRIDGE] Progress: ${logMsg}`);
      onLog(logMsg);
    });
    console.log("[ELECTRON-BRIDGE] APK built successfully at:", outputPath);
    onLog(`[BRIDGE] APK built successfully: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("[ELECTRON-BRIDGE] Build failed:", error);
    console.error("[ELECTRON-BRIDGE] Error stack:", error.stack);
    onLog("[BRIDGE] Build failed: " + error.message);
    throw error;
  }
}
module.exports = buildApk;
