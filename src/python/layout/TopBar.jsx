import React from "react";
import { Save, Bell, Settings, User, BookOpen, HelpCircle } from "lucide-react";

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

export default function TopBar({ onBack, onSwitchToNotebook, showGuide, setShowGuide }) {
    return (
        <header style={{
            height: 48, background: C.PURPLE, display: "flex",
            alignItems: "center", padding: "0 16px",
            justifyContent: "space-between", color: "#fff", zIndex: 100,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            flexShrink: 0,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} onClick={onBack}>
                    <span style={{ fontSize: 20, fontWeight: "bold" }}>Leapblocks</span>
                </div>
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.3)" }} />
                {["File", "Edit", "Tutorials", "Board", "Connect"].map(m => (
                    <span key={m} style={{ fontSize: 13, cursor: "pointer", opacity: 0.85, letterSpacing: "0.01em" }}
                        onMouseEnter={e => e.target.style.opacity = 1}
                        onMouseLeave={e => e.target.style.opacity = 0.85}
                    >{m}</span>
                ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Project name */}
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "4px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <input defaultValue="My Project" style={{ background: "transparent", border: "none", color: "#fff", width: 100, outline: "none", fontSize: 13 }} />
                    <Save size={14} style={{ opacity: 0.8 }} />
                </div>
                {/* Mode buttons */}
                <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ padding: "6px 12px", background: C.PURPLE, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mode</div>
                    <div style={{ padding: "6px 12px", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Stage</div>
                    <div style={{ padding: "6px 12px", background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Upload</div>
                </div>
                {/* Switch to Notebook button */}
                <button onClick={onSwitchToNotebook}
                    title="Switch to Python Notebook"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}
                    onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.35)"}
                    onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.2)"}
                >
                    <BookOpen size={14} /> Notebook
                </button>
                <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.3)" }} />
                <button onClick={() => setShowGuide(g => !g)}
                    title="Help & Guide"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: showGuide ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    <HelpCircle size={14} /> Guide
                </button>
                <Bell size={18} style={{ cursor: "pointer", opacity: 0.8 }} />
                <Settings size={18} style={{ cursor: "pointer", opacity: 0.8 }} />
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={16} />
                </div>
            </div>
        </header>
    );
}
