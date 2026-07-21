/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from "react";
import { Home, Save, Settings, User, HelpCircle, Upload, Scissors, Copy, Clipboard, Undo, Redo, Hash, Wand2, Search } from "lucide-react";
import Logo, { CreoleapLogo } from "../../components/Logo";
import LeapLabAuthButton from "../../../auth/LeapLabAuthButton";
import TopbarShareButton from "../../../components/common/TopbarShareButton";

// ─── Theme (LeapBlox Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#0a015a",  // Updated header color
    DARK_PURPLE: "#080a25",
    LIGHT_PURPLE: "#EDE9FE",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
};

export default function TopBar({ onBack, onSwitchToNotebook, showGuide, setShowGuide, mode, setMode }) {
    const [showCreoleap, setShowCreoleap] = useState(window.innerWidth >= 1400);

    useEffect(() => {
        const handleResize = () => setShowCreoleap(window.innerWidth >= 1400);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header style={{
            height: 56,
            background: 'linear-gradient(135deg, #0a0a1f 0%, #0a015a 55%, #080a25 100%)',
            display: "flex",
            alignItems: "center", padding: "0 12px",
            justifyContent: "space-between", color: "#fff", zIndex: 100,
            flexShrink: 0,
            boxShadow: '0 4px 20px rgba(8,10,37,0.5), inset 0 -1px 0 rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(100,180,255,0.08)',
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
                    <Logo height={48} />
                    <span style={{
                        color: '#fff',
                        fontSize: 20,
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        lineHeight: 1.2,
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        textShadow: '0 0 20px rgba(255,255,255,0.3)',
                        borderLeft: '1px solid rgba(255,255,255,0.15)',
                        paddingLeft: 8,
                    }}>Logix </span>
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
            <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
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


                <TopbarShareButton
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '6px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: '0.2s' }}
                    size={18}
                />

                <LeapLabAuthButton variant="dark" size="sm" style={{ height: '32px', borderRadius: '4px', boxSizing: 'border-box' }} />

                {showCreoleap && (
                    <div style={{
                        marginLeft: 12,
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        height: '40px',
                        overflow: 'hidden',
                        filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
                    }}>
                        <img
                            src="assets/logo-creoleap.png"
                            alt="CREOLEAP"
                            style={{
                                width: '145px',
                                height: 'auto',
                                objectFit: 'contain',
                                display: 'block',
                                flexShrink: 0,
                                filter: 'brightness(1.2) contrast(1.06)',
                            }}
                        />
                    </div>
                )}
            </div>
        </header>
    );
}
