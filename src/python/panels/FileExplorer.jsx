import React from "react";
import { Plus, RefreshCw, FileText } from "lucide-react";

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

export default function FileExplorer({ projectFiles, activeFile, setActiveFile, handleAddFile, handleDeleteFile }) {
    return (
        <>
            <div style={{ padding: "10px 12px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>Project Files</span>
                <div style={{ display: "flex", gap: 4 }}>
                    <div onClick={handleAddFile} title="New File" style={{ cursor: "pointer", color: C.MUTED, padding: 2, borderRadius: 4 }}>
                        <Plus size={14} />
                    </div>
                    <div title="Refresh" style={{ cursor: "pointer", color: C.MUTED, padding: 2, borderRadius: 4 }}>
                        <RefreshCw size={14} />
                    </div>
                </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
                {Object.keys(projectFiles).map(file => (
                    <div key={file}
                        onClick={() => setActiveFile(file)}
                        style={{
                            padding: "6px 12px", fontSize: 13, cursor: "pointer",
                            background: activeFile === file ? C.LIGHT_PURPLE : "transparent",
                            color: activeFile === file ? C.PURPLE : C.TEXT,
                            display: "flex", alignItems: "center", gap: 8,
                            transition: "background 0.15s",
                            borderLeft: activeFile === file ? `3px solid ${C.PURPLE}` : "3px solid transparent",
                        }}
                        onMouseEnter={e => { if (activeFile !== file) e.currentTarget.style.background = "#F5F5F5"; }}
                        onMouseLeave={e => { if (activeFile !== file) e.currentTarget.style.background = "transparent"; }}
                    >
                        <div style={{ width: 16, height: 16, background: "#E8F5E9", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileText size={10} style={{ color: "#2E7D32" }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: activeFile === file ? 600 : 400 }}>{file}</span>
                    </div>
                ))}
            </div>
            
            {/* Modules/Libraries Section */}
            <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "10px 12px 6px" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>Modules/Libraries</span>
            </div>
            <div style={{ padding: "0 12px 12px" }}>
                <div style={{ 
                    padding: "6px 8px", fontSize: 12, cursor: "pointer",
                    background: "#F5F5F5", borderRadius: 6,
                    display: "flex", alignItems: "center", gap: 8,
                }}>
                    <div style={{ width: 16, height: 16, background: "#E3F2FD", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10 }}>📦</span>
                    </div>
                    <span>Sprite</span>
                </div>
            </div>
        </>
    );
}
