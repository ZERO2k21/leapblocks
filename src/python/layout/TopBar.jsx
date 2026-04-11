import React from "react";
import { Home, Save, Settings, User, HelpCircle, Upload, Scissors, Copy, Clipboard, Undo, Redo, Hash, Wand2, Search } from "lucide-react";
import Logo, { CreoleapLogo } from "../../components/Logo";

// ─── Theme (PictoBlox Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#0a015a",  // Updated header color
    DARK_PURPLE: "#080a25",
    LIGHT_PURPLE: "#EDE9FE",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
};

export default function TopBar({ onBack, onSwitchToNotebook, showGuide, setShowGuide, mode, setMode }) {
    return (
        <header style={{
            height: 54,
            background: `linear-gradient(135deg, ${C.PURPLE} 0%, ${C.DARK_PURPLE} 100%)`,
            display: "flex",
            alignItems: "center", padding: "0 12px",
            justifyContent: "space-between", color: "#fff", zIndex: 100,
            flexShrink: 0,
            boxShadow: '0 2px 12px rgba(8,10,37,0.35)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
            {/* Left Side: LeapLab Logo + App Name + Blocks/Python Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Home Button */}
                <button
                    onClick={onBack}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        marginRight: 4
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Back to Home"
                >
                    <Home size={18} strokeWidth={2.2} />
                </button>

                <div style={{ height: 28, width: 1, background: 'rgba(255,255,255,0.15)', marginRight: 4 }} />

                {/* Logo + App Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, flexShrink: 0 }}>
                    <Logo height={43} />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        borderLeft: '1px solid rgba(255,255,255,0.15)',
                        paddingLeft: 8,
                    }}>
                        <span style={{
                            color: '#FFD500',
                            fontSize: 8,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.18em',
                            lineHeight: 1.1,
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        }}>LEAPLAB</span>
                        <span style={{
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            lineHeight: 1.2,
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                            textShadow: '0 0 20px rgba(255,255,255,0.3)',
                        }}>CODEX </span>
                    </div>
                </div>
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

            {/* Right Side: Run/Stop + Upload Firmware + CREOLEAP Logo */}
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

                {/* CREOLEAP Right Logo */}
                <div style={{
                    marginLeft: 12,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
                }}>
                    <CreoleapLogo height={150} />
                </div>
            </div>
        </header>
    );
}
