/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { FileText, Sprout, Image, Package, Download, Upload, Plus } from "lucide-react";

const C = {
    PURPLE: "#8B5CF6",
    DARK_BG: "#1e1b4b",
    DARKER_BG: "#16133d",
    MUTED: "#c4b5fd",      // brighter — was #9CA3AF (too dim on dark bg)
    ACTIVE: "#a78bfa",
};

const ACTIVITY_ITEMS = [
    { id: "files", icon: FileText, label: "Files" },
    { id: "sprites", icon: Sprout, label: "Sprites" },
    { id: "backdrops", icon: Image, label: "Backdrops" },
    { id: "extensions", icon: Package, label: "Extensions" },
    { id: "pip", icon: Download, label: "Packages" },
];

export default function ActivityBar({
    sidePanel,
    setSidePanel,
    onCSVUpload,
    onTextUpload,
    onImageUpload,
    onVideoUpload,
    onAudioUpload,
    onPythonUpload,
}) {
    const [showUploadMenu, setShowUploadMenu] = React.useState(false);
    const uploadAreaRef = React.useRef(null);

    React.useEffect(() => {
        const handlePointerDown = (event) => {
            if (!uploadAreaRef.current?.contains(event.target)) {
                setShowUploadMenu(false);
            }
        };

        window.addEventListener("mousedown", handlePointerDown);
        return () => window.removeEventListener("mousedown", handlePointerDown);
    }, []);

    const uploadItems = [
        { id: "csv", badge: "CSV", label: "Upload CSV", onClick: onCSVUpload },
        { id: "txt", badge: "TXT", label: "Upload Text", onClick: onTextUpload },
        { id: "photo", badge: "IMG", label: "Upload Photo", onClick: onImageUpload },
        { id: "video", badge: "VID", label: "Upload Video", onClick: onVideoUpload },
        { id: "audio", badge: "AUD", label: "Upload Audio", onClick: onAudioUpload },
        { id: "python", badge: "PY", label: "Upload Python", onClick: onPythonUpload },
    ];

    return (
        <div
            style={{
                width: 48,
                background: C.DARK_BG,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 8,
                flexShrink: 0,
                borderRight: `1px solid ${C.DARKER_BG}`,
                position: "relative",
                overflow: "visible",
            }}
        >
            {ACTIVITY_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = sidePanel === item.id;

                return (
                    <div
                        key={item.id}
                        onClick={() => setSidePanel(isActive ? null : item.id)}
                        title={item.label}
                        style={{
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            marginBottom: 4,
                            borderRadius: 8,
                            background: isActive
                                ? "rgba(139, 92, 246, 0.35)"
                                : "rgba(255,255,255,0.04)",
                            borderLeft: isActive
                                ? `3px solid ${C.PURPLE}`
                                : "3px solid transparent",
                            transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                        }}
                        onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        }}
                    >
                        <Icon
                            size={20}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            style={{ color: isActive ? "#fff" : C.MUTED }}
                        />
                    </div>
                );
            })}

            <div style={{ flex: 1 }} />

            <div
                ref={uploadAreaRef}
                style={{
                    position: "relative",
                    paddingBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {showUploadMenu && (
                    <div
                        style={{
                            position: "absolute",
                            left: 12,
                            bottom: 72,
                            width: 184,
                            background: "rgba(24, 24, 40, 0.96)",
                            border: "1px solid rgba(167, 139, 250, 0.24)",
                            borderRadius: 16,
                            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.28)",
                            padding: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            zIndex: 30,
                            backdropFilter: "blur(14px)",
                        }}
                    >
                        {uploadItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setShowUploadMenu(false);
                                    item.onClick?.();
                                }}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    border: "none",
                                    background: "rgba(255, 255, 255, 0.04)",
                                    color: "#F5F3FF",
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                <span
                                    style={{
                                        minWidth: 34,
                                        padding: "3px 6px",
                                        borderRadius: 999,
                                        background: "rgba(139, 92, 246, 0.22)",
                                        color: "#C4B5FD",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        fontFamily: "monospace",
                                        textAlign: "center",
                                    }}
                                >
                                    {item.badge}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => setShowUploadMenu((prev) => !prev)}
                    title="Upload Files"
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        border: "3px solid rgba(255,255,255,0.75)",
                        background: "linear-gradient(180deg, #FF3B7A 0%, #E11D48 100%)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        boxShadow: "0 12px 28px rgba(225, 29, 72, 0.35)",
                    }}
                >
                    <Upload size={18} style={{ color: "#fff" }} />
                    <span
                        style={{
                            position: "absolute",
                            top: -3,
                            right: -3,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#fff",
                            color: "#E11D48",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.2)",
                        }}
                    >
                        <Plus size={11} />
                    </span>
                </button>
            </div>
        </div>
    );
}
