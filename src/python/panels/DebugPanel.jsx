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

export default function DebugPanel({ debugLine, debugVars }) {
    return (
        <>
            <div style={{ padding: "10px 12px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.08em" }}>DEBUGGER</span>
            </div>
            <div style={{ padding: "0 12px", flex: 1, overflowY: "auto" }}>
                {debugLine && (
                    <div style={{ padding: "6px 10px", background: "#FFF3E0", borderRadius: 6, marginBottom: 8, fontSize: 12, border: "1px solid #FFB74D" }}>
                        ⚡ Paused at line {debugLine}
                    </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, marginBottom: 6 }}>VARIABLES</div>
                {debugVars.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.MUTED, fontStyle: "italic" }}>Run code to watch variables</div>
                ) : (
                    debugVars.map((v, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.BORDER}`, fontSize: 12 }}>
                            <span style={{ color: C.BLUE, fontFamily: "monospace" }}>{v.name}</span>
                            <span style={{ color: C.ORANGE, fontFamily: "monospace" }}>{v.value}</span>
                        </div>
                    ))
                )}
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, marginBottom: 6 }}>CALL STACK</div>
                    <div style={{ fontSize: 12, color: C.MUTED, fontStyle: "italic" }}>No active debug session</div>
                </div>
            </div>
        </>
    );
}
