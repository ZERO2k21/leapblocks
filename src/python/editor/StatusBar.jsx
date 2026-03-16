import React from "react";

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

export default function StatusBar({ editorCursor, isRunning, activeFile }) {
    return (
        <div style={{ height: 22, background: C.DARK_PURPLE, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 11, color: "rgba(255,255,255,0.85)", gap: 16, flexShrink: 0 }}>
            <span>Python 3</span>
            <span>Ln {editorCursor.line}, Col {editorCursor.col}</span>
            <span>{isRunning ? "● Running" : "○ Ready"}</span>
            <span style={{ marginLeft: "auto" }}>{activeFile}</span>
        </div>
    );
}
