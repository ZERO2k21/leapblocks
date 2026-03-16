import React from "react";
import { Undo, Redo, Trash2, Play, Square } from "lucide-react";

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

export default function ToolBar({ isRunning, onRun, onStop }) {
    return (
        <div style={{
            height: 40, background: "#fff", display: "flex",
            alignItems: "center", padding: "0 16px",
            justifyContent: "space-between", borderBottom: `1px solid ${C.BORDER}`,
            flexShrink: 0,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Blocks/Python tabs */}
                <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ padding: "6px 16px", background: "#f0f0f0", color: C.MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Blocks</div>
                    <div style={{ padding: "6px 16px", background: C.PURPLE, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Python</div>
                </div>
                <div style={{ width: 1, height: 20, background: C.BORDER }} />
                {/* Costumes/Sounds tabs */}
                <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ padding: "6px 16px", background: C.PURPLE, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Costumes</div>
                    <div style={{ padding: "6px 16px", background: "#f0f0f0", color: C.MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sounds</div>
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Editing tools */}
                <div style={{ display: "flex", gap: 4 }}>
                    <div title="Undo (Ctrl+Z)" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                        <Undo size={16} />
                    </div>
                    <div title="Redo (Ctrl+Y)" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                        <Redo size={16} />
                    </div>
                    <div title="Copy (Ctrl+C)" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                        <span style={{ fontSize: 14 }}>📋</span>
                    </div>
                    <div title="Paste (Ctrl+V)" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                        <span style={{ fontSize: 14 }}>📄</span>
                    </div>
                    <div title="Delete" style={{ cursor: "pointer", padding: "4px 6px", color: C.MUTED, borderRadius: 4 }}>
                        <Trash2 size={16} />
                    </div>
                </div>
                <div style={{ width: 1, height: 20, background: C.BORDER }} />
                {/* Quick Run Button */}
                <div onClick={onRun} title="Run Code (Ctrl+Enter or F5)"
                    className="run-button"
                    style={{
                        cursor: isRunning ? "not-allowed" : "pointer",
                        padding: "6px 16px",
                        background: isRunning ? "#9CA3AF" : C.GREEN,
                        color: "#fff",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: isRunning ? "none" : "0 2px 4px rgba(16, 185, 129, 0.3)",
                        transition: "all 0.2s",
                        opacity: isRunning ? 0.7 : 1,
                    }}>
                    {isRunning ? (
                        <>
                            <span style={{ animation: "spin 1s linear infinite" }}>⚙</span>
                            <span>Running...</span>
                        </>
                    ) : (
                        <>
                            <Play size={14} fill="#fff" />
                            <span>Run</span>
                        </>
                    )}
                </div>
                <div onClick={onStop} title="Stop (Escape)"
                    className="stop-button"
                    style={{
                        cursor: "pointer",
                        padding: "6px 12px",
                        background: "#fff",
                        color: C.RED,
                        border: `1px solid ${C.RED}`,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        transition: "all 0.2s",
                    }}>
                    <Square size={12} fill={C.RED} />
                    <span>Stop</span>
                </div>
            </div>
        </div>
    );
}
