import React from "react";
import { Save, Settings, User, HelpCircle, Upload, Scissors, Copy, Clipboard, Undo, Redo, Hash, Wand2, Search } from "lucide-react";

// ─── Theme (PictoBlox Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#5A2D82",  // PictoBlox header purple
    DARK_PURPLE: "#4A1D72",
    LIGHT_PURPLE: "#EDE9FE",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
};

export default function TopBar({ onBack, onSwitchToNotebook, showGuide, setShowGuide, mode, setMode }) {
    return (
        <header style={{
            height: 44, background: C.PURPLE, display: "flex",
            alignItems: "center", padding: "0 12px",
            justifyContent: "space-between", color: "#fff", zIndex: 100,
            flexShrink: 0,
        }}>
            {/* Left Side: Blocks/Python Tabs + Costumes/Sounds Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {/* Blocks/Python Mode Tabs */}
                <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: 6, overflow: "hidden", marginRight: 12 }}>
                    <div 
                        onClick={() => setMode && setMode("blocks")}
                        style={{ 
                            padding: "6px 14px", 
                            background: mode === "blocks" ? "rgba(255,255,255,0.2)" : "transparent", 
                            color: "#fff", 
                            fontSize: 12, 
                            fontWeight: 600, 
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}>
                        <span style={{ fontSize: 14 }}>🧩</span> Blocks
                    </div>
                    <div 
                        onClick={() => setMode && setMode("python")}
                        style={{ 
                            padding: "6px 14px", 
                            background: mode === "python" ? "rgba(255,255,255,0.2)" : "transparent", 
                            color: "#fff", 
                            fontSize: 12, 
                            fontWeight: 600, 
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}>
                        <span style={{ fontSize: 14 }}>🐍</span> Python
                    </div>
                </div>
                
                {/* Costumes/Sounds Tabs */}
                <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ 
                        padding: "6px 12px", 
                        background: "transparent", 
                        color: "rgba(255,255,255,0.8)", 
                        fontSize: 12, 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        borderRadius: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 14 }}>🎨</span> Costumes
                    </div>
                    <div style={{ 
                        padding: "6px 12px", 
                        background: "transparent", 
                        color: "rgba(255,255,255,0.8)", 
                        fontSize: 12, 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        borderRadius: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 14 }}>🔊</span> Sounds
                    </div>
                </div>
            </div>
            
            {/* Middle: Toolbar Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Scissors size={16} />
                </div>
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Copy size={16} />
                </div>
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Clipboard size={16} />
                </div>
                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)", margin: "0 4px" }} />
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Undo size={16} />
                </div>
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Redo size={16} />
                </div>
                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)", margin: "0 4px" }} />
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Hash size={16} />
                </div>
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Wand2 size={16} />
                </div>
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize: 14, fontWeight: "bold" }}>A+</span>
                </div>
                <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Search size={16} />
                </div>
            </div>
            
            {/* Right Side: Run/Stop + Upload Firmware */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Green Flag (Run) */}
                <div style={{ 
                    padding: "6px 10px", 
                    cursor: "pointer", 
                    borderRadius: 4, 
                    color: "#4CAF50",
                    fontSize: 18
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    ▶
                </div>
                {/* Red Circle (Stop) */}
                <div style={{ 
                    padding: "6px 10px", 
                    cursor: "pointer", 
                    borderRadius: 4, 
                    color: "#F44336",
                    fontSize: 18
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    ●
                </div>
                
                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)", margin: "0 4px" }} />
                
                {/* Upload Firmware Button */}
                <button 
                    style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 6, 
                        padding: "6px 12px", 
                        background: "rgba(255,255,255,0.2)", 
                        color: "#fff", 
                        border: "1px solid rgba(255,255,255,0.3)", 
                        borderRadius: 6, 
                        cursor: "pointer", 
                        fontSize: 12, 
                        fontWeight: 600 
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                >
                    <Upload size={14} /> Upload Firmware
                </button>
                
                {/* Camera, Window, Fullscreen icons */}
                <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                    <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        📷
                    </div>
                    <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        ⬜
                    </div>
                    <div style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, color: "rgba(255,255,255,0.8)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        ⛶
                    </div>
                </div>
            </div>
        </header>
    );
}
