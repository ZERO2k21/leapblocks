/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { FileText } from "lucide-react";

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

export default function FileTabs({ projectFiles, activeFile, setActiveFile }) {
    return (
        <div style={{ display: "flex", background: "#EFEFEF", borderBottom: `1px solid ${C.BORDER}`, overflowX: "auto", flexShrink: 0, height: 36 }}>
            {Object.keys(projectFiles).map(file => (
                <div key={file}
                    onClick={() => setActiveFile(file)}
                    style={{
                        padding: "0 16px", height: "100%", display: "flex", alignItems: "center", gap: 8,
                        cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
                        background: activeFile === file ? "#fff" : "transparent",
                        color: activeFile === file ? C.PURPLE : C.MUTED,
                        borderBottom: activeFile === file ? `2px solid ${C.PURPLE}` : "2px solid transparent",
                        borderRight: `1px solid ${C.BORDER}`,
                        fontWeight: activeFile === file ? 600 : 400,
                    }}
                >
                    <FileText size={12} />
                    {file}
                </div>
            ))}
        </div>
    );
}
