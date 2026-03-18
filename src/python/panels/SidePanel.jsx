import React from "react";
import { Plus, FileText, Package } from "lucide-react";

const C = {
    PURPLE: "#8B5CF6",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
};

export default function SidePanel({
    projectFiles,
    activeFile,
    setActiveFile,
    handleAddFile,
}) {
    return (
        <div style={{ width: 220, background: "#fff", borderRight: `1px solid ${C.BORDER}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "10px 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.BORDER}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>Project Files</span>
                <button
                    onClick={handleAddFile}
                    title="New File"
                    style={{ cursor: "pointer", color: C.MUTED, padding: 2, borderRadius: 4, border: "none", background: "transparent" }}
                >
                    <Plus size={14} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
                {Object.keys(projectFiles).map((file) => (
                    <div
                        key={file}
                        onClick={() => setActiveFile(file)}
                        style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            background: activeFile === file ? "#E8F5E9" : "transparent",
                            color: activeFile === file ? "#2E7D32" : C.TEXT,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            borderLeft: activeFile === file ? "3px solid #4CAF50" : "3px solid transparent",
                        }}
                    >
                        <div style={{ width: 18, height: 18, background: "#E8F5E9", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FileText size={12} style={{ color: "#4CAF50" }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: activeFile === file ? 600 : 400 }}>{file}</span>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: `1px solid ${C.BORDER}`, padding: "10px 12px 6px", background: "#FAFAFA" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.MUTED, letterSpacing: "0.05em" }}>MODULES/LIBRARIES</span>
            </div>
            <div style={{ padding: "8px 12px 12px", background: "#FAFAFA", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, background: "#fff", border: `1px solid ${C.BORDER}` }}>
                    <Package size={14} style={{ color: C.PURPLE }} />
                    <span style={{ fontSize: 12, color: C.TEXT }}>Sprite</span>
                </div>
            </div>
        </div>
    );
}
