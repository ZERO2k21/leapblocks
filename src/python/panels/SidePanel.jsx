import React from "react";
import { Plus, RefreshCw, Download, Eye, EyeOff } from "lucide-react";
import FileExplorer from "./FileExplorer";
import SpritePanel from "./SpritePanel";
import BackdropPanel from "./BackdropPanel";
import ExtensionsPanel from "./ExtensionsPanel";
import PipPanel from "./PipPanel";
import DebugPanel from "./DebugPanel";

// ─── Theme (Leapblocks Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#8B5CF6",
    DARK_PURPLE: "#7C3AED",
    LIGHT_PURPLE: "#EDE9FE",
    PURPLE_BG: "#F5F3FF",
    BORDER: "#E5E7EB",
    BG: "#F9FAFB",
    BG2: "#F3F4F6",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
    GREEN: "#10B981",
    RED: "#EF4444",
    BLUE: "#3B82F6",
    ORANGE: "#F59E0B",
    ACCENT: "#8B5CF6",
    HEADER_BG: "#8B5CF6",
};

export default function SidePanel({ 
    sidePanel, 
    projectFiles, 
    activeFile, 
    setActiveFile, 
    handleAddFile, 
    handleDeleteFile,
    spriteFilter,
    setSpriteFilter,
    addSpriteFromLibrary,
    SPRITE_LIBRARY,
    BACKDROP_LIBRARY,
    backdrop,
    handleSetBackdrop,
    EXTENSIONS,
    installedExtensions,
    installExtension,
    packages,
    pipFilter,
    setPipFilter,
    handleInstall,
    debugLine,
    debugVars
}) {
    return (
        <div style={{ width: 200, background: "#fff", borderRight: `1px solid ${C.BORDER}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {sidePanel === "files" && (
                <FileExplorer 
                    projectFiles={projectFiles}
                    activeFile={activeFile}
                    setActiveFile={setActiveFile}
                    handleAddFile={handleAddFile}
                    handleDeleteFile={handleDeleteFile}
                />
            )}

            {sidePanel === "sprites" && (
                <SpritePanel 
                    spriteFilter={spriteFilter}
                    setSpriteFilter={setSpriteFilter}
                    addSpriteFromLibrary={addSpriteFromLibrary}
                    SPRITE_LIBRARY={SPRITE_LIBRARY}
                />
            )}

            {sidePanel === "backdrops" && (
                <BackdropPanel 
                    BACKDROP_LIBRARY={BACKDROP_LIBRARY}
                    backdrop={backdrop}
                    handleSetBackdrop={handleSetBackdrop}
                />
            )}

            {sidePanel === "extensions" && (
                <ExtensionsPanel 
                    EXTENSIONS={EXTENSIONS}
                    installedExtensions={installedExtensions}
                    installExtension={installExtension}
                />
            )}

            {sidePanel === "packages" && (
                <PipPanel 
                    packages={packages}
                    pipFilter={pipFilter}
                    setPipFilter={setPipFilter}
                    handleInstall={handleInstall}
                />
            )}

            {sidePanel === "debug" && (
                <DebugPanel 
                    debugLine={debugLine}
                    debugVars={debugVars}
                />
            )}

            {sidePanel === "search" && (
                <>
                    <div style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.08em" }}>QUICK SNIPPETS</span>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
                        {[
                            { name: "Hello World", icon: "👋", code: 'print("Hello, World!")' },
                            { name: "Create Sprite", icon: "🤖", code: 'sprite = Sprite("Robot")\nsprite.say("Hi!")' },
                            { name: "Move Sprite", icon: "➡️", code: 'sprite.move(50)\nsprite.turn_right()' },
                            { name: "For Loop", icon: "🔄", code: 'for i in range(5):\n    print(i)' },
                            { name: "While Loop", icon: "🔁", code: 'count = 0\nwhile count < 5:\n    print(count)\n    count += 1' },
                            { name: "Function", icon: "📦", code: 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))' },
                            { name: "List", icon: "📋", code: 'fruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(fruit)' },
                            { name: "If Statement", icon: "❓", code: 'x = 10\nif x > 5:\n    print("x is greater than 5")\nelse:\n    print("x is 5 or less")' },
                            { name: "Input", icon: "⌨️", code: 'name = input("What is your name? ")\nprint(f"Hello, {name}!")' },
                            { name: "Animation", icon: "🎬", code: 'sprite = Sprite("Robot")\nfor i in range(10):\n    sprite.move(10)\n    sprite.turn_right()\n    sprite.say(f"Step {i+1}")' },
                        ].map((snippet, i) => (
                            <div key={i}
                                onClick={() => {
                                    const currentCode = projectFiles[activeFile] || "";
                                    // This would need to be passed down as a prop
                                    // For now, we'll just log it
                                    console.log(`Insert snippet: ${snippet.name}`);
                                }}
                                style={{
                                    padding: "8px 10px",
                                    marginBottom: 4,
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    background: "#F5F5F5",
                                    border: "1px solid transparent",
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = C.LIGHT_PURPLE;
                                    e.currentTarget.style.borderColor = C.PURPLE;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = "#F5F5F5";
                                    e.currentTarget.style.borderColor = "transparent";
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>{snippet.icon}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: C.TEXT }}>{snippet.name}</span>
                                </div>
                                <div style={{
                                    marginTop: 4,
                                    fontSize: 10,
                                    fontFamily: "monospace",
                                    color: C.MUTED,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}>
                                    {snippet.code.split("\n")[0]}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
