/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect, useRef } from "react";
import { Home, Save, Settings, User, HelpCircle, Upload, Scissors, Copy, Clipboard, Undo, Redo, Hash, Wand2, Search, Menu as MenuIcon, Share, FolderOpen } from "lucide-react";
import Logo, { CreoleapLogo } from "../../components/Logo";
import LeapLabAuthButton from "../../../auth/LeapLabAuthButton";
import TopbarShareButton from "../../../components/common/TopbarShareButton";
import ProjectNameInput from "../../../components/common/ProjectNameInput";
import ModeSwitcher from "../../../components/common/ModeSwitcher";
import ActionButton from "../../../components/common/ActionButton";
import { useWindowWidth } from "../../../hooks/useWindowWidth";
import MobileDrawer from "../../../components/common/MobileDrawer";

// ─── Theme (LeapBlox Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#0a015a",  // Updated header color
    DARK_PURPLE: "#080a25",
    LIGHT_PURPLE: "#EDE9FE",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
};

export default function TopBar({ onBack, onSwitchToNotebook, showGuide, setShowGuide, mode, setMode, projectName = 'My Project', onProjectNameChange, onSave }) {
    const [showCreoleap, setShowCreoleap] = useState(window.innerWidth >= 1400);
    const windowWidth = useWindowWidth();
    const showDesktopMode = windowWidth >= 1400;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setShowCreoleap(window.innerWidth >= 1400);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleClickOutside = (e) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, [mobileMenuOpen]);



    return (
        <>
        <header style={{
            height: 68,
            background: 'linear-gradient(135deg, #0a0a1f 0%, #0a015a 55%, #080a25 100%)',
            display: "flex",
            alignItems: "center", padding: "0 28px",
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
                        width: 40,
                        height: 40,
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
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
                    <Home size={20} strokeWidth={2.2} />
                </button>

                <div style={{ height: 28, width: 1, background: 'rgba(255,255,255,0.15)', marginRight: 4 }} />

                {/* Logo + App Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, flexShrink: 0 }}>
                    <Logo height={48} />
                    <span style={{
                        color: '#fff',
                        fontSize: 22,
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        lineHeight: 1.2,
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        textShadow: '0 0 20px rgba(255,255,255,0.3)',
                        borderLeft: '1px solid rgba(255,255,255,0.15)',
                        paddingLeft: 8,
                    }}>Logix </span>
                </div>

                {showDesktopMode && (
                    <>
                        <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.15)', marginRight: 4 }} />
                        <ModeSwitcher
                            modes={[
                                { id: 'blocks', label: 'Blocks', icon: <span style={{ fontSize: 14 }}>🧩</span> },
                                { id: 'python', label: 'Python', icon: <span style={{ fontSize: 14 }}>🐍</span> },
                            ]}
                            activeMode={mode}
                            onChange={(id) => setMode && setMode(id)}
                        />
                    </>
                )}
            </div>

            {/* Center: Project Name */}
            <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center" }}>
                {onProjectNameChange && onSave ? (
                    <ProjectNameInput
                        value={projectName}
                        onChange={onProjectNameChange}
                        onSave={onSave}
                    />
                ) : null}
            </div>

            {/* Right Side: Run/Stop + Upload Firmware + CREOLEAP Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {showDesktopMode ? (
                    <>
                        <ActionButton
                            variant="success"
                            icon={<span style={{ fontSize: 14 }}>▶</span>}
                            label="Run"
                            onClick={() => {}}
                            title="Run Code"
                        />
                        <ActionButton
                            variant="danger"
                            icon={<span style={{ fontSize: 14 }}>●</span>}
                            label="Stop"
                            onClick={() => {}}
                            title="Stop"
                        />

                        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)", margin: "0 4px" }} />

                        <ActionButton
                            variant="primary"
                            icon={<Upload size={14} />}
                            label="Upload Firmware"
                            onClick={() => {}}
                        />

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
                    </>
                ) : (
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 40, height: 40, borderRadius: 10,
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff', cursor: 'pointer', flexShrink: 0,
                        }}
                    >
                        <MenuIcon size={20} strokeWidth={2.2} />
                    </button>
                )}
            </div>
        </header>

        <MobileDrawer
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            theme="dark"
        >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Mode</div>
            {[
                { id: 'blocks', label: 'Blocks', icon: '🧩' },
                { id: 'python', label: 'Python', icon: '🐍' },
            ].map(({ id, label, icon }) => (
                <button key={id} onClick={() => { setMode?.(id); setMobileMenuOpen(false); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 12px', border: 'none', borderRadius: 8,
                        background: mode === id ? 'rgba(167,139,250,0.2)' : 'transparent',
                        color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                    }}
                >
                    <span>{icon}</span>
                    <span>{label}</span>
                    {mode === id && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>Active</span>}
                </button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Actions</div>
            {[
                { label: '▶ Run', onClick: () => {} },
                { label: '● Stop', onClick: () => {} },
                { label: 'Upload Firmware', onClick: () => {} },
            ].map(({ label, onClick }) => (
                <button key={label} onClick={() => { onClick?.(); setMobileMenuOpen(false); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 12px', border: 'none', borderRadius: 8,
                        background: 'transparent', color: '#e0e0e0', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.25)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                >
                    {label}
                </button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Utilities</div>
            {['📷', '⬜', '⛶'].map((emoji, i) => (
                <button key={i}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 12px', border: 'none', borderRadius: 8,
                        background: 'transparent', color: '#e0e0e0', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.25)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                >
                    <span>{emoji}</span>
                </button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <TopbarShareButton size={20}>
                {({ onClick, loading }) => (
                    <button onClick={onClick} disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                            padding: '10px 12px', border: 'none', borderRadius: 8,
                            background: 'transparent', color: '#e0e0e0', fontSize: 13,
                            fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.25)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                    >
                        <Share size={15} color="#a78bfa" strokeWidth={2} />
                        Share
                    </button>
                )}
            </TopbarShareButton>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <LeapLabAuthButton variant="dark" size="sm" style={{ width: '100%', height: '34px', borderRadius: '20px', boxSizing: 'border-box' }} />
            </div>
        </MobileDrawer>
        </>
    );
}
