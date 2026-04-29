/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import {
    Home, Upload, Scissors, Copy, Clipboard,
    Undo, Redo, Hash, Wand2, Search,
    Camera, Maximize2, Settings2,
    Play, Square,
} from "lucide-react";
import Logo, { CreoleapLogo } from "../../../leapembed/client/components/Logo";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG_START = "#0a015a";
const BG_END = "#080a25";
const DIVIDER = "rgba(255,255,255,0.15)";
const ICON_COLOR = "rgba(255,255,255,0.82)";
const BTN_HOVER = "rgba(255,255,255,0.12)";

// ─── Reusable icon button ─────────────────────────────────────────────────────
function IconBtn({ children, title, onClick, style = {} }) {
    const [hovered, setHovered] = React.useState(false);
    return (
        <button
            title={title}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                padding: 0,
                background: hovered ? BTN_HOVER : "transparent",
                border: "none",
                borderRadius: 6,
                color: ICON_COLOR,
                cursor: "pointer",
                transition: "background 0.15s",
                flexShrink: 0,
                ...style,
            }}
        >
            {children}
        </button>
    );
}

// ─── Vertical divider ─────────────────────────────────────────────────────────
function Divider() {
    return (
        <div style={{
            width: 1,
            height: 20,
            background: DIVIDER,
            margin: "0 4px",
            flexShrink: 0,
        }} />
    );
}

// ─── Nav text item (File, Edit, Board…) ───────────────────────────────────────
function NavItem({ label, onClick }) {
    const [hovered, setHovered] = React.useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? BTN_HOVER : "transparent",
                border: "none",
                color: "rgba(255,255,255,0.88)",
                fontSize: 13,
                fontWeight: 500,
                padding: "0 10px",
                height: 32,
                borderRadius: 6,
                cursor: "pointer",
                transition: "background 0.15s",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
            }}
        >
            {label}
        </button>
    );
}

// ─── Mode pill tab (Blocks / Python) ─────────────────────────────────────────
function ModeTab({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "0 14px",
                height: 30,
                background: active ? "rgba(255,255,255,0.18)" : "transparent",
                border: "none",
                borderRadius: 6,
                color: active ? "#fff" : "rgba(255,255,255,0.7)",
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </button>
    );
}

// ─── Main TopBar ──────────────────────────────────────────────────────────────
export default function TopBar({
    onBack,
    mode,
    setMode,
    projectName = "My Project",
    onRun,
    onStop,
    onUpload,
    isRunning,
}) {
    return (
        <header style={{
            height: 48,
            background: `linear-gradient(135deg, ${BG_START} 0%, ${BG_END} 100%)`,
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            gap: 0,
            justifyContent: "space-between",
            color: "#fff",
            zIndex: 100,
            flexShrink: 0,
            boxShadow: "0 2px 12px rgba(8,10,37,0.4)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
        }}>

            {/* ── LEFT: Home + Logo + CODEX + Nav ─────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>

                {/* Home button */}
                <IconBtn title="Back to Home" onClick={onBack}>
                    <Home size={17} strokeWidth={2.2} />
                </IconBtn>

                <Divider />

                {/* Logo + CODEX wordmark */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4, marginRight: 8 }}>
                    <Logo height={36} />
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        borderLeft: "1px solid rgba(255,255,255,0.15)",
                        paddingLeft: 8,
                        lineHeight: 1,
                    }}>
                        <span style={{
                            color: "#FFD500",
                            fontSize: 7.5,
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.2em",
                        }}>
                            LEAPLAB
                        </span>
                        <span style={{
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: 900,
                            letterSpacing: "0.1em",
                            textShadow: "0 0 16px rgba(255,255,255,0.25)",
                        }}>
                            CODEX
                        </span>
                    </div>
                </div>

                <Divider />

                {/* Nav items */}
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <NavItem label="File" />
                    <NavItem label="Edit" />

                    <NavItem label="Board" />
                    <NavItem label="Connect" />
                </div>

                <Divider />

                {/* Project name pill */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "0 10px",
                    height: 30,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "default",
                    flexShrink: 0,
                }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {projectName}
                </div>

                <Divider />

                {/* Mode tabs: IDE / Stage */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(0,0,0,0.25)",
                    borderRadius: 8,
                    padding: 2,
                    gap: 2,
                }}>
                    <ModeTab label="Mode" active={false} />
                    <ModeTab label="IDE" active={mode === "python"} onClick={() => setMode?.("python")} />
                    <ModeTab label="Stage" active={mode === "stage"} onClick={() => setMode?.("stage")} />
                </div>

                {/* Upload pill button */}
                <button
                    onClick={onUpload}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0 14px",
                        height: 30,
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        boxShadow: "0 2px 8px rgba(34,197,94,0.35)",
                        transition: "all 0.15s",
                        marginLeft: 4,
                        flexShrink: 0,
                        fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, #16a34a, #15803d)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, #22c55e, #16a34a)"; }}
                >
                    <Upload size={13} strokeWidth={2.5} />
                    Upload
                </button>
            </div>

            {/* ── MIDDLE: Edit toolbar icons ───────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <IconBtn title="Upload Code">
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <Upload size={13} />
                        <span style={{ fontSize: 8, color: ICON_COLOR, lineHeight: 1 }}>Upload</span>
                        <span style={{ fontSize: 8, color: ICON_COLOR, lineHeight: 1 }}>Code</span>
                    </div>
                </IconBtn>

                <Divider />

                <IconBtn title="Cut"><Scissors size={15} /></IconBtn>
                <IconBtn title="Copy"><Copy size={15} /></IconBtn>
                <IconBtn title="Paste"><Clipboard size={15} /></IconBtn>

                <Divider />

                <IconBtn title="Undo"><Undo size={15} /></IconBtn>
                <IconBtn title="Redo"><Redo size={15} /></IconBtn>

                <Divider />

                <IconBtn title="Line Numbers"><Hash size={15} /></IconBtn>
                <IconBtn title="Format Code"><Wand2 size={15} /></IconBtn>
                <IconBtn title="Font Size">
                    <span style={{ fontSize: 11, fontWeight: 700, color: ICON_COLOR }}>A+</span>
                </IconBtn>
                <IconBtn title="Search"><Search size={15} /></IconBtn>
            </div>

            {/* ── RIGHT: Run/Stop + Settings + CREOLEAP ───────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>

                {/* Run button */}
                <button
                    onClick={onRun}
                    title="Run"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0 14px",
                        height: 30,
                        background: isRunning
                            ? "rgba(74,222,128,0.15)"
                            : "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "#fff",
                        border: isRunning ? "1px solid #22c55e" : "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: isRunning ? "none" : "0 2px 8px rgba(34,197,94,0.3)",
                        transition: "all 0.15s",
                        fontFamily: "inherit",
                    }}
                >
                    <Play size={13} fill={isRunning ? "#22c55e" : "#fff"} strokeWidth={0} />
                    Run
                </button>

                {/* Stop button */}
                <button
                    onClick={onStop}
                    title="Stop"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0 14px",
                        height: 30,
                        background: isRunning
                            ? "linear-gradient(135deg, #ef4444, #dc2626)"
                            : "rgba(239,68,68,0.15)",
                        color: isRunning ? "#fff" : "#ef4444",
                        border: isRunning ? "none" : "1px solid rgba(239,68,68,0.4)",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: isRunning ? "0 2px 8px rgba(239,68,68,0.3)" : "none",
                        transition: "all 0.15s",
                        fontFamily: "inherit",
                    }}
                >
                    <Square size={11} fill={isRunning ? "#fff" : "#ef4444"} strokeWidth={0} />
                    Stop
                </button>

                <Divider />

                {/* Utility icons */}
                <IconBtn title="Camera"><Camera size={15} /></IconBtn>
                <IconBtn title="Fullscreen"><Maximize2 size={15} /></IconBtn>
                <IconBtn title="Settings"><Settings2 size={15} /></IconBtn>

                <Divider />

                {/* CREOLEAP logo */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                    opacity: 0.92,
                    filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.3))",
                }}>
                    <CreoleapLogo height={38} />
                </div>
            </div>
        </header>
    );
}
